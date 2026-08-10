// =============================================================================
// PLUGIN VAX: GIỜ VÀNG TV (PHÂN LOẠI TAB BỘ MÔN + PHÁT NATIVE M3U8 GỐC)
// =============================================================================

var BASEURL = "https://giovang.city";
var DEFAULT_POSTER = "https://giovang.city/wp-content/uploads/2025/02/trang-chu-giovang.webp";
var FALLBACK_M3U8 = "https://freem3u.xyz/static/no-signal/low.m3u8";

function getManifest() {
    return JSON.stringify({
        "id": "giovangtv",
        "name": "Giờ Vàng TV Pro",
        "description": "Trực tiếp bóng đá đa bộ môn (Bắt link Native M3U8 siêu mượt, phân loại Tab thể thao chuẩn xác).",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://giovang.city/wp-content/uploads/2024/10/GiovangTV_logo-01-1.png",
        "isEnabled": true,
        "layoutType": "LIST",
        "type": "MOVIE",
        "playerType": "native" // Ép sử dụng Native Player để trải nghiệm mượt như Youtube, không quảng cáo
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') nativeLog("[GiovangTV] " + msg);
    else if (typeof console !== 'undefined' && console.log) console.log("[GiovangTV] " + msg);
}

function decodeEntities(str) {
    if (!str) return "";
    return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
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

        return new Date(year, month, day, hours, minutes, 0).getTime();
    } catch (e) {
        return 0;
    }
}

// =============================================================================
// TẠO THANH TAB BỘ MÔN (GIỐNG HỆT ẢNH YÊU CẦU)
// =============================================================================

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⭐ Tất Cả', slug: 'all' },
        { name: '⚽ Bóng Đá', slug: 'football' },
        { name: '🏀 Bóng Rổ', slug: 'basketball' },
        { name: '🥊 Võ Thuật', slug: 'vothuat' },
        { name: '🏐 Bóng Chuyền', slug: 'bongchuyen' },
        { name: '⚾ Bóng Chày', slug: 'bongchay' },
        { name: '📅 Môn Khác', slug: 'other' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// Truyền Slug vào URL để hệ thống nhận diện đang ở Tab Thể thao nào
function getUrlList(slug, filtersJson) { return BASEURL + "/?sport=" + slug; }
function getUrlSearch(keyword, filtersJson) { return BASEURL + "/"; }
function getUrlDetail(slug) { return slug; }
function getUrlCategories() { return BASEURL + "/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSE DANH SÁCH TỪ HTML & LỌC THEO TỪNG BỘ MÔN
// =============================================================================

function parseListResponse(html, url) {
    try {
        var targetSport = "all";
        var sportMatch = url.match(/sport=([^&]+)/);
        if (sportMatch) targetSport = sportMatch[1];

        var itemsList = [];
        var addedUrls = {}; 
        
        // Bắt toàn bộ dữ liệu trận đấu được ẩn trong thanh Sidebar của Web
        var itemRegex = /<button[^>]*class="[^"]*match-btn[^"]*"([\s\S]*?)>([\s\S]*?)<\/button>/gi;
        var match;
        var nowMs = new Date().getTime();

        while ((match = itemRegex.exec(html)) !== null) {
            var attrBlock = match[1];
            var innerContent = match[2];

            var titleMatch = attrBlock.match(/data-title="([^"]*)"/i);
            var rawTitle = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";
            
            // Lọc bỏ rác
            if (!rawTitle || rawTitle.indexOf("Cập Nhật") !== -1 || rawTitle.indexOf("Địa Chỉ IP") !== -1 || rawTitle.indexOf("Chào Khách") !== -1) {
                continue;
            }

            var isFinished = innerContent.indexOf('Đã xong') !== -1 || innerContent.indexOf('status-ended') !== -1;
            if (isFinished) continue;

            var isLive = innerContent.indexOf('🟢 Live') !== -1 || innerContent.indexOf('status-live') !== -1;
            var isUpcoming = innerContent.indexOf('⏳ Sắp Live') !== -1 || innerContent.indexOf('status-upcoming') !== -1;
            if (!isLive && !isUpcoming) continue;

            var urlMatch = attrBlock.match(/data-url="([^"]*)"/i);
            var streamUrl = urlMatch ? decodeEntities(urlMatch[1]).trim() : BASEURL;
            
            if (!streamUrl || addedUrls[rawTitle + streamUrl]) continue;
            addedUrls[rawTitle + streamUrl] = true;

            var scoreMatch = attrBlock.match(/data-score="([^"]*)"/i);
            var minuteMatch = attrBlock.match(/data-minute="([^"]*)"/i);
            var timeMatch = attrBlock.match(/data-time="([^"]*)"/i);
            var leagueMatch = attrBlock.match(/data-league="([^"]*)"/i);
            var sourcesMatch = attrBlock.match(/data-sources="([^"]*)"/i);

            // ======================================================
            // NHẬN DIỆN BỘ MÔN DỰA VÀO ĐƯỜNG DẪN ẢNH LOGO TRONG DATA
            // ======================================================
            var sportType = "football"; // Mặc định
            var srcStr = sourcesMatch ? sourcesMatch[1].toLowerCase() : "";
            
            if (srcStr.indexOf("basketball") !== -1) sportType = "basketball";
            else if (srcStr.indexOf("volleyball") !== -1 || srcStr.indexOf("bongchuyen") !== -1) sportType = "bongchuyen";
            else if (srcStr.indexOf("baseball") !== -1 || srcStr.indexOf("bongchay") !== -1) sportType = "bongchay";
            else if (srcStr.indexOf("esport") !== -1) sportType = "esport";
            else if (srcStr.indexOf("vothuat") !== -1 || srcStr.indexOf("boxing") !== -1) sportType = "vothuat";
            else if (srcStr.indexOf("football") === -1 && srcStr.indexOf("soccer") === -1) {
                // Phân tích thêm từ Tên giải đấu nếu không tìm thấy trong URL ảnh
                var lgStr = leagueMatch ? leagueMatch[1].toLowerCase() : "";
                if (lgStr.indexOf("nba") !== -1 || lgStr.indexOf("vba") !== -1) sportType = "basketball";
            }

            // Bộ lọc Tab (Ẩn các trận không thuộc môn đang chọn)
            if (targetSport !== "all" && targetSport !== "other" && sportType !== targetSport) {
                continue; 
            }
            if (targetSport === "other" && ["football", "basketball", "bongchuyen", "bongchay", "vothuat"].indexOf(sportType) !== -1) {
                continue;
            }

            var league = leagueMatch ? decodeEntities(leagueMatch[1]).trim() : "Giải đấu";
            var score = scoreMatch && scoreMatch[1] ? decodeEntities(scoreMatch[1]).trim() : "";
            var minute = minuteMatch ? decodeEntities(minuteMatch[1]).trim() : "";
            var time = timeMatch ? decodeEntities(timeMatch[1]).trim() : "";

            var matchTimeMs = parseDateTimeToTimestamp(time);
            
            // ======================================================
            // BẮT TRỰC TIẾP ẢNH BÌA ĐÃ ĐƯỢC MÁY CHỦ MERGE SẴN
            // ======================================================
            var parsedSources = [];
            var posterImage = DEFAULT_POSTER;
            if (sourcesMatch) {
                try { 
                    parsedSources = JSON.parse(decodeEntities(sourcesMatch[1])); 
                    if (parsedSources.length > 0 && parsedSources[0].logo) {
                        posterImage = parsedSources[0].logo.replace(/\\\//g, '/'); // Chuẩn hóa URL ảnh bìa
                    }
                } catch (e) {}
            }

            var episodeParts = [];
            if (isLive) {
                var st = "🔴 LIVE";
                if (minute) st += " " + minute + "'";
                episodeParts.push(st);
                if (score) episodeParts.push("Tỉ số: " + score);
            } else {
                episodeParts.push("⏳ " + time);
            }

            // Đóng gói data sang màn hình chi tiết để phân tích m3u8 cực nhanh mà không cần gọi Network
            var payload = { title: rawTitle, league: league, poster: posterImage, sources: parsedSources, isLive: isLive };
            var itemUrl = BASEURL + "#data=" + encodeURIComponent(JSON.stringify(payload));

            // Tính toán sắp xếp
            var timeDiff = matchTimeMs > 0 ? Math.abs(matchTimeMs - nowMs) : 999999999;
            var weight = isLive ? (3000000000000 - timeDiff) : (1000000000000 - timeDiff);

            itemsList.push({
                weight: weight,
                item: {
                    "id": itemUrl,
                    "title": rawTitle,
                    "posterUrl": posterImage,
                    "backdropUrl": posterImage,
                    "quality": isLive ? "ĐANG LIVE" : "SẮP LIVE",
                    "episode_current": episodeParts.join(" | ")
                }
            });
        }

        // Sắp xếp tự động trận gần giờ thực nhất lên trước
        itemsList.sort(function(a, b) { return b.weight - a.weight; });

        var finalItems = itemsList.map(function(w) { return w.item; });

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
// CHI TIẾT: GIẢI MÃ LIÊN KẾT M3U8 NATIVE TỪ PROXY CỦA WEB
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var data = parseDataFromHash(url);
        var title = data && data.title ? data.title : "Trực Tiếp Thể Thao";
        var poster = data && data.poster ? data.poster : DEFAULT_POSTER;

        var episodes = [];
        
        if (data && data.sources && data.sources.length > 0) {
            for (var i = 0; i < data.sources.length; i++) {
                var s = data.sources[i];
                var m3u8Link = s.link;
                
                // Giải mã url m3u8 gốc giấu trong param &url=...
                var urlParamMatch = s.link.match(/&url=([^&]+)/);
                if (urlParamMatch && urlParamMatch[1]) {
                    m3u8Link = decodeURIComponent(urlParamMatch[1]);
                }

                episodes.push({
                    id: m3u8Link, // Gửi link m3u8 nguyên bản sang bộ phát Native
                    name: "🎙️ " + (s.name || ("Kênh " + (i + 1))),
                    slug: "channel-" + i
                });
            }
        } else {
            episodes.push({
                id: FALLBACK_M3U8,
                name: "⚠️ Đang chờ tín hiệu / Chưa phát sóng",
                slug: "no-signal"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: "Hệ thống phát trực tiếp thể thao bằng Native Player (Trình phát Mặc Định). Bỏ qua 100% quảng cáo chìm, xem bóng đá siêu mượt không lo giật lag do WebView.",
            servers: [{ name: "Chọn Kênh Phát Sóng", episodes: episodes }]
        });
    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Trực Tiếp Thể Thao",
            servers: [{ name: "Server", episodes: [{ id: FALLBACK_M3U8, name: "⚠️ Lỗi dữ liệu", slug: "error" }] }]
        });
    }
}

function parseDetailResponse(html, url) {
    // Trả về isEmbed: false để ép hệ thống VAX chạy video trên App thay vì mở Website
    return JSON.stringify({
        url: url,
        isEmbed: false, 
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15",
            "Referer": "https://giovang.city/",
            "Origin": "https://giovang.city"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return parseDetailResponse(html, url); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
