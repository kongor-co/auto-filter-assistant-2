import type { ControlKind, PickerResult, SelectorStrategy, StructuralFingerprint } from '../domain/types';

function nameOf(element:HTMLElement):string{return element.getAttribute('aria-label')||(element as HTMLInputElement).labels?.[0]?.textContent?.trim()||element.getAttribute('title')||element.textContent?.trim().slice(0,120)||''}
function esc(value:string):string{return CSS.escape(value)}
function unique(selector:string,doc:Document):boolean{try{return doc.querySelectorAll(selector).length===1}catch{return false}}
function selectorFor(element:HTMLElement,doc:Document):string{
  if(element.id&&unique(`#${esc(element.id)}`,doc))return`#${esc(element.id)}`;
  for(const attribute of ['data-testid','data-test','data-filter','data-qa','name','aria-label']){const value=element.getAttribute(attribute);if(value){const selector=`${element.tagName.toLowerCase()}[${attribute}="${CSS.escape(value)}"]`;if(unique(selector,doc))return selector}}
  const role=element.getAttribute('role');if(role){const selector=`${element.tagName.toLowerCase()}[role="${CSS.escape(role)}"]`;if(unique(selector,doc))return selector}
  const classes=[...element.classList].filter(name=>name.length<50&&!/\d{4,}|^[a-z0-9_-]{12,}$/i.test(name)).slice(0,2);if(classes.length){const selector=`${element.tagName.toLowerCase()}${classes.map(name=>`.${esc(name)}`).join('')}`;if(unique(selector,doc))return selector}
  const parts:string[]=[];let current:HTMLElement|null=element;while(current&&current!==doc.body&&parts.length<4){const tag=current.tagName.toLowerCase();const siblings=current.parentElement?[...current.parentElement.children].filter(child=>child.tagName===current!.tagName):[];parts.unshift(`${tag}:nth-of-type(${Math.max(1,siblings.indexOf(current)+1)})`);const selector=parts.join(' > ');if(unique(selector,doc))return selector;current=current.parentElement}return parts.join(' > ')
}
function kindOf(element:HTMLElement):ControlKind{const tag=element.tagName.toLowerCase();const type=(element as HTMLInputElement).type;if(type==='checkbox'||type==='radio')return'CHECKBOX';if(tag==='select')return'SELECT';if(tag==='input'||tag==='textarea')return'INPUT';return'CLICK'}
function fingerprintFor(element:HTMLElement):StructuralFingerprint{return{tag:element.tagName.toLowerCase(),role:element.getAttribute('role')||undefined,type:(element as HTMLInputElement).type||undefined,accessibleName:nameOf(element)||undefined,expectedExpandedCapability:element.hasAttribute('aria-expanded')||undefined}}
function targetFor(node:EventTarget|null):HTMLElement|null{const element=node instanceof HTMLElement?node:null;return element?.closest<HTMLElement>('input,select,textarea,button,[role="checkbox"],[role="radio"],[role="switch"],[role="button"],[role="combobox"],[role="slider"],[contenteditable="true"]')||element}

export function startPicker(doc:Document=document):()=>void{
  const overlay=doc.createElement('div');overlay.id='autofilter-picker-outline';overlay.style.cssText='position:fixed;pointer-events:none;z-index:2147483646;border:3px solid #d9f63c;background:#d9f63c22;border-radius:6px;display:none';
  const tip=doc.createElement('div');tip.id='autofilter-picker-tip';tip.style.cssText='position:fixed;z-index:2147483647;left:16px;top:16px;background:#161916;color:white;padding:10px 13px;border-radius:10px;font:600 12px system-ui;box-shadow:0 8px 30px #0006';tip.textContent='AutoFilter mapping: select a filter control · Esc to cancel';doc.documentElement.append(overlay,tip);
  let current:HTMLElement|null=null;
  const move=(event:MouseEvent)=>{const target=targetFor(event.target);if(!target||target===tip||target===overlay)return;current=target;const rect=target.getBoundingClientRect();Object.assign(overlay.style,{display:'block',left:`${rect.left-3}px`,top:`${rect.top-3}px`,width:`${rect.width+6}px`,height:`${rect.height+6}px`})};
  const cleanup=()=>{doc.removeEventListener('mousemove',move,true);doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',key,true);overlay.remove();tip.remove()};
  const cancel=()=>{cleanup();void chrome.runtime.sendMessage({type:'PICKER_CANCELLED'})};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();cancel()}};
  const click=(event:MouseEvent)=>{const element=current||targetFor(event.target);if(!element)return;event.preventDefault();event.stopImmediatePropagation();const selector:SelectorStrategy={locator:selectorFor(element,doc),fingerprint:fingerprintFor(element)};const input=element as HTMLInputElement;const result:PickerResult={origin:location.origin,hostname:location.hostname,url:location.href,pageTitle:doc.title,selector,inferredKind:kindOf(element),metadata:{tag:element.tagName.toLowerCase(),role:element.getAttribute('role')||'',type:input.type||'',accessibleName:nameOf(element),text:(element.textContent||'').trim().slice(0,160),optionValues:element instanceof HTMLSelectElement?[...element.options].map(option=>option.text):[]}};cleanup();void chrome.runtime.sendMessage({type:'PICKER_SELECTED',result})};
  doc.addEventListener('mousemove',move,true);doc.addEventListener('click',click,true);doc.addEventListener('keydown',key,true);return cleanup;
}
