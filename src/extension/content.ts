import { loadState } from '../domain/storage';
import { isListingPage, isZalando, ZALANDO } from '../domain/zalando';
import type { ActionResult, AttributeKey, ExecutionResult } from '../domain/types';
import type { ExtensionMessage } from './messages';

let executing = false;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const normalize = (value: string | null | undefined) => (value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');

async function waitFor<T>(read: () => T | null | undefined, timeout = 5000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeout) { const value = read(); if (value) return value; await sleep(80); }
  throw new Error('Timed out waiting for the mapped control.');
}

function namedControl(root: ParentNode, type: 'checkbox' | 'radio', name: string): HTMLInputElement | null {
  const inputs = [...root.querySelectorAll<HTMLInputElement>(`input[type="${type}"]`)];
  return inputs.find(input => {
    const label = input.labels?.[0]?.textContent || input.getAttribute('aria-label') || '';
    return normalize(label) === normalize(name);
  }) || null;
}

async function listingStable(timeout = 6500): Promise<void> {
  const main = document.querySelector('main'); if (!main) throw new Error('Product listing was not found.');
  await new Promise<void>((resolve, reject) => {
    let quiet: number; const hard = window.setTimeout(() => { observer.disconnect(); reject(new Error('Product results did not stabilize.')); }, timeout);
    const finish = () => { observer.disconnect(); clearTimeout(hard); resolve(); };
    const schedule = () => { clearTimeout(quiet); quiet = window.setTimeout(finish, 550); };
    const observer = new MutationObserver(schedule); observer.observe(main, { childList: true, subtree: true, attributes: true }); schedule();
  });
}

async function openFilter(label: string): Promise<HTMLElement> {
  const trigger = document.querySelector<HTMLButtonElement>(`button[aria-label="filter by ${CSS.escape(label)}"]`);
  if (!trigger || trigger.getAttribute('aria-expanded') === null) throw new Error(`${label} filter fingerprint failed.`);
  if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
  return waitFor(() => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find(dialog => normalize(dialog.getAttribute('aria-label')) === normalize(`filter by ${label}`)));
}

async function saveDialog(dialog: HTMLElement, label: string): Promise<void> {
  const button = [...dialog.querySelectorAll<HTMLButtonElement>('button')].find(candidate => normalize(candidate.getAttribute('aria-label')) === normalize(`Save the ${label} filter`) || normalize(candidate.textContent) === 'save');
  if (!button) throw new Error(`${label} Save control was not found.`);
  if (!button.disabled) { button.click(); await listingStable(); }
  else {
    const trigger = document.querySelector<HTMLButtonElement>(`button[aria-label="filter by ${CSS.escape(label)}"]`);
    if (trigger?.getAttribute('aria-expanded') === 'true') trigger.click();
  }
}

async function applyFilter(label: string, values: string[]): Promise<ActionResult> {
  const clean = [...new Set(values.map(value => value.trim()).filter(Boolean))];
  if (!clean.length) return { attribute: label, label, outcome: 'SKIPPED', detail: 'No saved value' };
  try {
    const dialog = await openFilter(label); let changed = false; const missing: string[] = [];
    for (const value of clean) {
      const checkbox = namedControl(dialog, 'checkbox', value);
      if (!checkbox) { missing.push(value); continue; }
      if (!checkbox.checked) { checkbox.click(); changed = true; }
    }
    if (!changed) {
      const trigger = document.querySelector<HTMLButtonElement>(`button[aria-label="filter by ${CSS.escape(label)}"]`); if (trigger?.getAttribute('aria-expanded') === 'true') trigger.click();
      return missing.length === clean.length ? { attribute: label, label, outcome: 'UNAVAILABLE', detail: `Not offered: ${missing.join(', ')}` } : { attribute: label, label, outcome: 'ALREADY_CORRECT', detail: clean.filter(v => !missing.includes(v)).join(', ') };
    }
    await saveDialog(dialog, label);
    return { attribute: label, label, outcome: missing.length ? 'APPLIED' : 'APPLIED', detail: missing.length ? `Applied available values; unavailable: ${missing.join(', ')}` : clean.join(', ') };
  } catch (error) { return { attribute: label, label, outcome: 'FAILED', detail: error instanceof Error ? error.message : 'Filter failed' }; }
}

async function applySort(value: keyof typeof ZALANDO.sorting): Promise<ActionResult> {
  const label = ZALANDO.sorting[value];
  try {
    const trigger = document.querySelector<HTMLButtonElement>('button[aria-label="Sort by"]');
    if (!trigger || trigger.getAttribute('aria-expanded') === null) throw new Error('Sort fingerprint failed.');
    if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
    const dialog = await waitFor(() => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find(node => normalize(node.getAttribute('aria-label')) === 'sort by'));
    const radio = namedControl(dialog, 'radio', label); if (!radio) return { attribute: 'sort', label: 'Sort', outcome: 'UNAVAILABLE', detail: label };
    if (radio.checked) { trigger.click(); return { attribute: 'sort', label: 'Sort', outcome: 'ALREADY_CORRECT', detail: label }; }
    radio.click(); await saveDialog(dialog, 'Sort by');
    return { attribute: 'sort', label: 'Sort', outcome: 'APPLIED', detail: label };
  } catch (error) { return { attribute: 'sort', label: 'Sort', outcome: 'FAILED', detail: error instanceof Error ? error.message : 'Sort failed' }; }
}

function showToast(result: ExecutionResult): void {
  document.getElementById('autofilter-toast')?.remove();
  const applied = result.results.filter(item => item.outcome === 'APPLIED' || item.outcome === 'ALREADY_CORRECT').length;
  const toast = document.createElement('div'); toast.id = 'autofilter-toast'; toast.setAttribute('role', 'status');
  toast.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;background:#171b18;color:white;padding:14px 18px;border-radius:14px;font:600 14px system-ui;box-shadow:0 12px 40px #0005';
  toast.textContent = `AutoFilter · ${applied} of ${result.results.length} preferences ready`;
  document.body.appendChild(toast); window.setTimeout(() => toast.remove(), 4500);
}

async function execute(): Promise<{ ok: boolean; result?: ExecutionResult; error?: string }> {
  if (executing) return { ok: false, error: 'AutoFilter is already running.' };
  executing = true;
  try {
    const state = await loadState();
    if (!state.globalEnabled || !state.shops.zalando.enabled) return { ok: false, error: 'AutoFilter is disabled.' };
    if (!isZalando(location.hostname) || !isListingPage(document)) return { ok: false, error: 'Open a Zalando product listing first.' };
    const profile = state.profile; const settings = state.shops.zalando; const results: ActionResult[] = [];
    const sizeValues: string[] = [];
    for (const key of ['shoeSizeEU','clothingSize'] as AttributeKey[]) if (settings.managed.includes(key) && profile.attributes[key].enabled) sizeValues.push(...ZALANDO.filters[key].values(profile));
    if (sizeValues.some(Boolean)) results.push(await applyFilter('Size', sizeValues));
    for (const key of ['colors','brands','materials'] as AttributeKey[]) if (settings.managed.includes(key) && profile.attributes[key].enabled) results.push(await applyFilter(ZALANDO.filters[key].label, ZALANDO.filters[key].values(profile)));
    if (settings.sortEnabled && profile.sort.enabled) results.push(await applySort(profile.sort.value));
    const result: ExecutionResult = { id: crypto.randomUUID(), shopId: 'zalando', startedAt: new Date().toISOString(), results };
    await chrome.runtime.sendMessage({ type: 'EXECUTION_COMPLETE', result } satisfies ExtensionMessage); showToast(result); return { ok: true, result };
  } finally { executing = false; }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, respond) => {
  if (message.type !== 'APPLY_NOW') return;
  execute().then(respond).catch(error => respond({ ok: false, error: error.message })); return true;
});

(async () => {
  const state = await loadState(); if (!state.onboarded || !state.shops.zalando.automatic || !isListingPage(document)) return;
  const key = `autofilter:${location.pathname}${location.search}`; if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1'); await sleep(900); await execute();
})();
