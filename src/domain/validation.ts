import type { ShopMapping } from './types';
export function validatePersonalMapping(mapping:any):mapping is ShopMapping{
  if(!mapping||mapping.schemaVersion!==1||mapping.source!=='PERSONAL'||!Array.isArray(mapping.domains)||!Array.isArray(mapping.controls)||!Array.isArray(mapping.pageRules))return false;
  if(/javascript:|<script|on[a-z]+\s*=/i.test(JSON.stringify(mapping)))return false;
  if(mapping.domains.some((domain:any)=>typeof domain!=='string'||!domain||/[/:]/.test(domain)))return false;
  const kinds=['CHECKBOX','SELECT','INPUT','CLICK','OPTION_GROUP'];const strategies=['EXACT','NORMALIZED_EXACT','NUMERIC','LOOKUP_TABLE'];
  const validStrategies=(items:any)=>Array.isArray(items)&&items.length<=8&&items.every((s:any)=>typeof s?.locator==='string'&&s.locator.length>0&&s.locator.length<=500);
  const validPages=mapping.pageRules.length<=20&&mapping.pageRules.every((rule:any)=>Array.isArray(rule.pathPatterns)&&Array.isArray(rule.requiredSelectors)&&Array.isArray(rule.excludedPathPatterns)&&rule.requiredSelectors.length<=20&&rule.requiredSelectors.every((s:any)=>typeof s==='string'&&s.length<=500));
  return validPages&&mapping.controls.length<=100&&mapping.controls.every((control:any)=>control&&typeof control.id==='string'&&kinds.includes(control.kind)&&Array.isArray(control.attributeCodes)&&validStrategies(control.selectorStrategies)&&(!control.triggerStrategies||validStrategies(control.triggerStrategies))&&(!control.saveStrategies||validStrategies(control.saveStrategies))&&strategies.includes(control.matching?.strategy)&&control.verification?.timeoutMs>0&&control.verification.timeoutMs<=15000);
}
