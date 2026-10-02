import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitWords, cutMarkup } from './cut-reveal.mjs'

test('splitWords giữ lại khoảng trắng để không dính chữ', () => {
  assert.deepEqual(splitWords('a b'), ['a', ' ', 'b'])
})

test('splitWords bỏ chuỗi rỗng', () => {
  assert.ok(splitWords('  a  ').every((s) => s.length > 0))
})

/*
  Tách chữ thành span làm hỏng screen reader nếu làm ẩu: nó đọc từng mảnh rời.
  Bọc ngoài mang aria-label nguyên câu, span con aria-hidden (spec §7.5).
*/
test('cutMarkup: mọi span con đều aria-hidden (trừ span text trong cùng)', () => {
  const html = cutMarkup('one two')
  // Kiểm cả span từ (class="cut") LẪN span khoảng trắng (không có class) —
  // lọc riêng theo class="cut" như trước sẽ bỏ sót trường hợp refactor làm
  // rớt aria-hidden khỏi span khoảng trắng. Chỉ loại span text trong cùng
  // (class="cut__in"): nó không cần tự mang aria-hidden vì đã nằm trong một
  // ancestor luôn luôn aria-hidden.
  const spans = (html.match(/<span[^>]*>/g) ?? []).filter((s) => !s.includes('cut__in'))
  assert.ok(spans.length > 0)
  for (const s of spans) assert.match(s, /aria-hidden="true"/)
})

/*
  splitWords giữ phần tử khoảng trắng xen giữa từ, nên 'two' nằm ở vị trí
  mảng 2 chứ không phải 1. Nếu --i lấy thẳng vị trí mảng, độ trễ so le
  (--i * 60ms) sẽ gấp đôi dự kiến — đây từng là một lỗi thật.
  (Test riêng cho 'one two' từng đứng ở đây đã bị gộp: nó chỉ kiểm --i:0 và
  --i:1, điều mà test H1 thật ngay dưới — 10 từ, đếm đủ chỉ số 0..9 — đã bao
  trọn. Mutation test: đổi bộ đếm sang vị trí mảng khiến CẢ HAI test đỏ,
  không riêng gì test này.)
*/
test('cutMarkup: H1 thật của trang chủ — chỉ số lớn nhất là 9 (10 từ), không phải 18', () => {
  const h1 = 'Team identity, rewritten in the language of a fashion house.'
  const indices = [...cutMarkup(h1).matchAll(/--i:(\d+)/g)].map((m) => Number(m[1]))
  assert.equal(indices.length, 10)
  assert.equal(Math.max(...indices), 9)
})

test('cutMarkup: escape ký tự HTML trong nội dung', () => {
  assert.match(cutMarkup('a<b'), /a&lt;b/)
})
