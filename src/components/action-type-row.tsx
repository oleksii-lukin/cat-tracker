import React, { useState } from 'react';
import { PixelRatio, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getEventDef } from '@/domain/events';
import { eventLabel } from '@/i18n/event-label';
import type { EventType, Sex } from '@/types/domain';

/** Horizontal gap between buttons and between wrapped lines (matches the original layout). */
const GAP = 8;

/** Comfortable minimum button width at font scale 1 (dp). */
const MIN_BUTTON_WIDTH = 64;

/** Cap for the system font scale when applying the width threshold. */
const MAX_FONT_SCALE = 1.6;

const SIZES = {
  md: { emoji: 18, label: 12, paddingVertical: 12, radius: 14 },
  sm: { emoji: 16, label: 11, paddingVertical: 10, radius: 12 },
} as const;

const INACTIVE_BG = '#F6ECE3';
const INACTIVE_TEXT = '#56423C';

export interface ActionTypeRowProps {
  /** Event types in display order — one button per type. */
  types: EventType[];
  /** Currently selected type, or null when nothing is selected. */
  active: EventType | null;
  onSelect: (type: EventType) => void;
  /** Used by {@link eventLabel} to pick the gendered label variant. */
  sex?: Sex;
  /** `md` = quick-add panel, `sm` = event sheet. */
  size?: keyof typeof SIZES;
  /** Prefix for button testIDs: `quickadd-<type>` / `event-type-<type>`. */
  testIDPrefix: string;
  /**
   * Horizontal space (in dp) outside the row — margins, paddings and borders
   * of the parent. Only used to pick the column count on the very first render,
   * before `onLayout` reports the actual width. It never sizes the buttons:
   * `flex: 1` lets Yoga split the measured width itself, so a slightly wrong
   * estimate can only flip a borderline column count for one frame and can
   * never break the grid.
   */
  horizontalInset: number;
}

/**
 * Column count that keeps every button at least `minButtonWidth` wide.
 *
 * Halves the column count instead of decrementing it so the grid stays
 * balanced (4 → 2 → 1, 3 → 2 → 1).
 */
export function computeActionColumns(
  rowWidth: number,
  count: number,
  minButtonWidth: number
): number {
  let columns = count;
  while (columns > 1) {
    const width = (rowWidth - GAP * (columns - 1)) / columns;
    if (width >= minButtonWidth) break;
    columns = Math.ceil(columns / 2);
  }
  return Math.max(1, columns);
}

/**
 * Row of tappable event-type buttons (quick actions / event types).
 *
 * Responsive behaviour:
 * - one line of equal buttons while they stay at least `MIN_BUTTON_WIDTH`
 *   wide (scaled by the system font size);
 * - when they don't fit, the grid reflows into balanced lines (4 → 2×2) and
 *   the inner button layout switches from column (icon over label) to row —
 *   the doubled width is spent on the label, the saved height keeps the panel
 *   compact;
 * - the label itself keeps `adjustsFontSizeToFit` as the last line of defence
 *   for very long locales or extreme font scales.
 *
 * Layout notes: lines are chunked explicitly instead of using `flexWrap`.
 * A wrapping row with an exactly-fitted `flexBasis` falls apart on any
 * sub-pixel discrepancy (rounding, borders): one pixel too wide and every
 * item ends up alone on its own line. With explicit lines and `flex: 1`
 * buttons, Yoga divides the real container width itself — there is no
 * exact-fit arithmetic to get wrong.
 */
export function ActionTypeRow({
  types,
  active,
  onSelect,
  sex,
  size = 'md',
  testIDPrefix,
  horizontalInset,
}: ActionTypeRowProps) {
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const dims = SIZES[size];
  // Floor: an over-estimated width must never exceed the real one.
  const rowWidth =
    measuredWidth ?? Math.max(0, Math.floor(windowWidth - horizontalInset));
  const fontScale = Math.min(
    Math.max(PixelRatio.getFontScale(), 1),
    MAX_FONT_SCALE
  );
  const columns =
    rowWidth > 0
      ? computeActionColumns(rowWidth, types.length, MIN_BUTTON_WIDTH * fontScale)
      : types.length;
  const wrapped = columns < types.length;

  const lines: EventType[][] = [];
  for (let i = 0; i < types.length; i += columns) {
    lines.push(types.slice(i, i + columns));
  }

  if (types.length === 0) {
    return null;
  }

  return (
    <View
      testID={`${testIDPrefix}-row`}
      style={{ flexDirection: 'column', gap: GAP }}
      onLayout={(e) => {
        const width = Math.floor(e.nativeEvent.layout.width);
        setMeasuredWidth((prev) => (prev === width ? prev : width));
      }}
    >
      {lines.map((lineTypes, lineIndex) => (
        <View
          key={lineIndex}
          testID={`${testIDPrefix}-line-${lineIndex}`}
          style={{ flexDirection: 'row', gap: GAP }}
        >
          {lineTypes.map((type) => {
            const def = getEventDef(type);
            const isActive = active === type;
            return (
              <Pressable
                key={type}
                testID={`${testIDPrefix}-${type}`}
                onPress={() => onSelect(type)}
                style={[
                  // Equal share of the real line width — no pre-computed sizes.
                  { flex: 1 },
                  wrapped
                    ? {
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 10,
                        minHeight: 48,
                      }
                    : {
                        alignItems: 'center',
                        paddingVertical: dims.paddingVertical,
                      },
                  {
                    borderRadius: dims.radius,
                    backgroundColor: isActive ? def.soft : INACTIVE_BG,
                    // Constant border width: switching the active button must not
                    // change the content width (it used to shift by 2dp per side).
                    borderWidth: 2,
                    borderColor: isActive ? def.main : 'transparent',
                  },
                ]}
              >
                <Text
                  maxFontSizeMultiplier={1.4}
                  style={{ fontSize: dims.emoji, flexShrink: 0 }}
                >
                  {def.emoji}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={1.5}
                  style={{
                    fontSize: dims.label,
                    fontWeight: '700',
                    color: isActive ? def.main : INACTIVE_TEXT,
                    marginTop: wrapped ? 0 : 2,
                    textAlign: 'center',
                    flexShrink: wrapped ? 1 : 0,
                  }}
                >
                  {eventLabel(t, def.labelKey, sex)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
