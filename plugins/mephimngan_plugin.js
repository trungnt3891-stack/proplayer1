// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM
// CHIẾN THUẬT: 3 CẤP FETCH ĐỂ VƯỢT DOMAIN + SHORTFILM NATIVE (0% QUẢNG CÁO)
// =============================================================================

var BASEURL = "https://gamomephim.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Cấu trúc 3 Cấp: Vào trang 1 -> Bấm tập -> Tự tóm link mp4 ở trang 2 và stream dọc.",
        "version": "5.1.0", // Fix lỗi mã hóa NextJS ở Trang 2
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "type": "shortfilm", // Kích hoạt Player chiếu dọc (TikTok-style)
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // Tự stream lên bằng Native, Không dùng Webview
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

// CẤP 1 -> 2: TRỎ VÀO TRANG THÔNG TIN (TRANG 1)
function getUrlDetail(slug) {
    if (!slug) return "";
    
    // Nếu slug là URL tuyệt đối do Cấp 2 trả về, bỏ qua xử lý để Vax App tự lấy HTML (Cấp 3)
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

// CẤP 1: BẮT DANH SÁCH PHIM TỪ TRANG CHỦ
function parseListResponse(html, $url) {
    try {
        var items = [];
        var added = {};
        var calculatedPage = 1;
        if ($url && $url.indexOf("page=") > -1) {
            var matchPage = $url.match(/page=(\d+)/);
            if (matchPage) calculatedPage = parseInt(matchPage[1]) || 1;
        }

        // CÁCH 1: Lấy từ JSON ẩn
        var unescapedHtml = html.replace(/\\"/g, '"');
        var jsonRegex = /"item"\s*:\s*\{"title":"([^"]+)","slug":"([^"]+)","img":"([^"]+)"(?:,"badge":"([^"]+)")?/g;
        var jMatch;
        while ((jMatch = jsonRegex.exec(unescapedHtml)) !== null) {
            var jSlug = jMatch[2];
            if (!added[jSlug]) {
                added[jSlug] = true;
                items.push({
                    id: jSlug,
                    title: jMatch[1],
                    posterUrl: jMatch[3],
                    backdropUrl: jMatch[3],
                    quality: jMatch[4] || "FULL",
                    episode_current: jMatch[4] || "Full"
                });
            }
        }

        // CÁCH 2: Dùng Regex lấy trực tiếp từ DOM HTML trang chủ bạn cung cấp
        var domRegex = /<a[^>]+title=["']([^"']+)["'][^>]+href=["']\/phim\/([^"']+)["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/gi;
        var match;
        while ((match = domRegex.exec(html)) !== null) {
            var title = match[1];
            var slug = match[2];
            var img = match[3];
            
            if (!added[slug]) {
                added[slug] = true;
                items.push({
                    id: slug,
                    title: title.trim(),
                    posterUrl: img,
                    backdropUrl: img,
                    quality: "FULL",
                    episode_current: "Full"
                });
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": calculatedPage, "totalPages": items.length > 0 ? 999 : 1 }
        });
    } catch (e) {
        log(e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

// CẤP 2: VÀO TRANG 1 BÓC THÔNG TIN -> TẠO NÚT BẤM CÓ ID LÀ URL CỦA TRANG 2
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

        // Lấy thông tin từ Meta và JSON ẩn của Trang 1
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (metaTitle) lname = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").replace(/ - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) limg = metaImg[1];
        
        // Khôi phục HTML thô để trích xuất cast & duration
        var unescapedHtml = html.replace(/\\"/g, '"');
        
        var descMatch = unescapedHtml.match(/"description"\s*:\s*"([^"]+)"/i);
        if (descMatch) ldes = descMatch[1].replace(/\\n/g, '\n');

        var castMatch = unescapedHtml.match(/"cast"\s*:\s*"([^"]+)"/i);
        if (castMatch) lactor = castMatch[1];
        
        var durationMatch = unescapedHtml.match(/"durationString"\s*:\s*"([^"]+)"/i);
        if (durationMatch) lduran = durationMatch[1];

        // TẠO URL TRANG 2 (TRANG CHIẾU PHIM THỰC SỰ) BẰNG CÁCH BỎ CHỮ /PHIM/
        var cleanSlug = url.split("?")[0].replace(BASEURL, "").replace(/^\//, "").replace(/^phim\//, "");
        var watchUrl = BASEURL + "/" + cleanSlug;

        // TẠO NÚT BẤM. GẮN THÊM CỜ |data:audio ĐỂ APP TRUYỀN VÀO CẤP 3
        var epsVietsub = [{ "name": "Bản Vietsub", "id": watchUrl + "|data:audio=VIETSUB", "slug": "tap-vs" }];
        var epsThuyetMinh = [{ "name": "Bản Thuyết Minh", "id": watchUrl + "|data:audio=THUYET_MINH", "slug": "tap-tm" }];
        
        servers.push({ "name": "Vietsub", "episodes": epsVietsub });
        servers.push({ "name": "Thuyết Minh", "episodes": epsThuyetMinh });

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

// CẤP 3: APP TỰ ĐỘNG LOAD TRANG 2 -> HÀM NÀY SẼ MOI LINK MP4 VÀ ĐẨY RA CHO EXOPLAYER
function parseDetailResponse(html, apiUrl) {
    try {
        log("Đang bóc link từ Trang 2: " + apiUrl);
        // Nhận diện người dùng đang muốn xem bản nào (từ cờ data truyền ở Cấp 2)
        var targetAudio = "VIETSUB";
        if (apiUrl.indexOf("audio=THUYET_MINH") > -1) {
            targetAudio = "THUYET_MINH";
        }

        var finalLink = "";
        var backupLink = "";

        // TẨY RỬA MÃ HÓA NEXTJS: Loại bỏ \" và \/ để DOM trở nên sạch sẽ
        var unescapedHtml = html.replace(/\\"/g, '"').replace(/\\\//g, '/');

        // REGEX XUYÊN GIÁP: Tìm chính xác link mp4 và AudioType đi kèm
        var regex = /"m3u8Url"\s*:\s*"([^"]+)"[^{}]*?"audioType"\s*:\s*"([^"]+)"/gi;
        var match;

        while ((match = regex.exec(unescapedHtml)) !== null) {
            var epLink = match[1];
            var audioType = match[2].toUpperCase();

            // Lưu nháp link đầu tiên tìm được làm backup
            if (!backupLink) backupLink = epLink;

            // Nếu đúng Audio người dùng bấm, chốt hạ luôn
            if (audioType.indexOf(targetAudio) > -1) {
                finalLink = epLink;
                break;
            }
        }

        // Fallback 1: Lấy link đầu tiên nếu không khớp ngôn ngữ
        if (!finalLink) finalLink = backupLink;

        // Fallback 2: Moi bằng Regex trần tục nếu web đổi cấu trúc JSON
        if (!finalLink) {
            var fallbackMatch = unescapedHtml.match(/(https:\/\/[^"'\s]+\.(?:mp4|m3u8))/i);
            if (fallbackMatch) {
                finalLink = fallbackMatch[1];
            }
        }

        log("Link phim bóc được: " + finalLink);

        var mimeType = "video/mp4";
        if (finalLink && finalLink.indexOf(".m3u8") > -1) {
            mimeType = "application/x-mpegURL";
        }

        // APP NHẬN ĐƯỢC LINK NÀY SẼ TỰ ĐỘNG PHÁT NATIVE (KHÔNG MỞ WEBVIEW, KHÔNG QUẢNG CÁO)
        return JSON.stringify({
            "url": finalLink || "",
            "isEmbed": false, 
            "mimeType": mimeType,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        log("Lỗi Cấp 3: " + e.message);
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

// DANH MỤC ĐƯỢC FIX CHÍNH XÁC 100% THEO ẢNH BẠN GỬI
function getLISTmenu() {
    return JSON.stringify([
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
