// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://onflix.lol"; 
var BASEAPI = "https://k8s.onflixcdn.com/api";

function getManifest() {
	return JSON.stringify({
		"id": "onflix",
		"name": "Onflix",
		"description": "Bản Master: Fix lấy link tập phim, 1 Folder Phim Mới duy nhất.",
		"version": "2.0.3", // Cập nhật version để ép App xóa cache
		"baseUrl": BASEURL,
		"iconUrl": BASEURL + "/app/asset/logo.png",
		"isEnabled": true,
		"isAdult": false,
		"type": "MOVIE",
		"layoutType": "VERTICAL",
		"playerType": "embedtoexoplay" // Dùng sức mạnh native VAX để chặn quảng cáo webview
	});
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[onflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[onflix] " + msg);
    }
}

// 1. CHỈ ĐỂ DUY NHẤT 1 FOLDER PHIM MỚI 
function getHomeSections() {
    return JSON.stringify([
        { 
            "slug": "/movies?sort=newest&limit=24", 
            "title": "Phim Mới", 
            "type": "Grid" 
        }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Phim Mới", "slug": "/movies?sort=newest&limit=24" }
    ]);
}

function getFilterConfig() { 
    return JSON.stringify({}); // Trả về rỗng để tắt bộ lọc
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        let page = 1;
        let path = slug || "/movies?sort=newest&limit=24";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }
        
        // Luôn trỏ thẳng vào API để nhận JSON 
        let resultUrl = BASEAPI + (path.startsWith('/') ? '' : '/') + path;

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl;
        
    } catch (e) {
        return BASEAPI + "/movies?sort=newest&limit=24";
    }
}

function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            let filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    
    // Gọi API chuẩn của website Onflix
    let searchUrl = BASEAPI + "/search?q=" + encodeURIComponent(keyword.trim()) + "&type=all";
    if (page > 1) {
        searchUrl += "&page=" + page;
    }
    return searchUrl;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + (slug.startsWith('/') ? '' : '/') + slug;
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
        var videoData = JSON.parse(html);
        var currentpg = videoData.pagination ? videoData.pagination.current_page : 1;
        var total_pages = videoData.pagination ? videoData.pagination.total_pages : 1;
        
        var dataList = videoData.data || videoData.items || videoData.movies || videoData;
        
        if (Array.isArray(dataList)) {
            for (var j = 0; j < dataList.length; j++) {
                var block = dataList[j];
                var itemSlug = block.slug || (block.link_url ? block.link_url.replace(/^\//, "") : "");
                if (!itemSlug) continue;

                var itemUrl = itemSlug.indexOf("http") === 0 ? itemSlug : BASEURL + "/phim/" + itemSlug.replace(/^phim\//, "");
                
                items.push({
                    "id": itemUrl,
                    "title": (block.title || block.name || "").trim(),
                    "posterUrl": block.poster_url || block.image_url || block.thumb_url || "",
                    "backdropUrl": block.thumb_url || block.background_url || block.poster_url || "",
                    "year": block.year || 2026,
                    "quality": block.quality || "HD",
                    "episode_current": block.episode_current || "Cập nhật",
                    "lang": block.lang || "Vietsub"
                });
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentpg,
                "totalPages": total_pages
            }
        });
        
    } catch (e) {
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, $url) {
    return parseListResponse(html, $url);
}

// =============================================================================
// THUẬT TOÁN BẮT LINK TẬP PHIM CHUẨN (TỪ CODE CỦA BẠN)
// =============================================================================

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
    var result = { movie: null, episodes: [] };

    function traverse(node, isRelated) {
        if (!node) return;

        if (typeof node === 'object' && !Array.isArray(node)) {
            // Lấy thông tin phim
            if (node.movie && typeof node.movie === 'object' && !result.movie && !isRelated) {
                result.movie = node.movie;
            }
            
            // Lấy danh sách tập phim (CHỈ KHI CÓ CHỨA LINK_M3U8 HOẶC LINK_EMBED ĐỂ TRÁNH RỖNG)
            if (Array.isArray(node.episodes) && node.episodes.length > 0 && !isRelated) {
                if (node.episodes[0].link_m3u8 || node.episodes[0].link_embed) {
                    result.episodes = node.episodes;
                } else if (result.episodes.length === 0) {
                    result.episodes = node.episodes;
                }
            }

            for (var key in node) {
                if (node.hasOwnProperty(key)) {
                    traverse(node[key], isRelated || key === 'related' || key === 'collection');
                }
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                traverse(node[i], isRelated);
            }
        }
    }

    traverse(data, false);
    return result;
}

function parseMovieDetail(html, $url) {
    try {
        var movie = null;
        var episodesList = [];

        // QUÉT TẤT CẢ THẺ SCRIPT CHỨA PAYLOAD CỦA NEXT.JS
        var scripts = _$(html).find("script").elements;
        for (var i = 0; i < scripts.length; i++) {
            var scrText = _$(scripts[i]).text();
            
            // Tìm các đoạn chứa payload
            if (scrText.indexOf("self.__next_f.push") > -1) {
                var parsedPayload = parseNextPayload(scrText);
                if (parsedPayload) {
                    var cleanData = extractCleanData(parsedPayload);
                    
                    if (!movie && cleanData.movie) {
                        movie = cleanData.movie;
                    }
                    // Nếu mảng episodes lấy được có dữ liệu, gán vào episodesList
                    if (episodesList.length === 0 && cleanData.episodes && cleanData.episodes.length > 0) {
                        episodesList = cleanData.episodes;
                    }
                }
            }
        }

        var actors = "";
        if (movie && movie.actors) {
            movie.actors.forEach(function(actor) { actors += actor.name + ", "; });
        }

        var serversMap = {};

        // NẾU TÌM ĐƯỢC DANH SÁCH TẬP
        if (episodesList && Array.isArray(episodesList)) {
            episodesList.forEach(function(episode) {
                // Ưu tiên m3u8, nếu m3u8 là trang xem chung/chặn thì lấy embed
                var streamLink = episode.link_m3u8;
                if (!streamLink || streamLink.indexOf("https://ss.onflixstream.site") > -1) {
                    if (episode.link_embed) {
                        streamLink = episode.link_embed;
                    }
                }

                // Nếu không có link xem -> bỏ qua để không tạo thư mục rỗng
                if (!streamLink || streamLink === "undefined" || streamLink === "null") return;

                var rawServerName = episode.server_name || "Vietsub";
                var cleanServerName = "Vietsub";
                
                if (rawServerName.indexOf("PA") > -1 || rawServerName.toLowerCase().indexOf("kk") > -1) cleanServerName = "KK Phim";
                else if (rawServerName.indexOf("OP") > -1 || rawServerName.toLowerCase().indexOf("ổ phim") > -1) cleanServerName = "Ổ Phim";
                else if (rawServerName.indexOf("NC") > -1 || rawServerName.toLowerCase().indexOf("nguồn c") > -1) cleanServerName = "Nguồn C";
                else if (rawServerName.toLowerCase().indexOf("thuyết minh") > -1) cleanServerName = "Thuyết Minh";
                else cleanServerName = rawServerName;

                if (!serversMap[cleanServerName]) {
                    serversMap[cleanServerName] = {};
                }

                var epSlug = "tap-" + (episode.slug || episode.name || "1");
                
                if (!serversMap[cleanServerName][epSlug]) {
                    serversMap[cleanServerName][epSlug] = {
                        id: streamLink,            
                        name: "Tập " + (episode.slug || episode.name || "1"),     
                        slug: epSlug        
                    };
                }
            });
        }

        var servers = [];
        for (var sName in serversMap) {
            var epsArray = Object.values(serversMap[sName]);
            epsArray.sort(function(a, b) {
                var numA = parseInt(a.name.replace(/[^\d]/g, '')) || 0;
                var numB = parseInt(b.name.replace(/[^\d]/g, '')) || 0;
                return numA - numB;
            });

            // Chỉ đẩy vào Server nếu tồn tại các tập phim thực sự có link
            if (epsArray.length > 0) {
                servers.push({
                    name: sName,
                    episodes: epsArray
                });
            }
        }

        // Chống lỗi folder rỗng tuyệt đối: Nếu API lỗi không lấy được mảng nào, tạo 1 tập giả để mở webview
        if (servers.length === 0) {
            servers.push({
                name: "Server Trực Tiếp",
                episodes: [{ id: $url, name: "Xem Phim", slug: "full" }]
            });
        } else {
            servers.sort(function(a, b) {
                function getPriority(name) {
                    if (name.indexOf("KK Phim") > -1) return 1;  
                    if (name.indexOf("Ổ Phim") > -1) return 2;    
                    if (name.indexOf("Vietsub") > -1) return 3;
                    return 4;                                        
                }
                return getPriority(a.name) - getPriority(b.name);
            });
        }

        // Xử lý thông tin hiển thị (fallback sang HTML tags nếu json tịt)
        var title = movie ? movie.title : "";
        if (!title) {
            var mTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
            title = mTitle ? mTitle[1].split('|')[0].trim() : "Phim Onflix";
        }

        var poster = movie ? movie.poster_url : "";
        if (!poster) {
            var mImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            poster = mImg ? mImg[1] : "";
        }

        var desc = movie ? movie.content : "";
        if (!desc) {
            var mDesc = html.match(/<meta name="description" content="([^"]+)"/i);
            desc = mDesc ? mDesc[1] : "";
        }

        return JSON.stringify({
            id: $url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: movie ? movie.quality : "HD",
            year: movie ? movie.year : 2026,
            status: servers[0].episodes.length + " Tập",
            duration: movie ? movie.time : "",
            casts: actors,
            director: movie ? movie.directors : "",
            category: movie && movie.categories && movie.categories[0] ? movie.categories[0].name : "",
            lang: movie ? movie.lang : "Vietsub",
            country: movie && movie.countries && movie.countries[0] ? movie.countries[0].name : ""
        });
    } 
    catch (e) {
        log("Lỗi parseMovieDetail: " + e);
        return JSON.stringify({ id: $url, title: "Lỗi chi tiết phim", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        var streamUrl = url;
        
        if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
        else if (streamUrl.indexOf("/") === 0) streamUrl = BASEURL + streamUrl;

        // Nếu link có m3u8 thì là link trực tiếp, không thì là nhúng embed
        var isEmbed = streamUrl.indexOf(".m3u8") === -1 && streamUrl.indexOf(".mp4") === -1;
        
        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "mimeType": isEmbed ? "" : "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL + "/",
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Block-Ads": "true",
                "Block-Redirects": "true"
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// DOM LIBRARY _$
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match( /:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[ 3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match( /\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/ );if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);selectorToParse = selectorToParse.substring(0, idIndex) + ( nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} var isAttrOnly = (selector === "" && hasAttrFilter);for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = currentHtml.indexOf('>',pos);if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = "";if (spacePos === -1) {currentTagName = fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase();} else {currentTagName = fullOpenTag.substring(1,spacePos) .toLowerCase();} var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} if (isMatched && targetId) {var idMatchStr = "";var idPos = fullOpenTag.indexOf('id="');if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag .indexOf('"',startQuote));} else {idPos = fullOpenTag.indexOf("id='");if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (idMatchStr !== targetId) {isMatched = false;}} if (isMatched && targetClasses.length > 0) {var classMatchStr = "";var classPos = fullOpenTag.indexOf('class="');if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {classPos = fullOpenTag.indexOf("class='");if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {attrPos = fullOpenTag.indexOf(attrNameFilter + "='");if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (attrPos === -1) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta' ];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr .length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter) === -1) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[ 0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[ subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var searchStr = attrName + '="';var pos = elem.indexOf(searchStr);if (pos === -1) {searchStr = attrName + "='";pos = elem.indexOf(searchStr);} if (pos === -1) return "";var start = pos + searchStr.length;var quoteType = elem.charAt(start - 1);var end = elem.indexOf(quoteType,start);return end === -1 ? "" : elem.substring(start,end);},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) return elem.substring(start,end);return "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();} return "";}};return instance;}
