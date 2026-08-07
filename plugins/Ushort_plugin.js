// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "ushort.cloud"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN VAX APP: USHORT.CLOUD
// CHIẾN THUẬT: WEBVIEW HOOK SNIFFER (VƯỢT CLOUDFLARE TURNSTILE & SUPABASE)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "ushort_cloud",
        "name": "UShort",
        "description": "Vượt Cloudflare Turnstile bằng Webview ngầm. Hook bắt link M3U8/MP4 trực tiếp.",
        "version": "1.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/maskable-icon-512x512.png",
        "isEnabled": true,
        "type": "shortfilm", // Hiển thị dạng video ngắn vuốt dọc
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // [TUYỆT ĐỐI QUAN TRỌNG] Kích hoạt Webview ẩn tóm link
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[ushort] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[ushort] " + msg);
    }
}

// KHỞI TẠO DANH MỤC TRANG CHỦ CƠ BẢN
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
    var filters = {};
    try { filters = JSON.parse(filtersJson || "{}"); } catch(e){}
    var page = filters.page || 1;
    
    var finalSlug = (slug || "").replace(/^\//, ""); 
    var url = BASEURL + "/" + finalSlug;
    
    if (page > 1) {
        url += (url.indexOf('?') !== -1 ? "&page=" : "?page=") + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    var url = BASEURL + "/search?q=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS: THUẬT TOÁN BÓC TÁCH DANH SÁCH PHIM
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        // Quét tìm tất cả các thẻ <a> chứa link phim (thường có /play/ hoặc /phim/)
        var aRegex = /<a[^>]+href=["'](\/(?:play|phim|video)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/<h[345][^>]*>([^<]+)<\/h[345]>/i) || innerHtml.match(/alt=["']([^"']+)["']/i);
            var imgMatch = innerHtml.match(/src=["']([^"']+)["']/i);

            if (titleMatch && imgMatch) {
                var phimUrl = BASEURL + slug;
                var img = imgMatch[1]; 
                if (img.indexOf("http") === -1) img = BASEURL + img;
                
                var title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
                var epMatch = innerHtml.match(/Tập\s*\d+/i);
                var episode = epMatch ? epMatch[0].trim() : "Full";
                
                if (!added[slug] && title) {
                    items.push({
                        id: phimUrl,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        episode_current: episode,
                        quality: "HD"
                    });
                    added[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 10, totalItems: 9999 } 
        });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// BƯỚC 1: VÀO TRANG CHI TIẾT LẤY THÔNG TIN CƠ BẢN
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        log("Load Trang Phim: " + url);
        var title = "Đang cập nhật...";
        var img = ""; 
        var des = "Không có mô tả.";

        // Bóc tách siêu tốc bằng Thẻ Meta SEO (Đã có sẵn trong mã HTML bạn cung cấp)
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (metaTitle) title = metaTitle[1].split('-')[0].trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) img = metaImg[1];

        var metaDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (metaDesc) des = metaDesc[1];

        // Vì UShort phát trực tiếp trên URL này (ví dụ /play/dramarush/22382)
        // Ta tạo đúng 1 nút bấm để kích hoạt Webview ngầm
        var episodes = [{ id: url, name: "Vào Xem Phim (Mở khóa Cloudflare)", slug: "tap-1" }];
        
        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: img,
            backdropUrl: img,
            description: des,
            year: 2026,
            rating: 10,
            quality: "HD",
            servers: [{ name: "UShort Server (Auto Hook)", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải dữ liệu", servers: [] });
    }
}

// =============================================================================
// BƯỚC 2 & 3: CHẠY WEBVIEW NGẦM & TIÊM MÃ JAVASCRIPT ĐỂ BẮT LINK
// =============================================================================

function parseDetailResponse(html, url) {
    log("Kích hoạt Hook Webview tại: " + url);
    try {
        var rawJS = checkRaw(runJS(), true);

        return JSON.stringify({
            url: url, 
            isEmbed: true, // Lệnh bắt buộc để bật Webview ngầm
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/",
                "Block-Ads": "true", // Chặn quảng cáo rác làm nặng Webview
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
            // Tìm các nút có class chứa chữ 'play'
            var playBtns = document.querySelectorAll('.play-button, button[class*="play"], div[class*="play"]');
            for (var i = 0; i < playBtns.length; i++) {
                playBtns[i].click();
            }
            
            // Hoặc ép thẻ video tự phát nếu đã tải xong
            var v = document.querySelector('video');
            if (v && typeof v.play === 'function') v.play().catch(function(){});
        } catch(e) {}
    }, 1000);

    // 3. BỘ SNIFFER NETWORK VÀ DOM: GIĂNG LƯỚI TÓM LINK
    (function initLocalBlobSniffer() {
        if (window.__BLOB_SNIFFER_INITIALIZED__) return;
        window.__BLOB_SNIFFER_INITIALIZED__ = 1;

        var hasDispatchedAny = 0;
        var isFinished = 0;
        var timeoutTimer = null;
        var domScanInterval = null;

        bridgeLog("Đang vượt Cloudflare và rình link Video...", true);

        function stopTimeout() {
            if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
            if (domScanInterval) { clearInterval(domScanInterval); domScanInterval = null; }
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }

        // Hàm Ném link về cho Vax App
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

        // HOOK FETCH (Đón đầu các API trả về link M3U8/MP4)
        try {
            if (typeof window.fetch !== 'undefined') {
                var originalFetch = window.fetch;
                window.fetch = function() {
                    var args = arguments;
                    return originalFetch.apply(this, args).then(function(response) {
                        if (isFinished === 0 && response) {
                            var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                            // Bắt link có đuôi mp4, m3u8 hoặc chứa đường dẫn proxy của Dramawave
                            if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1 || url.indexOf('dramawave-proxy') > -1) {
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
                    if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1 || url.indexOf('dramawave-proxy') > -1) {
                        bridgeLog('🎯 Tóm link từ XHR: ' + url);
                        dispatchDirectLinkToApp(url);
                    }
                    return originalXHR.apply(this, arguments);
                };
            }
        } catch (e) {}

        // HOOK DOM: Canh chừng thẻ <video>
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

        // BẢO VỆ TIMEOUT 25S (Chờ Cloudflare quay xong)
        timeoutTimer = setTimeout(function() {
            if (hasDispatchedAny === 0 && isFinished === 0) {
                isFinished = 1;
                stopTimeout();
                bridgeLog("❌ Đã quá thời gian chờ (Có thể do mạng chậm hoặc Cloudflare chặn)!", false);
            }
        }, 25000);

    })();
})();
    `;
}

// =============================================================================
// CÁC HÀM KHÔNG SỬ DỤNG
// =============================================================================
function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
