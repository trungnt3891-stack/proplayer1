// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.4.0", // Cập nhật: Tối ưu tốc độ bắt tập phim, parse DOM thực tế
        "baseUrl": "https://yanhh3d.love", 
        "iconUrl": "https://yanhh3d.love/storage/settings/August2024/YOoAwtlobLbwKhiFwRZv.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto",
        "debug": true // Bật Console Toast để dễ debug theo chuẩn SDK
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
        
        // Regex bắt khối phim chung cho cả trang chủ và các trang thể loại
        var itemRegex = /<div[^>]*class=["'][^"']*(?:flw-item|item-top|swiper-slide)[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
        var match;
        
        while ((match = itemRegex.exec(html)) !== null) {
            var block = match[1];
            
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
        console.error("Lỗi parseListResponse: " + e.message);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html); // Tái sử dụng logic quét block phim vì cấu trúc tương tự
}

function parseMovieDetail(html, apiUrl) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // Lấy Base Slug an toàn
        var baseSlug = "";
        var ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        if (ogUrl) {
            var urlObj = ogUrl[1].replace(/\/$/, "");
            baseSlug = urlObj.substring(urlObj.indexOf(".love/") + 6);
            if (baseSlug.indexOf("/") !== -1 && baseSlug.indexOf("tap-") !== -1) {
                // Nếu URL đang ở thẳng tập phim (vd: pham-nhan-tu-tien/tap-185), cắt lấy phần tên phim
                baseSlug = baseSlug.substring(0, baseSlug.indexOf("/"));
            }
        }

        // TỐI ƯU CỐT LÕI: Quét DOM thực tế để lấy tập phim thay vì vòng lặp đoán mò
        var episodesRaw = [];
        var epRegex = /<a[^>]*href=["']([^"']*\/tap-\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        var epSeen = {};

        while ((epMatch = epRegex.exec(html)) !== null) {
            var epLink = epMatch[1];
            var epName = PluginUtils.cleanText(epMatch[2]);
            
            // Chỉ lấy các link chứa baseSlug của phim hiện tại để tránh dính link phim gợi ý
            if (epLink.indexOf(baseSlug) !== -1) {
                var epSlug = epLink.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
                
                // Đảm bảo unique slug chuẩn SDK
                if (!epSeen[epSlug]) {
                    episodesRaw.push({
                        id: epSlug,
                        name: epName ? epName : "Tập " + epSlug.split('-').pop(),
                        slug: epSlug
                    });
                    epSeen[epSlug] = true;
                }
            }
        }

        var lowerHtml = html.toLowerCase();
        var hasTM = lowerHtml.indexOf('xem thuyết minh') !== -1;
        var hasSub = lowerHtml.indexOf('xem vietsub') !== -1 || lowerHtml.indexOf('/sever2/') !== -1;
        if (!hasTM && !hasSub) hasTM = true; // Fallback

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];
        var servers = [];

        // Nếu bắt được tập phim từ DOM thực tế
        if (episodesRaw.length > 0) {
            // Sắp xếp lại danh sách tập (tuỳ chọn)
            episodesRaw.sort(function(a, b) {
                var numA = parseInt(a.slug.split('-').pop()) || 0;
                var numB = parseInt(b.slug.split('-').pop()) || 0;
                return numA - numB;
            });

            if (hasTM) thuyetMinhEpisodes = JSON.parse(JSON.stringify(episodesRaw));
            
            if (hasSub) {
                // Tạo nhánh Vietsub dựa trên danh sách thật
                for (var i = 0; i < episodesRaw.length; i++) {
                    var subSlug = "sever2/" + episodesRaw[i].slug;
                    vietsubEpisodes.push({
                        id: subSlug,
                        name: episodesRaw[i].name,
                        slug: subSlug // Đảm bảo tính duy nhất
                    });
                }
            }
        } else {
            // Fallback (Trường hợp web đổi giao diện, không bắt được link <a>)
            // Lấy maxEp theo cách cũ nhưng chỉ chạy khi DOM thất bại
            var maxEp = 1;
            var em1 = html.match(/Tập mới nhất:.*?Tập\s*(\d+)/i);
            if (em1) maxEp = parseInt(em1[1], 10);
            
            for (var j = 1; j <= maxEp; j++) {
                if (hasTM) {
                    thuyetMinhEpisodes.push({ id: baseSlug + "/tap-" + j, name: "Tập " + j, slug: baseSlug + "/tap-" + j });
                }
                if (hasSub) {
                    vietsubEpisodes.push({ id: "sever2/" + baseSlug + "/tap-" + j, name: "Tập " + j, slug: "sever2/" + baseSlug + "/tap-" + j });
                }
            }
        }
        
        if (thuyetMinhEpisodes.length > 0) servers.push({ name: "Thuyết Minh (Bản 4K)", episodes: thuyetMinhEpisodes });
        if (vietsubEpisodes.length > 0) servers.push({ name: "Phim Vietsub (Bản 4K)", episodes: vietsubEpisodes });
        
        if (servers.length === 0) {
             servers.push({ name: "Hệ Thống", episodes: [{ id: baseSlug + "/tap-1", name: "Đang Cập Nhật", slug: baseSlug + "-update" }] });
        }

        // Đếm số tập thực tế đã bắt được
        var totalEps = thuyetMinhEpisodes.length > 0 ? thuyetMinhEpisodes.length : (vietsubEpisodes.length > 0 ? vietsubEpisodes.length : 1);

        return JSON.stringify({
            id: baseSlug,
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
            status: totalEps + " Tập"
        });
    } catch (e) {
        console.error("Lỗi parseMovieDetail: " + e.message);
        return JSON.stringify({});
    }
}

function parseDetailResponse(html, apiUrl) {
    try {
        var streamUrl = "";
        var mimeType = "video/mp4"; // Khai báo sẵn theo chuẩn SDK
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
            mimeType = "application/x-mpegURL";
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
                mimeType: mimeType,
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
        var mimeType = "video/mp4";
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
            mimeType = "application/x-mpegURL";
        }

        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: mimeType,
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
