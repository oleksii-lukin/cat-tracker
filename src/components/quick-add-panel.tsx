import { useSQLiteContext } from 'expo-sqlite';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { EventFieldRenderer } from '@/components/event-fields';
import { TimePill, type DateTimeValue } from '@/components/time-pill';
import { CatAvatar } from '@/components/cat-avatar';
import { NOTE_META } from '@/constants/design';
import { getCoat } from '@/constants/coats';
import { createEvent, createNote, savePhotoAsset } from '@/db/repositories';
import { useApp } from '@/context/app-context';
import {
  DEFAULT_DRAFT,
  draftToFields,
  getEventDef,
  type EventDraft,
} from '@/domain/events';
import { QUICK_ACTIONS_REGISTRY, getEnabledSorted } from '@/domain/quick-actions';
import type { Cat, EventType, Feed } from '@/types/domain';
import { dayKey, formatTime } from '@/utils/dates';
import { uuid } from '@/utils/id';
import { pickPhoto } from '@/utils/photo-picker';

interface Props {
  cat: Cat;
  feeds: Feed[];
  onMutated: () => void;
}

export function QuickAddPanel({ cat, feeds, onMutated }: Props) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { quickActions } = useApp();
  const enabledQuickActions = useMemo(
    () => getEnabledSorted(QUICK_ACTIONS_REGISTRY, quickActions),
    [quickActions]
  );
  const [expanded, setExpanded] = useState<EventType | null>(null);
  const [dateTime, setDateTime] = useState<DateTimeValue>(() => {
    const now = new Date();
    return { date: dayKey(now), time: formatTime(now) };
  });
  const [draft, setDraft] = useState<EventDraft>(DEFAULT_DRAFT);
  const [uncertain, setUncertain] = useState(false);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...p }));
  const activeFeedId = draft.feedId ?? feeds[0]?.id ?? null;

  const resetDraft = () => {
    setDraft({ ...DEFAULT_DRAFT, feedId: activeFeedId });
    setUncertain(false);
    setComment('');
    setPhotoUri(null);
    const now = new Date();
    setDateTime({ date: dayKey(now), time: formatTime(now) });
  };

  const toggleExpanded = (next: EventType) => {
    setExpanded((prev) => {
      if (prev === next) return null;
      resetDraft();
      return next;
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
      const def = getEventDef(expanded);
      await createEvent(db, {
        catId: cat.id,
        type: expanded,
        eventDate: dateTime.date,
        eventTime: dateTime.time,
        isUncertain: uncertain,
        ...draftToFields(def, { ...draft, feedId: activeFeedId }),
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

  const def = expanded ? getEventDef(expanded) : null;
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
        {enabledQuickActions.map((quickDef) => {
          const at = quickDef.id;
          const eventDef = getEventDef(at);
          const active = expanded === at;
          return (
            <Pressable
              key={at}
              onPress={() => toggleExpanded(at)}
              testID={`quickadd-${at}`}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: active ? eventDef.soft : '#F6ECE3',
                borderWidth: active ? 2 : 0,
                borderColor: eventDef.main,
              }}
            >
              <Text style={{ fontSize: 18 }}>{eventDef.emoji}</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: active ? eventDef.main : '#56423C',
                  marginTop: 2,
                }}
              >
                {t(eventDef.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {expanded && def ? (
        <View style={{ marginTop: 12 }}>
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
              backgroundColor: def.main,
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
