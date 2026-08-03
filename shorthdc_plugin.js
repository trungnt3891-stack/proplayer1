// =============================================================================
// CẤU HÌNH DOMAIN & METADATA
// =============================================================================
var BASEURL = "https://phimnganhdc.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "phimnganhdc",
        "name": "Phim Ngắn HDC",
        "description": "Chuyên Phim Ngắn: Hỗ trợ vuốt dọc chuyển tập, Tốc độ cao, Load bìa nét 100%.",
        "version": "1.0.1",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt trình phát xoay dọc và vuốt chuyển tập
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Dùng Sniffer bắt link m3u8 để phát siêu mượt
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[PhimNganHDC] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[PhimNganHDC] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ (CHỈ LẤY PHIM NGẮN - CATEGORY 38)
// =============================================================================
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/the-loai/phim-ngan", "title": "Phim Ngắn Mới Cập Nhật", "type": "Grid" },
        { "slug": "/?filter[category]=38&filter[sort]=view", "title": "Phim Ngắn Xem Nhiều Nhất", "type": "Horizontal" },
        { "slug": "/?filter[category]=38&filter[sort]=create", "title": "Phim Ngắn Mới Đăng Tải", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "/the-loai/phim-ngan", "name": "Tất Cả Phim Ngắn" },
        { "slug": "/?filter[category]=38&filter[sort]=view", "name": "Xem Nhiều Nhất" },
        { "slug": "/?filter[category]=38&filter[sort]=update", "name": "Mới Cập Nhật" }
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
            try {
                var filters = JSON.parse(filtersJson);
                page = parseInt(filters.page) || 1;
            } catch(e) {}
        }
        
        var url = slug;
        if (url.indexOf("http") === -1) {
            url = BASEURL + (url.indexOf("/") === 0 ? "" : "/") + url;
        }
        
        if (page > 1) {
            url += (url.indexOf('?') > -1 ? '&' : '?') + "page=" + page;
        }
        return url.replace(/([^:]\/)\/+/g, "$1");
    } catch(e) {
        return BASEURL + "/the-loai/phim-ngan";
    }
}

// Tìm kiếm mặc định luôn ép kèm filter chuyên mục Phim Ngắn (category=38)
function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try { page = parseInt(JSON.parse(filtersJson).page) || 1; } catch(e) {}
    }
    var url = BASEURL + "/?search=" + encodeURIComponent(keyword.trim()) + "&filter[category]=38";
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + (slug.indexOf("/") === 0 ? "" : "/") + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (BÓC TÁCH DỮ LIỆU) - ĐÃ DÙNG DOM _$ ĐỂ BẮT ẢNH CHUẨN XÁC
// =============================================================================
function parseListResponse(html, url) {
    try {
        var items = [];
        
        // Quét cấu trúc DOM an toàn không sợ rớt dòng
        _$(html).find("li.item").each(function() {
            var label = this.find(".label").text() || "HD";
            var aTag = this.find("a");
            var href = aTag.attr("href");
            var title = aTag.attr("title") || this.find(".name").find("a").text();
            var img = this.find("img").attr("src");

            if (href && img && title) {
                if (href.indexOf("http") === -1) href = BASEURL + (href.indexOf("/") === 0 ? "" : "/") + href;
                if (img.indexOf("http") === -1) img = BASEURL + (img.indexOf("/") === 0 ? "" : "/") + img;

                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": img,
                    "backdropUrl": img,
                    "episode_current": label,
                    "quality": "HD",
                    "lang": ""
                });
            }
        });
        
        // Tìm số trang lớn nhất
        var totalPages = 1;
        var pageRegex = /page=(\d+)"/g;
        var pMatch;
        while ((pMatch = pageRegex.exec(html)) !== null) {
            var p = parseInt(pMatch[1]);
            if (p > totalPages) totalPages = p;
        }
        
        var currentPage = 1;
        if (url) {
            var urlPageMatch = url.match(/page=(\d+)/);
            if (urlPageMatch) currentPage = parseInt(urlPageMatch[1]);
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        log(e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var title = "";
        var titleMatch = _$(html).find("h1").text() || _$(html).find('meta[property="og:title"]').attr("content");
        if (titleMatch) title = titleMatch.trim();

        // Bắt poster chuẩn xác từ thẻ meta của web
        var posterUrl = _$(html).find('meta[property="og:image"]').attr("content");
        if (!posterUrl) {
            var posterMatch = /<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html);
            if (posterMatch) posterUrl = posterMatch[1];
        }
        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = BASEURL + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = "";
        var descMatch = /<div\s+class="tab">[\s\S]*?<div\s+style="text-align:\s+justify;">([\s\S]*?)<\/div>/i.exec(html);
        if (!descMatch) descMatch = /<div\s+style="text-align:\s*justify;">([\s\S]*?)<\/div>/i.exec(html);
        if (descMatch) description = descMatch[1].replace(/<[^>]*>/g, "").trim();

        var servers = [];
        var serverPattern = /<div[^>]*class="server-episode-block"[^>]*>[\s\S]*?Danh sách\s*(?:Sever)?\s*([^:]+):[\s\S]*?<div[^>]*class="list-episode[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        var match;

        while ((match = serverPattern.exec(html)) !== null) {
            var serverName = match[1].trim().replace(/^Server\s+/i, '').replace(/^z/i, '').replace(/\s*#\d+$/, '').trim();
            var episodesHtml = match[2];
            var episodes = [];
            
            var epPattern = /<a\s+href="([^"]+)"[\s\S]*?title="([^"]+)"/gi;
            var epMatch;
            while ((epMatch = epPattern.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1];
                if (epUrl.indexOf('http') === -1) epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;

                episodes.push({
                    id: epUrl,
                    name: epMatch[2].trim().replace(/Phim /i, ""),
                    slug: epUrl
                });
            }
            if (episodes.length > 0) {
                var firstMatch = /Tập\s+(\d+)/i.exec(episodes[0].name);
                var lastMatch = /Tập\s+(\d+)/i.exec(episodes[episodes.length - 1].name);
                if (firstMatch && lastMatch && parseInt(firstMatch[1]) > parseInt(lastMatch[1])) {
                    episodes.reverse();
                } else if (!firstMatch) {
                    episodes.reverse(); 
                }
                servers.push({ name: serverName, episodes: episodes });
            }
        }
        
        if (servers.length === 0) {
            servers.push({
                name: "Server Mặc Định",
                episodes: [{ id: url, name: "Tập 1", slug: url }]
            });
        }

        var episode_current = servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Đang cập nhật";
        var statusMatch = /<dd\s+class="film-status">[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i.exec(html);
        if (statusMatch) episode_current = statusMatch[1].replace(/<[^>]*>/g, "").trim();

        return JSON.stringify({
            id: url,
            title: title || "Đang cập nhật",
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            servers: servers,
            quality: "HD",
            episode_current: episode_current,
            year: 2026,
            category: "Phim Ngắn",
            status: "Hoàn Thành"
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var isEmbed = false;
        
        var iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            if (streamUrl.indexOf("player.php?") !== -1) {
                var matchLink = /[?&](?:link|url)=([^&]+)/.exec(streamUrl);
                if (matchLink) streamUrl = decodeURIComponent(matchLink[1]);
            }
            
            if (streamUrl.indexOf(".m3u8") > -1 || streamUrl.indexOf(".mp4") > -1) {
                isEmbed = false;
            } else {
                isEmbed = true; 
            }
        } else {
            var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
            if (m3u8Match) {
                streamUrl = m3u8Match[1].replace(/\\/g, "");
            } else {
                var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
                if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
            }
        }
        
        return JSON.stringify({
            "url": streamUrl || url, 
            "isEmbed": isEmbed,
            "mimeType": (streamUrl.indexOf(".m3u8") > -1) ? "application/x-mpegURL" : (streamUrl.indexOf(".mp4") > -1 ? "video/mp4" : ""),
            "headers": {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Block-Ads": "true" 
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    try {
        var streamUrl = "";
        
        if (html.indexOf("securedLink") !== -1 || url.indexOf("do=getVideo") !== -1) {
            try {
                var jData = JSON.parse(html);
                streamUrl = jData.securedLink || jData.videoSource || (jData.videoSources ? jData.videoSources[0].file : "");
            } catch(e) {}
        }
        
        if (!streamUrl) {
            var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, "");
        }
        
        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: streamUrl.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "Referer": url,
                    "Origin": url.split('/').slice(0, 3).join('/'),
                    "User-Agent": "Mozilla/5.0"
                }
            });
        }
        
        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// THƯ VIỆN DOM ẢO CHUYÊN DỤNG (_$) - KHÔI PHỤC ĐỂ ĐẢM BẢO KHÔNG LỖI HTML
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock&&typeof htmlOrBlock==='object'&&htmlOrBlock.elements){return htmlOrBlock;}var instance={sourceHtml:typeof htmlOrBlock==='string'?htmlOrBlock:'',elements:Array.isArray(htmlOrBlock)?htmlOrBlock:(htmlOrBlock?[htmlOrBlock]:[]),find:function(selector){var results=[];var contentFilter="";if (selector.indexOf(":content(")!==-1){var contentMatch=selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch){contentFilter=contentMatch[1]||contentMatch[2]||contentMatch[3]||"";selector=selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}}var attrNameFilter="";var attrValueFilter="";var hasAttrFilter=false;var attrMatch=selector.match(/\[([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch){hasAttrFilter=true;attrNameFilter=attrMatch[1];attrValueFilter=attrMatch[2]||attrMatch[3]||attrMatch[4]||"";selector=selector.replace(/\[.*?\]/,"");}var notSelector="";if (selector.indexOf(":not(")!==-1){var notMatch=selector.match(/:not\(([^)]+)\)/);if (notMatch){notSelector=notMatch[1];selector=selector.replace(/:not\([^)]+\)/,"");}}var isFirstFilter=selector.indexOf(":first")!==-1;var isLastFilter=selector.indexOf(":last")!==-1;selector=selector.replace(/:first|:last/g,"");var isClass=selector.indexOf('.')===0;var isId=selector.indexOf('#')===0;var isAttrOnly=(selector===""&&hasAttrFilter);var targetClasses=[];var targetId="";var targetTagName="";if (isClass){targetClasses=selector.split('.').filter(function(c){return c.length > 0;});}else if (isId){targetId=selector.substring(1);}else if (!isAttrOnly){targetTagName=selector.toLowerCase();}for (var i=0;i < this.elements.length;i++){var currentHtml=this.elements[i];var pos=0;var subResults=[];while ((pos=currentHtml.indexOf('<',pos))!==-1){if (currentHtml.charAt(pos+1)==='/'||currentHtml.charAt(pos+1)==='!'){pos++;continue;}var endOpenTag=currentHtml.indexOf('>',pos);if (endOpenTag===-1)break;var fullOpenTag=currentHtml.substring(pos,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName="";if (spacePos===-1){currentTagName=fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase();}else{currentTagName=fullOpenTag.substring(1,spacePos).toLowerCase();}var isMatched=false;if (isClass){var classMatchStr="";var classPos=fullOpenTag.indexOf('class="');if (classPos!==-1){var startQuote=classPos+7;classMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));}else{classPos=fullOpenTag.indexOf("class='");if (classPos!==-1){var startQuote=classPos+7;classMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}}if (classMatchStr){var currentClasses=classMatchStr.split(/\s+/);var matchCount=0;for (var c=0;c < targetClasses.length;c++){if (currentClasses.indexOf(targetClasses[c])!==-1)matchCount++;}if (matchCount===targetClasses.length)isMatched=true;}}else if (isId){var idMatchStr="";var idPos=fullOpenTag.indexOf('id="');if (idPos!==-1){var startQuote=idPos+4;idMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));}else{idPos=fullOpenTag.indexOf("id='");if (idPos!==-1){var startQuote=idPos+4;idMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}}if (idMatchStr===targetId)isMatched=true;}else if (isAttrOnly){isMatched=true;}else{if (currentTagName===targetTagName)isMatched=true;}if (isMatched&&hasAttrFilter){var searchStr1=attrNameFilter+'="'+attrValueFilter+'"';var searchStr2=attrNameFilter+"='"+attrValueFilter+"'";if (fullOpenTag.indexOf(searchStr1)===-1&&fullOpenTag.indexOf(searchStr2)===-1){isMatched=false;}}if (isMatched){var startTagPos=pos;var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var scanPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&scanPos < currentHtml.length){var nextOpen=currentHtml.indexOf(openStr,scanPos);var nextClose=currentHtml.indexOf(closeStr,scanPos);if (nextClose===-1){scanPos=currentHtml.length;break;}if (nextOpen!==-1&&nextOpen < nextClose){depth++;scanPos=nextOpen+openStr.length;}else{depth--;scanPos=nextClose+closeStr.length;if (depth===0)endTagPos=nextClose+closeStr.length;}}}var foundBlock=currentHtml.substring(startTagPos,endTagPos);if (contentFilter){var pureText=foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter)===-1){pos=endTagPos;continue;}}if (notSelector){var isNotClass=notSelector.indexOf('.')===0;var isNotId=notSelector.indexOf('#')===0;var notValue=notSelector.substring(1);var hasNot=false;if (isNotClass&&fullOpenTag.indexOf('class="')!==-1&&fullOpenTag.indexOf(notValue)!==-1)hasNot=true;if (isNotId&&fullOpenTag.indexOf('id="')!==-1&&fullOpenTag.indexOf(notValue)!==-1)hasNot=true;if (!hasNot)subResults.push(foundBlock);}else{subResults.push(foundBlock);}pos=endTagPos;}else{pos++;}}if (isFirstFilter&&subResults.length > 0)subResults=[subResults[0]];if (isLastFilter&&subResults.length > 0)subResults=[subResults[subResults.length-1]];results=results.concat(subResults);}var newInstance=_$(results);newInstance.sourceHtml=this.sourceHtml||currentHtml;return newInstance;},each:function(callback){for (var i=0;i < this.elements.length;i++){var childInstance=_$(this.elements[i]);childInstance.sourceHtml=this.sourceHtml;callback.call(childInstance,i,this.elements[i]);}return this;},eq:function(index){if (index < 0)index=this.elements.length+index;var matchedElement=this.elements[index];this.elements=matchedElement?[matchedElement]:[];return this;},attr:function(attrName){if (this.elements.length===0)return "";var elem=this.elements[0];var searchStr=attrName+'="';var pos=elem.indexOf(searchStr);if (pos===-1){searchStr=attrName+"='";pos=elem.indexOf(searchStr);}if (pos===-1)return "";var start=pos+searchStr.length;var quoteType=elem.charAt(start-1);var end=elem.indexOf(quoteType,start);return end===-1?"":elem.substring(start,end);},html:function(){if (this.elements.length===0)return "";var elem=this.elements[0];var start=elem.indexOf('>')+1;var end=elem.lastIndexOf('</');if (start > 0&&end > start)return elem.substring(start,end);return "";},text:function(){if (this.elements.length===0)return "";var elem=this.elements[0];var start=elem.indexOf('>')+1;var end=elem.lastIndexOf('</');if (start > 0&&end > start){var content=elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();}return "";},next:function(){var results=[];if (!this.sourceHtml)return this;for (var i=0;i < this.elements.length;i++){var elem=this.elements[i];var idx=this.sourceHtml.indexOf(elem);if (idx===-1)continue;var scanPos=idx+elem.length;var nextOpen=this.sourceHtml.indexOf('<',scanPos);if (nextOpen!==-1){if (this.sourceHtml.charAt(nextOpen+1)==='/') continue;var endOpenTag=this.sourceHtml.indexOf('>',nextOpen);if (endOpenTag===-1)continue;var fullOpenTag=this.sourceHtml.substring(nextOpen,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName=(spacePos===-1)?fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase():fullOpenTag.substring(1,spacePos).toLowerCase();var startTagPos=nextOpen;var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var sPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&sPos < this.sourceHtml.length){var nOpen=this.sourceHtml.indexOf(openStr,sPos);var nClose=this.sourceHtml.indexOf(closeStr,sPos);if (nClose===-1)break;if (nOpen!==-1&&nOpen < nClose){depth++;sPos=nOpen+openStr.length;}else{depth--;sPos=nClose+closeStr.length;if (depth===0)endTagPos=nClose+closeStr.length;}}}results.push(this.sourceHtml.substring(startTagPos,endTagPos));}}var nextInstance=_$(results);nextInstance.sourceHtml=this.sourceHtml;this.elements=results;return this;},parent:function(){var results=[];if (!this.sourceHtml)return this;for (var i=0;i < this.elements.length;i++){var elem=this.elements[i];var idx=this.sourceHtml.indexOf(elem);if (idx <=0)continue;var scanPos=idx-1;while (scanPos >=0){var openTagPos=this.sourceHtml.lastIndexOf('<',scanPos);if (openTagPos===-1)break;if (this.sourceHtml.charAt(openTagPos+1)!=='/'&&this.sourceHtml.charAt(openTagPos+1)!=='!'){var endOpenTag=this.sourceHtml.indexOf('>',openTagPos);if (endOpenTag!==-1&&endOpenTag > openTagPos){var fullOpenTag=this.sourceHtml.substring(openTagPos,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName=(spacePos===-1)?fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase():fullOpenTag.substring(1,spacePos).toLowerCase();var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var sPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&sPos < this.sourceHtml.length){var nOpen=this.sourceHtml.indexOf(openStr,sPos);var nClose=this.sourceHtml.indexOf(closeStr,sPos);if (nClose===-1)break;if (nOpen!==-1&&nOpen < nClose){depth++;sPos=nOpen+openStr.length;}else{depth--;sPos=nClose+closeStr.length;if (depth===0)endTagPos=nClose+closeStr.length;}}}if (endTagPos >=idx+elem.length){var parentBlock=this.sourceHtml.substring(openTagPos,endTagPos);if (results.indexOf(parentBlock)===-1)results.push(parentBlock);break;}}}scanPos=openTagPos-1;}}var parentInstance=_$(results);parentInstance.sourceHtml=this.sourceHtml;this.elements=results;return this;}};return instance;};
