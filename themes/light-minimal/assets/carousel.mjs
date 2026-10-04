/*
  carousel.mjs — máy trạng thái thuần + hàm mount DOM.
  Phần thuần test được bằng node:test không cần jsdom, theo đúng pattern
  catalog.mjs / render.mjs của theme.
*/

/*
  Ba SKU Halloween-General có ảnh 01 sạch watermark AURA TUMBLER và sạch logo
  đội, soi bằng mắt ngày 02/10/2026 (spec §4.1). XI-003/004/005 dính.
  Thứ tự là chuỗi màu tím → navy → đỏ ruby, không phải ngẫu nhiên.
*/
export const HERO_SKUS = [
  'TUM-20260923-XI-001',
  'TUM-20260923-XI-002',
  'TUM-20260923-XI-006',
]

export const AUTOPLAY_MS = 6000

export function nextIndex(i, n) { return n <= 0 ? 0 : (i + 1) % n }
export function prevIndex(i, n) { return n <= 0 ? 0 : (i - 1 + n) % n }
export function slideLabel(i, n) { return `Slide ${i + 1} of ${n}` }

/*
  `reduce` (prefers-reduced-motion) chỉ chi phối HÀNH VI LÚC MOUNT — không tự
  autoplay. Nó không phải lệnh cấm người dùng: bấm Play là yêu cầu tường minh
  và phải được tôn trọng, nên `source: 'user'` luôn thắng `reduce`.
  Bug đã sửa: trước đây play() tự nó check `if (reduce || timer) return`,
  nên khi reduce=true nút Play bấm vào không làm gì — nhận focus, bấm được,
  vô tác dụng vĩnh viễn. Tách quyết định ra hàm thuần này để bắt được bằng
  test không cần jsdom.
*/
export function shouldPlay(reduce, source) {
  return source === 'user' || !reduce
}

/*
  Autoplay 6s là nội dung tự cập nhật quá 5 giây → WCAG 2.2.2 Pause, Stop, Hide.
  Dừng-khi-rê-chuột KHÔNG thoả: người dùng bàn phím và screen reader không rê chuột.
  Nút tạm dừng hiện rõ là bắt buộc, không phải tuỳ chọn (spec §4.3).
*/
export function mountCarousel(root, slides = []) {
  if (!root) return

  const track = root.querySelector('[data-carousel-track]')
  const live = root.querySelector('[data-carousel-live]')
  const dotsEl = root.querySelector('[data-carousel-dots]')
  const pauseBtn = root.querySelector('[data-carousel-pause]')
  if (!track) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (pauseBtn) pauseBtn.removeAttribute('aria-pressed')

  let slideEls = [...track.querySelectorAll('.hero__slide')]
  if (slideEls.length === 0 && slides.length > 0) {
    track.innerHTML = slides.map((s, i) => `
      <article class="hero__slide${i === 0 ? ' is-current' : ''}" data-slide-index="${i}">
        <div class="hero__bg">
          <img class="hero__bg-img"
               src="${s.src ?? s.bg}" alt="${s.alt ?? ''}"
               width="1920" height="1080"
               loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
          <div class="hero__scrim" aria-hidden="true"></div>
        </div>
        <div class="wrap hero__content">
          ${s.title ? (i === 0 ? `<h1 class="hero__title" data-cut-reveal>${s.title}</h1>` : `<h2 class="hero__title">${s.title}</h2>`) : ''}
          ${s.cta && s.targetId ? `<a class="btn hero__cta" href="#${s.targetId}">${s.cta}</a>` : ''}
        </div>
      </article>`).join('')
    slideEls = [...track.querySelectorAll('.hero__slide')]
  }

  const total = slideEls.length
  if (total === 0) return

  let dots = []
  if (dotsEl) {
    dotsEl.innerHTML = slideEls.map((_, i) => `
      <button type="button" class="hero__dot" data-go="${i}"
              aria-current="${i === 0 ? 'true' : 'false'}">
        <span class="visually-hidden">${slideLabel(i, total)}</span>
      </button>`).join('')
    dots = [...dotsEl.querySelectorAll('button')]
  }

  let index = 0
  let timer = null

  function show(i, announce) {
    slideEls[index].classList.remove('is-current')
    if (dots[index]) dots[index].setAttribute('aria-current', 'false')
    index = i
    slideEls[index].classList.add('is-current')
    if (dots[index]) dots[index].setAttribute('aria-current', 'true')
    /*
      Chỉ thông báo khi người dùng tự bấm. Autoplay mà announce thì screen
      reader bị spam mỗi 6 giây (spec §4.3).
    */
    if (live) live.textContent = announce ? slideLabel(index, total) : ''
  }

  /*
    `source` cho biết lời gọi đến từ đâu: 'mount' (tự động lúc khởi tạo) hay
    'user' (bấm nút). Chỉ 'mount' bị `reduce` chặn — xem shouldPlay().
  */
  function play(source) {
    if (timer || !shouldPlay(reduce, source)) return
    timer = setInterval(() => show(nextIndex(index, total), false), AUTOPLAY_MS)
    if (pauseBtn) pauseBtn.textContent = 'Pause'
  }

  function pause() {
    clearInterval(timer)
    timer = null
    if (pauseBtn) pauseBtn.textContent = 'Play'
  }

  pauseBtn?.addEventListener('click', () => (timer ? pause() : play('user')))

  root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => {
    pause()
    show(prevIndex(index, total), true)
  })
  root.querySelector('[data-carousel-next]')?.addEventListener('click', () => {
    pause()
    show(nextIndex(index, total), true)
  })
  dotsEl?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]')
    if (!b) return
    pause()
    show(Number(b.dataset.go), true)
  })

  // Keyboard navigation within the carousel
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      pause()
      show(prevIndex(index, total), true)
    } else if (e.key === 'ArrowRight') {
      pause()
      show(nextIndex(index, total), true)
    }
  })

  // Smooth scroll handler on CTA click
  root.querySelectorAll('.hero__cta').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetHash = btn.getAttribute('href')
      if (targetHash && targetHash.startsWith('#')) {
        const targetEl = document.querySelector(targetHash)
        if (targetEl) {
          e.preventDefault()
          pause()
          history.pushState(null, '', targetHash)
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    })
  })

  if (shouldPlay(reduce, 'mount')) { play('mount') } else { pause() }
}
