// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "dramawave.dramafren.org"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN VAX APP: DRAMAWAVE (NATIVE TO WEBVIEW)
// BẢN CẬP NHẬT: THUẬT TOÁN "BĂM HTML" BẮT BÌA VÀ LINK SIÊU CHUẨN
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dramawave_webview",
        "name": "DramaWave",
        "description": "Thuật toán băm HTML bắt bìa siêu chuẩn. Xem phim bằng Webview Player.",
        "version": "1.5.0", 
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
    // Lấy danh sách phim bằng tham số hp (phân trang)
    return BASEURL + "/index.php?hp=" + page; 
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
// PARSERS: THUẬT TOÁN "BĂM HTML" ĐỂ LẤY DANH SÁCH PHIM
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        // CẢNH BÁO NẾU BỊ CLOUDFLARE CHẶN LẠI MÀ KHÔNG TRẢ VỀ HTML PHIM
        if (html.indexOf('cf-turnstile') > -1 || html.indexOf('Just a moment...') > -1) {
            items.push({
                id: BASEURL,
                title: "⚠️ Mạng bị Cloudflare chặn. Hãy bấm vào đây để mở Webview giải Captcha.",
                posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/y/y5/Cloudflare_Icon.svg/1024px-Cloudflare_Icon.svg.png",
                backdropUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/y/y5/Cloudflare_Icon.svg/1024px-Cloudflare_Icon.svg.png",
                episode_current: "Lỗi Mạng",
                quality: "HD"
            });
            return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
        }

        // BĂM HTML: Cắt nhỏ HTML theo từng thẻ <a 
        var blocks = html.split('<a ');
        
        for (var i = 1; i < blocks.length; i++) {
            var block = "<a " + blocks[i];
            
            // 1. TÌM LINK
            var hrefMatch = block.match(/href=["']([^"']+)["']/i);
            if (!hrefMatch) continue;
            var link = hrefMatch[1].replace(/&amp;/g, "&"); // Fix lỗi HTML encode
            
            // Chỉ lấy các thẻ a trỏ vào trang chi tiết phim
            if (link.indexOf('page=detail&id=') === -1) continue;
            
            // 2. TÌM TIÊU ĐỀ
            var titleMatch = block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i) || block.match(/title=["']([^"']+)["']/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";
            if (!title || title.toLowerCase() === "watch") continue; // Lọc rác
            
            // 3. TÌM ẢNH BÌA
            var imgMatch = block.match(/<img[^>]+src=["']([^"'\s]+)["']/i);
            var imgStr = imgMatch ? imgMatch[1] : "https://via.placeholder.com/600x800/1e293b/ec4899?text=DramaWave";
            
            // 4. CHUẨN HÓA VÀ GOM DỮ LIỆU
            var finalUrl = BASEURL + "/" + link.replace(/^\//, "");
            var slugMatch = link.match(/id=([^&]+)/);
            var slug = slugMatch ? slugMatch[1] : finalUrl;
            
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

        // TÍNH TOÁN PHÂN TRANG
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
// TRANG CHI TIẾT: TẠO NÚT BẤM MỞ TRÌNH DUYỆT CỦA WEB
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

        // TẠO NÚT "WEBVIEW PLAYER" CHỨA LINK TRANG CHI TIẾT
        var episodes = [{ id: url, name: "Phát Bằng Trình Duyệt Web", slug: "webview-player" }];
        
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
            servers: [{ name: "Trình Phát Webview", episodes: episodes }]
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
                    
                    // Bấm tắt các nút close (x) xuất hiện
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"], span[style*="cursor: pointer"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        if(closeBtns[j].innerText.indexOf('×') > -1 || closeBtns[j].innerHTML.indexOf('&times;') > -1) {
                            try { closeBtns[j].click(); } catch(e){}
                        }
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
