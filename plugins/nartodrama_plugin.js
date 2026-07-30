// =============================================================================
// CẤU HÌNH DOMAIN NARTO DRAMA
// =============================================================================
var BASEURL = "https://edge.narto-drama.com"; 
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "nartodrama",
        "name": "Phim Ngắn Narto",
        "description": "Bản Tốc Độ Bàn Thờ: Fix lỗi không load Player, Thêm mục Trang chủ, Fix Tìm kiếm",
        "version": "1.4.1",
        "info": "Tối ưu tốc độ load gấp 10 lần. Mở thẳng giao diện Webview bằng playerType embed chuẩn.",
        "baseUrl": "https://edge.narto-drama.com",
        "iconUrl": "https://narto-drama.com/narto-drama-logo-compressed.png",
        "isEnabled": true,
        "type": "shortfilm",         
        "layoutType": "VERTICAL",    
        "playerType": "embed",       // ĐÃ FIX: Bắt buộc dùng "embed" thay vì "webview" để App mở được Player
        "subtitleCat": true
    })
};

function log(msg) {
    if(DEV){
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
        }
    }
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA: ĐƯA NHIỀU DANH MỤC RA TRANG CHỦ THEO YÊU CẦU
// -----------------------------------------------------------------------------
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
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
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

        if (page > 1) {
            resultUrl += "&page=" + page;
        }

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

// -----------------------------------------------------------------------------
// ĐÃ THÊM: PARSER TÌM KIẾM VÀ DANH SÁCH TỐI ƯU (BẮT data-watch-url)
// -----------------------------------------------------------------------------
function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        // Quét nhanh bằng Regex: tìm data-watch-url và data-movie-title cho cả Trang chủ và Tìm kiếm
        var regex = /data-watch-url\s*=\s*["']([^"']+)["'][^>]*data-movie-title\s*=\s*["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var href = match[1];
            var title = match[2];

            if (href.indexOf("http") == -1) href = BASEURL + href;
            href = href.replace(/(^[\s\S]*?)\?[\s\S]*$/i, "$1/1?lang=vi-VN");

            // Cắt đoạn nhỏ phía sau để lấy ảnh và tập phim
            var subHtml = html.substring(match.index, match.index + 500);
            
            var imgMatch = subHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
            var src = imgMatch ? imgMatch[1] : "";
            if (src && src.indexOf("http") == -1) src = BASEURL + src;
            var cleanThumb = src.replace(/&amp;/g, '&');

            var epMatch = subHtml.match(/episode-badge[^>]*>([^<]+)/i);
            var episode_current = epMatch ? epMatch[1].trim() : "";

            if (href.indexOf("watch/") > -1 && !seen[href]) {
                seen[href] = true;
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": "HD",
                    "lang": "",
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
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

// Search Response gọi thẳng List Response đã tối ưu
function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// -----------------------------------------------------------------------------
// GIỮ NGUYÊN HÀM CHI TIẾT TẠO 1 NÚT BẤM WEBVIEW CỦA BẠN
// -----------------------------------------------------------------------------
function parseMovieDetail(html, url) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");

        var limg = "";
        var lname = "Đang cập nhật...";
        var ldes = "Không có mô tả.";
        var category = "";
        var episode_current = "";

        var rmatch = html.match(/meta\s+property="og:url"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lurl = rmatch[1];

        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];

        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];

        rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];
        
        // Quét thể loại
        var catRegex = /class=["'][^"']*movie-tag-pill[^"']*["'][^>]*>([^<]+)/gi;
        var cats = [];
        var cM;
        while ((cM = catRegex.exec(html)) !== null) {
            cats.push(cM[1].trim());
        }
        category = cats.join(" - ");

        // Quét số tập
        var epMatch = html.match(/class=["'][^"']*movie-sub[^"']*["'][^>]*>([^<]+)/i);
        if (epMatch) {
            episode_current = epMatch[1].trim();
        }
        
        // Trả về 1 tập duy nhất gọi là "Lướt Tự Động" chứa URL xem trực tiếp
        var servers = [];
        servers.push({
            name: "Lướt Tự Động (Webview)",
            episodes: [{
                id: url, // TRUYỀN NGUYÊN GỐC ĐƯỜNG LINK VÀO WEBVIEW
                name: "Bấm vào đây để Xem & Vuốt",
                slug: "webview-player"
            }]
        });

        return JSON.stringify({
            id: id, 
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
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi chi tiết",
            servers: []
        });
    }
}

// -----------------------------------------------------------------------------
// GIỮ NGUYÊN BỘ AUTO-CLICK VƯỢT QUẢNG CÁO CỦA BẠN
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var killAdsCssJs = `
            (function() {
                var style = document.createElement('style');
                style.innerHTML = 'header, .topbar, .topbar-inner, footer, .site-footer-wrap, .site-footer, .desktop-sidebar-left, .desktop-sidebar-right, .player-seo-block, .player-random-section, .watch-history-fab, .share-buttons, .adsense-wrap, .adsense-box, [class*="ad-"], [id*="ad-"], iframe[src*="ads"], .player-subscribe-overlay { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { background: #000 !important; }';
                document.head.appendChild(style);

                setInterval(function() {
                    var swalConfirm = document.querySelector('.swal2-confirm');
                    if (swalConfirm) {
                        try { swalConfirm.click(); } catch(e){}
                    }
                    var btns = document.querySelectorAll('button, a, .vast-ad-cta');
                    for (var k = 0; k < btns.length; k++) {
                        var t = btns[k].innerText || btns[k].textContent || '';
                        var tLower = t.toLowerCase();
                        if (tLower.indexOf('đồng ý') > -1 || tLower.indexOf('tiếp tục') > -1 || tLower.indexOf('continue') > -1) {
                            try { btns[k].click(); } catch(e){}
                        }
                    }
                    var loginPopup = document.querySelector('.nd-auth-modal');
                    if (loginPopup) loginPopup.remove();
                    var authBackdrop = document.querySelector('.nd-auth-backdrop');
                    if (authBackdrop) authBackdrop.remove();
                }, 300);
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Ép Webview hoạt động (kết hợp với playerType: embed)
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
                "Custom-Js": killAdsCssJs.trim()
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({
            "url": url,
            "isEmbed": true,
            "headers": {}
        });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
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
