import React, { createContext, useCallback, useContext, useState } from 'react';
import { SQLiteProvider, type SQLiteProviderProps } from 'expo-sqlite';

type ReloadFn = () => void;

const DbReloadContext = createContext<ReloadFn>(() => {});

/** Перезапускает дерево от <SQLiteProvider> — используйте после подмены файла БД. */
export function useDbReload(): ReloadFn {
  return useContext(DbReloadContext);
}

/**
 * SQLiteProvider с возможностью горячего перезапуска: смена key размонтирует
 * провайдер (закрытие соединения) и открывает файл заново — onInit
 * (migrateDbIfNeeded) выполнится на новом содержимом файла, поэтому
 * восстановление из бэкапа мигрирует данные штатным механизмом миграций.
 */
export function ReloadableSQLiteProvider({
  children,
  ...props
}: Omit<SQLiteProviderProps, 'useSuspense'>) {
  const [dbKey, setDbKey] = useState(0);
  const reload = useCallback(() => setDbKey((key) => key + 1), []);

  return (
    <DbReloadContext.Provider value={reload}>
      <SQLiteProvider key={dbKey} {...props}>
        {children}
      </SQLiteProvider>
    </DbReloadContext.Provider>
  );
}
