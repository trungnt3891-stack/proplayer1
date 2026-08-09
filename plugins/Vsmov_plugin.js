// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (NATIVE PLAYER - BẮT LINK TỰ ĐỘNG)
// =============================================================================

var DOMAIN = "https://vsmov.com";
var BASEURL = DOMAIN; 

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.6.8",
        "baseUrl": DOMAIN,
        "iconUrl": DOMAIN + "/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[VsMov] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[VsMov] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'dang-chieu', title: 'Phim Đang Chiếu', type: 'Horizontal', path: 'danh-sach' },
        { slug: '4k', title: 'Phim 4K', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới cập nhật', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim lồng tiếng', slug: 'long-tieng' },
        { name: 'Phim thuyết minh', slug: 'thuyet-minh' },
        { name: 'Phim đang chiếu', slug: 'dang-chieu' },
        { name: 'Phim 4K', slug: '4k' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Năm phát hành', value: 'year' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (slug && slug.indexOf("http") === 0) {
            return slug;
        }
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        }
    } catch (e) {}

    if (!slug || slug === '/' || slug === 'home') {
        return "https://vsmov.com/danh-sach/phim-moi?page=" + page;
    }

    if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') slug = 'phim-moi';

    var danhSachSlugs = ['phim-moi', 'phim-bo', 'phim-le', 'dang-chieu', '4k', 'long-tieng', 'thuyet-minh', 'subteam'];
    var basePath = "the-loai"; 
    
    if (danhSachSlugs.indexOf(slug) !== -1 || slug.indexOf('danh-sach/') === 0) {
        basePath = "danh-sach";
        if (slug.indexOf('danh-sach/') === 0) {
            slug = slug.replace('danh-sach/', '');
        }
    }

    return "https://vsmov.com/" + basePath + "/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {}
    
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return "https://vsmov.com/?search=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://vsmov.com/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS (HTML SCRAPING)
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        var match;
        
        while ((match = rowRegex.exec(html)) !== null) {
            var row = match[1];
            if (row.indexOf('<th') !== -1) continue;

            var slugMatch = row.match(/href="[^"]*\/phim\/([^"]+)"/i);
            if (!slugMatch) continue;
            var slug = slugMatch[1];
            var fullLink = "https://vsmov.com/phim/" + slug;

            var titleMatch = row.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var posterMatch = row.match(/data-original="([^"]+)"/i) || row.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";
            if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = "https://vsmov.com" + posterUrl;

            var originMatch = row.match(/class="text-sub-text[^"]*">([\s\S]*?)<\/div>/i);
            var originalTitle = originMatch ? originMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var statusMatch = row.match(/class="flex-1 text-inherit font-normal px-1">([\s\S]*?)<\/span>/i);
            var status = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var yearMatch = row.match(/<span>(\d{4})<\/span>/i);
            var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

            items.push({
                id: fullLink,
                title: title,
                originalTitle: originalTitle,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                episode_current: status,
                year: year,
                quality: row.indexOf('4K') !== -1 ? '4K' : (row.indexOf('HD') !== -1 ? 'HD' : '')
            });
        }

        var currentPage = 1;
        var totalPages = 1;
        var pageMatch = html.match(/Trang\s+(\d+)\/(\d+)/i);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10);
            totalPages = parseInt(pageMatch[2], 10);
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BÓC TÁCH CHI TIẾT VÀ QUÉT JSON ĐỂ LẤY TOÀN BỘ TẬP PHIM RA GIAO DIỆN
function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        var title = titleMatch ? titleMatch[1].replace(/- VSMOV.*/i, '').replace('Phim ', '').trim() : "";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = "https://vsmov.com" + posterUrl;

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1].trim() : "";

        var servers = [];
        
        // Quét tìm mảng dữ liệu chứa link video trong thẻ script
        var episodesJson = html.match(/var\s+episodes\s*=\s*(\[\{[\s\S]*?\}\]);/i);
        if (!episodesJson) {
            episodesJson = html.match(/var\s+embedEpisodes\s*=\s*(\[\{[\s\S]*?\}\]);/i);
        }

        if (episodesJson && episodesJson[1]) {
            var epData = JSON.parse(episodesJson[1]);
            for (var i = 0; i < epData.length; i++) {
                var serverObj = epData[i];
                var sName = serverObj.server_name || "Vietsub";
                var sList = serverObj.list || [];
                var serverEps = [];

                for (var j = 0; j < sList.length; j++) {
                    var ep = sList[j];
                    // Lấy đường link Iframe (vd: https://v1.streamvsmov.com/video/eb0041...)
                    var mediaLink = ep.embed || ep.link_embed || ep.m3u8 || ep.link || "";
                    if (mediaLink) {
                        serverEps.push({
                            id: mediaLink, // Đưa link Embed làm ID để gửi xuống parseDetailResponse
                            name: ep.name || "Tập " + (j + 1),
                            slug: ep.slug || ""
                        });
                    }
                }

                if (serverEps.length > 0) {
                    servers.push({
                        name: sName.replace(/[\r\n\t]+/g, ' ').trim(),
                        episodes: serverEps
                    });
                }
            }
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: desc,
            servers: servers 
        });
    } catch (error) {
        return JSON.stringify({
            id: url,
            title: "Phim",
            servers: []
        });
    }
}

// BẬT TRÌNH BẮT LINK TỰ ĐỘNG CỦA VAX APP (isEmbed: true)
function parseDetailResponse(html, url) {
    try {
        var targetUrl = url;

        // Trả về cờ isEmbed: true để nói với App: 
        // "Đây là link Iframe, hãy dùng trình duyệt ngầm mở nó ra để tóm lấy file .m3u8 bên trong, sau đó phát lên Native Player nhé"
        return JSON.stringify({
            url: targetUrl,
            isEmbed: true,
            hook: true, // Ép App bắt link ngay lập tức
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://vsmov.com/",
                "Origin": "https://vsmov.com"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
