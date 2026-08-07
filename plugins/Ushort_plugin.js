// =============================================================================
// CẤU HÌNH DOMAIN VÀ API 
// =============================================================================
var MAIN_DOMAIN = "enlessdrama.online"; 
var BASEURL = "https://" + MAIN_DOMAIN + "/vi"; 

// ⚠️ QUAN TRỌNG: Thay link API chứa dữ liệu JSON của bạn vào đây
var API_LIST_URL = "https://api.enlessdrama.online/v1/movies"; 

// =============================================================================
// PLUGIN VAX APP: ENLESS DRAMA (HYBRID NATIVE + WEBVIEW HOOK)
// CẬP NHẬT: TỰ ĐỘNG CHỐNG LỖI TÌM KIẾM SPA REACT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "enlessdrama",
        "name": "Enless Drama",
        "description": "Kết hợp Native JSON và Webview Hook. Fix lỗi tìm kiếm trắng trang.",
        "version": "2.1.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://enlessdrama.online/apple-touch-icon.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Kích hoạt Webview ẩn tóm link video
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
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    
    // Đánh thẳng vào API tìm kiếm (Nếu API của họ dùng tham số ?search= hoặc ?q=)
    return API_LIST_URL + "?search=" + encodeURIComponent(keyword) + "&page=" + page;
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
        
        // NẾU LÀ JSON (Lấy được API thành công)
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
        
        // NẾU LÀ HTML TRẮNG (Bị React SPA chặn hoặc API lỗi) -> TẠO NÚT MỞ WEBVIEW
        else {
            var kwMatch = url.match(/(?:search|q)=([^&]+)/);
            var kw = kwMatch ? decodeURIComponent(kwMatch[1]) : "";
            var webSearchUrl = BASEURL + (kw ? "/search?q=" + encodeURIComponent(kw) : "");

            items.push({
                id: webSearchUrl,
                title: kw ? '👉 Mở Web để tìm: "' + kw + '"' : "👉 Bấm để mở EnlessDrama",
                posterUrl: "https://enlessdrama.online/og-image.jpg",
                backdropUrl: "https://enlessdrama.online/og-image.jpg",
                episode_current: "Duyệt Web",
                quality: "VIP"
            });
            return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
        }
    } catch (e) {
        log("Lỗi Parse: " + e.message);
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// TRANG CHI TIẾT: RẼ NHÁNH TÙY THEO LOẠI DỮ LIỆU ĐƯỢC CHUYỂN TỚI
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        // TRƯỜNG HỢP 1: DỮ LIỆU TỪ NATIVE API JSON
        if (url.indexOf("vaxdata://") === 0) {
            var encodedData = url.split("vaxdata://")[1];
            var movieData = JSON.parse(decodeURIComponent(encodedData));
            var eps = [];
            var epList = movieData.episodes || [];
            
            for (var i = 0; i < epList.length; i++) {
                var epNumber = i + 1;
                // Tạo URL thực tế trên web để Hook Sniffer chạy vào bắt link
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
                servers: [{ name: "Máy Chủ Auto Hook", episodes: eps }],
                quality: "HD",
                year: 2026,
                rating: 10,
                category: "Short Drama",
                status: movieData.totalEps + " Tập"
            });
        } 
        
        // TRƯỜNG HỢP 2: MỞ CỔNG WEBVIEW ĐỂ TÌM KIẾM
        else {
            return JSON.stringify({
                id: url,
                title: "Trình Duyệt Tìm Kiếm",
                posterUrl: "https://enlessdrama.online/og-image.jpg",
                backdropUrl: "https://enlessdrama.online/og-image.jpg",
                description: "Bấm vào nút bên dưới để mở giao diện website. Khi bạn gõ tìm kiếm và bấm xem 1 bộ phim bất kỳ, hệ thống sẽ tự động tóm link video và phát trên App.",
                servers: [{ name: "Cổng Không Gian", episodes: [{ id: url, name: "Vào Web Tìm Phim", slug: "webview-hook" }] }],
                quality: "HD",
                year: 2026,
                rating: 10,
                category: "Short Drama",
                status: "Webview"
            });
        }
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi hiển thị dữ liệu", servers: [] });
    }
}

// =============================================================================
// CHẠY WEBVIEW NGẦM & BẬT SNIFFER ĐỂ TÓM LINK MP4/M3U8
// =============================================================================

function parseDetailResponse(html, url) {
    log("Kích hoạt Hook Webview tại: " + url);
    try {
        var rawJS = checkRaw(runJS(), true);

        return JSON.stringify({
            url: url, 
            isEmbed: true, // Lệnh bắt buộc để bật Webview
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/",
                "Custom-Js": rawJS
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

    // 1. DỌN SẠCH GIAO DIỆN WEB ĐỂ NHƯỜNG TÀI NGUYÊN BĂNG THÔNG CHO SNIFFER
    (function injectCSS() {
        try {
            const cssStyle = "header, footer, nav, aside, .ads, iframe[sandbox], .sidebar { display: none !important; opacity: 0 !important; }";
            const styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            if (styleElement.styleSheet) { styleElement.styleSheet.cssText = cssStyle; } 
            else { styleElement.appendChild(document.createTextNode(cssStyle)); }
            document.head.appendChild(styleElement);
        } catch (error) {}
    })();

    // 2. AUTO CLICKER: TỰ ĐỘNG BẤM NÚT PLAY ĐỂ VƯỢT QUA LỚP CHỜ CỦA WEB
    var autoPlayTimer = setInterval(function() {
        try {
            var playBtns = document.querySelectorAll('.play-button, button[class*="play"], div[class*="play"]');
            for (var i = 0; i < playBtns.length; i++) {
                playBtns[i].click();
            }
            var v = document.querySelector('video');
            if (v && typeof v.play === 'function') v.play().catch(function(){});
        } catch(e) {}
    }, 1000);

    // 3. BỘ SNIFFER NETWORK VÀ DOM: GIĂNG LƯỚI TÓM LINK M3U8/MP4
    (function initLocalBlobSniffer() {
        if (window.__BLOB_SNIFFER_INITIALIZED__) return;
        window.__BLOB_SNIFFER_INITIALIZED__ = 1;

        var hasDispatchedAny = 0;
        var isFinished = 0;
        var timeoutTimer = null;
        var domScanInterval = null;

        bridgeLog("Đang rình link Video...", true);

        function stopTimeout() {
            if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
            if (domScanInterval) { clearInterval(domScanInterval); domScanInterval = null; }
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }

        // Ném link về Trình phát Video gốc của App
        function dispatchDirectLinkToApp(directUrl) {
            if (!directUrl || hasDispatchedAny === 1) return;
            hasDispatchedAny = 1;
            isFinished = 1;
            stopTimeout();

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
                            if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1 || url.indexOf('m3u8') > -1) {
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
                    if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1 || url.indexOf('m3u8') > -1) {
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

        // BẢO VỆ TIMEOUT 20S 
        timeoutTimer = setTimeout(function() {
            if (hasDispatchedAny === 0 && isFinished === 0) {
                isFinished = 1;
                stopTimeout();
                bridgeLog("❌ Vui lòng thao tác trên Web để phát Video!", false);
            }
        }, 20000);

    })();
})();
    `;
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
