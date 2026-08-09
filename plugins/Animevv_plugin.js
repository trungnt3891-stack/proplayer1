// =============================================================================
// PLUGIN MOVIE SCRAPER: ANIMEVIETSUB.MOM
// CHIẾN THUẬT: CẠO RAW HTML + PLAYER_DATA + BÓC VỎ NATIVE KÈM VIETSUB
// =============================================================================

var DOMAIN = "https://animevietsub.mom";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.0",
        "baseUrl": DOMAIN,
        "iconUrl": DOMAIN + "/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[AnimeVietSub] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[AnimeVietSub] " + msg);
    }
}

// =============================================================================
// TRANG CHỦ & DANH MỤC
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'anime-moi', title: 'MỚI CẬP NHẬT', type: 'Grid', path: '' },
        { slug: 'danh-sach/list-dang-chieu', title: 'ANIME ĐANG CHIẾU', type: 'Horizontal', path: '' },
        { slug: 'anime-sap-chieu', title: 'ANIME SẮP CHIẾU', type: 'Horizontal', path: '' },
        { slug: 'anime-bo', title: 'ANIME BỘ', type: 'Horizontal', path: '' },
        { slug: 'anime-le', title: 'ANIME LẺ (MOVIE)', type: 'Horizontal', path: '' },
        { slug: 'hoat-hinh-trung-quoc', title: 'HOẠT HÌNH TRUNG QUỐC', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'anime-moi' },
        { name: 'Đang Chiếu', slug: 'danh-sach/list-dang-chieu' },
        { name: 'Sắp Chiếu', slug: 'anime-sap-chieu' },
        { name: 'Anime Bộ', slug: 'anime-bo' },
        { name: 'Anime Lẻ', slug: 'anime-le' },
        { name: 'Hoạt Hình Trung Quốc', slug: 'hoat-hinh-trung-quoc' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Xem nhiều nhất', value: 'view' },
            { name: 'Đánh giá cao', value: 'rating' }
        ]
    });
}

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    var sort = 'latest';
    try {
        if (slug && slug.indexOf("http") === 0) return slug;
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            var parsed = JSON.parse(fixedJson);
            page = parsed.page || 1;
            sort = parsed.sort || 'latest';
        }
    } catch (e) {}

    if (!slug || slug === '/' || slug === 'home') slug = 'anime-moi';
    
    return DOMAIN + "/" + slug + "/trang-" + page + ".html?sort=" + sort;
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
    
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword)).replace(/%20/g, "+");
    return DOMAIN + "/tim-kiem/" + safeKeyword + "/trang-" + page + ".html";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return DOMAIN + (slug.startsWith('/') ? slug : '/' + slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS 
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        
        // Quét tìm tất cả các thẻ <article> hoặc <li> chứa phim
        var blockRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        var match;
        
        while ((match = blockRegex.exec(html)) !== null) {
            var block = match[1];
            
            var linkMatch = block.match(/href="([^"]+)"/i);
            var imgMatch = block.match(/src="([^"]+)"/i);
            var titleMatch = block.match(/<h2 class="Title">([^<]+)<\/h2>/i) || block.match(/alt="([^"]+)"/i);
            
            if (linkMatch && imgMatch && titleMatch) {
                var epsMatch = block.match(/<span class="mli-eps">([\s\S]*?)<\/span>/i);
                var scheduleMatch = block.match(/<span class="mli-timeschedule">([\s\S]*?)<\/span>/i);
                var qMatch = block.match(/<span class="Qlty">([^<]+)<\/span>/i);
                
                var epText = "";
                if (epsMatch) epText = epsMatch[1].replace(/<[^>]+>/g, '').trim();
                else if (scheduleMatch) epText = scheduleMatch[1].replace(/<[^>]+>/g, '').trim();

                items.push({
                    id: linkMatch[1], // Link gốc của phim
                    title: titleMatch[1].replace(/&[^;]+;/g, '').trim(),
                    posterUrl: imgMatch[1],
                    backdropUrl: imgMatch[1],
                    episode_current: epText,
                    quality: qMatch ? qMatch[1].trim() : "HD"
                });
            }
        }
        
        var currentPage = 1;
        var totalPages = 1;
        var curMatch = html.match(/<span class="current"[^>]*>(\d+)<\/span>/i);
        if (curMatch) currentPage = parseInt(curMatch[1]);
        
        var lastMatch = html.match(/Trang\s+1\s+của\s+(\d+)/i);
        if (lastMatch) totalPages = parseInt(lastMatch[1]);
        else totalPages = currentPage + 1;

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// BÓC TÁCH CHI TIẾT & DANH SÁCH TẬP (MỎ NEO VĨNH VIỄN)
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<h1 class="Title">([^<]+)<\/h1>/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(/Anime Vietsub.*/i, '').trim() : "";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) || html.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<div class="Description">([\s\S]*?)<\/div>/i);
        var desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        var servers = [];
        
        // Cạo Danh sách Server và Tập Phim từ mã HTML
        var serverBlockRegex = /<h3 class="server-name">([^<]+)<\/h3>\s*<ul class="list-episode[^"]*">([\s\S]*?)<\/ul>/gi;
        var svMatch;
        var backupServerCount = 1;
        
        while ((svMatch = serverBlockRegex.exec(html)) !== null) {
            var sName = svMatch[1].replace(/[\r\n\t]+/g, ' ').trim() || ("Server " + backupServerCount);
            var epBlock = svMatch[2];
            var serverEps = [];
            
            // Cạo từng nút bấm tập phim
            var epRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var epMatch;
            while ((epMatch = epRegex.exec(epBlock)) !== null) {
                var epLink = epMatch[1];
                var epName = epMatch[2].trim();
                
                if (epLink.indexOf('http') !== 0) epLink = DOMAIN + epLink;

                serverEps.push({
                    id: epLink, // ID là ĐƯỜNG LINK của trang web xem phim đó (Cố định, lưu lịch sử OK)
                    name: "Tập " + epName,
                    slug: epLink
                });
            }

            if (serverEps.length > 0) {
                servers.push({
                    name: sName,
                    episodes: serverEps
                });
                backupServerCount++;
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
        return JSON.stringify({ id: url, title: "Phim Hay", servers: [] });
    }
}

// =============================================================================
// BƯỚC QUAN TRỌNG: CẠO LẤY LINK IFRAME TỪ PLAYER_DATA
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var iframeUrl = "";

        // Quét tìm mảng dữ liệu PLAYER_DATA ẩn trong mã nguồn
        var playerDataMatch = html.match(/window\.PLAYER_DATA\s*=\s*(\{.*?\});/);
        if (playerDataMatch && playerDataMatch[1]) {
            var pData = JSON.parse(playerDataMatch[1]);
            iframeUrl = pData.link || pData.url || "";
        }

        // Dự phòng tìm kiếm <iframe src="...">
        if (!iframeUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) iframeUrl = iframeMatch[1];
        }

        if (iframeUrl && iframeUrl.indexOf('http') !== 0) {
            iframeUrl = "https:" + iframeUrl;
        }

        if (!iframeUrl) iframeUrl = url;

        // Bật Webview ẩn để qua mặt máy chủ và cạo M3U8 bên dưới
        return JSON.stringify({
            url: iframeUrl,
            isEmbed: true, 
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": DOMAIN + "/"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

// =============================================================================
// BÓC VỎ IFRAME: LẤY LUỒNG M3U8 + CẠO PHỤ ĐỀ (VTT/SRT) ĐẨY RA NATIVE PLAYER
// =============================================================================

function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    function isSub(arr, u) {
        for(var i=0; i<arr.length; i++){ if(arr[i].url===u) return true; }
        return false;
    }

    try {
        var domain = url.match(/^(https?:\/\/[^\/]+)/i) ? url.match(/^(https?:\/\/[^\/]+)/i)[1] : "";

        // 1. Quét Cạo Phụ Đề Tuyệt Đối
        var subRegex = /["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var subMatch;
        while ((subMatch = subRegex.exec(html)) !== null) {
            var sUrl = subMatch[1].replace(/\\/g, '');
            if (sUrl.indexOf('.m3u8') !== -1 || sUrl.indexOf('.mp4') !== -1) continue;
            if (!isSub(subtitles, sUrl)) subtitles.push({ url: sUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        // 2. Quét Cạo Phụ Đề Tương Đối 
        var relSubRegex = /["'](\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var rMatch;
        while ((rMatch = relSubRegex.exec(html)) !== null) {
            if (domain) {
                var sUrl2 = domain + rMatch[1].replace(/\\/g, '');
                if (sUrl2.indexOf('.m3u8') !== -1 || sUrl2.indexOf('.mp4') !== -1) continue;
                if (!isSub(subtitles, sUrl2)) subtitles.push({ url: sUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

        // 3. Quét Cấu Hình Tracks JWPlayer
        var tracksRegex = /tracks\s*:\s*\[(.*?)\]/gi;
        var trackMatch;
        while((trackMatch = tracksRegex.exec(html)) !== null) {
             var fileRegex = /"file"\s*:\s*"([^"]+)"/gi;
             var fMatch;
             while((fMatch = fileRegex.exec(trackMatch[1])) !== null) {
                 var tUrl = fMatch[1].replace(/\\/g, '');
                 if (tUrl.indexOf('.vtt') > -1 || tUrl.indexOf('.srt') > -1) {
                     if (tUrl.indexOf('http') !== 0 && domain) tUrl = domain + tUrl;
                     if (!isSub(subtitles, tUrl)) subtitles.push({ url: tUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
                 }
             }
        }

        // 4. Lấy Luồng Video Streaming
        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        // Mở Native Player khi túm được video
        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, // Ép tắt Webview, phát thẳng trên App
                subtitles: subtitles, // Cung cấp mảng Vietsub
                proxy: true,
                headers: {
                    "Referer": url, 
                    "Origin": domain
                }
            });
        }

        // Dùng Mồi Câu JS nếu Web mã hóa luồng Video
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            subtitles: subtitles, 
            script: "setTimeout(function(){document.body.click();var b=document.querySelector('.jw-video,.vjs-big-play-button,.plyr__control--overlaid,#player,.play-icon');if(b)b.click();var v=document.querySelector('video');if(v){v.muted=true;v.play();}},1000);"
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
