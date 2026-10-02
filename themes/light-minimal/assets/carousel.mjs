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

export function nextIndex(i, n) { return (i + 1) % n }
export function prevIndex(i, n) { return (i - 1 + n) % n }
export function slideLabel(i, n) { return `Slide ${i + 1} of ${n}` }

/*
  Autoplay 6s là nội dung tự cập nhật quá 5 giây → WCAG 2.2.2 Pause, Stop, Hide.
  Dừng-khi-rê-chuột KHÔNG thoả: người dùng bàn phím và screen reader không rê chuột.
  Nút tạm dừng hiện rõ là bắt buộc, không phải tuỳ chọn (spec §4.3).
*/
export function mountCarousel(root, slides) {
  if (!root || slides.length === 0) return

  const track = root.querySelector('[data-carousel-track]')
  const live = root.querySelector('[data-carousel-live]')
  const dotsEl = root.querySelector('[data-carousel-dots]')
  const pauseBtn = root.querySelector('[data-carousel-pause]')
  if (!track || !live || !dotsEl || !pauseBtn) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  track.innerHTML = slides.map((s, i) => `
    <img class="hero__img${i === 0 ? ' is-current' : ''}"
         src="${s.src}" alt="${s.alt}"
         width="1264" height="1264"
         loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">`).join('')

  dotsEl.innerHTML = slides.map((_, i) => `
    <button type="button" class="hero__dot" data-go="${i}"
            aria-current="${i === 0 ? 'true' : 'false'}">
      <span class="visually-hidden">${slideLabel(i, slides.length)}</span>
    </button>`).join('')

  const imgs = [...track.querySelectorAll('img')]
  const dots = [...dotsEl.querySelectorAll('button')]
  let index = 0
  let timer = null

  function show(i, announce) {
    imgs[index].classList.remove('is-current')
    dots[index].setAttribute('aria-current', 'false')
    index = i
    imgs[index].classList.add('is-current')
    dots[index].setAttribute('aria-current', 'true')
    /*
      Chỉ thông báo khi người dùng tự bấm. Autoplay mà announce thì screen
      reader bị spam mỗi 6 giây (spec §4.3).
    */
    live.textContent = announce ? slideLabel(index, slides.length) : ''
  }

  function play() {
    if (reduce || timer) return
    timer = setInterval(() => show(nextIndex(index, slides.length), false), AUTOPLAY_MS)
    pauseBtn.textContent = 'Pause'
    pauseBtn.setAttribute('aria-pressed', 'false')
  }

  function pause() {
    clearInterval(timer)
    timer = null
    pauseBtn.textContent = 'Play'
    pauseBtn.setAttribute('aria-pressed', 'true')
  }

  pauseBtn.addEventListener('click', () => (timer ? pause() : play()))

  root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => {
    pause()
    show(prevIndex(index, slides.length), true)
  })
  root.querySelector('[data-carousel-next]')?.addEventListener('click', () => {
    pause()
    show(nextIndex(index, slides.length), true)
  })
  dotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]')
    if (!b) return
    pause()
    show(Number(b.dataset.go), true)
  })

  if (reduce) { pause() } else { play() }
}
