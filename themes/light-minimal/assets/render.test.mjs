import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, imageAlt, cardHtml, facetBarHtml } from './render.mjs'
import { STYLE_FAMILY } from './catalog.mjs'

const product = {
  sku: 'TUM-20260923-UY-009',
  title: 'PIT Regalia - Gilded Ornament, Crown and Quiet Shadow',
  seoTitle: 'Steelers Tumbler - Gold Baroque Skull Crown Design',
  type: 'Tumbler',
  season: 'Halloween',
  price: 49.95,
  compareAt: 59.95,
  variants: [{ value: null, price: 49.95, compareAt: 59.95 }],
  images: ['/products/a/01.webp', '/products/a/02.webp'],
}

test('escapeHtml: chặn ký tự phá markup', () => {
  assert.equal(escapeHtml('a & b <c> "d"'), 'a &amp; b &lt;c&gt; &quot;d&quot;')
  assert.equal(escapeHtml(null), '')
})

test('imageAlt: hậu tố khác nhau theo vị trí ảnh (spec §8.3)', () => {
  assert.equal(imageAlt(product, 0), `${product.title} - front`)
  assert.equal(imageAlt(product, 1), `${product.title} - detail`)
  assert.equal(imageAlt(product, 4), `${product.title} - in use`)
})

test('imageAlt: vị trí ngoài danh sách vẫn trả hậu tố hợp lệ', () => {
  assert.equal(imageAlt(product, 9), `${product.title} - view`)
})

test('imageAlt: dùng title viết tắt, KHÔNG dùng seoTitle có tên đội đầy đủ', () => {
  const alt = imageAlt(product, 0)
  assert.ok(alt.includes('PIT'))
  assert.equal(alt.includes('Steelers'), false)
})

test('cardHtml: có lề passepartout, không có scrim', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('card__mat'))
  assert.equal(html.includes('scrim'), false)
})

test('cardHtml: nhãn ghi dòng sản phẩm và họ style, không ghi tên giải', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('Tumblers'))
  assert.ok(html.includes(STYLE_FAMILY.GOTHIC))
  assert.equal(/\bNFL\b/.test(html), false)
})

test('cardHtml: link trỏ PDP kèm sku đã encode', () => {
  assert.ok(cardHtml(product).includes('product.html?sku=TUM-20260923-UY-009'))
})

test('cardHtml: có width/height để tránh layout shift', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('width="1264"'))
  assert.ok(html.includes('height="1264"'))
  assert.ok(html.includes('loading="lazy"'))
})

test('cardHtml: giá và giá gạch', () => {
  const html = cardHtml(product)
  assert.match(html, /<p class="card__price">\$49\.95<s class="price__was">\$59\.95<\/s><\/p>/)
})

test('cardHtml: backpack nhiều variant hiện from, không hiện giá gạch', () => {
  const bp = {
    sku: 'BP-1', title: 'DAL Star Club', type: 'Backpack', season: 'Year-round',
    price: 49.95, compareAt: 59.95,
    variants: [{ price: 49.95 }, { price: 59.95 }, { price: 69.95 }],
    images: ['/x/01.webp'],
  }
  const html = cardHtml(bp)
  assert.ok(html.includes('from $49.95'))
  assert.equal(html.includes('price__was'), false)
})

test('cardHtml: thiếu ảnh thì không sinh src rỗng gây request thừa', () => {
  const noImg = { ...product, images: [] }
  assert.equal(/src=""/.test(cardHtml(noImg)), false)
})

test('cardHtml: title có ký tự đặc biệt được escape', () => {
  const odd = { ...product, title: 'Beauty & "The End"' }
  const html = cardHtml(odd)
  assert.ok(html.includes('Beauty &amp; &quot;The End&quot;'))
})

test('facetBarHtml: render một nút cho mỗi họ, đánh dấu nút đang chọn', () => {
  const counts = new Map([[STYLE_FAMILY.GOTHIC, 33], [STYLE_FAMILY.HOLIDAY, 10]])
  const html = facetBarHtml(counts, STYLE_FAMILY.HOLIDAY)
  assert.ok(html.includes('All 43'))
  assert.ok(html.includes('Gothic Jewel 33'))
  assert.ok(html.includes('Holiday Ornament 10'))
  assert.ok(html.includes('aria-pressed="true"'))
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
})

test('facetBarHtml: không truyền họ đang chọn thì All được chọn', () => {
  const counts = new Map([[STYLE_FAMILY.GOTHIC, 33], [STYLE_FAMILY.HOLIDAY, 10]])
  const html = facetBarHtml(counts, null)
  assert.match(html, /data-family=""[^>]*aria-pressed="true"/)
})
