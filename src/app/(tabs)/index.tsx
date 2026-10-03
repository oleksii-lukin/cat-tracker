import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatChips } from '@/components/cat-chips';
import { JournalFeed } from '@/components/journal-feed';
import { QuickAddPanel } from '@/components/quick-add-panel';
import { useApp } from '@/context/app-context';

export default function JournalScreen() {
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
            Добавьте кота в настройках
          </Text>
          <Text style={{ fontSize: 13, color: '#56423C', textAlign: 'center', marginTop: 8 }}>
            Вкладка «Настройки» → «Коты» → «+».
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8F3' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <CatChips cats={cats} currentCatId={currentCatId} onSelect={setCurrentCatId} />
        <QuickAddPanel cat={currentCat} feeds={feeds} onMutated={onMutated} />
        <JournalFeed
          key={currentCat.id}
          cat={currentCat}
          feeds={feeds}
          revision={revision}
          focusDay={focusDay}
          onFocusDayHandled={onFocusDayHandled}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
