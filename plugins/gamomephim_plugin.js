// =============================================================================
// PLUGIN MOVIE SCRAPER: GAMOMEPHIM.COM (OPTIMIZED & FAST)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Nguồn Phim Ngắn Hay & Tốc Độ Cao",
        "version": "2.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "exoplayer"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[gamomephim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[gamomephim] " + msg);
    }
}

function getHomeSections() {
    var listurl = '[{"link":"/phim-moi","name":"Phim Mới"},{"link":"/the-loai/hien-dai","name":"Hiện Đại"},{"link":"/the-loai/co-trang","name":"Cổ Trang"}]';
    var menulist = buildMenu(listurl, true);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        
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
        
        var resultUrl = BASEURL;
        if (path) {
            if (path.indexOf("http") === 0) {
                resultUrl = path;
            } else {
                resultUrl += (path.startsWith('/') ? path : '/' + path);
            }
        }
        if (page > 1) {
            resultUrl += (resultUrl.indexOf('?') > -1 ? '&' : '?') + "page=" + page;
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
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
// PARSERS (TỐI ƯU TỐC ĐỘ & BẮT ĐÚNG LINK PHIM)
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var calculatedPage = 1;
        if ($url && $url.indexOf("page=") > -1) {
            var matchPage = $url.match(/page=(\d+)/);
            if (matchPage) calculatedPage = parseInt(matchPage[1]) || 1;
        }

        // Quét các thẻ a chứa link phim chuẩn xác trên trang
        _$(html).find("a").each(function() {
            var href = this.attr("href") || "";
            if (href.indexOf("/phim/") === -1 && href.indexOf("http") === -1) return;
            
            var cleanHref = href;
            if (cleanHref.indexOf("http") === -1) {
                cleanHref = BASEURL + (cleanHref.startsWith('/') ? cleanHref : '/' + cleanHref);
            }

            // Chỉ lấy các link trỏ về trang chi tiết phim
            if (cleanHref.indexOf("/phim/") > -1) {
                var imgTag = this.find("img");
                var poster = imgTag.attr("src") || imgTag.attr("data-src") || "";
                if (poster && poster.indexOf("http") === -1) {
                    poster = BASEURL + (poster.startsWith('/') ? poster : '/' + poster);
                }

                var title = imgTag.attr("alt") || this.attr("title") || "";
                if (!title) {
                    var h3 = this.find("h3");
                    title = h3.text().trim();
                }

                if (title && cleanHref) {
                    // Tránh trùng lặp item
                    var exists = false;
                    for (var k = 0; k < items.length; k++) {
                        if (items[k].id === cleanHref) { exists = true; break; }
                    }

                    if (!exists) {
                        items.push({
                            "id": cleanHref,
                            "title": title.trim(),
                            "posterUrl": poster,
                            "backdropUrl": poster,
                            "quality": "FULL",
                            "lang": "Vietsub",
                            "episode_current": "Full"
                        });
                    }
                }
            }
        });

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": calculatedPage,
                "totalPages": 99
            }
        });
    } catch (e) {
        log("parseListResponse error: " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseNextPayload(raw) {
    try {
        var match = raw.match(/self\.__next_f\.push\((.*)\)/);
        if (!match) return null;
        var pushArgs = JSON.parse(match[1]);
        var rawString = pushArgs[1];
        var cleanJsonStr = rawString.replace(/^\w+:/, '').replace(/\n$/, '');
        return JSON.parse(cleanJsonStr);
    } catch (e) {
        return null;
    }
}

function extractCleanData(data) {
    var result = { video: null, episodes: [] };
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.video && typeof node.video === 'object') {
                result.video = node.video;
            }
            if (Array.isArray(node.episodes)) {
                result.episodes = node.episodes;
            }
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                traverse(node[i]);
            }
        }
    }
    traverse(data);
    return result;
}

// BÓC TÁCH CHI TIẾT VÀ FIX DỨT ĐIỂM LỖI BẮT NHẦM LINK LIVE
function parseMovieDetail(html, url) {
    try {
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var year = 2026;
        var lactor = "";
        var lduran = "";
        var status = "Full";
        
        var script = _$(html).find("script:content('m3u8Url')").text();
        if (!script) {
            script = _$(html).find("script:content('audioType')").text();
        }
        
        var rawVD = parseNextPayload(script);
        var dataVD = extractCleanData(rawVD);
        var video = dataVD.video;
        
        if (video) {
            lname = video.title || lname;
            limg = video.thumbnailUrl || limg;
            ldes = video.description || ldes;
            year = video.releaseYear || year;
            lactor = video.cast || lactor;
            lduran = video.durationString || lduran;
            status = video.status || status;
        }

        // Dự phòng lấy meta nếu không quét được qua next_f payload
        if (!lname || lname === "Đang cập nhật...") {
            var ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
            if (ogTitle) lname = ogTitle[1].replace(/- Gà Mờ Mê Phim/i, '').trim();
        }
        if (!limg) {
            var ogImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            if (ogImg) limg = ogImg[1];
        }
        
        var listepi = dataVD.episodes || [];
        var items = [];
        
        for (var j = 0; j < listepi.length; j++) {
            var ep = listepi[j];
            var name = ep.audioType ? ep.audioType.replace(/VIETSUB/i, "Việt Sub").replace(/THUYET_MINH/i, "Thuyết Minh") : "Tập " + (j + 1);
            var link = ep.m3u8Url || "";
            
            // Lọc cực kỳ nghiêm ngặt: Chỉ lấy link video stream hợp lệ (.mp4 / .m3u8), loại bỏ hoàn toàn link live rác
            if (link && link.indexOf("http") > -1 && link.indexOf("live") === -1) {
                items.push({
                    "name": name,
                    "id": link, 
                    "slug": "tap-" + (j + 1)
                });
            }
        }

        // Dự phòng nếu không bắt được mảng episodes qua payload
        if (items.length === 0) {
            var videoMatch = html.match(/"m3u8Url":"([^"]+)"/i);
            if (videoMatch && videoMatch[1]) {
                var cleanLink = videoMatch[1].replace(/\\u0026/g, '&');
                items.push({
                    "name": "Vietsub Full",
                    "id": cleanLink,
                    "slug": "full"
                });
            }
        }
        
        var servers = [{ "name": "Server Gà Mờ", "episodes": items }];
        
        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "FULL",
            year: year,
            rating: 8.5,
            status: status,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ""
        });
    } catch (e) {
        log("parseMovieDetail error: " + e);
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi tải thông tin chi tiết",
            servers: []
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            "url": url,
            "isEmbed": false,
            "mimeType": "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// CẬP NHẬT CHUẨN 100% DANH MỤC KHỚP VỚI HÌNH ẢNH GIAO DIỆN MỚI
function getLISTmenu() {
    return '[{"link":"/phim-moi","name":"Phim Mới"},{"link":"/the-loai/chua-lanh","name":"Chữa Lành"},{"link":"/the-loai/co-trang","name":"Cổ Trang"},{"link":"/the-loai/cuoi-truoc-yeu-sau","name":"Cưới Trước Yêu Sau"},{"link":"/the-loai/dan-quoc","name":"Dân Quốc"},{"link":"/the-loai/guong-vo-lai-lanh","name":"Gương Vỡ Lại Lành"},{"link":"/the-loai/hai-huoc","name":"Hài Hước"},{"link":"/the-loai/hien-dai","name":"Hiện Đại"},{"link":"/the-loai/nien-dai","name":"Niên Đại"},{"link":"/the-loai/thanh-xuan","name":"Thanh Xuân"},{"link":"/the-loai/tra-xanh-nam","name":"Trà Xanh Nam"},{"link":"/the-loai/trong-sinh","name":"Trọng Sinh"},{"link":"/the-loai/xuyen-khong","name":"Xuyên Không"},{"link":"/the-loai/yeu-tham","name":"Yêu Thầm"}]';
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

// === THƯ VIỆN DOM ẢO _$ ===
function _$(htmlOrBlock){ if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < currentHtml.length) { var nOpen = currentHtml.indexOf(openStr, sPos); var nClose = currentHtml.indexOf(closeStr, sPos); if (nClose === -1) { sPos = currentHtml.length; break; } if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) return elem.substring(start, end); return ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
