import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addToCart,
  updateItemQuantity,
  removeItem,
  calculateCount,
  calculateSubtotal,
  getRecommendedProducts,
  cartItemHtml,
  recommendationsHtml,
} from './cart.mjs'

const mockProduct = {
  sku: 'TUM-20260923-XI-028',
  title: 'Tumbler Relic - Gilded Tracery',
  type: 'Tumbler',
  price: 49.95,
  images: ['/products/Tumbler/01.webp'],
}

test('addToCart: thêm sản phẩm mới vào giỏ hàng trống', () => {
  const initial = []
  const cart = addToCart(initial, { ...mockProduct, quantity: 1 })
  assert.equal(cart.length, 1)
  assert.equal(cart[0].sku, 'TUM-20260923-XI-028')
  assert.equal(cart[0].quantity, 1)
  assert.equal(cart[0].price, 49.95)
})

test('addToCart: cộng dồn số lượng khi thêm sản phẩm trùng SKU và variant', () => {
  let cart = addToCart([], { ...mockProduct, quantity: 1, variantValue: 'Black' })
  cart = addToCart(cart, { ...mockProduct, quantity: 2, variantValue: 'Black' })
  assert.equal(cart.length, 1)
  assert.equal(cart[0].quantity, 3)
})

test('addToCart: phân biệt hai biến thể khác nhau cùng SKU', () => {
  let cart = addToCart([], { ...mockProduct, quantity: 1, variantValue: 'S' })
  cart = addToCart(cart, { ...mockProduct, quantity: 1, variantValue: 'M' })
  assert.equal(cart.length, 2)
  assert.equal(cart[0].variantValue, 'S')
  assert.equal(cart[1].variantValue, 'M')
})

test('updateItemQuantity: cập nhật số lượng thành công', () => {
  const cart = [{ ...mockProduct, quantity: 1, variantValue: null }]
  const updated = updateItemQuantity(cart, 'TUM-20260923-XI-028', null, 5)
  assert.equal(updated[0].quantity, 5)
})

test('updateItemQuantity: số lượng <= 0 tự động xoá món hàng', () => {
  const cart = [{ ...mockProduct, quantity: 2, variantValue: null }]
  const updated = updateItemQuantity(cart, 'TUM-20260923-XI-028', null, 0)
  assert.equal(updated.length, 0)
})

test('removeItem: xoá đúng món hàng theo sku và variant', () => {
  const cart = [
    { ...mockProduct, sku: 'SKU-1', variantValue: null, quantity: 1 },
    { ...mockProduct, sku: 'SKU-2', variantValue: null, quantity: 1 },
  ]
  const updated = removeItem(cart, 'SKU-1', null)
  assert.equal(updated.length, 1)
  assert.equal(updated[0].sku, 'SKU-2')
})

test('calculateCount & calculateSubtotal: tính đúng tổng số lượng và tổng tiền', () => {
  const cart = [
    { sku: 'A', price: 50.0, quantity: 2 },
    { sku: 'B', price: 30.0, quantity: 3 },
  ]
  assert.equal(calculateCount(cart), 5)
  assert.equal(calculateSubtotal(cart), 190.0)
})

test('getRecommendedProducts: trả về sản phẩm gợi ý loại trừ những SKU đã có trong giỏ', () => {
  const products = [
    { sku: 'TUM-20260923-XI-028', title: 'P1', type: 'Tumbler' },
    { sku: 'CAP-20260923-UY-021', title: 'P2', type: 'Cap' },
    { sku: 'BP-20260923-XI-019', title: 'P3', type: 'Backpack' },
  ]
  const cart = [{ sku: 'TUM-20260923-XI-028', quantity: 1 }]
  const recs = getRecommendedProducts(products, cart, 2)
  assert.equal(recs.some((p) => p.sku === 'TUM-20260923-XI-028'), false)
  assert.ok(recs.length <= 2)
})

test('cartItemHtml: tạo markup hợp lệ có link tuyệt đối và tên sản phẩm', () => {
  const html = cartItemHtml({
    sku: 'SKU-TEST',
    title: 'Editions Test',
    price: 49.95,
    quantity: 1,
    image: '/products/test.webp',
  })
  assert.match(html, /href="\/themes\/dark-minimal\/product\.html\?sku=SKU-TEST"/)
  assert.match(html, /Editions Test/)
  assert.match(html, /\$49\.95/)
  assert.match(html, /data-action="increase"/)
  assert.match(html, /data-action="decrease"/)
  assert.match(html, /data-action="remove"/)
})

test('recommendationsHtml: sinh nút + Add và link sản phẩm tuyệt đối', () => {
  const recs = [{ sku: 'REC-1', title: 'Rec One', type: 'Cap', price: 40.0, images: ['/img.webp'] }]
  const html = recommendationsHtml(recs)
  assert.match(html, /data-action="add-rec"/)
  assert.match(html, /data-sku="REC-1"/)
  assert.match(html, /href="\/themes\/dark-minimal\/product\.html\?sku=REC-1"/)
})
