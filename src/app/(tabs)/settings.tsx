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
import { useTranslation } from 'react-i18next';

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
import { LANGUAGE_AUTO, type LanguagePref } from '@/i18n';
import type { Cat, Feed, Sex, WeightEntry } from '@/types/domain';
import { formatDay, formatWeightGrams, todayKey } from '@/utils/dates';

const SEX_OPTIONS: { value: Sex; labelKey: 'settings.sexMale' | 'settings.sexFemale' | null }[] = [
  { value: 'male', labelKey: 'settings.sexMale' },
  { value: 'female', labelKey: 'settings.sexFemale' },
  { value: 'unknown', labelKey: null },
];

const LANGUAGE_OPTIONS: {
  value: LanguagePref;
  labelKey:
    | 'settings.langAuto'
    | 'settings.langRu'
    | 'settings.langUk'
    | 'settings.langBe'
    | 'settings.langEn'
    | 'settings.langEs'
    | 'settings.langDe'
    | 'settings.langIt'
    | 'settings.langFr';
}[] = [
  { value: LANGUAGE_AUTO, labelKey: 'settings.langAuto' },
  { value: 'ru', labelKey: 'settings.langRu' },
  { value: 'uk', labelKey: 'settings.langUk' },
  { value: 'be', labelKey: 'settings.langBe' },
  { value: 'en', labelKey: 'settings.langEn' },
  { value: 'es', labelKey: 'settings.langEs' },
  { value: 'de', labelKey: 'settings.langDe' },
  { value: 'it', labelKey: 'settings.langIt' },
  { value: 'fr', labelKey: 'settings.langFr' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { cats, feeds, currentCat, refreshCats, refreshFeeds, languagePref, setLanguage } = useApp();
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
    Alert.alert(t('deleteCat.title', { name: cat.name }), t('deleteCat.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
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

  const sexLabel = (sex: Sex) =>
    sex === 'male' ? t('settings.sexMale') : sex === 'female' ? t('settings.sexFemale') : t('settings.sexNotSpecified');

  const languageButtonStyle = (active: boolean) => ({
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: active ? '#9D3E1A' : '#F6ECE3',
  });

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
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F1B15' }}>{t('tabs.settings')}</Text>
          </View>
          <Pressable
            onPress={openCreateCat}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#9D3E1A' }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{t('settings.addCat')}</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>{t('settings.cats')}</Text>
        {cats.length === 0 ? (
          <Text style={{ fontSize: 13, color: '#A49C93', marginBottom: 16 }}>{t('settings.noCats')}</Text>
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
                {sexLabel(cat.sex)}
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
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C' }}>{t('settings.feedsSection')}</Text>
          <Pressable
            onPress={openCreateFeed}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F6ECE3' }}
          >
            <Text style={{ color: '#9D3E1A', fontSize: 13, fontWeight: '700' }}>{t('settings.addFeed')}</Text>
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
                {feed.kind === 'wet' ? t('settings.kindWetLower') : t('settings.kindDryLower')} ·{' '}
                {feed.unit === 'spoon' ? t('settings.unitSpoonsLower') : t('settings.unitGramsLower')}
                {feed.isPreset ? ` · ${t('settings.preset')}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                await softDeleteFeed(db, feed.id);
                refreshFeeds();
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFDAD6' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#93000A' }}>
                {feed.isPreset ? t('common.hide') : t('common.delete')}
              </Text>
            </Pressable>
          </Pressable>
        ))}

        <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C', marginTop: 20, marginBottom: 8 }}>
          {t('settings.languageSection')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = opt.value === languagePref;
            return (
              <Pressable
                key={opt.value}
                onPress={() => void setLanguage(opt.value)}
                style={languageButtonStyle(active)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#56423C' }}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
                {editingCat ? t('settings.editCat', { name: editingCat.name }) : t('settings.newCat')}
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.nameLabel')}</Text>
              <TextInput
                value={catName}
                onChangeText={setCatName}
                placeholder={t('settings.namePlaceholder')}
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

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.sexLabel')}</Text>
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
                        {opt.labelKey ? t(opt.labelKey) : '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>
                {t('settings.birthLabel', { format: t('settings.dateFormat') })}
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

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.coatLabel')}</Text>
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
                {t(`coat.${getCoat(catColor).id}`)}
              </Text>

              {editingCat ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
                    {t('settings.weightHistory')}
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
                      <Text style={{ fontSize: 12, color: '#56423C' }}>{formatDay(w.measuredOn)}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TextInput
                      value={weightGrams}
                      onChangeText={setWeightGrams}
                      placeholder={t('settings.weightPlaceholder')}
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
                      placeholder={t('settings.dateFormat')}
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
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#93000A' }}>{t('common.delete')}</Text>
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
                    {editingCat ? t('common.save') : t('common.add')}
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
                {editingFeed ? t('settings.feedEdit') : t('settings.newFeed')}
              </Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.feedNameLabel')}</Text>
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

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.feedKindLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {(
                  [
                    { value: 'wet', labelKey: 'settings.kindWet' },
                    { value: 'dry', labelKey: 'settings.kindDry' },
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
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 6 }}>{t('settings.feedUnitLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(
                  [
                    { value: 'spoon', labelKey: 'settings.unitSpoons' },
                    { value: 'gram', labelKey: 'settings.unitGrams' },
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
                        {t(opt.labelKey)}
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
                  {editingFeed ? t('common.save') : t('common.add')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </CoatFrame>
  );
}
