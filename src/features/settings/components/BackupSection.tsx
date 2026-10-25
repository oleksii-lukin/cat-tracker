import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Design } from '@/constants/design';
import type { BackupFolder, BackupListItem } from '@/db/backup';
import { folderDisplayName } from '@/db/backup';
import { DATABASE_VERSION } from '@/db/schema';

import type { BackupBusy } from '../hooks/useBackup';

interface Props {
  busy: BackupBusy;
  folder: BackupFolder;
  backups: BackupListItem[];
  isDefaultFolder: boolean;
  canChangeFolder: boolean;
  onExport: () => void;
  onShare: () => void;
  onRestore: (item: BackupListItem) => void;
  onManualImport: () => void;
  onChangeFolder: () => void;
}

function formatTime(time: string): string {
  return time.length === 4 ? `${time.slice(0, 2)}:${time.slice(2)}` : time;
}

export function BackupSection({
  busy,
  folder,
  backups,
  isDefaultFolder,
  canChangeFolder,
  onExport,
  onShare,
  onRestore,
  onManualImport,
  onChangeFolder,
}: Props) {
  const { t } = useTranslation();
  const folderLabel = t('settings.backup.folderLabel', {
    folder: isDefaultFolder ? t('settings.backup.folderDefault') : folderDisplayName(folder),
  });

  return (
    <>
      <Text style={styles.heading}>{t('settings.backup.section')}</Text>

      <View style={styles.card}>
        <Pressable
          onPress={onExport}
          disabled={busy !== null}
          style={styles.row}
          testID="backup-export"
        >
          <Text style={styles.rowLabel}>{t('settings.backup.create')}</Text>
          {busy === 'export' ? <ActivityIndicator color={Design.colors.primary} /> : null}
        </Pressable>

        {canChangeFolder ? (
          <Pressable
            onPress={onChangeFolder}
            disabled={busy !== null}
            style={styles.row}
            testID="backup-folder"
          >
            <Text style={styles.rowLabel}>{t('settings.backup.changeFolder')}</Text>
            {busy === 'folder' ? <ActivityIndicator color={Design.colors.primary} /> : null}
          </Pressable>
        ) : null}

        <Text style={styles.folderText}>{folderLabel}</Text>

        {isDefaultFolder ? (
          <View style={styles.warning} testID="backup-warning">
            <Text style={styles.warningText}>{t('settings.backup.warning')}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.heading}>{t('settings.backup.restoreHeading')}</Text>

      <View style={styles.card}>
        {backups.length === 0 ? (
          <Text style={styles.empty}>{t('settings.backup.empty')}</Text>
        ) : (
          backups.map((item, index) => {
            const newer = item.info !== null && item.info.dbVersion > DATABASE_VERSION;
            const main = item.info
              ? `${item.info.date} ${formatTime(item.info.time)}`
              : item.name;
            const meta = item.info
              ? t('settings.backup.itemMeta', { appVersion: item.info.appVersion })
              : '';
            return (
              <Pressable
                key={item.uri}
                onPress={() => onRestore(item)}
                disabled={busy !== null}
                style={[styles.row, index === backups.length - 1 && styles.rowLast]}
                testID={`backup-item-${index}`}
              >
                <View style={styles.itemBody}>
                  <Text style={styles.rowLabel}>{main}</Text>
                  <Text style={styles.itemMeta}>
                    {meta}
                    {newer ? (
                      <Text style={styles.newerBadge}>
                        {' · '}
                        {t('settings.backup.newer')}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })
        )}

        <Pressable
          onPress={onManualImport}
          disabled={busy !== null}
          style={[styles.row, styles.rowAction]}
          testID="backup-import-manual"
        >
          <Text style={styles.rowLabel}>{t('settings.backup.manual')}</Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          disabled={busy !== null}
          style={[styles.row, styles.rowLast]}
          testID="backup-share"
        >
          <Text style={styles.rowLabel}>{t('settings.backup.share')}</Text>
          {busy === 'share' ? <ActivityIndicator color={Design.colors.primary} /> : null}
        </Pressable>
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
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Design.colors.surfaceHigh,
  },
  rowAction: {
    marginTop: 4,
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
  itemBody: {
    flex: 1,
  },
  itemMeta: {
    fontSize: 12,
    color: Design.colors.textSecondary,
    marginTop: 2,
  },
  newerBadge: {
    color: '#B45309',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 14,
    color: '#A49C93',
  },
  folderText: {
    fontSize: 12,
    color: Design.colors.textSecondary,
    paddingVertical: 8,
  },
  warning: {
    backgroundColor: '#FDF3DC',
    borderColor: '#E5B451',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#8A5A00',
  },
  empty: {
    fontSize: 13,
    color: '#A49C93',
    paddingVertical: 10,
  },
});
