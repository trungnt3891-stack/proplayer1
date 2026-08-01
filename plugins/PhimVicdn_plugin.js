var BASEURL = "https://vicdn.cc"; 
var BASEAPI = BASEURL + "/api";
var DEV = true;

function getManifest() {
  return JSON.stringify({
    id: "vicdn",
    name: "Nguồn Vicdn",
    description: "Nguồn phim Vicdn - Bản Chuẩn Của Bạn",
    "version": "1.1",
    info: "Khôi phục 100% bộ Code gốc của bạn. Đã Fix lỗi mất ảnh bìa, chỉnh Menu lướt ngang, và sửa lại Tìm kiếm siêu tốc. Chọn tập ở ngoài, phát phim trong Webview.",
    baseUrl: "https://vicdn.cc",
    iconUrl: "https://vicdn.cc/vicdn.png",
    isEnabled: true,
    "adblock": false,
    type: "MOVIE",
    playerType: "embed",
  });
}

function log(msg) {
  	console.log(msg);
}

// =============================================================================
// MENU & DANH MỤC (ĐÃ SỬA THÀNH LƯỚT NGANG CHO GỌN NHẸ)
// =============================================================================
function getHomeSections() {
    try {
        var listurl = '[' +
            '{\"link\":\"/update/\",\"name\":\"Phim Mới Cập Nhật\",\"type\":\"Grid\"},' +
            '{\"link\":\"/type/hanh-dong/\",\"name\":\"Hành Động\",\"type\":\"Horizontal\"},' +
            '{\"link\":\"/type/hoat-hinh/\",\"name\":\"Hoạt Hình\",\"type\":\"Horizontal\"},' +
            '{\"link\":\"/type/vien-tuong/\",\"name\":\"Viễn Tưởng\",\"type\":\"Horizontal\"},' +
            '{\"link\":\"/type/hinh-su/\",\"name\":\"Hình Sự\",\"type\":\"Horizontal\"}' +
        ']';
        var menuArray = JSON.parse(listurl);
        var menulist = [];
        for (var i = 0; i < menuArray.length; i++) {
            menulist.push({
                slug: menuArray[i].link,
                title: menuArray[i].name,
                type: menuArray[i].type || "Horizontal"
            });
        }
        return JSON.stringify(menulist);
    } catch (e) {
        log("getHomeSections[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("getPrimaryCategories[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({
            category: menulist
        });
    } catch (e) {
        log("getFilterConfig[err]:\n " + e);
        return JSON.stringify({ category: [] });
    }
}

// =============================================================================
// URL GENERATOR (CỦA BẠN)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;

                    if (pageSearch > 1 && slug.indexOf("page=") === -1) {
                        var sepSearch = slug.indexOf("?") > -1 ? "&" : "?";
                        var resSearch = slug + sepSearch + "page=" + pageSearch;
                        log("getUrlList[url]: \n" + resSearch);
                        return resSearch;
                    }
                } catch (jsonErr) {}
            }
            log("getUrlList[url]: \n" + slug);
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

        var resultUrl = BASEAPI;
        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = BASEAPI + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        return finalFallback;
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
        var resultUrl = BASEURL + "/?q=" + encodedKeyword;

        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEURL + "/?q=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}

function getUrlDetail(slug) {
    try {
        log("getUrlDetail[url]: \n" + slug);
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        var detailUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + detailUrl);
        return detailUrl;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
        return "";
    }
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS CỦA BẠN (CÓ CHỈNH LẠI BÌA PHIM VÀ TÌM KIẾM CHO CHUẨN)
// =============================================================================
function parseListResponse(html, $url) {
    try {
        log("parseListResponse[url]: \n" + $url);
        if ($url.indexOf("/?q=") > -1) {
            var script = _$(html).find("script:content('const allData')").html()

            var $obj = script.match(/\[\s*\{[\s\S]*?\}\s*\]/i);
            if ($obj) {
                var $data = JSON.parse($obj[0]);
                
                // Lọc thủ công bằng keyword vì web tải toàn bộ data
                var keywordMatch = $url.match(/q=([^&]+)/);
                var keyword = keywordMatch ? decodeURIComponent(keywordMatch[1]).toLowerCase().trim() : "";
                var filtered = [];
                for(var k=0; k<$data.length; k++) {
                    var vname = ($data[k].vname || "").toLowerCase();
                    var ename = ($data[k].ename || "").toLowerCase();
                    if(vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                        filtered.push($data[k]);
                    }
                }
                return domfetch(filtered, $url);
            }
        } else {
            var $allData = JSON.parse(html)
            return domfetch($allData.data || [], $url);
        }
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
    return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
}

function parseJSDataIsolated(str) {
    const code = str.replace(/^(const|let|var)\s+\w+\s*=\s*/, '');
    return new Function(`"use strict"; return (${code});`)();
}

function domfetch($data, $url) {
    var items = [];
    for (var $j = 0; $j < $data.length; $j++) {
        var item = $data[$j];
        
        // ĐÃ FIX LỖI ẢNH: Nếu web trả mã băm, nối domain vào. Nếu trả HTTP thì giữ nguyên
        var poster = item.poster || "";
        if (poster && poster.indexOf("http") === -1) {
            poster = "https://image.tmdb.org/t/p/w300/" + poster + ".jpg";
        }
        var banner = item.banner || "";
        if (banner && banner.indexOf("http") === -1) {
            banner = "https://image.tmdb.org/t/p/w533_and_h300_face/" + banner + ".jpg";
        }
        
        items.push({
            "id": BASEAPI + "/info/" + item.slug, 
            "title": item.vname || item.ename || "Chưa cập nhật",
            "posterUrl": poster, 
            "backdropUrl": banner, 
            "quality": item.type ? item.type.toUpperCase() : "HD",
            "episode_current": "Tập " + (item.stt || "0") + "/" + (item.total || "?")
        });

    }
    return JSON.stringify({
        "items": items,
        "pagination": {
            "currentPage": 1,
            "totalPages": 999
        }
    });
}

function parseSearchResponse(html, url) {
    try {
        log("parseSearchResponse[url]: \n" + url);
        return parseListResponse(html, url);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function decodeHTMLEntities(str) {
    try {
        if (!str) return "";
        return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            if (dec) {
                return String.fromCharCode(parseInt(dec, 10));
            }
            if (hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
            return match;
        });
    } catch (e) {
        log("decodeHTMLEntities[err]:\n " + e);
    }
}

// Bóc tách danh sách tập phim gửi ra ngoài cho người dùng chọn
function parseMovieDetail(html, url) {
    try {
        log("parseMovieDetail[url]: \n" + url);
        var $jsdata = JSON.parse(html);
        var $data = $jsdata.data;
        
        var lurl = "";
        var limg = $data.banner || "";
        if (limg && limg.indexOf("http") === -1) {
            limg = "https://image.tmdb.org/t/p/w533_and_h300_face/" + limg + ".jpg";
        }
        
        var lname = $data.vname || "Đang cập nhật...";
        var ldes = $data.content || "Không có mô tả.";
        var ldirec = "";
        var lactor = ($data.cast || []).join(" - ");
        var lduran = $data.duration ? $data.duration + " phút" : "";
        var status = "Tập " + $data.stt + "/" + $data.total;
        var category = ($data.genre || []).join(" - ");
        var episode_current = "Tập " + $data.stt;
        var year = $data.year || 2026;
        var extra = "";
        
        var servers = [];
        var episodes = [];
        
        if ($data.list_episodes && $data.list_episodes.length > 0) {
            for (var $j = 0; $j < $data.list_episodes.length; $j++) {
                var item = $data.list_episodes[$j];
                var split = item.split("|");
                episodes.push({
                    id: url + "?current=" + split[0],
                    name: "Tập " + split[0],
                    slug: "tap-" + split[0]
                })
            }
        } else if ($data.mkv) {
            episodes.push({
                id: url + "?current=1",
                name: "Full HD",
                slug: "full"
            });
        }
        
        servers.push({
            name: "Server",
            episodes: episodes
        })
        
        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: ($data.type || "HD").toUpperCase(),
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || "error",
            title: "error",
            servers: []
        });
    }
}

function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== 'string') {
      console.log("[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!");
      return scriptStr || "";
    }

    var lines = scriptStr.split('\n');
    var fixedLines = [];
    var hasError = false;

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var lineNum = i + 1;
      var lineErrorFound = false;

      if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) { lineErrorFound = true; }
      if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) { lineErrorFound = true; }
      if (/([^\\])\\$/.test(currentLine)) { lineErrorFound = true; }

      if (lineErrorFound) hasError = true;

      var fixedLine = currentLine;
      if (returnFixed) {
        fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  ");
      }
      fixedLines.push(fixedLine);
    }

    try { new Function(scriptStr); } catch (syntaxErr) { hasError = true; }

    return returnFixed ? fixedLines.join('\n') : scriptStr;

  } catch (e) {
    return scriptStr;
  }
}

// Bắt đầu đưa link vào WebView + Chèn CustomJS
function parseDetailResponse(html, url) {
  try {
    var $jsdata = JSON.parse(html);
    var $data = $jsdata.data;
    var servers = [];
    
    // Tách tập người dùng chọn ở ngoài giao diện
    var currentMatch = url.match(/current=(\d+)/i);
    var current = currentMatch ? Number(currentMatch[1]) : 1;
    
    var baseUrl = url.split("?")[0];
    var stream = baseUrl;
    
    if ($data.list_episodes && $data.list_episodes.length > 0) {
        for (var $j = 0; $j < $data.list_episodes.length; $j++) {
            var item = $data.list_episodes[$j];
            var split = item.split("|");
            if(Number(split[0]) == current){
              stream = split[1] + "?episodes=" + baseUrl;
            }
        }
    } else if ($data.mkv) {
        stream = $data.mkv + "?episodes=" + baseUrl;
    }
    
    // Gắn thêm Subtitle vào WebView nếu VAAPP hỗ trợ
    var subtitles = [];
    if ($data.lech) {
        var epStr = current < 10 ? '0' + current : current.toString();
        subtitles.push({
            lang: "vi",
            url: "https://phimgod.com/api/subtitle/-" + $data.lech + "/v" + epStr + ".srt/vtt.css",
            mimeType: "text/vtt"
        });
        subtitles.push({
            lang: "en",
            url: "https://phimgod.com/api/subtitle/-" + $data.lech + "/e" + epStr + ".srt/vtt.css",
            mimeType: "text/vtt"
        });
    }

    var customJS = checkRaw(rawJS(stream), true);
    log("Embed: " + stream);
    
    return JSON.stringify({
      url: stream,
      isEmbed: false, // DÙNG FALSE ĐỂ BẬT GIAO DIỆN WEBVIEW MÀ KHÔNG TẢI NGẦM
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASEURL,
        "Custom-Js": customJS
      },
      subtitles: subtitles,
    });
  } catch (e) {
    log("parseDetailResponse[err]:\n " + e);
    return JSON.stringify({
      url: "",
      isEmbed: false,
      headers: {},
      subtitles: [],
    });
  }
}

// -----------------------------------------------------------------------------
// GIAO DIỆN CUSTOM JS ĐỘC QUYỀN CỦA BẠN (GIỮ NGUYÊN)
// -----------------------------------------------------------------------------
function rawJS(stream) {
  return `
(function () {
    var LOGGER = true;
    var EMBED_STREAM_URL = ${JSON.stringify(stream || '')};

    function log(step, msg, err) {
        if (!LOGGER) return;
        try {
            var time = new Date().toISOString().split('T')[1].slice(0, 8);
            var logText = '[CustomJS][' + time + '][' + step + '] ' + String(msg);
            if (typeof console !== 'undefined') {
                if (err) console.error(logText); else console.log(logText);
            }
        } catch (e) {}
    }

    function ensureDOMReady(callback) {
        if (document && document.body) {
            callback();
        } else {
            var checkCount = 0;
            var checkTimer = setInterval(function () {
                checkCount++;
                if (document && document.body) { clearInterval(checkTimer); callback(); } 
                else if (checkCount > 200) { clearInterval(checkTimer); }
            }, 30);
        }
    }

    var SmartStorage = (function() {
        var memCache = {};
        return {
            getItem: function(key, defaultVal) {
                try { var val = localStorage.getItem(key); return val !== null ? val : defaultVal; } 
                catch(e) { return memCache[key] !== undefined ? memCache[key] : defaultVal; }
            },
            setItem: function(key, val) {
                memCache[key] = val;
                try { localStorage.setItem(key, val); } catch(e) {}
            }
        };
    })();

    (function applyAntiPopupShield() {
        try {
            var dummyWin = { focus: function () {}, blur: function () {}, close: function () {}, closed: true, postMessage: function () {} };
            window.open = function (url) { return dummyWin; };
            var blockHandler = function (e) {
                var target = e.target;
                while (target && target !== document) {
                    if (target.id && target.id.indexOf('v-') === 0) return;
                    if (target.tagName === 'A' && (target.getAttribute('target') === '_blank' || target.target === '_blank')) {
                        e.preventDefault(); e.stopPropagation(); return false;
                    }
                    target = target.parentNode;
                }
            };
            window.addEventListener('click', blockHandler, true);
            window.addEventListener('touchstart', blockHandler, true);
        } catch (e) {}
    })();

    function injectStyles() {
        try {
            if (document.getElementById('v-style-block')) return;
            const style = document.createElement('style');
            style.id = 'v-style-block';
            style.textContent = 
                'html, body { margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background: #000 !important; }' +
                '#v-top-bar { position: fixed !important; top: 12px !important; right: 12px !important; z-index: 2147483647 !important; display: flex !important; gap: 8px !important; align-items: center !important; font-family: sans-serif !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '.v-btn-act { background: rgba(15, 15, 15, 0.9) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 8px 14px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: bold !important; cursor: pointer !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; }' +
                '.v-btn-act:active { background: #e50914 !important; }' +
                '#v-box-list, #v-hist-box { display: none; position: absolute !important; top: 100% !important; right: 0 !important; margin-top: 8px !important; background: rgba(18, 18, 18, 0.95) !important; padding: 12px !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.2) !important; z-index: 2147483647 !important; backdrop-filter: blur(10px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important; }' +
                '#v-box-list { grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important; gap: 6px !important; width: 240px !important; max-height: 220px !important; overflow-y: auto !important; }' +
                '#v-hist-box { width: 260px !important; max-width: 85vw !important; flex-direction: column !important; gap: 10px !important; font-family: sans-serif !important; }' +
                '#v-box-list.closed, #v-hist-box.closed { display: none !important; }' +
                '#v-box-list.open { display: grid !important; }' +
                '#v-hist-box.open { display: flex !important; }' +
                '.v-item-node { background: #222 !important; color: #fff !important; border: 1px solid #444 !important; border-radius: 5px !important; padding: 6px 0 !important; font-size: 12px !important; font-weight: bold !important; cursor: pointer !important; text-align: center !important; }' +
                '.v-item-node.active { background: #e50914 !important; border-color: #ff333d !important; }' +
                '.v-hist-btn-group { display: flex !important; gap: 8px !important; width: 100% !important; }' +
                '.v-hist-sub-btn { flex: 1 !important; padding: 8px 6px !important; border-radius: 6px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; border: none !important; text-align: center !important; color: #fff !important; }' +
                '.v-btn-seen { background: #f39c12 !important; } .v-btn-next { background: #27ae60 !important; }' +
                '.v-arrow-btn { position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; z-index: 2147483647 !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 18px !important; cursor: pointer !important; user-select: none !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '#v-arrow-prev { left: 12px !important; } #v-arrow-next { right: 12px !important; }' +
                '.v-idle-fade { opacity: 0.2 !important; }';
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}
    }

    var idleTimer = null;
    function resetIdleTimer() {
        var topBar = document.getElementById('v-top-bar');
        var prevBtn = document.getElementById('v-arrow-prev');
        var nextBtn = document.getElementById('v-arrow-next');

        var elements = [topBar, prevBtn, nextBtn];
        elements.forEach(function(el) { if (el) el.classList.remove('v-idle-fade'); });

        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function() {
            var gridDiv = document.getElementById('v-box-list');
            var histDiv = document.getElementById('v-hist-box');

            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';

            elements.forEach(function(el) { if (el) el.classList.add('v-idle-fade'); });
        }, 5000);
    }

    function setupAutoFadeEvents() {
        ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'click', 'scroll'].forEach(function(evt) {
            window.addEventListener(evt, resetIdleTimer, true);
        });
        resetIdleTimer();
    }

    var loadingTimer = null;
    function showLoadingScreen(msg) {
        try {
            if (loadingTimer) clearTimeout(loadingTimer);
            var loadingDiv = document.getElementById('v-stage-layer');
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.id = 'v-stage-layer';
                loadingDiv.style.cssText = 
                    'position: fixed !important; top: 0 !important; left: 0 !important;' +
                    'width: 100vw !important; height: 100vh !important; background-color: #0d0d0d !important;' +
                    'display: flex !important; flex-direction: column !important; justify-content: center !important;' +
                    'align-items: center !important; z-index: 2147483646 !important; font-family: sans-serif !important; cursor: pointer !important;';

                loadingDiv.innerHTML = 
                    '<div class="v-ring-spin"></div>' +
                    '<div id="v-stage-text" style="color:#ccc; margin-top:16px; font-size:14px; text-align:center;">' + (msg || 'Đang tải tập phim...') + '<br><small style="color:#777; font-size:11px;">(Chạm để đóng)</small></div>' +
                    '<style>.v-ring-spin { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-left-color: #e50914; border-radius: 50%; animation: v-spin 0.8s linear infinite; } @keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

                loadingDiv.onclick = function() { hideLoadingScreen(); };
                (document.body || document.documentElement).appendChild(loadingDiv);
            } else {
                var txt = document.getElementById('v-stage-text');
                if (txt) txt.innerHTML = (msg || 'Đang tải tập phim...') + '<br><small style="color:#777; font-size:11px;">(Chạm để đóng)</small>';
                loadingDiv.style.display = 'flex';
            }
        } catch(e) {}
    }

    function hideLoadingScreen() {
        try {
            if (loadingTimer) clearTimeout(loadingTimer);
            var elem = document.getElementById('v-stage-layer');
            if (elem) elem.remove();
        } catch(e) {}
    }

    var currentEpisode = 1;
    var episodeList = [];
    var seriesKey = 'default_series';
    var savedHistoryEpi = null;
    var isFirstLoadWithHist = false;

    function parseStreamUrl(urlStr) {
        var result = { current: 1, listEpisodesUrl: '', streamUrl: urlStr };
        try {
            if (!urlStr) throw new Error('URL Stream trống!');
            var urlObj = new URL(urlStr);
            var listUrl = urlObj.searchParams.get('episodes');
            if (listUrl) result.listEpisodesUrl = listUrl;

            var currentFound = null;
            if (listUrl) {
                try {
                    var listUrlObj = new URL(listUrl);
                    currentFound = listUrlObj.searchParams.get('current');
                } catch (e) {}
            }
            if (!currentFound) currentFound = urlObj.searchParams.get('current');
            if (!currentFound) {
                var pathParts = urlObj.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    var match = pathParts[0].match(/-(\\d+)$/); 
                    if (match && match[1]) currentFound = match[1];
                }
            }
            if (currentFound) result.current = parseInt(currentFound, 10);

            var pathName = urlObj.pathname.split('/').filter(Boolean)[0] || 'default_series';
            seriesKey = pathName.replace(/-\\d+$/, ''); 
        } catch(e) {}
        return result;
    }

    function saveHistory(epiNum) {
        try {
            SmartStorage.setItem('watch_hist_' + seriesKey, JSON.stringify({
                lastEpi: parseInt(epiNum, 10),
                time: Date.now()
            }));
        } catch(e) {}
    }

    function getHistory() {
        try {
            var raw = SmartStorage.getItem('watch_hist_' + seriesKey, null);
            if (!raw) return null;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch(e) {
            return null;
        }
    }

    function tryPlayIframeVideo() {
        try {
            var iframe = document.getElementById('v-media-frame');
            if (!iframe) return;
            var iDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iDoc) {
                var video = iDoc.querySelector('video');
                if (video) {
                    video.play();
                    return;
                }
                var playBtn = iDoc.querySelector('.vjs-big-play-button, .jw-display-icon-container, .play-btn, [aria-label="Play"]');
                if (playBtn) playBtn.click();
            }
        } catch(e) {}
    }

    function loadEpisode(epiItem) {
        try {
            showLoadingScreen('Đang chuyển sang Tập ' + epiItem.num + '...');
            currentEpisode = parseInt(epiItem.num, 10);
            
            saveHistory(currentEpisode);
            isFirstLoadWithHist = false; 

            var iframe = document.getElementById('v-media-frame');
            if (iframe) iframe.src = epiItem.streamUrl;

            loadingTimer = setTimeout(function() {
                hideLoadingScreen();
                tryPlayIframeVideo();
            }, 3000);

            buildUI();
        } catch(e) {}
    }

    function buildUI() {
        try {
            injectStyles();
            var parent = document.body || document.documentElement;

            var oldHeader = document.getElementById('v-top-bar'); if (oldHeader) oldHeader.remove();
            var oldPrev = document.getElementById('v-arrow-prev'); if (oldPrev) oldPrev.remove();
            var oldNext = document.getElementById('v-arrow-next'); if (oldNext) oldNext.remove();

            const headerDiv = document.createElement('div');
            headerDiv.id = 'v-top-bar';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'v-btn-act';
            toggleBtn.innerHTML = 'Tập ' + currentEpisode + ' &#9660;';

            const gridDiv = document.createElement('div');
            gridDiv.id = 'v-box-list';
            gridDiv.className = 'closed';

            episodeList.forEach(function(item) {
                const btn = document.createElement('button');
                const isCurrent = Number(item.num) === Number(currentEpisode);
                btn.className = 'v-item-node' + (isCurrent ? ' active' : '');
                btn.textContent = 'Tập ' + item.num;
                btn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    if (Number(item.num) !== Number(currentEpisode)) loadEpisode(item);
                };
                gridDiv.appendChild(btn);
            });

            const epiWrapper = document.createElement('div');
            epiWrapper.style.position = 'relative';
            epiWrapper.appendChild(toggleBtn);
            epiWrapper.appendChild(gridDiv);

            toggleBtn.onclick = function (e) {
                e.stopPropagation();
                histDiv.className = 'closed';
                gridDiv.className = gridDiv.classList.contains('open') ? 'closed' : 'open';
            };

            const histBtn = document.createElement('button');
            histBtn.className = 'v-btn-act';
            histBtn.innerHTML = '📜 Lịch sử';

            const histDiv = document.createElement('div');
            histDiv.id = 'v-hist-box';
            
            var hasValidHist = savedHistoryEpi !== null && 
                               Number(currentEpisode) !== Number(savedHistoryEpi) && 
                               Number(currentEpisode) !== (Number(savedHistoryEpi) + 1);

            if (hasValidHist) {
                var nextEpiOfHist = Number(savedHistoryEpi) + 1;
                histDiv.innerHTML = 
                    '<div style="font-size: 13px; color: #fff; text-align: center;">Lần trước bạn đã xem ở <b>Tập ' + savedHistoryEpi + '</b></div>' +
                    '<div class="v-hist-btn-group">' +
                        '<button id="v-btn-hist-seen" class="v-hist-sub-btn v-btn-seen">Tập đã xem (' + savedHistoryEpi + ')</button>' +
                        '<button id="v-btn-hist-next" class="v-hist-sub-btn v-btn-next">Tập kế tiếp (' + nextEpiOfHist + ')</button>' +
                    '</div>';
            } else {
                histDiv.innerHTML = '<div style="font-size: 12px; color: #aaa; text-align: center;">Chưa có lịch sử phù hợp.</div>';
            }

            if (isFirstLoadWithHist && hasValidHist) {
                histDiv.className = 'open';
            } else {
                histDiv.className = 'closed';
            }

            const histWrapper = document.createElement('div');
            histWrapper.style.position = 'relative';
            histWrapper.appendChild(histBtn);
            histWrapper.appendChild(histDiv);

            histBtn.onclick = function (e) {
                e.stopPropagation();
                gridDiv.className = 'closed';
                histDiv.className = histDiv.classList.contains('open') ? 'closed' : 'open';
            };

            var hideMenusOnOutsideClick = function (e) {
                var target = e.target;
                if (!epiWrapper.contains(target) && !histWrapper.contains(target)) {
                    gridDiv.className = 'closed';
                    histDiv.className = 'closed';
                }
            };
            window.addEventListener('click', hideMenusOnOutsideClick, true);
            window.addEventListener('touchstart', hideMenusOnOutsideClick, true);

            headerDiv.appendChild(epiWrapper);
            headerDiv.appendChild(histWrapper);
            parent.appendChild(headerDiv);

            if (hasValidHist) {
                var btnSeen = histDiv.querySelector('#v-btn-hist-seen');
                if (btnSeen) {
                    btnSeen.onclick = function(e) {
                        e.stopPropagation();
                        histDiv.className = 'closed';
                        var targetItem = episodeList.find(function(x) { return Number(x.num) === Number(savedHistoryEpi); });
                        if (targetItem) loadEpisode(targetItem);
                    };
                }

                var btnNext = histDiv.querySelector('#v-btn-hist-next');
                if (btnNext) {
                    btnNext.onclick = function(e) {
                        e.stopPropagation();
                        histDiv.className = 'closed';
                        var targetItem = episodeList.find(function(x) { return Number(x.num) === (Number(savedHistoryEpi) + 1); });
                        if (targetItem) loadEpisode(targetItem);
                    };
                }
            }

            var currentIndex = episodeList.findIndex(function(x) { return Number(x.num) === Number(currentEpisode); });
            if (currentIndex > 0) {
                const prevBtn = document.createElement('div');
                prevBtn.className = 'v-arrow-btn';
                prevBtn.id = 'v-arrow-prev';
                prevBtn.innerHTML = '❮';
                prevBtn.onclick = function () { loadEpisode(episodeList[currentIndex - 1]); };
                parent.appendChild(prevBtn);
            }

            if (currentIndex >= 0 && currentIndex < episodeList.length - 1) {
                const nextBtn = document.createElement('div');
                nextBtn.className = 'v-arrow-btn';
                nextBtn.id = 'v-arrow-next';
                nextBtn.innerHTML = '❯';
                nextBtn.onclick = function () { loadEpisode(episodeList[currentIndex + 1]); };
                parent.appendChild(nextBtn);
            }

            setupAutoFadeEvents();
        } catch(e) {}
    }

    ensureDOMReady(function() {
        try {
            showLoadingScreen('Đang chuẩn bị trình phát...');
            document.body.style.cssText = 'margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background-color: #000 !important;';
            document.body.innerHTML = '';

            var parsed = parseStreamUrl(EMBED_STREAM_URL);
            currentEpisode = parsed.current;

            var prevHist = getHistory();
            if (prevHist && prevHist.lastEpi) {
                savedHistoryEpi = parseInt(prevHist.lastEpi, 10);
                
                if (Number(currentEpisode) !== Number(savedHistoryEpi) && 
                    Number(currentEpisode) !== (Number(savedHistoryEpi) + 1)) {
                    isFirstLoadWithHist = true; 
                }
            }

            var mainIframe = document.createElement('iframe');
            mainIframe.id = 'v-media-frame';
            mainIframe.src = EMBED_STREAM_URL;
            mainIframe.style.cssText = 'width: 100vw; height: 100vh; border: 0; position: fixed; top: 0; left: 0; z-index: 1;';
            mainIframe.setAttribute('allowfullscreen', 'true');
            mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
            document.body.appendChild(mainIframe);

            saveHistory(currentEpisode);

            if (parsed.listEpisodesUrl) {
                fetch(parsed.listEpisodesUrl)
                    .then(function(res) { return res.json(); })
                    .then(function(resData) {
                        var data = resData.data || resData;
                        if (data && data.list_episodes && Array.isArray(data.list_episodes)) {
                            episodeList = [];
                            for (var j = 0; j < data.list_episodes.length; j++) {
                                var item = data.list_episodes[j];
                                var split = item.split("|");
                                var epNum = parseInt(split[0], 10);
                                episodeList.push({
                                    id: EMBED_STREAM_URL + "?current=" + epNum,
                                    name: "Tập " + epNum,
                                    slug: "tap-" + epNum,
                                    num: epNum,
                                    streamUrl: split[1]
                                });
                            }
                            buildUI();
                        } else {
                            throw new Error('Invalid JSON');
                        }
                    })
                    .catch(function() {
                        episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL }];
                        buildUI();
                    });
            } else {
                episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL }];
                buildUI();
            }

            loadingTimer = setTimeout(function() {
                hideLoadingScreen();
                tryPlayIframeVideo();
            }, 3000);

        } catch(mainErr) {
            hideLoadingScreen();
        }
    });
})();
`;
}

function sortEpisodesByName(data) {
    try {
        if (data && Array.isArray(data)) {
            data.forEach(function(server) {
                if (server.episodes && Array.isArray(server.episodes)) {
                    server.episodes.sort(function(a, b) {
                        var matchA = a.name.match(/Tập\s*(\d+)/i);
                        var matchB = b.name.match(/Tập\s*(\d+)/i);
                        var numA = matchA ? parseInt(matchA[1], 10) : 0;
                        var numB = matchB ? parseInt(matchB[1], 10) : 0;
                        return numA - numB;
                    });
                }
            });
        }
        return data;
    } catch (e) {
        log("sortEpisodesByName[err]:\n " + e);
        return data;
    }
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("parseCategoriesResponse[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"/type/hoat-hinh/\",\"name\":\"Hoạt Hình\"},{\"link\":\"/type/vien-tuong/\",\"name\":\"Viễn Tưởng\"},{\"link\":\"/type/hinh-su/\",\"name\":\"Hình Sự\"},{\"link\":\"/type/bi-an/\",\"name\":\"Bí Ẩn\"},{\"link\":\"/type/hanh-dong/\",\"name\":\"Hành Động\"}]`;
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

function _$(htmlOrBlock){ 
  if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = currentHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; 
}
