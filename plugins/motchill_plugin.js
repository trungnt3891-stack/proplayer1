// =============================================================================
// CẤU HÌNH DOMAIN MOTCHILL
// =============================================================================
var MAIN_DOMAIN = "motchillw.blue"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

function getManifest() {
    return JSON.stringify({
        "id": "motchill_ios",
        "name": "Motchill iOS",
        "description": "Bản Master cho iOS: Parse JSON Next.js, Bắt m3u8 trực tiếp, Chặn 100% Quảng Cáo",
        "version": "1.0.0",
        "info": "Plugin bóc tách dữ liệu JSON cực nhanh. Không dùng Webview giúp chặn tuyệt đối Popup.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "HORIZONTAL",
        "playerType": "embedtoexoplay" // Ép hệ thống ưu tiên link m3u8 trực tiếp
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchill_ios] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchill_ios] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "danh-sach/phim-bo", "title": "Phim Bộ Mới", "type": "Horizontal" },
        { "slug": "danh-sach/phim-le", "title": "Phim Lẻ Mới", "type": "Horizontal" },
        { "slug": "the-loai/hoat-hinh", "title": "Hoạt Hình - Anime", "type": "Horizontal" },
        { "slug": "quoc-gia/han-quoc", "title": "Phim Hàn Quốc", "type": "Horizontal" },
        { "slug": "quoc-gia/trung-quoc", "title": "Phim Trung Quốc", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
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
        var path = slug || "";

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
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':'));
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    var resultUrl = BASEURL + "/search?q=" + encodeURIComponent(keyword);
    if (page > 1) resultUrl += "&page=" + page;
    return resultUrl;
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
// PARSERS MẠNH MẼ CHO IOS (KHÔNG DÙNG REGEX LOOKBEHIND)
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        var doc = _$(html);
        
        // Cào dữ liệu theo class hiển thị giao diện của Motchill
        doc.find("div.movie-card, div.group.relative.overflow-hidden").each(function() {
            var aTag = this.find("a");
            var href = aTag.attr("href");
            if (!href) return;

            if (href.indexOf('http') !== 0) {
                href = BASEURL + (href.startsWith('/') ? '' : '/') + href;
            }

            var imgTag = this.find("img");
            var poster = imgTag.attr("src") || imgTag.attr("data-src") || "";
            if (poster.indexOf('http') !== 0 && poster !== "") {
                poster = BASEURL + (poster.startsWith('/') ? '' : '/') + poster;
            }

            var title = this.find("h3").text() || aTag.attr("title") || imgTag.attr("alt") || "";
            title = title.trim();

            var epCurrent = "HD";
            var bottomBadge = this.find("div.absolute.bottom-1").text();
            var topBadge = this.find("span.bg-orange-500").text() || this.find("span.bg-yellow-500").text();

            if (bottomBadge) {
                epCurrent = bottomBadge.trim();
            } else if (topBadge) {
                epCurrent = topBadge.trim();
            }

            if (href && title && !seen[href]) {
                items.push({
                    "id": href,
                    "title": title,
                    "posterUrl": poster,
                    "backdropUrl": poster,
                    "quality": "HD",
                    "episode_current": epCurrent,
                    "lang": "Vietsub"
                });
                seen[href] = true;
            }
        });

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
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// BÓC TÁCH JSON ẨN ĐỂ LẤY SẠCH LINK .M3U8 (Vượt Qua Hoàn Toàn Giai Đoạn Webview)
function parseMovieDetail(html, url) {
    try {
        var doc = _$(html);
        var title = doc.find("h1").text().trim() || "Phim Mới";
        
        var poster = doc.find("img.object-cover").attr("src") || "";
        if (poster && poster.indexOf('http') !== 0) poster = BASEURL + poster;

        var desc = doc.find(".prose.prose-invert").text() || "Đang cập nhật...";

        var category = [];
        doc.find("a[href*='/the-loai/'] span").each(function() {
            category.push(this.text().trim());
        });

        var serversMap = {};
        
        // Lột sạch HTML escape để chuẩn hóa chuỗi JSON của Next.js
        var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        
        // Quét tìm mảng "episodes" ẩn sâu bên trong Script
        var epsMatch = cleanHtml.match(/"episodes":\[(.*?)\]/);
        
        if (epsMatch && epsMatch[1]) {
            var epsStr = epsMatch[1];
            // Quét từng đối tượng tập phim (Tránh lỗi lookbehind trên iOS)
            var epObjRegex = /{"id":"[^"]+","movie_id":"[^"]+","server":"([^"]+)","name":"([^"]+)","slug":"([^"]+)","type":"([^"]+)","link":"([^"]+)"/g;
            var epM;
            while ((epM = epObjRegex.exec(epsStr)) !== null) {
                var serverName = epM[1];
                var epName = epM[2];
                var type = epM[4];
                var link = epM[5];

                if (!serversMap[serverName]) serversMap[serverName] = [];

                if (link.indexOf("/") === 0) {
                    link = BASEURL + link;
                }

                // Gắn cờ phía sau URL để hàm parseDetailResponse biết cần làm gì
                var finalLink = link;
                if (type === "m3u8") {
                    finalLink += "#m3u8";
                } else if (type === "embed") {
                    finalLink += "#embed";
                }

                serversMap[serverName].push({
                    name: (epName.toLowerCase().indexOf("tập") === -1 && epName.toLowerCase().indexOf("full") === -1) ? "Tập " + epName : epName,
                    slug: epM[3],
                    url: finalLink 
                });
            }
        }

        var servers = [];
        for (var key in serversMap) {
            if (serversMap.hasOwnProperty(key)) {
                // Sắp xếp tập theo thứ tự
                var eps = serversMap[key].sort(function(a, b) {
                    var numA = parseInt((a.name.match(/\d+/) || [0])[0]);
                    var numB = parseInt((b.name.match(/\d+/) || [0])[0]);
                    return numA - numB;
                });
                var formattedEps = eps.map(function(e) {
                    return { id: e.url, name: e.name, slug: e.slug };
                });
                servers.push({
                    name: key,
                    episodes: formattedEps
                });
            }
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            quality: "HD",
            category: category.join(", "),
            servers: servers
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

// BỘ LỌC LINK STREAM BẬC THẦY (Phát Native m3u8 ngay lập tức)
function parseDetailResponse(html, url) {
    try {
        var finalUrl = url;
        var isEmbed = false;

        // Tách cờ nhận dạng ra khỏi link
        var isM3u8Hash = url.indexOf("#m3u8") !== -1;
        url = url.replace(/#(m3u8|embed)$/, "");
        finalUrl = url;

        // 1. PhimAPI (Server S): API cung cấp link m3u8 lộ thiên ở tham số query `url=...`
        var phimApiMatch = url.match(/url=(https?:\/\/[^&"]+)/i);
        if (phimApiMatch) {
            finalUrl = decodeURIComponent(phimApiMatch[1]);
            isEmbed = false; // NATIVE NGAY LẬP TỨC!
        }
        // 2. T Vietsub (Server T): Motchill trả về file Playlist.m3u8 ở dạng path /player/master/...
        else if (isM3u8Hash || url.indexOf("/player/master/") !== -1) {
            finalUrl = url;
            isEmbed = false; // NATIVE NGAY LẬP TỨC!
        }
        // 3. Fallback Embed (Như Opstream)
        else {
            finalUrl = url;
            isEmbed = true;
        }

        // KẾT QUẢ CHO LINK NATIVE (Không quảng cáo, load thần tốc)
        if (!isEmbed) {
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false,
                mimeType: "application/x-mpegURL",
                headers: {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36"
                }
            });
        } 
        // KẾT QUẢ NẾU BẮT BUỘC DÙNG IFRAME 
        else {
            var killAdsJs = `
                setInterval(function() {
                    var popups = document.querySelectorAll('.swal2-container, .modal, .popup-overlay, #top-banner, .ads-banner');
                    for (var j = 0; j < popups.length; j++) popups[j].remove();
                    
                    var btns = document.querySelectorAll('button, a, .jw-icon-display');
                    for (var i = 0; i < btns.length; i++) {
                        var t = btns[i].innerText || '';
                        if (t.indexOf('Đồng ý') > -1 || t.indexOf('Play') > -1 || t.indexOf('Tiếp tục') > -1) {
                            try { btns[i].click(); } catch(e){}
                        }
                    }
                    document.body.classList.remove('swal2-shown', 'modal-open');
                    document.body.style.overflow = 'auto';
                }, 500);
            `;
            return JSON.stringify({
                url: finalUrl,
                isEmbed: true,
                headers: {
                    "Referer": BASEURL,
                    "Custom-Js": killAdsJs.trim()
                }
            });
        }
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: false });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
danh-sach/phim-le@@Phim Lẻ
danh-sach/phim-bo@@Phim Bộ
danh-sach/phim-chieu-rap@@Phim Chiếu Rạp
danh-sach/phim-thuyet-minh@@Phim Thuyết Minh
the-loai/hanh-dong@@Hành Động
the-loai/tinh-cam@@Tình Cảm
the-loai/hai-huoc@@Hài Hước
the-loai/co-trang@@Cổ Trang
the-loai/tam-ly@@Tâm Lý
the-loai/hinh-su@@Hình Sự
the-loai/chien-tranh@@Chiến Tranh
the-loai/the-thao@@Thể Thao
the-loai/vo-thuat@@Võ Thuật
the-loai/vien-tuong@@Viễn Tưởng
the-loai/phieu-luu@@Phiêu Lưu
the-loai/khoa-hoc@@Khoa Học
the-loai/kinh-di@@Kinh Dị
the-loai/am-nhac@@Âm Nhạc
the-loai/than-thoai@@Thần Thoại
the-loai/tai-lieu@@Tài Liệu
the-loai/gia-dinh@@Gia Đình
the-loai/hoc-duong@@Học Đường
the-loai/hoat-hinh@@Hoạt Hình
the-loai/phim-18@@Phim 18+
quoc-gia/han-quoc@@Hàn Quốc
quoc-gia/trung-quoc@@Trung Quốc
quoc-gia/nhat-ban@@Nhật Bản
quoc-gia/thai-lan@@Thái Lan
quoc-gia/au-my@@Âu Mỹ
`;
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        if (!link || !name) continue;
        menulist.push({ "slug": link, "name": name });
    }
    return menulist;
}

// =============================================================================
// BỘ DOM ẢO _$ (CHUẨN VAX) ĐỂ CHẠY CÀO HTML DỰ PHÒNG
// =============================================================================
function _$(htmlOrBlock){ 
	if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { var isClose = match[1] === '/'; var fullMatched = match[0]; if (isClose) { depth--; } else if (fullMatched.indexOf('/>') === -1) { depth++; } if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } if (depth > 0) { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
