import { DEFAULT_STATE } from './defaults';
import type { AppState } from './types';
const KEY = 'autofilter_state_v2';

export async function loadState(): Promise<AppState> {
  const value = (await chrome.storage.local.get(KEY))[KEY];
  if (!value) return structuredClone(DEFAULT_STATE);
  if (value.schemaVersion !== 2) return structuredClone(DEFAULT_STATE);
  return value as AppState;
}
export async function saveState(state: AppState): Promise<void> { await chrome.storage.local.set({ [KEY]: state }); }
export async function resetState(): Promise<AppState> { const state = structuredClone(DEFAULT_STATE); await saveState(state); return state; }
