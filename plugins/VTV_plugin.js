// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// TỐI ƯU: GIAO DIỆN LƯỚT NGANG + BẮC LINK TRỰC TIẾP TỪ THẺ A
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "6.0.0", // Hoàn thiện UI Lướt ngang và Link M3U8 tĩnh
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
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
    // Gọi Cấp 1
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    // TUYỆT CHIÊU: Gắn dấu # để Vax App không tưởng nhầm là link lạ rồi báo lỗi Fetch
    return BASEURL + "#data=" + encodeURIComponent(id);
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
                
                // CÁCH CỦA BẠN: Lấy URL trước dấu &name=
                var urlMatch = cp.match(/(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;
                
                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                var streamLinkEncoded = urlMatch[1];
                var channelNameEncoded = nameMatch ? nameMatch[1] : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                var streamLink = decodeURIComponent(streamLinkEncoded);
                var channelName = decodeURIComponent(channelNameEncoded).replace(/\+/g, " ").trim();

                // Gói gọn data lại để bắn sang Cấp 2
                var combinedId = streamLink + "|||" + channelName + "|||" + logo;
                
                items.push({
                    id: combinedId, 
                    title: channelName,
                    posterUrl: logo,
                    backdropUrl: logo,
                    quality: "LIVE",
                    episode_current: "Live HD"
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

// --- HÀM 2: TRANG GIAO ĐIỂM (BẤM LÀ PHÁT) ---
function parseMovieDetail(html, url) {
    try {
        // Tháo gói data được ngụy trang đằng sau chữ #data=
        var dataEncoded = url.split('#data=')[1];
        var data = decodeURIComponent(dataEncoded);
        var parts = data.split("|||");
        
        var streamLink = parts[0];
        var channelName = parts[1] || "Kênh TV";
        var logo = parts[2] || "https://tinhlagi.pro/tinhlagi.ico";

        return JSON.stringify({
            id: url,
            title: channelName,
            posterUrl: logo,
            backdropUrl: logo,
            description: "Đang phát trực tiếp kênh " + channelName + " tốc độ cao. Dữ liệu cung cấp bởi Tinhlagi.pro.",
            servers: [{
                name: "Nguồn Phát",
                episodes: [{
                    id: streamLink, // Đẩy luồng .m3u8 thật sự xuống Cấp 3
                    name: "Xem Kênh",
                    slug: "live"
                }]
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

// --- HÀM 3: NẠP HEADER & PHÁT VIDEO CHỐNG CHẶN FPT ---
function parseDetailResponse(html, apiUrl) {
    try {
        var mimeType = "application/x-mpegURL"; 
        if (apiUrl.indexOf(".mpd") > -1) {
            mimeType = "application/dash+xml"; 
        }
        if (apiUrl.indexOf(".ts") > -1 || apiUrl.indexOf("extension=ts") > -1) {
            mimeType = "video/mp2t"; 
        }

        // BUỘC PHẢI DÙNG CÁCH NÀY ĐỂ KÊNH VTV KHÔNG BỊ LỖI MÀN HÌNH ĐEN
        return JSON.stringify({
            "url": apiUrl,
            "isEmbed": false, 
            "mimeType": mimeType,
            "headers": {
                // Header giả mạo Player Website, thiếu nó VTV1,2,3 sẽ bị lỗi ngắt kết nối
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
