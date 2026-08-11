import test from 'node:test';
import assert from 'node:assert/strict';
import { isZalando, ZALANDO } from '../src/domain/zalando.ts';
import { DEFAULT_STATE } from '../src/domain/defaults.ts';

test('shop identity is constrained to Zalando Germany', () => {
  assert.equal(isZalando('www.zalando.de'), true);
  assert.equal(isZalando('en.zalando.de'), true);
  assert.equal(isZalando('zalando.example'), false);
});

test('canonical preferences map to explicit Zalando values', () => {
  const profile = structuredClone(DEFAULT_STATE.profile);
  profile.attributes.shoeSizeEU.value = '42';
  profile.attributes.colors.value = ['Black', 'Navy'];
  assert.deepEqual(ZALANDO.filters.shoeSizeEU.values(profile), ['42']);
  assert.deepEqual(ZALANDO.filters.colors.values(profile), ['Black', 'Navy']);
  assert.equal(ZALANDO.sorting.PRICE_ASC, 'Lowest price');
});
