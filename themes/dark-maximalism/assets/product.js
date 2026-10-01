const DEFAULT_SKU = 'TUM-20260923-XI-001'   // Lunar Ornament — sạch IP, cùng nguồn với og.jpg
const IMAGE_ROLES = ['front', 'detail', 'back', 'scale', 'in use']
const CATEGORY_ANCHORS = {
  Tumbler: 'tumblers',
  Cap: 'caps',
  Backpack: 'backpacks',
  Shoes: 'shoes'
}

// Cutoff sinh từ công thức ở spec §2.3, không hardcode ngày hiển thị.
const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

function formatPrice(n) {
  return n == null ? '' : '$' + n.toFixed(2)
}

function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

function startAnnouncement() {
  const el = document.getElementById('announce')
  if (!el) return
  const msgs = activeMessages()
  if (msgs.length === 0) { el.hidden = true; return }
  let i = 0
  el.textContent = msgs[0].text
  if (msgs.length > 1) {
    setInterval(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i].text }, 5000)
  }
}

function galleryHtml(p) {
  const images = p.images && p.images.length > 0 ? p.images : ['assets/images/hero_tumblers.jpg']
  const hero = images[0]
  const thumbs = images.map((src, i) => `
    <button class="pdp__thumb-btn ${i === 0 ? 'is-active' : ''}" type="button" data-src="${src}" data-alt="${p.title} - ${IMAGE_ROLES[i] ?? 'view ' + (i + 1)}" aria-label="View photo ${i + 1}">
      <img src="${src}" alt="" loading="lazy" width="120" height="120">
    </button>
  `).join('')

  return `
    <div class="pdp__main-wrapper">
      <img class="pdp__main-img" id="pdpMainImg" src="${hero}" alt="${p.title} - front" width="900" height="900">
    </div>
    <div class="pdp__thumbs">
      ${thumbs}
    </div>`
}

function variantsHtml(p) {
  if (!p.variantLabel || !p.variants || p.variants.length === 0) return ''
  const btns = p.variants.map((v, i) =>
    `<button class="chip pdp__variant-chip ${i === 0 ? 'is-active' : ''}" type="button" data-index="${i}" data-price="${v.price}" data-compare="${v.compareAt ?? ''}" aria-pressed="${i === 0}">${v.value}</button>`
  ).join('')
  return `
    <div class="pdp__variants-block">
      <div class="pdp__section-title"><span class="gem">✦</span> ${p.variantLabel}: <strong id="selectedVariantVal">${p.variants[0]?.value ?? ''}</strong></div>
      <div class="pdp__variants" role="group" aria-label="${p.variantLabel} Options">
        ${btns}
      </div>
    </div>`
}

function sectionsHtml(p) {
  if (!p.sections || p.sections.length === 0) return ''
  return `
    <div class="pdp__sections">
      ${p.sections.map((s) => {
        const cleanHtml = s.html.replace(/(<li>)\s*✔\s*/g, '$1')
        return `
          <div class="pdp__section">
            <h3 class="pdp__section-heading">${s.heading}</h3>
            <div class="pdp__section-body">${cleanHtml}</div>
          </div>`
      }).join('')}
    </div>`
}

function showToast(message) {
  let toast = document.getElementById('toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    toast.className = 'toast'
    document.body.appendChild(toast)
  }
  toast.textContent = message
  toast.classList.add('toast--visible')
  setTimeout(() => {
    toast.classList.remove('toast--visible')
  }, 4000)
}

function tierHtml(p) {
  if (!p || p.type !== 'Tumbler') return ''
  return `
    <div class="pdp__tier-select" role="radiogroup" aria-label="Purchase Tier">
      <div class="pdp__tier-label"><span class="gem">✦</span> Allocation Tier</div>
      <div class="pdp__tier-grid">
        <label class="pdp__tier-option is-active" data-tier="single">
          <input type="radio" name="pdp-tier" value="single" checked class="visually-hidden">
          <div class="pdp__tier-radio"></div>
          <div class="pdp__tier-details">
            <span class="pdp__tier-name">Single Vessel</span>
            <div class="pdp__tier-price-row">
              <span class="pdp__tier-price">${formatPrice(p.price)}</span>
            </div>
          </div>
        </label>
        <label class="pdp__tier-option" data-tier="pair">
          <input type="radio" name="pdp-tier" value="pair" class="visually-hidden">
          <div class="pdp__tier-radio"></div>
          <div class="pdp__tier-details">
            <div class="pdp__tier-header">
              <span class="pdp__tier-name">The Pair Option</span>
              <span class="pdp__tier-badge">Save $9.95</span>
            </div>
            <div class="pdp__tier-price-row">
              <span class="pdp__tier-price">$89.95</span>
              <span class="pdp__tier-sub">(2× Vessels · Free Transit)</span>
            </div>
          </div>
        </label>
      </div>
    </div>`
}

function render(p) {
  const prices = [...new Set(p.variants.map((v) => v.price))]
  const hasRange = prices.length > 1
  const priceText = hasRange ? `from ${formatPrice(Math.min(...prices))}` : formatPrice(p.price)
  const was = !hasRange && p.compareAt ? `<span class="price__was">${formatPrice(p.compareAt)}</span>` : ''
  document.title = `${p.title} | Goldbourne & Co.`
  const isTumbler = p.type === 'Tumbler'
  const anchor = CATEGORY_ANCHORS[p.type] ?? 'tumblers'

  const breadcrumbHtml = `
    <nav class="pdp__breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Editions</a>
      <span>✦</span>
      <a href="index.html#${anchor}">${p.type}</a>
      <span>✦</span>
      <span>${p.title}</span>
    </nav>`

  const pdpContainer = document.getElementById('pdp')
  if (!pdpContainer) return

  pdpContainer.innerHTML = `
    <div class="pdp__gallery">${galleryHtml(p)}</div>
    <div class="pdp__info">
      ${breadcrumbHtml}
      <p class="pdp__meta">${p.leagueLabel} · ${p.season}</p>
      <h1 class="pdp__title">${p.title}</h1>
      <p class="pdp__price" id="pdpPrice">${priceText}${was}</p>
      <p class="pdp__desc">${p.hook}</p>
      ${variantsHtml(p)}
      ${tierHtml(p)}
      <div class="pdp__actions">
        <button class="btn js-buy-btn" id="pdpBuyBtn" type="button">Add to bag — ${formatPrice(p.price)}</button>
      </div>
      ${sectionsHtml(p)}
    </div>`

  // 1. Gallery Thumbnail Interaction
  const thumbBtns = document.querySelectorAll('.pdp__thumb-btn')
  const mainImg = document.getElementById('pdpMainImg')
  thumbBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      thumbBtns.forEach((b) => b.classList.remove('is-active'))
      btn.classList.add('is-active')
      const newSrc = btn.getAttribute('data-src')
      const newAlt = btn.getAttribute('data-alt')
      if (mainImg && newSrc) {
        mainImg.style.opacity = '0.3'
        setTimeout(() => {
          mainImg.src = newSrc
          if (newAlt) mainImg.alt = newAlt
          mainImg.style.opacity = '1'
        }, 120)
      }
    })
  })

  // 2. Variant Selector Interaction
  let selectedVariantPrice = p.price
  let currentTier = 'single'
  const priceEl = document.getElementById('pdpPrice')
  const buyBtn = document.getElementById('pdpBuyBtn')
  const selectedVariantVal = document.getElementById('selectedVariantVal')
  const variantChips = document.querySelectorAll('.pdp__variant-chip')

  variantChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      variantChips.forEach((c) => {
        c.classList.remove('is-active')
        c.setAttribute('aria-pressed', 'false')
      })
      chip.classList.add('is-active')
      chip.setAttribute('aria-pressed', 'true')
      const vIndex = Number(chip.getAttribute('data-index'))
      const vObj = p.variants[vIndex]
      if (selectedVariantVal && vObj) {
        selectedVariantVal.textContent = vObj.value
      }
      if (vObj && vObj.price != null) {
        selectedVariantPrice = vObj.price
        if (priceEl && currentTier !== 'pair') {
          const comp = vObj.compareAt ? `<span class="price__was">${formatPrice(vObj.compareAt)}</span>` : ''
          priceEl.innerHTML = `${formatPrice(selectedVariantPrice)}${comp}`
        }
        if (buyBtn && currentTier !== 'pair') {
          buyBtn.textContent = `Add to bag — ${formatPrice(selectedVariantPrice)}`
        }
      }
    })
  })

  // 3. Tumbler Tier Selector Interaction
  if (isTumbler) {
    const tierOptions = document.querySelectorAll('.pdp__tier-option')
    const tierRadios = document.querySelectorAll('input[name="pdp-tier"]')

    function setTier(tier) {
      currentTier = tier
      tierOptions.forEach((o) => {
        const isActive = o.getAttribute('data-tier') === currentTier
        o.classList.toggle('is-active', isActive)
        const radio = o.querySelector('input[type="radio"]')
        if (radio) radio.checked = isActive
      })

      if (currentTier === 'pair') {
        if (priceEl) priceEl.innerHTML = `$89.95 <span class="price__was">$99.90</span>`
        if (buyBtn) buyBtn.textContent = 'Add The Pair to bag — $89.95 ✦'
      } else {
        if (priceEl) priceEl.innerHTML = `${priceText}${was}`
        if (buyBtn) buyBtn.textContent = `Add to bag — ${formatPrice(p.price)}`
      }
    }

    tierOptions.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        const tier = opt.getAttribute('data-tier')
        if (tier) setTier(tier)
      })
    })

    tierRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) setTier(radio.value)
      })
    })
  }

  // 4. Buy Button Toast Trigger
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (currentTier === 'pair') {
        showToast('The Pair Option added to bag — 2 Editions ($89.95) with complimentary transit.')
      } else {
        const activeChip = document.querySelector('.pdp__variant-chip.is-active')
        const variantTxt = activeChip && activeChip.textContent ? ` (${activeChip.textContent.trim()})` : ''
        showToast(`${p.title}${variantTxt} added to bag.`)
      }
    })
  }
}

async function main() {
  startAnnouncement()
  let products
  try {
    let res = await fetch('../../products/products.json')
    if (!res.ok) {
      res = await fetch('/products/products.json')
    }
    const data = await res.json()
    products = data.products
  } catch (err) {
    try {
      const res = await fetch('/products/products.json')
      const data = await res.json()
      products = data.products
    } catch (fallbackErr) {
      const pdp = document.getElementById('pdp')
      if (pdp) {
        pdp.innerHTML =
          '<p class="muted">Could not load product data. This theme must be served over HTTP, not opened as a file:// URL. Run <code>python3 -m http.server 8000</code>, then open <code>http://localhost:8000/themes/dark-maximalism/</code>.</p>'
      }
      return
    }
  }

  if (!products || !Array.isArray(products)) {
    const pdp = document.getElementById('pdp')
    if (pdp) {
      pdp.innerHTML = '<p class="muted">Product catalog could not be loaded.</p>'
    }
    return
  }

  const sku = new URLSearchParams(location.search).get('sku') ?? DEFAULT_SKU
  const product = products.find((p) => p.sku === sku) ?? products.find((p) => p.sku === DEFAULT_SKU)
  if (!product) {
    const pdp = document.getElementById('pdp')
    if (pdp) {
      pdp.innerHTML = '<p class="muted">This Edition could not be found.</p>'
    }
    return
  }
  render(product)
}

main()
