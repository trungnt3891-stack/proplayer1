// =============================================================================
// PLUGIN VAX: TINHLAGI TV (TINHLAGI.PRO/SPORT)
// TÍNH NĂNG: TRỰC TIẾP BÓNG ĐÁ & THỂ THAO TỐC ĐỘ CAO
// =============================================================================

var BASEURL = "https://tinhlagi.pro/sport";

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi_tv",
        "name": "Tinhlagi TV - Thể Thao",
        "description": "Xem trực tiếp bóng đá, lịch thi đấu, kết quả và m3u8 streaming tốc độ cao.",
        "version": "1.0.0",
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

// Giải mã HTML Entities (&amp; -> &, &quot; -> ")
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
        { slug: 'live', title: '⚽ Trận Đấu Đang Trực Tiếp', type: 'Grid' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⚽ Trực Tiếp Bóng Đá', slug: 'live' }
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
// BÓC TÁCH DỮ LIỆU DỰA TRÊN DATA ATTRIBUTES
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        // Match thẻ button chứa thuộc tính data của trận đấu
        var btnRegex = /<button[^>]*class="[^"]*js-match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;

        while ((match = btnRegex.exec(html)) !== null) {
            var attrBlock = match[1];

            // Trích xuất các attribute data-*
            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var sourceMatch = attrBlock.match(/data-source="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);

            var title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "Trực tiếp Bóng Đá";
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : "";
            var score = scoreMatch ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";
            var source = sourceMatch ? decodeEntities(sourceMatch[1]).trim() : "";
            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "";

            // Xử lý thông tin hiển thị phụ
            var infoParts = [];
            
            if (minute) {
                infoParts.push("⏱️ " + minute + "'");
            } else if (time) {
                infoParts.push("🕒 " + time);
            }

            if (score) {
                infoParts.push("Tỷ số: " + score);
            }

            if (source) {
                infoParts.push(source);
            }

            var episodeCurrent = infoParts.length > 0 ? infoParts.join(" • ") : "🟢 Live";

            if (streamUrl) {
                items.push({
                    "id": streamUrl,
                    "title": title,
                    "posterUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "backdropUrl": "https://tinhlagi.pro/sport/sanbong.jpg",
                    "quality": score ? ("FHD [" + score + "]") : "FHD",
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

// Bóc tách chi tiết luồng phát m3u8
function parseMovieDetail(html, url) {
    try {
        var streamUrl = url;

        // Nếu URL là link proxy m3u8 từ tinhlagi.pro
        return JSON.stringify({
            id: streamUrl,
            title: "Trực Tiếp TinhlagiTV",
            posterUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            backdropUrl: "https://tinhlagi.pro/sport/sanbong.jpg",
            description: "Xem bóng đá trực tiếp tốc độ cao không giật lag.",
            servers: [
                {
                    name: "Luồng Trực Tiếp FHD",
                    episodes: [
                        {
                            id: streamUrl,
                            name: "Link Server Chính",
                            slug: "main-stream"
                        }
                    ]
                }
            ]
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Trực Tiếp Bóng Đá", servers: [] });
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
