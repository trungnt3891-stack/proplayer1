// =============================================================================
// PLUGIN VAX: XÔI LẠC TV (XOILACXTB.TV)
// TÍNH NĂNG: TRỰC TIẾP BÓNG ĐÁ & THỂ THAO (BÓNG RỔ, TENNIS, CẦU LÔNG, ESPORTS...)
// =============================================================================

var BASEURL = "https://xoilacxtb.tv";

// 1. KHAI BÁO MANIFEST CỦA PLUGIN
function getManifest() {
    return JSON.stringify({
        "id": "xoilac_tv",
        "name": "Xôi Lạc TV - Thể Thao",
        "description": "Xem trực tiếp bóng đá, bóng rổ, tennis, cầu lông, bóng chuyền và Esports chất lượng cao từ Xoilac365.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://xoilacxtb.tv/favicon-xoilac365-tv-180x180.png",
        "isEnabled": true,
        "layoutType": "GRID",
        "type": "MOVIE",        // Loại nội dung hiển thị trong VAX
        "playerType": "embed"   // Đặt 'embed' để kích hoạt Trình phát Webview/Iframe truyền tải mượt mà
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
        { slug: 'basketball', title: '🏀 Bóng Rổ', type: 'Horizontal' },
        { slug: 'tennis', title: '🎾 Tennis', type: 'Horizontal' },
        { slug: 'badminton', title: '🏸 Cầu Lông', type: 'Horizontal' },
        { slug: 'volleyball', title: '🏐 Bóng Chuyền', type: 'Horizontal' },
        { slug: 'esports', title: '🎮 Esports', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⚽ Bóng Đá', slug: 'football' },
        { name: '🏀 Bóng Rổ', slug: 'basketball' },
        { name: '🎾 Tennis', slug: 'tennis' },
        { name: '🏸 Cầu Lông', slug: 'badminton' },
        { name: '🏐 Bóng Chuyền', slug: 'volleyball' },
        { name: '🎮 Esports', slug: 'esports' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        category: [
            { name: 'Bóng Đá', slug: 'football' },
            { name: 'Bóng Rổ', slug: 'basketball' },
            { name: 'Tennis', slug: 'tennis' },
            { name: 'Cầu Lông', slug: 'badminton' },
            { name: 'Bóng Chuyền', slug: 'volleyball' },
            { name: 'Esports', slug: 'esports' }
        ]
    });
}

// =============================================================================
// TẠO ĐƯỜNG DẪN (URL GENERATION)
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (!slug || slug === '/' || slug === 'home') slug = 'football';
    
    // Nếu truyền vào đường dẫn tuyệt đối
    if (slug.indexOf("http") === 0) return slug;

    // Trả về URL trang chủ Xôi Lạc để cào dữ liệu trận đấu
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
// XỬ LÝ & BÓC TÁCH DỮ LIỆU (PARSERS)
// =============================================================================

// Bóc tách danh sách các trận đấu từ HTML trang web
function parseListResponse(html, url) {
    try {
        var items = [];
        var matchRegex = /<div[^>]*class="[^"]*grid-match[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
        var match;

        // Cào dữ liệu thẻ trận đấu
        while ((match = matchRegex.exec(html)) !== null) {
            var block = match[1];

            // Tên trận / Đội bóng
            var teamNames = [];
            var teamRegex = /class="grid-match__team--name"[^>]*>([\s\S]*?)<\/span>/gi;
            var tMatch;
            while ((tMatch = teamRegex.exec(block)) !== null) {
                teamNames.push(tMatch[1].replace(/<[^>]+>/g, '').trim());
            }

            var title = teamNames.length >= 2 ? teamNames[0] + " vs " + teamNames[1] : "";
            if (!title) {
                var leagueMatch = block.match(/class="grid-match__league"[^>]*>([\s\S]*?)<\/div>/i);
                title = leagueMatch ? leagueMatch[1].replace(/<[^>]+>/g, '').trim() : "Trận đấu Thể Thao";
            }

            // Đường dẫn xem trận đấu
            var linkMatch = block.match(/href="([^"]+)"/i);
            var matchLink = linkMatch ? linkMatch[1] : "";
            if (matchLink && matchLink.indexOf("http") !== 0) {
                matchLink = BASEURL + matchLink;
            }

            // Ảnh đại diện / Logo
            var imgMatch = block.match(/src="([^"]+)"/i) || block.match(/data-original="([^"]+)"/i);
            var posterUrl = imgMatch ? imgMatch[1] : "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png";

            // Bình luận viên / Trạng thái
            var commentatorMatch = block.match(/class="grid-match__commentator"[^>]*>([\s\S]*?)<\/div>/i);
            var commentator = commentatorMatch ? commentatorMatch[1].replace(/<[^>]+>/g, '').trim() : "Trực tiếp";

            if (matchLink) {
                items.push({
                    "id": matchLink,
                    "title": title,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "HD",
                    "episode_current": commentator
                });
            }
        }

        // Trường hợp fallback nếu giao diện trang web thay đổi selector
        if (items.length === 0) {
            _$(html).find("a").each(function () {
                var href = this.attr("href");
                var title = this.attr("title") || this.text();
                if (href && (href.indexOf("/truc-tiep/") !== -1 || href.indexOf("/xem-bong-da/") !== -1)) {
                    var fullUrl = href.indexOf("http") === 0 ? href : BASEURL + href;
                    items.push({
                        "id": fullUrl,
                        "title": title.trim() || "Trực tiếp Trận Đấu",
                        "posterUrl": "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
                        "backdropUrl": "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
                        "quality": "Full HD",
                        "episode_current": "LIVE"
                    });
                }
            });
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

// Bóc tách chi tiết trận đấu & Các Link Server/Bình Luận Viên
function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "Trực tiếp Xôi Lạc TV";

        var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1] : "Xem trực tiếp bóng đá chất lượng cao trên Xôi Lạc TV.";

        var servers = [];
        var defaultEpisodes = [];

        // Bóc tách danh sách Link xem (Link Full HD, Link BLV, Link Dự Phòng)
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

        // Nếu không lấy được link riêng lẻ, gán chính link chi tiết làm luồng phát
        if (defaultEpisodes.length === 0) {
            defaultEpisodes.push({
                id: url,
                name: "Link Trực Tiếp HD",
                slug: "link-main"
            });
        }

        servers.push({
            name: "Xôi Lạc TV (Server Chính)",
            episodes: defaultEpisodes
        });

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
            backdropUrl: "https://cdn.xoilacxtb.tv/2025/05/xoilac365-tv.png",
            description: desc,
            servers: servers
        });

    } catch (e) {
        log("Lỗi parseMovieDetail: " + e);
        return JSON.stringify({ id: url, title: "Trực Tiếp Bóng Đá", servers: [] });
    }
}

// Ép ứng dụng VAX mở trình phát Webview Embedded để hỗ trợ Player phát trực tiếp của Xôi Lạc
function parseDetailResponse(html, url) {
    try {
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
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, headers: {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// THƯ VIỆN BỔ TRỢ BÓC TÁCH DOM HTML (HTML PARSER HELPER)
// =============================================================================
function _$(htmlOrBlock) {
    if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; }
    var instance = {
        sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',
        elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),
        find: function (selector) {
            var results = [];
            for (var i = 0; i < this.elements.length; i++) {
                var currentHtml = this.elements[i];
                var pos = 0;
                while ((pos = currentHtml.indexOf('<', pos)) !== -1) {
                    if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; }
                    var endOpenTag = currentHtml.indexOf('>', pos);
                    if (endOpenTag === -1) break;
                    var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1);
                    var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/);
                    var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : "";
                    
                    if (selector === "a" && currentTagName === "a") {
                        var endTagPos = currentHtml.indexOf('</a>', endOpenTag);
                        if (endTagPos !== -1) {
                            results.push(currentHtml.substring(pos, endTagPos + 4));
                            pos = endTagPos + 4;
                            continue;
                        }
                    }
                    pos++;
                }
            }
            return _$(results);
        },
        attr: function (attrName) {
            if (this.elements.length === 0) return "";
            var el = this.elements[0];
            var match = el.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
            return match ? (match[1] || match[2] || match[3] || "") : "";
        },
        text: function () {
            if (this.elements.length === 0) return "";
            return this.elements[0].replace(/<[^>]+>/g, "").trim();
        },
        each: function (callback) {
            for (var i = 0; i < this.elements.length; i++) {
                callback.call(_$(this.elements[i]), i);
            }
        }
    };
    return instance;
}
