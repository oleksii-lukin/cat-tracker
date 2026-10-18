import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DEFAULT_COAT, getCoat } from '@/constants/coats';
import {
  addWeightEntry,
  createCat,
  listWeightEntries,
  softDeleteCat,
  updateCat,
} from '@/db/repositories';
import type { Cat, Sex, WeightEntry } from '@/types/domain';
import { todayKey } from '@/utils/dates';

interface UseCatFormOptions {
  onSaved: () => void;
}

export function useCatForm({ onSaved }: UseCatFormOptions) {
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('unknown');
  const [birth, setBirth] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_COAT.id);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [weightGrams, setWeightGrams] = useState('');
  const [weightDate, setWeightDate] = useState(todayKey());

  const loadWeights = useCallback(
    async (catId: string) => {
      const list = await listWeightEntries(db, catId);
      setWeights(list);
    },
    [db]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setName('');
    setSex('unknown');
    setBirth('');
    setColor(DEFAULT_COAT.id);
    setWeights([]);
    setWeightGrams('');
    setWeightDate(todayKey());
    setModal(true);
  }, []);

  const openEdit = useCallback(
    async (cat: Cat) => {
      setEditing(cat);
      setName(cat.name);
      setSex(cat.sex);
      setBirth(cat.birthDate ?? '');
      setColor(getCoat(cat.color).id);
      setWeightGrams('');
      setWeightDate(todayKey());
      setModal(true);
      await loadWeights(cat.id);
    },
    [loadWeights]
  );

  const close = useCallback(() => setModal(false), []);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const coat = getCoat(color);
    const payload = {
      name: trimmed,
      sex,
      birthDate: birth.trim() || null,
      color: coat.id,
    };
    if (editing) {
      await updateCat(db, editing.id, payload);
    } else {
      await createCat(db, payload);
    }
    setModal(false);
    onSaved();
  }, [name, sex, birth, color, editing, db, onSaved]);

  const remove = useCallback(
    (cat: Cat) => {
      Alert.alert(t('deleteCat.title', { name: cat.name }), t('deleteCat.message'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await softDeleteCat(db, cat.id);
            setModal(false);
            onSaved();
          },
        },
      ]);
    },
    [db, onSaved, t]
  );

  const addWeight = useCallback(async () => {
    if (!editing) return;
    const grams = Number(weightGrams.replace(',', '.'));
    if (!grams || grams <= 0) return;
    await addWeightEntry(db, editing.id, Math.round(grams), weightDate || todayKey());
    setWeightGrams('');
    await loadWeights(editing.id);
  }, [editing, weightGrams, weightDate, db, loadWeights]);

  const resetWeightDate = useCallback(() => setWeightDate(todayKey()), []);

  return {
    modal,
    editing,
    name,
    setName,
    sex,
    setSex,
    birth,
    setBirth,
    color,
    setColor,
    weights,
    weightGrams,
    setWeightGrams,
    weightDate,
    setWeightDate,
    resetWeightDate,
    openCreate,
    openEdit,
    close,
    save,
    remove,
    addWeight,
  };
}
