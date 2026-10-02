/*
  catalog.mjs — logic thuần của catalog light-minimal.
  Không chạm DOM, không fetch. Mọi thứ ở đây test được bằng node:test.
*/

export const STYLE_FAMILY = {
  GOTHIC: 'Gothic Jewel',
  HOLIDAY: 'Holiday Ornament',
  HERITAGE: 'Heritage Crest',
  GOLD_DRIP: 'Gold Drip',
}

/* Đúng 3 backpack mang hai từ này: PHI, PIT, SF (spec §2.1). */
const DRIP_WORDS = ['drip', 'graffiti']

export function deriveStyleFamily(product) {
  if (product.type === 'Tumbler') {
    return product.season === 'Christmas' ? STYLE_FAMILY.HOLIDAY : STYLE_FAMILY.GOTHIC
  }
  if (product.type === 'Backpack') {
    const title = String(product.title ?? '').toLowerCase()
    if (DRIP_WORDS.some((w) => title.includes(w))) return STYLE_FAMILY.GOLD_DRIP
  }
  return STYLE_FAMILY.HERITAGE
}

/* Gold Drip chỉ có 3 SKU — quá mỏng để đứng riêng ở mặt tiền (spec §2.2). */
export function displayFamily(family) {
  return family === STYLE_FAMILY.GOLD_DRIP ? STYLE_FAMILY.HERITAGE : family
}

export const TYPE_ORDER = ['Tumbler', 'Cap', 'Backpack', 'Shoes']
export const TYPE_LABEL = { Tumbler: 'Tumblers', Cap: 'Caps', Backpack: 'Backpacks', Shoes: 'Shoes' }

export function byType(products, type) {
  return products.filter((p) => p.type === type)
}

export function facetCounts(products) {
  const counts = new Map()
  for (const p of products) {
    const f = displayFamily(deriveStyleFamily(p))
    counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return counts
}

/* Caps / Backpacks / Shoes đều một họ → không render facet (spec §6). */
export function shouldRenderFacets(products) {
  return facetCounts(products).size > 1
}

export function formatPrice(n) {
  return n == null ? '' : '$' + Number(n).toFixed(2)
}

export function priceLabel(product) {
  const prices = [...new Set((product.variants ?? []).map((v) => v.price))]
  if (prices.length > 1) return `from ${formatPrice(Math.min(...prices))}`
  return formatPrice(prices[0] ?? product.price)
}
