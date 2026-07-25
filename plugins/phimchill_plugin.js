// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimchillhdf.im";

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Giao diện Player VIP: Chọn tập trực tiếp, lưu lịch sử, không quảng cáo.",
        "version": "4.0.0",             
        "baseUrl": BASEURL,
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/motherless_logo.jpgphimchill.ico", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "webview" // Bắt buộc dùng Webview để tiêm giao diện Player Custom
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
    return JSON.stringify({ category: menulist });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") > -1) return slug;
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
        if (page > 1) url += "?page=" + page;
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
    if (page > 1) url += "&page=" + page;
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

            if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) posterUrl = BASEURL + posterUrl;
            else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) posterUrl = BASEURL + "/" + posterUrl;
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
// PARSER CHI TIẾT PHIM
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

        // Lấy link xem phim gốc để nạp vào hệ thống webview Custom
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
            name: "Phim Chill Player",
            episodes: [{
                id: targetUrl,
                name: "Mở Giao Diện Player Thông Minh",
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
// BÓC TÁCH LINK STREAM, DANH SÁCH TẬP & TIÊM CUSTOM JS GIAO DIỆN
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var dataSV = {};
        
        // 1. Trích xuất link Stream
        var streamUrl = "";
        var isEmbed = false;
        
        var m3u8Match = html.match(/data-type="m3u8"[^>]*data-link="([^"]+)"/i) || html.match(/data-link="([^"]+\.m3u8[^"]*)"/i);
        var embedMatch = html.match(/data-type="embed"[^>]*data-link="([^"]+)"/i);
        var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        
        if (m3u8Match) {
            streamUrl = m3u8Match[1];
        } else if (embedMatch) {
            streamUrl = embedMatch[1];
            isEmbed = true;
        } else if (iframeMatch) {
            streamUrl = iframeMatch[1];
            isEmbed = true;
        }

        // 2. Tạo Movie ID để lưu lịch sử cục bộ
        var movieIdMatch = url.match(/\/phim\/([^/]+)/i) || html.match(/\/phim\/([^/]+)/i);
        var movieId = movieIdMatch ? movieIdMatch[1] : "phimchill_movie";

        // 3. Quét TẤT CẢ các tập ở trang web
        var episodes = [];
        var seenEp = {};
        
        var aRegex = /<a[^>]*href=["']([^"']+\/tap-[^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        while ((match = aRegex.exec(html)) !== null) {
            var epUrl = match[1].trim();
            var epText = match[2].replace(/<[^>]*>/g, '').trim();

            if (epUrl.indexOf('http') !== 0) {
                epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
            }

            if (!seenEp[epUrl]) {
                var numMatch = epUrl.match(/tap-([^_]+)/i) || epUrl.match(/tap-(\d+)/i);
                var formattedName = numMatch ? ("Tập " + numMatch[1].replace(/-/g, ' ')) : (!isNaN(epText) ? ("Tập " + epText) : (epText || "Tập"));

                episodes.push({
                    id: epUrl,
                    name: formattedName,
                    slug: epUrl.split('/').pop()
                });
                seenEp[epUrl] = true;
            }
        }
        
        // Quét dự phòng diện rộng
        if (episodes.length === 0) {
            var generalRegex = /href=["']([^"']+\/phim\/[^"']+\/tap-[^"']+\.html)["']/gi;
            while ((match = generalRegex.exec(html)) !== null) {
                var gUrl = match[1].trim();
                if (gUrl.indexOf('http') !== 0) gUrl = BASEURL + (gUrl.startsWith('/') ? '' : '/') + gUrl;
                if (!seenEp[gUrl]) {
                    var nMatch = gUrl.match(/tap-([^_.]+)/i);
                    var epNum = nMatch ? nMatch[1] : "1";
                    episodes.push({ id: gUrl, name: "Tập " + epNum, slug: gUrl.split('/').pop() });
                    seenEp[gUrl] = true;
                }
            }
        }

        if(episodes.length > 0) {
            episodes.sort(function(a, b) {
                var numA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                var numB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                return numA - numB;
            });
        } else {
            episodes.push({ id: url, name: "Full", slug: "full" });
        }

        // 4. Build config để đẩy vào bộ Engine JS
        dataSV.stream = streamUrl || url;
        dataSV.isEmbed = isEmbed;
        dataSV.current = url;
        dataSV.movieId = movieId;
        dataSV.servers = [{
            name: "Phim Chill",
            episodes: episodes
        }];

        var customJS = rawJS(dataSV);

        return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
                "Referer": BASEURL + "/",
                "Custom-Js": customJS
            },
            subtitles: [],
            injectScript: customJS // Đảm bảo hoạt động hoàn hảo trên mọi module Webview
        });

    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// =============================================================================
// ENGINE GIAO DIỆN PLAYER THÔNG MINH (PORT TỪ PHIMFUN -> PHIMCHILL)
// =============================================================================
function rawJS(config) {
    return `
(function() {
    // 1. DỌN SẠCH DOM GỐC (BỎ QUẢNG CÁO, RÁC, AUTOPLAY LỖI)
    if (document.head) {
        document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
    }
    document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

    // 2. KHỞI TẠO BIẾN CONFIG
    const DATA = ${JSON.stringify(config)};
    const SERVERS = DATA.servers || [];
    const storageKey = "pc_hist_" + DATA.movieId;

    let currentServerIndex = 0;
    let currentEpisodeIndex = 0;
    let hideTimer = null;

    // 3. TIÊM CSS GIAO DIỆN MỚI
    let styleTag = document.createElement('style');
    styleTag.textContent = "\\
        * { box-sizing: border-box !important; font-family: sans-serif !important; }\\
        #framePlay { position: fixed !important; top: 50% !important; left: 50% !important; transform-origin: center center !important; border: none !important; margin: 0 !important; padding: 0 !important; z-index: 1 !important; display: block !important; transition: all 0.15s ease !important; background:#000 !important; }\\
        .floating-control-ui { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.4s ease !important; }\\
        .floating-control-ui.active-show { opacity: 1 !important; pointer-events: auto !important; }\\
        .dim-btn { background: rgba(255, 255, 255, 0.12) !important; color: #fff !important; border: none !important; border-radius: 4px !important; width: 22px !important; height: 22px !important; cursor: pointer !important; font-size: 13px !important; font-weight: bold !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; }\\
        .dim-input { width: 38px !important; background: transparent !important; border: none !important; color: #fff !important; text-align: center !important; font-size: 12px !important; font-weight: 700 !important; outline: none !important; }\\
        .ep-grid-btn { display: flex !important; align-items: center !important; justify-content: center !important; padding: 8px 12px !important; border-radius: 6px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #fff !important; cursor: pointer !important; font-size: 12px !important; font-weight: 700 !important; text-align: center !important; white-space: nowrap !important; }\\
        .ep-grid-btn.active { background-color: #e50914 !important; border-color: #e50914 !important; }\\
        .ep-grid-btn.inactive { background-color: rgba(255, 255, 255, 0.08) !important; }\\
        #center-play-notice { position: fixed !important; top: 20px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 999999 !important; background: rgba(15, 15, 18, 0.92) !important; color: #fff !important; padding: 8px 16px !important; border-radius: 20px !important; font-size: 13px !important; pointer-events: none !important; transition: opacity 0.3s !important; opacity: 0; }\\
    ";
    document.head.appendChild(styleTag);

    // 4. OVERLAY LOADING & THÔNG BÁO
    let overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', backgroundColor: '#000', zIndex: '999998', display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' });
    document.body.appendChild(overlay);

    function showLoading(msg) {
        overlay.innerHTML = '<div style="font-size: 14px; font-weight: bold; color: #aaa;">' + (msg || 'Đang tải...') + '</div>';
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
    function hideLoading() {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 250);
    }

    function showNotice(text) {
        let notice = document.getElementById('center-play-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'center-play-notice';
            document.body.appendChild(notice);
        }
        notice.textContent = text;
        notice.style.opacity = '1';
        setTimeout(() => { notice.style.opacity = '0'; }, 3000);
    }

    // 5. QUẢN LÝ KÍCH THƯỚC TRÌNH PHÁT
    function applyIframeDimensions(w, h, s) {
        w = Math.max(150, parseInt(w, 10) || window.innerWidth);
        h = Math.max(100, parseInt(h, 10) || window.innerHeight);
        s = parseFloat(s) || 1.0;
        let player = document.getElementById("framePlay");
        if (player) {
            player.style.setProperty('width', w + 'px', 'important');
            player.style.setProperty('height', h + 'px', 'important');
            player.style.setProperty('transform', 'translate(-50%, -50%) scale(' + s + ')', 'important');
        }
        localStorage.setItem("pc_w", w);
        localStorage.setItem("pc_h", h);
        localStorage.setItem("pc_s", s);

        let wInput = document.getElementById("iframe-w-input");
        let hInput = document.getElementById("iframe-h-input");
        let scaleTrigger = document.getElementById("scale-select-trigger");
        if (wInput) wInput.value = w;
        if (hInput) hInput.value = h;
        if (scaleTrigger) scaleTrigger.textContent = "Scale " + s.toFixed(1) + "x ▼";
    }

    // 6. KIẾN TẠO TRÌNH PHÁT (VIDEO CHO M3U8 HOẶC IFRAME CHO EMBED)
    function createPlayer(stream, isEmbed) {
        let oldMedia = document.getElementById("framePlay");
        if (oldMedia) oldMedia.remove();

        let mediaEl;
        if (isEmbed) {
            mediaEl = document.createElement("iframe");
            mediaEl.src = stream;
            mediaEl.setAttribute("allowfullscreen", "true");
            mediaEl.setAttribute("scrolling", "no");
        } else {
            mediaEl = document.createElement("video");
            mediaEl.src = stream;
            mediaEl.controls = true;
            mediaEl.playsInline = true;
            // Chặn tính năng ép Fullscreen khó chịu của iOS
            mediaEl.setAttribute("webkit-playsinline", "true");
        }
        mediaEl.id = "framePlay";
        document.body.appendChild(mediaEl);
        
        let savedW = localStorage.getItem("pc_w") || window.innerWidth;
        let savedH = localStorage.getItem("pc_h") || window.innerHeight;
        let savedS = localStorage.getItem("pc_s") || 1.0;
        applyIframeDimensions(savedW, savedH, savedS);
    }

    // 7. XỬ LÝ CHUYỂN TẬP
    function fetchAndPlayEpisode(epIdx) {
        currentEpisodeIndex = epIdx;
        localStorage.setItem(storageKey, epIdx);
        
        let ep = SERVERS[0].episodes[epIdx];
        if (!ep) return;

        showLoading('Đang tải ' + ep.name + '...');
        fetch(ep.id)
            .then(res => res.text())
            .then(htmlText => {
                var m3u8Match = htmlText.match(/data-type="m3u8"[^>]*data-link="([^"]+)"/i) || htmlText.match(/data-link="([^"]+\\.m3u8[^"]*)"/i);
                var embedMatch = htmlText.match(/data-type="embed"[^>]*data-link="([^"]+)"/i);
                var iframeMatch = htmlText.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                
                var streamUrl = "";
                var isEmbed = false;
                
                if (m3u8Match) {
                    streamUrl = m3u8Match[1];
                } else if (embedMatch) {
                    streamUrl = embedMatch[1];
                    isEmbed = true;
                } else if (iframeMatch) {
                    streamUrl = iframeMatch[1];
                    isEmbed = true;
                }

                if (streamUrl) {
                    if (streamUrl.startsWith("//")) streamUrl = window.location.protocol + streamUrl;
                    createPlayer(streamUrl, isEmbed);
                    hideLoading();
                    showNotice('▶ Đã chuyển ' + ep.name);
                } else {
                    hideLoading();
                    showNotice('❌ Không tìm thấy link stream!');
                }
            })
            .catch(err => {
                hideLoading();
                showNotice('❌ Lỗi kết nối máy chủ!');
            })
            .finally(() => {
                renderEpisodeGrid();
                resetAutoHideTimer();
            });
    }

    // 8. TỰ ĐỘNG ẨN GIAO DIỆN
    function resetAutoHideTimer() {
        let elements = document.querySelectorAll('.floating-control-ui');
        elements.forEach(el => el.classList.add('active-show'));
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            elements.forEach(el => el.classList.remove('active-show'));
            let epPopup = document.getElementById("episode-grid-popup");
            let scPopup = document.getElementById("scale-grid-popup");
            if(epPopup) epPopup.style.display = "none";
            if(scPopup) scPopup.style.display = "none";
        }, 12000);
    }

    // 9. DỰNG LAYOUT CHÍNH
    function initLayout() {
        let savedEp = parseInt(localStorage.getItem(storageKey), 10);
        if (!isNaN(savedEp) && savedEp < SERVERS[0].episodes.length) {
            currentEpisodeIndex = savedEp;
        } else {
            let found = SERVERS[0].episodes.findIndex(e => e.id === DATA.current);
            if (found > -1) currentEpisodeIndex = found;
        }

        if (DATA.stream) {
            createPlayer(DATA.stream, DATA.isEmbed);
            showNotice('▶ Chọn tập ở Góc trên bên Phải');
        } else {
            fetchAndPlayEpisode(currentEpisodeIndex);
        }

        let eventOverlay = document.createElement("div");
        Object.assign(eventOverlay.style, { position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: "10" });
        eventOverlay.addEventListener('mousemove', resetAutoHideTimer);
        eventOverlay.addEventListener('click', resetAutoHideTimer);
        eventOverlay.addEventListener('touchstart', resetAutoHideTimer, { passive: true });
        document.body.appendChild(eventOverlay);

        let container = document.createElement("div");
        container.className = "floating-control-ui active-show";
        Object.assign(container.style, { position: "fixed", top: "16px", right: "20px", zIndex: "999999", backgroundColor: "rgba(22, 22, 26, 0.92)", backdropFilter: "blur(16px)", padding: "5px 8px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", gap: "6px" });

        function createDim(type) {
            let isW = type === 'W';
            let grp = document.createElement("div");
            Object.assign(grp.style, { display: "flex", alignItems: "center", gap: "2px", backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 5px", borderRadius: "5px" });
            
            let lbl = document.createElement("span"); lbl.textContent = type + ":"; lbl.style.cssText = "color:#aaa; font-size:11px; font-weight:bold;";
            let btnM = document.createElement("button"); btnM.className = "dim-btn"; btnM.textContent = "-";
            let inp = document.createElement("input"); inp.id = isW ? "iframe-w-input" : "iframe-h-input"; inp.type = "number"; inp.className = "dim-input";
            let btnP = document.createElement("button"); btnP.className = "dim-btn"; btnP.textContent = "+";
            
            let curW = () => localStorage.getItem("pc_w") || window.innerWidth;
            let curH = () => localStorage.getItem("pc_h") || window.innerHeight;
            let curS = () => localStorage.getItem("pc_s") || 1.0;

            btnM.onclick = (e) => { e.stopPropagation(); applyIframeDimensions(isW ? curW()-20 : curW(), isW ? curH() : curH()-20, curS()); };
            btnP.onclick = (e) => { e.stopPropagation(); applyIframeDimensions(isW ? parseInt(curW())+20 : curW(), isW ? curH() : parseInt(curH())+20, curS()); };
            inp.onchange = (e) => { let v = parseInt(e.target.value); if(!isNaN(v)) applyIframeDimensions(isW ? v : curW(), isW ? curH() : v, curS()); };

            grp.appendChild(lbl); grp.appendChild(btnM); grp.appendChild(inp); grp.appendChild(btnP);
            return grp;
        }

        let scaleTrigger = document.createElement("span");
        scaleTrigger.id = "scale-select-trigger";
        Object.assign(scaleTrigger.style, { padding: "4px 10px", borderRadius: "5px", backgroundColor: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700" });

        let epTrigger = document.createElement("span");
        epTrigger.id = "ep-select-trigger";
        Object.assign(epTrigger.style, { padding: "4px 10px", borderRadius: "5px", backgroundColor: "#e50914", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700" });

        container.appendChild(createDim('W'));
        container.appendChild(createDim('H'));
        container.appendChild(scaleTrigger);
        container.appendChild(epTrigger);

        let scalePopup = document.createElement("div"); scalePopup.id = "scale-grid-popup";
        let epPopup = document.createElement("div"); epPopup.id = "episode-grid-popup";
        [scalePopup, epPopup].forEach(p => {
            p.className = "floating-control-ui active-show";
            Object.assign(p.style, { position: "fixed", top: "58px", right: "20px", zIndex: "1000000", backgroundColor: "rgba(22, 22, 26, 0.95)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px", borderRadius: "10px", maxHeight: "250px", overflowY: "auto", display: "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" });
            document.body.appendChild(p);
        });
        scalePopup.style.width = "240px";
        epPopup.style.width = "340px";

        scaleTrigger.onclick = (e) => { e.stopPropagation(); epPopup.style.display = "none"; scalePopup.style.display = scalePopup.style.display === "grid" ? "none" : "grid"; };
        epTrigger.onclick = (e) => { e.stopPropagation(); scalePopup.style.display = "none"; epPopup.style.display = epPopup.style.display === "grid" ? "none" : "grid"; };
        document.addEventListener("click", (e) => { if (!container.contains(e.target) && !epPopup.contains(e.target) && !scalePopup.contains(e.target)) { epPopup.style.display = "none"; scalePopup.style.display = "none"; } });

        let curScale = parseFloat(localStorage.getItem("pc_s")) || 1.0;
        for (let sVal = 0.5; sVal <= 2.05; sVal += 0.1) {
            let v = Math.round(sVal * 10) / 10;
            let btn = document.createElement("div");
            btn.className = "ep-grid-btn " + (Math.abs(v - curScale) < 0.05 ? "active" : "inactive");
            btn.textContent = v.toFixed(1) + "x";
            btn.onclick = (e) => { 
                e.stopPropagation(); scalePopup.style.display = "none"; 
                applyIframeDimensions(localStorage.getItem("pc_w"), localStorage.getItem("pc_h"), v); 
                Array.from(scalePopup.children).forEach(c => c.className = "ep-grid-btn " + (c.textContent === v.toFixed(1) + "x" ? "active" : "inactive"));
            };
            scalePopup.appendChild(btn);
        }

        window.renderEpisodeGrid = function() {
            epPopup.innerHTML = "";
            SERVERS[0].episodes.forEach((ep, idx) => {
                let btn = document.createElement("div");
                btn.className = "ep-grid-btn " + (idx === currentEpisodeIndex ? "active" : "inactive");
                btn.textContent = ep.name || "Tập " + (idx + 1);
                btn.onclick = (e) => { e.stopPropagation(); epPopup.style.display = "none"; fetchAndPlayEpisode(idx); };
                epPopup.appendChild(btn);
            });
            epTrigger.textContent = (SERVERS[0].episodes[currentEpisodeIndex]?.name || "Chọn Tập") + " ▼";
        };

        function createNav(arrow, side) {
            let btn = document.createElement("span");
            btn.className = "floating-control-ui active-show";
            btn.innerHTML = arrow;
            Object.assign(btn.style, { position: "fixed", top: "50%", zIndex: "999999", transform: "translateY(-50%)", width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(20,20,20,0.6)", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" });
            btn.style[side] = "20px";
            return btn;
        }
        let navPrev = createNav("&#10094;", "left");
        let navNext = createNav("&#10095;", "right");
        navPrev.onclick = (e) => { e.stopPropagation(); if (currentEpisodeIndex > 0) fetchAndPlayEpisode(currentEpisodeIndex - 1); };
        navNext.onclick = (e) => { e.stopPropagation(); if (currentEpisodeIndex < SERVERS[0].episodes.length - 1) fetchAndPlayEpisode(currentEpisodeIndex + 1); };
        
        document.body.appendChild(container);
        document.body.appendChild(navPrev);
        document.body.appendChild(navNext);

        renderEpisodeGrid();
        resetAutoHideTimer();
    }

    initLayout();
})();
    `;
}

// =============================================================================
// MENUS
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
