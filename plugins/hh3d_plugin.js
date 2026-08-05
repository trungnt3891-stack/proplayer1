// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.3.4", // Tối giản: 1 Nút xem phim, Mở khóa vuốt cuộn tuyệt đối
        "baseUrl": "https://yanhh3d.love", 
        "iconUrl": "https://yanhh3d.love/storage/settings/August2024/YOoAwtlobLbwKhiFwRZv.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embed" // Ép mở Webview
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
            pagination: { currentPage: currentPage, totalPages: 100, totalItems: 9999, itemsPerPage: 20 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// =============================================================================
// RÚT GỌN CHỈ CÒN ĐÚNG 1 NÚT ĐỂ VÀO THẲNG WEBVIEW
// =============================================================================
function parseMovieDetail(html, currentUrl) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // Tìm link gốc của bộ phim để nhét vào nút bấm
        var watchUrl = currentUrl;
        if (!watchUrl) {
            var ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
            watchUrl = ogUrl ? ogUrl[1] : "https://yanhh3d.love";
        }

        var servers = [];
        servers.push({
            name: "Trình Phát Toàn Tập (Webview)",
            episodes: [{
                id: watchUrl, 
                name: "Bấm vào để xem phim",
                slug: "xem-phim-ngay"
            }]
        });

        return JSON.stringify({
            id: watchUrl,
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
            status: "Full Tập"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// =============================================================================
// WEBVIEW LOADER VỚI LỆNH MỞ KHÓA CUỘN TUYỆT ĐỐI (TOUCH-ACTION: AUTO)
// =============================================================================
function parseDetailResponse(html, url) {
    try {
        var streamUrl = url || "https://yanhh3d.love";

        // Đoạn Custom-Js bơm vào Webview
        var pureWebviewJs = `
            (function() {
                // 1. Chặn Fullscreen văng App
                try {
                    var noop = function() { return Promise.resolve(); };
                    Object.defineProperty(document, 'fullscreenEnabled', {get: function() { return false; }});
                    Object.defineProperty(document, 'webkitFullscreenEnabled', {get: function() { return false; }});
                } catch(e) {}

                // 2. CSS Giấu rác & Ép khôi phục Thanh cuộn 
                var style = document.createElement('style');
                style.innerHTML = 
                    'header, .header, nav, footer, .footer, .download-app, .app-download, ' +
                    '[class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], ' +
                    '.bottom-nav, .navigation, .sidebar, .comments { ' +
                        'display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; ' +
                    '} ' +
                    'html, body { ' +
                        'overflow: auto !important; overflow-y: auto !important; ' +
                        '-webkit-overflow-scrolling: touch !important; touch-action: pan-y auto !important; ' +
                        'height: auto !important; min-height: 100vh !important; background: #1a1a1a !important; ' +
                        'position: static !important; ' +
                    '} ' +
                    '* { ' +
                        'touch-action: pan-y auto !important; ' + // Đòn quyết định: Cấm các plugin khóa vuốt ngón tay
                    '}';
                document.head.appendChild(style);

                // 3. Xử lý video In-line & Dọn dẹp Popup sau mỗi 0.5s
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
            "isEmbed": true, 
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

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
