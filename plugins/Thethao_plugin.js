// =============================================================================
// PLUGIN VAX: TINHLAGI TV (BÌA GỐC THU GỌN NỬA + HIỂN THỊ ĐỦ GIỜ/NGÀY/TỈ SỐ)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";
var DEFAULT_POSTER = "https://tinhlagi.pro/sport/sanbong.jpg";

function getManifest() {
    return JSON.stringify({
        "id": "bongdatv",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Bìa gọn, hiển thị đầy đủ Giờ, Ngày, Tỉ số).",
        "version": "1.8.8",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') nativeLog("[TinhlagiTV] " + msg);
    else if (typeof console !== 'undefined' && console.log) console.log("[TinhlagiTV] " + msg);
}

function decodeEntities(str) {
    if (!str) return "";
    return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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

function cleanMatchTitle(rawTitle) {
    if (!rawTitle) return "Trực tiếp Bóng Đá";
    return rawTitle.replace(/🏆/g, '').replace(/\[[^\]]*\]/g, '').replace(/LIVE/gi, '').replace(/\s+/g, ' ').trim();
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

        var matchDate = new Date(year, month, day, hours, minutes, 0);
        return matchDate.getTime();
    } catch (e) {
        return 0;
    }
}

// =============================================================================
// TẠO ẢNH BÌA THU GỌN CHIỀU DỌC XUỐNG MỘT NỬA (800x225) + HIỂN THỊ GIỜ/TỈ SỐ
// =============================================================================
function createMatchPoster(title, score, minute, time, league, isLive) {
    var home = "Đội Nhà";
    var away = "Đội Khách";
    if (title && title.indexOf(" vs ") !== -1) {
        var parts = title.split(' vs ');
        home = parts[0].trim();
        away = parts[1].trim();
    }
    
    if (home.length > 18) home = home.substring(0, 16) + "...";
    if (away.length > 18) away = away.substring(0, 16) + "...";

    var displayScore = (score && score.trim() !== "") ? score : "VS";
    var statusInfo = isLive ? ("LIVE " + (minute ? minute + "'" : "")) : time;
    var badgeColor = isLive ? "#ef4444" : "#fbbf24";

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="225" viewBox="0 0 800 225">' +
        // Lớp nền tối mờ
        '<rect width="800" height="225" fill="#0f172a"/>' +
        // Thanh tiêu đề giải đấu & thời gian
        '<rect x="0" y="0" width="800" height="40" fill="#1e293b" opacity="0.9"/>' +
        '<text x="20" y="26" fill="#38bdf8" font-size="16" font-family="sans-serif" font-weight="bold">' + (league || "THỂ THAO") + '</text>' +
        '<text x="780" y="26" fill="#fbbf24" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="end">' + time + '</text>' +
        // Tên đội nhà & đội khách cùng tỉ số ở giữa
        '<text x="400" y="85" fill="#ffffff" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + home + '</text>' +
        '<rect x="330" y="105" width="140" height="45" rx="22" fill="#020617" opacity="0.8"/>' +
        '<text x="400" y="135" fill="#fbbf24" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="2">' + displayScore + '</text>' +
        '<text x="400" y="175" fill="#ffffff" font-size="22" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + away + '</text>' +
        // Huy hiệu trạng thái dưới cùng
        '<rect x="340" y="190" width="120" height="24" rx="12" fill="' + badgeColor + '"/>' +
        '<text x="400" y="206" fill="#ffffff" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + statusInfo + '</text>' +
        '</svg>';

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
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
function getUrlList(slug, filtersJson) { return BASEURL + "/?section=" + slug; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DANH SÁCH & LOẠI BỎ MỤC "CẬP NHẬT" RÁC
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
        
        var itemRegex = /<(button|article)([^>]*js-match-btn[^>]*)>([\s\S]*?)<\/\1>/gi;
        var match;
        var nowMs = new Date().getTime();

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[2];
            var innerContent = match[3];

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);

            // Bỏ qua các mục rác như "Cập Nhật", "Địa Chỉ IP", "Chào Khách Lạ"
            if (!cleanTitle || 
                cleanTitle.indexOf("Cập Nhật") !== -1 || 
                cleanTitle.indexOf("Địa Chỉ IP") !== -1 || 
                cleanTitle.indexOf("Chào Khách Lạ") !== -1 ||
                cleanTitle.indexOf(" vs ") === -1) {
                continue;
            }

            var isFinished = innerContent.indexOf('Đã xong') !== -1 || innerContent.indexOf('status-ended') !== -1;
            if (isFinished) continue;

            var isLive = innerContent.indexOf('🟢 Live') !== -1 || innerContent.indexOf('status-live') !== -1;
            var isUpcoming = innerContent.indexOf('⏳ Sắp Live') !== -1 || innerContent.indexOf('status-upcoming') !== -1;

            if (!isLive && !isUpcoming) continue;

            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            
            if (!streamUrl || addedUrls[streamUrl]) continue;
            addedUrls[streamUrl] = true;

            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu khác";
            var score = scoreMatch && scoreMatch[1] ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var matchTimeMs = parseDateTimeToTimestamp(time);
            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            // Tạo ảnh bìa thu gọn dạng bảng điểm
            var posterImage = createMatchPoster(cleanTitle, score, minute, time, league, isLive);

            var episodeParts = [];
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            var itemObj = { matchTimeMs: matchTimeMs, item: {} };

            if (isLive) {
                episodeParts.push("🔴 LIVE");
                if (minute) episodeParts.push(minute + "'");
                if (score) episodeParts.push("Tỉ số: " + score);
                if (time) episodeParts.push(time);
                
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": "ĐANG LIVE",
                    "episode_current": episodeParts.join(" | ")
                };
                liveItems.push(itemObj);
            } else if (isUpcoming) {
                episodeParts.push("⏳ Sắp Live");
                if (time) episodeParts.push(time);
                
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": "SẮP LIVE",
                    "episode_current": episodeParts.join(" | ")
                };
                upcomingItems.push(itemObj);
            }
        }

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
// CHI TIẾT & HIỂN THỊ GIAO DIỆN
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Bóng Đá";
        if (data && data.league) title = "[" + data.league + "] " + title;

        var episodes = [];
        var hasSources = data && data.sources && data.sources.length > 0;
        var mainUrl = data && data.mainUrl ? data.mainUrl : BASEURL;

        if (!hasSources && !data.isLive) {
            episodes.push({
                id: BASEURL + "#ended_match",
                name: "⚠️ Trận đấu đã kết thúc hoặc chưa khả dụng",
                slug: "ended"
            });
        } else {
            for (var i = 0; i < data.sources.length; i++) {
                var s = data.sources[i];
                episodes.push({
                    id: (s.link || mainUrl) + "#embed_play",
                    name: "🌐 " + (s.name || ("Kênh " + (i + 1))),
                    slug: "channel-" + i
                });
            }
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: DEFAULT_POSTER,
            backdropUrl: DEFAULT_POSTER,
            description: "Hệ thống trực tiếp thể thao tốc độ cao.",
            servers: [{ name: "Danh Sách Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{ name: "Server", episodes: [{ id: BASEURL + "#ended_match", name: "⚠️ Lỗi dữ liệu", slug: "error" }] }]
        });
    }
}

function parseDetailResponse(html, url) {
    if (url.indexOf("#ended_match") !== -1) {
        return JSON.stringify({
            url: "about:blank",
            isEmbed: false,
            script: "document.body.style.backgroundColor='#0f172a'; document.body.innerHTML='<div style=\"display:flex;justify-content:center;align-items:center;height:100vh;color:#fff;font-family:sans-serif;text-align:center;padding:20px;\"><div><h2 style=\"color:#38bdf8;font-size:24px;margin-bottom:10px;\">TRẬN ĐẤU ĐÃ KẾT THÚC</h2><p style=\"font-size:16px;color:#94a3b8;\">Cảm ơn quý khán giả đã theo dõi.</p></div></div>';"
        });
    }

    var cleanUrl = url.split('#')[0];
    if (!cleanUrl || cleanUrl.indexOf('http') !== 0) cleanUrl = BASEURL;

    return JSON.stringify({
        url: cleanUrl,
        isEmbed: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://tinhlagi.pro/"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
