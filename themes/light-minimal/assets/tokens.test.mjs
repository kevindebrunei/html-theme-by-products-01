import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS = readFileSync(join(HERE, 'tokens.css'), 'utf8')

function token(name) {
  const m = CSS.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))
  assert.ok(m, `Không tìm thấy token --${name} trong tokens.css`)
  return m[1]
}

function luminance(hex) {
  const parts = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = parts.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('contrast: chữ chính đạt AAA trên nền', () => {
  assert.ok(contrast(token('fg'), token('bg')) >= 7,
    `--fg chỉ đạt ${contrast(token('fg'), token('bg')).toFixed(2)}:1`)
})

test('contrast: chữ phụ đạt AA', () => {
  assert.ok(contrast(token('muted'), token('bg')) >= 4.5,
    `--muted chỉ đạt ${contrast(token('muted'), token('bg')).toFixed(2)}:1`)
})

test('contrast: accent đạt AA trên nền', () => {
  assert.ok(contrast(token('accent'), token('bg')) >= 4.5,
    `--accent chỉ đạt ${contrast(token('accent'), token('bg')).toFixed(2)}:1`)
})

test('contrast: chữ trên nền accent đạt AA', () => {
  assert.ok(contrast(token('accent-fg'), token('accent')) >= 4.5)
})

/*
  Viền là cơ chế DUY NHẤT tách ảnh khỏi nền ở theme này.
  11 ảnh cap nền marble chỉ đạt ~1.1:1 so với nền trắng (spec §5.1).
*/
test('contrast: viền đạt ngưỡng non-text 3:1', () => {
  assert.ok(contrast(token('border'), token('bg')) >= 3,
    `--border chỉ đạt ${contrast(token('border'), token('bg')).toFixed(2)}:1 — ảnh nền sáng sẽ tan vào trang`)
})

test('nền là trắng tinh (spec §2.1)', () => {
  assert.equal(token('bg').toUpperCase(), '#FFFFFF')
})

/*
  Mặt thẻ đúng bằng --bg; cái tách nó khỏi trang là shadow, không phải màu.
  Giữ đúng một màu nền trên toàn trang.
*/
test('không có token --surface (spec §2.2)', () => {
  assert.equal(/--surface\s*:/.test(CSS), false)
})

test('bo góc bằng 0 — góc vuông đọc đắt tiền hơn bo tròn (spec §1)', () => {
  const m = CSS.match(/--radius:\s*([^;]+);/)
  assert.ok(m, 'Không tìm thấy --radius')
  assert.match(m[1].trim(), /^0(px|rem)?$/)
})

test('có đủ hai bậc shadow', () => {
  assert.ok(/--shadow-sm:/.test(CSS), 'thiếu --shadow-sm')
  assert.ok(/--shadow-md:/.test(CSS), 'thiếu --shadow-md')
})

/*
  #C9A227 chỉ 2.42:1 trên trắng — không đủ cho chữ, nút, hay bất cứ thứ gì
  mang thông tin. Nó được phép tồn tại ĐÚNG MỘT LẦN, ở đây, làm hairline
  trang trí. Hàng rào thật nằm ở copy-guard.test.mjs.
*/
test('vàng brand khai đúng một lần, trong token --gold', () => {
  const hits = CSS.match(/#C9A227/gi) ?? []
  assert.equal(hits.length, 1, `#C9A227 xuất hiện ${hits.length} lần trong tokens.css`)
  assert.match(CSS, /--gold:\s*#C9A227/i)
})

test('có thang mới: --space-7, --fs-9, --ease-lux, --dur-slow', () => {
  for (const name of ['space-7', 'fs-9', 'ease-lux', 'dur-slow']) {
    assert.ok(new RegExp(`--${name}\\s*:`).test(CSS), `thiếu --${name}`)
  }
})
