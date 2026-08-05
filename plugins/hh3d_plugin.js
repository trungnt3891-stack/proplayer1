// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.3.3", // Đã fix: Lỗi khóa cuộn Webview & Tối ưu luồng lưu lịch sử
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

// Bắt buộc phân tích lại tất cả các tập ra giao diện App để Vax có ID ghi nhận lịch sử xem
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

        var servers = [];
        var navTabsMatch = html.match(/<ul[^>]*nav-tabs[^>]*>([\s\S]*?)<\/ul>/i);
        var tabs = [];
        if (navTabsMatch) {
            var aTagRegex = /<a[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var aMatch;
            while ((aMatch = aTagRegex.exec(navTabsMatch[1])) !== null) {
                var tabName = aMatch[2].replace(/<[^>]+>/g, '').trim();
                if(tabName.toLowerCase().indexOf('vietsub') !== -1) tabName = "Phim Vietsub (Bản 4K)";
                else if(tabName.toLowerCase().indexOf('thuyết minh') !== -1 || tabName.toLowerCase().indexOf('tm') !== -1) tabName = "Thuyết Minh (Bản 4K)";
                tabs.push({ id: aMatch[1].trim(), name: tabName });
            }
        }

        function getActualEps(blockHtml) {
            var eps = [];
            var splits = blockHtml.split('ep-item'); 
            for (var i = 1; i < splits.length; i++) {
                var block = splits[i].substring(0, 500); 
                var urlMatch = block.match(/href=["']([^"']+)["']/i);
                var orderMatch = block.match(/ssli-order[^>]*>([^<]+)/i);
                var titleMatch = block.match(/title=["']([^"']+)["']/i);
                
                if (urlMatch) {
                    var epUrl = urlMatch[1];
                    var uniqueSlug = epUrl.replace(/^https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    var epName = "N/A";
                    if (orderMatch) epName = orderMatch[1].trim();
                    else if (titleMatch) epName = titleMatch[1].trim();
                    else epName = uniqueSlug.split('/').pop().replace('tap-', 'Tập ');

                    var exists = false;
                    for (var j = 0; j < eps.length; j++) {
                        if (eps[j].id === uniqueSlug) { exists = true; break; }
                    }
                    if (!exists) eps.push({ id: uniqueSlug, name: epName, slug: uniqueSlug }); // Giữ ID chuẩn để Vax nhận biết lưu lịch sử
                }
            }
            eps.sort(function(a, b) {
                var numA = parseInt((a.name.match(/\d+/) || ["0"])[0], 10);
                var numB = parseInt((b.name.match(/\d+/) || ["0"])[0], 10);
                if (numA === numB) return a.name.length - b.name.length;
                return numA - numB;
            });
            return eps;
        }

        if (tabs.length > 0) {
            for (var i = 0; i < tabs.length; i++) {
                var startStr = 'id="' + tabs[i].id + '"';
                var startIdx = html.indexOf(startStr);
                if (startIdx !== -1) {
                    var endIdx = html.length;
                    if (i + 1 < tabs.length) {
                        var nextStartIdx = html.indexOf('id="' + tabs[i+1].id + '"', startIdx);
                        if (nextStartIdx !== -1) endIdx = nextStartIdx;
                    }
                    var blockHtml = html.substring(startIdx, endIdx);
                    var eps = getActualEps(blockHtml);
                    if (eps.length > 0) servers.push({ name: tabs[i].name, episodes: eps });
                }
            }
        }

        if (servers.length === 0) {
            var eps = getActualEps(html);
            if (eps.length > 0) {
                var isSub = html.toLowerCase().indexOf('xem vietsub') !== -1 || html.toLowerCase().indexOf('/sever2/') !== -1;
                servers.push({ name: (isSub ? "Phim Vietsub (Bản 4K)" : "Thuyết Minh (Bản 4K)"), episodes: eps });
            }
        }

        if (servers.length === 0 && baseSlug) {
             servers.push({ name: "Hệ Thống", episodes: [{ id: baseSlug + "/tap-1", name: "Đang Cập Nhật / Full", slug: baseSlug + "/tap-1" }] });
        }
        
        var totalEps = servers.length > 0 && servers[0].episodes.length > 0 ? servers[0].episodes.length : 0;

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
            status: totalEps > 0 ? totalEps + " Tập" : "Đang Cập Nhật"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// =============================================================================
// WEBVIEW LOADER & CSS/JS INJECTION
// =============================================================================
function parseDetailResponse(html, url) {
    try {
        // Load thẳng url phim để bê nguyên Web Player & Giao diện chọn tập vào
        var streamUrl = url || "https://yanhh3d.love";

        // Đoạn Custom-Js quyền năng để chỉnh sửa khung Webview
        var pureWebviewJs = `
            (function() {
                // 1. Tắt Fullscreen mặc định để tránh lỗi văng app Android
                try {
                    var noop = function() { return Promise.resolve(); };
                    Object.defineProperty(document, 'fullscreenEnabled', {get: function() { return false; }});
                    Object.defineProperty(document, 'webkitFullscreenEnabled', {get: function() { return false; }});
                    if(Element.prototype.requestFullscreen) Element.prototype.requestFullscreen = noop;
                    if(Element.prototype.webkitRequestFullscreen) Element.prototype.webkitRequestFullscreen = noop;
                } catch(e) {}

                // 2. CSS Giấu quảng cáo, header, footer nhưng GIỮ LẠI KHẢ NĂNG CUỘN (Scroll)
                var style = document.createElement('style');
                style.innerHTML = 'header, .header, nav, footer, .footer, .download-app, .app-download, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar, .comments { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; background: #1a1a1a !important; height: auto !important; min-height: 100% !important; }';
                document.head.appendChild(style);

                // 3. Ép video chạy In-line để vuốt cuộn không lỗi & Tự dọn popup sinh sau
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
