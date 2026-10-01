# Goldbourne Static Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng demo tĩnh HTML/CSS/JS thuần gồm một trang chủ hiển thị đủ 65 SKU và một trang PDP mẫu, để duyệt branding Goldbourne & Co. đã chốt trong spec.

**Architecture:** Không framework, không build step cho HTML. Một script Node đọc CSV sản phẩm và quét thư mục ảnh để sinh `data/products.json`; trang chủ fetch file JSON đó rồi render lưới sản phẩm và lọc theo product type bằng JS thuần. CSS tách ba lớp: token → base → component, để giá trị branding nằm một chỗ và port sang theme thật sau này không phải dò.

**Tech Stack:** HTML5 · CSS custom properties · JavaScript ES modules (không thư viện) · Node 22 cho script build và test (`node:test` built-in) · `python3 -m http.server` để serve

**Spec:** `docs/superpowers/specs/2026-09-29-goldbourne-rebrand-design.md`

## Global Constraints

Mọi task đều phải tuân thủ những ràng buộc dưới đây.

**Phạm vi — điều KHÔNG làm trong plan này:**
- Không Astro, không monorepo, không `packages/theme`
- Không trang collection, cart, search, contact, policy
- Không Shopify API, không giỏ hàng thật — nút mua là nút tĩnh
- Không sửa `products/shopify-products-20260928-1542.csv` (4 gap ở §11 spec thuộc store thật, không thuộc demo)
- Chỉ **một** trang PDP mẫu

**Git:** repo chưa khởi tạo git (`git rev-parse` báo *not a git repository*). Nếu muốn commit theo plan, chạy `git init` ở repo root trước Task 1. Nếu không, **bỏ qua mọi bước Commit** — các bước khác không phụ thuộc vào git.

**Màu — Gilded Dark (default scheme), copy nguyên văn từ spec §5:**
```
bg #0B0A08 · surface #14120E · fg #F5F0E6 · muted #A29684
accent #C9A227 · accentFg #100E0A · border #2A251C
```
**Parchment (inverse scheme, dùng cho announcement bar và footer):**
```
bg #F6F1E7 · surface #FFFFFF · fg #14120E · muted #6B6151
accent #7A5F18 · accentFg #FFFFFF · border #DED5C4
```
Không được dùng `#C9A227` làm chữ trên nền Parchment — chỉ đạt 2.1:1. Dùng `#7A5F18` (5.37:1).

**Quy tắc màu đội:** vàng `#C9A227` là màu duy nhất của nav, nút, logo, chip đang chọn. Màu đội không tồn tại trong demo này.

**Chữ:** heading `Cormorant Garamond` weight **600** — chỉ dùng cho h1, h2, blockquote, wordmark. Body và mọi nhãn UI dùng `Inter` 400/500. Nhãn product type dùng Inter 500 in hoa `letter-spacing: 0.08em`, **không** dùng Cormorant.

**Copy — cấm ở mọi nơi trong demo** (spec §8.5), gồm cả `alt`, `title`, tên file:
```
official · officially licensed · licensed · authentic · genuine
NFL · MLB · NBA · WWE        (trong nav, wordmark, tagline, tên file)
<tên cầu thủ bất kỳ>
amazing · must-have · perfect gift for any fan
```
Tên đội **được phép** trong `SEO Title` và trong nội dung mô tả sản phẩm. Tên hiển thị mặt tiền dùng viết tắt (`DAL`, `PHI`, `KC`, `SF`) — đây là giá trị có sẵn trong trường `Title` của CSV, giữ nguyên, không đổi.

**Tagline:** `Gilded on every side.` — không dùng câu cũ `No plain side to turn to the wall.`

**Ảnh:** dùng file local trong `products/`, không trỏ `all-products.taveris.co`. Một thư mục có dấu cách bất thường — `products/Backpack/NFL/NFL- Las-Vegas-Raiders/` (có space sau `NFL-`) — nên mọi đường dẫn ảnh phải chạy qua `encodeURI()`.

**Cách chạy demo:** serve từ **repo root**, không mở bằng `file://` (fetch JSON sẽ bị chặn):
```bash
python3 -m http.server 8000
# mở http://localhost:8000/demo/
```

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `demo/scripts/csv.mjs` | Parser CSV thuần (RFC4180: quote, quote lồng, dấu phẩy trong field). Không biết gì về sản phẩm. |
| `demo/scripts/build-products.mjs` | Đọc CSV + quét `products/` → sinh `demo/data/products.json`. Là nơi duy nhất chứa logic suy ra `season` và `leagueLabel`. |
| `demo/scripts/build-products.test.mjs` | Test cho hai file trên. |
| `demo/data/products.json` | Sinh ra, không sửa tay. |
| `demo/assets/tokens.css` | **Chỉ** chứa custom property: màu, font, spacing. Nơi duy nhất có mã hex. |
| `demo/assets/base.css` | Reset, typography, layout gốc. Dùng token, không hardcode màu. |
| `demo/assets/components.css` | Card, chip, button, announcement, footer, PDP. Dùng token. |
| `demo/assets/main.js` | Trang chủ: fetch JSON, render lưới, lọc product type, xoay announcement. |
| `demo/assets/product.js` | PDP: fetch JSON, render một SKU. |
| `demo/index.html` | Trang chủ — 7 khối theo spec §8.3. |
| `demo/product.html` | PDP mẫu. |

CSS tách ba lớp vì lý do thật: `tokens.css` là thứ duy nhất phải port khi dựng theme thật. Giữ nó sạch khỏi layout nghĩa là port chỉ cần copy một file.

---

### Task 1: Parser CSV

**Files:**
- Create: `demo/scripts/csv.mjs`
- Test: `demo/scripts/build-products.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces: `parseCsv(text: string) => string[][]` — trả về mảng hàng, mỗi hàng là mảng ô đã bóc quote. `toRecords(rows: string[][]) => Record<string,string>[]` — dùng hàng đầu làm khoá.

- [ ] **Step 1: Viết test thất bại**

Tạo `demo/scripts/build-products.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, toRecords } from './csv.mjs'

test('parseCsv: tách ô đơn giản', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,2,3'), [['a','b','c'], ['1','2','3']])
})

test('parseCsv: giữ dấu phẩy nằm trong ô có quote', () => {
  assert.deepEqual(parseCsv('a,b\n"x,y",z'), [['a','b'], ['x,y','z']])
})

test('parseCsv: quote lồng viết bằng hai dấu nháy', () => {
  assert.deepEqual(parseCsv('a\n"8.7"" L"'), [['a'], ['8.7" L']])
})

test('parseCsv: xuống dòng bên trong ô có quote không cắt hàng', () => {
  assert.deepEqual(parseCsv('a,b\n"one\ntwo",z'), [['a','b'], ['one\ntwo','z']])
})

test('toRecords: dùng hàng đầu làm khoá', () => {
  const rows = [['Title','Type'], ['Lunar','Tumbler']]
  assert.deepEqual(toRecords(rows), [{ Title: 'Lunar', Type: 'Tumbler' }])
})
```

- [ ] **Step 2: Chạy test để xác nhận nó thất bại**

```bash
node --test "demo/scripts/*.test.mjs"
```
Expected: FAIL — `Cannot find module './csv.mjs'`

- [ ] **Step 3: Viết parser**

Tạo `demo/scripts/csv.mjs`:

```js
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let started = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
      continue
    }
    if (c === '"') { inQuotes = true; started = true }
    else if (c === ',') { row.push(field); field = ''; started = true }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; started = false }
    else if (c !== '\r') { field += c; started = true }
  }
  if (started || field !== '' || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

export function toRecords(rows) {
  if (rows.length === 0) return []
  const [header, ...body] = rows
  return body.map((cells) => {
    const rec = {}
    header.forEach((key, i) => { rec[key] = cells[i] ?? '' })
    return rec
  })
}
```

- [ ] **Step 4: Chạy test để xác nhận nó pass**

```bash
node --test "demo/scripts/*.test.mjs"
```
Expected: PASS — 5 test

- [ ] **Step 5: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/scripts/csv.mjs demo/scripts/build-products.test.mjs
git commit -m "feat(demo): thêm parser CSV cho script build sản phẩm"
```

---

### Task 2: Script sinh products.json

**Files:**
- Create: `demo/scripts/build-products.mjs`
- Modify: `demo/scripts/build-products.test.mjs` (thêm test vào cuối)
- Generate: `demo/data/products.json`

**Interfaces:**
- Consumes: `parseCsv`, `toRecords` từ `./csv.mjs`
- Produces:
  - `deriveSeason(record) => 'Halloween' | 'Christmas' | 'Year-round'`
  - `deriveLeagueLabel(collection: string) => string` — `'Tumbler Halloween'` → `'No team'`, `'Tumbler NFL'` → `'NFL'`
  - `buildProducts(csvText: string, skuDirIndex: Map<string,string>) => Product[]`
  - File `demo/data/products.json` hình dạng `{ generatedAt, count, products: Product[] }`

  `Product` = `{ handle, sku, title, seoTitle, type, league, leagueLabel, season, price, compareAt, variantLabel, variants: {value, price, compareAt}[], images: string[], hook: string, sections: {heading, html}[] }`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `demo/scripts/build-products.test.mjs`:

```js
import { deriveSeason, deriveLeagueLabel, buildProducts } from './build-products.mjs'

test('deriveSeason: sản phẩm không phải tumbler luôn là year-round', () => {
  assert.equal(deriveSeason({ Type: 'Cap', 'URL handle': 'cap-nfl-x', Title: 'X', Tags: '' }), 'Year-round')
  assert.equal(deriveSeason({ Type: 'Shoes', 'URL handle': 'shoes-nfl-x', Title: 'X', Tags: '' }), 'Year-round')
})

test('deriveSeason: tumbler có từ khoá holiday là Christmas', () => {
  const rec = { Type: 'Tumbler', 'URL handle': 'tumbler-40oz-mlb-atlanta-braves-christmas-tum-1', Title: 'ATL Midnight Christmas', Tags: '' }
  assert.equal(deriveSeason(rec), 'Christmas')
})

test('deriveSeason: tumbler còn lại là Halloween', () => {
  const rec = { Type: 'Tumbler', 'URL handle': 'tumbler-40oz-halloween-general-tum-1', Title: 'Gothic Skull', Tags: '' }
  assert.equal(deriveSeason(rec), 'Halloween')
})

test('deriveLeagueLabel: Tumbler Halloween đổi nhãn thành No team', () => {
  assert.equal(deriveLeagueLabel('Tumbler Halloween'), 'No team')
  assert.equal(deriveLeagueLabel('Tumbler NFL'), 'NFL')
  assert.equal(deriveLeagueLabel('Cap NFL'), 'NFL')
})

test('buildProducts: gom variant và ảnh về một sản phẩm', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p><h3>Design Story</h3><p>Body.</p>,Backpack,,Size,S,49.95,59.95,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
    'bp-x-bp-20260923-xi-019,,,,,,M,59.95,69.95,https://cdn/02-main.webp,2,,',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  const out = buildProducts(csv, index)

  assert.equal(out.length, 1)
  assert.equal(out[0].sku, 'BP-20260923-XI-019')
  assert.equal(out[0].title, 'Vegas Noir')
  assert.equal(out[0].price, 49.95)
  assert.equal(out[0].variantLabel, 'Size')
  assert.deepEqual(out[0].variants.map(v => v.value), ['S', 'M'])
  assert.equal(out[0].hook, 'Hook.')
  assert.deepEqual(out[0].sections, [{ heading: 'Design Story', html: '<p>Body.</p>' }])
})

test('buildProducts: đường dẫn ảnh trỏ local và đã encode dấu cách', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p>,Backpack,,Title,Default Title,49.95,,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  const out = buildProducts(csv, index)

  assert.equal(out[0].images[0], '/products/Backpack/NFL/NFL-%20Las-Vegas-Raiders/BP-20260923-XI-019/01.webp')
  assert.ok(!out[0].images[0].includes('taveris'))
})

test('buildProducts: variant không có compare-at thì trả null', () => {
  const csv = [
    'URL handle,Title,Body (HTML),Type,Tags,Option1 Name,Option1 Value,Variant Price,Variant Compare At Price,Image Src,Image Position,SEO Title,Collection',
    'bp-x-bp-20260923-xi-019,Vegas Noir,<p>Hook.</p>,Backpack,,Title,Default Title,49.95,,https://cdn/01-main.webp,1,Raiders Backpack,Backpack NFL',
  ].join('\n')
  const index = new Map([['BP-20260923-XI-019', 'products/Backpack/NFL/NFL- Las-Vegas-Raiders/BP-20260923-XI-019']])
  assert.equal(buildProducts(csv, index)[0].compareAt, null)
})
```

- [ ] **Step 2: Chạy test để xác nhận nó thất bại**

```bash
node --test "demo/scripts/*.test.mjs"
```
Expected: FAIL — `Cannot find module './build-products.mjs'`

- [ ] **Step 3: Viết script**

Tạo `demo/scripts/build-products.mjs`:

```js
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, toRecords } from './csv.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const CSV_PATH = join(REPO_ROOT, 'products', 'shopify-products-20260928-1542.csv')
const OUT_PATH = join(REPO_ROOT, 'demo', 'data', 'products.json')
const SKU_PATTERN = /^(BP|CAP|SNK|TUM)-\d{8}-[A-Z]{2}-\d{3}$/
const CHRISTMAS_WORDS = ['christmas', 'holiday', 'nutcracker', 'winter']

export function deriveSeason(record) {
  if (record.Type !== 'Tumbler') return 'Year-round'
  const blob = `${record['URL handle']} ${record.Title} ${record.Tags}`.toLowerCase()
  return CHRISTMAS_WORDS.some((w) => blob.includes(w)) ? 'Christmas' : 'Halloween'
}

export function deriveLeagueLabel(collection) {
  const league = collection.split(' ').slice(1).join(' ')
  return league === 'Halloween' ? 'No team' : league
}

function parseBody(html) {
  const hookMatch = html.match(/^<p>(.*?)<\/p>/s)
  const hook = hookMatch ? hookMatch[1] : ''
  const sections = []
  const re = /<h3>(.*?)<\/h3>(.*?)(?=<h3>|$)/gs
  let m
  while ((m = re.exec(html)) !== null) {
    sections.push({
      heading: m[1].replace(/&amp;/g, '&').trim(),
      html: m[2].trim(),
    })
  }
  return { hook, sections }
}

function skuFromHandle(handle) {
  const m = handle.match(/((?:bp|cap|snk|tum)-\d{8}-[a-z]{2}-\d{3})$/)
  return m ? m[1].toUpperCase() : null
}

/*
  Trả về path TƯƠNG ĐỐI so với `base`, không phải tuyệt đối — vì giá trị này
  đi thẳng vào thuộc tính src của thẻ img trong trình duyệt.
*/
export function indexSkuDirs(rootDir, base = rootDir) {
  const index = new Map()
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (!statSync(full).isDirectory()) continue
      if (SKU_PATTERN.test(entry)) index.set(entry, relative(base, full).replace(/\\/g, '/'))
      else walk(full)
    }
  }
  walk(rootDir)
  return index
}

export function buildProducts(csvText, skuDirIndex) {
  const records = toRecords(parseCsv(csvText))
  const byHandle = new Map()

  for (const rec of records) {
    const handle = rec['URL handle']
    if (!handle) continue
    if (!byHandle.has(handle)) byHandle.set(handle, { base: null, rows: [] })
    const bucket = byHandle.get(handle)
    if (rec.Title) bucket.base = rec
    bucket.rows.push(rec)
  }

  const products = []
  for (const [handle, { base, rows }] of byHandle) {
    if (!base) continue
    const sku = skuFromHandle(handle)
    const dir = sku ? skuDirIndex.get(sku) : null

    const variants = rows
      .filter((r) => r['Variant Price'])
      .map((r) => ({
        value: r['Option1 Value'] === 'Default Title' ? null : r['Option1 Value'],
        price: Number(r['Variant Price']),
        compareAt: r['Variant Compare At Price'] ? Number(r['Variant Compare At Price']) : null,
      }))

    const imageCount = rows.filter((r) => r['Image Src']).length
    const images = dir
      ? Array.from({ length: imageCount }, (_, i) =>
          encodeURI('/' + join(dir, String(i + 1).padStart(2, '0') + '.webp').replace(/\\/g, '/')))
      : []

    const { hook, sections } = parseBody(base['Body (HTML)'])
    const optionName = base['Option1 Name']

    products.push({
      handle,
      sku,
      title: base.Title,
      seoTitle: base['SEO Title'],
      type: base.Type,
      league: base.Collection.split(' ').slice(1).join(' '),
      leagueLabel: deriveLeagueLabel(base.Collection),
      season: deriveSeason(base),
      price: variants.length ? variants[0].price : null,
      compareAt: variants.length ? variants[0].compareAt : null,
      variantLabel: optionName && optionName !== 'Title' ? optionName : null,
      variants,
      images,
      hook,
      sections,
    })
  }
  return products
}

function main() {
  const csvText = readFileSync(CSV_PATH, 'utf8')
  const index = indexSkuDirs(join(REPO_ROOT, 'products'), REPO_ROOT)
  const products = buildProducts(csvText, index)
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: products.length,
    products,
  }, null, 2))
  console.log(`Đã ghi ${products.length} sản phẩm vào ${OUT_PATH}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
```

- [ ] **Step 4: Chạy test để xác nhận nó pass**

```bash
node --test "demo/scripts/*.test.mjs"
```
Expected: PASS — 12 test

- [ ] **Step 5: Sinh file JSON thật và kiểm tra số liệu khớp spec**

```bash
node demo/scripts/build-products.mjs
node -e "
const d = require('./demo/data/products.json')
const by = (k) => d.products.reduce((a,p) => (a[p[k]] = (a[p[k]]||0)+1, a), {})
console.log('count:', d.count)
console.log('type:', by('type'))
console.log('season:', by('season'))
console.log('thiếu ảnh:', d.products.filter(p => p.images.length === 0).length)
console.log('ảnh mẫu:', d.products[0].images[0])
"
```

Expected — phải khớp **chính xác** spec §2.1 và §2.2:
```
count: 65
type: { Backpack: 8, Cap: 11, Shoes: 3, Tumbler: 43 }
season: { 'Year-round': 22, Halloween: 33, Christmas: 10 }
thiếu ảnh: 0
```
Nếu `count` khác 65 hoặc `season` khác con số trên, **dừng lại và sửa script** — đừng đi tiếp.

- [ ] **Step 6: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/scripts/build-products.mjs demo/scripts/build-products.test.mjs demo/data/products.json
git commit -m "feat(demo): sinh products.json từ CSV và thư mục ảnh local"
```

---

### Task 3: Design token và CSS nền

**Files:**
- Create: `demo/assets/tokens.css`
- Create: `demo/assets/base.css`

**Interfaces:**
- Consumes: không có
- Produces: các custom property dùng ở mọi file CSS sau — `--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--accent-fg`, `--border`, và bộ `--p-*` cho Parchment. Class `.parchment` để đảo scheme trên một vùng.

- [ ] **Step 1: Viết tokens.css**

```css
/* Nơi DUY NHẤT chứa mã màu. Port sang theme thật = copy file này. */
:root {
  /* Gilded Dark — default scheme (spec §5) */
  --bg: #0B0A08;
  --surface: #14120E;
  --fg: #F5F0E6;
  --muted: #A29684;
  --accent: #C9A227;        /* 8.18:1 trên --bg, WCAG AAA */
  --accent-fg: #100E0A;
  --border: #2A251C;

  /* Parchment — inverse scheme (spec §5) */
  --p-bg: #F6F1E7;
  --p-surface: #FFFFFF;
  --p-fg: #14120E;
  --p-muted: #6B6151;
  --p-accent: #7A5F18;      /* 5.37:1 — KHÔNG dùng #C9A227 trên nền sáng (2.1:1) */
  --p-accent-fg: #FFFFFF;
  --p-border: #DED5C4;

  --font-heading: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2.5rem;
  --space-6: 4rem;

  --radius: 4px;
  --maxw: 1200px;
}

/* Đảo sang Parchment cho announcement bar và footer */
.parchment {
  --bg: var(--p-bg);
  --surface: var(--p-surface);
  --fg: var(--p-fg);
  --muted: var(--p-muted);
  --accent: var(--p-accent);
  --accent-fg: var(--p-accent-fg);
  --border: var(--p-border);
}
```

- [ ] **Step 2: Viết base.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Inter:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Cormorant CHỈ cho h1, h2, blockquote, wordmark — spec §6 */
h1, h2, blockquote, .wordmark {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.15;
  margin: 0;
}

h1 { font-size: clamp(2rem, 5vw, 3.5rem); text-transform: none; }
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); }

h3 {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin: 0 0 var(--space-2);
}

p { margin: 0 0 var(--space-3); }

a { color: inherit; text-decoration: none; }
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

img { display: block; max-width: 100%; }

.wrap {
  max-width: var(--maxw);
  margin-inline: auto;
  padding-inline: var(--space-3);
}

.section { padding-block: var(--space-6); }

/* Nhãn UI — Inter 500 in hoa, KHÔNG dùng Cormorant (spec §6) */
.label {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.muted { color: var(--muted); }
.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}
```

- [ ] **Step 3: Kiểm tra không có mã màu nào rò rỉ ra ngoài tokens.css**

```bash
grep -nE '#[0-9A-Fa-f]{3,8}\b' demo/assets/base.css && echo "LỖI: có hex ngoài tokens.css" || echo "OK: base.css chỉ dùng token"
```
Expected: `OK: base.css chỉ dùng token`

- [ ] **Step 4: Kiểm tra tokens.css có đủ 14 token màu đúng giá trị spec**

```bash
node -e "
const css = require('fs').readFileSync('demo/assets/tokens.css','utf8')
const want = {
  '--bg':'#0B0A08','--surface':'#14120E','--fg':'#F5F0E6','--muted':'#A29684',
  '--accent':'#C9A227','--accent-fg':'#100E0A','--border':'#2A251C',
  '--p-bg':'#F6F1E7','--p-surface':'#FFFFFF','--p-fg':'#14120E','--p-muted':'#6B6151',
  '--p-accent':'#7A5F18','--p-accent-fg':'#FFFFFF','--p-border':'#DED5C4'
}
let bad = 0
for (const [k,v] of Object.entries(want)) {
  const re = new RegExp(k.replace(/[-]/g,'\\\\-') + ':\\\\s*' + v, 'i')
  if (!re.test(css)) { console.log('SAI hoặc THIẾU:', k, '=>', v); bad++ }
}
console.log(bad === 0 ? 'OK: đủ 14 token, khớp spec' : bad + ' token sai')
process.exit(bad === 0 ? 0 : 1)
"
```
Expected: `OK: đủ 14 token, khớp spec`

- [ ] **Step 5: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/assets/tokens.css demo/assets/base.css
git commit -m "feat(demo): thêm design token và CSS nền theo spec branding"
```

---

### Task 4: Component CSS

**Files:**
- Create: `demo/assets/components.css`

**Interfaces:**
- Consumes: token từ `tokens.css`
- Produces: các class mà Task 5 và Task 6 sẽ dùng — `.announce`, `.site-header`, `.hero`, `.type-nav`, `.chip`, `.grid`, `.card`, `.card__media`, `.card__scrim`, `.card__body`, `.price`, `.price__was`, `.btn`, `.specs`, `.pair`, `.site-footer`, `.pdp`, `.pdp__gallery`, `.pdp__info`

Điểm quan trọng nhất của task này là `.card` — cơ chế **full-bleed + scrim** ở spec §5, thứ khiến 11 ảnh cap nền sáng và ảnh lifestyle nền sáng không trông như miếng vá trên nền đen.

- [ ] **Step 1: Viết components.css**

```css
/* ---- Announcement bar (Parchment) ---- */
.announce {
  background: var(--bg);
  color: var(--fg);
  text-align: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  font-size: 0.8125rem;
}

/* ---- Header ---- */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-block: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.wordmark {
  color: var(--accent);
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1;
}
.wordmark small {
  display: block;
  font-size: 0.5em;
  letter-spacing: 0.16em;
}

.site-header nav { display: flex; gap: var(--space-4); }
.site-header nav a { color: var(--muted); }
.site-header nav a:hover { color: var(--accent); }

/* ---- Hero ---- */
.hero { padding-block: var(--space-6); text-align: center; }
.hero p { color: var(--muted); max-width: 46ch; margin-inline: auto; }

/* ---- Thanh product type ---- */
.type-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-block: var(--space-4);
}

.chip {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}
.chip:hover { color: var(--fg); }
.chip[aria-pressed='true'] {
  background: var(--accent);
  color: var(--accent-fg);
  border-color: var(--accent);
}
.chip .count { opacity: 0.7; margin-left: var(--space-1); }

/* ---- Lưới sản phẩm ---- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: var(--space-3);
}

/*
  Full-bleed + scrim (spec §5).
  Ảnh tràn kín card, không padding → ảnh nền sáng đọc như CỬA SỔ, không phải
  miếng dán. Chữ đọc được trên cả ảnh sáng lẫn tối bằng một cơ chế duy nhất,
  không rẽ nhánh theo product type.

  Gradient nằm trên CHÍNH .card__body, không chỉ trên .card__scrim. Lý do:
  .card__scrim cao theo phần trăm chiều cao THẺ (aspect-ratio 1/1 nên bằng
  chiều rộng thẻ), còn thứ cần che là chiều cao NỘI DUNG — hai đại lượng
  không liên quan nhau. Tên sản phẩm thật dài 55–66 ký tự nên luôn wrap 2
  dòng, đẩy nội dung lên ~117px, trong khi thẻ 234–309px cho scrim 35% chỉ
  82–108px. .card__body tự cao bằng nội dung nên gradient của nó không bao
  giờ hụt, bất kể viewport.
*/
.card {
  position: relative;
  display: block;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}

.card__media {
  aspect-ratio: 1 / 1;
  width: 100%;
  object-fit: cover;
}

.card__scrim {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 55%;
  background: linear-gradient(to bottom, transparent, var(--bg));
  pointer-events: none;
}

.card__body {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: var(--space-4) var(--space-3) var(--space-3);
  background: linear-gradient(to bottom, transparent, var(--bg) 35%);
}

.card__title {
  /* Phải reset: h3 toàn cục là nhãn UI in hoa màu muted, còn đây là tên sản phẩm */
  font-family: var(--font-body);
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  color: var(--fg);
  font-size: 0.875rem;
  line-height: 1.35;
  margin: 0 0 var(--space-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

/* ---- Giá ---- */
.price { color: var(--accent); font-weight: 500; }
.card__body .price { font-size: 0.875rem; line-height: 1.4; }
.price__was {
  color: var(--muted);
  text-decoration: line-through;
  margin-left: var(--space-2);
  font-weight: 400;
}

/* ---- Nút ---- */
.btn {
  display: inline-block;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--accent);
  color: var(--accent-fg);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
}
.btn--ghost { background: transparent; color: var(--accent); }

/* ---- Khối thông số dùng chung ---- */
.specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
  border-block: 1px solid var(--border);
  padding-block: var(--space-4);
  list-style: none;
  margin: 0;
  padding-inline: 0;
}
.specs li { font-size: 0.875rem; }
.specs li::before { content: '—'; color: var(--accent); margin-right: var(--space-2); }

/* ---- The Pair ---- */
.pair {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  text-align: center;
}

/* ---- Footer (Parchment) ---- */
.site-footer {
  background: var(--bg);
  color: var(--fg);
  padding-block: var(--space-5);
  border-top: 1px solid var(--border);
}
.site-footer a { color: var(--accent); }
.site-footer .cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

/* ---- PDP ---- */
.pdp {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  padding-block: var(--space-5);
}
@media (min-width: 900px) {
  .pdp { grid-template-columns: 1.1fr 1fr; }
}

.pdp__gallery { display: grid; gap: var(--space-2); }
.pdp__gallery img {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.pdp__thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
}
.pdp__info section { margin-bottom: var(--space-4); }
.pdp__variants { display: flex; gap: var(--space-2); flex-wrap: wrap; }
```

- [ ] **Step 2: Kiểm tra không có hex rò rỉ**

```bash
grep -nE '#[0-9A-Fa-f]{3,8}\b' demo/assets/components.css && echo "LỖI: có hex ngoài tokens.css" || echo "OK: components.css chỉ dùng token"
```
Expected: `OK: components.css chỉ dùng token`

- [ ] **Step 3: Kiểm tra cơ chế scrim có mặt**

```bash
node -e "
const css = require('fs').readFileSync('demo/assets/components.css','utf8')
const checks = [
  ['.card__scrim tồn tại', /\.card__scrim\s*\{/],
  ['scrim dùng linear-gradient tới --bg', /linear-gradient\([^)]*var\(--bg\)/],
  ['scrim cao 55%', /\.card__scrim[\s\S]*?height:\s*55%/],
  ['.card__body có gradient riêng', /\.card__body[\s\S]*?linear-gradient/],
  ['.price trong card có font-size riêng', /\.card__body\s+\.price[\s\S]*?font-size/],
  ['ảnh card full-bleed (object-fit cover)', /\.card__media[\s\S]*?object-fit:\s*cover/],
  ['chip đang chọn dùng --accent', /aria-pressed='true'\][\s\S]*?background:\s*var\(--accent\)/],
]
let bad = 0
for (const [name, re] of checks) { const ok = re.test(css); console.log((ok?'OK  ':'THIẾU') + '  ' + name); if (!ok) bad++ }
process.exit(bad === 0 ? 0 : 1)
"
```
Expected: cả 7 dòng đều `OK`

- [ ] **Step 4: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/assets/components.css
git commit -m "feat(demo): thêm component CSS với card full-bleed và scrim"
```

---

### Task 5: Trang chủ

**Files:**
- Create: `demo/index.html`
- Create: `demo/assets/main.js`

**Interfaces:**
- Consumes: `demo/data/products.json` (Task 2), toàn bộ class CSS (Task 3, 4)
- Produces: trang chủ chạy được. Task 6 sẽ tái dùng `formatPrice()` và cách fetch JSON từ file này bằng cách viết lại trong `product.js` (hai file độc lập, không import lẫn nhau).

Trang chủ gồm đúng 7 khối theo spec §8.3: announcement · header · hero · thanh product type · khối thông số · The Pair · footer.

- [ ] **Step 1: Viết index.html**

```html
<!DOCTYPE html>
<html lang="en">
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

<!-- 1. Announcement (Parchment) -->
<div class="parchment announce" id="announce" role="status"></div>

<div class="wrap">
  <!-- 2. Header -->
  <header class="site-header">
    <a href="index.html" class="wordmark">Goldbourne<small>&amp; Co.</small></a>
    <nav class="label" aria-label="Chính">
      <a href="#shop">Shop</a>
      <a href="#specs">The Editions</a>
    </nav>
  </header>

  <!-- 3. Hero -->
  <section class="hero">
    <h1>Gilded on every side.</h1>
    <p>Gold-relief tumblers, caps, backpacks and shoes, released in Editions.</p>
    <p><a class="btn" href="#shop">Browse the Editions</a></p>
  </section>

  <!-- 4. Thanh product type -->
  <div id="shop">
    <div class="type-nav" id="typeNav" role="group" aria-label="Lọc theo loại sản phẩm"></div>
    <p class="muted label" id="resultCount" aria-live="polite"></p>
    <div class="grid" id="grid"></div>
  </div>

  <!-- 5. Khối thông số dùng chung -->
  <section class="section" id="specs">
    <h2>What you're actually holding</h2>
    <ul class="specs">
      <li>40 oz capacity</li>
      <li>Stainless steel, double wall</li>
      <li>2-in-1 lid</li>
      <li>Ergonomic handle</li>
      <li>All-over print</li>
      <li>Hand wash</li>
    </ul>
    <p class="muted">Thông số tumbler hiện chỉ có dung tích trong dữ liệu nguồn. Phần còn lại là chỗ dành sẵn — xem §8.2 của spec.</p>
  </section>

  <!-- 6. The Pair -->
  <section class="section">
    <div class="pair">
      <h2>The Pair</h2>
      <p class="muted">Two Editions, released together.</p>
      <p class="price">$89.95</p>
      <button class="btn btn--ghost" type="button">Add the Pair</button>
    </div>
  </section>
</div>

<!-- 7. Footer (Parchment) -->
<footer class="parchment site-footer">
  <div class="wrap cols">
    <div>
      <h3>Shop</h3>
      <p><a href="#shop">Tumblers</a><br><a href="#shop">Caps</a><br><a href="#shop">Backpacks</a><br><a href="#shop">Shoes</a></p>
    </div>
    <div>
      <h3>Goldbourne &amp; Co.</h3>
      <p class="muted">Gilded on every side.</p>
    </div>
    <div>
      <h3>Demo</h3>
      <p class="muted">Bản tĩnh để duyệt thiết kế. Nút mua không hoạt động.</p>
    </div>
  </div>
</footer>

<script type="module" src="assets/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Viết main.js**

```js
const TYPE_ORDER = ['Tumbler', 'Cap', 'Backpack', 'Shoes']
const TYPE_LABEL = { Tumbler: 'Tumblers', Cap: 'Caps', Backpack: 'Backpacks', Shoes: 'Shoes' }

// Cutoff sinh từ công thức ở spec §2.3, không hardcode ngày hiển thị.
const HALLOWEEN_CUTOFF = new Date('2026-10-09T23:59:59')

const MESSAGES = [
  { text: 'Order by Oct 9 to arrive before Halloween.', until: HALLOWEEN_CUTOFF },
  { text: 'The Pair — two Editions, $89.95.', until: null },
]

export function formatPrice(n) {
  return n == null ? '' : '$' + n.toFixed(2)
}

export function activeMessages(now = new Date()) {
  return MESSAGES.filter((m) => m.until === null || now <= m.until)
}

function cardHtml(p) {
  const img = p.images[0] ?? ''
  const was = p.compareAt ? `<span class="price__was">${formatPrice(p.compareAt)}</span>` : ''
  return `
    <a class="card" href="product.html?sku=${encodeURIComponent(p.sku)}">
      <img class="card__media" src="${img}" alt="${p.title} — front" loading="lazy" width="600" height="600">
      <div class="card__scrim"></div>
      <div class="card__body">
        <span class="card__meta">${TYPE_LABEL[p.type]} · ${p.leagueLabel}</span>
        <h3 class="card__title">${p.title}</h3>
        <span class="price">${formatPrice(p.price)}${was}</span>
      </div>
    </a>`
}

function render(products, activeType) {
  const shown = activeType === 'All' ? products : products.filter((p) => p.type === activeType)
  document.getElementById('grid').innerHTML = shown.map(cardHtml).join('')
  document.getElementById('resultCount').textContent = `${shown.length} Editions`
  for (const btn of document.querySelectorAll('#typeNav .chip')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.type === activeType))
  }
}

function buildNav(products, onSelect) {
  const counts = products.reduce((acc, p) => ({ ...acc, [p.type]: (acc[p.type] ?? 0) + 1 }), {})
  const entries = [['All', products.length], ...TYPE_ORDER.map((t) => [t, counts[t] ?? 0])]
  const nav = document.getElementById('typeNav')
  nav.innerHTML = entries.map(([type, n]) => `
    <button class="chip" type="button" data-type="${type}" aria-pressed="false">
      ${type === 'All' ? 'All' : TYPE_LABEL[type]}<span class="count">${n}</span>
    </button>`).join('')
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip')
    if (btn) onSelect(btn.dataset.type)
  })
}

function startAnnouncement() {
  const el = document.getElementById('announce')
  const msgs = activeMessages()
  if (msgs.length === 0) { el.hidden = true; return }
  let i = 0
  el.textContent = msgs[0].text
  if (msgs.length > 1) {
    setInterval(() => { i = (i + 1) % msgs.length; el.textContent = msgs[i].text }, 5000)
  }
}

async function main() {
  startAnnouncement()
  const res = await fetch('data/products.json')
  const { products } = await res.json()
  // Sort theo độ lớn nhóm, bỏ sort alphabet (spec §4)
  products.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
  buildNav(products, (type) => render(products, type))
  render(products, 'All')
}

main()
```

- [ ] **Step 3: Serve và mở trang chủ**

```bash
python3 -m http.server 8000
```
Mở `http://localhost:8000/demo/` trong trình duyệt.

- [ ] **Step 4: Kiểm tra bằng mắt — 8 điểm**

Xác nhận từng điểm, sửa nếu sai:

1. Announcement bar **nền kem sáng** (Parchment), chữ tối — không phải nền đen
2. Wordmark `GOLDBOURNE & CO.` màu vàng, serif
3. H1 đọc đúng `Gilded on every side.` — **không** phải câu cũ về plain side
4. Thanh chip hiện `All 65 · Tumblers 43 · Caps 11 · Backpacks 8 · Shoes 3` — đúng thứ tự độ lớn
5. Bấm `Caps` → lưới còn 11 thẻ, chip Caps nền vàng chữ đen
6. **Thẻ cap (nền marble sáng) không trông như miếng vá** — ảnh tràn kín thẻ, tên và giá đọc rõ trên scrim
7. Sản phẩm có compare-at hiện giá gạch bên cạnh giá bán
8. Footer nền kem sáng, link màu `#7A5F18` (vàng sẫm), **không** phải `#C9A227`

- [ ] **Step 5: Kiểm tra bộ chặn copy trên HTML đã render**

```bash
node -e "
const html = require('fs').readFileSync('demo/index.html','utf8')
const banned = ['officially licensed','licensed','authentic','genuine','amazing','must-have','perfect gift','No plain side']
const hits = banned.filter(w => new RegExp(w,'i').test(html))
console.log(hits.length ? 'VI PHẠM: ' + hits.join(', ') : 'OK: không có từ bị chặn trong index.html')
process.exit(hits.length ? 1 : 0)
"
```
Expected: `OK: không có từ bị chặn trong index.html`

- [ ] **Step 6: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/index.html demo/assets/main.js
git commit -m "feat(demo): trang chủ với lưới 65 sản phẩm và lọc theo product type"
```

---

### Task 6: Trang PDP mẫu

**Files:**
- Create: `demo/product.html`
- Create: `demo/assets/product.js`

**Interfaces:**
- Consumes: `demo/data/products.json` (Task 2), class `.pdp*` từ `components.css` (Task 4)
- Produces: PDP chạy được. Đọc `?sku=` từ URL, mặc định `TUM-20260923-XI-001` (*Lunar Ornament* — SKU sạch IP, cùng ảnh dùng cho `og.jpg` ở spec §7). Thẻ sản phẩm ở trang chủ đã trỏ sang đây kèm `?sku=`.

- [ ] **Step 1: Viết product.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edition | Goldbourne &amp; Co.</title>
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/base.css">
<link rel="stylesheet" href="assets/components.css">
</head>
<body>

<div class="parchment announce">Gilded on every side.</div>

<div class="wrap">
  <header class="site-header">
    <a href="index.html" class="wordmark">Goldbourne<small>&amp; Co.</small></a>
    <nav class="label" aria-label="Chính"><a href="index.html#shop">Shop</a></nav>
  </header>

  <main class="pdp" id="pdp">
    <p class="muted">Đang tải…</p>
  </main>
</div>

<footer class="parchment site-footer">
  <div class="wrap">
    <p class="muted">Bản tĩnh để duyệt thiết kế. Nút mua không hoạt động.</p>
  </div>
</footer>

<script type="module" src="assets/product.js"></script>
</body>
</html>
```

- [ ] **Step 2: Viết product.js**

```js
const DEFAULT_SKU = 'TUM-20260923-XI-001'   // Lunar Ornament — sạch IP, cùng nguồn với og.jpg
const IMAGE_ROLES = ['front', 'detail', 'back', 'scale', 'in use']

function formatPrice(n) {
  return n == null ? '' : '$' + n.toFixed(2)
}

function galleryHtml(p) {
  const [hero, ...rest] = p.images
  const thumbs = rest.map((src, i) =>
    `<img src="${src}" alt="${p.title} — ${IMAGE_ROLES[i + 1] ?? 'detail'}" loading="lazy" width="300" height="300">`
  ).join('')
  return `
    <img src="${hero}" alt="${p.title} — front" width="900" height="900">
    <div class="pdp__thumbs">${thumbs}</div>`
}

function variantsHtml(p) {
  if (!p.variantLabel) return ''
  const btns = p.variants.map((v, i) =>
    `<button class="chip" type="button" aria-pressed="${i === 0}">${v.value}</button>`
  ).join('')
  return `<section><h3>${p.variantLabel}</h3><div class="pdp__variants">${btns}</div></section>`
}

function sectionsHtml(p) {
  return p.sections.map((s) => `<section><h3>${s.heading}</h3>${s.html}</section>`).join('')
}

function render(p) {
  const was = p.compareAt ? `<span class="price__was">${formatPrice(p.compareAt)}</span>` : ''
  document.title = `${p.title} | Goldbourne & Co.`
  document.getElementById('pdp').innerHTML = `
    <div class="pdp__gallery">${galleryHtml(p)}</div>
    <div class="pdp__info">
      <p class="card__meta">${p.leagueLabel} · ${p.season}</p>
      <h1>${p.title}</h1>
      <p class="price" style="font-size:1.25rem">${formatPrice(p.price)}${was}</p>
      <p>${p.hook}</p>
      ${variantsHtml(p)}
      <p><button class="btn" type="button">Add to bag</button></p>
      ${sectionsHtml(p)}
    </div>`
}

async function main() {
  const sku = new URLSearchParams(location.search).get('sku') ?? DEFAULT_SKU
  const res = await fetch('data/products.json')
  const { products } = await res.json()
  const product = products.find((p) => p.sku === sku) ?? products.find((p) => p.sku === DEFAULT_SKU)
  if (!product) {
    document.getElementById('pdp').innerHTML = '<p class="muted">Không tìm thấy Edition này.</p>'
    return
  }
  render(product)
}

main()
```

- [ ] **Step 3: Mở PDP mặc định**

Với server đang chạy, mở `http://localhost:8000/demo/product.html`

- [ ] **Step 4: Kiểm tra bằng mắt — 6 điểm**

1. Hiện *Lunar Ornament — Crescent, Star and Deep Violet Quiet*, giá `$49.95` với `$59.95` gạch ngang
2. Gallery có 1 ảnh lớn + 4 thumbnail, **alt mỗi ảnh khác nhau** (`front`, `detail`, `back`, `scale`, `in use`) — không phải 5 alt giống hệt như trong CSV gốc
3. Ba mục `DESIGN STORY` · `USE & EXPERIENCE` · `SIZE & CAPACITY` hiện đúng thứ tự, nhãn Inter in hoa màu `muted`
4. `SIZE & CAPACITY` chỉ có đúng một dòng `Available capacity: 40 oz.` — **đây là gap §8.2 của spec hiện hình, đúng như dự đoán, không phải lỗi code**
5. Không có khối chọn size (tumbler không có variant)
6. Từ trang chủ bấm vào một thẻ **backpack** → PDP hiện khối `SIZE` với 3 nút `S` `M` `L`

- [ ] **Step 5: Kiểm tra PDP không rò tên giải ra tiêu đề trang**

```bash
node -e "
const js = require('fs').readFileSync('demo/assets/product.js','utf8')
const html = require('fs').readFileSync('demo/product.html','utf8')
const bad = ['seoTitle']   // seoTitle chứa tên đội đầy đủ, không được dùng ở mặt tiền
const hits = bad.filter(w => js.includes(w) || html.includes(w))
console.log(hits.length ? 'VI PHẠM: PDP dùng ' + hits.join(', ') + ' ở mặt tiền' : 'OK: PDP chỉ dùng Title viết tắt')
process.exit(hits.length ? 1 : 0)
"
```
Expected: `OK: PDP chỉ dùng Title viết tắt`

- [ ] **Step 6: Commit** *(bỏ qua nếu chưa `git init`)*

```bash
git add demo/product.html demo/assets/product.js
git commit -m "feat(demo): trang PDP mẫu đọc từ products.json"
```

---

## Ghi chú bàn giao

**Cái demo này cố tình KHÔNG có** (spec có nhưng ngoài phạm vi đã chốt):
- `logo.svg`, `favicon.svg`, `og.jpg`, `apple-touch-icon.png` — wordmark đang render bằng text CSS, không phải SVG
- Font tự host — đang dùng Google Fonts CDN; theme thật phải dùng `/fonts/*.woff2` như spec §6
- Hai hàng facet Season và League trong trang Tumblers (spec §4) — demo chỉ có một hàng product type
- Macro crop cho hero year-round (spec §7)
- 8 trang policy, cart, search, collection
- 4 gap chặn launch ở spec §11 — thuộc store thật, không thuộc demo

**Cái demo này chứng minh được:**
- Bảng màu Gilded Dark + Parchment chạy thật, có tương phản đúng
- Cơ chế full-bleed + scrim xử lý được 11 ảnh cap nền sáng nằm cạnh 54 ảnh nền tối
- Nav 4 product type đúng thứ tự độ lớn
- Tagline mới đứng được ở vị trí H1
- Cấu trúc PDP map đúng 4 kiểu H3 khác nhau vào cùng một slot
- Gap §8.2 (tumbler thiếu thông số) hiện hình rõ trên PDP, đủ để quyết có bổ sung hay không
