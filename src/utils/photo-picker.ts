import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Нет доступа к камере',
      'Разрешите доступ к камере в настройках устройства, чтобы сделать фото.',
    );
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

async function pickFromLibrary(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

export function pickPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Фото',
      'Откуда взять фото?',
      [
        { text: 'Сделать фото', onPress: () => resolve(takePhoto()) },
        { text: 'Из галереи', onPress: () => resolve(pickFromLibrary()) },
        { text: 'Отмена', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
