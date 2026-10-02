import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = dirname(fileURLToPath(import.meta.url))
const THEME = join(ASSETS, '..')
const read = (...p) => readFileSync(join(...p), 'utf8')

/*
  wght@400;600 là HAI WEIGHT TĨNH, không phải trục variable. Variable Font
  Hover sẽ chết lặng trên nó: trang vẫn trông bình thường, hiệu ứng không chạy.
*/
test('font nạp theo trục variable, không phải weight tĩnh', () => {
  const css = read(ASSETS, 'base.css')
  assert.match(css, /Cormorant\+Garamond:wght@300\.\.700/, 'Cormorant phải nạp trục 300..700')
  assert.match(css, /Inter:wght@300\.\.700/, 'Inter phải nạp trục 300..700')
  assert.doesNotMatch(css, /wght@400;600/, 'còn sót weight tĩnh')
})

/*
  base.css cũ đặt .reveal { opacity: 0 } làm mặc định và phụ thuộc JS trả về 1.
  JS không chạy — đúng kịch bản bug path gây ra — là toàn bộ nội dung vô hình.
*/
test('.reveal mặc định là hiện (spec §6.2)', () => {
  const css = read(ASSETS, 'base.css')
  const base = css.match(/\.reveal\s*\{([^}]*)\}/)
  assert.ok(base, 'không tìm thấy rule .reveal')
  assert.match(base[1], /opacity:\s*1/, '.reveal phải mặc định opacity: 1')
})

test('trạng thái ẩn chỉ nằm trong nhánh @supports', () => {
  const css = read(ASSETS, 'base.css')
  const idx = css.indexOf('@supports (animation-timeline')
  assert.ok(idx > -1, 'thiếu nhánh @supports (animation-timeline: view())')
  const before = css.slice(0, idx)
  assert.doesNotMatch(before, /\.reveal[^{]*\{[^}]*opacity:\s*0/,
    'có đường dẫn tới nội dung ẩn nằm ngoài nhánh @supports')
})

/* Spec §3.4: biên độ tương phản cỡ chữ là đòn bẩy luxury không tốn gì */
test('H1 hero dùng tới --fs-9', () => {
  assert.match(read(ASSETS, 'base.css'), /var\(--fs-9\)/,
    '--fs-9 được khai trong tokens.css nhưng không chỗ nào dùng')
})

import { TYPE_ORDER, sectionId } from './catalog.mjs'

/*
  Host bật clean-URLs (Vercel, Netlify, `npx serve`) redirect
  /themes/light-minimal/index.html → /themes/light-minimal (không dấu / cuối),
  base URL tụt thành /themes/ và mọi path tương đối lệch một cấp → trang TRẮNG.
  Đã xác nhận bằng chạy thật, không phải suy đoán (spec §8).
*/
test('path asset tuyệt đối ở cả hai trang', () => {
  for (const page of ['index.html', 'product.html']) {
    const html = read(THEME, page)
    assert.doesNotMatch(html, /(href|src)="assets\//,
      `${page} còn path tương đối — clean-URL host sẽ làm trắng trang`)
    assert.match(html, /\/themes\/light-minimal\/assets\//, `${page} thiếu path tuyệt đối`)
  }
})

/* Neo cuộn gãy thì im lặng, không báo lỗi gì — phải có test (spec §9) */
test('mọi dòng sản phẩm có section id tương ứng trong index.html', () => {
  const html = read(THEME, 'index.html')
  for (const type of TYPE_ORDER) {
    assert.match(html, new RegExp(`id="${sectionId(type)}"`),
      `index.html thiếu id="${sectionId(type)}" cho dòng ${type}`)
  }
})

test('sectionId sinh đúng dạng slug', () => {
  assert.equal(sectionId('Tumbler'), 'shop-tumbler')
  assert.equal(sectionId('Shoes'), 'shop-shoes')
})

/* Trang chủ không còn chế độ full catalog nên thanh facet không còn chỗ bám */
test('index.html không còn thanh facet', () => {
  const html = read(THEME, 'index.html')
  assert.doesNotMatch(html, /id="facets"/)
})

/*
  WCAG 2.2.2 Pause, Stop, Hide. Autoplay 6s là nội dung tự cập nhật quá 5 giây.
  Dừng-khi-rê-chuột KHÔNG thoả: người dùng bàn phím không rê chuột (spec §4.3).
*/
test('carousel có nút tạm dừng và nó là <button>', () => {
  const html = read(THEME, 'index.html')
  const m = html.match(/<button[^>]*data-carousel-pause[^>]*>/)
  assert.ok(m, 'không tìm thấy <button data-carousel-pause> — WCAG 2.2.2')
  assert.match(m[0], /type="button"/)
})

test('carousel khai đúng vai trò cho screen reader', () => {
  const html = read(THEME, 'index.html')
  assert.match(html, /aria-roledescription="carousel"/)
  assert.match(html, /data-carousel-live[^>]*aria-live="polite"|aria-live="polite"[^>]*data-carousel-live/)
})
