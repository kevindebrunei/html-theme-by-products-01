import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml, imageAlt, cardHtml, galleryHtml, sectionsHtml, navHtml, gridHtml, GRID_EMPTY_MESSAGE } from './render.mjs'
import { STYLE_FAMILY, TYPE_ORDER, sectionId } from './catalog.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRODUCTS = JSON.parse(
  readFileSync(join(HERE, '..', '..', '..', 'products', 'products.json'), 'utf8')
).products

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

/*
  Path tương đối từng làm trắng cả trang trên host bật clean-URLs: chúng redirect
  /themes/light-minimal/index.html -> /themes/light-minimal (không dấu / cuối),
  base URL tụt một cấp và mọi asset trỏ sai. Test ở trên chỉ kiểm chuỗi
  'product.html?sku=...' nên xanh với cả hai dạng — test này khoá tiền tố tuyệt đối.
*/
test('cardHtml: href dùng path tuyệt đối, không phải tương đối', () => {
  const html = cardHtml(product)
  assert.match(html, /href="\/themes\/light-minimal\/product\.html\?sku=/)
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

const fiveShot = {
  sku: 'TUM-1', title: 'PIT Regalia', type: 'Tumbler', season: 'Halloween',
  price: 49.95, variants: [{ price: 49.95 }],
  images: ['/a/01.webp', '/a/02.webp', '/a/03.webp', '/a/04.webp', '/a/05.webp'],
  sections: [
    { heading: 'Design Story', html: '<p>Body.</p>' },
    { heading: 'Care', html: '<ul><li>Hand wash.</li></ul>' },
  ],
}

const fourShot = { ...fiveShot, sku: 'CAP-20260923-UY-021', title: 'DET - Motor City Emblem', type: 'Cap',
  season: 'Year-round', images: ['/b/01.webp', '/b/02.webp', '/b/03.webp', '/b/04.webp'] }

test('galleryHtml: render đúng số ảnh thật, không hardcode 5', () => {
  assert.equal((galleryHtml(fiveShot).match(/<img/g) ?? []).length, 5)
  assert.equal((galleryHtml(fourShot).match(/<img/g) ?? []).length, 4)
})

test('galleryHtml: mỗi ảnh có alt riêng theo vị trí', () => {
  const html = galleryHtml(fiveShot)
  assert.ok(html.includes('PIT Regalia - front'))
  assert.ok(html.includes('PIT Regalia - in use'))
})

test('galleryHtml: SKU 4 ảnh không sinh alt "in use" của vị trí thứ 5', () => {
  assert.equal(galleryHtml(fourShot).includes('- in use'), false)
})

test('galleryHtml: không có ảnh thì trả chuỗi rỗng', () => {
  assert.equal(galleryHtml({ ...fiveShot, images: [] }), '')
})

test('sectionsHtml: giữ nguyên html thân bài, escape tiêu đề', () => {
  const html = sectionsHtml(fiveShot)
  assert.ok(html.includes('<p>Body.</p>'))
  assert.ok(html.includes('Design Story'))
  assert.ok(html.includes('<li>Hand wash.</li>'))
})

test('sectionsHtml: thiếu sections thì trả chuỗi rỗng, không vỡ', () => {
  assert.equal(sectionsHtml({ ...fiveShot, sections: undefined }), '')
})

const TWO_IMG = {
  sku: 'TUM-1', title: 'DAL Test', type: 'Tumbler', season: 'Halloween',
  price: 49.95, compareAt: 59.95,
  images: ['/products/a/01.webp', '/products/a/02.webp'],
}

test('cardHtml: hai ảnh chồng nhau khi SKU có ảnh 02', () => {
  const html = cardHtml(TWO_IMG)
  assert.match(html, /card__img--primary/)
  assert.match(html, /card__img--hover/)
  assert.match(html, /02\.webp/)
})

/* Ảnh hover là bản sao trang trí — screen reader không được đọc hai lần. */
test('cardHtml: ảnh hover có alt rỗng và aria-hidden', () => {
  const html = cardHtml(TWO_IMG)
  const hover = html.match(/<img[^>]*card__img--hover[^>]*>/)[0]
  assert.match(hover, /alt=""/)
  assert.match(hover, /aria-hidden="true"/)
})

test('cardHtml: noSwap thì không render ảnh hover', () => {
  const html = cardHtml(TWO_IMG, { noSwap: true })
  assert.doesNotMatch(html, /card__img--hover/)
  assert.doesNotMatch(html, /02\.webp/)
})

test('cardHtml: SKU chỉ có một ảnh thì không render ảnh hover', () => {
  const html = cardHtml({ ...TWO_IMG, images: ['/products/a/01.webp'] })
  assert.doesNotMatch(html, /card__img--hover/)
})

test('cardHtml: ảnh hover lazy, không chặn render', () => {
  const hover = cardHtml(TWO_IMG).match(/<img[^>]*card__img--hover[^>]*>/)[0]
  assert.match(hover, /loading="lazy"/)
})

/*
  Trang chủ không còn chế độ full catalog (spec §7.3) — mỗi dòng chỉ render
  3/12 SKU tuyển tay qua curatedByType. Đếm theo toàn catalog cạnh tên dòng
  là một con số nói dối hiện trên mọi lần tải trang (fix7 mục 1).
*/
test('navHtml: đủ 4 dòng theo TYPE_ORDER, không in số đếm nào', () => {
  const html = navHtml((t) => `#${sectionId(t)}`)
  for (const t of TYPE_ORDER) {
    assert.ok(html.includes(sectionId(t)), `thiếu neo cho ${t}`)
  }
  assert.doesNotMatch(html, /<span class="muted">/, 'nav không được bọc số đếm')
  assert.doesNotMatch(html, /\d/, 'nav không được chứa chữ số nào — mọi con số >3 đều là nói dối, "3" lặp 4 lần thì vô nghĩa')
})

test('navHtml: hrefFor quyết định neo, không hardcode trang chủ hay PDP', () => {
  const html = navHtml((t) => `/themes/light-minimal/index.html#${sectionId(t)}`)
  assert.match(html, /href="\/themes\/light-minimal\/index\.html#shop-tumbler"/)
})

/*
  gridHtml — hồi quy fix7 mục 5: loadProducts() nuốt lỗi mạng và trả [] khi
  cả hai URL đều hỏng, curatedByType rỗng cho mọi dòng. Bản cũ có #gridEmpty
  cho đúng tình huống này; bản 4-dải bỏ hẳn mà không thay bằng gì.
*/
test('gridHtml: dòng rỗng hiện thông báo, không phải lưới trống trơn', () => {
  const html = gridHtml([], 'Tumbler')
  assert.match(html, /grid__empty/)
  assert.ok(html.includes(GRID_EMPTY_MESSAGE))
})

test('gridHtml: thông báo rỗng không chứa cụm bị chặn hay tên giải', () => {
  const html = gridHtml([], 'Cap').toLowerCase()
  for (const phrase of [
    'officially licensed', 'official', 'licensed', 'authentic', 'genuine',
    'must-have', 'perfect gift for any fan',
  ]) {
    assert.equal(html.includes(phrase), false, `thông báo rỗng chứa cụm bị cấm: "${phrase}"`)
  }
  for (const league of ['nfl', 'nba', 'mlb', 'wwe']) {
    assert.equal(new RegExp(`\\b${league}\\b`, 'i').test(html), false, `thông báo rỗng chứa tên giải: ${league}`)
  }
})

test('gridHtml: có sản phẩm tuyển tay thì render đủ thẻ, không hiện thông báo rỗng', () => {
  const html = gridHtml(PRODUCTS, 'Tumbler')
  assert.equal((html.match(/class="card reveal"/g) ?? []).length, 3)
  assert.doesNotMatch(html, /grid__empty/)
})
