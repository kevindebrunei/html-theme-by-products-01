/*
  catalog.mjs — logic thuần của catalog light-minimal.
  Không chạm DOM, không fetch. Mọi thứ ở đây test được bằng node:test.
*/

export const STYLE_FAMILY = {
  GOTHIC: 'Gothic Jewel',
  HOLIDAY: 'Holiday Ornament',
  HERITAGE: 'Heritage Crest',
  GOLD_DRIP: 'Gold Drip',
}

/* Đúng 3 backpack mang hai từ này: PHI, PIT, SF (spec §2.1). */
const DRIP_WORDS = ['drip', 'graffiti']

export function deriveStyleFamily(product) {
  if (product.type === 'Tumbler') {
    return product.season === 'Christmas' ? STYLE_FAMILY.HOLIDAY : STYLE_FAMILY.GOTHIC
  }
  if (product.type === 'Backpack') {
    const title = String(product.title ?? '').toLowerCase()
    if (DRIP_WORDS.some((w) => title.includes(w))) return STYLE_FAMILY.GOLD_DRIP
  }
  return STYLE_FAMILY.HERITAGE
}

/* Gold Drip chỉ có 3 SKU — quá mỏng để đứng riêng ở mặt tiền (spec §2.2). */
export function displayFamily(family) {
  return family === STYLE_FAMILY.GOLD_DRIP ? STYLE_FAMILY.HERITAGE : family
}

export const TYPE_ORDER = ['Tumbler', 'Cap', 'Backpack', 'Shoes']
export const TYPE_LABEL = { Tumbler: 'Tumblers', Cap: 'Caps', Backpack: 'Backpacks', Shoes: 'Shoes' }

export function byType(products, type) {
  return products.filter((p) => p.type === type)
}

export function facetCounts(products) {
  const counts = new Map()
  for (const p of products) {
    const f = displayFamily(deriveStyleFamily(p))
    counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return counts
}

/* Caps / Backpacks / Shoes đều một họ → không render facet (spec §6). */
export function shouldRenderFacets(products) {
  return facetCounts(products).size > 1
}

export function formatPrice(n) {
  return n == null ? '' : '$' + Number(n).toFixed(2)
}

export function priceLabel(product) {
  const prices = [...new Set((product.variants ?? []).map((v) => v.price))]
  if (prices.length > 1) return `from ${formatPrice(Math.min(...prices))}`
  return formatPrice(prices[0] ?? product.price)
}

/*
  Trang chủ không còn chế độ full catalog (spec §7.3), nên 12 SKU này LÀ
  toàn bộ cửa hàng. Thứ tự trong mảng là thứ tự hiển thị.

  Mọi ảnh 01 và 02 của 12 SKU này đã được soi bằng mắt ngày 02-03/10/2026,
  không có watermark AURA TUMBLER, không có logo/tên đội. Kết quả đầy đủ ở
  spec §5.2. Thêm SKU vào đây mà chưa soi ảnh là đưa rủi ro IP lên mặt tiền.

  KHÔNG đặt danh sách này trong products.json — file đó sinh ra từ CSV bởi
  scripts/build-products.mjs và sẽ bị ghi đè.
*/
export const CURATED = [
  /* Tumbler — phải phủ cả Gothic Jewel lẫn Holiday Ornament */
  'TUM-20260923-XI-028', 'TUM-20260923-XI-023', 'TUM-20260923-XI-026',
  /* Cap */
  'CAP-20260923-UY-021', 'CAP-20260923-UY-022', 'CAP-20260923-UY-017',
  /* Backpack */
  'BP-20260923-XI-019', 'BP-20260923-XI-023', 'BP-20260923-XI-017',
  /*
    Shoes — cả 3 SKU của dòng này, không có lựa chọn khác.

    CẢNH BÁO, chưa xử lý xong: ảnh 01 của cả ba mang logo đội phóng lớn làm
    tranh tường, tức không qua được gate §5.2. Ảnh 02 và 03 của cả ba đều
    sạch. Dòng này chỉ gỡ được khi thẻ sản phẩm cho phép chọn ảnh chính khác
    01 — quyết định đó nằm ngoài task tuyển SKU. Chi tiết ở spec §5.2.1.
  */
  'SNK-20260923-XI-009', 'SNK-20260923-XI-010', 'SNK-20260923-XI-011',
]

/*
  SKU có ảnh 01 sạch nhưng ảnh 02 dính. Thẻ của chúng giữ một ảnh, không
  đổi khi hover. Để rỗng nếu cả 12 SKU đều sạch cả đôi.

  Ba tumbler và cả ba cap vào đây vì ảnh 02 của hai dòng này là ảnh bối cảnh
  phòng cổ vũ — có bảng hiệu, banner hoặc áo đấu của đội. Không phải xui vài
  SKU, mà là cách cả hai dòng được chụp.
*/
export const NO_SWAP = new Set([
  'TUM-20260923-XI-028', 'TUM-20260923-XI-023', 'TUM-20260923-XI-026',
  'CAP-20260923-UY-021', 'CAP-20260923-UY-022', 'CAP-20260923-UY-017',
])

export function curatedByType(products, type) {
  const bySku = new Map(products.map((p) => [p.sku, p]))
  return CURATED.map((sku) => bySku.get(sku)).filter((p) => p && p.type === type)
}

/*
  Id của dải preview trên trang chủ. Để ở đây chứ không ở main.js vì main.js
  gọi init() ngay lúc import — test nào import nó sẽ chạm `document` và crash
  trong Node. Logic thuần thì ở file thuần.
*/
export function sectionId(type) { return `shop-${type.toLowerCase()}` }
