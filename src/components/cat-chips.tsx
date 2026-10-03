import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
        const active = cat.id === currentCatId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active ? `${cat.color}22` : '#FCF2E8',
              borderWidth: active ? 2 : 1,
              borderColor: active ? cat.color : '#DDC0B7',
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: cat.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {cat.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: active ? '700' : '600',
                color: active ? cat.color : '#56423C',
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
