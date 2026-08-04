// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (HYBRID JSON/HTML ENGINE)
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.0.1",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'TV Shows', slug: 'tv-shows' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Mới đăng', value: '_id' }
        ]
    });
}

// =============================================================================
// URL GENERATION (SỬ DỤNG CHUẨN API GỐC OPHIM)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        }
    } catch (e) {}

    // Xử lý thông minh slug phim mới
    if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') slug = 'phim-moi';

    // Đường dẫn chuẩn API của Vsmov
    return "https://vsmov.com/api/danh-sach/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {}
    
    // Tránh bị mã hóa kép từ khóa khiến kết quả sai
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return "https://vsmov.com/api/tim-kiem?keyword=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://vsmov.com/api/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/api/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/api/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS (THUẬT TOÁN HYBRID: JSON & HTML)
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var currentPage = 1;
        var totalPages = 1;
        var trimmed = typeof html === 'string' ? html.trim() : "";

        // 1. NẾU LÀ API JSON -> CHẠY LUỒNG SIÊU TỐC
        if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
            var response = JSON.parse(trimmed);
            var data = response.data || response || {};
            var rawItems = data.items || response.items || [];

            var imgDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "";
            if (imgDomain && imgDomain.charAt(imgDomain.length - 1) === '/') {
                imgDomain = imgDomain.slice(0, -1);
            }

            for (var i = 0; i < rawItems.length; i++) {
                var item = rawItems[i];
                if (!item) continue;
                
                var poster = item.poster_url || item.thumb_url || "";
                if (poster && poster.indexOf("http") !== 0 && imgDomain) {
                    poster = imgDomain + (poster.indexOf("/") === 0 ? "" : "/") + poster;
                }
                var thumb = item.thumb_url || item.poster_url || "";
                if (thumb && thumb.indexOf("http") !== 0 && imgDomain) {
                    thumb = imgDomain + (thumb.indexOf("/") === 0 ? "" : "/") + thumb;
                }

                items.push({
                    id: item.slug || item._id || "",
                    title: item.name || item.title || "",
                    originalTitle: item.origin_name || "",
                    posterUrl: poster,
                    backdropUrl: thumb,
                    year: parseInt(item.year, 10) || 0,
                    quality: item.quality || "",
                    episode_current: item.episode_current || "",
                    lang: item.lang || ""
                });
            }

            var pagination = (data.params && data.params.pagination) ? data.params.pagination : (response.pagination || {});
            currentPage = parseInt(pagination.currentPage, 10) || 1;
            totalPages = parseInt(pagination.totalPages, 10) || 1;
            if (pagination.totalItems && pagination.totalItemsPerPage && !pagination.totalPages) {
                totalPages = Math.ceil(parseInt(pagination.totalItems, 10) / parseInt(pagination.totalItemsPerPage, 10));
            }
        } 
        // 2. NẾU BỊ CLOUDFLARE ÉP TRẢ VỀ HTML -> DÙNG REGEX CÀO THẲNG
        else {
            var rows = trimmed.match(/<tr[^>]*class="group\/tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
            
            for (var j = 0; j < rows.length; j++) {
                var row = rows[j];
                if (row.indexOf('<th') !== -1) continue; // Bỏ qua thanh tiêu đề

                var titleMatch = row.match(/href="[^"]*\/phim\/([^"]+)"[^>]*>\s*<h4[^>]*>([^<]+)<\/h4>/i);
                if (!titleMatch) continue;

                var id = titleMatch[1];
                var title = titleMatch[2].trim();

                // Lấy ảnh gốc chống Lazyload
                var posterMatch = row.match(/data-original="([^"]+)"/i) || row.match(/<img[^>]+src="([^"]+)"/i);
                var posterUrl = posterMatch ? posterMatch[1] : "";

                var originMatch = row.match(/class="text-sub-text line-clamp-1">([^<]*)<\/div>/i);
                var originalTitle = originMatch ? originMatch[1].trim() : "";

                var statusMatch = row.match(/<span class="flex-1 text-inherit font-normal px-1">\s*([^<]+?)\s*<\/span>/i);
                var status = statusMatch ? statusMatch[1].trim() : "";

                var yearMatch = row.match(/<span>(\d{4})<\/span>/i);
                var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

                items.push({
                    id: id,
                    title: title,
                    originalTitle: originalTitle,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    year: year,
                    episode_current: status,
                    quality: row.indexOf('4K') !== -1 ? '4K' : 'HD'
                });
            }

            // Bóc phân trang từ HTML
            var pageMatch = trimmed.match(/Trang\s+(\d+)\/(\d+)/i);
            if (pageMatch) {
                currentPage = parseInt(pageMatch[1], 10);
                totalPages = parseInt(pageMatch[2], 10);
            }
        }

        if (isNaN(totalPages) || totalPages < 1) totalPages = 1;
        if (totalPages < currentPage) totalPages = currentPage;

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var movie = response.movie || {};
        var episodes = response.episodes || [];
        var servers = [];

        for (var i = 0; i < episodes.length; i++) {
            var server = episodes[i];
            var serverEpisodes = [];
            
            if (server.server_data && Array.isArray(server.server_data)) {
                for (var j = 0; j < server.server_data.length; j++) {
                    var ep = server.server_data[j];
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed || ep.link || "",
                        name: ep.name || "Tập " + (j + 1),
                        slug: ep.slug || ""
                    });
                }
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name || "Vietsub", episodes: serverEpisodes });
            }
        }

        // Bóc tách metadata gọn gàng
        function getNames(arr) {
            if (!Array.isArray(arr)) return "";
            var names = [];
            for (var k = 0; k < arr.length; k++) {
                if (arr[k].name) names.push(arr[k].name);
                else if (typeof arr[k] === 'string') names.push(arr[k]);
            }
            return names.join(", ");
        }

        var ratingValue = 0;
        if (movie.tmdb && movie.tmdb.vote_average) {
            ratingValue = parseFloat(movie.tmdb.vote_average) || 0;
        }

        var imageDomain = response.pathImage || "https://vsmov.com";
        var posterUrl = movie.poster_url || "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = imageDomain + "/" + posterUrl;
        
        var thumbUrl = movie.thumb_url || posterUrl;
        if (thumbUrl && thumbUrl.indexOf("http") !== 0) thumbUrl = imageDomain + "/" + thumbUrl;

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            originName: movie.origin_name || "",
            posterUrl: posterUrl,
            backdropUrl: thumbUrl,
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year, 10) || 0,
            rating: ratingValue,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: getNames(movie.category),
            country: getNames(movie.country),
            director: getNames(movie.director),
            casts: getNames(movie.actor)
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(apiResponseJson, url) {
    try {
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", 
                    "Referer": "https://vsmov.com/",
                    "Origin": "https://vsmov.com"
                }
            });
        } 
        return JSON.stringify({
            url: url || "",
            isEmbed: true,
            headers: { "Referer": "https://vsmov.com/" }
        });
    } catch (e) {
        return JSON.stringify({ url: url || "", isEmbed: true });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = (response.data && response.data.items) ? response.data.items : (response.items || []);
        var results = [];
        for (var i = 0; i < items.length; i++) results.push({ name: items[i].name, slug: items[i].slug });
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = (response.data && response.data.items) ? response.data.items : (response.items || []);
        var results = [];
        for (var i = 0; i < items.length; i++) results.push({ name: items[i].name, value: items[i].slug });
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}
