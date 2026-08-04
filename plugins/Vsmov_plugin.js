// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (NATIVE EPISODE SELECTOR + WEBVIEW PLAYER)
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.1.9",
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
        var fixedJson = typeof filtersJson === 'string' && filtersJson !== "" ? filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':') : "";
        if (fixedJson) {
            page = JSON.parse(fixedJson).page || 1;
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
        var fixedJson = typeof filtersJson === 'string' && filtersJson !== "" ? filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':') : "";
        if (fixedJson) {
            page = JSON.parse(fixedJson).page || 1;
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

// BÓC TÁCH DANH SÁCH TẬP VÀ TRỎ TRỰC TIẾP VỀ URL TRANG XEM TẬP PHIM CHÍNH HÃNG ĐỂ HIỆN SUB
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
        
        var episodesJson = null;
        var matchEmbed = html.match(/var\s+embedEpisodes\s*=\s*(\[[\s\S]*?\]);\s*var\s+m3u8Episodes/i);
        if (matchEmbed && matchEmbed[1]) {
            episodesJson = matchEmbed[1];
        } else {
            var matchFallback = html.match(/(?:var|let)\s+embedEpisodes\s*=\s*(\[[\s\S]*?\]);/i) || html.match(/(?:var|let)\s+episodes\s*=\s*(\[[\s\S]*?\]);/i);
            if (matchFallback && matchFallback[1]) {
                episodesJson = matchFallback[1];
            }
        }

        if (episodesJson) {
            try {
                var epData = JSON.parse(episodesJson);
                for (var i = 0; i < epData.length; i++) {
                    var serverObj = epData[i];
                    var sName = serverObj.server_name || "Vietsub";
                    var sList = serverObj.list || [];
                    var serverEps = [];

                    for (var j = 0; j < sList.length; j++) {
                        var ep = sList[j];
                        var watchSlug = ep.slug || "";
                        
                        // Ghép nối URL chuẩn xác tới trang xem tập phim của website
                        var episodeWebLink = "";
                        if (watchSlug.indexOf("http") === 0) {
                            episodeWebLink = watchSlug;
                        } else {
                            var cleanBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                            episodeWebLink = cleanBaseUrl + "/" + (watchSlug.startsWith('/') ? watchSlug.slice(1) : watchSlug);
                        }

                        if (watchSlug) {
                            serverEps.push({
                                id: episodeWebLink, // Trỏ thẳng về trang xem tập phim để load đầy đủ sub và giao diện web
                                name: ep.name || "Tập " + (j + 1),
                                slug: watchSlug
                            });
                        }
                    }

                    if (serverEps.length > 0) {
                        sName = sName.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
                        servers.push({
                            name: sName,
                            episodes: serverEps
                        });
                    }
                }
            } catch (jsonErr) {}
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

// MỞ WEBVIEW TOÀN TRANG GỐC ĐỂ TRÌNH PHÁT TỰ ĐỘNG LOAD ĐỦ SUB VÀ TÙY CHỌN
function parseDetailResponse(html, url) {
    var customJs = "document.querySelectorAll('header, footer, nav, aside, .ads, .sidebar, iframe[sandbox]').forEach(function(e){e.style.display='none'});";
    
    return JSON.stringify({
        url: url, // Link URL trang xem tập nguyên bản
        isEmbed: true, // Chạy qua Webview toàn trang
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Referer": "https://vsmov.com/",
            "Custom-Js": customJs 
        }
    });
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(apiResponseJson) {
    return "[]"; 
}

function parseCountriesResponse(apiResponseJson) {
    return "[]"; 
}
