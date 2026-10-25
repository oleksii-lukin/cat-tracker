// Резервные копии: экспорт в ZIP (БД + фотографии) и восстановление.
//
// Локация по умолчанию — Documents/CatTracker_backups (без системных диалогов).
// На Android пользователь может выбрать постоянную папку через SAF — её URI
// хранится в отдельном файле настроек (не в БД!), чтобы восстановление из
// бэкапа не сбрасывало выбранную локацию.
import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import type { SQLiteDatabase } from 'expo-sqlite';

import { bytesToBase64 } from '@/utils/base64';

import {
  type BackupArchive,
  type BackupCheck,
  type BackupNameInfo,
  BACKUP_DB_ENTRY,
  buildBackupFileName,
  checkBackupArchive,
  createBackupZip,
  isBackupFileName,
  parseBackupFileName,
  readBackupZip,
} from './backup-format';
import { BACKUP_DIR_NAME, DATABASE_VERSION, PHOTOS_DIR_NAME } from './schema';

const FOLDER_PREF_FILE = 'backup_folder_uri.txt';
const STAGING_DIR_NAME = 'backup-staging';

/** Текущая папка бэкапов: внутренняя по умолчанию или выбранная пользователем (SAF). */
export type BackupFolder = { kind: 'default' } | { kind: 'saf'; uri: string };

export interface BackupListItem {
  name: string;
  uri: string;
  info: BackupNameInfo | null;
}

export interface BuiltBackup {
  name: string;
  bytes: Uint8Array;
}

/* ---------- Папка бэкапов (предпочтение хранится файлом, не в БД) ---------- */

export function readBackupFolder(): BackupFolder {
  try {
    const file = new File(Paths.document, FOLDER_PREF_FILE);
    if (!file.exists) return { kind: 'default' };
    const uri = file.textSync().trim();
    return uri ? { kind: 'saf', uri } : { kind: 'default' };
  } catch {
    return { kind: 'default' };
  }
}

export function writeBackupFolder(folder: BackupFolder): void {
  const file = new File(Paths.document, FOLDER_PREF_FILE);
  file.create({ overwrite: true });
  file.write(folder.kind === 'saf' ? folder.uri : '');
}

/** Отображаемое имя папки (для SAF-URI вытаскиваем последний сегмент после ':'). */
export function folderDisplayName(folder: BackupFolder): string {
  if (folder.kind === 'default') return BACKUP_DIR_NAME;
  const last = decodeURIComponent(folder.uri.split('/').pop() ?? '');
  const colon = last.indexOf(':');
  return colon >= 0 ? last.slice(colon + 1) : last;
}

/* ---------- Служебное ---------- */

function defaultBackupDir(): Directory {
  const dir = new Directory(Paths.document, BACKUP_DIR_NAME);
  if (!dir.exists) dir.create();
  return dir;
}

function photosDir(): Directory {
  return new Directory(Paths.document, PHOTOS_DIR_NAME);
}

function stagingDir(): Directory {
  const dir = new Directory(Paths.cache, STAGING_DIR_NAME);
  if (!dir.exists) dir.create();
  return dir;
}

function cleanupStaging(): void {
  try {
    const dir = new Directory(Paths.cache, STAGING_DIR_NAME);
    if (dir.exists) dir.delete();
  } catch {
    // best-effort: кэш сам подчистится
  }
}

/** Имя файла из URI (content://-URI может содержать префикс вида primary:). */
function uriName(uri: string): string {
  const last = decodeURIComponent(uri.split('/').pop() ?? '');
  const colon = last.indexOf(':');
  return colon >= 0 ? last.slice(colon + 1) : last;
}

/* ---------- Список бэкапов ---------- */

export async function listBackups(folder: BackupFolder): Promise<BackupListItem[]> {
  const uris: string[] = [];
  if (folder.kind === 'saf') {
    try {
      uris.push(...(await LegacyFileSystem.StorageAccessFramework.readDirectoryAsync(folder.uri)));
    } catch {
      // доступ к папке отозван — показываем пустой список
      return [];
    }
  } else {
    const dir = new Directory(Paths.document, BACKUP_DIR_NAME);
    if (!dir.exists) return [];
    for (const item of dir.list()) {
      if (item instanceof File) uris.push(item.uri);
    }
  }
  const items = uris
    .map((uri) => {
      const name = uriName(uri);
      return { name, uri, info: parseBackupFileName(name) };
    })
    .filter((item) => isBackupFileName(item.name));
  // Имена начинаются с даты — сортировка по имени = новые сверху.
  items.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));
  return items;
}

/* ---------- Экспорт ---------- */

/** Собирает архив: снимок БД (с чекпоинтом WAL) + все фотографии событий. */
export async function buildBackup(db: SQLiteDatabase, appVersion: string): Promise<BuiltBackup> {
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE)');
  const dbBytes = await db.serializeAsync();

  const photos: { name: string; bytes: Uint8Array }[] = [];
  const dir = photosDir();
  if (dir.exists) {
    for (const item of dir.list()) {
      if (item instanceof File) photos.push({ name: item.name, bytes: await item.bytes() });
    }
  }

  const name = buildBackupFileName(new Date(), appVersion, DATABASE_VERSION);
  return { name, bytes: createBackupZip(dbBytes, photos) };
}

/** Записывает архив в текущую папку бэкапов и возвращает фактическое имя/URI. */
export async function writeToFolder(
  folder: BackupFolder,
  name: string,
  bytes: Uint8Array
): Promise<{ name: string; uri: string }> {
  if (folder.kind === 'saf') {
    const base = name.endsWith('.zip') ? name.slice(0, -4) : name;
    const createdUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
      folder.uri,
      base,
      'application/zip'
    );
    await LegacyFileSystem.writeAsStringAsync(createdUri, bytesToBase64(bytes), {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    return { name: uriName(createdUri), uri: createdUri };
  }
  const file = new File(defaultBackupDir(), name);
  file.create({ overwrite: true });
  file.write(bytes);
  return { name, uri: file.uri };
}

export async function exportBackup(
  db: SQLiteDatabase,
  appVersion: string,
  folder: BackupFolder
): Promise<{ name: string; uri: string }> {
  const built = await buildBackup(db, appVersion);
  return writeToFolder(folder, built.name, built.bytes);
}

/* ---------- Чтение и проверка ---------- */

/** Читает архив в байты: SAF content:// — через нативную копию в кэш, иначе напрямую. */
export async function readBackupBytes(uri: string): Promise<Uint8Array> {
  if (uri.startsWith('content://')) {
    const staging = stagingDir();
    const target = new File(staging, `read-${Date.now()}.zip`);
    try {
      await LegacyFileSystem.copyAsync({ from: uri, to: target.uri });
      return await target.bytes();
    } finally {
      if (target.exists) target.delete();
      cleanupStaging();
    }
  }
  return new File(uri).bytes();
}

/** Проверка архива: валидность и совместимость версии БД. */
export function inspectBackup(zipBytes: Uint8Array): BackupCheck {
  return checkBackupArchive(readBackupZip(zipBytes), DATABASE_VERSION);
}

/* ---------- Восстановление ---------- */

/**
 * Подменяет файл БД и фотографии содержимым бэкапа.
 *
 * Важный порядок: сначала готовим файл-кандидат рядом с основной БД, затем
 * закрываем соединение и атомарно переименовываем кандидата на место — окно,
 * в котором основного файла нет, минимально. Миграция до текущей версии
 * выполнится автоматически при следующем открытии (migrateDbIfNeeded).
 */
export async function applyRestore(db: SQLiteDatabase, archive: BackupArchive): Promise<void> {
  const rows = await db.getAllAsync<{ name: string; file: string }>('PRAGMA database_list');
  const mainRow = rows.find((r) => r.name === 'main');
  const mainPath = mainRow?.file;
  if (!mainPath) throw new Error('database path not resolved');
  const mainUri = mainPath.startsWith('file://') ? mainPath : `file://${mainPath}`;
  const candidateUri = `${mainUri}.restore`;

  // Всё асинхронное — до закрытия соединения.
  const candidate = new File(candidateUri);
  candidate.create({ overwrite: true });
  await candidate.write(archive.dbBytes);

  db.closeSync();

  try {
    const target = new File(mainUri);
    if (target.exists) target.delete();
    for (const suffix of ['-wal', '-shm']) {
      const stale = new File(`${mainUri}${suffix}`);
      if (stale.exists) stale.delete();
    }
    candidate.moveSync(target);

    // Фотографии: чистая замена каталога архивом.
    const dir = photosDir();
    if (dir.exists) dir.delete();
    if (archive.photos.length > 0) {
      dir.create();
      for (const photo of archive.photos) {
        const file = new File(dir, photo.name);
        file.create();
        await file.write(photo.bytes);
      }
    }
  } finally {
    cleanupStaging();
    const leftover = new File(candidateUri);
    if (leftover.exists) leftover.delete();
  }
}

/* ---------- Перенос бэкапов при смене папки ---------- */

export async function deleteBackupFile(uri: string): Promise<void> {
  if (uri.startsWith('content://')) {
    await LegacyFileSystem.deleteAsync(uri, { idempotent: true });
  } else {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

export async function moveBackups(
  from: BackupFolder,
  to: BackupFolder
): Promise<{ moved: number; failed: number }> {
  const items = await listBackups(from);
  let moved = 0;
  let failed = 0;
  for (const item of items) {
    try {
      const bytes = await readBackupBytes(item.uri);
      await writeToFolder(to, item.name, bytes);
      await deleteBackupFile(item.uri);
      moved++;
    } catch {
      failed++;
    }
  }
  return { moved, failed };
}

export type { BackupArchive, BackupCheck };
export { BACKUP_DB_ENTRY };
