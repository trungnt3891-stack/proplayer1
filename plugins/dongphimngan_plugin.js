// =============================================================================
// CẤU HÌNH DOMAIN (SỬA TÊN MIỀN Ở ĐÂY NẾU WEB ĐỔI ĐỊA CHỈ)
// =============================================================================
var MAIN_DOMAIN = "dongphimngan.com";
var BASEURL = "https://" + MAIN_DOMAIN;

// =============================================================================
// PLUGIN VAX APP: ĐỘNG PHIM NGẮN TRUNG
// CHIẾN THUẬT: VÀO NHẸ NHÀNG TRANG 1 -> BẤM XEM NGAY -> HOOK BẮT LINK TRANG 2
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "description": "Vào Trang 1 siêu nhanh. Bấm Xem Ngay để Hook tóm link ở Trang 2.",
        "version": "6.1.0", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // [QUAN TRỌNG NHẤT] Kích hoạt Webview ẩn tóm link đẩy về Player gốc
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[dongphimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[dongphimngan] " + msg);
    }
}

// KHỞI TẠO CÁC FOLDER Ở TRANG CHỦ (CHIA BẢNG LƯỚT NGANG & LƯỚI)
function getHomeSections() {
    return JSON.stringify([
        { slug: '?section=Phim Mới Cập Nhật', title: 'Phim Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: '?section=Top 10', title: 'Bảng Xếp Hạng Top 10', type: 'Horizontal', path: '' },
        { slug: '?section=Ngọt đến sâu răng', title: 'Ngọt Sủng Sâu Răng', type: 'Horizontal', path: '' },
        { slug: 'the-loai/ngon-tinh', title: 'Phim Ngôn Tình', type: 'Grid', path: '' },
        { slug: 'the-loai/cuoi-truoc-yeu-sau', title: 'Cưới Trước Yêu Sau', type: 'Horizontal', path: '' },
        { slug: 'the-loai/tong-tai', title: 'Tổng Tài Bá Đạo', type: 'Horizontal', path: '' },
        { slug: 'the-loai/nu-cuong', title: 'Nữ Cường & Báo Thù', type: 'Horizontal', path: '' },
        { slug: 'the-loai/hai-huoc', title: 'Phim Hài Hước', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trang Chủ', slug: '' },
        { name: 'Ngôn Tình', slug: 'the-loai/ngon-tinh' },
        { name: 'Chữa Lành', slug: 'the-loai/chua-lanh' },
        { name: 'Cưới Trước Yêu Sau', slug: 'the-loai/cuoi-truoc-yeu-sau' },
        { name: 'Nữ Cường', slug: 'the-loai/nu-cuong' },
        { name: 'Ngọt Sủng', slug: 'the-loai/ngot-sung' },
        { name: 'Tổng Tài Bá Đạo', slug: 'the-loai/tong-tai' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Hiện Đại', slug: 'the-loai/hien-dai' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' }
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
    
    if (slug && slug.indexOf('?section=') === 0) {
        return BASEURL + "/" + slug; 
    }
    
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
    var url = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
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
// PARSERS: THUẬT TOÁN BÓC TÁCH FOLDER VÀ BẢNG LƯỚT
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        var targetSection = "";
        
        if (url && url.indexOf('?section=') !== -1) {
            targetSection = decodeURIComponent(url.split('?section=')[1]).toLowerCase();
        }
        
        if (targetSection) {
            var sections = html.split('<section');
            var foundHtml = "";
            for (var i = 1; i < sections.length; i++) {
                var sec = sections[i];
                var titleMatch = sec.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
                if (titleMatch && titleMatch[1].replace(/<[^>]*>/g, "").toLowerCase().indexOf(targetSection) !== -1) {
                    foundHtml = sec;
                    break;
                }
            }
            if (foundHtml) html = foundHtml; 
            else return JSON.stringify({ items: [] });
        }
        
        var aRegex = /<a[^>]+href=["']\/phim\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i) || innerHtml.match(/alt=["']([^"']+)["']/i);
            var imgMatch = innerHtml.match(/src=["']([^"']+)["']/i);

            if (titleMatch && imgMatch) {
                var phimUrl = BASEURL + "/phim/" + slug;
                var img = imgMatch[1].split(' ')[0]; 
                if (img.indexOf("http") === -1) img = BASEURL + img;
                
                var title = titleMatch[1].replace(/<[^>]*>/g, "").trim();
                var epMatch = innerHtml.match(/>\s*(Trọn bộ|Tập \d+|Full[^<]*)\s*<\/span>/i);
                var episode = epMatch ? epMatch[1].trim() : "Full Tập";
                
                if (!added[slug] && title) {
                    items.push({
                        id: phimUrl,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        episode_current: episode,
                        quality: "FHD"
                    });
                    added[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: targetSection ? 1 : 10, totalItems: 9999 } 
        });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// BƯỚC 1: LOAD TRANG 1 SIÊU NHANH (XUẤT RA ĐÚNG 1 NÚT BẤM)
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        log("Load Trang 1: " + url);
        var title = "Đang cập nhật...";
        var img = ""; 
        var des = "Không có mô tả.";

        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (metaTitle) title = metaTitle[1].split('-')[0].split('|')[0].trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) img = metaImg[1];

        var metaDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (metaDesc) des = metaDesc[1].replace(/\\n/g, '\n');

        // KIẾN TẠO LINK TRANG 2 (TRANG XEM PHIM CỦA NEXT.JS) ĐỂ GẮN VÀO NÚT
        var watchUrl = url;
        var movieSlugMatch = html.match(/"movieSlug":"([^"]+)"/);
        var epSlugMatch = html.match(/"slug":"([^"]+)"/);
        
        if (movieSlugMatch && epSlugMatch) {
            // Dựng URL phát phim chuẩn của web
            watchUrl = BASEURL + "/xem-phim/" + movieSlugMatch[1] + "/1080/vietsub/" + epSlugMatch[1];
        } else {
            watchUrl = BASEURL + "/xem-phim/" + url.split('/').pop() + "/1080/vietsub/full";
        }

        // TẠO ĐÚNG 1 NÚT BẤM CHO TOÀN BỘ PHIM
        var episodes = [{ id: watchUrl, name: "Vào Xem Phim", slug: "tap-1" }];
        
        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: img,
            backdropUrl: img,
            description: des,
            year: 2026,
            rating: 10,
            quality: "HD",
            servers: [{ name: "Máy Chủ Tự Động Tóm Link", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải dữ liệu", servers: [] });
    }
}

// =============================================================================
// BƯỚC 2 & 3: KHI BẤM "VÀO XEM PHIM", CHẠY WEBVIEW NGẦM TRÊN TRANG 2 & BẬT HOOK
// =============================================================================

function parseDetailResponse(html, url) {
    log("Kích hoạt Hook tại Trang 2: " + url);
    try {
        var rawJS = checkRaw(runJS(), true);

        return JSON.stringify({
            url: url, // Đẩy thẳng vào Player ẩn
            isEmbed: true, // Kích hoạt Webview ẩn để Sniffer chạy
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "Referer": BASEURL,
                "Block-Ads": "true", // Chặn rác làm nặng Webview
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
// THƯ VIỆN BẢO VỆ CHUỖI & SNIFFER (HOOK)
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
// MÃ HOOK SNIFFER CHẠY BÊN TRONG WEBVIEW NGẦM
// =============================================================================
function runJS() {
    return `
HTMLRAW = 0; 
BODYRAW = 0; 
CSSBLOCK = 1; 
VIDEOEND = 0; 
NUMBERRAW = 0; 
HOOK_NETWORK_AND_DOM = 1; // Rất quan trọng để bắt link ẩn

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

    // ĐẶC TRỊ DOM: QUÉT BASE64 NGAY LẬP TỨC (Không cần đợi Play)
    try {
        var rawHtml = document.documentElement.innerHTML;
        var base64Match = rawHtml.match(/"videoUrl"\\s*:\\s*"(aHR0cHM[^"]+)"/i);
        if (base64Match) {
            var decodedUrl = atob(base64Match[1]); // Giải mã siêu tốc
            if (decodedUrl) {
                bridgeLog("🔓 Đã phá mã Base64 thành công! " + decodedUrl, true);
                if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
                    window.SnifferBridge.play(decodedUrl, JSON.stringify({"Referer": window.location.href}));
                    return; // Link đã được ném về ExoPlayer, dừng mọi thứ lại.
                }
            }
        }
    } catch(e) {}

    // 2. AUTO CLICKER: NẾU KHÔNG CÓ BASE64, TỰ ĐỘNG BẤM PLAY ĐỂ KÍCH NỔ VIDEO
    var autoPlayTimer = setInterval(function() {
        try {
            var svgs = document.querySelectorAll('svg');
            for (var k = 0; k < svgs.length; k++) {
                var p = svgs[k].parentNode;
                while(p && p.tagName !== 'BUTTON' && p.tagName !== 'DIV' && p.tagName !== 'BODY') p = p.parentNode;
                if (p && (p.tagName === 'BUTTON' || (p.className && typeof p.className === 'string' && p.className.indexOf('play') > -1))) p.click();
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

        bridgeLog("Đang rình link Video...", true);

        function stopTimeout() {
            if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
            if (domScanInterval) { clearInterval(domScanInterval); domScanInterval = null; }
            if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
        }

        function dispatchDirectLinkToApp(directUrl) {
            if (!directUrl || hasDispatchedAny === 1) return;
            hasDispatchedAny = 1;
            isFinished = 1;
            stopTimeout();

            bridgeLog("🎯 Bắt link thành công! Đang phát...", true);
            try {
                if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
                    window.SnifferBridge.play(directUrl, JSON.stringify({"Referer": window.location.href}));
                }
            } catch(e) {}
        }

        if (HOOK_NETWORK_AND_DOM === 1) {
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
        }

        // BẢO VỆ TIMEOUT 25S
        timeoutTimer = setTimeout(function() {
            if (hasDispatchedAny === 0 && isFinished === 0) {
                isFinished = 1;
                stopTimeout();
                bridgeLog("❌ Đã quá thời gian chờ nhưng không tìm thấy link phù hợp!", false);
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
