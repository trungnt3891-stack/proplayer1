// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHIẾN THUẬT: VÀO NHẸ NHÀNG TRANG 1 -> BẤM XEM NGAY -> HOOK BẮT LINK TRANG 2
// =============================================================================

var BASEURL = "https://gamomephim.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Vào Trang 1 siêu nhanh. Bấm Xem Ngay để Hook tóm link ở Trang 2.",
        "version": "4.1.0", // Đã fix load phim và ảnh bìa trang chủ
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "type": "shortfilm", // Giữ nguyên Player dọc
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Sử dụng Webview ngầm để Hook hoạt động
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
                    } catch (jsonErr) { return slug; }
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
        if (path) resultUrl += path.startsWith('/') ? path : '/' + path;
        if (page > 1) resultUrl += "?page=" + page;
        
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
    if (slug.indexOf('http') === 0) return slug;
    
    // GỌI VÀO TRANG 1 (MÀN HÌNH CHỜ TRƯỚC KHI XEM PHIM)
    var cleanSlug = slug.replace(/^\//, "").replace(/^phim\//, "");
    return BASEURL + "/phim/" + cleanSlug;
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
        var added = {}; // Chống trùng lặp phim
        var calculatedPage = 1;
        
        if ($url && $url.indexOf("page=") > -1) {
            var matchPage = $url.match(/page=(\d+)/);
            if (matchPage) calculatedPage = parseInt(matchPage[1]) || 1;
        }

        // CÁCH 1: BÓC NHANH TỪ CHUỖI JSON ẨN CỦA NEXTJS (CHUẨN XÁC NHẤT)
        var unescapedHtml = html.replace(/\\"/g, '"');
        var jsonRegex = /"item"\s*:\s*\{"title":"([^"]+)","slug":"([^"]+)","img":"([^"]+)"(?:,"badge":"([^"]*)")?/gi;
        var jMatch;
        while ((jMatch = jsonRegex.exec(unescapedHtml)) !== null) {
            var jTitle = jMatch[1];
            var jSlug = jMatch[2];
            var jImg = jMatch[3];
            var jBadge = jMatch[4] || "Full";
            
            if (!added[jSlug]) {
                added[jSlug] = true;
                items.push({
                    "id": jSlug,
                    "title": jTitle.trim(),
                    "posterUrl": jImg,
                    "backdropUrl": jImg,
                    "quality": "HD",
                    "episode_current": jBadge
                });
            }
        }

        // CÁCH 2: DỰ PHÒNG TÌM TỪ THẺ HTML (NẾU JSON BỊ THAY ĐỔI)
        if (items.length === 0) {
            var domRegex = /<a[^>]+title=["']([^"']+)["'][^>]+href=["'](?:\/phim)?\/([^"']+)["'][\s\S]*?<img[^>]+src=["']([^"']+)["'][\s\S]*?(?:<span[^>]*>([^<]+)<\/span>)?/gi;
            var match;
            while ((match = domRegex.exec(html)) !== null) {
                var title = match[1];
                var slug = match[2];
                var img = match[3];
                var badge = match[4] || "Full";
                
                // Tránh bắt nhầm link rác không phải phim
                if (!added[slug] && slug.indexOf('/') === -1) {
                    added[slug] = true;
                    items.push({
                        "id": slug,
                        "title": title.trim(),
                        "posterUrl": img,
                        "backdropUrl": img,
                        "quality": "HD",
                        "episode_current": badge.trim()
                    });
                }
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

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// BƯỚC NÀY ĐÃ ĐƯỢC TỐI GIẢN TỐI ĐA: KHÔNG BẮT LINK, VÀO TRANG 1 SIÊU NHANH
function parseMovieDetail(html, url) {
    try {
        log("Load Trang 1: " + url);
        var title = "Đang cập nhật...";
        var img = ""; 
        var des = "Không có mô tả.";

        // Bóc tách siêu tốc bằng Regex cơ bản
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").replace(/ - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) img = metaImg[1];

        var metaDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (metaDesc) des = metaDesc[1].replace(/\\n/g, '\n');

        // Tạo đường dẫn thẳng vào Trang 2 (Trang Player) để gắn vào nút bấm
        var cleanSlug = url.split("?")[0].replace(BASEURL, "").replace(/^\//, "").replace(/^phim\//, "");
        var watchUrl = BASEURL + "/" + cleanSlug;

        // Chỉ xuất đúng 1 nút bấm để người dùng tự click
        var episodes = [{ id: watchUrl, name: "Vào Xem Phim", slug: "tap-1" }];
        
        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: img,
            backdropUrl: img,
            description: des,
            year: 2026,
            rating: 10,
            quality: "HD",
            servers: [{ name: "Server Gà Mờ", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "Lỗi tải dữ liệu", servers: [] });
    }
}

// BƯỚC 3: KHI BẤM "VÀO XEM PHIM", CHẠY WEBVIEW NGẦM TRÊN TRANG 2 VÀ BẬT SNIFFER
function parseDetailResponse(html, url) {
  console.log("Kích hoạt Hook tại Trang 2: " + url);
  try {
    var rawJS = checkRaw(runJS(), true);

    return JSON.stringify({
      url: url, // Load trang chiếu phim (Trang 2)
      isEmbed: true, // Kích hoạt Webview ẩn để Sniffer chạy
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: BASEURL,
        "Block-Ads": "true", // Chặn quảng cáo rác
        "Custom-Js": rawJS
      }
    });
  } catch (e) {
    return JSON.stringify({ url: "", isEmbed: false, headers: {} });
  }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
}

// =============================================================================
// THƯ VIỆN BẢO VỆ CHUỖI & SNIFFER (CỦA BẠN CUNG CẤP ĐÃ ĐƯỢC TÍCH HỢP 100%)
// =============================================================================

function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== "string") return scriptStr || "";
    var lines = scriptStr.split("\n");
    var fixedLines = [];
    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var fixedLine = currentLine;
      if (returnFixed) {
        fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  ");
      }
      fixedLines.push(fixedLine);
    }
    return returnFixed ? fixedLines.join("\n") : scriptStr;
  } catch (e) {
    return scriptStr;
  }
}

// MÃ HOOK CHẠY BÊN TRONG WEBVIEW NGẦM
function runJS() {
  return `
HTMLRAW = 0; 
BODYRAW = 0; 
CSSBLOCK = 1; 
VIDEOEND = 0; 
NUMBERRAW = 0; 
HOOK_NETWORK_AND_DOM = 1; // 1 = Hook bằng xhr hoặc dom (RẤT QUAN TRỌNG ĐỂ BẮT LINK)

(function() {
    'use strict';
    
    function bridgeLog(msg, check) {
        try {
          if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
            window.SnifferBridge.log(msg);
            if (check === true && typeof window.SnifferBridge.toast === 'function') {
              window.SnifferBridge.toast(msg, 1000);
            }
          }
        } catch(e) {}
    }

    // 1. XÓA GIAO DIỆN TRANG WEB ĐỂ TĂNG TỐC LOAD
    (function injectCSS() {
      try {
        const cssStyle = "header, footer, nav, .ads, iframe[sandbox] { display: none !important; opacity: 0 !important; }";
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        if (styleElement.styleSheet) { styleElement.styleSheet.cssText = cssStyle; } 
        else { styleElement.appendChild(document.createTextNode(cssStyle)); }
        document.head.appendChild(styleElement);
      } catch (error) {}
    })();

    // 2. AUTO CLICKER: TỰ ĐỘNG BẤM PLAY ĐỂ KÍCH NỔ VIDEO
    var autoPlayTimer = setInterval(function() {
        try {
            var svgs = document.querySelectorAll('svg path');
            for (var k = 0; k < svgs.length; k++) {
                var d = svgs[k].getAttribute('d');
                if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                    var p = svgs[k].parentNode;
                    while(p && p.tagName !== 'BUTTON' && p.tagName !== 'BODY') p = p.parentNode;
                    if (p && p.tagName === 'BUTTON') p.click();
                }
            }
            var v = document.querySelector('video');
            if (v && typeof v.play === 'function') v.play().catch(function(){});
        } catch(e) {}
    }, 1000);

    // 3. BỘ SNIFFER NETWORK VÀ DOM CỦA BẠN
    (function initLocalBlobSniffer() {
      if (window.__BLOB_SNIFFER_INITIALIZED__) return;
      window.__BLOB_SNIFFER_INITIALIZED__ = 1;

      var hasDispatchedAny = 0;
      var isFinished = 0;
      var timeoutTimer = null;
      var domScanInterval = null;

      bridgeLog("Đang rình link Video...", true);

      function stopTimeout() {
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
        if (domScanInterval) { clearInterval(domScanInterval); domScanInterval = null; }
        if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
      }

      function dispatchDirectLinkToApp(directUrl) {
        if (!directUrl || hasDispatchedAny === 1) return;
        hasDispatchedAny = 1;
        isFinished = 1;
        stopTimeout();

        bridgeLog("🎯 Bắt link thành công! Đang phát...", true);
        try {
          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
            window.SnifferBridge.play(directUrl, JSON.stringify({"Referer": window.location.href}));
          }
        } catch(e) {}
      }

      if (HOOK_NETWORK_AND_DOM === 1) {
        // HOOK FETCH
        try {
          if (typeof window.fetch !== 'undefined') {
            var originalFetch = window.fetch;
            window.fetch = function() {
              var args = arguments;
              return originalFetch.apply(this, args).then(function(response) {
                if (isFinished === 0 && response) {
                  var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                  if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1) {
                      bridgeLog('🎯 Tóm link từ Fetch: ' + url);
                      dispatchDirectLinkToApp(url);
                  }
                }
                return response;
              });
            };
          }
        } catch (e) {}

        // HOOK XHR
        try {
          if (typeof XMLHttpRequest !== 'undefined') {
            var originalXHR = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
              if (url.indexOf('.mp4') > -1 || url.indexOf('.m3u8') > -1) {
                  bridgeLog('🎯 Tóm link từ XHR: ' + url);
                  dispatchDirectLinkToApp(url);
              }
              return originalXHR.apply(this, arguments);
            };
          }
        } catch (e) {}

        // HOOK DOM
        domScanInterval = setInterval(function() {
          if (isFinished === 1) return;
          var videos = document.getElementsByTagName('video');
          for (var i = 0; i < videos.length; i++) {
            var src = videos[i].src || videos[i].currentSrc;
            if (src && (src.indexOf('.mp4') > -1 || src.indexOf('.m3u8') > -1)) {
              bridgeLog('🔍 Tóm link từ thẻ Video: ' + src);
              dispatchDirectLinkToApp(src);
            }
          }
        }, 500);
      }

      // BẢO VỆ TIMEOUT 25S
      timeoutTimer = setTimeout(function() {
        if (hasDispatchedAny === 0 && isFinished === 0) {
          isFinished = 1;
          stopTimeout();
          bridgeLog("❌ Đã quá thời gian chờ nhưng không tìm thấy link phù hợp!", false);
        }
      }, 25000);

    })();
})();
  `;
}

// =============================================================================
// BỘ MENU CHUẨN XÁC
// =============================================================================

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
