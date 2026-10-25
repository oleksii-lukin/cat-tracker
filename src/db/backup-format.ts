// Чистая логика резервных копий: имена файлов, заголовок SQLite, архив.
// Без импортов expo — модуль целиком тестируется в Node/jest (fflate работает там же).
import { unzipSync, zipSync } from 'fflate';

import { BACKUP_FILE_PREFIX, PHOTOS_DIR_NAME } from './schema';

/** Имя файла БД внутри архива. */
export const BACKUP_DB_ENTRY = 'cat-tracker.db';

export interface BackupNameInfo {
  date: string; // 2026-10-25
  time: string; // 1432
  appVersion: string; // 1.0.0
  dbVersion: number; // 2
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function sanitizeToken(value: string): string {
  return value.replace(/[^0-9A-Za-z.\-_]/g, '_');
}

/**
 * Имя файла бэкапа: дата+время, версия приложения и версия БД.
 * Версии в имени позволяют показывать метку совместимости в списке без распаковки.
 */
export function buildBackupFileName(now: Date, appVersion: string, dbVersion: number): string {
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}`;
  return `${BACKUP_FILE_PREFIX}${date}_${time}_app${sanitizeToken(appVersion)}_db${dbVersion}.zip`;
}

/** Файл выглядит как наша резервная копия (SAF может убрать .zip — полагаемся на префикс). */
export function isBackupFileName(name: string): boolean {
  return name.startsWith(BACKUP_FILE_PREFIX);
}

const NAME_RE =
  /^CatTracker-backup-(\d{4}-\d{2}-\d{2})_(\d{4})_app([0-9A-Za-z.\-_]+)_db(\d+)(\.zip)?$/;

/** Разбор имени файла бэкапа. null — имя не соответствует шаблону. */
export function parseBackupFileName(name: string): BackupNameInfo | null {
  const m = NAME_RE.exec(name);
  if (!m) return null;
  return {
    date: m[1],
    time: m[2],
    appVersion: m[3],
    dbVersion: Number(m[4]),
  };
}

/** Заголовок SQLite: magic-строка + user_version (байты 60..63, big-endian). */
export interface SqliteHeaderInfo {
  userVersion: number;
}

const SQLITE_MAGIC = 'SQLite format 3\0';

export function readSqliteHeader(bytes: Uint8Array): SqliteHeaderInfo | null {
  if (bytes.length < 64) return null;
  for (let i = 0; i < SQLITE_MAGIC.length; i++) {
    if (bytes[i] !== SQLITE_MAGIC.charCodeAt(i)) return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { userVersion: view.getUint32(60, false) };
}

export interface BackupArchive {
  dbBytes: Uint8Array;
  photos: { name: string; bytes: Uint8Array }[];
}

/** Собирает zip: файл БД + фотографии (store, без сжатия — JPEG и так не сжимается). */
export function createBackupZip(
  dbBytes: Uint8Array,
  photos: { name: string; bytes: Uint8Array }[]
): Uint8Array {
  const files: Record<string, Uint8Array> = { [BACKUP_DB_ENTRY]: dbBytes };
  for (const photo of photos) {
    files[`${PHOTOS_DIR_NAME}/${photo.name}`] = photo.bytes;
  }
  return zipSync(files, { level: 0 });
}

/** Разбирает архив. null — не наш архив (нет файла БД). */
export function readBackupZip(zip: Uint8Array): BackupArchive | null {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(zip);
  } catch {
    return null;
  }
  const dbBytes = files[BACKUP_DB_ENTRY];
  if (!dbBytes) return null;
  const prefix = `${PHOTOS_DIR_NAME}/`;
  const photos = Object.keys(files)
    .filter((name) => name.startsWith(prefix))
    .map((name) => ({ name: name.slice(prefix.length), bytes: files[name] }));
  return { dbBytes, photos };
}

export type BackupCheck =
  | { status: 'ok'; dbVersion: number }
  | { status: 'invalid' }
  | { status: 'incompatible'; dbVersion: number };

/**
 * Проверка архива: валидность + совместимость версий БД.
 * Версия новее текущей — восстановить не сможем, сообщаем о несовместимости.
 */
export function checkBackupArchive(
  archive: BackupArchive | null,
  currentDbVersion: number
): BackupCheck {
  if (!archive) return { status: 'invalid' };
  const header = readSqliteHeader(archive.dbBytes);
  if (!header) return { status: 'invalid' };
  if (header.userVersion > currentDbVersion) {
    return { status: 'incompatible', dbVersion: header.userVersion };
  }
  return { status: 'ok', dbVersion: header.userVersion };
}
