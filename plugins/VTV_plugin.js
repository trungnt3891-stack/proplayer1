// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/tivi";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.2", // Khôi phục 100% logic phát video của code cũ
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc là MOVIE theo đúng logic cũ
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
    return BASEURL;
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL;
}

function getUrlDetail(slug) {
    // GIỮ NGUYÊN LOGIC CŨ CỦA BẠN: Luôn tải trang chủ để quét toàn bộ 7 Server
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

// --- HÀM 1: TẠO 7 FOLDER GIAO DIỆN TRÊN TRANG CHỦ ---
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

// --- HÀM 2: MOI LINK VÀ CHIA CÁC KÊNH VÀO TỪNG SERVER ---
function parseMovieDetail(html) {
    try {
        var requiredGroups = ["VTV", "VTVcab", "SCTV", "HTV", "HTVC", "Địa phương", "Thiết yếu"];
        var servers = [];

        // Cắt theo từng nhóm <h2 class="group-title">
        var groupBlocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            
            // Tìm tên nhóm
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var rawTitle = block.substring(0, titleEnd);
            var groupName = PluginUtils.cleanText(rawTitle).split('(')[0].trim(); 
            
            // Lọc: Chỉ lấy những nhóm nằm trong danh sách yêu cầu
            var isRequired = false;
            for (var j = 0; j < requiredGroups.length; j++) {
                if (groupName.toLowerCase().indexOf(requiredGroups[j].toLowerCase()) !== -1) {
                    isRequired = true;
                    groupName = requiredGroups[j]; // Chuẩn hóa lại tên hiển thị (Ví dụ: "Địa phương")
                    break;
                }
            }
            if (!isRequired) continue;

            // Moi danh sách kênh trong nhóm
            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                // Bóc link URL và Tên Kênh từ mã HTML
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); // Giải mã link từ web
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " "); 
                    
                    episodes.push({
                        id: streamLink, // Nhét thẳng link m3u8 vào ID như code cũ của bạn
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
            description: "Hệ thống Xem Tivi trực tuyến tốc độ cao. Hãy chọn danh mục đài (Server) và nhấn vào kênh muốn xem.",
            servers: servers,
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

// --- HÀM 3: XỬ LÝ LINK STREAM ---
function parseDetailResponse(html) {
    // TRẢ VỀ RỖNG THEO ĐÚNG CƠ CHẾ AUTO-FALLBACK CỦA CODE GỐC CỦA BẠN!
    // App sẽ tự thấy rỗng và lôi cái ID (là link m3u8) ra phát trực tiếp.
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// CÁC HÀM BẮT BUỘC
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
