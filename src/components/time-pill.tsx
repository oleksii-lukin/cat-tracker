import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { addDays, dayKey, formatDayRu, formatTime, todayKey } from '@/utils/dates';

export interface DateTimeValue {
  date: string;
  time: string | null;
}

interface Props {
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  catColor: string;
}

const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7];

export function TimePill({ value, onChange, catColor }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState(value.date);
  const [timeDraft, setTimeDraft] = useState(value.time ?? formatTime(new Date()));

  const now = new Date();
  const isNow = value.date === dayKey(now) && value.time === formatTime(now);

  const label = isNow
    ? `Сейчас ${formatTime(now)}`
    : `${formatDayRu(value.date)}${value.time ? `, ${value.time}` : ', без времени'}`;

  const open = () => {
    setDateDraft(value.date);
    setTimeDraft(value.time ?? formatTime(new Date()));
    setModalOpen(true);
  };

  const apply = (withTime: boolean) => {
    onChange({ date: dateDraft, time: withTime ? timeDraft : null });
    setModalOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={open}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#F6ECE3',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
        }}
      >
        <Text style={{ fontSize: 12 }}>🕒</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: catColor }}>{label}</Text>
      </Pressable>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFF8F3',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 32,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1F1B15', marginBottom: 12 }}>
              Дата и время
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
              Дата
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {DAY_OFFSETS.map((offset) => {
                const key = addDays(todayKey(), -offset);
                const active = key === dateDraft;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setDateDraft(key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      marginRight: 8,
                      backgroundColor: active ? catColor : '#F6ECE3',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : '#56423C' }}>
                      {offset === 0 ? 'Сегодня' : offset === 1 ? 'Вчера' : formatDayRu(key)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
              Время
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Pressable
                onPress={() => setTimeDraft(formatTime(new Date()))}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#F6ECE3',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C' }}>Сейчас</Text>
              </Pressable>
              <TextInput
                value={timeDraft}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9:]/g, '').slice(0, 5);
                  setTimeDraft(cleaned);
                }}
                placeholder="ЧЧ:ММ"
                placeholderTextColor="#A49C93"
                keyboardType="numbers-and-punctuation"
                style={{
                  flex: 1,
                  backgroundColor: '#FCF2E8',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 15,
                  color: '#1F1B15',
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => apply(false)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: '#F6ECE3',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#56423C' }}>Без времени</Text>
              </Pressable>
              <Pressable
                onPress={() => apply(true)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: catColor,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Сохранить</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 11, color: '#A49C93', marginTop: 10 }}>
              Текущий выбор: {formatDayRu(dateDraft)}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
