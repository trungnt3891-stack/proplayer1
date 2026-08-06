// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM
// CHIẾN THUẬT: 3 CẤP FETCH ĐỂ VƯỢT DOMAIN + SHORTFILM NATIVE
// =============================================================================

var BASEURL = "https://gamomephim.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Cấu trúc 3 Cấp: Fetch vượt domain, tóm link video cuối để tự stream dọc.",
        "version": "1.3.1", // Đã fix load trang chủ
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "type": "shortfilm", 
        "layoutType": "VERTICAL",
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
    var listurl = "[{\"link\":\"/phim-moi\",\"name\":\"Phim Mới Cập Nhật\",\"type\":\"Grid\"},{\"link\":\"/the-loai/hien-dai\",\"name\":\"Hiện Đại\",\"type\":\"Horizontal\"},{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ Trang\",\"type\":\"Horizontal\"},{\"link\":\"/the-loai/hai-huoc\",\"name\":\"Hài Hước\",\"type\":\"Horizontal\"},{\"link\":\"/the-loai/tra-xanh-nam\",\"name\":\"Trà Xanh Nam\",\"type\":\"Horizontal\"}]";
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
    return JSON.stringify({ category: menulist });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1) {
                if (filtersJson) {
                    var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                    try {
                        var filters = JSON.parse(fixedJson);
                        var page = parseInt(filters.page) || 1;
                        if (page > 1) {
                            return slug + "?from_videos=" + page + "&from_albums=" + page;
                        } else {
                            return slug;
                        }
                    } catch (jsonErr) {
                        return slug;
                    }
                }
            }
            return slug;
        }
        
        var page = 1;
        var path = slug || "";
        
        if (filtersJson) {
            var fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters2 = JSON.parse(fixedJson2);
                page = parseInt(filters2.page) || 1;
                if (filters2.category) {
                    if (Array.isArray(filters2.category) && filters2.category.length > 0) {
                        path = filters2.category[0].slug;
                    } else if (typeof filters2.category === 'string') {
                        path = filters2.category;
                    }
                }
            } catch (jsonErr) {}
        }
        
        var resultUrl = BASEURL;
        if (path) {
            resultUrl += path.startsWith('/') ? path : '/' + path;
        }
        if (page > 1) {
            resultUrl += "?page=" + page;
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            var filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    var searchUrl = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
    if (page > 1) searchUrl += "&page=" + page;
    return searchUrl;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    
    // Nếu slug là URL tuyệt đối do Cấp 2 trả về, bỏ qua xử lý để Vax App tự lấy HTML
    if (slug.indexOf('http') === 0) return slug;
    
    // Cấp 2: Trỏ vào Trang 1 (Thông tin phim)
    var cleanSlug = slug.replace(/^\//, "").replace(/^phim\//, "");
    return BASEURL + "/phim/" + cleanSlug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// CẤP 1: BẮT DANH SÁCH PHIM ĐÃ ĐƯỢC FIX LẠI BẰNG REGEX HOÀN HẢO
function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        // CÁCH 1: Bóc bằng Regex nhanh vào các object phim JSON của NextJS
        var unescapedHtml = html.replace(/\\"/g, '"');
        var regex = /\{"title":"([^"]+)","slug":"([^"]+)","img":"([^"]+)"(?:,"badge":"([^"]+)")?/gi;
        var match;
        
        while ((match = regex.exec(unescapedHtml)) !== null) {
            var title = match[1];
            var slug = match[2];
            var img = match[3];
            var badge = match[4] || "HD";
            
            if (!added[slug]) {
                added[slug] = true;
                items.push({
                    id: slug, 
                    title: title.trim(),
                    posterUrl: img,
                    backdropUrl: img,
                    quality: "FULL",
                    episode_current: badge
                });
            }
        }

        // CÁCH 2: Dùng Regex tìm trực tiếp thẻ <a> HTML (Fallback)
        if (items.length === 0) {
            var aRegex = /<a[^>]+href=["'](?:\/phim)?\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var aMatch;
            while ((aMatch = aRegex.exec(html)) !== null) {
                var dSlug = aMatch[1];
                var inner = aMatch[2];
                
                // Lọc các link rác
                if (dSlug.indexOf('/') > -1 && dSlug.indexOf('phim/') !== 0) continue; 
                var cSlug = dSlug.replace(/^phim\//, "");
                
                var tMatch = inner.match(/<h3[^>]*>([^<]+)<\/h3>/i) || aMatch[0].match(/title=["']([^"']+)["']/i);
                var iMatch = inner.match(/src=["']([^"']+)["']/i);
                var bMatch = inner.match(/<span[^>]*>([^<]+)<\/span>/i);
                
                if (tMatch && iMatch && !added[cSlug]) {
                    added[cSlug] = true;
                    items.push({
                        id: cSlug,
                        title: tMatch[1].trim(),
                        posterUrl: iMatch[1],
                        backdropUrl: iMatch[1],
                        quality: "FULL",
                        episode_current: bMatch ? bMatch[1].trim() : "Full"
                    });
                }
            }
        }

        var page = 1;
        if (url && url.indexOf("page=") > -1) {
            var pMatch = url.match(/page=(\d+)/);
            if (pMatch) page = parseInt(pMatch[1]);
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: page, totalPages: items.length > 0 ? 99 : 1 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

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
    var result = { video: null, episodes: [], related: [], collection: [] };
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.video && typeof node.video === 'object') result.video = node.video;
            if (Array.isArray(node.episodes)) result.episodes = node.episodes;
            if (Array.isArray(node.related)) result.related = node.related;
            if (Array.isArray(node.collection)) result.collection = node.collection;
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) traverse(node[i]);
        }
    }
    traverse(data);
    return result;
}

// CẤP 2: BÓC THÔNG TIN & TRẢ VỀ ID TẬP PHIM CHÍNH LÀ URL TRANG 2 (Để vượt domain)
function parseMovieDetail(html, url) {
    try {
        log("Chi tiết phim: " + url);
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var year = 2026;
        var lactor = "";
        var lduran = "";
        var status = "Hoàn Thành";
        var servers = [];

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

        // Tạo URL Trang 2 (Trang chiếu phim) để vượt Domain
        var cleanSlug = url.split("?")[0].replace(BASEURL, "").replace(/^\//, "").replace(/^phim\//, "");
        var watchUrl = BASEURL + "/" + cleanSlug;

        var listepi = dataVD.episodes || [];
        var svSub = [];
        var svTm = [];

        for (var $j = 0; $j < listepi.length; $j++) {
            var ep = listepi[$j];
            var audioType = (ep.audioType || "VIETSUB").toUpperCase();
            var num = ep.episodeNumber || ($j + 1);
            
            // Ép ID tập phim là đường link Trang 2, Vax App sẽ lấy link này để tiến hành Cấp 3
            var epObj = {
                "name": "Tập " + num,
                "id": watchUrl + "|data:audio=" + audioType, 
                "slug": (audioType.indexOf("THUYET_MINH") > -1 ? "tm-" : "vs-") + num
            };

            if (audioType.indexOf("THUYET_MINH") > -1) {
                svTm.push(epObj);
            } else {
                svSub.push(epObj);
            }
        }
        
        if (svTm.length > 0) servers.push({ "name": "Thuyết Minh", "episodes": svTm });
        if (svSub.length > 0) servers.push({ "name": "Vietsub", "episodes": svSub });
        
        if (servers.length === 0) {
            servers.push({
                "name": "Phát Ngay",
                "episodes": [{ "name": "Tập 1", "id": watchUrl + "|data:audio=VIETSUB", "slug": "tap-1" }]
            });
        }

        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "FULL",
            year: year,
            rating: 9.5,
            status: status,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ""
        });
    } catch (e) {
        log(e);
        return JSON.stringify({ id: url || "error", title: "Lỗi tải thông tin chi tiết", servers: [] });
    }
}

// CẤP 3: LẤY LINK VIDEO CUỐI CÙNG TỪ HTML TRANG 2 VÀ TỰ STREAM LÊN
function parseDetailResponse(html, apiUrl) {
    try {
        // App truyền vào apiUrl có dạng: https://gamomephim.com/kieu-tang-kinh-chi|data:audio=THUYET_MINH
        var targetAudio = "VIETSUB";
        if (apiUrl.indexOf("audio=THUYET_MINH") > -1) {
            targetAudio = "THUYET_MINH";
        }

        // Tái sử dụng hàm bóc tách của bạn cho Trang 2
        var script = _$(html).find("script:content('m3u8Url')").text();
        if (!script) {
            script = _$(html).find("script:content('audioType')").text();
        }
        
        var rawVD = parseNextPayload(script);
        var dataVD = extractCleanData(rawVD);
        var listepi = dataVD.episodes || [];
        var finalLink = "";

        // Tìm link mp4 có audioType khớp với lựa chọn ở Cấp 2
        for (var $j = 0; $j < listepi.length; $j++) {
            var ep = listepi[$j];
            var audio = (ep.audioType || "VIETSUB").toUpperCase();
            if (audio.indexOf(targetAudio) > -1 && ep.m3u8Url) {
                finalLink = ep.m3u8Url;
                break;
            }
        }

        // Fallback nếu không có sự trùng khớp
        if (!finalLink && listepi.length > 0) {
            finalLink = listepi[0].m3u8Url;
        }

        // Fallback cuối cùng bằng Regex
        if (!finalLink) {
            var fallbackMatch = html.match(/(https:\/\/[^"'\s]+\.(?:mp4|m3u8))/);
            if (fallbackMatch) finalLink = fallbackMatch[1].replace(/\\\//g, '/');
        }

        var mimeType = finalLink.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4";

        return JSON.stringify({
            "url": finalLink,
            "isEmbed": false, // Lấy link xong thì Vax App tự Stream ExoPlayer chiếu dọc
            "mimeType": mimeType,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return JSON.stringify([
        {"link":"/phim-moi","name":"Phim Mới"},
        {"link":"/the-loai/chua-lanh","name":"Chữa Lành"},
        {"link":"/the-loai/co-trang","name":"Cổ Trang"},
        {"link":"/the-loai/cuoi-truoc-yeu-sau","name":"Cưới Trước Yêu Sau"},
        {"link":"/the-loai/dan-quoc","name":"Dân Quốc"},
        {"link":"/the-loai/guong-vo-lai-lanh","name":"Gương Vỡ Lại Lành"},
        {"link":"/the-loai/hai-huoc","name":"Hài Hước"},
        {"link":"/the-loai/hien-dai","name":"Hiện Đại"},
        {"link":"/the-loai/nien-dai","name":"Niên Đại"},
        {"link":"/the-loai/thanh-xuan","name":"Thanh Xuân"},
        {"link":"/the-loai/tra-xanh-nam","name":"Trà Xanh Nam"},
        {"link":"/the-loai/trong-sinh","name":"Trọng Sinh"},
        {"link":"/the-loai/xuyen-khong","name":"Xuyên Không"},
        {"link":"/the-loai/yeu-tham","name":"Yêu Thầm"}
    ]);
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

function _$(htmlOrBlock){ if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'([^']*)'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var scanPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && scanPos < currentHtml.length) { var nextOpen = currentHtml.indexOf(openStr, scanPos); var nextClose = currentHtml.indexOf(closeStr, scanPos); if (nextClose === -1) { scanPos = currentHtml.length; break; } if (nextOpen !== -1 && nextOpen < nextClose) { depth++; scanPos = nextOpen + openStr.length; } else { depth--; scanPos = nextClose + closeStr.length; if (depth === 0) endTagPos = nClose = nextClose + closeStr.length; } } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) return elem.substring(start, end); return ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
