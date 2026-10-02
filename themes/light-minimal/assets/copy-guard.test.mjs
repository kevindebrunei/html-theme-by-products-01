import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = dirname(fileURLToPath(import.meta.url))
const THEME = join(ASSETS, '..')

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

function themeText() {
  return readAll(themeFiles())
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

/*
  Vàng đẹp, và cái đẹp sẽ bò dần sang chỗ nó không được phép ở.
  Hàng rào phải là test chứ không phải trí nhớ (spec §2.4).
*/
test('vàng brand xuất hiện đúng một lần trong toàn theme', () => {
  const hits = themeText().match(/#C9A227/gi) ?? []
  assert.equal(hits.length, 1, `#C9A227 xuất hiện ${hits.length} lần, phải đúng 1`)
})

/*
  === Hàng rào vàng brand: parser thuần, tách khỏi test runner ===

  Ba hàm dưới nhận một chuỗi cssText và trả về danh sách vi phạm — không
  đụng filesystem, không phụ thuộc node:test. Nhờ vậy mỗi hàm kiểm được
  trên hai loại input: file theme thật (kỳ vọng rỗng) và CSS tổng hợp cố
  tình vi phạm (kỳ vọng bắt được). Loại thứ hai mới là thứ chứng minh hàng
  rào thật sự cắn — xanh trên file thật không chứng minh gì cả nếu chưa ai
  từng vi phạm.

  Vòng đời sửa lỗi của bộ này (để người sau không lặp lại):
    1. Bản line-based đầu tiên: kiểm "dòng chứa var(--gold)" có chữ "border"
       ở đâu đó trên CÙNG DÒNG. Lọt khi border và gold ở hai property khác
       nhau chung một dòng; mù với declaration trải nhiều dòng; cắt khối
       bằng split('}') nên lạc selector khi rule nằm trong @media.
    2. Bản regex declaration ([a-zA-Z-]+)\s*:\s*([^;{}]+)[;}]: sửa được vụ
       chung dòng và xuống dòng, nhưng vẫn báo nhầm một khai báo HỢP LỆ khi
       chính PROPERTY của nó trải nhiều dòng (vd. "border: 1px solid\n  var
       (--gold);" — dòng chứa var(--gold) không có property), và vẫn bị
       '}' bên trong chuỗi (vd. content: "}") làm lạc ranh giới khối.
    3. Bản hiện tại (parseBlocks + parseDeclarations): nhận biết dấu nháy
       khi quét — '{', '}', ';' nằm trong "..."/'...' không được coi là ký
       tự cấu trúc, nên content: "}" không còn cắt nhầm khối. Khối được
       dựng bằng ngăn xếp ngoặc nhọn nên selector lấy được luôn là selector
       thật sát nhất, kể cả khi lồng trong @media. Trong một khối, declara-
       tion được tách theo ';' ở cấp cao nhất (cũng nhận biết dấu nháy) chứ
       không theo dòng — nên property và value của CÙNG một khai báo luôn
       được gộp đúng dù trải bao nhiêu dòng, theo cả hai chiều (không còn
       báo nhầm NLẪN không còn bỏ lọt).

  parseBlocks(cssText) trả mảng { selector, body } cho MỌI khối {...} tìm
  thấy, kể cả khối at-rule bọc ngoài (selector kiểu "@media (hover: hover)"
  với body gần như rỗng) — việc lọc at-rule ra là trách nhiệm của hàm gọi.
*/
function parseBlocks(cssText) {
  const blocks = []
  const stack = []
  let buf = ''
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i]
    if ((inSingle || inDouble) && ch === '\\') {
      buf += ch + (cssText[i + 1] ?? '')
      i += 1
      continue
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      buf += ch
      continue
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      buf += ch
      continue
    }
    if (inSingle || inDouble) {
      buf += ch
      continue
    }
    if (ch === '{') {
      stack.push({ selector: buf, body: '' })
      buf = ''
      continue
    }
    if (ch === '}') {
      const frame = stack.pop()
      if (frame) {
        frame.body += buf
        blocks.push(frame)
      }
      buf = ''
      continue
    }
    buf += ch
  }
  return blocks
}

/* Tách chuỗi theo `sep` ở cấp cao nhất — bỏ qua `sep` nằm trong "..." hoặc '...'. */
function splitTopLevel(text, sep) {
  const parts = []
  let buf = ''
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if ((inSingle || inDouble) && ch === '\\') {
      buf += ch + (text[i + 1] ?? '')
      i += 1
      continue
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      buf += ch
      continue
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      buf += ch
      continue
    }
    if (inSingle || inDouble) {
      buf += ch
      continue
    }
    if (ch === sep) {
      parts.push(buf)
      buf = ''
      continue
    }
    buf += ch
  }
  parts.push(buf)
  return parts
}

/* Tách body của một khối thành các { prop, value } — bất kể trải bao nhiêu dòng. */
function parseDeclarations(bodyText) {
  return splitTopLevel(bodyText, ';')
    .map((raw) => {
      const idx = raw.indexOf(':')
      if (idx === -1) return null
      const prop = raw.slice(0, idx).trim()
      const value = raw.slice(idx + 1).trim()
      return prop ? { prop, value } : null
    })
    .filter(Boolean)
}

/*
  Vi phạm: var(--gold) dùng trong một khai báo mà PROPERTY không phải một
  property border CÓ NHẬN MÀU. border-radius/border-width/border-image/
  border-style không nhận màu — var(--gold) ở đó vô nghĩa, không phải hợp
  lệ, nên vẫn bị coi là vi phạm.
*/
const BORDER_COLOR_PROP = /^border(-(top|right|bottom|left))?(-color)?$/i

export function goldViolations(cssText) {
  const violations = []
  for (const block of parseBlocks(cssText)) {
    const selector = block.selector.trim()
    for (const { prop, value } of parseDeclarations(block.body)) {
      if (!value.includes('var(--gold)')) continue
      if (!BORDER_COLOR_PROP.test(prop)) {
        violations.push({ selector, prop, value })
      }
    }
  }
  return violations
}

/*
  Vi phạm: var(--gold) nằm trong một rule mà selector mang trạng thái
  (:hover, :focus, .is-active, [aria-current], [aria-pressed]) — bất kể
  rule đó có lồng trong @media hay không, và bất kể trong body có chuỗi
  chứa '}' hay ';' giả hay không (parseBlocks/splitTopLevel nhận biết dấu
  nháy nên không bị lừa bởi những ký tự đó khi chúng nằm trong "...").
*/
const STATE_SELECTOR = /:hover|:focus|\.is-active|\[aria-current|\[aria-pressed/i

export function goldStateViolations(cssText) {
  const violations = []
  for (const block of parseBlocks(cssText)) {
    const selector = block.selector.trim()
    if (!selector || selector.startsWith('@') || !STATE_SELECTOR.test(selector)) continue
    const hasGold = parseDeclarations(block.body).some((d) => d.value.includes('var(--gold)'))
    if (hasGold) {
      violations.push({ selector, body: block.body.trim() })
    }
  }
  return violations
}

/* Vi phạm: box-shadow hardcode, không dùng var(--shadow-*) — dù value trải nhiều dòng. */
export function shadowViolations(cssText) {
  const violations = []
  for (const block of parseBlocks(cssText)) {
    const selector = block.selector.trim()
    for (const { prop, value } of parseDeclarations(block.body)) {
      if (!/^box-shadow$/i.test(prop)) continue
      if (!/var\(--shadow-/.test(value)) {
        violations.push({ selector, prop, value })
      }
    }
  }
  return violations
}

test('var(--gold) chỉ dùng trong khai báo border có nhận màu (file theme thật)', () => {
  assert.deepEqual(goldViolations(themeText()), [])
})

/*
  Năm test vàng ở file này đều là hàng rào CẤM: chúng chỉ bắt var(--gold)
  xuất hiện SAI chỗ, không cái nào canh nó xuất hiện ĐÚNG chỗ ít nhất một
  lần. Hệ quả có thật: hairline `.preview + .preview { border-top: 1px solid
  var(--gold); }` (components.css) từng — và có thể lại — bị xoá mà cả 5
  test cấm vẫn xanh, vì "không có vi phạm" và "không có gì cả" nhìn giống
  hệt nhau dưới con mắt goldViolations/goldStateViolations. Test này canh
  chiều ngược lại: phải có ít nhất một khai báo border thật sự dùng
  var(--gold) ở đâu đó trong CSS theme.
*/
test('var(--gold) thực sự được dùng ở ít nhất một khai báo border (file theme thật)', () => {
  const cssOnly = readAll(themeFiles().filter((f) => f.endsWith('.css')))
  const used = parseBlocks(cssOnly).some((block) =>
    parseDeclarations(block.body).some(({ prop, value }) =>
      BORDER_COLOR_PROP.test(prop) && value.includes('var(--gold)')
    )
  )
  assert.ok(used, 'var(--gold) không xuất hiện trong bất kỳ khai báo border nào — hairline vàng có thể đã bị xoá âm thầm')
})

test('var(--gold) chỉ dùng trong khai báo border có nhận màu — bắt được khi border và vàng chung một dòng', () => {
  const css = '.x { border: 0; color: var(--gold); }'
  const violations = goldViolations(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].prop, 'color')
})

test('var(--gold) chỉ dùng trong khai báo border có nhận màu — bắt được ở background', () => {
  const css = '.x { background: var(--gold); }'
  assert.equal(goldViolations(css).length, 1)
})

test('var(--gold) chỉ dùng trong khai báo border có nhận màu — không báo nhầm border-top hợp lệ', () => {
  const css = '.rule { border-top: 1px solid var(--gold); }'
  assert.deepEqual(goldViolations(css), [])
})

test('var(--gold) chỉ dùng trong khai báo border có nhận màu — không báo nhầm khi khai báo trải nhiều dòng', () => {
  const css = '.facet {\n  border: 1px solid\n    var(--gold);\n}'
  assert.deepEqual(goldViolations(css), [], 'Khai báo border hợp lệ, chỉ vì xuống dòng không được tính là vi phạm')
})

test('var(--gold) chỉ dùng trong khai báo border có nhận màu — bắt được ở border-radius (không nhận màu)', () => {
  const violations = goldViolations('.x { border-radius: var(--gold); }')
  assert.equal(violations.length, 1, JSON.stringify(violations))
  const widthViolations = goldViolations('.x { border-width: var(--gold); }')
  assert.equal(widthViolations.length, 1, JSON.stringify(widthViolations))
})

test('var(--gold) không nằm trên selector trạng thái (file theme thật)', () => {
  const cssOnly = readAll(themeFiles().filter((f) => f.endsWith('.css')))
  assert.deepEqual(goldStateViolations(cssOnly), [])
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

test('var(--gold) không nằm trên selector trạng thái — bắt được dù body có dấu "}" giả bên trong chuỗi', () => {
  const css = '.badge:hover::after { content: "}"; border: 1px solid var(--gold); }'
  const violations = goldStateViolations(css)
  assert.equal(violations.length, 1, JSON.stringify(violations))
  assert.equal(violations[0].selector, '.badge:hover::after')
})

/*
  Shadow được phép từ 02/10/2026, nhưng giá trị thật chỉ sống ở tokens.css.
  Rải rác box-shadow hardcode là cách một hệ thị giác mất kiểm soát.
*/
test('box-shadow ngoài tokens.css phải dùng var(--shadow-*) (file theme thật)', () => {
  const nonTokens = readAll(themeFiles().filter((f) => !f.endsWith('tokens.css')))
  assert.deepEqual(shadowViolations(nonTokens), [])
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
