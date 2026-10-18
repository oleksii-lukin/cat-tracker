import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { EventCard } from '@/components/event-card';
import { EventSheet } from '@/components/event-sheet';
import { NOTE_META } from '@/constants/design';
import { getEventDef } from '@/domain/events';
import { getCoat } from '@/constants/coats';
import {
  createEvent,
  hasDataBefore,
  listEventsBetween,
  listNotesBetween,
  softDeleteEvent,
  softDeleteNote,
  updateEvent,
  updateNote,
} from '@/db/repositories';
import type { Cat, DayEvent, Feed, Note } from '@/types/domain';
import { addDays, dayKey, relativeDayLabel, todayKey } from '@/utils/dates';

interface Props {
  cat: Cat;
  feeds: Feed[];
  revision: number;
  focusDay: string | null;
  onFocusDayHandled: () => void;
}

const PAGE_DAYS = 14;

type FeedItem =
  | { kind: 'event'; event: DayEvent }
  | { kind: 'note'; note: Note };

function itemSortKey(item: FeedItem): string {
  if (item.kind === 'event') return item.event.eventTime ?? '99:99';
  return item.note.time ?? '99:99';
}

function buildDayItems(events: DayEvent[], notes: Note[]): FeedItem[] {
  const items: FeedItem[] = [
    ...events.map((event) => ({ kind: 'event' as const, event })),
    ...notes.map((note) => ({ kind: 'note' as const, note })),
  ];
  return items.sort((a, b) => {
    const ka = itemSortKey(a);
    const kb = itemSortKey(b);
    if (ka === kb) return 0;
    return ka < kb ? 1 : -1;
  });
}

interface DayGroup {
  day: string;
  items: FeedItem[];
  events: DayEvent[];
  notes: Note[];
}

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: NOTE_META.soft,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        gap: 12,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 4, borderRadius: 2, backgroundColor: NOTE_META.main }} />
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18 }}>{NOTE_META.emoji}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: NOTE_META.main, flex: 1 }}>
            {t('note.label')}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', flexShrink: 0 }}>
            {note.time ?? '—'}
          </Text>
        </View>
        <Text numberOfLines={4} style={{ fontSize: 13, color: '#4A3F7A', marginTop: 2 }}>
          {note.text}
        </Text>
      </View>
    </Pressable>
  );
}

export function JournalFeed({ cat, feeds, revision, focusDay, onFocusDayHandled }: Props) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextFromDay, setNextFromDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<DayEvent | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const loadWindow = useCallback(
    async (from: string, to: string, append: boolean) => {
      setLoading(true);
      try {
        const events = await listEventsBetween(db, cat.id, from, to);
        const notes = await listNotesBetween(db, cat.id, from, to);
        const daySet = new Set<string>();
        for (const e of events) daySet.add(e.eventDate);
        for (const n of notes) daySet.add(n.day);
        if (!append && focusDay && focusDay >= from && focusDay <= to) {
          daySet.add(focusDay);
        }

        const days = Array.from(daySet).sort((a, b) => (a < b ? 1 : -1));
        const nextGroups: DayGroup[] = days.map((day) => {
          const dayEvents = events.filter((e) => e.eventDate === day);
          const dayNotes = notes.filter((n) => n.day === day);
          return {
            day,
            events: dayEvents,
            notes: dayNotes,
            items: buildDayItems(dayEvents, dayNotes),
          };
        });

        setGroups((prev) => (append ? [...prev, ...nextGroups] : nextGroups));

        const oldest = days.length > 0 ? days[days.length - 1] : from;
        const older = await hasDataBefore(db, cat.id, oldest);
        setHasMore(older);
        setNextFromDay(addDays(oldest, -PAGE_DAYS));
      } finally {
        setLoading(false);
      }
    },
    [db, cat.id, focusDay]
  );

  useEffect(() => {
    const today = todayKey();
    const toDay = today;
    let from = addDays(today, -(PAGE_DAYS - 1));
    if (focusDay && focusDay < from) {
      from = addDays(focusDay, -3);
    }
    void (async () => {
      await loadWindow(from, toDay, false);
    })();
    if (focusDay) onFocusDayHandled();
  }, [cat.id, revision, loadWindow, focusDay, onFocusDayHandled]);

  const refresh = useCallback(() => {
    const today = todayKey();
    const from = addDays(today, -(PAGE_DAYS - 1));
    loadWindow(from, today, false);
  }, [loadWindow]);

  const loadEarlier = useCallback(() => {
    if (!nextFromDay || loading) return;
    const to = addDays(nextFromDay, PAGE_DAYS - 1);
    loadWindow(nextFromDay, to, true);
  }, [nextFromDay, loading, loadWindow]);

  const handleRepeat = useCallback(
    async (event: DayEvent) => {
      const now = new Date();
      await createEvent(db, {
        catId: cat.id,
        type: event.type,
        eventDate: dayKey(now),
        eventTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        isUncertain: false,
        stoolQuality: event.stoolQuality,
        peeVolume: event.peeVolume,
        feedId: event.feedId,
        amount: event.amount,
        mealsCount: event.mealsCount,
        note: event.note,
        photoUri: null,
      });
      refresh();
    },
    [db, cat.id, refresh]
  );

  const handleSaveEdit = useCallback(
    async (patch: Partial<DayEvent>) => {
      if (!editing) return;
      await updateEvent(db, editing.id, {
        catId: editing.catId,
        type: patch.type ?? editing.type,
        eventDate: patch.eventDate ?? editing.eventDate,
        eventTime: patch.eventTime !== undefined ? patch.eventTime : editing.eventTime,
        isUncertain: patch.isUncertain ?? editing.isUncertain,
        stoolQuality: patch.stoolQuality !== undefined ? patch.stoolQuality : editing.stoolQuality,
        peeVolume: patch.peeVolume !== undefined ? patch.peeVolume : editing.peeVolume,
        feedId: patch.feedId !== undefined ? patch.feedId : editing.feedId,
        amount: patch.amount !== undefined ? patch.amount : editing.amount,
        mealsCount: patch.mealsCount ?? editing.mealsCount,
        note: patch.note !== undefined ? patch.note : editing.note,
        photoUri: patch.photoUri !== undefined ? patch.photoUri : editing.photoUri,
      });
      setEditing(null);
      refresh();
    },
    [db, editing, refresh]
  );

  const handleDelete = useCallback(async () => {
    if (!editing) return;
    Alert.alert(t('deleteEvent.title'), t('deleteEvent.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await softDeleteEvent(db, editing.id);
          setEditing(null);
          refresh();
        },
      },
    ]);
  }, [db, editing, refresh, t]);

  const openNote = useCallback((note: Note) => {
    setNoteDraft(note.text);
    setEditingNote(note);
  }, []);

  const saveNote = useCallback(async () => {
    if (!editingNote) return;
    const text = noteDraft.trim();
    if (!text) {
      Alert.alert(t('note.emptyTitle'), t('note.emptyMessage'), [
        { text: t('common.ok') },
      ]);
      return;
    }
    await updateNote(db, editingNote.id, { text });
    setEditingNote(null);
    refresh();
  }, [db, editingNote, noteDraft, refresh, t]);

  const deleteNote = useCallback(async () => {
    if (!editingNote) return;
    Alert.alert(t('deleteNote.title'), t('deleteNote.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await softDeleteNote(db, editingNote.id);
          setEditingNote(null);
          refresh();
        },
      },
    ]);
  }, [db, editingNote, refresh, t]);

  if (groups.length === 0 && !loading) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F1B15', textAlign: 'center' }}>
          {t('journal.emptyTitle')}
        </Text>
        <Text style={{ fontSize: 13, color: '#56423C', textAlign: 'center', marginTop: 6 }}>
          {t('journal.emptyHint')}
        </Text>
        {hasMore && nextFromDay ? (
          <Pressable onPress={loadEarlier} style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#9D3E1A' }}>
              {t('journal.showEarlier')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {groups.map((group) => {
        const total = group.events.length + group.notes.length;
        return (
          <View key={group.day} style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F1B15' }}>
                  {relativeDayLabel(group.day)}
                </Text>
                {group.day === todayKey() ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: getEventDef('food').main,
                    }}
                  />
                ) : null}
              </View>
              <View
                style={{
                  backgroundColor: '#F6ECE3',
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#56423C' }}>
                  {total} {t('journal.entries', { count: total })}
                </Text>
              </View>
            </View>

            {group.items.map((item) =>
              item.kind === 'event' ? (
                <EventCard
                  key={item.event.id}
                  event={item.event}
                  feeds={feeds}
                  onPress={() => setEditing(item.event)}
                  onRepeat={() => handleRepeat(item.event)}
                />
              ) : (
                <NoteCard key={item.note.id} note={item.note} onPress={() => openNote(item.note)} />
              )
            )}
          </View>
        );
      })}

      {hasMore ? (
        <Pressable
          onPress={loadEarlier}
          disabled={loading}
          style={{ alignItems: 'center', paddingVertical: 14, marginBottom: 24 }}
        >
          {loading ? (
            <ActivityIndicator color={getEventDef('food').main} />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#56423C' }}>
              {t('journal.showEarlierShort')}
            </Text>
          )}
        </Pressable>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 14, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, color: '#A49C93' }}>{t('journal.endOfHistory')}</Text>
        </View>
      )}

      {editing ? (
        <EventSheet
          key={editing.id}
          event={editing}
          feeds={feeds}
          catColor={getCoat(cat.color).accent}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Modal
        visible={editingNote !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingNote(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setEditingNote(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFF8F3',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 32,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F1B15', marginBottom: 10 }}>
              {t('note.label')}{editingNote ? ` · ${editingNote.day}${editingNote.time ? `, ${editingNote.time}` : ''}` : ''}
            </Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              multiline
              autoFocus
              placeholder={t('note.placeholder')}
              placeholderTextColor="#A49C93"
              style={{
                backgroundColor: '#FCF2E8',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: '#1F1B15',
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={deleteNote}
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
                onPress={saveNote}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: getCoat(cat.color).accent,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
