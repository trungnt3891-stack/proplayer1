// =============================================================================
// PLUGIN VAX: TINHLAGI TV (SẮP XẾP ƯU TIÊN GẦN THỜI GIAN THỰC NHẤT)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "bongdatv",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Sắp xếp ưu tiên các trận gần thời gian thực lên đầu).",
        "version": "1.8.2",
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
    return rawTitle
        .replace(/🏆/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/LIVE/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Chuyển chuỗi thời gian sang timestamp ms chính xác
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

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live_group', title: '🔥 Tâm Điểm Live Đang Diễn Ra', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Trận Đấu Sắp Diễn Ra (Trong 6H)', type: 'List' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '🔥 Tâm Điểm Live', slug: 'live_group' },
        { name: '⏳ Sắp Diễn Ra', slug: 'upcoming_group' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }
function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DANH SÁCH & SẮP XẾP ƯU TIÊN GẦN THỜI GIAN THỰC NHẤT
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentSlug = "live_group";
        if (url && url.indexOf("upcoming_group") !== -1) {
            currentSlug = "upcoming_group";
        }

        var liveItems = [];
        var upcomingItems = [];
        
        var itemRegex = /<(button|div)[^>]*class="[^"]*(js-match-btn|match-item|card)[^"]*"([\s\S]*?)>([\s\S]*?)<\/\1>/gi;
        var match;

        var nowMs = new Date().getTime();
        var SIX_HOURS_MS = 6 * 60 * 60 * 1000;
        var tamDiemPos = html.search(/tâm\s*điểm\s*đang\s*live/i);

        while ((match = itemRegex.exec(html)) !== null) {
            var matchIndex = match.index;
            var attrBlock = match[3];
            var innerContent = match[4];

            var isFinished = innerContent.indexOf('Đã xong') !== -1 || 
                             innerContent.indexOf('status-ended') !== -1 || 
                             innerContent.indexOf('Kết thúc') !== -1 || 
                             innerContent.indexOf('FT') !== -1 ||
                             innerContent.indexOf('Đã kết thúc') !== -1;

            var isLive = innerContent.indexOf('status-live') !== -1 || 
                         innerContent.indexOf('🟢 Live') !== -1 || 
                         innerContent.indexOf('ON') !== -1;

            var isUpcoming = innerContent.indexOf('Sắp Live') !== -1 || 
                             innerContent.indexOf('status-upcoming') !== -1 || 
                             innerContent.indexOf('⏳') !== -1;

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

            var posterUrl = "";
            var imgMatch = innerContent.match(/<img[^>]+src="([^">]+)"/i);
            if (imgMatch && imgMatch[1]) {
                posterUrl = decodeEntities(imgMatch[1]);
            }

            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            var episodeParts = [];
            if (time) episodeParts.push("🕒 " + time);

            var matchTimeMs = parseDateTimeToTimestamp(time);
            
            // Tính khoảng cách tuyệt đối đến thời gian hiện tại (tính bằng ms)
            // Trận nào có khoảng cách thời gian nhỏ nhất (gần giờ hiện tại nhất) sẽ nhận giá trị trọng số ưu tiên lớn nhất
            var timeDiffFromNow = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;

            var itemObj = { weight: 0, item: {} };
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            if (isLive || (!isUpcoming && !isFinished && timeDiffFromNow < 2 * 60 * 60 * 1000)) {
                var liveStatus = isLive ? "🟢 LIVE" : "⚽ ĐANG DIỄN RA";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                if (score) episodeParts.push("⚽ " + score);

                // Trọng số ưu tiên cho nhóm Live, đồng thời đưa trận có thời gian gần hiện tại lên trên cùng
                itemObj.weight = 3000000000000 - timeDiffFromNow + (isHot ? 500000000 : 0);
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": isHot ? "🔥 TÂM ĐIỂM" : "LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                liveItems.push(itemObj);
            } else {
                var diffMs = matchTimeMs - nowMs;
                if (diffMs > SIX_HOURS_MS && !isHot) {
                    continue; // Bỏ qua các trận quá xa (trừ trận hot)
                }

                episodeParts.push(isFinished ? "⚠️ Đã xong" : "⏳ Sắp Live");
                
                // Trọng số ưu tiên nhóm Sắp diễn ra: trận nào đến giờ nhanh hơn sẽ được đẩy lên trên
                itemObj.weight = 1000000000000 - timeDiffFromNow + (isHot ? 500000000 : 0);
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": isFinished ? "ĐÃ XONG" : "SẮP LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                upcomingItems.push(itemObj);
            }
        }

        // Sắp xếp giảm dần theo trọng số (trận nào gần thời gian thực nhất sẽ đứng đầu)
        liveItems.sort(function(a, b) { return b.weight - a.weight; });
        upcomingItems.sort(function(a, b) { return b.weight - a.weight; });

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
// CHI TIẾT & HIỂN THỊ GIAO DIỆN TRẬN ĐẤU
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Bóng Đá";
        if (data && data.league) title = "[" + data.league + "] " + title;

        var episodes = [];
        var hasSources = data && data.sources && data.sources.length > 0;
        var mainUrl = data && data.mainUrl ? data.mainUrl : BASEURL;

        if (!hasSources) {
            episodes.push({
                id: BASEURL + "#ended_match",
                name: "⚠️ Trận đấu đã kết thúc. Cám ơn quý khán giả đã theo dõi",
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
            posterUrl: data && data.posterUrl ? data.posterUrl : "",
            backdropUrl: "",
            description: "Hệ thống trực tiếp thể thao tốc độ cao.",
            servers: [{ name: "Danh Sách Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{ name: "Server", episodes: [{ id: BASEURL + "#ended_match", name: "⚠️ Trận đấu đã kết thúc. Cám ơn quý khán giả đã theo dõi", slug: "ended" }] }]
        });
    }
}

function parseDetailResponse(html, url) {
    if (url.indexOf("#ended_match") !== -1) {
        return JSON.stringify({
            url: "about:blank",
            isEmbed: false,
            script: "document.body.style.backgroundColor='#111'; document.body.innerHTML='<div style=\"display:flex;justify-content:center;align-items:center;height:100vh;color:#fff;font-family:sans-serif;text-align:center;padding:20px;\"><div><h2 style=\"color:#00FF88;font-size:24px;margin-bottom:10px;\">TRẬN ĐẤU ĐÃ KẾT THÚC</h2><p style=\"font-size:16px;color:#ccc;\">Cảm ơn quý khán giả đã theo dõi.</p></div></div>';"
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
