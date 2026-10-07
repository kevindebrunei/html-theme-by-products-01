# PDP Upsell Ensemble ("Complete The Set") Design Spec

**Date:** 2026-10-07  
**Theme:** Light Minimal Luxury (Goldbourne & Co.)  
**Target Pages:** `themes/light-minimal/product.html`, `themes/light-minimal/assets/product.js`  
**Status:** Approved for Implementation Planning  

---

## 1. Executive Summary & Goals

This specification details the architecture, algorithmic matching engine, UI/UX components, cart integration, and testing strategy for the **PDP Upsell System ("The Complete Ensemble")** on the Goldbourne & Co. luxury storefront.

### Primary Goals
1. **Increase Average Order Value (AOV)** by encouraging multi-item purchases directly on the Product Detail Page (PDP).
2. **Drive Cross-Category Synergy** across the 4 primary disciplines: Shoes (Sneakers), Caps, Backpacks, and 40oz Tumblers.
3. **Offer High-Relevance Matching**:
   - **Priority 1 (Club Match):** Head-to-toe club loyalty packs (e.g. Philadelphia Eagles Shoes + Cap + Backpack).
   - **Priority 2 (Utility Match):** Daily carry routine pairs (Backpack + 40oz Tumbler).
   - **Priority 3 (Curated Fallback):** Vault-selected pairings from `CURATED` to ensure every product always has a complete 3-item ensemble.
4. **Offer a Clear 10% Bundle Discount Incentive**: When any companion item is bundled with the primary product, a 10% discount is applied to all selected items.
5. **Preserve Luxury Brand Identity**: Maintain the understated elegance, serif typography, refined gold accents, and white-glove tone of Goldbourne & Co.

---

## 2. Page Hierarchy & Placement

The PDP layout order is structured as follows:

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Wordmark, Nav, Cart Counter)                        │
├───────────────────────────────┬─────────────────────────────┤
│ PDP Stage & Gallery           │ Sticky Info Column          │
│ (High-res imagery)            │ - Tag, Title, Price, Hook   │
│                               │ - Discipline Provenance     │
│                               │ - Variants Selector         │
│                               │ - Qty + "Add to Selection"  │
│                               │ - Maison Client Promises    │
│                               │ [NEW] Compact Bundle Widget │
│                               │   (Checkboxes, 10% Off,     │
│                               │    "Add Ensemble", ↓ Link)  │
├───────────────────────────────┴─────────────────────────────┤
│ Dossier Tabs (Design Story, Details, Styling, Specs, Care)  │
├─────────────────────────────────────────────────────────────┤
│ Maison Standards Strip (§ 01, § 02, § 03)                   │
├─────────────────────────────────────────────────────────────┤
│ [NEW] The Complete Ensemble Showcase Section                │
│   (3-Column Luxury Cards, Sync Checkboxes, Full Add CTA)    │
├─────────────────────────────────────────────────────────────┤
│ Related Editions from the Archive (#pdpRelated)             │
│   (3 sister items in same category - lowest priority)       │
├─────────────────────────────────────────────────────────────┤
│ Footer & Cart Drawer                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Algorithmic Matching Engine (`upsell.mjs`)

A pure, side-effect-free JavaScript module testable via `node:test`.

### 3.1 Club & Theme Extraction (`extractClubOrTheme`)
* Truncates event suffixes (`-christmas`, `-halloween`) from product handles or directory names.
* Regex pattern: `/(?:backpack|cap|shoes|tumbler-40oz)-(?:nfl|mlb|nba|wwe)-([a-z0-9-]+?)-(?:bp|cap|snk|tum|\d)/`
* Fallback: Parses `images[0]` directory path segment (e.g., `NFL-%20Philadelphia-Eagles` -> `philadelphia-eagles`).

### 3.2 Matching Waterfall Hierarchy
Given `currentProduct` and `allProducts`:
1. **Tier 1 — Club / Team Match:**
   - Filter `allProducts` where `club === currentProduct.club` and `type !== currentProduct.type` and `sku !== currentProduct.sku`.
   - Pick up to 2 distinct product types (e.g. if viewing Shoes, pick 1 Cap and 1 Backpack).
2. **Tier 2 — Utility Pairing (Backpack + Tumbler):**
   - If bundle has `< 2` companion items:
     - If `currentProduct.type === 'Backpack'` and no Tumbler in bundle, find the best matching Tumbler (prioritizing same league or `CURATED`).
     - If `currentProduct.type === 'Tumbler'` and no Backpack in bundle, find the best matching Backpack.
3. **Tier 3 — Curated Vault Fallback:**
   - If bundle still has `< 2` items, fill remaining slots from the `CURATED` list (filtering out `currentProduct.sku`, picked SKUs, and preferring distinct types).

### 3.3 Output Data Contract
```js
{
  mainProduct: Object,               // The active PDP product
  companions: [                      // Exactly 2 companion products
    {
      product: Object,
      role: 'matching-club' | 'utility-pair' | 'curated-vault',
      badge: 'Matching Silhouette' | 'Complementary Carrier'
    },
    ...
  ],
  ensembleTitle: String,             // e.g. "The Philadelphia Eagles Ensemble"
  ensembleSubtitle: String,          // Styling & material cohesion statement
  discountPercent: 10                // Fixed at 10%
}
```

---

## 4. UI/UX Specifications

### 4.1 Compact Bundle Widget (Right-Hand Purchasing Column)
* **Location:** Directly beneath `.pdp__perks`.
* **Container:** `<section class="pdp-bundle-widget" id="pdpBundleWidget" aria-label="Ensemble Offer">`
* **Elements:**
  - **Eyebrow & Title:** `Curated Ensemble Offer` / `Complete The Set (10% Off)`
  - **Item Checklist:**
    - Item 1 (Current Product): Pre-checked, disabled checkbox (cannot uncheck), thumbnail, title, selected variant.
    - Items 2 & 3 (Companions): Active checkbox (checked by default), thumbnail, link, title, quick variant selector (if item has variants), original vs discounted price.
  - **Live Price Bar:**
    - Original Total: Strikethrough (e.g. `Was $179.85`)
    - Bundle Price: Prominent font (e.g. `$161.87`)
    - Badge: Gold badge `Save $17.98 (10% OFF)`
  - **Actions:**
    - Button: `Add Ensemble to Selection` (`btn btn--pdp-add`)
    - Anchor link: `Explore Full Ensemble Specs ↓` smooth-scrolling to `#pdpEnsemble`

### 4.2 The Complete Ensemble Showcase Section (Full-Width Bottom Section)
* **Location:** Inserted in `<main id="pdp">` between `.pdp-standards` and `#pdpRelated`.
* **Container:** `<section class="section pdp-ensemble" id="pdpEnsemble" aria-label="The Complete Ensemble">`
* **Elements:**
  - **Header:** Eyebrow `Synergistic Disciplines · Cohesive Ritual`, dynamic Heading (e.g. `The Philadelphia Eagles Matchday Ensemble`), and lead text.
  - **3-Card Luxury Grid:**
    - Card 1: Primary Edition (Current product).
    - Card 2 & 3: Companion Editions.
    - Features: High-resolution clean imagery (respecting `NO_SWAP`), discipline tag, title, variant selector, checkbox status indicator, and individual prices.
  - **Section Footer Summary:** Synchronized total price, savings pill, and large collective CTA button `Add Complete Ensemble to Selection (-10%)`.

### 4.3 Aesthetics & Styling Tokens
* Complies with `tokens.css`:
  - Backgrounds: `var(--bg)` (`#faf8f5`), cards `var(--surface)` (`#ffffff`).
  - Borders: `1px solid var(--border)` (`#e7e3dc`).
  - Typography: Playfair Display / Cormorant Garamond for titles, Outfit / Inter for uppercase label tags (`var(--font-sans)`).
  - Accents: Gold foil tone (`#9e7d3b` / `var(--gold)`) for savings tags and highlights.
  - Checkboxes: Custom minimal luxury styled checkboxes with clean borders and subtle check indicators.

---

## 5. Price Calculations & Cart Integration

### 5.1 Pricing Logic
* `DISCOUNT_RATE = 0.10`
* For any checked item:
  - If companion count checked `> 0`:
    `discountedPrice = Math.round(originalPrice * 0.90 * 100) / 100`
  - If only main product is checked:
    `discountedPrice = originalPrice` (No discount tag)
* Real-time calculation triggers on:
  - Checkbox toggle (companion 1 or 2).
  - Variant change (e.g. Backpack Size S -> M -> L updates baseline price from $49.95 to $59.95 to $69.95, recalculating 10% discount).

### 5.2 State Synchronization
* Shared in-memory state in `product.js`:
  ```js
  const ensembleState = {
    checked: { [sku]: Boolean },
    variants: { [sku]: variantValue }
  };
  ```
* Any change in either the Compact Widget or Showcase Section dispatches an update event that syncs the opposite component without page reload.

### 5.3 Cart Drawer Integration
* Clicking `Add Ensemble to Selection`:
  1. Gathers all checked items with their selected variants.
  2. For each checked item, invokes `cartApi.addItem({ ... })`:
     - `sku`: item.sku
     - `title`: item.title
     - `type`: item.type
     - `price`: discountedPrice
     - `compareAt`: originalPrice
     - `image`: item.images[0]
     - `variantValue`: selectedVariantValue
     - `quantity`: 1 (or current PDP quantity for the primary item)
  3. Opens the Cart Drawer smoothly (`cartDrawer.classList.add('is-open')`).
  4. Cart displays individual items with their discounted prices and an `Ensemble Deal (-10%)` badge.

---

## 6. Edge Cases & Robustness

1. **Single-Item Clubs (e.g. Detroit Lions Cap):** Gracefully falls back to Tier 2 and Tier 3 so 2 companions are always found. Never produces empty cards.
2. **Missing Variants:** Caps and Tumblers have fixed one-size formats; variant selectors only render for items with valid variants (Backpack, Shoes).
3. **Image Protection (`NO_SWAP`):** Respects existing `NO_SWAP` rule in `catalog.mjs` to prevent showing unverified secondary images with watermarks or fan-room backgrounds.
4. **All Companions Unchecked:** When only the main item is selected, button label changes to `Add to Selection`, strikethrough price hides, and discount pill is omitted.
5. **Null / Undefined Defenses:** All product fields (`variants`, `images`, `prices`, `title`) are protected with fallback guards.

---

## 7. Automated Testing Plan (`upsell.test.mjs`)

Executed with Node.js built-in test runner (`node --test`):
* `test('extractClubOrTheme returns base team slug without holiday suffixes')`
* `test('resolveUpsellBundle returns full 3-item kit for teams with 3+ types (e.g. Philadelphia Eagles)')`
* `test('resolveUpsellBundle pairs Backpack with Tumbler when club has partial types')`
* `test('resolveUpsellBundle uses Curated list when club has only 1 SKU (e.g. Detroit Lions)')`
* `test('calculateBundlePricing correctly calculates 10% discount and rounding')`
* `test('calculateBundlePricing reverts to normal price when only primary item is checked')`
