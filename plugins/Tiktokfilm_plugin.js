// =============================================================================
// PLUGIN VAAPP: PHIMNGAN.NET (Sử Dụng Giao Diện Webview Gốc)
// =============================================================================

var BASEURL = "https://phimngan.net";

function getManifest() {
    return JSON.stringify({
        "id": "ShortTV",
        "name": "ShortTV",
        "description": "Nền tảng xem phim ngắn, phim dọc người thật đóng và phim AI.",
        "version": "1.0.2",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/icon-192x192.png",
        "isEnabled": true,
        "type": "shortfilm",           
        "layoutType": "VERTICAL",      
        "playerType": "embed" // [QUAN TRỌNG] Vô hiệu hóa Sniffer, dùng Webview hiển thị giao diện web
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[phimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[phimngan] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: '', title: 'Mới Cập Nhật', type: 'Grid' },
        { slug: 'genres/phim-ai', title: 'Phim AI', type: 'Horizontal' },
        { slug: 'genres/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal' },
        { slug: 'genres/tong-tai', title: 'Tổng Tài', type: 'Horizontal' },
        { slug: 'genres/cung-dau', title: 'Cung Đấu', type: 'Grid' },
        { slug: 'genres/hanh-dong', title: 'Hành Động', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: '' },
        { name: 'Phim AI', slug: 'genres/phim-ai' },
        { name: 'Ngôn Tình', slug: 'genres/ngon-tinh' },
        { name: 'Tổng Tài', slug: 'genres/tong-tai' },
        { name: 'Cung Đấu', slug: 'genres/cung-dau' },
        { name: 'Gia Đình', slug: 'genres/gia-dinh' },
        { name: 'Hài Hước', slug: 'genres/hai-huoc' },
        { name: 'Phục Thù', slug: 'genres/phuc-thu' },
        { name: 'Xuyên Không', slug: 'genres/xuyen-khong' }
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

        if (slug && slug.indexOf("http") === 0) return slug;

        var resultUrl = BASEURL + (slug ? "/" + slug : "");

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        
        return resultUrl;
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encoded = encodeURIComponent(keyword.trim());
    return BASEURL + "/search?q=" + encoded;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL + "/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, apiUrl) {
    try {
        var items = [];
        var seen = {}; 

        // Quét DOM ảo an toàn để lấy danh sách phim
        _$(html).find("a").each(function() {
            var href = this.attr("href");
            if (href && (href.indexOf("/phim/") > -1 || href.indexOf("/watch/") > -1)) {
                var id = BASEURL + href;
                
                if (seen[id]) return; // Chống lặp
                
                var title = this.find("h3").text() || this.find("img").attr("alt");
                var src = this.find("img").attr("src") || this.find("img").attr("srcset");
                
                if (title && src) {
                    // Xử lý ảnh của Next.js
                    if (src.indexOf("_next/image?url=") > -1) {
                        var m = src.match(/url=([^&]+)/);
                        if (m) src = decodeURIComponent(m[1]);
                    } else if (src.indexOf("http") === -1) {
                        src = BASEURL + src;
                    }
                    
                    var ep = this.find("span").eq(0).text() || "Full";
                    
                    items.push({
                        id: id,
                        title: title.trim(),
                        posterUrl: src,
                        backdropUrl: src,
                        quality: "HD",
                        episode_current: ep.trim()
                    });
                    
                    seen[id] = true;
                }
            }
        });

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: 99 // Nền tảng dùng cuộn load tự động
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(" - PhimNgan.Net", "") : "Phim Ngắn";

        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1] : "";

        // Trả URL trực tiếp để Webview tự load và người dùng có thể tự vuốt trên giao diện gốc
        var servers = [{
            name: "Giao Diện Web",
            episodes: [{
                id: url,
                name: "Mở Phim Ngắn",
                slug: "full"
            }]
        }];

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD"
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi phim", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        // Chèn CSS và JS để ẩn toàn bộ rác (menu, sidebar, comments) và ép video tràn màn hình
        var customJsCode = `
            var style = document.createElement('style');
            style.innerHTML = 'aside, header, nav, footer, .sidebar, .menu, .comments { display: none !important; opacity: 0 !important; pointer-events: none !important; } ' +
                              'main, .w-full, .flex-1 { width: 100vw !important; height: 100vh !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; } ' +
                              'body, html { overflow: hidden !important; background: #000 !important; }';
            document.head.appendChild(style);
            
            // Tự động nhấn phát phim nếu bị dừng
            setTimeout(function() {
                var v = document.querySelector('video');
                if (v && v.paused) {
                    var btn = document.querySelector('button[aria-label="Play"], .vjs-big-play-button');
                    if (btn) btn.click();
                    else v.play();
                }
            }, 1000);
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
                "Custom-Js": customJsCode.replace(/\n/g, " ").replace(/\r/g, "").trim()
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }

// =============================================================================
// THƯ VIỆN DOM ẢO _$
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),length: 0,find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = currentHtml.indexOf('>',pos);if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = "";if (spacePos === -1) {currentTagName = fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase();} else {currentTagName = fullOpenTag.substring(1,spacePos).toLowerCase();} var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} if (isMatched && targetId) {var idMatchStr = "";var idPos = fullOpenTag.indexOf('id="');if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {idPos = fullOpenTag.indexOf("id='");if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (idMatchStr !== targetId) {isMatched = false;}} if (isMatched && targetClasses.length > 0) {var classMatchStr = "";var classPos = fullOpenTag.indexOf('class="');if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {classPos = fullOpenTag.indexOf("class='");if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {attrPos = fullOpenTag.indexOf(attrNameFilter + "='");if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (attrPos === -1) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr.length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter) === -1) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var searchStr = attrName + '="';var pos = elem.indexOf(searchStr);if (pos === -1) {searchStr = attrName + "='";pos = elem.indexOf(searchStr);} if (pos === -1) return "";var start = pos + searchStr.length;var quoteType = elem.charAt(start - 1);var end = elem.indexOf(quoteType,start);return end === -1 ? "" : elem.substring(start,end);},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) return elem.substring(start,end);return "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();} return "";}};return instance;}
