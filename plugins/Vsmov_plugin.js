// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (STABLE NATIVE PLAYER & EMBED SUB)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.5.1",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
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
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        }
    } catch (e) {}

    if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') slug = 'phim-moi';

    var danhSachSlugs = ['phim-moi', 'phim-bo', 'phim-le', 'dang-chieu', '4k', 'long-tieng', 'thuyet-minh', 'subteam'];
    var basePath = "the-loai"; 
    
    if (danhSachSlugs.indexOf(slug) !== -1) {
        basePath = "danh-sach";
    }

    return "https://vsmov.com/" + basePath + "/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {}
    
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return "https://vsmov.com/?search=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
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
                id: slug,
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

// BÓC TÁCH CHI TIẾT VÀ LẤY CHUẨN XÁC LINK STREAM/EMBED CỦA TỪNG TẬP
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
        
        var episodesJson = html.match(/var\s+embedEpisodes\s*=\s*(\[\{[\s\S]*?\}\]);/i);
        if (!episodesJson) {
            episodesJson = html.match(/var\s+episodes\s*=\s*(\[\{[\s\S]*?\}\]);/i);
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
                    // Lấy link embed hoặc m3u8 trực tiếp do server stream cung cấp
                    var mediaLink = ep.m3u8 || ep.embed || ep.link_embed || ep.link || "";

                    if (mediaLink) {
                        serverEps.push({
                            id: mediaLink, // Đưa thẳng link stream/embed vào ID để player nhận diện
                            name: ep.name || "Tập " + (j + 1),
                            slug: ep.slug || ""
                        });
                    }
                }

                if (serverEps.length > 0) {
                    sName = sName.replace(/[\r\n\t]+/g, ' ').trim();
                    servers.push({
                        name: sName,
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
        return "null";
    }
}

// CẤU HÌNH TRÌNH PHÁT STABLE (CHẠY NATIVE/EMBED KHÔNG TỰ ĐỘNG PHÁT, KHÔNG TỰ PHÓNG TO)
function parseDetailResponse(html, url) {
    return JSON.stringify({
        url: url,
        isEmbed: false, // Dùng Native Player để tải luồng mượt mà
        autoPlay: false,
        fullscreen: false,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Referer": "https://vsmov.com/",
            "Origin": "https://vsmov.com"
        },
        subtitles: []
    });
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: false, autoPlay: false, fullscreen: false });
}

function parseCategoriesResponse(apiResponseJson) {
    return "[]"; 
}

function parseCountriesResponse(apiResponseJson) {
    return "[]"; 
}
