// =============================================================================
// PLUGIN VAAPP: PHIMNGAN.NET (100% Webview Gốc giống Shortflix)
// =============================================================================

var BASEURL = "https://phimngan.net";

function getManifest() {
    return JSON.stringify({
        "id": "phimngan_net",
        "name": "PhimNgan.Net",
        "description": "Bản Webview Gốc: Ép video dọc, Auto Login, Xóa rác giao diện.",
        "version": "1.8.5",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/icon-192x192.png",
        "isEnabled": true,
        "hasLogin": true,                     
        "loginUrl": BASEURL + "/login",    
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
        { slug: '', title: 'Mới Cập Nhật', type: 'Grid' },
        { slug: 'genres/phim-ai', title: 'Phim AI', type: 'Horizontal' },
        { slug: 'genres/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal' },
        { slug: 'genres/tong-tai', title: 'Tổng Tài', type: 'Horizontal' },
        { slug: 'genres/cung-dau', title: 'Cung Đấu', type: 'Grid' },
        { slug: 'genres/hanh-dong', title: 'Hành Động', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: '' },
        { name: 'Phim AI', slug: 'genres/phim-ai' },
        { name: 'Ngôn Tình', slug: 'genres/ngon-tinh' },
        { name: 'Tổng Tài', slug: 'genres/tong-tai' },
        { name: 'Cung Đấu', slug: 'genres/cung-dau' },
        { name: 'Gia Đình', slug: 'genres/gia-dinh' },
        { name: 'Hài Hước', slug: 'genres/hai-huoc' },
        { name: 'Phục Thù', slug: 'genres/phuc-thu' },
        { name: 'Xuyên Không', slug: 'genres/xuyen-khong' }
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

        var resultUrl = BASEURL + (slug ? "/" + slug : "");

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        
        return resultUrl;
    } catch (e) {
        return BASEURL;
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
    try {
        var items = [];
        var seen = {};

        // Quét Regex an toàn bắt mọi thẻ <a> có chứa link phim
        var regex = /<a[^>]+href=["'](\/(?:phim|watch)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var link = match[1];
            var block = match[2];
            
            var id = BASEURL + link;
            if (seen[id]) continue;
            seen[id] = true;

            var titleMatch = block.match(/alt=["']([^"']+)["']/i) || block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "Phim Ngắn";
            
            var imgMatch = block.match(/src=["']([^"']+)["']/i) || block.match(/url=([^&]+)/i);
            var img = "";
            if (imgMatch) {
                img = imgMatch[1];
                if (img.indexOf('%') > -1) img = decodeURIComponent(img);
                if (img.startsWith('/_next')) img = BASEURL + img;
                else if (!img.startsWith('http')) img = "https:" + img;
            }
            
            var epMatch = block.match(/<span[^>]*uppercase[^>]*>([\s\S]*?)<\/span>/i);
            var ep = epMatch ? epMatch[1].replace(/<[^>]+>/g, '').trim() : "Full";
            
            items.push({
                id: id,
                title: title,
                posterUrl: img,
                backdropUrl: img,
                quality: "HD",
                episode_current: ep
            });
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: 99 // Nền tảng tự động cuộn trang
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
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

        // Trả trực tiếp 1 nút bấm để load giao diện Webview
        var servers = [{
            name: "Lướt Chuyển Tập Tự Động",
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
            episode_current: "Full",
            servers: servers
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        // Áp dụng chuẩn logic CustomJS từ mẫu shortflix bạn vừa đưa
        var pureWebviewJs = `
            (function() {
                // Vô hiệu hóa tính năng Fullscreen của Web Player để Android không bốc ra ngoài
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

                // CSS Giấu rác, quảng cáo và ẩn nút phóng to của trình phát web
                var style = document.createElement('style');
                style.innerHTML = 'header, .header, nav, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments, .vjs-fullscreen-control, .plyr__controls [data-plyr="fullscreen"], .jw-fullscreen, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                setInterval(function() {
                    // Ép thẻ video chạy inline để player của web hoạt động trọn vẹn bên trong khung dọc
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    var appBanners = document.querySelectorAll('div[class*="download"], div[class*="banner"]');
                    for (var i = 0; i < appBanners.length; i++) {
                        if (appBanners[i]) appBanners[i].style.display = 'none';
                    }
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);

                // Auto Login Logic
                if (sessionStorage.getItem('vax_autologin_done')) return;
                function doLogin() {
                    var loginBtn = document.querySelector('a[href*="/login"]');
                    if (loginBtn) {
                        sessionStorage.setItem('vax_redirect_back', window.location.href);
                        window.location.href = loginBtn.href; 
                    } else {
                        sessionStorage.setItem('vax_autologin_done', 'true');
                    }
                }

                if (window.location.href.indexOf('/login') > -1) {
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
                                setTimeout(function() {
                                    var backUrl = sessionStorage.getItem('vax_redirect_back');
                                    if (backUrl) window.location.href = backUrl;
                                    else window.location.href = '/';
                                }, 2000);
                            }, 500);
                        }
                    }, 500);
                } else {
                    setTimeout(doLogin, 1500);
                }
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true",
                "Block-Redirects": "false", 
                "Custom-Js": pureWebviewJs.replace(/\r\n|\r|\n/g, " ").trim()
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
