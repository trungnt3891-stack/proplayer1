// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: CHIA FOLDER NGAY TRÊN TRANG CHỦ & PHÁT AUTO-FALLBACK
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.3",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Vẫn là MOVIE theo chuẩn Vax App
        "layoutType": "VERTICAL",
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

// --- TẠO CÁC FOLDER (THƯ MỤC) HIỂN THỊ TRỰC TIẾP TRÊN TRANG CHỦ ---
function getHomeSections() {
    return JSON.stringify([
        { "slug": "vtv", "title": "Kênh VTV", "type": "Grid" },
        { "slug": "vtvcab", "title": "Kênh VTVcab", "type": "Grid" },
        { "slug": "sctv", "title": "Kênh SCTV", "type": "Grid" },
        { "slug": "htv", "title": "Kênh HTV", "type": "Grid" },
        { "slug": "htvc", "title": "Kênh HTVC", "type": "Grid" },
        { "slug": "diaphuong", "title": "Đài Địa Phương", "type": "Grid" },
        { "slug": "thietyeu", "title": "Kênh Thiết Yếu", "type": "Grid" }
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
    // Truyền slug (vtv, sctv...) vào URL để hàm parseListResponse biết đường cắt HTML
    return BASEURL + "?group=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    // Luôn tải trang chủ làm mồi cho Vax App
    return BASEURL;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: BÓC TÁCH CÁC KÊNH ĐỂ HIỂN THỊ VÀO ĐÚNG FOLDER TƯƠNG ỨNG ---
function parseListResponse(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("group=") > -1) {
            slug = url.split("group=")[1];
        }

        // Chặt HTML theo từng khối tiêu đề
        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Tìm đúng khối HTML chứa kênh của đài đó
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/);
            if (!titleMatch) continue;

            var title = titleMatch[1].toLowerCase().trim();
            var isMatch = false;

            if (slug === 'vtv' && title.indexOf('vtv (') > -1) isMatch = true;
            else if (slug === 'vtvcab' && title.indexOf('vtvcab') > -1) isMatch = true;
            else if (slug === 'sctv' && title.indexOf('sctv') > -1) isMatch = true;
            else if (slug === 'htv' && title.indexOf('htv (') > -1) isMatch = true;
            else if (slug === 'htvc' && title.indexOf('htvc') > -1) isMatch = true;
            else if (slug === 'diaphuong' && title.indexOf('địa phương') > -1) isMatch = true;
            else if (slug === 'thietyeu' && title.indexOf('thiết yếu') > -1) isMatch = true;

            if (isMatch) {
                targetHtml = block;
                break;
            }
        }

        var items = [];
        if (targetHtml) {
            var channelParts = targetHtml.split('class="channel-card');
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                var imgM = cp.match(/src=["']([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " "); 
                    var logo = imgM ? imgM[1] : "https://tinhlagi.pro/tinhlagi.ico";
                    
                    // Tuyệt chiêu: Gói toàn bộ dữ liệu vào ID để hàm parseMovieDetail lấy ra dùng
                    var itemId = streamLink + "|||" + channelName + "|||" + logo;
                    
                    items.push({
                        id: itemId,
                        title: channelName,
                        posterUrl: logo,
                        backdropUrl: logo,
                        quality: "LIVE",
                        episode_current: "Live HD"
                    });
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 1 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

// --- HÀM 2: TRANG CHI TIẾT KHI BẤM VÀO 1 KÊNH CỤ THỂ ---
function parseMovieDetail(html, url) {
    try {
        // Tách dữ liệu từ cái ID mà ta đã gói ở parseListResponse
        var parts = url.split("|||");
        var streamLink = parts[0];
        var channelName = parts[1] || "Kênh TV";
        var logo = parts[2] || "https://tinhlagi.pro/tinhlagi.ico";

        return JSON.stringify({
            id: streamLink, // Quan trọng: Gắn streamLink vào id để phát
            title: channelName,
            posterUrl: logo,
            backdropUrl: logo,
            description: "Đang phát trực tiếp kênh " + channelName + " tốc độ cao.",
            quality: "LIVE",
            year: 2026,
            rating: 10,
            servers: [{
                name: "Nguồn Phát Tinhlagi",
                episodes: [{
                    id: streamLink, // Gắn streamLink vào tập
                    name: "Xem Ngay",
                    slug: "live"
                }]
            }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải kênh", servers: [] });
    }
}

// --- HÀM 3: XỬ LÝ LINK (GIỮ NGUYÊN 100% CỦA BẠN ĐỂ AUTO PHÁT) ---
function parseDetailResponse(html) {
    // Trả về {} để Vax App tự động lấy ID (chính là m3u8) truyền vào Player
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
