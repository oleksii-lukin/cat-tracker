import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CoatFrame } from '@/components/coat-frame';
import { useApp } from '@/context/app-context';
import { DEFAULT_COAT, getCoat } from '@/constants/coats';

import { CatsSection } from '@/features/settings/components/CatsSection';
import { CatModal } from '@/features/settings/components/CatModal';
import { BackupSection } from '@/features/settings/components/BackupSection';
import { FeedsSection } from '@/features/settings/components/FeedsSection';
import { FeedModal } from '@/features/settings/components/FeedModal';
import { LanguageSection } from '@/features/settings/components/LanguageSection';
import { QuickBlocksSection } from '@/features/settings/components/QuickBlocksSection';
import { VersionSection } from '@/features/settings/components/VersionSection';
import { useBackup } from '@/features/settings/hooks/useBackup';
import { useCatForm } from '@/features/settings/hooks/useCatForm';
import { useFeedForm } from '@/features/settings/hooks/useFeedForm';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    cats,
    feeds,
    currentCat,
    refreshCats,
    refreshFeeds,
    languagePref,
    setLanguage,
    quickActions,
    toggleQuickAction,
    moveQuickAction,
  } = useApp();

  const catForm = useCatForm({ onSaved: refreshCats });
  const feedForm = useFeedForm({ onSaved: refreshFeeds });
  const backup = useBackup();

  const previewCoat = catForm.modal
    ? getCoat(catForm.color)
    : currentCat
      ? getCoat(currentCat.color)
      : DEFAULT_COAT;

  return (
    <CoatFrame
      coat={previewCoat}
      header={
        <View style={headerStyles.row}>
          <View style={headerStyles.titlePill}>
            <Text style={headerStyles.title}>{t('tabs.settings')}</Text>
          </View>
          <Pressable
            onPress={catForm.openCreate}
            testID="add-cat-button"
            style={headerStyles.addButton}
          >
            <Text style={headerStyles.addButtonText}>{t('settings.addCat')}</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <CatsSection cats={cats} onEdit={catForm.openEdit} />
        <FeedsSection feeds={feeds} onAdd={feedForm.openCreate} onEdit={feedForm.openEdit} onDelete={feedForm.remove} />
        <QuickBlocksSection
          config={quickActions}
          onToggle={(id) => void toggleQuickAction(id)}
          onMove={(id, dir) => void moveQuickAction(id, dir)}
        />
        <LanguageSection languagePref={languagePref} onChange={(pref) => void setLanguage(pref)} />
        <BackupSection
          busy={backup.busy}
          folder={backup.folder}
          backups={backup.backups}
          isDefaultFolder={backup.isDefaultFolder}
          canChangeFolder={backup.canChangeFolder}
          onExport={() => void backup.exportBackup()}
          onShare={() => void backup.shareBackup()}
          onRestore={(item) => void backup.restoreBackup(item)}
          onManualImport={() => void backup.importManually()}
          onChangeFolder={() => void backup.changeFolder()}
        />
        <VersionSection />
      </ScrollView>

      <CatModal
        visible={catForm.modal}
        editing={catForm.editing}
        name={catForm.name}
        onNameChange={catForm.setName}
        sex={catForm.sex}
        onSexChange={catForm.setSex}
        birth={catForm.birth}
        onBirthChange={catForm.setBirth}
        color={catForm.color}
        onColorChange={catForm.setColor}
        weights={catForm.weights}
        weightGrams={catForm.weightGrams}
        onWeightGramsChange={catForm.setWeightGrams}
        weightDate={catForm.weightDate}
        onWeightDateChange={catForm.setWeightDate}
        onAddWeight={() => void catForm.addWeight()}
        onClose={catForm.close}
        onSave={() => void catForm.save()}
        onDelete={() => {
          if (catForm.editing) catForm.remove(catForm.editing);
        }}
      />

      <FeedModal
        visible={feedForm.modal}
        editing={feedForm.editing}
        name={feedForm.name}
        onNameChange={feedForm.setName}
        kind={feedForm.kind}
        onKindChange={feedForm.setKind}
        unit={feedForm.unit}
        onUnitChange={feedForm.setUnit}
        onClose={feedForm.close}
        onSave={() => void feedForm.save()}
      />
    </CoatFrame>
  );
}

const headerStyles = {
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  titlePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: 'rgba(31,27,21,0.25)',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F1B15',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#9D3E1A',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
  },
};
