# Design Specification: Header Border, The Pair Option & Collector Reflections Carousel

**Date**: 2026-09-29  
**Status**: Approved  
**Scope**: `demo/index.html`, `demo/assets/components.css`, `demo/assets/main.js`, `demo/product.html`, `demo/assets/product.js`

---

## 1. Problem Statement & User Requirements

1. **Header Border-Bottom**:
   - The site header currently shows subtle or prominent bottom borders across different states (`.site-header`, `.site-header-wrapper`, `.site-header-wrapper.is-scrolled`), creating a visible dividing line beneath the navigation bar.
   - Requirement: Remove the `border-bottom` entirely across all header wrapper and header states.

2. **The Pairing Concept Clarification**:
   - Currently, the promo section presents "The Pairing of Two Shadows" as a bundle of two specific distinct tumbler designs (Lunar Ornament + Beauty In The End).
   - Requirement: "The Pairing" is **not** a bundle of 2 specific different products; it is a volume/tier purchase option where buying any 2 tumblers qualifies for a discounted price of **$89.95** (saving $9.95 from $99.90, plus complimentary shipping and archival vault packaging).
   - Implementation scope:
     - Update the homepage promo section to clearly articulate this tier offer ("The Collector's Pair Option" / "Pair Any Two Vessels").
     - On the Product Detail Page (`product.html` / `product.js`) for tumblers, provide a Tier/Quantity Option selector:
       - Single Vessel ($49.95)
       - The Pair Option (2 Vessels — $89.95, Save $9.95 + Free Transit)

3. **Collector Reflections Carousel (10 Items)**:
   - Currently, the section is a static 3-card grid.
   - Requirement: Convert into a full carousel with:
     - Exactly 10 curated collector reviews representing different product disciplines.
     - 3 cards visible on desktop, 1 card on mobile.
     - Smooth horizontal sliding transition.
     - Navigation arrow controls (Previous `‹` and Next `›` with gold foil accents).
     - 10 indicator dots below the track with active slide highlighting.
     - Touch/swipe support on mobile and pause-on-hover behavior.

---

## 2. Technical Architecture & Modifications

### 2.1. Header Border Removal
- **File**: `demo/assets/components.css`
  - In `.site-header`: remove `border-bottom: 1px solid var(--border);` or set `border-bottom: none;`.
  - In `.site-header-wrapper .site-header`: remove `border-bottom: 1px solid rgba(201, 162, 39, 0.15);` or set `border-bottom: none;`.
  - In `.site-header-wrapper.is-scrolled`: remove `border-bottom: 1px solid var(--border);` or set `border-bottom: none;`.
  - Preserve `box-shadow` and `backdrop-filter` for glassmorphic depth on scroll without the dividing border line.

### 2.2. The Pair Option Redesign
- **File**: `demo/index.html` (Promo Section)
  - Change Section heading to: `The Collector's ` + `<span class="gold-foil-text">Pair Option</span>`.
  - Change Section description: *"Acquire any two 40 oz Gilded Tumblers — twin editions or distinct releases — and unlock the paired allocation at $89.95 (save $9.95). Each vessel arrives sealed in archival packaging with complimentary express transit."*
  - Update preview callouts: Add visual badges `"Pair Any 2 Vessels · $89.95"` and clear CTA buttons (`Explore Tumblers to Pair ↓` and `Acquire The Pair — $89.95 ✦`).
- **File**: `demo/assets/main.js`
  - Ensure announcement and toast messages accurately reflect "Pair any 2 Editions".
- **File**: `demo/assets/product.js` & `demo/assets/components.css`
  - On Tumbler PDPs, inject a `.pdp__tier-select` element:
    - Option 1: Single Vessel (`$49.95`)
    - Option 2: The Pair (2 Vessels — `$89.95`, Save $9.95 + Free Shipping)
  - Dynamically recalculate displayed price and update the CTA button text:
    - Single: `Add to bag — $49.95`
    - Pair: `Add The Pair to Bag — $89.95 ✦`

### 2.3. Collector Reflections Carousel (10 Items)
- **Data (10 Reviews)**:
  1. *V. Hawthorne, Chicago* — Lunar Ornament Tumbler
  2. *M. Rousseau, Austin* — The Pair Option (2× Tumblers)
  3. *D. Sterling, Philadelphia* — Vegas Noir Leather Backpack
  4. *Elena Vance, Boston* — Beauty In The End Tumbler
  5. *Julian C., San Francisco* — Crest & Laurel Artisan Runners
  6. *Marcus Ward, Seattle* — Gold Crown Vintage Structured Cap
  7. *A. Montgomery, London* — Coiled Ornament Tumbler
  8. *R. Blackwood, New York* — Dallas Gilded Holiday Edition Tumbler
  9. *Clara Fontaine, Montreal* — Heraldic Vault Carrier Backpack
  10. *S. Kensington, Denver* — Blood, Beauty, Forever Tumbler
- **Markup & Layout**: `demo/index.html`
  - Replace `.reviews-grid` with `.reviews-carousel` containing:
    - `.reviews-carousel__viewport`
    - `.reviews-carousel__track` holding 10 `.review-card` articles
    - `.reviews-carousel__nav` with `.reviews-carousel__btn--prev` and `.reviews-carousel__btn--next`
    - `.reviews-carousel__dots` containing 10 dot buttons with `aria-label` and `aria-selected`
- **Styles**: `demo/assets/components.css`
  - Responsive track: flex container with CSS transform translation (`translateX(-${index * (100 / itemsPerView)}%)` or percentage offset based on card width + gap).
  - Navigation arrow buttons: circular buttons with dark glass background, gold border, hover glow, and accessible SVG/unicode arrow icons.
  - Dots: pill/circular indicators with smooth expansion and gold gradient background when active.
- **Logic**: `demo/assets/main.js`
  - `initReviewsCarousel()`:
    - Tracks `currentIndex` (0 to 7 on desktop where 3 cards are visible at once, or 0 to 9 with circular wrap).
    - Prev / Next button listeners.
    - Dot click listeners.
    - Touch swipe gesture detection.
    - Autoplay with pause-on-hover.

---

## 3. Verification & Acceptance Criteria
1. Header displays cleanly with no bottom borders either when transparent at top or when scrolled sticky.
2. Promo section states that any 2 tumblers can be paired for $89.95 (saving $9.95).
3. Product page for tumblers offers a clear toggle between Single Vessel ($49.95) and The Pair ($89.95).
4. Collector Reflections renders a carousel of 10 reviews with functioning previous/next arrows and 10 interactive indicator dots.
5. All interactive features work smoothly with keyboard navigation, touch events, and responsive screen sizes.
