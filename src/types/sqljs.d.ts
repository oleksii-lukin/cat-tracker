// Минимальные типы для sql.js (пакет не поставляет свои @types).
declare module 'sql.js' {
  interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
  }

  interface Database {
    /** Выполняет один или несколько SQL-statements (без параметров). */
    exec(sql: string): { columns: string[]; values: unknown[][] }[];
    run(sql: string, params?: unknown[]): void;
    prepare(sql: string): Statement;
    close(): void;
  }

  interface SQL {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(config?: unknown): Promise<SQL>;
  export type { Database, Statement, SQL };
}
