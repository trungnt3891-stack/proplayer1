// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: NATIVE SHORTFILM + DIRECT MP4/M3U8
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Nền tảng xem phim ngắn, phim tổng tài FULL HD siêu mượt.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt giao diện vuốt dọc (TikTok-style)
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // Bắt trực tiếp link MP4 nên dùng ExoPlayer cho mượt
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

function getFilterConfig() {
    return JSON.stringify({});
}

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
    if (slug.indexOf("phim/") === 0) return BASEURL + "/" + slug;
    return BASEURL + "/phim/" + slug.replace(/^\//, "");
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
        
        // Next.js của trang này lưu JSON danh sách phim vào mảng với key "item"
        // Dùng regex.exec toàn cục để quét mảng JSON an toàn, không tốn RAM
        var regex = /"item"\s*:\s*(\{"title":"[^"]+","slug":"[^"]+","img":"[^"]+","badge":"[^"]*","type":"[^"]*","year":\d+,"views":\d+\})/g;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            try {
                var obj = JSON.parse(match[1]);
                var slug = obj.slug;
                if (!added[slug]) {
                    added[slug] = true;
                    items.push({
                        id: slug, // Sẽ được getUrlDetail xử lý thêm '/phim/'
                        title: obj.title,
                        posterUrl: obj.img,
                        backdropUrl: obj.img,
                        quality: obj.badge || "HD",
                        year: obj.year || 0,
                        episode_current: obj.badge ? obj.badge : "Cập nhật"
                    });
                }
            } catch (errJson) {}
        }

        // Fallback: Tìm qua DOM HTML nếu web thay đổi cấu trúc payload
        if (items.length === 0) {
            var domRegex = /<a[^>]+href="\/phim\/([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
            var domMatch;
            while ((domMatch = domRegex.exec(html)) !== null) {
                var dSlug = domMatch[1];
                if (!added[dSlug]) {
                    added[dSlug] = true;
                    items.push({
                        id: dSlug,
                        title: domMatch[4].trim(),
                        posterUrl: domMatch[2],
                        backdropUrl: domMatch[2],
                        episode_current: domMatch[3].trim()
                    });
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: items.length > 0 ? 99 : 1 // Cấp ảo số trang để App cho cuộn vô tận
            }
        });

    } catch (e) {
        log("parseListResponse err: " + e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "";
        var year = 2026;
        var casts = "";
        var duration = "";
        var status = "Đang cập nhật";
        var servers = [];

        // 1. Lấy thông tin cơ bản từ ld+json hoặc Meta tags
        var ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (ldJsonMatch) {
            try {
                var ldData = JSON.parse(ldJsonMatch[1]);
                if (ldData.name) title = ldData.name;
                if (ldData.description) description = ldData.description;
                if (ldData.thumbnailUrl && ldData.thumbnailUrl.length > 0) posterUrl = ldData.thumbnailUrl[0];
            } catch(e) {}
        }
        
        if (!title || title === "Đang cập nhật...") {
            var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
            if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").trim();
        }
        if (!posterUrl) {
            var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/);
            if (metaImg) posterUrl = metaImg[1];
        }

        // 2. Trích xuất Payload chứa danh sách tập phim & link M3U8/MP4
        var epsRegex = /"episodes"\s*:\s*(\[\{"id":"[^"]+",.*?\}\])/;
        var epsMatch = html.match(epsRegex);
        
        if (epsMatch) {
            try {
                var epsData = JSON.parse(epsMatch[1]);
                var svSub = [];
                var svTm = [];
                
                epsData.forEach(function(ep) {
                    var epName = ep.title ? ep.title : ("Tập " + ep.episodeNumber);
                    var epLink = ep.m3u8Url; 
                    
                    if (epLink) {
                        // Truyền thẳng link file mp4/m3u8 vào ID
                        if (ep.audioType === "VIETSUB") {
                            svSub.push({ id: epLink, name: epName, slug: "vs-" + ep.episodeNumber });
                        } else if (ep.audioType === "THUYET_MINH") {
                            svTm.push({ id: epLink, name: epName, slug: "tm-" + ep.episodeNumber });
                        } else {
                            svSub.push({ id: epLink, name: epName, slug: "tap-" + ep.episodeNumber });
                        }
                    }
                });
                
                if (svTm.length > 0) servers.push({ name: "Thuyết Minh", episodes: svTm });
                if (svSub.length > 0) servers.push({ name: "Vietsub", episodes: svSub });
                
                status = "Full " + epsData.length + " Tập";
            } catch(e) { log("Parse episodes error: " + e); }
        }

        // Lấy thêm Casts, Year từ HTML thô của Payload nếu có
        var castMatch = html.match(/"cast"\s*:\s*"([^"]+)"/);
        if (castMatch) casts = castMatch[1];
        
        var yearMatch = html.match(/"releaseYear"\s*:\s*(\d+)/);
        if (yearMatch) year = parseInt(yearMatch[1]);
        
        var durationMatch = html.match(/"durationString"\s*:\s*"([^"]+)"/);
        if (durationMatch) duration = durationMatch[1];

        // Fallback khẩn cấp nếu web đổi cấu trúc mảng JSON
        if (servers.length === 0) {
             var fallbackMp4 = html.match(/(https:\/\/[^"'\s]+\.(?:mp4|m3u8))/);
             if (fallbackMp4) {
                 servers.push({
                     name: "Mặc định",
                     episodes: [{id: fallbackMp4[1], name: "Phát Phim", slug: "tap-1"}]
                 });
             }
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            quality: "FHD",
            year: year,
            rating: 9.5,
            status: status,
            casts: casts,
            duration: duration,
            servers: servers
        });

    } catch (e) {
        log("parseMovieDetail err: " + e);
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// BƯỚC NÀY APP GỌI TRỰC TIẾP LINK MEDIA DO CHÚNG TA ĐÃ BÓC TỪ PARSE_MOVIE_DETAIL
function parseDetailResponse(html, url) {
    try {
        var mimeType = "video/mp4";
        if (url.indexOf(".m3u8") > -1) {
            mimeType = "application/x-mpegURL";
        }
        
        return JSON.stringify({
            "url": url, 
            "isEmbed": false, // False để Vax App mở ExoPlayer Native (không dùng Webview)
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
