// =============================================================================
// PLUGIN VAX APP: ANIMEVV (animevv.com)
// PHIÊN BẢN: HOÀN THIỆN - BẮT LINK BẰNG HOOK (HIỂN THỊ WEBVIEW ĐỂ VƯỢT AUTOPLAY)
// =============================================================================

var BASEURL = "https://animevv.com";

function getManifest() {
    return JSON.stringify({
        "id": "animevv",
        "name": "AnimeVV",
        "version": "1.0.5",
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
            if (props.results && props.results.data) {
                rawItems = props.results.data;
            }
        } else {
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

        var episodes = [];
        for (var k = 0; k < episodesData.length; k++) {
            var ep = episodesData[k];
            var watchUrl = BASEURL + "/xem-phim/" + anime.slug + "/" + ep.watchKey;

            episodes.push({
                id: watchUrl,
                name: ep.name,
                slug: ep.slug
            });
        }

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

// --- HÀM 3: XỬ LÝ PHÁT VIDEO ---
function parseDetailResponse(html, apiUrl) {
    try {
        return JSON.stringify({
            url: apiUrl,
            isEmbed: true,
            hook: true, // Kích hoạt bắt link ngầm
            // KHÔNG DÙNG embedtoplay: true để hiển thị Webview cho phép người dùng click "Play" kích hoạt luồng m3u8
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: apiUrl, isEmbed: true, hook: true });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
