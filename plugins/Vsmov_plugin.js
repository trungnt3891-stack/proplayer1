// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.0.0",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/uploads/favicon.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
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
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var limit = 24;
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var filters = JSON.parse(filtersJson);
            page = filters.page || 1;
        }

        // Với API chuẩn, "phim-moi-cap-nhat" thường có endpoint riêng
        if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') {
            return "https://vsmov.com/danh-sach/phim-moi-cap-nhat?page=" + page;
        }

        return "https://vsmov.com/v1/api/danh-sach/" + slug + "?page=" + page + "&limit=" + limit;
    } catch (e) {
        return "https://vsmov.com/v1/api/danh-sach/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        // Bắt lỗi an toàn cho biến filters
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var filters = JSON.parse(filtersJson);
            page = filters.page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
        
        // Đảm bảo encode an toàn không bị double encoding
        var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
        return "https://vsmov.com/v1/api/tim-kiem?keyword=" + safeKeyword + "&page=" + page + "&limit=24";
    } catch (e) {
        return "https://vsmov.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    return "https://vsmov.com/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS (API JSON PROCESSING)
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        
        // Luôn linh hoạt tìm mảng items
        var items = [];
        if (Array.isArray(data.items)) items = data.items;
        else if (Array.isArray(response.items)) items = response.items;
        else if (Array.isArray(data)) items = data;

        // Bắt URL ảnh tự động
        var imageDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "";
        if (imageDomain && imageDomain.charAt(imageDomain.length - 1) === '/') {
            imageDomain = imageDomain.slice(0, -1);
        }

        var movies = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item) continue;

            // Nối Domain Ảnh nếu API trả về dạng path rút gọn
            var poster = item.poster_url || "";
            if (poster && poster.indexOf("http") !== 0 && imageDomain) {
                poster = imageDomain + (poster.indexOf("/") === 0 ? "" : "/") + poster;
            }
            var thumb = item.thumb_url || item.poster_url || "";
            if (thumb && thumb.indexOf("http") !== 0 && imageDomain) {
                thumb = imageDomain + (thumb.indexOf("/") === 0 ? "" : "/") + thumb;
            }

            movies.push({
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

        // Tính toán phân trang
        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};
        var currentPage = parseInt(pagination.currentPage, 10) || 1;
        var totalPages = 1;

        if (pagination.totalPages) {
            totalPages = parseInt(pagination.totalPages, 10);
        } else if (pagination.totalItems && pagination.totalItemsPerPage) {
            totalPages = Math.ceil(parseInt(pagination.totalItems, 10) / parseInt(pagination.totalItemsPerPage, 10));
        }

        if (isNaN(totalPages) || totalPages < 1) totalPages = 1;
        if (totalPages < currentPage) totalPages = currentPage;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    // API Search của nền tảng này sử dụng chung cấu trúc trả về với List
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || {};
        var episodes = response.episodes || [];

        // 1. Phân tích Server & Tập phim
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

        // 2. Chống lỗi Undefined cho mảng
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
            description: (movie.content || "").replace(/<[^>]*>/g, ""), // Xóa tag HTML sạch sẽ
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
        // Tối ưu NATIVE PLAYER: Bắt link luồng trực tiếp
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36", 
                    "Referer": "https://vsmov.com/",
                    "Origin": "https://vsmov.com"
                }
            });
        } 
        
        // Trả về Webview (iframe)
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
        var items = [];
        if (response.data && Array.isArray(response.data.items)) items = response.data.items;
        else if (Array.isArray(response.items)) items = response.items;

        var results = [];
        for (var i = 0; i < items.length; i++) {
            results.push({ name: items[i].name, slug: items[i].slug });
        }
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = [];
        if (response.data && Array.isArray(response.data.items)) items = response.data.items;
        else if (Array.isArray(response.items)) items = response.items;

        var results = [];
        for (var i = 0; i < items.length; i++) {
            results.push({ name: items[i].name, value: items[i].slug });
        }
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}
