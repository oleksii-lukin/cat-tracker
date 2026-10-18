import type { EventType } from '@/types/domain';

export type QuickActionId = EventType;

export interface QuickActionDef {
  id: QuickActionId;
  /** i18n key for the button label (e.g. "action.poop"). */
  labelKey: string;
}

export interface QuickActionConfig {
  id: QuickActionId;
  enabled: boolean;
  order: number;
}
