import { zipSync } from 'fflate';
import initSqlJs from 'sql.js';

import {
  BACKUP_DB_ENTRY,
  buildBackupFileName,
  checkBackupArchive,
  createBackupZip,
  isBackupFileName,
  parseBackupFileName,
  readBackupZip,
  readSqliteHeader,
} from '@/db/backup-format';

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

describe('buildBackupFileName / parseBackupFileName', () => {
  it('roundtrip: имя собирается и разбирается обратно', () => {
    const now = new Date(2026, 9, 25, 14, 32); // 25.10.2026 14:32
    const name = buildBackupFileName(now, '1.0.0', 2);
    expect(name).toBe('CatTracker-backup-2026-10-25_1432_app1.0.0_db2.zip');
    expect(parseBackupFileName(name)).toEqual({
      date: '2026-10-25',
      time: '1432',
      appVersion: '1.0.0',
      dbVersion: 2,
    });
  });

  it('однозначные цифры: месяцы и часы с ведущим нулём', () => {
    const now = new Date(2026, 0, 5, 7, 5);
    const name = buildBackupFileName(now, '2.10.1', 3);
    expect(name).toContain('-01-05_0705_');
    expect(parseBackupFileName(name)?.dbVersion).toBe(3);
  });

  it('нечётные значения версии экранируются в имени', () => {
    const name = buildBackupFileName(new Date(2026, 9, 25, 0, 0), '1.0.0 beta/1', 2);
    expect(name).toContain('_app1.0.0_beta_1_db2.zip');
    expect(parseBackupFileName(name)?.appVersion).toBe('1.0.0_beta_1');
  });

  it('parse возвращает null для чужого имени', () => {
    expect(parseBackupFileName('holiday.zip')).toBeNull();
    expect(parseBackupFileName('CatTracker-backup-broken.zip')).toBeNull();
  });

  it('isBackupFileName — по префиксу (SAF может убрать .zip)', () => {
    expect(isBackupFileName('CatTracker-backup-2026-10-25_1432_app1.0.0_db2.zip')).toBe(true);
    expect(isBackupFileName('CatTracker-backup-2026-10-25_1432_app1.0.0_db2')).toBe(true);
    expect(isBackupFileName('other.zip')).toBe(false);
  });
});

describe('readSqliteHeader', () => {
  it('читает user_version из настоящего файла SQLite', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('CREATE TABLE t (x)');
    db.run('PRAGMA user_version = 5');
    const bytes = db.export();
    expect(readSqliteHeader(bytes)).toEqual({ userVersion: 5 });
    db.close();
  });

  it('null для не-SQLite данных и слишком коротких буферов', () => {
    expect(readSqliteHeader(utf8('это не база данных, а просто текст подлиннее'))).toBeNull();
    expect(readSqliteHeader(new Uint8Array(10))).toBeNull();
  });
});

describe('архив бэкапа', () => {
  it('roundtrip: БД + фотографии переживают zip', () => {
    const dbBytes = utf8('sqlite-bytes');
    const photos = [
      { name: 'event-1.jpg', bytes: utf8('photo-one') },
      { name: 'event-2.jpg', bytes: utf8('photo-two') },
    ];
    const archive = readBackupZip(createBackupZip(dbBytes, photos));
    expect(archive).not.toBeNull();
    expect(archive!.dbBytes).toEqual(dbBytes);
    expect(archive!.photos.map((p) => p.name).sort()).toEqual(['event-1.jpg', 'event-2.jpg']);
    expect(archive!.photos.find((p) => p.name === 'event-1.jpg')!.bytes).toEqual(utf8('photo-one'));
  });

  it('без файла БД внутри — не наш архив', () => {
    const foreign = zipSync({ 'readme.txt': utf8('hello') });
    expect(readBackupZip(foreign)).toBeNull();
    expect(readBackupZip(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it('имя БД в архиве — константа cat-tracker.db', () => {
    expect(BACKUP_DB_ENTRY).toBe('cat-tracker.db');
  });
});

describe('checkBackupArchive', () => {
  async function makeArchive(userVersion: number) {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('CREATE TABLE t (x)');
    db.run(`PRAGMA user_version = ${userVersion}`);
    const bytes = db.export();
    db.close();
    return readBackupZip(createBackupZip(bytes, []));
  }

  it('ok: версия БД в бэкапе <= текущей', async () => {
    const archive = await makeArchive(2);
    expect(checkBackupArchive(archive, 2)).toEqual({ status: 'ok', dbVersion: 2 });
    expect(checkBackupArchive(archive, 3)).toEqual({ status: 'ok', dbVersion: 2 });
  });

  it('incompatible: версия БД в бэкапе новее текущей', async () => {
    const archive = await makeArchive(7);
    expect(checkBackupArchive(archive, 2)).toEqual({ status: 'incompatible', dbVersion: 7 });
  });

  it('invalid: мусор вместо архива или битая БД', () => {
    expect(checkBackupArchive(null, 2)).toEqual({ status: 'invalid' });
    const notSqlite = readBackupZip(createBackupZip(utf8('просто текст'), []));
    expect(checkBackupArchive(notSqlite, 2)).toEqual({ status: 'invalid' });
  });
});
