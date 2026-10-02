/* main.js — wiring DOM cho trang chủ. Logic nằm ở catalog.mjs và render.mjs. */
import { TYPE_ORDER, TYPE_LABEL, byType, facetCounts, shouldRenderFacets, deriveStyleFamily, displayFamily } from './catalog.mjs'
import { cardHtml, facetBarHtml } from './render.mjs'

const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

export function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

async function loadProducts() {
  for (const url of ['../../products/products.json', '/products/products.json']) {
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

function renderNav(products, listEl) {
  if (!listEl) return
  listEl.innerHTML = TYPE_ORDER.map((t) => {
    const n = byType(products, t).length
    return `<li><a href="#catalog" data-type="${t}">${TYPE_LABEL[t]} <span class="muted">${n}</span></a></li>`
  }).join('')
}

/* Chỉ bật reveal khi người dùng không yêu cầu giảm chuyển động (spec §5.5). */
function observeReveal(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }
  }, { rootMargin: '0px 0px -10% 0px' })
  root.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el))
}

const state = { products: [], type: null, family: null }

function visible() {
  let list = state.type ? byType(state.products, state.type) : state.products
  if (state.family) list = list.filter((p) => displayFamily(deriveStyleFamily(p)) === state.family)
  return list
}

function render() {
  const scope = state.type ? byType(state.products, state.type) : state.products
  const facetsEl = document.getElementById('facets')
  const gridEl = document.getElementById('grid')
  const emptyEl = document.getElementById('gridEmpty')
  const headingEl = document.getElementById('catalogHeading')

  headingEl.textContent = state.type ? TYPE_LABEL[state.type] : 'All Editions'

  /* Caps / Backpacks / Shoes chỉ một họ → không render facet (spec §6). */
  if (shouldRenderFacets(scope)) {
    facetsEl.hidden = false
    facetsEl.innerHTML = facetBarHtml(facetCounts(scope), state.family)
  } else {
    facetsEl.hidden = true
    facetsEl.innerHTML = ''
  }

  const list = visible()
  gridEl.innerHTML = list.map(cardHtml).join('')
  emptyEl.hidden = list.length > 0
  observeReveal(gridEl)
}

/*
  Header và footer render cùng một markup (cùng data-type, cùng số đếm) nên
  phải xử lý click giống hệt nhau — control trông giống nhau thì không được
  cái bấm được cái không (fix round 1, finding Important).
*/
function onTypeNavClick(e) {
  const a = e.target.closest('a[data-type]')
  if (!a) return
  state.type = state.type === a.dataset.type ? null : a.dataset.type
  state.family = null
  render()
}

function wire() {
  document.getElementById('typeNav')?.addEventListener('click', onTypeNavClick)
  document.getElementById('footerNav')?.addEventListener('click', onTypeNavClick)

  document.getElementById('facets')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-family]')
    if (!b) return
    state.family = b.dataset.family || null
    render()
  })
}

/*
  Hero dùng ảnh Halloween-General — nhóm 6 SKU duy nhất không mang logo đội
  trong ảnh (spec §5.6, §8.2).
*/
function renderHero(products) {
  const img = document.getElementById('heroImg')
  if (!img) return
  const clean = products.find((p) => p.sku === 'TUM-20260923-XI-001')
  if (!clean?.images?.[0]) { img.closest('.hero__mat')?.setAttribute('hidden', '') ; return }
  img.src = clean.images[0]
  img.alt = 'Gilded Edition — gold relief on a dark ground'
}

async function init() {
  startAnnouncement()
  state.products = await loadProducts()
  renderNav(state.products, document.getElementById('typeNav'))
  renderNav(state.products, document.getElementById('footerNav'))
  renderHero(state.products)
  wire()
  render()
}

init()
