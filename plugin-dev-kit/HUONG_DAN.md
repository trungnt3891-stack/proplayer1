# 🛠️ VAAPP Plugin Developer Kit

## App Hoạt Động Như Nào?

VAAPP là một **trình vỏ (Shell)** — nó chỉ lo UI và Player. Toàn bộ nội dung phim/truyện được cung cấp qua **Plugin JS** do bạn viết.

### Luồng Dữ Liệu Chi Tiết

```
NGƯỜI DÙNG bấm vào mục "Hành Động" trên Trang chủ
        │
        ▼
┌─ APP gọi: getUrlList("hanh-dong", '{"page":1}') ─────────────────┐
│  Plugin trả: "https://phim.com/the-loai/hanh-dong?page=1"        │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ APP tự fetch HTTP GET url đó ────────────────────────────────────┐
│  Nhận toàn bộ HTML/JSON thô từ server                             │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ APP gọi: parseListResponse(html) ────────────────────────────────┐
│  Plugin parse HTML → trả JSON: { items: [{id, title, poster}...]} │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ APP render danh sách phim lên UI ────────────────────────────────┐
│  Người dùng bấm vào 1 phim → Lặp lại chu trình với Detail/Play   │
└───────────────────────────────────────────────────────────────────┘
```

### Luồng Xem Phim (Chi Tiết → Player)

```
Bước 1: parseMovieDetail(html)
   → Trả servers + episodes (mỗi episode có id = URL hoặc slug)

Bước 2: Người dùng chọn tập
   → App gọi getUrlDetail(episode.id) để lấy URL fetch
   → App fetch URL → gọi parseDetailResponse(html)

Bước 3: parseDetailResponse(html)
   → Trả { url, headers, mimeType, subtitles }

Bước 4:
   ├─ Nếu isEmbed = false → ExoPlayer phát url trực tiếp
   ├─ Nếu isEmbed = true  → App fetch tiếp → gọi parseEmbedResponse()
   │                        (lặp tối đa 3 lần cho đến khi isEmbed = false)
   └─ Nếu playerType = "embed" → WebView load url
```

---

## 🚀 Bắt Đầu Nhanh (3 Bước)

### Bước 1: Tạo Plugin
Copy file `plugin_template.js` → đổi tên `ten_web_plugin.js`, bắt đầu viết code.

### Bước 2: Test Trên Máy Tính
Mở file **`tester.html`** bằng Chrome:
1. **Nạp JS**: Bấm "Nạp file JS" → chọn file plugin của bạn
2. **Dán HTML**: Mở trang phim → Ctrl+U (View Source) → copy dán vào ô input
3. **Chạy thử**: Bấm các nút `parseListResponse()`, `parseMovieDetail()`...
4. **Xem kết quả**: Xanh = JSON chuẩn ✅ | Đỏ = lỗi cần sửa ❌

### Bước 3: Đăng Ký
Upload file `.js` lên GitHub Raw → thêm vào `plugins.json` → App tự cập nhật.

### ⚠️ Lưu Ý Quan Trọng Khi Phát Hành Plugin (Mới)

#### 1. Bắt Buộc Sử Dụng Link RAW
Khi đăng ký plugin trên file JSON hoặc thêm nguồn tùy chỉnh, đường dẫn file JS **bắt buộc phải là đường dẫn RAW** trả về code JavaScript thô.
*   **Sai:** `https://github.com/user/repo/blob/main/plugin.js` (Trả về giao diện web HTML của GitHub).
*   **Đúng:** `https://raw.githubusercontent.com/user/repo/main/plugin.js` (Trả về code JS thô).
*   *Lưu ý:* Nếu dùng sai link, App tải về file HTML sẽ không tìm thấy manifest và sẽ báo lỗi **`❌ File không hợp lệ`** hoặc **`❌ File lỗi`** ngay khi cài đặt.

#### 2. Dung Thứ Dấu Phẩy Thừa (Trailing Comma)
*   Từ phiên bản ứng dụng **1.7.5**, bộ phân tích cú pháp JSON của App đã được bật thuộc tính `allowTrailingComma = true`.
*   Nếu bạn lỡ tay viết thừa dấu phẩy ở phần tử cuối cùng của object/mảng trong JSON trả về (ví dụ: `{"id": "test", "name": "Test",}`), ứng dụng vẫn sẽ tự động bỏ qua và nạp plugin bình thường thay vì crash/báo lỗi như trước.
*   *Lời khuyên:* Mặc dù ứng dụng có cơ chế tự động dung thứ, bạn vẫn nên viết đúng chuẩn JSON chuẩn chỉ để đảm bảo khả năng tương thích cao nhất trên mọi nền tảng kiểm thử.

---

## 📋 Danh Sách Tất Cả Các Hàm

### Nhóm 1: Config (Khai báo)

| Hàm | Trả về | Bắt buộc |
|-----|--------|----------|
| `getManifest()` | Thông tin plugin | ✅ |
| `getHomeSections()` | Các mục trang chủ | ✅ |
| `getPrimaryCategories()` | Menu thể loại | Tùy chọn |
| `getFilterConfig()` | Bộ lọc | Tùy chọn |

### Nhóm 2: URL (Sinh đường dẫn)

| Hàm | Tham số | Trả về |
|-----|---------|--------|
| `getUrlList(slug, filtersJson)` | slug mục + filters | URL string |
| `getUrlSearch(keyword, filtersJson)` | từ khóa | URL string |
| `getUrlDetail(slug)` | slug phim | URL string |
| `getUrlCategories()` | — | URL string |

### Nhóm 3: Parser (Xử lý dữ liệu) ⭐

| Hàm | Nhận vào | Trả về |
|-----|----------|--------|
| `parseListResponse(html)` | HTML/JSON thô | `{ items: [...], pagination: {...} }` |
| `parseSearchResponse(html)` | HTML/JSON thô | Giống parseListResponse |
| `parseMovieDetail(html)` | HTML chi tiết | `{ id, title, servers: [...], ... }` |
| `parseDetailResponse(html)` | HTML trang xem | `{ url, headers, mimeType, ... }` |
| `parseEmbedResponse(html, url)` | HTML embed page | `{ url, isEmbed, mimeType, ... }` |

---

## 📐 Data Format Chi Tiết

### `getManifest()` — Thông tin Plugin

```json
{
    "id": "unique_id",
    "name": "Tên Hiển Thị",
    "version": "1.0.0",
    "baseUrl": "https://phim.example.com",
    "iconUrl": "https://icon.png",
    "isEnabled": true,
    "isAdult": false,
    "type": "MOVIE",
    "layoutType": "VERTICAL",
    "playerType": "exoplayer",
    "adblock": true
}
```

**`adblock` option (Bật/Tắt chặn quảng cáo nền):**
- **Không khai báo** (hoặc `true`): Mặc định **BẬT** bộ chặn quảng cáo nền cho plugin này.
- **`false`**: **TẮT** bộ chặn quảng cáo mặc định cho plugin này.

**`type` options:**
| Giá trị | Loại nội dung & Trình phát |
|---------|----------------------------|
| `"MOVIE"` | Phim điện ảnh / Phim bộ truyền thống (Trình phát màn hình ngang) |
| `"VIDEO"` | Video clip / Youtube |
| `"shortfilm"` | Phim ngắn / Drama ngắn / Reels / Shortflix (Trình phát xoay đứng Portrait Zoom, hỗ trợ vuốt LÊN/XUỐNG chuyển tập kiểu TikTok trên Mobile) |
| `"MANGA"` | Truyện tranh (Trình đọc manga) |
| `"NOVEL"` | Truyện chữ |
| `"IPTV"` | Truyền hình trực tiếp (Bỏ qua màn hình Chi tiết, phát thẳng kênh) |

**`playerType` options:**
| Giá trị | Khi nào dùng |
|---------|-------------|
| `"exoplayer"` | Khi bạn trích được link `.m3u8` / `.mp4` trực tiếp (khuyến nghị) |
| `"embed"` | Khi chỉ có link iframe, bắt buộc hiển thị phát bằng WebView |
| `"embedtoexoplay"` | Tải iframe qua WebView ngầm và chạy bộ dò mạng (Sniffer) để lấy link stream phát bằng ExoPlayer |
| `"auto"` | App tự phán: URL chứa `.m3u8`/`.mp4` → ExoPlayer, còn lại → WebView |

---

### `parseListResponse()` — Danh sách phim

```json
{
    "items": [
        {
            "id": "slug-phim",
            "title": "Tên Phim",
            "posterUrl": "https://img.../poster.jpg",
            "backdropUrl": "https://img.../backdrop.jpg",
            "description": "Mô tả ngắn",
            "year": 2024,
            "quality": "FHD",
            "episode_current": "Tập 10/12",
            "lang": "Vietsub"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 100,
        "itemsPerPage": 20
    }
}
```

---

### `parseMovieDetail()` — Chi tiết phim

```json
{
    "id": "slug-phim",
    "title": "Tên Phim",
    "posterUrl": "https://...",
    "backdropUrl": "https://...",
    "description": "Nội dung phim...",
    "servers": [
        {
            "name": "Server HD",
            "episodes": [
                {
                    "id": "https://phim.com/xem/tap-1",
                    "name": "Tập 1",
                    "slug": "tap-1"
                }
            ]
        }
    ],
    "quality": "FHD",
    "year": 2024,
    "rating": 8.5,
    "casts": "Diễn viên A, B",
    "director": "Đạo diễn C",
    "category": "Hành Động, Phiêu Lưu",
    "status": "Full",
    "duration": "120 Phút"
}
```

**🔑 Về `episode.id`:**
- Nếu là link `.m3u8`/`.mp4` trực tiếp → App phát luôn, KHÔNG gọi `parseDetailResponse`
- Nếu là slug/URL khác → App gọi `getUrlDetail(episode.id)` → fetch → `parseDetailResponse(html)`

---

### `parseDetailResponse()` — Lấy Link Video

#### Trường hợp đơn giản (link trực tiếp):
```json
{
    "url": "https://cdn.example.com/video.m3u8",
    "headers": {
        "Referer": "https://phim.example.com"
    },
    "subtitles": [
        { "lang": "vi", "url": "https://.../sub_vi.srt" }
    ]
}
```

#### Trường hợp embed (cần WebView):
```json
{
    "url": "https://player.example.com/embed/abc123",
    "headers": { "Referer": "https://phim.example.com" }
}
```

#### Trường hợp nâng cao — Recursive Embed:
```json
{
    "url": "https://site.com/ajax.php",
    "isEmbed": true,
    "postBody": "id=12345&sv=1",
    "headers": {
        "Referer": "https://site.com",
        "X-Requested-With": "XMLHttpRequest"
    }
}
```

#### 💡 QUY TẮC XỬ LÝ ĐUÔI FILE KHÔNG CHUẨN (`.vl`, `.xyz`, `.stream`...) & MIME TYPE:
Khi trang web sử dụng link stream có đuôi mở rộng lạ (ví dụ: luồng HLS m3u8 nhưng trang web đặt đuôi file là `.vl`, `.m3u`, `.xyz`, `.stream`...), Plugin **KHÔNG CẦN YÊU CẦU SỬA APP**, chỉ cần khai báo chuẩn 1 trong 2 cách sau:

1. **Khai báo `mimeType` trực tiếp khi trả về link**:
   ```json
   {
       "url": "https://play.vlstream.net/hls/video_sample.vl",
       "isEmbed": false,
       "mimeType": "application/x-mpegURL",
       "headers": { "Referer": "https://play.vlstream.net/" }
   }
   ```
   *Các kiểu `mimeType` phổ biến:*
   - HLS m3u8 (kể cả bị đổi đuôi thành `.vl`, `.xyz`): `"application/x-mpegURL"`
   - Video MP4: `"video/mp4"`
   - DASH stream: `"application/dash+xml"`

2. **Khai báo `Stream-Regex` khi dùng WebView ngầm (`isEmbed: true`)**:
   ```json
   {
       "url": "https://embed.site.com/player/123",
       "isEmbed": true,
       "headers": {
           "Stream-Regex": "https?:\\/\\/[^\"']+\\.(?:vl|m3u8|xyz)[^\"']*"
       }
   }
   ```
   👉 *App Core sẽ ưu tiên 100% `mimeType` và `Stream-Regex` do plugin định nghĩa để phát video mà không cần quan tâm đuôi file.*
App sẽ POST tới URL đó → nhận response → gọi `parseEmbedResponse(html, url)` → lặp lại nếu `isEmbed` vẫn = `true`.

---

### 🎬 Chế Độ `embedtoexoplay` & EmbedSniffer (Nâng Cao)

Khi plugin khai báo `"playerType": "embedtoexoplay"` trong `getManifest()`, ứng dụng sẽ dùng **EmbedSniffer** (WebView chạy ngầm với màn hình Loading đen che bên trên) để tải trang web embed, tự động dò tìm link stream (.m3u8, .mp4, ...) và chuyển cho ExoPlayer phát native. Người dùng sẽ không nhìn thấy giao diện thô hay quảng cáo của trang web embed.

| Header Key | Mục đích | Ví dụ |
|------------|----------|-------|
| `Block-Ads` | Khóa điều khiển chặn quảng cáo Custom riêng cho link này. Nếu Manifest để `adblock: false`, bạn truyền `"Block-Ads": "true"` kết hợp với `Block-Domains`/`Block-Keywords` để CHỈ chặn các domain tùy biến do plugin chỉ định (TÁCH BẠCH, KHÔNG chặn 58+ domain mặc định của App). | `"true"` hoặc `"false"` |
| `Block-Redirects` | Bật/Tắt chặn chuyển hướng main frame khi click (`"true"` = bật chặn, `"false"` = cho phép). Mặc định `"true"` khi `Block-Ads: true`. | `"true"` hoặc `"false"` |
| `Block-Domains` | Danh sách tên miền quảng cáo bổ sung do Plugin tự định nghĩa (phân cách bằng dấu phẩy) | `"bad-domain.com, ad-server.net"` |
| `Block-Keywords` | Danh sách từ khóa URL quảng cáo bổ sung do Plugin tự định nghĩa (phân cách bằng dấu phẩy) | `"/popunder, /popup.js"` |
| `Block-Css` | Chuỗi CSS Selectors bổ sung do Plugin tự định nghĩa để ẩn các phần tử/thẻ div quảng cáo cụ thể | `".my-ad-banner, #popunder-layer, div[class*='custom-ad']"` |
| `Block-Scripts` | Danh sách từ khóa/mẫu đường dẫn script cần chặn trong WebView (phân cách bằng dấu phẩy) | `"adsterra,popads,clickadu"` |
| `Custom-Js` | Chuỗi JavaScript được inject vào WebView **ngay khi bắt đầu tải trang** (`onPageStarted` — trước khi script của web gốc chạy). Có thể chủ động trích xuất link và gọi `SnifferBridge.play(url, headers)` | `"(function() { SnifferBridge.play(url); })();"` |
| `Stream-Regex` | Chuỗi RegEx tùy chỉnh để EmbedSniffer lọc bắt link mạng thay cho mẫu mặc định (.m3u8, .mp4...) | `"https?:\\/\\/[^\"'\\s]+\\/index\\.m3u8"` |
| `User-Agent` | Đặt User-Agent cho WebView | `"Mozilla/5.0 ..."` |
| `Referer` | Đặt Referer cho WebView | `"https://site.com/"` |

> ℹ️ **LƯU Ý VỀ ANTI-AD CSS TỰ ĐỘNG:**
> Khi `Block-Ads: true`, App đã tự động áp dụng bộ quy tắc CSS tổng quát để diệt toàn bộ thẻ `div`, `iframe`, `a`, `popunder` quảng cáo:
> ```css
> iframe[src*="ad"], iframe[src*="pop"], iframe[src*="banner"],
> div[class*="ad-"], div[class*="ad_"], div[id*="ad-"], div[id*="ad_"],
> div[class*="banner"], div[id*="banner"], div[class*="popup"], div[id*="popup"],
> div[class*="popunder"], div[id*="popunder"],
> div[style*="z-index: 2147483647"]:not(.jw-controls):not(.plyr__controls),
> div[style*="z-index: 999999"]:not(.jw-controls):not(.plyr__controls),
> a[href*="bet"], a[href*="casino"], a[href*="click"],
> .popunder, .popup, .ad-box, .ad-container, .adsbygoogle
> ```
> Dev Plugin chỉ cần khai báo thêm thuộc tính `Block-Css` nếu trang web đó sử dụng class/id quảng cáo đặc thù.

---

### 🌉 Danh Sách Các Hàm Native JS Bridge (`SnifferBridge`)

Khi viết `Custom-Js` hoặc mã xử lý trong WebView, plugin có thể sử dụng các hàm Native của **`SnifferBridge`** để chủ động truyền link stream và Header cho ExoPlayer phát:

| Hàm Native | Tham số | Mô tả |
|------------|---------|-------|
| `SnifferBridge.play(url)` | `url`: String | Truyền link stream trực tiếp cho ExoPlayer phát |
| `SnifferBridge.play(url, headersJson)` | `url`: String, `headersJson`: JSON String | Truyền link stream kèm Header tùy chỉnh (ví dụ: `Referer`, `User-Agent`) |
| `SnifferBridge.playVideo(url, headersJson)` | Bí danh | Giống `play()` |
| `SnifferBridge.playExoPlayer(url, headersJson)` | Bí danh | Giống `play()` |
| `SnifferBridge.sendToPlayer(url, headersJson)` | Bí danh | Giống `play()` |
| `SnifferBridge.toast(message)` | `message`: String | 💡 **Hiển thị thông báo Toast nổi trên màn hình App** (Rất hữu ích khi debug WebView ngầm/embed) |
| `SnifferBridge.log(message)` | `message`: String | 📝 **Ghi log debug ra Android Logcat** (Tag: `SnifferBridgeJS`) |
| `SnifferBridge.onVideoDetected(url)` | `url`: String | Hàm callback cũ (tương thích ngược) |

### 🛠️ Hướng Dẫn Debug Log, Hàm `print()` & Khung Console Nổi (Dành Cho Dev Plugin Local)

Dành riêng cho các **Plugin cài đặt trực tiếp từ file `.js` qua nút dấu (`+`)** trong màn hình Quản lý Plugin:

#### 1. Trong hàm xử lý dữ liệu của file JS (Engine QuickJS):
*(Các hàm `parseDetailResponse`, `parseListResponse`, `parseSearchResponse`...)*
Bạn có thể in bất kỳ giá trị, biến, JSON object hoặc lỗi nào trực tiếp bằng cách gọi `print(...)` hoặc `console.log(...)`:
```javascript
// In dữ liệu hoặc JSON Object
print("Dữ liệu bóc tách được:", result);
print("Link stream:", streamUrl);

// Hoặc dùng console.log chuẩn
console.log("Chiều dài HTML:", html.length);
```

#### 🛠️ Hỗ trợ `localStorage` sẵn trong QuickJS Engine:
- Bạn có thể sử dụng các hàm `localStorage.getItem(key)`, `localStorage.setItem(key, value)`, `localStorage.removeItem(key)` trực tiếp trong file JS mà không lo bị lỗi `ReferenceError: localStorage is not defined`.

#### 2. Trong mã `Custom-Js` chèn vào WebView (`embedtoexoplay`):
*(Đoạn JS chạy ngầm bên trong WebView)*
Gửi log trực tiếp từ WebView về Khung Console Nổi bằng `SnifferBridge.log(...)` hoặc `SnifferBridge.toast(...)`:
```javascript
(function() {
    try {
        var video = document.querySelector('video');
        if (video && video.src) {
            // In log ra Khung Console Nổi
            if (window.SnifferBridge) window.SnifferBridge.log("Đã bắt được link video: " + video.src);
            // Truyền link cho ExoPlayer phát
            if (window.SnifferBridge) window.SnifferBridge.play(video.src);
        } else {
            if (window.SnifferBridge) window.SnifferBridge.log("Đang chờ thẻ video xuất hiện...");
        }
    } catch (err) {
        // In lỗi nếu bị crash script trong WebView
        if (window.SnifferBridge) window.SnifferBridge.log("Lỗi CustomJS: " + err.message);
    }
})();
```

#### 3. Khung Nổi Toast Console (Có thể Sao Chép 1 Động Tác 📋):
- Khi bạn chạy bất kỳ hàm nào của plugin local cài từ nút `+`, App sẽ **tự động bật một Khung Nổi Console (Toast Console Overlay)** đè lên góc dưới màn hình.
- Khung này hiển thị thời gian, loại log (`[PRINT]`, `[LOG]`, `[ERROR]`, `[TOAST]`) và nội dung chi tiết.
- Trên thanh công cụ của Khung Nổi có **Nút Sao Chép (📋)**: Chỉ cần bấm 1 phát là **toàn bộ dữ liệu log/lỗi được chép vào Clipboard** để bạn dán sang chỗ khác kiểm tra cực kỳ nhanh chóng mà không cần mở Chrome DevTools hay máy tính!
- **Lỗi Cú Pháp & Exception Tự Động**: Nếu mã JS hoặc `Custom-Js` bị lỗi cú pháp (`SyntaxError`) hay exception, App sẽ tự động hiển thị dòng màu đỏ `[ERROR]` kèm chi tiết lỗi lên Khung Nổi ngay lập tức!

---

#### Ví dụ ĐẦY ĐỦ VỚI TOÀN BỘ DANH SÁCH TÊN MIỀN, KEYWORD & CSS SELECTORS:
```javascript
function parseDetailResponse(html, url) {
    var customJsCode = `(function() {
        if (window._vaapp_custom) return;
        window._vaapp_custom = true;
        
        var v = document.querySelector('video');
        if (v && v.src && v.src.indexOf('http') === 0) {
            var headers = JSON.stringify({
                "Referer": "https://embed18.streamc.xyz/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            });
            SnifferBridge.play(v.src, headers);
        }
    })();`;

    return JSON.stringify({
        "url": "https://embed18.streamc.xyz/embed.php?hash=c9e5230c3e65847df88fc05ea66cbbb6",
        "isEmbed": true,
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://embed18.streamc.xyz",
            
            // 🛡️ 1. BẬT BỘ CHẶN QUẢNG CÁO TỔNG THỂ
            "Block-Ads": "true",

            // 🛑 2. BẬT CHẶN CHUYỂN HƯỚNG MAIN FRAME KHI CLICK
            "Block-Redirects": "true",

            // 🌐 3. CHẶN MẠNG CẤP THẤP: TOÀN BỘ TÊN MIỀN QUẢNG CÁO / CASINO / BETTING (Nối dài bằng dấu phẩy)
            "Block-Domains": "googlesyndication.com, doubleclick.net, googleadservices.com, adnxs.com, imasdk.googleapis.com, popads.net, popcash.net, propellerads.com, exoclick.com, acscdn.com, attirecideryeah.com, trafficjunky.com, juicyads.com, bidvertiser.com, clickadu.com, pubmatic.com, rubiconproject.com, openx.net, casalemedia.com, smartadserver.com, criteo.com, taboola.com, outbrain.com, adroll.com, scorecardresearch.com, zedo.com, adstir.com, popmyads.com, adsterra.com, hilltopads.com, monetag.com, a-ads.com, clksite.com, ad-delivery.net, ad-maven.com, yandex.ru/ads, vidoomy.com, targetfirst.com, betting, casino, gamead, adtrace, adform, adservice, adsystem, adtech, adthrive, adtrqt, adzerk, amazon-adsystem, applovin, unity3d.com/ads, chartboost, inmobi, fyber, tapjoy, vungle, adcolony, mopub",

            // 🔍 4. CHẶN KEYWORD URL SCRIPT QUẢNG CÁO / VAST XML / POPUP
            "Block-Keywords": "/adserv/, /adstream/, /popunder, /popup.js, /ads.js, ad_provider, pop_under, pop_up, vast.xml, vpaid.js, ads/vpaid, bidder, tracking.js, analytics.js, banner.js, adserver, ad_script, ad_loader",

            // 🧹 5. ANTI-AD CSS: ẨN TOÀN BỘ THẺ DIV, IFRAME, POPUP, BANNER VÀ VỚI LỚP PHỦ Z-INDEX CỦA WEB NÀY
            "Block-Css": "iframe[src*='ad'], iframe[src*='pop'], iframe[src*='banner'], div[class*='ad-'], div[class*='ad_'], div[id*='ad-'], div[id*='ad_'], div[class*='banner'], div[id*='banner'], div[class*='popup'], div[id*='popup'], div[class*='popunder'], div[id*='popunder'], div[style*='z-index: 2147483647']:not(.jw-controls):not(.plyr__controls), div[style*='z-index: 999999']:not(.jw-controls):not(.plyr__controls), a[href*='bet'], a[href*='casino'], a[href*='click'], .popunder, .popup, .ad-box, .ad-container, .adsbygoogle",

            // 🚫 6. CHẶN SCRIPT RIÊNG DO DEV CHỈ ĐỊNH
            "Block-Scripts": "popads,exoclick,adsterra,clickadu",

            "Custom-Js": customJsCode
        }
    });
}
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ `Custom-Js`:**
> 1. `Custom-Js` được tự động chèn **sớm ở `onPageStarted`** (trước khi các đoạn script HTML của trang web gốc được thực thi). Nếu script của bạn muốn đợi DOM tải xong, hãy dùng `document.addEventListener("DOMContentLoaded", ...)` hoặc `if (document.readyState === "loading")`.
> 2. `Custom-Js` trong `headers` phải là một **chuỗi dạng String** chứa mã JS. KHÔNG viết IIFE trực tiếp bên ngoài hàm `parseDetailResponse` vì engine QuickJS trên Android app sẽ bị crash do không có đối tượng `window`.
> 3. `SnifferBridge.play(url, headersJson)` là hàm Bridge native của App. Ngay khi được gọi, WebView ngầm sẽ lập tức đóng lại và ExoPlayer sẽ nhận link stream để phát.

#### Ví dụ 2: Lọc link theo `Stream-Regex` tùy chỉnh & Bật AdBlock
```javascript
function parseDetailResponse(html, url) {
    return JSON.stringify({
        "url": "https://gamomephim.com/embed/123",
        "isEmbed": true,
        "headers": {
            "Block-Ads": "true",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://gamomephim.com/",
            "Stream-Regex": "https?:\\/\\/[^\"'\\s]+\\/hls\\/[^\"'\\s]+\\.m3u8"
        }
    });
}
```

---

### `parseEmbedResponse(html, url)` — Xử lý embed nhiều bước

Hàm này **chỉ cần viết** khi trang của bạn dùng luồng phức tạp (AJAX → iframe → stream). App gọi hàm này trong vòng lặp.

```javascript
function parseEmbedResponse(html, sourceUrl) {
    // Bước trung gian: HTML chứa iframe → trích URL iframe
    var iframeMatch = html.match(/src="(https?:\/\/[^"]+)"/);
    if (iframeMatch) {
        return JSON.stringify({
            url: iframeMatch[1],
            isEmbed: true,    // ← true = App sẽ fetch tiếp URL này
            headers: { "Referer": "https://site.com/" }
        });
    }
    
    // Bước cuối: trích direct stream
    var fileMatch = html.match(/"file"\s*:\s*"(https?[^"]+)"/);
    if (fileMatch) {
        return JSON.stringify({
            url: fileMatch[1],
            isEmbed: false,   // ← false = URL cuối cùng, phát luôn
            mimeType: "application/x-mpegURL",
            headers: { "Referer": "https://embed-server.com/" }
        });
    }
    
    // Không tìm thấy → dừng loop
    return JSON.stringify({ url: "", isEmbed: false });
}
```

**Quy tắc:**
- `isEmbed: true` → App fetch URL đó rồi gọi lại `parseEmbedResponse()` (tối đa 3 lần)
- `isEmbed: false` → URL cuối cùng, App phát bằng ExoPlayer
- `url: ""` → Dừng lặp, App báo lỗi

---

### Trường `mimeType` — Khi file extension không chuẩn

ExoPlayer nhận dạng stream qua extension (`.m3u8` → HLS, `.mp4` → Progressive). Nhưng nếu server dùng extension lạ (`.vl`, `.xyz`, `.dat`...), plugin cần chỉ định `mimeType`:

```json
{
    "url": "https://cdn.example.com/03105.vl",
    "mimeType": "application/x-mpegURL"
}
```

| `mimeType` | Loại stream |
|------------|------------|
| `"application/x-mpegURL"` | HLS (m3u8 content) |
| `"video/mp4"` | MP4 |
| `""` hoặc không khai | App tự nhận dạng |

> **Lợi ích**: Nếu sau này server đổi extension từ `.vl` → `.xyz`, bạn chỉ sửa plugin JS, KHÔNG cần build lại App. Tất cả do plugin quyết định.

---

### 📝 Hướng Dẫn Cấu Hình Phụ Đề (Subtitles)

Plugin có thể cung cấp danh sách phụ đề cho ExoPlayer thông qua trường `subtitles` trong `parseDetailResponse()`.

#### Cấu trúc trả về trong `parseDetailResponse()`:
```javascript
return JSON.stringify({
    "url": "https://cdn.example.com/video.m3u8",
    "headers": { "Referer": "https://example.com" },
    "subtitles": [
        {
            "lang": "Tiếng Việt (Vietsub)", // Tên hiển thị trên menu phụ đề của App
            "url": "https://cdn.example.com/sub/vietnamese.vtt" // Link WebVTT (.vtt), SubRip (.srt), hoặc ASS (.ass)
        },
        {
            "lang": "English",
            "url": "https://cdn.example.com/sub/english.vtt"
        }
    ]
});
```

#### Quy tắc xử lý phụ đề trong App:
1. **Định dạng hỗ trợ**: App hỗ trợ các file phụ đề chuẩn WebVTT (`.vtt`), SRT (`.srt`), ASS/SSA (`.ass`). App tự động bóc tách loại bỏ query string `?token=...` để nhận diện đúng định dạng.
2. **Tên hiển thị (`lang`)**: App sẽ lấy trực tiếp chuỗi trong `lang` để làm nhãn trên giao diện menu phụ đề. Nên đặt tên ngắn gọn, rõ ràng (ví dụ: `"Tiếng Việt (Bản chuẩn)"`, `"English"`).
3. **Cơ chế tương tác với SubtitleCat**:
   - Nếu plugin đã khai báo phụ đề Tiếng Việt (chuỗi `lang` chứa chữ `"Việt"` hoặc `"Vietnamese"`), App sẽ **tự động bỏ qua SubtitleCat** và ưu tiên phát phụ đề từ plugin của bạn.
   - Để tắt hoàn toàn tính năng tự động tìm phụ đề ngoài SubtitleCat cho plugin, bạn chỉ cần đặt `"subtitleCat": false` trong `getManifest()`.

---

### 📺 Hướng Dẫn Viết Plugin Truyền Hình / IPTV (`"type": "IPTV"`)

Khi bạn viết plugin cho các nguồn kênh truyền hình trực tiếp (Live TV / IPTV), khai báo `"type": "IPTV"` giúp tối ưu hóa luồng xem cho người dùng.

#### Đặc điểm của Plugin IPTV trong App:
- Khi người dùng bấm chọn kênh từ danh sách, App sẽ **bỏ qua giao diện chi tiết (Detail Screen)** và giải mã link stream để **phát trực tiếp ngay lập tức** bằng ExoPlayer.
- Hỗ trợ đầy đủ các nguồn trực tiếp: HLS (`.m3u8`), DASH (`.mpd`), MP4, và mã hóa bản quyền **ClearKey DRM**.

#### 1. Khai báo Manifest:
```javascript
function getManifest() {
    return JSON.stringify({
        "id": "onsports_tv",
        "name": "Kênh Truyền Hình Thể Thao",
        "version": "1.0.0",
        "baseUrl": "https://onsports.vn",
        "type": "IPTV",             // ⭐ Đánh dấu plugin loại IPTV
        "playerType": "exoplayer"   // Khuyến nghị dùng exoplayer
    });
}
```

#### 2. Trả về luồng phát Kênh trực tiếp trong `parseDetailResponse()`:

- **Dạng HLS (.m3u8) / MP4 thông thường**:
```javascript
function parseDetailResponse(html, url) {
    return JSON.stringify({
        "url": "https://live.example.com/vtvcab1/index.m3u8",
        "mimeType": "application/x-mpegURL",
        "headers": {
            "User-Agent": "Mozilla/5.0 ...",
            "Referer": "https://example.com/"
        }
    });
}
```

- **Dạng DASH (.mpd) kèm ClearKey DRM**:
```javascript
function parseDetailResponse(html, url) {
    return JSON.stringify({
        "url": "https://live.example.com/channel/manifest.mpd",
        "mimeType": "application/dash+xml",
        "drmType": "clearkey",
        "drmKid": "c410ddc6a75244639fd0561fba5ef19b",
        "drmKey": "30d13ea42031b9ff8271e5dc37d90e10",
        "headers": {
            "User-Agent": "Mozilla/5.0 ...",
            "Referer": "https://example.com/"
        }
    });
}
```

---

### 📱 Hướng Dẫn Viết Plugin Phim Ngắn / Short Drama (`"type": "shortfilm"`)

Khi viết plugin cho các nguồn phim ngắn (Short Drama / Reels / Shortflix), khai báo `"type": "shortfilm"` để kích hoạt trải nghiệm trình phát xoay dọc và cử chỉ vuốt chuyển tập.

#### Đặc điểm của Plugin `"shortfilm"` trong App:
- Trình phát ExoPlayer tự động **xoay đứng màn hình (Portrait Mode)** và phóng to vừa khít chiều dọc điện thoại (`resizeMode = ZOOM`).
- Hỗ trợ **cử chỉ vuốt dạng TikTok / Short Reels** trên Mobile:
  - **Vuốt LÊN (Swipe UP)**: Chuyển sang **Tập tiếp theo**.
  - **Vuốt XUỐNG (Swipe DOWN)**: Lùi về **Tập trước đó**.
- Tự động bảo toàn trạng thái xoay đứng và vuốt tay chuyển tập liên tục xuyên suốt từ Tập 1 tới toàn bộ các tập tiếp theo.

#### 1. Khai báo Manifest:
```javascript
function getManifest() {
    return JSON.stringify({
        "id": "shortflix",
        "name": "Phim Ngắn Shortflix",
        "description": "Kênh phim ngắn vietsub lồng tiếng",
        "version": "1.0.0",
        "baseUrl": "https://shortflix.net",
        "type": "shortfilm",        // ⭐ Đánh dấu plugin loại Phim Ngắn
        "playerType": "exoplayer"  // Khuyến nghị dùng exoplayer
    });
}
```

---

### 💾 Kỹ Thuật Truyền Dữ Liệu / Cache Biến Giữa Các Bước (State Management)

Do engine QuickJS trong App chạy độc lập từng phiên (stateless), các biến toàn cục (global variables) sẽ bị xóa RAM sau khi chuyển màn hình hoặc reload engine.

#### **Giải pháp chuẩn:** Đính kèm dữ liệu/token/key vào thuộc tính `id` hoặc `slug`

Muốn mang dữ liệu gì từ `parseListResponse()` sang `parseMovieDetail()` hay `parseDetailResponse()`, bạn nhúng thông tin đó vào `id` / `slug` của item.

##### Ví dụ 1: Nối chuỗi bằng dấu `|` (Đơn giản, khuyến nghị)
```javascript
// 1. Ở parseListResponse: Nối key vào id phim
function parseListResponse(html) {
    var secretKey = "ABC123XYZ";
    return JSON.stringify({
        "items": [
            {
                "id": "phim-hanh-dong-1|" + secretKey, // Nối key vào id
                "title": "Phim Hay 1"
            }
        ]
    });
}

// 2. Ở parseMovieDetail: Tách key ra dùng & truyền tiếp vào episode.id
function parseMovieDetail(html) {
    var rawId = "phim-hanh-dong-1|ABC123XYZ"; // slug/id nhận được
    var parts = rawId.split("|");
    var realSlug = parts[0];
    var myKey = parts[1]; // => "ABC123XYZ"

    return JSON.stringify({
        "id": realSlug,
        "title": "Phim Hay 1",
        "servers": [{
            "name": "Server 1",
            "episodes": [{
                "name": "Tập 1",
                "id": "tap-1|" + myKey // Truyền tiếp key vào id tập phim
            }]
        }]
    });
}

// 3. Ở parseDetailResponse: Lấy lại key dùng để bóc link stream
function parseDetailResponse(html, episodeUrl) {
    var myKey = episodeUrl.split("|")[1]; // => "ABC123XYZ"
    return JSON.stringify({
        "url": "https://server.com/stream?key=" + myKey,
        "isEmbed": false
    });
}
```

##### Ví dụ 2: Mã hóa Base64 cho Dữ liệu LỚN / Phức Tạp (Tránh vỡ cú pháp URL)

Khi cần truyền Object chứa nhiều dữ liệu (Cookie, Token JWT, bối cảnh Session...), bạn dùng `btoa()` để nén thành chuỗi Base64 1 dòng chữ an toàn:

```javascript
// 1. Ở parseListResponse: Mã hóa Object thành Base64 đính vào ID
function parseListResponse(html) {
    var bigData = {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        session: "sess_9988776655",
        quality: "1080p"
    };

    // Nén Object thành chuỗi Base64 an toàn 1 dòng
    var encodedData = btoa(JSON.stringify(bigData));

    return JSON.stringify({
        "items": [
            {
                "id": "phim-demo|" + encodedData,
                "title": "Phim Demo"
            }
        ]
    });
}

// 2. Ở parseDetailResponse: Giải mã Base64 ngược lại thành Object
function parseDetailResponse(html, episodeUrl) {
    var data = {};
    if (episodeUrl && episodeUrl.indexOf("|") > -1) {
        var base64Str = episodeUrl.split("|")[1];
        try {
            data = JSON.parse(atob(base64Str)); // Giải mã Base64 ngược lại
        } catch(e) {}
    }

    console.log(data.token);   // "eyJhbGciOi..."
    console.log(data.session); // "sess_9988776655"

    return JSON.stringify({
        "url": "https://server.com/stream?token=" + data.token,
        "isEmbed": false
    });
}
```

---

## 🧪 Mẹo Debug

### Trong tester.html:
- Hàm `parseListResponse` / `parseMovieDetail` cần dán **HTML source** của trang web tương ứng
- Hàm `getManifest` / `getHomeSections` chạy **không cần tham số**
- Hàm `getUrlList` / `getUrlDetail` cần nhập **slug** vào ô input

### Mẹo viết Regex:
```javascript
// Lấy tất cả <a> có class "movie-item"
var regex = /<a[^>]*class="movie-item"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<h3[^>]*>([^<]+)/g;
var match;
var items = [];
while ((match = regex.exec(html)) !== null) {
    items.push({
        id: match[1].replace('/phim/', ''),
        posterUrl: match[2],
        title: match[3].trim()
    });
}
```

### QuickJS sandbox — Những thứ KHÔNG dùng được:
❌ `document.querySelector()`,  `window.location`, `DOM API`
❌ `fetch()`, `XMLHttpRequest`, `async/await`
❌ `require()`, `import`

### Những thứ DÙNG ĐƯỢC:
✅ `JSON.parse()`, `JSON.stringify()`
✅ `String.match()`, `String.replace()`, `String.split()`, `String.indexOf()`
✅ `RegExp`, `/pattern/g.exec()`
✅ `Array.map()`, `Array.filter()`, `Array.forEach()`
✅ `try {} catch(e) {}`
✅ `encodeURIComponent()`, `decodeURIComponent()`

---

## 📁 Ví Dụ Thực Tế

| Plugin | Độ khó | Kỹ thuật |
|--------|--------|----------|
| `ophim_plugin.js` | ⭐ Dễ | API trả JSON → `JSON.parse()` |
| `kkphim_plugin.js` | ⭐⭐ Trung bình | API + HTML parse |
| `vlxx_plugin.js` | ⭐⭐⭐ Nâng cao | AJAX POST + recursive embed + mimeType |

🌐 Chúc bạn thành công! Đóng góp plugin cho cộng đồng nha!
