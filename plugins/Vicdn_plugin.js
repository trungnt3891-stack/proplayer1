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
    "description": "Bản Webview Gốc: 1 Nút Bấm, Tích hợp Giao diện CustomJS, Thêm Tìm Kiếm",
    "version": "3.0.0",
    "info": "Khôi phục giao diện Webview độc quyền. Sửa lỗi tìm kiếm, thêm danh mục lướt ngang ra trang chủ.",
    "baseUrl": BASEURL,
    "iconUrl": BASEURL + "/vicdn.png",
    "isEnabled": true,
    "adblock": false,
    "type": "MOVIE",
    "layoutType": "VERTICAL",
    "playerType": "embed" // ÉP DÙNG EMBED ĐỂ MỞ WEBVIEW GIỐNG NARTO
  });
}

function log(msg) {
  if (DEV) {
      if (typeof nativeLog !== 'undefined') {
          nativeLog("[Vicdn] " + msg);
      } else if (typeof console !== 'undefined' && console.log) {
          console.log("[Vicdn] " + msg);
      }
  }
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA: ĐƯA 5 DANH MỤC RA TRANG CHỦ THEO YÊU CẦU (1 GRID + 4 HORIZONTAL)
// -----------------------------------------------------------------------------
function getHomeSections() {
    return JSON.stringify([
        { "slug": "update/", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "type/hanh-dong/", "title": "Hành Động", "type": "Horizontal" },
        { "slug": "type/hoat-hinh/", "title": "Hoạt Hình", "type": "Horizontal" },
        { "slug": "type/vien-tuong/", "title": "Viễn Tưởng", "type": "Horizontal" },
        { "slug": "type/hinh-su/", "title": "Hình Sự", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        return JSON.stringify(buildMenu(listurl));
    } catch (e) { return JSON.stringify([]); }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        return JSON.stringify({ category: buildMenu(listurl) });
    } catch (e) { return JSON.stringify({ category: [] }); }
}

// -----------------------------------------------------------------------------
// URL GENERATOR CHUẨN
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "update/";

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                if (filters.category && filters.category.length > 0) {
                    path = filters.category[0].slug;
                } else if (typeof filters.category === 'string') {
                    path = filters.category;
                }
            } catch (jsonErr) {}
        }

        if (path.indexOf("http") === 0) return path;

        var resultUrl = BASEAPI + (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 0) {
            if (!resultUrl.endsWith("/")) resultUrl += "/";
            resultUrl += page; 
        }
        return resultUrl;
    } catch (e) {
        return BASEAPI + "/update/1";
    }
}

// ĐÃ SỬA: Đưa từ khóa vào URL để hàm Parser xử lý được
function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "").trim();
    return BASEURL + "/index.php?search_keyword=" + encodedKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEAPI + "/info/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// -----------------------------------------------------------------------------
// ĐÃ SỬA: PARSER TÌM KIẾM VÀ DANH SÁCH (Sử dụng Regex siêu tốc, Bỏ DOM ảo _$)
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent, url) {
    try {
        var dataArr = [];
        var totalPages = 1;
        var currentPage = 1;

        if (url.indexOf("search_keyword=") > -1) {
            var scriptMatch = htmlContent.match(/const\s+allData\s*=\s*(\[[\s\S]*?\])\s*;/i);
            if (scriptMatch) {
                var allData = JSON.parse(scriptMatch[1]);
                var keyword = decodeURIComponent(url.match(/search_keyword=([^&]+)/)[1]).toLowerCase();
                
                for (var j = 0; j < allData.length; j++) {
                    var vname = (allData[j].vname || "").toLowerCase();
                    var ename = (allData[j].ename || "").toLowerCase();
                    if (vname.indexOf(keyword) > -1 || ename.indexOf(keyword) > -1) {
                        dataArr.push(allData[j]);
                    }
                }
            }
        } 
        else {
            var jsonRes = JSON.parse(htmlContent);
            dataArr = jsonRes.data || [];
            totalPages = jsonRes.pagination ? parseInt(jsonRes.pagination.total_pages) : 1;
            currentPage = jsonRes.pagination ? parseInt(jsonRes.pagination.current_page) : 1;
        }

        var items = [];
        for (var i = 0; i < dataArr.length; i++) {
            var item = dataArr[i];
            items.push({
                "id": item.slug, 
                "title": item.vname || item.ename || "Chưa có tên",
                "posterUrl": item.poster ? "https://image.tmdb.org/t/p/w300/" + item.poster + ".jpg" : "",
                "backdropUrl": item.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + item.banner + ".jpg" : "",
                "quality": (item.type || "HD").toUpperCase(),
                "episode_current": "Tập " + (item.stt || 0) + "/" + (item.total || "?")
            });
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(htmlContent, url) {
    return parseListResponse(htmlContent, url);
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA: TẠO 1 NÚT BẤM "Bấm vào để xem Phim"
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, url) {
    try {
        var jsonRes = JSON.parse(htmlContent);
        var $data = jsonRes.data;

        var servers = [{
            name: "ViCDN Webview",
            episodes: [{
                id: url, // Gửi link API sang bước DetailResponse
                name: "Bấm vào để xem Phim",
                slug: "webview-player"
            }]
        }];

        return JSON.stringify({
            id: url,
            title: $data.vname || $data.ename || "Đang cập nhật",
            posterUrl: $data.poster ? "https://image.tmdb.org/t/p/w300/" + $data.poster + ".jpg" : "",
            backdropUrl: $data.banner ? "https://image.tmdb.org/t/p/w533_and_h300_face/" + $data.banner + ".jpg" : "",
            description: $data.content || "Không có mô tả",
            quality: ($data.type || "HD").toUpperCase(),
            year: parseInt($data.year) || 2026,
            rating: parseFloat($data.rate || 0),
            status: "Tập " + $data.stt + "/" + $data.total,
            category: ($data.genre || []).join(" - "),
            episode_current: "Tập " + $data.stt,
            servers: servers,
            duration: $data.duration ? $data.duration + " Phút" : "",
            casts: ($data.cast || []).join(" - ")
        });
    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi chi tiết phim", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// ĐÃ SỬA: ÉP IS_EMBED = TRUE ĐỂ MỞ WEBVIEW KÈM CUSTOM-JS CỦA BẠN
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        var $jsdata = JSON.parse(htmlContent);
        var $data = $jsdata.data;
        var stream = "";

        // Trích xuất link luồng tập 1 (hoặc mkv) từ JSON API
        if ($data.list_episodes && $data.list_episodes.length > 0) {
            var split = $data.list_episodes[0].split("|");
            stream = split[1] + "?episodes=" + url;
        } else if ($data.mkv) {
            stream = $data.mkv + "?episodes=" + url;
        }

        // Tạo ra script tùy chỉnh gốc của bạn
        var customJS = checkRaw(rawJS(stream), true);
        
        return JSON.stringify({
            url: stream,
            isEmbed: true, // [SỬA LẠI THÀNH TRUE]: Kết hợp với playerType="embed" sẽ ép VAX App mở Webview trên màn hình
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                "Referer": BASEURL,
                "Custom-Js": customJS
            },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: true, headers: {} });
    }
}

// -----------------------------------------------------------------------------
// HÀM CHUẨN HOÁ RAW JS (GIỮ NGUYÊN)
// -----------------------------------------------------------------------------
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
  } catch (e) { return scriptStr; }
}

// -----------------------------------------------------------------------------
// GIAO DIỆN CUSTOM JS ĐỘC QUYỀN CỦA BẠN (GIỮ NGUYÊN 100%)
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
        } catch(e) { return null; }
    }

    function tryPlayIframeVideo() {
        try {
            var iframe = document.getElementById('v-media-frame');
            if (!iframe) return;
            var iDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iDoc) {
                var video = iDoc.querySelector('video');
                if (video) { video.play(); return; }
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

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
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
