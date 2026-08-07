// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: FOLDER TRANG CHỦ + VƯỢT TƯỜNG LỬA FPT BẰNG HEADER
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "5.1.0", // Fix lỗi cào trượt Link và Ảnh bìa
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
    return BASEURL + "?slug=" + slug;
}

function getUrlSearch(keyword, filtersJson) { return BASEURL; }

function getUrlDetail(id) {
    return id;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: LỌC HTML VÀ ĐƯA KÊNH VÀO TỪNG DÒNG (FOLDER) ---
function parseListResponse(html, url) {
    try {
        var slug = "";
        if (url && url.indexOf("slug=") > -1) {
            slug = url.split("slug=")[1].toLowerCase().trim();
        }

        var blocks = html.split('<h2 class="group-title">');
        var targetHtml = "";

        // Tìm đúng khối HTML của nhóm đài
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
            // FIX: Dùng Regex thần thánh tóm trọn gói (Link + Tên + Ảnh bìa) an toàn 100%
            var itemRegex = /href=["']\?url=([^&"']+)&name=([^#"']+)[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi;
            var match;
            
            while ((match = itemRegex.exec(targetHtml)) !== null) {
                var streamLink = decodeURIComponent(match[1]); // Giải mã link mp4/m3u8
                var channelName = decodeURIComponent(match[2]).replace(/\+/g, " ").trim(); // Lấy tên kênh
                var logo = match[3]; // Lấy link ảnh
                
                // Gói toàn bộ dữ liệu (Link + Tên + Ảnh) vào 1 chuỗi làm ID
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

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 1 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

// --- HÀM 2: TRANG CHI TIẾT TỪNG KÊNH ---
function parseMovieDetail(html, url) {
    try {
        var parts = url.split("|||");
        var streamLink = parts[0];
        var channelName = parts[1] || "Kênh TV";
        var logo = parts[2] || "https://tinhlagi.pro/tinhlagi.ico";

        // BÍ QUYẾT: Gắn thêm chữ |||cvmedia vào link để ngăn App phát luồng trần.
        // Ép App phải nhảy xuống hàm Cấp 3 để nạp User-Agent!
        var magicEpisodeId = streamLink + "|||cvmedia";

        return JSON.stringify({
            id: url,
            title: channelName,
            posterUrl: logo,
            backdropUrl: logo,
            description: "Đang phát trực tiếp kênh " + channelName + " tốc độ cao. Dữ liệu cung cấp bởi Tinhlagi.pro.",
            servers: [{
                name: "Tivi Trực Tuyến",
                episodes: [{
                    id: magicEpisodeId, 
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

// --- HÀM 3: NẠP HEADER & PHÁT VIDEO (VƯỢT TƯỜNG LỬA FPT/VTV) ---
function parseDetailResponse(html, apiUrl) {
    try {
        // apiUrl ở đây là cái magicEpisodeId ta tạo ở trên
        var realUrl = apiUrl.split("|||")[0];
        
        var mimeType = "application/x-mpegURL"; 
        if (realUrl.indexOf(".mpd") > -1) {
            mimeType = "application/dash+xml"; 
        }

        // Trả về JSON cấu hình Player siêu tốc (0% Webview)
        return JSON.stringify({
            "url": realUrl,
            "isEmbed": false, 
            "mimeType": mimeType,
            "headers": {
                // ĐÂY LÀ CHÌA KHÓA MỞ KHÓA KÊNH VTV1, VTV2 CỦA FPT PLAY!
                "User-Agent": "cvmedia/1.1.0",
                "Referer": "https://tinhlagi.pro/"
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
