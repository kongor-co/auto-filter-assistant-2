import test from 'node:test';
import assert from 'node:assert/strict';
import { attributeValues, effectiveControls, hostnameMatches, mappingsForHost, OFFICIAL_MAPPINGS, wildcardMatches, ZALANDO_MAPPING } from '../src/domain/mappings.ts';
import { DEFAULT_STATE } from '../src/domain/defaults.ts';
import { validatePersonalMapping } from '../src/domain/validation.ts';
import type { ShopMapping } from '../src/domain/types.ts';

test('domain matching accepts exact hosts and subdomains only',()=>{
  assert.equal(hostnameMatches('en.zalando.de','zalando.de'),true);
  assert.equal(hostnameMatches('notzalando.de','zalando.de'),false);
  assert.equal(wildcardMatches('/womens-shoes/','/*'),true);
  assert.equal(wildcardMatches('/checkout/pay','/checkout/*'),true);
});

test('profile values are user-authored and normalized to a list',()=>{
  const state=structuredClone(DEFAULT_STATE);const colours=state.profile.attributes.find(item=>item.code==='preferred_colours')!;
  colours.value=['Petrol blue','Black'];assert.deepEqual(attributeValues(colours),['Petrol blue','Black']);assert.deepEqual(colours.options,[]);
});

test('official Zalando mapping uses the declarative engine schema',()=>{
  assert.equal(OFFICIAL_MAPPINGS[0].id,'official-zalando-de');
  assert.equal(ZALANDO_MAPPING.controls.find(control=>control.id==='colour')?.kind,'OPTION_GROUP');
  assert.equal(mappingsForHost(DEFAULT_STATE,'en.zalando.de').length,1);
});

test('personal control overrides an official control deterministically',()=>{
  const personal:ShopMapping={...structuredClone(ZALANDO_MAPPING),id:'personal',source:'PERSONAL',controls:[{...structuredClone(ZALANDO_MAPPING.controls[0]),id:'personal-size',overridesControlId:'size'}]};
  const controls=effectiveControls([ZALANDO_MAPPING,personal]);assert.equal(controls.some(control=>control.id==='size'),false);assert.equal(controls.some(control=>control.id==='personal-size'),true);
});

test('mapping validation rejects executable and excessive selector data',()=>{
  const mapping={...structuredClone(ZALANDO_MAPPING),id:'personal',source:'PERSONAL'};
  assert.equal(validatePersonalMapping(mapping),true);
  mapping.controls[0].selectorStrategies[0].locator='javascript:alert(1)';
  assert.equal(validatePersonalMapping(mapping),false);
});
