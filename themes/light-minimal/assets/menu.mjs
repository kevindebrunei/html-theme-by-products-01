/* menu.mjs — mobile navigation drawer cho Goldbourne & Co. */
import { TYPE_ORDER, TYPE_LABEL, catalogDiscipline } from './catalog.mjs'
import { escapeHtml } from './render.mjs'

/**
 * Sinh chuỗi HTML danh sách catalog cho menu drawer.
 * @param {(type: string) => string} hrefFor
 * @returns {string}
 */
export function menuHtml(hrefFor) {
  return TYPE_ORDER.map((type) => {
    const disc = catalogDiscipline(type)
    const href = hrefFor ? hrefFor(type) : '#'
    return `
      <li class="menu-drawer__item">
        <a class="menu-drawer__link" href="${escapeHtml(href)}">
          <span class="menu-drawer__num">${escapeHtml(disc.roman)}</span>
          <div class="menu-drawer__content">
            <span class="menu-drawer__label">${escapeHtml(TYPE_LABEL[type] ?? type)}</span>
            <span class="menu-drawer__sub">${escapeHtml(disc.name)}</span>
          </div>
          <span class="menu-drawer__arrow" aria-hidden="true">&rarr;</span>
        </a>
      </li>
    `
  }).join('')
}

/**
 * Gắn tương tác đóng/mở cho mobile menu drawer.
 * @param {{ hrefFor: (type: string) => string }} options
 */
export function mountMenuUI({ hrefFor } = {}) {
  const menuToggle = document.getElementById('menuToggle')
  const menuClose = document.getElementById('menuClose')
  const menuBackdrop = document.getElementById('menuBackdrop')
  const menuDrawer = document.getElementById('menuDrawer')
  const mobileNav = document.getElementById('mobileMenuNav')

  if (!menuToggle || !menuDrawer) return

  if (mobileNav && typeof hrefFor === 'function') {
    mobileNav.innerHTML = menuHtml(hrefFor)
  }

  function openMenu() {
    menuDrawer.hidden = false
    if (menuBackdrop) menuBackdrop.hidden = false
    void menuDrawer.offsetHeight // trigger reflow
    menuDrawer.classList.add('is-open')
    if (menuBackdrop) menuBackdrop.classList.add('is-open')
    menuDrawer.setAttribute('aria-hidden', 'false')
    menuToggle.setAttribute('aria-expanded', 'true')
    document.body.classList.add('menu-open')
    if (menuClose) menuClose.focus()
  }

  function closeMenu() {
    menuDrawer.classList.remove('is-open')
    if (menuBackdrop) menuBackdrop.classList.remove('is-open')
    menuDrawer.setAttribute('aria-hidden', 'true')
    menuToggle.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('menu-open')
    setTimeout(() => {
      if (!menuDrawer.classList.contains('is-open')) {
        menuDrawer.hidden = true
        if (menuBackdrop) menuBackdrop.hidden = true
      }
    }, 280)
  }

  menuToggle.addEventListener('click', openMenu)
  if (menuClose) menuClose.addEventListener('click', closeMenu)
  if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu)

  if (mobileNav) {
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        closeMenu()
      }
    })
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuDrawer.classList.contains('is-open')) {
      closeMenu()
    }
  })
}
