# Shot-Report Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng gói một skill tự chứa, cài global, tự động chụp trang theme sau mỗi lượt có sửa giao diện rồi gửi ảnh ghép desktop+mobile về đúng topic Telegram của repo.

**Architecture:** Một thư mục `~/.claude/skills/shot-report/` có git riêng, gồm hook mỏng (quyết định *khi nào*) và CLI (làm *thế nào*), CLI tách thành 6 module lib một trách nhiệm. Hook đọc transcript lượt vừa xong, suy ra trang cần chụp bằng cách leo ngược cây thư mục tìm `*.html` gần nhất; CLI serve repo qua HTTP nội bộ, chụp bằng Chrome headless hai viewport, ghép bằng Pillow, gửi qua Telegram Bot API.

**Tech Stack:** Node v24.14.1 (ESM, `node:test`, fetch/FormData sẵn có), Python 3.11.9 + Pillow 12.3.0 (chỉ cho khâu ghép ảnh), Chrome headless.

## Global Constraints

- Spec nguồn: `docs/superpowers/specs/2026-10-03-telegram-shot-report-workflow-design.md`. Mọi mục `§N` dưới đây trỏ vào đó.
- **Hook không bao giờ làm hỏng lượt.** Mọi lỗi phải nuốt, ghi `tmp/shot-report.log`, **exit 0**. (§9)
- **Token không bao giờ chạm git, env var, hay log.** Đọc trực tiếp từ `config.json` của herdr lúc chạy. (§9)
- Gate `HERDR_ENV=1`: không có biến này thì hook thoát ngay, không làm gì. (§9)
- Trần **4 ảnh/lượt**; vượt thì cắt và **ghi rõ trong caption**. Không cắt âm thầm. (§4)
- Viewport mặc định: desktop `[1440, 3000]`, mobile `[390, 2200]`. (§6)
- Ngưỡng dò ảnh trắng: **dưới 40 KB** hoặc **dưới 32 màu riêng biệt**. (§5.4)
- Dọn ảnh và profile Chrome **cũ hơn 7 ngày** mỗi lần chạy. (§9)
- Chrome **bắt buộc** `--user-data-dir` riêng, nếu không sẽ bị Chrome đang mở cướp lệnh. (§3)
- Phục vụ HTTP từ **git toplevel**, không bao giờ dùng `file://`. (§3)
- Test theo khuôn repo: `node:test` + `node:assert/strict`, thông điệp assert tiếng Việt.
- Code tiếng Anh, comment và chuỗi hiển thị tiếng Việt, không dấu `;` cuối dòng (theo `themes/*/assets/*.mjs`).

**Quyết định ngoài spec, đã cân nhắc:**

| Quyết định | Vì sao |
|---|---|
| Gói tự `git init` | `~/.claude` không phải git repo; vòng TDD cần chỗ commit. Gói tự chứa có lịch sử riêng, copy/clone mang theo. |
| Static server bằng **Node** thay `python -m http.server` (§5.1 cho phép) | Bớt một tiến trình con phải nuôi và dọn. Pillow vẫn dùng vì Node không có thư viện ảnh. |

---

## File Structure

**Gói — `~/.claude/skills/shot-report/` (git repo riêng):**

| File | Trách nhiệm |
|---|---|
| `lib/discover.mjs` | Luật §4: danh sách file sửa → danh sách trang cần chụp. Thuần logic + đọc thư mục. |
| `lib/config.mjs` | Đọc `.shots.json`, resolver `${json:path#pointer}`, khớp glob trang → query. Thuần logic. |
| `lib/serve.mjs` | Vòng đời static server HTTP nội bộ. |
| `lib/capture.mjs` | Tìm Chrome, chụp một URL ra một PNG. |
| `lib/composite.mjs` | Ghép 2 PNG + dò ảnh trắng, qua Pillow. |
| `lib/telegram.mjs` | Đọc `config.json`/`mapping.json` của herdr, gửi `sendPhoto`. |
| `shot-report.mjs` | CLI điều phối, cờ `--dry-run`. |
| `hook.mjs` | Stop hook: gate + đọc transcript + gọi CLI. |
| `install.mjs` | Ghi Stop hook vào `settings.json`, idempotent. |
| `SKILL.md` | Workflow + metadata skill. |
| `report-style.md` | Luật khuôn báo cáo §8. |
| `shots.example.json` | Template config §6. |
| `tests/*.test.mjs` | Test cho từng module. |

**Repo `html-theme-by-products-01` (có commit):** `.shots.json` mới, `.gitignore` thêm `tmp/`.

---

### Task 1: Khởi tạo gói và luật phát hiện trang

**Files:**
- Create: `~/.claude/skills/shot-report/lib/discover.mjs`
- Test: `~/.claude/skills/shot-report/tests/discover.test.mjs`

**Interfaces:**
- Consumes: không có (task đầu)
- Produces:
  - `listPages(dirAbs) → string[]` — tên file `*.html` chụp được trong đúng một thư mục, đã sắp xếp
  - `pageGroupFor(fileAbs) → string|null` — thư mục cụm trang gần nhất, leo ngược lên
  - `pagesToShoot(editedRelPaths, repoRoot, { maxShots = 4 }) → { pages: string[], truncated: number }` — `pages` là đường dẫn tương đối repoRoot, dùng `/`

- [ ] **Step 1: Khởi tạo thư mục gói và git**

```bash
mkdir -p ~/.claude/skills/shot-report/lib ~/.claude/skills/shot-report/tests
cd ~/.claude/skills/shot-report
git init -q
printf 'node_modules/\n*.log\n' > .gitignore
git add .gitignore && git commit -q -m "chore: khởi tạo gói shot-report"
```

- [ ] **Step 2: Viết test thất bại**

```js
// tests/discover.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listPages, pageGroupFor, pagesToShoot } from '../lib/discover.mjs'

// Dựng một repo giả cùng hình dạng html-theme-by-products-01
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'shot-'))
  for (const t of ['light-minimal', 'dark-maximalism']) {
    mkdirSync(join(root, 'themes', t, 'assets'), { recursive: true })
    writeFileSync(join(root, 'themes', t, 'index.html'), '<html>')
    writeFileSync(join(root, 'themes', t, 'product.html'), '<html>')
    writeFileSync(join(root, 'themes', t, '_partial.html'), '<html>')
    writeFileSync(join(root, 'themes', t, 'assets', 'tokens.css'), 'body{}')
    writeFileSync(join(root, 'themes', t, 'assets', 'main.js'), '//')
    writeFileSync(join(root, 'themes', t, 'assets', 'x.test.mjs'), '//')
  }
  mkdirSync(join(root, 'src', 'api'), { recursive: true })
  writeFileSync(join(root, 'src', 'api', 'user.js'), '//')
  return root
}

test('listPages bỏ qua file bắt đầu bằng gạch dưới', () => {
  const root = fixture()
  assert.deepEqual(listPages(join(root, 'themes', 'light-minimal')), ['index.html', 'product.html'])
})

test('pageGroupFor leo lên tới thư mục chứa html gần nhất', () => {
  const root = fixture()
  const css = join(root, 'themes', 'light-minimal', 'assets', 'tokens.css')
  assert.equal(pageGroupFor(css), join(root, 'themes', 'light-minimal'))
})

test('pageGroupFor trả null khi không có html nào trên đường leo', () => {
  const root = fixture()
  assert.equal(pageGroupFor(join(root, 'src', 'api', 'user.js')), null)
})

test('sửa asset thì chụp mọi trang của cụm', () => {
  const root = fixture()
  const { pages } = pagesToShoot(['themes/light-minimal/assets/tokens.css'], root)
  assert.deepEqual(pages, ['themes/light-minimal/index.html', 'themes/light-minimal/product.html'])
})

test('sửa html thì chỉ chụp đúng trang đó', () => {
  const root = fixture()
  const { pages } = pagesToShoot(['themes/dark-maximalism/index.html'], root)
  assert.deepEqual(pages, ['themes/dark-maximalism/index.html'])
})

test('repo không có html thì không chụp gì', () => {
  const root = fixture()
  assert.deepEqual(pagesToShoot(['src/api/user.js'], root).pages, [])
})

test('file test không kích hoạt chụp', () => {
  const root = fixture()
  assert.deepEqual(pagesToShoot(['themes/light-minimal/assets/x.test.mjs'], root).pages, [])
})

test('trần maxShots cắt bớt và báo số đã cắt', () => {
  const root = fixture()
  const edited = ['themes/light-minimal/assets/tokens.css', 'themes/dark-maximalism/assets/tokens.css']
  const r = pagesToShoot(edited, root, { maxShots: 3 })
  assert.equal(r.pages.length, 3, 'phải cắt còn đúng 3 trang')
  assert.equal(r.truncated, 1, 'phải báo đã cắt 1 trang')
})

test('trùng lặp bị gộp', () => {
  const root = fixture()
  const edited = ['themes/light-minimal/index.html', 'themes/light-minimal/index.html']
  assert.deepEqual(pagesToShoot(edited, root).pages, ['themes/light-minimal/index.html'])
})
```

- [ ] **Step 3: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/discover.test.mjs`
Expected: FAIL — `Cannot find module '../lib/discover.mjs'`

- [ ] **Step 4: Viết implementation tối thiểu**

```js
// lib/discover.mjs
// Luật §4: suy trang cần chụp từ file bị sửa, không từ tên thư mục.
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve, relative, sep } from 'node:path'

const ASSET_EXT = new Set(['.css', '.js', '.mjs'])

// File test không đổi render nên không kích hoạt chụp.
function isTestFile(name) {
  return /\.(test|spec)\.[cm]?js$/.test(name)
}

// Trang bắt đầu bằng "_" hoặc ".partial." là mảnh, không đứng một mình được.
function isShootablePage(name) {
  return name.endsWith('.html') && !name.startsWith('_') && !name.includes('.partial.')
}

export function listPages(dirAbs) {
  let entries
  try {
    entries = readdirSync(dirAbs)
  } catch {
    return []
  }
  return entries.filter(isShootablePage).sort()
}

export function pageGroupFor(fileAbs) {
  let dir = dirname(resolve(fileAbs))
  // Leo tới gốc ổ đĩa; dirname của gốc trả về chính nó nên so sánh để dừng.
  for (;;) {
    if (listPages(dir).length > 0) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export function pagesToShoot(editedRelPaths, repoRoot, { maxShots = 4 } = {}) {
  const root = resolve(repoRoot)
  const found = new Set()

  for (const rel of editedRelPaths) {
    const abs = resolve(root, rel)
    const name = abs.slice(abs.lastIndexOf(sep) + 1)
    if (isTestFile(name)) continue

    if (name.endsWith('.html')) {
      if (isShootablePage(name)) found.add(abs)
      continue
    }

    const dot = name.lastIndexOf('.')
    if (dot < 0 || !ASSET_EXT.has(name.slice(dot))) continue

    // Asset dùng chung cả cụm nên chụp mọi trang trong cụm.
    const group = pageGroupFor(abs)
    if (group) for (const p of listPages(group)) found.add(join(group, p))
  }

  const all = [...found]
    .map((abs) => relative(root, abs).split(sep).join('/'))
    .sort()

  return { pages: all.slice(0, maxShots), truncated: Math.max(0, all.length - maxShots) }
}
```

Lưu ý: `statSync` không dùng tới, bỏ khỏi import nếu linter phàn nàn.

- [ ] **Step 5: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/discover.test.mjs`
Expected: PASS — `# pass 9`, `# fail 0`

- [ ] **Step 6: Commit**

```bash
cd ~/.claude/skills/shot-report
git add lib/discover.mjs tests/discover.test.mjs
git commit -m "feat(discover): luật suy trang cần chụp từ file bị sửa"
```

---

### Task 2: Đọc config và resolver tham số

**Files:**
- Create: `~/.claude/skills/shot-report/lib/config.mjs`
- Test: `~/.claude/skills/shot-report/tests/config.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces:
  - `loadConfig(repoRoot) → { enabled, pages, viewports, maxShots }` — luôn trả object đủ khoá, mặc định khi thiếu file
  - `resolveValue(template, repoRoot) → string` — thay mọi `${json:path#pointer}`
  - `queryForPage(cfg, relPath, repoRoot) → string` — chuỗi query đã resolve, `''` nếu trang không có cấu hình

- [ ] **Step 1: Viết test thất bại**

```js
// tests/config.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig, resolveValue, queryForPage } from '../lib/config.mjs'

function repoWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'cfg-'))
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, body)
  }
  return root
}

test('thiếu .shots.json thì dùng toàn mặc định', () => {
  const cfg = loadConfig(repoWith({}))
  assert.equal(cfg.enabled, true)
  assert.equal(cfg.maxShots, 4)
  assert.deepEqual(cfg.viewports.desktop, [1440, 3000])
  assert.deepEqual(cfg.viewports.mobile, [390, 2200])
})

test('.shots.json hỏng cú pháp thì lùi về mặc định, không ném lỗi', () => {
  const cfg = loadConfig(repoWith({ '.shots.json': '{ hỏng' }))
  assert.equal(cfg.enabled, true)
  assert.equal(cfg.maxShots, 4)
})

test('enabled false được tôn trọng', () => {
  const cfg = loadConfig(repoWith({ '.shots.json': '{"enabled":false}' }))
  assert.equal(cfg.enabled, false)
})

test('resolver đọc được giá trị lồng trong mảng', () => {
  const root = repoWith({ 'products/products.json': JSON.stringify({ products: [{ sku: 'BP-001' }, { sku: 'BP-002' }] }) })
  assert.equal(resolveValue('sku=${json:products/products.json#products.0.sku}', root), 'sku=BP-001')
})

test('resolver trỏ ra ngoài repo thì bị từ chối', () => {
  const root = repoWith({})
  assert.throws(() => resolveValue('x=${json:../../secrets.json#a}', root), /ngoài repo/)
})

test('resolver trỏ vào pointer không tồn tại thì ném lỗi rõ ràng', () => {
  const root = repoWith({ 'd.json': '{"a":1}' })
  assert.throws(() => resolveValue('x=${json:d.json#a.b.c}', root), /không tìm thấy/)
})

test('glob ** khớp trang lồng sâu', () => {
  const root = repoWith({
    '.shots.json': JSON.stringify({ pages: { '**/product.html': { query: 'sku=FIXED' } } }),
  })
  const cfg = loadConfig(root)
  assert.equal(queryForPage(cfg, 'themes/light-minimal/product.html', root), 'sku=FIXED')
  assert.equal(queryForPage(cfg, 'themes/light-minimal/index.html', root), '')
})

test('glob * không vượt qua dấu gạch chéo', () => {
  const root = repoWith({ '.shots.json': JSON.stringify({ pages: { '*.html': { query: 'a=1' } } }) })
  const cfg = loadConfig(root)
  assert.equal(queryForPage(cfg, 'index.html', root), 'a=1')
  assert.equal(queryForPage(cfg, 'themes/x/index.html', root), '', '* không được khớp qua thư mục')
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/config.test.mjs`
Expected: FAIL — `Cannot find module '../lib/config.mjs'`

- [ ] **Step 3: Viết implementation**

```js
// lib/config.mjs
// Đọc .shots.json của repo. Mọi kiến thức riêng của dự án nằm ở đây,
// không nằm trong script — xem §6.
import { readFileSync } from 'node:fs'
import { resolve, relative, isAbsolute } from 'node:path'

const DEFAULTS = {
  enabled: true,
  pages: {},
  viewports: { desktop: [1440, 3000], mobile: [390, 2200] },
  maxShots: 4,
}

export function loadConfig(repoRoot) {
  let raw
  try {
    raw = JSON.parse(readFileSync(resolve(repoRoot, '.shots.json'), 'utf8'))
  } catch {
    // Thiếu file hoặc JSON hỏng đều lùi về mặc định. Config hỏng không
    // được làm chết lượt — §9.
    return { ...DEFAULTS }
  }
  return {
    enabled: raw.enabled ?? DEFAULTS.enabled,
    pages: raw.pages ?? DEFAULTS.pages,
    viewports: { ...DEFAULTS.viewports, ...(raw.viewports ?? {}) },
    maxShots: raw.maxShots ?? DEFAULTS.maxShots,
  }
}

function readPointer(repoRoot, filePath, pointer) {
  const abs = resolve(repoRoot, filePath)
  const rel = relative(resolve(repoRoot), abs)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Resolver trỏ ra ngoài repo: ${filePath}`)
  }
  const data = JSON.parse(readFileSync(abs, 'utf8'))
  let cur = data
  for (const key of pointer.split('.')) {
    if (cur == null || !(key in Object(cur))) {
      throw new Error(`Resolver không tìm thấy "${pointer}" trong ${filePath}`)
    }
    cur = cur[key]
  }
  return String(cur)
}

export function resolveValue(template, repoRoot) {
  return template.replace(/\$\{json:([^#}]+)#([^}]+)\}/g, (_, file, pointer) =>
    readPointer(repoRoot, file.trim(), pointer.trim()),
  )
}

// Glob tối giản: ** vượt thư mục, * thì không.
function globToRegExp(pattern) {
  let out = '^'
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        out += '.*'
        i++
        if (pattern[i + 1] === '/') i++
      } else {
        out += '[^/]*'
      }
    } else {
      out += c.replace(/[.+?^${}()|[\]\\]/, '\\$&')
    }
  }
  return new RegExp(out + '$')
}

export function queryForPage(cfg, relPath, repoRoot) {
  for (const [pattern, spec] of Object.entries(cfg.pages ?? {})) {
    if (!globToRegExp(pattern).test(relPath)) continue
    if (!spec?.query) return ''
    return resolveValue(spec.query, repoRoot)
  }
  return ''
}
```

- [ ] **Step 4: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/config.test.mjs`
Expected: PASS — `# pass 8`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/skills/shot-report
git add lib/config.mjs tests/config.test.mjs
git commit -m "feat(config): đọc .shots.json và resolver \${json:} kẹp trong repo"
```

---

### Task 3: Static server và chụp màn hình

**Files:**
- Create: `~/.claude/skills/shot-report/lib/serve.mjs`, `~/.claude/skills/shot-report/lib/capture.mjs`
- Test: `~/.claude/skills/shot-report/tests/serve.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces:
  - `startServer(rootDir) → Promise<{ port: number, close(): Promise<void> }>`
  - `findChrome() → string|null`
  - `capture({ url, out, width, height, profileDir }) → Promise<void>` — ném lỗi nếu không tạo được file

- [ ] **Step 1: Viết test thất bại**

```js
// tests/serve.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startServer } from '../lib/serve.mjs'

test('phục vụ file html và json từ gốc đã cho', async () => {
  const root = mkdtempSync(join(tmpdir(), 'srv-'))
  mkdirSync(join(root, 'products'), { recursive: true })
  writeFileSync(join(root, 'index.html'), '<h1>xin chào</h1>')
  writeFileSync(join(root, 'products', 'products.json'), '{"products":[]}')

  const srv = await startServer(root)
  try {
    const html = await fetch(`http://127.0.0.1:${srv.port}/index.html`)
    assert.equal(html.status, 200)
    assert.match(html.headers.get('content-type'), /text\/html/)

    const json = await fetch(`http://127.0.0.1:${srv.port}/products/products.json`)
    assert.equal(json.status, 200, 'đường dẫn tuyệt đối phải phân giải từ gốc repo')
  } finally {
    await srv.close()
  }
})

test('chặn thoát khỏi gốc bằng ..', async () => {
  const root = mkdtempSync(join(tmpdir(), 'srv-'))
  writeFileSync(join(root, 'index.html'), 'ok')
  const srv = await startServer(root)
  try {
    const res = await fetch(`http://127.0.0.1:${srv.port}/../../../etc/hosts`)
    assert.ok(res.status === 403 || res.status === 404, 'không được phục vụ file ngoài gốc')
  } finally {
    await srv.close()
  }
})

test('mỗi server lấy một cổng trống khác nhau', async () => {
  const root = mkdtempSync(join(tmpdir(), 'srv-'))
  writeFileSync(join(root, 'index.html'), 'ok')
  const a = await startServer(root)
  const b = await startServer(root)
  try {
    assert.notEqual(a.port, b.port)
  } finally {
    await a.close()
    await b.close()
  }
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/serve.test.mjs`
Expected: FAIL — `Cannot find module '../lib/serve.mjs'`

- [ ] **Step 3: Viết serve.mjs**

```js
// lib/serve.mjs
// Static server nội bộ. Bắt buộc phải có: file:// làm ES module và fetch
// chết vì CORS, trang sẽ trắng mà lệnh vẫn báo thành công — §3.
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { resolve, relative, extname, isAbsolute } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

export function startServer(rootDir) {
  const root = resolve(rootDir)

  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
    const abs = resolve(root, '.' + path)
    const rel = relative(root, abs)
    if (rel.startsWith('..') || isAbsolute(rel)) {
      res.writeHead(403).end('ngoài gốc')
      return
    }
    try {
      if (statSync(abs).isDirectory()) {
        res.writeHead(403).end('là thư mục')
        return
      }
    } catch {
      res.writeHead(404).end('không có')
      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream' })
    createReadStream(abs).pipe(res)
  })

  return new Promise((ok, fail) => {
    server.on('error', fail)
    // Cổng 0 = để OS cấp cổng trống, tránh tự dò và tránh đụng nhau.
    server.listen(0, '127.0.0.1', () => {
      ok({
        port: server.address().port,
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}
```

- [ ] **Step 4: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/serve.test.mjs`
Expected: PASS — `# pass 3`, `# fail 0`

- [ ] **Step 5: Viết capture.mjs**

```js
// lib/capture.mjs
// Chrome headless. --user-data-dir là BẮT BUỘC: không có nó, Chrome đang
// mở sẽ cướp lệnh và trả về "Opening in existing browser session" mà
// không chụp gì — §3.
import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

export function findChrome() {
  for (const p of CANDIDATES) if (p && existsSync(p)) return p
  return null
}

export function capture({ url, out, width, height, profileDir }) {
  const chrome = findChrome()
  if (!chrome) throw new Error('Không tìm thấy Chrome hay Edge')

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir}`,
    '--virtual-time-budget=6000',
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    url,
  ]

  return new Promise((ok, fail) => {
    const child = spawn(chrome, args, { stdio: 'ignore' })
    const timer = setTimeout(() => {
      child.kill()
      fail(new Error(`Chrome quá hạn 60s khi chụp ${url}`))
    }, 60_000)

    child.on('error', (err) => {
      clearTimeout(timer)
      fail(err)
    })
    child.on('exit', () => {
      clearTimeout(timer)
      // Chrome đôi khi trả mã khác 0 dù đã ghi ảnh, nên nghiệm thu bằng
      // sự tồn tại và kích thước của file chứ không bằng exit code.
      if (existsSync(out) && statSync(out).size > 0) ok()
      else fail(new Error(`Chrome không tạo được ảnh cho ${url}`))
    })
  })
}
```

- [ ] **Step 6: Nghiệm thu chụp thật trên repo này**

```bash
cd ~/.claude/skills/shot-report
node -e "
import('./lib/serve.mjs').then(async ({startServer}) => {
  const { capture } = await import('./lib/capture.mjs')
  const root = 'C:/Users/kevin/Desktop/Dino/html-theme-by-products-01'
  const srv = await startServer(root)
  await capture({
    url: 'http://127.0.0.1:' + srv.port + '/themes/light-minimal/index.html',
    out: root + '/tmp/_t3.png', width: 1440, height: 3000,
    profileDir: root + '/tmp/_t3profile',
  })
  await srv.close()
  console.log('kích thước:', require('fs').statSync(root + '/tmp/_t3.png').size)
})
"
```

Expected: in ra kích thước **lớn hơn 300000**. Dưới ngưỡng đó nghĩa là trang không nạp được dữ liệu — dừng lại và tìm nguyên nhân, đừng đi tiếp.

- [ ] **Step 7: Dọn và commit**

```bash
rm -rf "C:/Users/kevin/Desktop/Dino/html-theme-by-products-01/tmp/_t3.png" "C:/Users/kevin/Desktop/Dino/html-theme-by-products-01/tmp/_t3profile"
cd ~/.claude/skills/shot-report
git add lib/serve.mjs lib/capture.mjs tests/serve.test.mjs
git commit -m "feat(capture): static server nội bộ và chụp Chrome headless cách ly"
```

---

### Task 4: Ghép ảnh và dò ảnh trắng

**Files:**
- Create: `~/.claude/skills/shot-report/lib/composite.mjs`
- Test: `~/.claude/skills/shot-report/tests/composite.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces:
  - `composite({ desktop, mobile, out }) → Promise<{ width, height, bytes, colors, blank }>` — `blank` true khi dưới 40 KB hoặc dưới 32 màu (§5.4)

- [ ] **Step 1: Viết test thất bại**

```js
// tests/composite.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { composite } from '../lib/composite.mjs'

// Dựng PNG bằng chính Pillow để test không phụ thuộc file nhị phân có sẵn.
function makePng(path, w, h, mode) {
  const code = mode === 'noisy'
    ? `import random
from PIL import Image
im = Image.new('RGB', (${w}, ${h}))
random.seed(1)
im.putdata([(random.randrange(256), random.randrange(256), random.randrange(256)) for _ in range(${w} * ${h})])
im.save(r'${path}')`
    : `from PIL import Image
Image.new('RGB', (${w}, ${h}), (255, 255, 255)).save(r'${path}')`
  execFileSync('python', ['-c', code])
}

test('ghép ngang: rộng bằng tổng, cao bằng cạnh lớn hơn', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cmp-'))
  const d = join(dir, 'd.png')
  const m = join(dir, 'm.png')
  const out = join(dir, 'o.png')
  makePng(d, 300, 400, 'noisy')
  makePng(m, 100, 200, 'noisy')

  const r = await composite({ desktop: d, mobile: m, out })
  assert.equal(r.width, 400, 'rộng phải là 300 + 100')
  assert.equal(r.height, 400, 'cao phải là max(400, 200)')
})

test('ảnh một màu bị gắn cờ trống', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cmp-'))
  const d = join(dir, 'd.png')
  const m = join(dir, 'm.png')
  const out = join(dir, 'o.png')
  makePng(d, 200, 200, 'flat')
  makePng(m, 100, 200, 'flat')

  const r = await composite({ desktop: d, mobile: m, out })
  assert.equal(r.blank, true, 'ảnh trắng trơn phải bị gắn cờ')
  assert.ok(r.colors < 32, `số màu phải dưới 32, đang là ${r.colors}`)
})

test('ảnh nhiều màu và đủ nặng thì không bị gắn cờ', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cmp-'))
  const d = join(dir, 'd.png')
  const m = join(dir, 'm.png')
  const out = join(dir, 'o.png')
  makePng(d, 500, 500, 'noisy')
  makePng(m, 300, 500, 'noisy')

  const r = await composite({ desktop: d, mobile: m, out })
  assert.equal(r.blank, false)
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/composite.test.mjs`
Expected: FAIL — `Cannot find module '../lib/composite.mjs'`

- [ ] **Step 3: Viết implementation**

```js
// lib/composite.mjs
// Ghép desktop|mobile thành một ảnh và chấm xem trang có trống không.
// Ngưỡng lấy từ số đo thật: 18 KB trang lỗi vs 591 KB trang thật — §3, §5.4.
import { execFile } from 'node:child_process'

const MIN_BYTES = 40_000
const MIN_COLORS = 32

const PY = `
import json, sys
from PIL import Image, ImageDraw

desktop, mobile, out = sys.argv[1], sys.argv[2], sys.argv[3]
a, b = Image.open(desktop).convert('RGB'), Image.open(mobile).convert('RGB')
W, H = a.width + b.width, max(a.height, b.height)
canvas = Image.new('RGB', (W, H), (255, 255, 255))
canvas.paste(a, (0, 0))
canvas.paste(b, (a.width, 0))
d = ImageDraw.Draw(canvas)
d.text((8, 8), 'desktop %dx%d' % (a.width, a.height), fill=(140, 140, 140))
d.text((a.width + 8, 8), 'mobile %dx%d' % (b.width, b.height), fill=(140, 140, 140))
canvas.save(out, optimize=True)

import os
colors = canvas.getcolors(maxcolors=100000)
print(json.dumps({
    'width': W, 'height': H,
    'bytes': os.path.getsize(out),
    'colors': len(colors) if colors else 100000,
}))
`

export function composite({ desktop, mobile, out }) {
  return new Promise((ok, fail) => {
    execFile('python', ['-c', PY, desktop, mobile, out], (err, stdout, stderr) => {
      if (err) return fail(new Error(`Ghép ảnh hỏng: ${stderr || err.message}`))
      let r
      try {
        r = JSON.parse(stdout)
      } catch {
        return fail(new Error(`Pillow trả về thứ không đọc được: ${stdout.slice(0, 200)}`))
      }
      ok({ ...r, blank: r.bytes < MIN_BYTES || r.colors < MIN_COLORS })
    })
  })
}
```

- [ ] **Step 4: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/composite.test.mjs`
Expected: PASS — `# pass 3`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/skills/shot-report
git add lib/composite.mjs tests/composite.test.mjs
git commit -m "feat(composite): ghép desktop+mobile và dò ảnh trắng theo ngưỡng đo thật"
```

---

### Task 5: Gửi Telegram

**Files:**
- Create: `~/.claude/skills/shot-report/lib/telegram.mjs`
- Test: `~/.claude/skills/shot-report/tests/telegram.test.mjs`

**Interfaces:**
- Consumes: không có
- Produces:
  - `herdrPaths() → { configPath, mappingPath }`
  - `resolveTarget(cwd, { configPath, mappingPath }) → { token, chatId, threadId }|null` — `null` khi thiếu bất kỳ mảnh nào
  - `sendPhoto({ token, chatId, threadId, file, caption }) → Promise<void>`

- [ ] **Step 1: Viết test thất bại**

```js
// tests/telegram.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveTarget } from '../lib/telegram.mjs'

function fixture({ cwd, mappingCwd }) {
  const dir = mkdtempSync(join(tmpdir(), 'tg-'))
  const configPath = join(dir, 'config.json')
  const mappingPath = join(dir, 'mapping.json')
  writeFileSync(configPath, JSON.stringify({ bot_token: 'T0K3N', chat_id: -100123 }))
  writeFileSync(mappingPath, JSON.stringify({
    chat_id: -100123,
    topics: { k: { thread_id: 391, cwd: mappingCwd, status: 'working' } },
  }))
  return { cwd, paths: { configPath, mappingPath } }
}

test('tra đúng thread theo cwd', () => {
  const f = fixture({ cwd: 'C:\\\\a\\\\b', mappingCwd: 'C:\\\\a\\\\b' })
  const t = resolveTarget(f.cwd, f.paths)
  assert.equal(t.threadId, 391)
  assert.equal(t.token, 'T0K3N')
  assert.equal(t.chatId, -100123)
})

test('khác hoa thường và khác kiểu gạch vẫn khớp trên Windows', () => {
  const f = fixture({ cwd: 'c:/A/B', mappingCwd: 'C:\\\\a\\\\b' })
  assert.equal(resolveTarget(f.cwd, f.paths)?.threadId, 391)
})

test('cwd lạ thì trả null chứ không đoán topic', () => {
  const f = fixture({ cwd: 'C:\\\\khac', mappingCwd: 'C:\\\\a\\\\b' })
  assert.equal(resolveTarget(f.cwd, f.paths), null)
})

test('thiếu file config thì trả null, không ném', () => {
  const f = fixture({ cwd: 'C:\\\\a\\\\b', mappingCwd: 'C:\\\\a\\\\b' })
  assert.equal(resolveTarget(f.cwd, { ...f.paths, configPath: 'C:\\\\khong-co.json' }), null)
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/telegram.test.mjs`
Expected: FAIL — `Cannot find module '../lib/telegram.mjs'`

- [ ] **Step 3: Viết implementation**

```js
// lib/telegram.mjs
// Plugin herdr chỉ nhận ảnh VÀO, không có đường đẩy ảnh ra, nên gọi thẳng
// Bot API. Token đọc lúc chạy, không bao giờ ghi ra log hay env — §7, §9.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { openAsBlob } from 'node:fs'
import { basename } from 'node:path'

export function herdrPaths() {
  const roaming = process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming')
  const local = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local')
  return {
    configPath: join(roaming, 'herdr', 'plugins', 'config', 'permgps.telegram-agents', 'config.json'),
    mappingPath: join(local, 'herdr', 'plugins', 'permgps.telegram-agents', 'mapping.json'),
  }
}

// Windows: so sánh không phân biệt hoa thường và kiểu gạch.
function normCwd(p) {
  return String(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
}

export function resolveTarget(cwd, paths = herdrPaths()) {
  let config
  let mapping
  try {
    config = JSON.parse(readFileSync(paths.configPath, 'utf8'))
    mapping = JSON.parse(readFileSync(paths.mappingPath, 'utf8'))
  } catch {
    return null
  }
  const want = normCwd(cwd)
  const topic = Object.values(mapping.topics ?? {}).find((t) => normCwd(t.cwd) === want)
  if (!topic?.thread_id || !config.bot_token || !config.chat_id) return null
  return { token: config.bot_token, chatId: config.chat_id, threadId: topic.thread_id }
}

export async function sendPhoto({ token, chatId, threadId, file, caption }) {
  const form = new FormData()
  form.set('chat_id', String(chatId))
  form.set('message_thread_id', String(threadId))
  form.set('caption', caption)
  form.set('disable_notification', 'true')
  form.set('photo', await openAsBlob(file), basename(file))

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    // Không in body: có thể vọng lại token. Chỉ mã trạng thái.
    throw new Error(`Telegram từ chối: HTTP ${res.status}`)
  }
}
```

- [ ] **Step 4: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/telegram.test.mjs`
Expected: PASS — `# pass 4`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/skills/shot-report
git add lib/telegram.mjs tests/telegram.test.mjs
git commit -m "feat(telegram): tra topic theo cwd và gửi sendPhoto, không lộ token"
```

---

### Task 6: CLI điều phối

**Files:**
- Create: `~/.claude/skills/shot-report/shot-report.mjs`

**Interfaces:**
- Consumes: `pagesToShoot` (T1), `loadConfig`/`queryForPage` (T2), `startServer`/`capture` (T3), `composite` (T4), `resolveTarget`/`sendPhoto` (T5)
- Produces: `run({ repoRoot, pages, dryRun }) → Promise<{ sent: number, skipped: string[] }>`; CLI nhận `--repo`, `--pages a,b`, `--dry-run`

- [ ] **Step 1: Viết CLI**

```js
#!/usr/bin/env node
// shot-report.mjs — điều phối: serve → chụp → ghép → gửi.
import { mkdirSync, rmSync, readdirSync, statSync, appendFileSync } from 'node:fs'
import { join, resolve, basename, dirname } from 'node:path'
import { pagesToShoot } from './lib/discover.mjs'
import { loadConfig, queryForPage } from './lib/config.mjs'
import { startServer } from './lib/serve.mjs'
import { capture } from './lib/capture.mjs'
import { composite } from './lib/composite.mjs'
import { resolveTarget, sendPhoto } from './lib/telegram.mjs'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function log(repoRoot, msg) {
  try {
    mkdirSync(join(repoRoot, 'tmp'), { recursive: true })
    appendFileSync(join(repoRoot, 'tmp', 'shot-report.log'), `${new Date().toISOString()} ${msg}\n`)
  } catch {
    // Không ghi được log cũng không được làm chết lượt.
  }
}

// §9: ảnh và profile cũ hơn 7 ngày bị xoá, nếu không tmp/ phình vô hạn.
function sweep(repoRoot) {
  const dir = join(repoRoot, 'tmp')
  const cutoff = Date.now() - WEEK_MS
  for (const sub of ['shots', 'chrome-profiles']) {
    const base = join(dir, sub)
    let entries
    try {
      entries = readdirSync(base)
    } catch {
      continue
    }
    for (const name of entries) {
      const p = join(base, name)
      try {
        if (statSync(p).mtimeMs < cutoff) rmSync(p, { recursive: true, force: true })
      } catch {
        // Bỏ qua: dọn rác hỏng không đáng làm hỏng lượt.
      }
    }
  }
}

export async function run({ repoRoot, pages, dryRun = false }) {
  const root = resolve(repoRoot)
  const cfg = loadConfig(root)
  if (!cfg.enabled) {
    log(root, 'bỏ qua: .shots.json đặt enabled=false')
    return { sent: 0, skipped: ['disabled'] }
  }

  const plan = pages.map((rel) => {
    let query = ''
    let queryError = null
    try {
      query = queryForPage(cfg, rel, root)
    } catch (err) {
      queryError = err.message
    }
    return { rel, query, queryError }
  })

  if (dryRun) {
    for (const p of plan) {
      const q = p.queryError ? `LỖI: ${p.queryError}` : p.query || '(không query)'
      console.log(`${p.rel}  →  ${q}`)
    }
    return { sent: 0, skipped: ['dry-run'] }
  }

  sweep(root)
  const shotsDir = join(root, 'tmp', 'shots')
  const profsDir = join(root, 'tmp', 'chrome-profiles')
  mkdirSync(shotsDir, { recursive: true })
  mkdirSync(profsDir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = resolveTarget(root)
  if (!target) log(root, 'không tra được topic cho cwd này; sẽ chụp nhưng không gửi')

  const srv = await startServer(root)
  let sent = 0
  const skipped = []

  try {
    for (const [i, p] of plan.entries()) {
      if (p.queryError) {
        log(root, `bỏ ${p.rel}: ${p.queryError}`)
        skipped.push(p.rel)
        continue
      }
      const url = `http://127.0.0.1:${srv.port}/${p.rel}${p.query ? '?' + p.query : ''}`
      const slug = p.rel.replace(/[\\/]/g, '-').replace(/\.html$/, '')
      const files = {}

      try {
        for (const [kind, [w, h]] of Object.entries(cfg.viewports)) {
          const out = join(shotsDir, `${slug}-${kind}-${stamp}.png`)
          const prof = join(profsDir, `${stamp}-${i}-${kind}`)
          await capture({ url, out, width: w, height: h, profileDir: prof })
          files[kind] = out
        }

        const merged = join(shotsDir, `${slug}-${stamp}.png`)
        const r = await composite({ desktop: files.desktop, mobile: files.mobile, out: merged })
        for (const f of Object.values(files)) rmSync(f, { force: true })

        const bits = [p.rel, 'desktop+mobile']
        if (p.query) bits.push(p.query)
        if (r.blank) bits.push('⚠ trang có vẻ trống')
        let caption = bits.join(' · ')

        if (!target) {
          log(root, `đã chụp ${basename(merged)} nhưng không có topic để gửi`)
          skipped.push(p.rel)
          continue
        }
        await sendPhoto({ ...target, file: merged, caption })
        sent++
      } catch (err) {
        log(root, `lỗi ở ${p.rel}: ${err.message}`)
        skipped.push(p.rel)
      }
    }
  } finally {
    await srv.close()
  }

  return { sent, skipped }
}

function parseArgs(argv) {
  const out = { repoRoot: process.cwd(), pages: [], dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') out.repoRoot = argv[++i]
    else if (argv[i] === '--pages') out.pages = argv[++i].split(',').filter(Boolean)
    else if (argv[i] === '--dry-run') out.dryRun = true
    else if (argv[i] === '--edited') out.edited = argv[++i].split(',').filter(Boolean)
  }
  return out
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const args = parseArgs(process.argv.slice(2))
  if (args.edited) {
    const cfg = loadConfig(args.repoRoot)
    const r = pagesToShoot(args.edited, args.repoRoot, { maxShots: cfg.maxShots })
    args.pages = r.pages
    if (r.truncated) console.log(`(đã cắt ${r.truncated} trang do trần ${cfg.maxShots})`)
  }
  if (args.pages.length === 0) {
    console.log('không có trang nào để chụp')
    process.exit(0)
  }
  run(args)
    .then((r) => console.log(`gửi ${r.sent}, bỏ ${r.skipped.length}`))
    .catch((err) => {
      log(args.repoRoot, `CLI hỏng: ${err.message}`)
      process.exit(0) // §9: không bao giờ trả mã lỗi
    })
}
```

- [ ] **Step 2: Nghiệm thu dry-run trên repo này**

```bash
cd ~/.claude/skills/shot-report
node shot-report.mjs --repo "C:/Users/kevin/Desktop/Dino/html-theme-by-products-01" \
  --edited "themes/light-minimal/assets/tokens.css" --dry-run
```

Expected: in đúng 2 dòng, `themes/light-minimal/index.html` và `themes/light-minimal/product.html`, cả hai `(không query)` vì repo chưa có `.shots.json` (Task 8 sẽ thêm).

- [ ] **Step 3: Nghiệm thu dry-run ở repo không có HTML**

```bash
cd ~/.claude/skills/shot-report
node shot-report.mjs --repo ~/.claude/skills/shot-report --edited "lib/config.mjs" --dry-run
```

Expected: `không có trang nào để chụp`, exit 0.

- [ ] **Step 4: Commit**

```bash
cd ~/.claude/skills/shot-report
git add shot-report.mjs
git commit -m "feat(cli): điều phối chụp-ghép-gửi, dry-run, dọn rác 7 ngày"
```

---

### Task 7: Stop hook và installer

**Files:**
- Create: `~/.claude/skills/shot-report/hook.mjs`, `~/.claude/skills/shot-report/install.mjs`
- Test: `~/.claude/skills/shot-report/tests/hook.test.mjs`
- Modify: `C:/Users/kevin/.claude/settings.json` (do `install.mjs` ghi)

**Interfaces:**
- Consumes: `pagesToShoot` (T1), `loadConfig` (T2), `run`/`log` (T6)
- Produces: `editedFilesFromTranscript(transcriptPath) → string[]` — đường dẫn tuyệt đối các file bị Edit/Write/MultiEdit/NotebookEdit trong lượt cuối

- [ ] **Step 1: Viết test thất bại**

```js
// tests/hook.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { editedFilesFromTranscript } from '../hook.mjs'

function transcript(lines) {
  const p = join(mkdtempSync(join(tmpdir(), 'tr-')), 's.jsonl')
  writeFileSync(p, lines.map((l) => JSON.stringify(l)).join('\n'))
  return p
}

const toolUse = (name, file) => ({
  type: 'assistant',
  message: { content: [{ type: 'tool_use', name, input: { file_path: file } }] },
})

test('lấy file từ Edit và Write', () => {
  const p = transcript([
    { type: 'user', message: { content: 'làm đi' } },
    toolUse('Edit', 'C:/r/a.css'),
    toolUse('Write', 'C:/r/b.html'),
  ])
  assert.deepEqual(editedFilesFromTranscript(p).sort(), ['C:/r/a.css', 'C:/r/b.html'])
})

test('chỉ tính lượt cuối, bỏ lượt trước đó', () => {
  const p = transcript([
    { type: 'user', message: { content: 'lượt 1' } },
    toolUse('Edit', 'C:/r/cu.css'),
    { type: 'user', message: { content: 'lượt 2' } },
    toolUse('Edit', 'C:/r/moi.css'),
  ])
  assert.deepEqual(editedFilesFromTranscript(p), ['C:/r/moi.css'])
})

test('bỏ qua tool đọc, chỉ tính tool ghi', () => {
  const p = transcript([
    { type: 'user', message: { content: 'x' } },
    toolUse('Read', 'C:/r/a.css'),
    toolUse('Grep', 'C:/r/b.css'),
  ])
  assert.deepEqual(editedFilesFromTranscript(p), [])
})

test('dòng JSON hỏng không làm ném lỗi', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'tr-')), 's.jsonl')
  writeFileSync(p, '{"type":"user","message":{"content":"x"}}\nHỎNG\n' + JSON.stringify(toolUse('Edit', 'C:/r/a.css')))
  assert.deepEqual(editedFilesFromTranscript(p), ['C:/r/a.css'])
})

test('transcript không tồn tại thì trả mảng rỗng', () => {
  assert.deepEqual(editedFilesFromTranscript('C:/khong-co.jsonl'), [])
})
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `cd ~/.claude/skills/shot-report && node --test tests/hook.test.mjs`
Expected: FAIL — `Cannot find module '../hook.mjs'`

- [ ] **Step 3: Viết hook.mjs**

```js
#!/usr/bin/env node
// hook.mjs — Stop hook. Chỉ quyết định KHI NÀO; việc chụp là của CLI.
// Mọi nhánh thoát đều exit 0: ảnh là thứ bổ trợ, không được làm hỏng lượt — §9.
import { readFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

export function editedFilesFromTranscript(transcriptPath) {
  let lines
  try {
    lines = readFileSync(transcriptPath, 'utf8').split('\n')
  } catch {
    return []
  }

  const records = []
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      records.push(JSON.parse(line))
    } catch {
      // Dòng hỏng thì bỏ, đừng để một dòng rác giết cả lượt.
    }
  }

  // Lượt cuối = từ bản ghi user gần nhất trở đi.
  let start = 0
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].type === 'user') {
      start = i
      break
    }
  }

  const files = new Set()
  for (const rec of records.slice(start)) {
    // Bỏ traffic subagent: ảnh phải phản ánh việc của lượt chính.
    if (rec.isSidechain) continue
    for (const block of rec.message?.content ?? []) {
      if (block?.type !== 'tool_use' || !WRITE_TOOLS.has(block.name)) continue
      const f = block.input?.file_path ?? block.input?.notebook_path
      if (f) files.add(f)
    }
  }
  return [...files]
}

async function main() {
  // §9: không chạy khi không điều khiển qua herdr.
  if (process.env.HERDR_ENV !== '1') process.exit(0)

  let payload = {}
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    process.exit(0)
  }
  // Tránh vòng lặp khi hook tự kích hoạt lại.
  if (payload.stop_hook_active) process.exit(0)

  const cwd = payload.cwd ?? process.cwd()
  const edited = editedFilesFromTranscript(payload.transcript_path ?? '')
  if (edited.length === 0) process.exit(0)

  const { pagesToShoot } = await import('./lib/discover.mjs')
  const { loadConfig } = await import('./lib/config.mjs')
  const cfg = loadConfig(cwd)
  if (!cfg.enabled) process.exit(0)

  const { pages } = pagesToShoot(edited, cwd, { maxShots: cfg.maxShots })
  if (pages.length === 0) process.exit(0)

  // Chạy rời, không chờ: Stop hook không được giữ lượt lại.
  const child = execFile(
    process.execPath,
    [join(HERE, 'shot-report.mjs'), '--repo', cwd, '--pages', pages.join(',')],
    { detached: true, stdio: 'ignore' },
  )
  child.unref()
  process.exit(0)
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) main()
```

- [ ] **Step 4: Chạy test để xác nhận đạt**

Run: `cd ~/.claude/skills/shot-report && node --test tests/hook.test.mjs`
Expected: PASS — `# pass 5`, `# fail 0`

- [ ] **Step 5: Viết install.mjs**

```js
#!/usr/bin/env node
// install.mjs — ghi Stop hook vào settings.json. Chạy lại nhiều lần vô hại.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const SETTINGS = join(homedir(), '.claude', 'settings.json')
const MARKER = 'shot-report/hook.mjs'

const hookPath = resolve(HERE, 'hook.mjs').replace(/\\/g, '/')
const command = `node "${hookPath}"`

let settings = {}
if (existsSync(SETTINGS)) {
  settings = JSON.parse(readFileSync(SETTINGS, 'utf8'))
  copyFileSync(SETTINGS, SETTINGS + '.bak')
  console.log(`đã sao lưu ${SETTINGS}.bak`)
}

settings.hooks ??= {}
settings.hooks.Stop ??= []

const already = settings.hooks.Stop.some((entry) =>
  (entry.hooks ?? []).some((h) => String(h.command).includes(MARKER)),
)
if (already) {
  console.log('Stop hook đã có, không ghi lại')
} else {
  settings.hooks.Stop.push({ hooks: [{ type: 'command', command, timeout: 15 }] })
  writeFileSync(SETTINGS, JSON.stringify(settings, null, 2))
  console.log('đã thêm Stop hook vào settings.json')
}

console.log('\nCòn hai việc phải tự làm:')
console.log('  1. Telegram: /options → Posts → Done post = Formatted')
console.log(`  2. Nối ${join(HERE, 'report-style.md')} vào ~/.claude/CLAUDE.md`)
```

- [ ] **Step 6: Chạy installer và xác minh**

```bash
node ~/.claude/skills/shot-report/install.mjs
node -e "const s=require('C:/Users/kevin/.claude/settings.json');console.log(JSON.stringify(s.hooks.Stop,null,2))"
node ~/.claude/skills/shot-report/install.mjs
```

Expected: lần đầu in `đã thêm Stop hook`, lần hai in `Stop hook đã có, không ghi lại`. Entry `Stop` chứa đúng một hook trỏ tới `hook.mjs`. **Xác minh `settings.json` vẫn còn nguyên `env`, `permissions`, `enabledPlugins`, và `hooks.SessionStart` của herdr.**

- [ ] **Step 7: Commit**

```bash
cd ~/.claude/skills/shot-report
git add hook.mjs install.mjs tests/hook.test.mjs
git commit -m "feat(hook): Stop hook gate theo transcript và installer idempotent"
```

---

### Task 8: Tài liệu gói, config repo, nghiệm thu đầu-cuối

**Files:**
- Create: `~/.claude/skills/shot-report/SKILL.md`, `~/.claude/skills/shot-report/report-style.md`, `~/.claude/skills/shot-report/shots.example.json`
- Create: `C:/Users/kevin/Desktop/Dino/html-theme-by-products-01/.shots.json`
- Modify: `C:/Users/kevin/Desktop/Dino/html-theme-by-products-01/.gitignore`

**Interfaces:**
- Consumes: toàn bộ Task 1–7
- Produces: gói hoàn chỉnh copy được

- [ ] **Step 1: Viết SKILL.md**

```markdown
---
name: shot-report
description: Use when a turn changed theme HTML/CSS/JS and the result should be reported to Telegram with a screenshot - captures desktop+mobile, composites them, and posts to the agent's herdr topic. Also use when asked to screenshot a page manually.
---

# Shot Report

Chụp trang vừa sửa ở hai viewport, ghép một ảnh, gửi về đúng topic Telegram của repo.

## Chạy tay

```bash
node ~/.claude/skills/shot-report/shot-report.mjs --repo <repo> --pages themes/light-minimal/index.html
node ~/.claude/skills/shot-report/shot-report.mjs --repo <repo> --edited themes/x/assets/a.css --dry-run
```

`--dry-run` in ra định chụp gì mà không chụp. Dùng nó trước khi tin hook ở một repo mới.

## Tự động

Stop hook chạy sau mỗi lượt khi `HERDR_ENV=1`. Nó đọc transcript, lấy file bị
Edit/Write, leo ngược cây thư mục tìm `*.html` gần nhất. Không có cụm trang nào
thì im lặng. Repo không có HTML thì hook không bao giờ kích hoạt.

Sửa `.html` → chụp trang đó. Sửa `.css`/`.js`/`.mjs` → chụp mọi trang trong cụm.

## Config mỗi repo — `.shots.json`

Không bắt buộc. Xem `shots.example.json`. Cần khi trang đòi query param:

```json
{ "pages": { "**/product.html": { "query": "sku=${json:products/products.json#products.0.sku}" } } }
```

`"enabled": false` để tắt hẳn ở một repo.

## Cài sang máy hoặc dự án khác

```bash
cp -r ~/.claude/skills/shot-report <đích>/
node <đích>/shot-report/install.mjs
```

Installer sao lưu `settings.json` thành `.bak` trước khi ghi, và chạy lại nhiều lần vô hại.

## Hai việc installer không làm hộ được

1. Telegram `/options` → Posts → `Done post` = `Formatted`. Không có bước này thì
   báo cáo chữ vẫn về dạng 12 dòng terminal.
2. Nối `report-style.md` vào `~/.claude/CLAUDE.md`.

## Giới hạn đã biết

- Viewport cố định; trang cao hơn 3000px bị cắt đuôi.
- Chỉ chụp trạng thái tĩnh — không hover, không carousel frame 2.
- Trần 4 ảnh/lượt; vượt thì caption ghi rõ đã cắt.
- Hai pane Claude trong cùng thư mục không phân biệt được topic.
```

- [ ] **Step 2: Viết report-style.md**

```markdown
## Kết thúc lượt

Tin nhắn cuối là báo cáo, không phải nhật ký thi công:

- Mở bằng 1 câu kết quả. Không mở bằng "Tôi đã…".
- **Đã thay đổi** — mỗi dòng 1 file + lý do, tối đa 5 dòng.
- **Kiểm chứng** — lệnh đã chạy + kết quả thật. Chưa chạy thì nói chưa chạy.
- **Còn lại** — việc chưa xong hoặc rủi ro. Không có thì bỏ hẳn mục.
- Dưới 20 dòng (quá 20 Telegram sẽ gập lại). Không ASCII art, không bảng rộng.
```

- [ ] **Step 3: Viết shots.example.json**

```json
{
  "enabled": true,
  "pages": {
    "**/product.html": { "query": "sku=${json:products/products.json#products.0.sku}" }
  },
  "viewports": { "desktop": [1440, 3000], "mobile": [390, 2200] },
  "maxShots": 4
}
```

- [ ] **Step 4: Commit gói**

```bash
cd ~/.claude/skills/shot-report
git add SKILL.md report-style.md shots.example.json
git commit -m "docs: SKILL.md, khuôn báo cáo, template config"
```

- [ ] **Step 5: Thêm config và gitignore cho repo theme**

`.shots.json` (file mới ở gốc repo). Bắt buộc vì `light-minimal/product.js:52` thiếu `?sku=` sẽ ra `pdpError` — xem spec §3:

```json
{
  "enabled": true,
  "pages": {
    "**/product.html": { "query": "sku=${json:products/products.json#products.0.sku}" }
  },
  "viewports": { "desktop": [1440, 3000], "mobile": [390, 2200] },
  "maxShots": 4
}
```

`.gitignore` — thêm `tmp/` vào sau dòng `dist/`:

```
node_modules/
dist/
tmp/
.omc/
```

- [ ] **Step 6: Nghiệm thu §10 — chạy từng ca, ghi kết quả thật**

| # | Lệnh | Đạt khi |
|---|---|---|
| 1 | `node shot-report.mjs --repo <repo> --pages themes/light-minimal/index.html --dry-run` | in 1 dòng, không query |
| 2 | `node shot-report.mjs --repo <repo> --edited docs/x.md --dry-run` | `không có trang nào để chụp` |
| 3 | `node shot-report.mjs --repo <repo> --edited themes/light-minimal/assets/tokens.css` | **ảnh về topic 391 trên điện thoại**, 2 ảnh, PDP có nội dung |
| 4 | `node shot-report.mjs --repo <repo> --edited themes/dark-maximalism/index.html` | đúng 1 ảnh, không lẫn theme kia |
| 5 | Đổi tạm `bot_token` trong `config.json` thành chuỗi rác, chạy lại ca 3 | exit 0, `tmp/shot-report.log` có `Telegram từ chối: HTTP 401`. **Khôi phục token ngay sau đó.** |
| 6 | Mở Chrome bình thường rồi chạy ca 4 | vẫn ra ảnh (xác minh `--user-data-dir` cách ly thật) |
| 7 | Đổi tạm `.shots.json` thành `{}`, chạy ca 3 | PDP bị gắn `⚠ trang có vẻ trống` trong caption |
| 8 | `node shot-report.mjs --repo ~/.claude/skills/shot-report --edited lib/config.mjs --dry-run` | `không có trang nào để chụp` |

Ca 3 cần chủ repo xác nhận bằng mắt trên điện thoại — agent không nhìn được màn hình đó. **Không đánh dấu task xong trước khi có xác nhận ấy.**

- [ ] **Step 7: Chạy toàn bộ test gói**

Run: `cd ~/.claude/skills/shot-report && node --test tests/`
Expected: PASS — tổng `# pass 32`, `# fail 0`

- [ ] **Step 8: Commit repo theme**

```bash
cd "C:/Users/kevin/Desktop/Dino/html-theme-by-products-01"
git add .shots.json .gitignore
git commit -m "chore(tooling): config .shots.json cho shot-report, bỏ qua tmp/"
```

---

## Self-Review

**Spec coverage:**

| Spec | Task |
|---|---|
| §1 `Done post = Formatted` | T7 Step 5 (installer nhắc), T8 SKILL.md — việc của người, không tự động được |
| §3 serve HTTP, `--user-data-dir`, viewport cao, sku | T3 (serve, capture), T2 + T8 (sku qua config) |
| §4 luật leo cây, bỏ test/partial, trần 4 | T1 |
| §5.1 server | T3 — dùng Node thay python, spec cho phép |
| §5.2 lệnh chụp | T3 |
| §5.3 ghép ngang | T4 |
| §5.4 dò ảnh trắng 40KB/32 màu | T4 |
| §6 `.shots.json`, resolver, kẹp đường dẫn | T2 |
| §7 mapping/config/sendPhoto, không đoán topic | T5 |
| §8 report-style | T8 |
| §9 exit 0, token sạch, HERDR_ENV, tmp/ gitignore, dọn 7 ngày, dry-run | T6 (log/sweep/dry-run), T7 (gate, exit 0), T8 (gitignore) |
| §10 tám ca nghiệm thu | T8 Step 6 |
| §13 cấu trúc gói, `.shots.json` repo | T8 |

Không còn mục spec nào thiếu task.

**Placeholder scan:** không có TBD/TODO. Mọi bước có code thật hoặc lệnh thật kèm kết quả mong đợi.

**Type consistency:** `pagesToShoot` trả `{pages, truncated}` — dùng nhất quán ở T6 CLI và T7 hook. `loadConfig` trả đủ bốn khoá ở T2, T6, T7 đều đọc `cfg.maxShots`/`cfg.enabled`/`cfg.viewports`. `resolveTarget` trả `{token, chatId, threadId}` khớp tham số `sendPhoto`. `composite` trả `{width,height,bytes,colors,blank}` — T6 chỉ đọc `blank`.

**Rủi ro thi công đã biết:** T7 Step 6 sửa `settings.json` thật đang chứa token và cấu hình herdr. Installer sao lưu `.bak` trước khi ghi, và bước nghiệm thu bắt buộc kiểm lại `env`/`permissions`/`enabledPlugins`/`hooks.SessionStart` còn nguyên.
