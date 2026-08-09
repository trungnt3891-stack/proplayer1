// =============================================================================
// PLUGIN VAX: XÔI LẠC TV (XOILACXTB.TV)
// TÍNH NĂNG: TRỰC TIẾP BÓNG ĐÁ, TENNIS, BÓNG RỔ & THỂ THAO MULTI-SPORT
// =============================================================================

var BASEURL = "https://xoilacxtb.tv";

function getManifest() {
    return JSON.stringify({
        "id": "xoilac_tv",
        "name": "Xôi Lạc TV - Thể Thao",
        "description": "Xem trực tiếp bóng đá, tennis, bóng rổ, cầu lông, bóng chuyền chất lượng cao.",
        "version": "1.1.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://xoilacxtb.tv/favicon-xoilac365-tv-180x180.png",
        "isEnabled": true,
        "layoutType": "GRID",
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[XoilacTV] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[XoilacTV] " + msg);
    }
}

// =============================================================================
// DANH MỤC TRANG CHỦ & BỘ LỌC THỂ THAO
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'football', title: '⚽ Trực Tiếp Bóng Đá', type: 'Grid' },
        { slug: 'tennis', title: '🎾 Tennis', type: 'Horizontal' },
        { slug: 'basketball', title: '🏀 Bóng Rổ', type: 'Horizontal' },
        { slug: 'badminton', title: '🏸 Cầu Lông', type: 'Horizontal' },
        { slug: 'volleyball', title: '🏐 Bóng Chuyền', type: 'Horizontal' },
        { slug: 'esports', title: '🎮 Esports', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⚽ Bóng Đá', slug: 'football' },
        { name: '🎾 Tennis', slug: 'tennis' },
        { name: '🏀 Bóng Rổ', slug: 'basketball' },
        { name: '🏸 Cầu Lông', slug: 'badminton' },
        { name: '🏐 Bóng Chuyền', slug: 'volleyball' },
        { name: '🎮 Esports', slug: 'esports' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        category: [
            { name: 'Bóng Đá', slug: 'football' },
            { name: 'Tennis', slug: 'tennis' },
            { name: 'Bóng Rổ', slug: 'basketball' },
            { name: 'Cầu Lông', slug: 'badminton' },
            { name: 'Bóng Chuyền', slug: 'volleyball' },
            { name: 'Esports', slug: 'esports' }
        ]
    });
}

// =============================================================================
// TẠO URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (!slug || slug === '/' || slug === 'home') slug = 'football';
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/";
}

function getUrlSearch(keyword, filtersJson) {
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword || ""));
    return BASEURL + "/?s=" + safeKeyword;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + (slug.startsWith('/') ? slug : '/' + slug);
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BÓC TÁCH DỮ LIỆU THÔNG TIN TRẬN ĐẤU (BÓNG ĐÁ & TENNIS)
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        
        // Match các thẻ chứa thông tin trận đấu
        var matchRegex = /<div[^>]*class="[^"]*grid-match[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
        var match;

        while ((match = matchRegex.exec(html)) !== null) {
            var block = match[1];

            // 1. Trích xuất tên giải đấu (VD: GIAO HỮU CLB, BUNDESLIGA 2, ATP CHALLENGER...)
            var leagueMatch = block.match(/class="[^"]*(?:grid-match__league|league-name|tournament)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            var leagueName = leagueMatch ? leagueMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            // 2. Trích xuất tên Đội bóng / Vận động viên Tennis
            var teamNames = [];
            
            // Tìm theo class tên đội bóng / VĐV
            var teamRegex = /class="[^"]*(?:grid-match__team--name|team-name|player-name)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/gi;
            var tMatch;
            while ((tMatch = teamRegex.exec(block)) !== null) {
                var cleanName = tMatch[1].replace(/<[^>]+>/g, '').trim();
                if (cleanName && teamNames.indexOf(cleanName) === -1) {
                    teamNames.push(cleanName);
                }
            }

            // Phương án dự phòng nếu class thay đổi (tìm các thẻ span/div chứa tên)
            if (teamNames.length < 2) {
                var altTeamRegex = /<span[^>]*class="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
                while ((tMatch = altTeamRegex.exec(block)) !== null) {
                    var altName = tMatch[1].replace(/<[^>]+>/g, '').trim();
                    if (altName && altName.length > 1 && teamNames.indexOf(altName) === -1) {
                        teamNames.push(altName);
                    }
                }
            }

            // Định dạng tiêu đề: "Đội A vs Đội B"
            var title = "";
            if (teamNames.length >= 2) {
                title = teamNames[0] + " vs " + teamNames[1];
            } else if (teamNames.length === 1) {
                title = teamNames[0];
            } else {
                title = leagueName ? ("Trận đấu " + leagueName) : "Trực tiếp Thể Thao";
            }

            // 3. Đường dẫn trận đấu
            var linkMatch = block.match(/href="([^"]+)"/i);
            var matchLink = linkMatch ? linkMatch[1] : "";
            if (matchLink && matchLink.indexOf("http") !== 0) {
                matchLink = BASEURL + matchLink;
            }

            // 4. Ảnh đại diện / Logo
            var imgMatch = block.match(/src="([^"]+)"/i) || block.match(/data-original="([^"]+)"/i);
            var posterUrl = imgMatch ? imgMatch[1] : "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png";

            // 5. Trạng thái / Thời gian / Bình luận viên (BLV)
            var statusMatch = block.match(/class="[^"]*(?:grid-match__status|match-status|status)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            var matchStatus = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var commentatorMatch = block.match(/class="[^"]*(?:grid-match__commentator|commentator)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            var commentator = commentatorMatch ? commentatorMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            // Ghép thông tin hiển thị phụ
            var badgeInfo = [];
            if (leagueName) badgeInfo.push(leagueName);
            if (matchStatus) badgeInfo.push(matchStatus);
            if (commentator) badgeInfo.push("BLV: " + commentator);
            
            var episodeCurrent = badgeInfo.length > 0 ? badgeInfo.join(" • ") : "LIVE";

            if (matchLink) {
                items.push({
                    "id": matchLink,
                    "title": title,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "HD",
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

function parseSearchResponse(html) {
    return parseListResponse(html, "");
}

// Bóc tách chi tiết trận đấu
function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "Trực tiếp Thể Thao";

        var servers = [];
        var defaultEpisodes = [];

        var linkRegex = /<a[^>]*href="([^"]+)"[^>]*class="[^"]*btn-detail[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        var count = 1;

        while ((match = linkRegex.exec(html)) !== null) {
            var epUrl = match[1];
            var epName = match[2].replace(/<[^>]+>/g, '').trim() || ("Link " + count);
            if (epUrl.indexOf("http") !== 0) epUrl = BASEURL + epUrl;

            defaultEpisodes.push({
                id: epUrl,
                name: epName,
                slug: "link-" + count
            });
            count++;
        }

        if (defaultEpisodes.length === 0) {
            defaultEpisodes.push({
                id: url,
                name: "Link Trực Tiếp HD",
                slug: "link-main"
            });
        }

        servers.push({
            name: "Luồng Phát Trực Tiếp",
            episodes: defaultEpisodes
        });

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
            backdropUrl: "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
            description: "Xem trực tiếp bóng đá, tennis và thể thao chất lượng cao.",
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url, title: "Trực Tiếp Thể Thao", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    var targetUrl = url;
    if (targetUrl && targetUrl.indexOf("http") !== 0) {
        targetUrl = BASEURL + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
    }

    return JSON.stringify({
        url: targetUrl,
        isEmbed: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "Referer": BASEURL + "/"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) { return JSON.stringify({ url: url, isEmbed: true }); }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
