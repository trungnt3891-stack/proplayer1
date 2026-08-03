// =============================================================================
// CẤU HÌNH DOMAIN & METADATA CHO NETSHORT
// =============================================================================
var BASEURL = "https://netshort.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "netshort",
        "name": "NetShort VN",
        "description": "Nền tảng Phim Ngắn hot nhất: Hỗ trợ vuốt dọc, Xóa sạch quảng cáo, Giao diện tối ưu.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt trình phát xoay dọc và vuốt chuyển tập
        "layoutType": "VERTICAL",
        "playerType": "webview" // Bắt buộc dùng Webview để vuốt phim
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[NetShort] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[NetShort] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/vi/drama/all-plots", "title": "Tất Cả Phim Ngắn", "type": "Grid" },
        { "slug": "/vi/drama/Ngh%E1%BB%8Bch%20c%E1%BA%A3nh-1984208314792402961", "title": "Phim Nghịch Cảnh", "type": "Horizontal" },
        { "slug": "/vi/drama/Ng%E1%BB%8Dt%20s%E1%BB%A7ng-1983832091151032332", "title": "Phim Ngọt Sủng", "type": "Horizontal" },
        { "slug": "/vi/drama/B%C3%A1o%20th%C3%B9-1983832036302733325", "title": "Phim Báo Thù", "type": "Horizontal" },
        { "slug": "/vi/drama/C%C6%B0%E1%BB%9Bi%20tr%C6%B0%E1%BB%9Bc%20y%C3%AAu%20sau-1983832091939561484", "title": "Cưới Trước Yêu Sau", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "/vi/drama/all-plots", "name": "Tất Cả Các Tập" },
        { "slug": "/vi/drama/Ngh%E1%BB%8Bch%20c%E1%BA%A3nh-1984208314792402961", "name": "Nghịch cảnh" },
        { "slug": "/vi/drama/K%E1%BB%8Bch%20t%C3%ADnh-1983832091029397515", "name": "Kịch tính" },
        { "slug": "/vi/drama/C%E1%BB%95%20%C4%91%E1%BA%A1i-1983832036533420044", "name": "Cổ đại" },
        { "slug": "/vi/drama/Ng%E1%BB%8Dt%20s%E1%BB%A7ng-1983832091151032332", "name": "Ngọt sủng" },
        { "slug": "/vi/drama/B%C3%A1o%20th%C3%B9-1983832036302733325", "name": "Báo thù" },
        { "slug": "/vi/drama/Ng%C6%B0%E1%BB%A3c%20t%C3%A2m-1983832091079729160", "name": "Ngược tâm" },
        { "slug": "/vi/drama/Trinh%20th%C3%A1m-1983832092497403916", "name": "Trinh thám" },
        { "slug": "/vi/drama/Tr%C3%B9ng%20sinh-1983832036273373197", "name": "Trùng sinh" },
        { "slug": "/vi/drama/C%C6%B0%E1%BB%9Bi%20tr%C6%B0%E1%BB%9Bc%20y%C3%AAu%20sau-1983832091939561484", "name": "Cưới trước yêu sau" },
        { "slug": "/vi/drama/%C4%90%E1%BA%A1o%20%C4%91%E1%BB%A9c%20gia%20%C4%91%C3%ACnh-1983832092405129228", "name": "Đạo đức gia đình" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try {
                var filters = JSON.parse(filtersJson);
                page = parseInt(filters.page) || 1;
            } catch(e) {}
        }
        
        var url = slug;
        if (url.indexOf("http") === -1) {
            url = BASEURL + (url.indexOf("/") === 0 ? "" : "/") + url;
        }
        
        if (page > 1) {
            url += (url.indexOf('?') > -1 ? '&' : '?') + "page=" + page;
        }
        return url;
    } catch(e) {
        return BASEURL + "/vi/drama/all-plots";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/vi/search?q=" + encodeURIComponent(keyword.trim());
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + (slug.indexOf("/") === 0 ? "" : "/") + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// HELPER: BÓC TÁCH DỮ LIỆU JSON ẨN CỦA NEXT.JS
// =============================================================================
function parseNextPayload(raw) {
    try {
        var match = raw.match(/self\.__next_f\.push\((.*)\)/);
        if (!match) return null;
        var pushArgs = JSON.parse(match[1]);
        var rawString = pushArgs[1];
        var cleanJsonStr = rawString.replace(/^\w+:/, '').replace(/\n$/, '');
        return JSON.parse(cleanJsonStr);
    } catch (e) {
        return null;
    }
}

function extractListData(data) {
    var resultList = [];
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            // Tìm mảng itemListElement chứa danh sách phim
            if (node.itemListElement && Array.isArray(node.itemListElement)) {
                for(var i=0; i<node.itemListElement.length; i++){
                    if(node.itemListElement[i].item && node.itemListElement[i].item.name) {
                        resultList.push(node.itemListElement[i].item);
                    }
                }
            }
            // Fallback tìm hotRecommendList
            if (node.hotRecommendList && Array.isArray(node.hotRecommendList)) {
                for(var i=0; i<node.hotRecommendList.length; i++){
                    resultList.push(node.hotRecommendList[i]);
                }
            }
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                traverse(node[i]);
            }
        }
    }
    traverse(data);
    return resultList;
}

function extractDetailData(data) {
    var result = null;
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.shortPlayDetailVo && typeof node.shortPlayDetailVo === 'object') {
                result = node.shortPlayDetailVo;
                return;
            }
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                traverse(node[i]);
            }
        }
    }
    traverse(data);
    return result;
}

// =============================================================================
// PARSERS (BÓC TÁCH DỮ LIỆU)
// =============================================================================
function parseListResponse(html, url) {
    try {
        var items = [];
        
        // 1. Cố gắng lấy data từ JSON Payload của NextJS
        var foundJson = false;
        var scripts = html.match(/<script>self\.__next_f\.push\([^>]+<\/script>/gi);
        
        if (scripts) {
            for(var i = 0; i < scripts.length; i++){
                var payload = parseNextPayload(scripts[i]);
                if (payload) {
                    var listData = extractListData(payload);
                    if (listData && listData.length > 0) {
                        foundJson = true;
                        for (var j = 0; j < listData.length; j++) {
                            var item = listData[j];
                            var name = item.name || item.shortPlayName || "";
                            var link = item.url || item.shortPlayNameUrl || "";
                            var img = item.image || item.shortPlayCover || "";
                            var ep = item.numberOfEpisodes || item.totalEpisode || "";
                            
                            if (name && link) {
                                items.push({
                                    id: link,
                                    title: name.replace(/Xem trực tuyến - NetShort/i, "").trim(),
                                    posterUrl: img,
                                    backdropUrl: img,
                                    episode_current: ep ? "Full " + ep : "HD",
                                    quality: "HD",
                                    lang: ""
                                });
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        // 2. Fallback bóc tách từ HTML gốc nếu không tìm thấy JSON
        if (!foundJson) {
            var itemPattern = /<li[^>]*class=["'][^"']*video-list-item[^"']*["'][^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][\s\S]*?<a[^>]*class=["'][^"']*video-list-item-name[^"']*["'][^>]*>([^<]+)<\/a>/gi;
            var match;
            while ((match = itemPattern.exec(html)) !== null) {
                var link = match[1];
                var img = match[2];
                var title = match[3];
                
                // Giải mã ảnh nếu bị mã hóa Base64 hoặc URL
                if (img.indexOf('url(') > -1) {
                    var m = img.match(/url\(['"]?([^'"\)]+)['"]?\)/);
                    if (m) img = m[1];
                }
                
                items.push({
                    id: link,
                    title: title.trim(),
                    posterUrl: img,
                    backdropUrl: img,
                    episode_current: "HD",
                    quality: "HD",
                    lang: ""
                });
            }
        }
        
        // Cắt bỏ phần đuôi dư thừa của ID
        for(var k=0; k<items.length; k++) {
            if(items[k].id.indexOf("#") > -1) items[k].id = items[k].id.split("#")[0];
        }
        
        // Tìm phân trang từ HTML
        var totalPages = 1;
        var currentPage = 1;
        
        var pageMatch = html.match(/<span[^>]*class=["'][^"']*tabular-nums[^"']*["'][^>]*>(\d+)[^<]*\/[^<]*(\d+)<\/span>/i);
        if(pageMatch) {
            currentPage = parseInt(pageMatch[1]);
            totalPages = parseInt(pageMatch[2]);
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var title = "";
        var posterUrl = "";
        var description = "";
        var totalEpisodes = 0;
        var categories = [];
        
        // 1. Cố gắng lấy data từ JSON Payload của NextJS để có thông tin xịn nhất
        var foundJson = false;
        var scripts = html.match(/<script>self\.__next_f\.push\([^>]+<\/script>/gi);
        
        if (scripts) {
            for(var i = 0; i < scripts.length; i++){
                var payload = parseNextPayload(scripts[i]);
                if (payload) {
                    var detailData = extractDetailData(payload);
                    if (detailData) {
                        foundJson = true;
                        title = detailData.shortPlayName || "";
                        posterUrl = detailData.shortPlayCover || "";
                        description = detailData.shotIntroduce || "";
                        
                        if(detailData.videoEpisodeInfos) {
                            totalEpisodes = detailData.videoEpisodeInfos.length;
                        }
                        
                        if(detailData.labelList) {
                            for(var j=0; j<detailData.labelList.length; j++){
                                categories.push(detailData.labelList[j].labelName);
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        // 2. Fallback bóc HTML nếu không có JSON
        if (!foundJson) {
            var titleMatch = /<meta\s+property="og:title"\s+content="([^"]+)"/i.exec(html);
            if (titleMatch) title = titleMatch[1].replace(/Xem trực tuyến - NetShort/i, "").trim();

            var posterMatch = /<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html);
            if (posterMatch) posterUrl = posterMatch[1];

            var descMatch = /<meta\s+property="og:description"\s+content="([^"]+)"/i.exec(html);
            if (descMatch) description = descMatch[1].trim();
        }

        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = BASEURL + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var servers = [{
            name: "NetShort VN",
            episodes: [{
                id: url,
                name: "Bấm Vào Đây Lướt Tập",
                slug: "webview"
            }]
        }];

        return JSON.stringify({
            id: url,
            title: title || "Đang cập nhật...",
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            servers: servers,
            quality: "HD",
            episode_current: totalEpisodes ? (totalEpisodes + " Tập") : "Full",
            year: 2026,
            category: categories.join(", ") || "Phim Ngắn",
            status: "Hoàn Thành"
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        // MÃ HÓA JS BẰNG CÁCH DỌN DẸP XUỐNG DÒNG, TIÊM VÀO ĐỂ XÓA QUẢNG CÁO WEB
        var killAdsJs = `
            (function() {
                var style = document.createElement('style');
                style.innerHTML = 'header, footer, nav, .header, .footer, .download-app, .app-download, .comments-title, .comments-list, .pc-container, .mobile-container, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } ' +
                'body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; } ' +
                '.episode-page-container, .detail-container, .flex-contatiner, .video-container, .video-content, .video-ref { width: 100vw !important; height: 100vh !important; max-width: 100% !important; max-height: 100% !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; } ' +
                '.video-info-container { display: none !important; }'; // Ẩn cột thông tin bên phải đi để Full màn hình video
                document.head.appendChild(style);

                setInterval(function() {
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);
            })();
        `;
        
        var fixedScript = killAdsJs.replace(/\r/g, "").replace(/\n/g, " ").replace(/\t/g, "  ").trim();

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Ép Webview để sử dụng thao tác Vuốt màn hình
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36", // Ép Mobile User Agent để giao diện video hiển thị to ra
                "Custom-Js": fixedScript
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
