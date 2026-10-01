# Phiếu thông tin khởi tạo Store: Goldbourne & Co.

> Store bán dòng tumbler 40oz dát vàng (72 SKU) trong repo `astro-theme-cup`.
>
> **Cách đọc file này:**
> - 🔴 **`[FAKE]`** — dữ liệu giả đang dùng tạm để build chạy được. **Phải thay hết trước khi mở bán.** Tìm nhanh bằng cách grep chữ `[FAKE]`.
> - ✅ **`[ĐÃ CHỐT]`** — quyết định branding đã thống nhất, build theo đúng cái này.
> - ⚪ **`[NGOÀI SCOPE]`** — khuyến nghị đã ghi lại nhưng chưa làm, chờ bạn quyết.
>
> **Scope đợt này:** chỉ làm lớp branding. Không sửa `products.json`, không đổi cấu trúc 7 collection, không đổi URL.

---

## 1. Thông tin định danh Site ✅ `[ĐÃ CHỐT]`

- **Mã định danh site (`site-slug`)**: `goldbourne`
- **Tên hiển thị (`site.name`)**: `Goldbourne & Co.`
- **URL chính thức (`site.url`)**: `https://goldbourne.com` 🔴 `[FAKE]` — **chưa check domain trống**
  - Thứ tự dự phòng nếu `.com` đã có chủ: `goldbourne.co` → `goldbourneco.com` → `shopgoldbourne.com`
  - ⚠️ Khóa domain **trước khi** sinh `logo.svg` / `favicon.svg` / `og.jpg` / email — đổi domain sau là phải làm lại cả bộ asset lẫn email
- **Ngôn ngữ (`site.locale`)**: `en-US`
- **Đơn vị tiền tệ (`site.currency`)**: `USD`
- **Mô tả ngắn (`site.description`)**: `Gold-relief 40oz stainless tumblers in crest, seasonal and character Editions. No plain side to turn to the wall.`

---

## 2. Kết nối Shopify Storefront API 🔴 `[FAKE]`

> [!IMPORTANT]
> - `SHOPIFY_STORE_DOMAIN` bắt buộc là handle `.myshopify.com`, **không** dùng custom domain, **không** có `https://`.
> - `SHOPIFY_STOREFRONT_TOKEN` phải là **Storefront API access token (Public)**, lấy ở *Settings → Apps and sales channels → Develop apps → Storefront API credentials*. Tuyệt đối không dùng Admin API token.

- **Shopify Domain (`SHOPIFY_STORE_DOMAIN`)**: `goldbourne-demo.myshopify.com` 🔴 `[FAKE]`
- **Storefront Access Token (`SHOPIFY_STOREFRONT_TOKEN`)**: `00000000000000000000000000000000` 🔴 `[FAKE]`
- **API Version**: `2026-07`

---

## 3. Thông tin Doanh nghiệp & Cửa hàng 🔴 `[FAKE]`

> Dữ liệu này đổ vào Legal Notice, Terms of Service, Privacy Policy, Contact Information và Footer. **Stripe / PayPal / Meta Ads đều review mục này** — dữ liệu giả sẽ bị từ chối.

- **Tên pháp lý (`business.legalName`)**: `Goldbourne & Co. LLC` 🔴 `[FAKE]`
- **Tên thương mại (`business.tradeName`)**: `Goldbourne & Co.` ✅
- **Điện thoại doanh nghiệp (`business.phone`)**: `+1 (555) 013-0199` 🔴 `[FAKE]` — đây là dải số hư cấu được chuẩn hóa (555-01XX), an toàn để build nhưng vô dụng khi lên sóng
- **Email quản trị (`business.email`)**: `hello@goldbourne.com` 🔴 `[FAKE]`
- **Địa chỉ trụ sở (`business.address`)** 🔴 `[FAKE]` toàn bộ:
  - `street`: `1209 Orange Street, Suite 200`
  - `city`: `Wilmington`
  - `province`: `DE`
  - `postalCode`: `19801`
  - `country`: `United States`
- **Mã số thuế (`business.taxId`)**: `EIN-00-0000000` 🔴 `[FAKE]` — hoặc bỏ trống nếu chưa có

---

## 4. Hỗ trợ khách hàng & Trang Contact 🔴 `[FAKE]`

- **Email hỗ trợ (`contact.email`)**: `support@goldbourne.com` 🔴 `[FAKE]`
- **Giờ hỗ trợ (`contact.hours`)**: `9:00am – 5:00pm EST, Monday–Friday, excluding public holidays.`
- **Thời gian phản hồi (`contact.typicalReplyTime`)**: `within 24 business hours`
- **Hotline (`contact.phone`)**: `+1 (555) 013-0199` 🔴 `[FAKE]`
- **Đường dẫn hoàn trả (`contact.returnsPolicyUrl`)**: `/policies/refund-policy`

---

## 5. Chính sách Vận chuyển & Giao hàng 🔴 `[FAKE]` (nhưng đã tính toán theo)

- **Handling (`shipping.handlingTime`)**: `1–3 business days` 🔴 `[FAKE]`
- **Transit (`shipping.transitTime`)**: `6–12 business days` 🔴 `[FAKE]`
- **Tổng (`shipping.totalDeliveryTime`)**: `7–15 business days` 🔴 `[FAKE]`
- **Cước tiêu chuẩn (`shipping.standardRate`)**: `$5.95` 🔴 `[FAKE]`
- **Ngưỡng freeship (`shipping.freeShippingThreshold`)**: `75` 🔴 `[FAKE]`
- **Khu vực (`shipping.destinations`)**: `United States only (including Alaska, Hawaii, and US territories)`

### Vì sao đặt ngưỡng freeship là $75

Không phải số tròn cho đẹp. Một cốc lẻ **$49.95 không đạt ngưỡng**, nhưng **The Pair $89.95 thì đạt**. Ngưỡng nằm đúng vào khe giữa hai mức giá, nên nó tự đẩy khách lên bundle mà không cần giảm giá thêm đồng nào. Nếu bạn đổi số này, cân nhắc giữ nguyên tính chất đó.

### Mốc cutoff đặt hàng — tính từ chính bộ số ở trên

Worst case 15 business days, chừa 1 ngày đệm trước ngày lễ:

| Mùa | Ngày lễ | **Cutoff** | Còn lại tính từ 29/09/2026 |
|---|---|---|---|
| Halloween | Thứ Bảy 31/10/2026 | **Thứ Sáu 09/10/2026** | 10 ngày |
| Christmas | Thứ Sáu 25/12/2026 | **Thứ Năm 03/12/2026** | 65 ngày |

> ⚠️ **Hai ngày này là hệ quả trực tiếp của mục 5.** Sửa handling/transit thì phải tính lại cutoff. Nên implement bằng công thức đọc từ config, đừng hardcode ngày.
>
> Đây là cơ chế urgency duy nhất được dùng trên site: **hạn giao hàng, không phải hạn tồn kho.** Không bao giờ hiển thị "chỉ còn N cái" — số đó không có thật và là rủi ro với cả khách lẫn payment processor.

---

## 6. Kênh Mạng xã hội 🔴 `[FAKE]`

- **Instagram**: `https://instagram.com/goldbourneco` 🔴 `[FAKE]`
- **Facebook**: `https://facebook.com/goldbourneco` 🔴 `[FAKE]`
- **TikTok**: `https://tiktok.com/@goldbourneco` 🔴 `[FAKE]`
- **Pinterest**: `https://pinterest.com/goldbourneco` 🔴 `[FAKE]`
- **Twitter / X**: *(bỏ trống — không tạo nếu không định dùng)*
- **YouTube**: *(bỏ trống)*

> Link mạng xã hội chết còn hại hơn không có link. Chỉ giữ lại kênh nào bạn thật sự mở. Pinterest đáng mở nhất với mặt hàng này — 72 tấm ảnh render nền tối là đúng thứ Pinterest đẩy.

---

## 7. Nhận diện thương hiệu (Brand Assets) ✅ `[ĐÃ CHỐT]`

- **Logo** (`/logo.svg`): wordmark `GOLDBOURNE` — Cormorant Garamond 600, in hoa, `letter-spacing: 0.08em`, màu `#C9A227`; dòng `& CO.` cỡ nhỏ bên dưới. SVG một path chữ, **không gradient, không filigree** (filigree đã nằm trên sản phẩm rồi, lặp lại ở logo là thừa).
- **Logo alt text**: `Goldbourne & Co. — Gilded 40oz Tumblers`
- **Favicon** (`/favicon.svg`): chữ `G` trong khiên viền mảnh. Phải đọc được ở **16px** → crest chỉ là bóng đơn giản.
- **OG Image** (`/og.jpg`, 1376×768): nền tối ấm, một cốc hero, wordmark vàng, tagline.
  - Ảnh nguồn đề xuất: `products/images/black-pumpkin-crown-edition/tumbler-hero.webp` — đang `listed`, và là tấm mạnh nhất trong bộ 72.
- **Apple Touch Icon** (`/apple-touch-icon.png`): sinh từ favicon, nền `#0B0A08`.

---

## 8. Bảng màu ✅ `[ĐÃ CHỐT]`

> ⚠️ **Default Scheme là TỐI**, ngược với mặc định của template. Lý do: cả 72 ảnh sản phẩm đều nền tối + vàng kim + ánh sáng ấm. Site nền sáng làm ảnh trông như bị dán đè lên trang.

### Default Scheme — Gilded Dark

| token | hex | ghi chú |
|---|---|---|
| `bg` | `#0B0A08` | đen ngả ấm, không ngả xanh |
| `surface` | `#14120E` | nền card |
| `fg` | `#F5F0E6` | trắng ngà — trắng tinh cạnh vàng bị lạnh |
| `muted` | `#A29684` | |
| `accent` | `#C9A227` | vàng brand — **8.18:1** trên `bg`, đạt WCAG AAA |
| `accentFg` | `#100E0A` | chữ trên nút vàng — cùng 8.18:1 |
| `border` | `#2A251C` | |

### Inverse Scheme — Parchment
*(announcement bar, footer, 8 trang policy, email transaction)*

| token | hex | ghi chú |
|---|---|---|
| `bg` | `#F6F1E7` | |
| `surface` | `#FFFFFF` | |
| `fg` | `#14120E` | |
| `muted` | `#6B6151` | |
| `accent` | `#7A5F18` | vàng **phải tối đi** trên nền sáng — `#C9A227` chỉ đạt 2.1:1, không dùng được. Số này đạt **5.37:1** |
| `accentFg` | `#FFFFFF` | 6.05:1 trên `accent` |
| `border` | `#DED5C4` | |

### Quy tắc dùng màu — quan trọng nhất

Mỗi SKU đã có sẵn trường `accent` là màu đội (Alabama `#9E1B32`, Braves `#CE1141`, Panther `#CA8EF7`…). Nếu để màu đội điều khiển CTA, site sẽ có 72 màu nút khác nhau và không còn brand nào cả.

> **Vàng `#C9A227` là màu của brand** — nav, mọi nút, logo, footer, chip đang chọn.
> **Màu đội chỉ sống bên trong thẻ sản phẩm và PDP** — gạch chân tên, viền badge, chấm màu. **Không bao giờ chạm CTA toàn cục.**

**Thanh chip collection** (7 chip hiện có): chip đang chọn đổi từ xanh `#3b82f6` → nền `#C9A227` chữ `#100E0A`. Chip thường: nền trong suốt, viền `#2A251C`, chữ `#A29684`. Số đếm dùng `muted`.

---

## 9. Typography ✅ `[ĐÃ CHỐT]`

- **Heading — `Cormorant Garamond` 600** (`/fonts/heading.woff2`)
  - Dùng weight **600**, không phải 400 — Cormorant 400 mảnh quá, mất nét trên nền đen.
  - Nhãn mục: in hoa + `letter-spacing: 0.08em`. H1: chữ thường.
  - **Chỉ dùng cho h1/h2, blockquote và wordmark.** Không dùng cho nav, nút, body.
- **Body — `Inter` 400/500** (`/fonts/body.woff2`) — giữ đúng stack đang dùng ở `dragocase`.
- **Phương án thay thế** nếu Cormorant vẫn mảnh sau khi render thật: `Bodoni Moda` — catalogue trang sức hơn nữa, nhưng kén hơn.

**Lý do chọn serif:** chữ khắc trên thân cốc vốn là serif in hoa giãn chữ tương phản cao (xem plate `CRIMSON TIDE`, `HALLOWEEN · LIMITED EDITION`). Ngoài ra gần như mọi store tumbler đối thủ đều dùng Oswald / Bebas / Montserrat — chọn serif là cách tách khỏi đám đông mà không tốn thêm chi phí nào.

---

## 10. Menu & Điều hướng ✅ `[ĐÃ CHỐT — giữ nguyên hiện trạng]`

**Không đổi cấu trúc collection.** Giữ nguyên 7 chip đang chạy, khớp đúng trường `league`:

`All 72` · `Christmas 15` · `Doomsday 5` · `Halloween 8` · `MLB 9` · `MLS 11` · `NCAA 7` · `NFL 17`

- **Header**: wordmark (trái) · Shop · Search · Cart. Tên giải **không** xuất hiện ở nav cấp 1.
- **Footer**:
  - *Shop*: 7 collection như trên
  - *Customer Support & Policies*: Contact Us · Shipping Policy · Refund Policy · Terms of Service · Privacy Policy · Legal Notice · Contact Information · Your Privacy Choices
  - *Business Info*: đổ tự động từ `business.*` — legal name, địa chỉ, phone, email
  - *Follow Us*: icon từ `social.*`, chỉ render kênh có giá trị

---

## 11. Cấu hình Catalog & SEO ✅ `[ĐÃ CHỐT]`

- **`catalog.maxProducts`**: `3000`
- **`collection.perPage`**: `24` *(72 SKU = 3 trang cho `All`)*
- **SEO Title Template**: `%s | Goldbourne & Co.`
- **SEO Default Title**: `Goldbourne & Co. — Gilded 40oz Tumblers, Released in Editions`
- **SEO Default Description**: `Gold-relief 40oz stainless tumblers in crest, seasonal and character Editions. Double-wall vacuum, 2-in-1 lid, ergonomic handle. No plain side to turn to the wall.`
- **SEO OG Image**: `/og.jpg`
- **Announcement Bar** — nền Parchment, 2 tin luân phiên:
  1. `Order by Oct 9 to arrive before Halloween.` *(ngày sinh từ công thức ở mục 5, tự ẩn khi qua hạn)*
  2. `The Pair — two Editions, $89.95.`

---

## 12. Cấu hình Routes bổ sung *(mặc định, không đổi)*

- [x] `/contact` · [x] `/search` · [x] `/cart` · [x] `/collections`
- [x] Bộ 8 trang policy: `shipping-policy`, `refund-policy`, `terms-of-service`, `privacy-policy`, `legal-notice`, `contact-information`, `your-privacy-choices`, `contact`

---

## 13. Nền tảng thương hiệu ✅ `[ĐÃ CHỐT]`

**Định vị.** Goldbourne & Co. dát vàng thứ đồ uống tầm thường nhất thành vật gia bảo, và phát hành chúng theo từng **Edition** có tên — không bán hàng tồn chung chung. *(Mọi SKU trong catalog vốn đã tên là "… Edition".)*

**Lời hứa.** Khách không mua cái cốc giữ nhiệt 3–4 tiếng — cái đó ai cũng có. Họ mua **một chiếc cốc có mặt tiền**. Mọi tumbler trơn đều có một mặt sau để quay vào tường. Cái này thì không.

- **Tagline chính**: `No plain side to turn to the wall.`
  *(Câu này đã nằm sẵn trong cả 72 record `lore` — không phải nghĩ mới, chỉ là kéo nó lên đúng vị trí.)*
- **Descriptor** (SEO / og): `Gilded 40oz tumblers, released in Editions.`

**Giọng.** Nhãn bảo tàng / catalogue đấu giá — **không** phải giọng quảng cáo. Câu ngắn, danh từ cụ thể, số đo thật, không tính từ rỗng. Giọng này **đã tồn tại sẵn** trong `lore` và `facts` của bạn (*"The script letter in gold relief on a jewelled ground, centred on the front"*). Việc của brand không phải sáng tạo giọng mới mà là đừng phá cái đang có.

**Mùa không đóng.** Hết mùa, collection rời khỏi hero và announcement bar nhưng **vẫn mua được, giữ nguyên URL và index**. Không mất SEO, không phải bịa lý do đóng.

---

## 14. Hệ thống copy ✅ `[ĐÃ CHỐT]`

### Không cần viết copy mới — chỉ cần gán đúng chỗ

`products.json` đã có sẵn 4 trường copy cho cả 72 SKU:

| trường có sẵn | vị trí trên PDP | kiểu chữ |
|---|---|---|
| `tagline` | ngay dưới tên sản phẩm | Inter 500, `muted` |
| `lore` | đoạn mô tả mở đầu | Inter 400, `fg` |
| `quote` | block trích dẫn riêng | Cormorant 600, `accent` |
| `facts` | danh sách `The Edition` | Inter 400, bullet `accent` |
| `accent` | chấm màu + gạch chân tên | chỉ trong thẻ — **không ra CTA** |
| `captions` | **đè trên ảnh `tumbler-box`** | Inter 400, nền mờ |

### Trang chủ — 7 khối

1. **Announcement** (Parchment) — 2 tin luân phiên ở mục 11
2. **Header** — wordmark vàng · Shop · Search · Cart
3. **Hero** — ảnh hero của mùa đang mở. H1 = `No plain side to turn to the wall.` Subhead gánh từ khoá = `Gold-relief 40oz stainless tumblers, released in Editions.` CTA dẫn vào chip mùa đang mở.
4. **Thanh chip** — giữ nguyên 7 chip, chỉ đổi màu chip đang chọn
5. **`What you're actually holding`** — khối thông số dùng chung, trích từ `facts`: 40oz SUS 304 · giữ nhiệt 3–4h · 9.8in × 3.9in · nắp 2-in-1 · quai cầm · rửa tay. **Đặt ngay sau chip** — khách trả $50 cho một cái cốc sẽ hỏi câu này đầu tiên.
6. **The Pair** — đóng khung như cách một Edition được phát hành, **không** phải như voucher giảm giá
7. **Footer**

### Bộ chặn copy — chạy trước khi publish

Không được xuất hiện ở bất kỳ đâu, kể cả `alt`, `meta`, `title`, tên file:

```
official · officially licensed · licensed · authentic · genuine
NFL · MLB · MLS · NCAA        (trong nav, logo, domain, tagline, og)
<tên cầu thủ bất kỳ>
amazing · must-have · perfect gift for any fan
```

Bốn chữ cuối không phải vấn đề pháp lý mà là vấn đề giọng — chúng phá đúng cái giọng catalogue mà `lore` đang giữ rất tốt.

### Rủi ro cần xử: ảnh hộp quà

`tumbler-box.webp` nằm trong gallery của **cả 72 SKU**, và `captions` đã ghi rõ hộp quà *"does not come with every order"*. **Ảnh hộp quà trong gallery mà không giao là mồi chargeback.** Caption đó phải hiện **đè trên ảnh**, không được nhét vào accordion — hoặc bỏ hẳn ảnh hộp khỏi gallery mặc định.

---

## 15. Ghi chú ngoài scope ⚪ `[NGOÀI SCOPE — chờ bạn quyết]`

Ba việc đã phân tích nhưng **không làm trong đợt này**:

1. **Đồng bộ tên nhánh Doomsday.** `slug` đã đổi sang codename (`sentinel-`, `trickster-`, `panther-`) nhưng trường `name` thì chưa — hiện vẫn ghi thẳng `Captain America — Immortal Liberty Edition`, `Loki — Gilded Mischief Edition`, `Black Panther — Amethyst Edition`. Ai đó đã ra quyết định đổi tên nhưng bỏ dở nửa chừng. Hai SKU còn lại (`The Thunderer`, `Doom`) đã đúng. **Đây là mục rủi ro cao nhất trong ba mục.**

2. **Thứ tự chip đang sort theo alphabet** → Christmas đứng đầu, NFL (17 SKU, nhóm lớn nhất) bị đẩy xuống cuối. Thứ tự này do máy sắp, không phải do bán hàng sắp. Đề xuất: mùa đang mở trước → rồi theo độ lớn.

3. **Trường `league` đang trộn hai trục.** Cả 15 SKU `Christmas` đều là hàng có team (Braves, Cowboys, Dodgers…). Hệ quả: **fan Dodgers vào chip `MLB` chỉ thấy 1 trong 2 cốc của đội mình** — cốc Dodgers Christmas nằm ở chip khác. Nếu sau này muốn mở, tách thành facet `team` (36 đội) + `occasion` sẽ cho phép 16 đội có ≥2 SKU có landing page long-tail riêng, và collection dày lên: Football 24, Baseball 17.

---

## 16. Checklist trước khi mở bán

- [ ] Check `goldbourne.com` trống → khóa domain → **rồi mới** sinh logo/favicon/og/email
- [ ] Thay toàn bộ 🔴 `[FAKE]` ở mục 2, 3, 4, 5, 6 *(grep `[FAKE]`)*
- [ ] Tính lại 2 mốc cutoff nếu đổi số shipping ở mục 5
- [ ] Chạy bộ chặn copy ở mục 14 trên toàn site, gồm cả `alt` và `meta`
- [ ] Xác nhận caption ảnh hộp quà hiển thị đè trên ảnh
- [ ] Xác nhận `pairPrice` là 2 cốc giống hệt hay 2 cốc bất kỳ *(chưa xác minh được từ data)*
- [ ] Kiểm tra tương phản trên máy thật: `accent` trên `bg` (8.18:1) và `accent` trên `bg` Parchment (5.37:1)
