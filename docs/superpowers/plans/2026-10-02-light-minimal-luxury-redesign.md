# Light Minimal → Luxury Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết lại trang chủ `themes/light-minimal` thành theme luxury nền trắng: hero carousel 3 frame, 4 dải preview 3 sản phẩm, thẻ đổi ảnh khi hover, motion scroll-driven.

**Architecture:** Giữ nguyên kiến trúc hiện có — logic thuần nằm trong `.mjs` test được bằng `node:test` không cần jsdom, DOM wiring nằm trong `main.js`. Thêm hai module thuần mới (`carousel.mjs`, `cut-reveal.mjs`) theo đúng pattern đó. CSS chia ba tầng không đổi: `tokens.css` (chỉ biến) → `base.css` (element) → `components.css` (block).

**Tech Stack:** HTML/CSS/JS thuần, ES modules, zero dependency, không build step. Test bằng `node:test` có sẵn trong Node. Node v24.14.1.

## Global Constraints

Mọi task đều chịu các ràng buộc này. Chép nguyên văn từ spec.

- **Spec gốc:** `docs/superpowers/specs/2026-10-02-light-minimal-luxury-redesign-design.md`. Khi plan và spec mâu thuẫn, spec thắng — dừng lại và báo.
- **Lệnh test:** `node --test themes/light-minimal/assets/*.test.mjs` — truyền đường dẫn file, **không** truyền thư mục (truyền thư mục báo fail giả).
- **Baseline:** 47 test đang xanh trước khi bắt đầu.
- **Zero dependency.** Không thêm `package.json`, không `npm install`, không thư viện. Fancy Components là React — **port ý tưởng, không cài**.
- **Màu:** `--bg: #FFFFFF` · `--fg: #14120E` · `--muted: #6B6151` · `--accent: #7A5F18` · `--accent-fg: #FFFFFF` · `--border: #8A7C62` · `--gold: #C9A227`.
- **`#C9A227` xuất hiện đúng 1 lần** trong toàn theme (dòng định nghĩa `--gold`). Mọi `var(--gold)` phải nằm trong khai báo `border`. Cấm ở `color`, `background`, `fill`, `outline`, và cấm trên selector trạng thái.
- **`--radius: 0`** toàn theme.
- **Mặc định là hiện.** Mọi phần tử có hiệu ứng xuất hiện phải `opacity: 1` ở trạng thái gốc; ẩn chỉ được bật bên trong `@media (prefers-reduced-motion: no-preference)` + `@supports`.
- **`box-shadow`** chỉ được khai giá trị thật trong `tokens.css`; nơi khác phải dùng `var(--shadow-*)`.
- **Ranh giới IP:** không `NFL`/`NBA`/`MLB`/`WWE` trong mã theme. Alt text lấy từ `product.title`, **không** từ `product.seoTitle`. Không nới bộ chặn copy.
- **Path asset tuyệt đối:** `/themes/light-minimal/assets/...`. Path tương đối làm trắng trang trên host clean-URLs.
- **12 SKU trang chủ:** đúng 3 mỗi dòng sản phẩm, danh sách tuyển tay trong `catalog.mjs`, không sửa `products/products.json` (file sinh ra từ CSV, sẽ bị ghi đè).

---

## File Structure

| File | Trách nhiệm | Thao tác |
|---|---|---|
| `assets/tokens.css` | Chỉ chứa biến. Nơi duy nhất có mã màu và giá trị shadow | Sửa |
| `assets/base.css` | Element mặc định, font, `.reveal`, nhánh scroll-driven | Sửa |
| `assets/components.css` | Block: card, carousel, preview, header, footer | Sửa |
| `assets/catalog.mjs` | Logic phân loại thuần + danh sách tuyển tay + cờ no-swap | Sửa |
| `assets/render.mjs` | Hàm thuần trả chuỗi HTML | Sửa |
| `assets/carousel.mjs` | **Mới.** Máy trạng thái carousel thuần + hàm mount DOM | Tạo |
| `assets/cut-reveal.mjs` | **Mới.** Tách chữ thuần + hàm mount DOM | Tạo |
| `assets/main.js` | Wiring DOM trang chủ | Sửa |
| `index.html` | Khung trang chủ | Sửa |
| `product.html` | Chỉ sửa path asset | Sửa |
| `assets/tokens.test.mjs` | Canh token và contrast | Sửa |
| `assets/copy-guard.test.mjs` | Canh copy, IP, shadow, gold | Sửa |
| `assets/catalog.test.mjs` | Canh logic phân loại + danh sách tuyển tay | Sửa |
| `assets/render.test.mjs` | Canh HTML sinh ra | Sửa |
| `assets/carousel.test.mjs` | **Mới.** Canh máy trạng thái carousel | Tạo |
| `assets/markup.test.mjs` | **Mới.** Canh HTML tĩnh: neo nav, trục font, path tuyệt đối | Tạo |

---

## Task 1: Tuyển 12 SKU và soi 24 ảnh

Task này **chặn** Task 6. Nó là việc của mắt người, không phải của code.

**Files:**
- Modify: `themes/light-minimal/assets/catalog.mjs`
- Test: `themes/light-minimal/assets/catalog.test.mjs`

**Interfaces:**
- Consumes: `products/products.json` (chỉ đọc)
- Produces: `CURATED` (`Array<string>` — 12 mã SKU), `NO_SWAP` (`Set<string>`), `curatedByType(products, type)` → `Array<Product>` giữ đúng thứ tự trong `CURATED`

**Bể chọn:**

| Dòng | Có sẵn | Chọn | Ghi chú |
|---|---|---|---|
| Tumbler | 43 (33 Gothic Jewel + 10 Holiday Ornament) | 3 | **Bắt buộc phủ cả hai họ** |
| Cap | 11 | 3 | đều Heritage Crest |
| Backpack | 8 | 3 | 5 Heritage Crest + 3 Gold Drip |
| Shoes | **đúng 3** | 3 | `SNK-20260923-XI-009`, `-010`, `-011` — **không có cái thay thế** |

- [ ] **Step 1: Soi 24 ảnh**

Với mỗi SKU ứng viên, mở ảnh `01.webp` và `02.webp` bằng công cụ đọc ảnh. Đường dẫn thật lấy từ trường `images` trong `products.json` (đã URL-encode — giải mã `%20` thành dấu cách khi mở file).

Loại SKU nếu ảnh **01 hoặc 02** chứa bất kỳ thứ nào sau:
- khối chữ `AURA TUMBLER` ở bất kỳ đâu, kể cả khắc trên thân sản phẩm
- tagline của bên thứ ba (`DARKER DRINKS BRIGHTER STORIES`, `BEAUTY SPINS IN DARKNESS`, v.v.)
- logo đăng ký `®` của đội
- tên đội đầy đủ trên banner, cờ, bảng hiệu ở hậu cảnh
- logo giải đấu trên đạo cụ (bóng, áo)

Đã soi sẵn, dùng lại kết quả, **đừng soi lại**: `TUM-20260923-XI-001` ảnh 01 **sạch** · `XI-002` ảnh 01 **sạch** · `XI-006` ảnh 01 **sạch** · `XI-003`, `XI-004`, `XI-005` ảnh 01 **dính**.

**Nếu một trong 3 SKU Shoes có ảnh bẩn: DỪNG LẠI và báo cáo.** Dòng Shoes chỉ có 3 SKU nên không thể thay. Đừng tự ý hiện 2 shoes hay bỏ dải Shoes.

**Nếu một dòng không đủ 3 SKU sạch cả đôi:** chọn SKU có `01` sạch nhưng `02` dính, và thêm mã đó vào `NO_SWAP`.

- [ ] **Step 2: Ghi kết quả soi vào spec**

Mở `docs/superpowers/specs/2026-10-02-light-minimal-luxury-redesign-design.md`, trong §5.2 thêm một bảng ngay trước dòng "Kết quả soi — cả 24 ảnh...", liệt kê đủ 24 ảnh: mã SKU, ảnh 01 đạt/không, ảnh 02 đạt/không, lý do loại nếu có. Spec yêu cầu việc này, không phải tuỳ chọn.

- [ ] **Step 3: Viết test thất bại**

Thêm vào cuối `themes/light-minimal/assets/catalog.test.mjs`:

```js
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CURATED, NO_SWAP, curatedByType, TYPE_ORDER } from './catalog.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PRODUCTS = JSON.parse(
  readFileSync(join(HERE, '..', '..', '..', 'products', 'products.json'), 'utf8')
).products

test('tuyển tay: đúng 12 SKU', () => {
  assert.equal(CURATED.length, 12)
})

test('tuyển tay: không trùng mã', () => {
  assert.equal(new Set(CURATED).size, 12)
})

/*
  Danh sách tuyển tay là chỗ duy nhất trong theme mà một lỗi gõ làm biến mất
  hẳn một sản phẩm khỏi cửa hàng — trang chủ không còn chế độ full catalog.
*/
test('tuyển tay: mọi SKU tồn tại trong products.json', () => {
  const known = new Set(PRODUCTS.map((p) => p.sku))
  for (const sku of CURATED) {
    assert.ok(known.has(sku), `SKU không tồn tại: ${sku}`)
  }
})

test('tuyển tay: đúng 3 SKU mỗi dòng sản phẩm', () => {
  for (const type of TYPE_ORDER) {
    assert.equal(curatedByType(PRODUCTS, type).length, 3, `Dòng ${type} không đủ 3`)
  }
})

test('tuyển tay: dòng Tumbler phủ cả hai họ style', () => {
  const families = new Set(
    curatedByType(PRODUCTS, 'Tumbler').map((p) => displayFamily(deriveStyleFamily(p)))
  )
  assert.ok(families.size >= 2, `Tumbler chỉ có họ: ${[...families].join(', ')}`)
})

test('tuyển tay: NO_SWAP chỉ chứa SKU nằm trong CURATED', () => {
  for (const sku of NO_SWAP) {
    assert.ok(CURATED.includes(sku), `NO_SWAP có SKU ngoài danh sách: ${sku}`)
  }
})

test('curatedByType giữ đúng thứ tự trong CURATED', () => {
  const caps = curatedByType(PRODUCTS, 'Cap').map((p) => p.sku)
  const expected = CURATED.filter((s) => caps.includes(s))
  assert.deepEqual(caps, expected)
})
```

Bổ sung `displayFamily` và `deriveStyleFamily` vào dòng `import` đã có sẵn ở đầu file nếu chúng chưa được import.

- [ ] **Step 4: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/catalog.test.mjs`
Expected: FAIL — `SyntaxError: The requested module './catalog.mjs' does not provide an export named 'CURATED'`

- [ ] **Step 5: Hiện thực**

Thêm vào cuối `themes/light-minimal/assets/catalog.mjs`:

```js
/*
  Trang chủ không còn chế độ full catalog (spec §7.3), nên 12 SKU này LÀ
  toàn bộ cửa hàng. Thứ tự trong mảng là thứ tự hiển thị.

  Mọi ảnh 01 và 02 của 12 SKU này đã được soi bằng mắt ngày <NGÀY SOI>,
  không có watermark AURA TUMBLER, không có logo/tên đội. Kết quả đầy đủ ở
  spec §5.2. Thêm SKU vào đây mà chưa soi ảnh là đưa rủi ro IP lên mặt tiền.

  KHÔNG đặt danh sách này trong products.json — file đó sinh ra từ CSV bởi
  scripts/build-products.mjs và sẽ bị ghi đè.
*/
export const CURATED = [
  /* Tumbler — phải phủ cả Gothic Jewel lẫn Holiday Ornament */
  'TUM-...', 'TUM-...', 'TUM-...',
  /* Cap */
  'CAP-...', 'CAP-...', 'CAP-...',
  /* Backpack */
  'BP-...', 'BP-...', 'BP-...',
  /* Shoes — cả 3 SKU của dòng này, không có lựa chọn khác */
  'SNK-20260923-XI-009', 'SNK-20260923-XI-010', 'SNK-20260923-XI-011',
]

/*
  SKU có ảnh 01 sạch nhưng ảnh 02 dính. Thẻ của chúng giữ một ảnh, không
  đổi khi hover. Để rỗng nếu cả 12 SKU đều sạch cả đôi.
*/
export const NO_SWAP = new Set([])

export function curatedByType(products, type) {
  const bySku = new Map(products.map((p) => [p.sku, p]))
  return CURATED.map((sku) => bySku.get(sku)).filter((p) => p && p.type === type)
}

/*
  Id của dải preview trên trang chủ. Để ở đây chứ không ở main.js vì main.js
  gọi init() ngay lúc import — test nào import nó sẽ chạm `document` và crash
  trong Node. Logic thuần thì ở file thuần.
*/
export function sectionId(type) { return `shop-${type.toLowerCase()}` }
```

Thay `'TUM-...'` và `'CAP-...'` và `'BP-...'` bằng mã thật từ Step 1. Thay `<NGÀY SOI>` bằng ngày thật.

- [ ] **Step 6: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/catalog.test.mjs`
Expected: PASS, tất cả test trong file.

- [ ] **Step 7: Commit**

```bash
git add themes/light-minimal/assets/catalog.mjs themes/light-minimal/assets/catalog.test.mjs docs/superpowers/specs/2026-10-02-light-minimal-luxury-redesign-design.md
git commit -m "feat(light-minimal): tuyển 12 SKU trang chủ, soi 24 ảnh"
```

---

## Task 2: Token nền trắng, shadow, vàng hairline

**Files:**
- Modify: `themes/light-minimal/assets/tokens.css`
- Test: `themes/light-minimal/assets/tokens.test.mjs`

**Interfaces:**
- Produces: biến CSS `--bg --fg --muted --accent --accent-fg --border --gold --shadow-sm --shadow-md --space-7 --fs-9 --ease-lux --dur-slow`

- [ ] **Step 1: Viết test thất bại**

Trong `themes/light-minimal/assets/tokens.test.mjs`, **xoá** ba test cuối (`không có token --surface`, `không dùng vàng brand #C9A227`, `bo góc bằng 0`) và thay bằng:

```js
test('nền là trắng tinh (spec §2.1)', () => {
  assert.equal(token('bg').toUpperCase(), '#FFFFFF')
})

/*
  Mặt thẻ đúng bằng --bg; cái tách nó khỏi trang là shadow, không phải màu.
  Giữ đúng một màu nền trên toàn trang.
*/
test('không có token --surface (spec §2.2)', () => {
  assert.equal(/--surface\s*:/.test(CSS), false)
})

test('bo góc bằng 0 — góc vuông đọc đắt tiền hơn bo tròn (spec §1)', () => {
  const m = CSS.match(/--radius:\s*([^;]+);/)
  assert.ok(m, 'Không tìm thấy --radius')
  assert.match(m[1].trim(), /^0(px|rem)?$/)
})

test('có đủ hai bậc shadow', () => {
  assert.ok(/--shadow-sm:/.test(CSS), 'thiếu --shadow-sm')
  assert.ok(/--shadow-md:/.test(CSS), 'thiếu --shadow-md')
})

/*
  #C9A227 chỉ 2.42:1 trên trắng — không đủ cho chữ, nút, hay bất cứ thứ gì
  mang thông tin. Nó được phép tồn tại ĐÚNG MỘT LẦN, ở đây, làm hairline
  trang trí. Hàng rào thật nằm ở copy-guard.test.mjs.
*/
test('vàng brand khai đúng một lần, trong token --gold', () => {
  const hits = CSS.match(/#C9A227/gi) ?? []
  assert.equal(hits.length, 1, `#C9A227 xuất hiện ${hits.length} lần trong tokens.css`)
  assert.match(CSS, /--gold:\s*#C9A227/i)
})

test('có thang mới: --space-7, --fs-9, --ease-lux, --dur-slow', () => {
  for (const name of ['space-7', 'fs-9', 'ease-lux', 'dur-slow']) {
    assert.ok(new RegExp(`--${name}\\s*:`).test(CSS), `thiếu --${name}`)
  }
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/tokens.test.mjs`
Expected: FAIL — `nền là trắng tinh` báo `'#F6F1E7' !== '#FFFFFF'`

- [ ] **Step 3: Hiện thực**

Thay toàn bộ `themes/light-minimal/assets/tokens.css` bằng:

```css
/*
  Nơi DUY NHẤT chứa mã màu và giá trị shadow của theme light-minimal.
  Mọi con số contrast dưới đây đo ngày 02/10/2026 và được tokens.test.mjs canh.
  Theme này KHÔNG có dark mode — themes/dark-maximalism giữ vai đó.
*/
:root {
  --bg: #FFFFFF;
  --fg: #14120E;          /* 18.71:1 — AAA */
  --muted: #6B6151;       /* 6.08:1 — AA */
  --accent: #7A5F18;      /* 6.04:1 — AA. Dùng cho MỌI chỉ báo trạng thái */
  --accent-fg: #FFFFFF;   /* 6.04:1 trên --accent */
  --border: #8A7C62;      /* 4.09:1 — viền là chức năng: 11 ảnh cap nền marble
                             chỉ ~1.1:1 so với nền trắng, không viền là tan mất */

  /* 2.42:1 — CHỈ hairline trang trí. Cấm ở chữ, nút, trạng thái. Xem spec §2.4 */
  --gold: #C9A227;

  /* KHÔNG có --surface. Mặt thẻ đúng bằng --bg; shadow mới là thứ tách nó ra. */

  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  --fs-1: 0.75rem;
  --fs-2: 0.875rem;
  --fs-3: 1rem;
  --fs-4: 1.125rem;
  --fs-5: 1.5rem;
  --fs-6: 2rem;
  --fs-7: 3rem;
  --fs-8: 4rem;
  --fs-9: 4.5rem;

  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-5: 3rem;
  --space-6: 6rem;
  --space-7: 8rem;

  --mat: 1.5rem;          /* 24px — padding thẻ ở desktop */
  --mat-hero: 4rem;
  --radius: 0;
  --maxw: 1200px;

  /* Tủ trưng bày, không phải elevation kiểu Material: mờ rộng, alpha thấp, ngả ấm */
  --shadow-sm: 0 1px 2px rgba(20, 18, 14, .04), 0 8px 24px rgba(20, 18, 14, .06);
  --shadow-md: 0 2px 4px rgba(20, 18, 14, .05), 0 16px 48px rgba(20, 18, 14, .10);

  --dur: 350ms;
  --dur-slow: 700ms;
  --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-lux: cubic-bezier(0.16, 1, 0.3, 1);   /* expo-out — thứ tạo cảm giác "mượt" */
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/tokens.test.mjs`
Expected: PASS. Năm test contrast cũ vẫn xanh và còn rộng hơn trước.

- [ ] **Step 5: Commit**

```bash
git add themes/light-minimal/assets/tokens.css themes/light-minimal/assets/tokens.test.mjs
git commit -m "feat(light-minimal): token nền trắng, mở shadow, vàng hairline"
```

---

## Task 3: Viết lại hàng rào copy-guard

Task 2 vừa đưa `box-shadow` và `#C9A227` vào theme — hai thứ `copy-guard.test.mjs` đang cấm tuyệt đối. Task này thay lệnh cấm bằng luật.

**Files:**
- Modify: `themes/light-minimal/assets/copy-guard.test.mjs`

- [ ] **Step 1: Viết test thất bại**

Trong `themes/light-minimal/assets/copy-guard.test.mjs`, **xoá** hai test cuối (`không dùng vàng brand #C9A227 ở bất kỳ file nào`, `không có box-shadow`) và thay bằng:

```js
function themeFiles() {
  return [
    ...readdirSync(THEME).filter((f) => f.endsWith('.html')).map((f) => join(THEME, f)),
    ...readdirSync(ASSETS)
      .filter((f) => (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.css')) && !f.includes('.test.'))
      .map((f) => join(ASSETS, f)),
  ]
}

/*
  Vàng đẹp, và cái đẹp sẽ bò dần sang chỗ nó không được phép ở.
  Hàng rào phải là test chứ không phải trí nhớ (spec §2.4).
*/
test('vàng brand xuất hiện đúng một lần trong toàn theme', () => {
  const hits = themeText().match(/#C9A227/gi) ?? []
  assert.equal(hits.length, 1, `#C9A227 xuất hiện ${hits.length} lần, phải đúng 1`)
})

test('mã vàng duy nhất đó nằm trong tokens.css', () => {
  const tokens = readFileSync(join(ASSETS, 'tokens.css'), 'utf8')
  assert.match(tokens, /--gold:\s*#C9A227/i)
})

test('var(--gold) chỉ dùng trong khai báo border', () => {
  for (const file of themeFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (!line.includes('var(--gold)')) return
      assert.match(
        line,
        /border[a-z-]*\s*:/,
        `${file}:${i + 1} dùng var(--gold) ngoài border — vàng 2.42:1, không đủ cho chữ/nút/trạng thái\n  ${line.trim()}`
      )
    })
  }
})

test('var(--gold) không nằm trên selector trạng thái', () => {
  for (const file of themeFiles()) {
    if (!file.endsWith('.css')) continue
    const css = readFileSync(file, 'utf8')
    const blocks = css.split('}')
    for (const block of blocks) {
      if (!block.includes('var(--gold)')) continue
      const selector = block.split('{')[0]
      assert.doesNotMatch(
        selector,
        /:hover|:focus|\.is-active|\[aria-current|\[aria-pressed/,
        `Selector trạng thái dùng vàng — chỉ báo trạng thái phải dùng --accent:\n  ${selector.trim()}`
      )
    }
  }
})

/*
  Shadow được phép từ 02/10/2026, nhưng giá trị thật chỉ sống ở tokens.css.
  Rải rác box-shadow hardcode là cách một hệ thị giác mất kiểm soát.
*/
test('box-shadow ngoài tokens.css phải dùng var(--shadow-*)', () => {
  for (const file of themeFiles()) {
    if (file.endsWith('tokens.css')) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = line.match(/box-shadow\s*:\s*(.+)/)
      if (!m) return
      assert.match(
        m[1],
        /var\(--shadow-/,
        `${file}:${i + 1} hardcode box-shadow, phải dùng var(--shadow-*)\n  ${line.trim()}`
      )
    })
  }
})
```

- [ ] **Step 2: Chạy test, xác nhận luật mới đã đúng**

Run: `node --test themes/light-minimal/assets/copy-guard.test.mjs`
Expected: PASS ngay — Task 2 đã làm cho các luật này đúng. Đây là test hàng rào, không phải test TDD: nó canh một luật đã thành hiện thực ở task trước, nên pass ngay là đúng.

Nếu FAIL ở `vàng brand xuất hiện đúng một lần`, nghĩa là Task 2 chưa xong hoặc `#C9A227` bị dán thêm ở chỗ khác. Sửa chỗ đó, **đừng nới test**.

- [ ] **Step 3: Chạy toàn bộ test**

Run: `node --test themes/light-minimal/assets/*.test.mjs`
Expected: PASS toàn bộ.

- [ ] **Step 4: Commit**

```bash
git add themes/light-minimal/assets/copy-guard.test.mjs
git commit -m "test(light-minimal): thay lệnh cấm shadow/vàng bằng luật dùng"
```

---

## Task 4: Base — font variable, nền trắng, mặc định hiện

**Files:**
- Modify: `themes/light-minimal/assets/base.css`
- Test: `themes/light-minimal/assets/markup.test.mjs` (tạo mới)

**Interfaces:**
- Produces: class `.reveal` (mặc định hiện), `.cut` / `.cut__in` (Vertical Cut Reveal, Task 8 dùng), `.hover-wght` (Variable Font Hover)

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/markup.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = dirname(fileURLToPath(import.meta.url))
const THEME = join(ASSETS, '..')
const read = (...p) => readFileSync(join(...p), 'utf8')

/*
  wght@400;600 là HAI WEIGHT TĨNH, không phải trục variable. Variable Font
  Hover sẽ chết lặng trên nó: trang vẫn trông bình thường, hiệu ứng không chạy.
*/
test('font nạp theo trục variable, không phải weight tĩnh', () => {
  const css = read(ASSETS, 'base.css')
  assert.match(css, /Cormorant\+Garamond:wght@300\.\.700/, 'Cormorant phải nạp trục 300..700')
  assert.match(css, /Inter:wght@300\.\.700/, 'Inter phải nạp trục 300..700')
  assert.doesNotMatch(css, /wght@400;600/, 'còn sót weight tĩnh')
})

/*
  base.css cũ đặt .reveal { opacity: 0 } làm mặc định và phụ thuộc JS trả về 1.
  JS không chạy — đúng kịch bản bug path gây ra — là toàn bộ nội dung vô hình.
*/
test('.reveal mặc định là hiện (spec §6.2)', () => {
  const css = read(ASSETS, 'base.css')
  const base = css.match(/\.reveal\s*\{([^}]*)\}/)
  assert.ok(base, 'không tìm thấy rule .reveal')
  assert.match(base[1], /opacity:\s*1/, '.reveal phải mặc định opacity: 1')
})

test('trạng thái ẩn chỉ nằm trong nhánh @supports', () => {
  const css = read(ASSETS, 'base.css')
  const idx = css.indexOf('@supports (animation-timeline')
  assert.ok(idx > -1, 'thiếu nhánh @supports (animation-timeline: view())')
  const before = css.slice(0, idx)
  assert.doesNotMatch(before, /\.reveal[^{]*\{[^}]*opacity:\s*0/,
    'có đường dẫn tới nội dung ẩn nằm ngoài nhánh @supports')
})

/* Spec §3.4: biên độ tương phản cỡ chữ là đòn bẩy luxury không tốn gì */
test('H1 hero dùng tới --fs-9', () => {
  assert.match(read(ASSETS, 'base.css'), /var\(--fs-9\)/,
    '--fs-9 được khai trong tokens.css nhưng không chỗ nào dùng')
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/markup.test.mjs`
Expected: FAIL — `Cormorant phải nạp trục 300..700`

- [ ] **Step 3: Hiện thực**

Trong `themes/light-minimal/assets/base.css`:

Đổi dòng 1:

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300..700&family=Inter:wght@300..700&display=swap');
```

Đổi rule `h1` (dòng 26) để mở biên độ cỡ chữ tới `--fs-9`:

```css
h1 { font-size: clamp(var(--fs-7), 6vw, var(--fs-9)); }
```

Thay khối `.reveal` và khối `@media (prefers-reduced-motion: reduce)` ở cuối file bằng:

```css
/*
  Motion (spec §6.2). Luật cứng: MẶC ĐỊNH LÀ HIỆN.
  Trạng thái ẩn chỉ tồn tại bên trong nhánh dưới. Không có đường nào dẫn tới
  nội dung ẩn vĩnh viễn — kể cả khi JS không chạy.
*/
.reveal { opacity: 1; }

@media (prefers-reduced-motion: no-preference) {
  /* Chrome 115+, Safari 26+. Firefox 152 vẫn sau cờ → rơi về IntersectionObserver */
  @supports (animation-timeline: view()) {
    @keyframes reveal-in {
      from { opacity: 0; transform: translateY(1.5rem); }
      to   { opacity: 1; transform: none; }
    }
    .reveal {
      animation: reveal-in linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 35%;
      /* KHÔNG khai animation-duration — nó bị bỏ qua khi có animation-timeline */
    }
  }

  /* Nhánh JS: main.js chỉ thêm class này khi @supports ở trên không chạy */
  .js-reveal { opacity: 0; transform: translateY(1.5rem);
               transition: opacity var(--dur) var(--ease-lux), transform var(--dur) var(--ease-lux); }
  .js-reveal.is-in { opacity: 1; transform: none; }
}

/*
  Variable Font Hover — port ý tưởng từ Fancy Components (MIT, danielpetho/fancy).
  Chạy được là nhờ trục variable nạp ở @import đầu file.
*/
.hover-wght { transition: font-weight var(--dur) var(--ease-lux); }
.hover-wght:hover, .hover-wght:focus-visible { font-weight: 600; }

/*
  Vertical Cut Reveal — port ý tưởng từ Fancy Components (MIT).
  Bọc ngoài mang aria-label nguyên câu, các span con aria-hidden (cut-reveal.mjs).
  animation-fill-mode backwards: trước khi delay trôi hết thì áp trạng thái from,
  nên khi KHÔNG có animation chữ vẫn hiện bình thường.
*/
.cut { display: inline-block; overflow: hidden; vertical-align: bottom; }
.cut__in { display: inline-block; }

@media (prefers-reduced-motion: no-preference) {
  @keyframes cut-up {
    from { transform: translateY(100%); }
    to   { transform: none; }
  }
  .cut__in {
    animation: cut-up var(--dur-slow) var(--ease-lux) backwards;
    animation-delay: calc(var(--i, 0) * 60ms);
  }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/markup.test.mjs`
Expected: PASS, 4 test.

- [ ] **Step 5: Commit**

```bash
git add themes/light-minimal/assets/base.css themes/light-minimal/assets/markup.test.mjs
git commit -m "feat(light-minimal): trục font variable, reveal mặc định hiện, nhánh scroll-driven"
```

---

## Task 5: Thẻ sản phẩm đổi ảnh khi hover

**Files:**
- Modify: `themes/light-minimal/assets/render.mjs`
- Modify: `themes/light-minimal/assets/components.css`
- Test: `themes/light-minimal/assets/render.test.mjs`

**Interfaces:**
- Consumes: `NO_SWAP` từ `catalog.mjs` (Task 1)
- Produces: `cardHtml(product, opts)` — `opts.noSwap` kiểu `boolean`, mặc định `false`

- [ ] **Step 1: Viết test thất bại**

Thêm vào `themes/light-minimal/assets/render.test.mjs`:

```js
const TWO_IMG = {
  sku: 'TUM-1', title: 'DAL Test', type: 'Tumbler', season: 'Halloween',
  price: 49.95, compareAt: 59.95,
  images: ['/products/a/01.webp', '/products/a/02.webp'],
}

test('cardHtml: hai ảnh chồng nhau khi SKU có ảnh 02', () => {
  const html = cardHtml(TWO_IMG)
  assert.match(html, /card__img--primary/)
  assert.match(html, /card__img--hover/)
  assert.match(html, /02\.webp/)
})

/* Ảnh hover là bản sao trang trí — screen reader không được đọc hai lần. */
test('cardHtml: ảnh hover có alt rỗng và aria-hidden', () => {
  const html = cardHtml(TWO_IMG)
  const hover = html.match(/<img[^>]*card__img--hover[^>]*>/)[0]
  assert.match(hover, /alt=""/)
  assert.match(hover, /aria-hidden="true"/)
})

test('cardHtml: noSwap thì không render ảnh hover', () => {
  const html = cardHtml(TWO_IMG, { noSwap: true })
  assert.doesNotMatch(html, /card__img--hover/)
  assert.doesNotMatch(html, /02\.webp/)
})

test('cardHtml: SKU chỉ có một ảnh thì không render ảnh hover', () => {
  const html = cardHtml({ ...TWO_IMG, images: ['/products/a/01.webp'] })
  assert.doesNotMatch(html, /card__img--hover/)
})

test('cardHtml: ảnh hover lazy, không chặn render', () => {
  const hover = cardHtml(TWO_IMG).match(/<img[^>]*card__img--hover[^>]*>/)[0]
  assert.match(hover, /loading="lazy"/)
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/render.test.mjs`
Expected: FAIL — `card__img--primary` không khớp.

- [ ] **Step 3: Hiện thực `render.mjs`**

Thay hàm `cardHtml` trong `themes/light-minimal/assets/render.mjs` bằng:

```js
export function cardHtml(product, opts = {}) {
  const images = product.images ?? []
  const family = displayFamily(deriveStyleFamily(product))
  const typeLabel = TYPE_LABEL[product.type] ?? product.type ?? ''
  const multiPrice = new Set((product.variants ?? []).map((v) => v.price)).size > 1
  const was = !multiPrice && product.compareAt
    ? `<s class="price__was">${formatPrice(product.compareAt)}</s>`
    : ''

  const sizes = 'sizes="(min-width:1280px) 352px, (min-width:768px) 45vw, 90vw"'

  const primary = images[0]
    ? `<img class="card__img card__img--primary" src="${escapeHtml(images[0])}"
           alt="${escapeHtml(imageAlt(product, 0))}"
           loading="lazy" decoding="async" width="1264" height="1264" ${sizes}>`
    : `<div class="card__img card__img--empty" role="presentation"></div>`

  /*
    Ảnh 02 là bản sao trang trí của cùng một sản phẩm — alt rỗng và aria-hidden
    để screen reader không đọc sản phẩm hai lần.
    noSwap: SKU có ảnh 01 sạch nhưng 02 dính watermark (spec §5.2).
  */
  const hover = images[1] && !opts.noSwap
    ? `<img class="card__img card__img--hover" src="${escapeHtml(images[1])}"
           alt="" aria-hidden="true"
           loading="lazy" decoding="async" width="1264" height="1264" ${sizes}>`
    : ''

  return `
    <a class="card reveal" href="/themes/light-minimal/product.html?sku=${encodeURIComponent(product.sku ?? '')}">
      <div class="card__mat"><div class="card__frame">${primary}${hover}</div></div>
      <p class="card__meta label muted">${escapeHtml(typeLabel)} · ${escapeHtml(family)}</p>
      <h3 class="card__title">${escapeHtml(product.title)}</h3>
      <p class="card__price">${priceLabel(product)}${was}</p>
    </a>`
}
```

- [ ] **Step 4: Hiện thực CSS**

Trong `themes/light-minimal/assets/components.css`, thay khối `/* ---- Thẻ Passepartout ---- */` (từ `.card { display: block; ... }` tới hết rule `.card:hover .card__img`) bằng:

```css
/* ---- Thẻ Passepartout (spec §3.1) ---- */
.card { display: block; color: inherit; }

/*
  Thẻ trắng trên trang trắng là vô hình — shadow ở đây là CHỨC NĂNG, không
  phải trang trí. Đây đúng là thứ spec 01/10 không thể có vì Swiss cấm shadow.
*/
.card__mat {
  padding: 1rem;
  background: var(--bg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--dur) var(--ease-lux), transform var(--dur) var(--ease-lux);
}

@media (min-width: 768px)  { .card__mat { padding: 1.25rem; } }
@media (min-width: 1280px) { .card__mat { padding: var(--mat); } }

.card:hover .card__mat,
.card:focus-visible .card__mat {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

/* Hai ảnh chồng đúng một ô lưới */
.card__frame { display: grid; }
.card__frame > * { grid-area: 1 / 1; }

.card__img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  /*
    Viền là cơ chế DUY NHẤT tách ảnh khỏi mặt thẻ. Shadow tách THẺ khỏi TRANG,
    nó không tách ẢNH khỏi MẶT THẺ — 11 ảnh cap nền marble vẫn tan mất nếu bỏ.
  */
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.card__img--empty { background: var(--bg); }

/*
  Máy cảm ứng không có hover thật. Để display:none thì trình duyệt cũng không
  tải ảnh 02 — vừa đúng hành vi vừa tiết kiệm băng thông.
*/
.card__img--hover { display: none; }

@media (hover: hover) {
  .card__img--hover {
    display: block;
    opacity: 0;
    transition: opacity 400ms var(--ease-lux);
  }
  .card:hover .card__img--hover,
  .card:focus-visible .card__img--hover { opacity: 1; }
}
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/*.test.mjs`
Expected: PASS toàn bộ.

- [ ] **Step 6: Commit**

```bash
git add themes/light-minimal/assets/render.mjs themes/light-minimal/assets/components.css themes/light-minimal/assets/render.test.mjs
git commit -m "feat(light-minimal): thẻ nổi khối, đổi ảnh 02 khi hover"
```

---

## Task 6: Hero carousel

**Files:**
- Create: `themes/light-minimal/assets/carousel.mjs`
- Create: `themes/light-minimal/assets/carousel.test.mjs`
- Modify: `themes/light-minimal/assets/components.css`

**Interfaces:**
- Produces: `HERO_SKUS` (`Array<string>`, 3 phần tử), `nextIndex(i, n)`, `prevIndex(i, n)`, `slideLabel(i, n)`, `mountCarousel(rootEl, slides)` — `slides` là `Array<{src: string, alt: string}>`

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/carousel.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HERO_SKUS, nextIndex, prevIndex, slideLabel } from './carousel.mjs'

/*
  Pool hero là 3 frame đã soi bằng mắt ngày 02/10/2026 (spec §4.1).
  XI-003, XI-004, XI-005 dính watermark AURA TUMBLER — XI-005 khắc trên thân
  sản phẩm nên crop vô hiệu. Không có nguồn thay thế trong vùng sạch IP.
*/
test('hero dùng đúng 3 SKU đã soi', () => {
  assert.deepEqual(HERO_SKUS, [
    'TUM-20260923-XI-001',
    'TUM-20260923-XI-002',
    'TUM-20260923-XI-006',
  ])
})

test('nextIndex quay vòng', () => {
  assert.equal(nextIndex(0, 3), 1)
  assert.equal(nextIndex(2, 3), 0)
})

test('prevIndex quay vòng, không ra số âm', () => {
  assert.equal(prevIndex(1, 3), 0)
  assert.equal(prevIndex(0, 3), 2)
})

test('slideLabel đếm từ 1 cho người đọc', () => {
  assert.equal(slideLabel(0, 3), 'Slide 1 of 3')
  assert.equal(slideLabel(2, 3), 'Slide 3 of 3')
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/carousel.test.mjs`
Expected: FAIL — `Cannot find module './carousel.mjs'`

- [ ] **Step 3: Hiện thực `carousel.mjs`**

Tạo `themes/light-minimal/assets/carousel.mjs`:

```js
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
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/carousel.test.mjs`
Expected: PASS, 4 test.

- [ ] **Step 5: Thêm CSS carousel**

Thay khối `/* ---- Hero ---- */` trong `themes/light-minimal/assets/components.css` bằng:

```css
/* ---- Hero carousel (spec §4) ---- */
.hero__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: center;
}

@media (min-width: 900px) {
  .hero__inner { grid-template-columns: 1fr 1.1fr; gap: var(--space-6); }
}

.hero__mat { padding: var(--space-3); box-shadow: var(--shadow-md); }

@media (min-width: 1280px) { .hero__mat { padding: var(--mat-hero); } }

.hero__track { display: grid; }
.hero__track > img { grid-area: 1 / 1; }

.hero__img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-lux);
}

.hero__img.is-current { opacity: 1; }

/* Ken Burns: chậm tới mức không ai bắt được nó đang chạy */
@media (prefers-reduced-motion: no-preference) {
  @keyframes ken-burns { from { transform: scale(1); } to { transform: scale(1.04); } }
  .hero__img.is-current { animation: ken-burns 7s linear both; }
}

.hero__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.hero__dots { display: flex; gap: var(--space-1); }

.hero__dot {
  width: 2rem;
  height: 2px;
  padding: 0;
  background: var(--border);
  border: 0;
  cursor: pointer;
}

/* Chỉ báo trạng thái dùng --accent. KHÔNG dùng --gold: 2.42:1, không đủ */
.hero__dot[aria-current="true"] { background: var(--accent); }

.hero__btn {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--fs-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.5rem 0.75rem;
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
}

.hero__sub { font-size: var(--fs-4); margin-top: var(--space-2); }
```

- [ ] **Step 6: Chạy toàn bộ test**

Run: `node --test themes/light-minimal/assets/*.test.mjs`
Expected: PASS toàn bộ.

- [ ] **Step 7: Commit**

```bash
git add themes/light-minimal/assets/carousel.mjs themes/light-minimal/assets/carousel.test.mjs themes/light-minimal/assets/components.css
git commit -m "feat(light-minimal): hero carousel 3 frame, có nút tạm dừng theo WCAG 2.2.2"
```

---

## Task 7: Trang chủ — 4 dải preview, nav neo cuộn, path tuyệt đối

**Files:**
- Modify: `themes/light-minimal/index.html`
- Modify: `themes/light-minimal/product.html`
- Modify: `themes/light-minimal/assets/main.js`
- Modify: `themes/light-minimal/assets/components.css`
- Test: `themes/light-minimal/assets/markup.test.mjs`

**Interfaces:**
- Consumes: `CURATED`, `curatedByType`, `NO_SWAP`, `sectionId` (Task 1) · `cardHtml(product, opts)` (Task 5) · `HERO_SKUS`, `mountCarousel` (Task 6) · `mountCutReveal` (Task 8)
- Produces: `activeMessages(now)` — giữ nguyên chữ ký cũ

- [ ] **Step 1: Viết test thất bại**

Thêm vào `themes/light-minimal/assets/markup.test.mjs`:

```js
import { TYPE_ORDER, sectionId } from './catalog.mjs'

/*
  Host bật clean-URLs (Vercel, Netlify, `npx serve`) redirect
  /themes/light-minimal/index.html → /themes/light-minimal (không dấu / cuối),
  base URL tụt thành /themes/ và mọi path tương đối lệch một cấp → trang TRẮNG.
  Đã xác nhận bằng chạy thật, không phải suy đoán (spec §8).
*/
test('path asset tuyệt đối ở cả hai trang', () => {
  for (const page of ['index.html', 'product.html']) {
    const html = read(THEME, page)
    assert.doesNotMatch(html, /(href|src)="assets\//,
      `${page} còn path tương đối — clean-URL host sẽ làm trắng trang`)
    assert.match(html, /\/themes\/light-minimal\/assets\//, `${page} thiếu path tuyệt đối`)
  }
})

/* Neo cuộn gãy thì im lặng, không báo lỗi gì — phải có test (spec §9) */
test('mọi dòng sản phẩm có section id tương ứng trong index.html', () => {
  const html = read(THEME, 'index.html')
  for (const type of TYPE_ORDER) {
    assert.match(html, new RegExp(`id="${sectionId(type)}"`),
      `index.html thiếu id="${sectionId(type)}" cho dòng ${type}`)
  }
})

test('sectionId sinh đúng dạng slug', () => {
  assert.equal(sectionId('Tumbler'), 'shop-tumbler')
  assert.equal(sectionId('Shoes'), 'shop-shoes')
})

/* Trang chủ không còn chế độ full catalog nên thanh facet không còn chỗ bám */
test('index.html không còn thanh facet', () => {
  const html = read(THEME, 'index.html')
  assert.doesNotMatch(html, /id="facets"/)
})

/*
  WCAG 2.2.2 Pause, Stop, Hide. Autoplay 6s là nội dung tự cập nhật quá 5 giây.
  Dừng-khi-rê-chuột KHÔNG thoả: người dùng bàn phím không rê chuột (spec §4.3).
*/
test('carousel có nút tạm dừng và nó là <button>', () => {
  const html = read(THEME, 'index.html')
  const m = html.match(/<button[^>]*data-carousel-pause[^>]*>/)
  assert.ok(m, 'không tìm thấy <button data-carousel-pause> — WCAG 2.2.2')
  assert.match(m[0], /type="button"/)
})

test('carousel khai đúng vai trò cho screen reader', () => {
  const html = read(THEME, 'index.html')
  assert.match(html, /aria-roledescription="carousel"/)
  assert.match(html, /data-carousel-live[^>]*aria-live="polite"|aria-live="polite"[^>]*data-carousel-live/)
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/markup.test.mjs`
Expected: FAIL — `Cannot find module './main.js'` hoặc `does not provide an export named 'sectionId'`

- [ ] **Step 3: Viết lại `index.html`**

Thay toàn bộ `themes/light-minimal/index.html` bằng:

```html
<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Goldbourne &amp; Co. — Gilded Editions in Tumblers, Caps, Backpacks and Shoes</title>
<meta name="description" content="Gold-relief tumblers, caps, backpacks and shoes, released in named Editions. Crest, seasonal and gothic ornament. Gilded on every side.">
<link rel="stylesheet" href="/themes/light-minimal/assets/tokens.css">
<link rel="stylesheet" href="/themes/light-minimal/assets/base.css">
<link rel="stylesheet" href="/themes/light-minimal/assets/components.css">
</head>
<body>

<div class="announce" id="announce" role="status" aria-live="polite"></div>

<header class="header">
  <div class="wrap header__inner">
    <a class="wordmark hover-wght" href="/themes/light-minimal/index.html">Goldbourne<span class="wordmark__co">&amp; Co.</span></a>
    <nav class="nav" aria-label="Shop">
      <ul class="nav__list" id="typeNav"></ul>
    </nav>
  </div>
</header>

<main>
  <section class="hero section">
    <div class="wrap hero__inner">
      <div class="hero" id="heroCarousel" role="region"
           aria-roledescription="carousel" aria-label="Featured Editions">
        <div class="hero__mat"><div class="hero__track" data-carousel-track></div></div>
        <p class="visually-hidden" data-carousel-live aria-live="polite"></p>
        <div class="hero__controls">
          <button type="button" class="hero__btn" data-carousel-prev>Prev</button>
          <button type="button" class="hero__btn" data-carousel-next>Next</button>
          <button type="button" class="hero__btn" data-carousel-pause aria-pressed="false">Pause</button>
          <div class="hero__dots" data-carousel-dots></div>
        </div>
      </div>
      <div class="hero__text">
        <h1 data-cut-reveal>Team identity, rewritten in the language of a fashion house.</h1>
        <p class="hero__sub muted">Gilded on every side.</p>
        <a class="btn" href="#shop-tumbler">View the Editions</a>
      </div>
    </div>
  </section>

  <section class="section preview" id="shop-tumbler">
    <div class="wrap">
      <h2 class="preview__heading">Tumblers</h2>
      <div class="grid" data-grid="Tumbler"></div>
    </div>
  </section>

  <section class="section preview" id="shop-cap">
    <div class="wrap">
      <h2 class="preview__heading">Caps</h2>
      <div class="grid" data-grid="Cap"></div>
    </div>
  </section>

  <section class="section preview" id="shop-backpack">
    <div class="wrap">
      <h2 class="preview__heading">Backpacks</h2>
      <div class="grid" data-grid="Backpack"></div>
    </div>
  </section>

  <section class="section preview" id="shop-shoes">
    <div class="wrap">
      <h2 class="preview__heading">Shoes</h2>
      <div class="grid" data-grid="Shoes"></div>
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

<script type="module" src="/themes/light-minimal/assets/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Sửa path trong `product.html`**

Trong `themes/light-minimal/product.html`, đổi 4 dòng:

```html
<link rel="stylesheet" href="/themes/light-minimal/assets/tokens.css">
<link rel="stylesheet" href="/themes/light-minimal/assets/base.css">
<link rel="stylesheet" href="/themes/light-minimal/assets/components.css">
<script type="module" src="/themes/light-minimal/assets/product.js"></script>
```

Không đụng gì khác trong file này.

- [ ] **Step 5: Viết lại `main.js`**

Thay toàn bộ `themes/light-minimal/assets/main.js` bằng:

```js
/* main.js — wiring DOM cho trang chủ. Logic nằm ở catalog.mjs, render.mjs, carousel.mjs. */
import { TYPE_ORDER, TYPE_LABEL, curatedByType, NO_SWAP, sectionId } from './catalog.mjs'
import { cardHtml, imageAlt } from './render.mjs'
import { HERO_SKUS, mountCarousel } from './carousel.mjs'
import { mountCutReveal } from './cut-reveal.mjs'

const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

export function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

async function loadProducts() {
  for (const url of ['/products/products.json', '../../products/products.json']) {
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

/*
  Trang chủ không còn chế độ full catalog (spec §7.3), nên nav là NEO CUỘN
  chứ không phải bộ lọc. Header và footer render cùng markup nên hành xử y hệt
  — control trông giống nhau thì không được cái bấm được cái không.
*/
function renderNav(products, listEl) {
  if (!listEl) return
  listEl.innerHTML = TYPE_ORDER.map((t) => {
    const n = products.filter((p) => p.type === t).length
    return `<li><a class="hover-wght" href="#${sectionId(t)}">${TYPE_LABEL[t]} <span class="muted">${n}</span></a></li>`
  }).join('')
}

/*
  Nhánh fallback cho Firefox (animation-timeline vẫn sau cờ tính tới FF152).
  Chrome 115+ và Safari 26+ chạy nhánh @supports thuần CSS trong base.css và
  KHÔNG đi vào đây. Mặc định của .reveal là HIỆN, nên nếu cả hai nhánh cùng
  im lặng thì nội dung vẫn đọc được.
*/
function observeReveal(root) {
  if (CSS.supports('animation-timeline: view()')) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }
  }, { rootMargin: '0px 0px -10% 0px' })

  root.querySelectorAll('.reveal').forEach((el) => {
    el.classList.add('js-reveal')
    io.observe(el)
  })
}

function renderSections(products) {
  for (const type of TYPE_ORDER) {
    const grid = document.querySelector(`[data-grid="${type}"]`)
    if (!grid) continue
    grid.innerHTML = curatedByType(products, type)
      .map((p) => cardHtml(p, { noSwap: NO_SWAP.has(p.sku) }))
      .join('')
  }
  observeReveal(document.body)
}

function renderHero(products) {
  const root = document.getElementById('heroCarousel')
  if (!root) return
  const bySku = new Map(products.map((p) => [p.sku, p]))
  const slides = HERO_SKUS
    .map((sku) => bySku.get(sku))
    .filter((p) => p?.images?.[0])
    .map((p) => ({ src: p.images[0], alt: imageAlt(p, 0) }))
  if (slides.length === 0) { root.hidden = true; return }
  mountCarousel(root, slides)
}

async function init() {
  startAnnouncement()
  document.querySelectorAll('[data-cut-reveal]').forEach(mountCutReveal)
  const products = await loadProducts()
  renderNav(products, document.getElementById('typeNav'))
  renderNav(products, document.getElementById('footerNav'))
  renderHero(products)
  renderSections(products)
}

init()
```

- [ ] **Step 6: Thêm CSS cho dải preview**

Thêm vào cuối `themes/light-minimal/assets/components.css`:

```css
/* ---- Dải preview (spec §7) ---- */
.preview { padding-block: var(--space-6); }

.preview__heading { margin-bottom: var(--space-4); }

/* Hairline vàng — thứ DUY NHẤT trong theme dùng var(--gold), và chỉ ở border */
.preview + .preview { border-top: 1px solid var(--gold); }
```

Xoá khối `/* ---- Thanh facet ---- */` khỏi `components.css` — trang chủ không còn facet. Giữ lại nếu `product.html` có dùng; kiểm bằng `grep -n "facet" themes/light-minimal/product.html themes/light-minimal/assets/product.js` trước khi xoá.

- [ ] **Step 7: Chạy toàn bộ test**

Run: `node --test themes/light-minimal/assets/*.test.mjs`
Expected: PASS toàn bộ.

- [ ] **Step 8: Commit**

```bash
git add themes/light-minimal/index.html themes/light-minimal/product.html themes/light-minimal/assets/main.js themes/light-minimal/assets/components.css themes/light-minimal/assets/markup.test.mjs
git commit -m "feat(light-minimal): 4 dải preview, nav neo cuộn, path asset tuyệt đối"
```

---

## Task 8: Vertical Cut Reveal

**Files:**
- Create: `themes/light-minimal/assets/cut-reveal.mjs`
- Create: `themes/light-minimal/assets/cut-reveal.test.mjs`

**Interfaces:**
- Consumes: `escapeHtml` từ `render.mjs`
- Produces: `splitWords(text)` → `Array<string>`, `mountCutReveal(el)`

- [ ] **Step 1: Viết test thất bại**

Tạo `themes/light-minimal/assets/cut-reveal.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitWords, cutMarkup } from './cut-reveal.mjs'

test('splitWords giữ lại khoảng trắng để không dính chữ', () => {
  assert.deepEqual(splitWords('a b'), ['a', ' ', 'b'])
})

test('splitWords bỏ chuỗi rỗng', () => {
  assert.ok(splitWords('  a  ').every((s) => s.length > 0))
})

/*
  Tách chữ thành span làm hỏng screen reader nếu làm ẩu: nó đọc từng mảnh rời.
  Bọc ngoài mang aria-label nguyên câu, span con aria-hidden (spec §7.5).
*/
test('cutMarkup: mọi span con đều aria-hidden', () => {
  const html = cutMarkup('one two')
  const spans = html.match(/<span[^>]*>/g) ?? []
  const outer = spans.filter((s) => s.includes('class="cut"'))
  assert.ok(outer.length > 0)
  for (const s of outer) assert.match(s, /aria-hidden="true"/)
})

test('cutMarkup: mỗi từ có chỉ số --i để stagger', () => {
  assert.match(cutMarkup('one two'), /--i:0/)
  assert.match(cutMarkup('one two'), /--i:2/)
})

test('cutMarkup: escape ký tự HTML trong nội dung', () => {
  assert.match(cutMarkup('a<b'), /a&lt;b/)
})
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run: `node --test themes/light-minimal/assets/cut-reveal.test.mjs`
Expected: FAIL — `Cannot find module './cut-reveal.mjs'`

- [ ] **Step 3: Hiện thực**

Tạo `themes/light-minimal/assets/cut-reveal.mjs`:

```js
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
  return splitWords(text).map((w, i) =>
    w.trim() === ''
      ? `<span aria-hidden="true">${escapeHtml(w)}</span>`
      : `<span class="cut" aria-hidden="true" style="--i:${i}"><span class="cut__in">${escapeHtml(w)}</span></span>`
  ).join('')
}

/*
  aria-label mang nguyên câu; mọi mảnh bên trong aria-hidden. Screen reader
  đọc một câu liền mạch thay vì từng từ rời.
*/
export function mountCutReveal(el) {
  if (!el) return
  const text = el.textContent.trim()
  if (!text) return
  el.setAttribute('aria-label', text)
  el.innerHTML = cutMarkup(text)
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

Run: `node --test themes/light-minimal/assets/cut-reveal.test.mjs`
Expected: PASS, 5 test.

- [ ] **Step 5: Commit**

```bash
git add themes/light-minimal/assets/cut-reveal.mjs themes/light-minimal/assets/cut-reveal.test.mjs
git commit -m "feat(light-minimal): Vertical Cut Reveal port sang vanilla"
```

---

## Task 9: Xác minh trên trình duyệt thật

Test `node:test` không chạm DOM. Task này là chỗ duy nhất chứng minh trang thực sự sống.

**Files:** không sửa file nào trừ khi tìm thấy lỗi.

- [ ] **Step 1: Chạy toàn bộ test**

Run: `node --test themes/light-minimal/assets/*.test.mjs`
Expected: PASS toàn bộ, 0 fail. Ghi lại con số thật.

- [ ] **Step 2: Dựng server**

```bash
cd "C:/Users/kevin/Desktop/Dino/html-theme-by-products-01"
python -m http.server 4173 --bind 127.0.0.1
```

Mở `http://127.0.0.1:4173/themes/light-minimal/index.html`.

- [ ] **Step 3: Kiểm trên Chrome**

Xác nhận từng mục, ghi bằng chứng thật — console log, số đếm. Không báo đạt cho thứ chưa nhìn:

- 0 uncaught exception, 0 request 404 (ngoài `/favicon.ico` do trình duyệt tự xin)
- 4 dải, mỗi dải đúng 3 thẻ — tổng 12
- Carousel: tự chạy, đổi frame sau 6s; bấm Pause thì dừng và chữ đổi thành `Play`; Prev/Next nhảy đúng; chấm `aria-current` đổi theo
- Rê chuột lên thẻ: ảnh đổi sang ảnh 02, thẻ nhấc lên
- Tab bằng bàn phím tới một thẻ: ảnh cũng đổi, không chỉ khi rê chuột
- Bấm `Tumblers` / `Caps` / `Backpacks` / `Shoes` ở cả header và footer: cuộn tới đúng dải
- H1 hiện lên theo kiểu cắt dòng; đọc được bằng screen reader như một câu liền

- [ ] **Step 4: Kiểm nhánh fallback**

Trong Chrome DevTools, chạy `CSS.supports('animation-timeline: view()')` — phải trả `true`, nghĩa là đang chạy nhánh CSS thuần.

Để kiểm nhánh Firefox mà không cần cài Firefox: trong DevTools Console chạy `document.querySelectorAll('.reveal').length` và xác nhận > 0, rồi kiểm bằng mắt rằng **không thẻ nào có `opacity: 0` tồn đọng** sau khi cuộn hết trang.

Nếu có Firefox: mở cùng URL, xác nhận 12 thẻ đều hiện đủ.

- [ ] **Step 5: Kiểm clean-URL — đây là bug đã từng làm trắng cả trang**

```bash
npx --yes serve -l 4174
```

Mở `http://localhost:4174/themes/light-minimal/index.html`. Trang **phải hiện bình thường**. Trắng nghĩa là path tuyệt đối ở Task 7 chưa đủ — tìm cho ra file còn sót.

- [ ] **Step 6: Kiểm reduced-motion**

DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Tải lại. Xác nhận: carousel **không** tự chạy, nút vẫn bấm được, 12 thẻ hiện đủ ngay, H1 đọc được.

- [ ] **Step 7: Kiểm responsive**

375 / 768 / 1024 / 1440. Lưới xuống 2 rồi 1 cột; padding thẻ không bị bóp dưới 16px. Ở 375 xác nhận ảnh hover **không** tải (Network tab, lọc `02.webp` — phải trống).

- [ ] **Step 8: Tắt server và báo cáo**

Dừng cả hai server. Báo cáo: số test pass, từng mục Step 3–7 đạt hay không kèm bằng chứng, danh sách lỗi nguyên văn nếu có, và nói rõ phần nào không kiểm được và vì sao.

---

## Ghi chú cho người thi công

**Thứ tự bắt buộc:** Task 1 phải xong trước Task 7 (Task 7 cần `CURATED`). Task 2 phải xong trước Task 3 (Task 3 canh luật mà Task 2 tạo ra). Task 5, 6, 8 độc lập nhau, làm thứ tự nào cũng được.

**Khi test vỡ ngoài dự kiến:** đừng nới test. Bốn test bị viết lại ở Task 2–3 đã được liệt kê đầy đủ trong spec §9. Test nào vỡ mà không nằm trong danh sách đó là dấu hiệu code sai, không phải test sai.

**Thứ không được đụng:** `catalog.mjs` phần `deriveStyleFamily`, `displayFamily`, `byType`, `priceLabel`, `formatPrice` · `render.mjs` phần `imageAlt`, `galleryHtml`, `sectionsHtml`, `escapeHtml`, `ALT_SUFFIX` · toàn bộ `product.js` · toàn bộ `themes/dark-maximalism`.

**`facetCounts()` và `shouldRenderFacets()` giữ lại** dù trang chủ không còn dùng — chúng có test và `product.html` có thể còn dùng. Test xanh không có nghĩa tính năng còn sống.
