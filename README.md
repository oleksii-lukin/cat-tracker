# Cat Tracker

Локальный дневник пищевого поведения и туалета кошек на React Native (Expo). Владелец за 1–2 тапа фиксирует, когда и сколько кошка ела, писала и какала — чтобы отслеживать динамику (запоры, отравления, стресс) и показать врачу точную историю вместо «по-моему, ест мало».

## Цели

1. **Фиксация за 1–2 клика** — без клавиатуры в основном потоке: кнопка действия + тапы по преднастроенным характеристикам.
2. **Самостоятельное обнаружение проблем** — лента дней и статистика позволяют увидеть изменения в динамике самому.
3. **Выгрузка врачу** — структурированные поля (стул, объём, корм + количество) и хронология с деталями.
4. Фаза 2 (вне текущей версии): синхронизация между устройствами, ИИ-подсказки «когда что-то не так», хранение медицинских документов.

## Функции фазы 1

- **Коты**: несколько профилей (имя, пол, дата рождения, цвет), вес с историей изменений; переключение свайпом/чипсами, акцент интерфейса в цвете кота.
- **3 действия** с характеристиками: поела (корм из пресетов + количество степперами), пописяла (объём: мало/нормально/много), покакала (стул: норма/тугой-сухой/жидкий/необычный); фото опционально.
- **Заметки** — неограниченное количество свободных записей с опциональным временем, карточками в ленте дня.
- **События**: дата обязательна, время опционально; флаг «неточное» (сомнение в дне/времени/коте); кнопка «Повторить».
- **Дневник**: лента дней с догрузкой истории, редактирование/удаление в один тап.
- **Статистика**: неделя/месяц, счётчики событий по дням, переход в день.
- **Корма**: пресеты из коробки (мокрый — ложки, сухой — граммы), свои добавляются/заменяются.

Явно **не** в фазе 1: синхронизация, ИИ, меддокументы, тёмная тема, i18n, будущие события-планы.

## Стек и запуск

- Expo SDK 57, React Native 0.86, Expo Router (табы: Дневник / Статистика / Настройки), NativeWind + gluestack-ui v5.
- Хранение — **локальное**, `expo-sqlite`; схема сразу sync-ready (UUID, `updated_at`, мягкие удаления) — синхронизация будет добавлена позже без миграций данных.
- Фото — `expo-image-picker`, файлы в documents-каталоге.

```bash
npx expo install   # зависимости (expo-sqlite, expo-image-picker, expo-file-system и др.)
npx expo start     # dev-сервер
eas build          # сборка в облаке (EAS)
```

## Тестирование

Два уровня: юнит-тесты (Jest, бегут локально в Node) и e2e-тесты (Maestro, на Android-эмуляторе).

### Юнит-тесты (в WSL)

```bash
npx expo install jest-expo jest @types/jest @testing-library/react-native @react-native/jest-preset
npm i -D sql.js
npm test              # или: npx jest
npx jest --watch      # режим наблюдения
npx jest src/db       # только тесты БД
```

Что покрыто:

- `src/utils/__tests__/dates.test.ts` — dayKey/addDays через границы месяца/года/високосный, формат времени и веса, ru-метки;
- `src/utils/__tests__/id.test.ts` — формат и уникальность uuid, nowIso;
- `src/db/__tests__/migrate.test.ts` — свежая БД (таблицы, индексы, сид пресетов, user_version), идемпотентность, миграция v1→v2 (day_notes → notes);
- `src/db/__tests__/repositories.test.ts` — CRUD + soft-delete всех сущностей, сортировки, `getDaySummaries` (бакеты kind+unit, fallback, суммы), `localizePresetFeeds` (не трогает пользовательские имена), meta-upsert;
- `src/components/__tests__/cat-chips.test.tsx` — smoke-тест RNTL.

База в тестах — реальный SQLite (sql.js/WASM) через `src/db/__tests__/test-db.ts`; нативный модуль не нужен.

### E2E (Maestro, Android)

Схема: dev-сборка на эмуляторе Windows + Metro из WSL через туннель. **Maestro CLI ставится и запускается на Windows-стороне** (рядом с эмулятором), флоу лежат в [`e2e/`](./e2e/).

**Один раз — настройка:**

1. WSL: `npm install` (см. юнит-тесты), затем `npx eas-cli@latest login` и сборка dev-APK:
   ```bash
   npx eas-cli@latest build --profile development --platform android
   ```
2. Windows: скачайте APK по ссылке из вывода EAS и установите на эмулятор:
   ```powershell
   adb install path\to\app.apk
   ```
   Если `INSTALL_FAILED_INSUFFICIENT_STORAGE` — освободите место на AVD (Device Manager → Edit AVD → Advanced Settings → Internal Storage ≥ 4096) или соберите arm64-only APK (см. «Нюансы»).
3. Windows: установите **Java 17+** (обязательно для Maestro): `winget install EclipseAdoptium.Temurin.21.JDK`, затем **Maestro CLI через GitHub-releases** (старая команда `iwr https://get.maestro.mobile.dev | iex` для Windows не работает — URL отдаёт bash-скрипт):
   ```powershell
   cd $env:USERPROFILE\Downloads
   curl.exe -LO https://github.com/mobile-dev-inc/Maestro/releases/latest/download/maestro.zip
   Expand-Archive -Force .\maestro.zip -DestinationPath C:\maestro
   # добавить в PATH (PowerShell-эквивалент; не копируйте setx "%PATH%" из офиц. доки — ломает PATH):
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";C:\maestro\bin", "User")
   # перезапустить терминал и проверить:
   maestro --version
   ```
4. Один раз откройте приложение на эмуляторе вручную и подключите его к Metro из WSL (`npx expo start --tunnel`) — dev-клиент запомнит URL.

**Каждый прогон:**

1. WSL: `npx expo start --tunnel` (туннель должен работать — эмулятор подключён к нему).
2. Windows (PowerShell) — запуск из **локального** каталога (UNC `\\wsl.localhost\...` не может быть рабочим каталогом для Java/cmd):
   ```powershell
   cd $env:USERPROFILE
   maestro test "\\wsl.localhost\Ubuntu-24.04\home\alukin\proj\expo\cat-tracker\e2e"
   ```
   Надёжная альтернатива — зеркало флоу на диск Windows:
   ```powershell
   robocopy \\wsl.localhost\Ubuntu-24.04\home\alukin\proj\expo\cat-tracker\e2e C:\cat-tracker\e2e /MIR
   cd C:\cat-tracker\e2e
   maestro test .
   ```
   Имя дистрибутива (`Ubuntu-24.04`) можно узнать так: `wsl.exe -l -q`. По одному флоу: `maestro test <путь>\01_first_cat.yaml`.

Флоу (критический путь, запускаются по порядку):

- `e2e/01_first_cat.yaml` — добавление первого кота (идемпотентен: пропускает шаг, если кот уже есть);
- `e2e/02_add_feeding.yaml` — запись кормления через «Быструю запись», карточка события в ленте;
- `e2e/03_stats.yaml` — сводка за сегодня на вкладке «Статистика»;
- `e2e/04_quick_blocks.yaml` — включение/выключение быстрых блоков;
- `e2e/05_edit_event.yaml` — редактирование события в EventSheet;
- `e2e/06_cat_switching.yaml` — переключение котов, изоляция данных, удаление текущего кота.

### Сброс и seed состояния для e2e

Стартовое состояние флоу не очищается автоматически (`clearState` стирает URL Metro у dev-клиента) — БД живёт между прогонами, а флоу идемпотентны. Для воспроизводимых прогонов состояние сбрасывается/наполняется вручную.

**Сброс к пустой БД** (dev-сборка debuggable, root не нужен):

```powershell
adb shell am force-stop com.llamerr.cattracker
adb shell "run-as com.llamerr.cattracker sh -c 'rm -f files/SQLite/cat-tracker.db*'"
```

При следующем запуске миграция (`migrateDbIfNeeded`) пересоздаст схему и засеет пресеты-корма.

**Seed сценариями** — генерация fixture-БД на sql.js (тот же источник DDL, что и в приложении: `src/db/schema.ts`). Одна команда из любого каталога PowerShell — скрипт работает целиком в WSL (adb из WSL видит эмулятор Windows-хоста), никаких настроек политики выполнения не требуется:

```powershell
# week-history (по умолчанию): коты «Тестя», «Маркиз», «Дуся» + история за 7 дней
wsl -d Ubuntu-24.04 bash /home/alukin/proj/expo/cat-tracker/scripts/e2e-seed.sh

# empty: только схема и пресеты, журнал пуст
wsl -d Ubuntu-24.04 bash /home/alukin/proj/expo/cat-tracker/scripts/e2e-seed.sh empty
```

Скрипт генерирует БД, останавливает приложение (`force-stop`), устанавливает БД через `run-as`. Переподключать к Metro не нужно: dev-клиент хранит URL туннеля и переподключится сам при следующем запуске (его откроет maestro). Переподключение вручную требуется только после перезапуска `expo start --tunnel` (новый URL) или после установки APK. «Прошедшее время» моделируется датами в строках (события за `today-N`), а не переводом часов устройства.

Сценарии определяются в `scripts/e2e-seed.mjs` (`SCENARIOS`) — новый сценарий добавляется функцией, вставляющей строки через API sql.js.

Нюансы:

- **Язык интерфейса должен быть русским** — флоу матчат русские тексты (язык устройства эмулятора или настройка в приложении).
- `clearState` в флоу не используется: он стирает сохранённый URL Metro у dev-клиента, после чего `launchApp` показывает экран лаунчера вместо приложения.
- Если туннель упал/перезапустился — перезапустите `expo start --tunnel` и переподключите dev-клиент (флейки e2e чаще всего из-за этого).

## Документация

- [GLOSSARY.md](./GLOSSARY.md) — доменные термины (Кот, Действие, Событие, Заметка…).
- [docs/adr/](./docs/adr/) — ключевые архитектурные и продуктовые решения (локальное хранение, три действия, отсутствие статусов дней, алиас `@`).
