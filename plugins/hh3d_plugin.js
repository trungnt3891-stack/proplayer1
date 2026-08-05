// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.3.2", // Bản fix lỗi quét danh sách tập triệt để
        "baseUrl": "https://yanhh3d.love", 
        "iconUrl": "https://yanhh3d.love/storage/settings/August2024/YOoAwtlobLbwKhiFwRZv.png",
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

        var regex = /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?(?:data-src|src)=["']([^"']+)["'][\s\S]*?(?:title|alt)=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var url = match[1];
            var img = match[2];
            var title = PluginUtils.cleanText(match[3]);

            if (!url || !img || !title) continue;
            if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('search') !== -1) continue;
            if (img.indexOf('avatar') !== -1 || img.indexOf('logo') !== -1) continue;
            if (url === '/' || url.indexOf('javascript:') !== -1 || url.indexOf('#') === 0) continue;

            var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
            
            if (slug && !seen[slug]) {
                movies.push({
                    id: slug,
                    title: title,
                    posterUrl: img,
                    backdropUrl: img,
                    quality: "4K / HD",
                    episode_current: "HD",
                    lang: "Vietsub / TM",
                    year: 0
                });
                seen[slug] = true; 
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

        // [CẢI TIẾN] Quét trực tiếp tất cả các số tập xuất hiện trong link tập phim của HTML
        var episodeNumbers = {};
        var episodeRegex = /href=["'][^"']*?(?:tap-|episode-)(\d+)["']/gi;
        var epMatch;
        while ((epMatch = episodeRegex.exec(html)) !== null) {
            var num = parseInt(epMatch[1], 10);
            if (num > 0) episodeNumbers[num] = true;
        }

        var epList = [];
        for (var k in episodeNumbers) {
            if (episodeNumbers.hasOwnProperty(k)) epList.push(parseInt(k, 10));
        }
        epList.sort(function(a, b) { return a - b; });

        // Nếu quét link không ra, fallback quét chuỗi thông thường
        if (epList.length === 0) {
            var maxEp = 1;
            var linkRegex = /tap-(\d+)/gi;
            var lM;
            while ((lM = linkRegex.exec(html)) !== null) {
                var n = parseInt(lM[1], 10);
                if (n > maxEp) maxEp = n;
            }
            for (var j = 1; j <= maxEp; j++) {
                epList.push(j);
            }
        }

        var lowerHtml = html.toLowerCase();
        var hasTM = lowerHtml.indexOf('xem thuyết minh') !== -1;
        var hasSub = lowerHtml.indexOf('xem vietsub') !== -1 || lowerHtml.indexOf('/sever2/') !== -1;
        if (!hasTM && !hasSub) hasTM = true; // Fallback

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];

        if (baseSlug && epList.length > 0) {
            for (var idx = 0; idx < epList.length; idx++) {
                var i = epList[idx];
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
            status: epList.length + " Tập"
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
                    headers: { "Referer": "https://yanhh3d.love/" },
                    isEmbed: true
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": "https://yanhh3d.love/",
                    "Origin": "https://yanhh3d.love",
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
