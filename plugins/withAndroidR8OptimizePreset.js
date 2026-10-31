// Временный шим для Expo SDK 57.
//
// Шаблон SDK 57 генерирует в release-сборке
//   proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
// а proguard-android.txt содержит -dontoptimize: даже при включённом minify R8 не
// оптимизирует код, и Google Play ставит низкий балл «Оптимизация DEX-кода»
// (https://developer.android.com/topic/performance/vitals/code-optimization).
//
// Плагин переключает пресет на proguard-android-optimize.txt. Флаги
// android.enableMinifyInReleaseBuilds / android.enableShrinkResourcesInReleaseBuilds
// задаются отдельно — см. "expo-build-properties" в app.json.
//
// На SDK 58+ шаблон сам использует proguard-android-optimize.txt и включает minify
// по умолчанию, поэтому этот файл и его запись в app.json можно удалить.
// После удаления проверить android/app/build.gradle после `npx expo prebuild --clean -p android`.

const { withAppBuildGradle } = require('expo/config-plugins');

const LEGACY_PRESET_PATTERN = /getDefaultProguardFile\(\s*["']proguard-android\.txt["']\s*\)/g;

const withAndroidR8OptimizePreset = (config) =>
  withAppBuildGradle(config, (configMod) => {
    // Идемпотентно: если пресет уже proguard-android-optimize.txt, замены не будет.
    configMod.modResults.contents = configMod.modResults.contents.replace(
      LEGACY_PRESET_PATTERN,
      'getDefaultProguardFile("proguard-android-optimize.txt")'
    );
    return configMod;
  });

module.exports = withAndroidR8OptimizePreset;
