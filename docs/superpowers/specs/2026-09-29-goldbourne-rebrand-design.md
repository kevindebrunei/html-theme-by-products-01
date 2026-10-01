# Thiết kế lại Branding — Goldbourne & Co.

> **Ngày:** 29/09/2026
> **Trạng thái:** Đã chốt, chờ chuyển sang implementation plan
> **Thay thế:** các mục 7, 8, 9, 10, 11, 13, 14, 15, 16 của `sites/goldbourne/store-init-form.md`
> **Không đụng đến:** mục 1 (định danh site), 2 (Shopify API), 3 (doanh nghiệp), 4 (hỗ trợ), 6 (mạng xã hội), 12 (routes) — vẫn `[FAKE]` như cũ, xử lý riêng

## 0. Vì sao phải viết lại

`store-init-form.md` được xây cho một catalog **72 SKU tumbler 40oz đơn dòng**. Catalog hiện tại (`products/shopify-products-20260928-1542.csv`, 28/09/2026) là **65 SKU / 4 dòng sản phẩm**. Phần lớn quyết định branding trong form được biện minh bằng các tiền đề nay đã sai:

| Tiền đề cũ | Thực tế mới |
|---|---|
| 72 SKU, chỉ tumbler | 65 SKU: Tumbler 43 · Cap 11 · Backpack 8 · Shoes 3 |
| 7 collection theo league | 8 collection theo `Type × League` |
| MLS · NCAA · Doomsday (Marvel) | Đã biến mất. NBA và WWE mới vào |
| "cả 72 ảnh đều nền tối" | 54 tối / 11 sáng (toàn bộ cap), cộng ảnh lifestyle nền sáng ở vị trí 05 |
| Giá đơn nhất $49.95 | 4 mức giá + variant theo size + compare-at trên 100% catalog |
| `products.json` với 6 trường copy | CSV Shopify với `Body (HTML)` cấu trúc H3 |
| Bộ chặn cấm tên đội ở mọi nơi | 65/65 `SEO Title` đang dùng tên đội đầy đủ |

## 1. Năm quyết định nền tảng

| # | Quyết định | Ghi chú |
|---|---|---|
| 1 | **Brand là `Goldbourne & Co.`** | `Taveris` trong trường `Vendor` chỉ là nhà cung cấp, không liên quan tới thương hiệu |
| 2 | **Catalog ổn định ở 4 dòng** | Chỉ thêm SKU trong Tumbler/Cap/Backpack/Shoes, không thêm loại mới → branding được phép tối ưu sâu cho đúng 4 dòng |
| 3 | **Ranh giới IP: Lai** | Mặt tiền sạch, meta bắt search. Chi tiết ở §7 |
| 4 | **Kiến trúc: Product-type phẳng** | Nav theo loại sản phẩm, dark scheme toàn site. Phương án "hai wing Nocturne/Heritage" và "team-first" đã cân nhắc và loại |
| 5 | **Giữ compare-at price trên toàn catalog** | Rủi ro đã được nêu và chấp nhận. Chi tiết ở §9 |

## 2. Hình dạng catalog mới

### 2.1 Ma trận League × Type

```
              Tumbler    Cap  Backpack  Shoes   TOTAL
NFL                14     11         8      3      36
NBA                10      ·         ·      ·      10
MLB                 8      ·         ·      ·       8
Halloween           6      ·         ·      ·       6
WWE                 5      ·         ·      ·       5
TOTAL              43     11         8      3      65
```

**Hệ quả thiết kế:** Cap, Backpack, Shoes đều **100% NFL**. Facet league ở ba trang đó chỉ có một giá trị → không render facet. Facet league **chỉ có nghĩa trong trang Tumblers**.

### 2.2 Catalog chia đôi theo mùa vụ

| Nhóm | SKU | Tính mùa vụ |
|---|---|---|
| Tumbler | 43 | **100% theo mùa** — 33 Halloween/Gothic + 10 Christmas |
| Cap · Backpack · Shoes | 22 | **100% year-round** |

Store đang chạy hai mô hình kinh doanh trong một: hàng mùa vụ có deadline giao hàng, và hàng nền quanh năm. Form cũ chỉ thiết kế cho mô hình thứ nhất.

### 2.3 Lịch mùa vụ

Áp công thức của mục 5 form cũ (worst case 15 business days + 1 ngày đệm), tính từ 29/09/2026:

| Mùa | SKU | Ngày lễ | Cutoff | Còn lại |
|---|---|---|---|---|
| Halloween | **33 (51% catalog)** | T7 31/10/2026 | **T6 09/10/2026** | **10 ngày** |
| Christmas | 10 | T6 25/12/2026 | T5 03/12/2026 | 65 ngày |

Sau 09/10, một nửa catalog mất urgency trong một đêm. 22 SKU year-round phải gánh doanh thu. **Branding phải chịu được cú chuyển đó mà không cần build lại.**

Cutoff phải sinh từ công thức đọc config, không hardcode ngày.

### 2.4 Phân bố theo đội

29 đội, trong đó **20 đội chỉ có 1 SKU**. Chỉ 8 đội cross-sell được (Cowboys 7 · 49ers 4 · Chiefs 4 · Eagles 4 · Steelers 4 · Bills 3 · Raiders 3 · Packers 2 = 31 SKU). Ba đội có đủ 4 dòng: **49ers, Eagles, Steelers**.

Đây là lý do **team-first bị loại làm trục điều hướng** — 2/3 số landing page theo đội sẽ trống. Lý do thứ hai: nav theo đội buộc tên đội ra mặt tiền, phá quyết định #3.

## 3. Mục 13 — Định vị & Nền tảng thương hiệu

**Định vị.** Goldbourne & Co. lấy đồ mang theo người hằng ngày — cốc, mũ, balô, giày — và xử lý chúng như đồ kim hoàn: vàng chạm nổi, huy hiệu, phát hành theo Edition có tên.

**Tagline:** `Gilded on every side.`

Câu cũ `No plain side to turn to the wall.` **bị bỏ** — nó nói về mặt trước/mặt sau của cái cốc, vô nghĩa với mũ và giày.

Câu mới không phải claim rỗng mà là fact sản phẩm thật, có nguồn trong chính `Body (HTML)`:
- *"All-over print across the entire backpack"* (mô tả backpack)
- *"the lattice carries the composition around the wraparound surface so there is no empty side"* (mô tả tumbler)

Đây đúng phương pháp form cũ đã dùng để tìm ra câu cũ: kéo câu đã có sẵn trong copy lên đúng vị trí, không sáng tác mới.

**Descriptor (SEO / og):** `Gold-relief tumblers, caps, backpacks and shoes — released in Editions.`

> **Quy ước từ vựng, cố ý khác nhau giữa hai lớp:**
> - Lớp **brand-facing** (tagline, H1, hero) dùng **`gilded`** — ngắn, có nhạc, đúng giọng catalogue.
> - Lớp **SEO** (meta description, subhead, alt) dùng **`gold-relief`** — cụm gánh từ khoá, mô tả kỹ thuật bề mặt, khớp cách người mua gõ tìm.
>
> Đây không phải thiếu nhất quán. Giữ đúng ranh giới này khi viết copy mới.

**Giọng.** Nhãn bảo tàng / catalogue đấu giá. Không phải giọng quảng cáo. Giọng này **vẫn tồn tại nguyên vẹn** trong `Body (HTML)` mới — *"A composition built on stillness."* · *"An ornament first, a vessel second — quiet, dark, deliberate."* Việc của brand là đừng phá nó.

**Chặn motif `EST.`** Biển `EST. 1960` / `EST. 1946` / `EST. 1933` / `EST. 1871` trên ảnh sản phẩm là **năm thành lập đội thật**. Motif này **phải nằm yên trên sản phẩm**. Tuyệt đối không kéo lên lớp brand (logo, tagline, og, wordmark) — làm vậy là ám chỉ liên kết chính thức.

**Mùa không đóng.** Hết mùa, sản phẩm rời hero và announcement bar nhưng vẫn mua được, giữ nguyên URL và index.

## 4. Mục 10 — Menu & Điều hướng

**Header cấp 1 — 4 link theo product type**, sort theo độ lớn (bỏ sort alphabet mà mục 15.2 form cũ đã chê):

```
Tumblers 43 · Caps 11 · Backpacks 8 · Shoes 3
```

Tên giải và tên đội **không xuất hiện ở nav cấp 1** (quyết định #3).

**Trong trang Tumblers — hai hàng facet độc lập.** Đây là cách gỡ đúng lỗi "trộn hai trục" mà mục 15.3 form cũ đã cảnh báo và dữ liệu mới vẫn mắc:

- **Season:** `Halloween 33` · `Christmas 10`
- **League:** `NFL 14` · `NBA 10` · `MLB 8` · `WWE 5` · `No team 6`

> `No team 6` chính là 6 SKU mà trường `Collection` gốc ghi là `Tumbler Halloween` — chúng không gắn đội nào. Trong ma trận §2.1 nhóm này nằm ở hàng `Halloween` vì đó là giá trị thô trong dữ liệu; ở lớp hiển thị phải đổi nhãn thành `No team`, nếu không nó sẽ chồng nghĩa với facet Season cùng tên.

**Caps / Backpacks / Shoes:** không render facet (cả ba đều 100% NFL).

**Footer** — giữ cấu trúc cũ, đổi khối Shop:
- *Shop*: 4 product type
- *Customer Support & Policies*: 8 trang policy như cũ
- *Business Info*: đổ tự động từ `business.*`
- *Follow Us*: chỉ render kênh có giá trị

**Announcement bar** — nền Parchment, 2 tin luân phiên:
1. `Order by Oct 9 to arrive before Halloween.` — sinh từ công thức §2.3, **tự ẩn sau 09/10**
2. `The Pair — two Editions, $89.95.`

Cơ chế urgency duy nhất trên site vẫn là **hạn giao hàng, không phải hạn tồn kho**. Không bao giờ hiển thị "chỉ còn N cái".

**Urgency có điều kiện:** đếm ngược chỉ áp cho 43 tumbler theo mùa. 22 SKU year-round không bao giờ hiện urgency. Announcement bar và PDP phải phân biệt được.

## 5. Mục 8 — Bảng màu

**Cả hai bảng giữ nguyên hex và số WCAG đã tính.** Điều thay đổi là *lý do biện minh*.

### Default — Gilded Dark

| token | hex | ghi chú |
|---|---|---|
| `bg` | `#0B0A08` | đen ngả ấm |
| `surface` | `#14120E` | |
| `fg` | `#F5F0E6` | trắng ngà |
| `muted` | `#A29684` | |
| `accent` | `#C9A227` | **8.18:1** trên `bg` — WCAG AAA |
| `accentFg` | `#100E0A` | 8.18:1 trên `accent` |
| `border` | `#2A251C` | |

### Inverse — Parchment
*(announcement bar, footer, 8 trang policy, email transaction)*

| token | hex | ghi chú |
|---|---|---|
| `bg` | `#F6F1E7` | |
| `surface` | `#FFFFFF` | |
| `fg` | `#14120E` | |
| `muted` | `#6B6151` | |
| `accent` | `#7A5F18` | **5.37:1** — `#C9A227` chỉ đạt 2.1:1, không dùng được trên nền sáng |
| `accentFg` | `#FFFFFF` | 6.05:1 trên `accent` |
| `border` | `#DED5C4` | |

### Lý do giữ dark làm default — đếm lại

Mục 8 cũ viết *"cả 72 ảnh sản phẩm đều nền tối"*. Tiền đề đó nay sai. Lý do mới, **đếm theo ảnh chính (vị trí 01) của từng SKU**:

| Nền ảnh chính | SKU |
|---|---|
| Tối / studio tối | **54** — 43 tumbler + 3 shoes + 8 backpack |
| Sáng — marble kem, ban ngày | **11** — toàn bộ cap |

Dark thắng 54–11 nên vẫn là default. Nhưng 11 cap phải được xử lý chứ không bỏ qua. Ngoài ra ảnh ở **vị trí 05 của nhiều SKU là ảnh lifestyle ngoài trời ban ngày**, cũng nền sáng — nên bài toán rộng hơn 11 cap, và cơ chế xử lý bên dưới phải áp cho **mọi** vị trí ảnh, không chỉ ảnh chính.

### Xử lý ảnh nền sáng — ở lớp card, không đổi scheme

Ảnh cap có nền marble `~#F0E8DC`. Đặt vào card `surface #14120E` có padding sẽ thành ô trắng nổi giữa nền đen. Ba thay đổi khử hoàn toàn:

1. **Ảnh full-bleed** — tràn kín card, không padding, không để `surface` lộ ra. Ảnh nền sáng khi đó đọc như *cửa sổ*, không phải *miếng dán*.
2. **Viền `1px #2A251C` + bo góc nhỏ** — khung hợp thức hóa khác biệt giữa các ảnh.
3. **Scrim gradient đáy ảnh** — `transparent → #0B0A08`, khoảng 35% chiều cao. Tên sản phẩm và giá đặt trên scrim, đọc được trên **cả** ảnh sáng lẫn tối.

Một cơ chế giải quyết cả hai trường hợp, không rẽ nhánh theo product type.

### Quy tắc màu đội — giữ nguyên, quan trọng hơn trước

Catalog mới có **29 đội**. Nếu để màu đội điều khiển CTA, site sẽ có 29 màu nút và không còn brand nào cả.

> **Vàng `#C9A227` là màu brand** — nav, mọi nút, logo, footer, chip đang chọn.
> **Màu đội chỉ sống bên trong thẻ sản phẩm và PDP** — gạch chân tên, viền badge, chấm màu. **Không bao giờ chạm CTA toàn cục.**

**Chip / facet đang chọn:** nền `#C9A227`, chữ `#100E0A`. Chip thường: nền trong suốt, viền `#2A251C`, chữ `#A29684`. Số đếm dùng `muted`.

## 6. Mục 9 — Typography

**Giữ nguyên** `Cormorant Garamond 600` (`/fonts/heading.woff2`) + `Inter 400/500` (`/fonts/body.woff2`).

Lý do chọn serif vẫn đứng vững sau khi kiểm lại ảnh mới — chữ khắc trên sản phẩm vẫn là serif in hoa: `ATLANTA BRAVES` trên tumbler, `COWBOYS` + `EST 1960` trên backpack, `EST. 1946` trên shoes. Lý do phụ chưa mất: đối thủ vẫn dùng Oswald / Bebas / Montserrat.

- Cormorant weight **600**, không phải 400.
- Nhãn mục: in hoa + `letter-spacing: 0.08em`. H1: chữ thường.
- **Chỉ dùng Cormorant cho h1/h2, blockquote và wordmark.**
- **Bổ sung cho catalog 4 dòng:** nhãn product type (`TUMBLERS`, `CAPS`, `BACKPACKS`, `SHOES`) dùng `Inter 500` in hoa `letter-spacing: 0.08em`. Bốn nhãn này lặp trên mọi trang; Cormorant ở cỡ nhỏ sẽ mất nét.
- Phương án thay thế nếu Cormorant vẫn mảnh sau khi render thật: `Bodoni Moda`.

## 7. Mục 7 — Brand Assets

Giữ nguyên spec cũ cho logo wordmark, favicon, apple-touch-icon:

- **Logo** (`/logo.svg`): wordmark `GOLDBOURNE` — Cormorant Garamond 600, in hoa, `letter-spacing: 0.08em`, màu `#C9A227`; dòng `& CO.` cỡ nhỏ bên dưới. SVG một path chữ, không gradient, không filigree.
- **Favicon** (`/favicon.svg`): chữ `G` trong khiên viền mảnh, đọc được ở 16px.
- **Apple Touch Icon** (`/apple-touch-icon.png`): sinh từ favicon, nền `#0B0A08`.

**Hai thứ phải đổi:**

**1. Logo alt text.** Cũ ghi `Goldbourne & Co. — Gilded 40oz Tumblers`, nay sai với 22/65 SKU.
→ `Goldbourne & Co. — Gilded Editions`

**2. OG image.** Ảnh nguồn cũ `products/images/black-pumpkin-crown-edition/tumbler-hero.webp` **không tồn tại** trong bộ 324 ảnh mới.

### Ràng buộc kho ảnh hero/og

Quyết định #3 (mặt tiền sạch) làm co hẹp kho ảnh hero/og xuống còn **6 SKU**. Toàn bộ 11 cap, 8 backpack, 3 shoes và 37/43 tumbler mang logo đội rõ trong ảnh. Nhóm duy nhất sạch là **6 tumbler Halloween-General**:

`Lunar Ornament` · `Grace in Shadows` · `Beauty Spins In Darkness` · `Beauty In The End` · `Coiled Ornament` · `Blood, Beauty, Forever`

Sáu SKU đó là hàng Halloween — sau 09/10 chúng hết mùa.

**Giải pháp:**

- **`og.jpg` (1376×768):** nguồn `products/40oz Tumbler/Halloween/Halloween-General/TUM-20260923-XI-001/01.webp` (*Lunar Ornament* — tím/vàng, nến, cửa sổ vòm). Nền tối ấm, wordmark vàng, tagline. Sạch IP tuyệt đối.
- **Hero year-round:** **macro crop** — cận cảnh chi tiết vàng chạm nổi từ cap/backpack/shoes (filigree, viền laurel, khóa kéo vàng, vân da cá sấu), crop chặt để không lộ logo đội và không lộ biển `EST.` Ảnh brand thật, lấy từ 324 file đang có, an toàn IP, nói đúng định vị "dát vàng" mà không cần sản phẩm nào đứng làm đại diện.
- **Hero mùa vụ:** dùng ảnh `01` của SKU trong mùa đang mở, chọn từ nhóm không gắn đội khi có thể.

## 8. Mục 14 — Hệ thống copy

### 8.1 Bảng map mới

Bảng map cũ đã chết: `products.json` với 6 trường `tagline` / `lore` / `quote` / `facts` / `accent` / `captions` — **không trường nào tồn tại trong CSV mới**. Nguồn copy giờ là `Body (HTML)` cấu trúc H3, và **tên H3 khác nhau theo product type**:

| Slot PDP | Tumbler 43 | Cap 11 | Backpack 8 | Shoes 3 | Phủ | Kiểu chữ |
|---|---|---|---|---|---|---|
| Hook mở đầu | `<p>` đầu | `<p>` đầu | `<p>` đầu | `<p>` đầu | 65/65 | Inter 400, `fg` |
| Câu chuyện thiết kế | `Design Story` | `Design Story` | `Design Story` | `Design Story` | **65/65** | Inter 400, `fg` |
| Dùng thế nào | `Use & Experience` | `Wear & Styling` | `Carry & Styling` | `Wear & Styling` | 65/65 | Inter 400, `fg` |
| Kích thước | `Size & Capacity` | `Size & Fit` | `Size & Dimensions` | `Size Guide` | 65/65 | Inter 400, `muted` |
| Thông số | — | `Product Details` | `Product Details` | `Product Details` | 22/65 | Inter 400, bullet `accent` |
| Bảo quản | — | `Care` | `Care` | `Care` | 22/65 | Inter 400, `muted` |

**Theme phải map 4 tên H3 khác nhau vào cùng một slot. Không hardcode theo tên H3.**

### 8.2 Gap chặn launch — 43 tumbler thiếu thông số

Toàn bộ mục `Size & Capacity` của tumbler là đúng một câu: `Available capacity: 40 oz.`

Không có SUS 304, không giữ nhiệt 3–4h, không kích thước 9.8in × 3.9in, không nắp 2-in-1, không quai cầm, không hướng dẫn rửa. Khối *"What you're actually holding"* ở mục 14 form cũ **không có dữ liệu để chạy**.

Đây cũng là bất đối xứng ngược: cap $39.95 có đủ `Product Details` + `Care`, tumbler $49.95 thì không.

→ **Phải bổ sung `Product Details` + `Care` cho 43 tumbler trước khi mở bán.** Việc content, không phải branding, nhưng chặn launch.

### 8.3 Trang chủ — 7 khối

1. **Announcement** (Parchment) — 2 tin luân phiên ở §4
2. **Header** — wordmark vàng · Shop · Search · Cart
3. **Hero** — ảnh theo §7. H1 = `Gilded on every side.` Subhead gánh từ khoá = `Gold-relief tumblers, caps, backpacks and shoes, released in Editions.` CTA dẫn vào product type đang đẩy
4. **Thanh product type** — 4 link theo §4
5. **`What you're actually holding`** — khối thông số dùng chung. **Chỉ render được sau khi lấp gap §8.2**
6. **The Pair** — đóng khung như cách một Edition được phát hành, không phải như voucher giảm giá. Vẫn chỉ áp cho 43 tumbler
7. **Footer**

### 8.4 Alt text — sửa 324/324 dòng trùng lặp

Hiện trạng: cả 5 ảnh của mỗi SKU dùng chung một alt và đều kết thúc `- main`:

```
Vegas Noir - LV Shield in Black and Gold - main   (ảnh 1)
Vegas Noir - LV Shield in Black and Gold - main   (ảnh 5)
```

Hại SEO ảnh — Pinterest và Google Images là kênh mạnh nhất với mặt hàng này — và hỏng accessibility.

→ Đổi hậu tố theo vị trí: `- front` · `- detail` · `- back` · `- scale` · `- in use`

→ **Giữ nguyên một tính chất quan trọng:** alt đang lấy từ `Title` (viết tắt `LV`, `DAL`, `PHI`) chứ không phải `SEO Title` (tên đội đầy đủ). Đang đúng phía ranh giới IP. Sửa alt không được làm mất điều đó.

### 8.5 Bộ chặn copy — phân tầng

Thay bộ cấm tuyệt đối của form cũ bằng ranh giới theo lớp (quyết định #3):

| Lớp | Tên đội / tên giải |
|---|---|
| Domain · logo · wordmark · tên brand | **CẤM** |
| Nav · tên collection · URL collection | **CẤM** |
| Tagline · og image · og description | **CẤM** |
| `SEO Title` · `SEO Description` | **CHO PHÉP** |
| `Body (HTML)` | **CHO PHÉP** |
| Product `Title` hiển thị mặt tiền | **viết tắt** — `DAL`, `PHI`, `KC`, `SF` |
| `Image Alt Text` | **viết tắt** |

Cấm ở **mọi** lớp, không ngoại lệ:

```
official · officially licensed · licensed · authentic · genuine
<tên cầu thủ bất kỳ>
amazing · must-have · perfect gift for any fan
```

Bốn cụm cuối không phải vấn đề pháp lý mà là vấn đề giọng — chúng phá đúng cái giọng catalogue mà `Body (HTML)` đang giữ rất tốt.

### 8.6 Rủi ro cũ đã tự biến mất

Rủi ro "ảnh hộp quà" ở mục 14 form cũ (`tumbler-box.webp` nằm trong gallery của cả 72 SKU nhưng không giao kèm) **không còn**. Bộ ảnh mới không có file đó; cả 5 ảnh mỗi SKU đều là sản phẩm hoặc lifestyle. Gỡ khỏi checklist.

## 9. Mục 5 & 11 — Giá, vận chuyển, SEO

### 9.1 Bảng giá

| Dòng | Giá | Variant | Compare-at |
|---|---|---|---|
| Cap | $39.95 | không | $44.95 (−11%) |
| Tumbler | $49.95 | không | $59.95 (−17%) |
| Backpack | $49.95 / $59.95 / $69.95 | Size S / M / L | +$10 mỗi bậc (−13~17%) |
| Shoes | $89.95 | Size, 13 lựa chọn | $109.95 (−18%) |

### 9.2 Freeship $75 — giữ nguyên

Logic cũ còn mạnh hơn trước:
- Không món lẻ nào đạt ngưỡng (cao nhất $69.95)
- **Hai món bất kỳ đều đạt** — rẻ nhất Cap $39.95 + Tumbler $49.95 = $89.90
- Rò rỉ duy nhất: Shoes $89.95 tự do vượt ngưỡng, nhưng chỉ 3 SKU

Nếu đổi số này, cân nhắc giữ nguyên tính chất đó.

### 9.3 Compare-at price — rủi ro đã chấp nhận

**Hiện trạng:** 117/117 variant rows có `Compare At Price`. Toàn bộ catalog ở trạng thái **giảm giá vĩnh viễn**, mức 11–18%.

**Rủi ro đã được nêu và chủ store quyết định giữ nguyên:**

1. **Mâu thuẫn định vị.** Không nhà kim hoàn nào gạch giá toàn bộ catalogue quanh năm. Sale vĩnh viễn 100% đọc như POD dropship — chính là cái mà định vị "Edition / vật gia bảo" đang cố tách ra.
2. **Rủi ro tuân thủ.** FTC yêu cầu giá compare-at phải là giá **đã thực sự bán** trong thời gian hợp lý gần đây. Sale vĩnh viễn toàn catalog là dấu hiệu fictitious pricing. Google Merchant Center và Meta Ads đều có policy về điều này, và đây là loại vấn đề làm treo tài khoản chứ không chỉ mất một chiến dịch.

**Quyết định:** giữ nguyên. Ghi lại ở đây như một đánh đổi có ý thức, không phải sơ sót.

**Nếu sau này muốn gỡ:** hai lối ra sạch là (a) xóa compare-at, giữ nguyên giá bán; hoặc (b) chuyển thành đợt sale có thời hạn thật, gắn vào mùa — ví dụ chỉ áp cho 33 SKU Halloween tới 09/10, hết đợt thì gỡ.

### 9.4 Catalog & SEO

- **`catalog.maxProducts`**: `3000`
- **`collection.perPage`**: `24` — Tumblers 43 SKU = 2 trang; ba dòng còn lại 1 trang
- **SEO Title Template**: `%s | Goldbourne & Co.`
- **SEO Default Title**: `Goldbourne & Co. — Gilded Editions in Tumblers, Caps, Backpacks and Shoes`
- **SEO Default Description**: `Gold-relief tumblers, caps, backpacks and shoes, released in named Editions. Crest, seasonal and gothic ornament. Gilded on every side.`
- **SEO OG Image**: `/og.jpg`
- **`SEO Description` của sản phẩm**: hiện **trống 65/65**. Phải sinh trước khi mở bán — xem §11

## 10. Những gì giữ nguyên không đổi

- Mục 1 — định danh site, `site.description` cập nhật theo §3
- Mục 2 — Shopify Storefront API (vẫn `[FAKE]`)
- Mục 3 — thông tin doanh nghiệp (vẫn `[FAKE]`)
- Mục 4 — hỗ trợ khách hàng (vẫn `[FAKE]`)
- Mục 6 — mạng xã hội (vẫn `[FAKE]`). Ghi chú cũ vẫn đúng: Pinterest đáng mở nhất, 324 ảnh render là đúng thứ Pinterest đẩy
- Mục 12 — routes và 8 trang policy

## 11. Gap chặn launch

Bốn việc phải xong trước khi mở bán, không liên quan tới `[FAKE]` data:

| # | Việc | Phạm vi |
|---|---|---|
| 1 | Bổ sung `Product Details` + `Care` cho tumbler | 43 SKU |
| 2 | Sinh `SEO Description` | 65 SKU (hiện trống 100%) |
| 3 | Sửa `Image Alt Text` trùng lặp theo §8.4 | 324 dòng |
| 4 | Đổi `Vendor` từ `Taveris` sang `Goldbourne & Co.`, hoặc tắt hiển thị vendor trong theme | 65 SKU |

Ghi chú cho #4: nhiều theme Shopify render `Vendor` trên PDP — khách vào Goldbourne sẽ đọc thấy "Taveris".

Ngoài ra, không chặn launch nhưng nên xử lý: 324 ảnh đang trỏ `all-products.taveris.co`. Khách xem URL ảnh sẽ thấy domain lạ. Nên đưa lên CDN của Goldbourne hoặc để Shopify host.

## 12. Checklist trước khi mở bán

- [ ] Check `goldbourne.com` trống → khóa domain → **rồi mới** sinh logo/favicon/og/email
- [ ] Thay toàn bộ `[FAKE]` ở mục 2, 3, 4, 5, 6 của form
- [ ] Lấp 4 gap ở §11
- [ ] Sinh `og.jpg` từ `TUM-20260923-XI-001`, xác nhận không lộ logo đội
- [ ] Sinh hero year-round bằng macro crop, xác nhận không lộ logo đội và không lộ biển `EST.`
- [ ] Tính lại 2 mốc cutoff nếu đổi số shipping — phải sinh từ công thức, không hardcode
- [ ] Xác nhận announcement bar tin 1 tự ẩn sau 09/10/2026
- [ ] Xác nhận urgency không hiện trên 22 SKU year-round
- [ ] Chạy bộ chặn copy §8.5 trên toàn site, gồm cả `alt`, `meta`, `title`, tên file
- [ ] Xác nhận card sản phẩm dùng full-bleed + scrim, kiểm tra riêng 11 cap nền sáng và ảnh lifestyle vị trí 05
- [ ] Xác nhận facet league **không** render ở Caps / Backpacks / Shoes
- [ ] Xác nhận `The Pair` là 2 tumbler giống hệt hay 2 tumbler bất kỳ
- [ ] Kiểm tra tương phản trên máy thật: `accent` trên `bg` (8.18:1) và Parchment `accent` trên `bg` (5.37:1)

## 13. Ghi chú ngoài scope

Đã phân tích nhưng không làm trong đợt này:

1. **Shoes chỉ có 3 SKU** trong khi chiếm một mục nav cấp 1. Nav item dẫn tới 3 sản phẩm trông mỏng. Cân nhắc bổ sung SKU hoặc gộp tạm vào một trang chung cho tới khi đủ dày.
2. **8 đội cross-sell được** (31 SKU, 48% catalog), trong đó 49ers / Eagles / Steelers có đủ 4 dòng. Đây là cơ hội bundle "bộ đủ" nhưng đã bị loại khỏi đợt này cùng với phương án team-first. Nếu mở sau, phải làm ở lớp module bán hàng — **không** làm ở lớp điều hướng, vì nav theo đội phá quyết định #3.
3. **Trục mùa vẫn bị chôn trong trường `Collection`.** `Tumbler NBA` thực chất toàn Halloween; `Tumbler MLB` thực chất toàn Christmas. Hai hàng facet ở §4 gỡ được vấn đề ở lớp hiển thị, nhưng dữ liệu gốc vẫn trộn trục. Tách hẳn trường `season` sẽ sạch hơn về lâu dài.
