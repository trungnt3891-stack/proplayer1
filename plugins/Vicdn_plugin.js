// =============================================================================
// CẤU HÌNH DOMAIN VICDN - TỐI ƯU HÓA BỞI JS EXPERT
// =============================================================================
var BASEURL = "https://vicdn.cc"; 
var BASEAPI = BASEURL + "/api";

function getManifest() {
    return JSON.stringify({
        id: "vicdn",
        name: "ViCDN Pro",
        description: "Bản Master: Fix lỗi Search HTML, hiển thị List tập Native, Inject CustomJS siêu tốc chống chặn JWPlayer.",
        version: "7.1.0",
        baseUrl: BASEURL,
        iconUrl: BASEURL + "/vicdn.png",
        isEnabled: true,
        adblock: false,
        type: "MOVIE",
        playerType: "embed" // [BẮT BUỘC] Dùng embed để mở Webview kèm CustomJS
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[Vicdn] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[Vicdn] " + msg);
    }
}

// -----------------------------------------------------------------------------
// MENU TRANG CHỦ & DANH MỤC
// -----------------------------------------------------------------------------
function getHomeSections() {
    var listurl = [
        { "link": "/update/", "name": "Phim Mới Cập Nhật", "type": "Grid" },
        { "link": "/type/hanh-dong/", "name": "Hành Động", "type": "Horizontal" },
        { "link": "/type/hoat-hinh/", "name": "Hoạt Hình", "type": "Horizontal" },
        { "link": "/type/vien-tuong/", "name": "Viễn Tưởng", "type": "Horizontal" },
        { "link": "/type/hinh-su/", "name": "Hình Sự", "type": "Horizontal" }
    ];
    var menulist = [];
    for (var i = 0; i < listurl.length; i++) {
        menulist.push({
            slug: listurl[i].link,
            title: listurl[i].name,
            type: listurl[i].type
        });
    }
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: '/update/' },
        { name: 'Hành Động', slug: '/type/hanh-dong/' },
        { name: 'Hoạt Hình', slug: '/type/hoat-hinh/' },
        { name: 'Viễn Tưởng', slug: '/type/vien-tuong/' },
        { name: 'Hình Sự', slug: '/type/hinh-su/' },
        { name: 'Hài Hước', slug: '/type/hai-huoc/' },
        { name: 'Tình Cảm', slug: '/type/tinh-cam/' },
        { name: 'Chính Kịch', slug: '/type/chinh-kich/' },
        { name: 'Kinh Dị', slug: '/type/kinh-di/' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try { page = parseInt(JSON.parse(fixedJson).page) || 1; } catch (e) {}
        }
        return BASEAPI + slug + page;
    } catch(e) { return BASEAPI + slug; }
}

function getUrlSearch(keyword, filtersJson) {
    // SỬA LỖI SEARCH: Web này không có API tìm kiếm, nó load lại trang chủ và filter nội bộ
    // Vì vậy ta ép gọi URL trang chủ kèm tham số q=...
    return BASEURL + "/?q=" + encodeURIComponent(keyword.trim());
}

function getUrlDetail(slug) {
    return BASEAPI + "/info/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER DANH SÁCH (ĐỌC TỪ API JSON)
// -----------------------------------------------------------------------------
function parseListResponse(html) {
    try {
        var json = typeof html === 'string' ? JSON.parse(html) : html;
        var data = json.data || [];
        var items = [];

        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            
            var pUrl = item.poster || "";
            if (pUrl && pUrl.indexOf("http") === -1) pUrl = "https://image.tmdb.org/t/p/w300/" + pUrl + ".jpg";
            
            var bUrl = item.banner || "";
            if (bUrl && bUrl.indexOf("http") === -1) bUrl = "https://image.tmdb.org/t/p/w533_and_h300_face/" + bUrl + ".jpg";

            items.push({
                "id": item.slug, 
                "title": item.vname || item.ename,
                "posterUrl": pUrl,
                "backdropUrl": bUrl,
                "quality": item.type ? item.type.toUpperCase() : "HD",
                "episode_current": "Tập " + item.stt + "/" + item.total
            });
        }

        var totalPages = json.pagination ? parseInt(json.pagination.total_pages) : 1;
        var currentPage = json.pagination ? parseInt(json.pagination.current_page) : 1;

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        log("Lỗi parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

// -----------------------------------------------------------------------------
// [FIX LỖI] PARSER TÌM KIẾM (ĐỌC DATA TỪ HTML VÀ TỰ FILTER)
// -----------------------------------------------------------------------------
function parseSearchResponse(html, url) {
    try {
        // 1. Lấy keyword người dùng nhập từ URL
        var matchKeyword = url.match(/[?&]q=([^&]+)/);
        var keyword = matchKeyword ? decodeURIComponent(matchKeyword[1]).toLowerCase().trim() : "";
        
        // 2. Trích xuất mảng "const allData = [...]" từ HTML của trang chủ
        var dataMatch = html.match(/const\s+allData\s*=\s*(\[[\s\S]*?\]);\s*let\s+filteredData/);
        if (!dataMatch) {
            log("Không tìm thấy biến allData trong HTML.");
            return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
        }
        
        var allData = JSON.parse(dataMatch[1]);
        var items = [];
        
        // 3. Tự viết logic lọc tên phim y như JavaScript của web
        for (var i = 0; i < allData.length; i++) {
            var item = allData[i];
            var vname = (item.vname || "").toLowerCase();
            var ename = (item.ename || "").toLowerCase();
            
            // Nếu tên Tiếng Việt hoặc tiếng Anh có chứa từ khóa
            if (vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                
                var pUrl = item.poster || "";
                if (pUrl && pUrl.indexOf("http") === -1) pUrl = "https://image.tmdb.org/t/p/w300/" + pUrl + ".jpg";
                
                var bUrl = item.banner || "";
                if (bUrl && bUrl.indexOf("http") === -1) bUrl = "https://image.tmdb.org/t/p/w533_and_h300_face/" + bUrl + ".jpg";

                items.push({
                    "id": item.slug, 
                    "title": item.vname || item.ename,
                    "posterUrl": pUrl,
                    "backdropUrl": bUrl,
                    "quality": item.type ? item.type.toUpperCase() : "HD",
                    "episode_current": "Tập " + item.stt + "/" + item.total
                });
            }
        }
        
        log("Đã tìm thấy " + items.length + " kết quả cho từ khóa: " + keyword);
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 } // Search local nên chỉ có 1 trang
        });
        
    } catch (e) {
        log("Lỗi parseSearchResponse: " + e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

// -----------------------------------------------------------------------------
// BÓC TÁCH CHI TIẾT VÀ DANH SÁCH TẬP
// -----------------------------------------------------------------------------
function parseMovieDetail(html, url) {
    try {
        var json = typeof html === 'string' ? JSON.parse(html) : html;
        var data = json.data;
        
        var limg = data.banner || data.poster || "";
        if (limg && limg.indexOf("http") === -1) {
            limg = "https://image.tmdb.org/t/p/w533_and_h300_face/" + limg + ".jpg";
        }
        
        var lname = data.vname || data.ename || "Đang cập nhật...";
        var ldes = data.content || "Không có mô tả.";
        var lactor = (data.cast || []).join(" - ");
        var lduran = data.duration ? data.duration + " phút" : "";
        var status = "Tập " + data.stt + "/" + data.total;
        var category = (data.genre || []).join(" - ");
        var year = data.year || 2026;
        
        var episodes = [];
        
        if (data.list_episodes && data.list_episodes.length > 0) {
            for (var j = 0; j < data.list_episodes.length; j++) {
                var itemEpi = data.list_episodes[j];
                var splitEpi = itemEpi.split("|");
                if(splitEpi.length >= 2) {
                    episodes.push({
                        id: splitEpi[1].trim(), // Lấy thẳng link Player làm ID
                        name: "Tập " + splitEpi[0].trim(),
                        slug: "tap-" + splitEpi[0].trim()
                    });
                }
            }
        } else if (data.mkv) {
            episodes.push({
                id: data.mkv.trim(),
                name: "Xem Ngay",
                slug: "full"
            });
        }
        
        if (episodes.length === 0) {
            episodes.push({ id: url, name: "Phim chưa có link", slug: "error" });
        }
        
        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: (data.type || "HD").toUpperCase(),
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: "Tập " + data.stt,
            servers: [{ name: "VIP Server", episodes: episodes }],
            duration: lduran,
            casts: lactor
        });

    } catch (e) {
        log("Lỗi parseMovieDetail: " + e);
        return JSON.stringify({ id: url, title: "Lỗi tải dữ liệu", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// INJECT CUSTOM-JS XỬ LÝ JWPLAYER MÃ HÓA
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var streamLink = url;

        var customJS = `
            try {
                // 1. Phá hủy ngay lập tức trình phát hiện F12/DevTools của vicdn (Chống tự reload trang)
                if (window.devtoolsDetector) {
                    window.devtoolsDetector.launch = function(){};
                    window.devtoolsDetector.addListener = function(){};
                    window.devtoolsDetector.isOpen = false;
                }
                
                // 2. Tiêm CSS bóp nghẹt mọi phần tử không cần thiết, ép Player Full màn hình
                var s = document.createElement('style');
                s.innerHTML = 'html, body { margin:0!important; padding:0!important; width:100vw!important; height:100vh!important; overflow:hidden!important; background:#000!important; } ' +
                              '#ssPlay { position:fixed!important; top:0!important; left:0!important; width:100vw!important; height:100vh!important; z-index:999999!important; display:flex!important; } ' +
                              '#sub-cfg-modal, header, footer, iframe:not(#ssPlay iframe) { display:none!important; pointer-events:none!important; }';
                document.head.appendChild(s);
                
                // 3. Auto-Play và Skip Ads thông minh
                var checkJWP = setInterval(function() {
                    if (typeof jwplayer === 'function') {
                        var player = jwplayer();
                        if (player.getState) {
                            var state = player.getState();
                            if (state !== 'playing' && state !== 'buffering') {
                                player.play();
                            }
                        }
                    }
                    var skip = document.querySelector('.jw-skip');
                    if (skip) skip.click();
                }, 1000);
            } catch(e) {}
        `;
        
        return JSON.stringify({
            url: streamLink,
            isEmbed: true, 
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://vicdn.cc/",
                "Custom-Js": customJS.replace(/\\s+/g, ' ').trim()
            },
            subtitles: []
        });
    } catch (e) {
        log("Lỗi parseDetailResponse: " + e);
        return JSON.stringify({ url: "", isEmbed: true, headers: {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
