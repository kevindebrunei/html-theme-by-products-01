import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STYLE_FAMILY, deriveStyleFamily, displayFamily,
  byType, facetCounts, shouldRenderFacets, formatPrice, priceLabel,
} from './catalog.mjs'

const tumblerHalloween = { type: 'Tumbler', season: 'Halloween', title: 'PIT Regalia - Gilded Ornament' }
const tumblerChristmas = { type: 'Tumbler', season: 'Christmas', title: 'CHC Holiday Wrap' }
const cap = { type: 'Cap', season: 'Year-round', title: 'GB Heritage Crest' }
const shoes = { type: 'Shoes', season: 'Year-round', title: 'SF Heritage - Crimson, Cream and Gold' }
const bpHeritage = { type: 'Backpack', season: 'Year-round', title: 'DAL Star Club - Ivory and Navy Heritage Backpack' }
const bpDrip = { type: 'Backpack', season: 'Year-round', title: 'PHI Gold Drip - Crowned Eagle Graphic Backpack' }
const bpGraffiti = { type: 'Backpack', season: 'Year-round', title: 'PIT Gold Script - Graffiti Crown Backpack in Black and Gold' }

test('deriveStyleFamily: tumbler Halloween là Gothic Jewel', () => {
  assert.equal(deriveStyleFamily(tumblerHalloween), STYLE_FAMILY.GOTHIC)
})

test('deriveStyleFamily: tumbler Christmas là Holiday Ornament', () => {
  assert.equal(deriveStyleFamily(tumblerChristmas), STYLE_FAMILY.HOLIDAY)
})

test('deriveStyleFamily: cap và shoes luôn là Heritage Crest', () => {
  assert.equal(deriveStyleFamily(cap), STYLE_FAMILY.HERITAGE)
  assert.equal(deriveStyleFamily(shoes), STYLE_FAMILY.HERITAGE)
})

test('deriveStyleFamily: backpack có drip hoặc graffiti trong title là Gold Drip', () => {
  assert.equal(deriveStyleFamily(bpDrip), STYLE_FAMILY.GOLD_DRIP)
  assert.equal(deriveStyleFamily(bpGraffiti), STYLE_FAMILY.GOLD_DRIP)
})

test('deriveStyleFamily: backpack còn lại là Heritage Crest', () => {
  assert.equal(deriveStyleFamily(bpHeritage), STYLE_FAMILY.HERITAGE)
})

test('deriveStyleFamily: từ khoá drip chỉ áp cho backpack, không áp cho tumbler', () => {
  const tum = { type: 'Tumbler', season: 'Halloween', title: 'Gold Drip Gothic Tumbler' }
  assert.equal(deriveStyleFamily(tum), STYLE_FAMILY.GOTHIC)
})

test('displayFamily: Gold Drip gộp vào Heritage Crest ở lớp hiển thị', () => {
  assert.equal(displayFamily(STYLE_FAMILY.GOLD_DRIP), STYLE_FAMILY.HERITAGE)
  assert.equal(displayFamily(STYLE_FAMILY.GOTHIC), STYLE_FAMILY.GOTHIC)
})

test('byType: lọc đúng dòng sản phẩm', () => {
  const all = [tumblerHalloween, cap, bpDrip]
  assert.deepEqual(byType(all, 'Cap'), [cap])
})

test('facetCounts: đếm theo họ hiển thị, Gold Drip cộng vào Heritage', () => {
  const counts = facetCounts([bpHeritage, bpDrip, bpGraffiti])
  assert.equal(counts.get(STYLE_FAMILY.HERITAGE), 3)
  assert.equal(counts.has(STYLE_FAMILY.GOLD_DRIP), false)
})

test('facetCounts: tumbler tách hai họ', () => {
  const counts = facetCounts([tumblerHalloween, tumblerHalloween, tumblerChristmas])
  assert.equal(counts.get(STYLE_FAMILY.GOTHIC), 2)
  assert.equal(counts.get(STYLE_FAMILY.HOLIDAY), 1)
})

test('shouldRenderFacets: chỉ render khi có từ 2 họ trở lên', () => {
  assert.equal(shouldRenderFacets([tumblerHalloween, tumblerChristmas]), true)
  assert.equal(shouldRenderFacets([cap, cap]), false)
  assert.equal(shouldRenderFacets([bpHeritage, bpDrip]), false)
})

test('formatPrice: hai chữ số thập phân, null trả chuỗi rỗng', () => {
  assert.equal(formatPrice(49.95), '$49.95')
  assert.equal(formatPrice(40), '$40.00')
  assert.equal(formatPrice(null), '')
})

test('priceLabel: nhiều mức giá thì hiện from + giá thấp nhất', () => {
  const bp = { price: 49.95, variants: [{ price: 49.95 }, { price: 59.95 }, { price: 69.95 }] }
  assert.equal(priceLabel(bp), 'from $49.95')
})

test('priceLabel: một mức giá thì hiện thẳng', () => {
  const tum = { price: 49.95, variants: [{ price: 49.95 }] }
  assert.equal(priceLabel(tum), '$49.95')
})

test('priceLabel: không có variants thì rơi về trường price', () => {
  assert.equal(priceLabel({ price: 39.95 }), '$39.95')
})
