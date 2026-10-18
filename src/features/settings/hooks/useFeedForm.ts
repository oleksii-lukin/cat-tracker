import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { createFeed, softDeleteFeed, updateFeed } from '@/db/repositories';
import type { Feed } from '@/types/domain';

interface UseFeedFormOptions {
  onSaved: () => void;
}

export function useFeedForm({ onSaved }: UseFeedFormOptions) {
  const db = useSQLiteContext();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Feed | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Feed['kind']>('wet');
  const [unit, setUnit] = useState<Feed['unit']>('spoon');

  const openCreate = useCallback(() => {
    setEditing(null);
    setName('');
    setKind('wet');
    setUnit('spoon');
    setModal(true);
  }, []);

  const openEdit = useCallback((feed: Feed) => {
    setEditing(feed);
    setName(feed.name);
    setKind(feed.kind);
    setUnit(feed.unit);
    setModal(true);
  }, []);

  const close = useCallback(() => setModal(false), []);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = { name: trimmed, kind, unit };
    if (editing) {
      await updateFeed(db, editing.id, payload);
    } else {
      await createFeed(db, payload);
    }
    setModal(false);
    onSaved();
  }, [name, kind, unit, editing, db, onSaved]);

  const remove = useCallback(
    async (feed: Feed) => {
      await softDeleteFeed(db, feed.id);
      onSaved();
    },
    [db, onSaved]
  );

  /** Wet feeds default to spoons, dry feeds to grams. */
  const setKindWithUnit = useCallback((next: Feed['kind']) => {
    setKind(next);
    setUnit(next === 'wet' ? 'spoon' : 'gram');
  }, []);

  return {
    modal,
    editing,
    name,
    setName,
    kind,
    setKind: setKindWithUnit,
    unit,
    setUnit,
    openCreate,
    openEdit,
    close,
    save,
    remove,
  };
}
