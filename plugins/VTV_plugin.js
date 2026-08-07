// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// TỐI ƯU: LOGO VUÔNG + LƯỚT NGANG + BẤM LÀ PHÁT + MỞ KHÓA VTV (FPT)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "9.0.0", // Fix VTV triệt để + Logo vuông
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "IPTV",         // Chế độ Tivi: Bấm vào kênh là MỞ TRÌNH PHÁT LUÔN
        "layoutType": "SQUARE", // Đổi giao diện từ Phim (Dọc) sang Logo Kênh (Vuông nhỏ gọn)
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

// --- TẠO 8 FOLDER LƯỚT NGANG TRÊN TRANG CHỦ ---
function getHomeSections() {
    return JSON.stringify([
        { "slug": "vtv", "title": "Kênh VTV", "type": "Horizontal" },
        { "slug": "vtvcab", "title": "Kênh VTVcab", "type": "Horizontal" },
        { "slug": "sctv", "title": "Kênh SCTV", "type": "Horizontal" },
        { "slug": "htv", "title": "Kênh HTV", "type": "Horizontal" },
        { "slug": "htvc", "title": "Kênh HTVC", "type": "Horizontal" },
        { "slug": "diaphuong", "title": "Đài Địa Phương", "type": "Horizontal" },
        { "slug": "thietyeu", "title": "Kênh Thiết Yếu", "type": "Horizontal" },
        { "slug": "live", "title": "Sự Kiện Trực Tiếp 🔴", "type": "Horizontal" }
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
        { "slug": "thietyeu", "name": "Thiết Yếu" },
        { "slug": "live", "name": "Live Events" }
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

function getUrlDetail(id) {
    // Đẩy link vào tham số ẩn để ép App phải chạy qua hàm nạp Header (Cấp 3)
    return BASEURL + "?play=" + encodeURIComponent(id);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LỌC HTML -> CẮT LINK VÀ LOGO KÊNH THẬT SỰ ---
function parseListResponse(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("slug=") > -1) {
            slug = url.split("slug=")[1].toLowerCase().trim();
        }

        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/i);
            if (!titleMatch) continue;

            var groupName = titleMatch[1].split('(')[0].trim().toLowerCase();
            var isMatch = false;

            if (slug === 'vtv' && groupName === 'vtv') isMatch = true;
            else if (slug === 'vtvcab' && groupName === 'vtvcab') isMatch = true;
            else if (slug === 'sctv' && groupName === 'sctv') isMatch = true;
            else if (slug === 'htv' && groupName === 'htv') isMatch = true;
            else if (slug === 'htvc' && groupName === 'htvc') isMatch = true;
            else if (slug === 'diaphuong' && groupName === 'địa phương') isMatch = true;
            else if (slug === 'thietyeu' && groupName.indexOf('thiết yếu') > -1) isMatch = true;
            else if (slug === 'live' && groupName.indexOf('live events') > -1) isMatch = true;

            if (isMatch) {
                targetHtml = block;
                break;
            }
        }

        var items = [];
        if (targetHtml) {
            var channelParts = targetHtml.split('<a href="?url=');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                
                // Lấy URL trước chữ &name
                var urlMatch = cp.match(/^(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;
                
                // Lấy Tên và Logo kênh từ HTML
                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                var streamLink = decodeURIComponent(urlMatch[1]);
                var channelName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ").trim() : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                items.push({
                    id: streamLink, // Gửi link m3u8 vào ID
                    title: channelName,
                    posterUrl: logo,   // HIỂN THỊ LOGO THẬT
                    backdropUrl: logo,
                    quality: "LIVE",
                    episode_current: "Live"
                });
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

// --- HÀM 2: TRANG CHI TIẾT (BỎ QUA VÌ DÙNG CHẾ ĐỘ IPTV BẤM LÀ PHÁT) ---
function parseMovieDetail(html, url) {
    return JSON.stringify({});
}

// --- HÀM 3: NẠP HEADER TRỰC TIẾP VÀO URL (CHÌA KHÓA MỞ VTV) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = "";
        var encodedId = apiUrl.split("?play=")[1];
        if (encodedId) {
            realUrl = decodeURIComponent(encodedId);
        }

        // ==============================================================
        // TUYỆT CHIÊU EXOPLAYER: NỐI CHUỖI HEADER TRỰC TIẾP VÀO URL
        // Máy chủ FPT Play (vips-livecdn.fptplay.net) BẮT BUỘC có cái này.
        // ==============================================================
        var playUrl = realUrl + "|User-Agent=cvmedia/1.1.0|Referer=https://tinhlagi.pro/|Origin=https://tinhlagi.pro";

        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) mimeType = "application/dash+xml"; 
        if (realUrl.indexOf(".ts") > -1) mimeType = "video/mp2t"; 

        return JSON.stringify({
            "url": playUrl, // Gửi URL đã bọc Header cho Player
            "isEmbed": false, 
            "mimeType": mimeType,
            "headers": {
                // Thêm vào JSON phòng trường hợp trình phát hỗ trợ đọc từ headers
                "User-Agent": "cvmedia/1.1.0",
                "Referer": "https://tinhlagi.pro/",
                "Origin": "https://tinhlagi.pro"
            },
            "subtitles": []
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
