import test from 'node:test'
import assert from 'node:assert/strict'
import { menuHtml } from './menu.mjs'

test('menuHtml: đủ 4 dòng theo thứ tự TYPE_ORDER', () => {
  const html = menuHtml((t) => `#${t.toLowerCase()}`)
  assert.match(html, /Tumblers/)
  assert.match(html, /Caps/)
  assert.match(html, /Backpacks/)
  assert.match(html, /Shoes/)
  assert.match(html, /The Vessel/)
  assert.match(html, /The Crown/)
  assert.match(html, /The Hauler/)
  assert.match(html, /The Foundation/)
  assert.match(html, /href="#tumbler"|href="#tumblers"/)
})
