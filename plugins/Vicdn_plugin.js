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
        "description": "Bản Tối Ưu Native: Bắt trực tiếp link M3U8, Fix lỗi Tìm Kiếm, Không dùng WebView.",
        "version": "2.0.0",
        "info": "Tối ưu hóa tốc độ cao nhất nhờ đọc trực tiếp dữ liệu JSON API. Tính năng tìm kiếm được xử lý ngầm siêu tốc. Phát phim trực tiếp bằng Native Player.",
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
// MENU & CATEGORIES
// -----------------------------------------------------------------------------
function getHomeSections() {
    try {
        var listurl = '[{\"link\":\"/update/\",\"name\":\"Phim Mới Cập Nhật\"}]';
        var menulist = buildMenu(listurl, true);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({ category: menulist });
    } catch (e) {
        return JSON.stringify({ category: [] });
    }
}

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "/update/";

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

        // Web dùng API dạng: /api/update/1 hoặc /api/type/hoat-hinh/1
        var resultUrl = BASEAPI + (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 0) {
            // Nối page vào cuối URL (Ví dụ: /api/update/2)
            resultUrl = resultUrl.replace(/\/+$/, "") + "/" + page;
        }

        return resultUrl;
    } catch (e) {
        return BASEAPI + "/update/1";
    }
}

// ĐÃ SỬA: Đưa search về trang chủ index.php để lấy cục Data tổng
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

// ĐÃ SỬA: Lọc trực tiếp từ kho Data của trang chủ để tìm kiếm cực nhanh
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
// PARSER 2: CHI TIẾT PHIM (XỬ LÝ MẢNG TẬP PHIM TỪ JSON)
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var episodes = [];

        // 1. Phim bộ: Bóc tách mảng list_episodes
        if (data.list_episodes && Array.isArray(data.list_episodes) && data.list_episodes.length > 0) {
            for (var i = 0; i < data.list_episodes.length; i++) {
                var parts = data.list_episodes[i].split("|"); // Định dạng "1|https://vicdn.cc/tv-278275-1-1"
                if (parts.length >= 2) {
                    episodes.push({
                        id: parts[1].trim(), // Chuyển thẳng link stream sang bước DetailResponse
                        name: "Tập " + parts[0].trim(),
                        slug: "tap-" + parts[0].trim()
                    });
                }
            }
        } 
        // 2. Phim lẻ (Movie): Dùng link MKV nếu không có tập
        else if (data.mkv) {
            episodes.push({
                id: data.mkv.trim(), 
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
// PARSER 3: BẮT ĐƯỜNG LINK VIDEO CUỐI CÙNG CHO EXOPLAYER
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // [TRƯỜNG HỢP 1]: Link là Iframe nhúng từ nguồn thứ 3 (VD: viewcrate.cc)
        if (url.indexOf("viewcrate.cc") > -1 || url.indexOf("player.php") > -1) {
            return JSON.stringify({
                url: url,
                isEmbed: true, // Yêu cầu App fetch đệ quy ngầm vào Iframe để lấy m3u8
                headers: { "Referer": BASEURL + "/", "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }
        
        // [TRƯỜNG HỢP 2]: Link trả về trực tiếp từ vicdn.cc (Đây là luồng m3u8 bảo mật)
        return JSON.stringify({
            url: url,
            isEmbed: false, // Quăng thẳng vào ExoPlayer để phát
            mimeType: "application/x-mpegURL", // Ép định dạng M3U8 cho iPhone nhận diện
            headers: {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            subtitles: []
        });

    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// -----------------------------------------------------------------------------
// PARSER 4: TRÍCH XUẤT LINK TỪ IFRAME NGẦM (NẾU CÓ)
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    try {
        // Tìm file m3u8 hoặc mp4 trong nội dung Iframe
        var match = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        if (match) {
            var streamUrl = match[1].replace(/\\/g, '');
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: streamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
            });
        }
        
        // Hoặc tìm trong file cấu hình JSON của Iframe
        var fileMatch = htmlContent.match(/["'](?:file|src|link)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i);
        if (fileMatch) {
            var jsonUrl = fileMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: jsonUrl,
                isEmbed: false,
                mimeType: jsonUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"/type/hoat-hinh/\",\"name\":\"Hoạt Hình\"},{\"link\":\"/type/vien-tuong/\",\"name\":\"Viễn Tưởng\"},{\"link\":\"/type/hinh-su/\",\"name\":\"Hình Sự\"},{\"link\":\"/type/bi-an/\",\"name\":\"Bí Ẩn\"},{\"link\":\"/type/hanh-dong/\",\"name\":\"Hành Động\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    let menulist = []; 
    if (!menuArray || !Array.isArray(menuArray)) return menulist; 
    var typeStr = type !== undefined ? String(type).trim() : undefined; 
    for (var i = 0; i < menuArray.length; i++) { 
        var item = menuArray[i]; 
        if (!item) continue; 
        var link = item.link ? String(item.link).trim() : ""; 
        var name = item.name ? String(item.name).trim() : ""; 
        if (!link || !name) continue; 
        var menuItem = {}; 
        if (typeStr === "false") { 
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}
