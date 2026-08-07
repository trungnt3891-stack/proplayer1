// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "ushort.cloud"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN VAX APP: USHORT.CLOUD
// CẬP NHẬT: QUÉT TRANG CHỦ CHUẨN XÁC + VƯỢT CLOUDFLARE BẰNG HOOK SNIFFER
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "ushort_cloud",
        "name": "UShort",
        "description": "Bắt trang chủ chuẩn xác. Vượt Cloudflare Turnstile lấy link MP4.",
        "version": "1.5.0", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/maskable-icon-512x512.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Kích hoạt Webview ẩn tóm link video
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[ushort] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[ushort] " + msg);
    }
}

// KHỞI TẠO DANH MỤC TRANG CHỦ DỰA TRÊN ẢNH GIAO DIỆN
function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: 'Tất Cả Phim Mới', type: 'Grid', path: '' },
        { slug: 'hien-dai', title: 'Hiện Đại', type: 'Horizontal', path: '' },
        { slug: 'co-dai', title: 'Cổ Đại', type: 'Horizontal', path: '' },
        { slug: 'vien-tuong', title: 'Viễn Tưởng', type: 'Horizontal', path: '' },
        { slug: 'do-thi', title: 'Đô Thị', type: 'Horizontal', path: '' },
        { slug: 'huyen-huyen', title: 'Huyền Huyễn', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất cả', slug: 'all' },
        { name: 'Hiện đại', slug: 'hien-dai' },
        { name: 'Cổ đại', slug: 'co-dai' },
        { name: 'Viễn tưởng', slug: 'vien-tuong' },
        { name: 'Hiện thực', slug: 'hien-thuc' },
        { name: 'Đô thị', slug: 'do-thi' },
        { name: 'Lịch sử', slug: 'lich-su' },
        { name: 'Giật gân', slug: 'giat-gan' },
        { name: 'KHVT', slug: 'khvt' },
        { name: 'Huyền huyễn', slug: 'huyen-huyen' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    
    // Trang chủ luôn là mỏ vàng an toàn nhất để cào list
    var url = BASEURL + "/";
    
    // Nếu có hỗ trợ load danh mục theo query, chèn thêm vào đây (Dự phòng)
    if (slug && slug !== 'all' && slug !== 'home') {
        url = BASEURL + "/?genre=" + slug; 
    }
    
    if (page > 1) {
        url += (url.indexOf('?') > -1 ? "&" : "?") + "page=" + page;
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
// BỘ TIỆN ÍCH DỌN DẸP CHUỖI
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\\u0022/g, '"')
            .replace(/\s+/g, " ")
            .trim();
    }
};

// =============================================================================
// THUẬT TOÁN BÓC TÁCH DANH SÁCH PHIM (SIÊU CẤP ĐA NĂNG)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        // 1. CẢNH BÁO NẾU BỊ CLOUDFLARE CHẶN LẠI
        if (html.indexOf('cf-turnstile') > -1 || html.indexOf('Just a moment...') > -1) {
            items.push({
                id: BASEURL,
                title: "⚠️ Bấm vào đây để Vượt Cloudflare trước khi xem",
                posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/y/y5/Cloudflare_Icon.svg/1024px-Cloudflare_Icon.svg.png",
                backdropUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/y/y5/Cloudflare_Icon.svg/1024px-Cloudflare_Icon.svg.png",
                episode_current: "Lỗi Mạng",
                quality: "HD"
            });
            return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
        }

        // 2. CHẺ HTML VÀ TRÍCH XUẤT DOM THÔNG MINH
        // Mọi thẻ <a href="..."> chứa link phim đều bị băm ra để nội soi
        var blocks = html.split('<a ');
        for(var i = 1; i < blocks.length; i++) {
            var block = "<a " + blocks[i].substring(0, 1500); 
            
            // Tìm Link Phim
            var hrefMatch = block.match(/href=["']([^"']+)["']/i);
            if (!hrefMatch) continue;
            var link = hrefMatch[1];
            
            // Bộ lọc: Chỉ lấy link thuộc về Phim (có /play/ hoặc chuỗi /xxxxx/số)
            if (link.indexOf('/play/') === -1 && link.indexOf('/phim/') === -1 && link.indexOf('/video/') === -1 && !/\/\w+\/\d+$/.test(link)) continue;
            
            // Tìm Ảnh Bìa (Xuyên thủng mọi loại lazy-load và CSS background)
            var imgStr = "";
            var imgMatch = block.match(/(?:data-src|src|srcset)=["']([^"'\s>]+)["']/i) || block.match(/background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/i);
            if (imgMatch) {
                imgStr = imgMatch[1].split(',')[0].split(' ')[0]; // Lấy link đầu tiên nếu là srcset
            }
            if (!imgStr) continue;
            
            // Tìm Tiêu Đề Phim
            var titleMatch = block.match(/alt=["']([^"']+)["']/i) || 
                             block.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                             block.match(/class=["'][^"']*line-clamp[^"']*["'][^>]*>([^<]+)</i) ||
                             block.match(/title=["']([^"']+)["']/i);
                             
            var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "Phim Hay";
            
            // Lọc rác (Loại bỏ các nút bấm Play hoặc tiêu đề rỗng)
            if (title.length < 2 || title.toLowerCase() === "play" || title.toLowerCase() === "logo") continue;
            
            // Chuẩn hóa Link
            if (imgStr.indexOf("http") === -1) imgStr = BASEURL + (imgStr.charAt(0) === '/' ? "" : "/") + imgStr;
            var finalUrl = BASEURL + (link.charAt(0) === '/' ? "" : "/") + link;
            var slug = link.split('/').pop();
            
            if (!added[slug]) {
                items.push({
                    id: finalUrl,
                    title: title,
                    posterUrl: imgStr,
                    backdropUrl: imgStr,
                    episode_current: "Full",
                    quality: "HD"
                });
                added[slug] = true;
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 10, totalItems: 9999 } 
        });
    } catch (e) {
        log("Lỗi tải trang chủ: " + e.message);
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// BƯỚC 1 CỦA PLAYER: VÀO TRANG CHI TIẾT TẠO NÚT "MỞ KHÓA"
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        log("Load Trang Phim: " + url);
        var title = "Đang tải dữ liệu...";
        var img = ""; 
        var des = "Vui lòng bấm vào nút Xem Phim bên dưới để hệ thống mở khóa Cloudflare và bắt link video tự động.";

        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (metaTitle) title = metaTitle[1].split('-')[0].trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) img = metaImg[1];

        var metaDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (metaDesc) des = metaDesc[1];

        // Rút gọn thành 1 nút bấm để Hook bắt link
        var episodes = [{ id: url, name: "Vào Xem Phim (Mở khóa Link)", slug: "play-hook" }];
        
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
// BƯỚC 2 & 3: CHẠY WEBVIEW NGẦM & TIÊM MÃ JAVASCRIPT ĐỂ TÓM LINK MP4/M3U8
// =============================================================================

function parseDetailResponse(html, url) {
    log("Kích hoạt Hook Webview tại: " + url);
    try {
        var rawJS = checkRaw(runJS(), true);

        return JSON.stringify({
            url: url, 
            isEmbed: true, // Kích hoạt Webview ẩn
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/",
                "Block-Ads": "true", // Chặn quảng cáo rác
                "Custom-Js": rawJS   // Tiêm mã Sniffer Javascript
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

        // BẢO VỆ TIMEOUT 25S 
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
