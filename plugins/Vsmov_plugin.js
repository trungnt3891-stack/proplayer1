// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (CHUẨN OPHIM v1 API)
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.0.2",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' }
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
// URL GENERATION (BẮT BUỘC DÙNG /V1/API/ ĐỂ TRÁNH LỖI 404)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        }
    } catch (e) {}

    // Đảm bảo slug đúng chuẩn Ophim API
    var apiSlug = slug;
    if (slug === 'phim-moi' || slug === 'phim-moi-cap-nhat-v3') {
        apiSlug = 'phim-moi-cap-nhat';
    }

    return "https://vsmov.com/v1/api/danh-sach/" + apiSlug + "?page=" + page;
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
    
    // Encode từ khóa chống lỗi Unicode
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return "https://vsmov.com/v1/api/tim-kiem?keyword=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    // Trỏ thẳng về API phim chi tiết của OphimCMS
    return "https://vsmov.com/v1/api/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/v1/api/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/v1/api/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS (XỬ LÝ JSON CHUẨN ES5 CỰC MƯỢT)
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || response || {};
        var rawItems = data.items || response.items || [];
        
        // VSMov dùng storage riêng nên cần bắt domain ảnh chuẩn
        var imgDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com";
        if (imgDomain && imgDomain.charAt(imgDomain.length - 1) === '/') {
            imgDomain = imgDomain.slice(0, -1);
        }

        var items = [];
        for (var i = 0; i < rawItems.length; i++) {
            var item = rawItems[i];
            if (!item) continue;
            
            var poster = item.poster_url || item.thumb_url || "";
            if (poster && poster.indexOf("http") !== 0) {
                poster = imgDomain + (poster.indexOf("/") === 0 ? "" : "/") + poster;
            }
            var thumb = item.thumb_url || item.poster_url || "";
            if (thumb && thumb.indexOf("http") !== 0) {
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
                episode_current: item.episode_current || item.episode_status || "",
                lang: item.lang || ""
            });
        }

        var pagination = (data.params && data.params.pagination) ? data.params.pagination : (response.pagination || {});
        var currentPage = parseInt(pagination.currentPage, 10) || 1;
        var totalPages = parseInt(pagination.totalPages, 10) || 1;
        
        if (isNaN(totalPages) || totalPages < 1) totalPages = 1;
        if (totalPages < currentPage) totalPages = currentPage;

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var movie = response.movie || response.item || response.data || {};
        var episodes = response.episodes || movie.episodes || [];
        
        // 1. Phân loại luồng phát / Tập phim
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

        // Bóc mảng name (Thể loại, quốc gia, diễn viên)
        function getNames(arr) {
            if (!arr) return "";
            if (!Array.isArray(arr)) return typeof arr === 'string' ? arr : "";
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

        // Nối link ảnh Detail chuẩn
        var imgDomain = response.pathImage || movie.APP_DOMAIN_CDN_IMAGE || "https://vsmov.com";
        if (imgDomain.charAt(imgDomain.length - 1) === '/') imgDomain = imgDomain.slice(0, -1);

        var posterUrl = movie.poster_url || movie.thumb_url || "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = imgDomain + "/" + posterUrl;
        
        var thumbUrl = movie.thumb_url || movie.poster_url || "";
        if (thumbUrl && thumbUrl.indexOf("http") !== 0) thumbUrl = imgDomain + "/" + thumbUrl;

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            originName: movie.origin_name || "",
            posterUrl: posterUrl,
            backdropUrl: thumbUrl,
            description: (movie.content || movie.description || "").replace(/<[^>]*>/g, ""), // Khử thẻ HTML
            year: parseInt(movie.year, 10) || 0,
            rating: ratingValue,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || movie.episode_status || "",
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
        // Tối ưu ExoPlayer (Phát thẳng Native) nếu bắt được link luồng
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
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var items = (response.data && response.data.items) ? response.data.items : (response.items || []);
        var results = [];
        for (var i = 0; i < items.length; i++) results.push({ name: items[i].name, slug: items[i].slug });
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var items = (response.data && response.data.items) ? response.data.items : (response.items || []);
        var results = [];
        for (var i = 0; i < items.length; i++) results.push({ name: items[i].name, value: items[i].slug });
        return JSON.stringify(results);
    } catch (e) { return "[]"; }
}
