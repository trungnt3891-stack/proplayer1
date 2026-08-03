// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================
var BASEURL = "https://phimhdcss.com";

function getManifest() {
    return JSON.stringify({
        "id": "phimhdcs_short",
        "name": "PhimHDCS Ngắn",
        "description": "Chuyên Phim Ngắn: Chọn tập dễ dàng, Webview ẩn quảng cáo, Bìa siêu nét.",
        "version": "2.1.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "type": "shortfilm",      // [KÍCH HOẠT CHẾ ĐỘ PHIM NGẮN TIKTOK]
        "layoutType": "VERTICAL", // [ÉP AUTO XOAY DỌC MÀN HÌNH]
        "playerType": "webview"   // [CHUYỂN SANG WEBVIEW ĐỂ ẨN RÁC]
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[PhimHDCS_Short] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[PhimHDCS_Short] " + msg);
    }
}

// CHỈ HIỂN THỊ CÁC THƯ MỤC PHIM NGẮN (Category = 38)
function getHomeSections() {
    return JSON.stringify([
        { slug: '/the-loai/phim-ngan', title: 'Phim Ngắn Mới Cập Nhật', type: 'Grid' },
        { slug: '/?filter[category]=38&filter[sort]=view', title: 'Xem Nhiều Nhất', type: 'Horizontal' },
        { slug: '/?filter[category]=38&filter[sort]=create', title: 'Mới Đăng Tải', type: 'Horizontal' },
        { slug: '/?filter[category]=38&filter[language]=Vietsub', title: 'Phim Ngắn Vietsub', type: 'Horizontal' },
        { slug: '/?filter[category]=38&filter[language]=Thuyết+Minh', title: 'Phim Ngắn Thuyết Minh', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Ngắn Mới', slug: '/the-loai/phim-ngan' },
        { name: 'Xem Nhiều Nhất', slug: '/?filter[category]=38&filter[sort]=view' },
        { name: 'Mới Đăng Tải', slug: '/?filter[category]=38&filter[sort]=create' }
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
            var filters = JSON.parse(filtersJson);
            page = parseInt(filters.page) || 1;
        }

        var url = slug.indexOf("http") === 0 ? slug : BASEURL + (slug.startsWith("/") ? "" : "/") + slug;
        if (page > 1) {
            url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return url;
    } catch (e) {
        return BASEURL + "/the-loai/phim-ngan";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try { page = parseInt(JSON.parse(filtersJson).page) || 1; } catch (e) {}
    }
    // Ép luôn luôn tìm kiếm trong thư mục phim ngắn (category=38)
    var url = BASEURL + "/?search=" + encodeURIComponent(keyword).replace(/%20/g, "+") + "&filter[category]=38";
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    var path = slug.startsWith("/") ? slug.substring(1) : slug;
    return BASEURL + "/" + path;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// HTML PARSERS (GIỮ NGUYÊN BỘ LỌC DOM _$ CỦA BẠN ĐỂ LOAD BÌA NÉT CĂNG)
// =============================================================================

function parseListResponse(htmlContent) {
    try {
        var movies = [];
        
        // Quét cấu trúc DOM an toàn thay vì dùng Regex thô
        _$(htmlContent).find("li.item").each(function() {
            var aTag = this.find("a").eq(0);
            if (!aTag.elements.length) return;
            
            var href = aTag.attr("href");
            var title = aTag.attr("title") || this.find(".name").find("a").text();
            var imgTag = aTag.find("img");
            var src = imgTag.attr("src") || imgTag.attr("data-src") || "";
            var label = this.find(".label").text().trim();

            if (href && title && src) {
                if (href.indexOf("http") === -1) href = BASEURL + (href.startsWith("/") ? "" : "/") + href;
                if (src.indexOf("http") === -1) src = BASEURL + (src.startsWith("/") ? "" : "/") + src;

                var cleanThumb = src.replace(/&amp;/g, '&');
                
                var year = 0;
                var yearMatch = /(\d{4})/.exec(title);
                if (yearMatch) year = parseInt(yearMatch[1]);
                
                var episode_current = "";
                var epMatch = /(Tập \d+|Hoàn [tT]ất \(\d+\/\d+\)|Hoàn Tất \(\d+\/\d+\)|Full)/i.exec(label);
                if (epMatch) episode_current = epMatch[1];
                
                var lang = label.replace(episode_current, "").trim();
                if (lang.indexOf("+") === 0) lang = lang.substring(1).trim();

                movies.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": label.indexOf("HD") > -1 ? "HD" : (label.indexOf("Full") > -1 ? "Full" : ""),
                    "episode_current": episode_current || label,
                    "lang": lang,
                    "year": year
                });
            }
        });

        var totalPages = 1;
        var pageRegex = /page=(\d+)"/gi;
        var pMatch;
        while ((pMatch = pageRegex.exec(htmlContent)) !== null) {
            var pNum = parseInt(pMatch[1]);
            if (pNum > totalPages) totalPages = pNum;
        }

        var currentPage = 1;
        var currentMatch = htmlContent.match(/class="current"[^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1]);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalPages * 20,
                itemsPerPage: 20
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

// -----------------------------------------------------------------------------
// [ĐÃ SỬA] KHÔI PHỤC TÍNH NĂNG BÓC TÁCH DANH SÁCH TẬP 
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var title = _$(htmlContent).find("h1").text() || _$(htmlContent).find('meta[property="og:title"]').attr("content") || "";
        title = title.replace(/Phim /gi, "").trim();

        var posterUrl = _$(htmlContent).find('meta[property="og:image"]').attr("content") || "";
        if (!posterUrl) {
            var posterMatch = /<img\s+itemprop="image"\s+src="([^"]+)"/i.exec(htmlContent);
            if (posterMatch) posterUrl = posterMatch[1];
        }
        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = BASEURL + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = _$(htmlContent).find(".tab").text() || _$(htmlContent).find('meta[property="og:description"]').attr("content") || "";
        description = description.replace(/<[^>]*>/g, "").trim();

        var totalEpisodes = _$(htmlContent).find("dt:content('Số tập')").next().text().trim();
        var statusInfo = _$(htmlContent).find("dt:content('Tình trạng')").next().text().trim();

        var servers = [];
        var serverPattern = /<div[^>]*class="server-episode-block"[^>]*>[\s\S]*?Danh sách\s*(?:Sever)?\s*([^:]+):[\s\S]*?<div[^>]*class="list-episode[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        var match;

        // BÓC TÁCH TOÀN BỘ DANH SÁCH TẬP PHIM TỪ WEB ĐỂ ĐƯA VÀO APP
        while ((match = serverPattern.exec(htmlContent)) !== null) {
            var serverName = match[1].trim().replace(/^Server\s+/i, '').replace(/^z/i, '').replace(/\s*#\d+$/, '').trim();
            var episodesHtml = match[2];
            var episodes = [];
            
            var epPattern = /<a\s+href="([^"]+)"[\s\S]*?title="([^"]+)"/gi;
            var epMatch;
            while ((epMatch = epPattern.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1];
                if (epUrl.indexOf('http') === -1) epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;

                episodes.push({
                    id: epUrl, // ID tập phim sẽ truyền sang parseDetailResponse khi user nhấn chọn
                    name: epMatch[2].trim().replace(/Phim /i, ""),
                    slug: epUrl
                });
            }
            if (episodes.length > 0) {
                var firstMatch = /Tập\s+(\d+)/i.exec(episodes[0].name);
                var lastMatch = /Tập\s+(\d+)/i.exec(episodes[episodes.length - 1].name);
                if (firstMatch && lastMatch && parseInt(firstMatch[1]) > parseInt(lastMatch[1])) {
                    episodes.reverse();
                } else if (!firstMatch) {
                    episodes.reverse(); 
                }
                servers.push({ name: serverName, episodes: episodes });
            }
        }
        
        // Cứu cánh nếu web không hiện tập
        if (servers.length === 0) {
            var watchLink = url;
            var btnPlayMatch = htmlContent.match(/class=["'][^"']*btn-see[^"']*["'][^>]*href=["']([^"']+)["']/i);
            if (btnPlayMatch) watchLink = btnPlayMatch[1];
            if (watchLink.indexOf('http') === -1) watchLink = BASEURL + (watchLink.startsWith('/') ? '' : '/') + watchLink;

            servers.push({
                name: "Server Mặc Định",
                episodes: [{ id: watchLink, name: "Tập 1", slug: "tap-1" }]
            });
        }

        var fullDesc = description;
        if (totalEpisodes) fullDesc += "\nSố tập: " + totalEpisodes;
        if (statusInfo) fullDesc += "\nTình trạng: " + statusInfo;

        return JSON.stringify({
            id: url || BASEURL,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: fullDesc,
            year: 2026,
            rating: 8.5,
            quality: "HD",
            servers: servers, // Trả về danh sách tập cho App
            episode_current: statusInfo || "Full",
            lang: "Vietsub / TM",
            category: "Phim Ngắn"
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết phim", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// [MỚI] PARSE DETAIL RESPONSE (TIÊM CODE CHẶN QUẢNG CÁO GIAO DIỆN WEB)
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, pageUrl) {
    try {
        var killAdsCssJs = `
            (function() {
                var style = document.createElement('style');
                // Ép ẩn header, footer, sidebar, ads, comment, rác
                // ẨN LUÔN LIST TẬP TRONG WEB (vì App đã tự hiển thị để chọn)
                style.innerHTML = 'header, #header, nav, footer, #footer, .right-content, .sidebar, .comments, .box-rating, .box-comment, .film-info, .breadcrumb, .tags, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, #catfish, #catfish_content, #hide_catfish, .alert, .server-episode-block, .list-episode { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } ' +
                'body, html { margin: 0 !important; padding: 0 !important; background: #000 !important; } ' +
                '.main-content, #content, .container, .left-content, .block-wrapper { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; background: #000 !important; } ' +
                '.player-wrapper, #player { width: 100vw !important; margin-top: 0 !important; }';
                document.head.appendChild(style);

                // Tự động tắt nút Đóng quảng cáo hoặc Popup bay lơ lửng
                setInterval(function() {
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"], #hide_catfish a');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);
            })();
        `;

        var fixedScript = killAdsCssJs.replace(/\r/g, "").replace(/\n/g, " ").replace(/\t/g, "  ").trim();

        // Trả về url của tập phim mà user chọn. Webview sẽ load trang đó với CSS ẩn rác.
        return JSON.stringify({
            "url": pageUrl,
            "isEmbed": true, // BẮT BUỘC: Ép App mở Webview để tự do lướt tập
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": BASEURL + "/",
                "Custom-Js": fixedScript
            },
            "subtitles": []
        });
    } catch (error) {
        return JSON.stringify({ "url": pageUrl, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// THƯ VIỆN BỔ TRỢ DOM ẢO (_$) - CHỐNG LỖI XUỐNG DÒNG CỦA HTML
// =============================================================================
function _$(htmlOrBlock){ if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'([^']*)'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
