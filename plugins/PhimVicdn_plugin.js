// =============================================================================
// CẤU HÌNH DOMAIN VICDN
// =============================================================================
var BASEURL = "https://vicdn.cc"; 
var BASEAPI = BASEURL + "/api";
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "vicdn",
        "name": "Nguồn Vicdn",
        "description": "Bản Tối Ưu Native: Bắt trực tiếp link M3U8, Fix Phụ đề Vietsub, Thêm Menu Trang chủ.",
        "version": "2.1.5",
        "info": "Tối ưu hóa tốc độ cao nhất nhờ đọc trực tiếp dữ liệu JSON API. Tính năng tìm kiếm được xử lý ngầm siêu tốc. Phát phim và Phụ đề trực tiếp bằng Native Player.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/vicdn.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // [BẮT BUỘC] Sử dụng ExoPlayer gốc, nói KHÔNG với WebView
    });
}

function log(msg) {
    if (DEV) {
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[Vicdn] " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[Vicdn] " + msg);
        }
    }
}

// -----------------------------------------------------------------------------
// [ĐÃ SỬA] MENU & TRANG CHỦ (THỂ HIỆN LƯỚT NGANG)
// -----------------------------------------------------------------------------
function getHomeSections() {
    return JSON.stringify([
        { "slug": "update", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "type/hanh-dong", "title": "Hành Động", "type": "Horizontal" },
        { "slug": "type/hoat-hinh", "title": "Hoạt Hình", "type": "Horizontal" },
        { "slug": "type/vien-tuong", "title": "Viễn Tưởng", "type": "Horizontal" },
        { "slug": "type/hinh-su", "title": "Hình Sự", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'update' },
        { name: 'Hành Động', slug: 'type/hanh-dong' },
        { name: 'Hoạt Hình', slug: 'type/hoat-hinh' },
        { name: 'Viễn Tưởng', slug: 'type/vien-tuong' },
        { name: 'Hình Sự', slug: 'type/hinh-su' },
        { name: 'Bí Ẩn', slug: 'type/bi-an' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "update";

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                if (filters.category && filters.category.length > 0) {
                    path = filters.category[0].slug;
                } else if (typeof filters.category === 'string') {
                    path = filters.category;
                }
            } catch (jsonErr) {}
        }

        // Chặn nếu URL đã là http
        if (path.indexOf("http") === 0) return path;

        // Web dùng API dạng: /api/update/1 hoặc /api/type/hoat-hinh/1
        var resultUrl = BASEAPI + (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 0) {
            if (!resultUrl.endsWith("/")) resultUrl += "/";
            resultUrl += page; 
        }

        return resultUrl;
    } catch (e) {
        return BASEAPI + "/update/1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "").trim();
    // Đẩy từ khóa vào param ảo để hàm Parser phía sau có thể nhận diện được
    return BASEURL + "/index.php?search_keyword=" + encodedKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    // Slug từ trang danh sách là mã ID (VD: tv-278275-1). Ta gọi API Info để lấy chi tiết.
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH & TÌM KIẾM (ĐỌC TRỰC TIẾP JSON, KHÔNG DÙNG DOM ẢO)
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var dataArr = jsonRes.data || [];
        var totalPages = jsonRes.pagination ? parseInt(jsonRes.pagination.total_pages) : 1;
        var currentPage = jsonRes.pagination ? parseInt(jsonRes.pagination.current_page) : 1;

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            items.push({
                "id": item.slug, 
                "title": item.vname || item.ename || "Chưa có tên",
                "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                "quality": (item.type || "HD").toUpperCase(),
                "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
            });
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentPage,
                "totalPages": totalPages
            }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(htmlContent, url) {
    try {
        var keyword = "";
        var matchKw = url.match(/search_keyword=([^&]+)/);
        if (matchKw) keyword = decodeURIComponent(matchKw[1]).toLowerCase();

        var dataArr = [];
        // Cào lấy biến const allData = [...] từ trang index.php
        var scriptMatch = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
        if (scriptMatch) {
            dataArr = JSON.parse(scriptMatch[1]);
        }

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            var vname = (item.vname || "").toLowerCase();
            var ename = (item.ename || "").toLowerCase();
            
            // Nếu Tên Tiếng Việt hoặc Tên Tiếng Anh khớp với từ khóa
            if (vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                items.push({
                    "id": item.slug,
                    "title": item.vname || item.ename || "Chưa có tên",
                    "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                    "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                    "quality": (item.type || "HD").toUpperCase(),
                    "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 } // Tìm kiếm client-side nên chỉ có 1 trang tổng
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

// -----------------------------------------------------------------------------
// PARSER 2: CHI TIẾT PHIM (CHUYỀN BIẾN LECH ĐỂ LẤY SUB)
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var episodes = [];
        var lech = data.lech || ""; // Lấy mã số để truy xuất Subtitle

        // 1. Phim bộ: Bóc tách mảng list_episodes
        if (data.list_episodes && Array.isArray(data.list_episodes) && data.list_episodes.length > 0) {
            for (var i = 0; i < data.list_episodes.length; i++) {
                var parts = data.list_episodes[i].split("|"); // Định dạng "1|https://vicdn.cc/tv-278275-1-1"
                if (parts.length >= 2) {
                    var epNum = parts[0].trim();
                    var epLink = parts[1].trim(); 
                    
                    // Nối tham số lech và ep vào url để App VAAPP gửi qua hàm parseDetailResponse
                    var sep = epLink.indexOf("?") > -1 ? "&" : "?";
                    var finalId = epLink + sep + "lech=" + lech + "&ep=" + epNum;
                    
                    episodes.push({
                        id: finalId, // Gửi link Embed có chứa thông số Subtitle
                        name: "Tập " + epNum,
                        slug: "tap-" + epNum
                    });
                }
            }
        } 
        // 2. Phim lẻ (Movie): Dùng link MKV nếu không có tập
        else if (data.mkv) {
            var epLink = data.mkv.trim();
            var sep = epLink.indexOf("?") > -1 ? "&" : "?";
            var finalId = epLink + sep + "lech=" + lech + "&ep=1";
            
            episodes.push({
                id: finalId, 
                name: "Full HD",
                slug: "full"
            });
        }

        if (episodes.length > 0) {
            servers.push({ name: "ViCDN Server", episodes: episodes });
        }

        return JSON.stringify({
            id: url,
            title: data.vname || data.ename || "Đang cập nhật",
            posterUrl: data.poster ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + data.poster + ".jpg" : "",
            backdropUrl: data.banner ? "https://image.tmdb.org/t/p/w1280/" + data.banner + ".jpg" : "",
            description: data.content || "Không có mô tả",
            quality: (data.type || "HD").toUpperCase(),
            year: parseInt(data.year) || 2026,
            rating: parseFloat(data.rate || 0),
            status: "Tập " + data.stt + "/" + data.total,
            category: (data.genre || []).join(", "),
            episode_current: "Tập " + data.stt,
            servers: servers,
            casts: (data.cast || []).join(", "),
            duration: data.duration ? data.duration + " Phút" : ""
        });

    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi tải chi tiết phim", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// [ĐÃ SỬA] PARSER 3: GHÉP SUBTITLE TIẾNG VIỆT VÀO VIDEO CHO EXOPLAYER
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // 1. Lấy thông số Subtitle từ URL
        var cleanUrl = url.replace(/([?&])lech=[^&]+/, "").replace(/([?&])ep=[^&]+/, "").replace(/&&/g, "&").replace(/[?&]$/, "");
        var lechMatch = url.match(/lech=([^&]+)/);
        var epMatch = url.match(/ep=([^&]+)/);
        
        var subtitles = [];
        if (lechMatch && epMatch && lechMatch[1]) {
            var lechVal = lechMatch[1];
            var epVal = parseInt(epMatch[1]);
            var epStr = epVal < 10 ? '0' + epVal : epVal.toString();
            
            // Định dạng Subtitle bắt buộc có mimeType: "text/vtt" để App nhận diện được
            subtitles.push({
                "lang": "vi",
                "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/v" + epStr + ".srt/vtt.css",
                "mimeType": "text/vtt"
            });
            subtitles.push({
                "lang": "en",
                "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/e" + epStr + ".srt/vtt.css",
                "mimeType": "text/vtt"
            });
        }

        // 2. Tìm link M3u8/Iframe
        var isDirect = cleanUrl.indexOf('.m3u8') !== -1 || cleanUrl.indexOf('.mp4') !== -1;
        if (isDirect) {
            return JSON.stringify({
                url: cleanUrl,
                isEmbed: false,
                mimeType: cleanUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": BASEURL + "/", "User-Agent": "Mozilla/5.0" },
                subtitles: subtitles // Trả sub ngay cho ExoPlayer
            });
        }

        var streamUrl = "";
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
        } else {
            var m3u8Match = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
        }

        if (!streamUrl) {
            var jsonMatch = htmlContent.match(/["'](?:file|link|url)["']\s*:\s*["']([^"']+)["']/i);
            if (jsonMatch) streamUrl = jsonMatch[1].replace(/\\/g, '');
        }

        if (streamUrl) {
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            var isM3u8 = streamUrl.indexOf('.m3u8') !== -1 || streamUrl.indexOf('.mp4') !== -1;
            if (isM3u8) {
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: false,
                    mimeType: streamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "",
                    headers: { "Referer": BASEURL + "/", "User-Agent": "Mozilla/5.0" },
                    subtitles: subtitles // Trả sub ngay cho ExoPlayer
                });
            } else {
                // Nhét Subtitles vào url để gửi đệ quy qua hàm parseEmbedResponse bên dưới
                var subsQuery = encodeURIComponent(JSON.stringify(subtitles));
                var nextUrl = streamUrl + (streamUrl.indexOf('?') > -1 ? '&' : '?') + 'subs=' + subsQuery;
                
                return JSON.stringify({
                    url: nextUrl,
                    isEmbed: true, 
                    headers: { "Referer": cleanUrl, "User-Agent": "Mozilla/5.0" },
                    subtitles: subtitles
                });
            }
        }
        
        return JSON.stringify({
            url: cleanUrl,
            isEmbed: true, 
            headers: { "Referer": BASEURL, "User-Agent": "Mozilla/5.0" },
            subtitles: subtitles
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

// -----------------------------------------------------------------------------
// [ĐÃ SỬA] PARSER 4: TRÍCH XUẤT M3U8 VÀ ĐỌC LẠI SUBTITLE SAU KHI QUA IFRAME
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    try {
        // Khôi phục mảng Subtitles từ URL được đệ quy
        var subtitles = [];
        var subMatch = /[?&]subs=([^&]+)/.exec(url);
        if (subMatch) {
            try { subtitles = JSON.parse(decodeURIComponent(subMatch[1])); } catch(e) {}
        }

        var directMatch = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        if (directMatch) {
            var finalUrl = directMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false,
                mimeType: finalUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: subtitles // Trả phụ đề cho Native Player
            });
        }
        
        var fileMatch = htmlContent.match(/["'](?:file|src|link)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i);
        if (fileMatch) {
            var jsonUrl = fileMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: jsonUrl,
                isEmbed: false,
                mimeType: jsonUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: subtitles // Trả phụ đề cho Native Player
            });
        }

        // Cào thêm Iframe bên trong nếu có
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            var nextInnerUrl = iframeMatch[1];
            if (nextInnerUrl.indexOf('//') === 0) nextInnerUrl = "https:" + nextInnerUrl;
            
            var subsQuery = encodeURIComponent(JSON.stringify(subtitles));
            var nextUrlWithSubs = nextInnerUrl + (nextInnerUrl.indexOf('?') > -1 ? '&' : '?') + 'subs=' + subsQuery;

            return JSON.stringify({
                url: nextUrlWithSubs,
                isEmbed: true, 
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: subtitles
            });
        }

        return JSON.stringify({ url: "", isEmbed: false, subtitles: subtitles });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, subtitles: [] });
    }
}

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
