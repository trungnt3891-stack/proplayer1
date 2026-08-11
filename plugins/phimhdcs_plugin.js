// =============================================================================
// PLUGIN VAX PLAYER: PHIMHDCSS.NET (V3 - CHIẾN THUẬT HOOK BLOB + EMBEDTOEXOPLAY)
// =============================================================================
var DOMAIN = "phimhdcss.net";
var BASEURL = "https://" + DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "phimhdcss",
        "name": "PhimHDC",
        "description": "Phiên bản chiến thuật HOOK: Bắt Blob M3U8 và Video tag siêu tốc.",
        "version": "1.0.3",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/storage/images/logos-xemphimhdc.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Ép sử dụng Webview ngầm để chạy Sniffer
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[PhimHDC] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[PhimHDC] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: '/danh-sach/top-phim-ngay', title: 'Top Phim Ngày', type: 'Grid' },
        { slug: '/danh-sach/phim-bo', title: 'Phim Bộ Mới', type: 'Horizontal' },
        { slug: '/danh-sach/phim-le', title: 'Phim Lẻ Mới', type: 'Horizontal' },
        { slug: '/danh-sach/phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal' },
        { slug: '/the-loai/hoat-hinh', title: 'Hoạt Hình - Anime', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Top Phim Ngày', slug: '/danh-sach/top-phim-ngay' },
        { name: 'Phim Bộ', slug: '/danh-sach/phim-bo' },
        { name: 'Phim Lẻ', slug: '/danh-sach/phim-le' },
        { name: 'Chiếu Rạp', slug: '/danh-sach/phim-chieu-rap' },
        { name: 'Phim Full', slug: '/danh-sach/phim-hoan-thanh' },
        { name: 'Trung Quốc', slug: '/quoc-gia/trung-quoc' },
        { name: 'Hàn Quốc', slug: '/quoc-gia/han-quoc' },
        { name: 'Thái Lan', slug: '/quoc-gia/thai-lan' },
        { name: 'Âu Mỹ', slug: '/quoc-gia/au-my' },
        { name: 'Cổ Trang', slug: '/the-loai/co-trang' },
        { name: 'Ngôn Tình', slug: '/the-loai/ngon-tinh' },
        { name: 'Hành Động', slug: '/the-loai/hanh-dong' },
        { name: 'Kinh Dị', slug: '/the-loai/kinh-di' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") === 0) return slug;
    
    var page = 1;
    var path = slug || "/";
    try {
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        }
    } catch (e) {}

    var url = BASEURL + (path.startsWith('/') ? path : '/' + path);
    if (page > 1) {
        url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        }
    } catch (e) {}

    var url = BASEURL + "/?search=" + encodeURIComponent(keyword);
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
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
// PARSERS DATA
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var doc = _$(html);
        
        doc.find("li.item").each(function() {
            var aTag = this.find("a");
            var href = aTag.attr("href");
            if (!href) return;

            var imgTag = this.find("img.img-film");
            var poster = imgTag.attr("src") || imgTag.attr("data-src") || "";
            if (poster && poster.indexOf('http') !== 0) poster = BASEURL + poster;

            var title = this.find("div.name").find("a").text() || imgTag.attr("title") || "";
            var epCurrent = this.find("span.label").text() || "HD";

            items.push({
                "id": href,
                "title": title.replace(/\n/g, '').trim(),
                "posterUrl": poster,
                "backdropUrl": poster,
                "episode_current": epCurrent.trim(),
                "quality": "HD"
            });
        });

        var currentPage = 1;
        var pageMatch = url ? url.match(/page=(\d+)/) : null;
        if (pageMatch) currentPage = parseInt(pageMatch[1]);

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentPage,
                "totalPages": items.length >= 10 ? currentPage + 1 : currentPage
            }
        });
    } catch (e) {
        log("parseListResponse error: " + e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var doc = _$(html);
        
        var title = doc.find("h1 span.title").text() || doc.find("h1").text() || "";
        var poster = doc.find(".poster img[itemprop='image']").attr("src") || "";
        if (poster && poster.indexOf('http') === -1) poster = BASEURL + poster;

        var desc = doc.find("#info-film .tab p").text() || doc.find("p.short-description").text() || "Đang cập nhật nội dung...";
        var status = doc.find("dd.film-status span.badge").text() || "Đang chiếu";
        var rating = parseFloat(doc.find("span.average").text() || "8.0");
        
        var getMeta = function(keyword) {
            return doc.find("dt:content('"+keyword+"')").next().text().replace(/\n/g, '').trim();
        };

        var category = getMeta("Thể loại:");
        var country = getMeta("Quốc gia:");
        var year = parseInt(getMeta("Năm sản xuất:")) || 2026;
        var duration = getMeta("Thời lượng:");
        var casts = getMeta("Diễn viên:");

        // BÓC TÁCH MÁY CHỦ & TẬP PHIM (Chuỗi liên kết .find)
        var servers = [];
        
        doc.find(".control-box").each(function() {
            var rawServerBlock = this.find(".server-episode-block").text() || "";
            var serverName = rawServerBlock.replace(/Danh sách Server|Danh sách|:/gi, "").trim() || "Vietsub";
            var eps = [];
            
            this.find(".list-episode").find("a").each(function() {
                var epHref = this.attr("href");
                var epName = this.text().trim();
                
                if (epHref && epHref.indexOf('javascript') === -1 && epHref !== '#') {
                    if (epHref.indexOf("http") === 0) {
                        epHref = epHref.replace(/https?:\/\/[^\/]+/i, BASEURL);
                    } else if (epHref.indexOf("/") === 0) {
                        epHref = BASEURL + epHref;
                    }
                    
                    eps.push({
                        id: epHref,
                        name: epName,
                        slug: "tap-" + epName.toLowerCase().replace(/[^a-z0-9]/g, '-')
                    });
                }
            });

            if (eps.length > 0) {
                eps.reverse();
                servers.push({
                    name: serverName,
                    episodes: eps
                });
            }
        });

        // Backup tìm nút Xem Phim nếu list tập trống
        if (servers.length === 0) {
            var watchLink = doc.find(".btn-stream-link").attr("href");
            if (watchLink) {
                if (watchLink.indexOf("http") === 0) watchLink = watchLink.replace(/https?:\/\/[^\/]+/i, BASEURL);
                else if (watchLink.indexOf("/") === 0) watchLink = BASEURL + watchLink;
                servers.push({
                    name: "Nguồn Phát",
                    episodes: [{ id: watchLink, name: "Tập Cập Nhật", slug: "full" }]
                });
            }
        }

        return JSON.stringify({
            id: url,
            title: title.trim(),
            posterUrl: poster,
            backdropUrl: poster,
            description: desc.trim(),
            quality: "HD",
            year: year,
            rating: rating,
            status: status.trim(),
            duration: duration,
            category: category,
            country: country,
            casts: casts,
            servers: servers
        });

    } catch (e) {
        log("parseMovieDetail error: " + e);
        return JSON.stringify({ id: url, title: "Lỗi Tải Phim", servers: [] });
    }
}

// =============================================================================
// [CHIẾN THUẬT HOOK] TÓM GỌN BLOB M3U8 VÀ VIDEO TAG
// =============================================================================
function parseDetailResponse(html, apiUrl) {
    try {
        var url = apiUrl.split("|")[0];

        // MÃ JS HOOK - KHÔNG ĐỂ DẤU CHÚ THÍCH // ĐỂ TRÁNH LỖI KHI APP MINIFY GỘP DÒNG
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var playerHeaders = JSON.stringify({
                "Referer": window.location.href,
                "User-Agent": navigator.userAgent
            });

            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                var originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = function(blob) {
                    var blobUrl = originalCreateObjectURL.apply(this, arguments);
                    if (blob && (blob instanceof Blob || blob instanceof File)) {
                        var processContent = function(content) {
                            if (content && content.trim().indexOf('#EXTM3U') === 0) {
                                if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
                                    window.SnifferBridge.log("Da bat Blob M3U8 thanh cong!");
                                    window.SnifferBridge.playM3u8Content(content, window.location.href, playerHeaders);
                                }
                            }
                        };
                        if (typeof blob.text === 'function') {
                            blob.text().then(processContent).catch(function(){});
                        } else {
                            var reader = new FileReader();
                            reader.onload = function(e) { processContent(e.target.result); };
                            reader.readAsText(blob);
                        }
                    }
                    return blobUrl;
                };
            }

            var checkCount = 0;
            var checkInterval = setInterval(function() {
                try {
                    var skipBtn = document.getElementById("resumeBtn") || document.querySelector(".resume-btn");
                    if (skipBtn) {
                        var style = window.getComputedStyle(skipBtn);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            skipBtn.click();
                        }
                    }

                    var playBtn = document.querySelector('.jw-icon-display, .vjs-big-play-button, .plyr__control--overlaid, .play-btn');
                    if (playBtn) playBtn.click();

                    var video = document.querySelector('video');
                    if (video && video.src && video.src.indexOf('http') === 0) {
                        if (window.SnifferBridge) {
                            window.SnifferBridge.log("Da bat duoc link video: " + video.src);
                            window.SnifferBridge.play(video.src, playerHeaders);
                        }
                        clearInterval(checkInterval);
                    } else {
                        if (window.SnifferBridge) window.SnifferBridge.log("Dang cho the video xuat hien... (" + checkCount + ")");
                    }

                    checkCount++;
                    if (checkCount > 30) {
                        clearInterval(checkInterval);
                    }
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Loi CustomJS: " + err.message);
                }
            }, 1000);
        })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Block-Ads": "true",
                "Block-Redirects": "true",
                "Custom-Js": customJsCode.replace(/\n/g, " ").replace(/\r/g, "").trim()
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": apiUrl.split("|")[0], "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),length: 0,find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = currentHtml.indexOf('>',pos);if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = "";if (spacePos === -1) {currentTagName = fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase();} else {currentTagName = fullOpenTag.substring(1,spacePos).toLowerCase();} var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} if (isMatched && targetId) {var idMatchStr = "";var idPos = fullOpenTag.indexOf('id="');if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {idPos = fullOpenTag.indexOf("id='");if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (idMatchStr !== targetId) {isMatched = false;}} if (isMatched && targetClasses.length > 0) {var classMatchStr = "";var classPos = fullOpenTag.indexOf('class="');if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {classPos = fullOpenTag.indexOf("class='");if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {attrPos = fullOpenTag.indexOf(attrNameFilter + "='");if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (attrPos === -1) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr.length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter) === -1) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var searchStr = attrName + '="';var pos = elem.indexOf(searchStr);if (pos === -1) {searchStr = attrName + "='";pos = elem.indexOf(searchStr);} if (pos === -1) return "";var start = pos + searchStr.length;var quoteType = elem.charAt(start - 1);var end = elem.indexOf(quoteType,start);return end === -1 ? "" : elem.substring(start,end);},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) return elem.substring(start,end);return "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();} return "";}};return instance;}
