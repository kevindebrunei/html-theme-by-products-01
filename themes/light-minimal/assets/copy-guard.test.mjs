import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = dirname(fileURLToPath(import.meta.url))
const THEME = join(ASSETS, '..')

function themeText() {
  const files = [
    ...readdirSync(THEME).filter((f) => f.endsWith('.html')).map((f) => join(THEME, f)),
    ...readdirSync(ASSETS).filter((f) => (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.css')) && !f.includes('.test.')).map((f) => join(ASSETS, f)),
  ]
  return files.map((f) => readFileSync(f, 'utf8')).join('\n')
}

const BANNED = [
  'officially licensed', 'official', 'licensed', 'authentic', 'genuine',
  'must-have', 'perfect gift for any fan',
]

test('bộ chặn copy: không cụm cấm nào xuất hiện trong theme', () => {
  const text = themeText().toLowerCase()
  for (const phrase of BANNED) {
    assert.equal(text.includes(phrase), false, `Tìm thấy cụm bị cấm: "${phrase}"`)
  }
})

/* Tên giải không được nằm ở lớp điều hướng hay chrome của theme (spec §6). */
test('ranh giới IP: tên giải không nằm trong mã nguồn theme', () => {
  const text = themeText()
  for (const league of ['NFL', 'NBA', 'MLB', 'WWE']) {
    assert.equal(new RegExp(`\\b${league}\\b`, 'i').test(text), false, `Tìm thấy tên giải: ${league}`)
  }
})

/*
  Test GHI NHẬN HIỆN TRẠNG, không phải test đạt/không đạt.

  Tên giải và tên đội nằm trong đường dẫn ảnh (`/products/Cap/NFL/NFL-Detroit-
  Lions/...`), và đường dẫn đó đi thẳng vào `src` của HTML. Test ngay phía
  trên không bắt được: nó quét file nguồn của theme, còn các URL này sinh ra
  lúc chạy từ products.json — dữ liệu, không phải mã.

  Chủ store quyết không xử trong redesign này (spec §10.1): vấn đề có từ
  trước và phải sửa một lần cho cả store. Con số 59 chốt ở đây để nếu ai đổi
  cấu trúc thư mục ảnh thì test vỡ, và người đó buộc phải quay lại cập nhật
  §10.1 thay vì lặng lẽ tưởng gap đã được lấp.

  Test này xanh KHÔNG có nghĩa là store sạch. Nó chỉ có nghĩa là chưa ai đụng.
*/
test('ghi nhận hiện trạng: 59/65 SKU có tên giải trong đường dẫn ảnh (gap §10.1)', () => {
  const products = JSON.parse(
    readFileSync(join(ASSETS, '..', '..', '..', 'products', 'products.json'), 'utf8')
  ).products
  const leagueInPath = /\/(NFL|NBA|MLB|WWE)\//
  const affected = products.filter((p) => leagueInPath.test(p.images[0]))
  assert.equal(affected.length, 59, 'Số SKU dính đổi rồi — cập nhật spec §10.1 trước khi sửa số ở đây')
})

function themeFiles() {
  return [
    ...readdirSync(THEME).filter((f) => f.endsWith('.html')).map((f) => join(THEME, f)),
    ...readdirSync(ASSETS)
      .filter((f) => (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.css')) && !f.includes('.test.'))
      .map((f) => join(ASSETS, f)),
  ]
}

function readAll(files) {
  return files.map((f) => readFileSync(f, 'utf8')).join('\n')
}

/*
  Vàng đẹp, và cái đẹp sẽ bò dần sang chỗ nó không được phép ở.
  Hàng rào phải là test chứ không phải trí nhớ (spec §2.4).
*/
test('vàng brand xuất hiện đúng một lần trong toàn theme', () => {
  const hits = themeText().match(/#C9A227/gi) ?? []
  assert.equal(hits.length, 1, `#C9A227 xuất hiện ${hits.length} lần, phải đúng 1`)
})

test('mã vàng duy nhất đó nằm trong tokens.css', () => {
  const tokens = readFileSync(join(ASSETS, 'tokens.css'), 'utf8')
  assert.match(tokens, /--gold:\s*#C9A227/i)
})

/*
  === Hàng rào vàng brand: logic thuần, tách khỏi test runner ===

  Ba hàm dưới nhận một chuỗi cssText và trả về danh sách vi phạm — không
  đụng filesystem, không phụ thuộc node:test. Nhờ vậy mỗi hàm kiểm được
  trên hai loại input: file theme thật (kỳ vọng rỗng) và CSS tổng hợp cố
  tình vi phạm (kỳ vọng bắt được). Loại thứ hai mới là thứ chứng minh hàng
  rào thật sự cắn — xanh trên file thật không chứng minh gì cả nếu chưa ai
  từng vi phạm.

  Kỹ thuật dùng chung cho goldViolations/shadowViolations: quét declaration
  bằng regex `([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]`. Lớp ký tự `[^;{}]` không
  khớp '{', nên một selector đứng trước '{' (kể cả khi có dấu hai chấm như
  :hover, :not(:hover)) không bao giờ bị hiểu lầm là value của declaration
  trước nó — chỉ propery đứng NGAY TRƯỚC dấu ':' mới được coi là prop của
  value đó. Lớp ký tự này cũng xuyên qua xuống dòng, nên value trải nhiều
  dòng (vd. box-shadow xuống dòng rồi mới tới giá trị) vẫn được gộp đúng.
*/

/* Vi phạm: var(--gold) dùng trong một khai báo mà PROPERTY không phải border-*. */
export function goldViolations(cssText) {
  const violations = []
  const declRe = /([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]/g
  let m
  while ((m = declRe.exec(cssText))) {
    const prop = m[1].trim()
    const value = m[2].trim()
    if (!value.includes('var(--gold)')) continue
    if (!/^border/i.test(prop)) {
      violations.push({ prop, value })
    }
  }
  return violations
}

/*
  Vi phạm: var(--gold) nằm trong một rule mà selector mang trạng thái
  (:hover, :focus, .is-active, [aria-current], [aria-pressed]).

  Để tìm selector THẬT của rule (kể cả khi rule nằm lồng trong @media),
  đi qua cssText từng ký tự và giữ một ngăn xếp các khung { selector, body }:
  gặp '{' thì đẩy khung mới (selector = buf tích lũy từ trước); gặp '}' thì
  gộp nốt phần buf còn lại vào body của khung trên cùng, pop khung đó ra và
  kiểm tra, rồi mới reset buf. Nội dung của một khung con không bao giờ lọt
  vào body của khung cha (vì buf đã được giải phóng khi khung con pop), nên
  selector lấy được luôn là selector sát nhất bao quanh declaration, không
  phải at-rule bọc ngoài như "@media (hover: hover)".
*/
export function goldStateViolations(cssText) {
  const violations = []
  const stack = []
  let buf = ''
  for (const ch of cssText) {
    if (ch === '{') {
      stack.push({ selector: buf, body: '' })
      buf = ''
    } else if (ch === '}') {
      const frame = stack.pop()
      if (!frame) { buf = ''; continue }
      frame.body += buf
      buf = ''
      const selector = frame.selector.trim()
      if (
        selector &&
        !selector.startsWith('@') &&
        frame.body.includes('var(--gold)') &&
        /:hover|:focus|\.is-active|\[aria-current|\[aria-pressed/i.test(selector)
      ) {
        violations.push({ selector, body: frame.body.trim() })
      }
    } else {
      buf += ch
    }
  }
  return violations
}

/* Vi phạm: box-shadow hardcode, không dùng var(--shadow-*). */
export function shadowViolations(cssText) {
  const violations = []
  const declRe = /([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]/g
  let m
  while ((m = declRe.exec(cssText))) {
    const prop = m[1].trim()
    const value = m[2].trim()
    if (!/^box-shadow$/i.test(prop)) continue
    if (!/var\(--shadow-/.test(value)) {
      violations.push({ prop, value })
    }
  }
  return violations
}

test('var(--gold) chỉ dùng trong khai báo border (file theme thật)', () => {
  assert.deepEqual(goldViolations(readAll(themeFiles())), [])
})

test('var(--gold) chỉ dùng trong khai báo border — bắt được khi border và vàng chung một dòng', () => {
  const css = '.x { border: 0; color: var(--gold); }'
  const violations = goldViolations(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].prop, 'color')
})

test('var(--gold) chỉ dùng trong khai báo border — bắt được ở background', () => {
  const css = '.x { background: var(--gold); }'
  assert.equal(goldViolations(css).length, 1)
})

test('var(--gold) chỉ dùng trong khai báo border — không báo nhầm border-top hợp lệ', () => {
  const css = '.rule { border-top: 1px solid var(--gold); }'
  assert.deepEqual(goldViolations(css), [])
})

test('var(--gold) không nằm trên selector trạng thái (file theme thật)', () => {
  const cssOnly = themeFiles().filter((f) => f.endsWith('.css'))
  assert.deepEqual(goldStateViolations(readAll(cssOnly)), [])
})

test('var(--gold) không nằm trên selector trạng thái — bắt được khi rule nằm trong @media (hover: hover)', () => {
  const css = '@media (hover: hover) { .x:hover { border-color: var(--gold); } }'
  const violations = goldStateViolations(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].selector, '.x:hover')
})

test('var(--gold) không nằm trên selector trạng thái — bắt được ở [aria-pressed]', () => {
  const css = '.facet[aria-pressed="true"] { border-color: var(--gold); }'
  assert.equal(goldStateViolations(css).length, 1)
})

/*
  Shadow được phép từ 02/10/2026, nhưng giá trị thật chỉ sống ở tokens.css.
  Rải rác box-shadow hardcode là cách một hệ thị giác mất kiểm soát.
*/
test('box-shadow ngoài tokens.css phải dùng var(--shadow-*) (file theme thật)', () => {
  const nonTokens = themeFiles().filter((f) => !f.endsWith('tokens.css'))
  assert.deepEqual(shadowViolations(readAll(nonTokens)), [])
})

test('box-shadow ngoài tokens.css phải dùng var(--shadow-*) — bắt được khi giá trị xuống dòng', () => {
  const css = '.y {\n  box-shadow:\n    0 1px 2px rgba(20,18,14,.4);\n}'
  const violations = shadowViolations(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
})

test('box-shadow ngoài tokens.css phải dùng var(--shadow-*) — không báo nhầm khi dùng token', () => {
  const css = '.card__mat { box-shadow: var(--shadow-sm); }'
  assert.deepEqual(shadowViolations(css), [])
})
