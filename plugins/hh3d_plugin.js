// =============================================================================
// CẤU HÌNH DOMAIN & METADATA (CHỈ CẦN SỬA TÊN MIỀN Ở ĐÂY KHI WEB CÓ UPDATE)
// =============================================================================
var BASE_DOMAIN = "yanhh3d.love";
var BASEURL = "https://" + BASE_DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.5.0",
        "baseUrl": BASEURL, 
        "iconUrl": BASEURL + "/storage/settings/August2024/YOoAwtlobLbwKhiFwRZv.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
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
    
    if (!slug || slug === 'home') {
        if (page === 1) return BASEURL + "/";
        return BASEURL + "/page/" + page;
    }
    
    slug = slug.replace(/\.html$/i, "");
    if (page === 1) {
        return BASEURL + "/" + slug;
    } else {
        return BASEURL + "/" + slug + "/page/" + page;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var cleanKeyword = encodeURIComponent(keyword.trim());
    
    if (page === 1) {
        return BASEURL + "/search?keysearch=" + cleanKeyword;
    } else {
        return BASEURL + "/search?keysearch=" + cleanKeyword + "&page=" + page;
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
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
                        lang: "Vietsub",
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
    try {
        var movies = [];
        var seen = {};

        var blocks = html.split('class="flw-item');
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var urlMatch = block.match(/href=["']([^"']+)["']/i);
            var imgMatch = block.match(/data-src=["']([^"']+)["']/i) || block.match(/src=["']([^"']+)["']/i);
            var titleMatch = block.match(/title=["']([^"']+)["']/i) || block.match(/alt=["']([^"']+)["']/i);
            var epMatch = block.match(/class=["'][^"']*(tick-rate|ep|episode|label)[^"']*["'][^>]*>([^<]+)</i);

            if (urlMatch && imgMatch && titleMatch) {
                var url = urlMatch[1];
                var img = imgMatch[1];
                var title = PluginUtils.cleanText(titleMatch[1]);
                var episode = epMatch ? PluginUtils.cleanText(epMatch[2]) : "HD";

                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
                
                if (title && slug && !seen[slug]) {
                    movies.push({
                        id: slug,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        quality: "4K / HD",
                        episode_current: episode,
                        lang: "Vietsub",
                        year: 0
                    });
                    seen[slug] = true; 
                }
            }
        }

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 100, totalItems: 9999, itemsPerPage: 20 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
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

        var realEpisodes = [];
        var addedEpisodes = {};

        // Quét tất cả các liên kết có chứa "tap-" trong toàn bộ trang HTML bằng cách dùng Global match an toàn
        var linkGlobalRegex = /href=["']([^"']+)["']/gi;
        var matchLink;
        while ((matchLink = linkGlobalRegex.exec(html)) !== null) {
            var href = matchLink[1];
            if (href.indexOf('tap-') !== -1) {
                var cleanSlug = href.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
                if (cleanSlug && !addedEpisodes[cleanSlug]) {
                    var epNumberMatch = cleanSlug.match(/tap-(\d+)/i);
                    var epNumText = epNumberMatch ? epNumberMatch[1] : (realEpisodes.length + 1);
                    
                    realEpisodes.push({
                        id: cleanSlug,
                        name: "Tập " + epNumText,
                        slug: cleanSlug
                    });
                    addedEpisodes[cleanSlug] = true;
                }
            }
        }

        // Sắp xếp danh sách tập theo số thứ tự từ bé đến lớn
        realEpisodes.sort(function(a, b) {
            var numA = parseInt(a.slug.match(/tap-(\d+)/i) ? a.slug.match(/tap-(\d+)/i)[1] : 0, 10);
            var numB = parseInt(b.slug.match(/tap-(\d+)/i) ? b.slug.match(/tap-(\d+)/i)[1] : 0, 10);
            return numA - numB;
        });

        var servers = [];
        if (realEpisodes.length > 0) {
            servers.push({ name: "Vietsub / Bản Chính Chức", episodes: realEpisodes });
        } else {
            servers.push({ name: "Hệ Thống", episodes: [{ id: baseSlug, name: "Xem Phim", slug: baseSlug }] });
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "4K",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            category: "Hoạt Hình 3D",
            status: realEpisodes.length > 0 ? (realEpisodes.length + " Tập") : "Full"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
        }
        
        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                streamUrl = iframeMatch[1];
                if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
                return JSON.stringify({
                    url: streamUrl,
                    headers: { "Referer": BASEURL + "/" },
                    isEmbed: true
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": BASEURL + "/",
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                isEmbed: false 
            });
        }
        
        return JSON.stringify({});
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseEmbedResponse(html, sourceUrl) {
    try {
        var streamUrl = "";
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, "");

        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: streamUrl.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "Referer": sourceUrl,
                    "Origin": sourceUrl.split('/').slice(0, 3).join('/'),
                    "User-Agent": "Mozilla/5.0"
                }
            });
        }
        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
