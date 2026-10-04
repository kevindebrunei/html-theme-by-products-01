/*
  cart.mjs — Quản lý trạng thái giỏ hàng và cart drawer cho Goldbourne & Co.
  Lưu trữ localStorage, hỗ trợ thêm/xóa/đổi số lượng, hiển thị drawer,
  gợi ý sản phẩm tuyển chọn (recommendations), và tiến trình checkout.
*/
import { formatPrice, CURATED, TYPE_LABEL } from './catalog.mjs'
import { escapeHtml } from './render.mjs'

export const STORAGE_KEY = 'goldbourne_cart_v1'

/* Lấy danh sách item từ storage */
export function getCartItems() {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/* Lưu danh sách item */
export function saveCartItems(items) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  } catch { /* QuotaExceeded hoặc private mode */ }
  return items
}

/* Thêm vào giỏ hàng */
export function addToCart(cart, item) {
  const next = [...cart]
  const variantVal = item.variantValue ?? null
  const idx = next.findIndex(
    (x) => x.sku === item.sku && (x.variantValue ?? null) === variantVal
  )
  const addQty = Math.max(1, Number(item.quantity) || 1)
  if (idx >= 0) {
    next[idx] = { ...next[idx], quantity: next[idx].quantity + addQty }
  } else {
    next.push({
      sku: item.sku,
      title: item.title,
      type: item.type ?? 'Edition',
      price: Number(item.price) || 0,
      image: item.image ?? (item.images ? item.images[0] : ''),
      variantValue: variantVal,
      variantLabel: item.variantLabel ?? null,
      quantity: addQty,
    })
  }
  return next
}

/* Cập nhật số lượng */
export function updateItemQuantity(cart, sku, variantValue, qty) {
  const targetQty = Number(qty)
  if (targetQty <= 0) {
    return removeItem(cart, sku, variantValue)
  }
  return cart.map((x) => {
    if (x.sku === sku && (x.variantValue ?? null) === (variantValue ?? null)) {
      return { ...x, quantity: targetQty }
    }
    return x
  })
}

/* Xoá sản phẩm */
export function removeItem(cart, sku, variantValue) {
  return cart.filter(
    (x) => !(x.sku === sku && (x.variantValue ?? null) === (variantValue ?? null))
  )
}

/* Tính tổng số lượng món đồ */
export function calculateCount(cart) {
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
}

/* Tính tổng tiền subtotal */
export function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
}

/* Tìm sản phẩm gợi ý: lấy sản phẩm trong CURATED chưa có trong giỏ hàng */
export function getRecommendedProducts(products, cart, limit = 3) {
  if (!products || products.length === 0) return []
  const cartSkus = new Set(cart.map((x) => x.sku))
  const bySku = new Map(products.map((p) => [p.sku, p]))

  // Ưu tiên các SKU trong danh sách CURATED chưa nằm trong cart
  const curatedRecs = CURATED
    .filter((sku) => !cartSkus.has(sku))
    .map((sku) => bySku.get(sku))
    .filter(Boolean)

  if (curatedRecs.length >= limit) {
    return curatedRecs.slice(0, limit)
  }

  // Nếu còn thiếu, bổ sung các sản phẩm khác chưa có trong cart
  const otherRecs = products.filter((p) => !cartSkus.has(p.sku) && !curatedRecs.includes(p))
  return [...curatedRecs, ...otherRecs].slice(0, limit)
}

/* Render HTML cho 1 item trong giỏ */
export function cartItemHtml(item) {
  const lineTotal = formatPrice(Number(item.price) * Number(item.quantity))
  const unitPrice = formatPrice(item.price)
  const variantText = item.variantValue ? `${escapeHtml(item.variantLabel || 'Option')}: ${escapeHtml(item.variantValue)}` : ''
  const skuAttr = escapeHtml(item.sku)
  const variantAttr = item.variantValue ? `data-variant="${escapeHtml(item.variantValue)}"` : ''

  return `
    <article class="cart-item" data-sku="${skuAttr}" ${variantAttr}>
      <div class="cart-item__media">
        <img class="cart-item__img" src="${item.image || '/themes/light-minimal/assets/hero-tumbler.jpg'}" alt="${escapeHtml(item.title)}" width="72" height="72" loading="lazy">
      </div>
      <div class="cart-item__details">
        <div class="cart-item__title-wrap">
          <a class="cart-item__title" href="/themes/light-minimal/product.html?sku=${encodeURIComponent(item.sku)}">${escapeHtml(item.title)}</a>
          <button class="cart-item__remove" type="button" data-action="remove" data-sku="${skuAttr}" ${variantAttr} aria-label="Remove ${escapeHtml(item.title)} from selection">Remove</button>
        </div>
        ${variantText ? `<p class="cart-item__variant">${variantText}</p>` : ''}
        <div class="cart-item__actions">
          <div class="cart-stepper" role="group" aria-label="Quantity for ${escapeHtml(item.title)}">
            <button class="cart-stepper__btn" type="button" data-action="decrease" data-sku="${skuAttr}" ${variantAttr} aria-label="Decrease quantity">&minus;</button>
            <span class="cart-stepper__qty" aria-live="polite">${item.quantity}</span>
            <button class="cart-stepper__btn" type="button" data-action="increase" data-sku="${skuAttr}" ${variantAttr} aria-label="Increase quantity">&plus;</button>
          </div>
          <div class="cart-item__pricing">
            <span class="cart-item__price">${lineTotal}</span>
            ${item.quantity > 1 ? `<span class="cart-item__unit muted">(${unitPrice} each)</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `
}

/* Render HTML cho danh sách gợi ý sản phẩm ("Gợi ý sản phẩm") */
export function recommendationsHtml(recommendations) {
  if (!recommendations || recommendations.length === 0) return ''
  return recommendations.map((rec) => {
    const priceText = formatPrice(rec.price ?? (rec.variants?.[0]?.price ?? 0))
    const typeLabel = TYPE_LABEL[rec.type] ?? rec.type
    const imgUrl = rec.images?.[0] || '/themes/light-minimal/assets/hero-tumbler.jpg'
    return `
      <div class="cart-rec-card">
        <img class="cart-rec-card__img" src="${imgUrl}" alt="${escapeHtml(rec.title)}" width="52" height="52" loading="lazy">
        <div class="cart-rec-card__info">
          <a class="cart-rec-card__title" href="/themes/light-minimal/product.html?sku=${encodeURIComponent(rec.sku)}" title="${escapeHtml(rec.title)}">${escapeHtml(rec.title)}</a>
          <span class="cart-rec-card__meta">${escapeHtml(typeLabel)} &middot; <strong class="cart-rec-card__price">${priceText}</strong></span>
        </div>
        <button class="cart-rec-card__add" type="button" data-action="add-rec" data-sku="${escapeHtml(rec.sku)}" aria-label="Add ${escapeHtml(rec.title)} to selection">
          &plus; Add
        </button>
      </div>
    `
  }).join('')
}

/* Render toàn bộ nội dung drawer (Items + Recs + Subtotal) */
export function renderDrawerContent(drawerEl, cart, products) {
  if (!drawerEl) return

  const itemsContainer = drawerEl.querySelector('#cartItemsList')
  const recsContainer = drawerEl.querySelector('#cartRecsList')
  const subtotalEl = drawerEl.querySelector('#cartSubtotal')
  const countPillEl = drawerEl.querySelector('#cartDrawerCount')
  const checkoutBtn = drawerEl.querySelector('#cartCheckout')

  const totalCount = calculateCount(cart)
  const subtotal = calculateSubtotal(cart)

  if (countPillEl) {
    countPillEl.textContent = `(${totalCount} ${totalCount === 1 ? 'item' : 'items'})`
  }
  if (subtotalEl) {
    subtotalEl.textContent = formatPrice(subtotal)
  }
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0
  }

  if (itemsContainer) {
    if (cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          <svg class="cart-empty__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h3 class="cart-empty__title">Your Selection is Empty</h3>
          <p class="cart-empty__text">No Editions currently selected. Explore our curated collections or select from the additions below.</p>
          <button class="btn cart-empty__btn" type="button" data-action="close-drawer">Discover Editions</button>
        </div>
      `
    } else {
      itemsContainer.innerHTML = cart.map(cartItemHtml).join('')
    }
  }

  if (recsContainer) {
    const recs = getRecommendedProducts(products, cart, 3)
    recsContainer.innerHTML = recommendationsHtml(recs)
  }
}

/* Cập nhật badge số lượng trên header */
export function updateHeaderCount(count) {
  const badge = document.getElementById('cartCount')
  const toggle = document.getElementById('cartToggle')
  if (badge) {
    badge.textContent = String(count)
    badge.classList.add('is-updated')
    setTimeout(() => badge.classList.remove('is-updated'), 300)
  }
  if (toggle) {
    toggle.setAttribute('aria-label', `Open cart (${count} ${count === 1 ? 'item' : 'items'})`)
  }
}

/* Quản lý UI drawer trong trang */
export function mountCartUI({ products = [] } = {}) {
  let cart = getCartItems()

  const drawer = document.getElementById('cartDrawer')
  const backdrop = document.getElementById('cartBackdrop')
  const toggle = document.getElementById('cartToggle')
  const closeBtn = document.getElementById('cartClose')
  const continueBtn = document.getElementById('cartContinue')
  const checkoutBtn = document.getElementById('cartCheckout')
  const checkoutModal = document.getElementById('cartCheckoutModal')

  function refresh() {
    updateHeaderCount(calculateCount(cart))
    if (drawer) {
      renderDrawerContent(drawer, cart, products)
    }
  }

  function open() {
    if (!drawer || !backdrop) return
    drawer.classList.add('is-open')
    backdrop.classList.add('is-open')
    drawer.setAttribute('aria-hidden', 'false')
    if (toggle) toggle.setAttribute('aria-expanded', 'true')
    document.body.classList.add('drawer-open')
    refresh()
    closeBtn?.focus()
  }

  function close() {
    if (!drawer || !backdrop) return
    drawer.classList.remove('is-open')
    backdrop.classList.remove('is-open')
    drawer.setAttribute('aria-hidden', 'true')
    if (toggle) toggle.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('drawer-open')
    toggle?.focus()
  }

  // Toggles
  toggle?.addEventListener('click', () => {
    if (drawer?.classList.contains('is-open')) close()
    else open()
  })

  closeBtn?.addEventListener('click', close)
  backdrop?.addEventListener('click', close)
  continueBtn?.addEventListener('click', close)

  // Bàn phím ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (checkoutModal?.classList.contains('is-open')) {
        checkoutModal.classList.remove('is-open')
      } else if (drawer?.classList.contains('is-open')) {
        close()
      }
    }
  })

  // Event delegation trong drawer (stepper, remove, add recommendation)
  drawer?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]')
    if (!target) return
    const action = target.dataset.action
    const sku = target.dataset.sku
    const variantValue = target.dataset.variant || null

    if (action === 'close-drawer') {
      close()
      return
    }

    if (action === 'remove' && sku) {
      cart = removeItem(cart, sku, variantValue)
      saveCartItems(cart)
      refresh()
      return
    }

    if (action === 'increase' && sku) {
      const item = cart.find((x) => x.sku === sku && (x.variantValue ?? null) === variantValue)
      if (item) {
        cart = updateItemQuantity(cart, sku, variantValue, item.quantity + 1)
        saveCartItems(cart)
        refresh()
      }
      return
    }

    if (action === 'decrease' && sku) {
      const item = cart.find((x) => x.sku === sku && (x.variantValue ?? null) === variantValue)
      if (item) {
        cart = updateItemQuantity(cart, sku, variantValue, item.quantity - 1)
        saveCartItems(cart)
        refresh()
      }
      return
    }

    if (action === 'add-rec' && sku) {
      const prod = products.find((p) => p.sku === sku)
      if (prod) {
        cart = addToCart(cart, {
          sku: prod.sku,
          title: prod.title,
          type: prod.type,
          price: prod.variants?.[0]?.price ?? prod.price,
          image: prod.images?.[0],
          variantValue: prod.variants?.[0]?.value ?? null,
          variantLabel: prod.variantLabel ?? null,
          quantity: 1,
        })
        saveCartItems(cart)
        refresh()
        // Hiệu ứng phản hồi nút
        const originalText = target.innerHTML
        target.textContent = '\u2713 Added'
        setTimeout(() => { target.innerHTML = originalText }, 1000)
      }
    }
  })

  // Checkout flow
  checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return
    if (checkoutModal) {
      const subtotal = calculateSubtotal(cart)
      const count = calculateCount(cart)
      const refNum = Math.floor(1000 + Math.random() * 9000)
      const refEl = checkoutModal.querySelector('#checkoutRef')
      const summaryEl = checkoutModal.querySelector('#checkoutSummary')
      if (refEl) refEl.textContent = `ALLOC-GB26-${refNum}`
      if (summaryEl) {
        summaryEl.textContent = `${count} ${count === 1 ? 'Edition' : 'Editions'} &middot; Total ${formatPrice(subtotal)}`
      }
      checkoutModal.classList.add('is-open')
    }
  })

  // Checkout modal controls
  checkoutModal?.addEventListener('click', (e) => {
    const finishBtn = e.target.closest('#checkoutFinish')
    const dismissBtn = e.target.closest('#checkoutDismiss')
    if (finishBtn) {
      cart = []
      saveCartItems(cart)
      refresh()
      checkoutModal.classList.remove('is-open')
      close()
    } else if (dismissBtn || e.target === checkoutModal) {
      checkoutModal.classList.remove('is-open')
    }
  })

  // Khởi động
  refresh()

  return {
    open,
    close,
    addItem: (item) => {
      cart = addToCart(cart, item)
      saveCartItems(cart)
      refresh()
      open()
    },
    getCart: () => cart,
    refresh,
  }
}
