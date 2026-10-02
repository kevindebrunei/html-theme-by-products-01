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
test('cutMarkup: mọi span con đều aria-hidden', () => {
  const html = cutMarkup('one two')
  const spans = html.match(/<span[^>]*>/g) ?? []
  const outer = spans.filter((s) => s.includes('class="cut"'))
  assert.ok(outer.length > 0)
  for (const s of outer) assert.match(s, /aria-hidden="true"/)
})

test('cutMarkup: mỗi từ có chỉ số --i để stagger', () => {
  assert.match(cutMarkup('one two'), /--i:0/)
  assert.match(cutMarkup('one two'), /--i:2/)
})

test('cutMarkup: escape ký tự HTML trong nội dung', () => {
  assert.match(cutMarkup('a<b'), /a&lt;b/)
})
