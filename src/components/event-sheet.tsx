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

import { EventFieldRenderer } from '@/components/event-fields';
import { TimePill, type DateTimeValue } from '@/components/time-pill';
import { savePhotoAsset } from '@/db/repositories';
import { ALL_EVENT_TYPES, draftFromEvent, draftToFields, getEventDef, type EventDraft } from '@/domain/events';
import type { DayEvent, EventType, Feed } from '@/types/domain';
import { pickPhoto } from '@/utils/photo-picker';

interface Props {
  event: DayEvent;
  feeds: Feed[];
  catColor: string;
  onSave: (patch: Partial<DayEvent> & { photoUri?: string | null }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function EventSheet({ event, feeds, catColor, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState<EventType>(event.type);
  const [dateTime, setDateTime] = useState<DateTimeValue>({
    date: event.eventDate,
    time: event.eventTime,
  });
  const [uncertain, setUncertain] = useState(event.isUncertain);
  const [draft, setDraft] = useState<EventDraft>(draftFromEvent(event));
  const [note, setNote] = useState(event.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(event.photoUri);

  const patch = (p: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...p }));
  const def = getEventDef(type);
  const activeFeedId = draft.feedId ?? feeds[0]?.id ?? null;

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
      ...draftToFields(def, { ...draft, feedId: activeFeedId }),
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
              {ALL_EVENT_TYPES.map((et) => {
                const etDef = getEventDef(et);
                const active = et === type;
                return (
                  <Pressable
                    key={et}
                    onPress={() => setType(et)}
                    testID={`event-type-${et}`}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: active ? etDef.soft : '#F6ECE3',
                      borderWidth: active ? 2 : 0,
                      borderColor: etDef.main,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{etDef.emoji}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: active ? etDef.main : '#56423C' }}>
                      {t(etDef.labelKey)}
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

            <View style={{ gap: 2 }}>
              {def.fields.map((field) => (
                <EventFieldRenderer
                  key={field}
                  field={field}
                  ctx={{ draft: { ...draft, feedId: activeFeedId }, patch, feeds, main: def.main, soft: def.soft }}
                />
              ))}
            </View>

            {def.supportsPhoto ? (
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
                testID="event-sheet-save"
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
              {t(def.labelKey)} · {dateTime.date}
            </Text>
          </ScrollView>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
