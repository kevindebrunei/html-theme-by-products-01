# Thiết kế theme Light Minimal — Goldbourne & Co.

> **Ngày:** 01/10/2026
> **Trạng thái:** Đã chốt qua brainstorm, chờ chuyển sang implementation plan
> **Quan hệ với tài liệu cũ:**
> - `sites/goldbourne/store-init-form.md` — form khởi tạo gốc, viết cho catalog 72 SKU tumbler đơn dòng. Đã lỗi thời, chỉ còn giá trị ở mục 1–4, 6, 12.
> - `docs/superpowers/specs/2026-09-29-goldbourne-rebrand-design.md` — bản rebrand cho catalog 65 SKU / 4 dòng. **Vẫn còn hiệu lực** về catalog, giá, mùa vụ, ranh giới IP lớp chữ, và danh sách gap chặn launch.
> - Tài liệu này **không thay thế** spec 29/09. Nó định nghĩa một theme thứ hai, độc lập, chạy song song với `themes/dark-maximalism`, và bổ sung hai thứ spec 29/09 chưa có: **bảng phân loại style sản phẩm** và **hệ thị giác cho nền sáng**.

---

## 0. Vì sao viết

Spec 29/09 mô tả catalog bằng ba trục có sẵn trong dữ liệu: `type`, `league`, `season`. Ba trục đó đủ để tổ chức kho hàng nhưng không mô tả được **sản phẩm trông như thế nào** — thứ quyết định một theme phải trông ra sao.

Khi xem ảnh thật thay vì đọc trường dữ liệu, catalog tách thành bốn họ thị giác rõ rệt, và chúng không trùng với bất kỳ trục nào đang có. Tài liệu này đặt tên cho bốn họ đó, rút định vị brand từ chúng, rồi dựng hệ thị giác cho một theme **light mode, minimalism** chứa được cả bốn.

Theme mới độc lập với `themes/dark-maximalism` nhưng **gắn cùng brand Goldbourne & Co.** Hai theme, một brand.

---

## 1. Năm quyết định nền tảng

| # | Quyết định | Ghi chú |
|---|---|---|
| 1 | **Theme light-minimal phục vụ toàn bộ 65 SKU** | Không tách theme theo mùa vụ. Khung trung tính phải chứa được cả bốn họ style |
| 2 | **Cơ chế thị giác: Passepartout** | Ảnh giữ nguyên, đóng khung, lề rộng. Không crop lại 324 ảnh, không full-bleed |
| 3 | **Facet mặt tiền chuyển từ giải sang họ style** | Gỡ nốt chỗ hở IP mà spec 29/09 còn để lại ở lớp điều hướng. Chi tiết §6 |
| 4 | **Giữ brand Goldbourne & Co., đổi tagline** | Tagline mới rút từ copy có sẵn, không sáng tác. Chi tiết §4 |
| 5 | **Giữ bảng màu Parchment của brand, không lấy palette dataset** | Lý do là contrast đo được, không phải sở thích. Chi tiết §5.1 |

---

## 2. Bảng phân loại style sản phẩm

### 2.1 Bốn họ

| Họ style | SKU | Dấu hiệu nhận dạng | Phân bố |
|---|---|---|---|
| **Gothic Jewel** | 33 | Nền đen hoặc tím sẫm, filigree vàng chạm nổi, sọ đội vương miện, hoa hồng đen, đá quý màu (ruby, sapphire, amethyst), nến và vòm nhà thờ ở hậu cảnh | 33 tumbler Halloween |
| **Holiday Ornament** | 10 | Navy / đỏ / kem, nutcracker, tuyết, nơ và chuông, sân vận động trong đêm đông, filigree vàng. Trang trí Giáng sinh, **không** gothic | 10 tumbler Christmas |
| **Heritage Crest** | 19 | Kem / ivory, da cá sấu, vòng nguyệt quế vàng, crest có vương miện, biển `EST. 19xx`, ánh sáng ban ngày | 11 cap + 3 shoes + 5 backpack |
| **Gold Drip** | 3 | Đen + vàng, chữ graffiti nhỏ giọt, splatter, vương miện drip | 3 backpack: PHI, PIT, SF |

Tổng: 33 + 10 + 19 + 3 = **65**.

### 2.2 Ba tính chất của bảng này

**Nó không phải trục phân loại thứ tư.** 33 + 10 = 43 tumbler theo mùa; 19 + 3 = 22 món year-round. Họ style là bản tinh chỉnh của trục mùa vụ, không chồng lên nó. Không SKU nào nằm lưng chừng giữa hai họ.

**Nó sạch IP ở mọi lớp.** Tên bốn họ không chứa tên giải hay tên đội, nên dùng được ở nav, URL collection, tagline — những lớp mà spec 29/09 §8.5 cấm tên giải.

**Gold Drip quá mỏng để hiển thị.** Ba SKU, đều là backpack. **Quyết định: gộp vào Heritage Crest ở lớp hiển thị** (thành 22 món year-round), giữ tên `Gold Drip` làm nhãn nội bộ cho tới khi đủ dày. Ghi nhận rằng về thẩm mỹ hai nhóm này không ăn nhau — đây là đánh đổi chấp nhận vì số lượng.

### 2.3 Ngữ pháp thị giác chung

Cả bốn họ dùng chung một bộ mô-típ: **vàng chạm nổi · đá quý nạm · vương miện · vòng nguyệt quế · da cá sấu · monogram chìm · biển khắc**. Đây là ngữ pháp của một nhà mốt hoặc một hãng trang sức, áp lên đồ cổ vũ thể thao. Đó là điều phân biệt catalog này với mọi store fan gear khác, và là cơ sở của định vị ở §4.

---

## 3. Hình dạng catalog (chép từ spec 29/09 để tài liệu này tự đủ)

### 3.1 Ma trận dòng × họ style

```
                  Gothic   Holiday   Heritage   Gold     TOTAL
                   Jewel  Ornament      Crest   Drip
Tumbler               33        10          ·      ·        43
Cap                    ·         ·         11      ·        11
Backpack               ·         ·          5      3         8
Shoes                  ·         ·          3      ·         3
TOTAL                 33        10         19      3        65
```

### 3.2 Giá (xác minh lại từ `products/products.json`, 01/10/2026)

| Dòng | Giá | Variant | Compare-at |
|---|---|---|---|
| Cap | $39.95 | không | $44.95 |
| Tumbler | $49.95 | không | $59.95 |
| Backpack | $49.95 / $59.95 / $69.95 | Size S / M / L | $59.95 / $69.95 / $79.95 |
| Shoes | $89.95 | Size | $109.95 |

Ngưỡng freeship $75 và lý lẽ đằng sau nó giữ nguyên theo spec 29/09 §9.2.

### 3.3 Lịch mùa vụ

| Mùa | SKU | Ngày lễ | Cutoff | Còn lại tính từ 01/10/2026 |
|---|---|---|---|---|
| Halloween | 33 (51% catalog) | T7 31/10/2026 | **T6 09/10/2026** | **8 ngày** |
| Christmas | 10 | T6 25/12/2026 | T5 03/12/2026 | 63 ngày |

Cutoff phải sinh từ công thức đọc config (handling + transit + 1 ngày đệm), không hardcode.

### 3.4 Kho ảnh

324 ảnh `.webp`, vuông 1264×1264. **64 SKU có 5 ảnh, riêng `CAP-20260923-UY-021` (DET) có 4.** Gallery PDP không được giả định luôn có 5 ảnh.

---

## 4. Định vị, tagline, giọng

**Định vị.** Goldbourne & Co. lấy đồ mang theo người hằng ngày và xử lý chúng bằng ngữ pháp của một nhà mốt: vàng chạm nổi, huy hiệu, đá nạm, phát hành theo Edition có tên.

**Tagline:**

> **Team identity, rewritten in the language of a fashion house.**

Nguyên văn câu này nằm sẵn trong hook của `GB Monogram` (`BP-20260923-XI-022`): *"This is team identity rewritten in the language of a fashion house."* Lấy câu có sẵn trong copy lên đúng vị trí — cùng phương pháp spec 29/09 đã dùng, không sáng tác mới.

Câu dài hơn một khẩu hiệu thông thường. Chấp nhận: store này đi theo giọng catalogue, một dòng descriptor hợp hơn một khẩu hiệu ngắn. `team` là danh từ chung, không phải tên giải — sạch IP.

**`Gilded on every side.` tụt xuống dòng phụ** ở hero. Nó mô tả bề mặt, đúng nhưng chỉ trả lời *cái gì*, không trả lời *tại sao khác*.

**Descriptor (SEO / og):** `Gold-relief tumblers, caps, backpacks and shoes — released in Editions.` (giữ từ spec 29/09).

**Quy ước từ vựng** giữ nguyên từ spec 29/09: lớp brand-facing dùng `gilded`; lớp SEO dùng `gold-relief`.

**Giọng — không đụng.** Giọng catalogue đấu giá đã sống sẵn trong 65 `Body (HTML)`: *"A quiet flex rather than a loud one."* · *"Some designs shout. This one glows."* · *"staged like a display piece rather than a product shot."* Theme không được viết đè lên nó.

**Chặn motif `EST.`** giữ nguyên theo spec 29/09 §3: biển `EST. 1946` v.v. là năm thành lập đội thật, phải nằm yên trên sản phẩm, không kéo lên lớp brand.

---

## 5. Hệ thị giác

Nền phương pháp: style **Minimalism & Swiss Style**, pattern **Portfolio Grid** — cả hai tra từ `.agents/skills/ui-ux-pro-max`, xem §9 về những gì đã nhận và những gì đã bác bỏ.

### 5.1 Bảng màu

Chỉ một scheme. Theme này không có dark mode — `themes/dark-maximalism` đã giữ vai đó.

| token | hex | tương phản trên `bg` | dùng cho |
|---|---|---|---|
| `bg` | `#F6F1E7` | — | nền toàn trang, kem ấm |
| `fg` | `#14120E` | **16.62:1** AAA | chữ chính |
| `muted` | `#6B6151` | **5.40:1** AA | chữ phụ, meta, số đếm |
| `accent` | `#7A5F18` | **5.36:1** AA | nút, link, nhãn mục, wordmark |
| `accentFg` | `#FFFFFF` | 6.04:1 trên `accent` | chữ trên nền accent |
| `border` | `#8A7C62` | **3.63:1** | viền khung ảnh, đường phân cách |

**Không có token `surface`.** Mặt card trắng `#FFFFFF` trên nền kem chỉ đạt **1.13:1** — nó vô hình. Minimalism & Swiss cũng quy định `--shadow: none`, nên không có bóng để cứu. Kết luận: một nền kem duy nhất, ảnh đặt thẳng lên, như tường gallery một màu.

**Vì sao `border` là `#8A7C62` chứ không phải `#DED5C4` của brand.** `#DED5C4` chỉ đạt 1.29:1. Mà ảnh của 11 cap có nền marble ~`#F0E8DC`, chỉ **1.08:1** so với nền kem — không có viền đủ đậm thì cả 11 cap tan vào trang. Ở theme này viền là **chức năng**, không phải trang trí, nên phải đạt ngưỡng non-text 3:1.

**Vì sao không lấy palette `E-commerce Luxury` của dataset.** Dataset đề `accent #A16207` trên `background #FAFAF9` (4.71:1, đạt). Nhưng `#A16207` trên nền kem Goldbourne chỉ **4.37:1** — dưới AA. Lấy accent của dataset mà giữ nền của brand là tụt chuẩn; lấy cả hai là bỏ màu brand. Giữ cặp `#7A5F18` / `#F6F1E7` đã có là lựa chọn duy nhất vừa đạt AA vừa giữ liên tục brand.

**Vàng brand `#C9A227` không sống được trên theme này** — 2.15:1 trên kem, 2.42:1 trên trắng. Hệ quả vượt khỏi phạm vi nút bấm: spec 29/09 §7 chốt wordmark `GOLDBOURNE` màu `#C9A227`. Theme light **bắt buộc có biến thể logo thứ hai** ở `#7A5F18`. Đây là việc phải làm, không phải tùy chọn.

**Quy tắc màu đội** giữ nguyên và ở nền sáng còn nghiêm hơn: màu đội **chỉ sống bên trong ảnh**. Không gạch chân, không chấm màu, không viền badge. Chrome của trang đúng ba màu: kem, mực, `#7A5F18`.

### 5.2 Passepartout

Cơ chế thị giác trung tâm. Nguyên lý: **khung chung hợp thức hóa khác biệt giữa bốn họ style**, đúng cách một catalogue đấu giá trình bày các lô hàng không liên quan nhau.

- **Tỉ lệ khung 1:1** — ảnh gốc đã vuông, không crop.
- **Lề passepartout** bao quanh ảnh, nền `bg`, đều bốn phía: **32px** ở lưới sản phẩm, **64px** ở hero. Lề là thứ làm nên cơ chế — khi không đủ chỗ, giảm số cột trước, giảm lề sau cùng. Sàn tuyệt đối 16px.
- **Viền `1px solid #8A7C62`** sát mép ảnh.
- **Bo góc `0`** — khung tranh vuông góc. Theo `--border-radius: 0px` của Minimalism & Swiss.
- **Không đổ bóng.**
- **Tên và giá nằm dưới ảnh, trong vùng lề.** Không đè lên ảnh, **không scrim** — scrim là cơ chế của theme dark; ở đây lề đã làm xong việc tách chữ khỏi ảnh.

**Vì sao không full-bleed.** Spec 29/09 §5 chọn full-bleed để ảnh *sáng* trên nền *tối* đọc như cửa sổ thay vì miếng dán. Ở đây quan hệ đảo chiều: ảnh *tối* trên nền *sáng*, và full-bleed sẽ biến chúng thành mảng đen dán lên trang. Đóng khung thì chúng đọc như tranh treo. Cùng nguyên lý, ngược chiều.

### 5.3 Lưới

**3 cột** trên desktop. Passepartout sống bằng lề; 4 cột bóp lề xuống thì cơ chế mất tác dụng và quay về lưới full-bleed.

| Breakpoint | Cột | Lề passepartout |
|---|---|---|
| ≥1280px | 3 | 32px |
| 768–1279px | 2 | 24px |
| <768px | 1 | 16px |

Gutter giữa các khung theo thang spacing: 48px ở desktop, 32px ở tablet, 24px ở mobile.

43 tumbler trên lưới 3 cột là trang dài, nhưng pattern Portfolio Grid đi kèm filter theo category, và §6 cung cấp filter theo họ style — không ai phải cuộn hết 43.

Density tier: **spacious**, thang spacing 24–96px.

### 5.4 Typography

| Vai trò | Font | Weight | Ghi chú |
|---|---|---|---|
| H1 / H2 | Cormorant Garamond | **400** | chữ thường |
| Wordmark | Cormorant Garamond | 600 | in hoa, `letter-spacing: 0.08em` |
| Body, nav, nút, giá | Inter | 400 / 500 | |
| Nhãn dòng sản phẩm và họ style | Inter | 500 | in hoa, `letter-spacing: 0.08em` |

**Vì sao weight 400 cho heading.** Spec 29/09 §6 chọn 600 với lý do *"Cormorant 400 mảnh quá, mất nét trên nền đen"*. Trên nền kem lý do đó biến mất, và 400 mới là trọng lượng hợp với minimalism. Cormorant Garamond có variable axis 300–700 nên lấy 400 trực tiếp, không cần file thêm.

**Type scale:** 12 · 14 · 16 · 18 · 24 · 32, cộng 48 và 64 cho H1 hero. Thang cố định, không chen giá trị tuỳ tiện.

**Phương án dự phòng** nếu Cormorant Garamond 400 vẫn mảnh khi render thật: **Bodoni Moda + Jost**. Spec 29/09 đã nêu Bodoni Moda, và dataset xếp cặp này ở nhóm *Luxury Minimalist*.

### 5.5 Motion

Tier **Subtle**. Scroll reveal: `opacity 0 → 1`, dịch `y` 12px, duration 300–400ms, easing `power1.out`. Giữ offset nhỏ để nó đọc như fade chứ không phải slide.

Bắt buộc tôn trọng `prefers-reduced-motion` — render thẳng trạng thái cuối. Nội dung cần cho SEO không được mặc định ẩn nếu không có fallback no-JS.

**Hệ quả:** plan `docs/superpowers/plans/2026-09-29-homepage-parallax-appear.md` không mang sang theme này được. Parallax thuộc tier cao hơn và phá sự tĩnh mà cả style lẫn giọng catalogue đang giữ.

### 5.6 Hero

**Không full-bleed.** Hero là passepartout phóng to: một ảnh đóng khung đặt trên nền kem với lề rất rộng, wordmark và descriptor đặt cạnh.

Lý do: kho ảnh sạch IP mà spec 29/09 §7 khoanh được chỉ gồm 6 tumbler Halloween-General, cả 6 đều nền đen hoặc tím. Trải full-bleed lên theme kem sẽ là một mảng tối chiếm nửa màn hình, phá đúng cái light minimalism vừa dựng.

Hai nguồn ảnh hero, cả hai đều hợp theme này:
- **Macro crop chi tiết vàng** từ cap / backpack / shoes (filigree, viền laurel, khóa kéo vàng, vân da cá sấu), crop chặt để không lộ logo đội và không lộ biển `EST.`
- **Ảnh `01` của SKU Halloween-General** khi đang trong mùa.

---

## 6. Điều hướng

**Nav cấp 1 — 4 dòng sản phẩm**, sort theo độ lớn:

```
Tumblers 43 · Caps 11 · Backpacks 8 · Shoes 3
```

**Facet trong trang — theo họ style, không theo giải:**

- Trang Tumblers: `Gothic Jewel 33` · `Holiday Ornament 10`
- Caps / Backpacks / Shoes: **không render facet** — cả ba đều Heritage Crest sau khi gộp Gold Drip

Vì họ style trùng khít trục mùa vụ, **một hàng facet này thay được cả hai hàng** (Season + League) mà spec 29/09 §4 đề xuất.

**Cái được.** Spec 29/09 cấm tên giải ở nav nhưng lại đề xuất facet `NFL · NBA · MLB · WWE` cho trang Tumblers — tên giải quay lại bằng cửa sau. Facet theo họ style đóng cửa đó.

**Cái mất, ghi nhận rõ.** Không còn đường duyệt theo đội hay giải ở mặt tiền. Fan Cowboys không có cách đi tới 7 SKU của họ từ trong site. Đổi lại, `SEO Title` mang tên đội đầy đủ là lớp được phép — truy vấn "Cowboys tumbler" đáp thẳng xuống PDP, không qua collection. Đây là đánh đổi có ý thức: bỏ đường duyệt nội bộ để giữ ranh giới IP ở lớp điều hướng.

**Footer** giữ cấu trúc spec 29/09: *Shop* (4 dòng sản phẩm) · *Customer Support & Policies* (8 trang) · *Business Info* · *Follow Us*.

**Announcement bar** — nền kem, cùng scheme với trang (theme này không có inverse scheme):
1. `Order by Oct 9 to arrive before Halloween.` — sinh từ công thức §3.3, tự ẩn sau 09/10
2. `The Pair — two Editions, $89.95.`

Urgency vẫn là **hạn giao hàng, không phải hạn tồn kho**. Không bao giờ hiển thị "chỉ còn N cái". Đếm ngược chỉ áp cho 43 tumbler theo mùa; 22 SKU year-round không bao giờ hiện urgency.

---

## 7. Cấu trúc trang chủ

Theo pattern Portfolio Grid, 6 khối:

1. **Announcement** — 2 tin luân phiên ở §6
2. **Header** — wordmark `#7A5F18` · 4 dòng sản phẩm · Search · Cart
3. **Hero** — passepartout phóng to theo §5.6. H1 = tagline §4. Dòng phụ = `Gilded on every side.` CTA dẫn vào dòng đang đẩy
4. **Lưới sản phẩm có filter** — 3 cột, filter theo họ style. Khối trung tâm của trang, đặt cao
5. **`What you're actually holding`** — khối thông số dùng chung. **Chỉ render được sau khi lấp gap §8.3**
6. **Footer**

Khối `The Pair` giữ từ spec 29/09, đóng khung như cách một Edition được phát hành chứ không phải voucher giảm giá, và vẫn chỉ áp cho 43 tumbler.

---

## 8. Rủi ro và gap

### 8.1 Watermark `AURA TUMBLER` trên ảnh — chặn launch, mức cao nhất

Ảnh sản phẩm mang branding của một bên thứ ba: khối chữ `AURA TUMBLER` kèm tagline riêng (`LUXURY DRINKWARE FOR BOLDER LEGENDS`, `DARKER DRINKS BRIGHTER STORIES`, `DARKER NIGHTS BRIGHTER CHAMPIONS`).

**Không sửa được bằng crop.** Trong `TUM-20260923-UY-003` chữ `AURA TUMBLER` nằm **khắc trên đế cốc** — tức trên chính sản phẩm — và lặp lại trên bìa sách ở hậu cảnh. Crop góc ảnh không giải quyết được.

**Phạm vi chưa xác định.** Mẫu 6 ảnh tumbler đã mở: **3 có, 3 không**. Cần quét đủ 324 ảnh bằng mắt hoặc OCR để biết con số thật. Chưa quét vì việc đó cần cài thêm công cụ lên máy.

Đây nghiêm trọng hơn gap `Vendor = Taveris` của spec 29/09: cái đó sửa bằng một trường dữ liệu, cái này phải sửa hoặc thay ảnh.

### 8.2 Logo đăng ký và tên đội đầy đủ nằm trong ảnh — chưa có lời giải

Spec 29/09 §8.5 phân tầng ranh giới IP cho **chữ**: viết tắt `DAL` ở `Title`, tên đầy đủ ở `SEO Title`. Lớp ảnh chưa ai xét, và đó là chỗ hở:

- `®` của Cubs ngay giữa ảnh chính `TUM-20260923-XI-020`
- banner `GOLDEN STATE WARRIORS` ở hậu cảnh `TUM-20260923-XI-013`
- cờ `Steelers` ở hậu cảnh `TUM-20260923-UY-009`
- bóng rổ Wilson mang logo NBA trong cùng ảnh

Viết tắt ở tiêu đề không che được logo ở chính giữa ảnh. Ghi nhận là rủi ro đã biết, chưa đề xuất xử lý — quyết định này vượt phạm vi thiết kế theme.

### 8.3 Gap chặn launch kế thừa từ spec 29/09

Chép lại để tài liệu này tự đủ. Chưa mục nào được xử lý tính đến 01/10/2026:

| # | Việc | Phạm vi |
|---|---|---|
| 1 | Bổ sung `Product Details` + `Care` cho tumbler | 43 SKU |
| 2 | Sinh `SEO Description` | 65 SKU (trống 100%) |
| 3 | Sửa `Image Alt Text` trùng lặp — hậu tố theo vị trí, giữ tên đội viết tắt | 324 dòng |
| 4 | Đổi `Vendor` từ `Taveris`, hoặc tắt hiển thị vendor | 65 SKU |
| 5 | Ảnh đang trỏ `all-products.taveris.co` | 324 ảnh |

### 8.4 Rủi ro đã chấp nhận

**Compare-at phủ 100% catalog.** Spec 29/09 §9.3 đã nêu đầy đủ hai rủi ro (mâu thuẫn định vị, và FTC / Google Merchant Center / Meta Ads về fictitious pricing) và chủ store quyết định giữ nguyên. Không mở lại ở đây.

---

## 9. Phụ lục — những gì nhận và bác bỏ từ `ui-ux-pro-max`

**Nhận:**
- **Minimalism & Swiss Style** — kết quả duy nhất cho truy vấn editorial/gallery/minimal. Lấy trọn bộ biến: `--border-radius: 0px`, `--shadow: none`, `--accent-color: single primary only`, spacing 2rem.
- **Portfolio Grid** (domain `landing`) — color strategy nguyên văn *"Neutral background (let work shine). Text: Black/White. Accent: Minimal"* và *"Visuals first. Filter by category."* Đây là mô tả độc lập của chính cơ chế Passepartout.
- **Luxury Serif** (domain `typography`) — Cormorant + Montserrat, ghi rõ *best for: jewelry, luxury e-commerce*. Xác nhận hướng serif, nhưng **giữ Cormorant Garamond + Inter** đang có: cùng hạng, đã là asset của project, đổi chỉ để khớp chuỗi trong dataset là thay đổi không mua được gì.
- **Scroll Reveal tier Subtle** (domain `gsap`) — thông số ở §5.5.
- **Type scale 12/14/16/18/24/32** và yêu cầu `srcset` cho ảnh (severity High — ảnh gốc 1264px hiển thị ~400px).

**Bác bỏ:**
- **`E-commerce Luxury` → Liquid Glass + Glassmorphism, phụ là 3D & Hyperrealism.** Dataset khớp theo chữ "luxury" chứ không nhìn được ảnh. Sản phẩm đã maximalist sẵn (filigree, đá nạm, bokeh nến); phủ thêm glass hoặc 3D là hai lớp trang trí đánh nhau.
- **Palette `E-commerce Luxury`** (`accent #A16207` / `bg #FAFAF9`) — lý do contrast ở §5.1.
- **Pattern `Feature-Rich Showcase`** mà `--design-system` trả về — nó được chọn cho sản phẩm có feature để liệt kê. Store này có hàng hóa để trưng bày. Portfolio Grid đúng hơn.

Khuyến nghị dùng lại được nằm ở một mục không ngờ: `Wardrobe & Outfit Planner` → *Minimalism & Swiss + nền trung tính sạch, để bảng màu của hàng hóa làm việc*. Đúng bài toán này.

---

## 10. Checklist trước khi mở bán

Riêng cho theme light-minimal. Checklist chung của store xem spec 29/09 §12.

- [ ] Sinh biến thể logo `#7A5F18` cho theme light (§5.1) — không dùng lại `logo.svg` màu `#C9A227`
- [ ] Quét 324 ảnh tìm watermark `AURA TUMBLER`, xác định phạm vi (§8.1)
- [ ] Kiểm tương phản trên máy thật: `fg` 16.62:1 · `muted` 5.40:1 · `accent` 5.36:1 · `border` 3.63:1
- [ ] Xác nhận viền khung đủ tách 11 ảnh cap nền marble khỏi nền kem (§5.1)
- [ ] Xác nhận không có token `surface`, không có `box-shadow`, `border-radius: 0` toàn theme
- [ ] Gallery PDP chịu được SKU có 4 ảnh (`CAP-20260923-UY-021`) — không hardcode 5
- [ ] `srcset` cho ảnh 1264×1264 ở mọi điểm hiển thị
- [ ] Facet trang Tumblers hiển thị họ style, **không** hiển thị tên giải
- [ ] Facet **không** render ở Caps / Backpacks / Shoes
- [ ] Announcement tin 1 tự ẩn sau 09/10/2026; urgency không hiện trên 22 SKU year-round
- [ ] `prefers-reduced-motion` render thẳng trạng thái cuối, không mất nội dung
- [ ] Chạy bộ chặn copy §8.5 của spec 29/09 trên toàn theme, gồm `alt`, `meta`, `title`
- [ ] Responsive 375 / 768 / 1024 / 1440; lưới 3 cột xuống 2 rồi 1 mà lề passepartout không bị bóp mất
