import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { Feed } from '@/types/domain';

interface Props {
  visible: boolean;
  editing: Feed | null;
  name: string;
  onNameChange: (v: string) => void;
  kind: Feed['kind'];
  onKindChange: (v: Feed['kind']) => void;
  unit: Feed['unit'];
  onUnitChange: (v: Feed['unit']) => void;
  onClose: () => void;
  onSave: () => void;
}

const KIND_OPTIONS: { value: Feed['kind']; labelKey: 'settings.kindWet' | 'settings.kindDry' }[] = [
  { value: 'wet', labelKey: 'settings.kindWet' },
  { value: 'dry', labelKey: 'settings.kindDry' },
];

const UNIT_OPTIONS: { value: Feed['unit']; labelKey: 'settings.unitSpoons' | 'settings.unitGrams' }[] = [
  { value: 'spoon', labelKey: 'settings.unitSpoons' },
  { value: 'gram', labelKey: 'settings.unitGrams' },
];

export function FeedModal({
  visible,
  editing,
  name,
  onNameChange,
  kind,
  onKindChange,
  unit,
  onUnitChange,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior="padding" style={styles.sheetWrapper}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>
                {editing ? t('settings.feedEdit') : t('settings.newFeed')}
              </Text>

              <Text style={styles.label}>{t('settings.feedNameLabel')}</Text>
              <TextInput
                value={name}
                onChangeText={onNameChange}
                placeholder="Royal Canin British Shorthair"
                placeholderTextColor="#A49C93"
                style={styles.input}
              />

              <Text style={styles.label}>{t('settings.feedKindLabel')}</Text>
              <View style={styles.optionRow}>
                {KIND_OPTIONS.map((opt) => {
                  const active = opt.value === kind;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onKindChange(opt.value)}
                      style={[styles.optionButton, active && styles.optionButtonActive]}
                    >
                      <Text style={[styles.optionButtonText, active && styles.optionButtonTextActive]}>
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>{t('settings.feedUnitLabel')}</Text>
              <View style={styles.optionRow}>
                {UNIT_OPTIONS.map((opt) => {
                  const active = opt.value === unit;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onUnitChange(opt.value)}
                      style={[styles.optionButton, active && styles.optionButtonActive]}
                    >
                      <Text style={[styles.optionButtonText, active && styles.optionButtonTextActive]}>
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={onSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>{editing ? t('common.save') : t('common.add')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,27,21,0.4)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF8F3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Design.colors.text,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Design.colors.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Design.colors.text,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Design.colors.surfaceContainer,
  },
  optionButtonActive: {
    backgroundColor: Design.colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Design.colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
