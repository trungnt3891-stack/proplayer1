// =============================================================================
// PLUGIN VAX APP: ANIMEVV (animevv.com)
// PHIÊN BẢN: HOÀN THIỆN - BẮT LINK TỰ ĐỘNG BẰNG JSON INERTIA
// =============================================================================

var BASEURL = "https://animevv.com";

function getManifest() {
    return JSON.stringify({
        "id": "animevv",
        "name": "AnimeVV",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/iconmeo.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[AnimeVV] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[AnimeVV] " + msg);
    }
}

// =============================================================================
// CHUYÊN MỤC TRANG CHỦ & TÌM KIẾM
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { "slug": "featured", "title": "Anime Nổi Bật", "type": "Horizontal" },
        { "slug": "latest", "title": "Anime Mới Cập Nhật", "type": "Grid" },
        { "slug": "chinaLatest", "title": "Hoạt Hình Trung Quốc", "type": "Horizontal" },
        { "slug": "series", "title": "Anime Bộ Đang Hot", "type": "Horizontal" },
        { "slug": "movies", "title": "Anime Lẻ Đáng Chú Ý", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "hanh-dong" },
        { "name": "Phiêu Lưu", "slug": "phieu-luu" },
        { "name": "Phép Thuật", "slug": "phep-thuat" },
        { "name": "Hài Hước", "slug": "hai-huoc" },
        { "name": "Tình Cảm", "slug": "tinh-cam" },
        { "name": "Học Đường", "slug": "truong-hoc" },
        { "name": "Khoa Học Viễn Tưởng", "slug": "sci-fi" },
        { "name": "Đời Thường", "slug": "doi-thuong" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var isHome = ["featured", "latest", "chinaLatest", "series", "movies"].indexOf(slug) !== -1;
    if (isHome) {
        return BASEURL + "/?home_slug=" + slug; 
    }
    return BASEURL + "/tim-kiem?genre=" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(id) {
    return BASEURL + "/anime/" + id;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// HÀM TIỆN ÍCH: LẤY DỮ LIỆU TỪ INERTIA
// =============================================================================

function getInertiaData(html) {
    try {
        var match = html.match(/<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/);
        if (match && match[1]) {
            return JSON.parse(match[1]);
        }
    } catch (e) {
        log("Lỗi Parse JSON: " + e.message);
    }
    return null;
}

function mapItem(item) {
    var thumb = item.thumbnailOptimized || item.thumbnail || "";
    if (thumb && !thumb.startsWith("http")) thumb = BASEURL + thumb;

    var bg = item.backgroundOptimized || item.background || thumb;
    if (bg && !bg.startsWith("http")) bg = BASEURL + bg;

    return {
        id: item.slug, 
        title: item.title,
        posterUrl: thumb,
        backdropUrl: bg,
        quality: item.statusEpisode || "HD",
        episode_current: item.lastEpisodeName || "Full",
        lang: "Vietsub",
        year: parseInt(item.year) || 0,
        rating: item.rating ? parseFloat(item.rating) : 0
    };
}

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LẤY DANH SÁCH PHIM ---
function parseListResponse(html, url) {
    try {
        var data = getInertiaData(html);
        if (!data || !data.props) return JSON.stringify({ items: [] });

        var props = data.props;
        var rawItems = [];

        if (url.indexOf('tim-kiem') !== -1) {
            // Trang tìm kiếm & thể loại
            if (props.results && props.results.data) {
                rawItems = props.results.data;
            }
        } else {
            // Trang chủ
            var slugMatch = url.match(/home_slug=([^&]+)/);
            var slug = slugMatch ? slugMatch[1] : "";

            if (slug === 'featured') rawItems = props.featured || [];
            else if (slug === 'latest') rawItems = props.latest || [];
            else if (slug === 'chinaLatest') rawItems = props.chinaLatest || [];
            else {
                var sections = props.sections || [];
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].key === slug) {
                        rawItems = sections[i].items || [];
                        break;
                    }
                }
            }
        }

        var items = [];
        for (var j = 0; j < rawItems.length; j++) {
            items.push(mapItem(rawItems[j]));
        }

        // Lấy thông tin phân trang
        var currentPage = 1;
        var totalPages = 1;
        if (props.results && props.results.meta) {
            currentPage = props.results.meta.currentPage || 1;
            totalPages = props.results.meta.lastPage || 1;
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// --- HÀM 2: LẤY CHI TIẾT & DANH SÁCH TẬP ---
function parseMovieDetail(html, url) {
    try {
        var data = getInertiaData(html);
        if (!data || !data.props || !data.props.anime) return JSON.stringify({});

        var anime = data.props.anime;
        var episodesData = data.props.episodes || [];

        var detail = mapItem(anime);
        detail.description = anime.description || "";
        
        var categoryNames = [];
        if (anime.genres) {
            for (var i = 0; i < anime.genres.length; i++) {
                categoryNames.push(anime.genres[i].name);
            }
        }
        detail.category = categoryNames.join(", ");

        // Xử lý danh sách tập phim
        var episodes = [];
        for (var k = 0; k < episodesData.length; k++) {
            var ep = episodesData[k];
            
            // Xây dựng chính xác link xem phim dựa theo dữ liệu thực tế
            var watchUrl = BASEURL + "/xem-phim/" + anime.slug + "/" + ep.watchKey;

            episodes.push({
                id: watchUrl,
                name: ep.name,
                slug: ep.slug
            });
        }

        // Đảo ngược danh sách nếu tập mới nhất đang nằm dưới cùng
        episodes.reverse();

        detail.servers = [{
            name: "AnimeVV Server",
            episodes: episodes
        }];

        return JSON.stringify(detail);
    } catch (e) {
        return JSON.stringify({});
    }
}

// --- HÀM 3: XỬ LÝ PHÁT VIDEO KHI BẤM VÀO TẬP ---
function parseDetailResponse(html, apiUrl) {
    // Bật chế độ "isEmbed: true" để giao lại URL tập phim (vd: /xem-phim/...) cho App.
    // Trình duyệt ngầm (Auto-Sniffer) của VAX App sẽ tải trang này, gọi API lấy Token và tự bắt link video .m3u8 phát cho bạn.
    return JSON.stringify({
        url: apiUrl,
        isEmbed: true,
        headers: {
            "Referer": BASEURL + "/"
        }
    });
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
