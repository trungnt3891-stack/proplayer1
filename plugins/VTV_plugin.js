// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// FIX: CHỐNG BYPASS HEADER FPT + GIAO DIỆN LOGO VUÔNG CHUẨN IPTV
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "8.0.0", // Fix VTV triệt để & Layout Logo
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "IPTV", // Chế độ bấm là phát
        "layoutType": "SQUARE", // TUYỆT CHIÊU: Hiện Logo vuông vắn, không bị kéo giãn thành hình phim
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
    // Truyền ID đã ngụy trang vào URL để Cấp 3 hứng lấy
    return BASEURL + "?play=" + encodeURIComponent(id);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LỌC HTML -> CẮT LINK TRONG THẺ <a> -> XUẤT RA DÒNG KÊNH ---
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
                
                var urlMatch = cp.match(/(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;
                
                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                var streamLinkEncoded = urlMatch[1];
                var channelNameEncoded = nameMatch ? nameMatch[1] : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                var streamLink = decodeURIComponent(streamLinkEncoded);
                var channelName = decodeURIComponent(channelNameEncoded).replace(/\+/g, " ").trim();

                // NGỤY TRANG ID: Thêm chữ 'tivi|' để App không bypass hàm parseDetailResponse
                var safeId = "tivi|" + streamLink;
                
                items.push({
                    id: safeId, 
                    title: channelName,
                    posterUrl: logo,
                    backdropUrl: logo,
                    quality: "LIVE",
                    episode_current: "HD"
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

// --- HÀM 2: TRANG CHI TIẾT (BỎ QUA DO ĐÃ DÙNG IPTV) ---
function parseMovieDetail(html, url) {
    return JSON.stringify({});
}

// --- HÀM 3: NẠP HEADER VÀ GIAO LINK CHO PLAYER CHẠY (FIX DỨT ĐIỂM FPT) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = "";
        
        // Tháo lớp ngụy trang 'tivi|' để lấy lại link m3u8 gốc
        var encodedId = apiUrl.split("?play=")[1];
        if (encodedId) {
            var decodedId = decodeURIComponent(encodedId);
            realUrl = decodedId.split("|")[1]; // Lấy phần link thực tế
        }

        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) {
            mimeType = "application/dash+xml"; 
        } else if (realUrl.indexOf(".ts") > -1) {
            mimeType = "video/mp2t"; 
        }

        // Ép Header cvmedia/1.1.0 vào Player. Chìa khóa vàng cho VTV1->VTV10!
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
        return JSON.stringify({});
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
