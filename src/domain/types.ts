export type AttributeType = 'text' | 'number' | 'singleSelect' | 'multiSelect' | 'boolean';
export type AttributeValue = string | string[] | boolean;
export type SortValue = 'POPULAR' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'DEALS';
export type Outcome = 'APPLIED' | 'ALREADY_CORRECT' | 'UNAVAILABLE' | 'SKIPPED' | 'FAILED';
export type MappingSource = 'OFFICIAL' | 'PERSONAL';
export type MappingHealth = 'UNTESTED' | 'HEALTHY' | 'DEGRADED' | 'BROKEN' | 'DISABLED' | 'PERMISSION_REQUIRED';
export type ControlKind = 'CHECKBOX' | 'SELECT' | 'INPUT' | 'CLICK' | 'OPTION_GROUP';
export type MatchingStrategy = 'EXACT' | 'NORMALIZED_EXACT' | 'NUMERIC' | 'LOOKUP_TABLE';

export interface UserAttribute {
  code: string; label: string; type: AttributeType; enabled: boolean;
  value: AttributeValue; options: string[]; builtIn?: boolean;
}
export interface Profile { name: string; attributes: UserAttribute[]; sort: { enabled: boolean; value: SortValue } }

export interface StructuralFingerprint {
  tag?: string; role?: string; type?: string; accessibleName?: string;
  minimumOptionCount?: number; expectedExpandedCapability?: boolean;
}
export interface SelectorStrategy { locator: string; fingerprint: StructuralFingerprint }
export interface ValueMatching {
  strategy: MatchingStrategy;
  /** canonical profile value -> exact value exposed by this shop */
  lookup?: Record<string, string>;
}
export interface VerificationRule {
  listingSelector?: string; quietPeriodMs: number; timeoutMs: number;
  selectedAttribute?: string; selectedValue?: string;
}
export interface ControlMapping {
  id: string; label: string; attributeCodes: string[]; profileSort?: boolean;
  kind: ControlKind; selectorStrategies: SelectorStrategy[];
  triggerStrategies?: SelectorStrategy[]; optionSelector?: string;
  optionValueSource?: 'label' | 'text' | 'value' | 'attribute'; optionValueAttribute?: string;
  saveStrategies?: SelectorStrategy[]; matching: ValueMatching;
  verification: VerificationRule; dependsOn?: string[]; overridesControlId?: string;
}
export interface PageRule {
  id: string; pathPatterns: string[]; requiredSelectors: string[]; excludedPathPatterns: string[];
}
export interface ShopMapping {
  id: string; shopId: string; shopName: string; source: MappingSource;
  schemaVersion: 1; mappingVersion: string; domains: string[]; pageRules: PageRule[];
  controls: ControlMapping[]; health: MappingHealth; enabled: boolean;
  createdAt?: string; updatedAt?: string; lastTestedAt?: string; consecutiveFailures?: number;
}
export interface ShopSettings { enabled: boolean; automatic: boolean; sortEnabled: boolean; permissionRequired?: boolean }
export interface PickerResult {
  origin: string; hostname: string; url: string; pageTitle: string;
  selector: SelectorStrategy; inferredKind: ControlKind;
  metadata: { tag: string; role: string; type: string; accessibleName: string; text: string; optionValues: string[] };
}
export interface ActionResult { attribute: string; label: string; outcome: Outcome; detail?: string }
export interface ExecutionResult { id: string; shopId: string; mappingIds: string[]; startedAt: string; results: ActionResult[] }
export interface AppState {
  schemaVersion: 4; onboarded: boolean; globalEnabled: boolean; profile: Profile;
  shops: Record<string, ShopSettings>; personalMappings: ShopMapping[];
  pendingPicker: PickerResult | null; lastResult: ExecutionResult | null;
}
