/* product.js — wiring DOM cho PDP. */
import { TYPE_ORDER, TYPE_LABEL, byType, priceLabel, formatPrice, deriveStyleFamily, displayFamily } from './catalog.mjs'
import { galleryHtml, sectionsHtml, escapeHtml } from './render.mjs'

async function loadProducts() {
  for (const url of ['../../products/products.json', '/products/products.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()).products ?? []
    } catch { /* thử url kế tiếp */ }
  }
  return []
}

function renderNav(products) {
  const el = document.getElementById('typeNav')
  if (!el) return
  el.innerHTML = TYPE_ORDER.map((t) =>
    `<li><a href="index.html#catalog" data-type="${t}">${TYPE_LABEL[t]} <span class="muted">${byType(products, t).length}</span></a></li>`
  ).join('')
}

function renderVariants(product) {
  const el = document.getElementById('pdpVariants')
  const variants = (product.variants ?? []).filter((v) => v.value)
  if (!product.variantLabel || variants.length === 0) { el.innerHTML = ''; return }
  el.innerHTML = `
    <p class="label muted">${escapeHtml(product.variantLabel)}</p>
    <div class="variants" role="group" aria-label="${escapeHtml(product.variantLabel)}">
      ${variants.map((v, i) => `
        <button type="button" class="facet${i === 0 ? ' is-active' : ''}"
                data-price="${v.price}" aria-pressed="${i === 0}">${escapeHtml(v.value)}</button>`).join('')}
    </div>`

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-price]')
    if (!b) return
    el.querySelectorAll('button[data-price]').forEach((x) => {
      x.classList.remove('is-active')
      x.setAttribute('aria-pressed', 'false')
    })
    b.classList.add('is-active')
    b.setAttribute('aria-pressed', 'true')
    document.getElementById('pdpPrice').textContent = formatPrice(Number(b.dataset.price))
  })
}

async function init() {
  const products = await loadProducts()
  renderNav(products)

  const sku = new URLSearchParams(location.search).get('sku')
  const product = products.find((p) => p.sku === sku)

  if (!product) {
    document.getElementById('pdpError').hidden = false
    return
  }

  document.title = `${product.title} | Goldbourne & Co.`
  document.getElementById('pdpContent').hidden = false
  document.getElementById('gallery').innerHTML = galleryHtml(product)
  document.getElementById('pdpTitle').textContent = product.title
  document.getElementById('pdpHook').textContent = product.hook ?? ''
  document.getElementById('pdpPrice').textContent = priceLabel(product)
  document.getElementById('pdpMeta').textContent =
    `${TYPE_LABEL[product.type] ?? product.type} · ${displayFamily(deriveStyleFamily(product))}`
  document.getElementById('pdpSections').innerHTML = sectionsHtml(product)
  renderVariants(product)

  document.getElementById('pdpAdd').addEventListener('click', () => {
    document.getElementById('pdpAdd').textContent = 'Added'
  })
}

init()
