// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var DOMAIN = "https://motchillw.blue";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native iOS 9.0: Bắt link m3u8 trực tiếp, Không quảng cáo, Không lỗi zoom.",
        "version": "9.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // QUAN TRỌNG: Dùng trình phát Native iOS, chặn tận gốc lỗi Autoplay
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
    var listurl = `/danh-sach@@Phim Mới Đề Cử@@true`;
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
    return JSON.stringify({ category: menulist });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
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
            var fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) path = filters.category[0].slug;
                    else if (typeof filters.category === 'string') path = filters.category;
                }
            } catch (jsonErr) {}
        }

        var resultUrl = BASEURL;
        if (path) resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 1) resultUrl += "?page=" + page;

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEURL;
        if (page > 1) resultUrl += "/search/" + page + "?q=" + encodedKeyword;
        else resultUrl += "/search?q=" + encodedKeyword;

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + "/search?q=" + encodeURIComponent(keyword || "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS LẤY DANH SÁCH (TRANG CHỦ / TÌM KIẾM)
// Cào giao diện dạng thẻ Grid như ảnh image_11b51e.jpg
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        // Quét thẻ chứa phim: .movie-card hoặc thẻ a bọc ngoài
        var regex = /<a[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var url = match[1].trim();
            var title = match[2].trim();
            var img = match[3].trim();
            
            if (!title) continue;
            
            // Lọc ra các thẻ a không phải phim (như category, menu...)
            if (url.indexOf('/phim/') === -1 && url.indexOf('/movies/') === -1) continue;
            
            if (url.indexOf("http") === -1) url = BASEURL + (url.startsWith('/') ? '' : '/') + url;
            if (img.indexOf("http") === -1) img = BASEURL + (img.startsWith('/') ? '' : '/') + img;

            // Xóa HTML entities
            title = title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
            img = img.replace(/&amp;/g, '&');

            // Bắt Tập hiện tại
            var curMatch = html.substring(match.index).match(/(?:Tập|Trọn bộ|Hoàn tất)\s*([\d\/]+)/i);
            var current = curMatch ? curMatch[0] : "HD";

            if (!seen[url]) {
                items.push({
                    "id": url,
                    "title": title,
                    "posterUrl": img,
                    "backdropUrl": img,
                    "quality": "HD",
                    "lang": "Vietsub",
                    "episode_current": current
                });
                seen[url] = true;
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 999 }
        });
        
    } catch (e) {
        return JSON.stringify({
            "items": [{ "id": $url, "title": "Lỗi tải trang", "posterUrl": "", "backdropUrl": "" }],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// PARSER CHI TIẾT (2 LƯỢT QUÉT CHỐNG AUTOPLAY IOS)
// Lượt 1: Đọc trang giới thiệu phim -> Cào JSON ẩn -> Gắn "extra"
// Lượt 2: Đọc file JSON từ API ẩn -> Gắn thẳng Link vào danh sách Server
// =============================================================================

var cachedMovieDetailId = ""; 

function transformMovieData(data) {
    const servers = [];
    if (!data || !data.servers) return servers;

    data.servers.forEach(function(server) {
        const episodeMap = {};
        server.items.forEach(function(item) {
            var link = item.link;
            if (!link) return;
            // Xử lý chuẩn hóa link (Bổ sung an toàn cho iOS)
            if (link.startsWith("//")) link = "https:" + link;
            if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0 && link.indexOf('/') !== 0) return;
            
            const slug = item.slug;
            // Ưu tiên M3U8 (Native) hơn Embed
            if (!episodeMap[slug] || (item.type === 'm3u8' && episodeMap[slug].type === 'embed')) {
                episodeMap[slug] = {
                    id: link,
                    name: item.name,
                    slug: item.slug,
                    type: item.type
                };
            }
        });
        
        const items = Object.values(episodeMap).map(function(ep) {
            // Định dạng tên tập phim
            var cleanName = ep.name;
            if (!cleanName.toLowerCase().includes("tập") && !isNaN(parseInt(cleanName))) {
                cleanName = "Tập " + cleanName;
            }
            return { id: ep.id, name: cleanName, slug: ep.slug };
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
        
        // Nhận diện Lượt 2: Có phải nội dung trả về là JSON không?
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        
        var id = "";
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "";
        var episode_current = "";
        var quality = "";
        var year = 2026;
        var rating = 8;
        var servers = [];
        var extra = "";
        
        if (!isJsonCall) {
            // =============================================================================
            // LƯỢT 1: ĐỌC TRANG HTML CHI TIẾT
            // =============================================================================
            var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) || /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
            id = idMatch ? idMatch[1] : (url || "");
            cachedMovieDetailId = id; 
            
            var rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (rmatch && rmatch[1]) limg = rmatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;
            
            rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (rmatch && rmatch[1]) lname = rmatch[1].split('-')[0].split('|')[0].trim();
            
            var descMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
            if (descMatch) {
                ldes = descMatch[1].replace(/<[^>]*>/g, '').trim();
            }
            
            // Tìm movie_id siêu ẩn trong đống JSON khổng lồ self.__next_f.push của Next.js
            var idVideo = null;
            // 1. Quét tìm cấu trúc JSON movie
            var movieJsonMatch = html.match(/\\?"movie_id\\?"\s*:\s*\\?"(\d+)\\?"/i) || 
                                 html.match(/"id"\s*:\s*"(\d+)",\s*"name"\s*:\s*"[^"]+",\s*"origin_name"/i);
                                 
            if (movieJsonMatch) {
                idVideo = movieJsonMatch[1];
            } else {
                // 2. Tìm trong cấu trúc API public
                var altApiMatch = html.match(/baseapi\/episodes\?movie_id=(\d+)/i);
                if (altApiMatch) idVideo = altApiMatch[1];
            }
            
            if (idVideo) {
                // Link API ngầm của Motchill trả về JSON danh sách tập CÓ CHỨA LINK STREAM
                extra = BASEURL + "/baseapi/episodes?movie_id=" + idVideo;
            } else {
                // Dự phòng: Có một số phim lẻ nó trả thẳng thẻ Iframe hoặc m3u8 ngoài HTML
                var m3u8Fallback = html.match(/(https?:\/\/[^"'\s]+\.m3u8)/i);
                var iframeFallback = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                
                if (m3u8Fallback) {
                    servers.push({ name: "Phim Lẻ", episodes: [{ id: m3u8Fallback[1], name: "Full", slug: "full" }] });
                } else if (iframeFallback) {
                    servers.push({ name: "Embed Player", episodes: [{ id: iframeFallback[1], name: "Full", slug: "full" }] });
                }
            }
            
        } else {
            // =============================================================================
            // LƯỢT 2: NHẬN KẾT QUẢ JSON TỪ LINK EXTRA (Từ API ngầm)
            // =============================================================================
            id = cachedMovieDetailId || "";
            if (html) {
                var $json = JSON.parse(html.trim());
                servers = transformMovieData($json);
            }
            extra = ""; // Đặt rỗng để cắt đuôi vòng lặp
        }
        
        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: rating,
            category: "Phim Chill",
            episode_current: "Cập nhật",
            servers: servers, 
            extra: extra 
        });
        
    } catch (e) {
        log(e);
        return JSON.stringify({ id: cachedMovieDetailId || url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// PARSER CHI TIẾT TẬP & CÀO LINK STREAM NATIVE
// (Hàm này nhận thẳng đường link .m3u8 từ Lượt 2 truyền sang)
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var isEmbed = false;
        var streamUrl = url;

        // Nếu link truyền vào không phải m3u8 hay mp4, mà có dạng iframe hoặc trang web bên thứ 3
        if (streamUrl.indexOf('.m3u8') === -1 && streamUrl.indexOf('.mp4') === -1) {
            isEmbed = true; 
        }

        // Chống lỗi đường dẫn tương đối từ máy chủ Motchill
        if (streamUrl.startsWith('/player/master/')) {
            streamUrl = BASEURL + streamUrl;
            isEmbed = true; // Link /player/... của họ bắt buộc nhúng iframe
        } else if (streamUrl.startsWith("//")) {
            streamUrl = "https:" + streamUrl;
        }

        // Truyền thẳng đường link xịn về Native Player của iOS (Cực kỳ nhẹ máy)
        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "headers": {
                "Referer": BASEURL + "/",
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

// =============================================================================
// MENUS THỂ LOẠI (Chỉnh sửa theo đúng menu của Motchill)
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
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}

// =============================================================================
// THƯ VIỆN DOM ẢO _$(html) GỌN NHẸ TỪ PHIÊN BẢN CŨ ĐỂ QUÉT TRANG CHỦ
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var targetTagName = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = -1;var insideQuote = false;var quoteChar = '';for (var j = pos + 1;j < currentHtml.length;j++) {var char = currentHtml.charAt(j);if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') {if (!insideQuote) {insideQuote = true;quoteChar = char;} else if (char === quoteChar) {insideQuote = false;}} if (char === '>' && !insideQuote) {endOpenTag = j;break;}} if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/);var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : "";var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : "";if (isMatched && targetClasses.length > 0) {if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr.length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);subResults.push(foundBlock);pos = endTagPos;} else {pos++;}} results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);var pureText = content.replace(/<\/?[^>]+(>|$)/g," ");return pureText.trim();} return "";}};return instance;};
