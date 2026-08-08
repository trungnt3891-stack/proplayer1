// =============================================================================
// PLUGIN VAX APP: ANIMEVV (animevv.com)
// PHIÊN BẢN CHUẨN MỰC: NATIVE EPISODE SELECTOR + WEBVIEW PLAYER FULLSCREEN
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animevv",
        "name": "AnimeVV",
        "version": "1.1.3",
        "baseUrl": "https://animevv.com",
        "iconUrl": "https://animevv.com/iconmeo.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

// =============================================================================
// CHUYÊN MỤC TRANG CHỦ & TÌM KIẾM
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'featured', title: 'Anime Nổi Bật', type: 'Horizontal' },
        { slug: 'latest', title: 'Anime Mới Cập Nhật', type: 'Grid' },
        { slug: 'chinaLatest', title: 'Hoạt Hình Trung Quốc', type: 'Horizontal' },
        { slug: 'series', title: 'Anime Bộ Đang Hot', type: 'Horizontal' },
        { slug: 'movies', title: 'Anime Lẻ Đáng Chú Ý', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' },
        { name: 'Phép Thuật', slug: 'phep-thuat" ' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Học Đường', slug: 'truong-hoc' },
        { name: 'Khoa Học Viễn Tưởng', slug: 'sci-fi' },
        { name: 'Đời Thường', slug: 'doi-thuong' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var isHome = ["featured", "latest", "chinaLatest", "series", "movies"].indexOf(slug) !== -1;
    if (isHome) {
        return "https://animevv.com/?home_slug=" + slug; 
    }
    return "https://animevv.com/tim-kiem?genre=" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    return "https://animevv.com/tim-kiem?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(id) {
    return "https://animevv.com/anime/" + id;
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
    } catch (e) {}
    return null;
}

function mapItem(item) {
    var thumb = item.thumbnailOptimized || item.thumbnail || "";
    if (thumb && !thumb.startsWith("http")) thumb = "https://animevv.com" + thumb;

    var bg = item.backgroundOptimized || item.background || thumb;
    if (bg && !bg.startsWith("http")) bg = "https://animevv.com" + bg;

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

// KÉO TẬP PHIM RA GIAO DIỆN NATIVE ĐỂ CHỌN
function parseMovieDetail(html, url) {
    try {
        var data = getInertiaData(html);
        if (!data || !data.props || !data.props.anime) return JSON.stringify({});

        var anime = data.props.anime;
        var episodesData = data.props.episodes || [];
        var detail = mapItem(anime);

        var episodes = [];
        for (var k = 0; k < episodesData.length; k++) {
            var ep = episodesData[k];
            // Lắp URL thực tế của tập phim để truyền xuống hàm Webview bên dưới
            var watchUrl = "https://animevv.com/xem-phim/" + anime.slug + "/" + ep.watchKey;

            episodes.push({
                id: watchUrl, // Đưa thẳng link trang xem phim Webview vào biến ID
                name: ep.name,
                slug: ep.slug
            });
        }

        episodes.reverse(); // Lật mảng để tập 1 lên đầu

        var servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "AnimeVV",
                episodes: episodes
            });
        }

        return JSON.stringify({
            id: url,
            title: detail.title,
            posterUrl: detail.posterUrl,
            backdropUrl: detail.backdropUrl,
            description: anime.description || "",
            servers: servers // Trả về danh sách tập cho App vẽ giao diện
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// BẬT WEBVIEW XEM PHIM NGAY KHI NGƯỜI DÙNG BẤM CHỌN TẬP
function parseDetailResponse(html, url) {
    // Ép Video giãn 100% màn hình, xoá mọi dấu vết giao diện web rác, ẩn bình luận
    var customJs = "document.querySelectorAll('header, footer, nav, aside, .ads, .sidebar, .mt-8, iframe[sandbox]').forEach(function(e){e.style.display='none'});";
    customJs += "document.body.style.backgroundColor='#000'; document.body.style.overflow='hidden';";
    customJs += "var v = document.querySelector('video, iframe, #player, .jwplayer'); if(v){ v.style.width='100vw'; v.style.height='100vh'; v.style.position='fixed'; v.style.top='0'; v.style.left='0'; v.style.zIndex='999999'; }";
    
    return JSON.stringify({
        url: url, // Đây chính là Link Webview nhận từ parseMovieDetail ở trên
        isEmbed: true, // Kích hoạt trình duyệt Webview tích hợp
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Referer": "https://animevv.com/",
            "Custom-Js": customJs 
        }
    });
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
