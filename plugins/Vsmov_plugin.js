// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: CẠO SẠCH PHỤ ĐỀ (VTT/SRT) TỪ IFRAME + HOOK VIDEO PHÁT NATIVE
// =============================================================================

var DOMAIN = "https://vsmov.com";
var BASEURL = DOMAIN; 

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.8.0",
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
// DATA PARSERS 
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
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// ĐỌC API JSON CỦA BẠN ĐỂ LẤY DANH SÁCH TẬP PHIM CHUẨN XÁC
function parseMovieDetail(html, url) {
    try {
        var title = "";
        var posterUrl = "";
        var desc = "";
        var servers = [];

        // Nếu API trả về chuỗi JSON (như bạn cung cấp)
        if (html.trim().indexOf('{') === 0) {
            var json = JSON.parse(html);
            if (json.movie) {
                title = json.movie.name || "";
                posterUrl = json.movie.poster_url || json.movie.thumb_url || "";
                desc = json.movie.content || "";
                
                var eps = json.episodes || [];
                for (var i = 0; i < eps.length; i++) {
                    var sName = eps[i].server_name || "Vietsub";
                    // Hỗ trợ cả 2 chuẩn API: server_data hoặc list
                    var sData = eps[i].server_data || eps[i].list || [];
                    var serverEps = [];

                    for (var j = 0; j < sData.length; j++) {
                        var ep = sData[j];
                        var mediaLink = ep.link_embed || ep.embed || ep.m3u8 || ep.link || "";
                        if (mediaLink) {
                            serverEps.push({
                                id: mediaLink, // URL Iframe Embed
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
                
                return JSON.stringify({
                    id: url,
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    description: desc,
                    servers: servers
                });
            }
        }

        // Dự phòng: Bóc tách bằng HTML nếu là trang web bình thường
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        title = titleMatch ? titleMatch[1].replace(/- VSMOV.*/i, '').replace('Phim ', '').trim() : "";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        posterUrl = posterMatch ? posterMatch[1] : "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = "https://vsmov.com" + posterUrl;

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        desc = descMatch ? descMatch[1].trim() : "";

        var episodesJson = html.match(/var\s+episodes\s*=\s*(\[\{[\s\S]*?\}\]);/i) || html.match(/var\s+embedEpisodes\s*=\s*(\[\{[\s\S]*?\}\]);/i);
        
        if (episodesJson && episodesJson[1]) {
            var epData = JSON.parse(episodesJson[1]);
            for (var k = 0; k < epData.length; k++) {
                var serverObj = epData[k];
                var sName2 = serverObj.server_name || "Vietsub";
                var sList2 = serverObj.list || serverObj.server_data || [];
                var serverEps2 = [];

                for (var m = 0; m < sList2.length; m++) {
                    var ep2 = sList2[m];
                    var mediaLink2 = ep2.embed || ep2.link_embed || ep2.m3u8 || ep2.link || "";
                    if (mediaLink2) {
                        serverEps2.push({
                            id: mediaLink2,
                            name: ep2.name || "Tập " + (m + 1),
                            slug: ep2.slug || ""
                        });
                    }
                }

                if (serverEps2.length > 0) {
                    servers.push({
                        name: sName2.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
                        episodes: serverEps2
                    });
                }
            }
        }

        return JSON.stringify({
            id: url, title: title, posterUrl: posterUrl, backdropUrl: posterUrl, description: desc, servers: servers 
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Phim", servers: [] });
    }
}

// BƯỚC 1: TRUYỀN LINK IFRAME CHO HỆ THỐNG ĐỂ TẢI NGẦM TRANG WEB HTML
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

// BƯỚC 2: CẠO CẠN ĐÁY HTML TÌM PHỤ ĐỀ -> BẬT HOOK NÉM RA TRÌNH PHÁT GỐC (NATIVE)
function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    try {
        // --- 1. TÌM VÀ CẠO CÁC FILE VTT/SRT TRONG HTML ---
        var subRegex = /(https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)/gi;
        var subMatch;
        while ((subMatch = subRegex.exec(html)) !== null) {
            var sUrl = subMatch[1].replace(/\\/g, '');
            var isDup = false;
            for (var i = 0; i < subtitles.length; i++) { if (subtitles[i].url === sUrl) isDup = true; }
            if (!isDup) subtitles.push({ url: sUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        // Lấy domain của iframe để xử lý các link phụ đề dạng /path/to/sub.vtt
        var domainMatch = url.match(/^(https?:\/\/[^\/]+)/i);
        var domain = domainMatch ? domainMatch[1] : "";
        var relSubRegex = /["'](\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var rMatch;
        
        while ((rMatch = relSubRegex.exec(html)) !== null) {
            if (domain) {
                var sUrl2 = domain + rMatch[1].replace(/\\/g, '');
                var isDup2 = false;
                for (var j = 0; j < subtitles.length; j++) { if (subtitles[j].url === sUrl2) isDup2 = true; }
                if (!isDup2) subtitles.push({ url: sUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

        // Quét cấu trúc tracks của JWPlayer (Dành riêng cho web chiếu phim)
        var tracksRegex = /tracks\s*:\s*\[(.*?)\]/gi;
        var trackMatch;
        while((trackMatch = tracksRegex.exec(html)) !== null) {
             var fileRegex = /"file"\s*:\s*"([^"]+)"/gi;
             var fMatch;
             while((fMatch = fileRegex.exec(trackMatch[1])) !== null) {
                 var tUrl = fMatch[1].replace(/\\/g, '');
                 if (tUrl.indexOf('.vtt') > -1 || tUrl.indexOf('.srt') > -1) {
                     if (tUrl.indexOf('http') !== 0 && domain) tUrl = domain + tUrl;
                     var isDup3 = false;
                     for (var k = 0; k < subtitles.length; k++) { if(subtitles[k].url === tUrl) isDup3 = true; }
                     if (!isDup3) subtitles.push({ url: tUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
                 }
             }
        }

        // --- 2. TÌM LINK M3U8 TRONG HTML ---
        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        // --- 3. ĐÓNG GÓI NÉM SANG NATIVE PLAYER ---
        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, 
                subtitles: subtitles, // Cung cấp phụ đề VTT lấy được cho Trình phát gốc
                proxy: true,
                headers: {
                    "Referer": url, 
                    "Origin": domain
                }
            });
        }

        // TRƯỜNG HỢP API ẨN VIDEO: Bật Hook lấy Video kết hợp Bơm Phụ Đề
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,          // Bật Hook tóm luồng Video
            embedtoplay: true,   // Ném video sang Trình phát gốc
            subtitles: subtitles,// Bơm toàn bộ Phụ Đề vừa cạo được vào Trình phát gốc
            script: "setTimeout(function(){document.body.click();var b=document.querySelector('.jw-video,.vjs-big-play-button,.plyr__control--overlaid,#player');if(b)b.click();var v=document.querySelector('video');if(v){v.muted=true;v.play();}},1000);"
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
