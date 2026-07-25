// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://motchillw.blue";

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native 13.0: Khoá mục tiêu ID chuẩn 100%, khử mã unicode, không dư tập.",
        "version": "13.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // Bắt buộc dùng auto để kích hoạt Native Player siêu mượt của iOS
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

function getHomeSections() {
    var listurl = `
/danh-sach@@Phim Mới@@true
`;
    var menulist = buildMenu(listurl);
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
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;

                    if (pageSearch > 1) {
                        var keywordMatch = slug.match(/\?q=([^&]+)/i);
                        if (keywordMatch && keywordMatch[1]) {
                            var searchPageUrl = BASEURL + "/search/" + pageSearch + "?q=" + keywordMatch[1];
                            return searchPageUrl.replace(/([^:]\/)\/+/g, "$1");
                        }
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
        if (page > 1) {
            resultUrl += "/" + page;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
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
        var resultUrl = BASEURL;

        if (page > 1) {
            resultUrl += "/search/" + page + "?q=" + encodedKeyword;
        } else {
            resultUrl += "/search?q=" + encodedKeyword;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
        var fallback = BASEURL + "/search?q=" + encodeURIComponent(keyword || "");
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
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        _$(html).find(".block.relative").each(function() {
            var lang = this.find(".absolute.top-0.left-1").text();
            var current = this.find(".absolute.bottom-1").text();
            var href = this.attr("href");
            if (href.indexOf("http") == -1) href = BASEURL + href;
            
            var quality = this.find(".absolute.top-0.right-1").text();
            var title = this.attr("title");
            var src = this.find("img").attr("src");
            if (src.indexOf("http") == -1) src = BASEURL + src;
            
            if (href && href.indexOf("http") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": quality,
                    "lang": lang,
                    "episode_current": current
                });
            }
        });
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 999 }
        });
        
    } catch (e) {
        log(e);
        return JSON.stringify({
            "items": [{ "id": $url, "title": "Lỗi: " + e, "posterUrl": "", "backdropUrl": "" }],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// =============================================================================
// THUẬT TOÁN TARGET-LOCK: BẮT CHUẨN XÁC TẬP PHIM, XÓA SẠCH UNICODE
// =============================================================================

var cachedMovieDetailId = ""; 

function transformMovieData(data) {
    const servers = [];
    if (!data || !data.servers) return servers;
    
    data.servers.forEach(function(server) {
        const episodeMap = {};
        
        server.items.forEach(function(item) {
            if (!item.link || (item.link.indexOf('http://') !== 0 && item.link.indexOf('https://') !== 0 && item.link.indexOf('/') !== 0)) {
                return;
            }
            const slug = item.slug;
            if (!episodeMap[slug] || (item.type === 'm3u8' && episodeMap[slug].type === 'embed')) {
                episodeMap[slug] = {
                    id: item.link,
                    name: item.name,
                    slug: item.slug,
                    type: item.type
                };
            }
        });
        
        const items = Object.values(episodeMap).map(function(ep) {
            var cName = ep.name;
            if (!cName.toLowerCase().includes("tập") && !isNaN(parseInt(cName))) cName = "Tập " + cName;
            return { id: ep.id, name: cName, slug: ep.slug };
        });
        
        // Sắp xếp lại thứ tự tập
        items.sort((a, b) => {
            var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
            var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
            return nA - nB;
        });

        if (items.length > 0) {
            servers.push({ name: server.name, episodes: items });
        }
    });
    
    return servers;
}

function parseMovieDetail(html, url) {
    try {
        log(url);
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "";
        var episode_current = "";
        var quality = "";
        var year = 2026;
        var rating = 0;
        var servers = [];
        var extra = "";
        var lactor = "";
        var ldirec = "";
        
        if (!isJsonCall) {
            // LƯỢT 1: ĐỌC TRANG THÔNG TIN VÀ KHÓA ID
            cachedMovieDetailId = id;
            var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // 1. TÌM CHÍNH XÁC ID CỦA PHIM (KHÓA MỤC TIÊU)
            var urlSlug = url.split('/').filter(Boolean).pop().split('?')[0]; 
            var exactMovieId = null;
            
            // Tìm trong JSON: "id":"123" ... "slug":"co-meo..."
            var slugRegex1 = new RegExp('"id"\\s*:\\s*"(\\d+)"[^}]*?"slug"\\s*:\\s*"' + urlSlug + '"', 'i');
            var slugMatch = cleanHtml.match(slugRegex1);
            if (!slugMatch) {
                var slugRegex2 = new RegExp('"slug"\\s*:\\s*"' + urlSlug + '"[^}]*?"id"\\s*:\\s*"(\\d+)"', 'i');
                slugMatch = cleanHtml.match(slugRegex2);
            }
            if (slugMatch) {
                exactMovieId = slugMatch[1];
            } else {
                var mMatch = cleanHtml.match(/"movie"\s*:\s*\{"id"\s*:\s*"(\d+)"/i);
                if (mMatch) exactMovieId = mMatch[1];
            }

            // 2. LẤY THÔNG TIN CƠ BẢN VÀ LÀM SẠCH UNICODE
            var titleMatch = cleanHtml.match(new RegExp('"id"\\s*:\\s*"' + exactMovieId + '","name"\\s*:\\s*"([^"]+)"', 'i')) || 
                             cleanHtml.match(/"name"\s*:\s*"([^"]+)"[^}]*?"slug"\s*:\s*"/i) || 
                             html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (titleMatch) {
                lname = titleMatch[1].split('-')[0].trim();
                lname = lname.replace(/\\u([\dA-Fa-f]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
            }

            var imgMatch = cleanHtml.match(new RegExp('"id"\\s*:\\s*"' + exactMovieId + '"[^}]*?"thumb_url"\\s*:\\s*"([^"]+)"', 'i')) || 
                           cleanHtml.match(/"thumb_url"\s*:\s*"([^"]+)"/i) || 
                           html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (imgMatch) limg = imgMatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;

            // Xử lý mô tả: Loại bỏ hoàn toàn \u003cp\u003e
            var descMatch = cleanHtml.match(/"content2"\s*:\s*"([^"]+)"/i) || cleanHtml.match(/"content"\s*:\s*"([^"]+)"/i);
            if (descMatch) {
                var rawDesc = descMatch[1].replace(/\\u([\dA-Fa-f]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
                ldes = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            }

            var curMatch = cleanHtml.match(new RegExp('"id"\\s*:\\s*"' + exactMovieId + '"[^}]*?"episode_current"\\s*:\\s*"([^"]+)"', 'i'));
            if (curMatch) episode_current = curMatch[1].replace(/\\u([\dA-Fa-f]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));

            // 3. CHỈ LẤY TẬP PHIM CỦA ĐÚNG ID ĐÃ KHÓA (CHỐNG LỌT TẬP 16 RÁC)
            var serversMap = {};
            var foundEps = false;

            if (exactMovieId) {
                var epRegex = new RegExp('\\{"id":"\\d+","movie_id":"' + exactMovieId + '","server":"([^"]+)","name":"([^"]+)","slug":"([^"]+)","type":"([^"]+)","link":"([^"]+)"', 'gi');
                var epMatch;
                
                while ((epMatch = epRegex.exec(cleanHtml)) !== null) {
                    foundEps = true;
                    var sName = epMatch[1].trim();
                    var eName = epMatch[2].trim();
                    var eSlug = epMatch[3].trim();
                    var eType = epMatch[4].trim();
                    var eLink = epMatch[5].replace(/\\\//g, '/').trim(); // Làm sạch link
                    
                    if (eLink.indexOf('http') === -1) eLink = BASEURL + (eLink.startsWith('/') ? '' : '/') + eLink;

                    if (!serversMap[sName]) serversMap[sName] = {};
                    
                    // Ưu tiên M3U8 để player native iOS chạy mượt nhất
                    if (!serversMap[sName][eSlug] || eType === 'm3u8') {
                        serversMap[sName][eSlug] = {
                            id: eLink, // Gán thẳng ID bằng Link Phát
                            name: isNaN(eName) ? eName : "Tập " + eName,
                            slug: eSlug,
                            type: eType
                        };
                    }
                }
            }

            if (foundEps) {
                for (var srv in serversMap) {
                    var eps = Object.values(serversMap[srv]);
                    eps.sort((a, b) => {
                        var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                        var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                        return nA - nB;
                    });
                    servers.push({ name: srv, episodes: eps });
                }
            } else if (exactMovieId) {
                extra = BASEURL + "/baseapi/episodes?movie_id=" + exactMovieId;
            }

        } else {
            // LƯỢT 2: GỌI TỪ API (Nếu lượt 1 không có JSON)
            id = cachedMovieDetailId || url;
            var data = JSON.parse(html);
            servers = transformMovieData(data);
            extra = ""; 
        }
        
        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: quality,
            year: year,
            rating: rating,
            category: category,
            episode_current: episode_current,
            servers: servers, 
            duration: "",
            casts: lactor,
            director: ldirec,
            extra: extra 
        });
        
    } catch (e) {
        log("parseMovieDetail error: " + e);
        return JSON.stringify({ id: cachedMovieDetailId || url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// TRẢ VỀ TRỰC TIẾP LINK STREAM CHO APP XỬ LÝ (KHÔNG CẦN IFRAME)
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var isEmbed = false;
        var streamUrl = url;

        if (streamUrl.indexOf('.m3u8') === -1 && streamUrl.indexOf('.mp4') === -1) {
            isEmbed = true; 
        }

        if (streamUrl.startsWith('/player/master/')) {
            streamUrl = BASEURL + streamUrl;
            isEmbed = true; 
        } else if (streamUrl.startsWith("//")) {
            streamUrl = "https:" + streamUrl;
        }

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "headers": {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

// =============================================================================
// MENUS VÀ BỘ THƯ VIỆN DOM ẢO _$(html) CỦA BẠN (GIỮ NGUYÊN)
// =============================================================================

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
/danh-sach/phim-le@@Phim Lẻ
/danh-sach/phim-bo@@Phim Bộ
/the-loai/hanh-dong@@Hành Động
/the-loai/tinh-cam@@Tình Cảm
/the-loai/hai-huoc@@Hài Hước
/the-loai/co-trang@@Cổ Trang
/the-loai/tam-ly@@Tâm Lý
/the-loai/hinh-su@@Hình Sự
/the-loai/chien-tranh@@Chiến Tranh
/the-loai/the-thao@@Thể Thao
/the-loai/vo-thuat@@Võ Thuật
/the-loai/vien-tuong@@Viễn Tưởng
/the-loai/phieu-luu@@Phiêu Lưu
/the-loai/khoa-hoc@@Khoa Học
/the-loai/kinh-di@@Kinh Dị
/the-loai/am-nhac@@Âm Nhạc
/the-loai/than-thoai@@Thần Thoại
/the-loai/tai-lieu@@Tài Liệu
/the-loai/gia-dinh@@Gia Đình
/the-loai/chinh-kich@@Chính kịch
/the-loai/bi-an@@Bí ẩn
/the-loai/hoc-duong@@Học Đường
/the-loai/kinh-dien@@Kinh Điển
/the-loai/phim-18@@Phim 18+
/the-loai/hoat-hinh@@Anime & Hoạt Hình
/the-loai/tv-shows@@TV Shows
`
}

function buildMenu(listurl){let menulist=[];if (!listurl)return menulist;let lines=listurl.split('\n');for (let i=0;i < lines.length;i++){let line=lines[i].trim();if (!line||line.indexOf('@@')===-1)continue;let parts=line.split('@@');let link=parts[0]?parts[0].trim():"";let name=parts[1]?parts[1].trim():"";let check=parts[2]?parts[2].trim():undefined;if (!link||!name)continue;let item={};if (check==="false"){item={"slug":link,"title":name,"type":"Horizontal"};}else if (check==="true"){item={"slug":link,"title":name,"type":"Grid"};}else{item={"slug":link,"name":name};}menulist.push(item);}return menulist;}
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),length: 0,find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0,nextDot);selectorToParse = selectorToParse.substring(0,idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = -1;var insideQuote = false;var quoteChar = '';for (var j = pos + 1;j < currentHtml.length;j++) {var char = currentHtml.charAt(j);if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') {if (!insideQuote) {insideQuote = true;quoteChar = char;} else if (char === quoteChar) {insideQuote = false;}} if (char === '>' && !insideQuote) {endOpenTag = j;break;}} if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/);var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : "";var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : "";var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : "";if (isMatched && targetId && idMatchStr !== targetId) {isMatched = false;} if (isMatched && targetClasses.length > 0) {if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";if (attrNameFilter === "class") {actualValue = classMatchStr;} else if (attrNameFilter === "id") {actualValue = idMatchStr;} else {var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : "";} var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=','i')) !== -1;if (!attrExists) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)','gi');tagRegex.lastIndex = endOpenTag + 1;var match;while ((match = tagRegex.exec(currentHtml)) !== null) {var isClose = match[1] === '/';var fullMatched = match[0];if (isClose) {depth--;} else if (fullMatched.indexOf('/>') === -1) {depth++;} if (depth === 0) {endTagPos = tagRegex.lastIndex;break;}} if (depth > 0) {endTagPos = currentHtml.length;}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = "";if (currentTagName === "script" || currentTagName === "style") {var innerStart = foundBlock.indexOf('>') + 1;var innerEnd = foundBlock.search(/<\/(?:script|style)/i);pureText = innerEnd !== -1 ? foundBlock.substring(innerStart,innerEnd) : foundBlock.substring(innerStart);} else {pureText = foundBlock.replace(/<[^>]+>/g,"").trim();} var keywords = contentFilter.split('|');var isContentMatched = false;for (var k = 0;k < keywords.length;k++) {if (pureText.indexOf(keywords[k].trim()) !== -1) {isContentMatched = true;break;}} if (!isContentMatched) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true;if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];this.length = this.elements.length;return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : "";},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i);if (matchClose) {var end = elem.lastIndexOf(matchClose[0]);if (start > 0 && end >= start) return elem.substring(start,end);} return start > 0 ? elem.substring(start) : "";},text: function (separator) {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);var pureText = content.replace(/<\/?[^>]+(>|$)/g,"\n");if (typeof separator === 'string') {return pureText .split('\n') .map(function (item) {return item.trim();}) .filter(function (item) {return item !== '';}) .join(separator);} return pureText .split('\n') .map(function (item) {return item.trim();}) .filter(function (item) {return item !== '';}) .join(' ');} return "";},textAll: function (separator) {if (this.elements.length === 0) return "";var sep = typeof separator === 'string' ? separator : " ";var allTexts = [];for (var i = 0;i < this.elements.length;i++) {var elem = this.elements[i];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);var pureText = content.replace(/<\/?[^>]+(>|$)/g,"\n");var cleanText = pureText .split('\n') .map(function (item) {return item.trim();}) .filter(function (item) {return item !== '';}) .join(' ');if (cleanText !== '') {allTexts.push(cleanText);}}} return allTexts.join(sep);},next: function () {var results = [];if (!this.sourceHtml) return this;for (var i = 0;i < this.elements.length;i++) {var elem = this.elements[i];var idx = this.sourceHtml.indexOf(elem);if (idx === -1) continue;var scanPos = idx + elem.length;var nextOpen = this.sourceHtml.indexOf('<',scanPos);if (nextOpen !== -1) {if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue;var endOpenTag = this.sourceHtml.indexOf('>',nextOpen);if (endOpenTag === -1) continue;var fullOpenTag = this.sourceHtml.substring(nextOpen,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1,spacePos).toLowerCase();var startTagPos = nextOpen;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)','gi');tagRegex.lastIndex = endOpenTag + 1;var match;while ((match = tagRegex.exec(this.sourceHtml)) !== null) {if (match[1] === '/') depth--;else if (match[0].indexOf('/>') === -1) depth++;if (depth === 0) {endTagPos = tagRegex.lastIndex;break;}}} results.push(this.sourceHtml.substring(startTagPos,endTagPos));}} var nextInstance = _$(results);nextInstance.sourceHtml = this.sourceHtml;this.elements = results;this.length = results.length;return this;},parent: function () {var results = [];if (!this.sourceHtml) return this;for (var i = 0;i < this.elements.length;i++) {var elem = this.elements[i];var idx = this.sourceHtml.indexOf(elem);if (idx <= 0) continue;var scanPos = idx - 1;while (scanPos >= 0) {var openTagPos = this.sourceHtml.lastIndexOf('<',scanPos);if (openTagPos === -1) break;if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') {var endOpenTag = this.sourceHtml.indexOf('>',openTagPos);if (endOpenTag !== -1 && endOpenTag > openTagPos) {var fullOpenTag = this.sourceHtml.substring(openTagPos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1,spacePos).toLowerCase();var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)','gi');tagRegex.lastIndex = endOpenTag + 1;var match;while ((match = tagRegex.exec(this.sourceHtml)) !== null) {if (match[1] === '/') depth--;else if (match[0].indexOf('/>') === -1) depth++;if (depth === 0) {endTagPos = tagRegex.lastIndex;break;}}} if (endTagPos >= idx + elem.length) {var parentBlock = this.sourceHtml.substring(openTagPos,endTagPos);if (results.indexOf(parentBlock) === -1) results.push(parentBlock);break;}}} scanPos = openTagPos - 1;}} var parentInstance = _$(results);parentInstance.sourceHtml = this.sourceHtml;this.elements = results;this.length = results.length;return this;},closest: function (selector) {var results = [];if (!this.sourceHtml || this.elements.length === 0) return _$([]);for (var i = 0;i < this.elements.length;i++) {var currentElem = this.elements[i];var currentObj = _$(currentElem);currentObj.sourceHtml = this.sourceHtml;var selfCheck = _$(this.sourceHtml).find(selector);var isSelfMatched = false;for (var s = 0;s < selfCheck.elements.length;s++) {if (selfCheck.elements[s] === currentElem) {isSelfMatched = true;break;}} if (isSelfMatched) {if (results.indexOf(currentElem) === -1) results.push(currentElem);continue;} var parentObj = currentObj.parent();while (parentObj.elements.length > 0) {var parentElem = parentObj.elements[0];var checkMatch = _$(this.sourceHtml).find(selector);var isMatched = false;for (var j = 0;j < checkMatch.elements.length;j++) {if (checkMatch.elements[j] === parentElem) {isMatched = true;break;}} if (isMatched) {if (results.indexOf(parentElem) === -1) results.push(parentElem);break;} parentObj = parentObj.parent();}} var closestInstance = _$(results);closestInstance.sourceHtml = this.sourceHtml;return closestInstance;}};instance.length = instance.elements.length;return instance;}
