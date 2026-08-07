// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.1.2",
        "baseUrl": "https://tinhlagi.pro/tivi",
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
        { slug: 'vtv', title: 'Kênh VTV', type: 'Grid', path: '' },
        { slug: 'vtvcab', title: 'Kênh VTVcab', type: 'Grid', path: '' },
        { slug: 'sctv', title: 'Kênh SCTV', type: 'Grid', path: '' },
        { slug: 'htv', title: 'Kênh HTV', type: 'Grid', path: '' },
        { slug: 'htvc', title: 'Kênh HTVC', type: 'Grid', path: '' },
        { slug: 'diaphuong', title: 'Kênh Địa Phương', type: 'Grid', path: '' },
        { slug: 'thietyeu', title: 'Kênh Thiết Yếu', type: 'Grid', path: '' }
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

// --- HÀM 1: TẠO DANH MỤC TRÊN TRANG CHỦ ---
function parseListResponse(html) {
    var groups = [
        { id: "vtv", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "vtvcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "sctv", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "htv", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "htvc", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "diaphuong", name: "Kênh Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "thietyeu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
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

// --- HÀM 2: LẤY DANH SÁCH KÊNH (TẬP PHIM) TỪ TỪNG NHÓM ---
function parseMovieDetail(html, url) {
    try {
        var slug = "vtv";
        if (url && url.indexOf("data:slug=") > -1) {
            slug = url.split("data:slug=")[1].toLowerCase().trim();
        }

        var episodes = [];
        var groupBlocks = html.split('<h2 class="group-title">');
        var groupTitleDisplay = "Kênh Trực Tuyến";
        var groupLogo = "https://tinhlagi.pro/tinhlagi.ico";
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var rawTitle = block.substring(0, titleEnd);
            var groupName = PluginUtils.cleanText(rawTitle).split('(')[0].trim().toLowerCase(); 
            
            var isMatch = false;
            // Xử lý so sánh chính xác từng folder riêng biệt để không bị lặp dữ liệu chéo nhau
            if (slug === 'vtv' && groupName.indexOf('vtv') !== -1 && groupName.indexOf('vtvcab') === -1) { 
                isMatch = true; groupTitleDisplay = "Kênh VTV"; groupLogo = "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png"; 
            }
            else if (slug === 'vtvcab' && groupName.indexOf('vtvcab') !== -1) { 
                isMatch = true; groupTitleDisplay = "Kênh VTVcab"; groupLogo = "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png"; 
            }
            else if (slug === 'sctv' && groupName.indexOf('sctv') !== -1) { 
                isMatch = true; groupTitleDisplay = "Kênh SCTV"; groupLogo = "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png"; 
            }
            else if (slug === 'htv' && groupName.indexOf('htv') !== -1 && groupName.indexOf('htvc') === -1) { 
                isMatch = true; groupTitleDisplay = "Kênh HTV"; groupLogo = "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png"; 
            }
            else if (slug === 'htvc' && groupName.indexOf('htvc') !== -1) { 
                isMatch = true; groupTitleDisplay = "Kênh HTVC"; groupLogo = "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png"; 
            }
            else if (slug === 'diaphuong' && (groupName.indexOf('địa phương') !== -1 || groupName.indexOf('dia phuong') !== -1)) { 
                isMatch = true; groupTitleDisplay = "Kênh Địa Phương"; groupLogo = "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png"; 
            }
            else if (slug === 'thietyeu' && (groupName.indexOf('thiết yếu') !== -1 || groupName.indexOf('thiet yeu') !== -1)) { 
                isMatch = true; groupTitleDisplay = "Kênh Thiết Yếu"; groupLogo = "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg"; 
            }

            if (!isMatch) continue;

            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^#"']+)/i);
                var imgM = cp.match(/src=["']([^"']+)["']/i); 
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").trim(); 
                    var logoUrl = imgM ? imgM[1] : groupLogo;
                    
                    var packedData = streamLink + "|||" + logoUrl;

                    episodes.push({
                        id: packedData, 
                        name: channelName,
                        slug: "live-channel-" + k
                    });
                }
            }
            break; 
        }

        return JSON.stringify({
            id: url,
            title: groupTitleDisplay,
            posterUrl: groupLogo,
            backdropUrl: groupLogo,
            description: "Hệ thống Xem Tivi trực tuyến tốc độ cao.",
            servers: [{
                name: groupTitleDisplay,
                episodes: episodes
            }],
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

// --- HÀM 3: XỬ LÝ LINK STREAM VÀO PLAYER ---
function parseDetailResponse(html, apiUrl) {
    try {
        var realUrl = apiUrl;
        if (apiUrl && apiUrl.indexOf("|||") > -1) {
            realUrl = apiUrl.split("|||")[0];
        }

        var finalPlayUrl = realUrl + "|User-Agent=cvmedia/1.1.0|Referer=https://tinhlagi.pro/|Origin=https://tinhlagi.pro";

        var mimeType = "application/x-mpegURL";
        if (realUrl.indexOf('.mpd') > -1) {
            mimeType = "application/dash+xml";
        }

        return JSON.stringify({
            "url": finalPlayUrl,
            "isEmbed": false, 
            "mimeType": mimeType,
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

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
