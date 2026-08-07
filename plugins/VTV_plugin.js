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
        "version": "1.0.1", // Cập nhật ép Header User-Agent
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

function getFilterConfig() { return "{}"; }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    // Gọi thẳng vào trang /tivi và mang theo cờ phân loại (slug) để Parse biết đường lọc
    return BASEURL + "/tivi|data:slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return ""; }

// BƯỚC QUAN TRỌNG: TRẢ VỀ JSON CẤU HÌNH PLAYER TRỰC TIẾP
function getUrlDetail(id) {
    var url = id; 
    
    // Nhận diện kiểu luồng phát (M3U8 hay MPD) để báo cho Trình Phát
    var mimeType = "application/x-mpegURL"; // Mặc định HLS
    if (url.indexOf('.mpd') > -1) {
        mimeType = "application/dash+xml"; // Chuẩn DASH
    }

    // Trả về JSON để ép App nhận cấu hình Header mà không cần tải HTML trung gian
    return JSON.stringify({
        "url": url,
        "isEmbed": false, // Kích hoạt ExoPlayer Native
        "mimeType": mimeType,
        "headers": {
            // Giả mạo User-Agent giống hệt trên Web để vượt tường FPT / MyTV
            "User-Agent": "cvmedia/1.1.0", 
            "Referer": "https://tinhlagi.pro/",
            "Origin": "https://tinhlagi.pro"
        },
        "subtitles": []
    });
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
        
        // Trích xuất cờ đánh dấu slug từ apiUrl (Ví dụ: "vtv", "vtvcab")
        if (apiUrl && apiUrl.indexOf("data:slug=") > -1) {
            slug = apiUrl.split("data:slug=")[1].toLowerCase().trim();
        }

        // Cắt HTML thành các khối dựa trên thẻ <h2 class="group-title">
        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Duyệt qua các khối để tìm đúng nhóm kênh (VTV, SCTV, HTV...)
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/);
            if (!titleMatch) continue;

            var title = titleMatch[1].toLowerCase().trim();
            var isMatch = false;

            // Xử lý logic lọc chuẩn xác tên nhóm trong thẻ <h2>
            if (slug === 'vtv' && title.indexOf('vtv (') > -1) isMatch = true;
            else if (slug === 'vtvcab' && title.indexOf('vtvcab') > -1) isMatch = true;
            else if (slug === 'sctv' && title.indexOf('sctv') > -1) isMatch = true;
            else if (slug === 'htv' && title.indexOf('htv (') > -1) isMatch = true;
            else if (slug === 'htvc' && title.indexOf('htvc') > -1) isMatch = true;
            else if (slug === 'diaphuong' && title.indexOf('địa phương') > -1) isMatch = true;
            else if (slug === 'thietyeu' && title.indexOf('thiết yếu') > -1) isMatch = true;

            if (isMatch) {
                targetHtml = block;
                break; // Tìm thấy nhóm tương ứng thì dừng lại
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
                var name = itemMatch[3].trim().replace(/\+/g, " ");

                items.push({
                    "id": streamUrl, // Nhét thẳng link luồng phát vào ID
                    "title": name,
                    "posterUrl": logo,
                    "backdropUrl": logo,
                    "quality": "LIVE"
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
    return "{}"; 
}

function parseDetailResponse(html, apiUrl) {
    // Hàm này không còn hoạt động vì getUrlDetail đã xử lý trả về JSON thẳng cho Player
    return JSON.stringify({});
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
