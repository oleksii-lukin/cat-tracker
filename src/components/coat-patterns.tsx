import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, Path, Pattern, Rect } from 'react-native-svg';
import type { DimensionValue } from 'react-native';

import type { Coat } from '@/constants/coats';

interface Props {
  coat: Coat;
  width: DimensionValue;
  height: DimensionValue;
}

const TILE = 48;

function PatternArt({ coat }: { coat: Coat }) {
  const p = coat.pattern;

  switch (coat.id) {
    case 'orange_tabby':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Path d="M6 0 Q10 12 6 24 Q2 36 6 48" stroke={p.marks} strokeWidth={5} fill="none" />
          <Path d="M22 0 Q26 12 22 24 Q18 36 22 48" stroke={p.marks} strokeWidth={5} fill="none" />
          <Path d="M38 0 Q42 12 38 24 Q34 36 38 48" stroke={p.marks} strokeWidth={5} fill="none" />
        </>
      );
    case 'black':
      return <Rect width={TILE} height={TILE} fill={p.base} />;
    case 'white':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Circle cx={10} cy={12} r={3} fill={p.marks} opacity={0.5} />
          <Circle cx={36} cy={30} r={2.5} fill={p.marks} opacity={0.45} />
          <Circle cx={22} cy={42} r={2} fill={p.marks} opacity={0.4} />
        </>
      );
    case 'tuxedo':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Rect x={12} y={28} width={24} height={20} rx={9} fill={p.secondary} />
        </>
      );
    case 'gray':
      return <Rect width={TILE} height={TILE} fill={p.base} />;
    case 'calico':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Ellipse cx={13} cy={14} rx={10} ry={8} fill={p.marks} />
          <Ellipse cx={36} cy={33} rx={12} ry={9} fill={p.secondary} />
          <Ellipse cx={38} cy={9} rx={7} ry={6} fill={p.secondary} opacity={0.85} />
        </>
      );
    case 'tortoiseshell':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Ellipse cx={12} cy={12} rx={9} ry={7} fill={p.marks} />
          <Ellipse cx={34} cy={28} rx={11} ry={8} fill={p.marks} opacity={0.9} />
          <Ellipse cx={20} cy={40} rx={8} ry={6} fill={p.secondary} />
        </>
      );
    case 'siamese':
      return (
        <>
          <Rect width={TILE} height={TILE} fill={p.base} />
          <Circle cx={0} cy={0} r={10} fill={p.marks} />
          <Circle cx={TILE} cy={0} r={10} fill={p.marks} />
          <Circle cx={0} cy={TILE} r={10} fill={p.marks} />
          <Circle cx={TILE} cy={TILE} r={10} fill={p.marks} />
        </>
      );
    default:
      return <Rect width={TILE} height={TILE} fill={p.base} />;
  }
}

export function CoatPattern({ coat, width, height }: Props) {
  const rawId = useId();
  const patternId = `coat-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <Pattern id={patternId} width={TILE} height={TILE} patternUnits="userSpaceOnUse">
          <PatternArt coat={coat} />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${patternId})`} />
    </Svg>
  );
}
