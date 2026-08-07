// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHUYÊN GIA TỐI ƯU: ĐỊNH DẠNG IPTV - XEM NGAY KHÔNG QUA TRANG CHI TIẾT
// =============================================================================

var BASEURL = "https://tinhlagi.pro";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_iptv",
        "name": "Tivi Trực Tuyến",
        "description": "Tổng hợp các kênh VTV, VTVcab, SCTV, HTV, Địa Phương tốc độ cao.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "IPTV", // Kích hoạt chế độ Live TV (Bấm là phát)
        "layoutType": "VERTICAL",
        "playerType": "exoplayer"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[Tivi_TinhLaGi] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[Tivi_TinhLaGi] " + msg);
    }
}

// Cấu hình các thư mục đúng theo yêu cầu (Chỉ giữ các đài truyền hình VN)
function getHomeSections() {
    return JSON.stringify([
        { "slug": "vtv", "title": "VTV", "type": "Grid" },
        { "slug": "vtvcab", "title": "VTVcab", "type": "Grid" },
        { "slug": "sctv", "title": "SCTV", "type": "Grid" },
        { "slug": "htv", "title": "HTV", "type": "Grid" },
        { "slug": "htvc", "title": "HTVC", "type": "Grid" },
        { "slug": "diaphuong", "title": "Địa Phương", "type": "Grid" },
        { "slug": "thietyeu", "title": "Thiết Yếu", "type": "Grid" }
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

function getFilterConfig() {
    return "{}";
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    // Gọi thẳng vào trang /tivi và mang theo cờ phân loại (slug) để Parse biết đường lọc
    return BASEURL + "/tivi|data:slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    // Thường IPTV/Tivi ít dùng chức năng Search, trả về rỗng để bỏ qua
    return ""; 
}

function getUrlDetail(id) {
    // Với chế độ IPTV, "id" chính là link m3u8/mpd đã bóc được ở parseListResponse
    return id; 
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// BƯỚC 1: LỌC HTML VÀ BÓC TÁCH LINK THEO CHUYÊN MỤC
function parseListResponse(html, apiUrl) {
    try {
        var items = [];
        var slug = "vtv"; // Mặc định
        
        // Trích xuất cờ đánh dấu slug từ apiUrl
        if (apiUrl && apiUrl.indexOf("data:slug=") > -1) {
            slug = apiUrl.split("data:slug=")[1];
        }

        // Cắt HTML thành các khối dựa trên thẻ <h2 class="group-title">
        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Duyệt qua các khối để tìm đúng nhóm kênh (VTV, SCTV, HTV...)
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/);
            if (!titleMatch) continue;

            var title = titleMatch[1].toLowerCase();
            var isMatch = false;

            // Kiểm tra khớp từ khóa nhóm
            if (slug === 'vtv' && title.indexOf('vtv (') > -1) isMatch = true;
            else if (slug === 'vtvcab' && title.indexOf('vtvcab') > -1) isMatch = true;
            else if (slug === 'sctv' && title.indexOf('sctv') > -1) isMatch = true;
            else if (slug === 'htv' && title.indexOf('htv (') > -1) isMatch = true;
            else if (slug === 'htvc' && title.indexOf('htvc') > -1) isMatch = true;
            else if (slug === 'diaphuong' && title.indexOf('địa phương') > -1) isMatch = true;
            else if (slug === 'thietyeu' && title.indexOf('thiết yếu') > -1) isMatch = true;

            if (isMatch) {
                targetHtml = block;
                break; // Tìm thấy thì thoát vòng lặp
            }
        }

        // Nếu tìm được đoạn HTML của chuyên mục, tiến hành bóc tách các kênh
        if (targetHtml) {
            // Regex lấy trực tiếp link đã mã hóa, logo và tên kênh
            var itemRegex = /<a[^>]*href=["']\?url=([^&"']+)[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][\s\S]*?<div[^>]*class=["']channel-name["'][^>]*>([^<]+)<\/div>/gi;
            var itemMatch;
            
            while ((itemMatch = itemRegex.exec(targetHtml)) !== null) {
                // Giải mã URL từ định dạng an toàn (https%3A%2F%2F...) về bình thường
                var streamUrl = decodeURIComponent(itemMatch[1]); 
                var logo = itemMatch[2];
                var name = itemMatch[3].trim();

                items.push({
                    "id": streamUrl, // Nhét thẳng link luồng phát vào ID
                    "title": name,
                    "posterUrl": logo,
                    "backdropUrl": logo,
                    "quality": "HD"
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    } catch (e) {
        log(e.message);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) { 
    return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } }); 
}

function parseMovieDetail(html, url) { 
    // IPTV không dùng trang Chi Tiết
    return "{}"; 
}

// BƯỚC 2: TIẾP NHẬN LINK TỪ BƯỚC 1 VÀ RA LỆNH CHO EXOPLAYER PHÁT
function parseDetailResponse(html, apiUrl) {
    try {
        // App sẽ truyền ID (chính là luồng m3u8/mpd) vào apiUrl
        var url = apiUrl.split("|")[0]; 
        
        // Nhận diện kiểu luồng phát (M3U8 hay MPD) để báo cho Trình Phát
        var mimeType = "application/x-mpegURL"; // Mặc định HLS
        if (url.indexOf('.mpd') > -1) {
            mimeType = "application/dash+xml"; // Chuẩn DASH
        }

        return JSON.stringify({
            "url": url,
            "isEmbed": false, // Kích hoạt ExoPlayer Native
            "mimeType": mimeType,
            "headers": {
                // Giả mạo User-Agent giống hệt trên Web để vượt tường
                "User-Agent": "cvmedia/1.1.0", 
                "Referer": "https://tinhlagi.pro/"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
