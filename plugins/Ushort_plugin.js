// =============================================================================
// CẤU HÌNH DOMAIN VÀ API 
// =============================================================================
var MAIN_DOMAIN = "enlessdrama.online"; 
var BASEURL = "https://" + MAIN_DOMAIN + "/vi"; 

// ⚠️ QUAN TRỌNG: Link API chứa dữ liệu JSON để load Trang chủ
var API_LIST_URL = "https://api.enlessdrama.online/v1/movies"; 

// =============================================================================
// PLUGIN VAX APP: ENLESS DRAMA 
// CHIẾN THUẬT: 100% TRÌNH PHÁT WEB CỦA HỌ (KHÔNG DÙNG EXOPLAYER)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "enlessdrama",
        "name": "Enless Drama",
        "description": "100% Player Web, cố định dọc, ẩn rác. Fix lỗi tìm kiếm SPA.",
        "version": "3.5.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://enlessdrama.online/apple-touch-icon.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa ExoPlayer, ép xem bằng Trình duyệt
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[enlessdrama] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[enlessdrama] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'phim-moi' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    return API_LIST_URL + "?page=" + page; 
}

function getUrlSearch(keyword, filtersJson) {
    // Với trang SPA, link Search Web sẽ được dùng để xử lý ở parseSearchResponse
    return BASEURL + "/search?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    return slug; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS: XỬ LÝ LƯỠNG CỰC (JSON NATIVE VÀ HTML SPA)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        // Nếu lấy được JSON từ API
        if (html.trim().indexOf('{') === 0) {
            var data = JSON.parse(html);
            var list = data.items || data.data || [];
            
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var movieData = {
                    title: item.title,
                    coverUrl: item.coverUrl,
                    desc: item.description,
                    slug: item.slug,
                    totalEps: item.episodeCount,
                    episodes: item.episodeIds || []
                };
                
                var encodedSlug = "vaxdata://" + encodeURIComponent(JSON.stringify(movieData));
                
                items.push({
                    id: encodedSlug,
                    title: item.title,
                    posterUrl: item.coverUrl,
                    backdropUrl: item.coverUrl,
                    episode_current: item.episodeCount + " Tập",
                    quality: "HD"
                });
            }
            return JSON.stringify({
                items: items,
                pagination: { currentPage: data.page || 1, totalPages: data.totalPages || 10 } 
            });
        } 
        return JSON.stringify({ items: items });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

// XỬ LÝ FIX LỖI PHẦN TÌM KIẾM
function parseSearchResponse(html, url) {
    try {
        // TẠO NÚT MỞ WEBVIEW ĐỂ TÌM KIẾM TRỰC TIẾP TRÊN WEB
        var items = [];
        var kwMatch = url.match(/(?:search|q)=([^&]+)/);
        var kw = kwMatch ? decodeURIComponent(kwMatch[1]) : "";
        var webSearchUrl = BASEURL + (kw ? "/search?q=" + encodeURIComponent(kw) : "");

        items.push({
            id: "webview://" + webSearchUrl,
            title: kw ? '👉 Mở Trình Duyệt Tìm: "' + kw + '"' : "👉 Bấm để mở Tìm Kiếm",
            posterUrl: "https://enlessdrama.online/og-image.jpg",
            backdropUrl: "https://enlessdrama.online/og-image.jpg",
            episode_current: "Duyệt Web",
            quality: "VIP"
        });
        
        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

// =============================================================================
// TRANG CHI TIẾT
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        // TRƯỜNG HỢP 1: TỪ NÚT TÌM KIẾM WEBVIEW
        if (url.indexOf("webview://") === 0) {
            var targetUrl = url.split("webview://")[1];
            return JSON.stringify({
                id: url,
                title: "Trình Duyệt Tìm Kiếm",
                posterUrl: "https://enlessdrama.online/og-image.jpg",
                backdropUrl: "https://enlessdrama.online/og-image.jpg",
                description: "Bấm vào nút bên dưới để mở giao diện website và tìm kiếm phim. Bạn sẽ xem phim trực tiếp bằng Trình phát của Web.",
                servers: [{ name: "Enless Drama Web", episodes: [{ id: targetUrl, name: "Vào Web Tìm Phim", slug: "web-search" }] }],
                quality: "HD",
                year: 2026,
                rating: 10,
                category: "Short Drama",
                status: "Webview"
            });
        }
        
        // TRƯỜNG HỢP 2: DỮ LIỆU TỪ TRANG CHỦ NATIVE API
        var encodedData = url.split("vaxdata://")[1];
        var movieData = JSON.parse(decodeURIComponent(encodedData));
        var eps = [];
        var epList = movieData.episodes || [];
        
        for (var i = 0; i < epList.length; i++) {
            var epNumber = i + 1;
            // Tạo URL thực tế trên web để Webview load lên
            var webUrl = BASEURL + "/episode/" + movieData.slug + "-" + epNumber;
            
            eps.push({
                id: webUrl,
                name: "Tập " + epNumber,
                slug: epList[i]
            });
        }
        
        return JSON.stringify({
            id: url,
            title: movieData.title,
            posterUrl: movieData.coverUrl,
            backdropUrl: movieData.coverUrl,
            description: movieData.desc,
            servers: [{ name: "Player Gốc Của Web", episodes: eps }],
            quality: "HD",
            year: 2026,
            rating: 10,
            category: "Short Drama",
            status: movieData.totalEps + " Tập"
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi hiển thị dữ liệu", servers: [] });
    }
}

// =============================================================================
// WEBVIEW LOADER: KHÓA BẮT LINK, ÉP PLAYSINLINE, CHẶN FULLSCREEN
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var pureWebviewJs = `
            (function() {
                // 1. Vô hiệu hóa tính năng Fullscreen của Web Player để Android không bốc ra ngoài
                try {
                    var noop = function() { return Promise.resolve(); };
                    Object.defineProperty(document, 'fullscreenEnabled', {get: function() { return false; }});
                    Object.defineProperty(document, 'webkitFullscreenEnabled', {get: function() { return false; }});
                    if(Element.prototype.requestFullscreen) Element.prototype.requestFullscreen = noop;
                    if(Element.prototype.webkitRequestFullscreen) Element.prototype.webkitRequestFullscreen = noop;
                    if(Element.prototype.mozRequestFullScreen) Element.prototype.mozRequestFullScreen = noop;
                    if(Element.prototype.msRequestFullscreen) Element.prototype.msRequestFullscreen = noop;
                    if(window.HTMLVideoElement) {
                        HTMLVideoElement.prototype.webkitEnterFullscreen = noop;
                        HTMLVideoElement.prototype.enterFullscreen = noop;
                    }
                } catch(e) {}

                // 2. CSS Giấu rác, quảng cáo và ẩn nút phóng to của trình phát web
                var style = document.createElement('style');
                style.innerHTML = 'header, .header, nav, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments, .vjs-fullscreen-control, .plyr__controls [data-plyr="fullscreen"], .jw-fullscreen, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                // 3. Ép thẻ video chạy inline để player của web hoạt động trọn vẹn bên trong khung dọc
                setInterval(function() {
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    // Tắt các banner tải app hoặc nút close ngầm
                    var appBanners = document.querySelectorAll('div[class*="download"], div[class*="banner"]');
                    for (var i = 0; i < appBanners.length; i++) {
                        if (appBanners[i]) appBanners[i].style.display = 'none';
                    }
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true",
                "Block-Redirects": "false", 
                "Custom-Js": checkRaw(pureWebviewJs, true)
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// =============================================================================
// THƯ VIỆN BẢO VỆ CHUỖI JS
// =============================================================================

function checkRaw(scriptStr, returnFixed) {
    try {
        if (!scriptStr || typeof scriptStr !== "string") return scriptStr || "";
        var lines = scriptStr.split("\n");
        var fixedLines = [];
        for (var i = 0; i < lines.length; i++) {
            var currentLine = lines[i];
            var fixedLine = currentLine;
            if (returnFixed) {
                fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  ");
            }
            fixedLines.push(fixedLine);
        }
        return returnFixed ? fixedLines.join("\n") : scriptStr;
    } catch (e) {
        return scriptStr;
    }
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
