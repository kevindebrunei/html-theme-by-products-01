import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TYPE_ORDER, sectionId } from './catalog.mjs'
import { navHtml } from './render.mjs'

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

/*
  Host bật clean-URLs (Vercel, Netlify, `npx serve`) redirect
  /themes/light-minimal/index.html → /themes/light-minimal (không dấu / cuối),
  base URL tụt thành /themes/ và mọi path tương đối lệch một cấp → trang TRẮNG.
  Đã xác nhận bằng chạy thật, không phải suy đoán (spec §8).

  Quét MỌI href/src trong hai trang, không chỉ tiền tố "assets/" — Task 7 để
  sót href="index.html" trên product.html (path tương đối đúng loại đợt sửa
  này tồn tại để diệt) mà bản test cũ không bắt được vì nó chỉ nhìn "assets/".
*/
test('path asset tuyệt đối ở cả hai trang', () => {
  for (const page of ['index.html', 'product.html']) {
    const html = read(THEME, page)
    const refs = [...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1])
    for (const value of refs) {
      assert.match(value, /^(\/|https?:|#)/,
        `${page} còn path tương đối "${value}" — clean-URL host sẽ làm trắng trang hoặc trỏ sai chỗ`)
    }
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

/*
  Khớp nối vừa gãy ở Task 7 mà không ai canh: product.js sinh nav riêng cho
  PDP (không dùng chung DOM với trang chủ), nên không có gì tự động đảm bảo
  neo nó sinh ra còn trỏ tới id thật trong index.html khi index.html đổi cấu
  trúc. Test này dựng đúng hrefFor mà product.js dùng (navHtml + sectionId,
  path tuyệt đối) và đối chiếu với id thật trong index.html.
*/
test('neo nav PDP (product.js) trỏ tới id có thật trong index.html', () => {
  const html = read(THEME, 'index.html')
  const nav = navHtml((t) => `/themes/light-minimal/index.html#${sectionId(t)}`)
  const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
  assert.equal(hrefs.length, TYPE_ORDER.length)
  for (const href of hrefs) {
    assert.match(href, /^\/themes\/light-minimal\/index\.html#/, `neo PDP phải là path tuyệt đối: ${href}`)
    const hash = href.split('#')[1]
    assert.match(html, new RegExp(`id="${hash}"`), `không tìm thấy id="${hash}" trong index.html cho neo ${href}`)
  }
})

/*
  Chốt luôn ở mã nguồn thật: product.js phải dùng sectionId (không hardcode
  slug) và không còn tham chiếu #catalog — id đó đã bị Task 7 xoá khỏi
  index.html, bấm vào neo cũ chỉ im lặng về trang chủ, không cuộn tới đâu.
*/
test('product.js không còn trỏ #catalog, dùng sectionId để sinh neo', () => {
  const js = read(ASSETS, 'product.js')
  assert.doesNotMatch(js, /#catalog/, 'product.js còn tham chiếu #catalog đã bị xoá khỏi index.html')
  assert.match(js, /navHtml\(/, 'product.js phải dùng navHtml dùng chung với main.js')
  assert.match(js, /\/themes\/light-minimal\/index\.html#\$\{sectionId\(/,
    'product.js phải sinh neo bằng sectionId, path tuyệt đối')
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

/*
  .wordmark nền sẵn là font-weight: 600 (ngoại lệ duy nhất của theme). Quy tắc
  hover dùng chung .hover-wght:hover cũng đặt 600 — hover trên wordmark vì
  vậy là no-op đo được (600 → 600, không đổi gì). Test này đọc thẳng cả hai
  rule trong base.css và assert hai weight PHẢI khác nhau, để ai sau này lỡ
  chỉnh một trong hai cho trùng lại thì test đỏ ngay, không phải chờ soi bằng
  mắt trên trình duyệt thật mới bắt được.
*/
test('wordmark có đích hover khác weight nền — hover không được là no-op', () => {
  const css = read(ASSETS, 'base.css')
  const base = css.match(/\.wordmark\s*\{([^}]*)\}/)
  assert.ok(base, 'không tìm thấy rule .wordmark')
  const hover = css.match(/\.wordmark\.hover-wght:hover[^{]*\{([^}]*)\}/)
  assert.ok(hover, 'không tìm thấy rule hover riêng cho .wordmark.hover-wght')

  const weightOf = (body) => {
    const m = body.match(/font-weight:\s*(\d+)/)
    assert.ok(m, `rule không khai font-weight: ${body}`)
    return Number(m[1])
  }

  const baseWeight = weightOf(base[1])
  const hoverWeight = weightOf(hover[1])
  assert.equal(baseWeight, 600, 'weight nền của .wordmark phải giữ nguyên 600 (spec)')
  assert.notEqual(hoverWeight, baseWeight,
    `hover weight (${hoverWeight}) trùng weight nền (${baseWeight}) — hover là no-op`)
})

/* Task 7 để sót index.html và product.html lệch class wordmark — control trông giống nhau phải hành xử giống nhau */
test('wordmark dùng cùng class ở cả hai trang (hover-wght)', () => {
  for (const page of ['index.html', 'product.html']) {
    const html = read(THEME, page)
    assert.match(html, /class="wordmark hover-wght"/, `${page} thiếu class hover-wght trên wordmark`)
  }
})
