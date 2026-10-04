/* product.js — wiring DOM cho PDP Goldbourne & Co. */
import {
  TYPE_LABEL, priceLabel, formatPrice, deriveStyleFamily, displayFamily,
  sectionId, catalogDiscipline, NO_SWAP,
} from './catalog.mjs'
import { escapeHtml, navHtml, cardHtml, ALT_SUFFIX } from './render.mjs'
import { mountCartUI } from './cart.mjs'
import { mountMenuUI } from './menu.mjs'

async function loadProducts() {
  for (const url of ['../../products/products.json', '/products/products.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()).products ?? []
    } catch { /* thử url kế tiếp */ }
  }
  return []
}

function renderNav() {
  const el = document.getElementById('typeNav')
  if (!el) return
  el.innerHTML = navHtml((t) => `/themes/dark-minimal/index.html#${sectionId(t)}`)
}

function renderFooterNav() {
  const el = document.getElementById('footerNav')
  if (!el) return
  el.innerHTML = navHtml((t) => `/themes/dark-minimal/index.html#${sectionId(t)}`)
}

function renderVariants(product) {
  const el = document.getElementById('pdpVariants')
  if (!el) return
  const variants = (product.variants ?? []).filter((v) => v.value)
  if (!product.variantLabel || variants.length === 0) { el.innerHTML = ''; return }
  el.innerHTML = `
    <p class="label muted pdp__variant-label">${escapeHtml(product.variantLabel)}</p>
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
    const priceEl = document.getElementById('pdpPrice')
    if (priceEl) priceEl.textContent = formatPrice(Number(b.dataset.price))
  })
}

function setupGallery(product) {
  const stageImg = document.getElementById('stageImg')
  const stageCaption = document.getElementById('stageCaption')
  const galleryEl = document.getElementById('gallery')
  const images = product.images ?? []
  if (!stageImg || !galleryEl || images.length === 0) return

  stageImg.src = images[0]
  stageImg.alt = `${product.title} - ${ALT_SUFFIX[0] ?? 'front'}`
  if (stageCaption) {
    stageCaption.textContent = `View 1 of ${images.length} · ${ALT_SUFFIX[0] ?? 'front'}`
  }

  galleryEl.innerHTML = images.map((src, i) => `
    <button type="button" class="gallery__thumb${i === 0 ? ' is-active' : ''}"
            data-index="${i}" data-src="${escapeHtml(src)}"
            aria-label="${escapeHtml(product.title)} - view ${i + 1} (${ALT_SUFFIX[i] ?? 'view'})"
            aria-pressed="${i === 0}">
      <img src="${escapeHtml(src)}" alt="" width="120" height="120" loading="lazy" decoding="async">
    </button>
  `).join('')

  galleryEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-src]')
    if (!btn) return
    const idx = Number(btn.dataset.index) || 0
    galleryEl.querySelectorAll('button[data-src]').forEach((b) => {
      b.classList.remove('is-active')
      b.setAttribute('aria-pressed', 'false')
    })
    btn.classList.add('is-active')
    btn.setAttribute('aria-pressed', 'true')

    stageImg.style.opacity = '0.35'
    setTimeout(() => {
      stageImg.src = btn.dataset.src
      stageImg.alt = `${product.title} - ${ALT_SUFFIX[idx] ?? 'view'}`
      if (stageCaption) {
        stageCaption.textContent = `View ${idx + 1} of ${images.length} · ${ALT_SUFFIX[idx] ?? 'view'}`
      }
      stageImg.style.opacity = '1'
    }, 120)
  })
}

function setupQuantity() {
  const qtyInput = document.getElementById('pdpQty')
  const btnMinus = document.getElementById('pdpQtyMinus')
  const btnPlus = document.getElementById('pdpQtyPlus')
  if (!qtyInput || !btnMinus || !btnPlus) return

  btnMinus.addEventListener('click', () => {
    const val = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1)
    qtyInput.value = val
  })
  btnPlus.addEventListener('click', () => {
    const val = Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1)
    qtyInput.value = val
  })
  qtyInput.addEventListener('change', () => {
    let val = parseInt(qtyInput.value, 10)
    if (isNaN(val) || val < 1) val = 1
    if (val > 99) val = 99
    qtyInput.value = val
  })
}

function renderDossier(product, discipline) {
  const sectionsEl = document.getElementById('pdpSections')
  const sectionsWrap = document.getElementById('pdpSectionsWrap')
  if (!sectionsEl || !sectionsWrap) return

  const sections = product.sections ?? []
  const designStory = sections.find((s) => s.heading === 'Design Story')
  const usageStory = sections.find((s) => /experience|styling/i.test(s.heading))
  const sizeSection = sections.find((s) => /size|dimensions|capacity/i.test(s.heading))
  const productDetails = sections.find((s) => s.heading === 'Product Details')
  const careSection = sections.find((s) => /care/i.test(s.heading))

  sectionsWrap.hidden = false

  sectionsEl.innerHTML = `
    <div class="pdp-dossier__header">
      <p class="section-tag">Atelier Dossier &middot; Specifications</p>
      <h2 class="pdp-dossier__title">Curatorial Dossier</h2>
    </div>

    <div class="pdp-tabs" role="tablist" aria-label="Curatorial Dossier Sections">
      <button type="button" class="pdp-tab is-active" id="tabBtnStory" role="tab" aria-selected="true" aria-controls="panelStory">
        Design Story
      </button>
      <button type="button" class="pdp-tab" id="tabBtnSpecs" role="tab" aria-selected="false" aria-controls="panelSpecs">
        Material &amp; Craft
      </button>
      <button type="button" class="pdp-tab" id="tabBtnSize" role="tab" aria-selected="false" aria-controls="panelSize">
        Dimensions &amp; Scale
      </button>
      <button type="button" class="pdp-tab" id="tabBtnCare" role="tab" aria-selected="false" aria-controls="panelCare">
        Archival Care
      </button>
    </div>

    <!-- Panel 1: Story -->
    <div class="pdp-panel is-active" id="panelStory" role="tabpanel" aria-labelledby="tabBtnStory">
      <div class="pdp-panel__prose">
        <h3 class="pdp-panel__subheading">Artisanal Narrative</h3>
        ${designStory ? designStory.html : `<p>${escapeHtml(discipline.description)}</p>`}
        ${usageStory ? `
          <h3 class="pdp-panel__subheading pdp-panel__subheading--spaced">${escapeHtml(usageStory.heading)}</h3>
          ${usageStory.html}
        ` : ''}
      </div>
    </div>

    <!-- Panel 2: Specs -->
    <div class="pdp-panel" id="panelSpecs" role="tabpanel" aria-labelledby="tabBtnSpecs" hidden>
      <div class="pdp-spec-table">
        ${discipline.specs.map((sp) => `
          <div class="pdp-spec-row">
            <span class="pdp-spec-label">${escapeHtml(sp.label)}</span>
            <span class="pdp-spec-value">${escapeHtml(sp.value)}</span>
          </div>
        `).join('')}
      </div>
      ${productDetails ? `
        <div class="pdp-panel__extra">
          <h3 class="pdp-panel__subheading">Fabrication Details</h3>
          ${productDetails.html}
        </div>
      ` : ''}
    </div>

    <!-- Panel 3: Size & Fit -->
    <div class="pdp-panel" id="panelSize" role="tabpanel" aria-labelledby="tabBtnSize" hidden>
      <div class="pdp-panel__prose">
        <h3 class="pdp-panel__subheading">Scale &amp; Proportion Analysis</h3>
        ${sizeSection ? sizeSection.html : `
          <p>Standard architectural proportions engineered for this discipline.</p>
        `}
      </div>
    </div>

    <!-- Panel 4: Care -->
    <div class="pdp-panel" id="panelCare" role="tabpanel" aria-labelledby="tabBtnCare" hidden>
      <div class="pdp-panel__prose">
        <h3 class="pdp-panel__subheading">Preservation Protocols</h3>
        ${careSection ? careSection.html : `
          <p>${escapeHtml(discipline.care)}</p>
        `}
        <p class="muted pdp-panel__note">
          Every piece in this Edition is crafted with delicate high-relief surface matrices. Treat with the care afforded to fine decorative metalware.
        </p>
      </div>
    </div>
  `

  const tabs = sectionsEl.querySelectorAll('.pdp-tab')
  const panels = sectionsEl.querySelectorAll('.pdp-panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('is-active')
        t.setAttribute('aria-selected', 'false')
      })
      panels.forEach((p) => {
        p.classList.remove('is-active')
        p.hidden = true
      })
      tab.classList.add('is-active')
      tab.setAttribute('aria-selected', 'true')
      const targetId = tab.getAttribute('aria-controls')
      const targetPanel = document.getElementById(targetId)
      if (targetPanel) {
        targetPanel.hidden = false
        targetPanel.classList.add('is-active')
      }
    })
  })
}

function renderRelated(products, currentProduct, discipline) {
  const sectionEl = document.getElementById('pdpRelated')
  const gridEl = document.getElementById('pdpRelatedGrid')
  if (!sectionEl || !gridEl) return

  let related = products.filter((p) => p.type === currentProduct.type && p.sku !== currentProduct.sku)
  if (related.length < 3) {
    const extra = products.filter((p) => p.sku !== currentProduct.sku && !related.includes(p))
    related = [...related, ...extra]
  }
  related = related.slice(0, 3)

  if (related.length === 0) return

  sectionEl.hidden = false
  const eyebrowEl = document.getElementById('pdpRelatedEyebrow')
  const titleEl = document.getElementById('pdpRelatedTitle')
  if (eyebrowEl) eyebrowEl.textContent = `Discipline Archives · ${discipline.name}`
  if (titleEl) titleEl.textContent = `Explore More from ${TYPE_LABEL[currentProduct.type] ?? 'Collection'}`

  gridEl.innerHTML = related.map((p) => cardHtml(p, { noSwap: NO_SWAP.has(p.sku) })).join('')
}

async function init() {
  const products = await loadProducts()
  renderNav()
  renderFooterNav()
  mountMenuUI({ hrefFor: (t) => `/themes/dark-minimal/index.html#${sectionId(t)}` })

  const sku = new URLSearchParams(location.search).get('sku')
  const product = products.find((p) => p.sku === sku)

  if (!product) {
    const errorEl = document.getElementById('pdpError')
    if (errorEl) errorEl.hidden = false
    return
  }

  document.title = `${product.title} | Goldbourne & Co.`

  const breadcrumbEl = document.getElementById('pdpBreadcrumb')
  const contentEl = document.getElementById('pdpContent')
  if (breadcrumbEl) breadcrumbEl.hidden = false
  if (contentEl) contentEl.hidden = false

  const backLink = document.getElementById('pdpBackLink')
  const backText = document.getElementById('pdpBackText')
  const crumbCurrent = document.getElementById('pdpCrumbCurrent')
  if (backLink) backLink.href = `/themes/dark-minimal/index.html#${sectionId(product.type)}`
  if (backText) backText.textContent = TYPE_LABEL[product.type] ?? product.type
  if (crumbCurrent) crumbCurrent.textContent = product.title

  const discipline = catalogDiscipline(product.type)
  const discTag = document.getElementById('pdpDisciplineTag')
  if (discTag) discTag.textContent = discipline.disciplineTag

  const metaEl = document.getElementById('pdpMeta')
  if (metaEl) {
    metaEl.textContent = `${TYPE_LABEL[product.type] ?? product.type} · ${displayFamily(deriveStyleFamily(product))}`
  }

  const titleEl = document.getElementById('pdpTitle')
  if (titleEl) titleEl.textContent = product.title

  const hookEl = document.getElementById('pdpHook')
  if (hookEl) hookEl.textContent = product.hook ?? ''

  const priceEl = document.getElementById('pdpPrice')
  if (priceEl) priceEl.textContent = priceLabel(product)

  const compareAtEl = document.getElementById('pdpCompareAt')
  if (compareAtEl && product.compareAt) {
    compareAtEl.hidden = false
    compareAtEl.textContent = formatPrice(product.compareAt)
  }

  const descEl = document.getElementById('pdpCatalogDesc')
  if (descEl) descEl.textContent = discipline.description

  const highlightsEl = document.getElementById('pdpHighlights')
  if (highlightsEl && discipline.highlights) {
    highlightsEl.innerHTML = discipline.highlights
      .map((h) => `<span class="pdp__highlight-chip">${escapeHtml(h)}</span>`)
      .join('')
  }

  setupGallery(product)
  renderVariants(product)
  setupQuantity()
  renderDossier(product, discipline)
  renderRelated(products, product, discipline)

  const cartApi = mountCartUI({ products })

  const addBtn = document.getElementById('pdpAdd')
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const activeFacet = document.querySelector('#pdpVariants button.is-active')
      const variantValue = activeFacet ? activeFacet.textContent.trim() : null
      const price = activeFacet ? Number(activeFacet.dataset.price) : (product.price ?? 0)
      const qtyInput = document.getElementById('pdpQty')
      const quantity = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1

      cartApi.addItem({
        sku: product.sku,
        title: product.title,
        type: product.type,
        price: price,
        image: product.images?.[0],
        variantValue: variantValue,
        variantLabel: product.variantLabel,
        quantity: quantity,
      })

      const span = addBtn.querySelector('span') || addBtn
      const origText = span.textContent
      span.textContent = 'Added to Selection'
      setTimeout(() => { span.textContent = origText }, 1800)
    })
  }
}

init()
