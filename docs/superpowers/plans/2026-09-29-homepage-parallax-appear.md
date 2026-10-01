# Homepage Animate Appear & Scroll Parallax Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hardware-accelerated 60fps scroll parallax across existing banners and two new cinematic break sections, and apply native `IntersectionObserver`-driven staggered appear animations to sections and dynamic product cards on the homepage.

**Architecture:** Vanilla JavaScript module (`main.js`) drives a `requestAnimationFrame` loop that translates `.parallax-bg` layers with relative viewport offset calculation and manages an `IntersectionObserver` instance that flags `.reveal-on-scroll` and `.reveal-card` elements with an `.is-revealed` class. Hardware acceleration and smooth transitions are configured via CSS variables and cubic-bezier easing in `components.css`.

**Tech Stack:** HTML5, CSS3 (Transforms, transitions, cubic-bezier easing, media queries), Vanilla JavaScript ES6+ (requestAnimationFrame, IntersectionObserver, matchMedia), AI image generation.

## Global Constraints

- No external libraries (no GSAP, Locomotive, jQuery, or third-party CSS frameworks).
- Preserve existing navigation anchors (`#tumblers`, `#caps`, `#backpacks`, `#shoes`, `#pair-promo`, `#vault-promo`, `#reviews`).
- Zero layout thrashing: animate only `transform` and `opacity`.
- Respect `prefers-reduced-motion: reduce`.
- Full null/undefined safety on all DOM queries and element interactions.

---

### Task 1: Generate AI Image Assets for Cinematic Parallax Sections

**Files:**
- Create: `demo/assets/images/parallax_filigree_craft.jpg`
- Create: `demo/assets/images/parallax_heraldic_atelier.jpg`

**Interfaces:**
- Produces: Two 16:9 JPEG images in `demo/assets/images/` for background display in `.parallax-bg`.

- [ ] **Step 1: Generate `parallax_filigree_craft.jpg`**
Use `generate_image` tool with Prompt:
`"Cinematic ultra-luxurious dark atelier background banner for a gothic luxury brand. Extreme macro close-up of master craftsman's hands in dim chiaroscuro golden ambient studio lighting, meticulously engraving intricate 360-degree raised 24k gold baroque filigree onto an obsidian matte black stainless steel cylindrical surface. Delicate gold leaf flakes, subtle candlelight reflections, deep moody shadows, ultra-sharp craftsmanship, editorial luxury photography."`
Aspect ratio: `16:9`.
Save/move to `demo/assets/images/parallax_filigree_craft.jpg`.

- [ ] **Step 2: Generate `parallax_heraldic_atelier.jpg`**
Use `generate_image` tool with Prompt:
`"Cinematic ultra-luxurious dark leather workshop background banner for a heritage brand. Rich deep obsidian full-grain leather workbench with deeply debossed heraldic crests and imperial royal seals in 24k polished gold relief. Heavy-gauge gold buckles, metallic gold bullion embroidery threads, vintage bookbinding tools, moody atmospheric studio lighting, dark luxury aesthetic, sharp macro texture."`
Aspect ratio: `16:9`.
Save/move to `demo/assets/images/parallax_heraldic_atelier.jpg`.

- [ ] **Step 3: Verify image files exist and are readable**
Run: `ls -la demo/assets/images/parallax_*.jpg`
Expected: Both files exist with non-zero size.

---

### Task 2: Implement CSS Foundations for Animate Appear & Parallax in `components.css`

**Files:**
- Modify: `demo/assets/components.css`

**Interfaces:**
- Produces CSS classes: `.has-parallax`, `.parallax-bg`, `.parallax-break`, `.reveal-on-scroll`, `.reveal-card`, `.is-revealed`.

- [ ] **Step 1: Add Parallax styles to `components.css`**
Add styles for `.has-parallax` containers and `.parallax-bg` layers with vertical overflow padding (-15% top, 130% height) to allow smooth translation without white gaps:
```css
/* ---- Parallax Engine ---- */
.has-parallax {
  position: relative;
  overflow: hidden;
}
.parallax-bg {
  position: absolute;
  top: -15%;
  left: 0;
  width: 100%;
  height: 130%;
  background-size: cover;
  background-position: center;
  will-change: transform;
  pointer-events: none;
  z-index: 1;
}
@media (prefers-reduced-motion: reduce) {
  .parallax-bg {
    transform: none !important;
    top: 0;
    height: 100%;
  }
}

/* Parallax Break Sections */
.parallax-break {
  position: relative;
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--border-gold);
  border-bottom: 1px solid var(--border-gold);
  margin-block: var(--space-6);
  overflow: hidden;
  text-align: center;
}
.parallax-break__overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(11, 10, 8, 0.72) 0%, rgba(11, 10, 8, 0.94) 100%);
  z-index: 2;
}
.parallax-break__content {
  position: relative;
  z-index: 3;
  max-width: 640px;
  padding: var(--space-5) var(--space-4);
  margin-inline: auto;
}
.parallax-break__title {
  font-size: clamp(1.85rem, 3.5vw, 2.75rem);
  font-weight: 400;
  line-height: 1.2;
  margin: var(--space-2) 0;
}
.parallax-break__subtitle {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--muted);
  margin-bottom: var(--space-4);
}
```

- [ ] **Step 2: Add Animate Appear & Card Cascade styles to `components.css`**
```css
/* ---- Animate Appear & Scroll Reveal ---- */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-on-scroll.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered card reveal */
.reveal-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-card.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll,
  .reveal-card {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 3: Update `.promo-banner` background class to integrate `.parallax-bg`**
Ensure `.promo-banner` has `position: relative; overflow: hidden;` and `.promo-banner__bg` inherits or uses the `.parallax-bg` sizing.

---

### Task 3: Update `demo/index.html` with Parallax Sections & Reveal Classes

**Files:**
- Modify: `demo/index.html`

**Interfaces:**
- Consumes: CSS classes from Task 2.
- Produces: HTML structure with `.has-parallax` on `#heroCarousel`, `#pair-promo`, `#vault-promo`, and the 2 new break sections (`#filigree-parallax`, `#atelier-parallax`). Adds `.reveal-on-scroll` to section heads, gold dividers, promo blocks, and review carousel.

- [ ] **Step 1: Mark Hero Carousel with `has-parallax` and `reveal-on-scroll`**
Update `#heroCarousel` so slides support parallax scrolling.
- [ ] **Step 2: Add Parallax Break Section 1 between Tumblers and Caps**
Insert:
```html
<section class="parallax-break has-parallax reveal-on-scroll" id="filigree-parallax" data-parallax-speed="0.22" aria-label="The Discipline of Steel & Filigree">
  <div class="parallax-bg" style="background-image: url('assets/images/parallax_filigree_craft.jpg');"></div>
  <div class="parallax-break__overlay" aria-hidden="true"></div>
  <div class="parallax-break__content">
    <div class="section-eyebrow"><span class="gem">✦</span> The Art of 360° Relief</div>
    <h2 class="parallax-break__title">Forged in Continuous <span class="gold-foil-text">Stillness.</span></h2>
    <p class="parallax-break__subtitle">Double-wall surgical SUS 304 stainless steel enveloped in uninterrupted gothic filigree relief, cast without seam or compromise.</p>
    <a class="btn" href="#tumblers">Explore Tumblers Collection ↓</a>
  </div>
</section>
```
- [ ] **Step 3: Update `#pair-promo` to use `has-parallax` and `.parallax-bg`**
Add `has-parallax` and `data-parallax-speed="0.20"` to `#pair-promo`. Replace/update `.promo-banner__bg` with class `parallax-bg promo-banner__bg`.
- [ ] **Step 4: Add Parallax Break Section 2 between Backpacks and Footwear**
Insert:
```html
<section class="parallax-break has-parallax reveal-on-scroll" id="atelier-parallax" data-parallax-speed="0.22" aria-label="The Heraldic Obsidian Atelier">
  <div class="parallax-bg" style="background-image: url('assets/images/parallax_heraldic_atelier.jpg');"></div>
  <div class="parallax-break__overlay" aria-hidden="true"></div>
  <div class="parallax-break__content">
    <div class="section-eyebrow"><span class="gem">✦</span> Heirloom Leather &amp; Heavy Bullion</div>
    <h2 class="parallax-break__title">Heraldic Lineage in <span class="gold-foil-text">Full Grain.</span></h2>
    <p class="parallax-break__subtitle">Obsidian full-grain hide matched with cast solid-gold-finish hardware and numbered vault seals, engineered for generations of passage.</p>
    <a class="btn" href="#backpacks">Explore Backpacks Collection ↓</a>
  </div>
</section>
```
- [ ] **Step 5: Update `#vault-promo` to use `has-parallax` and `.parallax-bg`**
Add `has-parallax` and `data-parallax-speed="0.20"` to `#vault-promo`.
- [ ] **Step 6: Add `.reveal-on-scroll` to all `.section-head`, `.gold-divider`, and `#reviews`**

---

### Task 4: Implement Parallax Engine and Staggered Animate Appear in `main.js`

**Files:**
- Modify: `demo/assets/main.js`

**Interfaces:**
- Produces: `initParallaxEngine()`, `initAppearObserver()`, and updates `renderCategories()` to attach `.reveal-card` with staggered delay.

- [ ] **Step 1: Implement `initParallaxEngine()` in `main.js`**
Write the passive scroll handler and requestAnimationFrame loop:
```javascript
function initParallaxEngine() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const parallaxContainers = document.querySelectorAll('.has-parallax')
  if (parallaxContainers.length === 0) return

  let ticking = false

  function updateParallax() {
    const windowHeight = window.innerHeight

    parallaxContainers.forEach((container) => {
      const rect = container.getBoundingClientRect()
      // Only compute when visible or near viewport
      if (rect.bottom < -50 || rect.top > windowHeight + 50) return

      const bg = container.querySelector('.parallax-bg, .hero-carousel__slide.is-active .hero-carousel__bg')
      if (!bg) return

      const speed = parseFloat(container.dataset.parallaxSpeed) || 0.22
      const centerDelta = (rect.top + rect.height / 2) - (windowHeight / 2)
      const translateY = centerDelta * speed

      bg.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`
    })

    ticking = false
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax)
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  updateParallax()
}
```

- [ ] **Step 2: Implement `initAppearObserver()` in `main.js`**
Write the `IntersectionObserver` setup:
```javascript
let appearObserver = null

function initAppearObserver() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-on-scroll, .reveal-card').forEach((el) => {
      el.classList.add('is-revealed')
    })
    return
  }

  appearObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      }
    })
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12,
  })

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    appearObserver.observe(el)
  })
}
```

- [ ] **Step 3: Update `renderCategories()` to tag cards with `.reveal-card` and staggered delay**
In `renderCategories()`, for each grid (`#tumblerGrid`, `#capGrid`, `#backpackGrid`, `#shoesGrid`):
Query the rendered `.card` elements and apply:
```javascript
cards.forEach((card, index) => {
  card.classList.add('reveal-card')
  const delay = (index % 4) * 55 // stagger per column
  card.style.transitionDelay = `${delay}ms`
  if (appearObserver) {
    appearObserver.observe(card)
  } else {
    card.classList.add('is-revealed')
  }
})
```

- [ ] **Step 4: Connect functions in `main()` lifecycle**
In `main()`, call `initAppearObserver()` before fetching products, and call `initParallaxEngine()`. Ensure proper null checks throughout.

---

### Task 5: Visual Verification & End-to-End Testing

**Files:**
- Test against: `http://localhost:8000/demo/index.html`

- [ ] **Step 1: Check for syntax errors and console clean logs**
Verify with browser subagent or node syntax check on `main.js`.
- [ ] **Step 2: Test Parallax Scroll Effect**
Scroll down through the page. Verify:
  - Hero background shifts smoothly with scroll.
  - Parallax Break 1 background shifts smoothly with scroll.
  - Promo Pair banner background shifts smoothly with scroll.
  - Parallax Break 2 background shifts smoothly with scroll.
  - Promo Vault banner background shifts smoothly with scroll.
  - No flickering, tearing, or horizontal overflow.
- [ ] **Step 3: Test Animate Appear & Staggered Cards**
Reload page and scroll progressively down:
  - Section titles smoothly animate upward.
  - Product cards cascade into view column-by-column.
- [ ] **Step 4: Verify navigation links and carousels**
Click `#tumblers`, `#caps`, `#backpacks`, `#shoes`, `#pair-promo`. Ensure anchor scrolling lands precisely and carousels function without glitch.
