// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: BẮT LINK BẰNG HOOK + EMBEDTOPLAY + TỰ ĐỘNG CẠO PHỤ ĐỀ (VIETSUB)
// =============================================================================

var DOMAIN = "https://vsmov.com";
var BASEURL = DOMAIN; 

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.7.2",
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

// BÓC TÁCH TẬP PHIM TỪ JSON VÀ ĐẨY RA NGOÀI GIAO DIỆN NATIVE
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
                    var mediaLink = ep.embed || ep.link_embed || ep.m3u8 || ep.link || "";
                    if (mediaLink) {
                        serverEps.push({
                            id: mediaLink, 
                            name: ep.name || "Tập " + (j + 1),
                            slug: ep.slug || ""
                        });
                    }
                }

                if (serverEps.length > 0) {
                    servers.push({
                        name: sName.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
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
        return JSON.stringify({ id: url, title: "Phim", servers: [] });
    }
}

// BƯỚC 1: KHỞI TẠO WEBVIEW (CHƯA BẬT HOOK VỘI ĐỂ NHƯỜNG BƯỚC CHO HÀM SAU LẤY PHỤ ĐỀ)
function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            url: url,
            isEmbed: true, 
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://vsmov.com/"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

// BƯỚC 2: CẠO PHỤ ĐỀ -> BẬT HOOK BẮT LINK -> ĐẨY RA NATIVE PLAYER
function parseEmbedResponse(html, url) {
    var subtitles = [];
    
    try {
        // Cạo Phụ Đề Cách 1: Quét trực tiếp định dạng .vtt và .srt trong toàn bộ HTML
        var vttRegex = /"([^"'\s]*\.(?:vtt|srt)[^"'\s]*)"/gi;
        var match;
        while ((match = vttRegex.exec(html)) !== null) {
            var subUrl = match[1].replace(/\\/g, '');
            if (subUrl.indexOf('http') !== 0) {
                if (subUrl.indexOf('/') === 0) {
                    var baseUrlMatch = url.match(/^(https?:\/\/[^\/]+)/i);
                    if (baseUrlMatch) subUrl = baseUrlMatch[1] + subUrl;
                } else continue;
            }
            var isDup = false;
            for (var i = 0; i < subtitles.length; i++) { if (subtitles[i].url === subUrl) isDup = true; }
            if (!isDup) subtitles.push({ url: subUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        // Cạo Phụ Đề Cách 2: Lùng sục mảng 'tracks' của JWPlayer đề phòng API giấu đuôi file
        var tracksMatch = html.match(/tracks\s*:\s*(\[[^\]]+\])/i);
        if (tracksMatch) {
            var block = tracksMatch[1];
            var fileRegex = /file\s*:\s*["']([^"']+)["']/gi;
            var fm;
            while ((fm = fileRegex.exec(block)) !== null) {
                var subUrl2 = fm[1].replace(/\\/g, '');
                // Bỏ qua các định dạng không phải phụ đề
                if (subUrl2.indexOf('.m3u8') !== -1 || subUrl2.indexOf('.mp4') !== -1 || subUrl2.indexOf('.jpg') !== -1 || subUrl2.indexOf('.png') !== -1) continue;
                
                if (subUrl2.indexOf('http') !== 0) {
                    if (subUrl2.indexOf('/') === 0) {
                        var baseUrlMatch2 = url.match(/^(https?:\/\/[^\/]+)/i);
                        if (baseUrlMatch2) subUrl2 = baseUrlMatch2[1] + subUrl2;
                    } else continue;
                }
                var isDup2 = false;
                for (var j = 0; j < subtitles.length; j++) { if (subtitles[j].url === subUrl2) isDup2 = true; }
                if (!isDup2) subtitles.push({ url: subUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }
    } catch (e) {}

    // Kích hoạt tóm link ngầm và truyền Phụ Đề vào Player
    var scriptTrigger = "setTimeout(function(){ document.body.click(); var btn=document.querySelector('.jw-icon-display, .vjs-big-play-button, .plyr__control--overlaid, #player'); if(btn) btn.click(); var vid=document.querySelector('video'); if(vid){ vid.muted=true; vid.play(); } }, 1500);";

    return JSON.stringify({ 
        url: url, 
        isEmbed: true, 
        hook: true,          // Bật Hook tóm link mạng sau khi đã găm xong mảng phụ đề
        embedtoplay: true,   // Ném qua Native Player
        subtitles: subtitles,// Bơm mảng Subtitle vào Native Player
        script: scriptTrigger
    });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
