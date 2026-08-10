// =============================================================================
// PLUGIN VAX: TINHLAGI TV (SẮP XẾP CHUẨN THỜI GIAN THỰC + POSTER BẢNG ĐIỂM LIVE)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "bongdatv",
        "name": "TV - Thể Thao Pro",
        "description": "Trực tiếp bóng đá (Hiển thị Bảng Điểm Live/Tỉ số, Sắp xếp trận gần nhất lên đầu).",
        "version": "1.8.5",
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

// TẠO ẢNH BÌA DẠNG BẢNG ĐIỂM (Giống ảnh mẫu bạn gửi)
function createMatchPoster(homeName, awayName, homeLogo, awayLogo, score, minute, time, league, isLive) {
    var bg = '#0f172a'; // Màu nền xanh đen
    var panelBg = '#1e293b'; // Màu khối nổi
    
    // Ảnh mặc định nếu không bắt được Logo
    homeLogo = homeLogo || 'https://tinhlagi.pro/logo.jpg';
    awayLogo = awayLogo || 'https://tinhlagi.pro/logo.jpg';
    score = score || 'VS';
    
    var statusColor = isLive ? '#ef4444' : '#94a3b8';
    var statusText = isLive ? '🔴 LIVE ' + (minute ? minute + "'" : "") : time;
    
    // Cắt tên nếu quá dài
    var hName = homeName.length > 20 ? homeName.substring(0, 17) + "..." : homeName;
    var aName = awayName.length > 20 ? awayName.substring(0, 17) + "..." : awayName;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
        '<rect width="800" height="450" fill="' + bg + '"/>' +
        // Background Effect
        '<circle cx="400" cy="0" r="350" fill="#3b82f6" opacity="0.15" filter="blur(60px)"/>' +
        // Header
        '<rect x="0" y="0" width="800" height="65" fill="' + panelBg + '" opacity="0.9"/>' +
        '<text x="30" y="40" fill="#f8fafc" font-size="24" font-family="sans-serif" font-weight="bold">' + league + '</text>' +
        '<text x="770" y="40" fill="#f8fafc" font-size="22" font-family="sans-serif" text-anchor="end">' + time + '</text>' +
        // Logos
        '<image href="' + homeLogo + '" x="120" y="110" height="160" width="160" preserveAspectRatio="xMidYMid meet"/>' +
        '<image href="' + awayLogo + '" x="520" y="110" height="160" width="160" preserveAspectRatio="xMidYMid meet"/>' +
        // Team Names
        '<text x="200" y="330" fill="#ffffff" font-size="28" font-family="sans-serif" text-anchor="middle" font-weight="bold">' + hName + '</text>' +
        '<text x="600" y="330" fill="#ffffff" font-size="28" font-family="sans-serif" text-anchor="middle" font-weight="bold">' + aName + '</text>' +
        // Score Board
        '<rect x="310" y="150" width="180" height="80" rx="40" fill="#020617" opacity="0.7"/>' +
        '<text x="400" y="205" fill="#ffffff" font-size="48" font-family="sans-serif" text-anchor="middle" font-weight="bold" letter-spacing="4">' + score + '</text>' +
        // Live / Time Status
        '<text x="400" y="280" fill="' + statusColor + '" font-size="24" font-family="sans-serif" text-anchor="middle" font-weight="bold">' + statusText + '</text>' +
        '</svg>';
        
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live_group', title: '🔥 Tâm Điểm Đang Live', type: 'List' },
        { slug: 'upcoming_group', title: '⏳ Trận Đấu Sắp Diễn Ra', type: 'List' }
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
// PARSE DANH SÁCH & SẮP XẾP CHUẨN THỜI GIAN THỰC
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
        
        var itemRegex = /<button[^>]*class="[^"]*match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;
        var nowMs = new Date().getTime();

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            if (!streamUrl || addedUrls[streamUrl]) continue;

            var isLive = innerContent.indexOf('🟢 Live') !== -1 || innerContent.indexOf('status-live') !== -1;
            var isUpcoming = innerContent.indexOf('⏳ Sắp Live') !== -1 || innerContent.indexOf('status-upcoming') !== -1;

            if (!isLive && !isUpcoming) continue;

            addedUrls[streamUrl] = true;

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            var cleanTitle = cleanMatchTitle(rawTitle);
            
            // Tách Home & Away Team để dán vào ảnh
            var teams = cleanTitle.split(' vs ');
            var homeTeam = teams[0] ? teams[0].trim() : "Đội Nhà";
            var awayTeam = teams[1] ? teams[1].trim() : "Đội Khách";

            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu khác";
            var score = scoreMatch && scoreMatch[1] ? decodeEntities(scoreMatch[1]).trim() : "VS";
            if(score === "") score = "VS";
            
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";
            var matchTimeMs = parseDateTimeToTimestamp(time);

            // Xử lý Bắt Logo Trực Tiếp từ Dữ liệu Json của Web
            var parsedSources = [];
            var homeLogo = "";
            var awayLogo = "";
            
            if (sourcesMatch) {
                try { 
                    parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); 
                    if (parsedSources.length > 0 && parsedSources[0].logo) {
                        var logoUrl = parsedSources[0].logo;
                        var hMatch = logoUrl.match(/home=([^&]+)/);
                        var aMatch = logoUrl.match(/away=([^&]+)/);
                        if(hMatch) homeLogo = decodeURIComponent(hMatch[1]);
                        if(aMatch) awayLogo = decodeURIComponent(aMatch[1]);
                    }
                } catch (e) {}
            }

            // Tự động tạo ảnh Bảng điểm (Poster) bằng thông tin vừa bóc tách
            var posterImage = createMatchPoster(homeTeam, awayTeam, homeLogo, awayLogo, score, minute, time, league, isLive);

            var episodeParts = [];
            if (time) episodeParts.push("🕒 " + time);

            var itemObj = { weight: 0, item: {} };
            var payload = { title: cleanTitle, league: league, mainUrl: streamUrl, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            // SẮP XẾP CHUẨN THỜI GIAN
            if (isLive) {
                var liveStatus = "🔴 LIVE";
                if (minute) liveStatus += " " + minute + "'";
                episodeParts.push(liveStatus);
                if (score !== "VS") episodeParts.push("⚽ " + score);

                // Live: Trận nào vừa mới bắt đầu (matchTimeMs càng lớn) thì càng được ưu tiên đẩy lên đầu
                itemObj.weight = 3000000000000 + matchTimeMs;
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
                
                // Upcoming: Trận nào diễn ra SỚM NHẤT (matchTimeMs nhỏ nhất) thì đẩy lên đầu
                // VD: 18:00 sẽ có Weight lớn hơn 19:00 (1000 - 1800 > 1000 - 1900)
                itemObj.weight = 2000000000000 - matchTimeMs;
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

        // Sắp xếp Giảm dần theo Weight
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
// CHI TIẾT & HIỂN THỊ GIAO DIỆN TRẬN ĐẤU / THÔNG BÁO LỖI
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
            posterUrl: "https://tinhlagi.pro/logo.jpg", // Không cần poster to trong màn hình Detail nữa vì có Player
            backdropUrl: "",
            description: "Hệ thống trực tiếp thể thao tốc độ cao.",
            servers: [{ name: "Danh Sách Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{ name: "Server", episodes: [{ id: BASEURL + "#ended_match", name: "⚠️ Lỗi: Không thể phân tích nguồn phát", slug: "error" }] }]
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
