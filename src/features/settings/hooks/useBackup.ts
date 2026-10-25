import * as Application from 'expo-application';
import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import { useDbReload } from '@/context/reload-context';
import {
  type BackupArchive,
  type BackupFolder,
  type BackupListItem,
  applyRestore,
  buildBackup,
  exportBackup,
  inspectBackup,
  listBackups,
  moveBackups,
  readBackupBytes,
  readBackupFolder,
  writeBackupFolder,
} from '@/db/backup';
import { readBackupZip } from '@/db/backup-format';

export type BackupBusy = 'export' | 'share' | 'restore' | 'folder' | null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useBackup() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const reload = useDbReload();

  const [busy, setBusy] = useState<BackupBusy>(null);
  const [folder, setFolder] = useState<BackupFolder>(() => readBackupFolder());
  const [backups, setBackups] = useState<BackupListItem[]>([]);

  const refresh = useCallback(async (target: BackupFolder) => {
    try {
      setBackups(await listBackups(target));
    } catch {
      setBackups([]);
    }
  }, []);

  // Первичная загрузка списка + после смены папки.
  useEffect(() => {
    let cancelled = false;
    listBackups(folder).then(
      (items) => {
        if (!cancelled) setBackups(items);
      },
      () => {
        if (!cancelled) setBackups([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [folder]);

  const showError = useCallback(
    (message: string) => {
      Alert.alert(t('settings.backup.errorTitle'), message);
    },
    [t]
  );

  const runExport = useCallback(async () => {
    if (busy) return;
    setBusy('export');
    try {
      const appVersion = Application.nativeApplicationVersion ?? 'unknown';
      const result = await exportBackup(db, appVersion, folder);
      await refresh(folder);
      Alert.alert(
        t('settings.backup.exportTitle'),
        t('settings.backup.exportDone', { name: result.name }),
        [{ text: t('settings.backup.ok') }]
      );
    } catch (error) {
      showError(t('settings.backup.exportFailed', { message: errorMessage(error) }));
    } finally {
      setBusy(null);
    }
  }, [busy, db, folder, refresh, showError, t]);

  const runShare = useCallback(async () => {
    if (busy) return;
    setBusy('share');
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showError(t('settings.backup.shareUnavailable'));
        return;
      }
      const appVersion = Application.nativeApplicationVersion ?? 'unknown';
      const built = await buildBackup(db, appVersion);
      const dir = new Directory(Paths.cache, 'share');
      if (!dir.exists) dir.create();
      const file = new File(dir, built.name);
      file.create({ overwrite: true });
      file.write(built.bytes);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/zip',
        dialogTitle: t('settings.backup.share'),
      });
    } catch (error) {
      showError(t('settings.backup.exportFailed', { message: errorMessage(error) }));
    } finally {
      setBusy(null);
    }
  }, [busy, db, showError, t]);

  const applyArchive = useCallback(
    async (archive: BackupArchive) => {
      try {
        await applyRestore(db, archive);
      } catch (error) {
        showError(t('settings.backup.restoreFailed', { message: errorMessage(error) }));
        reload(); // файл мог быть заменён частично — переоткрываем и мигрируем
        return;
      }
      reload();
    },
    [db, reload, showError, t]
  );

  const confirmAndRestore = useCallback(
    (zipBytes: Uint8Array, displayName: string) => {
      const check = inspectBackup(zipBytes);
      if (check.status === 'invalid') {
        showError(t('settings.backup.notBackup'));
        return;
      }
      if (check.status === 'incompatible') {
        Alert.alert(
          t('settings.backup.incompatibleTitle'),
          t('settings.backup.incompatible', { dbVersion: check.dbVersion })
        );
        return;
      }
      const archive = readBackupZip(zipBytes);
      if (!archive) {
        showError(t('settings.backup.notBackup'));
        return;
      }
      Alert.alert(
        t('settings.backup.confirmTitle'),
        t('settings.backup.confirmMessage', { name: displayName }),
        [
          { text: t('settings.backup.cancel'), style: 'cancel' },
          {
            text: t('settings.backup.confirmOk'),
            style: 'destructive',
            onPress: () => {
              setBusy('restore');
              void applyArchive(archive);
            },
          },
        ]
      );
    },
    [applyArchive, showError, t]
  );

  const runRestore = useCallback(
    async (item: BackupListItem) => {
      if (busy) return;
      setBusy('restore');
      try {
        const bytes = await readBackupBytes(item.uri);
        setBusy(null);
        confirmAndRestore(bytes, item.name);
      } catch (error) {
        setBusy(null);
        showError(t('settings.backup.restoreFailed', { message: errorMessage(error) }));
      }
    },
    [busy, confirmAndRestore, showError, t]
  );

  const runManualImport = useCallback(async () => {
    if (busy) return;
    setBusy('restore');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['application/zip', 'application/octet-stream'],
      });
      const uri = result.canceled ? null : result.assets?.[0]?.uri;
      if (!uri) {
        setBusy(null);
        return;
      }
      const bytes = await new File(uri).bytes();
      setBusy(null);
      confirmAndRestore(bytes, result.assets?.[0]?.name ?? 'backup.zip');
    } catch (error) {
      setBusy(null);
      showError(t('settings.backup.restoreFailed', { message: errorMessage(error) }));
    }
  }, [busy, confirmAndRestore, showError, t]);

  const persistFolder = useCallback(
    (next: BackupFolder) => {
      writeBackupFolder(next);
      setFolder(next);
      void refresh(next);
    },
    [refresh]
  );

  const runChangeFolder = useCallback(async () => {
    if (busy || Platform.OS !== 'android') return;
    setBusy('folder');
    try {
      const initial = folder.kind === 'saf' ? folder.uri : null;
      const permission = await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
        initial
      );
      if (!permission.granted) return;
      const next: BackupFolder = { kind: 'saf', uri: permission.directoryUri };
      const existing = await listBackups(folder);
      if (existing.length === 0) {
        persistFolder(next);
        return;
      }
      Alert.alert(
        t('settings.backup.moveTitle'),
        t('settings.backup.moveMessage', { count: existing.length }),
        [
          { text: t('settings.backup.cancel'), style: 'cancel' },
          {
            text: t('settings.backup.moveSkip'),
            onPress: () => persistFolder(next),
          },
          {
            text: t('settings.backup.moveOk'),
            onPress: () => {
              void (async () => {
                try {
                  const result = await moveBackups(folder, next);
                  persistFolder(next);
                  if (result.failed > 0) {
                    showError(
                      t('settings.backup.moveFailed', {
                        moved: result.moved,
                        failed: result.failed,
                      })
                    );
                  }
                } catch (error) {
                  showError(errorMessage(error));
                }
              })();
            },
          },
        ]
      );
    } catch (error) {
      showError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }, [busy, folder, persistFolder, showError, t]);

  return {
    busy,
    folder,
    backups,
    isDefaultFolder: folder.kind === 'default',
    canChangeFolder: Platform.OS === 'android',
    exportBackup: runExport,
    shareBackup: runShare,
    restoreBackup: runRestore,
    importManually: runManualImport,
    changeFolder: runChangeFolder,
  };
}
