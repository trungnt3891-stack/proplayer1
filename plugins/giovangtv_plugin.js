// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (DYNAMIC PLAYER: NATIVE M3U8 & WEBVIEW XEM LẠI)
// =============================================================================

var BASEURL = "https://giovang.city";
var API_URL = "https://live-api.keonhacaitp.one/storage/livestream/all.json"; 
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2025/02/trang-chu-giovang.webp";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Siêu mượt: Phát Native M3U8 cho trận Live & Webview dọn dẹp CSS cho trận Xem lại.",
        "version": "8.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Đặt mặc định là native, sẽ đổi linh hoạt trong parseDetailResponse
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') nativeLog("[GiovangTV] " + msg);
    else if (typeof console !== 'undefined' && console.log) console.log("[GiovangTV] " + msg);
}

function decodeEntities(str) {
    if (!str) return "";
    return str.replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/\\"/g, '"');
}

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

function parseDataFromHash(url) {
    try {
        var hashIdx = url.indexOf("#data=");
        if (hashIdx !== -1) {
            return JSON.parse(decodeURIComponent(url.substring(hashIdx + 6)));
        }
    } catch (e) { log("Lỗi decode Hash: " + e); }
    return null;
}

// =============================================================================
// CẤU HÌNH MENU & URL BẰNG HASH ĐỂ BYPASS CDN
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
        { slug: 'live_group', title: '🔥 Tâm Điểm Đang Live', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Danh Sách Sắp Diễn Ra', type: 'List' },
        { slug: 'finished_group', title: '🎬 Xem Lại / Highlight', type: 'List' } // Thêm khối Xem Lại
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// Đóng gói request kèm Headers để vượt tường lửa Cloudflare của Web
function getUrlList(slug, filtersJson) { 
    var t = Math.floor(Date.now() / 10000);
    var url = API_URL + "?t=" + t + "&tab=" + slug; 
    return JSON.stringify({
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://giovang.city/",
            "Origin": "https://giovang.city",
            "Accept": "application/json, text/plain, */*"
        }
    });
}

function getUrlSearch(keyword, filtersJson) { 
    var t = Math.floor(Date.now() / 10000);
    var url = API_URL + "?t=" + t + "&search=" + encodeURIComponent(keyword); 
    return JSON.stringify({
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://giovang.city/",
            "Origin": "https://giovang.city",
            "Accept": "application/json, text/plain, */*"
        }
    });
}

// Lấy chi tiết vẫn tải trang web gốc để bóc DOM
function getUrlDetail(slug) { 
    return JSON.stringify({
        url: slug,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://giovang.city/"
        }
    });
}

function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE JSON API (LỌC LIVE, SẮP LIVE, VÀ KẾT THÚC)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentSlug = "all";
        var tabMatch = url.match(/tab=([^&]+)/);
        if (tabMatch) currentSlug = tabMatch[1];

        var liveItems = [];
        var upcomingItems = [];
        var finishedItems = [];
        var nowMs = new Date().getTime();
        var matches = [];

        try {
            var json = JSON.parse(html);
            if (json.data) {
                if (Array.isArray(json.data)) matches = matches.concat(json.data);
                if (json.data.liveFixtures) matches = matches.concat(json.data.liveFixtures);
                if (json.data.fixtures) matches = matches.concat(json.data.fixtures);
            }
            if (json.liveFixtures) matches = matches.concat(json.liveFixtures);
            if (json.fixtures) matches = matches.concat(json.fixtures);
            if (Array.isArray(json)) matches = matches.concat(json);
        } catch(e) { log("Lỗi Parse JSON API"); }

        var addedUrls = {};

        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            if (!match || !match.teams) continue;

            var statusCode = match.status_code || "NS";
            
            // XÁC ĐỊNH TRẠNG THÁI: Kết Thúc, Đang Live, Sắp Live
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
            var score = (isLive || isFinished) ? (scoreHome + " - " + scoreAway) : "";
            
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
                if (score) episodeParts.push("Tỉ số: " + score);
            } else if (isFinished) {
                episodeParts.push("🎬 XEM LẠI");
                if (score) episodeParts.push("Tỉ số: " + score);
            } else {
                episodeParts.push("⏳ Sắp Live: " + time + " " + date);
            }

            // Đóng gói data cho màn hình Detail
            var payload = { 
                title: cleanTitle, 
                league: league, 
                matchUrl: detailWebUrl, // URL Gốc của web để Load Webview (nếu cần)
                isLive: isLive,
                isFinished: isFinished
            };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            // Trọng số sắp xếp: Đang Live -> Xếp theo giờ mới đá. Đã xong -> Xếp theo giờ kết thúc. Sắp Live -> Gần nhất xếp trên
            var timeDiff = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;
            var weight = isLive ? (3000000000000 - timeDiff) : (isUpcoming ? (2000000000000 - timeDiff) : (1000000000000 - timeDiff));
            if (match.is_hot) weight += 500000000;

            var itemObj = {
                weight: weight,
                item: {
                    "id": itemUrl, 
                    "title": cleanTitle,
                    "posterUrl": DEFAULT_POSTER,
                    "backdropUrl": DEFAULT_POSTER,
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

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        var matchTitle = titleMatch ? titleMatch[1].trim() : (data ? data.title : "Trực Tiếp Thể Thao");

        var episodes = [];
        var hasSources = false;

        // TRƯỜNG HỢP 1: TRẬN ĐÃ KẾT THÚC (MỞ XEM LẠI BẰNG WEBVIEW)
        if (data && data.isFinished) {
            var replayPayload = JSON.stringify({
                webviewUrl: data.matchUrl,
                isReplay: true
            });

            episodes.push({
                id: replayPayload,
                name: "🎬 Bấm vào để Xem Lại / Highlight",
                slug: "replay"
            });
            hasSources = true;
        } 
        // TRƯỜNG HỢP 2: TRẬN LIVE HOẶC SẮP LIVE (QUÉT M3U8 PHÁT NATIVE)
        else {
            var isMatchNS = false;
            var statusMatch = html.match(/"status_code"\s*:\s*"([^"]+)"/i);
            if (statusMatch && statusMatch[1] === "NS") isMatchNS = true;

            var blvMatch = html.match(/data-blv=(['"])(.*?)\1/i);
            if (blvMatch && blvMatch[2]) {
                var decodedData = decodeEntities(blvMatch[2]); 
                try {
                    var blvList = JSON.parse(decodedData);
                    if (blvList && blvList.length > 0) {
                        hasSources = true;
                        for (var i = 0; i < blvList.length; i++) {
                            var blv = blvList[i];
                            var streamUrl = blv.mobile_stream_url || blv.pc_stream_url || blv.link_stream_hd || blv.link_stream_sd;
                            var blvName = blv.blv_name || ("Kênh " + (i + 1));
                            
                            if (streamUrl && streamUrl.trim() !== "") {
                                streamUrl = streamUrl.replace(/\\\//g, '/');
                                var epIdPayload = JSON.stringify({ m3u8: streamUrl });
                                
                                episodes.push({
                                    id: epIdPayload, 
                                    name: "🎙️ BLV " + blvName + (isMatchNS ? " (Có thể chưa mở)" : ""),
                                    slug: "channel-" + i
                                });
                            }
                        }
                    }
                } catch (e) {}
            }

            // Kênh chờ mặc định
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
            description: "Chế độ Thông Minh: Phát Native (Siêu Mượt) cho các trận Đang Live, và tự động chuyển sang Webview Không Quảng Cáo đối với trận Xem Lại.",
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
            // Script xóa dấu vết Header, Sidebar, Quảng cáo của web Giờ Vàng TV
            var killAdsJs = "var s=document.createElement('style');s.innerHTML='header, #header, footer, #footer, .sidebar, .catfish-banner, .banner_popup, [class*=\"ad-\"], [id*=\"ad-\"], iframe[src*=\"ads\"], .floating-balloon-container {display:none!important; opacity:0!important; pointer-events:none!important; z-index:-999!important;} body {padding-top: 0!important; margin-top: 0!important;} .main-wrapper {margin-top: 0!important;}';document.head.appendChild(s); setInterval(function(){var c=document.querySelectorAll('.cbb, .adclose, .btn-close');for(var i=0;i<c.length;i++){try{c[i].click()}catch(e){}}}, 1000);";
            
            return JSON.stringify({
                url: payload.webviewUrl,
                isEmbed: true, // KÍCH HOẠT WEBVIEW BÊN TRONG APP
                headers: {
                    "Custom-Js": killAdsJs.replace(/\r\n|\r|\n/g, " ").trim()
                },
                subtitles: []
            });
        }

        // KỊCH BẢN 2: CHẠY NATIVE PLAYER (LIVE)
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

    // Nếu cấu trúc bị lỗi, ném vào kênh No Signal
    return JSON.stringify({ url: FALLBACK_M3U8, isEmbed: false });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
