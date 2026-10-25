import React from 'react';

interface Props {
  /** День в формате YYYY-MM-DD (на web не используется, нужен для совместимости API). */
  day: string;
  /** Время в формате HH:MM — ровно формат value у input type="time". */
  time: string;
  onChange: (time: string) => void;
  accentColor: string;
}

/** Web-фолбэк: у `@expo/ui` DateTimePicker здесь заглушка, возвращающая null. */
export function TimeField({ time, onChange, accentColor }: Props) {
  return (
    <input
      type="time"
      value={time}
      onChange={(event) => onChange(event.target.value)}
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: '#FCF2E8',
        borderRadius: 12,
        padding: '8px 12px',
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        color: '#1F1B15',
        border: 'none',
        accentColor,
      }}
    />
  );
}
