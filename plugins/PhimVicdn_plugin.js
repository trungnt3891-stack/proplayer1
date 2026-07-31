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
        "description": "Bản Native iOS Cuối: Fix triệt để Phụ đề Vietsub, Thêm Menu Trang chủ lướt ngang.",
        "version": "2.2.1",
        "info": "Bắt trực tiếp link M3U8. Tự động lột mã Iframe và API để ghép Subtitle Tiếng Việt 100% vào ExoPlayer.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/vicdn.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // [BẮT BUỘC] Sử dụng ExoPlayer gốc, nói KHÔNG với WebView
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
// MENU & TRANG CHỦ (THỂ HIỆN LƯỚT NGANG)
// -----------------------------------------------------------------------------
function getHomeSections() {
    return JSON.stringify([
        { "slug": "update", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "type/hanh-dong", "title": "Hành Động", "type": "Horizontal" },
        { "slug": "type/hoat-hinh", "title": "Hoạt Hình", "type": "Horizontal" },
        { "slug": "type/vien-tuong", "title": "Viễn Tưởng", "type": "Horizontal" },
        { "slug": "type/hinh-su", "title": "Hình Sự", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'update' },
        { name: 'Hành Động', slug: 'type/hanh-dong' },
        { name: 'Hoạt Hình', slug: 'type/hoat-hinh' },
        { name: 'Viễn Tưởng', slug: 'type/vien-tuong' },
        { name: 'Hình Sự', slug: 'type/hinh-su' },
        { name: 'Bí Ẩn', slug: 'type/bi-an' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "update";

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                if (filters.category && filters.category.length > 0) {
                    path = filters.category[0].slug;
                } else if (typeof filters.category === 'string') {
                    path = filters.category;
                }
            } catch (jsonErr) {}
        }

        if (path.indexOf("http") === 0) return path;

        var resultUrl = BASEAPI + (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 0) {
            if (!resultUrl.endsWith("/")) resultUrl += "/";
            resultUrl += page; 
        }

        return resultUrl;
    } catch (e) {
        return BASEAPI + "/update/1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "").trim();
    return BASEURL + "/index.php?search_keyword=" + encodedKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH & TÌM KIẾM
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var dataArr = jsonRes.data || [];
        var totalPages = jsonRes.pagination ? parseInt(jsonRes.pagination.total_pages) : 1;
        var currentPage = jsonRes.pagination ? parseInt(jsonRes.pagination.current_page) : 1;

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            items.push({
                "id": item.slug, 
                "title": item.vname || item.ename || "Chưa có tên",
                "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                "quality": (item.type || "HD").toUpperCase(),
                "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
            });
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(htmlContent, url) {
    try {
        var keyword = "";
        var matchKw = url.match(/search_keyword=([^&]+)/);
        if (matchKw) keyword = decodeURIComponent(matchKw[1]).toLowerCase();

        var dataArr = [];
        var scriptMatch = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
        if (scriptMatch) {
            dataArr = JSON.parse(scriptMatch[1]);
        }

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            var vname = (item.vname || "").toLowerCase();
            var ename = (item.ename || "").toLowerCase();
            
            if (vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                items.push({
                    "id": item.slug,
                    "title": item.vname || item.ename || "Chưa có tên",
                    "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                    "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                    "quality": (item.type || "HD").toUpperCase(),
                    "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 } 
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

// -----------------------------------------------------------------------------
// PARSER 2: CHI TIẾT PHIM (CÀO MÃ LECH VÀ NỐI VÀO EP_ID)
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var data = jsonRes.data;

        var servers = [];
        var episodes = [];
        var lech = data.lech || ""; // Lấy mã số để truy xuất Subtitle ở nguồn ngoài

        if (data.list_episodes && Array.isArray(data.list_episodes) && data.list_episodes.length > 0) {
            for (var i = 0; i < data.list_episodes.length; i++) {
                var parts = data.list_episodes[i].split("|"); 
                if (parts.length >= 2) {
                    var epNum = parts[0].trim();
                    var epLink = parts[1].trim(); 
                    
                    // Nối tham số lech và ep vào url để truyền đệ quy qua DetailResponse
                    var sep = epLink.indexOf("?") > -1 ? "&" : "?";
                    var finalId = epLink + sep + "lech=" + lech + "&ep=" + epNum;
                    
                    episodes.push({
                        id: finalId,
                        name: "Tập " + epNum,
                        slug: "tap-" + epNum
                    });
                }
            }
        } 
        else if (data.mkv) {
            var epLink = data.mkv.trim();
            var sep = epLink.indexOf("?") > -1 ? "&" : "?";
            var finalId = epLink + sep + "lech=" + lech + "&ep=1";
            
            episodes.push({
                id: finalId, 
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
            posterUrl: data.poster ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + data.poster + ".jpg" : "",
            backdropUrl: data.banner ? "https://image.tmdb.org/t/p/w1280/" + data.banner + ".jpg" : "",
            description: data.content || "Không có mô tả",
            quality: (data.type || "HD").toUpperCase(),
            year: parseInt(data.year) || 2026,
            rating: parseFloat(data.rate || 0),
            status: "Tập " + data.stt + "/" + data.total,
            category: (data.genre || []).join(", "),
            episode_current: "Tập " + data.stt,
            servers: servers,
            casts: (data.cast || []).join(", "),
            duration: data.duration ? data.duration + " Phút" : ""
        });

    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi tải chi tiết phim", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// BỘ HÀM VÉT PHỤ ĐỀ (TÌM TRONG HTML VÀ JS NÉN)
// -----------------------------------------------------------------------------
function extractSubtitles(htmlContent) {
    var subs = [];
    
    // 1. Quét mảng tracks/subtitles bằng JSON trần trong file
    var tracksMatch = htmlContent.match(/["'](?:tracks|subtitles)["']\s*:\s*(\[[\s\S]*?\])/i);
    if (tracksMatch) {
        try {
            var tracks = JSON.parse(tracksMatch[1]);
            for (var i = 0; i < tracks.length; i++) {
                var file = tracks[i].file || tracks[i].url || tracks[i].src;
                if (file && (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles' || file.indexOf('.vtt') > -1 || file.indexOf('.srt') > -1)) {
                    subs.push({ lang: tracks[i].label || tracks[i].name || 'Vietsub', url: file });
                }
            }
        } catch(e) {}
    }
    
    // 2. Quét JS Packer nếu nó bị ẩn bằng vòng lặp eval
    var packMatch = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\).*?)\)/);
    if (packMatch) {
        try {
            var unpacked = eval("(" + packMatch[1] + ")");
            var tkMatch = unpacked.match(/["'](?:tracks|subtitles)["']\s*:\s*(\[[\s\S]*?\])/i);
            if (tkMatch) {
                var tks = JSON.parse(tkMatch[1]);
                for (var j = 0; j < tks.length; j++) {
                    var tfile = tks[j].file || tks[j].url || tks[j].src;
                    if (tfile && (tks[j].kind === 'captions' || tks[j].kind === 'subtitles' || tfile.indexOf('.vtt') > -1 || tfile.indexOf('.srt') > -1)) {
                        subs.push({ lang: tks[j].label || tks[j].name || 'Vietsub', url: tfile });
                    }
                }
            }
        } catch(e) {}
    }
    
    return subs;
}

// -----------------------------------------------------------------------------
// PARSER 3: BẮT LINK IFRAME & TẠO PHỤ ĐỀ NGUỒN NGOÀI
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // [A]. Phục hồi lech và ep từ URL để gọi Subtitle
        var lechVal = "", epVal = "";
        var lechMatch = url.match(/lech=([^&]+)/);
        var epMatch = url.match(/ep=([^&]+)/);
        if (lechMatch) lechVal = lechMatch[1];
        if (epMatch) epVal = epMatch[1];

        var subtitles = [];
        // Tạo phụ đề Vietsub từ server Phimgod nếu có biến lech
        if (lechVal && epVal && lechVal !== "undefined" && lechVal !== "") {
            var epNum = parseInt(epVal);
            var epStr = epNum < 10 ? '0' + epNum : epNum.toString();
            // Lưu ý: Cấu trúc của VAAPP chỉ yêu cầu đúng 2 key là lang và url
            subtitles.push({ "lang": "Vietsub", "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/v" + epStr + ".srt/vtt.css" });
            subtitles.push({ "lang": "Engsub", "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/e" + epStr + ".srt/vtt.css" });
        }

        // Vét phụ đề bị giấu trong Iframe hiện tại
        var dynamicSubs = extractSubtitles(htmlContent);
        dynamicSubs.forEach(function(s) { 
            if (!subtitles.some(function(e) { return e.url === s.url; })) subtitles.push(s); 
        });

        // [B]. Tìm link stream hoặc Iframe
        var streamUrl = "";
        
        // 1. Dạng API JSON trả thẳng về
        if (htmlContent.startsWith('{') || htmlContent.startsWith('[')) {
            try {
                var jData = JSON.parse(htmlContent);
                streamUrl = jData.url || jData.link || jData.file || jData.videoSource || jData.securedLink || "";
                if (streamUrl) {
                    return JSON.stringify({
                        url: streamUrl,
                        isEmbed: false,
                        mimeType: streamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                        headers: { "Referer": BASEURL },
                        subtitles: subtitles
                    });
                }
            } catch(e) {}
        }

        // 2. Dạng Iframe HTML
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
        } else {
            var m3u8Match = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, '');
        }

        if (!streamUrl) {
            var jsUrlMatch = htmlContent.match(/["'](?:file|src|url|link)["']\s*:\s*["'](https?:\/\/[^"']+)["']/i);
            if (jsUrlMatch) streamUrl = jsUrlMatch[1].replace(/\\/g, '');
        }

        // [C]. Trả về lệnh cho VAAPP
        if (streamUrl) {
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            var isDirect = streamUrl.indexOf('.m3u8') > -1 || streamUrl.indexOf('.mp4') > -1;
            if (isDirect) {
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: false,
                    mimeType: streamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                    headers: { "Referer": BASEURL },
                    subtitles: subtitles
                });
            } else {
                // Nhét Subtitles vào url để gửi đệ quy qua hàm parseEmbedResponse bên dưới
                var nextUrl = streamUrl;
                if (lechVal && epVal) {
                    nextUrl += (nextUrl.indexOf('?') > -1 ? '&' : '?') + "lech=" + lechVal + "&ep=" + epVal;
                }
                return JSON.stringify({
                    url: nextUrl,
                    isEmbed: true,
                    headers: { "Referer": url },
                    subtitles: subtitles
                });
            }
        }
        
        return JSON.stringify({ url: url, isEmbed: false, subtitles: subtitles });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// -----------------------------------------------------------------------------
// PARSER 4: ĐỆ QUY TÌM LINK GỐC + DỤNG LẠI MẢNG PHỤ ĐỀ
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    try {
        // Khôi phục biến lech để tái tạo lại mảng Subtitles
        var lechVal = "", epVal = "";
        var lechMatch = url.match(/lech=([^&]+)/);
        var epMatch = url.match(/ep=([^&]+)/);
        if (lechMatch) lechVal = lechMatch[1];
        if (epMatch) epVal = epMatch[1];

        var subtitles = [];
        if (lechVal && epVal && lechVal !== "undefined" && lechVal !== "") {
            var epNum = parseInt(epVal);
            var epStr = epNum < 10 ? '0' + epNum : epNum.toString();
            subtitles.push({ "lang": "Vietsub", "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/v" + epStr + ".srt/vtt.css" });
            subtitles.push({ "lang": "Engsub", "url": "https://phimgod.com/api/subtitle/-" + lechVal + "/e" + epStr + ".srt/vtt.css" });
        }

        // Vét thêm phụ đề ẩn trong Iframe này (để phòng web đổi server)
        var dynamicSubs = extractSubtitles(htmlContent);
        dynamicSubs.forEach(function(s) { 
            if (!subtitles.some(function(e) { return e.url === s.url; })) subtitles.push(s); 
        });

        // 1. Quét tìm m3u8/mp4 trần trụi
        var directMatch = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        if (directMatch) {
            var finalUrl = directMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false,
                mimeType: finalUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url },
                subtitles: subtitles
            });
        }
        
        // 2. Tìm API trả về hoặc JS Object có chứa url stream
        if (htmlContent.startsWith('{') || htmlContent.startsWith('[')) {
            try {
                var jData = JSON.parse(htmlContent);
                var jStreamUrl = jData.url || jData.link || jData.file || jData.videoSource || jData.securedLink || "";
                if (jStreamUrl) {
                    return JSON.stringify({
                        url: jStreamUrl,
                        isEmbed: false,
                        mimeType: jStreamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                        headers: { "Referer": url },
                        subtitles: subtitles
                    });
                }
            } catch(e) {}
        }

        // 3. Giải mã JS Packer một lần nữa
        var packMatch = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\).*?)\)/);
        if (packMatch) {
            try {
                var unpacked = eval("(" + packMatch[1] + ")");
                var m3u8Hidden = unpacked.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
                if (m3u8Hidden) {
                    var solvedUrl = m3u8Hidden[1].replace(/\\/g, '');
                    return JSON.stringify({
                        url: solvedUrl,
                        isEmbed: false,
                        mimeType: solvedUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                        headers: { "Referer": url },
                        subtitles: subtitles
                    });
                }
                
                var fireMatch = unpacked.match(/FirePlayer\(\s*["']([^"']+)["']/i);
                if (fireMatch) {
                    var embedId = fireMatch[1];
                    var postUrl = "https://play.streamxemphimhd.site/player/index.php?data=" + embedId + "&do=getVideo";
                    return JSON.stringify({
                        url: postUrl,
                        isEmbed: true,
                        postBody: "hash=" + embedId + "&r=",
                        headers: {
                            "Referer": url,
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Requested-With": "XMLHttpRequest"
                        },
                        subtitles: subtitles
                    });
                }

                var innerIframe = unpacked.match(/<iframe[^>]*src=["']([^"']+)["']/i);
                if (innerIframe) {
                    var nextInnerUrl = innerIframe[1].replace(/\\/g, '');
                    if (nextInnerUrl.indexOf('//') === 0) nextInnerUrl = "https:" + nextInnerUrl;
                    if (lechVal && epVal) {
                        nextInnerUrl += (nextInnerUrl.indexOf('?') > -1 ? '&' : '?') + "lech=" + lechVal + "&ep=" + epVal;
                    }
                    return JSON.stringify({
                        url: nextInnerUrl,
                        isEmbed: true,
                        headers: { "Referer": url },
                        subtitles: subtitles
                    });
                }
            } catch(e) {}
        }

        // 4. Quét thẻ Iframe HTML thông thường
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            var nextUrl2 = iframeMatch[1];
            if (nextUrl2.indexOf('//') === 0) nextUrl2 = "https:" + nextUrl2;
            if (nextUrl2 !== url) {
                if (lechVal && epVal) {
                    nextUrl2 += (nextUrl2.indexOf('?') > -1 ? '&' : '?') + "lech=" + lechVal + "&ep=" + epVal;
                }
                return JSON.stringify({
                    url: nextUrl2,
                    isEmbed: true, 
                    headers: { "Referer": url },
                    subtitles: subtitles
                });
            }
        }

        return JSON.stringify({ url: "", isEmbed: false, subtitles: subtitles });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, subtitles: [] });
    }
}

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
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
