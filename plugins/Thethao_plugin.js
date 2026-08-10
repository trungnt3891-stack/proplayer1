// =============================================================================
// PLUGIN VAX: TINHLAGI TV (POSTER BẢNG ĐIỂM + SẮP XẾP SẮP DIỄN RA CHUẨN)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "bongdatv",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Hiển thị Bảng Điểm Live/Tỉ số, Danh sách Sắp Live chuẩn).",
        "version": "1.8.6",
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
// TẠO ẢNH BÌA DẠNG BẢNG ĐIỂM (100% SVG CƠ BẢN ĐỂ KHÔNG BỊ ĐEN)
// =============================================================================
function createMatchPoster(title, score, minute, time, league, isLive) {
    var bg = '#0f172a'; // Nền xanh đen
    var textColor = '#ffffff';
    var accentColor = '#38bdf8';
    
    // Tách tên đội từ Title (Ví dụ: "Arsenal vs Chelsea")
    var teams = title.split(' vs ');
    var home = teams[0] ? teams[0].trim() : "Đội Nhà";
    var away = teams[1] ? teams[1].trim() : "Đội Khách";
    
    // Cắt tên nếu quá dài để không tràn ảnh
    if(home.length > 25) home = home.substring(0, 22) + "...";
    if(away.length > 25) away = away.substring(0, 22) + "...";
    
    if(!score || score.trim() === "") score = "VS";
    
    var statusText = isLive ? ("🔴 LIVE " + (minute ? minute + "'" : "")) : ("⏳ " + time);
    var statusColor = isLive ? "#ef4444" : "#fbbf24";

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
        '<rect width="800" height="450" fill="' + bg + '"/>' +
        // Thanh header
        '<rect x="0" y="0" width="800" height="80" fill="#1e293b"/>' +
        '<text x="400" y="50" fill="' + accentColor + '" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + league.toUpperCase() + '</text>' +
        // Tên Đội Nhà
        '<text x="400" y="160" fill="' + textColor + '" font-size="45" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + home + '</text>' +
        // Tỉ số
        '<rect x="300" y="200" width="200" height="70" rx="35" fill="#1e293b"/>' +
        '<text x="400" y="250" fill="#fbbf24" font-size="45" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + score + '</text>' +
        // Tên Đội Khách
        '<text x="400" y="350" fill="' + textColor + '" font-size="45" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + away + '</text>' +
        // Trạng thái (Live / Sắp Live)
        '<text x="400" y="420" fill="' + statusColor + '" font-size="26" font-family="sans-serif" font-weight="bold" text-anchor="middle">' + statusText + '</text>' +
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
function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DANH SÁCH & CHIA LỌC ĐÚNG THẺ
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
        
        // Quét toàn bộ các thẻ có class js-match-btn (Cả thẻ article bên mục Tâm Điểm và thẻ button bên Sidebar)
        var itemRegex = /<(button|article)[^>]*js-match-btn[^>]*>([\s\S]*?)<\/\1>/gi;
        var match;

        while ((match = itemRegex.exec(html)) !== null) {
            var fullHtml = match[0]; // Chứa cả thẻ ngoài cùng và thuộc tính
            var innerHtml = match[2];

            // 1. Kiểm tra trạng thái từ class/text
            var isFinished = fullHtml.indexOf('Đã xong') !== -1 || fullHtml.indexOf('status-ended') !== -1;
            if (isFinished) continue;

            // Bắt cờ "Sắp Live" hoặc "Live"
            var isLive = fullHtml.indexOf('🟢 Live') !== -1 || fullHtml.indexOf('status-live') !== -1;
            var isUpcoming = fullHtml.indexOf('⏳ Sắp Live') !== -1 || fullHtml.indexOf('status-upcoming') !== -1;

            if (!isLive && !isUpcoming) continue;

            // 2. Trích xuất thông tin
            var urlMatch = fullHtml.match(/data-url="([^"]*)"/i);
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            
            // Tránh trùng lặp trận
            if (!streamUrl || addedUrls[streamUrl]) continue;
            addedUrls[streamUrl] = true;

            var titleMatch = fullHtml.match(/data-title="([^"]*)"/i);
            var scoreMatch = fullHtml.match(/data-score="([^"]*)"/i);
            var minuteMatch = fullHtml.match(/data-minute="([^"]*)"/i);
            var timeMatch = fullHtml.match(/data-time="([^"]*)"/i);
            var leagueMatch = fullHtml.match(/data-league="([^"]*)"/i);
            var sourcesMatch = fullHtml.match(/data-sources="([^"]*)"/i);

            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);
            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu khác";
            var score = scoreMatch && scoreMatch[1] ? decodeEntities(scoreMatch[1]).trim() : "VS";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var matchTimeMs = parseDateTimeToTimestamp(time);

            var parsedSources = [];
            if (sourcesMatch) {
                try { parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); } catch (e) {}
            }

            // Gọi hàm tạo Bảng điểm SVG
            var posterImage = createMatchPoster(cleanTitle, score, minute, time, league, isLive);

            var episodeParts = [];
            if (time) episodeParts.push("🕒 " + time);

            var itemObj = { matchTimeMs: matchTimeMs, item: {} };
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            // 3. Phân chia mảng
            if (isLive) {
                var liveStatus = "🔴 LIVE";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": "ĐANG LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                liveItems.push(itemObj);
            } else if (isUpcoming) {
                episodeParts.push("⏳ Sắp Live");
                
                itemObj.item = {
                    "id": itemUrl,
                    "title": cleanTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": "SẮP LIVE",
                    "episode_current": episodeParts.join(" • ")
                };
                upcomingItems.push(itemObj);
            }
        }

        // 4. Sắp xếp danh sách
        // Live: Trận nào có matchTimeMs nhỏ (đã đá lâu) xếp dưới, mới đá xếp trên -> Giảm dần
        liveItems.sort(function(a, b) { return b.matchTimeMs - a.matchTimeMs; });
        
        // Sắp diễn ra: Trận nào gần tới giờ nhất (matchTimeMs nhỏ nhất) xếp LÊN ĐẦU -> Tăng dần
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
// CHI TIẾT & GIAO DIỆN
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
            posterUrl: "https://tinhlagi.pro/logo.jpg",
            backdropUrl: "",
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
