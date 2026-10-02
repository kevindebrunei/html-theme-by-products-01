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

test('var(--gold) chỉ dùng trong khai báo border', () => {
  for (const file of themeFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (!line.includes('var(--gold)')) return
      assert.match(
        line,
        /border[a-z-]*\s*:/,
        `${file}:${i + 1} dùng var(--gold) ngoài border — vàng 2.42:1, không đủ cho chữ/nút/trạng thái\n  ${line.trim()}`
      )
    })
  }
})

test('var(--gold) không nằm trên selector trạng thái', () => {
  for (const file of themeFiles()) {
    if (!file.endsWith('.css')) continue
    const css = readFileSync(file, 'utf8')
    const blocks = css.split('}')
    for (const block of blocks) {
      if (!block.includes('var(--gold)')) continue
      const selector = block.split('{')[0]
      assert.doesNotMatch(
        selector,
        /:hover|:focus|\.is-active|\[aria-current|\[aria-pressed/,
        `Selector trạng thái dùng vàng — chỉ báo trạng thái phải dùng --accent:\n  ${selector.trim()}`
      )
    }
  }
})

/*
  Shadow được phép từ 02/10/2026, nhưng giá trị thật chỉ sống ở tokens.css.
  Rải rác box-shadow hardcode là cách một hệ thị giác mất kiểm soát.
*/
test('box-shadow ngoài tokens.css phải dùng var(--shadow-*)', () => {
  for (const file of themeFiles()) {
    if (file.endsWith('tokens.css')) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = line.match(/box-shadow\s*:\s*(.+)/)
      if (!m) return
      assert.match(
        m[1],
        /var\(--shadow-/,
        `${file}:${i + 1} hardcode box-shadow, phải dùng var(--shadow-*)\n  ${line.trim()}`
      )
    })
  }
})
