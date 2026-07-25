// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimchillhdf.im";

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Giao diện Player thông minh: Lưu lịch sử, chuyển tập trực tiếp.",
        "version": "4.0.0",             
        "baseUrl": BASEURL,
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/motherless_logo.jpgphimchill.ico", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "webview" // Bắt buộc webview để tiêm giao diện JS
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "danh-sach/phim-moi.html", "title": "Phim Mới Đề Cử", "type": "Grid" },
        { "slug": "quoc-gia/han-quoc.html", "title": "Phim Hàn Quốc", "type": "Grid" },
        { "slug": "quoc-gia/trung-quoc.html", "title": "Phim Trung Quốc", "type": "Grid" },
        { "slug": "quoc-gia/au-my.html", "title": "Phim Âu Mỹ", "type": "Grid" },
        { "slug": "danh-sach/phim-le.html", "title": "Top Phim Lẻ", "type": "Grid" }
    ]);
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
    if (id.indexOf('http') === 0) return id;
    return BASEURL + (id.startsWith('/') ? '' : '/') + id;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS - LOAD TRANG CHỦ & THƯ MỤC
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};

        var regex = /<a[^>]*href=["']([^"']+\/phim\/[^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*(?:src|data-src)=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var url = match[1].trim();
            var title = match[2].replace(/<[^>]*>/g, '').trim();
            var posterUrl = match[3].trim();

            if (!title || title === "Video không tiêu đề") continue;

            if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + posterUrl;
            } else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + "/" + posterUrl;
            }
            if (url.indexOf("tap-") !== -1) continue;

            if (!seen[url]) {
                items.push({
                    "id": url, "title": title, "posterUrl": posterUrl, "backdropUrl": posterUrl, "quality": "HD"
                });
                seen[url] = true;
            }
        }

        if (items.length === 0) {
            var articleRegex = /<article[\s\S]*?<\/article>/gi;
            var articles = html.match(articleRegex) || [];
            for (var j = 0; j < articles.length; j++) {
                var block = articles[j];
                var hMatch = block.match(/href="([^"]+\/phim\/[^"]+)"/i);
                var tMatch = block.match(/title="([^"]+)"/i);
                var iMatch = block.match(/(?:src|data-src)="([^"]+)"/i);

                if (hMatch && tMatch) {
                    var link = hMatch[1].trim();
                    var name = tMatch[1].trim();
                    var img = iMatch ? iMatch[1].trim() : "";

                    if (img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = BASEURL + img;
                    if (link.indexOf("tap-") !== -1) continue;

                    if (!seen[link]) {
                        items.push({
                            "id": link, "title": name, "posterUrl": img, "backdropUrl": img, "quality": "HD"
                        });
                        seen[link] = true;
                    }
                }
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 50, "totalItems": items.length * 50, "itemsPerPage": 24 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// PARSER CHI TIẾT PHIM (TRẢ VỀ LINK ĐỂ NẠP WEBVIEW)
// =============================================================================

function parseMovieDetail(htmlContent, url) {
    try {
        var idMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) ||
                      htmlContent.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        
        var rmatch = htmlContent.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];
        rmatch = htmlContent.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];
        rmatch = htmlContent.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];

        // Lấy link xem phim để kích hoạt webview
        var xemPhimMatch = htmlContent.match(/href="([^"]+\/phim\/[^"]+\/tap-[^"]*\.html)"/i) || 
                           htmlContent.match(/href="([^"]+\/tap-[^"]*)"/i) ||
                           htmlContent.match(/href="([^"]+)"[^>]*>[^<]*Xem Phim/i);
        
        var targetUrl = id;
        if (xemPhimMatch) {
            targetUrl = xemPhimMatch[1];
            if (targetUrl.indexOf('http') !== 0) {
                targetUrl = BASEURL + (targetUrl.startsWith('/') ? '' : '/') + targetUrl;
            }
        }

        var servers = [{
            name: "Mở Giao Diện Webview Chọn Tập",
            episodes: [{
                id: targetUrl,
                name: "Chọn tập thoải mái trên Webview",
                slug: "webview"
            }]
        }];

        return JSON.stringify({
            id: id, title: lname, posterUrl: limg, backdropUrl: limg, description: ldes,
            quality: "HD", year: 2026, rating: 8.0, servers: servers
        });
        
    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// PARSER DETAIL & INJECT GIAO DIỆN PLAYER (ĐÃ FIX LỖI TẬP)
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var dataSV = {};
        
        // 1. Trích xuất link stream video
        var streamUrl = "";
        var m3u8Match = html.match(/data-type="m3u8"[^>]*data-link="([^"]+)"/i) || html.match(/data-link="([^"]+\.m3u8[^"]*)"/i);
        if (m3u8Match) streamUrl = m3u8Match[1];
        if (!streamUrl) {
            var embedMatch = html.match(/data-type="embed"[^>]*data-link="([^"]+)"/i);
            if (embedMatch) streamUrl = embedMatch[1];
        }
        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) streamUrl = iframeMatch[1];
        }

        // 2. Trích xuất Movie ID để lưu lịch sử độc lập
        var movieIdMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
        var movieId = "phimchill_default";
        if (movieIdMatch) {
            var mUrl = movieIdMatch[1];
            movieId = mUrl.replace(/\/tap-[^/]+$/, "").split('/').pop() || "phimchill_movie";
        }

        // 3. BÓC TÁCH DANH SÁCH TẬP PHIM CHILL (ĐÃ SỬA CHUẨN XÁC)
        var episodes = [];
        var seenEp = {};
        
        // Quét cẩn thận các thẻ a có chứa "tap-"
        var aTagRegex = /<a([^>]+href=["'][^"']+\/tap-[^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aTagRegex.exec(html)) !== null) {
            var attrs = match[1];
            var innerText = match[2].replace(/<[^>]*>/g, '').trim();
            
            var hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
            var href = hrefMatch ? hrefMatch[1].trim() : "";
            
            var titleMatch = attrs.match(/title=["']([^"']+)["']/i);
            var titleAttr = titleMatch ? titleMatch[1].trim() : "";
            
            if (href && href.indexOf('javascript') === -1) {
                if (href.indexOf('http') !== 0) {
                    href = BASEURL + (href.startsWith('/') ? '' : '/') + href;
                }
                
                if (!seenEp[href]) {
                    var name = titleAttr || innerText;
                    // Format lại thành "Tập X" nếu chưa có chữ tập
                    if (!name.toLowerCase().includes("tập") && !isNaN(parseInt(name))) {
                        name = "Tập " + name;
                    }
                    
                    episodes.push({
                        id: href,
                        name: name || "Tập",
                        slug: href.split('/').pop()
                    });
                    seenEp[href] = true;
                }
            }
        }
        
        var servers = [];
        if(episodes.length > 0) {
            // Sắp xếp thứ tự tập
            episodes.sort(function(a, b) {
                var numA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                var numB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                return numA - numB;
            });
            servers.push({
                name: "Phim Chill VIP",
                episodes: episodes
            });
        } else {
            servers.push({
                name: "Phim Lẻ",
                episodes: [{id: url, name: "Full", slug: "full"}]
            });
        }

        dataSV.stream = streamUrl || url;
        dataSV.current = url;
        dataSV.movieId = movieId;
        dataSV.servers = servers;

        var customJS = rawJS(dataSV);

        return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
                "Referer": BASEURL + "/",
                "Custom-Js": customJS
            },
            subtitles: []
        });

    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

function rawJS(config) {
    return `
(function() {
    // 1. DIỆT SẠCH GIAO DIỆN CŨ ĐỂ DỰNG PLAYER CUSTOM
    if (document.head) {
        document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
    }
    document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

    // 2. KHỞI TẠO BIẾN
    const DATA = ${JSON.stringify(config)};
    const INITIAL_STREAM = DATA.stream || "";
    const CURRENT_URL = DATA.current || "";
    const SERVERS = Array.isArray(DATA.servers) ? DATA.servers : [];
    const AUTO_HIDE_TIME = 15000; 
    const storageKey = "phimchill_history_" + (DATA.movieId || "default");
    const widthStorageKey = "pc_player_iframe_width";
    const heightStorageKey = "pc_player_iframe_height";
    const scaleStorageKey = "pc_player_iframe_scale";

    let currentServerIndex = 0;
    let currentEpisodeIndex = 0;
    let hideTimer = null;

    // 3. CSS CHO PLAYER GIAO DIỆN ĐẸP
    let styleTag = document.createElement('style');
    styleTag.textContent = \`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
        
        #framePlay {
            position: fixed !important; top: 50% !important; left: 50% !important;
            transform-origin: center center !important; border: none !important;
            margin: 0 !important; padding: 0 !important; z-index: 1 !important;
            display: block !important;
            transition: width 0.15s ease, height 0.15s ease, transform 0.15s ease !important;
        }

        #iframe-event-overlay {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            z-index: 10 !important; background: transparent !important;
            cursor: pointer !important;
        }

        .floating-control-ui { 
            opacity: 0 !important; 
            pointer-events: none !important;
            transition: opacity 0.4s ease !important; 
        }
        .floating-control-ui.active-show { 
            opacity: 1 !important; 
            pointer-events: auto !important;
        }

        #center-play-notice {
            position: fixed !important; top: calc(50% + 50px) !important; left: 50% !important;
            transform: translate(-50%, -50%) !important; z-index: 999999 !important;
            background: rgba(15, 15, 18, 0.92) !important; backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #fff !important;
            padding: 12px 24px !important; border-radius: 30px !important; font-size: 14px !important;
            font-weight: 600 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important;
            pointer-events: none !important; transition: opacity 0.3s ease, transform 0.3s ease !important;
            opacity: 0; text-align: center !important; white-space: nowrap !important;
        }

        #server-select-box {
            appearance: none !important; -webkit-appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
            background-repeat: no-repeat !important; background-position: right 6px center !important;
            background-size: 10px !important; padding-right: 22px !important;
        }
        .dim-btn {
            background: rgba(255, 255, 255, 0.12) !important; color: #fff !important; border: none !important;
            border-radius: 4px !important; width: 22px !important; height: 22px !important; cursor: pointer !important;
            font-size: 13px !important; font-weight: bold !important; display: inline-flex !important;
            align-items: center !important; justify-content: center !important; padding: 0 !important; line-height: 1 !important;
        }
        .dim-btn:hover { background: rgba(255, 255, 255, 0.25) !important; }
        .dim-input {
            width: 38px !important; background: transparent !important; border: none !important;
            color: #fff !important; text-align: center !important; font-size: 12px !important;
            font-weight: 700 !important; outline: none !important; padding: 0 !important;
        }
        .dim-input::-webkit-outer-spin-button, .dim-input::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
        .dim-input[type=number] { -moz-appearance: textfield !important; }
        
        .ep-grid-btn {
            display: flex !important; align-items: center !important; justify-content: center !important;
            padding: 8px 12px !important; border-radius: 6px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #fff !important; cursor: pointer !important; font-size: 12px !important; font-weight: 700 !important;
            text-align: center !important; white-space: nowrap !important; transition: all 0.2s ease !important;
            user-select: none !important; box-sizing: border-box !important; width: 100% !important; min-height: 36px !important;
        }
        .ep-grid-btn:hover { border-color: rgba(255, 255, 255, 0.3) !important; }
        .ep-grid-btn.active { background-color: #007bff !important; border-color: #007bff !important; }
        .ep-grid-btn.inactive { background-color: rgba(255, 255, 255, 0.08) !important; }

        .toast-action-btn {
            background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; border: 1px solid rgba(255, 255, 255, 0.2) !important;
            padding: 5px 10px !important; border-radius: 5px !important; font-size: 11px !important; font-weight: 700 !important;
            cursor: pointer !important; transition: background 0.2s ease !important; display: inline-flex !important; align-items: center !important;
        }
        .toast-action-btn:hover { background: rgba(255, 255, 255, 0.3) !important; }
        .toast-action-btn.primary { background: #007bff !important; border-color: #007bff !important; }
    \`;
    document.head.appendChild(styleTag);

    // 4. OVERLAY LOADING & NOTICE
    let overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: '999998', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
    });

    function showLoading(msg) {
        msg = msg || 'Đang tải...';
        overlay.innerHTML = '<div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite;"></div><div style="margin-top: 14px; font-size: 13px; color: #ccc; font-weight: 500;">' + msg + '</div>';
        overlay.style.opacity = '1';
        overlay.style.display = 'flex';
        if (!document.getElementById('loading-overlay')) document.body.appendChild(overlay);
    }

    function hideLoading() {
        overlay.style.transition = 'opacity 0.25s ease';
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.style.display = 'none'; }, 250);
    }

    function showCenterPlayNotice(text) {
        let notice = document.getElementById('center-play-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'center-play-notice';
            document.body.appendChild(notice);
        }
        notice.textContent = text;
        requestAnimationFrame(function() { notice.style.opacity = '1'; });
        let overlayEvt = document.getElementById('iframe-event-overlay');
        if (overlayEvt) overlayEvt.style.display = 'block';
    }

    function hideCenterPlayNotice() {
        let notice = document.getElementById('center-play-notice');
        if (notice) notice.style.opacity = '0';
        let overlayEvt = document.getElementById('iframe-event-overlay');
        if (overlayEvt) overlayEvt.style.display = 'none';
    }

    // Toast Lịch sử xem
    function showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName) {
        let toast = document.getElementById('mini-action-toast');
        if (toast) toast.remove();

        toast = document.createElement('div');
        toast.id = 'mini-action-toast';
        toast.className = 'floating-control-ui active-show';
        toast.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important; background-color: rgba(22, 22, 26, 0.95) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff !important; padding: 12px 16px !important; border-radius: 8px !important; font-size: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; transition: opacity 0.4s ease !important; opacity: 0; display: flex !important; flex-direction: column !important; gap: 10px !important; max-width: 380px !important;';

        let title = document.createElement('div');
        title.innerHTML = '📍 Lần trước bạn đã xem đến <b>' + savedEpName + '</b>.';

        let btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex !important; gap: 6px !important; align-items: center !important;';

        let btnHistory = document.createElement('button');
        btnHistory.className = 'toast-action-btn primary';
        btnHistory.textContent = savedEpName;
        btnHistory.onclick = function(e) {
            e.stopPropagation();
            toast.remove();
            fetchAndPlayEpisode(savedSrvIdx, savedEpIdx);
        };

        let btnNext = null;
        if (nextEpIdx !== null) {
            btnNext = document.createElement('button');
            btnNext.className = 'toast-action-btn';
            btnNext.textContent = 'Xem ' + nextEpName;
            btnNext.onclick = function(e) {
                e.stopPropagation();
                toast.remove();
                fetchAndPlayEpisode(savedSrvIdx, nextEpIdx);
            };
        }

        let btnCancel = document.createElement('button');
        btnCancel.className = 'toast-action-btn';
        btnCancel.textContent = 'Hủy ✕';
        btnCancel.onclick = function(e) { e.stopPropagation(); toast.remove(); };

        btnGroup.appendChild(btnHistory);
        if (btnNext) btnGroup.appendChild(btnNext);
        btnGroup.appendChild(btnCancel);

        toast.appendChild(title);
        toast.appendChild(btnGroup);
        document.body.appendChild(toast);

        requestAnimationFrame(function() { toast.classList.add('active-show'); });
        resetAutoHideTimer();
    }

    function resetAutoHideTimer() {
        let elements = document.querySelectorAll('.floating-control-ui');
        elements.forEach(function(el) { el.classList.add('active-show'); });

        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function() {
            elements.forEach(function(el) { el.classList.remove('active-show'); });
            let popupGrid = document.getElementById("episode-grid-popup");
            let scalePopupGrid = document.getElementById("scale-grid-popup");
            if (popupGrid) popupGrid.style.display = "none";
            if (scalePopupGrid) scalePopupGrid.style.display = "none";

            let overlayEvt = document.getElementById('iframe-event-overlay');
            if (overlayEvt) overlayEvt.style.display = 'block';
        }, AUTO_HIDE_TIME);
    }

    // 5. XỬ LÝ LỊCH SỬ XEM
    function matchCurrentEpisode() {
        let foundServer = 0;
        let foundEpisode = 0;

        if (CURRENT_URL) {
            SERVERS.forEach(function(srv, sIdx) {
                if (srv && Array.isArray(srv.episodes)) {
                    srv.episodes.forEach(function(ep, eIdx) {
                        if (ep.id === CURRENT_URL || (ep.id && CURRENT_URL.includes(ep.id))) {
                            foundServer = sIdx;
                            foundEpisode = eIdx;
                        }
                    });
                }
            });
        }

        currentServerIndex = foundServer;
        currentEpisodeIndex = foundEpisode;

        let savedHistoryRaw = localStorage.getItem(storageKey);
        if (savedHistoryRaw) {
            try {
                let savedHistory = JSON.parse(savedHistoryRaw);
                let savedSrvIdx = savedHistory.serverIndex || 0;
                let savedEpIdx = savedHistory.episodeIndex || 0;

                let diff = Math.abs(currentEpisodeIndex - savedEpIdx);

                if (diff > 2) {
                    let savedSrv = SERVERS[savedSrvIdx];
                    let savedEp = savedSrv && savedSrv.episodes ? savedSrv.episodes[savedEpIdx] : null;
                    
                    if (savedEp) {
                        let savedEpName = savedEp.name || savedEp.slug || ('Tập ' + (savedEpIdx + 1));
                        let nextEpIdx = (savedEpIdx + 1 < savedSrv.episodes.length) ? (savedEpIdx + 1) : null;
                        let nextEpName = "";
                        if (nextEpIdx !== null) {
                            let nextEp = savedSrv.episodes[nextEpIdx];
                            nextEpName = nextEp ? (nextEp.name || nextEp.slug || ('Tập ' + (nextEpIdx + 1))) : ('Tập ' + (nextEpIdx + 1));
                        }
                        setTimeout(function() { showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName); }, 800);
                    }
                }
            } catch (e) {}
        }
        saveCurrentState();
    }

    function saveCurrentState() {
        localStorage.setItem(storageKey, JSON.stringify({ serverIndex: currentServerIndex, episodeIndex: currentEpisodeIndex, timestamp: Date.now() }));
    }

    // 6. KÍCH THƯỚC IFRAME
    function getSavedWidth() { return parseInt(localStorage.getItem(widthStorageKey), 10) || window.innerWidth; }
    function getSavedHeight() { return parseInt(localStorage.getItem(heightStorageKey), 10) || window.innerHeight; }
    function getSavedScale() { return parseFloat(localStorage.getItem(scaleStorageKey)) || 1.0; }

    function applyIframeDimensions(w, h, s) {
        w = Math.max(150, parseInt(w, 10) || window.innerWidth);
        h = Math.max(100, parseInt(h, 10) || window.innerHeight);
        s = parseFloat(s) || 1.0;

        let iframe = document.getElementById("framePlay");
        if (iframe) {
            iframe.style.setProperty('width', w + 'px', 'important');
            iframe.style.setProperty('height', h + 'px', 'important');
            iframe.style.setProperty('transform', 'translate(-50%, -50%) scale(' + s + ')', 'important');
        }

        localStorage.setItem(widthStorageKey, w);
        localStorage.setItem(heightStorageKey, h);
        localStorage.setItem(scaleStorageKey, s);

        let wInput = document.getElementById("iframe-w-input");
        let hInput = document.getElementById("iframe-h-input");
        let scaleTrigger = document.getElementById("scale-select-trigger");

        if (wInput && document.activeElement !== wInput) wInput.value = w;
        if (hInput && document.activeElement !== hInput) hInput.value = h;
        if (scaleTrigger) scaleTrigger.textContent = "Scale " + s.toFixed(1) + "x ▼";
    }

    // XỬ LÝ ĐỔI TẬP VÀ FETCH LINK MỚI TỪ PHIMCHILL
    function fetchAndPlayEpisode(serverIdx, epIdx) {
        currentServerIndex = serverIdx;
        currentEpisodeIndex = epIdx;
        saveCurrentState();

        let activeServer = SERVERS[currentServerIndex];
        let activeEpisode = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;

        if (!activeEpisode || !activeEpisode.id) return;

        let epName = activeEpisode.name || ('Tập ' + (currentEpisodeIndex + 1));
        showLoading('Đang tải ' + epName.toLowerCase() + '...');

        fetch(activeEpisode.id, { headers: { 'Accept': 'text/html' } })
            .then(function(res) { return res.text(); })
            .then(function(htmlText) {
                // Bóc tách link stream ngay từ trong mã nguồn HTML của tập vừa click
                var streamUrl = "";
                var m3u8Match = htmlText.match(/data-type="m3u8"[^>]*data-link="([^"]+)"/i) || htmlText.match(/data-link="([^"]+\\.m3u8[^"]*)"/i);
                if (m3u8Match) streamUrl = m3u8Match[1];
                if (!streamUrl) {
                    var embedMatch = htmlText.match(/data-type="embed"[^>]*data-link="([^"]+)"/i);
                    if (embedMatch) streamUrl = embedMatch[1];
                }
                if (!streamUrl) {
                    var iframeMatch = htmlText.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                    if (iframeMatch) streamUrl = iframeMatch[1];
                }

                if (streamUrl) {
                    if (streamUrl.startsWith("//")) streamUrl = window.location.protocol + streamUrl;
                    let framePlay = document.getElementById('framePlay');
                    if (framePlay) {
                        framePlay.setAttribute("referrerpolicy", "no-referrer");
                        framePlay.src = streamUrl;
                        framePlay.onload = function() {
                            hideLoading();
                            showCenterPlayNotice('▶ Đã chuyển ' + epName + '. Vui lòng nhấn Play để tiếp tục xem!');
                        };
                    }
                } else {
                    hideLoading();
                    showCenterPlayNotice('❌ Lỗi không tìm thấy link tập này!');
                }
            })
            .catch(function(err) {
                hideLoading();
                showCenterPlayNotice('❌ Lỗi kết nối!');
            })
            .finally(function() {
                updateEpisodeGridState();
                updateNavState();
                resetAutoHideTimer();
            });
    }

    // 7. LAYOUT GIAO DIỆN
    function initBaseLayout() {
        matchCurrentEpisode();
        showLoading("Đang tải...");

        // 1. Tạo IFRAME
        let framePlay = document.createElement("iframe");
        framePlay.id = "framePlay";
        framePlay.scrolling = "no";
        framePlay.setAttribute("referrerpolicy", "no-referrer");
        framePlay.setAttribute("allowfullscreen", "true");
        framePlay.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
        
        let cleanInitialStream = INITIAL_STREAM;
        if (cleanInitialStream.startsWith("//")) cleanInitialStream = window.location.protocol + cleanInitialStream;
        framePlay.src = cleanInitialStream;

        framePlay.onload = function() {
            hideLoading();
            applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
            showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');
        };
        document.body.appendChild(framePlay);

        // 2. Tạo Lớp phủ bắt sự kiện Hover
        let eventOverlay = document.createElement("div");
        eventOverlay.id = "iframe-event-overlay";
        function handleOverlayTrigger() {
            resetAutoHideTimer();
            hideCenterPlayNotice(); 
        }
        eventOverlay.addEventListener('mousemove', handleOverlayTrigger);
        eventOverlay.addEventListener('click', handleOverlayTrigger);
        eventOverlay.addEventListener('touchstart', handleOverlayTrigger, { passive: true });
        document.body.appendChild(eventOverlay);

        // 3. Thanh điều hướng công cụ 
        let container = document.createElement("div");
        container.id = "floating-select-box";
        container.className = "floating-control-ui active-show";
        Object.assign(container.style, {
            position: "fixed", top: "16px", right: "20px", zIndex: "999999",
            backgroundColor: "rgba(22, 22, 26, 0.92)", backdropFilter: "blur(16px)",
            padding: "5px 8px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.6)", color: "#fff", display: "flex", gap: "6px"
        });

        function createDimensionControl(type) {
            let isW = (type === 'W');
            let group = document.createElement("div");
            Object.assign(group.style, {
                display: "flex", alignItems: "center", gap: "2px",
                backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 5px",
                borderRadius: "5px", border: "1px solid rgba(255,255,255,0.1)"
            });

            let lbl = document.createElement("span");
            lbl.textContent = isW ? "W:" : "H:";
            lbl.style.cssText = "font-size: 11px !important; color: #aaa !important; font-weight: 700 !important; margin-right: 2px !important;";

            let btnMinus = document.createElement("button");
            btnMinus.className = "dim-btn"; btnMinus.textContent = "-";
            btnMinus.onclick = function(e) {
                e.stopPropagation();
                let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                applyIframeDimensions(isW ? curW - 20 : curW, isW ? curH : curH - 20, curS);
            };

            let input = document.createElement("input");
            input.id = isW ? "iframe-w-input" : "iframe-h-input";
            input.type = "number"; input.className = "dim-input";
            input.value = isW ? getSavedWidth() : getSavedHeight();
            input.onchange = function(e) {
                let val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? val : curW, isW ? curH : val, curS);
                }
            };
            input.onkeydown = function(e) { e.stopPropagation(); };

            let btnPlus = document.createElement("button");
            btnPlus.className = "dim-btn"; btnPlus.textContent = "+";
            btnPlus.onclick = function(e) {
                e.stopPropagation();
                let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                applyIframeDimensions(isW ? curW + 20 : curW, isW ? curH : curH + 20, curS);
            };

            group.appendChild(lbl); group.appendChild(btnMinus); group.appendChild(input); group.appendChild(btnPlus);
            return group;
        }

        let widthCtrl = createDimensionControl('W');
        let heightCtrl = createDimensionControl('H');

        let scaleTrigger = document.createElement("span");
        scaleTrigger.id = "scale-select-trigger";
        scaleTrigger.textContent = "Scale " + getSavedScale().toFixed(1) + "x ▼";
        styleClickable(scaleTrigger, "rgba(255, 255, 255, 0.08)");

        let epTrigger = document.createElement("span");
        epTrigger.id = "ep-select-trigger";
        styleClickable(epTrigger, "#007bff");

        container.appendChild(widthCtrl);
        container.appendChild(heightCtrl);
        container.appendChild(scaleTrigger);
        container.appendChild(epTrigger);

        let scalePopupGrid = createPopup("scale-grid-popup", "240px");
        let popupGrid = createPopup("episode-grid-popup", "340px");

        scaleTrigger.onclick = function(e) {
            e.stopPropagation();
            popupGrid.style.display = "none";
            scalePopupGrid.style.display = (scalePopupGrid.style.display === "grid") ? "none" : "grid";
        };

        epTrigger.onclick = function(e) {
            e.stopPropagation();
            scalePopupGrid.style.display = "none";
            popupGrid.style.display = (popupGrid.style.display === "grid") ? "none" : "grid";
        };

        function handleOutsideClick(e) {
            if (!container.contains(e.target) && !popupGrid.contains(e.target) && !scalePopupGrid.contains(e.target)) {
                popupGrid.style.display = "none";
                scalePopupGrid.style.display = "none";
            }
        }
        document.addEventListener("click", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick, { passive: true });

        // 4. Nút Prev / Next
        let navPrev = createNavButton("nav-prev-item", "&#10094;", "left", "30px");
        navPrev.onclick = function(e) {
            e.stopPropagation();
            if (currentEpisodeIndex > 0) fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex - 1);
        };

        let navNext = createNavButton("nav-next-item", "&#10095;", "right", "30px");
        navNext.onclick = function(e) {
            e.stopPropagation();
            let activeServer = SERVERS[currentServerIndex];
            if (activeServer && activeServer.episodes && currentEpisodeIndex < activeServer.episodes.length - 1) {
                fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex + 1);
            }
        };

        document.body.appendChild(container);
        document.body.appendChild(popupGrid);
        document.body.appendChild(scalePopupGrid);
        document.body.appendChild(navPrev);
        document.body.appendChild(navNext);

        resetAutoHideTimer();
        renderEpisodeGrid();
        renderScaleGrid();
        applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
    }

    function createPopup(id, width) {
        let el = document.createElement("div");
        el.id = id;
        el.className = "floating-control-ui active-show";
        Object.assign(el.style, {
            position: "fixed", top: "58px", right: "20px", zIndex: "1000000",
            backgroundColor: "rgba(22, 22, 26, 0.95)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px", borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)", width: width, maxHeight: "250px",
            overflowY: "auto", display: "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px"
        });
        return el;
    }

    function createNavButton(id, arrow, side, offset) {
        let btn = document.createElement("span");
        btn.id = id;
        btn.className = "floating-control-ui active-show";
        btn.innerHTML = arrow;
        Object.assign(btn.style, {
            position: "fixed", top: "50%", zIndex: "999999",
            transform: "translateY(-50%)", width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.6)", backdropFilter: "blur(8px)",
            color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", userSelect: "none"
        });
        btn.style[side] = offset;
        return btn;
    }

    function renderEpisodeGrid() {
        let popupGrid = document.getElementById("episode-grid-popup");
        if (!popupGrid) return;
        popupGrid.innerHTML = "";

        let activeServer = SERVERS[currentServerIndex];
        let episodes = activeServer ? (activeServer.episodes || []) : [];

        episodes.forEach(function(ep, idx) {
            let epItem = document.createElement("div");
            epItem.className = "ep-grid-btn " + (idx === currentEpisodeIndex ? "active" : "inactive");
            epItem.textContent = ep.name || ep.slug || ("Tập " + (idx + 1));
            
            epItem.onclick = function(e) {
                e.stopPropagation();
                popupGrid.style.display = "none";
                fetchAndPlayEpisode(currentServerIndex, idx);
            };
            popupGrid.appendChild(epItem);
        });
        updateEpisodeGridState();
    }

    function updateEpisodeGridState() {
        let epTrigger = document.getElementById("ep-select-trigger");
        if (epTrigger) {
            let activeServer = SERVERS[currentServerIndex];
            let ep = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
            epTrigger.textContent = (ep ? (ep.name || ep.slug) : "Chọn Tập") + " ▼";
        }
    }

    function updateNavState() {
        let navPrev = document.getElementById("nav-prev-item");
        let navNext = document.getElementById("nav-next-item");
        let activeServer = SERVERS[currentServerIndex];
        let maxEp = activeServer && activeServer.episodes ? activeServer.episodes.length : 0;

        if (navPrev) navPrev.style.opacity = currentEpisodeIndex <= 0 ? "0.3" : "1";
        if (navNext) navNext.style.opacity = currentEpisodeIndex >= maxEp - 1 ? "0.3" : "1";
    }

    function renderScaleGrid() {
        let scalePopupGrid = document.getElementById("scale-grid-popup");
        if (!scalePopupGrid) return;
        scalePopupGrid.innerHTML = "";
        let curSavedScale = getSavedScale();

        for (let sVal = 0.5; sVal <= 2.05; sVal += 0.1) {
            let formattedVal = Math.round(sVal * 10) / 10;
            let item = document.createElement("div");
            item.className = "ep-grid-btn " + ((Math.abs(formattedVal - curSavedScale) < 0.05) ? "active" : "inactive");
            item.textContent = formattedVal.toFixed(1) + "x";
            item.onclick = function(e) {
                e.stopPropagation();
                scalePopupGrid.style.display = "none";
                applyIframeDimensions(getSavedWidth(), getSavedHeight(), formattedVal);
            };
            scalePopupGrid.appendChild(item);
        }
    }

    function styleClickable(el, bgColor) {
        Object.assign(el.style, {
            padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: bgColor, color: "#fff", cursor: "pointer",
            fontSize: "12px", fontWeight: "700", textAlign: "center",
            display: "inline-block", userSelect: "none"
        });
    }

    initBaseLayout();
})();
    `;
}

// =============================================================================
// MENUS THỂ LOẠI
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
        if (!link || !name) continue;
        menulist.push({ "slug": link, "name": name });
    }
    return menulist;
}
