// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// PHIÊN BẢN HOÀN CHỈNH: GIAO DIỆN GRID VUÔNG + NỐI HEADER TRỰC TIẾP VÀO URL VTV
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "12.0.0",
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

// --- HIỂN THỊ CÁC NHÓM KÊNH RA TRANG CHỦ ---
function getHomeSections() {
    return JSON.stringify([
        { "slug": "vtv", "title": "Danh Mục Kênh VTV", "type": "Grid", "path": "" },
        { "slug": "vtvcab", "title": "Danh Mục Kênh VTVcab", "type": "Grid", "path": "" },
        { "slug": "sctv", "title": "Danh Mục Kênh SCTV", "type": "Grid", "path": "" },
        { "slug": "htv", "title": "Danh Mục Kênh HTV", "type": "Grid", "path": "" },
        { "slug": "htvc", "title": "Danh Mục Kênh HTVC", "type": "Grid", "path": "" },
        { "slug": "diaphuong", "title": "Danh Mục Kênh Địa Phương", "type": "Grid", "path": "" },
        { "slug": "thietyeu", "title": "Danh Mục Kênh Thiết Yếu", "type": "Grid", "path": "" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Tất Cả", "slug": "truyen-hinh" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    return BASEURL;
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL; 
}

function getUrlDetail(slug) {
    return BASEURL;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
    }
};

function parseListResponse(html) {
    var groups = [
        { id: "VTV", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "VTVcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "SCTV", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "HTV", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "HTVC", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "Địa phương", name: "Kênh Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "Thiết yếu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
    ];

    var items = [];
    for (var i = 0; i < groups.length; i++) {
        items.push({
            id: groups[i].id, 
            title: groups[i].name,
            posterUrl: groups[i].img,
            backdropUrl: groups[i].img,
            quality: "HD",
            episode_current: "Live",
            lang: "Viet",
            year: 0
        });
    }

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1, totalItems: items.length, itemsPerPage: 10 }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// --- HÀM 2: LẤY DANH SÁCH KÊNH TỪ TỪNG NHÓM (FIX ẢNH LOGO) ---
function parseMovieDetail(html) {
    try {
        var requiredGroups = ["VTV", "VTVcab", "SCTV", "HTV", "HTVC", "Địa phương", "Thiết yếu"];
        var servers = [];

        var groupBlocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            
            var titleEnd = block.indexOf('</h2>');
            var rawTitle = block.substring(0, titleEnd);
            var groupName = PluginUtils.cleanText(rawTitle).split('(')[0].trim(); 
            
            var isRequired = false;
            for (var j = 0; j < requiredGroups.length; j++) {
                if (groupName.indexOf(requiredGroups[j]) !== -1) {
                    isRequired = true;
                    groupName = requiredGroups[j]; 
                    break;
                }
            }
            if (!isRequired) continue;

            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                var imgM = cp.match(/src=["']([^"']+)["']/i); // Lấy chính xác logo kênh từ thẻ img
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " "); 
                    var logoUrl = imgM ? imgM[1] : "https://tinhlagi.pro/tinhlagi.ico";
                    
                    // Đóng gói Link + Logo vào ID để hiển thị đúng ảnh nhỏ gọn, không bị lỗi khung xám
                    var packedData = streamLink + "|||" + logoUrl;

                    episodes.push({
                        id: packedData, 
                        name: channelName,
                        slug: "live-channel"
                    });
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: "Kênh " + groupName,
                    episodes: episodes
                });
            }
        }

        return JSON.stringify({
            id: "tivi_detail",
            title: "Tivi Trực Tuyến",
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: "Hệ thống Xem Tivi trực tuyến tốc độ cao.",
            servers: servers,
            quality: "LIVE",
            lang: "Viet",
            year: 0,
            rating: 0,
            category: "Truyền Hình",
            status: "Đang phát sóng"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// --- HÀM 3: NỐI HEADER TRỰC TIẾP VÀO URL ĐỂ MỞ KHÓA VTV (FPT PLAY) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = apiUrl;
        var logo = "https://tinhlagi.pro/tinhlagi.ico";

        // Tách lấy link m3u8 và logo đã đóng gói
        if (apiUrl && apiUrl.indexOf("|||") > -1) {
            var parts = apiUrl.split("|||");
            realUrl = parts[0];
            logo = parts[1];
        }

        // BÍ QUYẾT SỐNG CÒN: Nối User-Agent thẳng vào đuôi URL để ExoPlayer/AVPlayer bắt buộc phải nhận diện
        var finalPlayUrl = realUrl + "|User-Agent=cvmedia/1.1.0|Referer=https://tinhlagi.pro/|Origin=https://tinhlagi.pro";

        var mimeType = "application/x-mpegURL";
        if (realUrl.indexOf('.mpd') > -1) {
            mimeType = "application/dash+xml";
        }

        return JSON.stringify({
            "url": finalPlayUrl,
            "isEmbed": false, 
            "mimeType": mimeType,
            "posterUrl": logo, // Hiển thị chuẩn logo kênh tại trình phát
            "headers": {
                "User-Agent": "cvmedia/1.1.0",
                "Referer": "https://tinhlagi.pro/",
                "Origin": "https://tinhlagi.pro"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": apiUrl, "isEmbed": false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
