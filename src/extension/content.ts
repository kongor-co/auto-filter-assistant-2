import { loadState } from '../domain/storage';
import { mappingsForHost, pageRuleMatches } from '../domain/mappings';
import type { ExecutionResult, ShopMapping } from '../domain/types';
import { executeControl, executeMappings } from './engine';
import type { ExtensionMessage } from './messages';
import { startPicker } from './picker';

declare global { interface Window { __AUTOFILTER_CONTENT_INSTALLED__?:boolean } }
let executing=false;let stopPicker:(()=>void)|null=null;
function applicable(mappings:ShopMapping[],doc:Document):ShopMapping[]{const url=new URL(location.href);return mappings.filter(mapping=>mapping.pageRules.some(rule=>pageRuleMatches(rule,url,doc)))}
function toast(result:ExecutionResult){document.getElementById('autofilter-toast')?.remove();const ready=result.results.filter(item=>['APPLIED','ALREADY_CORRECT'].includes(item.outcome)).length;const node=document.createElement('div');node.id='autofilter-toast';node.setAttribute('role','status');node.style.cssText='position:fixed;right:20px;bottom:20px;z-index:2147483647;background:#171b18;color:white;padding:14px 18px;border-radius:14px;font:600 14px system-ui;box-shadow:0 12px 40px #0005';node.textContent=`AutoFilter · ${ready} of ${result.results.length} preferences ready`;document.body.appendChild(node);setTimeout(()=>node.remove(),4500)}
async function execute():Promise<{ok:boolean;result?:ExecutionResult;error?:string}>{if(executing)return{ok:false,error:'AutoFilter is already running.'};executing=true;try{const state=await loadState();if(!state.globalEnabled)return{ok:false,error:'AutoFilter is disabled.'};const mappings=applicable(mappingsForHost(state,location.hostname),document);if(!mappings.length)return{ok:false,error:'No tested mapping supports this page.'};const shopId=mappings[0].shopId;if(state.shops[shopId]?.enabled===false)return{ok:false,error:'AutoFilter is disabled for this shop.'};const results=await executeMappings(state,mappings,document);const result:ExecutionResult={id:crypto.randomUUID(),shopId,mappingIds:mappings.map(mapping=>mapping.id),startedAt:new Date().toISOString(),results};await chrome.runtime.sendMessage({type:'EXECUTION_COMPLETE',result} satisfies ExtensionMessage);toast(result);return{ok:true,result}}finally{executing=false}}

if(!window.__AUTOFILTER_CONTENT_INSTALLED__){window.__AUTOFILTER_CONTENT_INSTALLED__=true;chrome.runtime.onMessage.addListener((message:ExtensionMessage,_sender,respond)=>{
  if(message.type==='APPLY_NOW'||message.type==='AUTO_APPLY'){execute().then(respond).catch(error=>respond({ok:false,error:error.message}));return true}
  if(message.type==='START_PICKER_IN_PAGE'){stopPicker?.();stopPicker=startPicker(document);respond({ok:true});return}
  if(message.type==='TEST_CONTROL'){loadState().then(state=>executeControl(message.control,state,document)).then(result=>respond({ok:result.outcome!=='FAILED'&&result.outcome!=='UNAVAILABLE',result})).catch(error=>respond({ok:false,error:error.message}));return true}
});
  let navigationTimer=0;let observedPath=location.pathname;
  const maybeAutomatic=async()=>{const state=await loadState();const mappings=mappingsForHost(state,location.hostname);const shopId=mappings[0]?.shopId;if(!shopId||!state.shops[shopId]?.automatic)return;const key=`autofilter:auto:${shopId}:${location.pathname}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');await execute()};
  const navigationCheck=()=>{if(location.pathname===observedPath)return;observedPath=location.pathname;clearTimeout(navigationTimer);navigationTimer=window.setTimeout(()=>void maybeAutomatic(),500)};
  window.addEventListener('popstate',navigationCheck);new MutationObserver(navigationCheck).observe(document.documentElement,{childList:true,subtree:true});window.setTimeout(()=>void maybeAutomatic(),700);
}
