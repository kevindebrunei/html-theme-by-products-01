# Design Specification: Homepage Animate Appear & Scroll Parallax Engine

**Date**: 2026-09-29  
**Status**: Approved  
**Scope**: `demo/index.html`, `demo/assets/components.css`, `demo/assets/main.js`, `demo/assets/images/`

---

## 1. Problem Statement & User Requirements

1. **Animate Appear (Reveal on Scroll)**:
   - When sections, headers, and product cards enter the viewport, they currently render statically without entrance animations.
   - Requirement: Add smooth, elegant appear animations across the homepage using native browser APIs (`IntersectionObserver`).
   - Cards in category grids (`#tumblerGrid`, `#capGrid`, `#backpackGrid`, `#shoesGrid`) must appear with a subtle staggered delay (so le) creating a cascading wave effect as the user scrolls into each discipline.

2. **Scroll Parallax Effect**:
   - Currently, background images in the Hero Carousel and promotional banners remain stationary relative to their containers during scroll.
   - Requirement: Add a 60fps hardware-accelerated scroll parallax effect that moves background images at a subtle, refined offset relative to page scroll.
   - Parallax must be applied to:
     - Hero carousel slides (`.hero-carousel__bg`).
     - Promotional banners (`#pair-promo` and `#vault-promo`).
     - **Two new dedicated full-width cinematic Parallax Break Sections** placed between product disciplines to pace the user experience.

3. **AI-Generated Parallax Imagery**:
   - Generate two high-resolution luxury 16:9 banner images adhering strictly to Goldbourne & Co.'s gothic gold filigree on obsidian aesthetic:
     1. `parallax_filigree_craft.jpg`: The Art of Gilded Filigree & Surgical Steel (between Tumblers and Caps).
     2. `parallax_heraldic_atelier.jpg`: The Heraldic Atelier & Obsidian Leather (between Backpacks and Footwear).

---

## 2. Visual Structure & Layout Placement

The homepage will follow this visual flow:

1. **Sticky Header** (`#siteHeaderWrapper`)
2. **Hero Carousel** (`#heroCarousel`): 4 rotating slides with parallax depth on `.hero-carousel__bg`.
3. **Discipline I: 40 oz Tumblers** (`#tumblers`):
   - Section heading with reveal animation.
   - 12 product cards with staggered cascade appearance.
4. **✦ Ornamental Gold Divider ✦**
5. **[NEW] Parallax Break Banner 1: *The Discipline of Steel & Filigree*** (`#filigree-parallax`):
   - Full-width cinematic banner with `parallax_filigree_craft.jpg` background.
   - Parallax depth factor: 0.22.
   - Text overlay:
     - Eyebrow: `✦ The Art of 360° Relief`
     - Title: `Forged in Continuous Stillness`
     - Subtitle: *"Double-wall surgical SUS 304 stainless steel enveloped in uninterrupted gothic filigree relief, cast without seam or compromise."*
     - CTA link: `Explore The Gilded Vessels ↓`
6. **Discipline II: High-Crown Caps** (`#caps`):
   - Section heading with reveal animation.
   - 11 product cards with staggered cascade appearance.
7. **✦ Ornamental Gold Divider ✦**
8. **Discipline III: Gilded Backpacks** (`#backpacks`):
   - Section heading with reveal animation.
   - 8 product cards with staggered cascade appearance.
9. **✦ Ornamental Gold Divider ✦**
10. **Promo Section 1: The Collector's Pair Option** (`#pair-promo`):
    - Parallax depth factor: 0.20 on `promo_pair.jpg`.
    - Tier discount purchase CTA and duo preview.
11. **✦ Ornamental Gold Divider ✦**
12. **[NEW] Parallax Break Banner 2: *The Heraldic Obsidian Atelier*** (`#atelier-parallax`):
    - Full-width cinematic banner with `parallax_heraldic_atelier.jpg` background.
    - Parallax depth factor: 0.22.
    - Text overlay:
      - Eyebrow: `✦ Heirloom Leather & Heavy Bullion`
      - Title: `Heraldic Lineage in Full Grain`
      - Subtitle: *"Obsidian full-grain hide matched with cast solid-gold-finish hardware and numbered vault seals, engineered for generations of passage."*
      - CTA link: `Explore Leather Carriers ↓`
13. **Discipline IV: Heritage Athletic Runners** (`#shoes`):
    - Section heading with reveal animation.
    - 3 product cards with staggered cascade appearance.
14. **✦ Ornamental Gold Divider ✦**
15. **Promo Section 2: Archival Vault Guarantee & Ledger** (`#vault-promo`):
    - Parallax depth factor: 0.20 on `promo_vault.jpg`.
16. **✦ Ornamental Gold Divider ✦**
17. **Collector Reflections Carousel** (`#reviews`):
    - 10-item reviews carousel with entrance reveal.
18. **Parchment Footer** (`footer.site-footer`)

---

## 3. Image Generation Plan

Using the `generate_image` tool:

1. **`demo/assets/images/parallax_filigree_craft.jpg`**:
   - **Aspect Ratio**: 16:9
   - **Prompt**: *"Cinematic ultra-luxurious dark atelier background banner for a gothic luxury brand. Extreme macro close-up of master craftsman's hands in dim chiaroscuro golden ambient studio lighting, meticulously engraving intricate 360-degree raised 24k gold baroque filigree onto an obsidian matte black stainless steel cylindrical surface. Delicate gold leaf flakes, subtle candlelight reflections, deep moody shadows, ultra-sharp craftsmanship, editorial luxury photography."*

2. **`demo/assets/images/parallax_heraldic_atelier.jpg`**:
   - **Aspect Ratio**: 16:9
   - **Prompt**: *"Cinematic ultra-luxurious dark leather workshop background banner for a heritage brand. Rich deep obsidian full-grain leather workbench with deeply debossed heraldic crests and imperial royal seals in 24k polished gold relief. Heavy-gauge gold buckles, metallic gold bullion embroidery threads, vintage bookbinding tools, moody atmospheric studio lighting, dark luxury aesthetic, sharp macro texture."*

---

## 4. Technical Architecture & Implementation

### 4.1. Parallax Engine (Vanilla JavaScript + GPU Acceleration)

- **Class / Selector**: `.has-parallax` containers containing a child `.parallax-bg`.
- **CSS Styling (`components.css`)**:
  ```css
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
  ```
- **Parallax Math & Animation Loop (`main.js`)**:
  - Use `window.requestAnimationFrame` triggered on scroll events.
  - For each active parallax container:
    1. Compute `rect = el.getBoundingClientRect()`.
    2. Check visibility: `if (rect.bottom < 0 || rect.top > window.innerHeight) return;`.
    3. Calculate viewport center delta:
       `const centerDelta = (rect.top + rect.height / 2) - (window.innerHeight / 2);`
    4. Compute offset: `const offsetY = centerDelta * speedFactor;` (default `speedFactor = 0.22`).
    5. Apply hardware-accelerated transform:
       `bg.style.transform = `translate3d(0, ${offsetY.toFixed(1)}px, 0)`;`
  - In Hero Carousel:
    - The active slide's `.hero-carousel__bg` participates in the parallax calculation as the page is scrolled away from the top.
  - Accessibility check:
    - If `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, bypass the transform calculations.

### 4.2. Animate Appear Engine (Native `IntersectionObserver`)

- **CSS Styling (`components.css`)**:
  ```css
  .reveal-on-scroll {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .reveal-on-scroll.is-revealed {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Product card stagger cascade */
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
  ```
- **JavaScript Initialization (`main.js`)**:
  - `initAppearAnimation()` creates an `IntersectionObserver`:
    ```javascript
    const appearObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });
    ```
  - Observe `.section-head`, `.gold-divider`, `.promo-banner`, `.parallax-break`, and `.reviews-carousel`.
  - For dynamic product cards injected into grids:
    - In `renderCategories()`, apply class `.reveal-card` and inline `style="transition-delay: ${(idx % 4) * 60}ms;"`.
    - Immediately pass each card element to `appearObserver.observe(card)`.

---

## 5. Non-Functional & Quality Requirements

1. **No External Dependencies**: 100% Vanilla JS and Vanilla CSS. No external script libraries.
2. **Performance**: Zero layout thrashing; only `transform` and `opacity` are animated. `will-change: transform` scoped strictly to `.parallax-bg`.
3. **Null-Safety**: All DOM selections (`document.getElementById`, `document.querySelectorAll`) check for null/empty collections before attaching listeners or properties.
4. **Responsive Integrity**:
   - Parallax backgrounds scale gracefully on mobile screens without overflow (`overflow: hidden` on parent).
   - Stagger timing dynamically wraps without overflowing delays on narrower screens.
5. **Reduced Motion**: Gracefully fall back to instant visibility when `prefers-reduced-motion` is active.

---

## 6. Verification Plan

1. **Visual & Parallax Verification**:
   - Open `http://localhost:8000/demo/index.html` via browser tool.
   - Scroll through the entire page from Hero to Footer.
   - Confirm background imagery in Hero, Parallax Break 1, Promo Pair, Parallax Break 2, and Vault Promo moves smoothly at differential speeds.
2. **Animation Appearance Verification**:
   - Reload page and slowly scroll down.
   - Confirm section titles glide upward and fade in gently.
   - Confirm product cards appear in a cascading sequence (staggered delay).
3. **Functional Integrity**:
   - Confirm all category links in navigation (`#tumblers`, `#caps`, `#backpacks`, `#shoes`, `#pair-promo`) still scroll cleanly to the proper section.
   - Confirm carousel controls (Hero Carousel, Reviews Carousel) function without degradation.
