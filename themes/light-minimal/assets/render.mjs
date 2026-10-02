/*
  render.mjs — hàm thuần trả chuỗi HTML. Không chạm DOM.
  Tách khỏi main.js để test được bằng node:test mà không cần jsdom.
*/
import { TYPE_LABEL, formatPrice, priceLabel, deriveStyleFamily, displayFamily } from './catalog.mjs'

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* Hậu tố theo vị trí ảnh — sửa lỗi 324 alt trùng lặp (spec §8.3). */
export const ALT_SUFFIX = ['front', 'detail', 'back', 'scale', 'in use']

/*
  Alt lấy từ `title` (viết tắt DAL/PHI/KC/SF), KHÔNG lấy từ `seoTitle`
  vốn mang tên đội đầy đủ — ranh giới IP ở spec §6.
*/
export function imageAlt(product, index) {
  return `${product.title ?? ''} - ${ALT_SUFFIX[index] ?? 'view'}`
}

export function cardHtml(product, opts = {}) {
  const images = product.images ?? []
  const family = displayFamily(deriveStyleFamily(product))
  const typeLabel = TYPE_LABEL[product.type] ?? product.type ?? ''
  const multiPrice = new Set((product.variants ?? []).map((v) => v.price)).size > 1
  const was = !multiPrice && product.compareAt
    ? `<s class="price__was">${formatPrice(product.compareAt)}</s>`
    : ''

  const sizes = 'sizes="(min-width:1280px) 352px, (min-width:768px) 45vw, 90vw"'

  const primary = images[0]
    ? `<img class="card__img card__img--primary" src="${escapeHtml(images[0])}"
           alt="${escapeHtml(imageAlt(product, 0))}"
           loading="lazy" decoding="async" width="1264" height="1264" ${sizes}>`
    : `<div class="card__img card__img--empty" role="presentation"></div>`

  /*
    Ảnh 02 là bản sao trang trí của cùng một sản phẩm — alt rỗng và aria-hidden
    để screen reader không đọc sản phẩm hai lần.
    noSwap: SKU có ảnh 01 sạch nhưng 02 dính watermark (spec §5.2).
  */
  const hover = images[1] && !opts.noSwap
    ? `<img class="card__img card__img--hover" src="${escapeHtml(images[1])}"
           alt="" aria-hidden="true"
           loading="lazy" decoding="async" width="1264" height="1264" ${sizes}>`
    : ''

  return `
    <a class="card reveal" href="/themes/light-minimal/product.html?sku=${encodeURIComponent(product.sku ?? '')}">
      <div class="card__mat"><div class="card__frame">${primary}${hover}</div></div>
      <p class="card__meta label muted">${escapeHtml(typeLabel)} · ${escapeHtml(family)}</p>
      <h3 class="card__title">${escapeHtml(product.title)}</h3>
      <p class="card__price">${priceLabel(product)}${was}</p>
    </a>`
}

export function facetBarHtml(counts, active = null) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const btn = (label, n, value) => {
    const on = (value ?? '') === (active ?? '')
    return `<button type="button" class="facet${on ? ' is-active' : ''}" data-family="${escapeHtml(value ?? '')}" aria-pressed="${on}">${escapeHtml(label)} ${n}</button>`
  }
  const items = [btn('All', total, null)]
  for (const [family, n] of counts) items.push(btn(family, n, family))
  return items.join('')
}

/*
  64 SKU có 5 ảnh, riêng CAP-20260923-UY-021 có 4 (spec §3.4).
  Luôn lặp theo mảng thật, không giả định số lượng.
*/
export function galleryHtml(product) {
  const images = product.images ?? []
  if (images.length === 0) return ''
  return images.map((src, i) => `
    <figure class="gallery__item">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(imageAlt(product, i))}"
           loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"
           width="1264" height="1264"
           sizes="(min-width:1280px) 560px, 90vw">
    </figure>`).join('')
}

/* Thân bài (s.html) đến từ dữ liệu sản phẩm nội bộ, không phải người dùng nhập — giữ nguyên HTML; chỉ tiêu đề được escape. */
export function sectionsHtml(product) {
  const sections = product.sections ?? []
  if (sections.length === 0) return ''
  return sections.map((s) => `
    <section class="pdp__section">
      <h2 class="pdp__heading">${escapeHtml(s.heading)}</h2>
      <div class="pdp__body">${s.html ?? ''}</div>
    </section>`).join('')
}
