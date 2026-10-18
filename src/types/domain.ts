export type Sex = 'male' | 'female' | 'unknown';

export type EventType = 'poop' | 'pee' | 'food' | 'hairball';

export type StoolQuality = 'normal' | 'hard' | 'liquid' | 'unusual';

export type PeeVolume = 'low' | 'normal' | 'high';

export type FeedKind = 'wet' | 'dry';

export type FeedUnit = 'spoon' | 'gram';

export interface Cat {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WeightEntry {
  id: string;
  catId: string;
  weightGrams: number;
  measuredOn: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Feed {
  id: string;
  name: string;
  kind: FeedKind;
  unit: FeedUnit;
  isPreset: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DayEvent {
  id: string;
  catId: string;
  type: EventType;
  eventDate: string;
  eventTime: string | null;
  isUncertain: boolean;
  stoolQuality: StoolQuality | null;
  peeVolume: PeeVolume | null;
  feedId: string | null;
  amount: number | null;
  mealsCount: number;
  note: string | null;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Note {
  id: string;
  catId: string;
  day: string;
  time: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EventInput {
  catId: string;
  type: EventType;
  eventDate: string;
  eventTime: string | null;
  isUncertain?: boolean;
  stoolQuality?: StoolQuality | null;
  peeVolume?: PeeVolume | null;
  feedId?: string | null;
  amount?: number | null;
  mealsCount?: number;
  note?: string | null;
  photoUri?: string | null;
}

export interface TypeAmountSummary {
  totalAmount: number;
  eventsWithoutAmount: number;
}

export interface DaySummary {
  poopCount: number;
  poopQualities: StoolQuality[];
  peeCount: number;
  peeVolumes: PeeVolume[];
  foodByKind: { kind: FeedKind; unit: FeedUnit; totalAmount: number; eventsWithoutAmount: number }[];
  foodEvents: number;
  /** Generic counters for every event type (incl. poop/pee/food). */
  countsByType: Record<string, number>;
  /** Sums of the amount field for types with a type-level amount (e.g. hairball). */
  amountsByType: Record<string, TypeAmountSummary>;
}
