import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';

import { addDays, dayKey, formatDay, formatTime, todayKey } from '@/utils/dates';

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
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState(value.date);
  const [timeDraft, setTimeDraft] = useState(value.time ?? formatTime(new Date()));

  const now = new Date();
  const isNow = value.date === dayKey(now) && value.time === formatTime(now);

  const label = isNow
    ? t('time.nowAt', { time: formatTime(now) })
    : `${formatDay(value.date)}${value.time ? `, ${value.time}` : `, ${t('time.withoutTimeShort')}`}`;

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
          style={{ flex: 1, backgroundColor: 'rgba(31,27,21,0.4)' }}
          onPress={() => setModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1, justifyContent: 'flex-end' }}
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
              {t('time.dateTime')}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
              {t('time.date')}
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
                      {offset === 0 ? t('time.today') : offset === 1 ? t('time.yesterday') : formatDay(key)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#56423C', marginBottom: 8 }}>
              {t('time.timeLabel')}
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
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#56423C' }}>{t('time.now')}</Text>
              </Pressable>
              <TextInput
                value={timeDraft}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9:]/g, '').slice(0, 5);
                  setTimeDraft(cleaned);
                }}
                placeholder={t('time.timePlaceholder')}
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
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#56423C' }}>{t('time.noTime')}</Text>
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
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{t('common.save')}</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 11, color: '#A49C93', marginTop: 10 }}>
              {t('time.currentSelection', { date: formatDay(dateDraft) })}
            </Text>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}
