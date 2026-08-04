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
        { slug: 'phim-thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi-cap-nhat-v3', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat-v3' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'TV shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim vietsub', slug: 'phim-vietsub' },
        { name: 'Phim thuyết minh', slug: 'phim-thuyet-minh' },
        { name: 'Phim lồng tiếng', slug: 'phim-long-tieng' },
        { name: 'Subteam', slug: 'subteam' },
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

        var typeList = slug;
        if (typeList === 'phim-moi') typeList = 'phim-moi-cap-nhat-v3';

        if (slug === 'phim-moi-cap-nhat-v3' || typeList === 'phim-moi-cap-nhat-v3') {
            return "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=" + page;
        }

        var url = "https://phimapi.com/v1/api/" + basePath + "/" + typeList + "?page=" + page;
        url += "&limit=" + (filters.limit || 24);

        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.sort) url += "&sort_field=" + filters.sort;

        return url;
    } catch (e) {
        return "https://phimapi.com/v1/api/danh-sach/" + slug;
    }
}

// Gọi URL Web HTML để tìm kiếm (tránh lỗi API)
function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string') {
            var filters = JSON.parse(filtersJson || "{}");
            page = filters.page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {
        page = 1;
    }
    return "https://kkphim.com/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://phimapi.com/phim/" + slug;
}

function getUrlCategories() { return "https://phimapi.com/the-loai"; }
function getUrlCountries() { return "https://phimapi.com/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || {};
        var items = data.items || (Array.isArray(data) ? data : (response.items || []));

        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url),
                backdropUrl: getPosterUrl(item.thumb_url || item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: parseInt(pagination.currentPage, 10) || 1,
                totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 24)) || 1
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

// Bóc tách Tìm kiếm bằng Regex từ HTML
function parseSearchResponse(html) {
    try {
        var items = [];
        var tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
        var tbody = tbodyMatch ? tbodyMatch[1] : html;
        var rows = tbody.match(/<tr>([\s\S]*?)<\/tr>/gi) || [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            var titleMatch = row.match(/<a[^>]+href="[^"]*\/phim\/([^"]+)"[^>]*class="info-title"[^>]*>([^<]+)<\/a>/i);
            if (!titleMatch) continue; 

            var id = titleMatch[1];
            var title = titleMatch[2].trim();

            var posterMatch = row.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            var originMatch = row.match(/<div class="info-origin">([^<]*)<\/div>/i);
            var originalTitle = originMatch ? originMatch[1].trim() : "";

            var yearMatch = row.match(/<td[^>]*class="text-secondary col-hide-sm">(\d{4})<\/td>/i);
            var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

            var statusMatch = row.match(/<span class="st-badge[^"]*">([^<]+)<\/span>/i);
            var status = statusMatch ? statusMatch[1].trim() : "";

            items.push({
                id: id,
                title: title,
                originalTitle: originalTitle,
                posterUrl: posterUrl,
                backdropUrl: posterUrl, 
                year: year,
                episode_current: status
            });
        }

        var currentPage = 1;
        var totalPages = 1;
        var pageMatch = html.match(/Trang\s+(\d+)\/(\d+)/i);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10);
            totalPages = parseInt(pageMatch[2], 10);
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
    } catch (error) {
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

        var categories = (movie.category || []).map(function (c) { return c.name; }).join(", ");
        var countries = (movie.country || []).map(function (c) { return c.name; }).join(", ");
        var directors = (movie.director || []).join(", ");
        var actors = (movie.actor || []).join(", ");

        var ratingValue = 0, tmdbId = "", tmdbSeason = 0, tmdbType = "";
        if (movie.tmdb) {
            ratingValue = movie.tmdb.vote_average || 0;
            tmdbId = movie.tmdb.id || "";
            tmdbSeason = parseInt(movie.tmdb.season, 10) || 0;
            tmdbType = movie.tmdb.type || "";
        }

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url),
            backdropUrl: getPosterUrl(movie.thumb_url || movie.poster_url),
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            year: movie.year || 0,
            rating: ratingValue,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: categories,
            country: countries,
            director: directors,
            casts: actors,
            status: movie.status || "",
            tmdbId: String(tmdbId),
            tmdbSeason: tmdbSeason,
            tmdbType: tmdbType
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(html, url) {
    try {
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://kkphim.com/" }
            });
        } 
        return JSON.stringify({
            url: url || "",
            isEmbed: true,
            headers: { "Referer": "https://kkphim.com/" }
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
        var items = response.data?.items || response.items || (Array.isArray(response) ? response : []);
        return JSON.stringify(items.map(function (i) { return { name: i.name, slug: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === 'string' ? JSON.parse(apiResponseJson) : apiResponseJson;
        var items = response.data?.items || response.items || (Array.isArray(response) ? response : []);
        return JSON.stringify(items.map(function (i) { return { name: i.name, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    return "[]";
}

function getPosterUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    if (path.indexOf("/") === 0) path = path.substring(1);
    return "https://phimimg.com/" + path;
}
