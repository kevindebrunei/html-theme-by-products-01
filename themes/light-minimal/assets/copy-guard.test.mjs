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

test('không dùng vàng brand #C9A227 ở bất kỳ file nào của theme', () => {
  assert.equal(/#C9A227/i.test(themeText()), false)
})

test('không có box-shadow: Minimalism & Swiss quy định shadow none (spec §5.1)', () => {
  assert.equal(/box-shadow\s*:/i.test(themeText()), false)
})
