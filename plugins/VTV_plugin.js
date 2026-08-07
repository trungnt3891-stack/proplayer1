// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// PHIÊN BẢN CHUẨN XÁC: LAYOUT LOGO VUÔNG + FIX DỨT ĐIỂM LỖI VTV (FPT)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "11.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",        // Dùng chuẩn MOVIE để kiểm soát hoàn toàn việc nạp Header
        "layoutType": "SQUARE", // HIỆN LOGO KÊNH VUÔNG VẮN, KHÔNG BỊ DÃNG DẠNG PHIM
        "playerType": "auto"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[Tivi_TinhLaGi] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[Tivi_TinhLaGi] " + msg);
    }
}

// --- TẠO CÁC FOLDER LƯỚT NGANG TRÊN TRANG CHỦ ---
function getHomeSections() {
    return JSON.stringify([
        { "slug": "vtv", "title": "Kênh VTV", "type": "Horizontal" },
        { "slug": "vtvcab", "title": "Kênh VTVcab", "type": "Horizontal" },
        { "slug": "sctv", "title": "Kênh SCTV", "type": "Horizontal" },
        { "slug": "htv", "title": "Kênh HTV", "type": "Horizontal" },
        { "slug": "htvc", "title": "Kênh HTVC", "type": "Horizontal" },
        { "slug": "diaphuong", "title": "Đài Địa Phương", "type": "Horizontal" },
        { "slug": "thietyeu", "title": "Kênh Thiết Yếu", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "vtv", "name": "VTV" },
        { "slug": "vtvcab", "name": "VTVcab" },
        { "slug": "sctv", "name": "SCTV" },
        { "slug": "htv", "name": "HTV" },
        { "slug": "htvc", "name": "HTVC" },
        { "slug": "diaphuong", "name": "Địa Phương" },
        { "slug": "thietyeu", "name": "Thiết Yếu" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(slug) {
    // Tải lại trang chủ để bóc danh sách kênh bên trong nhóm
    return BASEURL;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: TẠO CÁC DANH MỤC (FOLDER) TRÊN TRANG CHỦ ---
function parseListResponse(html) {
    var groups = [
        { id: "vtv", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "vtvcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "sctv", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "htv", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "htvc", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "diaphuong", name: "Kênh Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "thietyeu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
    ];

    var items = [];
    for (var i = 0; i < groups.length; i++) {
        items.push({
            id: groups[i].id, 
            title: groups[i].name,
            posterUrl: groups[i].img,
            backdropUrl: groups[i].img,
            quality: "HD",
            episode_current: "Live",
            lang: "Viet",
            year: 2026
        });
    }

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1 }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// --- HÀM 2: LẤY DANH SÁCH KÊNH TRONG TỪNG FOLDER ---
function parseMovieDetail(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("slug=") > -1) {
            slug = url.split("slug=")[1].toLowerCase().trim();
        }

        var requiredGroups = ["vtv", "vtvcab", "sctv", "htv", "htvc", "địa phương", "thiết yếu"];
        var episodes = [];
        var groupBlocks = html.split('<h2 class="group-title">');
        var groupTitleDisplay = "Danh sách kênh";

        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;

            var rawTitle = block.substring(0, titleEnd);
            var groupName = rawTitle.split('(')[0].trim().toLowerCase();

            var isMatch = false;
            if (slug === 'vtv' && groupName === 'vtv') { isMatch = true; groupTitleDisplay = "Kênh VTV"; }
            else if (slug === 'vtvcab' && groupName === 'vtvcab') { isMatch = true; groupTitleDisplay = "Kênh VTVcab"; }
            else if (slug === 'sctv' && groupName === 'sctv') { isMatch = true; groupTitleDisplay = "Kênh SCTV"; }
            else if (slug === 'htv' && groupName === 'htv') { isMatch = true; groupTitleDisplay = "Kênh HTV"; }
            else if (slug === 'htvc' && groupName === 'htvc') { isMatch = true; groupTitleDisplay = "Kênh HTVC"; }
            else if (slug === 'diaphuong' && groupName === 'địa phương') { isMatch = true; groupTitleDisplay = "Kênh Địa Phương"; }
            else if (slug === 'thietyeu' && groupName.indexOf('thiết yếu') > -1) { isMatch = true; groupTitleDisplay = "Kênh Thiết Yếu"; }

            if (!isMatch) continue;

            // Tách từng thẻ chứa kênh
            var channelParts = block.split('<a href="?url=');
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlMatch = cp.match(/^(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;

                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);

                var streamLink = decodeURIComponent(urlMatch[1]);
                var channelName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ").trim() : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                // Đóng gói link luồng và logo vào ID của tập phim
                var packedId = streamLink + "|||" + logo;

                episodes.push({
                    id: packedId,
                    name: channelName,
                    slug: "channel-" + k
                });
            }
            break;
        }

        return JSON.stringify({
            id: url,
            title: groupTitleDisplay,
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: "Chọn kênh bên dưới để xem trực tiếp.",
            servers: [{
                name: groupTitleDisplay,
                episodes: episodes
            }],
            quality: "LIVE",
            lang: "Viet",
            year: 2026,
            rating: 10,
            category: "Truyền Hình",
            status: "Đang phát sóng"
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải kênh", servers: [] });
    }
}

// --- HÀM 3: NẠP HEADER VÀ MỞ KHÓA FPT PLAY CHO TẤT CẢ KÊNH VTV ---
function parseDetailResponse(html, apiUrl) {
    try {
        var parts = apiUrl.split("|||");
        var realUrl = parts[0];

        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) mimeType = "application/dash+xml"; 
        if (realUrl.indexOf(".ts") > -1) mimeType = "video/mp2t"; 

        // BẮT BUỘC CÓ OBJECT HEADERS NÀY THÌ VTV MỚI KHÔNG BỊ LỖI 403 / MÀN HÌNH ĐEN
        return JSON.stringify({
            "url": realUrl,
            "isEmbed": false, 
            "mimeType": mimeType,
            "headers": {
                "User-Agent": "cvmedia/1.1.0",
                "Referer": "https://tinhlagi.pro/",
                "Origin": "https://tinhlagi.pro"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
