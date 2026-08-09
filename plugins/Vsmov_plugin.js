// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: CẠO CẠN ĐÁY HTML LẤY PHỤ ĐỀ (VTT/SRT) + PHÁT NATIVE
// =============================================================================

var DOMAIN = "https://vsmov.com";
var BASEURL = DOMAIN; 

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.7.4",
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

// BÓC TÁCH CHI TIẾT VÀ TẠO DANH SÁCH TẬP
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
                    // Lấy link Iframe truyền vào hàm parseDetailResponse
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

// BƯỚC 1: TRUYỀN LINK IFRAME CHO HỆ THỐNG TẢI NGẦM
function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            url: url,
            isEmbed: true, // Ép tải qua hàm parseEmbedResponse
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://vsmov.com/"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

// BƯỚC 2: CẠO SẠCH PHỤ ĐỀ (VTT/SRT) VÀ VIDEO TRONG IFRAME -> PHÁT NATIVE
function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    try {
        // --- 1. CHIẾN DỊCH CẠO PHỤ ĐỀ ---
        // Lục lọi tất cả các URL có đuôi .vtt hoặc .srt (hỗ trợ cả dấu nháy đơn, nháy kép)
        var subRegex = /["']([^"']*\.(?:vtt|srt|txt)[^"']*)["']/gi;
        var matchSub;
        while ((matchSub = subRegex.exec(html)) !== null) {
            var subUrl = matchSub[1].replace(/\\/g, ''); // Xóa ký tự gạch chéo dư thừa
            
            // Bỏ qua nếu bắt nhầm link video/ảnh
            if (subUrl.indexOf('.m3u8') !== -1 || subUrl.indexOf('.mp4') !== -1 || subUrl.indexOf('.jpg') !== -1) continue;

            // Xử lý link tương đối (vd: /sub/vietsub.vtt) thành link tuyệt đối
            if (subUrl.indexOf('http') !== 0) {
                if (subUrl.indexOf('/') === 0) {
                    var domainMatch = url.match(/^(https?:\/\/[^\/]+)/i);
                    if (domainMatch) subUrl = domainMatch[1] + subUrl;
                } else {
                    continue; // Bỏ qua link lỗi
                }
            }
            
            // Ngăn chặn Add trùng lặp
            var isDup = false;
            for (var i = 0; i < subtitles.length; i++) { 
                if (subtitles[i].url === subUrl) isDup = true; 
            }
            if (!isDup) {
                subtitles.push({ 
                    url: subUrl, 
                    name: "Vietsub " + (subtitles.length > 0 ? subtitles.length + 1 : ""), 
                    lang: "vi" 
                });
            }
        }

        // --- 2. CHIẾN DỊCH CẠO VIDEO ---
        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        // --- 3. ĐẨY SANG NATIVE PLAYER ---
        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, // Phát thẳng, dẹp Webview
                subtitles: subtitles, // Găm phụ đề vào
                headers: {
                    "Referer": url, // Trùng với link Iframe
                    "Origin": url.match(/^(https?:\/\/[^\/]+)/i) ? url.match(/^(https?:\/\/[^\/]+)/i)[1] : "https://vsmov.com"
                }
            });
        }

        // DỰ PHÒNG: Nếu video bị giấu sâu bằng API, bật Hook bắt tự động nhưng VẪN bơm Phụ đề
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            subtitles: subtitles, // Cứu vớt phụ đề đã cạo được
            script: "setTimeout(function(){document.body.click();var b=document.querySelector('.jw-video,.vjs-big-play-button,.plyr__control--overlaid,#player');if(b)b.click();var v=document.querySelector('video');if(v){v.muted=true;v.play();}},1000);"
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
