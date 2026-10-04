/*
  catalog.mjs — logic thuần của catalog dark-minimal.
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

  Mọi ảnh 01 và 02 của 12 SKU này đã được soi bằng mắt ngày 02-03/10/2026:
  không ảnh nào có watermark AURA TUMBLER. Kết quả đầy đủ, gồm một ngoại lệ
  đã chấp nhận ở dòng Shoes, ghi tại spec §5.2 và §10.1. Thêm SKU vào đây mà
  chưa soi ảnh là đưa rủi ro IP lên mặt tiền.

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

    Ảnh 01 của cả ba có logo đội phóng lớn làm tranh tường ở hậu cảnh, tức
    không qua gate §5.2. Ảnh 02 và 03 của cả ba đều sạch, nên đổi ảnh chính
    là gỡ được. Chủ store được trình bày cả phương án đó lẫn phương án bỏ
    dải Shoes, và chọn giữ nguyên ảnh 01 ngày 03/10/2026. Đây là rủi ro đã
    cân nhắc và chấp nhận, không phải thứ bị bỏ sót — đừng "sửa" nó mà
    không đọc spec §10.1 trước.
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

/*
  Quyết định thuần cho deep-link: hash nào trỏ tới một dải có thật thì cuộn
  tới, hash rác hoặc không khớp thì không làm gì. Tách khỏi main.js vì
  main.js chạm DOM (và tự gọi init() lúc import) — logic quyết định phải
  nằm ở file thuần để test bằng node:test, phần chạm DOM (scrollIntoView)
  vẫn ở main.js.
*/
export function hashSectionTarget(hash, validIds) {
  const id = String(hash ?? '').replace(/^#/, '')
  if (!id) return null
  return validIds.includes(id) ? id : null
}

export const CATALOG_DISCIPLINE = {
  Tumbler: {
    roman: 'I',
    name: 'The Vessel',
    disciplineTag: 'Edition I · The Vessel',
    headline: '40oz Double-Wall Vacuum Steel',
    description: 'Engineered as a ceremonial vessel for daily ritual, each 40oz Edition is cast from double-wall vacuum-insulated 304 food-grade stainless steel. A continuous 360-degree high-relief ornamental matrix wraps seamlessly around the exterior, ensuring no unadorned surface is left exposed. Designed to preserve chilled temperaments for 24 hours and piping warmth for up to 10 hours, it features an ergonomic contoured carry loop, dual-function splash-resistant lid, and an archival finish that commands architectural presence on any surface.',
    highlights: ['SUS 304 Vacuum Steel', '360° Tactile Gilded Relief', '24h Cold / 10h Hot', 'Tapered Console Base'],
    specs: [
      { label: 'Capacity', value: '40 oz (approx. 1,180 ml)' },
      { label: 'Thermal Structure', value: 'Double-wall vacuum SUS 304 stainless steel' },
      { label: 'Insulation Rating', value: '24h chilled · 10h piping warm' },
      { label: 'Ornamentation', value: '360° cold-cast continuous tactile relief' },
      { label: 'Closure', value: 'Dual-function lid with splash barrier & reusable straw aperture' },
      { label: 'Silhouette', value: '9.8" H × 3.9" Dia (Tapered 2.9" base fits standard console holders)' },
    ],
    care: 'Hand wash recommended with mild botanical cleanser. Avoid abrasive scourers to preserve gilded surface luster.',
  },
  Cap: {
    roman: 'II',
    name: 'The Crown',
    disciplineTag: 'Edition II · The Crown',
    headline: 'Six-Panel Architectural Headwear',
    description: 'Constructed with the structural precision of bespoke millinery, The Crown is a six-panel structured silhouette tailored from a premium heavyweight wool-blend canvas. The front panel serves as an architectural plinth for deep-embossed bullion wire crest embroidery and high-density gilded metallic threadwork. Lined internally with a moisture-wicking damask satin headband and detailed with antiqued brass closure hardware, each piece offers effortless contouring while maintaining its sculpted crown geometry.',
    highlights: ['6-Panel Structured Crown', 'Bullion Wire Crest Relief', 'Damask Satin Lining', 'Antiqued Brass Clasp'],
    specs: [
      { label: 'Silhouette', value: '6-panel structured crown with reinforced buckram plinth' },
      { label: 'Material', value: 'Heavyweight wool-cotton twill with damask satin lining' },
      { label: 'Ornamentation', value: 'High-density gilded bullion wire embroidery & crest relief' },
      { label: 'Closure', value: 'Self-fabric tailored strap with antiqued brass tension buckle' },
      { label: 'Ventilation', value: 'Embroidered airflow eyelets' },
      { label: 'Sizing', value: 'Unisex Universal Fit (Circumference 56–60 cm / 22–23.6")' },
    ],
    care: 'Spot clean with cool water and soft cloth. Air dry on crown mold to retain sculptural architecture.',
  },
  Backpack: {
    roman: 'III',
    name: 'The Hauler',
    disciplineTag: 'Edition III · The Hauler',
    headline: 'Haute Utility Hauler',
    description: 'Conceived at the intersection of haute utility and gothic relief, The Hauler is cut from high-density water-resistant canvas accented with textured pebble-grain leather panels. The front panel features a monumental crest composition bordered by gold piping and molten metallic drip accents. Internally, a multi-tiered sanctuary houses a dedicated high-density padded sleeve for laptops up to 16 inches, complemented by ergonomic dual-density padded shoulder straps engineered for balanced load distribution.',
    highlights: ['Water-Resistant Canvas', '16" Padded Device Sanctuary', 'Antiqued Alloy Closures', 'Ergonomic Dual Harness'],
    specs: [
      { label: 'Material', value: 'High-density water-resistant canvas & pebble-grain trim' },
      { label: 'Interior Sanctuary', value: 'High-density padded foam sleeve (up to 16" device)' },
      { label: 'Hardware', value: 'Precision antiqued alloy closures & reinforced gold piping' },
      { label: 'Ergonomics', value: 'Contoured dual-density load-bearing harness' },
      { label: 'Organization', value: 'Multi-chamber portfolio, stationery & accessory compartments' },
      { label: 'Scales', value: 'S (11.8"H) · M (15.7"H) · L (17.7"H)' },
    ],
    care: 'Wipe surface with damp microfiber cloth. Store in presentation dust cover when not in transit.',
  },
  Shoes: {
    roman: 'IV',
    name: 'The Foundation',
    disciplineTag: 'Edition IV · The Foundation',
    headline: 'Sculpted Luxury Footwear',
    description: 'Sculpted as an architectural anchor for the modern silhouette, The Foundation pairs a breathable, reinforced technical upper with hand-placed gilded crest insignias and metallic seam piping. Balanced atop a lightweight MD midsole and high-abrasion zoned rubber traction pods, it delivers cloud-like comfort and athletic responsiveness wrapped in the quiet gravitas of couture footwear. Each pair is balanced with tone-on-tone laces and an ergonomic cupsole engineered for all-day composure.',
    highlights: ['Sculpted Metallic Crest', 'Lightweight MD Midsole', 'High-Rebound Insole', 'Continental Scale EU 36–48'],
    specs: [
      { label: 'Upper', value: 'Engineered breathable matrix with gilded crest insignias' },
      { label: 'Sole Architecture', value: 'Featherweight MD midsole with zoned rubber traction pods' },
      { label: 'Insole', value: 'Ergonomic high-rebound cushioning insole' },
      { label: 'Closure', value: 'Reinforced eyelet stay with woven tonal laces' },
      { label: 'Profile', value: 'Low-top court silhouette (EU 36–48 true to continental scale)' },
      { label: 'Packaging', value: 'Archival presentation casket with consignment certificate' },
    ],
    care: 'Brush gently with soft horsehair brush. Allow to dry naturally away from direct radiant heat.',
  },
}

export function catalogDiscipline(type) {
  return CATALOG_DISCIPLINE[type] ?? {
    roman: '·',
    name: type ?? 'Edition',
    disciplineTag: `Edition · ${type ?? 'Artifact'}`,
    headline: 'Gilded Archive Piece',
    description: 'Handcrafted gilded editions cast with ceremonial gravitas and architectural restraint.',
    highlights: ['Gilded Surface Relief', 'Archival Presentation Casket'],
    specs: [],
    care: 'Handle with care to preserve artisanal finish.',
  }
}

