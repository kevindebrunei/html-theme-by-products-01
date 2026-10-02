/*
  cut-reveal.mjs — Vertical Cut Reveal.
  Port ý tưởng từ Fancy Components (https://www.fancycomponents.dev/, MIT,
  danielpetho/fancy). Bản gốc là React + Motion; đây là bản viết lại bằng
  vanilla để giữ theme zero-dependency (spec §7.5).

  Tách theo TỪ, không theo DÒNG — tách dòng cần đo layout, tách từ thì không,
  và hiệu ứng nhìn như nhau.
*/
import { escapeHtml } from './render.mjs'

export function splitWords(text) {
  return text.split(/(\s+)/).filter((s) => s.length > 0)
}

export function cutMarkup(text) {
  /*
    splitWords giữ lại các phần tử khoảng trắng xen giữa từ (để chữ không
    dính nhau), nên vị trí trong mảng KHÔNG trùng với thứ tự từ. Nếu lấy
    thẳng vị trí mảng làm --i, mỗi từ nhảy 2 đơn vị thay vì 1 và độ trễ so le
    (--i * 60ms trong base.css) bị gấp đôi. Dùng bộ đếm riêng, chỉ tăng khi
    gặp từ thật.
  */
  let i = 0
  return splitWords(text).map((w) =>
    w.trim() === ''
      ? `<span aria-hidden="true">${escapeHtml(w)}</span>`
      : `<span class="cut" aria-hidden="true" style="--i:${i++}"><span class="cut__in">${escapeHtml(w)}</span></span>`
  ).join('')
}

/*
  aria-label mang nguyên câu; mọi mảnh bên trong aria-hidden. Screen reader
  đọc một câu liền mạch thay vì từng từ rời.
*/
// Chỉ dùng cho phần tử text thuần: đọc el.textContent rồi ghi đè el.innerHTML,
// nên markup con (<strong>, <a>, <br>, ...) nếu có sẽ bị làm phẳng thành text.
export function mountCutReveal(el) {
  if (!el) return
  const text = el.textContent.trim()
  if (!text) return
  el.setAttribute('aria-label', text)
  el.innerHTML = cutMarkup(text)
}
