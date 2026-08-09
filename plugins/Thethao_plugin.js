// =============================================================================
// PLUGIN VAX: TINHLAGI TV (LIST VIEW + GIẢI ĐẤU & GIỜ/NGÀY THI ĐẤU)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Trực tiếp bóng đá (Hiển thị Giải đấu, Ngày/Giờ thi đấu, lọc Live & Sắp diễn ra 6h).",
        "version": "1.6.0",
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

// Chuyển chuỗi "HH:mm DD/MM" thành timestamp ms
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
    return JSON.stringify([{ slug: 'live', title: '⚽ Trực Tiếp & Tâm Điểm Sắp Diễn Ra (Trong 6H)', type: 'List' }]);
}
function getPrimaryCategories() {
    return JSON.stringify([{ name: '⚽ Live & Sắp Diễn Ra (6H)', slug: 'live' }]);
}
function getFilterConfig() { return JSON.stringify({}); }
function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BÓC TÁCH GIẢI ĐẤU, NGÀY/GIỜ & TRẠNG THÁI
// =============================================================================

function parseListResponse(html, url) {
    try {
        var rawItems = [];
        var itemRegex = /<(button|div)[^>]*class="[^"]*(js-match-btn|match-item|card)[^"]*"([\s\S]*?)>([\s\S]*?)<\/\1>/gi;
        var match;

        var nowMs = new Date().getTime();
        var SIX_HOURS_MS = 6 * 60 * 60 * 1000;

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[3];
            var innerContent = match[4];

            // 1. Loại bỏ các trận đã kết thúc ("Đã xong", status-ended, FT)
            var isFinished = innerContent.indexOf('Đã xong') !== -1 || 
                             innerContent.indexOf('status-ended') !== -1 || 
                             innerContent.indexOf('Kết thúc') !== -1 || 
                             innerContent.indexOf('FT') !== -1;

            if (isFinished) continue;

            // 2. Phân loại LIVE / SẮP LIVE
            var isLive = innerContent.indexOf('status-live') !== -1 || 
                         innerContent.indexOf('🟢 Live') !== -1 || 
                         innerContent.indexOf('ON') !== -1;

            var isUpcoming = innerContent.indexOf('Sắp Live') !== -1 || 
                             innerContent.indexOf('status-upcoming') !== -1 || 
                             innerContent.indexOf('⏳') !== -1;

            if (!isLive && !isUpcoming) continue;

            // 3. Trích xuất thuộc tính metadata
            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            if (!title) {
                var cleanText = innerContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText.length > 5) title = cleanText.substring(0, 60);
                else title = "Trực tiếp Bóng Đá";
            }

            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "GIẢI ĐẤU KHÁC";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : ""; // Dạng "20:00 09/08"

            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            // 4. Lọc mốc thời gian 6 tiếng
            var weight = 0;
            var episodeParts = [];

            // Luôn đưa thời gian (Giờ & Ngày) lên vị trí rõ ràng
            if (time) {
                episodeParts.push("🕒 " + time);
            }

            if (isLive) {
                weight = 2000000000000 + (parseInt(minute, 10) || 0);
                var liveStatus = "🟢 LIVE";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                if (score) episodeParts.push("⚽ " + score);
            } else {
                var matchTimeMs = parseDateTimeToTimestamp(time);
                var diffMs = matchTimeMs - nowMs;

                // Bỏ qua trận vượt quá 6 tiếng hoặc quá cũ
                if (diffMs < -15 * 60 * 1000 || diffMs > SIX_HOURS_MS) {
                    continue;
                }

                weight = 1000000000000 - matchTimeMs;
                episodeParts.push("⏳ Sắp Live");
            }

            // Tiêu đề hiển thị kèm tên giải đấu
            var displayTitle = "🏆 [" + league + "] " + title;
            var episodeCurrent = episodeParts.join(" • ");

            var payload = { title: title, league: league, mainUrl: streamUrl, sources: parsedSources };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            rawItems.push({
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": displayTitle,
                    "posterUrl": "",
                    "backdropUrl": "",
                    "quality": isLive ? "LIVE" : "SẮP LIVE",
                    "episode_current": episodeCurrent
                }
            });
        }

        // Sắp xếp ưu tiên: Live ở trên, Sắp Live gần nhất tiếp theo
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
        if (data && data.league) title = "[" + data.league + "] " + title;

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
            posterUrl: "",
            backdropUrl: "",
            description: "Xem bóng đá WebView tốc độ cao.",
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
