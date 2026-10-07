/* product.js — wiring DOM cho PDP Goldbourne & Co. */
import {
  TYPE_LABEL, priceLabel, formatPrice, deriveStyleFamily, displayFamily,
  sectionId, catalogDiscipline, NO_SWAP,
} from './catalog.mjs'
import { escapeHtml, navHtml, cardHtml, ALT_SUFFIX } from './render.mjs'
import { mountCartUI } from './cart.mjs'
import { mountMenuUI } from './menu.mjs'
import { resolveUpsellBundle, calculateBundlePricing } from './upsell.mjs'

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
  el.innerHTML = navHtml((t) => `/themes/light-minimal/index.html#${sectionId(t)}`)
}

function renderFooterNav() {
  const el = document.getElementById('footerNav')
  if (!el) return
  el.innerHTML = navHtml((t) => `/themes/light-minimal/index.html#${sectionId(t)}`)
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

function mountEnsembleUI({ currentProduct, allProducts, cartApi }) {
  const widgetEl = document.getElementById('pdpBundleWidget')
  const ensembleEl = document.getElementById('pdpEnsemble')
  if (!widgetEl && !ensembleEl) return

  const bundle = resolveUpsellBundle(currentProduct, allProducts)
  if (!bundle || !bundle.companions || bundle.companions.length === 0) return

  const items = [currentProduct, ...bundle.companions.map((c) => c.product)]

  const state = {
    checked: items.reduce((acc, it) => {
      acc[it.sku] = true
      return acc
    }, {}),
    variants: items.reduce((acc, it) => {
      acc[it.sku] = (it.variants && it.variants.length > 0) ? it.variants[0].value : null
      return acc
    }, {}),
  }

  function getItemPrice(product) {
    const selectedVariantVal = state.variants[product.sku]
    if (selectedVariantVal && product.variants) {
      const v = product.variants.find((x) => x.value === selectedVariantVal)
      if (v && v.price != null) return Number(v.price)
    }
    return Number(product.price) || 0
  }

  function getCalculatedPricing() {
    const checkedList = items
      .filter((it) => state.checked[it.sku])
      .map((it) => ({ sku: it.sku, price: getItemPrice(it) }))
    return calculateBundlePricing(checkedList, 0.10)
  }

  function renderWidget() {
    if (!widgetEl) return
    const pricing = getCalculatedPricing()

    widgetEl.innerHTML = `
      <div class="pdp-bundle-widget__header">
        <p class="pdp-bundle-widget__tag">Curated Ensemble Offer</p>
        <h3 class="pdp-bundle-widget__title">Complete The Set (10% Off)</h3>
      </div>
      <ul class="pdp-bundle-list" role="list">
        ${items.map((it, idx) => {
          const isMain = idx === 0
          const isChecked = state.checked[it.sku]
          const price = getItemPrice(it)
          const hasVariants = it.variants && it.variants.length > 0
          const selectedVal = state.variants[it.sku]
          const discPrice = pricing.isDiscounted ? Math.round(price * 0.9 * 100) / 100 : price

          return `
            <li class="pdp-bundle-item">
              <input type="checkbox" class="pdp-bundle-item__check" id="widgetCheck_${escapeHtml(it.sku)}"
                     data-sku="${escapeHtml(it.sku)}" ${isChecked ? 'checked' : ''} ${isMain ? 'disabled' : ''}
                     aria-label="Include ${escapeHtml(it.title)}">
              <img class="pdp-bundle-item__thumb" src="${escapeHtml(it.images?.[0] ?? '')}" alt="" width="48" height="48" loading="lazy">
              <div class="pdp-bundle-item__info">
                <a class="pdp-bundle-item__title" href="/themes/light-minimal/product.html?sku=${encodeURIComponent(it.sku)}" title="${escapeHtml(it.title)}">
                  ${escapeHtml(it.title)}
                </a>
                <div class="pdp-bundle-item__meta">
                  ${pricing.isDiscounted ? `
                    <span style="font-weight: 500; color: var(--fg);">${formatPrice(discPrice)}</span>
                    <s style="color: var(--muted);">${formatPrice(price)}</s>
                  ` : `
                    <span>${formatPrice(price)}</span>
                  `}
                  ${hasVariants ? `
                    <select class="pdp-bundle-item__select" data-sku="${escapeHtml(it.sku)}" aria-label="Select size for ${escapeHtml(it.title)}">
                      ${it.variants.map((v) => `
                        <option value="${escapeHtml(v.value)}" ${v.value === selectedVal ? 'selected' : ''}>
                          ${escapeHtml(v.value)}
                        </option>
                      `).join('')}
                    </select>
                  ` : ''}
                </div>
              </div>
            </li>
          `
        }).join('')}
      </ul>

      <div class="pdp-bundle-pricing">
        <div class="pdp-bundle-pricing__amounts">
          <span class="pdp-bundle-pricing__total">${formatPrice(pricing.discountedTotal)}</span>
          ${pricing.isDiscounted ? `<s class="pdp-bundle-pricing__was">${formatPrice(pricing.originalTotal)}</s>` : ''}
        </div>
        ${pricing.isDiscounted ? `<span class="pdp-bundle-pricing__badge">Save ${formatPrice(pricing.savingsTotal)} (10% OFF)</span>` : ''}
      </div>

      <button type="button" class="btn btn--pdp-add btn--bundle-add" id="widgetAddBundle">
        <span>${pricing.isDiscounted ? 'Add Ensemble to Selection' : 'Add to Selection'}</span>
        <span aria-hidden="true">&rarr;</span>
      </button>

      <button type="button" class="pdp-bundle-widget__scroll" id="widgetScrollEnsemble">
        Explore Full Ensemble Specs &darr;
      </button>
    `

    widgetEl.hidden = false
  }

  function renderShowcase() {
    if (!ensembleEl) return
    const pricing = getCalculatedPricing()

    const titleEl = document.getElementById('ensembleTitle')
    const leadEl = document.getElementById('ensembleLead')
    const gridEl = document.getElementById('ensembleGrid')
    const footerEl = document.getElementById('ensembleFooter')

    if (titleEl) titleEl.textContent = bundle.ensembleTitle
    if (leadEl) leadEl.textContent = bundle.ensembleSubtitle

    if (gridEl) {
      gridEl.innerHTML = items.map((it, idx) => {
        const isMain = idx === 0
        const isChecked = state.checked[it.sku]
        const price = getItemPrice(it)
        const discPrice = pricing.isDiscounted ? Math.round(price * 0.9 * 100) / 100 : price
        const badge = isMain ? 'Primary Edition' : (bundle.companions[idx - 1]?.badge ?? 'Ensemble Complement')
        const hasVariants = it.variants && it.variants.length > 0
        const selectedVal = state.variants[it.sku]

        return `
          <article class="pdp-ensemble-card${isChecked ? ' is-active' : ''}" id="ensembleCard_${escapeHtml(it.sku)}">
            <span class="pdp-ensemble-card__badge">${escapeHtml(badge)}</span>
            <div class="pdp-ensemble-card__img-wrap">
              <a href="/themes/light-minimal/product.html?sku=${encodeURIComponent(it.sku)}">
                <img class="pdp-ensemble-card__img" src="${escapeHtml(it.images?.[0] ?? '')}" alt="${escapeHtml(it.title)}" width="400" height="400" loading="lazy">
              </a>
            </div>
            <div class="pdp-ensemble-card__meta">
              <span>${escapeHtml(it.type)}</span>
              <span>&middot;</span>
              ${pricing.isDiscounted ? `
                <strong style="color: var(--fg);">${formatPrice(discPrice)}</strong>
                <s style="color: var(--muted);">${formatPrice(price)}</s>
              ` : `
                <span>${formatPrice(price)}</span>
              `}
            </div>
            <h3 class="pdp-ensemble-card__title">
              <a href="/themes/light-minimal/product.html?sku=${encodeURIComponent(it.sku)}" style="color: inherit; text-decoration: none;">
                ${escapeHtml(it.title)}
              </a>
            </h3>

            <div class="pdp-ensemble-card__controls">
              <label class="pdp-ensemble-card__check-label" for="showcaseCheck_${escapeHtml(it.sku)}">
                <input type="checkbox" class="pdp-bundle-item__check" id="showcaseCheck_${escapeHtml(it.sku)}"
                       data-sku="${escapeHtml(it.sku)}" ${isChecked ? 'checked' : ''} ${isMain ? 'disabled' : ''}>
                <span>${isMain ? 'Current Edition' : 'Include in Ensemble'}</span>
              </label>

              ${hasVariants ? `
                <select class="pdp-bundle-item__select" data-sku="${escapeHtml(it.sku)}" aria-label="Select size for ${escapeHtml(it.title)}">
                  ${it.variants.map((v) => `
                    <option value="${escapeHtml(v.value)}" ${v.value === selectedVal ? 'selected' : ''}>
                      ${escapeHtml(v.value)}
                    </option>
                  `).join('')}
                </select>
              ` : ''}
            </div>
          </article>
        `
      }).join('')
    }

    if (footerEl) {
      footerEl.innerHTML = `
        <div class="pdp-ensemble__footer-info">
          <h3 class="pdp-ensemble__footer-title">
            Ensemble Total: ${formatPrice(pricing.discountedTotal)}
            ${pricing.isDiscounted ? `<s style="font-size: var(--fs-3); color: var(--muted); font-weight: normal; margin-left: 0.5rem;">${formatPrice(pricing.originalTotal)}</s>` : ''}
          </h3>
          ${pricing.isDiscounted ? `
            <span class="pdp-bundle-pricing__badge" style="width: fit-content;">Save ${formatPrice(pricing.savingsTotal)} (10% OFF Ensemble Allocation)</span>
          ` : `
            <span style="font-size: var(--fs-1); color: var(--muted);">Select companion editions to activate 10% savings</span>
          `}
        </div>

        <button type="button" class="btn btn--pdp-add" id="showcaseAddBundle" style="width: auto; min-width: 260px;">
          <span>${pricing.isDiscounted ? 'Add Complete Ensemble to Selection' : 'Add Selection to Cart'}</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      `
    }

    ensembleEl.hidden = false
  }

  function handleCheckToggle(sku, isChecked) {
    state.checked[sku] = isChecked
    renderWidget()
    renderShowcase()
  }

  function handleVariantChange(sku, variantVal) {
    state.variants[sku] = variantVal
    renderWidget()
    renderShowcase()
  }

  function handleAddBundle(triggerBtn) {
    const pricing = getCalculatedPricing()
    const selectedItems = items.filter((it) => state.checked[it.sku])
    const mainQtyInput = document.getElementById('pdpQty')
    const mainQty = mainQtyInput ? Math.max(1, parseInt(mainQtyInput.value, 10) || 1) : 1

    selectedItems.forEach((it) => {
      const origPrice = getItemPrice(it)
      const finalPrice = pricing.isDiscounted ? Math.round(origPrice * 0.9 * 100) / 100 : origPrice
      const qty = it.sku === currentProduct.sku ? mainQty : 1

      cartApi.addItem({
        sku: it.sku,
        title: it.title,
        type: it.type,
        price: finalPrice,
        compareAt: pricing.isDiscounted ? origPrice : it.compareAt,
        image: it.images?.[0],
        variantValue: state.variants[it.sku] ?? null,
        variantLabel: it.variantLabel ?? null,
        quantity: qty,
      })
    })

    if (triggerBtn) {
      const span = triggerBtn.querySelector('span') || triggerBtn
      const origText = span.textContent
      span.textContent = 'Ensemble Added'
      setTimeout(() => { span.textContent = origText }, 1800)
    }
  }

  widgetEl.addEventListener('change', (e) => {
    const check = e.target.closest('input[type="checkbox"][data-sku]')
    if (check) {
      handleCheckToggle(check.dataset.sku, check.checked)
      return
    }
    const sel = e.target.closest('select[data-sku]')
    if (sel) {
      handleVariantChange(sel.dataset.sku, sel.value)
    }
  })

  widgetEl.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#widgetAddBundle')
    if (addBtn) {
      handleAddBundle(addBtn)
      return
    }
    const scrollBtn = e.target.closest('#widgetScrollEnsemble')
    if (scrollBtn && ensembleEl) {
      ensembleEl.scrollIntoView({ behavior: 'smooth' })
    }
  })

  ensembleEl.addEventListener('change', (e) => {
    const check = e.target.closest('input[type="checkbox"][data-sku]')
    if (check) {
      handleCheckToggle(check.dataset.sku, check.checked)
      return
    }
    const sel = e.target.closest('select[data-sku]')
    if (sel) {
      handleVariantChange(sel.dataset.sku, sel.value)
    }
  })

  ensembleEl.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#showcaseAddBundle')
    if (addBtn) {
      handleAddBundle(addBtn)
    }
  })

  renderWidget()
  renderShowcase()
}

async function init() {
  const products = await loadProducts()
  renderNav()
  renderFooterNav()
  mountMenuUI({ hrefFor: (t) => `/themes/light-minimal/index.html#${sectionId(t)}` })

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
  if (backLink) backLink.href = `/themes/light-minimal/index.html#${sectionId(product.type)}`
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
  mountEnsembleUI({ currentProduct: product, allProducts: products, cartApi })

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

