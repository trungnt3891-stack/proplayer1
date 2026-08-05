// =============================================================================
// CẤU HÌNH DOMAIN NARTO DRAMA (FIX LỖI HIỆN DANH SÁCH TẬP PHIM)
// =============================================================================
var BASEURL = "https://edge.narto-drama.com"; 
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "nartodrama",
        "name": "Phim Ngắn Narto",
        "description": "Bản WebView VIP: Đã fix lỗi hiện danh sách tập, Auto-Click mở khóa, Khóa dọc",
        "version": "2.1.1",
        "info": "Sử dụng WebView nguyên bản, bắt đúng danh sách tập từ class episode-item.",
        "baseUrl": BASEURL,
        "iconUrl": "https://narto-drama.com/narto-drama-logo-compressed.png",
        "isEnabled": true,
        "type": "shortfilm",           // Kích hoạt chế độ phim ngắn và vuốt tập
        "layoutType": "VERTICAL",      // Ép khung hiển thị dọc
        "playerType": "embed",         // Mở bằng khung WebView để tương thích tuyệt đối với web
        "subtitleCat": false
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
                if (href.indexOf("?lang=") === -1) href += (href.indexOf("?") > -1 ? "&" : "?") + "lang=vi-VN";

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
// [ĐÃ SỬA] BÓC TÁCH CHUẨN XÁC DANH SÁCH TẬP PHIM TỪ CLASS episode-item
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
        
        // Quét toàn bộ danh sách tập dựa trên class="episode-item" và cấu trúc HTML bác gửi
        var episodes = [];
        var parts = html.split('class="episode-item"');
        var addedSlugs = {};

        for (var j = 1; j < parts.length; j++) {
            var part = parts[j];
            var hrefMatch = part.match(/href=["']([^"']+)["']/i);
            var textMatch = part.match(/>([^<]+)<\/a>/i);
            
            if (hrefMatch) {
                var epUrl = hrefMatch[1].replace(/&amp;/g, '&');
                if (epUrl.indexOf("http") === -1) epUrl = BASEURL + epUrl;
                
                if (!addedSlugs[epUrl]) {
                    addedSlugs[epUrl] = true;
                    var epName = textMatch ? textMatch[1].trim() : ("Tập " + (episodes.length + 1));
                    var epNumMatch = epUrl.match(/\/(\d+)(?:\?|$)/);
                    var uniqueSlug = "ep-" + (epNumMatch ? epNumMatch[1] : (episodes.length + 1));

                    episodes.push({
                        id: epUrl,
                        name: epName,
                        slug: uniqueSlug // Slug duy nhất giúp App quản lý tiến trình và vuốt tập chuẩn xác
                    });
                }
            }
        }

        // Dự phòng nếu không tìm thấy thẻ episode-item
        if (episodes.length === 0) {
            episodes.push({
                id: url,
                name: "Xem Tập 1",
                slug: "ep-1"
            });
        }

        var servers = [{
            name: "Danh Sách Tập Phim",
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
// WEBVIEW LOADER: BƠM SCRIPT TỰ ĐỘNG BẤM QUẢNG CÁO, MỞ KHÓA TẬP VÀ KHÓA DỌC
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var autoBypassAndLockPortrait = 
            "var s = document.createElement('style');" +
            "s.innerHTML = 'header, .topbar, .site-footer-wrap, .detail-adsterra-top, .detail-inline-banners, .detail-native-ad, .you-may-like, .detail-seo-block, .share-buttons { display: none !important; } " +
            "body, html { background: #000 !important; overflow-x: hidden !important; }" +
            "video::-webkit-media-controls-fullscreen-button { display: none !important; }';" +
            "document.head.appendChild(s);" +
            
            "setInterval(function() {" +
                "var vids = document.querySelectorAll('video');" +
                "for(var k=0; k<vids.length; k++) {" +
                    "if(!vids[k].hasAttribute('playsinline')) {" +
                        "vids[k].setAttribute('playsinline', 'true');" +
                        "vids[k].setAttribute('webkit-playsinline', 'true');" +
                    "}" +
                "}" +
                
                "var swalBtn = document.querySelector('.swal2-confirm');" +
                "if(swalBtn) { try { swalBtn.click(); } catch(e){} }" +
                
                "var clickables = document.querySelectorAll('button, a, div, span');" +
                "for(var i=0; i<clickables.length; i++) {" +
                    "var txt = (clickables[i].innerText || clickables[i].textContent || '').toLowerCase();" +
                    "if(txt.indexOf('xem quảng cáo') > -1 || txt.indexOf('watch ad') > -1 || txt.indexOf('mở khóa') > -1 || txt.indexOf('unlock') > -1 || txt.indexOf('tiếp tục') > -1 || txt.indexOf('start watching') > -1) {" +
                        "try { clickables[i].click(); } catch(e){}" +
                    "}" +
                "}" +
                
                "var modal = document.getElementById('nd-auth-modal'); if(modal) modal.classList.remove('open');" +
            "}, 400);";

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                "Custom-Js": autoBypassAndLockPortrait
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
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
