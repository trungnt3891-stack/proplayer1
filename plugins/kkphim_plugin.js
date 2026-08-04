// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

// Khai báo hàm log dự phòng để tránh crash nếu Engine không hỗ trợ
var log = typeof log === "function" ? log : function(msg) { console.log(msg); };

function getManifest() {
    return JSON.stringify({
        "id": "kkphim",
        "name": "KKPhim",
        "version": "1.0.3",
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
    try {
        var filters = typeof filtersJson === 'string' ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        var page = filters.page || 1;
        // Chuyển sang URL web của KKPhim để bypass lỗi API JSON
        return "https://kkphim.com/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
    } catch (e) {
        return "https://kkphim.com/tim-kiem?keyword=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    return "https://phimapi.com/phim/" + slug;
}

function getUrlCategories() { return "https://phimapi.com/the-loai"; }
function getUrlCountries() { return "https://phimapi.com/quoc-gia"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        // Xử lý an toàn: Kiểm tra kiểu dữ liệu đầu vào
        var response = typeof html === 'string' ? JSON.parse(html) : html;
        var data = response.data || {};
        var items = Array.isArray(data) ? data : (data.items || response.items || []);
        var pagination = response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url),
                backdropUrl: getPosterUrl(item.thumb_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 24)) || 1
            }
        });
    } catch (error) {
        log("Lỗi Parse List: " + error);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    try {
        log("Bắt đầu Parse Search HTML bằng Regex...");
        var items = [];
        
        // Chia HTML thành các khối chứa phim (mỗi tr tương ứng 1 phim) để chống nhảy sai Index
        var rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
        
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            
            var posterMatch = row.match(/<img[^>]+src="([^"]+)"/i);
            var titleMatch = row.match(/<a[^>]+href="[^"]*\/phim\/([^"]+)"[^>]*>([^<]+)<\/a>/i);
            
            if (!titleMatch) continue; // Bỏ qua nếu không tìm thấy title/slug
            
            var slug = titleMatch[1];
            var title = titleMatch[2].trim();
            var posterUrl = posterMatch ? getPosterUrl(posterMatch[1]) : "";
            
            var originMatch = row.match(/<div class="info-origin">([^<]*)<\/div>/i);
            var originTitle = originMatch ? originMatch[1].trim() : "";
            
            var statusMatch = row.match(/<span class="st-badge[^"]*">([^<]+)<\/span>/i);
            var status = statusMatch ? statusMatch[1].trim() : "";
            
            var yearMatch = row.match(/<td[^>]*>(\d{4})<\/td>/i);
            var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
            
            items.push({
                id: slug,
                title: title,
                originalTitle: originTitle,
                posterUrl: posterUrl,
                backdropUrl: posterUrl, // Tạm dùng poster vì HTML Search không chứa thumb
                episode_current: status,
                year: year
            });
        }

        // Bóc tách phân trang
        var currentPage = 1;
        var totalPages = 1;
        var pageMatch = html.match(/Trang\s+(\d+)\/(\d+)/i);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10);
            totalPages = parseInt(pageMatch[2], 10);
        }

        log("Parse Search thành công: " + items.length + " phim.");
        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (error) {
        log("Lỗi Parse Search: " + error);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseMovieDetail(html, url) {
    try {
        var response = typeof html === 'string' ? JSON.parse(html) : html;
        var movie = response.movie || {};
        var episodes = response.episodes || [];
        var servers = [];

        episodes.forEach(function (server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function (ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed, // Đưa link trực tiếp vào id
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url),
            backdropUrl: getPosterUrl(movie.thumb_url),
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
        // Tối ưu NATIVE PLAYER: Phát hiện Direct Link (M3U8 / MP4)
        if (url && (url.indexOf(".m3u8") !== -1 || url.indexOf(".mp4") !== -1)) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 
                    "Referer": "https://kkphim.com/" 
                }
            });
        } 
        // Xử lý WEBVIEW chống quảng cáo: Tiêm Script ẩn các class Ads và bắt full màn hình
        else {
            var customJs = "document.querySelectorAll('header, footer, .ads, iframe[sandbox]').forEach(function(e){e.style.display='none'}); document.body.style.background='#000'; document.body.style.width='100vw'; document.body.style.height='100vh'; setInterval(function(){var btn=document.querySelector('.close-ads');if(btn)btn.click();}, 1000);";
            return JSON.stringify({
                url: url,
                isEmbed: true,
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", 
                    "Referer": "https://kkphim.com/",
                    "Custom-Js": customJs
                }
            });
        }
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

function getPosterUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://phimimg.com/" + path;
}
