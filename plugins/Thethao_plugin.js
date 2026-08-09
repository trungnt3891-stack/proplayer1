// =============================================================================
// PLUGIN VAX: TINHLAGI TV (LỌC TRẬN "ĐÃ XONG" & SẮP XẾP LIVE/SẮP LIVE)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Chỉ lọc các trận đang LIVE và Tâm điểm sắp diễn ra (WebView Mode).",
        "version": "1.4.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "layoutType": "GRID",
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

// Chuyển chuỗi "HH:mm DD/MM" thành Timestamp để sắp xếp thứ tự
function parseDateTimeToTimestamp(dateStr) {
    if (!dateStr) return 9999999999;
    try {
        var parts = dateStr.trim().split(' ');
        var timeParts = parts[0].split(':');
        var now = new Date();
        var day = now.getDate();
        var month = now.getMonth() + 1;

        if (parts.length > 1 && parts[1].indexOf('/') !== -1) {
            var dateParts = parts[1].split('/');
            day = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10);
        }

        var matchDate = new Date(now.getFullYear(), month - 1, day, parseInt(timeParts[0], 10), parseInt(timeParts[1], 10));
        return matchDate.getTime();
    } catch (e) {
        return 9999999999;
    }
}

// =============================================================================
// DANH MỤC & CẤU HÌNH
// =============================================================================

function getHomeSections() {
    return JSON.stringify([{ slug: 'live', title: '🔥 Đang Live & Tâm Điểm Sắp Diễn Ra', type: 'Grid' }]);
}
function getPrimaryCategories() {
    return JSON.stringify([{ name: '🔥 Trực Tiếp & Sắp Diễn Ra', slug: 'live' }]);
}
function getFilterConfig() { return JSON.stringify({}); }
function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BÓC TÁCH VÀ LỌC TRẬN ĐẤU (LOẠI BỎ "ĐÃ XONG")
// =============================================================================

function parseListResponse(html, url) {
    try {
        var rawItems = [];
        // Match cả button trận đấu và các thẻ card trong mục "Tâm điểm sắp diễn ra"
        var itemRegex = /<(button|div)[^>]*class="[^"]*(js-match-btn|match-item|card)[^"]*"([\s\S]*?)>([\s\S]*?)<\/\1>/gi;
        var match;

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[3];
            var innerContent = match[4];

            // 1. LỌC TUYỆT ĐỐI CÁC TRẬN "ĐÃ XONG" / FT / ENDED
            var isFinished = innerContent.indexOf('Đã xong') !== -1 || 
                             innerContent.indexOf('status-ended') !== -1 || 
                             innerContent.indexOf('Kết thúc') !== -1 || 
                             innerContent.indexOf('FT') !== -1;

            if (isFinished) continue; // Bỏ qua ngay lập tức

            // 2. Nhận diện trạng thái LIVE hoặc SẮP LIVE
            var isLive = innerContent.indexOf('status-live') !== -1 || 
                         innerContent.indexOf('🟢 Live') !== -1 || 
                         innerContent.indexOf('ON') !== -1;

            var isUpcoming = innerContent.indexOf('Sắp Live') !== -1 || 
                             innerContent.indexOf('status-upcoming') !== -1 || 
                             innerContent.indexOf('⏳') !== -1;

            // Nếu không thuộc 2 trạng thái này thì bỏ qua
            if (!isLive && !isUpcoming) continue;

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            if (!title) {
                // Fallback lấy title từ text HTML nếu không có data-title
                var cleanText = innerContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText.length > 5) title = cleanText.substring(0, 60);
                else title = "Trực tiếp Bóng Đá";
            }

            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            // 3. Tính điểm ưu tiên (Weight)
            var weight = 0;
            var episodeCurrent = "";

            if (isLive) {
                // Ưu tiên 1: Các trận ĐANG LIVE xếp trên cùng
                weight = 2000000000000 + (parseInt(minute, 10) || 0);
                episodeCurrent = "🟢 LIVE " + (minute ? minute + "'" : "");
                if (score) episodeCurrent += " • ⚽ " + score;
            } else {
                // Ưu tiên 2: Trận SẮP LIVE xếp tiếp theo (trận nào diễn ra sớm hơn xếp trước)
                var matchTime = parseDateTimeToTimestamp(time);
                weight = 1000000000000 - matchTime;
                episodeCurrent = "⏳ Sắp Live " + (time ? "• " + time : "");
            }

            var payload = { title: title, mainUrl: streamUrl, sources: parsedSources };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            rawItems.push({
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": title,
                    "posterUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "backdropUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "quality": isLive ? "LIVE" : "SẮP LIVE",
                    "episode_current": episodeCurrent
                }
            });
        }

        // Sắp xếp các trận giảm dần theo trọng số Weight
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
// CHI TIẾT VÀ NGUỒN PHÁT WEBVIEW
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
            posterUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            backdropUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            description: "Chế độ phát WebView tốc độ cao.",
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
