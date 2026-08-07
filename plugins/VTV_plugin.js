// =============================================================================
// PLUGIN VAX APP: TIVI TRỰC TUYẾN (TINHLAGI.PRO)
// CHIẾN THUẬT: 7 FOLDER TRANG CHỦ -> LỌC KÊNH RIÊNG -> PHÁT LINK TRỰC TIẾP
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "2.0.0", // Code phân chia Folder thông minh
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc là MOVIE để gọi Trình phát Video
        "layoutType": "VERTICAL",
        "playerType": "auto" // Giữ nguyên Auto để Native Player xử lý link .m3u8 siêu tốc
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
    return "https://tinhlagi.pro/tivi";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi"; 
}

function getUrlDetail(slug) {
    // Truyền cái slug (vtv, htvc...) vào url để hàm ParseMovieDetail biết đường lọc đúng đài đó
    return "https://tinhlagi.pro/tivi|data:slug=" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// --- HÀM 1: TẠO 7 FOLDER ĐẠI DIỆN TRÊN TRANG CHỦ ---
function parseListResponse(html) {
    var groups = [
        { id: "vtv", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "vtvcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "sctv", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "htv", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "htvc", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "diaphuong", name: "Đài Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "thietyeu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
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

// --- HÀM 2: LỌC HTML ĐỂ CHIA KÊNH VÀO ĐÚNG FOLDER ĐƯỢC CHỌN ---
function parseMovieDetail(html, url) {
    try {
        // Lấy thông tin đài mà người dùng vừa click (vd: vtv)
        var slug = "";
        if (url && url.indexOf("data:slug=") > -1) {
            slug = url.split("data:slug=")[1];
        }

        var displayTitle = "Danh sách kênh";
        var targetHtml = "";

        // Chặt file HTML theo từng nhóm kênh
        var blocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            var titleMatch = block.match(/^([^<]+)<\/h2>/);
            if (!titleMatch) continue;

            var groupTitle = titleMatch[1].toLowerCase().trim();
            var isMatch = false;

            // Xác định xem khối HTML này có phải của đài đang được chọn hay không
            if (slug === 'vtv' && groupTitle.indexOf('vtv (') > -1) { isMatch = true; displayTitle = "Kênh VTV"; }
            else if (slug === 'vtvcab' && groupTitle.indexOf('vtvcab') > -1) { isMatch = true; displayTitle = "Kênh VTVcab"; }
            else if (slug === 'sctv' && groupTitle.indexOf('sctv') > -1) { isMatch = true; displayTitle = "Kênh SCTV"; }
            else if (slug === 'htv' && groupTitle.indexOf('htv (') > -1) { isMatch = true; displayTitle = "Kênh HTV"; }
            else if (slug === 'htvc' && groupTitle.indexOf('htvc') > -1) { isMatch = true; displayTitle = "Kênh HTVC"; }
            else if (slug === 'diaphuong' && groupTitle.indexOf('địa phương') > -1) { isMatch = true; displayTitle = "Kênh Địa Phương"; }
            else if (slug === 'thietyeu' && groupTitle.indexOf('thiết yếu') > -1) { isMatch = true; displayTitle = "Kênh Thiết Yếu"; }

            if (isMatch) {
                targetHtml = block;
                break; // Chỉ lấy đúng 1 khối HTML của đài đó, loại bỏ các đài thừa
            }
        }

        var episodes = [];
        if (targetHtml) {
            var channelParts = targetHtml.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); // Giải mã ra link gốc .m3u8
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " "); // Lấy tên kênh
                    
                    // Tuyệt chiêu siêu tốc của bạn: Nhét thẳng link luồng m3u8 vào làm ID của tập phim
                    episodes.push({
                        id: streamLink, 
                        name: channelName,
                        slug: "live-channel"
                    });
                }
            }
        }

        // Lấy ảnh bìa tùy theo đài
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
            id: url,
            title: displayTitle,
            posterUrl: poster,
            backdropUrl: poster,
            description: "Đang hiển thị " + episodes.length + " kênh thuộc nhóm " + displayTitle + ". Chọn kênh bên dưới để phát ngay.",
            servers: [{
                name: "Danh sách kênh",
                episodes: episodes
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

// --- HÀM 3: XỬ LÝ LINK STREAM (GIỮ NGUYÊN 100% ĐỂ PHÁT SIÊU NHANH NHƯ BẠN MUỐN) ---
function parseDetailResponse(html) {
    // Trả về rỗng để App lấy thẳng cái ID (link m3u8) truyền cho Trình phát
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: sourceUrl, isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
