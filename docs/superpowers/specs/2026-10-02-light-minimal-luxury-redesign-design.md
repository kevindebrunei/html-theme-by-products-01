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

Những gì **không** đổi, và phải chủ động giữ:

- `--radius: 0`. Góc vuông đọc đắt tiền hơn bo tròn ở hạng editorial. Giữ vì nó đúng, không phải vì Swiss bắt.
- Viền ảnh `1px solid #8A7C62`. Lý do ở §3.3 — nó mạnh hơn trên nền trắng chứ không yếu đi.
- Toàn bộ ranh giới IP: không tên giải ở nav/URL/alt/meta, không motif `EST.` ở lớp brand, màu đội chỉ sống trong ảnh.
- Bộ chặn copy §8.5 spec 29/09. **Không nới một cụm nào.**
- Facet theo họ style, không theo giải. Logic `catalog.mjs` giữ nguyên hoàn toàn.
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

Ảnh `02` của 65 SKU **chưa ai soi**. Trước khi bật tính năng này phải soi đủ 65 ảnh tìm `AURA TUMBLER`.

- SKU nào dính → **tắt swap riêng cho thẻ đó**, thẻ giữ một ảnh. Không xoá ảnh.

**Cờ đó để ở đâu — quan trọng.** `products/products.json` **là file sinh ra** bởi `scripts/build-products.mjs` từ CSV Shopify. Sửa tay vào đó sẽ bị ghi đè ở lần build kế tiếp và không ai nhận ra. Cờ phải nằm trong mã theme: một hằng số dạng `Set` các SKU bị loại, đặt trong `assets/catalog.mjs`, kèm chú thích ngày soi. Nó là kết quả kiểm duyệt của theme, không phải dữ liệu sản phẩm — để đúng chỗ thì test canh được và rebuild không xoá mất.
- Nếu tỉ lệ dính cao như mẫu hero (3/6), tính năng này mất phần lớn giá trị — lúc đó phải báo lại trước khi làm tiếp, không âm thầm bật cho số còn lại.

Kết quả soi phải ghi vào spec này, không để trong đầu người làm.

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
4. **Lưới sản phẩm có facet** — logic `catalog.mjs` nguyên vẹn, thị giác mới theo §3.1.
5. **Footer** — giữ nguyên.

**Không** có editorial band, **không** có mosaic — đã cân nhắc và loại ở brainstorm.

**Không** render `What you're actually holding` và `The Pair`. Hai khối này chặn bởi gap §8.3 spec 01/10 (thiếu `Product Details`, `Care` cho 43 tumbler) và chưa mục nào được lấp. Dựng khối rỗng chỉ để trang dài hơn là tự lừa mình.

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

---

## 10. Rủi ro

### 10.1 Mới, sinh ra từ thiết kế này

**Pool hero chỉ 3 frame, không dư.** Một frame nữa bị loại vì lý do gì đó thì carousel còn 2, mỏng tới mức khó gọi là carousel. Không có nguồn thay thế trong vùng sạch IP.

**Ảnh 02 chưa soi.** §5.2 đã đặt gate chặn. Rủi ro là tính năng hover-swap chết sau khi soi xong — chấp nhận được vì gate chặn trước khi code chạy ra production, không phải sau.

**Tên thư mục `light-minimal` không còn mô tả nội dung.** Nợ kỹ thuật đã biết, chủ store chọn có ý thức.

**Vàng brand bò sang chỗ cấm.** Hàng rào là test §9, không phải kỷ luật người viết.

### 10.2 Kế thừa, chưa mục nào được lấp

Toàn bộ §8.1, §8.2, §8.3, §8.4 của spec 01/10 giữ nguyên hiệu lực. Riêng §8.1 vừa được lấp một phần bởi §4.1 ở trên — 6/324 ảnh đã soi. Còn 318 ảnh.

Nhấn lại §8.2 vì redesign này làm nó **nặng thêm**: hover-swap đưa thêm tối đa 65 ảnh lên trang chủ, mỗi ảnh là một khả năng lộ logo đội hoặc tên đội đầy đủ ở hậu cảnh. Gate §5.2 soi watermark `AURA TUMBLER`; nó **không** soi logo đội. Phải soi cả hai trong cùng một lượt.

---

## 11. Checklist trước khi gọi là xong

- [ ] Soi đủ 65 ảnh `02`, tìm **cả** `AURA TUMBLER` **và** logo/tên đội; ghi kết quả vào §5.2
- [ ] SKU dính → tắt swap riêng thẻ đó, không xoá ảnh
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
