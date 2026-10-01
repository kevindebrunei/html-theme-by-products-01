import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, toRecords } from './csv.mjs'
import { deriveSeason, deriveLeagueLabel, buildProducts } from './build-products.mjs'

test('parseCsv: tách ô đơn giản', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,2,3'), [['a','b','c'], ['1','2','3']])
})

test('parseCsv: giữ dấu phẩy nằm trong ô có quote', () => {
  assert.deepEqual(parseCsv('a,b\n"x,y",z'), [['a','b'], ['x,y','z']])
})

test('parseCsv: quote lồng viết bằng hai dấu nháy', () => {
  assert.deepEqual(parseCsv('a\n"8.7"" L"'), [['a'], ['8.7" L']])
})

test('parseCsv: xuống dòng bên trong ô có quote không cắt hàng', () => {
  assert.deepEqual(parseCsv('a,b\n"one\ntwo",z'), [['a','b'], ['one\ntwo','z']])
})

test('toRecords: dùng hàng đầu làm khoá', () => {
  const rows = [['Title','Type'], ['Lunar','Tumbler']]
  assert.deepEqual(toRecords(rows), [{ Title: 'Lunar', Type: 'Tumbler' }])
})

test('deriveSeason: sản phẩm không phải tumbler luôn là year-round', () => {
  assert.equal(deriveSeason({ Type: 'Cap', 'URL handle': 'cap-nfl-x', Title: 'X', Tags: '' }), 'Year-round')
  assert.equal(deriveSeason({ Type: 'Shoes', 'URL handle': 'shoes-nfl-x', Title: 'X', Tags: '' }), 'Year-round')
})

test('deriveSeason: tumbler có từ khoá holiday là Christmas', () => {
  const rec = { Type: 'Tumbler', 'URL handle': 'tumbler-40oz-mlb-atlanta-braves-christmas-tum-1', Title: 'ATL Midnight Christmas', Tags: '' }
  assert.equal(deriveSeason(rec), 'Christmas')
})

test('deriveSeason: tumbler còn lại là Halloween', () => {
  const rec = { Type: 'Tumbler', 'URL handle': 'tumbler-40oz-halloween-general-tum-1', Title: 'Gothic Skull', Tags: '' }
  assert.equal(deriveSeason(rec), 'Halloween')
})

test('deriveLeagueLabel: Tumbler Halloween đổi nhãn thành No team', () => {
  assert.equal(deriveLeagueLabel('Tumbler Halloween'), 'No team')
  assert.equal(deriveLeagueLabel('Tumbler NFL'), 'NFL')
  assert.equal(deriveLeagueLabel('Cap NFL'), 'NFL')
})

test('buildProducts: gom variant và ảnh về một sản phẩm', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p><h3>Design Story</h3><p>Body.</p>,Backpack,,Size,S,49.95,59.95,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
    'bp-x-bp-20260923-xi-019,,,,,,M,59.95,69.95,https://cdn/02-main.webp,2,,',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  const out = buildProducts(csv, index)

  assert.equal(out.length, 1)
  assert.equal(out[0].sku, 'BP-20260923-XI-019')
  assert.equal(out[0].title, 'Vegas Noir')
  assert.equal(out[0].price, 49.95)
  assert.equal(out[0].variantLabel, 'Size')
  assert.deepEqual(out[0].variants.map(v => v.value), ['S', 'M'])
  assert.equal(out[0].hook, 'Hook.')
  assert.deepEqual(out[0].sections, [{ heading: 'Design Story', html: '<p>Body.</p>' }])
})

test('buildProducts: đường dẫn ảnh trỏ local và đã encode dấu cách', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p>,Backpack,,Title,Default Title,49.95,,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  const out = buildProducts(csv, index)

  assert.equal(out[0].images[0], '/products/Backpack/NFL/NFL-%20Las-Vegas-Raiders/BP-20260923-XI-019/01.webp')
  assert.ok(!out[0].images[0].includes('taveris'))
})

test('buildProducts: variant không có compare-at thì trả null', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p>,Backpack,,Title,Default Title,49.95,,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  assert.equal(buildProducts(csv, index)[0].compareAt, null)
})
