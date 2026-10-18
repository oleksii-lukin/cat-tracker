import type { SQLiteDatabase } from 'expo-sqlite';
import initSqlJs from 'sql.js';
import type { SQL } from 'sql.js';

// sql.js (WASM-SQLite) реализует подмножество API, используемое в src/db:
// execAsync / runAsync / getAllAsync / getFirstAsync. Тесты гоняют НАСТОЯЩИЙ SQL
// из repositories.ts и migrate.ts на настоящем SQLite, без нативного модуля.

let sqlPromise: Promise<SQL> | null = null;

async function getSql(): Promise<SQL> {
  sqlPromise ??= initSqlJs();
  return sqlPromise;
}

/** Экспо-синхронит принимает параметры как varargs или одним массивом — нормализуем. */
function normalizeParams(params: unknown[]): unknown[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0] as unknown[];
  }
  return params;
}

export async function createTestDb(): Promise<SQLiteDatabase> {
  const SQL = await getSql();
  const db = new SQL.Database();

  const wrapper = {
    execAsync: async (sql: string): Promise<void> => {
      db.exec(sql);
    },

    runAsync: async (sql: string, ...params: unknown[]): Promise<void> => {
      const p = normalizeParams(params);
      db.run(sql, p.length > 0 ? p : undefined);
    },

    getAllAsync: async <T>(sql: string, ...params: unknown[]): Promise<T[]> => {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        const rows: T[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject() as T);
        }
        return rows;
      } finally {
        stmt.free();
      }
    },

    getFirstAsync: async <T>(sql: string, ...params: unknown[]): Promise<T | null> => {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(normalizeParams(params));
        if (!stmt.step()) return null;
        return stmt.getAsObject() as T;
      } finally {
        stmt.free();
      }
    },
  };

  return wrapper as unknown as SQLiteDatabase;
}

/** Закрывает все созданные БД между тестами не требует — in-memory БД живут до выхода процесса. */
export async function createMigratedTestDb(): Promise<SQLiteDatabase> {
  const { migrateDbIfNeeded } = await import('@/db/migrate');
  const db = await createTestDb();
  await migrateDbIfNeeded(db);
  return db;
}
