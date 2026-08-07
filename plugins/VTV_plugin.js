// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: FOLDER TRANG CHỦ -> LỌC KÊNH -> BẮT LINK BẰNG REGEX (NORMAL WAY)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.4", // Đã fix Bắt link trực tiếp từ window.tiviPlayUrl
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc là MOVIE để chia Folder
        "layoutType": "VERTICAL",
        "playerType": "auto" 
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'truyen-hinh', title: 'Danh Mục Kênh Truyền Hình', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất Cả', slug: 'truyen-hinh' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    return "https://tinhlagi.pro/tivi";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi"; 
}

function getUrlDetail(slug) {
    // 1. Nếu App yêu cầu link để xem phim (slug là URL của kênh)
    if (slug.indexOf("http") === 0) return slug;

    // 2. Nếu App yêu cầu mở Folder (slug là vtv, htv...) -> Mở trang chủ để lọc
    return "https://tinhlagi.pro/tivi|data:slug=" + slug;
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

// --- HÀM 1: TẠO 7 FOLDER GỌN GÀNG TRÊN TRANG CHỦ ---
function parseListResponse(html) {
    var groups = [
        { id: "vtv", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "vtvcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "sctv", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "htv", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "htvc", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "địa phương", name: "Kênh Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "thiết yếu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
    ];

    var items = [];
    for (var i = 0; i < groups.length; i++) {
        items.push({
            id: groups[i].id, // Truyền ID này vào getUrlDetail
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

// --- HÀM 2: LỌC KÊNH CHÍNH XÁC VÀ TẠO URL TRANG PHÁT ---
function parseMovieDetail(html, apiUrl) {
    try {
        var slug = "";
        if (apiUrl && apiUrl.indexOf("data:slug=") > -1) {
            slug = apiUrl.split("data:slug=")[1].toLowerCase().trim();
        }

        var servers = [];
        var groupBlocks = html.split('<h2 class="group-title">');
        var displayTitle = "Kênh TV";
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var rawTitle = block.substring(0, titleEnd);
            var groupName = PluginUtils.cleanText(rawTitle).split('(')[0].trim().toLowerCase(); 
            
            // LỌC CHÍNH XÁC FOLDER
            var isMatch = false;
            if (slug === 'vtv' && groupName === 'vtv') { isMatch = true; displayTitle = "VTV"; }
            else if (slug === 'vtvcab' && groupName === 'vtvcab') { isMatch = true; displayTitle = "VTVcab"; }
            else if (slug === 'sctv' && groupName === 'sctv') { isMatch = true; displayTitle = "SCTV"; }
            else if (slug === 'htv' && groupName === 'htv') { isMatch = true; displayTitle = "HTV"; }
            else if (slug === 'htvc' && groupName === 'htvc') { isMatch = true; displayTitle = "HTVC"; }
            else if (slug === 'địa phương' && groupName === 'địa phương') { isMatch = true; displayTitle = "Địa Phương"; }
            else if (slug === 'thiết yếu' && groupName.indexOf('thiết yếu') > -1) { isMatch = true; displayTitle = "Thiết Yếu"; }

            if (!isMatch) continue;

            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var hrefM = cp.match(/href=["'](\?url=[^"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (hrefM && nameM) {
                    // ID CỦA TẬP CHÍNH LÀ ĐƯỜNG LINK TRANG PHÁT VIDEO MÀ BẠN VỪA GỬI (Ví dụ trang VTV3)
                    var playerPageUrl = "https://tinhlagi.pro/tivi" + hrefM[1]; 
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").trim(); 
                    
                    episodes.push({
                        id: playerPageUrl, 
                        name: channelName,
                        slug: "live-channel-" + k
                    });
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: "Danh sách kênh",
                    episodes: episodes
                });
            }
            break; 
        }

        // Lấy ảnh bìa theo đài
        var groupImages = {
            "vtv": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png",
            "vtvcab": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png",
            "sctv": "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png",
            "htv": "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png",
            "htvc": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png",
            "diaphuong": "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png",
            "thietyeu": "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg"
        };
        var poster = groupImages[slug] || "https://tinhlagi.pro/tinhlagi.ico";

        return JSON.stringify({
            id: apiUrl,
            title: "Kênh " + displayTitle,
            posterUrl: poster,
            backdropUrl: poster,
            description: "Đang hiển thị các kênh thuộc nhóm " + displayTitle + ".",
            servers: servers,
            quality: "LIVE",
            lang: "Viet",
            year: 2026,
            rating: 10,
            category: "Truyền Hình",
            status: "Đang phát sóng"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

// --- HÀM 3: BẮT LINK CHUẨN TỪ HTML (KHÔNG CẦN WEBVIEW) ---
function parseDetailResponse(html, apiUrl) {
    try {
        var finalUrl = "";
        
        // 1. Tuyệt chiêu: Tóm gọn trực tiếp biến window.tiviPlayUrl từ mã HTML của trang phát
        var playUrlMatch = html.match(/window\.tiviPlayUrl\s*=\s*["']([^"']+)["']/);
        if (playUrlMatch && playUrlMatch[1]) {
            // Xóa bỏ các ký tự gạch chéo ngược \/ bị mã hóa
            finalUrl = playUrlMatch[1].replace(/\\\//g, '/'); 
        } else {
            // Dự phòng: Lấy link từ URL nếu web đổi cấu trúc
            var urlParamMatch = apiUrl.match(/\?url=([^&]+)/);
            if (urlParamMatch) {
                finalUrl = decodeURIComponent(urlParamMatch[1]);
            }
        }

        // 2. Bắt User-Agent nếu trang web yêu cầu
        var headers = {
            "Referer": "https://tinhlagi.pro/",
            "Origin": "https://tinhlagi.pro"
        };
        var uaMatch = html.match(/window\.tiviUA\s*=\s*["']([^"']+)["']/);
        if (uaMatch && uaMatch[1]) {
            headers["User-Agent"] = uaMatch[1].replace(/\\\//g, '/');
        }

        var mimeType = "application/x-mpegURL";
        if (finalUrl.indexOf(".mpd") > -1) {
            mimeType = "application/dash+xml";
        }

        return JSON.stringify({
            "url": finalUrl,
            "isEmbed": false, // Trả ngay về Native Player, CỰC KỲ NHANH VÀ MƯỢT
            "mimeType": mimeType,
            "headers": headers,
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
