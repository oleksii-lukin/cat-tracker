import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CatAvatar } from '@/components/cat-avatar';
import { CoatFrame } from '@/components/coat-frame';
import { CoatPattern } from '@/components/coat-patterns';
import { COAT_LIST, DEFAULT_COAT, getCoat } from '@/constants/coats';
import {
  addWeightEntry,
  createCat,
  createFeed,
  listWeightEntries,
  softDeleteCat,
  softDeleteFeed,
  updateCat,
  updateFeed,
} from '@/db/repositories';
import { useApp } from '@/context/app-context';
import type { Cat, Feed, Sex, WeightEntry } from '@/types/domain';
import { formatDayRu, formatWeightGrams, todayKey } from '@/utils/dates';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'М' },
  { value: 'female', label: 'Ж' },
  { value: 'unknown', label: '—' },
];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { cats, feeds, currentCat, refreshCats, refreshFeeds } = useApp();
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [catName, setCatName] = useState('');
  const [catSex, setCatSex] = useState<Sex>('unknown');
  const [catBirth, setCatBirth] = useState('');
  const [catColor, setCatColor] = useState<string>(DEFAULT_COAT.id);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [weightGrams, setWeightGrams] = useState('');
  const [weightDate, setWeightDate] = useState(todayKey());

  const [feedModal, setFeedModal] = useState(false);
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
  const [feedName, setFeedName] = useState('');
  const [feedKind, setFeedKind] = useState<Feed['kind']>('wet');
  const [feedUnit, setFeedUnit] = useState<Feed['unit']>('spoon');

  const loadWeights = useCallback(
    async (catId: string) => {
      const list = await listWeightEntries(db, catId);
      setWeights(list);
    },
    [db]
  );

  const openCreateCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatSex('unknown');
    setCatBirth('');
    setCatColor(DEFAULT_COAT.id);
    setWeights([]);
    setWeightGrams('');
    setWeightDate(todayKey());
    setCatModal(true);
  };

  const openEditCat = async (cat: Cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatSex(cat.sex);
    setCatBirth(cat.birthDate ?? '');
    setCatColor(getCoat(cat.color).id);
    setWeightGrams('');
    setWeightDate(todayKey());
    setCatModal(true);
    await loadWeights(cat.id);
  };

  const saveCat = async () => {
    const name = catName.trim();
    if (!name) return;
    const coat = getCoat(catColor);
    const payload = {
      name,
      sex: catSex,
      birthDate: catBirth.trim() || null,
      color: coat.id,
    };
    if (editingCat) {
      await updateCat(db, editingCat.id, payload);
    } else {
      await createCat(db, payload);
    }
    setCatModal(false);
    refreshCats();
  };

  const deleteCat = (cat: Cat) => {
    Alert.alert(`Удалить ${cat.name}?`, 'Связанные события останутся в базе, но профиль скроется.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await softDeleteCat(db, cat.id);
          setCatModal(false);
          refreshCats();
        },
      },
    ]);
  };

  const saveWeight = async () => {
    if (!editingCat) return;
    const grams = Number(weightGrams.replace(',', '.'));
    if (!grams || grams <= 0) return;
    await addWeightEntry(db, editingCat.id, Math.round(grams), weightDate || todayKey());
    setWeightGrams('');
    loadWeights(editingCat.id);
  };

  const openCreateFeed = () => {
    setEditingFeed(null);
    setFeedName('');
    setFeedKind('wet');
    setFeedUnit('spoon');
    setFeedModal(true);
  };

  const openEditFeed = (feed: Feed) => {
    setEditingFeed(feed);
    setFeedName(feed.name);
    setFeedKind(feed.kind);
    setFeedUnit(feed.unit);
    setFeedModal(true);
  };

  const saveFeed = async () => {
    const name = feedName.trim();
    if (!name) return;
    const payload = { name, kind: feedKind, unit: feedUnit };
    if (editingFeed) {
      await updateFeed(db, editingFeed.id, payload);
    } else {
      await createFeed(db, payload);
    }
    setFeedModal(false);
    refreshFeeds();
  };

  const previewCoat = catModal
    ? getCoat(catColor)
    : currentCat
      ? getCoat(currentCat.color)
      : DEFAULT_COAT;

  return (
    <CoatFrame
      coat={previewCoat}
      header={
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              shadowColor: 'rgba(31,27,21,0.25)',
              shadowOpacity: 1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F1B15' }}>Настройки</Text>
          </View>
          <Pressable
            onPress={openCreateCat}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#9D3E1A' }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>+ Кот</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>Коты</Text>
        {cats.length === 0 ? (
          <Text style={{ fontSize: 13, color: '#A49C93', marginBottom: 16 }}>Котов пока нет</Text>
        ) : null}
        {cats.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => openEditCat(cat)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#DDC0B7',
            }}
          >
            <CatAvatar coat={getCoat(cat.color)} name={cat.name} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F1B15' }}>{cat.name}</Text>
              <Text style={{ fontSize: 12, color: '#56423C' }}>
                {cat.sex === 'male' ? 'М' : cat.sex === 'female' ? 'Ж' : 'пол не указан'}
                {cat.birthDate ? ` · ${cat.birthDate}` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#A49C93' }}>›</Text>
          </Pressable>
        ))}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C' }}>Корма</Text>
          <Pressable
            onPress={openCreateFeed}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F6ECE3' }}
          >
            <Text style={{ color: '#9D3E1A', fontSize: 13, fontWeight: '700' }}>+ Корм</Text>
          </Pressable>
        </View>
        {feeds.map((feed) => (
          <Pressable
            key={feed.id}
            onPress={() => openEditFeed(feed)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#DDC0B7',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F1B15' }}>{feed.name}</Text>
              <Text style={{ fontSize: 12, color: '#56423C' }}>
                {feed.kind === 'wet' ? 'мокрый' : 'сухой'} ·{' '}
                {feed.unit === 'spoon' ? 'ложки' : 'граммы'}
                {feed.isPreset ? ' · стандарт' : ''}
              </Text>
            </View>
            {feed.isPreset ? (
              <Pressable
                onPress={async () => {
                  await softDeleteFeed(db, feed.id);
                  refreshFeeds();
                }}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFDAD6' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#93000A' }}>Скрыть</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={async () => {
                  await softDeleteFeed(db, feed.id);
                  refreshFeeds();
                }}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFDAD6' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#93000A' }}>Удалить</Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={catModal} transparent animationType="slide" onRequestClose={() => setCatModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setCatModal(false)}
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
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F1B15', marginBottom: 14 }}>
                {editingCat ? `Редактировать: ${editingCat.name}` : 'Новый кот'}
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Имя</Text>
              <TextInput
                value={catName}
                onChangeText={setCatName}
                placeholder="Барсик"
                placeholderTextColor="#A49C93"
                style={{
                  backgroundColor: '#FCF2E8',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#1F1B15',
                  marginBottom: 12,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Пол</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {SEX_OPTIONS.map((opt) => {
                  const active = opt.value === catSex;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setCatSex(opt.value)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: active ? getCoat(catColor).accent : '#F6ECE3',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: active ? getCoat(catColor).onAccent : '#56423C',
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>
                Дата рождения (ГГГГ-ММ-ДД)
              </Text>
              <TextInput
                value={catBirth}
                onChangeText={setCatBirth}
                placeholder="2022-05-01"
                placeholderTextColor="#A49C93"
                style={{
                  backgroundColor: '#FCF2E8',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#1F1B15',
                  marginBottom: 12,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Шерсть</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {COAT_LIST.map((coat) => {
                  const active = coat.id === catColor;
                  return (
                    <Pressable
                      key={coat.id}
                      onPress={() => setCatColor(coat.id)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        overflow: 'hidden',
                        borderWidth: active ? 3 : 1,
                        borderColor: active ? '#1F1B15' : '#DDC0B7',
                      }}
                    >
                      <CoatPattern coat={coat} width={44} height={44} />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ fontSize: 12, color: '#56423C', marginBottom: 16 }}>
                {getCoat(catColor).label}
              </Text>

              {editingCat ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                    История веса
                  </Text>
                  {weights.map((w) => (
                    <View
                      key={w.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: '#DDC0B7',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#1F1B15', fontWeight: '600' }}>
                        {formatWeightGrams(w.weightGrams)}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#56423C' }}>{formatDayRu(w.measuredOn)}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TextInput
                      value={weightGrams}
                      onChangeText={setWeightGrams}
                      placeholder="вес, г"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#A49C93"
                      style={{
                        flex: 1,
                        backgroundColor: '#FCF2E8',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        color: '#1F1B15',
                      }}
                    />
                    <TextInput
                      value={weightDate}
                      onChangeText={setWeightDate}
                      placeholder="ГГГГ-ММ-ДД"
                      placeholderTextColor="#A49C93"
                      style={{
                        flex: 1,
                        backgroundColor: '#FCF2E8',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        color: '#1F1B15',
                      }}
                    />
                    <Pressable
                      onPress={saveWeight}
                      style={{
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: '#F6ECE3',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#9D3E1A' }}>+</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {editingCat ? (
                  <Pressable
                    onPress={() => deleteCat(editingCat)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: '#FFDAD6',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#93000A' }}>Удалить</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={saveCat}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: getCoat(catColor).accent,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: getCoat(catColor).onAccent }}>
                    {editingCat ? 'Сохранить' : 'Добавить'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={feedModal} transparent animationType="slide" onRequestClose={() => setFeedModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setFeedModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFF8F3',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 20, paddingBottom: 32 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F1B15', marginBottom: 14 }}>
                {editingFeed ? 'Корм' : 'Новый корм'}
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Название</Text>
              <TextInput
                value={feedName}
                onChangeText={setFeedName}
                placeholder="Royal Canin British Shorthair"
                placeholderTextColor="#A49C93"
                style={{
                  backgroundColor: '#FCF2E8',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: '#1F1B15',
                  marginBottom: 12,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Вид</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(
                  [
                    { value: 'wet', label: 'Мокрый' },
                    { value: 'dry', label: 'Сухой' },
                  ] as const
                ).map((opt) => {
                  const active = opt.value === feedKind;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setFeedKind(opt.value);
                        setFeedUnit(opt.value === 'wet' ? 'spoon' : 'gram');
                      }}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: active ? '#9D3E1A' : '#F6ECE3',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? '#fff' : '#56423C' }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>Единица</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(
                  [
                    { value: 'spoon', label: 'Ложки' },
                    { value: 'gram', label: 'Граммы' },
                  ] as const
                ).map((opt) => {
                  const active = opt.value === feedUnit;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setFeedUnit(opt.value)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: active ? '#9D3E1A' : '#F6ECE3',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? '#fff' : '#56423C' }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={saveFeed}
                style={{
                  marginTop: 16,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#9D3E1A',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  {editingFeed ? 'Сохранить' : 'Добавить'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </CoatFrame>
  );
}
