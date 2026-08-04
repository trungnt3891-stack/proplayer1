// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (NATIVE PLAYER EDITION)
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.0.8",
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
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Chiếu rạp', slug: 'phim-chieu-rap' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Mới đăng', value: '_id' }
        ]
    });
}

// =============================================================================
// URL GENERATION (ĐỊNH TUYẾN CHUẨN API JSON CỦA VSMOV)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        }
    } catch (e) {}

    // Cực kỳ quan trọng: Định tuyến đúng thư mục API
    var listSlugs = ['phim-moi-cap-nhat', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'subteam'];
    var basePath = "the-loai"; // Nếu không nằm trong danh sách trên, nó là thể loại (hành động, tình cảm...)
    
    if (listSlugs.indexOf(slug) !== -1) {
        basePath = "danh-sach";
    }

    return "https://vsmov.com/api/" + basePath + "/" + slug + "?page=" + page;
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
// DATA PARSERS (API JSON PROCESSING)
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || response || {};
        var rawItems = data.items || response.items || [];
        
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
        
        if (pagination.totalItems && pagination.totalItemsPerPage && !pagination.totalPages) {
            totalPages = Math.ceil(parseInt(pagination.totalItems, 10) / parseInt(pagination.totalItemsPerPage, 10));
        }

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

// BÓC TÁCH DETAIL VÀ SỐ TẬP ĐỂ CẤP LINK LUỒNG TRỰC TIẾP (.m3u8)
function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || response.item || response.data || {};
        var episodes = response.episodes || movie.episodes || [];
        
        // Vét sạch danh sách tập phim và gán link trực tiếp vào ID
        var servers = [];
        for (var i = 0; i < episodes.length; i++) {
            var server = episodes[i];
            var serverEpisodes = [];
            
            if (server.server_data && Array.isArray(server.server_data)) {
                for (var j = 0; j < server.server_data.length; j++) {
                    var ep = server.server_data[j];
                    // LẤY TRỰC TIẾP LINK M3U8 GÁN VÀO ID ĐỂ PLAYER PHÁT NATIVE
                    var mediaLink = ep.link_m3u8 || ep.link_embed || ep.link || "";
                    if (mediaLink) {
                        serverEpisodes.push({
                            id: mediaLink, 
                            name: ep.name || "Tập " + (j + 1),
                            slug: ep.slug || ("tap-" + (j + 1))
                        });
                    }
                }
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name || "Vietsub VIP", episodes: serverEpisodes });
            }
        }

        // Bóc tách mảng Thể loại, Diễn viên
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
            description: (movie.content || movie.description || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year, 10) || 0,
            rating: ratingValue,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers, // Trả full danh sách tập
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

// LỆNH PHÁT NATIVE PLAYER
function parseDetailResponse(apiResponseJson, url) {
    try {
        // App sẽ kiểm tra nếu url chứa .m3u8 hoặc .mp4 thì sẽ phát thẳng bằng ExoPlayer
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false, // Lệnh tắt Webview, Bật Native
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36", 
                    "Referer": "https://vsmov.com/",
                    "Origin": "https://vsmov.com"
                }
            });
        } 
        // Dự phòng: Nếu API trả về link web embed thì mới bật Webview
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
