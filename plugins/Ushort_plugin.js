// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "enlessdrama.online"; 
var BASEURL = "https://" + MAIN_DOMAIN + "/vi"; 

// =============================================================================
// PLUGIN VAX APP: ENLESS DRAMA (REACT SPA)
// CHIẾN THUẬT: CỔNG WEBVIEW KẾT HỢP HOOK SNIFFER BẮT LINK TỰ ĐỘNG
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "enlessdrama",
        "name": "Enless Drama",
        "description": "Duyệt web trực tiếp và bắt link mượt mà bằng Sniffer.",
        "version": "1.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://enlessdrama.online/apple-touch-icon.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Bắt buộc dùng để kích hoạt Hook Sniffer
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[enlessdrama] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[enlessdrama] " + msg);
    }
}

// TẠO CỔNG VÀO DUY NHẤT Ở TRANG CHỦ
function getHomeSections() {
    return JSON.stringify([
        { slug: 'portal', title: 'Cổng Vào Enless Drama', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Cổng Chính', slug: 'portal' }
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
        title: "👉 Bấm vào đây để Duyệt Phim trên EnlessDrama",
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
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    // Tạo 1 nút Play duy nhất để kích hoạt Webview
    var episodes = [{ id: url, name: "Mở Trình Duyệt Bắt Link", slug: "play-hook" }];
    
    return JSON.stringify({
        id: url,
        title: "Duyệt Web Enless Drama",
        posterUrl: "https://enlessdrama.online/og-image.jpg",
        backdropUrl: "https://enlessdrama.online/og-image.jpg",
        description: "Bấm nút bên dưới để mở giao diện web. Khi bạn chọn tập và phát phim, hệ thống sẽ tự động bắt link và chuyển sang Trình phát Video nội bộ siêu mượt của App.",
        year: 2026,
        rating: 10,
        quality: "HD",
        servers: [{ name: "Máy Chủ Auto Hook", episodes: episodes }]
    });
}

// =============================================================================
// CHẠY WEBVIEW NGẦM & TIÊM MÃ JAVASCRIPT ĐỂ TÓM LINK MP4/M3U8
// =============================================================================

function parseDetailResponse(html, url) {
    log("Kích hoạt Hook Webview tại: " + url);
    try {
        var rawJS = checkRaw(runJS(), true);

        return JSON.stringify({
            url: url, 
            isEmbed: true, // Kích hoạt Webview
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/",
                "Custom-Js": rawJS   // Tiêm mã Sniffer Javascript vào máu trang web
            }
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
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

// =============================================================================
// MÃ HOOK SNIFFER (JAVASCRIPT CHẠY BÊN TRONG WEBVIEW NGẦM)
// =============================================================================
function runJS() {
    return `
HTMLRAW = 0; 
BODYRAW = 0; 
CSSBLOCK = 1; 
VIDEOEND = 0; 
NUMBERRAW = 0; 

(function() {
    'use strict';
    
    function bridgeLog(msg, check) {
        try {
            if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
                window.SnifferBridge.log(msg);
                if (check === true && typeof window.SnifferBridge.toast === 'function') {
                    window.SnifferBridge.toast(msg, 1000);
                }
            }
        } catch(e) {}
    }

    // BỘ SNIFFER NETWORK VÀ DOM: GIĂNG LƯỚI TÓM LINK
    (function initLocalBlobSniffer() {
        if (window.__BLOB_SNIFFER_INITIALIZED__) return;
        window.__BLOB_SNIFFER_INITIALIZED__ = 1;

        var hasDispatchedAny = 0;
        var isFinished = 0;
        var domScanInterval = null;

        bridgeLog("Trình duyệt Sniffer đã sẵn sàng. Hãy chọn phim để xem!", true);

        // Ném link về Trình phát Video gốc của App
        function dispatchDirectLinkToApp(directUrl) {
            if (!directUrl || hasDispatchedAny === 1) return;
            hasDispatchedAny = 1;
            isFinished = 1;
            if (domScanInterval) clearInterval(domScanInterval);

            bridgeLog("🎯 Bắt link thành công! Đang chuyển sang Trình phát...", true);
            try {
                if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
                    window.SnifferBridge.play(directUrl, JSON.stringify({"Referer": window.location.href}));
                }
            } catch(e) {}
        }

        // HOOK FETCH 
        try {
            if (typeof window.fetch !== 'undefined') {
                var originalFetch = window.fetch;
                window.fetch = function() {
                    var args = arguments;
                    return originalFetch.apply(this, args).then(function(response) {
                        if (isFinished === 0 && response) {
                            var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                            if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1) {
                                bridgeLog('🎯 Tóm link từ Fetch: ' + url);
                                dispatchDirectLinkToApp(url);
                            }
                        }
                        return response;
                    });
                };
            }
        } catch (e) {}

        // HOOK XHR
        try {
            if (typeof XMLHttpRequest !== 'undefined') {
                var originalXHR = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                    if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1) {
                        bridgeLog('🎯 Tóm link từ XHR: ' + url);
                        dispatchDirectLinkToApp(url);
                    }
                    return originalXHR.apply(this, arguments);
                };
            }
        } catch (e) {}

        // HOOK DOM
        domScanInterval = setInterval(function() {
            if (isFinished === 1) return;
            var videos = document.getElementsByTagName('video');
            for (var i = 0; i < videos.length; i++) {
                var src = videos[i].src || videos[i].currentSrc;
                if (src && (src.indexOf('.mp4') > -1 || src.indexOf('.m3u8') > -1) && src.indexOf('blob:') !== 0) {
                    bridgeLog('🔍 Tóm link từ thẻ Video: ' + src);
                    dispatchDirectLinkToApp(src);
                }
            }
        }, 500);

    })();
})();
    `;
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
