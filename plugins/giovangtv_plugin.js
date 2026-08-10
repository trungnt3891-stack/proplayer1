// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (FIX LỖI NẠP DỮ LIỆU + CHIA TAB BỘ MÔN CHUẨN)
// =============================================================================

var BASEURL = "https://giovang.city";
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2025/02/trang-chu-giovang.webp";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Trực tiếp thể thao đa bộ môn (Tải dữ liệu an toàn, Phát Native M3U8 siêu mượt, Không quảng cáo).",
        "version": "1.0.2",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Ép sử dụng Native Player để chống quảng cáo và giật lag
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

function cleanMatchTitle(rawTitle) {
    if (!rawTitle) return "Trực tiếp Bóng Đá";
    return rawTitle.replace(/🏆/g, '').replace(/\[[^\]]*\]/g, '').replace(/LIVE/gi, '').replace(/\s+/g, ' ').trim();
}

// =============================================================================
// CẤU HÌNH MENU & URL
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

// Tải thẳng trang chủ để bóc HTML
function getUrlList(slug, filtersJson) { return BASEURL + "/?tab=" + slug; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DOM TỪ HTML VÀ LỌC BỘ MÔN
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentTab = "all";
        var tabMatch = url.match(/tab=([^&]+)/);
        if (tabMatch) currentTab = tabMatch[1];

        var isHomeLive = currentTab === "live_group";
        var isHomeUpcoming = currentTab === "upcoming_group";
        var isSportFilter = !isHomeLive && !isHomeUpcoming && currentTab !== "all";

        var liveItems = [];
        var upcomingItems = [];
        var addedUrls = {}; 
        var nowMs = new Date().getTime();
        
        // Cập nhật Regex siêu an toàn để không bị bắt hụt HTML
        var itemRegex = /<(button|article)[^>]*js-match-btn[^>]*>([\s\S]*?)<\/\1>/gi;
        var match;

        while ((match = itemRegex.exec(html)) !== null) {
            var fullHtml = match[0];

            var titleMatch = fullHtml.match(/data-title="([^"]*)"/i);
            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            
            // Loại bỏ mục rác
            if (!rawTitle || rawTitle.indexOf("Cập Nhật") !== -1 || rawTitle.indexOf("Địa Chỉ IP") !== -1 || rawTitle.indexOf("Chào Khách") !== -1 || rawTitle.indexOf(" vs ") === -1) {
                continue;
            }

            var isFinished = fullHtml.indexOf('Đã xong') !== -1 || fullHtml.indexOf('status-ended') !== -1;
            if (isFinished) continue;

            var isLive = fullHtml.indexOf('🟢 Live') !== -1 || fullHtml.indexOf('status-live') !== -1;
            var isUpcoming = fullHtml.indexOf('⏳ Sắp Live') !== -1 || fullHtml.indexOf('status-upcoming') !== -1;
            if (!isLive && !isUpcoming) continue;

            // Bỏ qua trận trùng lặp
            if (addedUrls[rawTitle]) continue;
            addedUrls[rawTitle] = true;

            var urlMatch = fullHtml.match(/data-url="([^"]*)"/i);
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;

            var scoreMatch = fullHtml.match(/data-score="([^"]*)"/i);
            var minuteMatch = fullHtml.match(/data-minute="([^"]*)"/i);
            var timeMatch = fullHtml.match(/data-time="([^"]*)"/i);
            var leagueMatch = fullHtml.match(/data-league="([^"]*)"/i);
            var sourcesMatch = fullHtml.match(/data-sources="([^"]*)"/i);

            var sportType = "football"; 
            var srcStr = sourcesMatch && sourcesMatch[1] ? sourcesMatch[1].toLowerCase() : "";
            var lgStr = leagueMatch && leagueMatch[1] ? leagueMatch[1].toLowerCase() : "";
            
            // Nhận diện Bộ Môn
            if (srcStr.indexOf("basketball") !== -1 || lgStr.indexOf("nba") !== -1 || lgStr.indexOf("vba") !== -1) sportType = "basketball";
            else if (srcStr.indexOf("volleyball") !== -1 || srcStr.indexOf("bongchuyen") !== -1) sportType = "bongchuyen";
            else if (srcStr.indexOf("baseball") !== -1 || srcStr.indexOf("bongchay") !== -1) sportType = "bongchay";
            else if (srcStr.indexOf("esport") !== -1 || lgStr.indexOf("kespa") !== -1 || lgStr.indexOf("lck") !== -1) sportType = "other";
            else if (srcStr.indexOf("vothuat") !== -1 || srcStr.indexOf("boxing") !== -1 || lgStr.indexOf("ufc") !== -1) sportType = "vothuat";

            // Kiểm tra Filter Tab
            if (isSportFilter) {
                if (currentTab === "other" && ["football", "basketball", "bongchuyen", "bongchay", "vothuat"].indexOf(sportType) !== -1) continue;
                if (currentTab !== "other" && sportType !== currentTab) continue;
            }

            var cleanTitle = cleanMatchTitle(rawTitle);
            var league = leagueMatch && leagueMatch[1] ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu khác";
            var score = scoreMatch && scoreMatch[1] ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch && minuteMatch[1] ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch && timeMatch[1] ? decodeEntities(timeMatch[1]).trim() : "";

            var matchTimeMs = parseDateTimeToTimestamp(time);
            var parsedSources = [];
            if (sourcesMatch && sourcesMatch[1]) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            var episodeParts = [];
            var payload = { title: cleanTitle, league: league, sources: parsedSources, isLive: isLive };
            // Đóng gói data JSON vào url để chuyển qua màn hình Detail
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            var timeDiff = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;
            var weight = isLive ? (3000000000000 - timeDiff) : (1000000000000 - timeDiff);

            var itemObj = {
                matchTimeMs: matchTimeMs,
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": DEFAULT_POSTER, // Dùng cố định ảnh sanbong.jpg
                    "backdropUrl": DEFAULT_POSTER, // Dùng cố định ảnh sanbong.jpg
                    "quality": isLive ? "ĐANG LIVE" : "SẮP LIVE",
                    "episode_current": ""
                }
            };

            // Ráp thông tin Tỉ số / Phút hiển thị trực tiếp lên Badge xanh của App
            if (isLive) {
                var statusInfo = "🔴 LIVE";
                if (minute) statusInfo += " " + minute + "'";
                if (score) statusInfo += " | " + score;
                itemObj.item.episode_current = statusInfo;
                liveItems.push(itemObj);
            } else {
                itemObj.item.episode_current = "⏳ " + time;
                upcomingItems.push(itemObj);
            }
        }

        liveItems.sort(function(a, b) { return b.matchTimeMs - a.matchTimeMs; });
        upcomingItems.sort(function(a, b) { return a.matchTimeMs - b.matchTimeMs; });

        var finalItems = [];
        if (isHomeLive) finalItems = liveItems.map(function(w) { return w.item; });
        else if (isHomeUpcoming) finalItems = upcomingItems.map(function(w) { return w.item; });
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

function parseSearchResponse(html) { return parseListResponse(html, BASEURL + "/?tab=all"); }

// =============================================================================
// CHI TIẾT: GIẢI MÃ M3U8 GỐC TỪ DỮ LIỆU ĐÃ BÓC
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Thể Thao";
        if (data && data.league) title = "[" + data.league + "] " + title;

        var episodes = [];
        var hasSources = false;

        // Trích xuất link từ data.sources đã quét được ở trang chủ
        if (data && data.sources && data.sources.length > 0) {
            hasSources = true;
            for (var i = 0; i < data.sources.length; i++) {
                var s = data.sources[i];
                var m3u8Link = FALLBACK_M3U8;
                var referer = "https://giovang.city/";

                if (s.link) {
                    // Bóc tách url= (đường dẫn luồng video thật)
                    var urlMatch = s.link.match(/&url=([^&]+)/);
                    if (urlMatch && urlMatch[1]) {
                        m3u8Link = decodeURIComponent(urlMatch[1]);
                    }
                    // Bóc tách referer= (chìa khóa để mở video)
                    var refMatch = s.link.match(/&referer=([^&]+)/);
                    if (refMatch && refMatch[1]) {
                        referer = decodeURIComponent(refMatch[1]);
                    }
                }

                // Gói gọn m3u8 và referer thành 1 chuỗi JSON truyền đi
                var epIdPayload = JSON.stringify({ m3u8: m3u8Link, referer: referer });

                episodes.push({
                    id: epIdPayload,
                    name: "🎙️ " + (s.name || ("Kênh " + (i + 1))),
                    slug: "channel-" + i
                });
            }
        }

        if (!hasSources) {
            var errPayload = JSON.stringify({ m3u8: FALLBACK_M3U8, referer: "https://freem3u.xyz/" });
            episodes.push({
                id: errPayload,
                name: "⚠️ Đang chờ tín hiệu / Trận đấu chưa mở",
                slug: "no-signal"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: DEFAULT_POSTER,
            backdropUrl: DEFAULT_POSTER,
            description: "Xem trực tiếp siêu mượt, loại bỏ hoàn toàn quảng cáo web bằng Trình phát Video Gốc của điện thoại.",
            servers: [{ name: "Danh Sách Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Lỗi Tải Dữ Liệu",
            servers: [{ name: "Server", episodes: [{ id: JSON.stringify({m3u8: FALLBACK_M3U8, referer: ""}), name: "⚠️ Lỗi", slug: "error" }] }]
        });
    }
}

// =============================================================================
// NATIVE PLAYER: TRUYỀN LINK M3U8 VÀ REFERER THẲNG VÀO TRÌNH PHÁT APP
// =============================================================================

function parseDetailResponse(html, url) {
    var finalUrl = FALLBACK_M3U8;
    var finalReferer = "https://giovang.city/";

    try {
        // Đọc giải mã gói dữ liệu gửi từ parseMovieDetail
        var payload = JSON.parse(url);
        if (payload.m3u8) finalUrl = payload.m3u8;
        if (payload.referer) finalReferer = payload.referer;
    } catch (e) {
        finalUrl = url;
    }

    return JSON.stringify({
        url: finalUrl,
        isEmbed: false, // Gọi Native Video Player (Trình phát mặc định của App)
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": finalReferer,
            "Origin": finalReferer
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
