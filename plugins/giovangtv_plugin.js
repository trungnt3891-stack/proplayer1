// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (FIX API TIME-TOKEN + TRÌNH PHÁT KÉP NATIVE/WEBVIEW)
// =============================================================================

var BASEURL = "https://giovang.city";
// Tên miền API trích xuất từ mã nguồn gốc
var API_DOMAIN = "https://live-api.keonhacaitp.one"; 
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2025/02/trang-chu-giovang.webp";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Tải API siêu tốc với Time-Token. Phát Native M3U8 cho trận Live & Webview dọn CSS cho trận Xem lại.",
        "version": "9.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Đặt mặc định là native
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') nativeLog("[GiovangTV] " + msg);
    else if (typeof console !== 'undefined' && console.log) console.log("[GiovangTV] " + msg);
}

function decodeEntities(str) {
    if (!str) return "";
    return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Giả lập tạo URL chuẩn của Giờ Vàng TV
function getSlug(str) {
    str = String(str || '').replace(/^\s+|\s+$/g, '').toLowerCase();
    var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđç·/_,:;";
    var to =   "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydc------";
    for (var i = 0; i < from.length; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    return str.replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function parseDateTimeToTimestamp(dateStr) {
    if (!dateStr || dateStr.indexOf("Đang cập nhật") !== -1) return 0;
    try {
        var parts = dateStr.trim().split(/\s+/);
        var timeParts = parts[0].split(':');
        var hours = parseInt(timeParts[0], 10);
        var minutes = parseInt(timeParts[1], 10);

        var now = new Date();
        var day = now.getDate();
        var month = now.getMonth();
        var year = now.getFullYear();

        if (parts.length > 1 && parts[1].indexOf('/') !== -1) {
            var dParts = parts[1].split('/');
            day = parseInt(dParts[0], 10);
            month = parseInt(dParts[1], 10) - 1;
        }
        return new Date(year, month, day, hours, minutes, 0).getTime();
    } catch (e) {
        return 0;
    }
}

// =============================================================================
// TẠO ẢNH BÌA SVG ĐẸP MẮT GIỐNG GIAO DIỆN APP
// =============================================================================
function createMatchPoster(title, score, minute, time, league, isLive, isFinished) {
    var home = "Đội Nhà", away = "Đội Khách";
    if (title && title.indexOf(" vs ") !== -1) {
        var parts = title.split(' vs ');
        home = parts[0].trim(); away = parts[1].trim();
    }
    if (home.length > 20) home = home.substring(0, 17) + "...";
    if (away.length > 20) away = away.substring(0, 17) + "...";

    var displayScore = score || (isLive ? "0 : 0" : "? : ?");
    
    // Phối màu giống trong ảnh chụp
    var bgGradient = isLive ? '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2a0845"/><stop offset="100%" stop-color="#6441A5"/></linearGradient>' : '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>';
    var statusText = isLive ? ("🔴 LIVE " + (minute ? minute + "'" : "")) : (isFinished ? "🎬 ĐÃ KẾT THÚC" : "⏳ SẮP DIỄN RA");
    var statusColor = isLive ? "#ef4444" : (isFinished ? "#10b981" : "#94a3b8");

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">' +
        '<defs>' + bgGradient + '</defs>' +
        '<rect width="800" height="400" fill="url(#bg)" rx="20"/>' +
        // Header (League & Time)
        '<text x="40" y="50" fill="#e2e8f0" font-size="24" font-family="sans-serif" font-weight="bold">⚽ ' + league + '</text>' +
        '<text x="760" y="50" fill="#e2e8f0" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="end">' + time + '</text>' +
        // Score Box
        '<rect x="300" y="140" width="200" height="80" rx="40" fill="#000000" opacity="0.6"/>' +
        '<text x="400" y="195" fill="#ffffff" font-size="45" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="5">' + displayScore + '</text>' +
        // Status Badge under score
        '<text x="400" y="260" fill="' + statusColor + '" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + statusText + '</text>' +
        // Teams
        '<text x="180" y="210" fill="#ffffff" font-size="30" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + home + '</text>' +
        '<text x="620" y="210" fill="#ffffff" font-size="30" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + away + '</text>' +
        '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// =============================================================================
// CẤU HÌNH MENU CATEGORIES (CHUẨN THEO ẢNH CHỤP)
// =============================================================================

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⭐ Tất Cả', slug: 'all' },
        { name: '⚽ Bóng Đá', slug: 'football' },
        { name: '🏀 Bóng Rổ', slug: 'basketball' },
        { name: '🥊 Võ Thuật', slug: 'vothuat' },
        { name: '🏐 Bóng Chuyền', slug: 'bongchuyen' },
        { name: '⚾ Bóng Chày', slug: 'bongchay' },
        { name: '📅 Môn Khác', slug: 'other' }
    ]);
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live_group', title: '🔴 Đang Diễn Ra', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Sắp Diễn Ra', type: 'List' },
        { slug: 'finished_group', title: '🎬 Xem Lại / Đã Kết Thúc', type: 'List' } 
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// THUẬT TOÁN TẠO URL API BYPASS BẰNG TIME-TOKEN
// =============================================================================

function getUrlList(slug, filtersJson) { 
    // Thuật toán bóc được từ mã nguồn của bạn
    var t = Math.floor(Date.now() / 10000);
    var apiUrl = API_DOMAIN + "/storage/livestream/all.json?t=" + t;
    // Dùng Hash để truyền trạng thái nội bộ cho ứng dụng VAX
    return apiUrl + "#" + slug; 
}

function getUrlSearch(keyword, filtersJson) { 
    var t = Math.floor(Date.now() / 10000);
    var apiUrl = API_DOMAIN + "/storage/livestream/all.json?t=" + t;
    return apiUrl + "#search=" + encodeURIComponent(keyword); 
}

function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE JSON API (LỌC LIVE, SẮP LIVE, VÀ KẾT THÚC)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentSlug = "all";
        var hashIdx = url.indexOf("#");
        if (hashIdx !== -1) currentSlug = url.substring(hashIdx + 1);

        var liveItems = [];
        var upcomingItems = [];
        var finishedItems = [];
        var nowMs = new Date().getTime();
        var matches = [];

        try {
            var json = JSON.parse(html);
            // Hỗ trợ mọi định dạng JSON có thể trả về
            if (json.data) {
                if (Array.isArray(json.data)) matches = matches.concat(json.data);
                if (json.data.liveFixtures) matches = matches.concat(json.data.liveFixtures);
                if (json.data.fixtures) matches = matches.concat(json.data.fixtures);
            } else if (json.liveFixtures || json.fixtures) {
                if (json.liveFixtures) matches = matches.concat(json.liveFixtures);
                if (json.fixtures) matches = matches.concat(json.fixtures);
            } else if (Array.isArray(json)) {
                matches = matches.concat(json);
            }
        } catch(e) { log("Lỗi Parse JSON API"); }

        var addedUrls = {};

        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            if (!match || !match.teams) continue;

            var statusCode = match.status_code || "NS";
            
            // XÁC ĐỊNH TRẠNG THÁI
            var isFinished = (statusCode === "FT" || statusCode === "AET" || statusCode === "PEN_FT" || statusCode === "FINISHED");
            var isLive = match.is_live || ["1H", "2H", "HT", "PEN", "LIVE", "ET"].indexOf(statusCode) !== -1;
            var isUpcoming = statusCode === "NS";

            var sportType = match.type || "football";
            var MAIN_SPORT_TYPES = ['football', 'basketball', 'vothuat', 'bongchuyen', 'bongchay'];
            
            // Xử lý Tab thể thao
            if (currentSlug !== "all" && currentSlug !== "live_group" && currentSlug !== "upcoming_group" && currentSlug !== "finished_group" && currentSlug.indexOf("search=") === -1) {
                if (currentSlug === "other") {
                    if (MAIN_SPORT_TYPES.indexOf(sportType) !== -1) continue;
                } else {
                    if (sportType !== currentSlug) continue;
                }
            }

            var home = match.teams.home && match.teams.home.name ? match.teams.home.name : "Đội Nhà";
            var away = match.teams.away && match.teams.away.name ? match.teams.away.name : "Đội Khách";
            var cleanTitle = home + " vs " + away;
            var league = match.league && match.league.title ? match.league.title : "Giải đấu";
            
            // Tìm kiếm
            if (url.indexOf("search=") !== -1) {
                var kw = decodeURIComponent(currentSlug.substring(7)).toLowerCase();
                if (cleanTitle.toLowerCase().indexOf(kw) === -1 && league.toLowerCase().indexOf(kw) === -1) {
                    continue;
                }
            }
            
            var scoreHome = match.score && match.score.fulltime && match.score.fulltime.home !== null ? match.score.fulltime.home : "?";
            var scoreAway = match.score && match.score.fulltime && match.score.fulltime.away !== null ? match.score.fulltime.away : "?";
            var score = (isLive || isFinished) ? (scoreHome + " : " + scoreAway) : "? : ?";
            
            var minute = match.live_time ? match.live_time : "";
            var time = match.time ? match.time : "";
            var date = match.day_month ? match.day_month : ""; 
            var matchTimeMs = match.time_start ? (match.time_start * 1000) : parseDateTimeToTimestamp(time + " " + date);

            var slugStr = "truc tiep " + home + " vs " + away + "-" + date + "--" + match.id;
            var detailWebUrl = BASEURL + "/" + getSlug(slugStr) + "/";

            if (addedUrls[match.id]) continue;
            addedUrls[match.id] = true;

            var episodeParts = [];
            if (isLive) {
                episodeParts.push("🔴 LIVE " + (minute ? minute + "'" : ""));
            } else if (isFinished) {
                episodeParts.push("🎬 XEM LẠI");
            } else {
                episodeParts.push("⏳ Sắp Live");
            }

            // Gói dữ liệu Data bao gồm cả BLV nếu API trả về luôn
            var parsedSources = [];
            if (match.blv && Array.isArray(match.blv)) {
                parsedSources = match.blv;
            }

            var payload = { 
                title: cleanTitle, 
                league: league, 
                matchUrl: detailWebUrl, // URL Gốc của web để Load Webview Xem Lại
                sources: parsedSources,
                isLive: isLive,
                isFinished: isFinished,
                isMatchNS: isUpcoming
            };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            var posterImage = createMatchPoster(cleanTitle, score, minute, time + " | " + date, league, isLive, isFinished);

            // Trọng số sắp xếp
            var timeDiff = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;
            var weight = isLive ? (3000000000000 - timeDiff) : (isUpcoming ? (2000000000000 - timeDiff) : (1000000000000 - timeDiff));
            if (match.is_hot) weight += 500000000;

            var itemObj = {
                weight: weight,
                item: {
                    "id": itemUrl, 
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": isLive ? "LIVE" : (isFinished ? "XEM LẠI" : "SẮP LÊN"),
                    "episode_current": episodeParts.join(" | ")
                }
            };

            if (isLive) liveItems.push(itemObj);
            else if (isFinished) finishedItems.push(itemObj);
            else upcomingItems.push(itemObj);
        }

        liveItems.sort(function(a, b) { return b.weight - a.weight; });
        upcomingItems.sort(function(a, b) { return b.weight - a.weight; });
        finishedItems.sort(function(a, b) { return b.weight - a.weight; });

        var finalItems = [];
        if (currentSlug === "live_group") finalItems = liveItems.map(function(w) { return w.item; });
        else if (currentSlug === "upcoming_group") finalItems = upcomingItems.map(function(w) { return w.item; });
        else if (currentSlug === "finished_group") finalItems = finishedItems.map(function(w) { return w.item; });
        else finalItems = liveItems.concat(upcomingItems).concat(finishedItems).map(function(w) { return w.item; });

        return JSON.stringify({
            "items": finalItems,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });

    } catch (e) {
        log("Lỗi parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

// =============================================================================
// CHI TIẾT: LINH HOẠT TẠO BUTTON CHO NATIVE HOẶC WEBVIEW
// =============================================================================

function parseDataFromHash(url) {
    try {
        var hashIdx = url.indexOf("#data=");
        if (hashIdx !== -1) {
            return JSON.parse(decodeURIComponent(url.substring(hashIdx + 6)));
        }
    } catch (e) {}
    return null;
}

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var matchTitle = data ? data.title : "Trực Tiếp Thể Thao";

        var episodes = [];

        // TRƯỜNG HỢP 1: TRẬN ĐÃ KẾT THÚC (MỞ XEM LẠI BẰNG WEBVIEW)
        if (data && data.isFinished) {
            var replayPayload = JSON.stringify({ webviewUrl: data.matchUrl, isReplay: true });
            episodes.push({
                id: replayPayload,
                name: "🎬 Bấm vào để Xem Lại / Highlight",
                slug: "replay"
            });
        } 
        // TRƯỜNG HỢP 2: TRẬN LIVE HOẶC SẮP LIVE (QUÉT M3U8 TỪ API CHUYỂN TỚI)
        else {
            var hasSources = false;
            if (data && data.sources && data.sources.length > 0) {
                hasSources = true;
                for (var i = 0; i < data.sources.length; i++) {
                    var blv = data.sources[i];
                    var streamUrl = blv.mobile_stream_url || blv.pc_stream_url || blv.link_stream_hd || blv.link_stream_sd;
                    var blvName = blv.blv_name || ("Kênh " + (i + 1));
                    
                    if (streamUrl && streamUrl.trim() !== "") {
                        streamUrl = streamUrl.replace(/\\\//g, '/');
                        var epIdPayload = JSON.stringify({ m3u8: streamUrl });
                        
                        episodes.push({
                            id: epIdPayload, 
                            name: "🎙️ BLV " + blvName + (data.isMatchNS ? " (Luồng có thể chưa mở)" : ""),
                            slug: "channel-" + i
                        });
                    }
                }
            }

            // Kênh chờ mặc định để chống lỗi 404
            episodes.push({
                id: JSON.stringify({ m3u8: FALLBACK_M3U8 }),
                name: "⚠️ Màn hình chờ (Dành cho trận Sắp Live)",
                slug: "no-signal"
            });
        }

        return JSON.stringify({
            id: url,
            title: matchTitle,
            posterUrl: DEFAULT_POSTER,
            backdropUrl: DEFAULT_POSTER,
            description: "Chế độ Kép: Phát Native (Siêu Mượt) cho các trận Đang Live, và tự động chuyển sang Webview Không Quảng Cáo đối với trận Xem Lại.",
            servers: [{ name: "Chọn Kênh Phát", episodes: episodes }]
        });
        
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Lỗi Hệ Thống",
            servers: [{ name: "Server", episodes: [{ id: JSON.stringify({ m3u8: FALLBACK_M3U8 }), name: "Lỗi nạp", slug: "error" }] }]
        });
    }
}

// =============================================================================
// PARSER KÉP: XỬ LÝ NATIVE M3U8 VÀ WEBVIEW REPLAY
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var payload = JSON.parse(url);

        // KỊCH BẢN 1: MỞ WEBVIEW (XEM LẠI/HIGHLIGHT)
        if (payload.isReplay && payload.webviewUrl) {
            // Script xóa dấu vết Header, Footer, Quảng cáo của web Giờ Vàng TV
            var killAdsJs = "var s=document.createElement('style');s.innerHTML='header, #header, footer, #footer, .sidebar, .catfish-banner, .banner_popup, [class*=\"ad-\"], [id*=\"ad-\"], iframe[src*=\"ads\"], .floating-balloon-container, .homepage-toplists-content, .fixture-others {display:none!important; opacity:0!important; pointer-events:none!important; z-index:-999!important;} body {padding-top: 0!important; margin-top: 0!important;} .main-wrapper {margin-top: 0!important; padding-top: 0!important;}';document.head.appendChild(s); setInterval(function(){var c=document.querySelectorAll('.cbb, .adclose, .btn-close');for(var i=0;i<c.length;i++){try{c[i].click()}catch(e){}}}, 1000);";
            
            return JSON.stringify({
                url: payload.webviewUrl,
                isEmbed: true, // KÍCH HOẠT WEBVIEW BÊN TRONG APP
                headers: {
                    "Custom-Js": killAdsJs.replace(/\r\n|\r|\n/g, " ").trim()
                },
                subtitles: []
            });
        }

        // KỊCH BẢN 2: CHẠY NATIVE PLAYER (LIVE/M3U8)
        if (payload.m3u8) {
            return JSON.stringify({
                url: payload.m3u8,
                isEmbed: false, // ÉP DÙNG NATIVE PLAYER
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://giovang.city/",
                    "Origin": "https://giovang.city"
                },
                subtitles: []
            });
        }
    } catch (e) {
        // Fallback catch
    }

    // Nếu cấu trúc bị lỗi, ném vào kênh No Signal bằng Native
    return JSON.stringify({ url: FALLBACK_M3U8, isEmbed: false });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
