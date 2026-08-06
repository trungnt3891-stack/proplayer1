// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: NATIVE SHORTFILM + DIRECT MP4/M3U8 (TỐI ƯU TUYỆT ĐỐI)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Mê Phim Ngắn",
        "description": "Nền tảng xem phim ngắn FULL HD. Chơi link MP4 trực tiếp, cực mượt, 0% quảng cáo.",
        "version": "5.0.0", // Bản chuẩn Native 100%
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Bắt buộc: Kích hoạt giao diện vuốt dọc (TikTok-style)
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // KHÔNG DÙNG WEBVIEW. Phát native trực tiếp!
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[GaMoMePhim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[GaMoMePhim] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới', type: 'Grid' },
        { slug: 'the-loai/hien-dai', title: 'Hiện Đại', type: 'Horizontal' },
        { slug: 'the-loai/co-trang', title: 'Cổ Trang', type: 'Horizontal' },
        { slug: 'the-loai/hai-huoc', title: 'Hài Hước', type: 'Horizontal' },
        { slug: 'the-loai/tra-xanh-nam', title: 'Trà Xanh Nam', type: 'Horizontal' },
        { slug: 'ban-xep-hang', title: 'Bảng Xếp Hạng', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Mới', slug: 'phim-moi' },
        { name: 'Bảng Xếp Hạng', slug: 'ban-xep-hang' },
        { name: 'Chữa Lành', slug: 'the-loai/chua-lanh' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' },
        { name: 'Cưới Trước Yêu Sau', slug: 'the-loai/cuoi-truoc-yeu-sau' },
        { name: 'Dân Quốc', slug: 'the-loai/dan-quoc' },
        { name: 'Gương Vỡ Lại Lành', slug: 'the-loai/guong-vo-lai-lanh' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Hiện Đại', slug: 'the-loai/hien-dai' },
        { name: 'Niên Đại', slug: 'the-loai/nien-dai' },
        { name: 'Thanh Xuân', slug: 'the-loai/thanh-xuan' },
        { name: 'Trà Xanh Nam', slug: 'the-loai/tra-xanh-nam' },
        { name: 'Trọng Sinh', slug: 'the-loai/trong-sinh' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Yêu Thầm', slug: 'the-loai/yeu-tham' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try {
                var filters = JSON.parse(filtersJson);
                page = parseInt(filters.page) || 1;
            } catch (e) {}
        }
        var url = BASEURL + "/" + slug.replace(/^\//, "");
        if (page > 1) {
            url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return url;
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try {
                page = JSON.parse(filtersJson).page || 1;
            } catch (e) {}
        }
        return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword) + (page > 1 ? "&page=" + page : "");
    } catch (e) {
        return BASEURL;
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    
    // Gọi thẳng vào trang 1 (Thông tin phim), vì ở đó ĐÃ CÓ link MP4 rồi!
    var cleanSlug = slug.replace(/^\//, "").replace(/^phim\//, "");
    return BASEURL + "/phim/" + cleanSlug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        var unescapedHtml = html.replace(/\\"/g, '"');
        var regex = /"item"\s*:\s*(\{[^{}]*"slug"\s*:\s*"([^"]+)"[^{}]*\})/g;
        var match;
        
        while ((match = regex.exec(unescapedHtml)) !== null) {
            try {
                var objStr = match[1];
                var slug = match[2];
                var titleMatch = objStr.match(/"title"\s*:\s*"([^"]+)"/);
                var imgMatch = objStr.match(/"img"\s*:\s*"([^"]+)"/);
                var badgeMatch = objStr.match(/"badge"\s*:\s*"([^"]+)"/);
                var yearMatch = objStr.match(/"year"\s*:\s*(\d+)/);
                
                if (titleMatch && !added[slug]) {
                    added[slug] = true;
                    items.push({
                        id: slug, 
                        title: titleMatch[1],
                        posterUrl: imgMatch ? imgMatch[1] : "",
                        backdropUrl: imgMatch ? imgMatch[1] : "",
                        quality: badgeMatch ? badgeMatch[1] : "HD",
                        year: yearMatch ? parseInt(yearMatch[1]) : 0,
                        episode_current: badgeMatch ? badgeMatch[1] : "Cập nhật"
                    });
                }
            } catch (errJson) {}
        }

        if (items.length === 0) {
            var domRegex = /<a[^>]+href="(?:\/phim)?\/([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?(?:<span[^>]*>([^<]+)<\/span>)?/gi;
            var domMatch;
            while ((domMatch = domRegex.exec(html)) !== null) {
                var dSlug = domMatch[1];
                if (!added[dSlug]) {
                    added[dSlug] = true;
                    items.push({
                        id: dSlug,
                        title: domMatch[2].trim(),
                        posterUrl: domMatch[3],
                        backdropUrl: domMatch[3],
                        episode_current: domMatch[4] ? domMatch[4].trim() : "Full"
                    });
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: items.length > 0 ? 99 : 1 }
        });

    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// BƯỚC NÀY MOI THẲNG LINK MP4 TỪ HTML VÀ TRUYỀN VÀO `id` CỦA TẬP PHIM
function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "Không có mô tả.";
        var year = 2026;
        var casts = "";
        var duration = "";

        // Trích xuất Metadata thông tin phim
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (metaImg) posterUrl = metaImg[1];

        var ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (ldJsonMatch) {
            try {
                var ldData = JSON.parse(ldJsonMatch[1]);
                if (ldData.name) title = ldData.name;
                if (ldData.description) description = ldData.description;
            } catch(e) {}
        }
        
        var unescapedHtml = html.replace(/\\"/g, '"');
        var castMatch = unescapedHtml.match(/"cast"\s*:\s*"([^"]+)"/);
        if (castMatch) casts = castMatch[1];
        var durationMatch = unescapedHtml.match(/"durationString"\s*:\s*"([^"]+)"/);
        if (durationMatch) duration = durationMatch[1];
        var yearMatch = unescapedHtml.match(/"releaseYear"\s*:\s*(\d+)/);
        if (yearMatch) year = parseInt(yearMatch[1]);

        // =====================================================================
        // TRỤC CHÍNH: MOI LINK MP4 TRỰC TIẾP TỪ NEXTJS PAYLOAD 
        // =====================================================================
        var svSub = [];
        var svTm = [];
        
        // Cắt dữ liệu HTML thành từng khúc object có id
        var epParts = unescapedHtml.split('{"id":');
        for (var i = 1; i < epParts.length; i++) {
            var epStr = epParts[i];
            // Nếu khúc này chứa m3u8Url và audioType thì nó là tập phim
            if (epStr.indexOf('"m3u8Url"') > -1 && epStr.indexOf('"audioType"') > -1) {
                var m3u8Match = epStr.match(/"m3u8Url"\s*:\s*"([^"]+)"/);
                var audioMatch = epStr.match(/"audioType"\s*:\s*"([^"]+)"/);
                var epNumMatch = epStr.match(/"episodeNumber"\s*:\s*(\d+)/);
                
                if (m3u8Match) {
                    var epLink = m3u8Match[1];
                    var type = audioMatch ? audioMatch[1] : "VIETSUB";
                    var num = epNumMatch ? epNumMatch[1] : "1";
                    
                    if (type === "THUYET_MINH") {
                        svTm.push({ id: epLink, name: "Tập " + num, slug: "tm-" + num });
                    } else {
                        svSub.push({ id: epLink, name: "Tập " + num, slug: "vs-" + num });
                    }
                }
            }
        }

        var servers = [];
        if (svTm.length > 0) servers.push({ name: "Thuyết Minh", episodes: svTm });
        if (svSub.length > 0) servers.push({ name: "Vietsub", episodes: svSub });

        // Sắp xếp tập tự động
        servers.forEach(function(s) {
            s.episodes.sort(function(a, b) {
                var matchA = a.slug.match(/\d+/);
                var matchB = b.slug.match(/\d+/);
                return (matchA ? parseInt(matchA[0]) : 0) - (matchB ? parseInt(matchB[0]) : 0);
            });
        });

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            quality: "FHD",
            year: year,
            rating: 9.5,
            status: "Full " + Math.max(svSub.length, svTm.length) + " Tập",
            casts: casts,
            duration: duration,
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// BƯỚC CUỐI: APP CHẠY THẲNG LINK MP4 VÀO EXOPLAYER NATIVE (SẠCH QUẢNG CÁO 100%)
function parseDetailResponse(html, url) {
    try {
        // url nhận vào lúc này CHÍNH LÀ link mp4/m3u8 từ id tập phim
        var mimeType = url.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4";
        
        return JSON.stringify({
            "url": url, 
            "isEmbed": false, // KÍCH HOẠT PLAYER NATIVE DỌC CỦA VAX APP
            "mimeType": mimeType,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": false, "headers": {} });
    }
}

function parseEmbedResponse(html, url) { 
    return JSON.stringify({ url: url, isEmbed: false }); 
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
