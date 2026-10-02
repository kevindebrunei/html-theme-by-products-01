import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HERO_SKUS, nextIndex, prevIndex, slideLabel, shouldPlay } from './carousel.mjs'

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

/*
  mountCarousel đã chặn slides.length === 0 trước khi gọi tới, nhưng
  nextIndex/prevIndex là hàm thuần export ra ngoài — không có guard thì
  n = 0 ra NaN (chia cho 0, mod 0).
*/
test('nextIndex/prevIndex trả 0 khi n = 0, không ra NaN', () => {
  assert.equal(nextIndex(0, 0), 0)
  assert.equal(prevIndex(0, 0), 0)
})

test('nextIndex/prevIndex đứng yên khi chỉ có 1 slide', () => {
  assert.equal(nextIndex(0, 1), 0)
  assert.equal(prevIndex(0, 1), 0)
})

test('slideLabel đếm từ 1 cho người đọc', () => {
  assert.equal(slideLabel(0, 3), 'Slide 1 of 3')
  assert.equal(slideLabel(2, 3), 'Slide 3 of 3')
})

/*
  CRITICAL: trước khi sửa, play() tự check `if (reduce || timer) return` —
  khi reduce=true (prefers-reduced-motion bật), nút Play bấm vào không làm
  gì: không chạy, không đổi nhãn, không phản hồi. Nút vẫn nhận focus, vẫn
  bấm được, và hoàn toàn vô tác dụng vĩnh viễn.
  reduce chỉ được quyết định HÀNH VI LÚC MOUNT (không tự autoplay) — không
  được chặn lời gọi play() do người dùng khởi xướng, vì bấm Play là yêu cầu
  tường minh ghi đè mặc định hệ thống.
*/
test('shouldPlay: reduce=true + người dùng bấm → phải chạy', () => {
  assert.equal(shouldPlay(true, 'user'), true)
})

test('shouldPlay: reduce=true + lúc mount → không chạy', () => {
  assert.equal(shouldPlay(true, 'mount'), false)
})

test('shouldPlay: reduce=false + lúc mount → chạy bình thường', () => {
  assert.equal(shouldPlay(false, 'mount'), true)
})

test('shouldPlay: reduce=false + người dùng bấm → chạy', () => {
  assert.equal(shouldPlay(false, 'user'), true)
})
