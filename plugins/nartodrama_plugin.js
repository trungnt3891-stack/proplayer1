// =============================================================================
// CẤU HÌNH DOMAIN NARTO DRAMA
// =============================================================================
var BASEURL = "https://edge.narto-drama.com"; 
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "nartodrama",
        "name": "Phim Ngắn Narto",
        "description": "Bản Webview: Fix triệt để lỗi 404, Giao diện Tiktok, Auto Click Bỏ Qua Quảng Cáo",
        "version": "1.3.1",
        "info": "Nguồn phim ngắn siêu hay. Đã tối ưu hóa giao diện vuốt Tiktok mượt mà cho iOS.",
        "baseUrl": "https://edge.narto-drama.com",
        "iconUrl": "https://narto-drama.com/narto-drama-logo-compressed.png",
        "isEnabled": true,
        // CẤU HÌNH AUTO XOAY DỌC MÀN HÌNH TIKTOK DƯỚI ĐÂY:
        "type": "shortfilm",         // [ÉP GIAO DIỆN PHIM NGẮN TIKTOK]
        "layoutType": "VERTICAL",    // [ÉP AUTO XOAY DỌC MÀN HÌNH]
        "playerType": "webview",     // [CHUYỂN SANG WEBVIEW ĐỂ TỰ VUỐT]
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

function getHomeSections() {
    try {
        var listurl = '[{\"link\":\"/?lang=vi-VN\",\"name\":\"Phim Mới\"}]';
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

// =============================================================================
// URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
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
            var fixedJson2 = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

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
            var fixedJson = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

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

// =============================================================================
// PARSERS MẠNH MẼ CHO IOS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        // Sử dụng regex bắt thuộc tính để tránh lỗi DOM ảo trên iOS
        var regex = /<article[^>]*data-watch-url=["']([^"']+)["'][^>]*data-movie-title=["']([^"']+)["'][\s\S]*?<img[^>]*src=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var href = match[1].trim();
            var title = match[2].trim();
            var src = match[3].trim();

            if (href.indexOf("http") === -1) {
                href = BASEURL + (href.startsWith('/') ? '' : '/') + href;
            }

            if (src && src.indexOf("http") === -1) {
                src = BASEURL + (src.startsWith('/') ? '' : '/') + src;
            }

            // Dọn dẹp tiêu đề
            title = title.replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
            title = title.replace(/^\(Dubbed\)\s*/i, "").replace(/^\(Dubbing\)\s*/i, "").replace(/^\(Lồng tiếng\)\s*/i, "").trim();

            if (href && title && !seen[href]) {
                items.push({
                    "id": href,
                    "title": title,
                    "posterUrl": src,
                    "backdropUrl": src,
                    "quality": "HD",
                    "lang": "Vietsub",
                    "episode_current": "Full"
                });
                seen[href] = true;
            }
        }
        
        // Cứu cánh bằng _DOM nếu regex không bắt được
        if (items.length === 0) {
            _$(html).find("article.card, a[href*='/detail/']").each(function() {
                var href = this.attr("data-watch-url") || this.attr("href") || this.find("a").attr("href");
                if (!href) return;
                if (href.indexOf("http") == -1) href = BASEURL + (href.startsWith('/') ? '' : '/') + href;
                
                var title = this.attr("data-movie-title") || this.find(".title").text() || this.find("img").attr("alt") || "Phim Mới";
                var src = this.find("img").attr("src") || this.find("img").attr("data-src") || "";
                
                if (src && src.indexOf("http") == -1) src = BASEURL + (src.startsWith('/') ? '' : '/') + src;
                var ep = this.find(".episode-badge").text() || "HD";
                
                if (href && !seen[href]) {
                    items.push({
                        "id": href,
                        "title": title.trim(),
                        "posterUrl": src,
                        "backdropUrl": src,
                        "quality": "HD",
                        "lang": "Vietsub",
                        "episode_current": ep
                    });
                    seen[href] = true;
                }
            });
        }

        var currentPage = 1;
        var pageMatch = $url ? $url.match(/page=(\d+)/) : null;
        if (pageMatch) currentPage = parseInt(pageMatch[1]);

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentPage,
                "totalPages": items.length >= 10 ? currentPage + 1 : currentPage
            }
        });
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, url) {
    try {
        return parseListResponse(html, url);
    } catch (e) {
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

// -----------------------------------------------------------------------------
// CHỈ TRẢ VỀ DUY NHẤT 1 LINK VÀO WEBVIEW, KHÔNG CẮT GHÉP URL ĐỂ TRÁNH LỖI 404
// -----------------------------------------------------------------------------
function parseMovieDetail(html, url) {
    try {
        var rawName = _$(html).find("h1").text() || _$(html).find('meta[property="og:title"]').attr("content") || "Phim Ngắn";
        var lname = rawName.split("-")[0].trim();
        lname = lname.replace(/^\(Dubbed\)\s*/i, "").replace(/^\(Dubbing\)\s*/i, "").replace(/^\(Lồng tiếng\)\s*/i, "").trim();
        
        var limg = _$(html).find('meta[property="og:image"]').attr("content") || "";
        var ldes = _$(html).find(".movie-desc").text() || _$(html).find('meta[property="og:description"]').attr("content") || "Không có mô tả.";
        var category = _$(html).find(".movie-tag-pill").textAll(" - ") || "";
        var episode_current = _$(html).find(".movie-sub").text() || "Đang cập nhật";

        var servers = [];
        servers.push({
            name: "Lướt Tự Động (Webview)",
            episodes: [{
                id: url, // TRUYỀN NGUYÊN BẢN URL LẤY TỪ LIST VÀO ĐÂY
                name: "Bấm vào đây để Xem & Vuốt",
                slug: "webview-player"
            }]
        });

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
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi chi tiết",
            servers: []
        });
    }
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA CHÍNH XÁC: AUTO-CLICK VƯỢT POPUP THAY VÌ ẨN/XÓA DOM GÂY TREO WEB
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var killAdsCssJs = `
            (function() {
                var style = document.createElement('style');
                // CHỈ ẨN CÁC THÀNH PHẦN GIAO DIỆN CỐ ĐỊNH (Header, Footer, Menu, Banner tĩnh)
                // Tuyệt đối KHÔNG ẩn .swal2-container hay popup để tránh lỗi treo web.
                // Ép margin 0, height 100vh để player tràn viền màn hình điện thoại
                style.innerHTML = 'header, .topbar, .topbar-inner, footer, .site-footer-wrap, .site-footer, .desktop-sidebar-left, .desktop-sidebar-right, .player-seo-block, .player-random-section, .watch-history-fab, .share-buttons, .adsense-wrap, .adsense-box, [class*="ad-"], [id*="ad-"], iframe[src*="ads"], .player-subscribe-overlay { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } body, html { margin: 0 !important; padding: 0 !important; background: #000 !important; overflow: hidden !important; height: 100vh !important; } .player-page, .player-shell, .shorts-wrap { margin: 0 !important; padding: 0 !important; max-width: 100% !important; width: 100% !important; height: 100dvh !important; } .shorts-stage { width: 100vw !important; height: 100dvh !important; border-radius: 0 !important; max-width: 100% !important; }';
                document.head.appendChild(style);

                setInterval(function() {
                    // AUTO-CLICKER: Tự động "bấm hộ" user khi nút Đồng ý xuất hiện
                    
                    // 1. Nút của SweetAlert2 (Thông báo quảng cáo trước khi xem)
                    var swalConfirm = document.querySelector('.swal2-confirm');
                    if (swalConfirm) {
                        try { swalConfirm.click(); } catch(e){}
                    }

                    // 2. Nút của popup khác nếu có (Dùng text content để nhận diện)
                    var btns = document.querySelectorAll('button, a, .vast-ad-cta');
                    for (var k = 0; k < btns.length; k++) {
                        var t = btns[k].innerText || btns[k].textContent || '';
                        var tLower = t.toLowerCase();
                        if (tLower.indexOf('đồng ý') > -1 || tLower.indexOf('tiếp tục') > -1 || tLower.indexOf('continue') > -1) {
                            try { btns[k].click(); } catch(e){}
                        }
                    }

                    // Xóa khung đăng nhập làm phiền nếu nó hiện lên (không liên quan đến SweetAlert)
                    var loginPopup = document.querySelector('.nd-auth-modal');
                    if (loginPopup) {
                        loginPopup.remove();
                    }

                }, 200); // Chạy 5 lần mỗi giây để click siêu nhanh
            })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // BẮT BUỘC TRUE ĐỂ MỞ BẰNG GIAO DIỆN TIKTOK CỦA VAX
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

// BỘ DOM ẢO _$ (DỰ PHÒNG CHO VAX)
function _$(htmlOrBlock){ if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(currentHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
