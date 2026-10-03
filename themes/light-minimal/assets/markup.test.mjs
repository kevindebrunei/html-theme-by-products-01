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
  Quét toàn bộ base.css, mọi rule `.reveal { ... }` — không chỉ rule ĐẦU TIÊN
  (regex không global sẽ bỏ sót rule thứ hai) và không chỉ phần văn bản TRƯỚC
  một mốc cố định như @supports (một rule `.reveal { opacity: 0 }` chèn vào
  SAU @supports nhưng vẫn ngoài mọi nhánh motion sẽ lọt qua kiểu kiểm bằng
  vị trí). Bài test cũ (hai bài, gộp lại đây) khẳng định "trạng thái ẩn chỉ
  nằm trong nhánh @supports" nhưng thực ra .js-reveal { opacity: 0 } NẰM
  NGOÀI @supports — đó là THIẾT KẾ ĐÚNG (xem chú thích ngay dưới), không
  phải lỗi, nên tên cũ nói sai với code.

  Điều kiện thật cần canh: `.reveal` ở top-level (ngoài mọi @media) phải mặc
  định opacity: 1, và bất cứ rule `.reveal` nào có opacity: 0 thì bắt buộc
  phải nằm lồng trong nhánh @media (prefers-reduced-motion: no-preference) —
  không được có đường dẫn nào tới nội dung ẩn vĩnh viễn nằm ngoài nhánh đó.

  (.js-reveal là selector KHÁC — nhánh dự phòng main.js chỉ gắn khi trình
  duyệt không hỗ trợ @supports (animation-timeline: view()). Nó đứng ngoài
  @supports nhưng vẫn lồng trong @media (prefers-reduced-motion: no-prefer-
  ence) nên không vi phạm luật "mặc định là hiện": khi JS không chạy để gắn
  class .js-reveal, phần tử không bao giờ mang class đó nên không bao giờ
  nhận opacity: 0. Nếu ai "sửa" test này để đòi .js-reveal nằm trong
  @supports thì JS fallback sẽ hết chỗ đứng — @supports chỉ chạy đúng khi
  trình duyệt CÓ animation-timeline, trái ngược mục đích nhánh JS.)
*/
function findRevealRules(cssText) {
  // Bóc comment /* ... */ trước — nếu không, text comment ngay trước một
  // selector bị gộp vào buf và dính luôn vào selector (vd ".reveal" đọc
  // thành "/* ... */\n.reveal"), làm so khớp selector === '.reveal' trật.
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const NO_PREF_MEDIA = /^@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)$/
  const rules = []
  const stack = []
  let buf = ''
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === '{') {
      const selector = buf.trim()
      const parent = stack[stack.length - 1]
      const insideNoPreference = NO_PREF_MEDIA.test(selector) || Boolean(parent?.insideNoPreference)
      stack.push({ selector, body: '', insideNoPreference })
      buf = ''
      continue
    }
    if (ch === '}') {
      const frame = stack.pop()
      if (frame) {
        frame.body += buf
        if (frame.selector === '.reveal') rules.push(frame)
      }
      buf = ''
      continue
    }
    buf += ch
  }
  return rules
}

test('.reveal: mặc định là hiện trên toàn bộ base.css, mọi opacity:0 đều nằm trong nhánh motion (spec §6.2)', () => {
  const css = read(ASSETS, 'base.css')
  const rules = findRevealRules(css)
  assert.ok(rules.length > 0, 'không tìm thấy rule .reveal nào trong base.css')

  const top = rules.find((r) => !r.insideNoPreference)
  assert.ok(top, 'thiếu rule .reveal ở top-level (ngoài mọi @media)')
  assert.match(top.body, /opacity:\s*1/, '.reveal top-level phải mặc định opacity: 1')

  for (const rule of rules) {
    if (/opacity:\s*0/.test(rule.body)) {
      assert.ok(rule.insideNoPreference,
        'có rule .reveal với opacity: 0 nằm ngoài @media (prefers-reduced-motion: no-preference) — đường dẫn tới nội dung ẩn vĩnh viễn')
    }
  }
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

/*
  Task 10 (spec §6.3, §7): header dính + co khi cuộn, hairline vàng dưới
  header, progress bar đọc trang, .announce đổi border sang vàng. Bốn test
  tĩnh dưới đây canh từng mảnh bằng cách đọc CSS/HTML thô. Phần đo bằng px
  THẬT (chiều cao header full/co, độ lệch neo cuộn trong ±4px, bug lệch
  flow khi header co giữa lúc cuộn) chỉ bắt được bằng trình duyệt thật
  (Playwright + Chrome), không lặp lại được ở test tĩnh — xem báo cáo task
  10 (.superpowers/sdd/lm-task10-report.md) để biết số đo cụ thể.
*/

test('.header dùng position: sticky — layout, không phải motion (spec §6.3)', () => {
  const css = read(ASSETS, 'components.css')
  const m = css.match(/\.header\s*\{([^}]*)\}/)
  assert.ok(m, 'không tìm thấy rule .header ở top-level')
  assert.match(m[1], /position:\s*sticky/, '.header phải position: sticky')
  assert.match(m[1], /top:\s*0/, '.header phải top: 0 để dính đúng mép trên')
  /*
    height tường minh — ĐÂY LÀ CHỖ SỬA BUG: không khai height thì padding/
    font-size co lại bên trong (.header__inner, .wordmark) sẽ kéo chiều cao
    CHÍNH .header xuống theo, và vì .header position: sticky vẫn chiếm chỗ
    trong flow bằng kích thước HIỆN TẠI của nó, flow phía dưới dịch lên
    giữa lúc cuộn — lệch neo ~25px đo được khi bấm nav trong trang (xem báo
    cáo). height cố định cắt đứt phụ thuộc đó.
  */
  assert.match(m[1], /height:\s*89px/, '.header phải khai height cố định (89px <560px) — thiếu thì bug lệch neo quay lại')
})

test('scroll-padding-top khớp chiều cao header ĐÃ CO đo thật (base.css)', () => {
  const css = read(ASSETS, 'base.css')
  assert.match(css, /scroll-padding-top:\s*89px/,
    'thiếu scroll-padding-top: 89px cho viewport hẹp (<560px, header co vẫn xuống 2 hàng, đo thật 88.98px)')
  const mq = css.match(/@media\s*\(min-width:\s*560px\)\s*\{\s*html\s*\{[^}]*\}/)
  assert.ok(mq, 'thiếu @media (min-width: 560px) chỉnh lại scroll-padding-top')
  assert.match(mq[0], /scroll-padding-top:\s*46px/,
    '≥560px header co vừa một hàng (đo thật 45.8px), scroll-padding-top phải là 46px')
})

test('.announce border dùng var(--gold), không còn var(--border) (spec §7 mục 1)', () => {
  const css = read(ASSETS, 'components.css')
  const m = css.match(/\.announce\s*\{([^}]*)\}/)
  assert.ok(m, 'không tìm thấy rule .announce')
  assert.match(m[1], /border-bottom:\s*1px solid var\(--gold\)/, '.announce phải có hairline vàng ở border-bottom')
})

test('.progress (hairline tiến độ đọc) dùng var(--accent), không phải var(--gold) (spec §2.4)', () => {
  const css = read(ASSETS, 'components.css')
  const blocks = [...css.matchAll(/\.progress\s*\{([^}]*)\}/g)]
  assert.ok(blocks.length > 0, 'không tìm thấy rule .progress nào')
  assert.match(blocks[0][1], /background:\s*var\(--accent\)/,
    '.progress phải dùng var(--accent) — nó MANG THÔNG TIN (tiến độ đọc trang), không phải trang trí thuần như vàng')
  for (const [, body] of blocks) {
    assert.doesNotMatch(body, /var\(--gold\)/, '.progress không được dùng var(--gold) ở bất kỳ rule nào (kể cả nhánh animation)')
  }
})

test('.progress mang aria-hidden="true" ở cả hai trang — bổ trợ thị giác, không phải nội dung', () => {
  for (const page of ['index.html', 'product.html']) {
    const html = read(THEME, page)
    const m = html.match(/<div class="progress"([^>]*)>/)
    assert.ok(m, `${page} thiếu <div class="progress">`)
    assert.match(m[1], /aria-hidden="true"/, `${page}: .progress phải aria-hidden="true"`)
  }
})
