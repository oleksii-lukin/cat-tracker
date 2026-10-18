import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { QuantityStepper } from '@/components/quantity-stepper';
import { TimePill, type DateTimeValue } from '@/components/time-pill';
import { ACTION_META } from '@/constants/design';
import { savePhotoAsset } from '@/db/repositories';
import type {
  DayEvent,
  EventType,
  Feed,
  PeeVolume,
  StoolQuality,
} from '@/types/domain';
import { pickPhoto } from '@/utils/photo-picker';

interface Props {
  event: DayEvent;
  feeds: Feed[];
  catColor: string;
  onSave: (patch: Partial<DayEvent> & { photoUri?: string | null }) => void;
  onDelete: () => void;
  onClose: () => void;
}

const STOOL_OPTIONS: StoolQuality[] = ['normal', 'hard', 'liquid', 'unusual'];
const PEE_OPTIONS: PeeVolume[] = ['low', 'normal', 'high'];
const SPOON_QUICK = [0.5, 1, 1.5, 2, 3];
const GRAM_QUICK = [4, 6, 10, 15, 20, 30, 35];
const MEALS_QUICK = [1, 2, 3];

export function EventSheet({ event, feeds, catColor, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<EventType>(event.type);
  const [dateTime, setDateTime] = useState<DateTimeValue>({
    date: event.eventDate,
    time: event.eventTime,
  });
  const [uncertain, setUncertain] = useState(event.isUncertain);
  const [stool, setStool] = useState<StoolQuality>(event.stoolQuality ?? 'normal');
  const [volume, setVolume] = useState<PeeVolume>(event.peeVolume ?? 'normal');
  const [feedId, setFeedId] = useState<string | null>(event.feedId);
  const [amount, setAmount] = useState(event.amount ?? 0);
  const [meals, setMeals] = useState(event.mealsCount);
  const [note, setNote] = useState(event.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(event.photoUri);

  const canPhoto = type === 'poop' || type === 'pee';
  const unit = feeds.find((f) => f.id === feedId)?.unit ?? 'gram';

  const pickPhotoAsset = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    const saved = await savePhotoAsset(uri, event.id);
    setPhotoUri(saved);
  };

  const save = () => {
    onSave({
      type,
      eventDate: dateTime.date,
      eventTime: dateTime.time,
      isUncertain: uncertain,
      stoolQuality: type === 'poop' ? stool : null,
      peeVolume: type === 'pee' ? volume : null,
      feedId: type === 'food' ? feedId : null,
      amount: type === 'food' && amount > 0 ? amount : null,
      mealsCount: type === 'food' ? meals : 1,
      note: note.trim() || null,
      photoUri,
    });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)' }}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
        <Pressable
          style={{
            backgroundColor: '#FFF8F3',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F1B15' }}>{t('event.title')}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text style={{ fontSize: 15, color: '#56423C' }}>✕</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {(Object.keys(ACTION_META) as EventType[]).map((et) => {
                const m = ACTION_META[et];
                const active = et === type;
                return (
                  <Pressable
                    key={et}
                    onPress={() => setType(et)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: active ? m.soft : '#F6ECE3',
                      borderWidth: active ? 2 : 0,
                      borderColor: m.main,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: active ? m.main : '#56423C' }}>
                      {t(`action.${et}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TimePill value={dateTime} onChange={setDateTime} catColor={catColor} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#56423C' }}>
                {t('event.uncertainFull')}
              </Text>
              <Switch value={uncertain} onValueChange={setUncertain} />
            </View>

            {type === 'poop' ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                  {t('event.stool')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {STOOL_OPTIONS.map((opt) => {
                    const active = opt === stool;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setStool(opt)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: active ? ACTION_META.poop.soft : '#F6ECE3',
                          borderWidth: active ? 2 : 0,
                          borderColor: ACTION_META.poop.main,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: ACTION_META.poop.main }}>
                          {t(`stool.${opt}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {type === 'pee' ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                  {t('event.volume')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PEE_OPTIONS.map((opt) => {
                    const active = opt === volume;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setVolume(opt)}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: active ? ACTION_META.pee.soft : '#F6ECE3',
                          borderWidth: active ? 2 : 0,
                          borderColor: ACTION_META.pee.main,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: ACTION_META.pee.main }}>
                          {t(`pee.${opt}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {type === 'food' ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                  {t('event.feed')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {feeds.map((f) => {
                    const active = f.id === feedId;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => setFeedId(f.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: active ? ACTION_META.food.soft : '#F6ECE3',
                          borderWidth: active ? 2 : 0,
                          borderColor: ACTION_META.food.main,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: ACTION_META.food.main }}>
                          {f.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ gap: 10, marginTop: 10 }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#56423C', marginBottom: 4 }}>
                      {t('event.amount', { unit: t(`units.${unit}`) })}
                    </Text>
                    <QuantityStepper
                      value={amount}
                      onChange={setAmount}
                      step={unit === 'spoon' ? 0.5 : 1}
                      min={0}
                      max={100}
                      unitLabel={t(`units.${unit}`)}
                      quickValues={unit === 'spoon' ? SPOON_QUICK : GRAM_QUICK}
                      accent={ACTION_META.food.main}
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#56423C', marginBottom: 4 }}>{t('event.mealsSection')}</Text>
                    <QuantityStepper
                      value={meals}
                      onChange={setMeals}
                      step={1}
                      min={1}
                      max={10}
                      unitLabel={t('event.meals', { count: meals })}
                      quickValues={MEALS_QUICK}
                      accent={ACTION_META.food.main}
                      chipTimes
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {canPhoto ? (
              <View style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                  {t('event.photo')}
                </Text>
                {photoUri ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image source={{ uri: photoUri }} style={{ width: 56, height: 56, borderRadius: 10 }} />
                    <Pressable onPress={() => setPhotoUri(null)}>
                      <Text style={{ fontSize: 13, color: '#BA1A1A', fontWeight: '600' }}>{t('event.removePhotoShort')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickPhotoAsset}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: '#F6ECE3',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#56423C' }}>{t('event.addPhoto')}</Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            <Text
              style={{ fontSize: 13, fontWeight: '700', color: '#56423C', marginTop: 14, marginBottom: 6 }}
            >
              {t('event.comment')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              placeholder={t('event.commentPlaceholder')}
              placeholderTextColor="#A49C93"
              style={{
                backgroundColor: '#FCF2E8',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#1F1B15',
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable
                onPress={onDelete}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#FFDAD6',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#93000A' }}>{t('common.delete')}</Text>
              </Pressable>
              <Pressable
                onPress={save}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: catColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{t('common.save')}</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 11, color: '#A49C93', marginTop: 10, textAlign: 'center' }}>
              {t(`action.${type}`)} · {dateTime.date}
            </Text>
          </ScrollView>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
