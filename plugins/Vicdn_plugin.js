// =============================================================================
// CẤU HÌNH DOMAIN VICDN
// =============================================================================
var BASEURL = "https://vicdn.cc"; 
var BASEAPI = BASEURL + "/api";
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "vicdn",
        "name": "Nguồn Vicdn",
        "description": "Bản Native iOS Tối Ưu: Đọc API siêu tốc, bắt link m3u8 trực tiếp, không Webview.",
        "version": "2.0.0",
        "info": "Tối ưu riêng cho iOS. Khai thác sức mạnh từ JSON API của web để load ngay lập tức. Tự động quét đệ quy Iframe để lấy m3u8 cho ExoPlayer.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/vicdn.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer" // [BẮT BUỘC] Dùng trình phát Native, KHÔNG mở Webview
    });
}

function log(msg) {
    if (DEV) {
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[Vicdn] " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[Vicdn] " + msg);
        }
    }
}

// -----------------------------------------------------------------------------
// MENU & CATEGORIES
// -----------------------------------------------------------------------------
function getHomeSections() {
    try {
        var listurl = '[{\"link\":\"/update/\",\"name\":\"Phim Mới Cập Nhật\"}]';
        var menulist = buildMenu(listurl, true);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({ category: menulist });
    } catch (e) {
        return JSON.stringify({ category: [] });
    }
}

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;
                    if (pageSearch > 1 && slug.indexOf("page=") === -1) {
                        return slug + (slug.indexOf("?") > -1 ? "&" : "?") + "page=" + pageSearch;
                    }
                } catch (jsonErr) {}
            }
            return slug;
        }

        var page = 1;
        var path = slug || "";

        if (filtersJson) {
            var fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        var resultUrl = BASEAPI + (path.startsWith("/") ? path : "/" + path);
        
        // Nối tham số phân trang chuẩn xác
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += page; 
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEAPI + (slug ? (slug.startsWith("/") ? slug : "/" + slug) : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEURL + "/?q=" + encodedKeyword;
        if (page > 1) resultUrl += "&page=" + page;
        
        return resultUrl;
    } catch (e) {
        return BASEURL + "/?q=" + encodeURIComponent(keyword || "");
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    // Slug là ID phim, gọi thẳng API info của web
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH (ĐỌC JSON SIÊU TỐC ĐỘ TỪ API)
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent, url) {
    try {
        var dataArr = [];
        var totalPages = 999;
        
        // 1. Nếu là trang Tìm kiếm, Web nén JSON vào biến JS `const allData = [...]`
        if (url.indexOf("/?q=") > -1) {
            var match = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
            if (match) {
                dataArr = JSON.parse(match[1]);
            }
        } 
        // 2. Nếu là trang Danh mục, Web trả thẳng kết quả là JSON API
        else {
            var jsonRes = JSON.parse(htmlContent);
            dataArr = jsonRes.data || [];
            if (jsonRes.pagination && jsonRes.pagination.total_pages) {
                totalPages = parseInt(jsonRes.pagination.total_pages);
            }
        }

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            items.push({
                "id": item.slug, // Truyền ID sang trang chi tiết (Vd: tv-278275-1)
                "title": item.vname || item.ename,
                "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                "quality": (item.type || "").toUpperCase(),
                "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
            });
        }

        var currentPage = 1;
        var pageMatch = url.match(/page=(\d+)/i) || url.match(/\/(\d+)$/);
        if (pageMatch) currentPage = parseInt(pageMatch[1]);

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentPage,
                "totalPages": totalPages
            }
        });
    } catch (e) {
        log("parseListResponse err: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(htmlContent, url) {
    return parseListResponse(htmlContent, url);
}

// -----------------------------------------------------------------------------
// PARSER 2: TRANG CHI TIẾT (LẤY DỮ LIỆU TỪ JSON API MỘT CÁCH SẠCH SẼ)
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var episodes = [];

        // 1. Nếu là phim bộ, xử lý danh sách tập
        if (data.list_episodes && Array.isArray(data.list_episodes)) {
            for (var i = 0; i < data.list_episodes.length; i++) {
                var parts = data.list_episodes[i].split("|"); // Định dạng "1|https://vicdn.cc/tv-..."
                if (parts.length >= 2) {
                    var epNum = parts[0];
                    var epLink = parts[1]; 
                    
                    episodes.push({
                        id: epLink, // Gửi link Embed trực tiếp cho bước DetailResponse
                        name: "Tập " + epNum,
                        slug: "tap-" + epNum
                    });
                }
            }
        }

        // 2. Nếu là phim lẻ (Movie), xử lý link MKV gốc
        if (episodes.length === 0 && data.mkv) {
            episodes.push({
                id: data.mkv, 
                name: "Full HD",
                slug: "full"
            });
        }

        if (episodes.length > 0) {
            servers.push({ name: "ViCDN Server", episodes: episodes });
        }

        return JSON.stringify({
            id: url,
            title: data.vname || data.ename || "Đang cập nhật",
            posterUrl: data.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + data.banner + ".jpg" : "",
            backdropUrl: data.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + data.banner + ".jpg" : "",
            description: data.content || "Không có mô tả",
            quality: (data.type || "").toUpperCase(),
            year: parseInt(data.year) || 2026,
            rating: parseFloat(data.rate || 0),
            status: "Tập " + data.stt + "/" + data.total,
            category: (data.genre || []).join(", "),
            episode_current: "Tập " + data.stt,
            servers: servers,
            casts: (data.cast || []).join(", "),
            duration: data.duration + " Phút"
        });

    } catch (e) {
        log("parseMovieDetail err: " + e);
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// PARSER 3: BẮT LINK BÊN TRONG TRANG XEM PHIM
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // Có trường hợp url truyền vào đã là link m3u8/mp4 trực tiếp
        var isDirect = url.indexOf('.m3u8') !== -1 || url.indexOf('.mp4') !== -1;
        if (isDirect) {
            return JSON.stringify({
                url: url,
                isEmbed: false,
                mimeType: url.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": BASEURL, "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }

        // Tìm link luồng stream hoặc iframe nhúng bên trong html
        var streamUrl = "";
        
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
        } else {
            var m3u8Match = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
        }

        if (!streamUrl) {
            // Nếu web trả về JSON có chứa link (Trường hợp API ẩn)
            var jsonMatch = htmlContent.match(/["'](?:file|link|url)["']\s*:\s*["']([^"']+)["']/i);
            if (jsonMatch) streamUrl = jsonMatch[1].replace(/\\/g, '');
        }

        // Báo cho app biết cách xử lý link
        if (streamUrl) {
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            var isM3u8 = streamUrl.indexOf('.m3u8') !== -1 || streamUrl.indexOf('.mp4') !== -1;
            return JSON.stringify({
                url: streamUrl,
                isEmbed: !isM3u8, // Nếu chưa phải m3u8 thì yêu cầu tải ngầm Iframe
                mimeType: isM3u8 ? "application/x-mpegURL" : "",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }
        
        // Fallback: Quăng thẳng url gốc yêu cầu app tự lặn đệ quy
        return JSON.stringify({
            url: url,
            isEmbed: true, 
            headers: { "Referer": BASEURL, "User-Agent": "Mozilla/5.0" },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// -----------------------------------------------------------------------------
// PARSER 4: TRÍCH XUẤT M3U8 TỪ TRONG MÃ NGUỒN CỦA IFRAME (ĐỆ QUY NGẦM VAX)
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    try {
        // [1]: Quét tìm m3u8/mp4 trần trụi lộ diện
        var directMatch = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        if (directMatch) {
            var finalUrl = directMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false, // Dừng đệ quy, đẩy link cho ExoPlayer
                mimeType: finalUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }

        // [2]: Dữ liệu trả về là JSON API
        if (htmlContent.startsWith('{') || htmlContent.startsWith('[')) {
            try {
                var jData = JSON.parse(htmlContent);
                var jStreamUrl = jData.securedLink || jData.videoSource || jData.file || jData.url || (jData.videoSources && jData.videoSources.length > 0 ? jData.videoSources[0].file : "");
                
                if (jStreamUrl) {
                    return JSON.stringify({
                        url: jStreamUrl,
                        isEmbed: false,
                        mimeType: "application/x-mpegURL",
                        headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                    });
                }
            } catch (err) {}
        }

        // [3]: Giải mã JS Packer
        var packMatch = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\).*?)\)/);
        if (packMatch) {
            try {
                var unpacked = eval("(" + packMatch[1] + ")");
                var m3u8Hidden = unpacked.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
                if (m3u8Hidden) {
                    return JSON.stringify({
                        url: m3u8Hidden[1].replace(/\\/g, ''),
                        isEmbed: false,
                        mimeType: "application/x-mpegURL",
                        headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                    });
                }
                
                // Nếu nén ra 1 iframe khác thì tiếp tục theo dấu đệ quy
                var innerIframe = unpacked.match(/<iframe[^>]*src=["']([^"']+)["']/i);
                if (innerIframe) {
                    var nextInnerUrl = innerIframe[1].replace(/\\/g, '');
                    if (nextInnerUrl.indexOf('//') === 0) nextInnerUrl = "https:" + nextInnerUrl;
                    return JSON.stringify({
                        url: nextInnerUrl,
                        isEmbed: true,
                        headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                    });
                }
            } catch (err) {}
        }

        // [4]: Tiếp tục lặn sâu nếu trang này vẫn chứa Iframe
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            var nextUrl = iframeMatch[1];
            if (nextUrl.indexOf('//') === 0) nextUrl = "https:" + nextUrl;
            if (nextUrl !== url) {
                return JSON.stringify({
                    url: nextUrl,
                    isEmbed: true, 
                    headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                });
            }
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// -----------------------------------------------------------------------------
// UTILS MENU & CATEGORIES
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"/type/hoat-hinh/\",\"name\":\"Hoạt Hình\"},{\"link\":\"/type/vien-tuong/\",\"name\":\"Viễn Tưởng\"},{\"link\":\"/type/hinh-su/\",\"name\":\"Hình Sự\"},{\"link\":\"/type/bi-an/\",\"name\":\"Bí Ẩn\"},{\"link\":\"/type/hanh-dong/\",\"name\":\"Hành Động\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    let menulist = []; 
    if (!menuArray || !Array.isArray(menuArray)) return menulist; 
    var typeStr = type !== undefined ? String(type).trim() : undefined; 
    for (var i = 0; i < menuArray.length; i++) { 
        var item = menuArray[i]; 
        if (!item) continue; 
        var link = item.link ? String(item.link).trim() : ""; 
        var name = item.name ? String(item.name).trim() : ""; 
        if (!link || !name) continue; 
        var menuItem = {}; 
        if (typeStr === "false") { 
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}
