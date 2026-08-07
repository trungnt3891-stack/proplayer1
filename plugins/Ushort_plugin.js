// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "dramawave.dramafren.org"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN VAX APP: DRAMAWAVE UNLOCKED (HYBRID)
// CHIẾN THUẬT: HIỆN GIAO DIỆN NATIVE + AUTO CONVERT LINK GỐC SANG WEBVIEW
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dramawave_hybrid",
        "name": "DramaWave",
        "description": "Giao diện Native. Tự động dịch link MyDramaWave sang trang xem miễn phí.",
        "version": "3.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": "https://via.placeholder.com/100x100/ec4899/ffffff?text=DW",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa ExoPlayer, ép xem bằng Trình duyệt
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
        { slug: 'recent-watched', title: 'Phim Ngắn Đề Cử', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'recent-watched' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    return BASEURL + "/index.php?hp=" + page + "#recent-watched"; 
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    
    // NẾU GÕ HOẶC DÁN LINK GỐC (m.mydramawave.com) VÀO Ô TÌM KIẾM
    if (keyword.indexOf("mydramawave.com") > -1) {
        // Tự động đẩy link vào cổng giải mã của trang trung gian
        return BASEURL + "/index.php?lang=en-US&input_raw=" + encodeURIComponent(keyword);
    }
    
    // NẾU GÕ TÊN PHIM BÌNH THƯỜNG
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
// PARSERS: BÓC TÁCH HTML NATIVE Ở MÀN HÌNH CHÍNH & TÌM KIẾM
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        var aRegex = /<a[^>]+href=["'](index\.php\?page=detail&id=[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var link = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "Phim Hay";
            if (title.length < 2 || title.toLowerCase() === "watch") continue;
            
            var imgMatch = innerHtml.match(/src=["']([^"']+)["']/i);
            var imgStr = imgMatch ? imgMatch[1] : "https://via.placeholder.com/300x400/1e293b/ec4899?text=No+Image";
            
            var idMatch = link.match(/id=([^&]+)/);
            var slug = idMatch ? idMatch[1] : link;
            var finalUrl = BASEURL + "/" + link;
            
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

        var currentPage = 1;
        var hpMatch = url.match(/hp=(\d+)/);
        if (hpMatch) currentPage = parseInt(hpMatch[1]);
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: items.length > 0 ? currentPage + 1 : currentPage, totalItems: 9999 } 
        });
    } catch (e) {
        log("Lỗi Parse: " + e.message);
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    // NẾU URL LÀ CỔNG CHUYỂN ĐỔI LINK GỐC (input_raw)
    if (url.indexOf("input_raw=") > -1) {
        var items = [{
            id: url,
            title: "👉 Link Gốc Đã Được Giải Mã!",
            posterUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Phat+Phim+Ngay",
            backdropUrl: "https://via.placeholder.com/600x800/1e293b/ec4899?text=Phat+Phim+Ngay",
            episode_current: "Bấm Xem Ngay",
            quality: "VIP"
        }];
        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
    }
    
    // NẾU LÀ TÌM KIẾM BẰNG CHỮ BÌNH THƯỜNG
    return parseListResponse(html, url);
}

// =============================================================================
// TRANG CHI TIẾT: TẠO GIAO DIỆN BẤM LÀ MỞ TRÌNH DUYỆT CỦA WEB
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        log("Load Trang Chi Tiết: " + url);
        var title = "Đang cập nhật...";
        var img = "https://via.placeholder.com/600x800/1e293b/ec4899?text=DramaWave"; 
        var des = "Vui lòng bấm vào nút Xem Phim bên dưới để mở giao diện Trình duyệt của Web và xem trực tiếp tại đó.";

        // Nếu là link chuyển đổi trực tiếp, bỏ qua bóc tách HTML rỗng
        if (url.indexOf("input_raw=") > -1) {
            title = "Phát Phim Trực Tiếp";
            des = "Hệ thống đã tự động chuyển đổi link gốc sang trình phát Web không giới hạn. Bấm vào nút bên dưới để xem phim ngay lập tức.";
        } else {
            // Bóc tách từ trang chi tiết thông thường
            var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
            if (metaTitle) title = metaTitle[1].replace('DramaWave Unlocked - Watch Trending Short Dramas & Mini Series Online', '').trim();

            var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            if (metaImg && metaImg[1].indexOf('placeholder') === -1) img = metaImg[1];
        }

        // Tạo 1 nút bấm duy nhất để gọi Webview mở web
        var playUrl = url;
        var playMatch = html.match(/href=["']([^"']+)["'][^>]*>Watch/i);
        if (playMatch && playMatch[1].indexOf('http') === -1) {
            playUrl = BASEURL + "/" + playMatch[1];
        } else if (playMatch) {
            playUrl = playMatch[1];
        }

        var episodes = [{ id: playUrl, name: "Mở Trình Phát Của Trang Web", slug: "webview-play" }];
        
        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: img,
            backdropUrl: img,
            description: des,
            year: 2026,
            rating: 10,
            quality: "HD",
            servers: [{ name: "Dramawave Web Player", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải dữ liệu", servers: [] });
    }
}

// =============================================================================
// WEBVIEW LOADER: ÉP DỌC, CHẶN FULLSCREEN, ẨN QUẢNG CÁO & RÁC
// =============================================================================

function parseDetailResponse(html, url) {
    log("Mở Cổng Webview tại: " + url);
    try {
        var pureWebviewJs = `
            (function() {
                // 1. Chặn Fullscreen để Android không phóng to video ra khỏi màn hình dọc
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

                // 2. Ẩn quảng cáo, navbar, footer và các thông báo phiền phức
                var style = document.createElement('style');
                style.innerHTML = 'nav, header, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments, .vjs-fullscreen-control, .plyr__controls [data-plyr="fullscreen"], .jw-fullscreen, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                // 3. Ép video chạy dọc (playsinline) và đóng tự động popup rác
                setInterval(function() {
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"], span[style*="cursor: pointer"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        if(closeBtns[j].innerText.indexOf('×') > -1 || closeBtns[j].innerHTML.indexOf('&times;') > -1) {
                            try { closeBtns[j].click(); } catch(e){}
                        }
                    }
                    
                    var safeOverlay = document.getElementById('safePopupArea');
                    if(safeOverlay) safeOverlay.remove();

                }, 500);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Mở luôn bằng Trình duyệt Webview
            "headers": {
                "Referer": BASEURL + "/",
                "Block-Ads": "true",
                "Block-Redirects": "true", 
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
