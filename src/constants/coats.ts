export type CoatId =
  | 'orange_tabby'
  | 'black'
  | 'white'
  | 'tuxedo'
  | 'gray'
  | 'calico'
  | 'tortoiseshell'
  | 'siamese';

export interface Coat {
  id: CoatId;
  accent: string;
  accentSoft: string;
  border: string;
  onAccent: string;
  onPattern: string;
  pattern: {
    base: string;
    marks: string;
    secondary?: string;
  };
}

export const CAT_COATS: Record<CoatId, Coat> = {
  orange_tabby: {
    id: 'orange_tabby',
    accent: '#D96B43',
    accentSoft: '#FBEBE4',
    border: '#D96B4366',
    onAccent: '#FFFFFF',
    onPattern: '#2B1608',
    pattern: { base: '#E08A3C', marks: '#B85C28' },
  },
  black: {
    id: 'black',
    accent: '#2B2B2B',
    accentSoft: '#EDEDED',
    border: '#2B2B2B40',
    onAccent: '#FFFFFF',
    onPattern: '#FFFFFF',
    pattern: { base: '#2B2B2B', marks: '#1A1A1A' },
  },
  white: {
    id: 'white',
    accent: '#8A726A',
    accentSoft: '#F0E7DD',
    border: '#8A726A40',
    onAccent: '#FFFFFF',
    onPattern: '#56423C',
    pattern: { base: '#F5F0E8', marks: '#E8DFD2' },
  },
  tuxedo: {
    id: 'tuxedo',
    accent: '#3D3D3D',
    accentSoft: '#EDEDED',
    border: '#3D3D3D40',
    onAccent: '#FFFFFF',
    onPattern: '#FFFFFF',
    pattern: { base: '#2B2B2B', marks: '#1A1A1A', secondary: '#F7F2EA' },
  },
  gray: {
    id: 'gray',
    accent: '#6B7B8C',
    accentSoft: '#EBF0F5',
    border: '#6B7B8C40',
    onAccent: '#FFFFFF',
    onPattern: '#1F2937',
    pattern: { base: '#8A9AAB', marks: '#6B7B8C' },
  },
  calico: {
    id: 'calico',
    accent: '#D9933D',
    accentSoft: '#FAF0DF',
    border: '#D9933D40',
    onAccent: '#FFFFFF',
    onPattern: '#56423C',
    pattern: { base: '#F5F0E8', marks: '#E08A3C', secondary: '#2B2B2B' },
  },
  tortoiseshell: {
    id: 'tortoiseshell',
    accent: '#8A4B2A',
    accentSoft: '#F5E6DC',
    border: '#8A4B2A40',
    onAccent: '#FFFFFF',
    onPattern: '#FFFFFF',
    pattern: { base: '#2B1B12', marks: '#C46A28', secondary: '#8A4B2A' },
  },
  siamese: {
    id: 'siamese',
    accent: '#5C4033',
    accentSoft: '#F2EBDF',
    border: '#5C403340',
    onAccent: '#FFFFFF',
    onPattern: '#3D2B1F',
    pattern: { base: '#F0E6D2', marks: '#3D2B1F' },
  },
};

export const COAT_LIST: Coat[] = Object.values(CAT_COATS);

export const DEFAULT_COAT: Coat = CAT_COATS.orange_tabby;

export function getCoat(color: string): Coat {
  return CAT_COATS[color as CoatId] ?? DEFAULT_COAT;
}
