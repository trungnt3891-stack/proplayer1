// =============================================================================
// PLUGIN VAX: TINHLAGI TV (WEBVIEW MODE + AUTOSORT BY TIME)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Trực tiếp bóng đá WebView tốc độ cao, tự động ưu tiên các trận đấu mới nhất.",
        "version": "1.2.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "layoutType": "GRID",
        "type": "MOVIE",
        "playerType": "embed" // Chuyển sang trình phát Embed/WebView
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

// Chuyển đổi chuỗi HH:mm thành số phút trong ngày để so sánh
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 9999;
    var parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 9999;
}

// =============================================================================
// DANH MỤC & BỘ LỌC
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live', title: '🔥 Trận Đấu Mới Nhất / Đang Live', type: 'Grid' }
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
// LỌC VÀ SẮP XẾP TRẬN ĐẤU THEO THỜI GIAN
// =============================================================================

function parseListResponse(html, url) {
    try {
        var rawItems = [];
        var btnRegex = /<button[^>]*class="[^"]*js-match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;

        // Lấy thời gian hiện tại của thiết bị
        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();

        while ((match = btnRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            // 1. LỌC BỎ TRẬN ĐÃ ĐỐI THOẠI/KẾT THÚC (FT, Ended)
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
            var sourceMatch = attrBlock.match(/data-source="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "Trực tiếp Bóng Đá";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";
            var source = sourceMatch ? decodeEntities(sourceMatch[1]).trim() : "";

            var parsedSources = [];
            if (sourcesMatch) {
                try {
                    parsedSources = JSON.parse(decodeEntities(sourcesMatch[1]));
                } catch (e) {}
            }

            // Tính điểm ưu tiên (Priority Weight) để sắp xếp đẩy lên đầu
            var priorityWeight = 0;
            var matchMinutes = parseTimeToMinutes(time);

            if (isLive) {
                // Đang Live = Ưu tiên cao nhất
                priorityWeight = 20000 + (parseInt(minute, 10) || 0);
            } else {
                // Sắp diễn ra: tính khoảng cách thời gian gần với hiện tại nhất
                var diff = matchMinutes - currentMinutes;
                if (diff >= -30) { 
                    // Các trận chuẩn bị đá hoặc mới đá ít phút
                    priorityWeight = 10000 - Math.abs(diff);
                } else {
                    // Trận quá cũ đã trôi qua nhiều giờ -> cho xuống cuối
                    priorityWeight = 1000 - Math.abs(diff);
                }
            }

            var episodeCurrent = isLive ? ("🟢 LIVE " + (minute ? minute + "'" : "")) : ("🕒 " + (time || "Sắp đá"));
            if (score) episodeCurrent += " • ⚽ " + score;

            var detailPayload = {
                title: title,
                mainUrl: streamUrl,
                sources: parsedSources
            };

            rawItems.push({
                weight: priorityWeight,
                item: {
                    "id": "payload:" + encodeURIComponent(JSON.stringify(detailPayload)),
                    "title": title,
                    "posterUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "backdropUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "quality": isLive ? "LIVE" : (time || "UPCOMING"),
                    "episode_current": episodeCurrent
                }
            });
        }

        // 2. SẮP XẾP TRẬN ĐẤU (Trận Live & thời gian gần nhất lên đầu)
        rawItems.sort(function(a, b) {
            return b.weight - a.weight;
        });

        var finalItems = rawItems.map(function(wrapper) {
            return wrapper.item;
        });

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
// TẠO SERVER & NGUỒN PHÁT CHO WEBVIEW
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var title = "Trực Tiếp Bóng Đá";
        var episodes = [];

        if (url.indexOf("payload:") === 0) {
            var payload = JSON.parse(decodeURIComponent(url.replace("payload:", "")));
            title = payload.title || title;

            if (payload.sources && payload.sources.length > 0) {
                for (var i = 0; i < payload.sources.length; i++) {
                    var s = payload.sources[i];
                    episodes.push({
                        id: s.link || payload.mainUrl,
                        name: "🌐 " + (s.name || ("Kênh " + (i + 1))),
                        slug: "webview-" + i
                    });
                }
            } else {
                episodes.push({
                    id: payload.mainUrl || BASEURL,
                    name: "🌐 Xem Trực Tiếp (WebView)",
                    slug: "webview-main"
                });
            }
        } else {
            episodes.push({
                id: url,
                name: "🌐 Xem Trực Tiếp (WebView)",
                slug: "webview-main"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            backdropUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            description: "Mở trực tiếp trong giao diện WebView.",
            servers: [
                {
                    name: "Chọn Server / BLV (WebView)",
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
                name: "Luồng WebView",
                episodes: [{ id: url, name: "Xem Ngay", slug: "main" }]
            }]
        });
    }
}

// =============================================================================
// KÍCH HOẠT CHẾ ĐỘ WEBVIEW (`isEmbed: true`)
// =============================================================================

function parseDetailResponse(html, url) {
    return JSON.stringify({
        url: url,
        isEmbed: true, // Ép VAX mở link bằng WebView tích hợp
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://tinhlagi.pro/"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { 
    return JSON.stringify({ 
        url: url, 
        isEmbed: true 
    }); 
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
