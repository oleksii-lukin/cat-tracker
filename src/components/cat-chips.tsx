import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { CatAvatar } from '@/components/cat-avatar';
import { getCoat } from '@/constants/coats';
import type { Cat } from '@/types/domain';

interface Props {
  cats: Cat[];
  currentCatId: string | null;
  onSelect: (id: string) => void;
}

export function CatChips({ cats, currentCatId, onSelect }: Props) {
  if (cats.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
    >
      {cats.map((cat) => {
        const coat = getCoat(cat.color);
        const active = cat.id === currentCatId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            testID={`cat-chip-${cat.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active ? coat.accentSoft : '#FFFFFF',
              borderWidth: active ? 1.5 : 1,
              borderColor: active ? coat.accent : '#DDC0B7',
            }}
          >
            <CatAvatar coat={coat} name={cat.name} size={24} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '700' : '600',
                color: active ? coat.accent : '#56423C',
              }}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
