
// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (API SIÊU TỐC + PHÁT VIDEO NATIVE M3U8 GỐC)
// =============================================================================

var BASEURL = "https://giovang.city";
// Tận dụng API tĩnh của web để tải danh sách không cần load HTML
var API_URL = "https://live-api.keonhacaitp.one/all.json"; 
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2026/07/signal-2026-07-29-13-33-20-367.jpg";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Trực tiếp bóng đá (API Siêu tốc, Phát trực tiếp Native mượt mà, Bỏ qua quảng cáo).",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Ép sử dụng Native Player thay vì Embed Webview để chống giật lag
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

// Chuyển chuỗi url ra slug chuẩn của WordPress để bắt bài chi tiết
function getSlug(str) {
    str = String(str || '').replace(/^\s+|\s+$/g, '').toLowerCase();
    var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđç·/_,:;";
    var to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydc------";
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

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live_group', title: '🔥 Tâm Điểm Đang Live', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Danh Sách Sắp Diễn Ra', type: 'List' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '🔥 Đang Live', slug: 'live_group' },
        { name: '⏳ Sắp Diễn Ra', slug: 'upcoming_group' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// Gọi thẳng API JSON gốc để bòn rút dữ liệu mà không cần tải HTML
function getUrlList(slug, filtersJson) { 
    return API_URL + "#" + slug; 
}

function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE JSON TỪ API & CHIA NHÓM
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentSlug = "live_group";
        if (url && url.indexOf("upcoming_group") !== -1) {
            currentSlug = "upcoming_group";
        }

        var liveItems = [];
        var upcomingItems = [];
        var addedUrls = {}; 
        var nowMs = new Date().getTime();

        var matches = [];
        // Kiểm tra xem dữ liệu tải về là API JSON hay mã HTML DOM
        try {
            var data = JSON.parse(html);
            if (Array.isArray(data)) matches = data;
            else if (data.fixtures) matches = data.fixtures.concat(data.liveFixtures || []);
            else if (data.data) matches = data.data;
        } catch(e) {}

        if (matches.length > 0) {
            // Lấy từ JSON API trực tiếp
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                if (!match || !match.teams) continue;

                var statusCode = match.status_code || "NS";
                var isFinished = statusCode === "FT" || statusCode === "AET" || statusCode === "PEN_FT";
                if (isFinished) continue;

                var isLive = match.is_live || ["1H", "2H", "HT", "PEN", "LIVE", "ET"].indexOf(statusCode) !== -1;
                var isUpcoming = statusCode === "NS";
                
                if (!isLive && !isUpcoming) continue;

                var home = match.teams.home ? match.teams.home.name : "Đội Nhà";
                var away = match.teams.away ? match.teams.away.name : "Đội Khách";
                var cleanTitle = home + " vs " + away;
                var league = match.league ? match.league.title : "Giải đấu";
                
                var scoreHome = match.score && match.score.fulltime ? match.score.fulltime.home : "?";
                var scoreAway = match.score && match.score.fulltime ? match.score.fulltime.away : "?";
                var score = isLive ? (scoreHome + " - " + scoreAway) : "VS";
                
                var minute = match.live_time ? match.live_time : "";
                var time = match.time ? match.time : "";
                var date = match.day_month ? match.day_month : "";
                
                var matchTimeMs = parseDateTimeToTimestamp(time + " " + date);
                if (!matchTimeMs) matchTimeMs = match.time_start ? (match.time_start * 1000) : 0;
                
                var episodeParts = [];
                if (isLive) {
                    episodeParts.push("🔴 LIVE");
                    if (minute) episodeParts.push(minute + "'");
                    if (score !== "VS") episodeParts.push("Tỉ số: " + score);
                } else {
                    episodeParts.push("⏳ Sắp Live");
                    episodeParts.push(time + " | " + date);
                }

                // Dựng URL slug giống hệt hệ thống WordPress để gọi trang chi tiết lấy m3u8
                var slugStr = "truc tiep " + home + " vs " + away + "-" + date + "--" + match.id;
                var detailUrl = BASEURL + "/" + getSlug(slugStr);
                
                if (addedUrls[match.id]) continue;
                addedUrls[match.id] = true;

                var itemObj = { matchTimeMs: matchTimeMs, item: {
                    "id": detailUrl, 
                    "title": cleanTitle,
                    "posterUrl": DEFAULT_POSTER,
                    "backdropUrl": DEFAULT_POSTER,
                    "quality": isLive ? "ĐANG LIVE" : "SẮP LIVE",
                    "episode_current": episodeParts.join(" | ")
                }};

                if (isLive) liveItems.push(itemObj);
                else upcomingItems.push(itemObj);
            }
        }

        // Sắp xếp
        liveItems.sort(function(a, b) { return b.matchTimeMs - a.matchTimeMs; });
        upcomingItems.sort(function(a, b) { return a.matchTimeMs - b.matchTimeMs; });

        var finalFilteredItems = (currentSlug === "upcoming_group") ? 
            upcomingItems.map(function(w) { return w.item; }) : 
            liveItems.map(function(w) { return w.item; });

        return JSON.stringify({
            "items": finalFilteredItems,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });

    } catch (e) {
        log("Lỗi parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html, ""); }

// =============================================================================
// BÓC TÁCH M3U8 TỪ TRANG CHI TIẾT
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var episodes = [];
        var hasSources = false;
        
        // 1. Quét tìm biến tĩnh chứa Tiêu đề trận
        var dataMatchRegex = html.match(/var data_detail_match\s*=\s*(\{[\s\S]*?\});/);
        var matchTitle = "Trực Tiếp Bóng Đá";
        
        if (dataMatchRegex && dataMatchRegex[1]) {
            var dataObj = JSON.parse(dataMatchRegex[1]);
            if (dataObj && dataObj.data && dataObj.data.teams) {
                matchTitle = dataObj.data.teams.home.name + " vs " + dataObj.data.teams.away.name;
            }
        }
        
        // 2. Thu thập trực tiếp danh sách m3u8 giấu trong data-blv
        var blvMatch = html.match(/data-blv="([^"]+)"/);
        if (blvMatch && blvMatch[1]) {
            var decodedStr = decodeEntities(blvMatch[1]);
            var blvList = JSON.parse(decodedStr);
            if (blvList && blvList.length > 0) {
                hasSources = true;
                for (var i = 0; i < blvList.length; i++) {
                    var blv = blvList[i];
                    var streamUrl = blv.mobile_stream_url || blv.pc_stream_url;
                    if (streamUrl) {
                        episodes.push({
                            id: streamUrl, // Truyền trực tiếp đường dẫn m3u8 thẳng sang Embed!
                            name: "🎙️ " + (blv.blv_name || ("Kênh " + (i + 1))),
                            slug: "channel-" + i
                        });
                    }
                }
            }
        }
        
        // 3. Nếu chưa phát hoặc không có link, dùng No Signal
        if (!hasSources) {
            episodes.push({
                id: FALLBACK_M3U8,
                name: "⚠️ Đang chờ tín hiệu / Chưa phát sóng",
                slug: "no-signal"
            });
        }

        return JSON.stringify({
            id: url,
            title: matchTitle,
            posterUrl: DEFAULT_POSTER,
            backdropUrl: DEFAULT_POSTER,
            description: "Hệ thống trực tiếp thể thao siêu tốc. App đang xử lý phát trực tiếp mượt mà qua Native Player giúp chặn mọi loại quảng cáo làm phiền.",
            servers: [{ name: "Chọn Kênh Phát Sóng", episodes: episodes }]
        });
        
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp",
            servers: [{ name: "Server", episodes: [{ id: FALLBACK_M3U8, name: "⚠️ Đang xử lý tín hiệu", slug: "error" }] }]
        });
    }
}

// =============================================================================
// TRẢ VỀ CHO NATIVE PLAYER ĐỂ CHẶN QUẢNG CÁO
// =============================================================================
function parseEmbedResponse(html, url) {
    // Trả về trực tiếp link m3u8 với isEmbed = false
    // Điều này sẽ ép ứng dụng dùng Trình phát Native gốc thay vì load trang web, mang lại tốc độ tức thì.
    return JSON.stringify({
        url: url,
        isEmbed: false, 
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://giovang.city/"
        },
        subtitles: []
    });
}

function parseDetailResponse(html, url) { return parseEmbedResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
