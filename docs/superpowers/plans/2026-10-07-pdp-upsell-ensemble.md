# PDP Upsell Ensemble ("Complete The Set") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the PDP Upsell Ensemble system with algorithmic matching (Club match -> Utility pair -> Curated fallback), a 10% bundle discount, a compact purchasing widget in the sticky right column, and a full-width showcase section above the related products.

**Architecture:** A pure JavaScript module `upsell.mjs` computes matching companion items and pricing discounts without DOM dependencies (thoroughly tested with `node:test`). The PDP wiring in `product.js` dynamically mounts both the compact widget and the showcase section, synchronizing user selections (variants and checkboxes) and feeding discounted items directly into `cartApi`.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5, Vanilla CSS with custom properties (`tokens.css`), Node.js `node:test` test runner.

## Global Constraints

- Vanilla CSS and HTML only; do NOT introduce external libraries or packages.
- Follow existing project patterns strictly (pure logic in `.mjs`, DOM wiring in `.js`, test suites in `*.test.mjs`).
- Absolute asset paths (`/themes/light-minimal/assets/...`) to avoid clean-URL breakage.
- Strict compliance with `NO_SWAP` image rules from `catalog.mjs`.
- Always check for null / undefined on product fields.
- 10% discount applies when primary product + at least 1 companion item is selected.

---

### Task 1: Algorithmic Matching & Pricing Engine (`upsell.mjs`)

**Files:**
- Create: `themes/light-minimal/assets/upsell.mjs`
- Test: `themes/light-minimal/assets/upsell.test.mjs`

**Interfaces:**
- Consumes: `CURATED`, `formatPrice` from `themes/light-minimal/assets/catalog.mjs`
- Produces:
  - `extractClubOrTheme(product) -> string | null`
  - `resolveUpsellBundle(currentProduct, allProducts) -> { mainProduct, companions, ensembleTitle, ensembleSubtitle, discountPercent }`
  - `calculateBundlePricing(checkedItems, discountRate) -> { originalTotal, discountedTotal, savingsTotal, isDiscounted }`

- [ ] **Step 1: Write the failing tests in `upsell.test.mjs`**

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractClubOrTheme,
  resolveUpsellBundle,
  calculateBundlePricing,
} from './upsell.mjs'

const mockProducts = [
  {
    sku: 'SNK-PHI-001',
    handle: 'shoes-nfl-philadelphia-eagles-snk-20260923-xi-010',
    type: 'Shoes',
    price: 89.95,
    title: 'Eagles Sneaker',
    images: ['/products/Shoes/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'CAP-PHI-001',
    handle: 'cap-nfl-philadelphia-eagles-cap-20260923-uy-016',
    type: 'Cap',
    price: 39.95,
    title: 'Eagles Cap',
    images: ['/products/Cap/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'BP-PHI-001',
    handle: 'backpack-nfl-philadelphia-eagles-bp-20260923-xi-024',
    type: 'Backpack',
    price: 49.95,
    title: 'Eagles Backpack',
    images: ['/products/Backpack/NFL/NFL-%20Philadelphia-Eagles/01.webp']
  },
  {
    sku: 'TUM-BUF-001',
    handle: 'tumbler-40oz-nfl-buffalo-bills-tum-001',
    type: 'Tumbler',
    price: 49.95,
    title: 'Bills Tumbler',
    images: ['/products/Tumbler/NFL/NFL-%20Buffalo-Bills/01.webp']
  },
  {
    sku: 'CAP-DET-001',
    handle: 'cap-nfl-detroit-lions-cap-20260923-uy-021',
    type: 'Cap',
    price: 39.95,
    title: 'Lions Cap',
    images: ['/products/Cap/NFL/NFL-%20Detroit-Lions/01.webp']
  }
]

test('extractClubOrTheme parses club correctly', () => {
  assert.equal(extractClubOrTheme(mockProducts[0]), 'philadelphia-eagles')
  assert.equal(extractClubOrTheme(mockProducts[4]), 'detroit-lions')
})

test('resolveUpsellBundle matches club priority when 2 companions available', () => {
  const bundle = resolveUpsellBundle(mockProducts[0], mockProducts)
  assert.equal(bundle.companions.length, 2)
  const types = bundle.companions.map((c) => c.product.type)
  assert.ok(types.includes('Cap'))
  assert.ok(types.includes('Backpack'))
  assert.equal(bundle.discountPercent, 10)
})

test('calculateBundlePricing applies 10% discount when companions are checked', () => {
  const checked = [
    { price: 89.95 },
    { price: 39.95 },
    { price: 49.95 }
  ]
  const result = calculateBundlePricing(checked, 0.10)
  assert.equal(result.originalTotal, 179.85)
  assert.equal(result.discountedTotal, 161.87)
  assert.equal(result.savingsTotal, 17.98)
  assert.equal(result.isDiscounted, true)
})

test('calculateBundlePricing applies 0% discount when only main item is checked', () => {
  const checked = [{ price: 89.95 }]
  const result = calculateBundlePricing(checked, 0.10)
  assert.equal(result.originalTotal, 89.95)
  assert.equal(result.discountedTotal, 89.95)
  assert.equal(result.savingsTotal, 0)
  assert.equal(result.isDiscounted, false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test themes/light-minimal/assets/upsell.test.mjs`  
Expected: FAIL with `Cannot find module './upsell.mjs'`

- [ ] **Step 3: Implement `upsell.mjs`**

```javascript
/*
  upsell.mjs — Logic ghép cặp và tính giá bundle upsell cho PDP.
  Module thuần, không chạm DOM, test được bằng node:test.
*/
import { CURATED } from './catalog.mjs'

const CLUB_REGEX = /(?:backpack|cap|shoes|tumbler-40oz)-(?:nfl|mlb|nba|wwe)-([a-z0-9-]+?)-(?:bp|cap|snk|tum|\d)/i

export function extractClubOrTheme(product) {
  if (!product) return null
  const handle = String(product.handle ?? '')
  const match = handle.match(CLUB_REGEX)
  if (match && match[1]) {
    return match[1].replace(/-christmas|-halloween/gi, '').toLowerCase()
  }
  const img = (product.images ?? [])[0] ?? ''
  const parts = img.split('/')
  if (parts.length > 4) {
    return parts[4].toLowerCase().replace(/^nfl-|^mlb-|^nba-|^wwe-/i, '').replace(/%20/g, '-').trim()
  }
  return null
}

export function calculateBundlePricing(checkedItems, discountRate = 0.10) {
  const items = checkedItems ?? []
  const originalTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)
  
  if (items.length <= 1) {
    const orig = Math.round(originalTotal * 100) / 100
    return {
      originalTotal: orig,
      discountedTotal: orig,
      savingsTotal: 0,
      isDiscounted: false,
    }
  }

  const discountedTotal = items.reduce((sum, it) => {
    const discounted = Math.round((Number(it.price) || 0) * (1 - discountRate) * 100) / 100
    return sum + discounted
  }, 0)

  const orig = Math.round(originalTotal * 100) / 100
  const disc = Math.round(discountedTotal * 100) / 100
  const savings = Math.round((orig - disc) * 100) / 100

  return {
    originalTotal: orig,
    discountedTotal: disc,
    savingsTotal: savings,
    isDiscounted: true,
  }
}

export function resolveUpsellBundle(currentProduct, allProducts = []) {
  if (!currentProduct) return null
  const club = extractClubOrTheme(currentProduct)
  const companions = []
  const pickedSkus = new Set([currentProduct.sku])
  const pickedTypes = new Set([currentProduct.type])

  // Tier 1: Matching Club
  if (club) {
    const clubCandidates = allProducts.filter((p) => {
      if (pickedSkus.has(p.sku) || pickedTypes.has(p.type)) return false
      return extractClubOrTheme(p) === club
    })

    for (const cand of clubCandidates) {
      if (companions.length >= 2) break
      companions.push({
        product: cand,
        role: 'matching-club',
        badge: 'Matching Silhouette'
      })
      pickedSkus.add(cand.sku)
      pickedTypes.add(cand.type)
    }
  }

  // Tier 2: Utility Pair (Backpack + Tumbler)
  if (companions.length < 2) {
    const targetType = currentProduct.type === 'Backpack' ? 'Tumbler' : (currentProduct.type === 'Tumbler' ? 'Backpack' : null)
    if (targetType && !pickedTypes.has(targetType)) {
      const utilCand = allProducts.find((p) => p.type === targetType && !pickedSkus.has(p.sku))
      if (utilCand) {
        companions.push({
          product: utilCand,
          role: 'utility-pair',
          badge: 'Daily Utility Companion'
        })
        pickedSkus.add(utilCand.sku)
        pickedTypes.add(utilCand.type)
      }
    }
  }

  // Tier 3: Curated Vault Fallback
  if (companions.length < 2) {
    const bySku = new Map(allProducts.map((p) => [p.sku, p]))
    for (const sku of CURATED) {
      if (companions.length >= 2) break
      const item = bySku.get(sku)
      if (item && !pickedSkus.has(item.sku) && !pickedTypes.has(item.type)) {
        companions.push({
          product: item,
          role: 'curated-vault',
          badge: 'Curated Complement'
        })
        pickedSkus.add(item.sku)
        pickedTypes.add(item.type)
      }
    }
  }

  // Final fallback if distinct types were exhausted
  if (companions.length < 2) {
    for (const p of allProducts) {
      if (companions.length >= 2) break
      if (!pickedSkus.has(p.sku)) {
        companions.push({
          product: p,
          role: 'curated-vault',
          badge: 'Curated Complement'
        })
        pickedSkus.add(p.sku)
      }
    }
  }

  let ensembleTitle = 'The Complete Ensemble'
  let ensembleSubtitle = 'Architecturally aligned artifacts tailored for unified ritual and elevated presence. Save 10% on the complete selection.'
  if (club) {
    const clubFormatted = club.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    ensembleTitle = `The ${clubFormatted} Ensemble`
    ensembleSubtitle = `Unified matchday regalia cast in gilded relief. Acquire the complete syndicate for a complimentary 10% consignment privilege.`
  }

  return {
    mainProduct: currentProduct,
    companions,
    ensembleTitle,
    ensembleSubtitle,
    discountPercent: 10,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test themes/light-minimal/assets/upsell.test.mjs`  
Expected: PASS (4 tests passed)

- [ ] **Step 5: Commit**

```bash
git add themes/light-minimal/assets/upsell.mjs themes/light-minimal/assets/upsell.test.mjs
git commit -m "feat(light-minimal): implement upsell matching and pricing module with tests"
```

---

### Task 2: Styles for Compact Widget & Showcase Section (`components.css`)

**Files:**
- Modify: `themes/light-minimal/assets/components.css`

**Interfaces:**
- Produces CSS classes:
  - `.pdp-bundle-widget`: Right-col sticky compact widget.
  - `.pdp-bundle-item`: Checklist rows with thumbnails, titles, variant dropdowns.
  - `.pdp-bundle-price`: Live calculated price bar with strikethrough and gold pill tag.
  - `.pdp-ensemble`: Section container, grid, 3 luxury cards, and section CTA bar.

- [ ] **Step 1: Add CSS rules for `.pdp-bundle-widget` and `.pdp-ensemble` in `components.css`**

Add the styled components to `themes/light-minimal/assets/components.css`:

```css
/* ==========================================================================
   PDP Upsell: Compact Widget & Complete Ensemble Showcase
   ========================================================================== */

/* 1. Compact Widget (Right Column) */
.pdp-bundle-widget {
  margin-top: 1.75rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pdp-bundle-widget__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pdp-bundle-widget__tag {
  font-family: var(--font-sans);
  font-size: var(--fs-11);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
}

.pdp-bundle-widget__title {
  font-family: var(--font-serif);
  font-size: var(--fs-18);
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.pdp-bundle-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pdp-bundle-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--fs-13);
}

.pdp-bundle-item__check {
  width: 18px;
  height: 18px;
  accent-color: var(--ink);
  cursor: pointer;
}

.pdp-bundle-item__check:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.pdp-bundle-item__thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  background: var(--bg);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.pdp-bundle-item__info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.pdp-bundle-item__title {
  font-family: var(--font-sans);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ink);
}

.pdp-bundle-item__meta {
  font-size: var(--fs-12);
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdp-bundle-item__select {
  font-family: var(--font-sans);
  font-size: var(--fs-11);
  padding: 0.15rem 0.35rem;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--ink);
  cursor: pointer;
}

.pdp-bundle-pricing {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.pdp-bundle-pricing__amounts {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.pdp-bundle-pricing__total {
  font-family: var(--font-serif);
  font-size: var(--fs-20);
  font-weight: 600;
  color: var(--ink);
}

.pdp-bundle-pricing__was {
  font-size: var(--fs-14);
  color: var(--ink-muted);
  text-decoration: line-through;
}

.pdp-bundle-pricing__badge {
  font-family: var(--font-sans);
  font-size: var(--fs-11);
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--gold);
  background: rgba(158, 125, 59, 0.08);
  padding: 0.2rem 0.5rem;
  border: 1px solid rgba(158, 125, 59, 0.25);
}

.pdp-bundle-widget__scroll {
  font-family: var(--font-sans);
  font-size: var(--fs-12);
  color: var(--ink-muted);
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
}

.pdp-bundle-widget__scroll:hover {
  color: var(--gold);
}

/* 2. The Complete Ensemble Showcase Section */
.pdp-ensemble {
  padding-top: var(--sp-12);
  padding-bottom: var(--sp-12);
  border-top: 1px solid var(--border);
}

.pdp-ensemble__header {
  margin-bottom: var(--sp-8);
  max-width: 48rem;
}

.pdp-ensemble__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: var(--sp-8);
}

.pdp-ensemble-card {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  transition: border-color 0.2s ease;
}

.pdp-ensemble-card.is-active {
  border-color: var(--gold);
}

.pdp-ensemble-card__badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 2;
  font-family: var(--font-sans);
  font-size: var(--fs-10);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--surface);
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--border);
  color: var(--ink-muted);
}

.pdp-ensemble-card__img-wrap {
  aspect-ratio: 1;
  background: var(--bg);
  overflow: hidden;
}

.pdp-ensemble-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pdp-ensemble-card__title {
  font-family: var(--font-serif);
  font-size: var(--fs-18);
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.pdp-ensemble-card__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.pdp-ensemble__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 1.5rem 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

@media (max-width: 860px) {
  .pdp-ensemble__grid {
    grid-template-columns: 1fr;
  }
  .pdp-ensemble__footer {
    flex-direction: column;
    align-items: stretch;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add themes/light-minimal/assets/components.css
git commit -m "style(light-minimal): add styles for PDP upsell widget and ensemble showcase"
```

---

### Task 3: HTML Structure in `product.html`

**Files:**
- Modify: `themes/light-minimal/product.html:134-185`

**Interfaces:**
- Produces DOM containers:
  - `<div class="pdp-bundle-widget" id="pdpBundleWidget" hidden>` inside `.pdp__info`
  - `<section class="section pdp-ensemble" id="pdpEnsemble" aria-label="The Complete Ensemble" hidden>` directly before `#pdpRelated`

- [ ] **Step 1: Add `#pdpBundleWidget` inside `.pdp__info` and `#pdpEnsemble` before `#pdpRelated`**

In `themes/light-minimal/product.html`:
1. Below `.pdp__perks` (line 134), add:
```html
      <!-- Ensemble Upsell Compact Widget -->
      <section class="pdp-bundle-widget" id="pdpBundleWidget" aria-label="Ensemble Offer" hidden></section>
```
2. Below `.pdp-standards` section (line 171) and above `#pdpRelated`, add:
```html
  <!-- The Complete Ensemble Showcase Section -->
  <section class="section pdp-ensemble" id="pdpEnsemble" aria-label="The Complete Ensemble" hidden>
    <div class="pdp-ensemble__header">
      <p class="section-tag" id="ensembleEyebrow">Curated Syndicate &middot; Synergistic Disciplines</p>
      <h2 class="preview__heading" id="ensembleTitle">The Complete Ensemble</h2>
      <p class="preview__lead" id="ensembleLead"></p>
    </div>
    <div class="pdp-ensemble__grid" id="ensembleGrid"></div>
    <div class="pdp-ensemble__footer" id="ensembleFooter"></div>
  </section>
```

- [ ] **Step 2: Run markup tests to ensure no regressions**

Run: `node --test themes/light-minimal/assets/markup.test.mjs`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add themes/light-minimal/product.html
git commit -m "feat(light-minimal): add DOM containers for upsell widget and ensemble section"
```

---

### Task 4: Dynamic Wiring & Cart Integration in `product.js`

**Files:**
- Modify: `themes/light-minimal/assets/product.js`

**Interfaces:**
- Consumes: `resolveUpsellBundle`, `calculateBundlePricing` from `./upsell.mjs`
- Consumes: `cartApi.addItem` from `mountCartUI`
- Produces: Complete interactive sync between Compact Widget, Showcase Section, and Cart Drawer.

- [ ] **Step 1: Import upsell functions in `product.js`**

```javascript
import { resolveUpsellBundle, calculateBundlePricing } from './upsell.mjs'
```

- [ ] **Step 2: Implement `mountEnsembleUI({ currentProduct, allProducts, cartApi })` in `product.js`**

Implement state management, render functions for both widget & showcase section, sync event handlers, and bundle add-to-cart handler.

- [ ] **Step 3: Call `mountEnsembleUI` in `init()`**

Wire up within `init()` function of `product.js` after `cartApi` is mounted.

- [ ] **Step 4: Test in browser/Node test suite**

Verify tests pass:
Run: `node --test themes/light-minimal/assets/*.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add themes/light-minimal/assets/product.js
git commit -m "feat(light-minimal): wire upsell ensemble UI, sync state and connect to cart"
```

---

### Task 5: End-to-End Verification & Edge-Case Validation

**Files:**
- Test: `themes/light-minimal/assets/upsell.test.mjs`
- Test: `themes/light-minimal/assets/markup.test.mjs`

- [ ] **Step 1: Add edge-case test suite to `upsell.test.mjs`**

Test single-item clubs (Detroit Lions), teams with full outfits (Philadelphia Eagles), variant price calculations, and `NO_SWAP` compliance.

- [ ] **Step 2: Run full test suite across the workspace**

Run: `node --test themes/light-minimal/assets/*.test.mjs`  
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add themes/light-minimal/assets/upsell.test.mjs
git commit -m "test(light-minimal): add comprehensive edge-case tests for upsell ensemble"
```
