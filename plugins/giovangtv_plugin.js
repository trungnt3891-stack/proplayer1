// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (API JSON TRANG CHỦ + BẮT DATA-BLV M3U8 NATIVE)
// =============================================================================

var BASEURL = "https://giovang.city";
var API_URL = "https://live-api.keonhacaitp.one/all.json";
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2025/02/trang-chu-giovang.webp";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Hệ thống trực tiếp thể thao tốc độ cao (Tải bằng API ngầm siêu tốc, phát Native M3U8 gốc, không quảng cáo).",
        "version": "3.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Ép dùng Native Video Player
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

// Giả lập thuật toán tạo Link (Slug) của hệ thống Giờ Vàng TV
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

// Vẽ Bìa tự động
function createMatchPoster(title, score, minute, time, league, isLive) {
    var home = "Đội Nhà", away = "Đội Khách";
    if (title && title.indexOf(" vs ") !== -1) {
        var parts = title.split(' vs ');
        home = parts[0].trim(); away = parts[1].trim();
    }
    if (home.length > 18) home = home.substring(0, 16) + "...";
    if (away.length > 18) away = away.substring(0, 16) + "...";

    var displayScore = (score && score.trim() !== "") ? score : "VS";
    var statusInfo = isLive ? ("🔴 LIVE " + (minute ? minute + "'" : "")) : ("⏳ " + time);
    var badgeColor = isLive ? "#ef4444" : "#fbbf24";

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="225" viewBox="0 0 800 225">' +
        '<rect width="800" height="225" fill="#0f172a"/>' +
        '<rect x="0" y="0" width="800" height="40" fill="#1e293b" opacity="0.9"/>' +
        '<text x="20" y="26" fill="#38bdf8" font-size="16" font-family="sans-serif" font-weight="bold">' + (league || "THỂ THAO").toUpperCase() + '</text>' +
        '<text x="780" y="26" fill="#fbbf24" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="end">' + time + '</text>' +
        '<text x="400" y="85" fill="#ffffff" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + home + '</text>' +
        '<rect x="330" y="105" width="140" height="45" rx="22" fill="#020617" opacity="0.8"/>' +
        '<text x="400" y="135" fill="#fbbf24" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="2">' + displayScore + '</text>' +
        '<text x="400" y="175" fill="#ffffff" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + away + '</text>' +
        '<rect x="320" y="190" width="160" height="24" rx="12" fill="' + badgeColor + '"/>' +
        '<text x="400" y="207" fill="#ffffff" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + statusInfo + '</text>' +
        '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// =============================================================================
// CẤU HÌNH THƯ MỤC & ĐỊNH TUYẾN URL
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
        { slug: 'upcoming_group', title: '⏳ Danh Sách Sắp Diễn Ra', type: 'List' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// Load danh sách bằng API nội bộ của Web thay vì cào HTML trang chủ
function getUrlList(slug, filtersJson) { return API_URL + "?tab=" + slug + "&t=" + new Date().getTime(); }
function getUrlSearch(keyword, filtersJson) { return API_URL + "?search=" + encodeURIComponent(keyword); }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE JSON API SIÊU TỐC VÀ CHIA FOLDER
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentTab = "all";
        var tabMatch = url.match(/tab=([^&]+)/);
        if (tabMatch) currentTab = tabMatch[1];

        var liveItems = [];
        var upcomingItems = [];
        var nowMs = new Date().getTime();

        var matches = [];
        try {
            var data = JSON.parse(html);
            if (data.liveFixtures) matches = matches.concat(data.liveFixtures);
            if (data.fixtures) matches = matches.concat(data.fixtures);
            if (matches.length === 0 && Array.isArray(data)) matches = data;
        } catch(e) { log("Lỗi Parse JSON API"); }

        var addedUrls = {};

        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            if (!match || !match.teams) continue;

            // Kiểm tra trạng thái trận
            var statusCode = match.status_code || "NS";
            if (statusCode === "FT" || statusCode === "AET" || statusCode === "PEN_FT") continue;

            var isLive = match.is_live || ["1H", "2H", "HT", "PEN", "LIVE", "ET"].indexOf(statusCode) !== -1;
            var isUpcoming = statusCode === "NS";
            if (!isLive && !isUpcoming) continue;

            // Bộ lọc Phân Loại Thể Thao
            var sportType = match.type || "football";
            var MAIN_SPORT_TYPES = ['football', 'basketball', 'vothuat', 'bongchuyen', 'bongchay'];
            
            if (currentTab !== "all" && currentTab !== "live_group" && currentTab !== "upcoming_group") {
                if (currentTab === "other") {
                    if (MAIN_SPORT_TYPES.indexOf(sportType) !== -1) continue;
                } else {
                    if (sportType !== currentTab) continue;
                }
            }

            var home = match.teams.home ? match.teams.home.name : "Đội Nhà";
            var away = match.teams.away ? match.teams.away.name : "Đội Khách";
            var cleanTitle = home + " vs " + away;
            var league = match.league ? match.league.title : "Giải đấu";
            
            // Bộ lọc Tìm Kiếm
            if (url.indexOf("search=") !== -1) {
                var kwMatch = url.match(/search=([^&]+)/);
                if (kwMatch) {
                    var kw = decodeURIComponent(kwMatch[1]).toLowerCase();
                    if (cleanTitle.toLowerCase().indexOf(kw) === -1 && league.toLowerCase().indexOf(kw) === -1) {
                        continue;
                    }
                }
            }
            
            var scoreHome = match.score && match.score.fulltime && match.score.fulltime.home !== null ? match.score.fulltime.home : "?";
            var scoreAway = match.score && match.score.fulltime && match.score.fulltime.away !== null ? match.score.fulltime.away : "?";
            var score = isLive ? (scoreHome + " - " + scoreAway) : "VS";
            
            var minute = match.live_time ? match.live_time : "";
            var time = match.time ? match.time : "";
            var date = match.day_month ? match.day_month : ""; 
            var matchTimeMs = match.time_start ? (match.time_start * 1000) : parseDateTimeToTimestamp(time + " " + date);

            // Tự động tạo link chi tiết y hệt website để gọi HTML
            var slugStr = "truc tiep " + home + " vs " + away + "-" + date + "--" + match.id;
            var detailUrl = BASEURL + "/" + getSlug(slugStr) + "/";

            if (addedUrls[match.id]) continue;
            addedUrls[match.id] = true;

            var episodeParts = [];
            if (isLive) {
                var st = "🔴 LIVE";
                if (minute) st += " " + minute + "'";
                episodeParts.push(st);
                if (score !== "VS") episodeParts.push("Tỉ số: " + score);
            } else {
                episodeParts.push("⏳ " + time + " " + date);
            }

            var posterImage = createMatchPoster(cleanTitle, score, minute, time + " " + date, league, isLive);

            var timeDiff = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;
            var weight = isLive ? (3000000000000 - timeDiff) : (1000000000000 - timeDiff);
            if (match.is_hot) weight += 500000000;

            var itemObj = {
                weight: weight,
                item: {
                    "id": detailUrl, 
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": isLive ? "ĐANG LIVE" : "SẮP LIVE",
                    "episode_current": episodeParts.join(" | ")
                }
            };

            if (isLive) liveItems.push(itemObj);
            else upcomingItems.push(itemObj);
        }

        liveItems.sort(function(a, b) { return b.weight - a.weight; });
        upcomingItems.sort(function(a, b) { return b.weight - a.weight; });

        var finalItems = [];
        if (currentTab === "live_group") finalItems = liveItems.map(function(w) { return w.item; });
        else if (currentTab === "upcoming_group") finalItems = upcomingItems.map(function(w) { return w.item; });
        else finalItems = liveItems.concat(upcomingItems).map(function(w) { return w.item; });

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
// CHI TIẾT: BÓC TÁCH LIÊN KẾT M3U8 NATIVE TỪ DATA-BLV
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        var matchTitle = titleMatch ? titleMatch[1].trim() : "Trực Tiếp Thể Thao";

        var episodes = [];
        var hasSources = false;

        // Quét tìm data-blv trên thẻ div của trang web
        var blvMatch = html.match(/data-blv="([^"]+)"/i);
        
        if (blvMatch && blvMatch[1]) {
            var decodedData = decodeEntities(blvMatch[1]); 
            try {
                var blvList = JSON.parse(decodedData);
                if (blvList && blvList.length > 0) {
                    hasSources = true;
                    for (var i = 0; i < blvList.length; i++) {
                        var blv = blvList[i];
                        var streamUrl = blv.mobile_stream_url || blv.pc_stream_url || blv.link_stream_hd || blv.link_stream_sd;
                        var blvName = blv.blv_name || ("Kênh " + (i + 1));
                        
                        if (streamUrl && streamUrl.trim() !== "") {
                            // Làm sạch link nếu web dùng dấu gạch chéo ngược
                            streamUrl = streamUrl.replace(/\\\//g, '/');
                            
                            episodes.push({
                                id: streamUrl, 
                                name: "🎙️ " + blvName,
                                slug: "channel-" + i
                            });
                        }
                    }
                }
            } catch (e) { log("Lỗi Parse JSON data-blv: " + e); }
        }

        // Tự động nhét link chờ phát sóng
        if (!hasSources || episodes.length === 0) {
            episodes.push({
                id: FALLBACK_M3U8,
                name: "⚠️ Đang chờ tín hiệu phát sóng",
                slug: "no-signal"
            });
        }

        return JSON.stringify({
            id: url,
            title: matchTitle,
            posterUrl: DEFAULT_POSTER,
            backdropUrl: DEFAULT_POSTER,
            description: "Hệ thống trực tiếp thể thao tốc độ cao với Trình phát Native gốc. Loại bỏ 100% quảng cáo và chống giật lag hiệu quả.",
            servers: [{ name: "Chọn Kênh Phát Sóng", episodes: episodes }]
        });
        
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Thể Thao",
            servers: [{ name: "Server", episodes: [{ id: FALLBACK_M3U8, name: "⚠️ Lỗi hệ thống", slug: "error" }] }]
        });
    }
}

// =============================================================================
// NATIVE PLAYER: CẤU HÌNH HEADERS & PHÁT VIDEO NATIVE
// =============================================================================

function parseDetailResponse(html, url) {
    return JSON.stringify({
        url: url,
        isEmbed: false, // Ép gọi Trình Phát Video mặc định thay cho WebView
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://giovang.city/",
            "Origin": "https://giovang.city"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
