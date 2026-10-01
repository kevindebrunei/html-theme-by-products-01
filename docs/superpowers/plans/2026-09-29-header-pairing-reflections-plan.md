# Header Border Removal, The Pair Option & Collector Reflections Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the site header bottom border, reframe "The Pairing" as a 2-cup discount tier on both homepage and PDP, and upgrade "Collector Reflections" into a 10-item carousel with navigation arrows and dot indicators.

**Architecture:** Vanilla HTML, CSS, and JS following existing project conventions and tokens in `tokens.css`, `base.css`, and `components.css`. Maintain zero-dependency structure, accessible semantics, responsive layouts, and gold foil aesthetic.

**Tech Stack:** HTML5, CSS3 (CSS Custom Properties, Flexbox, Transitions), Vanilla ES Modules.

## Global Constraints

- No external libraries.
- Strictly adhere to existing Goldbourne & Co. design tokens (`--bg`, `--accent`, `--border`, `--font-heading`, etc.).
- Maintain null/undefined safety for all DOM and data queries.
- Smooth transitions with responsive desktop and mobile support.

---

### Task 1: Remove Header Bottom Border

**Files:**
- Modify: `demo/assets/components.css:122, 128, 171, 184`

**Interfaces:**
- Consumes: `.site-header`, `.site-header-wrapper`, `.site-header-wrapper.is-scrolled`
- Produces: Borderless header on both initial transparent state and sticky scrolled state

- [ ] **Step 1: Inspect and update `.site-header` and `.site-header-wrapper` in `demo/assets/components.css`**
  Remove `border-bottom: 1px solid var(--border)` and `border-bottom: 1px solid rgba(201, 162, 39, 0.15)`.
  Ensure `.site-header-wrapper.is-scrolled` has `border-bottom: none`.
- [ ] **Step 2: Verify visually that no dividing border line renders under the header**

---

### Task 2: Reframe "The Pairing" on Homepage Promo Banner

**Files:**
- Modify: `demo/index.html:129-160`
- Modify: `demo/assets/main.js:10, 218-223`
- Modify: `demo/assets/components.css:570-629`

**Interfaces:**
- Consumes: `#pair-promo`
- Produces: Promo banner explaining the volume discount ($89.95 for any 2 tumblers, save $9.95)

- [ ] **Step 1: Update promo section copy in `demo/index.html`**
  - Section title: `The Collector's <span class="gold-foil-text">Pair Option</span>`
  - Eyebrow: `✦ Archival Dual Allocation`
  - Description: `Acquire any two 40 oz Gilded Tumblers — twin editions or distinct releases — and unlock the paired allocation at $89.95 (save $9.95). Each vessel arrives sealed in archival packaging with complimentary express transit.`
  - Price row: `$89.95` (was `$99.90`) with badge `Save $9.95 + Free Express Transit`
  - Action buttons:
    - Primary CTA: `Explore Tumblers to Pair ↓` linking to `#tumblers`
    - Secondary CTA: `Acquire Any 2 Vessels — $89.95 ✦`
  - Preview card: Add label `"Pair Any 2 Vessels · Save $9.95"`
- [ ] **Step 2: Update `demo/assets/main.js` notification text and button handlers**
  - Update `MESSAGES`: `"The Pair Option — any two tumblers, $89.95 with complimentary transit."`
  - Update toast text on `.js-pair-btn` click: `"The Pair Option added to bag — select any 2 tumblers ($89.95 paired price)."`

---

### Task 3: Add "The Pair" Tier Selection to Product Detail Page (PDP)

**Files:**
- Modify: `demo/assets/product.js:60-78`
- Modify: `demo/assets/components.css`

**Interfaces:**
- Consumes: `product.js:render()`
- Produces: `.pdp__tier-select` allowing users to toggle between Single ($49.95) and The Pair ($89.95) for Tumblers

- [ ] **Step 1: Add styling for PDP package/tier selector in `demo/assets/components.css`**
  Style `.pdp__tier-options`, `.pdp__tier-card`, `.pdp__tier-card.is-active`, `.pdp__tier-badge`.
- [ ] **Step 2: Update `demo/assets/product.js`**
  - Detect if product is a `Tumbler` (`p.type === 'Tumbler'`).
  - Render tier options:
    - 1× Vessel: `$49.95`
    - The Pair (2× Vessels): `$89.95` (Save $9.95 + Free Shipping)
  - Add event listener to switch active tier, dynamically updating the displayed price and the Add to Bag CTA button label.

---

### Task 4: Collector Reflections Carousel - HTML Structure & 10 Curated Reviews

**Files:**
- Modify: `demo/index.html:242-285`

**Interfaces:**
- Consumes: `#reviews` section
- Produces: `.reviews-carousel` containing 10 review items, prev/next buttons, and 10 indicator dots

- [ ] **Step 1: Replace `.reviews-grid` with `.reviews-carousel` in `demo/index.html`**
  Create:
  - `.reviews-carousel__viewport`
  - `.reviews-carousel__track` containing 10 structured `.review-card` elements with star ratings, quotes, author name, location, and edition purchased.
  - `.reviews-carousel__controls` containing prev button (`‹`), next button (`›`), and `.reviews-carousel__dots` (10 buttons).

---

### Task 5: Collector Reflections Carousel - CSS Styling

**Files:**
- Modify: `demo/assets/components.css:658-701`

**Interfaces:**
- Consumes: `.reviews-carousel`
- Produces: Responsive styling for desktop (3 cards visible) and mobile (1 card visible), smooth track transforms, styled buttons and dots

- [ ] **Step 1: Implement `.reviews-carousel` CSS**
  - `.reviews-carousel`: relative container, overflow hidden viewport.
  - `.reviews-carousel__track`: `display: flex; gap: var(--space-4); transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);`
  - `.reviews-carousel .review-card`: flex item with `flex: 0 0 calc((100% - 2 * var(--space-4)) / 3);` on desktop, `flex: 0 0 100%;` on mobile (< 768px), `flex: 0 0 calc((100% - var(--space-4)) / 2);` on tablet (768px - 1024px).
  - Navigation arrows: `.reviews-carousel__btn`: 44x44px round buttons, translucent obsidian background, gold border, hover transition.
  - Dots: `.reviews-carousel__dot`: 8px round dot, expanded to 24px pill with gold foil gradient when `.is-active`.

---

### Task 6: Collector Reflections Carousel - JavaScript Controller

**Files:**
- Modify: `demo/assets/main.js`

**Interfaces:**
- Consumes: `.reviews-carousel`, `.reviews-carousel__track`, `.reviews-carousel__btn`, `.reviews-carousel__dot`
- Produces: `initReviewsCarousel()` with index calculation, slide translation, touch gestures, and resize listener

- [ ] **Step 1: Write `initReviewsCarousel()` in `demo/assets/main.js`**
  - Determine `itemsPerView` dynamically (3 on desktop, 2 on tablet, 1 on mobile).
  - Calculate `maxIndex = totalItems - itemsPerView`.
  - Implement `goTo(index)` with boundary clamping/looping.
  - Bind arrow buttons, dot buttons, touch swipe listeners, and resize debounce.
- [ ] **Step 2: Invoke `initReviewsCarousel()` in `main()`**

---

### Task 7: Full Visual Verification in Browser

**Files:**
- Test: `http://localhost:8000/demo/index.html`
- Test: `http://localhost:8000/demo/product.html?sku=TUM-20260923-XI-001`

**Interfaces:**
- Verify all 3 user requests visually:
  1. Header border-bottom is completely removed in all scroll states.
  2. The Pairing is framed as an option to buy any 2 cups with a discount on both homepage promo banner and PDP.
  3. Collector Reflections functions as an interactive carousel with 10 reviews, functioning prev/next arrows, and 10 active dots.
