# Theme Light Minimal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng theme thứ hai `themes/light-minimal` — light mode, minimalism, cơ chế Passepartout — chạy song song với `themes/dark-maximalism`, cùng brand Goldbourne & Co., cùng nguồn dữ liệu `products/products.json`.

**Architecture:** HTML tĩnh + CSS thuần + ES module trong trình duyệt. Logic được tách làm ba lớp để test được mà không cần cài thêm gì: `catalog.mjs` (dữ liệu thuần — phân loại, lọc, đếm, format), `render.mjs` (hàm thuần trả chuỗi HTML), và `main.js` / `product.js` (chỉ wiring DOM). Hai lớp đầu test bằng `node:test` có sẵn trong Node. Màu sắc tập trung ở `tokens.css` và được một test tự động canh ngưỡng contrast.

**Tech Stack:** HTML5 · CSS custom properties · ES modules · `node:test` (built-in, Node v22.20.0) · không có package.json, không có dependency ngoài.

**Spec:** `docs/superpowers/specs/2026-10-01-light-minimal-theme-design.md`

## Global Constraints

Áp cho mọi task. Giá trị chép nguyên văn từ spec.

- **Token màu — chỉ sáu, không hơn:** `--bg: #F6F1E7` · `--fg: #14120E` · `--muted: #6B6151` · `--accent: #7A5F18` · `--accent-fg: #FFFFFF` · `--border: #8A7C62`
- **Cấm token `--surface`.** `#FFFFFF` trên `#F6F1E7` chỉ đạt 1.13:1 (spec §5.1)
- **Cấm mã màu `#C9A227` ở mọi file của theme này.** Nó chỉ đạt 2.15:1 trên nền kem (spec §5.1)
- **Cấm `box-shadow`** — Minimalism & Swiss quy định `--shadow: none` (spec §5.1)
- **`border-radius: 0`** toàn theme (spec §5.2)
- **Cấm `scrim`** — lề passepartout đã tách chữ khỏi ảnh; scrim là cơ chế của theme dark (spec §5.2)
- **Lề passepartout:** 32px ở lưới, 64px ở hero, sàn tuyệt đối 16px (spec §5.2)
- **Lưới:** ≥1280px → 3 cột / lề 32px · 768–1279px → 2 cột / lề 24px · <768px → 1 cột / lề 16px. Gutter 48 / 32 / 24px (spec §5.3)
- **Type scale:** 12 · 14 · 16 · 18 · 24 · 32, cộng 48 và 64 cho H1 hero (spec §5.4)
- **Font:** Cormorant Garamond **400** cho h1/h2, **600** chỉ cho wordmark; Inter 400/500 cho mọi thứ còn lại (spec §5.4)
- **Motion tier Subtle:** opacity + dịch `y` 12px, 300–400ms, easing `power1.out`. Bắt buộc có nhánh `prefers-reduced-motion` render thẳng trạng thái cuối (spec §5.5)
- **Tagline H1 hero:** `Team identity, rewritten in the language of a fashion house.` Dòng phụ: `Gilded on every side.` (spec §4)
- **Ranh giới IP:** nav, facet, URL collection, tagline, alt text **không được chứa tên giải hay tên đội đầy đủ**. Alt lấy từ trường `title` (đã viết tắt `DAL`, `PHI`, `KC`, `SF`), **không** lấy từ `seoTitle` (spec §6, §8.2)
- **Bộ chặn copy** — không xuất hiện ở bất kỳ đâu kể cả `alt`, `meta`, `title`: `official` · `officially licensed` · `licensed` · `authentic` · `genuine` · tên cầu thủ · `amazing` · `must-have` · `perfect gift for any fan`
- **Lệnh chạy test:** `node --test <đường-dẫn-file-test>`. **Truyền thư mục sẽ lỗi `MODULE_NOT_FOUND`** trên Node 22 — luôn chỉ đích danh file.
- **Repo chưa khởi tạo git.** Mỗi task kết thúc bằng một bước commit. Nếu muốn giữ lịch sử, chạy `git init` một lần trước Task 1; nếu không, bỏ qua các bước commit và vẫn hoàn thành phần còn lại của task.

### Ngoài phạm vi plan này

- **`srcset` nhiều kích thước ảnh.** Spec §9 yêu cầu, nhưng kho chỉ có một kích thước 1264×1264 và máy không có công cụ resize (không có `node_modules`, không có `sharp`). Plan dùng `sizes` + `width`/`height` + `loading="lazy"` để tránh layout shift; sinh ảnh nhiều kích thước là việc riêng.
- **Quét watermark `AURA TUMBLER`** (spec §8.1) — cần OCR, chưa cài.
- **Năm gap dữ liệu** ở spec §8.3 (SEO Description, Product Details cho tumbler, Vendor, host ảnh) — việc content, không phải theme. Task 5 có nhánh xử lý khi dữ liệu thiếu để theme không vỡ.

---

### Task 1: `catalog.mjs` — phân loại style family và facet

**Files:**
- Create: `themes/light-minimal/assets/catalog.mjs`
- Test: `themes/light-minimal/assets/catalog.test.mjs`

**Interfaces:**
- Consumes: hình dạng record trong `products/products.json` — các trường dùng tới: `type`, `season`, `title`, `sku`, `price`, `compareAt`, `variants[].price`, `images[]`
- Produces: `STYLE_FAMILY`, `deriveStyleFamily(product)`, `displayFamily(family)`, `TYPE_ORDER`, `TYPE_LABEL`, `byType(products, type)`, `facetCounts(products)`, `shouldRenderFacets(products)`, `formatPrice(n)`, `priceLabel(product)`

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/catalog.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STYLE_FAMILY, deriveStyleFamily, displayFamily,
  byType, facetCounts, shouldRenderFacets, formatPrice, priceLabel,
} from './catalog.mjs'

const tumblerHalloween = { type: 'Tumbler', season: 'Halloween', title: 'PIT Regalia - Gilded Ornament' }
const tumblerChristmas = { type: 'Tumbler', season: 'Christmas', title: 'CHC Holiday Wrap' }
const cap = { type: 'Cap', season: 'Year-round', title: 'GB Heritage Crest' }
const shoes = { type: 'Shoes', season: 'Year-round', title: 'SF Heritage - Crimson, Cream and Gold' }
const bpHeritage = { type: 'Backpack', season: 'Year-round', title: 'DAL Star Club - Ivory and Navy Heritage Backpack' }
const bpDrip = { type: 'Backpack', season: 'Year-round', title: 'PHI Gold Drip - Crowned Eagle Graphic Backpack' }
const bpGraffiti = { type: 'Backpack', season: 'Year-round', title: 'PIT Gold Script - Graffiti Crown Backpack in Black and Gold' }

test('deriveStyleFamily: tumbler Halloween là Gothic Jewel', () => {
  assert.equal(deriveStyleFamily(tumblerHalloween), STYLE_FAMILY.GOTHIC)
})

test('deriveStyleFamily: tumbler Christmas là Holiday Ornament', () => {
  assert.equal(deriveStyleFamily(tumblerChristmas), STYLE_FAMILY.HOLIDAY)
})

test('deriveStyleFamily: cap và shoes luôn là Heritage Crest', () => {
  assert.equal(deriveStyleFamily(cap), STYLE_FAMILY.HERITAGE)
  assert.equal(deriveStyleFamily(shoes), STYLE_FAMILY.HERITAGE)
})

test('deriveStyleFamily: backpack có drip hoặc graffiti trong title là Gold Drip', () => {
  assert.equal(deriveStyleFamily(bpDrip), STYLE_FAMILY.GOLD_DRIP)
  assert.equal(deriveStyleFamily(bpGraffiti), STYLE_FAMILY.GOLD_DRIP)
})

test('deriveStyleFamily: backpack còn lại là Heritage Crest', () => {
  assert.equal(deriveStyleFamily(bpHeritage), STYLE_FAMILY.HERITAGE)
})

test('deriveStyleFamily: từ khoá drip chỉ áp cho backpack, không áp cho tumbler', () => {
  const tum = { type: 'Tumbler', season: 'Halloween', title: 'Gold Drip Gothic Tumbler' }
  assert.equal(deriveStyleFamily(tum), STYLE_FAMILY.GOTHIC)
})

test('displayFamily: Gold Drip gộp vào Heritage Crest ở lớp hiển thị', () => {
  assert.equal(displayFamily(STYLE_FAMILY.GOLD_DRIP), STYLE_FAMILY.HERITAGE)
  assert.equal(displayFamily(STYLE_FAMILY.GOTHIC), STYLE_FAMILY.GOTHIC)
})

test('byType: lọc đúng dòng sản phẩm', () => {
  const all = [tumblerHalloween, cap, bpDrip]
  assert.deepEqual(byType(all, 'Cap'), [cap])
})

test('facetCounts: đếm theo họ hiển thị, Gold Drip cộng vào Heritage', () => {
  const counts = facetCounts([bpHeritage, bpDrip, bpGraffiti])
  assert.equal(counts.get(STYLE_FAMILY.HERITAGE), 3)
  assert.equal(counts.has(STYLE_FAMILY.GOLD_DRIP), false)
})

test('facetCounts: tumbler tách hai họ', () => {
  const counts = facetCounts([tumblerHalloween, tumblerHalloween, tumblerChristmas])
  assert.equal(counts.get(STYLE_FAMILY.GOTHIC), 2)
  assert.equal(counts.get(STYLE_FAMILY.HOLIDAY), 1)
})

test('shouldRenderFacets: chỉ render khi có từ 2 họ trở lên', () => {
  assert.equal(shouldRenderFacets([tumblerHalloween, tumblerChristmas]), true)
  assert.equal(shouldRenderFacets([cap, cap]), false)
  assert.equal(shouldRenderFacets([bpHeritage, bpDrip]), false)
})

test('formatPrice: hai chữ số thập phân, null trả chuỗi rỗng', () => {
  assert.equal(formatPrice(49.95), '$49.95')
  assert.equal(formatPrice(40), '$40.00')
  assert.equal(formatPrice(null), '')
})

test('priceLabel: nhiều mức giá thì hiện from + giá thấp nhất', () => {
  const bp = { price: 49.95, variants: [{ price: 49.95 }, { price: 59.95 }, { price: 69.95 }] }
  assert.equal(priceLabel(bp), 'from $49.95')
})

test('priceLabel: một mức giá thì hiện thẳng', () => {
  const tum = { price: 49.95, variants: [{ price: 49.95 }] }
  assert.equal(priceLabel(tum), '$49.95')
})

test('priceLabel: không có variants thì rơi về trường price', () => {
  assert.equal(priceLabel({ price: 39.95 }), '$39.95')
})
```

- [ ] **Step 2: Chạy test để xác nhận nó fail**

Run: `node --test themes/light-minimal/assets/catalog.test.mjs`
Expected: FAIL — `Cannot find module './catalog.mjs'`

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `themes/light-minimal/assets/catalog.mjs`:

```js
/*
  catalog.mjs — logic thuần của catalog light-minimal.
  Không chạm DOM, không fetch. Mọi thứ ở đây test được bằng node:test.
*/

export const STYLE_FAMILY = {
  GOTHIC: 'Gothic Jewel',
  HOLIDAY: 'Holiday Ornament',
  HERITAGE: 'Heritage Crest',
  GOLD_DRIP: 'Gold Drip',
}

/* Đúng 3 backpack mang hai từ này: PHI, PIT, SF (spec §2.1). */
const DRIP_WORDS = ['drip', 'graffiti']

export function deriveStyleFamily(product) {
  if (product.type === 'Tumbler') {
    return product.season === 'Christmas' ? STYLE_FAMILY.HOLIDAY : STYLE_FAMILY.GOTHIC
  }
  if (product.type === 'Backpack') {
    const title = String(product.title ?? '').toLowerCase()
    if (DRIP_WORDS.some((w) => title.includes(w))) return STYLE_FAMILY.GOLD_DRIP
  }
  return STYLE_FAMILY.HERITAGE
}

/* Gold Drip chỉ có 3 SKU — quá mỏng để đứng riêng ở mặt tiền (spec §2.2). */
export function displayFamily(family) {
  return family === STYLE_FAMILY.GOLD_DRIP ? STYLE_FAMILY.HERITAGE : family
}

export const TYPE_ORDER = ['Tumbler', 'Cap', 'Backpack', 'Shoes']
export const TYPE_LABEL = { Tumbler: 'Tumblers', Cap: 'Caps', Backpack: 'Backpacks', Shoes: 'Shoes' }

export function byType(products, type) {
  return products.filter((p) => p.type === type)
}

export function facetCounts(products) {
  const counts = new Map()
  for (const p of products) {
    const f = displayFamily(deriveStyleFamily(p))
    counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return counts
}

/* Caps / Backpacks / Shoes đều một họ → không render facet (spec §6). */
export function shouldRenderFacets(products) {
  return facetCounts(products).size > 1
}

export function formatPrice(n) {
  return n == null ? '' : '$' + Number(n).toFixed(2)
}

export function priceLabel(product) {
  const prices = [...new Set((product.variants ?? []).map((v) => v.price))]
  if (prices.length > 1) return `from ${formatPrice(Math.min(...prices))}`
  return formatPrice(prices[0] ?? product.price)
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `node --test themes/light-minimal/assets/catalog.test.mjs`
Expected: PASS — 15 tests, 0 fail

- [ ] **Step 5: Kiểm tra trên dữ liệu thật**

Run:
```bash
node -e "(async () => {
  const fs = require('node:fs');
  const m = await import('./themes/light-minimal/assets/catalog.mjs');
  const { products } = JSON.parse(fs.readFileSync('products/products.json','utf8'));
  console.log(Object.fromEntries(m.facetCounts(products)));
  console.log('Gold Drip thô:', products.filter(p => m.deriveStyleFamily(p) === m.STYLE_FAMILY.GOLD_DRIP).length);
})()"
```
Expected: `{ 'Gothic Jewel': 33, 'Holiday Ornament': 10, 'Heritage Crest': 22 }` và `Gold Drip thô: 3`. Nếu lệch, dừng lại — quy tắc phân loại sai chứ không phải dữ liệu sai.

- [ ] **Step 6: Commit**

```bash
git add themes/light-minimal/assets/catalog.mjs themes/light-minimal/assets/catalog.test.mjs
git commit -m "feat(light-minimal): phân loại style family và facet"
```

---

### Task 2: `tokens.css` + `base.css` + test canh contrast

**Files:**
- Create: `themes/light-minimal/assets/tokens.css`
- Create: `themes/light-minimal/assets/base.css`
- Test: `themes/light-minimal/assets/tokens.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces: CSS custom properties `--bg --fg --muted --accent --accent-fg --border --font-heading --font-body --fs-1..--fs-8 --space-1..--space-6 --mat --mat-hero --radius --maxw --dur --ease`; class tiện ích `.wrap` `.section` `.label` `.muted` `.visually-hidden`

Test ở task này không kiểm hình thức — nó canh những quyết định mà spec §5.1 đã trả giá để tìm ra. Ai đó đổi `--border` về màu brand nhạt hơn, test sẽ đỏ.

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/tokens.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS = readFileSync(join(HERE, 'tokens.css'), 'utf8')

function token(name) {
  const m = CSS.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`))
  assert.ok(m, `Không tìm thấy token --${name} trong tokens.css`)
  return m[1]
}

function luminance(hex) {
  const parts = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = parts.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('contrast: chữ chính đạt AAA trên nền', () => {
  assert.ok(contrast(token('fg'), token('bg')) >= 7,
    `--fg chỉ đạt ${contrast(token('fg'), token('bg')).toFixed(2)}:1`)
})

test('contrast: chữ phụ đạt AA', () => {
  assert.ok(contrast(token('muted'), token('bg')) >= 4.5,
    `--muted chỉ đạt ${contrast(token('muted'), token('bg')).toFixed(2)}:1`)
})

test('contrast: accent đạt AA trên nền', () => {
  assert.ok(contrast(token('accent'), token('bg')) >= 4.5,
    `--accent chỉ đạt ${contrast(token('accent'), token('bg')).toFixed(2)}:1`)
})

test('contrast: chữ trên nền accent đạt AA', () => {
  assert.ok(contrast(token('accent-fg'), token('accent')) >= 4.5)
})

/*
  Viền là cơ chế DUY NHẤT tách ảnh khỏi nền ở theme này.
  Ảnh cap nền marble #F0E8DC chỉ đạt 1.08:1 so với nền kem (spec §5.1).
*/
test('contrast: viền đạt ngưỡng non-text 3:1', () => {
  assert.ok(contrast(token('border'), token('bg')) >= 3,
    `--border chỉ đạt ${contrast(token('border'), token('bg')).toFixed(2)}:1 — ảnh nền sáng sẽ tan vào trang`)
})

test('không có token --surface: trắng trên kem chỉ 1.13:1 (spec §5.1)', () => {
  assert.equal(/--surface\s*:/.test(CSS), false)
})

test('không dùng vàng brand #C9A227: chỉ 2.15:1 trên nền kem (spec §5.1)', () => {
  assert.equal(/#C9A227/i.test(CSS), false)
})

test('bo góc bằng 0 theo Minimalism & Swiss (spec §5.2)', () => {
  const m = CSS.match(/--radius:\s*([^;]+);/)
  assert.ok(m, 'Không tìm thấy --radius')
  assert.match(m[1].trim(), /^0(px|rem)?$/)
})
```

- [ ] **Step 2: Chạy test để xác nhận nó fail**

Run: `node --test themes/light-minimal/assets/tokens.test.mjs`
Expected: FAIL — `ENOENT: no such file or directory ... tokens.css`

- [ ] **Step 3: Viết `tokens.css`**

```css
/*
  Nơi DUY NHẤT chứa mã màu của theme light-minimal.
  Mọi con số contrast dưới đây đã đo và được tokens.test.mjs canh lại.
  Theme này KHÔNG có dark mode — themes/dark-maximalism giữ vai đó.
*/
:root {
  --bg: #F6F1E7;          /* kem ấm — trắng tinh làm vàng kim ngả xám */
  --fg: #14120E;          /* 16.62:1 trên --bg — AAA */
  --muted: #6B6151;       /* 5.40:1 — AA */
  --accent: #7A5F18;      /* 5.36:1 — AA. Vàng brand gốc chỉ 2.15:1 trên nền kem, không dùng được */
  --accent-fg: #FFFFFF;   /* 6.04:1 trên --accent */
  --border: #8A7C62;      /* 3.63:1 — viền là chức năng, không phải trang trí */

  /* KHÔNG có --surface. #FFFFFF trên --bg chỉ 1.13:1 → mặt card vô hình. */

  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  /* Type scale 12/14/16/18/24/32 + 48/64 hero */
  --fs-1: 0.75rem;
  --fs-2: 0.875rem;
  --fs-3: 1rem;
  --fs-4: 1.125rem;
  --fs-5: 1.5rem;
  --fs-6: 2rem;
  --fs-7: 3rem;
  --fs-8: 4rem;

  /* Spacing spacious */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
  --space-6: 6rem;

  /* Passepartout */
  --mat: 2rem;            /* 32px — lề ở lưới sản phẩm */
  --mat-hero: 4rem;       /* 64px — lề ở hero */
  --radius: 0;
  --maxw: 1200px;

  --dur: 350ms;
  --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* xấp xỉ power1.out */
}
```

- [ ] **Step 4: Viết `base.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

html { scroll-behavior: smooth; scroll-padding-top: 72px; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-weight: 400;
  font-size: var(--fs-3);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Cormorant 400 — trên nền kem không cần 600 như theme dark (spec §5.4) */
h1, h2, blockquote {
  font-family: var(--font-heading);
  font-weight: 400;
  line-height: 1.2;
  margin: 0;
}

h1 { font-size: clamp(var(--fs-7), 5vw, var(--fs-8)); }
h2 { font-size: clamp(var(--fs-6), 3vw, var(--fs-7)); }

/* Wordmark là ngoại lệ duy nhất dùng weight 600 */
.wordmark {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: var(--fs-5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}

h3 {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-3);
  margin: 0;
}

p { margin: 0 0 var(--space-2); }

a { color: inherit; text-decoration: none; }
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

img { display: block; max-width: 100%; }

.wrap { max-width: var(--maxw); margin-inline: auto; padding-inline: var(--space-3); }
.section { padding-block: var(--space-6); }

/* Nhãn dòng sản phẩm và họ style — Inter 500, không dùng Cormorant (spec §5.4) */
.label {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.muted { color: var(--muted); }

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}

/* Motion tier Subtle (spec §5.5) */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.reveal.is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `node --test themes/light-minimal/assets/tokens.test.mjs`
Expected: PASS — 8 tests, 0 fail

- [ ] **Step 6: Commit**

```bash
git add themes/light-minimal/assets/tokens.css themes/light-minimal/assets/base.css themes/light-minimal/assets/tokens.test.mjs
git commit -m "feat(light-minimal): token màu đã canh contrast và lớp base"
```

---

### Task 3: `render.mjs` — thẻ sản phẩm Passepartout

**Files:**
- Create: `themes/light-minimal/assets/render.mjs`
- Create: `themes/light-minimal/assets/components.css`
- Test: `themes/light-minimal/assets/render.test.mjs`

**Interfaces:**
- Consumes: từ Task 1 — `TYPE_LABEL`, `formatPrice`, `priceLabel`, `deriveStyleFamily`, `displayFamily`
- Produces: `escapeHtml(s)`, `ALT_SUFFIX`, `imageAlt(product, index)`, `cardHtml(product)`, `facetBarHtml(counts, active)`

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/render.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, imageAlt, cardHtml, facetBarHtml } from './render.mjs'
import { STYLE_FAMILY } from './catalog.mjs'

const product = {
  sku: 'TUM-20260923-UY-009',
  title: 'PIT Regalia - Gilded Ornament, Crown and Quiet Shadow',
  seoTitle: 'Steelers Tumbler - Gold Baroque Skull Crown Design',
  type: 'Tumbler',
  season: 'Halloween',
  price: 49.95,
  compareAt: 59.95,
  variants: [{ value: null, price: 49.95, compareAt: 59.95 }],
  images: ['/products/a/01.webp', '/products/a/02.webp'],
}

test('escapeHtml: chặn ký tự phá markup', () => {
  assert.equal(escapeHtml('a & b <c> "d"'), 'a &amp; b &lt;c&gt; &quot;d&quot;')
  assert.equal(escapeHtml(null), '')
})

test('imageAlt: hậu tố khác nhau theo vị trí ảnh (spec §8.3)', () => {
  assert.equal(imageAlt(product, 0), `${product.title} - front`)
  assert.equal(imageAlt(product, 1), `${product.title} - detail`)
  assert.equal(imageAlt(product, 4), `${product.title} - in use`)
})

test('imageAlt: vị trí ngoài danh sách vẫn trả hậu tố hợp lệ', () => {
  assert.equal(imageAlt(product, 9), `${product.title} - view`)
})

test('imageAlt: dùng title viết tắt, KHÔNG dùng seoTitle có tên đội đầy đủ', () => {
  const alt = imageAlt(product, 0)
  assert.ok(alt.includes('PIT'))
  assert.equal(alt.includes('Steelers'), false)
})

test('cardHtml: có lề passepartout, không có scrim', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('card__mat'))
  assert.equal(html.includes('scrim'), false)
})

test('cardHtml: nhãn ghi dòng sản phẩm và họ style, không ghi tên giải', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('Tumblers'))
  assert.ok(html.includes(STYLE_FAMILY.GOTHIC))
  assert.equal(/\bNFL\b/.test(html), false)
})

test('cardHtml: link trỏ PDP kèm sku đã encode', () => {
  assert.ok(cardHtml(product).includes('product.html?sku=TUM-20260923-UY-009'))
})

test('cardHtml: có width/height để tránh layout shift', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('width="1264"'))
  assert.ok(html.includes('height="1264"'))
  assert.ok(html.includes('loading="lazy"'))
})

test('cardHtml: giá và giá gạch', () => {
  const html = cardHtml(product)
  assert.ok(html.includes('$49.95'))
  assert.ok(html.includes('$59.95'))
})

test('cardHtml: backpack nhiều variant hiện from, không hiện giá gạch', () => {
  const bp = {
    sku: 'BP-1', title: 'DAL Star Club', type: 'Backpack', season: 'Year-round',
    price: 49.95, compareAt: 59.95,
    variants: [{ price: 49.95 }, { price: 59.95 }, { price: 69.95 }],
    images: ['/x/01.webp'],
  }
  const html = cardHtml(bp)
  assert.ok(html.includes('from $49.95'))
  assert.equal(html.includes('price__was'), false)
})

test('cardHtml: thiếu ảnh thì không sinh src rỗng gây request thừa', () => {
  const noImg = { ...product, images: [] }
  assert.equal(/src=""/.test(cardHtml(noImg)), false)
})

test('cardHtml: title có ký tự đặc biệt được escape', () => {
  const odd = { ...product, title: 'Beauty & "The End"' }
  const html = cardHtml(odd)
  assert.ok(html.includes('Beauty &amp; &quot;The End&quot;'))
})

test('facetBarHtml: render một nút cho mỗi họ, đánh dấu nút đang chọn', () => {
  const counts = new Map([[STYLE_FAMILY.GOTHIC, 33], [STYLE_FAMILY.HOLIDAY, 10]])
  const html = facetBarHtml(counts, STYLE_FAMILY.HOLIDAY)
  assert.ok(html.includes('All 43'))
  assert.ok(html.includes('Gothic Jewel 33'))
  assert.ok(html.includes('Holiday Ornament 10'))
  assert.ok(html.includes('aria-pressed="true"'))
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1)
})

test('facetBarHtml: không truyền họ đang chọn thì All được chọn', () => {
  const counts = new Map([[STYLE_FAMILY.GOTHIC, 33], [STYLE_FAMILY.HOLIDAY, 10]])
  const html = facetBarHtml(counts, null)
  assert.match(html, /data-family=""[^>]*aria-pressed="true"/)
})
```

- [ ] **Step 2: Chạy test để xác nhận nó fail**

Run: `node --test themes/light-minimal/assets/render.test.mjs`
Expected: FAIL — `Cannot find module './render.mjs'`

- [ ] **Step 3: Viết `render.mjs`**

```js
/*
  render.mjs — hàm thuần trả chuỗi HTML. Không chạm DOM.
  Tách khỏi main.js để test được bằng node:test mà không cần jsdom.
*/
import { TYPE_LABEL, formatPrice, priceLabel, deriveStyleFamily, displayFamily } from './catalog.mjs'

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* Hậu tố theo vị trí ảnh — sửa lỗi 324 alt trùng lặp (spec §8.3). */
export const ALT_SUFFIX = ['front', 'detail', 'back', 'scale', 'in use']

/*
  Alt lấy từ `title` (viết tắt DAL/PHI/KC/SF), KHÔNG lấy từ `seoTitle`
  vốn mang tên đội đầy đủ — ranh giới IP ở spec §6.
*/
export function imageAlt(product, index) {
  return `${product.title ?? ''} - ${ALT_SUFFIX[index] ?? 'view'}`
}

export function cardHtml(product) {
  const img = product.images?.[0]
  const family = displayFamily(deriveStyleFamily(product))
  const typeLabel = TYPE_LABEL[product.type] ?? product.type ?? ''
  const multiPrice = new Set((product.variants ?? []).map((v) => v.price)).size > 1
  const was = !multiPrice && product.compareAt
    ? `<s class="price__was">${formatPrice(product.compareAt)}</s>`
    : ''
  const media = img
    ? `<img class="card__img" src="${escapeHtml(img)}" alt="${escapeHtml(imageAlt(product, 0))}"
           loading="lazy" decoding="async" width="1264" height="1264"
           sizes="(min-width:1280px) 352px, (min-width:768px) 45vw, 90vw">`
    : `<div class="card__img card__img--empty" role="presentation"></div>`

  return `
    <a class="card reveal" href="product.html?sku=${encodeURIComponent(product.sku ?? '')}">
      <div class="card__mat">${media}</div>
      <p class="card__meta label muted">${escapeHtml(typeLabel)} · ${escapeHtml(family)}</p>
      <h3 class="card__title">${escapeHtml(product.title)}</h3>
      <p class="card__price">${priceLabel(product)}${was}</p>
    </a>`
}

export function facetBarHtml(counts, active = null) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const btn = (label, n, value) => {
    const on = (value ?? '') === (active ?? '')
    return `<button type="button" class="facet${on ? ' is-active' : ''}" data-family="${escapeHtml(value ?? '')}" aria-pressed="${on}">${escapeHtml(label)} ${n}</button>`
  }
  const items = [btn('All', total, null)]
  for (const [family, n] of counts) items.push(btn(family, n, family))
  return items.join('')
}
```

- [ ] **Step 4: Viết `components.css`**

```css
/* ---- Lưới sản phẩm (spec §5.3) ---- */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
}

@media (min-width: 1280px) {
  .grid { grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
}

/* ---- Thẻ Passepartout (spec §5.2) ---- */
.card { display: block; color: inherit; }

/*
  Lề là chính cơ chế. Khi hẹp, giảm số cột trước rồi mới giảm lề;
  sàn tuyệt đối 16px.
*/
.card__mat {
  padding: 1rem;
  background: var(--bg);
}

@media (min-width: 768px)  { .card__mat { padding: 1.5rem; } }
@media (min-width: 1280px) { .card__mat { padding: var(--mat); } }

.card__img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--border);   /* cơ chế DUY NHẤT tách ảnh khỏi nền */
  border-radius: var(--radius);
}

.card__img--empty { background: var(--bg); }

.card__meta { margin: 0 0 var(--space-1); }

.card__title {
  margin: 0 0 var(--space-1);
  font-size: var(--fs-3);
  font-weight: 400;
  line-height: 1.4;
}

.card__price { margin: 0; font-size: var(--fs-2); }

.price__was {
  margin-left: var(--space-1);
  color: var(--muted);
  text-decoration: line-through;
}

.card:hover .card__img,
.card:focus-visible .card__img {
  border-color: var(--accent);
  transition: border-color var(--dur) var(--ease);
}

/* ---- Thanh facet (spec §6) ---- */
.facets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.facet {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
}

.facet.is-active {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}
```

- [ ] **Step 5: Chạy test để xác nhận pass**

Run: `node --test themes/light-minimal/assets/render.test.mjs`
Expected: PASS — 14 tests, 0 fail

- [ ] **Step 6: Chạy lại toàn bộ test của theme**

Run:
```bash
node --test themes/light-minimal/assets/catalog.test.mjs \
     themes/light-minimal/assets/tokens.test.mjs \
     themes/light-minimal/assets/render.test.mjs
```
Expected: PASS — 37 tests, 0 fail

- [ ] **Step 7: Commit**

```bash
git add themes/light-minimal/assets/render.mjs themes/light-minimal/assets/render.test.mjs themes/light-minimal/assets/components.css
git commit -m "feat(light-minimal): thẻ Passepartout và thanh facet"
```

---

### Task 4: `index.html` + `main.js` — lưới, facet, announcement

**Files:**
- Create: `themes/light-minimal/index.html`
- Create: `themes/light-minimal/assets/main.js`
- Modify: `themes/light-minimal/assets/components.css` (thêm phần header, announcement, footer, hero ở cuối file)

**Interfaces:**
- Consumes: từ Task 1 — `TYPE_ORDER`, `TYPE_LABEL`, `byType`, `facetCounts`, `shouldRenderFacets`, `deriveStyleFamily`, `displayFamily`; từ Task 3 — `cardHtml`, `facetBarHtml`
- Produces: trang chủ chạy được trên HTTP server tĩnh

Trang này không có test tự động — không có DOM runner. Verify bằng trình duyệt theo checklist ở Step 5.

- [ ] **Step 1: Viết `index.html`**

```html
<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Goldbourne &amp; Co. — Gilded Editions in Tumblers, Caps, Backpacks and Shoes</title>
<meta name="description" content="Gold-relief tumblers, caps, backpacks and shoes, released in named Editions. Crest, seasonal and gothic ornament. Gilded on every side.">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
</head>
<body>

<div class="announce" id="announce" role="status" aria-live="polite"></div>

<header class="header">
  <div class="wrap header__inner">
    <a class="wordmark" href="index.html">Goldbourne<span class="wordmark__co">&amp; Co.</span></a>
    <nav class="nav" aria-label="Shop">
      <ul class="nav__list" id="typeNav"></ul>
    </nav>
  </div>
</header>

<main>
  <section class="hero section">
    <div class="wrap hero__inner">
      <div class="hero__mat">
        <img class="hero__img" id="heroImg" src="" alt="" width="1264" height="1264" decoding="async">
      </div>
      <div class="hero__text">
        <h1>Team identity, rewritten in the language of a fashion house.</h1>
        <p class="hero__sub muted">Gilded on every side.</p>
        <a class="btn" href="#catalog">View the Editions</a>
      </div>
    </div>
  </section>

  <section class="section" id="catalog">
    <div class="wrap">
      <h2 id="catalogHeading">All Editions</h2>
      <div class="facets" id="facets" role="group" aria-label="Filter by style"></div>
      <div class="grid" id="grid"></div>
      <p class="muted" id="gridEmpty" hidden>No Editions match this filter.</p>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap">
    <p class="label">Shop</p>
    <ul class="footer__list" id="footerNav"></ul>
    <p class="muted footer__legal">Goldbourne &amp; Co. — Gilded Editions.</p>
  </div>
</footer>

<script type="module" src="assets/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Viết `main.js`**

```js
/* main.js — wiring DOM cho trang chủ. Logic nằm ở catalog.mjs và render.mjs. */
import { TYPE_ORDER, TYPE_LABEL, byType, facetCounts, shouldRenderFacets, deriveStyleFamily, displayFamily } from './catalog.mjs'
import { cardHtml, facetBarHtml } from './render.mjs'

const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

export function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

async function loadProducts() {
  for (const url of ['../../products/products.json', '/products/products.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()).products ?? []
    } catch { /* thử url kế tiếp */ }
  }
  console.error('Không nạp được products.json')
  return []
}

function startAnnouncement() {
  const el = document.getElementById('announce')
  if (!el) return
  const msgs = activeMessages()
  if (msgs.length === 0) { el.hidden = true; return }
  let i = 0
  el.textContent = msgs[0].text
  if (msgs.length > 1) {
    setInterval(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i].text }, 6000)
  }
}

function renderNav(products, listEl) {
  if (!listEl) return
  listEl.innerHTML = TYPE_ORDER.map((t) => {
    const n = byType(products, t).length
    return `<li><a href="#catalog" data-type="${t}">${TYPE_LABEL[t]} <span class="muted">${n}</span></a></li>`
  }).join('')
}

/* Chỉ bật reveal khi người dùng không yêu cầu giảm chuyển động (spec §5.5). */
function observeReveal(root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }
  }, { rootMargin: '0px 0px -10% 0px' })
  root.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el))
}

const state = { products: [], type: null, family: null }

function visible() {
  let list = state.type ? byType(state.products, state.type) : state.products
  if (state.family) list = list.filter((p) => displayFamily(deriveStyleFamily(p)) === state.family)
  return list
}

function render() {
  const scope = state.type ? byType(state.products, state.type) : state.products
  const facetsEl = document.getElementById('facets')
  const gridEl = document.getElementById('grid')
  const emptyEl = document.getElementById('gridEmpty')
  const headingEl = document.getElementById('catalogHeading')

  headingEl.textContent = state.type ? TYPE_LABEL[state.type] : 'All Editions'

  /* Caps / Backpacks / Shoes chỉ một họ → không render facet (spec §6). */
  if (shouldRenderFacets(scope)) {
    facetsEl.hidden = false
    facetsEl.innerHTML = facetBarHtml(facetCounts(scope), state.family)
  } else {
    facetsEl.hidden = true
    facetsEl.innerHTML = ''
  }

  const list = visible()
  gridEl.innerHTML = list.map(cardHtml).join('')
  emptyEl.hidden = list.length > 0
  observeReveal(gridEl)
}

function wire() {
  document.getElementById('typeNav')?.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-type]')
    if (!a) return
    state.type = state.type === a.dataset.type ? null : a.dataset.type
    state.family = null
    render()
  })

  document.getElementById('facets')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-family]')
    if (!b) return
    state.family = b.dataset.family || null
    render()
  })
}

/*
  Hero dùng ảnh Halloween-General — nhóm 6 SKU duy nhất không mang logo đội
  trong ảnh (spec §5.6, §8.2).
*/
function renderHero(products) {
  const img = document.getElementById('heroImg')
  if (!img) return
  const clean = products.find((p) => p.sku === 'TUM-20260923-XI-001')
  if (!clean?.images?.[0]) { img.closest('.hero__mat')?.setAttribute('hidden', '') ; return }
  img.src = clean.images[0]
  img.alt = 'Gilded Edition — gold relief on a dark ground'
}

async function init() {
  startAnnouncement()
  state.products = await loadProducts()
  renderNav(state.products, document.getElementById('typeNav'))
  renderNav(state.products, document.getElementById('footerNav'))
  renderHero(state.products)
  wire()
  render()
}

init()
```

- [ ] **Step 3: Thêm CSS cho header, announcement, hero, footer, nút**

Nối vào cuối `themes/light-minimal/assets/components.css`:

```css
/* ---- Announcement (spec §6) ---- */
.announce {
  padding: var(--space-1) var(--space-3);
  text-align: center;
  font-size: var(--fs-1);
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
}

/* ---- Header ---- */
.header { border-bottom: 1px solid var(--border); }

.header__inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding-block: var(--space-2);
  flex-wrap: wrap;
}

.wordmark__co { font-size: var(--fs-1); margin-left: 0.4em; letter-spacing: 0.12em; }

.nav__list, .footer__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ---- Hero: passepartout phóng to (spec §5.6) ---- */
.hero__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: center;
}

@media (min-width: 900px) {
  .hero__inner { grid-template-columns: 1fr 1fr; gap: var(--space-5); }
}

.hero__mat { padding: var(--space-3); }

@media (min-width: 1280px) { .hero__mat { padding: var(--mat-hero); } }

.hero__img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.hero__sub { font-size: var(--fs-4); margin-top: var(--space-2); }

/* ---- Nút ---- */
.btn {
  display: inline-block;
  margin-top: var(--space-3);
  padding: 0.75rem 1.5rem;
  background: var(--accent);
  color: var(--accent-fg);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ---- Footer ---- */
.footer {
  border-top: 1px solid var(--border);
  padding-block: var(--space-5);
}

.footer__list { margin-block: var(--space-2); }
.footer__legal { font-size: var(--fs-2); margin-top: var(--space-3); }
```

- [ ] **Step 4: Mở trang bằng HTTP server**

Run:
```bash
cd /home/thanglv/Desktop/Dino/html-theme-cup && python3 -m http.server 8080
```
Mở `http://localhost:8080/themes/light-minimal/index.html`.

`file://` sẽ **không** chạy — ES module và `fetch` đều bị chặn. Bắt buộc dùng HTTP server.

- [ ] **Step 5: Verify bằng mắt theo checklist**

- Lưới hiện 65 thẻ, 3 cột ở cửa sổ rộng
- Mỗi ảnh có lề kem bao quanh và một đường viền mảnh nhìn thấy rõ
- Ảnh cap (nền marble sáng) **vẫn tách khỏi nền** nhờ viền — đây là phép thử chính của Task 2
- Không có bóng đổ, không có góc bo, không có mảng trắng nào
- Bấm `Tumblers` → facet hiện `All 43 · Gothic Jewel 33 · Holiday Ornament 10`
- Bấm `Caps` / `Backpacks` / `Shoes` → **không** có facet nào hiện
- Không chỗ nào trên trang hiện chữ `NFL`, `NBA`, `MLB`, `WWE`
- Announcement đổi tin sau 6 giây

- [ ] **Step 6: Commit**

```bash
git add themes/light-minimal/index.html themes/light-minimal/assets/main.js themes/light-minimal/assets/components.css
git commit -m "feat(light-minimal): trang chủ với lưới, facet theo họ style và hero"
```

---

### Task 5: `product.html` + `product.js` — trang sản phẩm

**Files:**
- Create: `themes/light-minimal/product.html`
- Create: `themes/light-minimal/assets/product.js`
- Modify: `themes/light-minimal/assets/components.css` (thêm phần PDP ở cuối file)
- Modify: `themes/light-minimal/assets/render.mjs` (thêm `galleryHtml`, `sectionsHtml`)
- Modify: `themes/light-minimal/assets/render.test.mjs` (thêm test cho hai hàm mới)

**Interfaces:**
- Consumes: từ Task 1 — `TYPE_LABEL`, `formatPrice`, `priceLabel`; từ Task 3 — `escapeHtml`, `imageAlt`
- Produces: `galleryHtml(product)`, `sectionsHtml(product)`

PDP phải chịu được SKU có **4 ảnh** (`CAP-20260923-UY-021`) — 64 SKU còn lại có 5. Không hardcode số lượng.

- [ ] **Step 1: Viết test thất bại**

Trước hết sửa dòng import đầu file `themes/light-minimal/assets/render.test.mjs` thành:

```js
import { escapeHtml, imageAlt, cardHtml, facetBarHtml, galleryHtml, sectionsHtml } from './render.mjs'
```

Rồi nối các test sau vào cuối file:

```js
const fiveShot = {
  sku: 'TUM-1', title: 'PIT Regalia', type: 'Tumbler', season: 'Halloween',
  price: 49.95, variants: [{ price: 49.95 }],
  images: ['/a/01.webp', '/a/02.webp', '/a/03.webp', '/a/04.webp', '/a/05.webp'],
  sections: [
    { heading: 'Design Story', html: '<p>Body.</p>' },
    { heading: 'Care', html: '<ul><li>Hand wash.</li></ul>' },
  ],
}

const fourShot = { ...fiveShot, sku: 'CAP-20260923-UY-021', title: 'DET - Motor City Emblem', type: 'Cap',
  season: 'Year-round', images: ['/b/01.webp', '/b/02.webp', '/b/03.webp', '/b/04.webp'] }

test('galleryHtml: render đúng số ảnh thật, không hardcode 5', () => {
  assert.equal((galleryHtml(fiveShot).match(/<img/g) ?? []).length, 5)
  assert.equal((galleryHtml(fourShot).match(/<img/g) ?? []).length, 4)
})

test('galleryHtml: mỗi ảnh có alt riêng theo vị trí', () => {
  const html = galleryHtml(fiveShot)
  assert.ok(html.includes('PIT Regalia - front'))
  assert.ok(html.includes('PIT Regalia - in use'))
})

test('galleryHtml: SKU 4 ảnh không sinh alt "in use" của vị trí thứ 5', () => {
  assert.equal(galleryHtml(fourShot).includes('- in use'), false)
})

test('galleryHtml: không có ảnh thì trả chuỗi rỗng', () => {
  assert.equal(galleryHtml({ ...fiveShot, images: [] }), '')
})

test('sectionsHtml: giữ nguyên html thân bài, escape tiêu đề', () => {
  const html = sectionsHtml(fiveShot)
  assert.ok(html.includes('<p>Body.</p>'))
  assert.ok(html.includes('Design Story'))
  assert.ok(html.includes('<li>Hand wash.</li>'))
})

test('sectionsHtml: thiếu sections thì trả chuỗi rỗng, không vỡ', () => {
  assert.equal(sectionsHtml({ ...fiveShot, sections: undefined }), '')
})
```

- [ ] **Step 2: Chạy test để xác nhận nó fail**

Run: `node --test themes/light-minimal/assets/render.test.mjs`
Expected: FAIL — `galleryHtml is not a function`

- [ ] **Step 3: Thêm hai hàm vào `render.mjs`**

Nối vào cuối `themes/light-minimal/assets/render.mjs`:

```js
/*
  64 SKU có 5 ảnh, riêng CAP-20260923-UY-021 có 4 (spec §3.4).
  Luôn lặp theo mảng thật, không giả định số lượng.
*/
export function galleryHtml(product) {
  const images = product.images ?? []
  if (images.length === 0) return ''
  return images.map((src, i) => `
    <figure class="gallery__item">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(imageAlt(product, i))}"
           loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"
           width="1264" height="1264"
           sizes="(min-width:1280px) 560px, 90vw">
    </figure>`).join('')
}

export function sectionsHtml(product) {
  const sections = product.sections ?? []
  if (sections.length === 0) return ''
  return sections.map((s) => `
    <section class="pdp__section">
      <h2 class="pdp__heading">${escapeHtml(s.heading)}</h2>
      <div class="pdp__body">${s.html ?? ''}</div>
    </section>`).join('')
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `node --test themes/light-minimal/assets/render.test.mjs`
Expected: PASS — 20 tests, 0 fail

- [ ] **Step 5: Viết `product.html`**

```html
<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edition | Goldbourne &amp; Co.</title>
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
</head>
<body>

<header class="header">
  <div class="wrap header__inner">
    <a class="wordmark" href="index.html">Goldbourne<span class="wordmark__co">&amp; Co.</span></a>
    <nav class="nav" aria-label="Shop">
      <ul class="nav__list" id="typeNav"></ul>
    </nav>
  </div>
</header>

<main class="wrap section" id="pdp">
  <p class="muted" id="pdpError" hidden>Edition not found.</p>

  <div class="pdp" id="pdpContent" hidden>
    <div class="gallery" id="gallery"></div>
    <div class="pdp__info">
      <p class="label muted" id="pdpMeta"></p>
      <h1 id="pdpTitle"></h1>
      <p class="pdp__hook" id="pdpHook"></p>
      <p class="pdp__price" id="pdpPrice"></p>
      <div id="pdpVariants"></div>
      <button class="btn" type="button" id="pdpAdd">Add to cart</button>
    </div>
  </div>

  <div id="pdpSections"></div>
</main>

<footer class="footer">
  <div class="wrap">
    <p class="muted footer__legal">Goldbourne &amp; Co. — Gilded Editions.</p>
  </div>
</footer>

<script type="module" src="assets/product.js"></script>
</body>
</html>
```

- [ ] **Step 6: Viết `product.js`**

```js
/* product.js — wiring DOM cho PDP. */
import { TYPE_ORDER, TYPE_LABEL, byType, priceLabel, formatPrice, deriveStyleFamily, displayFamily } from './catalog.mjs'
import { galleryHtml, sectionsHtml, escapeHtml } from './render.mjs'

async function loadProducts() {
  for (const url of ['../../products/products.json', '/products/products.json']) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()).products ?? []
    } catch { /* thử url kế tiếp */ }
  }
  return []
}

function renderNav(products) {
  const el = document.getElementById('typeNav')
  if (!el) return
  el.innerHTML = TYPE_ORDER.map((t) =>
    `<li><a href="index.html#catalog" data-type="${t}">${TYPE_LABEL[t]} <span class="muted">${byType(products, t).length}</span></a></li>`
  ).join('')
}

function renderVariants(product) {
  const el = document.getElementById('pdpVariants')
  const variants = (product.variants ?? []).filter((v) => v.value)
  if (!product.variantLabel || variants.length === 0) { el.innerHTML = ''; return }
  el.innerHTML = `
    <p class="label muted">${escapeHtml(product.variantLabel)}</p>
    <div class="variants" role="group" aria-label="${escapeHtml(product.variantLabel)}">
      ${variants.map((v, i) => `
        <button type="button" class="facet${i === 0 ? ' is-active' : ''}"
                data-price="${v.price}" aria-pressed="${i === 0}">${escapeHtml(v.value)}</button>`).join('')}
    </div>`

  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-price]')
    if (!b) return
    el.querySelectorAll('button[data-price]').forEach((x) => {
      x.classList.remove('is-active')
      x.setAttribute('aria-pressed', 'false')
    })
    b.classList.add('is-active')
    b.setAttribute('aria-pressed', 'true')
    document.getElementById('pdpPrice').textContent = formatPrice(Number(b.dataset.price))
  })
}

async function init() {
  const products = await loadProducts()
  renderNav(products)

  const sku = new URLSearchParams(location.search).get('sku')
  const product = products.find((p) => p.sku === sku)

  if (!product) {
    document.getElementById('pdpError').hidden = false
    return
  }

  document.title = `${product.title} | Goldbourne & Co.`
  document.getElementById('pdpContent').hidden = false
  document.getElementById('gallery').innerHTML = galleryHtml(product)
  document.getElementById('pdpTitle').textContent = product.title
  document.getElementById('pdpHook').textContent = product.hook ?? ''
  document.getElementById('pdpPrice').textContent = priceLabel(product)
  document.getElementById('pdpMeta').textContent =
    `${TYPE_LABEL[product.type] ?? product.type} · ${displayFamily(deriveStyleFamily(product))}`
  document.getElementById('pdpSections').innerHTML = sectionsHtml(product)
  renderVariants(product)

  document.getElementById('pdpAdd').addEventListener('click', () => {
    document.getElementById('pdpAdd').textContent = 'Added'
  })
}

init()
```

- [ ] **Step 7: Thêm CSS cho PDP**

Nối vào cuối `themes/light-minimal/assets/components.css`:

```css
/* ---- PDP ---- */
.pdp {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 900px) {
  .pdp { grid-template-columns: 1.2fr 1fr; gap: var(--space-5); align-items: start; }
}

.gallery { display: grid; grid-template-columns: 1fr; gap: var(--space-3); }

@media (min-width: 600px) { .gallery { grid-template-columns: repeat(2, 1fr); } }

.gallery__item { margin: 0; padding: var(--space-2); }

.gallery__item img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.pdp__hook { font-size: var(--fs-4); line-height: 1.5; }
.pdp__price { font-size: var(--fs-5); margin-block: var(--space-2); }

.variants { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-block: var(--space-2); }

.pdp__section { max-width: 68ch; margin-top: var(--space-5); }

.pdp__heading {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: var(--space-2);
}

.pdp__body ul { padding-left: 1.2em; }
.pdp__body li { margin-bottom: 0.4em; }
```

- [ ] **Step 8: Verify bằng trình duyệt**

Với server đang chạy, mở lần lượt:

- `http://localhost:8080/themes/light-minimal/product.html?sku=CAP-20260923-UY-021` → gallery hiện đúng **4** ảnh, không có ô trống thứ 5
- `http://localhost:8080/themes/light-minimal/product.html?sku=TUM-20260923-UY-009` → **5** ảnh
- `http://localhost:8080/themes/light-minimal/product.html?sku=BP-20260923-XI-021` → có nhóm nút Size S/M/L; bấm M thì giá đổi thành `$59.95`
- `http://localhost:8080/themes/light-minimal/product.html?sku=KHONG-CO` → hiện `Edition not found.`, không có lỗi JS trong console
- Bấm từ một thẻ ở trang chủ sang PDP và quay lại — không lỗi

- [ ] **Step 9: Commit**

```bash
git add themes/light-minimal/product.html themes/light-minimal/assets/product.js themes/light-minimal/assets/render.mjs themes/light-minimal/assets/render.test.mjs themes/light-minimal/assets/components.css
git commit -m "feat(light-minimal): trang sản phẩm với gallery chịu được 4 hoặc 5 ảnh"
```

---

### Task 6: Rà soát responsive, accessibility và ranh giới IP

**Files:**
- Modify: `themes/light-minimal/assets/components.css` (sửa nếu phát hiện lỗi ở các bước dưới)
- Create: `themes/light-minimal/assets/copy-guard.test.mjs`

**Interfaces:**
- Consumes: mọi file HTML và JS của theme
- Produces: test tự động canh bộ chặn copy và ranh giới IP trên toàn theme

- [ ] **Step 1: Viết test bộ chặn copy**

Tạo `themes/light-minimal/assets/copy-guard.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = dirname(fileURLToPath(import.meta.url))
const THEME = join(ASSETS, '..')

function themeText() {
  const files = [
    ...readdirSync(THEME).filter((f) => f.endsWith('.html')).map((f) => join(THEME, f)),
    ...readdirSync(ASSETS).filter((f) => (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.css')) && !f.includes('.test.')).map((f) => join(ASSETS, f)),
  ]
  return files.map((f) => readFileSync(f, 'utf8')).join('\n')
}

const BANNED = [
  'officially licensed', 'official', 'licensed', 'authentic', 'genuine',
  'must-have', 'perfect gift for any fan',
]

test('bộ chặn copy: không cụm cấm nào xuất hiện trong theme', () => {
  const text = themeText().toLowerCase()
  for (const phrase of BANNED) {
    assert.equal(text.includes(phrase), false, `Tìm thấy cụm bị cấm: "${phrase}"`)
  }
})

/* Tên giải không được nằm ở lớp điều hướng hay chrome của theme (spec §6). */
test('ranh giới IP: tên giải không nằm trong mã nguồn theme', () => {
  const text = themeText()
  for (const league of ['NFL', 'NBA', 'MLB', 'WWE']) {
    assert.equal(new RegExp(`\\b${league}\\b`).test(text), false, `Tìm thấy tên giải: ${league}`)
  }
})

test('không dùng vàng brand #C9A227 ở bất kỳ file nào của theme', () => {
  assert.equal(/#C9A227/i.test(themeText()), false)
})

test('không có box-shadow: Minimalism & Swiss quy định shadow none (spec §5.1)', () => {
  assert.equal(/box-shadow\s*:/i.test(themeText()), false)
})
```

- [ ] **Step 2: Chạy test và sửa mọi vi phạm**

Run: `node --test themes/light-minimal/assets/copy-guard.test.mjs`
Expected: PASS — 4 tests, 0 fail

Nếu fail: sửa file vi phạm, không sửa test. Test đang canh đúng ràng buộc của spec.

- [ ] **Step 3: Kiểm responsive ở bốn bề rộng**

Với server đang chạy, dùng DevTools đặt lần lượt 375px, 768px, 1024px, 1440px trên cả `index.html` và `product.html`:

- 375px → lưới 1 cột, lề thẻ 16px, không tràn ngang
- 768px → 2 cột, lề 24px
- 1024px → 2 cột (breakpoint 3 cột là 1280px)
- 1440px → 3 cột, lề 32px
- Lề passepartout **không bao giờ** nhỏ hơn 16px ở bất kỳ bề rộng nào

- [ ] **Step 4: Kiểm reduced-motion**

Trong DevTools → Rendering → `Emulate CSS prefers-reduced-motion: reduce`, tải lại `index.html`:

- Toàn bộ thẻ hiện ngay, không có fade hay dịch chuyển
- Không thẻ nào kẹt ở `opacity: 0` — đây là lỗi hay gặp nhất của reveal pattern

- [ ] **Step 5: Kiểm bàn phím và focus**

- `Tab` qua header → facet → từng thẻ: mỗi điểm dừng có viền focus vàng `#7A5F18` nhìn rõ
- Thứ tự focus khớp thứ tự nhìn thấy
- Nút facet bấm được bằng `Enter` và `Space`
- Trên PDP, nút chọn size đổi `aria-pressed` đúng khi chuyển

- [ ] **Step 6: Chạy lại toàn bộ test của theme**

Run:
```bash
node --test themes/light-minimal/assets/catalog.test.mjs \
     themes/light-minimal/assets/tokens.test.mjs \
     themes/light-minimal/assets/render.test.mjs \
     themes/light-minimal/assets/copy-guard.test.mjs
```
Expected: PASS — 47 tests, 0 fail (catalog 15 · tokens 8 · render 20 · copy-guard 4)

- [ ] **Step 7: Xác nhận theme cũ không bị ảnh hưởng**

Run: `node --test scripts/build-products.test.mjs`
Expected: PASS — 12 tests, 0 fail

Mở `http://localhost:8080/themes/dark-maximalism/index.html` và xác nhận nó vẫn chạy như trước. Hai theme dùng chung `products/products.json` nhưng không dùng chung file nào khác.

- [ ] **Step 8: Commit**

```bash
git add themes/light-minimal/assets/copy-guard.test.mjs themes/light-minimal/assets/components.css
git commit -m "test(light-minimal): canh bộ chặn copy, ranh giới IP và rà soát a11y"
```

---

## Những gì plan này cố ý không làm

Để người thực thi không tự ý mở rộng phạm vi:

- **Không sửa `products/products.json` hay file CSV.** Theme đọc dữ liệu như nó đang có.
- **Không dựng khối `What you're actually holding`** (khối 5 trong spec §7). Spec ghi rõ khối này *"chỉ render được sau khi lấp gap §8.3"* — 43 tumbler hiện chỉ có đúng một dòng `Available capacity: 40 oz.`, không có chất liệu, giữ nhiệt, kích thước hay nắp. Dựng khối rỗng còn tệ hơn không dựng. Khi dữ liệu được bổ sung, đây là task tiếp theo.
- **Không đụng vào `themes/dark-maximalism`.** Hai theme độc lập hoàn toàn, chỉ dùng chung nguồn dữ liệu.
- **Không sinh logo, favicon, og.jpg.** Spec §5.1 nêu rõ theme light cần biến thể logo `#7A5F18`; đó là việc thiết kế asset, không phải code. Task 4 dùng wordmark bằng chữ.
- **Không làm giỏ hàng thật.** Nút `Add to cart` chỉ đổi nhãn — đây là theme tĩnh, chưa nối Shopify Storefront API (vẫn `[FAKE]` ở form khởi tạo).
- **Không làm 8 trang policy.** Chúng nằm ở lớp store, không phải lớp theme.
