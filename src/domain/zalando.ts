import type { AttributeKey, Profile, SortValue } from './types';

export const ZALANDO = {
  id: 'zalando', name: 'Zalando', domains: ['zalando.de'], source: 'Official', version: '2.0.0',
  filters: {
    shoeSizeEU: { label: 'Size', values: (p: Profile) => [String(p.attributes.shoeSizeEU.value)] },
    clothingSize: { label: 'Size', values: (p: Profile) => [String(p.attributes.clothingSize.value)] },
    colors: { label: 'Colour', values: (p: Profile) => p.attributes.colors.value as string[] },
    brands: { label: 'Brand', values: (p: Profile) => p.attributes.brands.value as string[] },
    materials: { label: 'Material', values: (p: Profile) => p.attributes.materials.value as string[] }
  } satisfies Record<AttributeKey, { label: string; values: (p: Profile) => string[] }>,
  sorting: { POPULAR: 'Most popular', NEWEST: 'Newest', PRICE_ASC: 'Lowest price', PRICE_DESC: 'Highest price', DEALS: 'Deals' } satisfies Record<SortValue, string>
};

export function isZalando(hostname: string): boolean { return hostname === 'zalando.de' || hostname.endsWith('.zalando.de'); }
export function isListingPage(doc: Document): boolean {
  return ['Brand','Size','Colour','Price'].filter(name => doc.querySelector(`button[aria-label="filter by ${name}"]`)).length >= 3 && !!doc.querySelector('main');
}
