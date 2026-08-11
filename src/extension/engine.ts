import { attributeValues, effectiveControls } from '../domain/mappings';
import type { ActionResult, AppState, ControlMapping, SelectorStrategy, ShopMapping } from '../domain/types';

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export const normalize=(value:unknown)=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');
function accessibleName(element:Element):string{return element.getAttribute('aria-label')||(element as HTMLInputElement).labels?.[0]?.textContent||element.querySelector('legend')?.textContent||element.textContent||''}
function fingerprint(element:Element|undefined,s:SelectorStrategy,doc:Document):boolean{
  if(!element||!doc.documentElement.contains(element))return false;const fp=s.fingerprint;
  if(fp.tag&&element.tagName.toLowerCase()!==fp.tag.toLowerCase())return false;
  if(fp.role&&(element.getAttribute('role')||'').toLowerCase()!==fp.role.toLowerCase())return false;
  if(fp.type&&((element as HTMLInputElement).type||'').toLowerCase()!==fp.type.toLowerCase())return false;
  if(fp.accessibleName&&normalize(accessibleName(element))!==normalize(fp.accessibleName))return false;
  if(fp.expectedExpandedCapability&&!element.hasAttribute('aria-expanded'))return false;
  if(fp.minimumOptionCount&&element.querySelectorAll('input,option,[role="option"],[role="checkbox"],[role="radio"]').length<fp.minimumOptionCount)return false;
  return true;
}
export function resolve(strategies:SelectorStrategy[],doc:Document,root:ParentNode=doc):{element:HTMLElement;strategyIndex:number}|null{
  for(let i=0;i<strategies.length;i++){const strategy=strategies[i];let matches:Element[]=[];try{matches=[...root.querySelectorAll(strategy.locator)]}catch{continue}if(matches.length!==1)continue;if(fingerprint(matches[0],strategy,doc))return{element:matches[0] as HTMLElement,strategyIndex:i}}
  return null;
}
async function waitForResolve(strategies:SelectorStrategy[],doc:Document,root:ParentNode=doc,timeout=5000){const start=Date.now();while(Date.now()-start<timeout){const found=resolve(strategies,doc,root);if(found)return found;await sleep(80)}return null}
function mappedValue(control:ControlMapping,value:string):string{return control.matching.lookup?.[value]??value}
function matches(control:ControlMapping,actual:string,desired:string):boolean{if(control.matching.strategy==='EXACT'||control.matching.strategy==='LOOKUP_TABLE')return actual===desired;if(control.matching.strategy==='NUMERIC')return Number(actual)===Number(desired);return normalize(actual)===normalize(desired)}
function optionValue(option:Element,control:ControlMapping):string{
  if(control.optionValueSource==='value')return(option as HTMLInputElement).value||'';
  if(control.optionValueSource==='attribute')return option.getAttribute(control.optionValueAttribute||'data-value')||'';
  if(control.optionValueSource==='text')return option.textContent||'';
  return accessibleName(option);
}
function selected(element:Element):boolean{return !!(element as HTMLInputElement).checked||['true','1'].includes(element.getAttribute('aria-checked')||'')||element.getAttribute('aria-selected')==='true'||element.getAttribute('aria-pressed')==='true'}
function dispatch(element:HTMLElement,names:string[]){for(const name of names)element.dispatchEvent(new Event(name,{bubbles:true}))}
async function stable(rule:ControlMapping['verification'],doc:Document){if(!rule.listingSelector)return;const container=doc.querySelector(rule.listingSelector);if(!container)throw new Error('Mapped listing container not found.');await new Promise<void>((resolve,reject)=>{let quiet=0;const finish=()=>{observer.disconnect();clearTimeout(hard);resolve()};const schedule=()=>{clearTimeout(quiet);quiet=window.setTimeout(finish,rule.quietPeriodMs)};const observer=new MutationObserver(schedule);const hard=window.setTimeout(()=>{observer.disconnect();reject(new Error('Listing verification timed out.'))},rule.timeoutMs);observer.observe(container,{childList:true,subtree:true,attributes:true});schedule()})}
function valuesFor(control:ControlMapping,state:AppState):string[]{if(control.profileSort)return state.profile.sort.enabled?[state.profile.sort.value]:[];return [...new Set(control.attributeCodes.flatMap(code=>{const attribute=state.profile.attributes.find(item=>item.code===code);return attribute?.enabled?attributeValues(attribute):[]}))]}

export async function executeControl(control:ControlMapping,state:AppState,doc:Document=document):Promise<ActionResult>{
  const canonical=valuesFor(control,state);if(!canonical.length)return{attribute:control.id,label:control.label,outcome:'SKIPPED',detail:'No enabled mapped value'};const desired=canonical.map(value=>mappedValue(control,value));
  try{
    if(control.kind==='OPTION_GROUP'){
      if(control.triggerStrategies?.length){const trigger=resolve(control.triggerStrategies,doc);if(!trigger)throw new Error('Trigger selector or fingerprint failed.');if(trigger.element.getAttribute('aria-expanded')!=='true')trigger.element.click()}
      const root=await waitForResolve(control.selectorStrategies,doc,doc,control.verification.timeoutMs);if(!root)throw new Error('Filter container selector or fingerprint failed.');
      const options=[...root.element.querySelectorAll(control.optionSelector||'input')];const missing:string[]=[];let changed=false;
      for(const value of desired){const option=options.find(candidate=>matches(control,optionValue(candidate,control),value));if(!option){missing.push(value);continue}if(!selected(option)){(option as HTMLElement).click();changed=true}}
      if(changed&&control.saveStrategies?.length){const save=resolve(control.saveStrategies,doc,root.element)||resolve(control.saveStrategies,doc);if(!save)throw new Error('Save selector or fingerprint failed.');if(!(save.element as HTMLButtonElement).disabled)save.element.click();await stable(control.verification,doc)}
      else if(control.triggerStrategies?.length){const trigger=resolve(control.triggerStrategies,doc);if(trigger?.element.getAttribute('aria-expanded')==='true')trigger.element.click()}
      if(missing.length===desired.length)return{attribute:control.id,label:control.label,outcome:'UNAVAILABLE',detail:`Not offered: ${missing.join(', ')}`};
      return{attribute:control.id,label:control.label,outcome:changed?'APPLIED':'ALREADY_CORRECT',detail:missing.length?`Unavailable: ${missing.join(', ')}`:desired.join(', ')};
    }
    const target=resolve(control.selectorStrategies,doc);if(!target)throw new Error('Control selector or fingerprint failed.');const element=target.element;
    if(control.kind==='CHECKBOX'){
      const want=!['no','false','0','off'].includes(normalize(desired[0]));const input=element as HTMLInputElement;if(input.checked===want)return{attribute:control.id,label:control.label,outcome:'ALREADY_CORRECT',detail:String(want)};element.click();await stable(control.verification,doc);return{attribute:control.id,label:control.label,outcome:input.checked===want?'APPLIED':'FAILED',detail:String(want)};
    }
    if(control.kind==='SELECT'){
      const select=element as HTMLSelectElement;const option=[...select.options].find(item=>matches(control,item.value,desired[0])||matches(control,item.text,desired[0]));if(!option)return{attribute:control.id,label:control.label,outcome:'UNAVAILABLE',detail:desired[0]};if(select.value===option.value)return{attribute:control.id,label:control.label,outcome:'ALREADY_CORRECT',detail:option.text};select.value=option.value;dispatch(select,['input','change']);await stable(control.verification,doc);return{attribute:control.id,label:control.label,outcome:select.value===option.value?'APPLIED':'FAILED',detail:option.text};
    }
    if(control.kind==='INPUT'){
      const input=element as HTMLInputElement;if(matches(control,input.value,desired[0]))return{attribute:control.id,label:control.label,outcome:'ALREADY_CORRECT',detail:desired[0]};input.value=desired[0];dispatch(input,['input','change','blur']);await stable(control.verification,doc);return{attribute:control.id,label:control.label,outcome:matches(control,input.value,desired[0])?'APPLIED':'FAILED',detail:desired[0]};
    }
    if(selected(element))return{attribute:control.id,label:control.label,outcome:'ALREADY_CORRECT',detail:desired[0]};element.click();await stable(control.verification,doc);return{attribute:control.id,label:control.label,outcome:'APPLIED',detail:desired[0]};
  }catch(error){return{attribute:control.id,label:control.label,outcome:'FAILED',detail:error instanceof Error?error.message:'Control execution failed'}}
}
function ordered(controls:ControlMapping[]):ControlMapping[]{const done=new Set<string>();const result:ControlMapping[]=[];let remaining=[...controls];while(remaining.length){const ready=remaining.filter(control=>(control.dependsOn||[]).every(id=>done.has(id)||!controls.some(c=>c.id===id)));if(!ready.length)return[...result,...remaining];for(const control of ready){result.push(control);done.add(control.id)}remaining=remaining.filter(control=>!ready.includes(control))}return result}
export async function executeMappings(state:AppState,mappings:ShopMapping[],doc:Document=document):Promise<ActionResult[]>{const controls=ordered(effectiveControls(mappings));const results:ActionResult[]=[];for(const control of controls){if(control.profileSort&&!state.shops[mappings[0].shopId]?.sortEnabled)continue;results.push(await executeControl(control,state,doc))}return results}
