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
        "description": "Bản Webview Chuẩn: Mở giao diện gốc để chọn Sub/Thuyết minh. Tìm kiếm siêu tốc.",
        "version": "2.5.0",
        "info": "Tối ưu hóa tốc độ load trang chủ. Sử dụng Webview để giữ nguyên 100% tính năng chọn Phụ đề và Thuyết minh của web gốc.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/vicdn.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "webview" // [ĐÃ SỬA]: Khai báo chuẩn WebView để App mở màn hình duyệt web
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
// MENU & TRANG CHỦ (1 GRID + 4 LƯỚT NGANG)
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
// URL GENERATOR SIÊU TỐC
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

// ĐÃ SỬA: URL TÌM KIẾM CHUẨN CỦA VICDN
function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "").trim();
    return BASEURL + "/?q=" + encodedKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    // Gọi API Info để lấy dữ liệu json chi tiết
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH & TÌM KIẾM (ĐỌC API VÀ JSON SIÊU NHANH)
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent, url) {
    try {
        var dataArr = [];
        var totalPages = 1;
        var currentPage = 1;

        // Nếu là trang tìm kiếm (/?q=) -> Web nhúng JSON vào biến allData
        if (url.indexOf("/?q=") > -1) {
            var scriptMatch = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
            if (scriptMatch) {
                var allData = JSON.parse(scriptMatch[1]);
                var keyword = decodeURIComponent(url.match(/q=([^&]+)/)[1]).toLowerCase();
                
                // Lọc phim theo từ khóa
                for (var j = 0; j < allData.length; j++) {
                    var vname = (allData[j].vname || "").toLowerCase();
                    var ename = (allData[j].ename || "").toLowerCase();
                    if (vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                        dataArr.push(allData[j]);
                    }
                }
            }
        } 
        // Nếu là trang danh sách (API) -> Web trả về JSON gốc
        else {
            var jsonRes = JSON.parse(htmlContent);
            dataArr = jsonRes.data || [];
            totalPages = jsonRes.pagination ? parseInt(jsonRes.pagination.total_pages) : 1;
            currentPage = jsonRes.pagination ? parseInt(jsonRes.pagination.current_page) : 1;
        }

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
    return parseListResponse(htmlContent, url);
}

// -----------------------------------------------------------------------------
// PARSER 2: TẠO DUY NHẤT 1 NÚT BẤM VỚI LINK WEB GỐC
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var watchUrl = BASEURL;

        // Trích xuất link xem phim (Tập 1) từ API để làm link gốc cho Webview
        if (data.list_episodes && Array.isArray(data.list_episodes) && data.list_episodes.length > 0) {
            var parts = data.list_episodes[0].split("|"); 
            if (parts.length >= 2) {
                watchUrl = parts[1].trim(); 
            }
        } 
        else if (data.mkv) {
            watchUrl = data.mkv.trim();
        }

        // TẠO 1 TẬP ẢO DUY NHẤT: "Bấm vào để xem Phim"
        servers.push({
            name: "Giao Diện Web Gốc",
            episodes: [{
                id: watchUrl, // Truyền link trang xem phim vào hàm parseDetailResponse
                name: "Bấm vào để xem Phim",
                slug: "webview-player"
            }]
        });

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
// PARSER 3: MỞ TRÌNH DUYỆT WEBVIEW LÊN MÀN HÌNH
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // Tùy chọn: Bạn có thể viết thêm JS để ẩn Header/Footer nếu muốn Webview trông giống App hơn.
        // Ở đây tôi giữ giao diện mộc mạc nhất để đảm bảo không có gì ngăn cản Player hoạt động.
        
        return JSON.stringify({
            "url": url, 
            "isEmbed": true, // [ĐÃ SỬA]: Với playerType=webview, isEmbed: true sẽ ép bật khung duyệt web lên màn hình
            "mimeType": "",
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ 
            "url": url, 
            "isEmbed": true, 
            "headers": {} 
        });
    }
}

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
