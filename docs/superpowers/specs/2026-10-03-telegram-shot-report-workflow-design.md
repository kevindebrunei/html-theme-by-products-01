# Workflow báo cáo qua Telegram kèm ảnh chụp theme

> **Ngày:** 03/10/2026
> **Trạng thái:** Đã chốt qua brainstorm, chờ chuyển sang implementation plan
> **Phạm vi:** Công cụ môi trường làm việc. **Không đụng vào `themes/`, `products/`, `scripts/` của repo.**
> **Quan hệ với tài liệu khác:** độc lập. Không spec theme nào bị ảnh hưởng.

---

## 0. Vì sao viết

Chủ repo điều khiển agent qua Telegram bằng herdr. Khi agent xong việc, cái về điện thoại là **12 dòng cuối của terminal bọc trong code block** — ANSI thừa, câu cụt đầu cụt đuôi, không đọc được trên màn hình nhỏ. Và với một repo mà sản phẩm là **giao diện**, báo cáo thuần chữ không trả lời được câu hỏi duy nhất đáng hỏi: *trông nó ra sao rồi?*

Tài liệu này chốt hai thứ: khuôn báo cáo chữ, và đường đưa ảnh chụp trang về thẳng Telegram.

---

## 1. Nguyên nhân gốc — không phải lỗi, là mặc định

Plugin `permgps.telegram-agents` v0.13.0 có option `Done post` ba chế độ, **mặc định `Screen`**:

| Mode | Gửi gì |
|---|---|
| `Screen` ← đang chạy | 12 dòng cuối terminal, code block |
| `Reply` | Tin cuối của agent từ transcript, vẫn monospace |
| `Formatted` | Render thật: heading → bold, `- ` → `•`, link, code, bảng |

Nên **lớp fix thứ nhất là config, không phải code**: `/options` → Posts → `Done post` = `Formatted`. Chủ repo tự bấm trên Telegram; agent không với tới nút Telegram.

Hệ quả ràng buộc: plugin gập (`fold`) tin dài quá **20 dòng**. Con số 20 trong §8 là lấy từ đây, không phải chọn bừa.

---

## 2. Năm quyết định đã chốt

| # | Quyết định | Phương án bị loại và vì sao |
|---|---|---|
| 1 | Ảnh **đẩy thẳng vào Telegram** qua Bot API `sendPhoto` | Chỉ lưu `tmp/` rồi báo đường dẫn: trên điện thoại chỉ thấy tên file, không giải quyết được gì. Link HTTP qua tunnel: phải nuôi tunnel sống và mở thư mục ra internet. |
| 2 | Kích hoạt **tự động** khi lượt có sửa `.html`/`.css`/`.js` | Manifest do agent tự ghi: phụ thuộc agent nhớ ghi. |
| 3 | Desktop + mobile **ghép thành một ảnh** | Chỉ desktop: lỗi layout mobile lọt lưới. Album 2 ảnh: sửa CSS là 4 ảnh, lụt topic. |
| 4 | Cài **global**, mọi dự án trên máy | Chỉ repo này: trái yêu cầu dùng cho theme khác. |
| 5 | Đóng gói thành **skill** `~/.claude/skills/shot-report/` | `tools/` trong repo: không tự global. Cả hai bản: chắc chắn lệch nhau, và sẽ không biết bản nào đang chạy khi hỏng. |

Quyết định 4 và 5 kéo ngược nhau nếu đọc hời hợt — global thì có gì để copy. Giải: **một thư mục tự chứa**, vừa là bản cài global, vừa là đơn vị bê đi. Không mảnh nào nằm ngoài nó trừ đúng một entry trong `settings.json` do installer ghi.

---

## 3. Phát hiện thực nghiệm — cơ sở của toàn bộ thiết kế

Mọi giả định dưới đây đã chạy thật trên máy này ngày 02/10, không suy từ tài liệu. **Bốn trong sáu giả định ban đầu sai.**

| Giả định | Kết quả | Hệ quả thiết kế |
|---|---|---|
| Chụp được qua `file://` | ❌ **Sai** | Cả 2 theme dùng `<script type="module">` + `fetch()`. Trên `file://` origin là `null`, CORS chặn cả hai → trang trắng mà lệnh vẫn báo thành công. **Buộc phải serve HTTP.** |
| Serve HTTP là đủ | ✅ | nav đếm đúng `TUMBLERS 43 · CAPS 11 · BACKPACKS 8 · SHOES 3` → fetch chạy. Serve từ git toplevel để `/products/products.json` phân giải. |
| `chrome --headless` chạy độc lập | ❌ **Sai** | Chrome đang mở sẽ **cướp lệnh** (`"Opening in existing browser session"`). Bắt buộc `--user-data-dir` riêng trong `tmp/`. |
| Viewport 1440×900 là đủ | ❌ **Sai** | Chỉ bắt được hero; toàn bộ lưới sản phẩm nằm dưới fold. Sửa CSS catalog mà ảnh chỉ thấy hero là vô dụng. → viewport cao. |
| `?sku=` không quan trọng | ❌ **Sai** | `light-minimal/product.js:52` thiếu sku → `pdpError`, `pdpContent` ẩn. Đo được: **591 KB có sku vs 18 KB không sku**. |
| Hai theme cùng khuôn | ❌ **Sai** | `dark-maximalism/product.js:309` có `?? DEFAULT_SKU` — không cần sku vẫn render. `light-minimal` thì cần. |

Phát hiện cuối là quan trọng nhất: **hai theme trong cùng repo đã khác nhau về tham số trang.** Nên "trang này cần tham số gì" không thể là luật cứng trong code — nó phải là dữ liệu đi kèm từng repo (§6).

Con số 591 KB / 18 KB cũng cho không một thứ khác: ngưỡng dò ảnh trắng (§5.4).

---

## 4. Luật kích hoạt — suy từ file bị sửa, không từ tên thư mục

Vì cài global, hook sẽ chạy ở những repo chưa ai nhìn thấy. Luật `themes/<t>/` là hình dạng riêng của repo này, bỏ. Thay bằng:

```
file bị sửa → leo ngược cây thư mục → thư mục đầu tiên chứa *.html = "cụm trang"
```

| Repo | File sửa | Leo lên gặp | Chụp |
|---|---|---|---|
| repo này | `themes/light-minimal/assets/tokens.css` | `themes/light-minimal/` | **cả 2** trang theme đó |
| repo này | `themes/dark-maximalism/index.html` | chính nó | đúng trang đó |
| repo phẳng | `css/style.css` | root có `index.html` | các trang root |
| repo backend | `src/api/user.js` | không gặp `*.html` nào | **không chụp, im lặng** |

Luật này **tự khoá van**: repo không có HTML thì không bao giờ kích hoạt. Đó là thứ làm việc cài global an toàn, chứ không phải một danh sách allow-list phải bảo trì.

Quy tắc phụ:

- File `*.test.mjs`, `*.spec.*` → bỏ qua, test không đổi render.
- Sửa `.html` → chụp đúng trang đó. Sửa asset (`.css`/`.js`/`.mjs`) → chụp **mọi** trang trong cụm, vì asset dùng chung.
- File `_*.html`, `*.partial.html` → bỏ qua, không phải trang đứng một mình.
- **Trần 4 ảnh/lượt.** Vượt thì lấy 4 trang đầu theo thứ tự đường dẫn và **ghi rõ trong caption là đã cắt**. Cắt âm thầm sẽ bị đọc thành "đã phủ hết" trong khi không phải.

Nguồn danh sách file sửa: transcript `.jsonl` của lượt vừa rồi, lọc tool `Edit`/`Write`/`MultiEdit`/`NotebookEdit`, bỏ traffic subagent.

---

## 5. Chụp ảnh

### 5.1 Server

`python -m http.server <port> --bind 127.0.0.1`, cổng trống chọn động, document root = **git toplevel**. Tắt ngay sau khi chụp xong, kể cả khi lỗi. Python 3.11.9 đã có sẵn; Node v24.14.1 là phương án hai.

### 5.2 Lệnh chụp

```
chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run
       --user-data-dir=<tmp/.chrome-profile-N>   ← bắt buộc, xem §3
       --virtual-time-budget=6000                ← chờ fetch + ảnh
       --window-size=<W>,<H>
       --screenshot=<out.png>
       "http://127.0.0.1:<port>/<page><?query>"
```

Chrome tìm theo thứ tự: `CHROME_PATH` → Chrome → Edge → Chromium. Không có cái nào → ghi log, thoát 0, không chụp.

### 5.3 Ghép ảnh

Pillow 12.3.0 (có sẵn). Desktop và mobile ghép **cạnh nhau theo chiều ngang**, nền trắng, nhãn chữ nhỏ dưới mỗi nửa. Ra một PNG duy nhất: `tmp/shots/<theme>-<page>-<ts>.png`.

### 5.4 Dò ảnh trắng

Sau khi chụp, ảnh bị gắn cờ `⚠ trang có vẻ trống` trong caption nếu **dưới 40 KB** hoặc **dưới 32 màu riêng biệt**. Ngưỡng lấy từ số đo thật ở §3 (18 KB trang lỗi vs 591 KB trang thật), có biên rộng.

Ảnh vẫn được gửi, chỉ là có cờ. Đây là ranh giới giữa hệ thống ảnh tin được và hệ thống ảnh làm người đọc tin nhầm.

---

## 6. Config per-repo — `.shots.json`

Đặt ở gốc repo, **không bắt buộc**. Không có file này thì chạy bằng mặc định.

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

| Khoá | Mặc định khi thiếu |
|---|---|
| `enabled` | `true` |
| `pages` | không trang nào có query |
| `viewports` | `desktop [1440,3000]`, `mobile [390,2200]` |
| `maxShots` | `4` |

`${json:<path>#<pointer>}` là resolver nhỏ đọc giá trị từ file JSON bất kỳ trong repo. Nhờ nó, script **không chứa kiến thức về `products.json`** — kiến thức đó nằm trong config của repo cần nó. Repo khác dùng `data/catalog.json` chỉ việc đổi config.

Đường dẫn resolver bị kẹp trong git toplevel; trỏ ra ngoài thì từ chối.

`"enabled": false` là van tắt theo repo.

---

## 7. Gửi về Telegram

Không dùng đường của plugin — plugin **chỉ nhận ảnh vào** (`inbox/`), không có đường đẩy ảnh ra. Gọi thẳng Bot API:

| Cần gì | Lấy ở đâu |
|---|---|
| `bot_token`, `chat_id` | `%APPDATA%\herdr\plugins\config\permgps.telegram-agents\config.json` |
| `message_thread_id` | `%LOCALAPPDATA%\herdr\plugins\permgps.telegram-agents\mapping.json`, tra theo `cwd` |

`mapping.json` khoá theo `cwd` nên tra cứu đúng topic của repo đang làm việc, không cần cấu hình gì thêm. Repo này hiện là thread `391`.

Không tra được `thread_id` → **không gửi**, ghi log. Không đoán, không gửi nhầm topic.

Caption: `<theme>/<page> · desktop+mobile · sku=<...>` kèm cờ §5.4 và ghi chú cắt bớt §4 nếu có.

---

## 8. Báo cáo chữ

Hai phần, phần đầu không phải việc của agent:

1. **Chủ repo bấm:** `/options` → Posts → `Done post` = `Formatted`. Không đổi cái này thì mọi thứ còn lại vô nghĩa — vẫn là 12 dòng terminal.
2. **Agent tuân:** `report-style.md` trong gói, nối vào `~/.claude/CLAUDE.md`:

```
## Kết thúc lượt
Tin nhắn cuối là báo cáo, không phải nhật ký thi công:
- Mở bằng 1 câu kết quả. Không mở bằng "Tôi đã…".
- **Đã thay đổi** — mỗi dòng 1 file + lý do, tối đa 5 dòng.
- **Kiểm chứng** — lệnh đã chạy + kết quả thật. Chưa chạy thì nói chưa chạy.
- **Còn lại** — việc chưa xong hoặc rủi ro. Không có thì bỏ hẳn mục.
- Dưới 20 dòng. Không ASCII art, không bảng rộng.
```

20 dòng là ngưỡng `Fold long replies after` của plugin (§1), không phải con số tuỳ ý.

---

## 9. An toàn, bảo mật, rác

- **Hook không bao giờ làm hỏng lượt.** Mọi lỗi — thiếu Chrome, cổng bận, Telegram 429, token sai — đều nuốt, ghi `tmp/shot-report.log`, **exit 0**. Ảnh là thứ bổ trợ; nó hỏng không được kéo theo gì.
- **Token đọc trực tiếp từ `config.json` của herdr lúc chạy.** Không copy vào repo, không vào env var, không vào log. Token không bao giờ chạm git.
- **Gate `HERDR_ENV=1`**, giống `herdr-agent-state.ps1` sẵn có. Ngồi trước máy làm việc bình thường thì hook không tốn gì.
- `tmp/` được thêm vào `.gitignore` nếu thiếu. Repo này hiện **chưa có** `tmp/` trong `.gitignore`.
- Dọn rác mỗi lần chạy: xoá ảnh và profile Chrome cũ hơn **7 ngày**. Mỗi ảnh ghép cỡ 1 MB; không dọn thì `tmp/` phình vô hạn.
- `--dry-run` in ra *định chụp gì* mà không chụp, để thử ở repo lạ trước khi tin.

---

## 10. Nghiệm thu

Không tuyên bố xong vì code trông đúng. Phải chạy và phải thấy kết quả:

| # | Ca | Đạt khi |
|---|---|---|
| 1 | CLI tay, 1 trang | Ra PNG ghép, kích thước đúng `(1440+390) × max(3000,2200)` |
| 2 | Lượt không sửa HTML | Hook im lặng, exit 0, không có file mới trong `tmp/` |
| 3 | Sửa thật 1 file CSS của `light-minimal` | **Ảnh về đúng topic 391 trên điện thoại chủ repo**, có cả 2 trang |
| 4 | Sửa `dark-maximalism/index.html` | Chỉ chụp 1 trang, không chụp nhầm theme kia |
| 5 | Token cố ý sai | Lượt kết thúc bình thường, log ghi lỗi, **exit 0** |
| 6 | Chrome đang mở | Vẫn chụp được (xác minh `--user-data-dir` thật sự cách ly) |
| 7 | `light-minimal/product.html` chụp khi đã **xoá** `.shots.json` | Ảnh bị gắn cờ `⚠ trang có vẻ trống`, không im lặng gửi trang lỗi. (Ca này phải dùng `light-minimal`; `dark-maximalism` có `DEFAULT_SKU` nên vẫn render bình thường — xem §3.) |
| 8 | `--dry-run` ở repo không có HTML | In ra "không có cụm trang", không chụp |

Ca 3 là ca duy nhất chủ repo phải xác nhận — agent không nhìn được màn hình điện thoại.

---

## 11. Cố ý không làm

- **Không đo chiều cao trang thật.** Viewport cố định; trang dài hơn bị cắt đuôi. Đo đúng tốn thêm một vòng Chrome mỗi ảnh để lấy `scrollHeight`. Mở lại nếu cắt đuôi thành phiền thật.
- **Không chụp trạng thái tương tác** (hover, carousel frame 2, menu mở). Chỉ chụp trạng thái tĩnh lúc tải xong.
- **Không so sánh ảnh giữa các lượt** (visual regression diff). Khác phạm vi, và cần ảnh gốc ổn định mà thiết kế này chưa đảm bảo.
- **Không chạm vào plugin herdr.** Chỉ đọc `config.json` và `mapping.json`, không ghi, không vá. Plugin cập nhật thì chỉ cần hai file đó giữ nguyên hình dạng.

---

## 12. Rủi ro đã biết

| Rủi ro | Mức | Xử lý |
|---|---|---|
| Hook chạy ở repo lạ, chụp sai thứ | Trung bình | Tự khoá van §4 + `--dry-run` + `enabled:false` |
| herdr đổi đường dẫn/khuôn `mapping.json` | Trung bình | Không tra được → không gửi, ghi log. Hỏng êm, không hỏng ồn. |
| SKU đầu tiên đổi khi `products.json` sắp xếp lại | Thấp | SKU in trong caption nên nhìn ra ngay. Muốn cố định thì ghim trong `.shots.json`. |
| Viewport cố định cắt đuôi trang dài | Thấp | Đã ghi ở §11 là nợ có ý thức |
| Chrome cập nhật đổi cờ `--headless=new` | Thấp | Chụp hỏng → log, exit 0, không gãy lượt |

---

## 13. Bước tiếp theo

Chuyển sang implementation plan. Cấu trúc gói:

```
~/.claude/skills/shot-report/
├─ SKILL.md             workflow đầy đủ + metadata skill
├─ install.mjs          ghi Stop hook vào settings.json, idempotent
├─ hook.mjs             gate §4
├─ shot-report.mjs      CLI §5 §6 §7
├─ shots.example.json   template §6
└─ report-style.md      §8
```

Copy sang dự án khác: `cp -r ~/.claude/skills/shot-report <repo>/.claude/skills/` rồi chạy `install.mjs`. Gọi tay: `/shot-report`.

Ngoài gói, repo này cần thêm **hai file nhỏ, có commit**:

| File | Vì sao bắt buộc |
|---|---|
| `.shots.json` | `light-minimal/product.html` thiếu `?sku=` sẽ ra `pdpError` (§3). Không có file này thì trang PDP của theme đó luôn bị gắn cờ trống. `dark-maximalism` không cần nhưng dùng chung được. |
| sửa `.gitignore` | thêm `tmp/`, hiện đang thiếu (§9) |
