import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import { getEventDef } from '@/domain/events';
import { eventLabel } from '@/i18n/event-label';
import type { EventType, Sex } from '@/types/domain';

interface Props {
  visible: boolean;
  /** All event types to offer, in display order. */
  types: EventType[];
  /** Currently visible types. */
  enabled: Set<EventType>;
  /** Sex of the active cat — selects the gendered label variant. */
  sex: Sex;
  onToggle: (type: EventType) => void;
  onClose: () => void;
}

/**
 * Bottom sheet for the stats filter: one independent toggle per event type.
 * Changes apply immediately, so there is no explicit save button.
 */
export function StatsFilterSheet({ visible, types, enabled, sex, onToggle, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} testID="stats-filter-backdrop">
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          testID="stats-filter-sheet"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('stats.filterTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8} testID="stats-filter-close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <View>
            {types.map((type, index) => {
              const def = getEventDef(type);
              return (
                <View
                  key={type}
                  style={[styles.row, index === types.length - 1 && styles.rowLast]}
                >
                  <Text style={styles.emoji}>{def.emoji}</Text>
                  <Text style={styles.rowLabel}>{eventLabel(t, def.labelKey, sex)}</Text>
                  <Switch
                    value={enabled.has(type)}
                    onValueChange={() => onToggle(type)}
                    testID={`stats-filter-${type}`}
                  />
                </View>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,27,21,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Design.colors.background,
    borderTopLeftRadius: Design.radius.sheet,
    borderTopRightRadius: Design.radius.sheet,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Design.colors.text,
  },
  close: {
    fontSize: 15,
    color: Design.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Design.colors.surfaceHigh,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  emoji: {
    fontSize: 18,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Design.colors.text,
  },
});
