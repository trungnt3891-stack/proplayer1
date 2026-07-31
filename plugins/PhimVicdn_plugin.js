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
        "description": "Bản Webview Tối Ưu: Mở thẳng khung Iframe, Full Vietsub, Thêm Menu Trang chủ.",
        "version": "2.3.0",
        "info": "Tốc độ quét API siêu tốc. Trình phát sử dụng Webview lấy nguyên gốc Iframe để giữ lại 100% Phụ đề Tiếng Việt.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/vicdn.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embed" // [ĐÃ SỬA]: Sử dụng WebView để đảm bảo Subtitle gốc hoạt động
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
// [ĐÃ DUY TRÌ] MENU & TRANG CHỦ (1 GRID + 4 LƯỚT NGANG)
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

        if (path.indexOf("http") === 0) return path;

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
    return BASEURL + "/index.php?search_keyword=" + encodedKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH & TÌM KIẾM (ĐỌC JSON SIÊU TỐC)
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
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
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
        var scriptMatch = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
        if (scriptMatch) {
            dataArr = JSON.parse(scriptMatch[1]);
        }

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            var vname = (item.vname || "").toLowerCase();
            var ename = (item.ename || "").toLowerCase();
            
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
            "pagination": { "currentPage": 1, "totalPages": 1 } 
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

// -----------------------------------------------------------------------------
// PARSER 2: CHI TIẾT PHIM
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var episodes = [];

        // Lấy danh sách link xem phim
        if (data.list_episodes && Array.isArray(data.list_episodes) && data.list_episodes.length > 0) {
            for (var i = 0; i < data.list_episodes.length; i++) {
                var parts = data.list_episodes[i].split("|"); 
                if (parts.length >= 2) {
                    var epNum = parts[0].trim();
                    var epLink = parts[1].trim(); 
                    
                    episodes.push({
                        id: epLink, // Ví dụ: https://vicdn.cc/tv-278275-1-1
                        name: "Tập " + epNum,
                        slug: "tap-" + epNum
                    });
                }
            }
        } 
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
// [ĐÃ SỬA] PARSER 3: BÓC TÁCH IFRAME ĐỂ ĐƯA LÊN WEBVIEW
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        var streamUrl = "";

        // Tìm Iframe (ví dụ: viewcrate.cc) nằm trong trang xem phim
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
        } else {
            // Nếu không có iframe, bắt link gốc
            var m3u8Match = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
        }

        if (!streamUrl) {
            var jsonMatch = htmlContent.match(/["'](?:file|link|url)["']\s*:\s*["']([^"']+)["']/i);
            if (jsonMatch) streamUrl = jsonMatch[1].replace(/\\/g, '');
        }

        // Tối ưu UI cho Webview: CSS ẩn bớt quảng cáo nếu lỡ có
        var killAdsJs = "var s=document.createElement('style');s.innerHTML='header,.footer,[class*=\"ad-\"],[id*=\"ad-\"]{display:none!important}body,html{background:#000!important}';document.head.appendChild(s);";

        if (streamUrl) {
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // DO CHÚNG TA ĐÃ DÙNG PLAYERTYPE: "embed", APP SẼ MỞ URL NÀY TRONG WEBVIEW NGAY LẬP TỨC
                headers: { 
                    "Referer": BASEURL + "/",
                    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                    "Custom-Js": killAdsJs
                },
                subtitles: []
            });
        }
        
        // Fallback: Mở nguyên cả trang nếu không tìm thấy iframe
        return JSON.stringify({
            url: url,
            isEmbed: false, 
            headers: { "Referer": BASEURL + "/", "Custom-Js": killAdsJs },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// -----------------------------------------------------------------------------
// KHÔNG DÙNG TỚI VỚI WEBVIEW, TRẢ VỀ RỖNG
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
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
