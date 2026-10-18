import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import { QUICK_ACTIONS_REGISTRY, type QuickActionId } from '@/domain/quick-actions';

interface Props {
  /** Config in display order (from app context). */
  config: { id: QuickActionId; enabled: boolean }[];
  onToggle: (id: QuickActionId) => void;
  onMove: (id: QuickActionId, dir: -1 | 1) => void;
}

export function QuickBlocksSection({ config, onToggle, onMove }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text style={styles.heading}>{t('settings.quickBlocks')}</Text>
      <View style={styles.card}>
        {config.map((item, index) => {
          const def = QUICK_ACTIONS_REGISTRY[item.id];
          if (!def) return null;
          return (
            <View key={item.id} style={[styles.row, index === config.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{t(def.labelKey)}</Text>
              <View style={styles.rowControls}>
                <Pressable
                  onPress={() => onMove(item.id, -1)}
                  disabled={index === 0}
                  style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                  testID={`move-up-${item.id}`}
                >
                  <Text style={styles.moveButtonText}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => onMove(item.id, 1)}
                  disabled={index === config.length - 1}
                  style={[styles.moveButton, index === config.length - 1 && styles.moveButtonDisabled]}
                  testID={`move-down-${item.id}`}
                >
                  <Text style={styles.moveButtonText}>↓</Text>
                </Pressable>
                <Switch
                  value={item.enabled}
                  onValueChange={() => onToggle(item.id)}
                  testID={`toggle-${item.id}`}
                />
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.textSecondary,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Design.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Design.colors.outlineVariant,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Design.colors.surfaceHigh,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Design.colors.text,
    flex: 1,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Design.colors.surfaceContainer,
  },
  moveButtonDisabled: {
    opacity: 0.35,
  },
  moveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Design.colors.primary,
  },
});
