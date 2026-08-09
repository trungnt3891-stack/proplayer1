// =============================================================================
// PLUGIN MOVIE SCRAPER: ANIMEVIETSUB.MOM
// CHIẾN THUẬT: CẠO THẺ ANCHOR ĐA NĂNG TRANG CHỦ + BÓC NATIVE KÈM VIETSUB
// =============================================================================

var DOMAIN = "https://animevietsub.mom";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.1",
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
            { name: 'Xem nhiều nhất', value: 'view' }
        ]
    });
}

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (slug && slug.indexOf("http") === 0) return slug;
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            var parsed = JSON.parse(fixedJson);
            page = parsed.page || 1;
        }
    } catch (e) {}

    if (!slug || slug === '/' || slug === 'home') slug = 'anime-moi';
    
    // Cấu trúc URL của AnimeVietSub: /anime-moi/trang-2.html
    return DOMAIN + "/" + slug + "/trang-" + page + ".html";
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
// DATA PARSERS: ĐÃ SỬA LỖI TRANG CHỦ
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var addedIds = {}; // Bộ lọc chống trùng lặp phim
        
        // Quét tất cả các thẻ <a> (Anchor) chứa link phim thay vì phụ thuộc vào thẻ <article>
        var aRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var link = match[1];
            var innerHtml = match[2];

            // Đảm bảo đây là link phim thực sự, không phải link rác
            if (link.indexOf('/phim/') === -1) continue;

            // Bắt buộc bên trong phải có chứa ảnh (tránh bắt nhầm text menu)
            var imgMatch = innerHtml.match(/<img[^>]+src="([^"]+)"/i);
            if (!imgMatch) continue;
            
            var posterUrl = imgMatch[1];
            if (posterUrl.indexOf("http") !== 0) posterUrl = DOMAIN + posterUrl;

            // Bắt Tiêu đề phim (nằm trong thẻ Title hoặc thuộc tính alt của ảnh)
            var titleMatch = innerHtml.match(/class="Title"[^>]*>([^<]+)<\//i);
            if (!titleMatch) {
                titleMatch = innerHtml.match(/alt="([^"]+)"/i);
            }
            var title = titleMatch ? titleMatch[1].replace(/&[^;]+;/g, '').trim() : "";
            
            if (!title) continue;

            // Bắt số tập hoặc trạng thái lịch chiếu
            var epsMatch = innerHtml.match(/class="mli-eps">([\s\S]*?)<\/span>/i) || innerHtml.match(/class="mli-timeschedule"[^>]*>([\s\S]*?)<\/span>/i);
            var epText = epsMatch ? epsMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

            // Bắt chất lượng phim
            var qMatch = innerHtml.match(/class="Qlty"[^>]*>([^<]+)<\/span>/i);
            var quality = qMatch ? qMatch[1].trim() : "HD";

            // Nếu chưa có trong danh sách thì thêm vào
            if (!addedIds[link]) {
                items.push({
                    id: link.indexOf('http') !== 0 ? DOMAIN + link : link, 
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    episode_current: epText,
                    quality: quality
                });
                addedIds[link] = true;
            }
        }
        
        // Quét hệ thống phân trang
        var currentPage = 1;
        var totalPages = 1;
        
        var curMatch = html.match(/<span class="current"[^>]*>(\d+)<\/span>/i) || html.match(/class="page-numbers current"[^>]*>(\d+)<\/span>/i);
        if (curMatch) currentPage = parseInt(curMatch[1]);
        
        var lastMatch = html.match(/href="[^"]*\/trang-(\d+)\.html"[^>]*>Cuối/i) || html.match(/href="[^"]*\/trang-(\d+)\.html"[^>]*class="last"/i);
        if (lastMatch) {
            totalPages = parseInt(lastMatch[1]);
        } else {
            // Quét tìm số trang lớn nhất nếu không có nút "Cuối"
            var pageLinks = html.match(/href="[^"]*\/trang-(\d+)\.html"/gi);
            if (pageLinks) {
                for (var i = 0; i < pageLinks.length; i++) {
                    var pNumMatch = pageLinks[i].match(/trang-(\d+)\.html/i);
                    if (pNumMatch) {
                        var pNum = parseInt(pNumMatch[1]);
                        if (pNum > totalPages) totalPages = pNum;
                    }
                }
            }
        }

        if (totalPages < currentPage) totalPages = currentPage;

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
// BÓC TÁCH CHI TIẾT & DANH SÁCH TẬP
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<h1 class="Title">([^<]+)<\/h1>/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(/Anime Vietsub.*/i, '').replace(/\|.*/i, '').trim() : "";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) || html.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<div class="Description">([\s\S]*?)<\/div>/i);
        var desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        var servers = [];
        var serverBlockRegex = /<h3 class="server-name">([^<]+)<\/h3>\s*<ul class="list-episode[^"]*">([\s\S]*?)<\/ul>/gi;
        var svMatch;
        var backupServerCount = 1;
        
        while ((svMatch = serverBlockRegex.exec(html)) !== null) {
            var sName = svMatch[1].replace(/[\r\n\t]+/g, ' ').trim() || ("Server " + backupServerCount);
            var epBlock = svMatch[2];
            var serverEps = [];
            
            var epRegex = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var epMatch;
            while ((epMatch = epRegex.exec(epBlock)) !== null) {
                var epLink = epMatch[1];
                var epName = epMatch[2].replace(/<[^>]+>/g, '').trim();
                
                if (epLink.indexOf('http') !== 0) {
                    epLink = DOMAIN + (epLink.startsWith('/') ? epLink : '/' + epLink);
                }

                serverEps.push({
                    id: epLink, // ID là link gốc trang xem phim
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

        // Dự phòng nếu regex phía trên không khớp
        if (servers.length === 0) {
            var backupEpRegex = /<a[^>]*href="([^"]+)"[^>]*title="[^"]*tập[^"]*"[^>]*>([^<]+)<\/a>/gi;
            var bkMatch;
            var bkEps = [];
            while ((bkMatch = backupEpRegex.exec(html)) !== null) {
                var bLink = bkMatch[1];
                if (bLink.indexOf('http') !== 0) bLink = DOMAIN + (bLink.startsWith('/') ? bLink : '/' + bLink);
                bkEps.push({
                    id: bLink,
                    name: "Tập " + bkMatch[2].replace(/<[^>]+>/g, '').trim(),
                    slug: bLink
                });
            }
            if (bkEps.length > 0) {
                servers.push({ name: "Mặc Định", episodes: bkEps });
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
        return JSON.stringify({ id: url, title: "Lỗi Tải Phim", servers: [] });
    }
}

// =============================================================================
// LẤY LINK IFRAME TỪ CẤU TRÚC BÍ MẬT PLAYER_DATA
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var iframeUrl = "";

        // Quét cấu trúc ẩn window.PLAYER_DATA
        var playerDataMatch = html.match(/window\.PLAYER_DATA\s*=\s*(\{.*?\});/);
        if (playerDataMatch && playerDataMatch[1]) {
            var pData = JSON.parse(playerDataMatch[1]);
            iframeUrl = pData.link || pData.url || "";
        }

        // Fallback quét thẻ Iframe
        if (!iframeUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) iframeUrl = iframeMatch[1];
        }

        if (iframeUrl && iframeUrl.indexOf('http') !== 0) {
            if(iframeUrl.startsWith('//')) iframeUrl = "https:" + iframeUrl;
        }

        if (!iframeUrl) iframeUrl = url;

        // Bật Webview ẩn đi săn link M3U8
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
// BÓC VỎ IFRAME: LẤY M3U8 + CẠO PHỤ ĐỀ (VTT/SRT)
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

        var subRegex = /["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var subMatch;
        while ((subMatch = subRegex.exec(html)) !== null) {
            var sUrl = subMatch[1].replace(/\\/g, '');
            if (sUrl.indexOf('.m3u8') !== -1 || sUrl.indexOf('.mp4') !== -1) continue;
            if (!isSub(subtitles, sUrl)) subtitles.push({ url: sUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        var relSubRegex = /["'](\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var rMatch;
        while ((rMatch = relSubRegex.exec(html)) !== null) {
            if (domain) {
                var sUrl2 = domain + rMatch[1].replace(/\\/g, '');
                if (sUrl2.indexOf('.m3u8') !== -1 || sUrl2.indexOf('.mp4') !== -1) continue;
                if (!isSub(subtitles, sUrl2)) subtitles.push({ url: sUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

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

        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, 
                subtitles: subtitles, 
                proxy: true,
                headers: {
                    "Referer": url, 
                    "Origin": domain
                }
            });
        }

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
