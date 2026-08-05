// =============================================================================
// CẤU HÌNH DOMAIN NARTO DRAMA (NATIVE EXOPLAYER - BỎ HOÀN TOÀN WEBVIEW)
// =============================================================================
var BASEURL = "https://edge.narto-drama.com"; 
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "nartodrama",
        "name": "Phim Ngắn Narto",
        "description": "Bản Native ExoPlayer: Chống quảng cáo triệt để, Vuốt TikTok, Khóa Dọc",
        "version": "2.0.0",
        "info": "Bỏ hoàn toàn WebView, bắt link m3u8 trực tiếp phát bằng ExoPlayer, hỗ trợ vuốt đổi tập.",
        "baseUrl": BASEURL,
        "iconUrl": "https://narto-drama.com/narto-drama-logo-compressed.png",
        "isEnabled": true,
        "type": "shortfilm",           // [QUAN TRỌNG] Kích hoạt giao diện dọc & vuốt TikTok[cite: 1, 2]
        "layoutType": "VERTICAL",      // Ưu tiên bố cục dọc
        "playerType": "exoplayer",     // [QUAN TRỌNG] Dùng exoplayer để phát trực tiếp, không qua webview[cite: 1, 2]
        "subtitleCat": true
    });
}

function log(msg) {
    if(DEV){
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[NartoDrama]: " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[NartoDrama]: " + msg);
        }
    }
}

function getHomeSections() {
    try {
        var sections = [
            { "slug": "/?lang=vi-VN", "title": "Phim Mới", "type": "Grid" },
            { "slug": "/tag/hien-dai?lang=vi-VN&tab-provider=bibishort", "title": "Hiện Đại", "type": "Horizontal" },
            { "slug": "/tag/bao-thu?lang=vi-VN&tab-provider=bibishort", "title": "Báo Thù", "type": "Horizontal" },
            { "slug": "/tag/bi-an-than-phan?lang=vi-VN&tab-provider=bibishort", "title": "Thân Phận Bí Ẩn", "type": "Horizontal" },
        ];
        return JSON.stringify(sections);
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

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;
                    if (pageSearch > 1 && slug.indexOf("page=") === -1) {
                        var sepSearch = slug.indexOf("?") > -1 ? "&" : "?";
                        return slug + sepSearch + "page=" + pageSearch;
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

        var resultUrl = BASEURL;
        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        if (page > 1 && resultUrl.indexOf("page=") === -1) {
            var separator = resultUrl.indexOf("?") > -1 ? "&" : "?";
            resultUrl += separator + "page=" + page;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
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
        var resultUrl = BASEURL + "/search?lang=vi-VN&q=" + encodedKeyword;
        if (page > 1) resultUrl += "&page=" + page;
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + "/search?lang=vi-VN&q=" + encodeURIComponent(keyword || "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

function parseListResponse(html, $url) {
    try {
        var items = [];
        var blocks = html.split('<article');
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            if (block.indexOf('card') === -1) continue;

            var hrefMatch = block.match(/data-watch-url=["']([^"']+)["']/i);
            var titleMatch = block.match(/data-movie-title=["']([^"']+)["']/i);
            var imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
            var epMatch = block.match(/episode-badge[^>]*>([^<]+)/i);

            if (hrefMatch && titleMatch && imgMatch) {
                var href = hrefMatch[1];
                if (href.indexOf("http") == -1) href = BASEURL + href;
                // Chuẩn hóa đường dẫn về trang chi tiết phim gốc
                href = href.replace(/(^[\s\S]*?)\/watch\/[\s\S]*$/i, "$1");
                if (href.indexOf("?lang=") === -1) href += "?lang=vi-VN";

                var src = imgMatch[1];
                if (src.indexOf("http") == -1) src = BASEURL + src;
                var cleanThumb = src.replace(/&amp;/g, '&');

                var title = titleMatch[1].trim();
                var episode_current = epMatch ? epMatch[1].trim() : "";

                items.push({
                    "id": href,
                    "title": title,
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": "HD",
                    "lang": "Vietsub",
                    "episode_current": episode_current
                });
            }
        }
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 999 }
        });
    } catch (e) {
        log("parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// -----------------------------------------------------------------------------
// BÓC TÁCH DANH SÁCH TẬP PHIM ĐỂ HIỂN THỊ NÚT BẤM CHO TỪNG TẬP
// -----------------------------------------------------------------------------
function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        var lname = titleMatch ? titleMatch[1] : "Đang cập nhật...";

        var imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        var limg = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        var ldes = descMatch ? descMatch[1] : "";
        
        var category = "";
        var cats = [];
        var catBlocks = html.split('movie-tag-pill');
        for (var i = 1; i < catBlocks.length; i++) {
            var catText = catBlocks[i].match(/^[^>]*>([^<]+)/);
            if (catText) cats.push(catText[1].trim());
        }
        category = cats.join(" - ");

        var epMatch = html.match(/movie-sub[^>]*>([^<]+)/i);
        var episode_current = epMatch ? epMatch[1].trim() : "";
        
        // Cào tất cả các liên kết tập phim từ trang chi tiết
        var episodes = [];
        var epLinks = html.split('href=');
        var addedSlugs = {};

        for (var j = 1; j < epLinks.length; j++) {
            var linkMatch = epLinks[j].match(/^["']([^"']+\/watch\/[^"']+)["']/i);
            if (linkMatch) {
                var epUrl = linkMatch[1];
                if (epUrl.indexOf("http") === -1) epUrl = BASEURL + epUrl;
                
                // Tránh trùng lặp tập
                if (!addedSlugs[epUrl]) {
                    addedSlugs[epUrl] = true;
                    var epNumMatch = epUrl.match(/\/(\d+)(?:\?|$)/);
                    var epName = epNumMatch ? "Tập " + epNumMatch[1] : "Tập " + (episodes.length + 1);
                    var uniqueSlug = "ep-" + (epNumMatch ? epNumMatch[1] : episodes.length + 1);

                    episodes.push({
                        id: epUrl,
                        name: epName,
                        slug: uniqueSlug // [QUAN TRỌNG] Slug duy nhất giúp tính năng Preload và Vuốt tập hoạt động chính xác[cite: 1, 2]
                    });
                }
            }
        }

        // Dự phòng nếu không tìm thấy link tập
        if (episodes.length === 0) {
            episodes.push({
                id: url,
                name: "Xem Tập 1",
                slug: "ep-1"
            });
        }

        var servers = [{
            name: "Danh Sách Tập (Native Player)",
            episodes: episodes
        }];

        return JSON.stringify({
            id: url, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: 2026,
            rating: 8.5,
            status: "",
            category: category,
            episode_current: episode_current,
            servers: servers, 
            duration: "",
            casts: "",
            director: "",
            extra: "" 
        });

    } catch (e) {
        log("parseMovieDetail:" + e);
        return JSON.stringify({ id: url || "error", title: "Lỗi chi tiết", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// BẮT LINK STREAM TRỰC TIẾP (.M3U8) ĐỂ NÉM CHO EXOPLAYER PHÁT NATIVE
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        
        // 1. Tìm trực tiếp link .m3u8 trong mã nguồn HTML của trang xem tập phim
        var m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[0].replace(/&amp;/g, '&');
        }

        // 2. Nếu trang dùng JSON dữ liệu Next.js hoặc script nhúng
        if (!streamUrl) {
            var jsonScriptMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
            if (jsonScriptMatch) {
                try {
                    var jsonData = JSON.parse(jsonScriptMatch[1]);
                    // Quét tìm chuỗi chứa m3u8 trong JSON
                    var jsonStr = JSON.stringify(jsonData);
                    var parsedM3u8 = jsonStr.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
                    if (parsedM3u8) {
                        streamUrl = parsedM3u8[0].replace(/\\u0026/g, '&').replace(/&amp;/g, '&');
                    }
                } catch(err) {}
            }
        }

        // Nếu vẫn không bắt được link m3u8, đẩy về embed exoplayer backup hoặc trả về url gốc
        if (!streamUrl) {
            streamUrl = url;
        }

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": false, // [QUAN TRỌNG] Bật false để ExoPlayer phát trực tiếp bản Native, chặn đứng mọi loại quảng cáo web
            "mimeType": "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": false, "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"https://edge.narto-drama.com/search?lang=vi-VN&q=l%E1%BB%93ng+ti%E1%BA%BFng\",\"name\":\"Lồng Tiếng\"},{\"link\":\"https://edge.narto-drama.com/search?lang=vi-VN&q=kinh+d%E1%BB%8B\",\"name\":\"Kinh Dị\"},{\"link\":\"https://edge.narto-drama.com/tag/bi-an-than-phan?lang=vi-VN&tab-provider=bibishort\",\"name\":\"Thân Phận Bí Ẩn\"},{\"link\":\"https://edge.narto-drama.com/tag/hien-dai?lang=vi-VN&tab-provider=bibishort\",\"name\":\"Hiện Đại\"},{\"link\":\"https://edge.narto-drama.com/tag/bao-thu?lang=vi-VN&tab-provider=bibishort\",\"name\":\"Báo Thù\"}]`;
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
