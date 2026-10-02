# Thiết kế lại theme Light Minimal — hướng luxury nền trắng

> **Ngày:** 02/10/2026
> **Trạng thái:** Đã chốt qua brainstorm, chờ chuyển sang implementation plan
> **Quan hệ với tài liệu cũ:**
> - `docs/superpowers/specs/2026-10-01-light-minimal-theme-design.md` — spec gốc của theme này. Tài liệu hiện tại **đảo bốn quyết định** của nó (§2.2) và **giữ nguyên phần còn lại**. Mọi mục không nhắc tới ở đây vẫn theo spec 01/10.
> - `docs/superpowers/specs/2026-09-29-goldbourne-rebrand-design.md` — vẫn còn hiệu lực về catalog, giá, mùa vụ, ranh giới IP.
> - Theme `themes/dark-maximalism` **không đụng tới**.

---

## 0. Vì sao viết

Theme light-minimal chạy được, đúng spec, test xanh. Chủ store xem bản chạy thật và kết luận nó **quá đơn giản**.

Đó không phải lỗi thi công. Spec 01/10 §5 cố ý chọn Minimalism & Swiss và khoá bốn thứ: `--border-radius: 0`, `--shadow: none`, nền kem chứ không trắng, hero tĩnh không carousel, motion tier Subtle. Theme đơn giản vì nó được thiết kế để đơn giản.

Tài liệu này ghi lại quyết định đổi hướng: **giữ tên và thư mục `light-minimal`, nhưng bỏ thesis tối giản**, chuyển sang một hệ thị giác luxury nền trắng. Đây là lựa chọn có ý thức của chủ store sau khi được trình bày đầy đủ đánh đổi, không phải suy diễn từ phản hồi mơ hồ.

Ghi nhận thẳng: sau thay đổi này, tên thư mục `light-minimal` không còn mô tả đúng nội dung. Đã cân nhắc tách theme thứ ba `light-luxury` để giữ tên trung thực và giữ phương án tối giản làm đối chứng; chủ store chọn viết đè tại chỗ để khỏi nuôi ba theme. Tên giữ nguyên là nợ kỹ thuật đã biết, không phải sơ suất.

---

## 1. Bốn quyết định nền tảng

| # | Quyết định | Đảo quyết định nào của spec 01/10 |
|---|---|---|
| 1 | Nền `#FFFFFF`, **mở `box-shadow`** | §5.1 "không có token surface" + Swiss `--shadow: none` |
| 2 | Hero là **carousel 3 frame** | §5.6 "hero tĩnh, một ảnh đóng khung" |
| 3 | Thẻ sản phẩm **đổi sang ảnh 02 khi hover** | không đảo gì — spec 01/10 không nói tới, đây là bổ sung |
| 4 | Motion dùng **scroll-driven animations** | §5.5 tier Subtle |
| 5 | Trang chủ chỉ hiện **3 sản phẩm mỗi dòng, tổng 12 SKU tuyển tay**; **không có trang full catalog** | §5.3 "lưới 3 cột chứa 43 tumbler" + §6 facet trong trang |
| 6 | Port 2 microinteraction từ **Fancy Components** sang vanilla | mới, spec 01/10 không có |

Những gì **không** đổi, và phải chủ động giữ:

- `--radius: 0`. Góc vuông đọc đắt tiền hơn bo tròn ở hạng editorial. Giữ vì nó đúng, không phải vì Swiss bắt.
- Viền ảnh `1px solid #8A7C62`. Lý do ở §3.3 — nó mạnh hơn trên nền trắng chứ không yếu đi.
- Toàn bộ ranh giới IP: không tên giải ở nav/URL/alt/meta, không motif `EST.` ở lớp brand, màu đội chỉ sống trong ảnh.
- Bộ chặn copy §8.5 spec 29/09. **Không nới một cụm nào.**
- Logic phân loại trong `catalog.mjs` giữ nguyên hoàn toàn: `deriveStyleFamily`, `displayFamily`, `byType`, `priceLabel`. Riêng **thanh facet bị gỡ khỏi trang chủ** theo quyết định 5 — xem §7.3 về cái mất và vì sao nó không mở lại lỗ hổng IP.
- Giọng catalogue trong 65 `Body (HTML)`. Theme không viết đè.

---

## 2. Hệ màu

### 2.1 Bảng token

Mọi con số dưới đây đo lại ngày 02/10/2026, không chép từ spec cũ.

| token | hex | trên `--bg` | dùng cho |
|---|---|---|---|
| `bg` | `#FFFFFF` | — | nền trang |
| `fg` | `#14120E` | **18.71:1** AAA | chữ chính |
| `muted` | `#6B6151` | **6.08:1** AA | chữ phụ, meta, số đếm |
| `accent` | `#7A5F18` | **6.04:1** AA | nút, link, nhãn, wordmark, **mọi chỉ báo trạng thái** |
| `accentFg` | `#FFFFFF` | 6.04:1 trên `accent` | chữ trên nền accent |
| `border` | `#8A7C62` | **4.09:1** | viền khung ảnh, đường phân cách |
| `gold` | `#C9A227` | 2.42:1 | **chỉ hairline trang trí** — xem §2.4 |

Chuyển từ kem `#F6F1E7` sang trắng làm **tăng** contrast mọi token (lần lượt từ 16.62 / 5.40 / 5.36 / 3.63). Phản đối nền trắng của spec 01/10 là lý do thẩm mỹ — vàng kim ngả xám — không phải a11y. Chủ store chấp nhận đánh đổi đó.

### 2.2 Shadow thay cho surface

Thẻ trắng trên trang trắng là vô hình. Spec 01/10 gặp đúng vấn đề này ở chiều ngược lại (trắng trên kem, 1.13:1) và giải bằng cách bỏ hẳn lớp mặt card. Ở đây có lối thoát mà spec cũ không có: **mở shadow**.

```
--shadow-sm: 0 1px 2px rgba(20,18,14,.04), 0 8px 24px rgba(20,18,14,.06);
--shadow-md: 0 2px 4px rgba(20,18,14,.05), 0 16px 48px rgba(20,18,14,.10);
```

Mờ rộng, alpha thấp, ngả ấm theo `--fg` chứ không phải đen thuần. Đây là shadow kiểu tủ trưng bày, không phải elevation kiểu Material.

**Không thêm token `--surface`.** Mặt thẻ đúng bằng `--bg`; cái tách nó khỏi trang là shadow, không phải màu. Giữ đúng một màu nền trên toàn trang.

### 2.3 Thang mới

```
--space-7: 8rem                             thêm khoảng thở
--fs-9: 4.5rem                              H1 hero lớn hơn
--ease-lux: cubic-bezier(0.16, 1, 0.3, 1)   expo-out — thứ tạo cảm giác "mượt"
--dur-slow: 700ms                           crossfade carousel
```

Thang type và spacing cũ giữ nguyên, chỉ nối thêm đầu trên. Không chen giá trị tuỳ tiện vào giữa.

### 2.4 Vàng brand quay lại, trong một cái lồng

`#C9A227` đạt 2.42:1 trên trắng. Không đủ cho chữ, nút, hay bất cứ thứ gì mang thông tin. Nhưng một đường kẻ trang trí thuần tuý không chịu ngưỡng contrast của WCAG, và nó là tín hiệu luxury rẻ nhất có thể mua — đồng thời trả lại cho theme light màu brand mà spec 01/10 buộc phải vứt.

**Luật, và nó được test canh:**

- `#C9A227` xuất hiện **đúng một lần** trong toàn bộ file theme: dòng định nghĩa `--gold` trong `tokens.css`.
- `var(--gold)` **chỉ** được dùng trong khai báo `border`. Cấm ở `color`, `background`, `fill`, `outline`, và cấm trên mọi selector có trạng thái (`:hover`, `.is-active`, `[aria-current]`, `[aria-pressed]`).
- Chỉ báo trạng thái — chấm carousel đang hoạt động, facet đang bật, focus ring — dùng `--accent`. Không ngoại lệ.

Lý do viết luật chặt thế: vàng đẹp, và cái đẹp sẽ bò dần sang chỗ nó không được phép ở. Hàng rào phải là test chứ không phải trí nhớ.

---

## 3. Thị giác

### 3.1 Passepartout vẫn là cơ chế, nhưng đổi vai

Spec 01/10 dùng lề rộng nền kem làm thứ tách ảnh khỏi trang. Giờ lề là **mặt thẻ trắng có shadow**: ảnh nằm trong một tấm thẻ nổi nhẹ trên trang trắng, không phải một mảng kem phẳng.

- Padding thẻ 24px desktop / 20px tablet / 16px mobile. Sàn tuyệt đối 16px giữ nguyên.
- Hover/focus-within: nhấc `translateY(-4px)`, đổi `--shadow-sm` → `--shadow-md`, chuyển trong 300ms `--ease-lux`.
- Bo góc 0, kể cả thẻ.

### 3.2 Lưới

Giữ 3 / 2 / 1 cột theo đúng breakpoint spec 01/10 §5.3. Không đổi sang mosaic — đã cân nhắc và loại, vì nó phá kỷ luật khung vuông 1:1 và đẩy nhiều ảnh chưa kiểm duyệt lên vị trí lớn luôn hiển thị.

### 3.3 Viền ảnh phải giữ, không thương lượng

11 ảnh cap có nền marble ~`#F0E8DC`. So với nền trắng nó vào khoảng 1.1:1 — vẫn tan vào trang y như khi nền kem. Shadow của thẻ không cứu được chuyện này: shadow tách *thẻ* khỏi *trang*, không tách *ảnh* khỏi *mặt thẻ*.

Viền `1px solid #8A7C62` ở sát mép ảnh là **chức năng**, đạt ngưỡng non-text 3:1 (thực đo 4.09:1). Test canh lại ngưỡng này.

### 3.4 Typography

Giữ Cormorant Garamond 400 + Inter theo spec 01/10 §5.4. Đổi duy nhất: H1 hero được dùng `--fs-9`, mở biên độ tương phản cỡ chữ — đây là đòn bẩy luxury không tốn gì.

---

## 4. Hero carousel

### 4.1 Kết quả soi ảnh — dữ liệu mới, lấp một phần gap §8.1

Spec 01/10 §8.1 ghi watermark `AURA TUMBLER` là gap chặn launch mức cao nhất, mẫu 6 ảnh cho 3 có 3 không, chưa ai quét đủ 324 ảnh.

Đã soi bằng mắt toàn bộ ảnh `01` của 6 SKU Halloween-General — đúng cái pool mà spec 01/10 §5.6 khoanh là sạch logo đội:

| SKU | Mô tả ảnh 01 | Watermark |
|---|---|---|
| `TUM-20260923-XI-001` | trăng lưỡi liềm, tím amethyst | **sạch** |
| `TUM-20260923-XI-002` | thiên nga đen đội vương miện, navy | **sạch** |
| `TUM-20260923-XI-003` | mạng nhện, ruby | **dính** — khối `AURA TUMBLER` góc trên trái, cộng dòng chữ cột phải |
| `TUM-20260923-XI-004` | sọ vàng, hồng đen | **dính** — `AURA TUMBLER` góc trên trái, cộng `DARKER DRINKS BRIGHTER STORIES` |
| `TUM-20260923-XI-005` | rắn, ngọc lục bảo | **dính, không cứu được** — biển vàng `AURA TUMBLER` khắc trên thân sản phẩm, giữa ảnh |
| `TUM-20260923-XI-006` | dơi và ruby, đỏ | **sạch** |

Tỉ lệ 3/3 khớp mẫu spec 01/10 đã lấy. `XI-005` là ca spec cảnh báo: watermark nằm trên chính sản phẩm nên crop vô hiệu.

**Pool hero an toàn: đúng 3 frame** — `XI-001`, `XI-002`, `XI-006`. Vừa đủ cho carousel, không dư một frame nào.

### 4.2 Thiết kế

Thứ tự `XI-001` tím → `XI-002` navy → `XI-006` đỏ ruby. Ba frame đi thành một chuỗi màu, không xếp ngẫu nhiên.

**Không full-bleed.** Lý lẽ spec 01/10 §5.6 vẫn đúng và trên nền trắng còn mạnh hơn: ảnh tối trải hết màn hình thành mảng đen dán lên trang. Hero là khung lớn bên phải, cột chữ bên trái, lề rộng — một tủ kính được chiếu sáng.

- Chuyển cảnh: crossfade 700ms `--ease-lux`.
- Ken Burns: `scale(1)` → `scale(1.04)` trong 7s, tuyến tính. Chậm tới mức không ai bắt được nó đang chạy.
- Autoplay 6s mỗi frame.

### 4.3 A11y — nút tạm dừng là bắt buộc

Autoplay 6s là nội dung tự cập nhật quá 5 giây, rơi thẳng vào **WCAG 2.2.2 Pause, Stop, Hide**. Dừng-khi-rê-chuột **không** thoả: người dùng bàn phím và người dùng screen reader không rê chuột.

Bắt buộc:

- **Nút tạm dừng/chạy hiện rõ**, có nhãn chữ, không phải chỉ icon.
- Prev/next là `<button>` thật, không phải `<div>` gắn click.
- `role="region"` + `aria-roledescription="carousel"` + `aria-label`.
- Vùng slide `aria-live="polite"` thông báo `Slide n of 3` khi đổi; khi autoplay đang chạy thì để `aria-live="off"` để không spam screen reader, chỉ bật khi người dùng tự bấm.
- Chấm chỉ báo dùng `aria-current`, màu `--accent`, **không** dùng `--gold`.
- Focus không bị bẫy trong carousel.
- `prefers-reduced-motion: reduce` → không autoplay, không Ken Burns, không crossfade; hiện frame 1, nút vẫn bấm được.

### 4.4 Alt text

Lấy từ `title`, **không** từ `seoTitle` (chứa tên đội đầy đủ). Theo đúng `imageAlt()` đang có trong `render.mjs`.

---

## 5. Thẻ sản phẩm đổi ảnh khi hover

### 5.1 Cơ chế

Hai `<img>` chồng nhau trong khung; ảnh `02` nằm trên, `opacity: 0`, crossfade 400ms khi `:hover` hoặc `:focus-within`.

Chỉ bật trong `@media (hover: hover)`. Máy cảm ứng không có hover thật — bật ở đó vừa vô dụng vừa tải thừa 65 ảnh. Ảnh `02` để `loading="lazy"`.

Focus-within là bắt buộc, không chỉ hover: thẻ là link, người dùng bàn phím phải thấy cùng một thứ người dùng chuột thấy.

### 5.2 Gate kiểm duyệt — chặn, không phải khuyến nghị

Quyết định "trang chủ chỉ 12 SKU" (§7.2) làm gate này **co từ 130 ảnh xuống 24** — 12 ảnh `01` cộng 12 ảnh `02`. Đó là lượng soi hết được bằng mắt trong một lượt, nên tiêu chuẩn ở đây **cao hơn** mức "giảm thiểu rủi ro": mọi ảnh xuất hiện trên trang chủ đều đã được kiểm.

Soi tìm **hai** thứ trong cùng một lượt:

- watermark `AURA TUMBLER` (gap §8.1 spec 01/10)
- logo đăng ký, tên đội đầy đủ, banner hay cờ ở hậu cảnh (gap §8.2 spec 01/10)

**Ảnh bẩn thì đổi SKU, không phải tắt tính năng.** Vì danh sách là tuyển tay, SKU nào có ảnh `01` hoặc `02` dính thì loại khỏi danh sách và chọn SKU khác trong cùng dòng. Đây là tiêu chí loại số 1 ở §7.2.

**Lối thoát khi một dòng không đủ 3 SKU sạch cả đôi:** chấp nhận SKU có `01` sạch nhưng `02` dính, và **tắt swap riêng cho thẻ đó**. Không xoá ảnh.

**Cờ đó để ở đâu — quan trọng.** `products/products.json` **là file sinh ra** bởi `scripts/build-products.mjs` từ CSV Shopify. Sửa tay vào đó sẽ bị ghi đè ở lần build kế tiếp và không ai nhận ra. Cờ phải nằm trong mã theme: một hằng số dạng `Set` các SKU bị loại, đặt trong `assets/catalog.mjs` cạnh danh sách 12 SKU, kèm chú thích ngày soi.

**Chuẩn áp dụng — chốt trước khi soi.** Đọc nguyên văn, "logo đăng ký của đội" không kèm vị trí sẽ loại cả 65 sản phẩm: toàn bộ hàng trong kho là đồ cổ vũ mang màu và huy hiệu đội. Bể chọn ở §7.2 khi đó rỗng. Ba chứng cứ chốt lại cách hiểu hẹp hơn:

1. Cả bốn ví dụ vi phạm mà spec 01/10 §8.2 nêu đích danh đều là hậu cảnh hoặc đạo cụ — `®` giữa ảnh, banner tên đội sau lưng, cờ đội sau lưng, bóng mang logo giải — không ví dụ nào là hoạ tiết in trên thân hàng.
2. Caps và backpacks chia xấp xỉ một nửa giữa "hậu cảnh có bảng hiệu đội" và "hậu cảnh trung tính", nên tiêu chuẩn hậu cảnh đủ sức phân loại chứ không loại sạch.
3. Quyết định: §7.2 **bắt buộc** dòng Tumbler phủ cả hai họ style, mà cả 10 tumbler Holiday Ornament đều in tên đội đầy đủ trên thân. Nếu "tên đội trên thân hàng" là tiêu chí loại thì chính yêu cầu của §7.2 tự mâu thuẫn.

Vậy loại khi ảnh có: (a) chữ `AURA TUMBLER` ở bất kỳ đâu, kể cả khắc trên thân; (b) tagline của bên thứ ba; (c) ký tự `®` nhìn thấy được ở bất kỳ đâu; (d) logo hoặc tên đội đầy đủ xuất hiện dưới dạng bảng hiệu, banner, cờ, tranh tường ở hậu cảnh; (e) logo giải đấu trên đạo cụ (bóng, áo đấu). **Hoạ tiết của chính món hàng không phải tiêu chí loại.** Ảnh nhỏ làm mờ ký tự `®`, nên mọi ứng viên lọt vòng cuối đều được cắt và phóng to vùng huy hiệu trước khi kết luận.

#### Kết quả soi 24 ảnh của 12 SKU tuyển tay — 02–03/10/2026

| SKU | `01` | `02` | Ghi nhận |
|---|---|---|---|
| `TUM-20260923-XI-028` | đạt | **không đạt** | `01` nền cửa sổ gothic, trăng, lâu đài, đá tối; phóng to hai mặt thân cốc: không `AURA TUMBLER`, không `®`. `02` có áo đấu số 15 đóng khung treo tường, sách in tên đội, gối và bóng bầu dục của đội → vào `NO_SWAP` |
| `TUM-20260923-XI-023` | đạt | **không đạt** | `01` nền lò sưởi và bokeh cây thông; phóng to quai và thân: không `®`. `02` có bóng bầu dục mang logo giải đấu, áo đấu số 13, chăn in tên đội → vào `NO_SWAP` |
| `TUM-20260923-XI-026` | đạt | **không đạt** | `01` nền panel navy, đèn tường, cây thông; không `®`. `02` có áo đấu "LAMB 88" treo hậu cảnh → vào `NO_SWAP` |
| `CAP-20260923-UY-021` | đạt | **không đạt** | `01` nền cúp và đá cẩm thạch, không chữ hiệu. `02` có logo sư tử của đội làm bảng hiệu trên tường, khán đài sân qua cửa kính → vào `NO_SWAP` |
| `CAP-20260923-UY-022` | đạt | **không đạt** | `01` nền sảnh lounge, ảnh đen trắng không đọc được chi tiết. `02` có logo chữ "G" của đội trên tường, cờ hiệu trên khán đài, ảnh đội đen trắng → vào `NO_SWAP` |
| `CAP-20260923-UY-017` | đạt | **không đạt** | `01` nền skyline đen trắng và cúp, không chữ hiệu. `02` có bảng hiệu tường mang tên đội đầy đủ và logo ba sao → vào `NO_SWAP` |
| `BP-20260923-XI-019` | đạt | đạt | Cả hai ảnh nền khói trừu tượng và ánh vàng; phóng to huy hiệu: không `®` |
| `BP-20260923-XI-023` | đạt | đạt | Cả hai ảnh nền đá cẩm thạch tối và ánh vàng; không `®` |
| `BP-20260923-XI-017` | đạt | đạt | Cả hai ảnh nền đá cẩm thạch tối và ánh vàng; không `®` |
| `SNK-20260923-XI-009` | **không đạt** | đạt | `01` có logo bầu dục của đội phóng lớn làm phông nền, thêm biển logo góc trên trái. `02` studio trơn. Xem §5.2.1 |
| `SNK-20260923-XI-010` | **không đạt** | đạt | `01` có logo đầu đại bàng phóng lớn làm tranh tường. `02` studio trơn. Xem §5.2.1 |
| `SNK-20260923-XI-011` | **không đạt** | đạt | `01` có logo ba sao phóng lớn làm phông nền. `02` studio trơn. Xem §5.2.1 |

Sáu SKU vào `NO_SWAP`: ba tumbler và cả ba cap. Lý do giống nhau ở mọi trường hợp — ảnh `02` của hai dòng này là ảnh bối cảnh chụp trong phòng cổ vũ, dòng nào cũng vậy chứ không phải xui một vài SKU.

#### 5.2.1 Dòng Shoes — chặn, không tự quyết

Cả ba SKU Shoes đều có ảnh `01` không đạt, cùng một kiểu: logo đăng ký của đội phóng lớn làm tranh tường phía sau sản phẩm. Đây đúng loại vi phạm mà spec 01/10 §8.2 nêu — "banner tên đội ở hậu cảnh", "cờ đội ở hậu cảnh" — chỉ khác là to hơn.

Dòng này có **đúng ba** SKU nên không có cái thay thế. Lối thoát ở §5.2 cũng không dùng được: lối thoát đó xử lý `01` sạch / `02` dính, còn đây là chiều ngược lại.

Hai điều đã kiểm và không còn phải đoán:

- Ảnh `02` của cả ba SKU đều sạch — studio trơn, hoạ tiết chỉ nằm trên giày.
- Ảnh `03` của cả ba cũng sạch — macro cận cảnh, hậu cảnh xoá phông.

Nên dòng Shoes gỡ chặn được bằng một quyết định duy nhất: **cho phép thẻ sản phẩm chọn ảnh chính khác `01`** — một map `PRIMARY_INDEX` đặt cạnh `NO_SWAP`, mặc định 0, ba mã Shoes trỏ sang 1.

**Đã chốt ngày 03/10/2026: không làm, giữ nguyên ảnh `01`.** Chủ store được trình bày cả phương án trên lẫn phương án bỏ hẳn dải Shoes, và chọn chấp nhận rủi ro. Ba mã Shoes nằm trong `CURATED` với ảnh `01` như hiện có — chúng *là* cả dòng, bỏ bớt hay giấu dòng đi còn sai hơn. Lý do đầy đủ và đường quay đầu nếu sau này muốn đảo quyết định: §10.1.

#### Loại ở vòng sơ tuyển

| SKU | Lý do loại |
|---|---|
| `TUM-20260923-XI-007` | `01`: hai khối `AURA TUMBLER`, thêm logo đội bóng rổ trên tường |
| `TUM-20260923-XI-012` | `01`: `AURA TUMBLER`, banner đội, bóng mang logo đội |
| `TUM-20260923-XI-009` | `01`: banner đội treo hậu cảnh |
| `TUM-20260923-XI-010` | `01`: banner tên đội đầy đủ kèm ký hiệu ™ |
| `TUM-20260923-XI-018` | `01`: bảng hiệu sân vận động ở hậu cảnh |
| `TUM-20260923-XI-019` | `01`: logo chữ "A" của đội và bảng tên sân |
| `TUM-20260923-XI-025`, `XI-027` | `01`: tường logo ngôi sao của đội |
| `TUM-20260923-UY-012` | `01`: banner đội và bảng tên sân |
| `TUM-20260923-UY-014` | `01`: cờ đội treo hậu cảnh |
| `TUM-20260923-XI-022` | `01`: ký tự `®` cạnh logo trên thân cốc, chỉ thấy khi phóng to |
| `TUM-20260923-XI-017` | `01`: ký tự `®` cạnh logo; `02` thêm áo đấu và biển cổ vũ |
| `TUM-20260923-XI-021` | `01`: vết nghi là `®` không phân giải dứt khoát; bỏ qua vì đã đủ ứng viên sạch |
| `TUM-20260923-XI-024` | `01` đạt, `02` có áo đấu số 24 — dự phòng hạng hai cho họ Holiday Ornament |
| `TUM-20260923-XI-003`, `XI-004`, `XI-005` | `01` dính, kết quả đã có ở §4.1 |
| `TUM-20260923-XI-001`, `XI-002`, `XI-006` | `01` **và** `02` đều đạt, nhưng ba mã này là ba khung của hero §4.2. Dùng lại ở dải preview sẽ lặp ảnh ngay trong một màn hình, nên nhường chỗ cho tumbler khác |
| `CAP-20260923-UY-016`, `UY-018`, `UY-023`, `UY-024`, `UY-025`, `UY-026` | `01`: logo đội trên tường, trong tủ trưng bày, hoặc bảng hiệu |
| `CAP-20260923-UY-019` | `01`: ảnh cầu thủ mặc áo đấu đóng khung treo tường |
| `CAP-20260923-UY-020` | `01` đạt, `02` dính — dự phòng hạng hai cho dòng Cap |
| `BP-20260923-XI-018` | `01`: logo đội trên tường, mũ bảo hiểm vàng, và bóng bầu dục mang logo giải đấu |
| `BP-20260923-XI-020`, `XI-021`, `XI-022` | `01`: logo hoặc chữ hiệu đội trên tường |
| `BP-20260923-XI-024` | Hậu cảnh đạt cả hai ảnh, nhưng in tên đội đầy đủ trên thân túi — dự phòng hạng hai |

Kết quả soi — cả 24 ảnh, đạt hay không đạt, lý do loại — phải ghi vào spec này, không để trong đầu người làm.

---

## 6. Motion

### 6.1 Support thật tính tới 02/10/2026

| Trình duyệt | `animation-timeline` |
|---|---|
| Chrome / Edge | có, từ Chrome 115 (7/2023) |
| Safari | có, từ Safari 26 (9/2025) |
| Firefox | **vẫn sau cờ** `layout.css.scroll-driven-animations.enabled` tính tới Firefox 152 (6/2026) |

Khoảng 85% global, **chưa phải Baseline**. Fallback không phải tuỳ chọn.

### 6.2 Kiến trúc hai nhánh

```css
.reveal { opacity: 1; }                 /* mặc định LUÔN hiện */

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal auto linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 35%;
    }
  }
}
```

Firefox rơi về `IntersectionObserver` **đã có sẵn và đã test** trong `main.js`. Không viết cơ chế mới — chỉ cho nó chạy khi `CSS.supports('animation-timeline: view()')` trả `false`.

Hai luật cứng:

1. **Trạng thái mặc định của mọi phần tử là hiện.** Ẩn chỉ được bật bởi nhánh animation. Không bao giờ có đường nào dẫn tới nội dung ẩn vĩnh viễn.

   Đây là sửa một điểm mong manh có thật trong bản hiện tại: `base.css` đặt `.reveal { opacity: 0 }` làm mặc định, và chỉ `main.js` hoặc nhánh `prefers-reduced-motion` mới trả nó về `1`. JS không chạy — đúng kịch bản mà bug path §8 gây ra — thì cả 65 thẻ vô hình. Đảo mặc định thành hiện là cách duy nhất làm điều đó bất khả thi.
2. `animation-duration` bị bỏ qua khi có `animation-timeline`. Không khai nó.

### 6.3 Những thứ scroll-driven thêm vào

- Header co lại và hiện hairline khi cuộn qua hero.
- Hairline tiến độ đọc dưới header.

Cả hai thuần CSS, chạy trên compositor, không tốn JS. Cả hai thuộc loại trang trí — Firefox không có thì trang vẫn đúng.

### 6.4 Bỏ hẳn

Parallax. Spec 01/10 §5.5 đã bác và lý do vẫn đứng: nó phá sự tĩnh mà giọng catalogue đang giữ. Đổi hướng sang luxury không kéo theo parallax.

---

## 7. Cấu trúc trang chủ

1. **Announcement** — 2 tin luân phiên, giữ nguyên logic cutoff. Viền dưới đổi sang hairline `--gold`.
2. **Header** — wordmark `--accent`, 4 dòng sản phẩm, sticky, co khi cuộn.
3. **Hero carousel** — §4.
4. **Bốn dải preview** — Tumblers · Caps · Backpacks · Shoes, mỗi dải **3 sản phẩm**.
5. **Footer** — giữ nguyên.

**Không** có editorial band, **không** có mosaic — đã cân nhắc và loại ở brainstorm.

**Không** render `What you're actually holding` và `The Pair`. Hai khối này chặn bởi gap §8.3 spec 01/10 (thiếu `Product Details`, `Care` cho 43 tumbler) và chưa mục nào được lấp. Dựng khối rỗng chỉ để trang dài hơn là tự lừa mình.

### 7.1 Vì sao 3 chứ không phải 4

Lưới desktop là 3 cột. Bốn sản phẩm thành 3 cộng 1 lẻ ở hàng hai — xấu ở đúng breakpoint quan trọng nhất. Ba là tròn một hàng ở `≥1280px`, và xuống 2 rồi 1 cột vẫn chia hết. Nếu sau này muốn 4 thì phải đổi preview sang dải cuộn ngang, không dùng lưới được nữa.

### 7.2 Danh sách 12 SKU là tài sản, không phải mặc định

Trang chủ không còn chế độ full, nên **12 SKU này là toàn bộ cửa hàng**. Lấy 3 cái đầu theo thứ tự catalog là phó mặc gian hàng cho thứ tự file CSV.

Dùng **danh sách tuyển tay**, đặt trong `assets/catalog.mjs` cùng chỗ với cờ watermark (§5.2), kèm ngày tuyển và lý do chọn từng SKU. Tiêu chí, theo thứ tự ưu tiên:

1. Ảnh `01` và `02` **sạch watermark `AURA TUMBLER` và sạch logo/tên đội** — đây là tiêu chí loại, không phải tiêu chí cộng điểm.
2. Phủ được cả hai họ style trong dòng Tumbler (Gothic Jewel và Holiday Ornament), để trang chủ không trông như chỉ bán đồ Halloween.
3. Màu không đụng nhau trong cùng một dải.

### 7.3 Nav thành neo cuộn, facet biến mất

Không còn chế độ full catalog thì `typeNav` không còn gì để lọc. Nó chuyển thành **neo cuộn** tới 4 dải preview. `footerNav` render cùng markup nên hành xử y hệt — giữ đúng nguyên tắc "control trông giống nhau thì không được cái bấm được cái không" đã ghi trong `main.js`.

**Thanh facet bỏ khỏi trang chủ.** Ba sản phẩm một dải thì không có gì để lọc.

Hệ quả phải ghi rõ: facet theo họ style là **quyết định nền tảng số 3** của spec 01/10 — nó tồn tại để bịt lỗ hổng IP ở lớp điều hướng mà spec 29/09 còn để lại. Bỏ nó **không** mở lại lỗ hổng đó, vì ta không thay bằng facet theo giải; ta không thay bằng gì cả. Nhưng một tính năng đã thiết kế có lý do thì đang bị gỡ, và đó là mất mát thật.

**Xoá luôn `facetCounts()`, `shouldRenderFacets()` (`catalog.mjs`) và `facetBarHtml()` (`render.mjs`) cùng test của chúng.**

Bản nháp spec này ban đầu đề nghị giữ, với lý do `product.html` còn dùng. Kiểm lại ngày 02/10/2026 cho thấy lý do đó **sai**: `product.js` import `TYPE_ORDER, TYPE_LABEL, byType, priceLabel, formatPrice, deriveStyleFamily, displayFamily` — không có hàm facet nào. Nó chỉ dùng lại **class CSS** `.facet` cho nút chọn variant (`product.js:31`).

Code có test nhưng không ai gọi là cách một codebase tích trữ ảo tưởng: test xanh khiến người sau tưởng tính năng còn sống. Git giữ lịch sử nếu sau này dựng trang collection và cần lại.

**Class CSS `.facet` và `.facets` thì giữ** — `product.js` đang dùng thật.

---

## 7.5 Microinteraction port từ Fancy Components

[Fancy Components](https://www.fancycomponents.dev/) là thư viện **React + TypeScript + Tailwind + Motion**, cài qua shadcn CLI, một số component còn kéo `matter-js` / `lodash` / `poly-decomp`. Theme này là HTML/CSS/JS thuần, không build step — **không cài được, không copy-paste được**.

Giấy phép MIT cho phép chép lại ý tưởng. Port đúng **hai** cái, viết lại bằng vanilla, có ghi nguồn trong comment:

| Port | Vì sao chọn | Chi phí |
|---|---|---|
| **Variable Font Hover** | Cormorant Garamond là variable font trục 300–700 — asset đã có sẵn. Nav và wordmark đổi weight khi rê chuột | CSS thuần, 0 JS, 0 KB |
| **Vertical Cut Reveal** | H1 serif cắt dòng hiện lên; đúng chất editorial của một nhà đấu giá | CSS + ~15 dòng JS tách dòng |

**Phải sửa kèm:** `base.css` đang nạp `css2?family=Cormorant+Garamond:wght@400;600` — đó là **hai weight tĩnh, không phải variable font**. Variable Font Hover không chạy được trên nó. Đổi sang `wght@300..700`.

**Loại, và lý do:**

- **Image Trail** — rải ảnh sản phẩm theo con trỏ. Đưa ảnh chưa kiểm duyệt khắp màn hình ở vị trí không kiểm soát được, hỏng cả ranh giới IP lẫn giọng catalogue tĩnh.
- **Gravity**, **Cursor Attractor** — cần `matter-js`. Phá zero-dependency vì một hiệu ứng sai chất.
- **Gooey**, **Pixelate**, **Scramble Hover**, **Typewriter** — ngôn ngữ của trang tech, không phải nhà đấu giá.
- **Carousel** của họ — ta tự dựng với ràng buộc a11y §4.3 chặt hơn.

**Ràng buộc a11y cho Vertical Cut Reveal:** tách chữ thành `<span>` làm hỏng screen reader nếu làm ẩu. Bọc ngoài phải có `aria-label` mang nguyên câu, các `<span>` con `aria-hidden="true"`. Và nó chịu chung luật §6.2.1 — **mặc định là hiện**, hiệu ứng chỉ bật trong nhánh `@supports` + `prefers-reduced-motion: no-preference`.

---

## 8. Sửa lỗi path tương đối

`index.html` và `product.html` tham chiếu asset bằng path tương đối (`assets/tokens.css`, `assets/main.js`). Host nào bật clean-URLs — Vercel, Netlify, `npx serve` — sẽ redirect `/themes/light-minimal/index.html` → `/themes/light-minimal` không dấu `/` cuối, base URL tụt thành `/themes/`, và **cả hai trang trắng hoàn toàn**. Đã xác nhận bằng chạy thật, không phải suy đoán.

Ảnh sản phẩm dùng path tuyệt đối `/products/...` nên không ảnh hưởng. Chỉ 3 file CSS + 1 file JS mỗi trang là tương đối.

Sửa: đổi sang `/themes/light-minimal/assets/...`. `index.html` viết lại rồi nên gộp luôn, và sửa cả `product.html` dù trang đó không nằm trong phạm vi redesign — để nó vỡ trong khi đã biết là cố ý để lại bug.

**Hệ quả phải ghi:** path tuyệt đối gắn theme vào đúng vị trí thư mục này trên domain. Nếu sau này serve theme từ root hoặc subpath khác thì phải đổi sang `<base href>`.

---

## 9. Test phải viết lại

Bốn test sẽ vỡ. Cả bốn vỡ **có chủ đích** — chúng đang canh đúng những quyết định ta vừa đảo. Viết lại, không xoá, không nới.

| Test | Vỡ vì | Thay bằng |
|---|---|---|
| `copy-guard` → cấm `box-shadow` | Ta cố ý mở shadow | Shadow phải khai qua `--shadow-*`; cấm `box-shadow` hardcode ngoài `tokens.css` |
| `copy-guard` → cấm `#C9A227` | Hairline vàng | `#C9A227` xuất hiện đúng 1 lần; mọi `var(--gold)` phải nằm trong khai báo `border` |
| `tokens` → cấm `#C9A227` | như trên | như trên |
| `render.test` | Markup thẻ có 2 `<img>` | Cập nhật; thêm ca thẻ bị tắt swap do watermark |

**Giữ nguyên, không đụng:** 5 test contrast (ngưỡng cũ, nền mới, tất cả đều qua rộng hơn), `--radius: 0`, cấm `--surface`, chặn cụm copy, chặn tên giải.

**Thêm mới:**

- Carousel có nút tạm dừng và nút đó là `<button>`.
- `.reveal` mặc định `opacity: 1` — canh đúng luật §6.2.1, chặn tái diễn lỗi nội dung ẩn.
- `var(--gold)` không xuất hiện trên selector trạng thái.
- Danh sách tuyển tay có **đúng 12 SKU, đúng 3 mỗi dòng sản phẩm**, và mọi SKU đều tồn tại trong `products.json`. Test này bắt lỗi gõ sai SKU và lỗi sót khi sửa danh sách — danh sách tuyển tay là chỗ duy nhất trong theme mà một lỗi chính tả làm mất hẳn một sản phẩm khỏi cửa hàng.
- Mọi `href` của `typeNav` và `footerNav` trỏ tới một `id` có thật trên trang. Neo cuộn gãy thì im lặng, không báo lỗi gì — phải có test.
- Chuỗi `wght@300..700` có mặt trong `base.css`. Thiếu nó thì Variable Font Hover chết lặng, trang vẫn trông bình thường.

**Test facet bị xoá cùng hàm.** Theo §7.3, `facetCounts()`, `shouldRenderFacets()`, `facetBarHtml()` và mọi test canh chúng đều bị xoá. Đây là lần duy nhất trong plan được phép xoá test — vì thứ nó canh không còn tồn tại, không phải vì nó bất tiện.

---

## 10. Rủi ro

### 10.1 Mới, sinh ra từ thiết kế này

**53 SKU không có đường duyệt trong site — rủi ro đã chấp nhận.** Trang chủ hiện 12 SKU và theme không có trang collection, nên 53 SKU còn lại chỉ tới được bằng URL trực tiếp tới `product.html?sku=...`. Phương án nav-mở-full-tại-chỗ và phương án trang collection riêng đều đã được trình bày kèm đánh đổi; chủ store chọn phương án này ngày 02/10/2026. Ghi lại để sau này không ai tưởng đây là sơ suất.

Hệ quả kéo theo, cần biết trước khi mở bán: 53 SKU đó không có đường nội bộ nào trỏ tới, nên công cụ tìm kiếm khó khám phá ra chúng. Spec 29/09 đặt cược vào `SEO Title` mang tên đội đầy đủ để truy vấn kiểu "Cowboys tumbler" đáp thẳng xuống PDP — cược đó giờ là **đường duy nhất** tới 53 SKU, không còn là đường dự phòng. Và gap §8.3 mục 2 ghi `SEO Description` đang trống 100%.

**Ba ảnh `01` của dòng Shoes không qua gate §5.2 — rủi ro đã chấp nhận.** Cả `SNK-20260923-XI-009`, `-010` và `-011` đều có logo đăng ký của đội phóng lớn làm tranh tường ở hậu cảnh; `XI-009` còn thêm biển `EST. 1946`. Đây đúng loại vi phạm spec 01/10 §8.2 nêu đích danh. Dòng này chỉ có ba SKU nên không thay được, và lối thoát `NO_SWAP` không dùng được vì nó xử lý chiều `01` sạch / `02` dính, còn đây là chiều ngược lại.

Ảnh `02` **và** `03` của cả ba đều sạch, nên phương án gỡ tồn tại và rẻ: thêm một map `PRIMARY_INDEX` cạnh `NO_SWAP` để thẻ chọn ảnh chính khác `01`. Phương án đó cùng phương án bỏ hẳn dải Shoes đều đã được trình bày kèm đánh đổi; chủ store chọn **giữ nguyên ảnh `01`** ngày 03/10/2026. Ghi lại để sau này không ai tưởng đây là sơ suất, và để ai muốn đảo quyết định thì biết đúng một map là đủ.

**Tên giải và tên đội nằm trong đường dẫn ảnh — gap chặn launch, chưa lấp.** 59 trên 65 SKU có đường dẫn ảnh dạng `/products/Backpack/NFL/NFL-Dallas-Cowboys/...`, và đường dẫn đó đi thẳng vào thuộc tính `src` của HTML trang chủ lẫn PDP. Sáu SKU sạch là đúng sáu tumbler `Halloween-General` (`TUM-20260923-XI-001` tới `-006`), và **không SKU nào trong số đó nằm trong danh sách 12 SKU tuyển tay** — nên con số thật ở mặt tiền là **12 trên 12**, không phải một phần.

Việc này phá đúng ranh giới IP mà spec 29/09 §8.5 và spec 01/10 §6 dựng lên. Hai spec đó quy định tên giải không được xuất hiện ở lớp brand và lớp điều hướng; một `src` hiển thị trong DOM, trong view-source, trong tab Network và trong log server là lớp điều hướng theo mọi nghĩa dùng được.

`copy-guard.test.mjs` **không** bắt được chuyện này: nó quét file nguồn của theme (`.html`, `.js`, `.mjs`, `.css`), còn các URL này sinh ra lúc chạy từ `products.json` — dữ liệu, không phải mã. Test đi qua trong khi vấn đề vẫn còn nguyên. Đó là lý do §9 có thêm một test ghi nhận hiện trạng chốt con số 59; test đó vỡ khi ai đó đổi cấu trúc thư mục ảnh, và buộc người đổi quay lại cập nhật mục này.

Chủ store quyết **không xử trong redesign này** ngày 03/10/2026: vấn đề có từ trước, nằm ngoài phạm vi trang chủ, và phải sửa một lần cho cả store — đổi tên thư mục thì phải chạy lại `scripts/build-products.mjs` và di chuyển 324 file ảnh. Nhưng nó vẫn là **gap chặn launch**, không phải nợ kỹ thuật chấp nhận được lâu dài.

**Pool hero chỉ 3 frame, không dư.** Một frame nữa bị loại vì lý do gì đó thì carousel còn 2, mỏng tới mức khó gọi là carousel. Không có nguồn thay thế trong vùng sạch IP.

**Danh sách 12 SKU là điểm đơn lẻ dễ hỏng.** Nó vừa là gian hàng, vừa là kết quả kiểm duyệt IP. Sửa ẩu một dòng trong đó là vừa đổi mặt tiền vừa có thể đưa ảnh chưa soi lên trang. Test §9 canh số lượng và sự tồn tại của SKU, nhưng **không** canh được ảnh có sạch hay không — cái đó chỉ mắt người làm được.

**Tên thư mục `light-minimal` không còn mô tả nội dung.** Nợ kỹ thuật đã biết, chủ store chọn có ý thức.

**Vàng brand bò sang chỗ cấm.** Hàng rào là test §9, không phải kỷ luật người viết.

### 10.2 Kế thừa, chưa mục nào được lấp

Toàn bộ §8.1, §8.2, §8.3, §8.4 của spec 01/10 giữ nguyên hiệu lực **ở cấp store**. Hai gap đầu đang được lấp dần ở cấp trang chủ:

- §4.1 đã soi 6 ảnh hero.
- §5.2 đã soi thêm 24 ảnh của 12 SKU tuyển tay (03/10/2026), kết quả đầy đủ ở bảng trong mục đó.

Tổng cộng 30 ảnh sau khi làm xong. Còn **294 ảnh chưa ai nhìn** — chúng vẫn sống ở `product.html`, nơi gallery render đủ 5 ảnh của SKU bất kỳ. Trang chủ sạch không làm store sạch.

Khác với dự đoán ban đầu, redesign này **giảm** phơi nhiễm §8.2 ở trang chủ chứ không tăng: bản hiện tại đổ 65 ảnh `01` chưa soi lên lưới, bản mới chỉ hiện 24 ảnh đã soi cả watermark lẫn logo đội. Đó là tác dụng phụ ngoài ý muốn của quyết định "chỉ 12 SKU", và là lý do mạnh nhất bênh cho quyết định đó.

---

## 11. Checklist trước khi gọi là xong

- [ ] Soi đủ 24 ảnh (`01` + `02` của 12 SKU tuyển tay), tìm **cả** `AURA TUMBLER` **và** logo/tên đội; ghi kết quả vào §5.2
- [ ] SKU có ảnh dính → đổi sang SKU khác cùng dòng; chỉ dùng lối thoát tắt-swap khi dòng đó không đủ 3 SKU sạch
- [ ] Danh sách 12 SKU: đúng 3 mỗi dòng, phủ cả Gothic Jewel lẫn Holiday Ornament ở dòng Tumbler, màu không đụng nhau trong một dải
- [ ] `typeNav` và `footerNav` neo cuộn tới `id` có thật; bấm cả hai đều nhảy đúng chỗ
- [ ] `base.css` nạp `wght@300..700`, không phải `wght@400;600` — nếu không Variable Font Hover chết lặng
- [ ] Vertical Cut Reveal: thẻ bọc có `aria-label` nguyên câu, `<span>` con `aria-hidden="true"`; tắt JS vẫn đọc được H1
- [ ] Carousel: nút tạm dừng hiện rõ, có nhãn chữ, là `<button>`
- [ ] Carousel: `prefers-reduced-motion` tắt autoplay + Ken Burns + crossfade, nút vẫn dùng được
- [ ] Carousel: focus không bị bẫy; `aria-current` trên chấm; chấm dùng `--accent`
- [ ] `.reveal` mặc định `opacity: 1`; Firefox (không `animation-timeline`) hiện đủ nội dung
- [ ] `#C9A227` xuất hiện đúng 1 lần; mọi `var(--gold)` nằm trong khai báo `border`
- [ ] Không `box-shadow` hardcode ngoài `tokens.css`
- [ ] Viền ảnh vẫn tách được 11 ảnh cap nền marble khỏi nền trắng — kiểm bằng mắt, không chỉ bằng số
- [ ] `--radius: 0` toàn theme, kể cả thẻ và nút carousel
- [ ] Path asset tuyệt đối ở **cả** `index.html` **và** `product.html`; thử lại bằng `npx serve` để xác nhận clean-URL không làm trắng trang
- [ ] 4 test viết lại xanh; 5 test contrast + chặn copy + chặn tên giải vẫn xanh, không bị nới
- [ ] Responsive 375 / 768 / 1024 / 1440
- [ ] Chạy thật qua HTTP server, 0 lỗi console, 0 request 404
