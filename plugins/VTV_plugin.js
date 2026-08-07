// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: KÊNH LƯỚT NGANG TRÊN TRANG CHỦ -> BẮT LINK SIÊU TỐC
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "4.0.0", // Layout Lướt ngang (Horizontal) + Fast Stream
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

// --- TẠO GIAO DIỆN CÁC DÒNG KÊNH LƯỚT NGANG TRÊN TRANG CHỦ ---
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
    // Truyền slug (vtv, sctv...) vào URL để hàm parseListResponse biết đường cắt đúng HTML
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    // Vì ta đã gói toàn bộ dữ liệu (Link + Tên + Ảnh) vào tham số ID ở bước dưới
    // Ở đây chỉ cần trả thẳng ID đó về để parseMovieDetail sử dụng
    return id;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LỌC HTML VÀ ĐƯA CÁC KÊNH VÀO TỪNG DÒNG (FOLDER) ---
function parseListResponse(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("slug=") > -1) {
            slug = url.split("slug=")[1].toLowerCase().trim();
        }

        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Tìm đúng khối HTML của Đài truyền hình đó
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/);
            if (!titleMatch) continue;

            var groupName = titleMatch[1].toLowerCase().trim();
            var isMatch = false;

            // Xử lý điều kiện bắt đúng tên khối
            if (slug === 'vtv' && groupName.indexOf('vtv (') > -1) isMatch = true;
            else if (slug === 'vtvcab' && groupName.indexOf('vtvcab') > -1) isMatch = true;
            else if (slug === 'sctv' && groupName.indexOf('sctv') > -1) isMatch = true;
            else if (slug === 'htv' && groupName.indexOf('htv (') > -1) isMatch = true;
            else if (slug === 'htvc' && groupName.indexOf('htvc') > -1) isMatch = true;
            else if (slug === 'diaphuong' && groupName.indexOf('địa phương') > -1) isMatch = true;
            else if (slug === 'thietyeu' && groupName.indexOf('thiết yếu') > -1) isMatch = true;

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
                var imgM = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    // Bỏ đi thẻ rác #player-area để lấy tên kênh sạch
                    var rawName = nameM[1].split('#')[0];
                    var channelName = decodeURIComponent(rawName).replace(/\+/g, " ").trim(); 
                    var logo = imgM ? imgM[1] : "https://tinhlagi.pro/tinhlagi.ico";
                    
                    // TUYỆT CHIÊU: Gói toàn bộ dữ liệu thành 1 chuỗi nhét vào ID
                    var combinedId = streamLink + "|||" + channelName + "|||" + logo;
                    
                    items.push({
                        id: combinedId, 
                        title: channelName,
                        posterUrl: logo,
                        backdropUrl: logo,
                        quality: "HD",
                        episode_current: "Live"
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

// --- HÀM 2: TRANG CHI TIẾT CỦA KÊNH ĐÓ ---
function parseMovieDetail(html, url) {
    try {
        // url ở đây chính là cái combinedId (chuỗi gói gọn) mà ta đã nhét ở parseListResponse
        var parts = url.split("|||");
        var streamLink = parts[0];
        var channelName = parts[1] || "Kênh TV";
        var logo = parts[2] || "https://tinhlagi.pro/tinhlagi.ico";

        return JSON.stringify({
            id: url,
            title: channelName,
            posterUrl: logo,
            backdropUrl: logo,
            description: "Đang phát trực tiếp " + channelName + " tốc độ cao.",
            servers: [{
                name: "Tivi Trực Tuyến",
                episodes: [{
                    // GÁN THẲNG M3U8 VÀO ID CỦA TẬP THEO ĐÚNG CÁCH CỦA BẠN
                    id: streamLink, 
                    name: "Phát Ngay",
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

// --- HÀM 3: XỬ LÝ PHÁT LINK (AUTO FALLBACK SIÊU TỐC) ---
function parseDetailResponse(html) {
    // Trả về rỗng. Trình phát Vax App sẽ tự dùng cái streamLink (m3u8) truyền ở bước trên để phát ngay lập tức.
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
