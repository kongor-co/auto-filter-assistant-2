import type { AppState, ControlMapping, PageRule, SelectorStrategy, ShopMapping, UserAttribute } from './types';

const fp = (locator:string, tag:string, accessibleName:string, extra:SelectorStrategy['fingerprint']={}):SelectorStrategy => ({locator,fingerprint:{tag,accessibleName,...extra}});
const dialogGroup = (id:string,label:string,attributeCodes:string[]):ControlMapping => ({
  id,label,attributeCodes,kind:'OPTION_GROUP',
  triggerStrategies:[fp(`button[aria-label="filter by ${label}"]`,'button',`filter by ${label}`,{expectedExpandedCapability:true})],
  selectorStrategies:[fp(`[role="dialog"][aria-label="filter by ${label}"]`,'div',`filter by ${label}`,{role:'dialog',minimumOptionCount:2})],
  optionSelector:'input[type="checkbox"]',optionValueSource:'label',
  saveStrategies:[fp(`button[aria-label="Save the ${label} filter"]`,'button',`Save the ${label} filter`)],
  matching:{strategy:'NORMALIZED_EXACT'},verification:{listingSelector:'main',quietPeriodMs:550,timeoutMs:6500}
});

export const ZALANDO_MAPPING:ShopMapping={
  id:'official-zalando-de',shopId:'zalando',shopName:'Zalando Germany',source:'OFFICIAL',schemaVersion:1,mappingVersion:'4.0.0',
  domains:['zalando.de'],pageRules:[{id:'product-listing',pathPatterns:['/*'],requiredSelectors:['main','button[aria-label="filter by Size"]'],excludedPathPatterns:['/cart/*','/myaccount/*','/checkout/*','/login/*']}],
  controls:[
    dialogGroup('size','Size',['shoe_size_eu','clothing_size']),dialogGroup('colour','Colour',['preferred_colours']),
    dialogGroup('brand','Brand',['preferred_brands']),dialogGroup('material','Material',['preferred_materials']),
    {id:'sorting',label:'Sort',attributeCodes:[],profileSort:true,kind:'OPTION_GROUP',
      triggerStrategies:[fp('button[aria-label="Sort by"]','button','Sort by',{expectedExpandedCapability:true})],
      selectorStrategies:[fp('[role="dialog"][aria-label="Sort by"]','div','Sort by',{role:'dialog',minimumOptionCount:2})],
      optionSelector:'input[type="radio"]',optionValueSource:'label',saveStrategies:[fp('button[aria-label="Save the Sort by filter"]','button','Save the Sort by filter')],
      matching:{strategy:'LOOKUP_TABLE',lookup:{POPULAR:'Most popular',NEWEST:'Newest',PRICE_ASC:'Lowest price',PRICE_DESC:'Highest price',DEALS:'Deals'}},
      verification:{listingSelector:'main',quietPeriodMs:550,timeoutMs:6500}}
  ],health:'HEALTHY',enabled:true
};

export const OFFICIAL_MAPPINGS:ShopMapping[]=[ZALANDO_MAPPING];
export function attributeValues(attribute:UserAttribute):string[]{
  if(Array.isArray(attribute.value))return attribute.value.map(String).map(v=>v.trim()).filter(Boolean);
  if(typeof attribute.value==='boolean')return [attribute.value?'Yes':'No'];
  const value=String(attribute.value??'').trim();return value?[value]:[];
}
export function hostnameMatches(hostname:string,domain:string):boolean{const host=hostname.toLowerCase().replace(/^www\./,'');const target=domain.toLowerCase().replace(/^www\./,'');return host===target||host.endsWith(`.${target}`)}
export function wildcardMatches(value:string,pattern:string):boolean{const escaped=pattern.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp(`^${escaped}$`,'i').test(value)}
export function pageRuleMatches(rule:PageRule,url:URL,doc:Document):boolean{
  if(rule.excludedPathPatterns.some(pattern=>wildcardMatches(url.pathname,pattern)))return false;
  if(!rule.pathPatterns.some(pattern=>wildcardMatches(url.pathname,pattern)))return false;
  return rule.requiredSelectors.every(selector=>{try{return !!doc.querySelector(selector)}catch{return false}});
}
export function mappingsForHost(state:AppState,hostname:string):ShopMapping[]{return [...OFFICIAL_MAPPINGS,...state.personalMappings].filter(mapping=>mapping.enabled&&!['DISABLED','BROKEN','PERMISSION_REQUIRED'].includes(mapping.health)&&mapping.domains.some(domain=>hostnameMatches(hostname,domain)))}
export function effectiveControls(mappings:ShopMapping[]):ControlMapping[]{
  const personal=mappings.filter(m=>m.source==='PERSONAL');const overridden=new Set(personal.flatMap(m=>m.controls.map(c=>c.overridesControlId).filter(Boolean) as string[]));
  return [...mappings.filter(m=>m.source==='OFFICIAL').flatMap(m=>m.controls).filter(c=>!overridden.has(c.id)),...personal.flatMap(m=>m.controls)];
}
export function shopIdForHost(state:AppState,hostname:string):string|null{return mappingsForHost(state,hostname)[0]?.shopId||null}
