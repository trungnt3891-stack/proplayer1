// =============================================================================
// PLUGIN VAX: TINHLAGI TV (ƯU TIÊN SẮP XẾP GẦN THỜI GIAN THỰC + LẤY LOGO CHUẨN)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "bongdatv",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Ưu tiên trận gần thời gian thực lên đầu, lấy logo chuẩn từ data-sources).",
        "version": "1.8.3",
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

// Chuyển chuỗi "HH:mm DD/MM" thành timestamp ms chính xác
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

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live_group', title: '🔥 Tâm Điểm Live Đang Diễn Ra', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Trận Đấu Sắp Diễn Ra', type: 'List' }
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
// PARSE DANH SÁCH & SẮP XẾP SÁT THỜI GIAN THỰC NHẤT
// =============================================================================

function parseListResponse(html, url) {
    try {
        var currentSlug = "live_group";
        if (url && url.indexOf("upcoming_group") !== -1) {
            currentSlug = "upcoming_group";
        }

        var liveItems = [];
        var upcomingItems = [];
        
        // Quét các nút trận đấu từ HTML cấu trúc mới (match-btn)
        var itemRegex = /<button[^>]*class="[^"]*match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;

        var nowMs = new Date().getTime();
        var SIX_HOURS_MS = 6 * 60 * 60 * 1000;

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);
            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu khác";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var parsedSources = [];
            if (sourcesMatch) {
                try { 
                    parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); 
                } catch (e) {}
            }

            // Lấy ảnh logo chuẩn từ cấu trúc data-sources nếu có
            var posterUrl = "";
            if (parsedSources.length > 0 && parsedSources[0].logo) {
                posterUrl = parsedSources[0].logo;
            } else {
                var imgMatch = innerContent.match(/<img[^>]+src="([^">]+)"/i);
                if (imgMatch && imgMatch[1]) {
                    posterUrl = decodeEntities(imgMatch[1]);
                }
            }

            var isLive = innerContent.indexOf('status-live') !== -1 || 
                         innerContent.indexOf('🟢 Live') !== -1;

            var matchTimeMs = parseDateTimeToTimestamp(time);
            
            // Tính khoảng cách thời gian so với hiện tại để ưu tiên đưa trận sát giờ thực lên đầu
            var timeDiffFromNow = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;

            var episodeParts = [];
            if (time) episodeParts.push("🕒 " + time);

            var itemObj = { weight: 0, item: {} };
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            if (isLive || timeDiffFromNow < 2 * 60 * 60 * 1000) {
                var liveStatus = isLive ? "🟢 LIVE" : "⚽ ĐANG DIỄN RA";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                if (score) episodeParts.push("⚽ " + score);

                // Trọng số ưu tiên nhóm Live: thời gian càng gần hiện tại càng lớn
                itemObj.weight = 3000000000000 - timeDiffFromNow;
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                liveItems.push(itemObj);
            } else {
                var diffMs = matchTimeMs - nowMs;
                if (diffMs > SIX_HOURS_MS && diffMs < 0) {
                    continue; 
                }

                episodeParts.push("⏳ Sắp Live");
                
                // Trọng số nhóm Sắp diễn ra: trận nào diễn ra sớm hơn (gần tới giờ hơn) được đẩy lên trên
                itemObj.weight = 1000000000000 - timeDiffFromNow;
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "SẮP LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                upcomingItems.push(itemObj);
            }
        }

        // Sắp xếp giảm dần theo trọng số (trận gần thời gian thực nhất lên đầu)
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
