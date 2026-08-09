// =============================================================================
// PLUGIN VAX: TINHLAGI TV (TINHLAGI.PRO/SPORT)
// TÍNH NĂNG: TRỰC TIẾP BÓNG ĐÁ & THỂ THAO TỐC ĐỘ CAO (TÂM ĐIỂM LIVE)
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Xem trực tiếp bóng đá tâm điểm đang live, lịch thi đấu và m3u8 streaming tốc độ cao.",
        "version": "1.1.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "layoutType": "GRID",
        "type": "MOVIE",
        "playerType": "m3u8"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[TinhlagiTV] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[TinhlagiTV] " + msg);
    }
}

// Giải mã HTML Entities (&amp; -> &, &quot; -> ", &#039; -> ')
function decodeEntities(encodedString) {
    if (!encodedString) return "";
    return encodedString
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

// =============================================================================
// DANH MỤC & BỘ LỌC
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'live', title: '🔥 Trận Đấu Tâm Điểm Đang Live', type: 'Grid' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '🔥 Tâm Điểm Đang Live', slug: 'live' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// TẠO URL
// =============================================================================

function getUrlList(slug, filtersJson) { return BASEURL + "/"; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BÓC TÁCH DỮ LIỆU (CHỈ LẤY TRẬN ĐANG LIVE)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        // Match thẻ button chứa thuộc tính data của trận đấu
        var btnRegex = /<button[^>]*class="[^"]*js-match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;

        while ((match = btnRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            // LỌC: Chỉ giữ lại các trận đang trực tiếp (có badge status-live hoặc 🟢 Live)
            if (innerContent.indexOf('status-live') === -1 && innerContent.indexOf('🟢 Live') === -1) {
                continue;
            }

            // Trích xuất các attribute data-*
            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var sourceMatch = attrBlock.match(/data-source="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "Trực tiếp Bóng Đá";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : "";
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";
            var source = sourceMatch ? decodeEntities(sourceMatch[1]).trim() : "";
            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "";

            // Trích xuất danh sách đa luồng / bình luận viên từ data-sources
            var parsedSources = [];
            if (sourcesMatch) {
                try {
                    var decodedSourcesStr = decodeEntities(sourcesMatch[1]);
                    parsedSources = JSON.parse(decodedSourcesStr);
                } catch (err) {
                    log("Lỗi parse data-sources: " + err);
                }
            }

            // Xử lý thông tin hiển thị phụ
            var infoParts = [];
            if (minute) {
                infoParts.push("⏱️ " + minute + "'");
            } else if (time) {
                infoParts.push("🕒 " + time);
            }

            if (score) {
                infoParts.push("⚽ " + score);
            }

            if (source) {
                infoParts.push(source);
            }

            var episodeCurrent = infoParts.length > 0 ? infoParts.join(" • ") : "🟢 LIVE";

            if (streamUrl || parsedSources.length > 0) {
                // Đóng gói thông tin trận đấu để truyền trực tiếp cho parseMovieDetail
                var detailPayload = {
                    title: title,
                    mainUrl: streamUrl,
                    sources: parsedSources,
                    league: league
                };

                items.push({
                    "id": "payload:" + encodeURIComponent(JSON.stringify(detailPayload)),
                    "title": title,
                    "posterUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "backdropUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "quality": score ? ("LIVE [" + score + "]") : "LIVE FHD",
                    "episode_current": episodeCurrent
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });

    } catch (e) {
        log("Lỗi parseListResponse: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html, ""); }

// Bóc tách chi tiết luồng phát m3u8 và hỗ trợ đa server / bình luận viên
function parseMovieDetail(html, url) {
    try {
        var title = "Trực Tiếp Bóng Đá";
        var episodes = [];

        if (url.indexOf("payload:") === 0) {
            var jsonStr = decodeURIComponent(url.replace("payload:", ""));
            var payload = JSON.parse(jsonStr);
            title = payload.title || title;

            if (payload.sources && payload.sources.length > 0) {
                for (var i = 0; i < payload.sources.length; i++) {
                    var s = payload.sources[i];
                    episodes.push({
                        id: s.link,
                        name: s.name || ("Nguồn " + (i + 1)),
                        slug: "stream-" + i
                    });
                }
            } else if (payload.mainUrl) {
                episodes.push({
                    id: payload.mainUrl,
                    name: "Luồng Chính FHD",
                    slug: "main-stream"
                });
            }
        } else {
            episodes.push({
                id: url,
                name: "Link Server Chính",
                slug: "main-stream"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            backdropUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            description: "Xem bóng đá trực tiếp tốc độ cao không giật lag.",
            servers: [
                {
                    name: "Danh Sách Luồng Phát / BLV",
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
                name: "Luồng Mặc Định",
                episodes: [{ id: url, name: "Link Trực Tiếp", slug: "main" }]
            }]
        });
    }
}

function parseDetailResponse(html, url) {
    return JSON.stringify({
        url: url,
        isEmbed: false,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://tinhlagi.pro/"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return JSON.stringify({ url: url, isEmbed: false }); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
