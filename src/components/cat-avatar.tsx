import { Text, View } from 'react-native';

import type { Coat } from '@/constants/coats';

interface Props {
  coat: Coat;
  name: string;
  size?: number;
}

export function CatAvatar({ coat, name, size = 28 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: coat.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: coat.onAccent,
          fontSize: Math.round(size * 0.42),
          fontWeight: '700',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
