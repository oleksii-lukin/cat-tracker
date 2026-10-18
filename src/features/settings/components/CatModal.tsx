import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CoatPattern } from '@/components/coat-patterns';
import { COAT_LIST, getCoat } from '@/constants/coats';
import { Design } from '@/constants/design';
import type { Cat, Sex, WeightEntry } from '@/types/domain';

import { SEX_OPTIONS } from '../constants';
import { WeightHistory } from './WeightHistory';

interface Props {
  visible: boolean;
  editing: Cat | null;
  name: string;
  onNameChange: (v: string) => void;
  sex: Sex;
  onSexChange: (v: Sex) => void;
  birth: string;
  onBirthChange: (v: string) => void;
  color: string;
  onColorChange: (v: string) => void;
  weights: WeightEntry[];
  weightGrams: string;
  onWeightGramsChange: (v: string) => void;
  weightDate: string;
  onWeightDateChange: (v: string) => void;
  onAddWeight: () => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function CatModal({
  visible,
  editing,
  name,
  onNameChange,
  sex,
  onSexChange,
  birth,
  onBirthChange,
  color,
  onColorChange,
  weights,
  weightGrams,
  onWeightGramsChange,
  weightDate,
  onWeightDateChange,
  onAddWeight,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const coat = getCoat(color);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior="padding" style={styles.sheetWrapper}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sheetTitle}>
                {editing ? t('settings.editCat', { name: editing.name }) : t('settings.newCat')}
              </Text>

              <Text style={styles.label}>{t('settings.nameLabel')}</Text>
              <TextInput
                value={name}
                onChangeText={onNameChange}
                placeholder={t('settings.namePlaceholder')}
                placeholderTextColor="#A49C93"
                testID="cat-name-input"
                style={styles.input}
              />

              <Text style={styles.label}>{t('settings.sexLabel')}</Text>
              <View style={styles.sexRow}>
                {SEX_OPTIONS.map((opt) => {
                  const active = opt.value === sex;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onSexChange(opt.value)}
                      style={[
                        styles.sexButton,
                        { backgroundColor: active ? coat.accent : Design.colors.surfaceContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sexButtonText,
                          { color: active ? coat.onAccent : Design.colors.textSecondary },
                        ]}
                      >
                        {opt.labelKey ? t(opt.labelKey) : '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>{t('settings.birthLabel', { format: t('settings.dateFormat') })}</Text>
              <TextInput
                value={birth}
                onChangeText={onBirthChange}
                placeholder="2022-05-01"
                placeholderTextColor="#A49C93"
                style={styles.input}
              />

              <Text style={styles.label}>{t('settings.coatLabel')}</Text>
              <View style={styles.coatRow}>
                {COAT_LIST.map((c) => {
                  const active = c.id === color;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => onColorChange(c.id)}
                      style={[
                        styles.coatButton,
                        { borderWidth: active ? 3 : 1, borderColor: active ? Design.colors.text : Design.colors.outlineVariant },
                      ]}
                    >
                      <CoatPattern coat={c} width={44} height={44} />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.coatName}>{t(`coat.${coat.id}`)}</Text>

              {editing ? (
                <WeightHistory
                  weights={weights}
                  weightGrams={weightGrams}
                  onWeightGramsChange={onWeightGramsChange}
                  weightDate={weightDate}
                  onWeightDateChange={onWeightDateChange}
                  onAdd={onAddWeight}
                />
              ) : null}

              <View style={styles.footer}>
                {editing ? (
                  <Pressable onPress={onDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={onSave} testID="cat-save-button" style={[styles.saveButton, { backgroundColor: coat.accent }]}>
                  <Text style={[styles.saveButtonText, { color: coat.onAccent }]}>
                    {editing ? t('common.save') : t('common.add')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
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
    maxHeight: '85%',
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
  sexRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sexButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  sexButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  coatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  coatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  coatName: {
    fontSize: 12,
    color: Design.colors.textSecondary,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93000A',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
