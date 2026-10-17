import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

function formatAmount(value: number): string {
  if (value === 0) return '—';
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac === 0) return String(whole);
  if (Math.abs(frac - 0.5) < 0.001) return whole === 0 ? '½' : `${whole}½`;
  return String(value);
}

function clampTo(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

interface Props {
  value: number;
  onChange: (next: number) => void;
  step: number;
  min: number;
  max: number;
  unitLabel: string;
  quickValues: number[];
  accent: string;
  chipTimes?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  step,
  min,
  max,
  unitLabel,
  quickValues,
  accent,
  chipTimes = false,
}: Props) {
  return (
    <View>
      {quickValues.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {quickValues.map((q) => {
              const active = Math.abs(value - q) < 0.001;
              return (
                <Pressable
                  key={q}
                  onPress={() => onChange(clampTo(q, min, max))}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? `${accent}22` : '#FCF2E8',
                    borderWidth: active ? 2 : 0,
                    borderColor: accent,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: accent }}>
                    {chipTimes ? `×${q}` : formatAmount(q)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FCF2E8',
          borderRadius: 999,
          paddingHorizontal: 6,
          paddingVertical: 4,
        }}
      >
        <Pressable
          onPress={() => onChange(clampTo(value - step, min, max))}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F6ECE3',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#56423C' }}>−</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: value === 0 ? '#A49C93' : '#1F1B15',
            }}
          >
            {formatAmount(value)}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C' }}>{unitLabel}</Text>
        </View>

        <Pressable
          onPress={() => onChange(clampTo(value + step, min, max))}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
