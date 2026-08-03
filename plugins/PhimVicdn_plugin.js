// =============================================================================
// CẤU HÌNH DOMAIN VICDN
// =============================================================================
var BASEURL = "https://vicdn.cc"; 
var BASEAPI = BASEURL + "/api";
var DEV = true;

function getManifest() {
  return JSON.stringify({
    "id": "vicdn",
    "name": "Nguồn Vicdn",
    "description": "Bản Gốc Hoàn Hảo: 1 Nút Bấm Xem Phim, Giao Diện Chọn Tập CustomJS.",
    "version": "6.0.1",
    "info": "Khôi phục 100% code gốc. Đã sửa triệt để lỗi thiếu hàm thư viện khiến App không load được trang chủ.",
    "baseUrl": BASEURL,
    "iconUrl": BASEURL + "/vicdn.png",
    "isEnabled": true,
    "adblock": false,
    "type": "MOVIE",
    "playerType": "embed" // [BẮT BUỘC] Dùng embed để mở Webview kèm CustomJS
  });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[vicdn] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[vicdn] " + msg);
    }
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA: ĐƯA 5 DANH MỤC RA TRANG CHỦ THEO YÊU CẦU (1 GRID + 4 HORIZONTAL)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// URL GENERATOR CHUẨN (ĐÃ FIX LỖI NỐI CHUỖI GÂY 404 KHI SANG TRANG 2)
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;
                    if (pageSearch > 1 && slug.indexOf("page=") === -1) {
                        var sepSearch = slug.indexOf("?") > -1 ? "&" : "?";
                        return slug + sepSearch + "page=" + pageSearch;
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

        // ĐÃ FIX: Chèn thêm dấu '/' trước khi nối page để tránh lỗi /api/update2
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            if (resultUrl.charAt(resultUrl.length - 1) !== '/') {
                resultUrl += '/';
            }
            resultUrl += page;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEAPI + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
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

        var encodedKeyword = encodeURIComponent(keyword || "").trim();
        var resultUrl = BASEURL + "/?q=" + encodedKeyword;

        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        return BASEURL + "/?q=" + encodeURIComponent(keyword || "").trim();
    }
}

function getUrlDetail(slug) {
    try {
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        return BASEURL + "/" + slug;
    } catch (e) {
        return "";
    }
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// PARSERS CỦA BẠN (ĐÃ LOẠI BỎ SỰ PHỤ THUỘC VÀO THƯ VIỆN BỊ THIẾU)
// -----------------------------------------------------------------------------
function parseListResponse(html, $url) {
    try {
        if ($url && $url.indexOf("/?q=") > -1) {
            // ĐÃ SỬA: Dùng Regex nhẹ gọn thay cho thư viện _$ bị thiếu
            var scriptMatch = html.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
            if (scriptMatch) {
                var $data = JSON.parse(scriptMatch[1]);
                var keywordMatch = $url.match(/q=([^&]+)/);
                var keyword = keywordMatch ? decodeURIComponent(keywordMatch[1]).toLowerCase().trim() : "";
                
                var filteredData = [];
                for(var k = 0; k < $data.length; k++){
                    var vname = ($data[k].vname || "").toLowerCase();
                    var ename = ($data[k].ename || "").toLowerCase();
                    if(vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1){
                        filteredData.push($data[k]);
                    }
                }
                return domfetch(filteredData, $url);
            }
        } else {
            var $allData = JSON.parse(html);
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

function domfetch($data, $url) {
    var items = [];
    if (!$data) return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });

    for (var $j = 0; $j < $data.length; $j++) {
        var item = $data[$j];
        
        // Tự động ghép link tmdb nếu web trả về mã băm
        var pUrl = item.poster || "";
        if (pUrl && pUrl.indexOf("http") === -1) pUrl = "https://image.tmdb.org/t/p/w300/" + pUrl + ".jpg";
        
        var bUrl = item.banner || "";
        if (bUrl && bUrl.indexOf("http") === -1) bUrl = "https://image.tmdb.org/t/p/w533_and_h300_face/" + bUrl + ".jpg";

        items.push({
            "id": BASEAPI + "/info/" + item.slug, 
            "title": item.vname || item.ename,
            "posterUrl": pUrl,
            "backdropUrl": bUrl,
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
    return parseListResponse(html, url);
}

// -----------------------------------------------------------------------------
// TẠO 1 NÚT BẤM "Bấm Vào Đây Để Xem Phim"
// -----------------------------------------------------------------------------
function parseMovieDetail(html, url) {
    try {
        var $jsdata = JSON.parse(html);
        if (!$jsdata || !$jsdata.data) throw new Error("Dữ liệu rỗng");
        var $data = $jsdata.data;
        
        var limg = $data.banner || "";
        if (limg && limg.indexOf("http") === -1) {
            limg = "https://image.tmdb.org/t/p/w533_and_h300_face/" + limg + ".jpg";
        }
        
        var lname = $data.vname || "Đang cập nhật...";
        var ldes = $data.content || "Không có mô tả.";
        var lactor = ($data.cast || []).join(" - ");
        var lduran = $data.duration ? $data.duration + " phút" : "";
        var status = "Tập " + ($data.stt || "0") + "/" + ($data.total || "?");
        var category = ($data.genre || []).join(" - ");
        var episode_current = "Tập " + ($data.stt || "0");
        var year = $data.year || 2026;
        
        var servers = [];
        var episodes = [];
        
        // Đẩy ra duy nhất 1 nút để người dùng bấm vào Webview
        episodes.push({
            id: url + "?current=1",
            name: "Bấm Vào Đây Để Xem Phim",
            slug: "tap-1"
        });
        
        servers.push({
            name: "Giao Diện Web Gốc",
            episodes: episodes
        });
        
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
            casts: lactor || ""
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi tải thông tin chi tiết",
            servers: []
        });
    }
}

// -----------------------------------------------------------------------------
// GIỮ NGUYÊN 100% CỦA BẠN (CHÈN CUSTOM-JS VÀO WEBVIEW)
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
  try {
    var $jsdata = JSON.parse(html);
    var $data = $jsdata.data;
    
    // ĐÃ SỬA: Bắt current an toàn chống lỗi Match Null
    var match = url.match(/current=(\d+)/i);
    var current = match ? Number(match[1]) : 1;
    var baseUrl = url.split("?")[0];
    var stream = baseUrl;
    
    if ($data.list_episodes && $data.list_episodes.length > 0) {
        for (var $j = 0; $j < $data.list_episodes.length; $j++) {
            var item = $data.list_episodes[$j];
            var split = item.split("|");
            if(Number(split[0]) === current){
              stream = split[1] + "?episodes=" + baseUrl;
            }
        }
    } else if ($data.mkv) {
        stream = $data.mkv + "?episodes=" + baseUrl;
    }
    
    var customJS = checkRaw(rawJS(stream), true);
    
    return JSON.stringify({
      url: stream,
      isEmbed: false, // Bắt buộc là false để mở Webview
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": BASEURL,
        "Custom-Js": customJS
      },
      subtitles: [],
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

function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== 'string') return scriptStr || "";

    var lines = scriptStr.split('\n');
    var fixedLines = [];

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var fixedLine = currentLine;
      if (returnFixed) {
        fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  ");
      }
      fixedLines.push(fixedLine);
    }
    return returnFixed ? fixedLines.join('\n') : scriptStr;
  } catch (e) {
    return scriptStr; 
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
            
            if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
                window.SnifferBridge.log(logText);
            } else if (typeof console !== 'undefined') {
                if (err) console.error(logText);
                else console.log(logText);
            }
        } catch (e) {}
    }

    log('INIT', 'Bắt đầu khởi tạo CustomJS với EMBED_STREAM_URL = ' + EMBED_STREAM_URL);

    function ensureDOMReady(callback) {
        if (document && document.body) {
            callback();
        } else {
            var checkCount = 0;
            var checkTimer = setInterval(function () {
                checkCount++;
                if (document && document.body) {
                    clearInterval(checkTimer);
                    callback();
                } else if (checkCount > 200) {
                    clearInterval(checkTimer);
                }
            }, 30);
        }
    }

    var SmartStorage = (function() {
        var memCache = {};
        return {
            getItem: function(key, defaultVal) {
                try {
                    var val = localStorage.getItem(key);
                    return val !== null ? val : defaultVal;
                } catch(e) {
                    return memCache[key] !== undefined ? memCache[key] : defaultVal;
                }
            },
            setItem: function(key, val) {
                memCache[key] = val;
                try {
                    localStorage.setItem(key, val);
                } catch(e) {}
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
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
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
        
        elements.forEach(function(el) {
            if (el) el.classList.remove('v-idle-fade');
        });

        if (idleTimer) clearTimeout(idleTimer);
        
        idleTimer = setTimeout(function() {
            var gridDiv = document.getElementById('v-box-list');
            var histDiv = document.getElementById('v-hist-box');

            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';

            elements.forEach(function(el) {
                if (el) el.classList.add('v-idle-fade');
            });
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

// =============================================================================
// THƯ VIỆN BỔ TRỢ (ĐÃ KHÔI PHỤC)
// =============================================================================
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

function parseCountriesResponse(html) {
    try { return "[]"; } catch (e) { return "[]"; }
}

function parseYearsResponse(html) {
    try { return "[]"; } catch (e) { return "[]"; }
}

// Bổ sung các Menu để khởi tạo được danh sách Category/Filter
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
