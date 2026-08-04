// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var log = typeof log === "function" ? log : function(msg) { console.log(msg); };

function getManifest() {
    return JSON.stringify({
        "id": "kkphim",
        "name": "KKPhim",
        "version": "1.0.5",
        "baseUrl": "https://phimapi.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/kkphim.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'subteam', title: 'Subteam', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi-cap-nhat-v3', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat-v3' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim chiếu rạp', slug: 'phim-chieu-rap' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Theo ID', value: '_id' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = typeof filtersJson === 'string' ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        var page = filters.page || 1;
        var listSlugs = ['phim-vietsub', 'subteam', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat'];
        var basePath = listSlugs.indexOf(slug) !== -1 ? "danh-sach" : "the-loai";
        
        var typeList = slug === 'phim-moi' ? 'phim-moi-cap-nhat-v3' : slug;
        if (typeList === 'phim-moi-cap-nhat-v3') {
            return "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=" + page;
        }

        var url = "https://phimapi.com/v1/api/" + basePath + "/" + typeList + "?page=" + page + "&limit=" + (filters.limit || 24);
        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.sort) url += "&sort_field=" + filters.sort;

        return url;
    } catch (e) {
        log("Lỗi tạo URL List: " + e);
        return "https://phimapi.com/v1/api/danh-sach/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    var limit = 24;
    try {
        var filters = typeof filtersJson === 'string' ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        page = filters.page || 1;
    } catch (e) {
        log("Lỗi JSON Filter Search: " + e);
    }
    // Đúng cấu trúc query theo cURL API Document hướng dẫn
    return "https://phimapi.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page + "&limit=" + limit;
}

function getUrlDetail(slug) {
    return "https://phimapi.com/phim/" + slug;
}

function getUrlCategories() { return "https://phimapi.com/the-loai"; }
function getUrlCountries() { return "https://phimapi.com/quoc-gia"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || {};
        
        var items = Array.isArray(data.items) ? data.items : 
                   (Array.isArray(response.items) ? response.items : 
                   (Array.isArray(data) ? data : []));

        // Lấy domain ảnh (API phim-moi trả pathImage, API danh-sach trả APP_DOMAIN_CDN_IMAGE)
        var imageDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://phimimg.com";
        if (imageDomain.charAt(imageDomain.length - 1) === '/') imageDomain = imageDomain.slice(0, -1);

        var movies = items.map(function (item) {
            var poster = item.poster_url || "";
            if (poster && poster.indexOf("http") !== 0) poster = imageDomain + "/" + poster;
            var thumb = item.thumb_url || poster;
            if (thumb && thumb.indexOf("http") !== 0) thumb = imageDomain + "/" + thumb;

            return {
                id: item.slug || item._id,
                title: item.name || item.title || "",
                originalTitle: item.origin_name || "",
                posterUrl: poster,
                backdropUrl: thumb,
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        var pagination = (data.params && data.params.pagination) || response.pagination || {};
        var currentPage = parseInt(pagination.currentPage, 10) || 1;
        var totalPages = parseInt(pagination.totalPages, 10) || 1;
        if (totalPages < currentPage) totalPages = currentPage; // Chống lỗi lệch trang

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (error) {
        log("Lỗi Parse List: " + error);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

// BÓC TÁCH SEARCH ĐỘC LẬP - Chống nhiễu dữ liệu và lỗi scope
function parseSearchResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || {};
        var items = data.items || [];
        
        // Cực kỳ quan trọng: Bắt buộc lấy Domain Image do API Search chỉ trả về Tên file
        var imageDomain = data.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
        if (imageDomain.charAt(imageDomain.length - 1) === '/') {
            imageDomain = imageDomain.slice(0, -1);
        }

        var movies = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            
            // Xử lý link ảnh mượt mà
            var poster = item.poster_url || "";
            if (poster && poster.indexOf("http") !== 0) poster = imageDomain + "/" + poster;
            
            var thumb = item.thumb_url || poster;
            if (thumb && thumb.indexOf("http") !== 0) thumb = imageDomain + "/" + thumb;

            movies.push({
                id: item.slug || item._id,
                title: item.name || "",
                originalTitle: item.origin_name || "",
                posterUrl: poster,
                backdropUrl: thumb,
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            });
        }

        // Bóc tách phân trang chính xác tuyệt đối theo Document của KKPhim
        var pagination = (data.params && data.params.pagination) || {};
        var currentPage = parseInt(pagination.currentPage, 10) || 1;
        var totalPages = parseInt(pagination.totalPages, 10) || 1;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: Math.max(currentPage, totalPages)
            }
        });
    } catch (error) {
        log("Lỗi Parse Search: " + error);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var movie = response.movie || {};
        var episodes = response.episodes || [];
        var servers = [];

        episodes.forEach(function (server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function (ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed,
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

        // Tự động ghép nối API Image Domain cho Detail nếu thiếu
        var imageDomain = "https://phimimg.com";
        var posterUrl = movie.poster_url || "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = imageDomain + "/" + posterUrl;
        
        var thumbUrl = movie.thumb_url || posterUrl;
        if (thumbUrl && thumbUrl.indexOf("http") !== 0) thumbUrl = imageDomain + "/" + thumbUrl;

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: posterUrl,
            backdropUrl: thumbUrl,
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            year: movie.year || 0,
            rating: movie.tmdb ? (movie.tmdb.vote_average || 0) : 0,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: (movie.category || []).map(function (c) { return c.name; }).join(", "),
            country: (movie.country || []).map(function (c) { return c.name; }).join(", ")
        });
    } catch (error) { 
        log("Lỗi Parse Detail: " + error);
        return "null"; 
    }
}

function parseDetailResponse(html, url) {
    try {
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "User-Agent": "Mozilla/5.0", 
                    "Referer": "https://kkphim.com/" 
                }
            });
        } 
        return JSON.stringify({
            url: url,
            isEmbed: true,
            headers: { "Referer": "https://kkphim.com/" }
        });
    } catch (e) {
        log("Lỗi Parse Detail Response: " + e);
        return JSON.stringify({ url: url || "", isEmbed: true });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(html) {
    try {
        var response = typeof html === 'string' ? JSON.parse(html) : html;
        var items = response.data?.items || response.items || (Array.isArray(response) ? response : []);
        return JSON.stringify(items.map(function (i) { return { name: i.name, slug: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(html) {
    try {
        var response = typeof html === 'string' ? JSON.parse(html) : html;
        var items = response.data?.items || response.items || (Array.isArray(response) ? response : []);
        return JSON.stringify(items.map(function (i) { return { name: i.name, value: i.slug }; }));
    } catch (e) { return "[]"; }
}
