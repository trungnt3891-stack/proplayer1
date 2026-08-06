// =============================================================================
// PLUGIN VAAPP: PHIMNGAN.NET (Bản Chuẩn - Load Siêu Tốc & Sạch Lỗi)
// =============================================================================

var BASEURL = "https://phimngan.net";

function getManifest() {
    return JSON.stringify({
        "id": "phimngan_net",
        "name": "PhimNgan.Net",
        "description": "Bản Webview Gốc: Load siêu tốc, ép video dọc, xóa rác giao diện.",
        "version": "1.9.5",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/icon-192x192.png",
        "isEnabled": true,
        "hasLogin": true,                     
        "loginUrl": BASEURL,    
        "type": "shortfilm",                  
        "layoutType": "VERTICAL",             
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa hoàn toàn Sniffer, sử dụng Webview Gốc
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[phimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[phimngan] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: '/', title: 'Mới Cập Nhật', type: 'Grid' },
        { slug: '/genres/phim-ai', title: 'Phim AI', type: 'Horizontal' },
        { slug: '/genres/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal' },
        { slug: '/genres/tong-tai', title: 'Tổng Tài', type: 'Horizontal' },
        { slug: '/genres/cung-dau', title: 'Cung Đấu', type: 'Grid' },
        { slug: '/genres/hanh-dong', title: 'Hành Động', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: '/' },
        { name: 'Phim AI', slug: '/genres/phim-ai' },
        { name: 'Ngôn Tình', slug: '/genres/ngon-tinh' },
        { name: 'Tổng Tài', slug: '/genres/tong-tai' },
        { name: 'Cung Đấu', slug: '/genres/cung-dau' },
        { name: 'Gia Đình', slug: '/genres/gia-dinh' },
        { name: 'Hài Hước', slug: '/genres/hai-huoc' },
        { name: 'Phục Thù', slug: '/genres/phuc-thu' },
        { name: 'Xuyên Không', slug: '/genres/xuyen-khong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var filters = JSON.parse(filtersJson);
            page = parseInt(filters.page) || 1;
        }

        if (slug && slug.indexOf("http") === 0) return slug;

        var path = slug || "/";
        var resultUrl = BASEURL + (path.indexOf("/") === 0 ? path : "/" + path);

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        
        return resultUrl;
    } catch (e) {
        return BASEURL + "/";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encoded = encodeURIComponent(keyword.trim());
    return BASEURL + "/search?q=" + encoded;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL + "/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, apiUrl) {
    var items = [];
    try {
        // Tách từng đoạn HTML chứa thẻ <a> để tránh bị trôi Regex
        var chunks = html.split('<a ');
        var seen = {};

        for (var i = 1; i < chunks.length; i++) {
            var chunk = '<a ' + chunks[i]; 

            // Chỉ bắt thẻ a có chứa href /phim/ hoặc /watch/
            var hrefM = chunk.match(/href=["'](\/(?:phim|watch)\/[^"']+)["']/i);
            if (!hrefM) continue;

            var link = hrefM[1];
            var id = BASEURL + link;

            if (seen[id]) continue;
            seen[id] = true;

            // Bắt tiêu đề
            var title = "";
            var titleM = chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
            if (titleM) {
                title = titleM[1].replace(/<[^>]+>/g, '').trim();
            } else {
                var altM = chunk.match(/alt=["']([^"']+)["']/i);
                if (altM) title = altM[1].trim();
            }

            if (!title) continue; 

            // Bắt ảnh bìa
            var img = "";
            var imgM = chunk.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgM) {
                img = imgM[1];
                if (img.indexOf('url=') > -1) {
                    var uM = img.match(/url=([^&]+)/);
                    if (uM) img = decodeURIComponent(uM[1]);
                }
            }
            if (img && img.indexOf('http') === -1) {
                if (img.indexOf('//') === 0) img = "https:" + img;
                else img = BASEURL + img;
            }

            // Bắt trạng thái tập
            var ep = "Full";
            var epM = chunk.match(/<span[^>]*uppercase[^>]*>([\s\S]*?)<\/span>/i);
            if (epM) {
                ep = epM[1].replace(/<[^>]+>/g, '').trim();
            }

            items.push({
                id: id,
                title: title,
                posterUrl: img,
                backdropUrl: img,
                quality: "HD",
                episode_current: ep
            });
        }
    } catch(e) {
        log("Parse Error: " + e.message);
    }

    return JSON.stringify({
        items: items,
        pagination: {
            currentPage: 1,
            totalPages: 99 // Nền tảng tự động cuộn trang
        }
    });
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(" - PhimNgan.Net", "") : "Phim Ngắn";

        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1] : "";

        // Trả trực tiếp 1 nút bấm để load giao diện Webview (Vuốt chuyển tập tự do)
        var servers = [{
            name: "Lướt Chuyển Tập",
            episodes: [{
                id: url,
                name: "Bấm vào để Xem & Vuốt",
                slug: "webview-player"
            }]
        }];

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            quality: "HD",
            year: 2026,
            rating: 8.5,
            status: "Full",
            category: "Phim Ngắn",
            episode_current: "Đang phát",
            servers: servers
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        // Áp dụng chuẩn logic CustomJS từ mẫu shortflix
        var pureWebviewJs = `
            (function() {
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

                var EMAIL = "iamwilliamm6@gmail.com";
                var PASS = "trung@123";

                // CSS Ẩn Sidebar, Header và ép video tràn màn hình
                var style = document.createElement('style');
                style.innerHTML = 'aside, header, nav, footer, .sidebar, .menu, .comments, [class*="download"], [class*="ad-"] { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } ' +
                                  'main, .w-full, .flex-1, body, html { width: 100vw !important; height: 100vh !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; overflow: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                setInterval(function() {
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }
                }, 500);

                // Auto Login Logic
                if (sessionStorage.getItem('vax_autologin_done')) return;
                function doLogin() {
                    var btns = document.querySelectorAll('button');
                    var loginBtn = null;
                    for (var i = 0; i < btns.length; i++) {
                        if (btns[i].textContent.includes('Đăng Nhập')) {
                            loginBtn = btns[i];
                            break;
                        }
                    }
                    
                    if (loginBtn) {
                        sessionStorage.setItem('vax_redirect_back', window.location.href);
                        loginBtn.click();
                        
                        var checkForm = setInterval(function() {
                            var emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="mail"]');
                            var passInput = document.querySelector('input[type="password"], input[name="password"]');
                            var submitBtn = document.querySelector('button[type="submit"]');

                            if (emailInput && passInput && submitBtn) {
                                clearInterval(checkForm);
                                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                                nativeInputValueSetter.call(emailInput, EMAIL);
                                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                nativeInputValueSetter.call(passInput, PASS);
                                passInput.dispatchEvent(new Event('input', { bubbles: true }));
                                
                                setTimeout(function() {
                                    submitBtn.click();
                                    sessionStorage.setItem('vax_autologin_done', 'true');
                                }, 500);
                            }
                        }, 500);
                    }
                }
                
                setTimeout(doLogin, 1500);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
                "Block-Ads": "true",
                "Block-Redirects": "false", 
                "Custom-Js": pureWebviewJs.replace(/\n/g, " ").trim()
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
