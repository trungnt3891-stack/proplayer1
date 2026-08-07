// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "dramawave.dramafren.org"; 
var BASEURL = "https://" + MAIN_DOMAIN + "/index.php"; 

// =============================================================================
// PLUGIN VAX APP: DRAMAWAVE WEBVIEW PORTAL
// CHIẾN THUẬT: DUYỆT VÀ XEM PHIM BẰNG TRÌNH PHÁT WEB 100%, ÉP GIAO DIỆN DỌC
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dramawave_portal",
        "name": "DramaWave Web",
        "description": "Duyệt web trực tiếp 100%, tự động chặn quảng cáo và popup.",
        "version": "2.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://via.placeholder.com/100x100/ec4899/ffffff?text=DW",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa ExoPlayer, ép xem bằng Webview
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[dramawave] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[dramawave] " + msg);
    }
}

// CHỈ TẠO 1 MỤC DUY NHẤT LÀM CỔNG VÀO
function getHomeSections() {
    return JSON.stringify([
        { slug: 'portal', title: 'Cổng Vào DramaWave', type: 'Grid', path: '' }
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
function getUrlSearch(keyword, filtersJson) { return BASEURL + "?q=" + encodeURIComponent(keyword); }
function getUrlDetail(slug) { return slug; }

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// TẠO GIAO DIỆN "MỒI" ĐỂ MỞ WEBVIEW TỪ TRANG CHỦ & TÌM KIẾM
// =============================================================================

function parseListResponse(html, url) {
    var items = [{
        id: BASEURL,
        title: "👉 Bấm vào đây để Mở Giao Diện Web",
        posterUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Mo+Trang+Web+Dramawave",
        backdropUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Mo+Trang+Web+Dramawave",
        episode_current: "Trang Web",
        quality: "VIP"
    }];

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1 } 
    });
}

function parseSearchResponse(html, url) {
    var kwMatch = url.match(/(?:q)=([^&]+)/);
    var kw = kwMatch ? decodeURIComponent(kwMatch[1]) : "";
    var webSearchUrl = BASEURL + (kw ? "?q=" + encodeURIComponent(kw) : "");

    var items = [{
        id: webSearchUrl,
        title: kw ? '👉 Mở Web Tìm: "' + kw + '"' : "👉 Mở Trang Tìm Kiếm",
        posterUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Tim+Kiem",
        backdropUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Tim+Kiem",
        episode_current: "Duyệt Web",
        quality: "VIP"
    }];
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
}

function parseMovieDetail(html, url) {
    var episodes = [{ id: url, name: "Vào Trình Duyệt DramaWave", slug: "webview-play" }];
    
    return JSON.stringify({
        id: url,
        title: "Duyệt Web Trực Tiếp",
        posterUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=DramaWave",
        backdropUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=DramaWave",
        description: "Bấm nút bên dưới để mở giao diện web. App đã tích hợp mã chặn quảng cáo, tắt popup nhắc nhở và tối ưu hóa trải nghiệm vuốt dọc cho bạn.",
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
                style.innerHTML = 'nav, header, footer, .footer, [class*="ad-"], [id*="ad-"], iframe[src*="ads"], .vjs-fullscreen-control, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                // 3. Xử lý DOM liên tục
                setInterval(function() {
                    // Ép thẻ video chạy inline để player của web hoạt động trọn vẹn bên trong khung dọc
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    // Tắt Lớp phủ bắt click dạo (safePopupArea)
                    var safeOverlay = document.getElementById('safePopupArea');
                    if (safeOverlay) safeOverlay.remove();
                    
                    // Tắt Popup nhắc nhở "Use Google Chrome"
                    var popups = document.querySelectorAll('div[style*="z-index: 999999"]');
                    for (var i = 0; i < popups.length; i++) {
                        popups[i].style.display = 'none';
                    }
                }, 500);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Bắt buộc mở bằng Webview
            "headers": {
                "Referer": "https://" + MAIN_DOMAIN + "/",
                "Block-Ads": "true",
                "Block-Redirects": "true", // Chặn web tự động mở tab popup
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
