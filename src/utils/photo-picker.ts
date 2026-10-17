import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import i18n from '@/i18n';

async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      i18n.t('photo.cameraDeniedTitle'),
      i18n.t('photo.cameraDeniedMessage'),
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
      i18n.t('photo.title'),
      i18n.t('photo.message'),
      [
        { text: i18n.t('photo.take'), onPress: () => resolve(takePhoto()) },
        { text: i18n.t('photo.library'), onPress: () => resolve(pickFromLibrary()) },
        { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
