// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "OnlineTV",
        "name": "OnlineTV",
        "version": "1.2.0", // Nâng version
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

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) { 
    return "https://tinhlagi.pro/tivi"; 
}

// 1. NHÉT TỪ KHÓA VÀO DỮ LIỆU CỦA URL
function getUrlSearch(keyword, filtersJson) { 
    return "https://tinhlagi.pro/tivi|data:search=" + encodeURIComponent(keyword); 
}

// 2. NHÉT ID GROUP VÀO DỮ LIỆU CỦA URL
function getUrlDetail(slug) { 
    if (slug && slug.indexOf("search=") === 0) {
        return "https://tinhlagi.pro/tivi|data:" + slug;
    }
    return "https://tinhlagi.pro/tivi|data:group=" + encodeURIComponent(slug); 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS DATA
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
    },
    // Hàm hỗ trợ bóc tách phần data sau dấu | chuẩn xác
    getPipeData: function(url) {
        if (!url) return "";
        var i = url.indexOf("|");
        if (i < 0) return "";
        var s = url.substring(i + 1).replace(/^\s+/, "");
        if (s.toLowerCase().indexOf("data:") === 0) {
            s = s.substring(5);
        }
        return s;
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
            id: groups[i].id, // Đẩy thẳng ID (VD: "VTV") để getUrlDetail bắt
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

// 3. TẠO MỤC KẾT QUẢ TÌM KIẾM RIÊNG BIỆT
function parseSearchResponse(html, url) { 
    var keyword = "";
    var pipeData = PluginUtils.getPipeData(url);
    if (pipeData && pipeData.indexOf("search=") === 0) {
        keyword = decodeURIComponent(pipeData.split("search=")[1]);
    }
    
    var items = [];
    if (keyword) {
        items.push({
            id: "search=" + encodeURIComponent(keyword), // Đẩy ID dạng tìm kiếm
            title: 'Kết quả tìm kiếm cho: "' + keyword + '"',
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            quality: "HD",
            episode_current: "Search",
            lang: "Viet",
            year: 0
        });
    }
    
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
}

// 4. LỌC CHÍNH XÁC KÊNH THEO TỪ KHÓA HOẶC DANH MỤC
function parseMovieDetail(html, url) {
    try {
        var pipeData = PluginUtils.getPipeData(url);
        var isSearch = false;
        var searchKeyword = "";
        var targetGroup = "";
        
        // Phân tích lệnh từ URL
        if (pipeData.indexOf("search=") === 0) {
            isSearch = true;
            searchKeyword = decodeURIComponent(pipeData.split("search=")[1]).toLowerCase();
        } else if (pipeData.indexOf("group=") === 0) {
            targetGroup = decodeURIComponent(pipeData.split("group=")[1]);
        }

        var servers = [];
        var searchEpisodes = []; // Rổ đựng các kênh khớp từ khóa
        
        var groupBlocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var rawTitle = block.substring(0, titleEnd);
            var groupNameClean = PluginUtils.cleanText(rawTitle).split('(')[0].trim();
            var groupLower = groupNameClean.toLowerCase();
            
            var matchedGroup = "";
            if (groupLower.indexOf("vtvcab") !== -1) matchedGroup = "VTVcab";
            else if (groupLower.indexOf("vtv") !== -1) matchedGroup = "VTV";
            else if (groupLower.indexOf("sctv") !== -1) matchedGroup = "SCTV";
            else if (groupLower.indexOf("htvc") !== -1) matchedGroup = "HTVC";
            else if (groupLower.indexOf("htv") !== -1) matchedGroup = "HTV";
            else if (groupLower.indexOf("địa phương") !== -1 || groupLower.indexOf("dia phuong") !== -1) matchedGroup = "Địa phương";
            else if (groupLower.indexOf("thiết yếu") !== -1 || groupLower.indexOf("thiet yeu") !== -1) matchedGroup = "Thiết yếu";

            if (!matchedGroup) continue;

            // Nếu đang xem danh mục (VTV, HTV...) -> Bỏ qua các danh mục không liên quan
            if (!isSearch && targetGroup && matchedGroup !== targetGroup) continue;

            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); 
                    var cleanName = decodeURIComponent(nameM[1]).replace(/\+/g, " ").split('#')[0].trim();
                    
                    // NẾU LÀ TÌM KIẾM -> Kiểm tra tên kênh có khớp với từ khóa không
                    if (isSearch) {
                        if (cleanName.toLowerCase().indexOf(searchKeyword) === -1 && matchedGroup.toLowerCase().indexOf(searchKeyword) === -1) {
                            continue; // Kênh này không khớp -> vứt
                        }
                    }
                    
                    var finalPlayUrl = streamLink;
                    if (streamLink.indexOf("fptplay") !== -1 || streamLink.indexOf(".m3u8") !== -1) {
                        // Kodi Pipe để Player nhận Headers
                        finalPlayUrl = streamLink + "|User-Agent=cvmedia/1.1.0|Referer=https://tinhlagi.pro/|Origin=https://tinhlagi.pro";
                    }

                    var epObj = {
                        id: finalPlayUrl, 
                        name: cleanName,
                        // Tạo slug duy nhất (Bắt buộc theo chuẩn Vax)
                        slug: "live-" + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')
                    };

                    if (isSearch) searchEpisodes.push(epObj);
                    else episodes.push(epObj);
                }
            }

            // Quét tìm bổ sung kênh VTV1 bị lỗi nhảy block
            if (!isSearch && matchedGroup === "VTV") {
                var allCards = html.split('class="channel-card');
                for (var c = 1; c < allCards.length; c++) {
                    var cPart = allCards[c];
                    var uM = cPart.match(/href=["']\?url=([^&"']+)/i);
                    var nM = cPart.match(/&name=([^"']+)/i);
                    if (uM && nM) {
                        var nClean = decodeURIComponent(nM[1]).replace(/\+/g, " ").split('#')[0].trim();
                        if (nClean.toUpperCase() === "VTV1") {
                            var sLink = decodeURIComponent(uM[1]);
                            var fUrl = sLink;
                            if (sLink.indexOf("fptplay") !== -1 || sLink.indexOf(".m3u8") !== -1) {
                                fUrl = sLink + "|User-Agent=cvmedia/1.1.0|Referer=https://tinhlagi.pro/|Origin=https://tinhlagi.pro";
                            }
                            
                            var exists = false;
                            for (var eIdx = 0; eIdx < episodes.length; eIdx++) {
                                if (episodes[eIdx].name.toUpperCase() === "VTV1") { exists = true; break; }
                            }
                            if (!exists) {
                                episodes.unshift({ id: fUrl, name: "VTV1", slug: "live-vtv1" });
                            }
                        }
                    }
                }
            }

            if (!isSearch && episodes.length > 0) {
                servers.push({ name: "Kênh " + matchedGroup, episodes: episodes });
            }
        }

        // Đóng gói trả về nếu đang trong lệnh Tìm kiếm
        if (isSearch) {
            if (searchEpisodes.length > 0) {
                servers.push({ name: "Kênh Tìm Được", episodes: searchEpisodes });
            } else {
                servers.push({ name: "Không tìm thấy", episodes: [] });
            }
        }

        var titleStr = isSearch ? ('Tìm kiếm: "' + searchKeyword + '"') : ("Danh sách: Kênh " + (targetGroup || "Truyền Hình"));

        return JSON.stringify({
            id: url,
            title: titleStr,
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: isSearch ? "Danh sách các kênh khớp với từ khóa." : "Danh mục kênh đang chọn.",
            servers: servers
        });
    } catch (e) { 
        return JSON.stringify({}); 
    }
}

// Xử lý nạp link Video cuối cùng gửi cho ExoPlayer
function parseDetailResponse(html, url) { 
    try {
        var cleanUrl = url.split("|")[0]; // Bóc đường dẫn m3u8 sạch
        var isEmbed = cleanUrl.indexOf(".m3u8") === -1 && cleanUrl.indexOf("fptplay") === -1;
        
        return JSON.stringify({
            "url": cleanUrl,
            "isEmbed": isEmbed,
            "mimeType": isEmbed ? "" : "application/x-mpegURL",
            "headers": {
                "User-Agent": "cvmedia/1.1.0",
                "Referer": "https://tinhlagi.pro/",
                "Origin": "https://tinhlagi.pro"
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true });
    }
}

function parseEmbedResponse(html, sourceUrl) { return JSON.stringify({ url: "", isEmbed: false }); }
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
