import React from 'react';

import type { EventDraft, EventField } from '@/domain/events';
import type { Feed } from '@/types/domain';

import { AmountField } from './amount-field';
import { FeedField } from './feed-field';
import { MealsField } from './meals-field';
import { PeeVolumeField } from './pee-volume-field';
import { StoolQualityField } from './stool-quality-field';

interface FieldRenderContext {
  draft: EventDraft;
  patch: (p: Partial<EventDraft>) => void;
  feeds: Feed[];
  main: string;
  soft: string;
}

/** Renders the editor for a single event field. */
export function EventFieldRenderer({ field, ctx }: { field: EventField; ctx: FieldRenderContext }) {
  const { draft, patch, feeds, main, soft } = ctx;
  switch (field) {
    case 'stoolQuality':
      return <StoolQualityField value={draft.stoolQuality} onChange={(v) => patch({ stoolQuality: v })} main={main} soft={soft} />;
    case 'peeVolume':
      return <PeeVolumeField value={draft.peeVolume} onChange={(v) => patch({ peeVolume: v })} main={main} soft={soft} />;
    case 'feedId':
      return (
        <FeedField
          value={draft.feedId}
          onChange={(v) => patch({ feedId: v })}
          feeds={feeds}
          main={main}
          soft={soft}
        />
      );
    case 'amount':
      return (
        <AmountField
          value={draft.amount}
          onChange={(v) => patch({ amount: v })}
          feeds={feeds}
          feedId={draft.feedId}
          main={main}
        />
      );
    case 'mealsCount':
      return <MealsField value={draft.meals} onChange={(v) => patch({ meals: v })} main={main} />;
    default:
      return null;
  }
}
