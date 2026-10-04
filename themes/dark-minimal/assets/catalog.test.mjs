import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  STYLE_FAMILY, deriveStyleFamily, displayFamily,
  byType, formatPrice, priceLabel,
  CURATED, NO_SWAP, curatedByType, TYPE_ORDER,
  sectionId, hashSectionTarget,
  CATALOG_DISCIPLINE, catalogDiscipline,
} from './catalog.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRODUCTS = JSON.parse(
  readFileSync(join(HERE, '..', '..', '..', 'products', 'products.json'), 'utf8')
).products

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

test('tuyển tay: đúng 12 SKU', () => {
  assert.equal(CURATED.length, 12)
})

test('tuyển tay: không trùng mã', () => {
  assert.equal(new Set(CURATED).size, 12)
})

/*
  Danh sách tuyển tay là chỗ duy nhất trong theme mà một lỗi gõ làm biến mất
  hẳn một sản phẩm khỏi cửa hàng — trang chủ không còn chế độ full catalog.
*/
test('tuyển tay: mọi SKU tồn tại trong products.json', () => {
  const known = new Set(PRODUCTS.map((p) => p.sku))
  for (const sku of CURATED) {
    assert.ok(known.has(sku), `SKU không tồn tại: ${sku}`)
  }
})

test('tuyển tay: đúng 3 SKU mỗi dòng sản phẩm', () => {
  for (const type of TYPE_ORDER) {
    assert.equal(curatedByType(PRODUCTS, type).length, 3, `Dòng ${type} không đủ 3`)
  }
})

test('tuyển tay: dòng Tumbler phủ cả hai họ style', () => {
  const families = new Set(
    curatedByType(PRODUCTS, 'Tumbler').map((p) => displayFamily(deriveStyleFamily(p)))
  )
  assert.ok(families.size >= 2, `Tumbler chỉ có họ: ${[...families].join(', ')}`)
})

test('tuyển tay: NO_SWAP chỉ chứa SKU nằm trong CURATED', () => {
  for (const sku of NO_SWAP) {
    assert.ok(CURATED.includes(sku), `NO_SWAP có SKU ngoài danh sách: ${sku}`)
  }
})

test('curatedByType giữ đúng thứ tự trong CURATED', () => {
  const caps = curatedByType(PRODUCTS, 'Cap').map((p) => p.sku)
  const expected = CURATED.filter((s) => caps.includes(s))
  assert.deepEqual(caps, expected)
})

/*
  hashSectionTarget là phần QUYẾT ĐỊNH của fix deep-link scroll (spec nghiệm
  thu Task 9): browser cuộn tới hash khi tài liệu còn rỗng, renderSections()
  render xong 12 thẻ thì chiều cao nhảy và vị trí cũ trật khỏi dải đích (đo
  thật lệch tới 1804px). main.js cuộn lại sau khi render xong, nhưng PHẦN
  CHẠM DOM đó không test đơn vị được — tách quyết định "hash này có trỏ tới
  một dải có thật không" ra đây để test không cần DOM.
*/
test('hashSectionTarget: hash khớp một dải có thật trả về đúng id', () => {
  const validIds = TYPE_ORDER.map(sectionId)
  assert.equal(hashSectionTarget('#shop-shoes', validIds), 'shop-shoes')
})

test('hashSectionTarget: hash rác trả về null', () => {
  const validIds = TYPE_ORDER.map(sectionId)
  assert.equal(hashSectionTarget('#khong-ton-tai', validIds), null)
})

test('hashSectionTarget: hash rỗng hoặc vắng mặt trả về null', () => {
  const validIds = TYPE_ORDER.map(sectionId)
  assert.equal(hashSectionTarget('', validIds), null)
  assert.equal(hashSectionTarget(undefined, validIds), null)
})

test('hashSectionTarget: hash đúng định dạng nhưng ngoài danh sách dải trả về null', () => {
  assert.equal(hashSectionTarget('#shop-hat', ['shop-tumbler', 'shop-cap']), null)
})

test('hashSectionTarget: nhận hash có hoặc không có dấu #', () => {
  assert.equal(hashSectionTarget('shop-tumbler', ['shop-tumbler']), 'shop-tumbler')
})

test('catalogDiscipline: đủ 4 dòng chính với roman, name, description, specs, care', () => {
  for (const t of TYPE_ORDER) {
    const disc = catalogDiscipline(t)
    assert.ok(disc.roman, `Thiếu roman cho ${t}`)
    assert.ok(disc.name, `Thiếu name cho ${t}`)
    assert.ok(disc.description && disc.description.length > 50, `Description quá ngắn hoặc thiếu cho ${t}`)
    assert.ok(Array.isArray(disc.specs) && disc.specs.length >= 4, `Thiếu specs cho ${t}`)
    assert.ok(disc.care && disc.care.length > 20, `Thiếu care cho ${t}`)
  }
})

test('catalogDiscipline: fallback an toàn cho type lạ', () => {
  const disc = catalogDiscipline('Unknown')
  assert.ok(disc.description)
  assert.equal(disc.roman, '·')
})

