import type { AppState } from './types';
export const DEFAULT_STATE: AppState = {
  schemaVersion: 2, onboarded: false, globalEnabled: true,
  profile: {
    name: '',
    attributes: {
      shoeSizeEU: { enabled: true, value: '' }, clothingSize: { enabled: false, value: '' },
      colors: { enabled: true, value: [] }, brands: { enabled: false, value: [] }, materials: { enabled: false, value: [] }
    },
    sort: { enabled: true, value: 'PRICE_ASC' }
  },
  shops: { zalando: { enabled: true, automatic: false, managed: ['shoeSizeEU', 'clothingSize', 'colors', 'brands', 'materials'], sortEnabled: true } },
  lastResult: null
};
