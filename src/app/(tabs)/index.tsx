import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { CatChips } from '@/components/cat-chips';
import { CoatFrame } from '@/components/coat-frame';
import { JournalFeed } from '@/components/journal-feed';
import { QuickAddPanel } from '@/components/quick-add-panel';
import { useApp } from '@/context/app-context';
import { getCoat } from '@/constants/coats';

export default function JournalScreen() {
  const { t } = useTranslation();
  const {
    cats,
    feeds,
    currentCat,
    currentCatId,
    setCurrentCatId,
    focusDay,
    setFocusDay,
    bumpRevision,
    revision,
    today,
  } = useApp();

  const onFocusDayHandled = useCallback(() => setFocusDay(null), [setFocusDay]);
  const onMutated = useCallback(() => {
    setFocusDay(null);
    bumpRevision();
  }, [bumpRevision, setFocusDay]);

  if (!currentCat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F1B15' }}>
            {t('journal.addCatTitle')}
          </Text>
          <Text style={{ fontSize: 13, color: '#56423C', textAlign: 'center', marginTop: 8 }}>
            {t('journal.addCatHint')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CoatFrame
      coat={getCoat(currentCat.color)}
      header={<CatChips cats={cats} currentCatId={currentCatId} onSelect={setCurrentCatId} />}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <QuickAddPanel cat={currentCat} feeds={feeds} onMutated={onMutated} />
        <JournalFeed
          key={currentCat.id}
          cat={currentCat}
          feeds={feeds}
          revision={revision}
          today={today}
          focusDay={focusDay}
          onFocusDayHandled={onFocusDayHandled}
        />
      </ScrollView>
    </CoatFrame>
  );
}
