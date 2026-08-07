// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: FOLDER TRANG CHỦ -> LỌC KÊNH -> GÁN THẲNG LINK M3U8 (SIÊU TỐC)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "3.0.0", // Tối giản tuyệt đối, tốc độ bàn thờ
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" 
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'truyen-hinh', title: 'Danh Mục Đài Truyền Hình', type: 'Grid', path: '' }
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
    return BASEURL;
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL; 
}

function getUrlDetail(slug) {
    // Nếu App yêu cầu mở Folder (slug là vtv, htv...) -> Mở trang chủ để lọc kênh
    return BASEURL + "|data:slug=" + slug;
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
        { id: "địa phương", name: "Đài Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "thiết yếu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
    ];

    var items = [];
    for (var i = 0; i < groups.length; i++) {
        items.push({
            id: groups[i].id, // Gửi id này vào getUrlDetail
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

// --- HÀM 2: LỌC KÊNH CHÍNH XÁC VÀ BÓC THẲNG LINK M3U8 ---
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
                // LẤY TRỰC TIẾP LINK TỪ TRANG CHỦ THEO CÁCH CỦA BẠN
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); // XẢ MÃ RA LINK GỐC M3U8
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").trim(); 
                    
                    episodes.push({
                        id: streamLink, // NHÉT THẲNG M3U8 VÀO ID CỦA TẬP
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

        var groupImages = {
            "vtv": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png",
            "vtvcab": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png",
            "sctv": "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png",
            "htv": "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png",
            "htvc": "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png",
            "địa phương": "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png",
            "thiết yếu": "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg"
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

// --- HÀM 3: AUTO FALLBACK SIÊU TỐC ---
function parseDetailResponse(html) {
    // Để trống theo đúng cơ chế của code cũ.
    // App sẽ lấy trực tiếp link m3u8 từ id ở bước 2 để phát.
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
