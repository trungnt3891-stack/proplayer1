// =============================================================================
// PLUGIN VAX APP: ANIMEVV (animevv.com)
// NGUỒN: Inertia.js JSON Data
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
// CHUYÊN MỤC TRANG CHỦ
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
        { "name": "Tình Cảm", "slug": "tinh-cam" },
        { "name": "Hài Hước", "slug": "hai-huoc" },
        { "name": "Phép Thuật", "slug": "phep-thuat" },
        { "name": "Xuyên Không (Isekai)", "slug": "isekai" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var isHome = ["featured", "latest", "chinaLatest", "series", "movies"].indexOf(slug) !== -1;
    if (isHome) {
        // Nếu là mục ở trang chủ, tải trang chủ
        return BASEURL + "/?home_slug=" + slug; 
    }
    // Nếu là thể loại, sử dụng trang tìm kiếm / lọc của web
    return BASEURL + "/tim-kiem?genre=" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(id) {
    // Trỏ vào chi tiết phim
    return BASEURL + "/anime/" + id;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// HÀM TIỆN ÍCH LẤY DỮ LIỆU INERTIA
// =============================================================================

function getInertiaData(html) {
    try {
        var match = html.match(/<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/);
        if (match && match[1]) {
            return JSON.parse(match[1]);
        }
    } catch (e) {
        log("Lỗi Parse JSON Inertia: " + e.message);
    }
    return null;
}

function mapItem(item) {
    // Xử lý ảnh: Ưu tiên ảnh thumbnailOptimized hoặc thumbnail
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
            // Đang ở trang Tìm kiếm hoặc Thể loại
            if (props.results && props.results.data) {
                rawItems = props.results.data;
            }
        } else {
            // Đang ở Trang chủ
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

        // Thông tin phân trang (nếu có)
        var currentPage = 1;
        var totalPages = 1;
        if (props.meta) {
            currentPage = props.meta.currentPage || 1;
            totalPages = props.meta.lastPage || 1;
        }

        return JSON.stringify({
            items: items,
            pagination: { 
                currentPage: currentPage, 
                totalPages: totalPages 
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// --- HÀM 2: LẤY CHI TIẾT VÀ TẬP PHIM ---
function parseMovieDetail(html, url) {
    try {
        var data = getInertiaData(html);
        if (!data || !data.props || !data.props.anime) return JSON.stringify({});

        var anime = data.props.anime;
        var episodesData = data.props.episodes || [];

        // Lấy thông tin phim
        var detail = mapItem(anime);
        detail.description = anime.description || "";
        
        var categoryNames = [];
        if (anime.genres) {
            for (var i = 0; i < anime.genres.length; i++) {
                categoryNames.push(anime.genres[i].name);
            }
        }
        detail.category = categoryNames.join(", ");

        // Xử lý danh sách tập
        var episodes = [];
        for (var k = 0; k < episodesData.length; k++) {
            var ep = episodesData[k];
            
            // Gói dữ liệu tập phim (watchKey + slug phim) để hứng ở Cấp 3 lấy link xem
            var packedId = anime.slug + "|||" + ep.watchKey;

            episodes.push({
                id: packedId,
                name: ep.name,
                slug: ep.slug
            });
        }

        detail.servers = [{
            name: "AnimeVV Server",
            episodes: episodes
        }];

        return JSON.stringify(detail);
    } catch (e) {
        return JSON.stringify({});
    }
}

// --- HÀM 3: BÓC LINK VIDEO ĐỂ PHÁT ---
function parseDetailResponse(html, apiUrl) {
    try {
        var animeSlug = "";
        var watchKey = "";

        if (apiUrl.indexOf("|||") !== -1) {
            var parts = apiUrl.split("|||");
            animeSlug = parts[0];
            watchKey = parts[1];
        }

        // URL dùng để lấy m3u8 có thể là trang xem phim /xem-phim/[slug]/[watchKey] 
        // Hoặc một API nội bộ. Dưới đây là URL giả định thông dụng của hệ thống Inertia
        // VAX App sẽ chuyển hướng Request tới hàm này, bạn cần kiểm tra chính xác URL khi ấn xem trên trình duyệt.
        var watchUrl = BASEURL + "/xem-phim/" + animeSlug + "-" + watchKey;

        // Trả về luồng để VAX xử lý extract
        return JSON.stringify({
            "url": watchUrl,
            "isEmbed": false, 
            "headers": {
                "Referer": BASEURL
            }
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
