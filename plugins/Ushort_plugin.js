// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "dramawave.dramafren.org"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN VAX APP: DRAMAWAVE (RECENTLY WATCHED -> WEBVIEW PLAYER)
// CHIẾN THUẬT: HIỂN THỊ NATIVE -> VÀO PHIM DÙNG WEBVIEW GỐC CỦA TRANG
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dramawave_webview",
        "name": "DramaWave",
        "description": "Lấy phim từ Recently Watched. Xem bằng Webview chặn quảng cáo.",
        "version": "1.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://via.placeholder.com/100x100/ec4899/ffffff?text=DW",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Tắt ExoPlayer, sử dụng Trình duyệt Webview để xem
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[dramawave] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[dramawave] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'recent-watched', title: 'Phim Xem Gần Đây (Đề Cử)', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Xem Gần Đây', slug: 'recent-watched' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    // Trang chủ lấy danh sách phim bằng tham số hp (phân trang)
    return BASEURL + "/index.php?hp=" + page + "#recent-watched"; 
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    return BASEURL + "/index.php?q=" + encodeURIComponent(keyword) + "&hp=" + page;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS: LẤY DANH SÁCH TỪ PHẦN RECENTLY WATCHED
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        // Quét tìm tất cả các thẻ <a> chứa link chi tiết phim (index.php?page=detail...)
        var aRegex = /<a[^>]+href=["'](index\.php\?page=detail&id=[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var link = match[1];
            var innerHtml = match[2];
            
            // Tìm tiêu đề phim
            var titleMatch = innerHtml.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "DramaWave Film";
            
            // Bỏ qua các thẻ <a> là nút bấm "Watch" hoặc không có tiêu đề
            if (title.length < 2 || title.toLowerCase() === "watch") continue;
            
            // Tìm ảnh bìa
            var imgMatch = innerHtml.match(/src=["']([^"']+)["']/i);
            var imgStr = imgMatch ? imgMatch[1] : "https://via.placeholder.com/300x400/1e293b/ec4899?text=No+Image";
            
            // Chuẩn hóa link & tạo slug chống trùng
            var finalUrl = BASEURL + "/" + link.replace(/&amp;/g, "&");
            var idMatch = link.match(/id=([^&]+)/);
            var slug = idMatch ? idMatch[1] : finalUrl;
            
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

        // Cập nhật cơ chế phân trang dựa trên tham số url
        var currentPage = 1;
        var hpMatch = url.match(/hp=(\d+)/);
        if (hpMatch) currentPage = parseInt(hpMatch[1]);

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: items.length > 0 ? currentPage + 1 : currentPage, totalItems: 9999 } 
        });
    } catch (e) {
        log("Lỗi Parse List: " + e.message);
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// TRANG CHI TIẾT: HIỂN THỊ INFO VÀ NÚT CHỌN WEBVIEW PLAYER
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        log("Load Trang Chi Tiết: " + url);
        var title = "Phim DramaWave";
        var img = "https://via.placeholder.com/600x800/1e293b/ec4899?text=Play+Video"; 
        var des = "Vui lòng bấm vào nút Phát bên dưới để mở giao diện Trình duyệt. Video sẽ được tối ưu chạy dọc và tự động ẩn các quảng cáo / popup làm phiền.";

        // Trích xuất Tiêu đề & Bìa từ thẻ Meta OG
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (metaTitle) {
            var tempTitle = metaTitle[1].replace('DramaWave Unlocked - Watch Trending Short Dramas & Mini Series Online', '').trim();
            if (tempTitle) title = tempTitle;
        }

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg && metaImg[1].indexOf('placeholder') === -1) img = metaImg[1];

        // Nếu có nút "Watch" trong trang chi tiết để đi tới trang phát cụ thể
        var playUrl = url;
        var watchMatch = html.match(/href=["']([^"']+)["'][^>]*>\s*Watch/i);
        if (watchMatch) {
            playUrl = watchMatch[1].indexOf('http') === 0 ? watchMatch[1] : BASEURL + "/" + watchMatch[1].replace(/^\//, '');
        }

        // TẠO NÚT "WEBVIEW PLAYER" ĐỂ PHÁT PHIM
        var episodes = [{ id: playUrl, name: "Phát Bằng Trình Duyệt Web", slug: "webview-player" }];
        
        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: img,
            backdropUrl: img,
            description: des,
            year: 2026,
            rating: 10,
            quality: "HD",
            category: "Short Drama",
            status: "Hoàn Thành",
            servers: [{ name: "Webview Player", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải dữ liệu chi tiết", servers: [] });
    }
}

// =============================================================================
// WEBVIEW LOADER: ÉP DỌC, CHẶN FULLSCREEN, DỌN RÁC
// =============================================================================

function parseDetailResponse(html, url) {
    log("Mở Trình Phát Webview tại: " + url);
    try {
        var pureWebviewJs = `
            (function() {
                // 1. Chặn Fullscreen để giữ video luôn hiển thị trọn vẹn trong màn hình dọc
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

                // 2. CSS Dọn rác: Ẩn nav, footer, popup và nút phóng to của video
                var style = document.createElement('style');
                style.innerHTML = 'nav, header, footer, .footer, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .vjs-fullscreen-control, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                // 3. Tối ưu liên tục bằng Interval
                setInterval(function() {
                    // Ép video chạy playsinline
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    // Tắt lớp phủ vô hình (safePopupArea) bắt click quảng cáo popup
                    var safeOverlay = document.getElementById('safePopupArea');
                    if(safeOverlay) safeOverlay.remove();
                    
                    // Tắt thông báo "Use Google Chrome"
                    var chromeBanner = document.querySelectorAll('div[style*="z-index: 999999"]');
                    for (var i = 0; i < chromeBanner.length; i++) {
                        chromeBanner[i].style.display = 'none';
                    }
                }, 500);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Bắt buộc mở bằng Trình duyệt
            "headers": {
                "Referer": BASEURL + "/",
                "Block-Ads": "true",
                "Block-Redirects": "true", // Chặn web tự mở tab popup mới
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
