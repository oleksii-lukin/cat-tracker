import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoatPattern } from '@/components/coat-patterns';
import type { Coat } from '@/constants/coats';

interface Props {
  coat: Coat;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function CoatFrame({ coat, header, children }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF8F3' }}>
      <View
        style={{ paddingTop: insets.top }}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        {headerHeight > 0 ? (
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight }}
            pointerEvents="none"
          >
            <CoatPattern coat={coat} width={width} height={headerHeight} />
          </View>
        ) : null}
        {header}
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFF8F3' }}>{children}</View>
    </View>
  );
}
