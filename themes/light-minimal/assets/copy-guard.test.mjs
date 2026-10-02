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

test('không dùng vàng brand #C9A227 ở bất kỳ file nào của theme', () => {
  assert.equal(/#C9A227/i.test(themeText()), false)
})

test('không có box-shadow: Minimalism & Swiss quy định shadow none (spec §5.1)', () => {
  assert.equal(/box-shadow\s*:/i.test(themeText()), false)
})
