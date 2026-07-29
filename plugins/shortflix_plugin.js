// =============================================================================
// CẤU HÌNH DOMAIN 
// =============================================================================
var MAIN_DOMAIN = "www.shortflix.net"; 
var BASEURL = "https://" + MAIN_DOMAIN; 
var BASEAPI = "https://" + MAIN_DOMAIN + "/api/search?limit=100&language=vi_VN&lang=vi_VN";

// =============================================================================
// GLOBAL CURSOR CACHE (BỘ NHỚ LƯU CURSOR ĐỘNG TRONG BỘ NHỚ RAM)
// =============================================================================
var CURSOR_CACHE = {};
var URL_TO_PAGE_MAP = {};
var URL_TO_PATH_MAP = {};
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "shortflix",
        "name": "Phim Ngắn Shortflix",
        "description": "Bản Webview Tối Ưu: Tiêm giao diện Player, Vuốt dọc chuyển tập (TikTok style)",
        "version": "2.0.0",
        "info": "Sử dụng công nghệ Custom JS Injection để xoá rác web, biến Webview thành Player Native.",
        "baseUrl": BASEURL,
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/shortflix.png",
        "isEnabled": true,
        "hasLogin": true,
        "loginUrl": BASEURL + "/vi/login",
        "type": "shortfilm",
        "layoutType": "VERTICAL",
        "playerType": "webview" // Chuyển sang webview như yêu cầu
    });
}

function log(msg) {
    if (DEV) {
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
        }
    }
}

function getHomeSections() {
    try {
        var listurl = '[{\"link\":\"&sortBy=last_episode_at\",\"name\":\"Phim Mới\"}]';
        var menulist = buildMenu(listurl, true);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({ category: menulist });
    } catch (e) {
        return JSON.stringify({ category: [] });
    }
}

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================

function encodeBase64(str) {
    try {
        if (typeof btoa !== 'undefined') {
            try { return btoa(str); } catch (e) {}
        }
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var output = '';
        for (var block, charCode, idx = 0, map = chars;
            str.charAt(idx | 0) || (map = '=', idx % 1);
            output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
            charCode = str.charCodeAt(idx += 3/4);
            block = block << 8 | charCode;
        }
        return output;
    } catch (e) { return ""; }
}

function decodeBase64(str) {
    try {
        if (typeof atob !== 'undefined') {
            try { return atob(str); } catch (e) {}
        }
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var output = '';
        str = String(str).replace(/=+$/, '');
        for (var bc = 0, bs, buffer, idx = 0;
            buffer = str.charAt(idx++);
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    } catch (e) { return ""; }
}

function createCursor(lastItem) {
    try {
        if (!lastItem) return "";
        var rawOrder = lastItem.orderValue || lastItem.updatedAt || lastItem.publishedAt || lastItem.last_episode_at || 0;
        var orderVal = Number(rawOrder);
        
        if (isNaN(orderVal) && typeof rawOrder === 'string') {
            var dateParsed = Date.parse(rawOrder);
            orderVal = !isNaN(dateParsed) ? dateParsed : 0;
        }

        var cursorObj = { id: String(lastItem.id || ""), timestamp: 0, orderValue: orderVal || 0 };
        return encodeBase64(JSON.stringify(cursorObj));
    } catch (e) { return ""; }
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "";
        var cursor = "";

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                cursor = filters.cursor || ""; 
                
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        var resultUrl = (path && path.indexOf("http") === 0) ? path : BASEAPI + (path ? path : "");

        if (page > 1 && !cursor) {
            var cacheKey = path + "_page_" + page;
            cursor = CURSOR_CACHE[cacheKey] || "";
        }

        if (cursor) {
            var separator = resultUrl.indexOf("?") > -1 ? "&" : "?";
            resultUrl += separator + "cursor=" + encodeURIComponent(cursor);
        }

        resultUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");

        URL_TO_PAGE_MAP[resultUrl] = page;
        URL_TO_PATH_MAP[resultUrl] = path;

        return resultUrl;
    } catch (e) { return slug || BASEAPI; }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEAPI + "&q=" + encodeURIComponent(keyword || "");
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
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var $data = JSON.parse(html);
        var nextCursor = "";
        
        if ($data && $data.items && $data.items.length > 0) {
            for (var $j = 0; $j < $data.items.length; $j++) {
                var $item = $data.items[$j];
                var current = $item.status ? $item.status.replace("PUBLISHED", "Hoàn Thành") : "";
                var itemSlug = $item.slug || $item.id || "";
                var href = BASEURL + "/vi/videos/" + itemSlug;
                var src = $item.thumbnailUrl || "";

                if (href) {
                    items.push({
                        "id": href,
                        "title": ($item.title || "").trim(),
                        "posterUrl": src.replace(/&amp;/g, '&'),
                        "backdropUrl": src.replace(/&amp;/g, '&'),
                        "quality": "HD",
                        "lang": "",
                        "episode_current": current
                    });
                }
            }

            if ($data.nextCursor) {
                nextCursor = $data.nextCursor;
            } else {
                nextCursor = createCursor($data.items[$data.items.length - 1]);
            }

            var currentPage = URL_TO_PAGE_MAP[$url] || 1;
            var currentPath = URL_TO_PATH_MAP[$url] || "";
            if (nextCursor) {
                CURSOR_CACHE[currentPath + "_page_" + (currentPage + 1)] = nextCursor;
            }
        }

        return JSON.stringify({
            "items": items,
            "nextCursor": nextCursor,
            "pagination": {
                "currentPage": 1,
                "totalPages": items.length > 0 ? 999 : 1,
                "nextCursor": nextCursor
            }
        });

    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseScript(rawScript) {
    var result = { success: false, data: {} };
    if (!rawScript || typeof rawScript !== 'string') return result;
    try {
        var cleaned = rawScript.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/[\r\n]+/g, ' ');
        var videoKey = '"video":{';
        var videoIndex = cleaned.indexOf(videoKey);
        
        if (videoIndex !== -1) {
            var startIndex = videoIndex + videoKey.length - 1;
            var braceCount = 0;
            var endIndex = -1;
            
            for (var i = startIndex; i < cleaned.length; i++) {
                if (cleaned[i] === '{') braceCount++;
                else if (cleaned[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) { endIndex = i + 1; break; }
                }
            }
            if (endIndex !== -1) {
                result.data = JSON.parse(cleaned.substring(startIndex, endIndex));
                result.success = true;
                return result;
            }
        }
        
        var regexMatch = cleaned.match(/"video"\s*:\s*(\{[\s\S]*?\})\s*,\s*"tags"/);
        if (regexMatch && regexMatch[1]) {
            result.data = JSON.parse(regexMatch[1]);
            result.success = true;
        }
    } catch (error) {}
    return result;
}

function parseMovieDetail(html, url) {
    try {
        var lname = _$(html).find("h1").text();
        var limg = _$(html).find('meta[property="og:image"]').attr("content");
        var ldes = _$(html).find(".order-6:content('Giới thiệu')").text();
        var episode_current = _$(html).find("span:content('Tập mới nhất:')").parent().text().trim().replace("Tập mới nhất:", "");
        
        var script = _$(html).find("script:content('.m3u8')").html() || _$(html).find("script:content('episodes')").html();
        var $dataVD = parseScript(script);
        var $listepi = $dataVD.data.episodes || [];
        var $items = [];
        
        for (var $j = 0; $j < $listepi.length; $j++) {
            var $epinumber = $listepi[$j].episodeNumber;
            $items.push({
                id: url + "?tap=" + $epinumber, // Lưu id để App biết vị trí người dùng bấm vào
                name: $epinumber === 0 ? "Trailer" : "Tập " + $epinumber,
                slug: "tap-" + $epinumber
            });
        }
        
        return JSON.stringify({
            id: url,
            title: lname || "Đang cập nhật",
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            episode_current: episode_current,
            servers: $items.length > 0 ? [{ name: "Webview Player", episodes: $items }] : []
        });
    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi chi tiết", servers: [] });
    }
}

// BƯỚC QUAN TRỌNG: Lấy TOÀN BỘ dữ liệu của tất cả các tập, truyền vào file JS
function parseDetailResponse(html, url) {
    try {
        var tap = url.match(/tap=(\d+)/i);
        var tapVal = tap && tap[1] !== undefined ? tap[1] : "1";
        
        var script = _$(html).find("script:content('.m3u8')").html() || _$(html).find("script:content('episodes')").html();
        var $dataVD = parseScript(script);
        var $episodes = $dataVD.data.episodes || [];
        
        var jsEpisodes = [];
        var currentIndex = 0;
        
        for (var i = 0; i < $episodes.length; i++) {
            var ep = $episodes[i];
            var epNum = ep.episodeNumber;
            var vidUrl = ep.versions && ep.versions[0] ? ep.versions[0].videoUrl : "";
            var subUrl = (ep.versions && ep.versions[0] && ep.versions[0].subtitles && ep.versions[0].subtitles.length > 0) ? ep.versions[0].subtitles[0].fileUrl : "";
            
            jsEpisodes.push({
                name: epNum === 0 ? "Trailer" : "Tập " + epNum,
                url: vidUrl,
                subUrl: subUrl
            });
            
            if (epNum == tapVal) currentIndex = i;
        }

        var dataSV = {
            episodes: jsEpisodes,
            currentIndex: currentIndex
        };

        // Gắn script UI Player vào header
        var customJS = rawJS(dataSV);

        return JSON.stringify({
            "url": url, // Trỏ thẳng vào url gốc để khởi chạy webview
            "isEmbed": true, // Báo App đây là webview
            "mimeType": "",
            "headers": {
                "Referer": BASEURL,
                "Custom-Js": customJS // Tiêm bộ Player Ảo vào
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function rawJS(config) {
    return `
    (function() {
        // 1. DIỆT SẠCH HEAD VÀ BODY GỐC CỦA TRANG
        if (document.head) {
            document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
        }
        document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

        // 2. KHỞI TẠO DATA BÊN TRONG JS
        const DATA = ` + JSON.stringify(config) + `;
        const EPISODES = DATA.episodes || [];
        let currentIndex = DATA.currentIndex || 0;
        let hideTimer = null;

        // 3. INJECT CSS TẠO UI PLAYER
        let styleTag = document.createElement('style');
        styleTag.textContent = \`
            * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; user-select: none; -webkit-user-select: none; }
            #video-container { position: relative; width: 100vw; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; }
            video { width: 100%; height: 100%; object-fit: contain; outline: none; }
            
            .floating-ui {
                position: absolute; z-index: 9999;
                transition: opacity 0.3s ease; opacity: 0; pointer-events: none;
            }
            .floating-ui.active { opacity: 1; pointer-events: auto; }
            
            #top-bar { top: 20px; right: 20px; display: flex; gap: 10px; }
            .ui-btn {
                background: rgba(20,20,22,0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                color: white; border: 1px solid rgba(255,255,255,0.15);
                padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 14px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5); cursor: pointer; display: flex; align-items: center; justify-content: center;
            }
            
            #ep-grid {
                position: absolute; top: 65px; right: 20px; width: 300px; max-height: 60vh; overflow-y: auto;
                background: rgba(20,20,22,0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; 
                display: none; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            }
            .ep-item {
                background: rgba(255,255,255,0.1); color: white; padding: 10px 5px; text-align: center;
                border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;
            }
            .ep-item.active { background: #e50914; }
            
            #toast {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                color: white; padding: 16px 30px; border-radius: 30px; font-size: 16px; font-weight: bold;
                pointer-events: none; opacity: 0; transition: opacity 0.3s, transform 0.3s;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5); text-align: center; white-space: nowrap;
            }
            
            .nav-btn {
                position: absolute; top: 50%; transform: translateY(-50%);
                width: 44px; height: 44px; border-radius: 22px;
                background: rgba(20,20,22,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                color: white; font-size: 20px; display: flex; justify-content: center; align-items: center; 
                border: 1px solid rgba(255,255,255,0.2); cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            #prev-btn { left: 20px; }
            #next-btn { right: 20px; }

            /* Hướng dẫn vuốt ở dưới đáy màn hình */
            #swipe-hint {
                position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
                color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600;
                display: flex; flex-direction: column; align-items: center; gap: 5px;
                pointer-events: none; opacity: 1; transition: opacity 1s ease;
            }
            .swipe-icon { animation: swipeAnim 1.5s infinite; font-size: 22px; }
            @keyframes swipeAnim { 0% { transform: translateY(10px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-10px); opacity: 0; } }
        \`;
        document.head.appendChild(styleTag);

        // 4. KHUNG VIDEO GỐC
        let container = document.createElement('div');
        container.id = 'video-container';
        document.body.appendChild(container);

        let video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        container.appendChild(video);

        let toast = document.createElement('div');
        toast.id = 'toast';
        container.appendChild(toast);

        let swipeHint = document.createElement('div');
        swipeHint.id = 'swipe-hint';
        swipeHint.innerHTML = '<div class="swipe-icon">👆</div><div>Vuốt Lên / Xuống để chuyển tập</div>';
        container.appendChild(swipeHint);
        
        // Ẩn hint sau 5s
        setTimeout(() => { swipeHint.style.opacity = '0'; }, 5000);

        let toastTimeout;
        function showToast(msg) {
            toast.textContent = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1.1)';
            setTimeout(() => toast.style.transform = 'translate(-50%, -50%) scale(1)', 50);
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
        }

        let hls = null;
        function loadEpisode(index) {
            if (index < 0 || index >= EPISODES.length) {
                showToast(index < 0 ? "Đây là tập đầu tiên!" : "Bạn đã xem hết tập!");
                return;
            }
            currentIndex = index;
            let ep = EPISODES[currentIndex];
            
            showToast("▶ " + ep.name);
            
            let streamUrl = ep.url;
            if (!streamUrl) {
                showToast("Lỗi: Tập này bị lỗi link!");
                return;
            }

            // Ưu tiên Native của iOS, nếu không có sẽ nạp hls.js
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
                video.play().catch(e => console.log(e));
            } else {
                if (!window.Hls) {
                    let script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
                    script.onload = () => initHls(streamUrl);
                    document.head.appendChild(script);
                } else {
                    initHls(streamUrl);
                }
            }
            
            updateUI();
        }

        function initHls(url) {
            if (hls) hls.destroy();
            hls = new window.Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
                video.play().catch(e => console.log(e));
            });
        }

        // 5. GIAO DIỆN NÚT VÀ LƯỚI TẬP
        let topBar = document.createElement('div');
        topBar.id = 'top-bar';
        topBar.className = 'floating-ui active';
        container.appendChild(topBar);

        let epSelectBtn = document.createElement('div');
        epSelectBtn.className = 'ui-btn';
        topBar.appendChild(epSelectBtn);

        let epGrid = document.createElement('div');
        epGrid.id = 'ep-grid';
        epGrid.className = 'floating-ui active';
        container.appendChild(epGrid);

        epSelectBtn.onclick = (e) => {
            e.stopPropagation();
            epGrid.style.display = epGrid.style.display === 'grid' ? 'none' : 'grid';
        };

        let prevBtn = document.createElement('div');
        prevBtn.id = 'prev-btn';
        prevBtn.className = 'nav-btn floating-ui active';
        prevBtn.innerHTML = '&#10094;';
        prevBtn.onclick = (e) => { e.stopPropagation(); loadEpisode(currentIndex - 1); };
        container.appendChild(prevBtn);

        let nextBtn = document.createElement('div');
        nextBtn.id = 'next-btn';
        nextBtn.className = 'nav-btn floating-ui active';
        nextBtn.innerHTML = '&#10095;';
        nextBtn.onclick = (e) => { e.stopPropagation(); loadEpisode(currentIndex + 1); };
        container.appendChild(nextBtn);

        function updateUI() {
            epSelectBtn.textContent = EPISODES[currentIndex].name + " ▼";
            epGrid.innerHTML = '';
            EPISODES.forEach((ep, idx) => {
                let item = document.createElement('div');
                item.className = 'ep-item' + (idx === currentIndex ? ' active' : '');
                item.textContent = ep.name.replace('Tập ', '');
                item.onclick = (e) => {
                    e.stopPropagation();
                    epGrid.style.display = 'none';
                    loadEpisode(idx);
                };
                epGrid.appendChild(item);
            });
            
            prevBtn.style.opacity = currentIndex > 0 ? '1' : '0.3';
            nextBtn.style.opacity = currentIndex < EPISODES.length - 1 ? '1' : '0.3';
            resetHideTimer();
        }

        // 6. XỬ LÝ SỰ KIỆN VUỐT & ẨN UI
        function resetHideTimer() {
            document.querySelectorAll('.floating-ui').forEach(el => el.classList.add('active'));
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                document.querySelectorAll('.floating-ui').forEach(el => el.classList.remove('active'));
                epGrid.style.display = 'none';
            }, 4000);
        }

        container.addEventListener('click', (e) => {
            if (e.target !== epSelectBtn && !epGrid.contains(e.target)) {
                epGrid.style.display = 'none';
            }
            resetHideTimer();
        });
        
        container.addEventListener('mousemove', resetHideTimer);
        video.addEventListener('play', resetHideTimer);
        video.addEventListener('pause', () => {
            document.querySelectorAll('.floating-ui').forEach(el => el.classList.add('active'));
        });

        // Event vuốt chuyển tập
        let touchStartY = 0;
        container.addEventListener('touchstart', e => {
            touchStartY = e.changedTouches[0].screenY;
            resetHideTimer();
        }, {passive: true});

        container.addEventListener('touchend', e => {
            let touchEndY = e.changedTouches[0].screenY;
            let diffY = touchStartY - touchEndY;
            
            if (Math.abs(diffY) > 80) { // Vuốt đủ mạnh
                if (diffY > 0) loadEpisode(currentIndex + 1); // Vuốt lên
                else loadEpisode(currentIndex - 1);           // Vuốt xuống
            }
        }, {passive: true});

        // Tự động phát tập tiếp theo khi kết thúc
        video.addEventListener('ended', () => {
            loadEpisode(currentIndex + 1);
        });

        // Bắt đầu phát
        loadEpisode(currentIndex);

    })();
    `;
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) { return JSON.stringify([]); }
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"&q=l%E1%BB%93ng+ti%E1%BA%BFng\",\"name\":\"Lồng Tiếng\"},{\"link\":\"&genre=tong-tai\",\"name\":\"Tổng tài\"},{\"link\":\"&genre=co-dai\",\"name\":\"Cổ đại\"},{\"link\":\"&genre=tam-ly\",\"name\":\"Tâm lý\"},{\"link\":\"&genre=ngon-tinh\",\"name\":\"Ngôn tình\"},{\"link\":\"&genre=hai-huoc\",\"name\":\"Hài hước\"},{\"link\":\"&genre=nu-cuong\",\"name\":\"Nữ cường\"},{\"link\":\"&genre=huyen-huyen\",\"name\":\"Huyền huyễn\"},{\"link\":\"&genre=toi-pham\",\"name\":\"Tội phạm\"},{\"link\":\"&genre=xuyen-khong\",\"name\":\"Xuyên không\"},{\"link\":\"&genre=thanh-xuan\",\"name\":\"Thanh xuân\"},{\"link\":\"&genre=hanh-dong\",\"name\":\"Hành động\"},{\"link\":\"&genre=kinh-di\",\"name\":\"Kinh dị\"},{\"link\":\"&genre=gia-dinh\",\"name\":\"Gia Đình\"},{\"link\":\"&genre=bi-an\",\"name\":\"Bí ẩn\"},{\"link\":\"&genre=dan-quoc\",\"name\":\"Dân quốc\"},{\"link\":\"&genre=trong-sinh\",\"name\":\"Trọng sinh\"},{\"link\":\"&genre=cuoi-truoc-yeu-sau\",\"name\":\"Cưới trước yêu sau\"},{\"link\":\"&genre=khoa-hoc-vien-tuong\",\"name\":\"Khoa học viễn tưởng\"},{\"link\":\"&genre=hanh-dong-ly-ky\",\"name\":\"Hành động ly kỳ\"},{\"link\":\"&genre=hien-dai\",\"name\":\"Hiện đại\"},{\"link\":\"&genre=bao-thu\",\"name\":\"Báo thù\"},{\"link\":\"&genre=the-thao\",\"name\":\"Thể thao\"},{\"link\":\"&genre=em-be\",\"name\":\"Em bé\"},{\"link\":\"&genre=nguoc-luyen\",\"name\":\"Ngược luyến\"},{\"link\":\"&genre=sung-ngot\",\"name\":\"Sủng ngọt\"},{\"link\":\"&genre=hieu-lam\",\"name\":\"Hiểu lầm\"},{\"link\":\"&genre=khac\",\"name\":\"Khác\"},{\"link\":\"&genre=hao-mon\",\"name\":\"Hào môn\"},{\"link\":\"&genre=tim-nguoi-than\",\"name\":\"Tìm người thân\"},{\"link\":\"&genre=quan-phiet\",\"name\":\"Quân phiệt\"},{\"link\":\"&genre=vuon-len-tu-so-khong\",\"name\":\"Vươn lên từ số không\"},{\"link\":\"&genre=tai-hop\",\"name\":\"Tái hợp\"},{\"link\":\"&genre=su-tro-lai\",\"name\":\"Sự trở lại\"},{\"link\":\"&genre=tam-ly-tinh-cam\",\"name\":\"Tâm lý tình cảm\"},{\"link\":\"&genre=truong-thanh\",\"name\":\"Trưởng thành\"}]`;
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
	if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(currentHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
