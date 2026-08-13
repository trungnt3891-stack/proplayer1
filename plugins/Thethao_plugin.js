// =============================================================================
// PLUGIN VAX: TINHLAGI TV (BÌA SANBONG + PLAY M3U8 NO SIGNAL NẾU LỖI/KẾT THÚC)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";
var DEFAULT_POSTER = "https://tinhlagi.pro/sport/sanbong.jpg";

// Đường link No Signal chính xác từ website
var NO_SIGNAL_LINK = "https://tinhlagi.pro/sport/proxy.php?hash=e84b78ac552063d85e51a15f251ff2c60ace92f9e978c2b716556cafe8c6ece2&referer=https%3A%2F%2Ffreem3u.xyz%2F&url=https%3A%2F%2Ffreem3u.xyz%2Fstatic%2Fno-signal%2Flow.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "ThethaoTV",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Tự động phát link No Signal nếu lỗi hoặc kết thúc).",
        "version": "1.9.2", // Nâng version
        "baseUrl": BASEURL,
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

// TẮT TÍNH NĂNG TÌM KIẾM
function getUrlSearch(keyword, filtersJson) { 
    return ""; 
}

function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DANH SÁCH
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

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[2];
            var innerContent = match[3];

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);

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

            var episodeParts = [];
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            var itemObj = { matchTimeMs: matchTimeMs, item: {} };

            if (isLive) {
                episodeParts.push("🔴 LIVE");
                if (minute) episodeParts.push(minute + "'");
                if (score) episodeParts.push(score);
                if (time) episodeParts.push(time);
                
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": DEFAULT_POSTER,
                    "backdropUrl": DEFAULT_POSTER,
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
                    "posterUrl": DEFAULT_POSTER,
                    "backdropUrl": DEFAULT_POSTER,
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

// TẮT TÍNH NĂNG TÌM KIẾM BẰNG MẢNG RỖNG
function parseSearchResponse(html) { 
    return JSON.stringify({
        "items": [],
        "pagination": { "currentPage": 1, "totalPages": 1 }
    }); 
}

// =============================================================================
// CHI TIẾT & BẮT FALLBACK NO SIGNAL (TỰ CHUYỂN LINK)
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Bóng Đá";
        if (data && data.league) title = "[" + data.league + "] " + title;

        var episodes = [];
        var hasSources = data && data.sources && data.sources.length > 0;
        var mainUrl = data && data.mainUrl ? data.mainUrl : BASEURL;

        // Nếu trận đấu đã kết thúc hoặc không có link, dùng thẳng link NO SIGNAL
        if (!hasSources) {
            episodes.push({
                id: NO_SIGNAL_LINK + "#embed_play",
                name: "⚠️ Đang chờ tín hiệu / Trận đấu kết thúc",
                slug: "no-signal"
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
            description: "Hệ thống trực tiếp thể thao tốc độ cao. Tự động chuyển Màn hình chờ (No Signal) sau 7s nếu lỗi.",
            servers: [{ name: "Danh Sách Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{ name: "Server", episodes: [{ id: NO_SIGNAL_LINK + "#embed_play", name: "⚠️ Lỗi dữ liệu", slug: "error" }] }]
        });
    }
}

function parseDetailResponse(html, url) {
    var cleanUrl = url.split('#')[0];
    if (!cleanUrl || cleanUrl.indexOf('http') !== 0) cleanUrl = BASEURL;

    // Kịch bản đếm ngược: Auto-click lúc 1s, Kiểm tra lúc 7s.
    // Nếu thẻ <video> lỗi hoặc không tải được -> Nhảy sang link No Signal gốc của họ.
    var fallbackScript = "setTimeout(function(){var b=document.querySelector('button, .play, .vjs-big-play-button, .jw-display-icon-display');if(b)b.click();},1000);setTimeout(function(){var v=document.querySelector('video');var fail=false;if(!v)fail=true;else if(v.error)fail=true;else if(v.networkState===3)fail=true;else if(v.readyState===0)fail=true;if(fail){window.location.replace('" + NO_SIGNAL_LINK + "');}},7000);";

    // Vô hiệu hóa script chuyển hướng nếu URL hiện tại ĐÃ LÀ url No Signal, tránh lặp vô tận
    if (cleanUrl.indexOf("freem3u.xyz") !== -1 || cleanUrl.indexOf("no-signal") !== -1) {
        fallbackScript = "";
    }

    return JSON.stringify({
        url: cleanUrl,
        isEmbed: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://tinhlagi.pro/"
        },
        script: fallbackScript,
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
