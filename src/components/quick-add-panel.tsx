import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { QuantityStepper } from '@/components/quantity-stepper';
import { TimePill, type DateTimeValue } from '@/components/time-pill';
import { CatAvatar } from '@/components/cat-avatar';
import { ACTION_META, NOTE_META } from '@/constants/design';
import { getCoat } from '@/constants/coats';
import { createEvent, createNote, savePhotoAsset } from '@/db/repositories';
import type { Cat, EventType, Feed, PeeVolume, StoolQuality } from '@/types/domain';
import { dayKey, formatTime } from '@/utils/dates';
import { uuid } from '@/utils/id';
import { pickPhoto } from '@/utils/photo-picker';

interface Props {
  cat: Cat;
  feeds: Feed[];
  onMutated: () => void;
}

const STOOL_OPTIONS: StoolQuality[] = ['normal', 'hard', 'liquid', 'unusual'];
const PEE_OPTIONS: PeeVolume[] = ['low', 'normal', 'high'];
const SPOON_QUICK = [0.5, 1, 1.5, 2, 3];
const GRAM_QUICK = [4, 6, 10, 15, 20, 30, 35];
const MEALS_QUICK = [1, 2, 3];

export function QuickAddPanel({ cat, feeds, onMutated }: Props) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const [expanded, setExpanded] = useState<EventType | null>(null);
  const [dateTime, setDateTime] = useState<DateTimeValue>(() => {
    const now = new Date();
    return { date: dayKey(now), time: formatTime(now) };
  });
  const [stool, setStool] = useState<StoolQuality>('normal');
  const [volume, setVolume] = useState<PeeVolume>('normal');
  const [feedId, setFeedId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [meals, setMeals] = useState(1);
  const [uncertain, setUncertain] = useState(false);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const activeFeedId = feedId ?? feeds[0]?.id ?? null;

  const resetDraft = () => {
    setStool('normal');
    setVolume('normal');
    setAmount(0);
    setMeals(1);
    setUncertain(false);
    setComment('');
    setPhotoUri(null);
    const now = new Date();
    setDateTime({ date: dayKey(now), time: formatTime(now) });
  };

  const toggleExpanded = (t: EventType) => {
    setExpanded((prev) => {
      if (prev === t) return null;
      resetDraft();
      return t;
    });
  };

  const pickPhotoAsset = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    const saved = await savePhotoAsset(uri, uuid());
    setPhotoUri(saved);
  };

  const submitEvent = async () => {
    if (!expanded || saving) return;
    setSaving(true);
    try {
      const type = expanded;
      await createEvent(db, {
        catId: cat.id,
        type,
        eventDate: dateTime.date,
        eventTime: dateTime.time,
        isUncertain: uncertain,
        stoolQuality: type === 'poop' ? stool : null,
        peeVolume: type === 'pee' ? volume : null,
        feedId: type === 'food' ? activeFeedId : null,
        amount: type === 'food' && amount > 0 ? amount : null,
        mealsCount: type === 'food' ? meals : 1,
        note: comment.trim() || null,
        photoUri,
      });
      setExpanded(null);
      resetDraft();
      onMutated();
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    await createNote(db, {
      catId: cat.id,
      day: dateTime.date,
      time: dateTime.time,
      text,
    });
    setNoteText('');
    onMutated();
  };

  const meta = expanded ? ACTION_META[expanded] : null;
  const unit = feeds.find((f) => f.id === activeFeedId)?.unit ?? 'gram';
  const coat = getCoat(cat.color);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: coat.border,
        shadowColor: 'rgba(84,78,71,0.08)',
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CatAvatar coat={coat} name={cat.name} size={28} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F1B15' }}>{t('quickAdd.title')}</Text>
        </View>
        <TimePill value={dateTime} onChange={setDateTime} catColor={coat.accent} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(Object.keys(ACTION_META) as EventType[]).map((at) => {
          const m = ACTION_META[at];
          const active = expanded === at;
          return (
            <Pressable
              key={at}
              onPress={() => toggleExpanded(at)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: active ? m.soft : '#F6ECE3',
                borderWidth: active ? 2 : 0,
                borderColor: m.main,
              }}
            >
              <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: active ? m.main : '#56423C',
                  marginTop: 2,
                }}
              >
                {t(`action.${at}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {expanded && meta ? (
        <View style={{ marginTop: 12 }}>
          {expanded === 'poop' ? (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>
                {t('event.stool')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {STOOL_OPTIONS.map((opt) => {
                  const active = opt === stool;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setStool(opt)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: active ? meta.soft : '#FCF2E8',
                        borderWidth: active ? 2 : 0,
                        borderColor: meta.main,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: meta.main }}>
                        {t(`stool.${opt}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {expanded === 'pee' ? (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>
                {t('event.volume')}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {PEE_OPTIONS.map((opt) => {
                  const active = opt === volume;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setVolume(opt)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: active ? meta.soft : '#FCF2E8',
                        borderWidth: active ? 2 : 0,
                        borderColor: meta.main,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: meta.main }}>
                        {t(`pee.${opt}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {expanded === 'food' ? (
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>
                {t('event.feed')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {feeds.map((f) => {
                    const active = f.id === activeFeedId;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => setFeedId(f.id)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: active ? meta.soft : '#FCF2E8',
                          borderWidth: active ? 2 : 0,
                          borderColor: meta.main,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: meta.main }}>
                          {f.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View style={{ gap: 10, marginTop: 4 }}>
                <View>
                  <Text style={{ fontSize: 11, color: '#56423C', marginBottom: 4 }}>
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
                    accent={meta.main}
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: '#56423C', marginBottom: 4 }}>{t('event.mealsSection')}</Text>
                  <QuantityStepper
                    value={meals}
                    onChange={setMeals}
                    step={1}
                    min={1}
                    max={10}
                    unitLabel={t('event.meals', { count: meals })}
                    quickValues={MEALS_QUICK}
                    accent={meta.main}
                    chipTimes
                  />
                </View>
              </View>
            </View>
          ) : null}

          {expanded === 'poop' || expanded === 'pee' ? (
            <View style={{ marginTop: 10 }}>
              {photoUri ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image source={{ uri: photoUri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <Pressable onPress={() => setPhotoUri(null)}>
                    <Text style={{ fontSize: 12, color: '#BA1A1A', fontWeight: '600' }}>{t('event.removePhoto')}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickPhotoAsset}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: '#FCF2E8',
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C' }}>{t('event.addPhotoShort')}</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C' }}>{t('event.uncertainShort')}</Text>
            <Switch value={uncertain} onValueChange={setUncertain} />
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={t('event.commentPlaceholderShort')}
            placeholderTextColor="#A49C93"
            style={{
              backgroundColor: '#FCF2E8',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 13,
              color: '#1F1B15',
              marginTop: 8,
            }}
          />

          <Pressable
            onPress={submitEvent}
            disabled={saving}
            style={{
              marginTop: 10,
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: meta.main,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
              {saving ? t('event.saving') : t('event.saveEvent')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {expanded === null ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder={t('quickAdd.notePlaceholder')}
            placeholderTextColor="#A49C93"
            style={{
              flex: 1,
              backgroundColor: '#FCF2E8',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 13,
              color: '#1F1B15',
            }}
          />
          <Pressable
            onPress={submitNote}
            style={{
              width: 44,
              borderRadius: 12,
              backgroundColor: NOTE_META.main,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: '#fff', fontWeight: '700' }}>+</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
