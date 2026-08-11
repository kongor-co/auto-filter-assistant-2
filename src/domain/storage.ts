import { DEFAULT_STATE } from './defaults';
import type { AppState, ShopMapping, UserAttribute } from './types';
import { validatePersonalMapping } from './validation';
const KEY='autofilter_state_v2';
function validAttribute(item:any):item is UserAttribute{return !!item&&typeof item.code==='string'&&typeof item.label==='string'&&['text','number','singleSelect','multiSelect','boolean'].includes(item.type)}
function migrate(raw:any):AppState{
  if(raw?.schemaVersion===4)return raw as AppState;
  const next=structuredClone(DEFAULT_STATE);
  if(raw?.schemaVersion===3){next.onboarded=!!raw.onboarded;next.globalEnabled=raw.globalEnabled!==false;next.profile={...raw.profile,attributes:Array.isArray(raw.profile?.attributes)?raw.profile.attributes.filter(validAttribute):next.profile.attributes};next.lastResult=raw.lastResult||null;next.shops.zalando={enabled:raw.shops?.zalando?.enabled!==false,automatic:!!raw.shops?.zalando?.automatic,sortEnabled:raw.shops?.zalando?.sortEnabled!==false};return next}
  return next;
}
export async function loadState():Promise<AppState>{const raw=(await chrome.storage.local.get(KEY))[KEY];const state=raw?migrate(raw):structuredClone(DEFAULT_STATE);if(raw?.schemaVersion!==4)await saveState(state);return state}
export async function saveState(state:AppState):Promise<void>{await chrome.storage.local.set({[KEY]:state})}
export async function resetState():Promise<AppState>{const state=structuredClone(DEFAULT_STATE);await saveState(state);return state}
export async function importState(raw:any):Promise<AppState>{
  if(raw?.schemaVersion!==4||!raw.profile||!Array.isArray(raw.profile.attributes)||!raw.profile.attributes.every(validAttribute)||!Array.isArray(raw.personalMappings)||!raw.personalMappings.every(validatePersonalMapping))throw new Error('Backup or personal mapping data is invalid.');
  const clean=structuredClone(raw) as AppState;clean.pendingPicker=null;clean.personalMappings.forEach(mapping=>{mapping.source='PERSONAL';if(mapping.health==='HEALTHY')mapping.health='UNTESTED'});await saveState(clean);return clean;
}
