// =============================================================================
// PLUGIN VAX: TINHLAGI TV (FIXED WEBVIEW ROUTING & TIME SORTING)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Xem bóng đá trực tiếp WebView, tự động lọc trận cũ và ưu tiên trận live/chuẩn bị đá.",
        "version": "1.3.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "layoutType": "GRID",
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[TinhlagiTV] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[TinhlagiTV] " + msg);
    }
}

function decodeEntities(encodedString) {
    if (!encodedString) return "";
    return encodedString
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

// Chuyển thời gian HH:mm thành số phút
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return -1;
    var parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return -1;
}

// Trích xuất dữ liệu từ URL Hash Fragment
function parseDataFromHash(url) {
    try {
        var hashIdx = url.indexOf("#data=");
        if (hashIdx !== -1) {
            var rawJson = decodeURIComponent(url.substring(hashIdx + 6));
            return JSON.parse(rawJson);
        }
    } catch (e) {
        log("Lỗi decode Hash Data: " + e);
    }
    return null;
}

// =============================================================================
// BỘ LỌC & DANH MỤC
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live', title: '🔥 Trực Tiếp & Sắp Diễn Ra', type: 'Grid' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '🔥 Trực Tiếp & Sắp Diễn Ra', slug: 'live' }
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
// LỌC VÀ SẮP XẾP TRẬN ĐẤU (ƯU TIÊN LIVE & TRẬN GẦN HIỆN TẠI)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var rawItems = [];
        var btnRegex = /<button[^>]*class="[^"]*js-match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;

        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();

        while ((match = btnRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            // 1. Loại bỏ trận đã kết thúc
            if (innerContent.indexOf('status-ended') !== -1 || 
                innerContent.indexOf('Kết thúc') !== -1 || 
                innerContent.indexOf('FT') !== -1) {
                continue;
            }

            var isLive = innerContent.indexOf('status-live') !== -1 || innerContent.indexOf('🟢 Live') !== -1;

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "Trực tiếp Bóng Đá";
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

            // 2. Tính trọng số ưu tiên (Weight) để sắp xếp
            var weight = 0;
            var matchMinutes = parseTimeToMinutes(time);

            if (isLive) {
                // Đang Live: Đẩy lên đầu bảng (Weight lớn nhất)
                weight = 100000 + (parseInt(minute, 10) || 0);
            } else if (matchMinutes !== -1) {
                var diff = matchMinutes - currentMinutes;
                if (diff >= -60 && diff <= 300) {
                    // Trận sắp đá trong vòng 5 tiếng tới hoặc mới bắt đầu ít phút
                    weight = 50000 - Math.abs(diff);
                } else if (diff < -60) {
                    // Trận đã trôi qua quá lâu trong ngày -> Bỏ qua không hiển thị
                    continue;
                } else {
                    // Trận đá muộn hơn trong ngày
                    weight = 10000 - diff;
                }
            }

            var episodeCurrent = isLive ? ("🟢 LIVE " + (minute ? minute + "'" : "")) : ("🕒 " + (time || "Sắp đá"));
            if (score) episodeCurrent += " • ⚽ " + score;

            // Tạo Payload và gắn vào Hash Fragment để không làm hỏng URL
            var payload = {
                title: title,
                mainUrl: streamUrl,
                sources: parsedSources
            };

            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            rawItems.push({
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": title,
                    "posterUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "backdropUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "quality": isLive ? "LIVE" : (time || "UPCOMING"),
                    "episode_current": episodeCurrent
                }
            });
        }

        // Sắp xếp các trận đấu theo trọng số giảm dần
        rawItems.sort(function(a, b) {
            return b.weight - a.weight;
        });

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
// CHI TIẾT TRẬN ĐẤU & KÊNH PHÁT
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Bóng Đá";
        var episodes = [];

        if (data && data.sources && data.sources.length > 0) {
            for (var i = 0; i < data.sources.length; i++) {
                var s = data.sources[i];
                var targetLink = s.link || data.mainUrl;
                episodes.push({
                    id: targetLink + "#embed_play",
                    name: "🌐 " + (s.name || ("Kênh " + (i + 1))),
                    slug: "channel-" + i
                });
            }
        } else if (data && data.mainUrl) {
            episodes.push({
                id: data.mainUrl + "#embed_play",
                name: "🌐 Xem Trực Tiếp (WebView)",
                slug: "channel-main"
            });
        } else {
            episodes.push({
                id: BASEURL + "#embed_play",
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
            servers: [
                {
                    name: "Danh Sách Bình Luận Viên / Kênh Live",
                    episodes: episodes
                }
            ]
        });
    } catch (e) {
        log("Lỗi parseMovieDetail: " + e);
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Bóng Đá",
            servers: [{
                name: "WebView Server",
                episodes: [{ id: BASEURL + "#embed_play", name: "Xem Ngay", slug: "main" }]
            }]
        });
    }
}

// =============================================================================
// XỬ LÝ PHÁT WEBVIEW (IS EMBED)
// =============================================================================

function parseDetailResponse(html, url) {
    // Loại bỏ marker hash trước khi gửi sang WebView
    var cleanUrl = url.split('#')[0];
    if (!cleanUrl || cleanUrl.indexOf('http') !== 0) {
        cleanUrl = BASEURL;
    }

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

function parseEmbedResponse(html, url) {
    return parseDetailResponse(html, url);
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
