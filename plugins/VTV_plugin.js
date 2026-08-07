// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.0",
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc là MOVIE để chia Folder và Kênh
        "layoutType": "VERTICAL",
        "playerType": "auto" // Giữ nguyên Auto để bắt link m3u8 siêu tốc
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
    // Truyền slug của Folder (vtv, sctv...) vào URL để trang chi tiết biết đường lọc
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

// --- HÀM 2: LỌC CHÍNH XÁC KÊNH CỦA FOLDER ĐÓ MÀ KHÔNG BỊ GỘP LỘN XỘN ---
function parseMovieDetail(html, apiUrl) {
    try {
        // Lấy thông tin Folder mà người dùng vừa click (Ví dụ: "vtv")
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
            
            // LỌC CHÍNH XÁC: Chỉ lấy đúng block chứa các đài thuộc về Folder đang chọn
            var isMatch = false;
            if (slug === 'vtv' && groupName === 'vtv') { isMatch = true; displayTitle = "VTV"; }
            else if (slug === 'vtvcab' && groupName === 'vtvcab') { isMatch = true; displayTitle = "VTVcab"; }
            else if (slug === 'sctv' && groupName === 'sctv') { isMatch = true; displayTitle = "SCTV"; }
            else if (slug === 'htv' && groupName === 'htv') { isMatch = true; displayTitle = "HTV"; }
            else if (slug === 'htvc' && groupName === 'htvc') { isMatch = true; displayTitle = "HTVC"; }
            else if (slug === 'địa phương' && groupName === 'địa phương') { isMatch = true; displayTitle = "Địa Phương"; }
            else if (slug === 'thiết yếu' && groupName.indexOf('thiết yếu') > -1) { isMatch = true; displayTitle = "Thiết Yếu"; }

            if (!isMatch) continue;

            // Moi danh sách kênh trong nhóm đó (Các thẻ <a href="?url=...">)
            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); // CÁCH LẤY LINK SIÊU TỐC CỦA BẠN
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").trim(); 
                    
                    // Gom thẳng link luồng m3u8 vào làm ID của tập phim để Tự Phát
                    episodes.push({
                        id: streamLink, 
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
            break; // Đã tìm thấy đúng nhóm, vòng lặp ngắt luôn để không bị gộp đài khác
        }

        return JSON.stringify({
            id: apiUrl,
            title: "Kênh " + displayTitle,
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: "Chọn đài bên dưới để bắt đầu phát trực tiếp.",
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

// --- HÀM 3: AUTO PHÁT LINK SIÊU TỐC KHÔNG QUA WEBVIEW ---
function parseDetailResponse(html) {
    // GIỮ NGUYÊN HOÀN TOÀN LOGIC CỦA BẠN:
    // Trả về rỗng. Trình phát VAX App sẽ tự kéo cái link ".m3u8" từ biến id ở trên lôi ra phát ngay lập tức.
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
