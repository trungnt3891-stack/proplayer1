// =============================================================================
// PLUGIN VAX: TINHLAGI TV (CHỈ LẤY KHỐI TÂM ĐIỂM LIVE & TÂM ĐIỂM SẮP DIỄN RA)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Chỉ lấy trận đấu thuộc khối Tâm Điểm Live & Tâm Điểm Sắp Diễn Ra (Lọc 6h).",
        "version": "1.8.0",
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

// Xóa cúp 🏆, bỏ prefix [Tên giải đấu], chỉ giữ tên 2 đội
function cleanMatchTitle(rawTitle) {
    if (!rawTitle) return "Trực tiếp Bóng Đá";
    return rawTitle
        .replace(/🏆/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/LIVE/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Tạo Bìa phim SVG hiển thị Tên Giải Đấu
function createLeaguePoster(leagueName) {
    var name = (leagueName || "GIẢI ĐẤU KHÁC").toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">' +
        '<rect width="100%" height="100%" fill="#161925"/>' +
        '<circle cx="150" cy="160" r="45" fill="#222738"/>' +
        '<text x="150" y="168" dominant-baseline="middle" text-anchor="middle" font-size="32">🏆</text>' +
        '<text x="150" y="240" dominant-baseline="middle" text-anchor="middle" fill="#00FF88" font-size="14" font-weight="bold" font-family="sans-serif">GIẢI ĐẤU</text>' +
        '<text x="150" y="270" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold" font-family="sans-serif">' + name + '</text>' +
        '</svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// Parse "HH:mm DD/MM" ra timestamp ms
function parseDateTimeToTimestamp(dateStr) {
    if (!dateStr) return 0;
    try {
        var parts = dateStr.trim().split(/\s+/);
        var timeParts = parts[0].split(':');
        var hours = parseInt(timeParts[0], 10);
        var minutes = parseInt(timeParts[1], 10);

        var now = new Date();
        var day = now.getDate();
        var month = now.getMonth();

        if (parts.length > 1 && parts[1].indexOf('/') !== -1) {
            var dParts = parts[1].split('/');
            day = parseInt(dParts[0], 10);
            month = parseInt(dParts[1], 10) - 1;
        }

        var matchDate = new Date(now.getFullYear(), month, day, hours, minutes, 0);
        return matchDate.getTime();
    } catch (e) {
        return 0;
    }
}

// =============================================================================
// DANH MỤC & CẤU HÌNH
// =============================================================================

function getHomeSections() {
    return JSON.stringify([{ slug: 'live', title: '🔥 Tâm Điểm Live & Tâm Điểm Sắp Diễn Ra', type: 'List' }]);
}
function getPrimaryCategories() {
    return JSON.stringify([{ name: '🔥 Trận Đấu Tâm Điểm', slug: 'live' }]);
}
function getFilterConfig() { return JSON.stringify({}); }
function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BÓC TÁCH DỮ LIỆU (CẮT BỎ CỘT "DANH SÁCH TRẬN ĐẤU")
// =============================================================================

function parseListResponse(html, url) {
    try {
        var rawItems = [];
        var nowMs = new Date().getTime();
        var SIX_HOURS_MS = 6 * 60 * 60 * 1000;

        // 1. Tìm vị trí xuất hiện của 2 khối Tâm Điểm
        var liveSectionIdx = html.search(/tâm\s*điểm\s*đang\s*live/i);
        var upcomingSectionIdx = html.search(/tâm\s*điểm\s*sắp\s*diễn\s*ra/i);

        var startCut = -1;
        if (liveSectionIdx !== -1 && upcomingSectionIdx !== -1) {
            startCut = Math.min(liveSectionIdx, upcomingSectionIdx);
        } else if (liveSectionIdx !== -1) {
            startCut = liveSectionIdx;
        } else if (upcomingSectionIdx !== -1) {
            startCut = upcomingSectionIdx;
        }

        // Nếu tìm thấy mốc Tâm Điểm, cắt bỏ phần trước đó (chứa "DANH SÁCH TRẬN ĐẤU")
        var targetHtml = (startCut !== -1) ? html.substring(startCut) : html;

        var itemRegex = /<(button|div)[^>]*class="[^"]*(js-match-btn|match-item|card)[^"]*"([\s\S]*?)>([\s\S]*?)<\/\1>/gi;
        var match;

        while ((match = itemRegex.exec(targetHtml)) !== null) {
            var attrBlock = match[3];
            var innerContent = match[4];

            // Bỏ trận đã kết thúc
            var isFinished = innerContent.indexOf('Đã xong') !== -1 || 
                             innerContent.indexOf('status-ended') !== -1 || 
                             innerContent.indexOf('Kết thúc') !== -1 || 
                             innerContent.indexOf('FT') !== -1;

            if (isFinished) continue;

            // Kiểm tra trạng thái Live / Sắp Live
            var isLive = innerContent.indexOf('status-live') !== -1 || 
                         innerContent.indexOf('🟢 Live') !== -1 || 
                         innerContent.indexOf('ON') !== -1;

            var isUpcoming = innerContent.indexOf('Sắp Live') !== -1 || 
                             innerContent.indexOf('status-upcoming') !== -1 || 
                             innerContent.indexOf('⏳') !== -1;

            if (!isLive && !isUpcoming) continue;

            // Bóc tách thuộc tính
            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);

            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "GIẢI ĐẤU KHÁC";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            var weight = 0;
            var episodeParts = [];

            if (time) episodeParts.push("🕒 " + time);

            if (isLive) {
                var liveStatus = "🟢 LIVE";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                if (score) episodeParts.push("⚽ " + score);

                // Ưu tiên cao nhất cho Trận Live trong khối Tâm Điểm
                weight = 3000000000000 + (parseInt(minute, 10) || 0);
            } else {
                var matchTimeMs = parseDateTimeToTimestamp(time);
                var diffMs = matchTimeMs - nowMs;

                // Giữ lại các trận sắp diễn ra trong vòng 6 tiếng
                if (diffMs < -15 * 60 * 1000 || diffMs > SIX_HOURS_MS) {
                    continue;
                }

                episodeParts.push("⏳ Sắp Live");
                weight = 1500000000000 - matchTimeMs;
            }

            var episodeCurrent = episodeParts.join(" • ");
            var posterImage = createLeaguePoster(league);

            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            rawItems.push({
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": cleanTitle, // Tên gọn chỉ có 2 đội
                    "posterUrl": posterImage, // Ảnh bìa hiển thị tên Giải đấu
                    "backdropUrl": posterImage,
                    "quality": isLive ? "🔥 TÂM ĐIỂM LIVE" : "⏳ SẮP LIVE",
                    "episode_current": episodeCurrent
                }
            });
        }

        // Sắp xếp: Tâm điểm đang Live lên đầu, sau đó đến Tâm điểm Sắp Live
        rawItems.sort(function(a, b) { return b.weight - a.weight; });
        var finalItems = rawItems.map(function(w) { return w.item; });

        return JSON.stringify({
            "items": finalItems,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });

    } catch (e) {
        log("Lỗi parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html, ""); }

// =============================================================================
// CHI TIẾT & CHIẾU WEBVIEW
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Bóng Đá";

        var episodes = [];

        if (data && data.sources && data.sources.length > 0) {
            for (var i = 0; i < data.sources.length; i++) {
                var s = data.sources[i];
                episodes.push({
                    id: (s.link || data.mainUrl) + "#embed_play",
                    name: "🌐 " + (s.name || ("Kênh " + (i + 1))),
                    slug: "channel-" + i
                });
            }
        } else {
            episodes.push({
                id: (data && data.mainUrl ? data.mainUrl : BASEURL) + "#embed_play",
                name: "🌐 Xem Trực Tiếp (WebView)",
                slug: "channel-main"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: createLeaguePoster(data ? data.league : ""),
            backdropUrl: "",
            description: "Trực tiếp bóng đá chất lượng cao.",
            servers: [{ name: "Danh Sách Bình Luận Viên / Kênh Live", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{ name: "WebView Server", episodes: [{ id: BASEURL + "#embed_play", name: "Xem Ngay", slug: "main" }] }]
        });
    }
}

function parseDetailResponse(html, url) {
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
