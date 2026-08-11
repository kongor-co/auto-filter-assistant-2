import { loadState, saveState } from '../domain/storage';
import type { ExtensionMessage } from './messages';

chrome.runtime.onInstalled.addListener(async () => { const state = await loadState(); await saveState(state); });
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, respond) => {
  (async () => {
    if (message.type === 'GET_CONTEXT') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let host = ''; try { host = tab?.url ? new URL(tab.url).hostname : ''; } catch {}
      respond({ state: await loadState(), tab: tab ? { id: tab.id, url: tab.url, host } : null }); return;
    }
    if (message.type === 'APPLY_NOW') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab');
      respond(await chrome.tabs.sendMessage(tab.id, { type: 'APPLY_NOW' } satisfies ExtensionMessage)); return;
    }
    if (message.type === 'STATE_UPDATED') { await saveState(message.state); respond({ ok: true }); return; }
    if (message.type === 'EXECUTION_COMPLETE') { const state = await loadState(); state.lastResult = message.result; await saveState(state); respond({ ok: true }); }
  })().catch(error => respond({ ok: false, error: error.message }));
  return true;
});
