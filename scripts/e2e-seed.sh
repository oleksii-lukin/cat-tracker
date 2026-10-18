#!/usr/bin/env bash
# Доставка seed-базы данных на Android-эмулятор. Запускается в WSL
# (adb из WSL видит эмулятор Windows-хоста), из PowerShell — одной командой:
#   wsl -d Ubuntu-24.04 bash /home/alukin/proj/expo/cat-tracker/scripts/e2e-seed.sh week-history
# Сценарии: week-history (по умолчанию) | empty.
#
# Приложение закрывается автоматически (force-stop), переподключать к Metro не нужно —
# dev-клиент хранит URL туннеля и переподключится при следующем запуске (его откроет maestro).
set -euo pipefail

SCENARIO="${1:-week-history}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="cat-tracker-${SCENARIO}.db"
PACKAGE="com.llamerr.cattracker"

case "$SCENARIO" in
  empty|week-history) ;;
  *) echo "Неизвестный сценарий: $SCENARIO (доступные: empty | week-history)" >&2; exit 1 ;;
esac

echo "==> Генерация seed-БД (сценарий '$SCENARIO')..."
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "$PROJECT_DIR/scripts/e2e-seed.mjs" "$SCENARIO" "/tmp/$DB_NAME"

echo "==> Остановка приложения и очистка старой БД..."
adb shell am force-stop "$PACKAGE"
adb shell "run-as $PACKAGE sh -c 'rm -f files/SQLite/cat-tracker.db*'"

echo "==> Установка seed-БД..."
# adb в этом окружении — Windows adb.exe (симлинк), а не нативный Linux-adb:
# он не понимает WSL-пути /tmp/... . Интероп WSL обычно переводит их в UNC сам,
# но не во всех контекстах запуска — переводим путь явно через wslpath.
ADB_SRC="/tmp/$DB_NAME"
if adb version 2>/dev/null | grep -qiE '\.exe|installed as [a-z]:\\'; then
  ADB_SRC="$(wslpath -w "$ADB_SRC")"
fi
adb push "$ADB_SRC" "/data/local/tmp/$DB_NAME"
# cat через stdout: файл становится owned by uid приложения.
adb shell "run-as $PACKAGE sh -c 'cat /data/local/tmp/$DB_NAME > files/SQLite/cat-tracker.db'"
# /data/local/tmp принадлежит shell — удаляем без run-as.
adb shell rm -f "/data/local/tmp/$DB_NAME"
adb shell "run-as $PACKAGE sh -c 'ls -la files/SQLite/'"

echo ""
echo "Готово: БД '$SCENARIO' установлена. Запускайте флоу Maestro."
