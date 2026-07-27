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
        "description": "Bản Fix Master: Vuốt dọc TikTok chuẩn, Bắt đúng link từng tập, Chơi trực tiếp AVPlayer",
        "version": "3.2.0",
        "info": "Phim ngắn chia thành nhiều tập. Vuốt lên/xuống để qua tập và xem bằng chiều dọc.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/narto-drama-logo-compressed.png",
        "isEnabled": true,
        "hasLogin": true,
        "loginUrl": BASEURL + "?lang=vi-VN",
        "type": "shortfilm",           // BẮT BUỘC ĐỂ BẬT TÍNH NĂNG VUỐT DỌC
        "layoutType": "VERTICAL",      // ÉP AUTO XOAY DỌC MÀN HÌNH
        "playerType": "exoplayer"      // KHÔNG SỬ DỤNG AUTO HAY WEBVIEW NỮA
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

            if (href && title && !seen[href]) {
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": poster,
                    "backdropUrl": poster,
                    "quality": "HD",
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

// BƯỚC 1: XÂY DỰNG ID CHUẨN XÁC CHO TỪNG TẬP (Có biến ?tap=X)
function parseMovieDetail(html, url) {
    try {
        var lname = _$(html).find("h1").text() || _$(html).find('meta[property="og:title"]').attr("content").split("-")[0].trim();
        
        var limg = "";
        var ogImg = _$(html).find('meta[property="og:image"]').attr("content");
        if (ogImg) limg = ogImg;
        if (!limg) {
            var posterEl = _$(html).find(".poster");
            limg = posterEl.attr("src") || posterEl.attr("data-src") || "";
        }
        if (!limg) {
            var imgMatch = html.match(/"image"\s*:\s*"([^"]+)"/i) || html.match(/"cover"\s*:\s*"([^"]+)"/i);
            if (imgMatch) limg = imgMatch[1];
        }

        if (limg) {
            if (limg.indexOf("/_next/image?url=") !== -1) {
                var m = limg.match(/url=([^&]+)/);
                if (m) limg = decodeURIComponent(m[1]);
            }
            if (limg.indexOf('http') !== 0) {
                limg = BASEURL + (limg.startsWith('/') ? '' : '/') + limg;
            }
        }

        var ldes = _$(html).find(".movie-desc").text() || _$(html).find('meta[property="og:description"]').attr("content");

        // Dọn dẹp URL gốc (xóa số tập cũ nếu có) để lấy Base path chuẩn
        var cleanUrl = url.split('?')[0]; 
        if (cleanUrl.match(/\/\d+$/)) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.lastIndexOf('/'));
        }
        var queryStr = url.indexOf('?') !== -1 ? url.substring(url.indexOf('?')) : "";
        var sep = queryStr ? "&" : "?"; 

        var items = [];
        var seenEps = {};
        
        function addEpisode(epNum) {
            if (!seenEps[epNum]) {
                // ÉP ID LUÔN CÓ ĐỊNH DẠNG ".../phim/5?lang=vi&tap=5" ĐỂ TRÁNH LỖI KẸT TẬP
                var epUrl = cleanUrl + "/" + epNum + queryStr + sep + "tap=" + epNum;
                if (epUrl.indexOf('http') !== 0) {
                    epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
                }
                items.push({
                    id: epUrl, 
                    name: epNum === 0 ? "Trailer / Tập 0" : "Tập " + epNum,
                    slug: "tap-" + epNum
                });
                seenEps[epNum] = true;
            }
        }

        // Ưu tiên 1: Lấy danh sách từ mảng JSON nội bộ
        var scriptMatch = html.match(/const\s+episodeItemsUnlocked\s*=\s*(\[[\s\S]*?\]);/i);
        if (scriptMatch && scriptMatch[1]) {
            try {
                var episodes = JSON.parse(scriptMatch[1]);
                for (var i = 0; i < episodes.length; i++) {
                    var epNum = episodes[i].number || episodes[i].route_episode_number || (i + 1);
                    addEpisode(epNum);
                }
            } catch (err) {}
        }

        // Ưu tiên 2: Lấy từ NextJS Data
        if (items.length === 0) {
            var nextDataMatch = html.match(/id="__NEXT_DATA__"[^>]*>(\{.*?\})<\/script>/i);
            if (nextDataMatch) {
                try {
                    var strData = JSON.stringify(JSON.parse(nextDataMatch[1]));
                    var epNumRegex = /"route_episode_number"\s*:\s*(\d+)/gi;
                    var pm;
                    while ((pm = epNumRegex.exec(strData)) !== null) {
                        addEpisode(parseInt(pm[1]));
                    }
                } catch (e) {}
            }
        }

        // Dự phòng 3: Bóc từ DOM
        if (items.length === 0) {
            var epLinks = _$(html).find(".episode-item, .ep-item, [class*='episode']").elements;
            for (var j = 0; j < epLinks.length; j++) {
                var epText = _$(epLinks[j]).text().trim();
                var numMatch = epText.match(/\d+/);
                var fallbackNum = numMatch ? parseInt(numMatch[0]) : (j + 1);
                addEpisode(fallbackNum);
            }
        }

        // Nếu mọi cách đều xịt, giả định có 1 tập
        if (items.length === 0) {
            addEpisode(1);
        }

        // Sắp xếp lại từ bé đến lớn
        items.sort(function(a, b) {
            var numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            var numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        var servers = [{ name: "Narto Drama VIP", episodes: items }];

        return JSON.stringify({
            id: url,
            title: lname || "Phim Ngắn",
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: 2026,
            rating: 8.0,
            status: items.length + " Tập",
            category: "Phim Ngắn",
            episode_current: items.length + " Tập",
            servers: servers,
            duration: "",
            casts: "",
            director: ""
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

// BƯỚC 2: SO KHỚP SỐ TẬP ĐỂ LẤY ĐÚNG M3U8, KHÓA CHẶT isEmbed = false
function parseDetailResponse(html, url) {
    try {
        // Tách lấy đúng số tập (tap=X) do mình đã tự gài vào URL ở Bước 1
        var matchEp = url.match(/tap=(\d+)/i);
        var currentEp = matchEp ? parseInt(matchEp[1]) : 1;
        var streamUrl = "";
        
        // CÁCH 1: Tìm đúng tập đó trong mảng JSON 
        var scriptMatch = html.match(/const\s+episodeItemsUnlocked\s*=\s*(\[[\s\S]*?\]);/i);
        if (scriptMatch && scriptMatch[1]) {
            try {
                var episodes = JSON.parse(scriptMatch[1]);
                for (var i = 0; i < episodes.length; i++) {
                    var ep = episodes[i];
                    var epNum = ep.number || ep.route_episode_number || (i + 1);
                    // Chỉ lấy m3u8 nếu KHỚP ĐÚNG con số của tập người dùng vừa bấm
                    if (epNum == currentEp && (ep.play_url || ep.direct_play_url)) {
                        streamUrl = ep.play_url || ep.direct_play_url;
                        break;
                    }
                }
            } catch(e){}
        }

        // CÁCH 2: Tìm trong mảng của NextJS
        if (!streamUrl) {
            var nextDataMatch = html.match(/id="__NEXT_DATA__"[^>]*>(\{.*?\})<\/script>/i);
            if (nextDataMatch) {
                try {
                    var nextData = JSON.parse(nextDataMatch[1]);
                    var epList = nextData.props.pageProps.detail.episodeItems || nextData.props.pageProps.episodeItems || [];
                    for (var j = 0; j < epList.length; j++) {
                        var epp = epList[j];
                        var eppNum = epp.number || epp.route_episode_number || (j + 1);
                        if (eppNum == currentEp && (epp.play_url || epp.direct_play_url)) {
                            streamUrl = epp.play_url || epp.direct_play_url;
                            break;
                        }
                    }
                } catch(e){}
            }
        }

        // CÁCH 3: Quét mù m3u8 (dự phòng)
        if (!streamUrl) {
            var decodedHtml = html.replace(/\\u([\d\w]{4})/gi, function (m, grp) {
                return String.fromCharCode(parseInt(grp, 16));
            }).replace(/\\/g, "");

            var m3u8Match = decodedHtml.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
            if (m3u8Match) {
                streamUrl = m3u8Match[1];
            } else {
                var mp4Match = decodedHtml.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
                if (mp4Match) streamUrl = mp4Match[1];
            }
        }

        // ÉP APP DÙNG TRÌNH PHÁT NATIVE (isEmbed: false) ĐỂ HOẠT ĐỘNG VỚI TÍNH NĂNG VUỐT DỌC
        if (streamUrl) {
            return JSON.stringify({
                "url": streamUrl,
                "isEmbed": false, 
                "mimeType": "application/x-mpegURL",
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "subtitles": []
            });
        }

        // Nếu xui xẻo không bắt được link, trả về rỗng và cũng không dùng Webview để khỏi hư Layout dọc
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });

    } catch (e) {
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// BỘ DOM ẢO _$ (CHUẨN VAX) - Giữ nguyên tuyệt đối phần Core
// =============================================================================
function _$(htmlOrBlock){ 
	if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { var isClose = match[1] === '/'; var fullMatched = match[0]; if (isClose) { depth--; } else if (fullMatched.indexOf('/>') === -1) { depth++; } if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } if (depth > 0) { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
