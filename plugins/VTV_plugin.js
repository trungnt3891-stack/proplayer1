// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.1.5",
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
        { slug: 'truyen-hinh', title: 'Danh Mục Kênh Truyền Hình', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất Cả', slug: 'truyen-hinh' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

function getUrlList(slug, filtersJson) { return "https://tinhlagi.pro/tivi"; }
function getUrlSearch(keyword, filtersJson) { return "https://tinhlagi.pro/tivi"; }
function getUrlDetail(slug) { return "https://tinhlagi.pro/tivi"; }

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

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
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1, totalItems: items.length, itemsPerPage: 10 } });
}

function parseSearchResponse(html) { return parseListResponse(html); }

function parseMovieDetail(html) {
    try {
        var servers = [];
        var groupBlocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var rawTitle = block.substring(0, titleEnd);
            var groupNameClean = PluginUtils.cleanText(rawTitle).split('(')[0].trim();
            var groupLower = groupNameClean.toLowerCase();
            
            var matchedGroup = "";
            
            // Phân loại nhóm chính xác bằng từ khóa không phân biệt chữ hoa/thường hay ký hiệu rác
            if (groupLower.indexOf("vtvcab") !== -1) {
                matchedGroup = "VTVcab";
            } else if (groupLower.indexOf("vtv") !== -1) {
                matchedGroup = "VTV";
            } else if (groupLower.indexOf("sctv") !== -1) {
                matchedGroup = "SCTV";
            } else if (groupLower.indexOf("htvc") !== -1) {
                matchedGroup = "HTVC";
            } else if (groupLower.indexOf("htv") !== -1) {
                matchedGroup = "HTV";
            } else if (groupLower.indexOf("địa phương") !== -1 || groupLower.indexOf("dia phuong") !== -1) {
                matchedGroup = "Địa phương";
            } else if (groupLower.indexOf("thiết yếu") !== -1 || groupLower.indexOf("thiet yeu") !== -1) {
                matchedGroup = "Thiết yếu";
            }

            if (!matchedGroup) continue;

            var episodes = [];
            var channelParts = block.split('class="channel-card');
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    // Làm sạch tên kênh: Loại bỏ hoàn toàn hậu tố #player-area
                    var cleanName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").split('#')[0].trim();
                    
                    episodes.push({
                        id: streamLink, 
                        name: cleanName,
                        slug: "live-channel"
                    });
                }
            }
            if (episodes.length > 0) {
                servers.push({ name: "Kênh " + matchedGroup, episodes: episodes });
            }
        }
        return JSON.stringify({ servers: servers });
    } catch (e) { return JSON.stringify({}); }
}

function parseDetailResponse(html) { return JSON.stringify({}); }
function parseEmbedResponse(html, sourceUrl) { return JSON.stringify({ url: "", isEmbed: false }); }
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
