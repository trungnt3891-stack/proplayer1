// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.3.2", // Bản cập nhật: Kích hoạt Webview Nâng cao (Khóa Sniffer, nhúng Custom JS)
        "baseUrl": "https://yanhh3d.love", 
        "iconUrl": "https://yanhh3d.love/storage/settings/August2024/YOoAwtlobLbwKhiFwRZv.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embed" // [QUAN TRỌNG] Dùng 'embed' để vô hiệu hóa hoàn toàn trình bắt link của App
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: 'Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'hoat-hinh-3d', title: 'Hoạt Hình 3D', type: 'Horizontal', path: '' },
        { slug: 'hoat-hinh-2d', title: 'Hoạt Hình 2D', type: 'Horizontal', path: '' },
        { slug: 'hoat-hinh-4k', title: 'Hoạt Hình 4K', type: 'Horizontal', path: '' },
        { slug: 'hoan-thanh', title: 'Đã Hoàn Thành', type: 'Horizontal', path: '' },
        { slug: 'dang-chieu', title: 'Đang Chiếu', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'home' },
        { name: 'Hoạt Hình 3D', slug: 'hoat-hinh-3d' },
        { name: 'Hoạt Hình 2D', slug: 'hoat-hinh-2d' },
        { name: 'Hoạt Hình 4K', slug: 'hoat-hinh-4k' },
        { name: 'Đã Hoàn Thành', slug: 'hoan-thanh' },
        { name: 'Đang Chiếu', slug: 'dang-chieu' },
        { name: 'Phim Lẻ | Ova', slug: 'phim-le' },
        { name: 'Huyền Huyễn', slug: 'the-loai/huyen-huyen' },
        { name: 'Tiên Hiệp', slug: 'the-loai/tien-hiep' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://yanhh3d.love";
    
    if (!slug || slug === 'home') {
        if (page === 1) return baseUrl + "/";
        return baseUrl + "/page/" + page;
    }
    
    slug = slug.replace(/\.html$/i, "");
    if (page === 1) {
        return baseUrl + "/" + slug;
    } else {
        return baseUrl + "/" + slug + "/page/" + page;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var cleanKeyword = encodeURIComponent(keyword.trim());
    
    if (page === 1) {
        return "https://yanhh3d.love/search?keysearch=" + cleanKeyword;
    } else {
        return "https://yanhh3d.love/search?keysearch=" + cleanKeyword + "&page=" + page;
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return "https://yanhh3d.love/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
    }
};

function parseListResponse(html) {
    try {
        var movies = [];
        var seen = {};
        var allBlocks = [];

        var swiperBlocks = html.split('class="swiper-slide');
        for (var i = 1; i < swiperBlocks.length; i++) allBlocks.push(swiperBlocks[i]);

        var flwBlocks = html.split('class="flw-item');
        for (var i = 1; i < flwBlocks.length; i++) allBlocks.push(flwBlocks[i]);

        var topBlocks = html.split('class="item-top');
        for (var i = 1; i < topBlocks.length; i++) allBlocks.push(topBlocks[i]);

        for (var i = 0; i < allBlocks.length; i++) {
            var block = allBlocks[i];
            if (!block || block.length < 50) continue;
            
            var urlMatch = block.match(/href=["']([^"']+)["']/i);
            var imgMatch = block.match(/data-src=["']([^"']+)["']/i) || block.match(/src=["']([^"']+)["']/i);
            var titleMatch = block.match(/title=["']([^"']+)["']/i) || block.match(/alt=["']([^"']+)["']/i) || block.match(/<h[234][^>]*>([^<]+)<\/h[234]>/i);
            
            var epMatch = block.match(/class=["'][^"']*(tick-rate|ep|episode|label|status)[^"']*["'][^>]*>([^<]+)</i);

            if (urlMatch && imgMatch && titleMatch) {
                var url = urlMatch[1];
                var img = imgMatch[1];
                var title = PluginUtils.cleanText(titleMatch[1]);
                var episode = epMatch ? PluginUtils.cleanText(epMatch[2]) : "HD";

                if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('search') !== -1) continue;
                if (img.indexOf('avatar') !== -1 || img.indexOf('logo') !== -1) continue;
                if (url === '/' || url.indexOf('javascript:') !== -1 || url.indexOf('#') === 0) continue;

                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
                
                if (title && slug && !seen[slug]) {
                    movies.push({
                        id: slug,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        quality: "4K / HD",
                        episode_current: episode,
                        lang: "Vietsub / TM",
                        year: 0
                    });
                    seen[slug] = true; 
                }
            }
        }

        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: 100, 
                totalItems: 9999,
                itemsPerPage: 20
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        var baseSlug = "";
        var ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        if (ogUrl) {
            var urlObj = ogUrl[1].replace(/\/$/, "");
            baseSlug = urlObj.substring(urlObj.lastIndexOf("/") + 1);
        }

        var maxEp = 1;
        var epMatch1 = html.match(/Tập mới nhất:.*?Tập\s*(\d+)/i);
        var epMatch2 = html.match(/Thời lượng:.*?(\d+)\//i);
        
        if (epMatch1) {
            maxEp = parseInt(epMatch1[1], 10);
        } else if (epMatch2) {
            maxEp = parseInt(epMatch2[1], 10);
        } else {
            var linkRegex = /tap-(\d+)/gi;
            var lM;
            while ((lM = linkRegex.exec(html)) !== null) {
                var n = parseInt(lM[1], 10);
                if (n > maxEp) maxEp = n;
            }
        }

        var lowerHtml = html.toLowerCase();
        var hasTM = lowerHtml.indexOf('xem thuyết minh') !== -1;
        var hasSub = lowerHtml.indexOf('xem vietsub') !== -1 || lowerHtml.indexOf('/sever2/') !== -1;
        if (!hasTM && !hasSub) hasTM = true; 

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];

        if (baseSlug && maxEp > 0) {
            for (var i = 1; i <= maxEp; i++) {
                var epName = "Tập " + i;
                if (hasTM) {
                    thuyetMinhEpisodes.push({
                        id: baseSlug + "/tap-" + i,
                        name: epName,
                        slug: baseSlug + "/tap-" + i
                    });
                }
                if (hasSub) {
                    vietsubEpisodes.push({
                        id: "sever2/" + baseSlug + "/tap-" + i,
                        name: epName,
                        slug: "sever2/" + baseSlug + "/tap-" + i
                    });
                }
            }
        } 

        var servers = [];
        
        if (thuyetMinhEpisodes.length > 0) {
            servers.push({ name: "Thuyết Minh (Bản 4K)", episodes: thuyetMinhEpisodes });
        }
        if (vietsubEpisodes.length > 0) {
            servers.push({ name: "Phim Vietsub (Bản 4K)", episodes: vietsubEpisodes });
        }
        
        if (servers.length === 0) {
             servers.push({ name: "Hệ Thống", episodes: [{ id: baseSlug + "/tap-1", name: "Đang Cập Nhật / Full", slug: baseSlug + "/tap-1" }] });
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "4K / HD",
            lang: "Vietsub / Thuyết Minh",
            year: 0,
            rating: 0,
            category: "Hoạt Hình 3D",
            status: maxEp + " Tập"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// =============================================================================
// WEBVIEW LOADER: KHÓA BẮT LINK VÀ ÉP PLAYSINLINE CHO PLAYER CỦA WEB
// =============================================================================
function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        
        // Cố gắng tìm iframe player gốc trên web trước
        var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
            if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
        } 
        
        // Nếu không có iframe, tự động dùng url hiện tại để load toàn trang
        if (!streamUrl) {
            streamUrl = url || "https://yanhh3d.love";
        }

        // Đoạn Custom-Js chạy ngầm can thiệp vào CSS và DOM của website
        var pureWebviewJs = `
            (function() {
                // 1. Vô hiệu hóa tính năng Fullscreen của Web Player để Android không bốc ra ngoài khung
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

                // 2. Ép CSS Giấu rác, quảng cáo, header, footer và ẩn nút phóng to của trình phát web
                var style = document.createElement('style');
                style.innerHTML = 'header, .header, nav, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments, .vjs-fullscreen-control, .plyr__controls [data-plyr="fullscreen"], .jw-fullscreen, .fullscreen-btn, video::-webkit-media-controls-fullscreen-button { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; background: #000 !important; overscroll-behavior-y: none; }';
                document.head.appendChild(style);

                // 3. Vòng lặp dọn dẹp liên tục các Popup sinh ra chậm và ép video chạy In-line
                setInterval(function() {
                    var vids = document.querySelectorAll('video');
                    for (var k = 0; k < vids.length; k++) {
                        if (!vids[k].hasAttribute('playsinline')) {
                            vids[k].setAttribute('playsinline', 'true');
                            vids[k].setAttribute('webkit-playsinline', 'true');
                        }
                    }

                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"], .close-ads');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);
            })();
        `;

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": true, // Luôn bật true để kích hoạt Webview thay vì nội soi link
            "headers": {
                "Referer": "https://yanhh3d.love/",
                "Block-Ads": "true",
                "Block-Redirects": "false", 
                "Custom-Js": pureWebviewJs.replace(/\r\n|\r|\n/g, " ").trim()
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

// Disable chế độ Embed rườm rà do luồng trên đã bao gọn
function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
