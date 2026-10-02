/* main.js — wiring DOM cho trang chủ. Logic nằm ở catalog.mjs, render.mjs, carousel.mjs. */
import { TYPE_ORDER, sectionId, hashSectionTarget } from './catalog.mjs'
import { gridHtml, imageAlt, navHtml } from './render.mjs'
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
function renderNav(listEl) {
  if (!listEl) return
  listEl.innerHTML = navHtml((t) => `#${sectionId(t)}`)
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
      /*
        try/catch ngoài hàm này chỉ bọc phần đồng bộ (tạo observer + vòng lặp
        gắn class) — lúc trình duyệt gọi lại callback này thì hàm observeReveal
        đã return từ lâu, lỗi ném ở đây KHÔNG rơi vào catch ngoài. Nếu không
        bọc riêng, một lỗi giữa vòng for sẽ để các phần tử chưa xử lý kẹt ở
        opacity: 0 vĩnh viễn — vi phạm thẳng luật "không có đường nào dẫn tới
        nội dung ẩn vĩnh viễn" (base.css).
      */
      try {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
        }
      } catch (err) {
        /* Thà mất hiệu ứng còn hơn mất nội dung (spec §6.2 luật 1). */
        root.querySelectorAll('.js-reveal').forEach((el) => el.classList.remove('js-reveal'))
        io.disconnect()
        console.error('reveal callback hỏng, hiện thẳng nội dung', err)
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
    grid.innerHTML = gridHtml(products, type)
  }
  observeReveal(document.body)
}

/*
  Deep link (vd. tới từ product.html) chạm hash NGAY khi trang còn rỗng — tài
  liệu lúc đó chỉ cao chừng 1 màn hình, trình duyệt cuộn fragment tới một chỗ
  rồi renderSections() render xong 12 thẻ, chiều cao tài liệu nhảy, vị trí cũ
  giờ trật khỏi dải đích. Đo thật: lệch tới 1804px, dải đích nằm ngoài màn
  hình hoàn toàn (xem báo cáo nghiệm thu).

  Cuộn lại SAU khi renderSections() đã bơm xong DOM sửa đúng gốc — không phải
  vá bằng offset tay. scroll-padding-top trong base.css tự lo khoảng chừa
  cho header sticky, nên không tính lại 72px ở đây.

  behavior: 'instant' ép cuộn tức thì bất kể html { scroll-behavior: smooth }
  — mượt chỉ đúng cảm giác cho neo bấm TRONG trang, còn đây là tải trang.
*/
function scrollToHashSection() {
  const validIds = TYPE_ORDER.map(sectionId)
  const target = hashSectionTarget(location.hash, validIds)
  if (!target) return
  const el = document.getElementById(target)
  if (!el) return
  el.scrollIntoView({ behavior: 'instant', block: 'start' })
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
  renderNav(document.getElementById('typeNav'))
  renderNav(document.getElementById('footerNav'))
  renderHero(products)
  renderSections(products)
  scrollToHashSection()
}

init()
