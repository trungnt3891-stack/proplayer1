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
    "playerType": "exoplayer"
}
```

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
App sẽ POST tới URL đó → nhận response → gọi `parseEmbedResponse(html, url)` → lặp lại nếu `isEmbed` vẫn = `true`.

---

### 🎬 Chế Độ `embedtoexoplay` & EmbedSniffer (Nâng Cao)

Khi plugin khai báo `"playerType": "embedtoexoplay"` trong `getManifest()`, ứng dụng sẽ dùng **EmbedSniffer** (WebView chạy ngầm) để tải trang web embed, tự động dò tìm link stream (.m3u8, .mp4, ...) và chuyển cho ExoPlayer phát native.

#### Các thuộc tính điều khiển qua `headers` trong `parseDetailResponse`:

| Header Key | Mục đích | Ví dụ |
|------------|----------|-------|
| `Custom-Js` | Chuỗi JavaScript được inject vào WebView ngầm sau khi trang tải xong. Có thể chủ động lấy link và gọi `SnifferBridge.onVideoDetected(link)` | `"(function() { SnifferBridge.onVideoDetected(url); })();"` |
| `Stream-Regex` | Chuỗi RegEx tùy chỉnh để EmbedSniffer lọc bắt link mạng thay cho mẫu mặc định (.m3u8, .mp4...) | `"https?:\\/\\/[^\"'\\s]+\\/index\\.m3u8"` |
| `User-Agent` | Đặt User-Agent cho WebView ngầm | `"Mozilla/5.0 ..."` |
| `Referer` | Đặt Referer cho WebView ngầm | `"https://site.com/"` |

#### Ví dụ 1: Inject `Custom-Js` để gửi link callback về ExoPlayer
```javascript
function parseDetailResponse(html, url) {
    var customJsCode = `(function() {
        if (window._vaapp_custom) return;
        window._vaapp_custom = true;
        
        // Tìm player hoặc thẻ video trên trang web ngầm
        var v = document.querySelector('video');
        if (v && v.src && v.src.indexOf('http') === 0) {
            // Gửi callback trực tiếp về cho ExoPlayer phát
            SnifferBridge.onVideoDetected(v.src);
        }
    })();`;

    return JSON.stringify({
        "url": "https://gamomephim.com/embed/123",
        "isEmbed": true,
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://gamomephim.com/",
            "Custom-Js": customJsCode
        }
    });
}
```

> ⚠️ **LƯU Ý QUAN TRỌNG:**
> 1. `Custom-Js` trong `headers` phải là một **chuỗi dạng String** chứa mã JS, KHÔNG viết hàm tự gọi IIFE trực tiếp vì QuickJS engine trên Android app sẽ bị crash do không có đối tượng `window`.
> 2. `SnifferBridge.onVideoDetected(url)` là hàm Bridge native của App. Ngay khi được gọi, WebView ngầm sẽ lập tức đóng lại và ExoPlayer sẽ nhận link stream để phát.

#### Ví dụ 2: Lọc link theo `Stream-Regex` tùy chỉnh
```javascript
function parseDetailResponse(html, url) {
    return JSON.stringify({
        "url": "https://gamomephim.com/embed/123",
        "isEmbed": true,
        "headers": {
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
