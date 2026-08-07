// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHẾ ĐỘ: IPTV (BẤM LÀ PHÁT) + LOGO VUÔNG + FIX HEADER CHUẨN IOS
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "10.0.0", // Hoàn thiện UI & Fix lỗi VTV trên iPhone
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "IPTV",         // Chế độ Tivi: Bấm vào kênh là MỞ TRÌNH PHÁT LUÔN
        "layoutType": "SQUARE", // Đổi giao diện thành Logo Kênh (Vuông nhỏ gọn)
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
    // Truyền slug (vtv, sctv...) vào URL để lọc kênh
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    // Với type="IPTV", 'id' chính là link .m3u8 ta lấy được ở Cấp 1.
    // Ép App nhảy xuống Cấp 3 (parseDetailResponse) để nạp Header chống chặn.
    return BASEURL + "?stream=" + encodeURIComponent(id);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: CẮT LINK TRỰC TIẾP TỪ THẺ <a> & HIỂN THỊ LOGO TRANG CHỦ ---
function parseListResponse(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("slug=") > -1) {
            slug = url.split("slug=")[1].toLowerCase().trim();
        }

        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Tìm đúng HTML của khối đài tương ứng
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

            if (isMatch) {
                targetHtml = block;
                break;
            }
        }

        var items = [];
        if (targetHtml) {
            // Chặt HTML theo từng thẻ chứa link kênh
            var channelParts = targetHtml.split('<a href="?url=');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                
                // Lấy URL m3u8 cực chuẩn trước dấu &name
                var urlMatch = cp.match(/^(.*?)(?:&amp;|&)name=/);
                if (!urlMatch) continue;
                
                // Lấy Tên Kênh
                var nameMatch = cp.match(/(?:&amp;|&)name=([^#"']+)/);
                
                // Lấy LOGO CỦA KÊNH
                var imgMatch = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                var streamLink = decodeURIComponent(urlMatch[1]);
                var channelName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ").trim() : "Kênh TV";
                var logo = imgMatch ? imgMatch[1] : "https://tinhlagi.pro/tinhlagi.ico";

                items.push({
                    id: streamLink,  // Nhét luồng m3u8 vào ID
                    title: channelName,
                    posterUrl: logo, // Logo hiển thị chuẩn vuông
                    backdropUrl: logo,
                    quality: "LIVE"
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

// --- HÀM 2: TRANG CHI TIẾT (BỎ QUA VÌ DÙNG CHẾ ĐỘ IPTV) ---
function parseMovieDetail(html, url) {
    // Bấm ở trang chủ là mở video luôn, không qua hàm này nữa
    return JSON.stringify({});
}

// --- HÀM 3: NẠP HEADER CHUẨN IOS ĐỂ VƯỢT TƯỜNG LỬA FPT (VTV) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = "";
        
        // Tháo link m3u8 từ URL truyền vào ở Cấp 2
        var match = apiUrl.match(/stream=([^&]+)/);
        if (match) {
            realUrl = decodeURIComponent(match[1]);
        } else {
            realUrl = apiUrl;
        }

        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) mimeType = "application/dash+xml"; 
        if (realUrl.indexOf(".ts") > -1) mimeType = "video/mp2t"; 

        // TRẢ CẤU HÌNH JSON CHUẨN: AVPlayer CỦA IPHONE ĐỌC HEADER TỪ ĐÂY
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
