/* main.js — wiring DOM cho trang chủ. Logic nằm ở catalog.mjs, render.mjs, carousel.mjs. */
import { TYPE_ORDER, TYPE_LABEL, curatedByType, NO_SWAP, sectionId } from './catalog.mjs'
import { cardHtml, imageAlt } from './render.mjs'
import { HERO_SKUS, mountCarousel } from './carousel.mjs'
import { mountCutReveal } from './cut-reveal.mjs'

const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

export function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

async function loadProducts() {
  for (const url of ['/products/products.json', '../../products/products.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()).products ?? []
    } catch { /* thử url kế tiếp */ }
  }
  console.error('Không nạp được products.json')
  return []
}

function startAnnouncement() {
  const el = document.getElementById('announce')
  if (!el) return
  const msgs = activeMessages()
  if (msgs.length === 0) { el.hidden = true; return }
  let i = 0
  el.textContent = msgs[0].text
  if (msgs.length > 1) {
    setInterval(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i].text }, 6000)
  }
}

/*
  Trang chủ không còn chế độ full catalog (spec §7.3), nên nav là NEO CUỘN
  chứ không phải bộ lọc. Header và footer render cùng markup nên hành xử y hệt
  — control trông giống nhau thì không được cái bấm được cái không.
*/
function renderNav(products, listEl) {
  if (!listEl) return
  listEl.innerHTML = TYPE_ORDER.map((t) => {
    const n = products.filter((p) => p.type === t).length
    return `<li><a class="hover-wght" href="#${sectionId(t)}">${TYPE_LABEL[t]} <span class="muted">${n}</span></a></li>`
  }).join('')
}

/*
  Nhánh fallback cho Firefox (animation-timeline vẫn sau cờ tính tới FF152).
  Chrome 115+ và Safari 26+ chạy nhánh @supports thuần CSS trong base.css và
  KHÔNG đi vào đây. Mặc định của .reveal là HIỆN, nên nếu cả hai nhánh cùng
  im lặng thì nội dung vẫn đọc được.
*/
function observeReveal(root) {
  if (CSS.supports('animation-timeline: view()')) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      }
    }, { rootMargin: '0px 0px -10% 0px' })

    root.querySelectorAll('.reveal').forEach((el) => {
      el.classList.add('js-reveal')
      io.observe(el)
    })
  } catch (err) {
    /* Thà mất hiệu ứng còn hơn mất nội dung (spec §6.2 luật 1). */
    root.querySelectorAll('.js-reveal').forEach((el) => el.classList.remove('js-reveal'))
    console.error('reveal fallback hỏng, hiện thẳng nội dung', err)
  }
}

function renderSections(products) {
  for (const type of TYPE_ORDER) {
    const grid = document.querySelector(`[data-grid="${type}"]`)
    if (!grid) continue
    grid.innerHTML = curatedByType(products, type)
      .map((p) => cardHtml(p, { noSwap: NO_SWAP.has(p.sku) }))
      .join('')
  }
  observeReveal(document.body)
}

function renderHero(products) {
  const root = document.getElementById('heroCarousel')
  if (!root) return
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const slides = HERO_SKUS
    .map((sku) => bySku.get(sku))
    .filter((p) => p?.images?.[0])
    .map((p) => ({ src: p.images[0], alt: imageAlt(p, 0) }))
  if (slides.length === 0) { root.hidden = true; return }
  mountCarousel(root, slides)
}

async function init() {
  startAnnouncement()
  document.querySelectorAll('[data-cut-reveal]').forEach(mountCutReveal)
  const products = await loadProducts()
  renderNav(products, document.getElementById('typeNav'))
  renderNav(products, document.getElementById('footerNav'))
  renderHero(products)
  renderSections(products)
}

init()
