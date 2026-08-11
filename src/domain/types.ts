export type AttributeKey = 'shoeSizeEU' | 'clothingSize' | 'colors' | 'brands' | 'materials';
export type SortValue = 'POPULAR' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'DEALS';
export type Outcome = 'APPLIED' | 'ALREADY_CORRECT' | 'UNAVAILABLE' | 'SKIPPED' | 'FAILED';

export interface Preference<T = string | string[]> { enabled: boolean; value: T }
export interface Profile {
  name: string;
  attributes: Record<AttributeKey, Preference>;
  sort: Preference<SortValue>;
}
export interface ShopSettings { enabled: boolean; automatic: boolean; managed: AttributeKey[]; sortEnabled: boolean }
export interface ActionResult { attribute: string; label: string; outcome: Outcome; detail?: string }
export interface ExecutionResult { id: string; shopId: string; startedAt: string; results: ActionResult[] }
export interface AppState {
  schemaVersion: 2; onboarded: boolean; globalEnabled: boolean; profile: Profile;
  shops: Record<string, ShopSettings>; lastResult: ExecutionResult | null;
}
