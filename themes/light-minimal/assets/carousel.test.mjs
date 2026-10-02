import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HERO_SKUS, nextIndex, prevIndex, slideLabel } from './carousel.mjs'

/*
  Pool hero là 3 frame đã soi bằng mắt ngày 02/10/2026 (spec §4.1).
  XI-003, XI-004, XI-005 dính watermark AURA TUMBLER — XI-005 khắc trên thân
  sản phẩm nên crop vô hiệu. Không có nguồn thay thế trong vùng sạch IP.
*/
test('hero dùng đúng 3 SKU đã soi', () => {
  assert.deepEqual(HERO_SKUS, [
    'TUM-20260923-XI-001',
    'TUM-20260923-XI-002',
    'TUM-20260923-XI-006',
  ])
})

test('nextIndex quay vòng', () => {
  assert.equal(nextIndex(0, 3), 1)
  assert.equal(nextIndex(2, 3), 0)
})

test('prevIndex quay vòng, không ra số âm', () => {
  assert.equal(prevIndex(1, 3), 0)
  assert.equal(prevIndex(0, 3), 2)
})

test('slideLabel đếm từ 1 cho người đọc', () => {
  assert.equal(slideLabel(0, 3), 'Slide 1 of 3')
  assert.equal(slideLabel(2, 3), 'Slide 3 of 3')
})
