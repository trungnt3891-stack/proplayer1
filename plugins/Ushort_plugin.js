// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "enlessdrama.online"; 
var BASEURL = "https://" + MAIN_DOMAIN + "/vi"; 

// =============================================================================
// PLUGIN VAX APP: CỔNG WEBVIEW TRỰC TIẾP
// CHIẾN THUẬT: DUYỆT VÀ XEM PHIM BẰNG TRÌNH PHÁT WEB, ÉP GIAO DIỆN DỌC
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "enlessdrama_portal",
        "name": "Enless Drama",
        "description": "Duyệt web trực tiếp, 100% Player Web, Tự động ẩn rác.",
        "version": "4.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://enlessdrama.online/apple-touch-icon.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa ExoPlayer, ép xem bằng Webview
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[enlessdrama] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[enlessdrama] " + msg);
    }
}

// CHỈ TẠO 1 MỤC DUY NHẤT LÀM CỔNG VÀO
function getHomeSections() {
    return JSON.stringify([
        { slug: 'portal', title: 'Cổng Vào Enless Drama', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mở Trang Web', slug: 'portal' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) { return BASEURL; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/search?q=" + encodeURIComponent(keyword); }
function getUrlDetail(slug) { return slug; }

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// TẠO GIAO DIỆN "MỒI" ĐỂ MỞ WEBVIEW
// =============================================================================

function parseListResponse(html, url) {
    // Trả về đúng 1 Item để người dùng bấm vào mở Webview
    var items = [{
        id: BASEURL,
        title: "👉 Bấm vào đây để Mở Giao Diện Duyệt Phim",
        posterUrl: "https://enlessdrama.online/og-image.jpg",
        backdropUrl: "https://enlessdrama.online/og-image.jpg",
        episode_current: "Trang Web",
        quality: "VIP"
    }];

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1 } 
    });
}

function parseSearchResponse(html, url) {
    var kwMatch = url.match(/(?:search|q)=([^&]+)/);
    var kw = kwMatch ? decodeURIComponent(kwMatch[1]) : "";
    var webSearchUrl = BASEURL + (kw ? "/search?q=" + encodeURIComponent(kw) : "");

    var items = [{
        id: webSearchUrl,
        title: kw ? '👉 Mở Web Tìm: "' + kw + '"' : "👉 Mở Trang Tìm Kiếm",
        posterUrl: "https://enlessdrama.online/og-image.jpg",
        backdropUrl: "https://enlessdrama.online/og-image.jpg",
        episode_current: "Duyệt Web",
        quality: "VIP"
    }];
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
}

function parseMovieDetail(html, url) {
    // Tạo 1 nút duy nhất để kích hoạt Webview
    var episodes = [{ id: url, name: "Vào Trình Duyệt Enless Drama", slug: "webview-play" }];
    
    return JSON.stringify({
        id: url,
        title: "Duyệt Web Trực Tiếp",
        posterUrl: "https://enlessdrama.online/og-image.jpg",
        backdropUrl: "https://enlessdrama.online/og-image.jpg",
        description: "Bấm nút bên dưới để mở giao diện web. App đã tích hợp mã chặn quảng cáo, chặn banner tải app và tối ưu hóa trải nghiệm vuốt dọc cho bạn.",
        year: 2026,
        rating: 10,
        quality: "HD",
        servers: [{ name: "Duyệt Web 100%", episodes: episodes }]
    });
}

// =============================================================================
// WEBVIEW LOADER: ÉP GIAO DIỆN CHUẨN APP, CHẶN FULLSCREEN, ẨN RÁC
// =============================================================================

function parseDetailResponse(html, url) {
    log("Mở Cổng Webview tại: " + url);
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

                // 2. CSS Giấu rác, quảng cáo, header, footer và ẩn nút phóng to của trình phát web
                var style = document.createElement('style');
                style.innerHTML = 'header, .header, nav, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments, .vjs-fullscreen-control, .plyr__controls [data-plyr="fullscreen"], .jw-fullscreen, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #08090d !important; overscroll-behavior-y: none; }';
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
            "isEmbed": true, // Bắt buộc mở bằng Webview
            "headers": {
                "Referer": BASEURL + "/",
                "Block-Ads": "true",
                "Block-Redirects": "true", // Chặn web tự động chuyển hướng sang tab khác
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
