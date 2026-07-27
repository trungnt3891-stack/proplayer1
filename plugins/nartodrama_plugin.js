// =============================================================================
// CẤU HÌNH DOMAIN NARTO DRAMA
// =============================================================================
var MAIN_DOMAIN = "edge.narto-drama.com"; 
var BASEURL = "https://" + MAIN_DOMAIN; 
var BASEAPI = BASEURL;

function getManifest() {
    return JSON.stringify({
        "id": "narto_drama",
        "name": "Narto Drama",
        "description": "Bản Fix Master: Thuật toán API từ Android, Link chuẩn 100%, Xoay dọc TikTok, Bỏ Popup",
        "version": "3.5.0",
        "info": "Phim ngắn chia thành nhiều tập. Vuốt lên/xuống để qua tập và xem bằng chiều dọc.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/narto-drama-logo-compressed.png",
        "isEnabled": true,
        "hasLogin": true,
        "loginUrl": BASEURL + "?lang=vi-VN",
        "type": "shortfilm",           // BẬT CHẾ ĐỘ PHIM NGẮN
        "layoutType": "VERTICAL",      // ÉP AUTO XOAY DỌC
        "playerType": "embedtoexoplay" // TỪ KHÓA BẮT BUỘC TRÊN IOS ĐỂ DỰNG KHUNG TIKTOK
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[nartodrama] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[nartodrama] " + msg);
    }
}

// =============================================================================
// DANH MỤC TRANG CHỦ & MENU
// =============================================================================
function getHomeSections() {
    return JSON.stringify([
        { "slug": "?lang=vi-VN", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "/tag/tong-tai?lang=vi-VN", "title": "Tổng Tài", "type": "Horizontal" },
        { "slug": "/tag/bao-thu?lang=vi-VN", "title": "Báo Thù", "type": "Horizontal" },
        { "slug": "/tag/xuyen-khong?lang=vi-VN", "title": "Xuyên Không", "type": "Horizontal" },
        { "slug": "/tag/tinh-tay-ba?lang=vi-VN", "title": "Tình Tay Ba", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Trang Chủ", "slug": "?lang=vi-VN" },
        { "name": "Phim & Loạt Phim", "slug": "?lang=vi-VN&type=movie-series" },
        { "name": "Anime", "slug": "?lang=vi-VN&type=anime" },
        { "name": "Featured", "slug": "/featured?lang=vi-VN" },
        { "name": "Tổng Tài", "slug": "/tag/tong-tai?lang=vi-VN" },
        { "name": "Báo Thù", "slug": "/tag/bao-thu?lang=vi-VN" },
        { "name": "Xuyên Không", "slug": "/tag/xuyen-khong?lang=vi-VN" },
        { "name": "Tình Tay Ba", "slug": "/tag/tinh-tay-ba?lang=vi-VN" },
        { "name": "Phản Công", "slug": "/tag/phan-cong?lang=vi-VN" },
        { "name": "CEO", "slug": "/tag/ceo?lang=vi-VN" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "?lang=vi-VN";

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
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

        var resultUrl = "";
        if (path.indexOf("http") === 0) {
            resultUrl = path;
        } else {
            resultUrl = BASEURL + (path.startsWith('/') ? path : '/' + path);
        }

        if (page > 1) {
            var sep = resultUrl.indexOf("?") > -1 ? "&" : "?";
            resultUrl += sep + "page=" + page;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        return BASEURL + "?lang=vi-VN";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/search?q=" + encodeURIComponent(keyword) + "&lang=vi-VN";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + (slug.startsWith('/') ? slug : '/' + slug);
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================
function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        var cardBlocks = _$(html).find("article.card, a[href*='/detail/watch/']").elements;
        
        for (var i = 0; i < cardBlocks.length; i++) {
            var block = _$(cardBlocks[i]);
            var href = block.attr("href") || block.attr("data-watch-url") || block.find("a").attr("href") || "";
            if (!href) continue;
            if (href.indexOf('http') !== 0) href = BASEURL + (href.startsWith('/') ? '' : '/') + href;

            var imgTag = block.find("img");
            var poster = imgTag.attr("src") || imgTag.attr("data-src") || imgTag.attr("data-lazy-src") || "";
            
            if (poster) {
                if (poster.indexOf("/_next/image?url=") !== -1) {
                    var m = poster.match(/url=([^&]+)/);
                    if (m) poster = decodeURIComponent(m[1]);
                }
                if (poster.indexOf('http') !== 0) {
                    poster = BASEURL + (poster.startsWith('/') ? '' : '/') + poster;
                }
            }

            var title = block.find(".title").text() || imgTag.attr("alt") || block.text() || "";
            var episode_current = block.find(".episode-badge").text() || "Full";

            if (href && title && !seen[href]) {
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": poster,
                    "backdropUrl": poster,
                    "quality": "HD",
                    "episode_current": episode_current,
                    "lang": "Vietsub"
                });
                seen[href] = true;
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": items.length > 0 ? 99 : 1 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// BƯỚC 1: XÂY DỰNG ID BẰNG ĐƯỜNG DẪN API TRỰC TIẾP (THUẬT TOÁN TỪ ANDROID)
function parseMovieDetail(html, url) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
                      /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");

        var lname = _$(html).find("h1").text() || _$(html).find('meta[property="og:title"]').attr("content").split("-")[0].trim();
        var limg = _$(html).find('meta[property="og:image"]').attr("content") || "";
        var ldes = _$(html).find(".movie-desc").text() || _$(html).find('meta[property="og:description"]').attr("content") || "";

        // Trích xuất slug chuẩn xác giống thuật toán Android
        var urlmatch = "";
        if (id.indexOf("/detail/watch/") > -1) {
            urlmatch = id.match(/(?<=\/watch\/)[^/]+/i);
            if(urlmatch && urlmatch[0]) {
                urlmatch[0] = "watch/" + urlmatch[0].replace(/\/(\d+)$/g, "");
            }
        } else if(id.indexOf("/detail/") > -1) {
            urlmatch = id.match(/(?<=\/detail\/)[^?]+/i);
            if(urlmatch && urlmatch[0]) {
                urlmatch[0] = urlmatch[0].replace(/\/(\d+)$/g, "");
            }
        }
        var slug = (urlmatch && urlmatch[0]) ? urlmatch[0] : "";

        var rawScript = _$(html).find('script:content("episodeItemsRaw = [{")').html();
        if(!rawScript) rawScript = html; 

        var episodesMatch = rawScript.match(/(?:const|let|var)\s+episodeItemsRaw\s*=\s*(\[[\s\S]*?\])(?:;|\n|$)/i);
        var objEpi = [];
        if (episodesMatch && episodesMatch[1]) {
            try { objEpi = JSON.parse(episodesMatch[1]); } catch(e){}
        }

        var items = [];
        var servers = [];
        
        // Tạo ID là đường link tới API Refresh-Source
        if (slug && objEpi.length > 0) {
            for (var j = 0; j < objEpi.length; j++) {
                var movie = objEpi[j];
                var number = movie.number || movie.route_episode_number;
                // Đây là "Chìa khóa vàng": Ghép API link để hàm parseDetailResponse tải JSON
                var link = BASEURL + "/e/rs/detail/" + slug + "/" + number + "/refresh-source?lang=vi-VN&force=1";

                items.push({
                    id: link,
                    name: "Tập " + number,
                    slug: "tap-" + number
                });
            }
        }

        if(items.length > 0) {
            servers.push({
                name: "Narto Drama VIP",
                episodes: items
            });
        }

        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: 2026,
            status: items.length > 0 ? items.length + " Tập" : "Đang cập nhật",
            category: "Phim Ngắn",
            servers: servers,
            // Bảo hiểm 2 lớp để ép VAX xoay dọc
            type: "shortfilm",
            layoutType: "VERTICAL"
        });

    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

// BƯỚC 2: PHÂN TÍCH FILE JSON DO API TRẢ VỀ (CHÍNH XÁC 100% LINK MEDIA CỦA TẬP ĐÓ)
function parseDetailResponse(html, url) {
    try {
        // html lúc này không phải trang web, mà là kết quả JSON thuần của API!
        var objMv = JSON.parse(html);
        var rawStream = objMv.direct_play_url || objMv.play_url || "";
        var subtitle = objMv.direct_subtitle_url || objMv.subtitle_url || "";
        
        if (!rawStream) {
            throw new Error("Không tìm thấy link stream");
        }

        var lowerStream = rawStream.toLowerCase();
        var mimeType = "application/x-mpegURL";
        var finalStreamUrl = rawStream;

        // Ép định dạng giống Android để ExoPlayer/AVPlayer đọc trơn tru
        if (lowerStream.includes(".mp4")) {
            mimeType = "video/mp4";
            if (!finalStreamUrl.endsWith("#.m3u8")) {
                finalStreamUrl += "#.m3u8";
            }
        } 
        else if (!lowerStream.includes(".m3u8")) {
            mimeType = "application/x-mpegURL";
            if (!finalStreamUrl.endsWith("#.m3u8")) {
                finalStreamUrl += "#.m3u8";
            }
        }

        var listsub = [];
        if (subtitle) {
            if (!subtitle.startsWith("http://") && !subtitle.startsWith("https://")) {
                if (!subtitle.startsWith("/")) subtitle = "/" + subtitle;
                subtitle = BASEURL + subtitle;
            }
            listsub.push({
                "lang": "Vietsub",
                "url": subtitle,
                "mimeType": "text/vtt"
            });
        }

        // isEmbed: false => ÉP PHÁT BẰNG TRÌNH PHÁT GỐC (Trực tiếp tiêu diệt Popup quảng cáo)
        return JSON.stringify({
            "url": finalStreamUrl,
            "isEmbed": false,
            "mimeType": mimeType,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": listsub
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// BỘ DOM ẢO _$ (CHUẨN VAX)
// =============================================================================
function _$(htmlOrBlock){ 
	if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = currentHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
