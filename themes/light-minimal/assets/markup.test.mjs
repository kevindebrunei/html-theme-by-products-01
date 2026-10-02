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
