import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { dateAtTime, formatTime, isValidTime } from '@/utils/dates';

interface Props {
  /** День в формате YYYY-MM-DD — нужен пикеру как база для Date. */
  day: string;
  /** Время в формате HH:MM. */
  time: string;
  onChange: (time: string) => void;
  accentColor: string;
}

/**
 * Нативный выбор времени: SwiftUI DatePicker (iOS) и Material 3 TimePickerDialog (Android).
 * В web-сборке используется заглушка `time-field.web.tsx`.
 */
export function TimeField({ day, time, onChange, accentColor }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  // Легаси-записи в БД («9:30») и прочий мусор приводим к валидному HH:MM.
  const safeTime = isValidTime(time) ? time : formatTime(new Date());
  const value = dateAtTime(day, safeTime);
  const displayTime = formatTime(value);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.fill}>
        <DateTimePicker
          mode="time"
          display="compact"
          value={value}
          accentColor={accentColor}
          onValueChange={(_, date) => onChange(formatTime(date))}
          style={styles.iosPicker}
          testID="time-field"
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('time.timeLabel')}: ${displayTime}`}
        testID="time-field"
        style={styles.field}
      >
        <Text style={styles.value}>{displayTime}</Text>
        <Text style={styles.chevron}>🕐</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          is24Hour
          value={value}
          accentColor={accentColor}
          onValueChange={(_, date) => {
            setOpen(false);
            onChange(formatTime(date));
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  iosPicker: {
    alignSelf: 'flex-start',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FCF2E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1B15',
  },
  chevron: {
    fontSize: 13,
  },
});
