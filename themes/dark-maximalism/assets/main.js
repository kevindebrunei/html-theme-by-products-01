/* main.js — Goldbourne & Co. */

const TYPE_ORDER = ['Tumbler', 'Cap', 'Backpack', 'Shoes']
const TYPE_LABEL = { Tumbler: 'Tumblers', Cap: 'Caps', Backpack: 'Backpacks', Shoes: 'Shoes' }

const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair Option — buy any two 40 oz tumblers for $89.95 (save $9.95).', until: null },
]

const CURATED_TUMBLER_SKUS = [
  'TUM-20260923-XI-001', // Lunar Ornament
  'TUM-20260923-XI-004', // Beauty In The End
  'TUM-20260923-XI-002', // Grace in Shadows
  'TUM-20260923-XI-003', // Beauty Spins In Darkness
  'TUM-20260923-XI-005', // Coiled Ornament
  'TUM-20260923-XI-006', // Blood, Beauty, Forever
  'TUM-20260923-XI-018', // LAD Christmas
  'TUM-20260923-XI-021', // NYM Christmas
  'TUM-20260923-XI-022', // PHI Christmas
  'TUM-20260923-XI-023', // SD Midnight Gild
  'TUM-20260923-XI-007', // CHI Dark Elegance
  'TUM-20260923-XI-019', // ATL Midnight Christmas
]

function formatPrice(n) {
  return n == null ? '' : '$' + n.toFixed(2)
}

function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
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

function cardHtml(p) {
  if (!p) return ''
  const img = (p.images && p.images[0]) ? p.images[0] : ''
  const variants = p.variants || []
  const prices = [...new Set(variants.map((v) => v.price))]
  const hasRange = prices.length > 1
  const priceText = hasRange ? `from ${formatPrice(Math.min(...prices))}` : formatPrice(p.price)
  const was = !hasRange && p.compareAt ? `<span class="price__was">${formatPrice(p.compareAt)}</span>` : ''
  const typeLabel = TYPE_LABEL[p.type] ?? p.type ?? ''
  const leagueLabel = p.leagueLabel ?? ''
  const title = p.title ?? 'Gilded Edition'
  const sku = p.sku ?? ''

  return `
    <a class="card" href="product.html?sku=${encodeURIComponent(sku)}">
      <img class="card__media" src="${img}" alt="${title} - front" loading="lazy" width="600" height="600">
      <div class="card__scrim"></div>
      <div class="card__body">
        <span class="card__meta">${typeLabel}${leagueLabel ? ' · ' + leagueLabel : ''}</span>
        <h3 class="card__title">${title}</h3>
        <span class="price">${priceText}${was}</span>
      </div>
    </a>`
}

/* ---- Announcement Bar ---- */
function startAnnouncement() {
  const el = document.getElementById('announce')
  if (!el) return
  const msgs = activeMessages()
  if (msgs.length === 0) { el.hidden = true; return }
  let i = 0
  el.textContent = msgs[0].text
  if (msgs.length > 1) {
    setInterval(() => {
      i = (i + 1) % msgs.length
      el.textContent = msgs[i].text
    }, 5000)
  }
}

/* ---- Sticky Header on Scroll ---- */
function initStickyHeader() {
  const headerWrapper = document.getElementById('siteHeaderWrapper')
  if (!headerWrapper) return

  let ticking = false
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.scrollY > 30
        headerWrapper.classList.toggle('is-scrolled', scrolled)
        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

/* ---- Hero Carousel ---- */
function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel')
  if (!carousel) return

  const slides = carousel.querySelectorAll('.hero-carousel__slide')
  const dots = carousel.querySelectorAll('.hero-carousel__dot')
  const total = slides.length
  if (total === 0) return

  let current = 0
  let timer = null
  const INTERVAL = 6000

  function goTo(index) {
    current = (index + total) % total
    slides.forEach((s, idx) => {
      s.classList.toggle('is-active', idx === current)
    })
    dots.forEach((dot, idx) => {
      const isActive = idx === current
      dot.classList.toggle('is-active', isActive)
      dot.setAttribute('aria-selected', String(isActive))
    })
    resetTimer()
  }

  function next() { goTo(current + 1) }
  function prev() { goTo(current - 1) }

  function resetTimer() {
    if (timer) clearInterval(timer)
    timer = setInterval(next, INTERVAL)
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => goTo(idx))
  })

  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    if (timer) clearInterval(timer)
  })
  carousel.addEventListener('mouseleave', resetTimer)

  // Touch swipe support for mobile
  let touchStartX = 0
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX
  }, { passive: true })
  carousel.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX
    const diff = touchEndX - touchStartX
    if (Math.abs(diff) > 40) {
      if (diff < 0) next()
      else prev()
    }
  }, { passive: true })

  resetTimer()
}

/* ---- Category Product Rendering ---- */
function renderCategories(products) {
  // 1. Tumblers (12 items)
  const tumblerGrid = document.getElementById('tumblerGrid')
  if (tumblerGrid) {
    const allTumblers = products.filter((p) => p.type === 'Tumbler')
    const selected = []
    CURATED_TUMBLER_SKUS.forEach((sku) => {
      const found = allTumblers.find((p) => p.sku === sku)
      if (found) selected.push(found)
    })
    allTumblers.forEach((p) => {
      if (selected.length < 12 && !selected.includes(p)) {
        selected.push(p)
      }
    })
    tumblerGrid.innerHTML = selected.slice(0, 12).map(cardHtml).join('')
  }

  // 2. Caps (11 items)
  const capGrid = document.getElementById('capGrid')
  if (capGrid) {
    const caps = products.filter((p) => p.type === 'Cap')
    capGrid.innerHTML = caps.map(cardHtml).join('')
  }

  // 3. Backpacks (8 items)
  const backpackGrid = document.getElementById('backpackGrid')
  if (backpackGrid) {
    const backpacks = products.filter((p) => p.type === 'Backpack')
    backpackGrid.innerHTML = backpacks.map(cardHtml).join('')
  }

  // 4. Shoes (3 items)
  const shoesGrid = document.getElementById('shoesGrid')
  if (shoesGrid) {
    const shoes = products.filter((p) => p.type === 'Shoes')
    shoesGrid.innerHTML = shoes.map(cardHtml).join('')
  }
}

/* ---- Event Listeners & Interactions ---- */
function setupInteractions() {
  // The Pair buttons
  document.querySelectorAll('.js-pair-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('The Pair Option added to bag — select any 2 tumblers to enjoy $89.95 paired price.')
    })
  })

  // Newsletter forms
  document.querySelectorAll('.js-newsletter-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const input = form.querySelector('input[type="email"]')
      if (input && input.value) {
        showToast(`Inscribed: ${input.value} is now enrolled in the Collector's Ledger.`)
        input.value = ''
      }
    })
  })
}

/* ---- Collector Reviews Carousel ---- */
function initReviewsCarousel() {
  const carousel = document.getElementById('reviewsCarousel')
  if (!carousel) return

  const track = carousel.querySelector('.reviews-carousel__track')
  const cards = carousel.querySelectorAll('.review-card')
  const dots = carousel.querySelectorAll('.reviews-carousel__dot')
  const prevBtn = carousel.querySelector('.js-reviews-prev')
  const nextBtn = carousel.querySelector('.js-reviews-next')

  const total = cards.length
  if (total === 0 || !track) return

  let current = 0
  let timer = null
  const INTERVAL = 7000

  function getItemsPerView() {
    if (window.innerWidth <= 640) return 1
    if (window.innerWidth <= 1024) return 2
    return 3
  }

  function getMaxIndex() {
    const perView = getItemsPerView()
    return Math.max(0, total - perView)
  }

  function update() {
    const maxIndex = getMaxIndex()
    if (current > maxIndex) current = maxIndex
    if (current < 0) current = 0

    const targetCard = cards[current]
    if (targetCard) {
      const offsetLeft = targetCard.offsetLeft
      track.style.transform = `translateX(-${offsetLeft}px)`
    }

    dots.forEach((dot, idx) => {
      const isActive = idx === current
      dot.classList.toggle('is-active', isActive)
      dot.setAttribute('aria-selected', String(isActive))
    })

    if (prevBtn) {
      prevBtn.style.opacity = current === 0 ? '0.35' : '1'
    }
    if (nextBtn) {
      nextBtn.style.opacity = current >= maxIndex ? '0.35' : '1'
    }

    resetTimer()
  }

  function next() {
    const maxIndex = getMaxIndex()
    if (current < maxIndex) {
      current++
    } else {
      current = 0
    }
    update()
  }

  function prev() {
    const maxIndex = getMaxIndex()
    if (current > 0) {
      current--
    } else {
      current = maxIndex
    }
    update()
  }

  function resetTimer() {
    if (timer) clearInterval(timer)
    timer = setInterval(next, INTERVAL)
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault()
      prev()
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault()
      next()
    })
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      const maxIndex = getMaxIndex()
      current = Math.min(idx, maxIndex)
      update()
    })
  })

  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    if (timer) clearInterval(timer)
  })
  carousel.addEventListener('mouseleave', resetTimer)

  // Touch swipe support for mobile
  let touchStartX = 0
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX
  }, { passive: true })
  carousel.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX
    const diff = touchEndX - touchStartX
    if (Math.abs(diff) > 40) {
      if (diff < 0) next()
      else prev()
    }
  }, { passive: true })

  // Resize listener with debounce
  let resizeTimer = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(update, 100)
  }, { passive: true })

  update()
}

async function main() {
  startAnnouncement()
  initStickyHeader()
  initHeroCarousel()
  initReviewsCarousel()
  setupInteractions()

  let products = []
  try {
    let res = await fetch('../../products/products.json')
    if (!res.ok) {
      res = await fetch('/products/products.json')
    }
    const data = await res.json()
    products = data.products || []
  } catch (err) {
    try {
      const res = await fetch('/products/products.json')
      const data = await res.json()
      products = data.products || []
    } catch (fallbackErr) {
      console.error('Failed to load products.json', err, fallbackErr)
    }
  }

  if (products.length > 0) {
    renderCategories(products)
  }
}

main()
