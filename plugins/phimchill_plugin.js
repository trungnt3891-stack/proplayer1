// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimchillhdf.im";

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Phim online chất lượng cao",
        "version": "3.8.0",             
        "baseUrl": BASEURL,
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/motherless_logo.jpgphimchill.ico", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([{
        "slug": "danh-sach/phim-moi.html",
        "title": "Phim Mới",
        "type": "Grid"
    }]);
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
    if (slug && slug.indexOf("http") > -1) {
        return slug;
    }

    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        var page = parseInt(filters.page) || 1;
        var path = slug || "";

        if (filters.category) {
            if (Array.isArray(filters.category) && filters.category.length > 0) {
                path = filters.category[0].slug || path;
            } else if (typeof filters.category === "string") {
                path = filters.category;
            }
        }

        var url = BASEURL + (path ? "/" + path : "");
        if (page > 1) {
            url += "?page=" + page;
        }

        return url.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "");
    var page = 1;

    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        page = parseInt(filters.page) || 1;
    } catch (e) {}

    var url = BASEURL + "/?search=" + encodedKeyword;
    if (page > 1) {
        url += "&page=" + page;
    }

    return url;
}

function getUrlDetail(id) {
    if (!id) return "";
    if (id.indexOf("play-") === 0) {
        var playUrl = id.replace("play-", "");
        if (playUrl.indexOf('http') !== 0) playUrl = BASEURL + playUrl;
        return playUrl;
    }
    if (id.indexOf('http') === 0) return id;
    return BASEURL + id;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var pattern = /(?=<article[^>]*class="[^"]*max-w-xs[^"]*")/g;
        var splitItems = html.split(pattern).filter(Boolean);

        for (var j = 1; j < splitItems.length; j++) {
            var block = splitItems[j];
            var hrefMatch = block.match(/href="([^"]+)"/i);
            if (!hrefMatch) continue;
            var id = hrefMatch[1].trim();

            var title = "";
            var altMatch = block.match(/title="([^"]+)"/i);
            if (altMatch) {
                title = altMatch[1].trim();
            }
            if (!title || title === "Video không tiêu đề") {
                continue;
            }

            var srcMatch = block.match(/img[\s\S]*?src="([^"]+)"/i);
            var posterUrl = srcMatch ? srcMatch[1].trim() : "";
            if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + posterUrl;
            } else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + "/" + posterUrl;
            }
            items.push({
                "id": id,
                "title": title,
                "posterUrl": posterUrl,
                "backdropUrl": posterUrl
            });
        }

        var activeRegex = /active".*?<a[^>]*>\s*(\d+)\s*<\/a>/s;
        var activeMatch = html.match(activeRegex);
        var activePage = activeMatch ? parseInt(activeMatch[1]) : 1;

        var lastPageRegex = /(\d+)\s*<\/a>\s*<\/li>\s*<li[^>]*next/s;
        var lastPageMatch = html.match(lastPageRegex);
        var lastPage = lastPageMatch ? parseInt(lastPageMatch[1]) : 1;

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": activePage,
                "totalPages": lastPage,
                "totalItems": 48 * lastPage,
                "itemsPerPage": 48
            }
        });
    } catch (e) {
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(htmlContent, url) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(htmlContent) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(htmlContent);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/_.]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        
        var limg = "";
        var lname = "Đang cập nhật...";
        var ldes = "Không có mô tả.";
        var ldirec = "";
        var lactor = "";
        var lduran = "";
        
        var rmatch = htmlContent.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="video:director"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldirec = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="video:actor"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lactor = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="video:duration"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lduran = rmatch[1];
        
        // Quét tập phim chuẩn xác từ các khối server của trang xem phim
        var servers = [];
        _$(htmlContent).find('span:content("Danh Sách")').each(function(index, el) {
            var $box = this.next();
            var $nameserver = _$(el).text();
            var $items = [];
            
            $box.find("a").each(function(idx, bl) {
                var $link = _$(bl).attr("href");
                var $number = _$(bl).text();
                
                if ($link) {
                    if ($link.indexOf('http') !== 0) {
                        $link = BASEURL + ($link.startsWith('/') ? '' : '/') + $link;
                    }
                    $items.push({
                        id: $link,
                        name: "Tập " + $number.trim(),
                        slug: "tap-" + $number.trim()
                    });
                }
            });
            
            if ($items.length > 0) {
                servers.push({
                    name: $nameserver.trim() || "Danh Sách Vietsub",
                    episodes: $items
                });
            }
        });

        // Sắp xếp thứ tự các server ưu tiên
        servers.sort((a, b) => {
            const getPriority = (name) => {
                if (name.includes("KK") || name.includes("OP")) return 1;
                if (name.includes("Vietsub")) return 2;
                if (name.includes("NC")) return 4;
                return 3;
            };
            return getPriority(a.name) - getPriority(b.name);
        });

        var extra = "";
        var isPlayPage = /\/tap-[^/]+?\.html$/.test(url || id);
        
        if (!isPlayPage) {
            var playBtnMatch = _$(htmlContent).find(".text-center").find(".mx-auto").attr("href") || 
                               htmlContent.match(/href="([^"]+\/tap-1[^"]*)"/i);
            if (playBtnMatch) {
                extra = typeof playBtnMatch === 'string' ? playBtnMatch : playBtnMatch[1];
                if (extra.indexOf('http') !== 0) {
                    extra = BASEURL + (extra.startsWith('/') ? '' : '/') + extra;
                }
            }
        }
        
        ldes += "\r\n\r\n\r\n" + extra + "\r\n\r\n\r\n" + JSON.stringify(servers);
        
        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: 2026,
            rating: 8.5,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra
        });
        
    } catch (e) {
        return JSON.stringify({
            id: slug || url || "error",
            title: "error",
            servers: []
        });
    }
}

function formatEpisode(numStr) {
    var num = parseInt(numStr, 10);
    if (isNaN(num)) return "01"; 
    return num < 10 ? "0" + num : "" + num;
}

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var VDtype = "";
        _$(html).find('a[data-type="m3u8"]').each(function() {
            var link = this.attr("data-link");
            streamUrl = link;
            VDtype = "m3u8";
        });
        var embed = _$(html).find('a[data-type="embed"]').attr("data-link");
        var typevideo = "true";
        
        if (!streamUrl) {
            typevideo = "false";
            if (embed) {
                streamUrl = embed;
                VDtype = "embed";
            } else {
                streamUrl = url;
            }
        }
        
        var customJs = textJS(typevideo);
        
        if (VDtype == "m3u8") {
            return JSON.stringify({
                "url": streamUrl,
                "isEmbed": false,
                "mimeType": "application/x-mpegURL",
                "headers": {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "subtitles": []
            });
        } else {
            return JSON.stringify({
                "url": streamUrl,
                "isEmbed": true,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    "Custom-Js": customJs.trim()
                },
                "subtitles": []
            });
        }
    } catch (e) {
        return JSON.stringify({
            url: url,
            headers: {}
        });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
danh-sach/phim-le.html@@Phim Lẻ
danh-sach/phim-bo.html@@Phim Bộ
the-loai/short-drama.html@@Phim Ngắn
the-loai/tinh-cam.html@@Tình Cảm
the-loai/am-nhac.html@@Âm Nhạc
the-loai/tam-ly.html@@Tâm Lý
the-loai/kinh-di.html@@Kinh Dị
the-loai/tai-lieu.html@@Tài Liệu
the-loai/tv-shows.html@@TV Shows
the-loai/hanh-dong.html@@Hành Động
the-loai/vien-tuong.html@@Viễn Tưởng
the-loai/than-thoai.html@@Thần Thoại
the-loai/vo-thuat.html@@Võ Thuật
the-loai/chien-tranh.html@@Chiến Tranh
the-loai/chinh-kich.html@@Chính Kịch
the-loai/phieu-luu.html@@Phiêu Lưu
the-loai/hai-huoc.html@@Hài Hước
the-loai/co-trang.html@@Cổ Trang
the-loai/gia-dinh.html@@Gia Đình
the-loai/hoc-duong.html@@Học Đường
the-loai/hinh-su.html@@Hình Sự
the-loai/bi-an.html@@Bí Ẩn
the-loai/phim-18.html@@Phim 18+
`;
}

// Script tiêm vào Webview giúp chống Autoplay hiệu quả để bạn thong thả chọn tập
function textJS($links) {
    return `
    LINKVIDEO = ${JSON.stringify($links)};
    window.addEventListener('DOMContentLoaded', function() {
        var vids = document.querySelectorAll('video, iframe');
        for(var i=0; i<vids.length; i++) {
            try { 
                vids[i].pause(); 
                if(vids[i].tagName === 'VIDEO') {
                    vids[i].removeAttribute('autoplay');
                }
            } catch(e){}
        }
    });
    setInterval(function() {
        var vids = document.querySelectorAll('video');
        for(var i=0; i<vids.length; i++) {
            if(!vids[i].paused && vids[i].currentTime < 2) {
                vids[i].pause();
            }
        }
    }, 500);
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
            item = {"slug": link, "title": name, "type": "Horizontal"};
        } else if (check === "true") {
            item = {"slug": link, "title": name, "type": "Grid"};
        } else {
            item = {"slug": link, "name": name};
        }
        menulist.push(item);
    }
    return menulist;
}

function _$(htmlOrBlock) {
    if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {
        return htmlOrBlock;
    }
    var instance = {
        sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',
        elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),
        find: function (selector) {
            if (selector.indexOf(',') !== -1) {
                var results = [];
                var selectors = selector.split(',').map(function (s) { return s.trim(); });
                for (var s = 0; s < selectors.length; s++) {
                    if (selectors[s] === "") continue;
                    var subInstance = this.find(selectors[s]);
                    for (var r = 0; r < subInstance.elements.length; r++) {
                        var element = subInstance.elements[r];
                        if (results.indexOf(element) === -1) { results.push(element); }
                    }
                }
                var multiInstance = _$(results);
                multiInstance.sourceHtml = this.sourceHtml;
                return multiInstance;
            }
            var results = [];
            var contentFilter = "";
            if (selector.indexOf(":content(") !== -1) {
                var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);
                if (contentMatch) {
                    contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";
                    selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, "");
                }
            }
            var attrNameFilter = "";
            var attrValueFilter = "";
            var attrOperator = "=";
            var hasAttrFilter = false;
            var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);
            if (attrMatch) {
                hasAttrFilter = true;
                attrNameFilter = attrMatch[1];
                attrOperator = attrMatch[2];
                attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";
                selector = selector.replace(/\[.*?\]/, "");
            }
            var notSelector = "";
            if (selector.indexOf(":not(") !== -1) {
                var notMatch = selector.match(/:not\(([^)]+)\)/);
                if (notMatch) {
                    notSelector = notMatch[1];
                    selector = selector.replace(/:not\([^)]+\)/, "");
                }
            }
            var isFirstFilter = selector.indexOf(":first") !== -1;
            var isLastFilter = selector.indexOf(":last") !== -1;
            selector = selector.replace(/:first|:last/g, "");
            var targetTagName = "";
            var targetId = "";
            var targetClasses = [];
            var selectorToParse = selector.trim();
            if (selectorToParse !== "") {
                var idIndex = selectorToParse.indexOf('#');
                if (idIndex !== -1) {
                    var afterId = selectorToParse.substring(idIndex + 1);
                    var nextDot = afterId.indexOf('.');
                    targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);
                    selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));
                }
                var classParts = selectorToParse.split('.');
                var possibleTag = classParts.shift();
                if (possibleTag) { targetTagName = possibleTag.toLowerCase(); }
                targetClasses = classParts.filter(function (c) { return c.length > 0; });
            }
            for (var i = 0; i < this.elements.length; i++) {
                var currentHtml = this.elements[i];
                var pos = 0;
                var subResults = [];
                while ((pos = currentHtml.indexOf('<', pos)) !== -1) {
                    if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {
                        pos++;
                        continue;
                    }
                    var endOpenTag = currentHtml.indexOf('>', pos);
                    if (endOpenTag === -1) break;
                    var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1);
                    var spacePos = fullOpenTag.indexOf(' ');
                    var currentTagName = "";
                    if (spacePos === -1) {
                        currentTagName = fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase();
                    } else {
                        currentTagName = fullOpenTag.substring(1, spacePos).toLowerCase();
                    }
                    var isMatched = true;
                    if (targetTagName && targetTagName !== currentTagName) { isMatched = false; }
                    if (isMatched && targetId) {
                        var idMatchStr = "";
                        var idPos = fullOpenTag.indexOf('id="');
                        if (idPos !== -1) {
                            var startQuote = idPos + 4;
                            idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            idPos = fullOpenTag.indexOf("id='");
                            if (idPos !== -1) {
                                var startQuote = idPos + 4;
                                idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (idMatchStr !== targetId) { isMatched = false; }
                    }
                    if (isMatched && targetClasses.length > 0) {
                        var classMatchStr = "";
                        var classPos = fullOpenTag.indexOf('class="');
                        if (classPos !== -1) {
                            var startQuote = classPos + 7;
                            classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            classPos = fullOpenTag.indexOf("class='");
                            if (classPos !== -1) {
                                var startQuote = classPos + 7;
                                classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (classMatchStr) {
                            var currentClasses = classMatchStr.trim().split(/\s+/);
                            for (var c = 0; c < targetClasses.length; c++) {
                                if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; }
                            }
                        } else { isMatched = false; }
                    }
                    if (isMatched && hasAttrFilter) {
                        var actualValue = "";
                        var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');
                        if (attrPos !== -1) {
                            var startQuote = attrPos + attrNameFilter.length + 2;
                            actualValue = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            attrPos = fullOpenTag.indexOf(attrNameFilter + "='");
                            if (attrPos !== -1) {
                                var startQuote = attrPos + attrNameFilter.length + 2;
                                actualValue = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (attrPos === -1) { isMatched = false; } else {
                            if (attrOperator === "=") {
                                if (attrNameFilter === "class") {
                                    var classes = actualValue.trim().split(/\s+/);
                                    if (classes.indexOf(attrValueFilter) === -1) isMatched = false;
                                } else if (actualValue !== attrValueFilter) { isMatched = false; }
                            } else if (attrOperator === "*=") {
                                if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;
                            }
                        }
                    }
                    if (isMatched) {
                        var startTagPos = pos;
                        var endTagPos = endOpenTag + 1;
                        var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta'];
                        if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {
                            var depth = 1;
                            var scanPos = endOpenTag + 1;
                            var openStr = '<' + currentTagName;
                            var closeStr = '</' + currentTagName + '>';
                            while (depth > 0 && scanPos < currentHtml.length) {
                                var nextOpen = currentHtml.indexOf(openStr, scanPos);
                                var nextClose = currentHtml.indexOf(closeStr, scanPos);
                                if (nextClose === -1) { scanPos = currentHtml.length; break; }
                                if (nextOpen !== -1 && nextOpen < nextClose) {
                                    depth++;
                                    scanPos = nextOpen + openStr.length;
                                } else {
                                    depth--;
                                    scanPos = nextClose + closeStr.length;
                                    if (depth === 0) endTagPos = nextClose + closeStr.length;
                                }
                            }
                        }
                        var foundBlock = currentHtml.substring(startTagPos, endTagPos);
                        if (contentFilter) {
                            var pureText = foundBlock.replace(/<[^>]+>/g, "").trim();
                            if (pureText.indexOf(contentFilter) === -1) {
                                pos = endTagPos;
                                continue;
                            }
                        }
                        subResults.push(foundBlock);
                        pos = endTagPos;
                    } else { pos++; }
                }
                results = results.concat(subResults);
            }
            var newInstance = _$(results);
            newInstance.sourceHtml = this.sourceHtml || currentHtml;
            return newInstance;
        },
        each: function (callback) {
            for (var i = 0; i < this.elements.length; i++) {
                var childInstance = _$(this.elements[i]);
                childInstance.sourceHtml = this.sourceHtml;
                callback.call(childInstance, i, this.elements[i]);
            }
            return this;
        },
        attr: function (attrName) {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var searchStr = attrName + '="';
            var pos = elem.indexOf(searchStr);
            if (pos === -1) {
                searchStr = attrName + "='";
                pos = elem.indexOf(searchStr);
            }
            if (pos === -1) return "";
            var start = pos + searchStr.length;
            var quoteType = elem.charAt(start - 1);
            var end = elem.indexOf(quoteType, start);
            return end === -1 ? "" : elem.substring(start, end);
        },
        text: function () {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var start = elem.indexOf('>') + 1;
            var end = elem.lastIndexOf('</');
            if (start > 0 && end > start) {
                var content = elem.substring(start, end);
                return content.replace(/<\/?[^>]+(>|$)/g, "").trim();
            }
            return "";
        },
        next: function () {
            var results = [];
            if (!this.sourceHtml) return this;
            for (var i = 0; i < this.elements.length; i++) {
                var elem = this.elements[i];
                var idx = this.sourceHtml.indexOf(elem);
                if (idx === -1) continue;
                var scanPos = idx + elem.length;
                var nextOpen = this.sourceHtml.indexOf('<', scanPos);
                if (nextOpen !== -1) {
                    if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue;
                    var endOpenTag = this.sourceHtml.indexOf('>', nextOpen);
                    if (endOpenTag === -1) continue;
                    var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1);
                    var spacePos = fullOpenTag.indexOf(' ');
                    var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase();
                    var startTagPos = nextOpen;
                    var endTagPos = endOpenTag + 1;
                    var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta'];
                    if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {
                        var depth = 1;
                        var sPos = endOpenTag + 1;
                        var openStr = '<' + currentTagName;
                        var closeStr = '</' + currentTagName + '>';
                        while (depth > 0 && sPos < this.sourceHtml.length) {
                            var nOpen = this.sourceHtml.indexOf(openStr, sPos);
                            var nClose = this.sourceHtml.indexOf(closeStr, sPos);
                            if (nClose === -1) break;
                            if (nOpen !== -1 && nOpen < nClose) {
                                depth++;
                                sPos = nOpen + openStr.length;
                            } else {
                                depth--;
                                sPos = nClose + closeStr.length;
                                if (depth === 0) endTagPos = nClose + closeStr.length;
                            }
                        }
                    }
                    results.push(this.sourceHtml.substring(startTagPos, endTagPos));
                }
            }
            var nextInstance = _$(results);
            nextInstance.sourceHtml = this.sourceHtml;
            this.elements = results;
            return this;
        }
    };
    return instance;
}
