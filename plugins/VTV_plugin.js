// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHẾ ĐỘ: IPTV (BẤM LÀ PHÁT) + LƯỚT NGANG + FIX VTV (FPT PLAY)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "7.0.0", // Chế độ IPTV đích thực + Hiện Logo Kênh chuẩn
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "IPTV", // Kích hoạt chế độ Live TV: Bấm là phát luôn!
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
    // Truyền slug (vtv, sctv...) vào URL để lọc kênh
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    // Ở chế độ IPTV, biến 'id' chính là đường link luồng .m3u8 ta lấy được ở Cấp 1.
    // TUYỆT CHIÊU: Gắn nó vào URL ảo để ép Vax App nhảy xuống hàm parseDetailResponse nạp Header
    return BASEURL + "?stream=" + encodeURIComponent(id);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LỌC HTML -> LẤY LINK & LOGO CHÍNH XÁC -> HIỆN LÊN TRANG CHỦ ---
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
            // Chặt HTML theo từng thẻ <a class="channel-card">
            var channelParts = targetHtml.split('<a href="?url=');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                
                // Lấy URL m3u8 cực chuẩn trước dấu &name
                var urlMatch = cp.match(/(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;
                
                // Lấy Tên Kênh
                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                
                // Lấy LOGO CỦA KÊNH
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                var streamLink = decodeURIComponent(urlMatch[1]);
                var channelName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ").trim() : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                items.push({
                    id: streamLink, // Đưa thẳng link luồng phát vào ID để phục vụ chế độ IPTV
                    title: channelName,
                    posterUrl: logo, // Logo hiển thị trực quan
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

// --- HÀM 2: TRANG CHI TIẾT (VÔ HIỆU HÓA TRONG CHẾ ĐỘ IPTV) ---
function parseMovieDetail(html, url) {
    // Vì dùng type="IPTV", app sẽ KHÔNG BAO GIỜ gọi hàm này (Bấm là phát luôn)
    return JSON.stringify({});
}

// --- HÀM 3: NẠP HEADER VÀ GIAO LINK CHO PLAYER CHẠY (FIX VTV) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = "";
        
        // Tháo link m3u8 từ URL ảo truyền vào ở getUrlDetail
        var match = apiUrl.match(/stream=([^&]+)/);
        if (match) {
            realUrl = decodeURIComponent(match[1]);
        } else {
            realUrl = apiUrl;
        }

        // Khai báo chuẩn định dạng HLS/DASH để Native Player nhận diện cực nhanh
        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) mimeType = "application/dash+xml"; 
        if (realUrl.indexOf(".ts") > -1) mimeType = "video/mp2t"; 

        // TRẢ CẤU HÌNH JSON: CÓ ĐỦ HEADER NÀY THÌ VTV1, VTV2 MỚI KHÔNG BỊ CHẶN
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
