// =============================================================================
// PLUGIN MOVIE SCRAPER: ANIMEVIETSUB.MOM
// VERSION: 1.1.3
// CHIẾN THUẬT: CẮT CHUỖI ÉP LOAD 1000+ TẬP & HOOK XUYÊN PHÁ 3 LỚP QUẢNG CÁO
// =============================================================================

var DOMAIN = "https://animevietsub.mom";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.3",
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
            var parsed = JSON.parse(filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':'));
            page = parsed.page || 1;
        }
    } catch (e) {}

    if (!slug || slug === '/' || slug === 'home') slug = 'anime-moi';
    return DOMAIN + "/" + slug + "/trang-" + page + ".html";
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':')).page || 1;
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
// BÓC TÁCH DANH SÁCH PHIM
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var addedIds = {}; 
        var aRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var link = match[1];
            var innerHtml = match[2];

            if (link.indexOf('/phim/') === -1) continue;

            var imgMatch = innerHtml.match(/<img[^>]+src="([^"]+)"/i);
            if (!imgMatch) continue;
            
            var posterUrl = imgMatch[1];
            if (posterUrl.indexOf("http") !== 0) posterUrl = DOMAIN + posterUrl;

            var titleMatch = innerHtml.match(/class="Title"[^>]*>([^<]+)<\//i);
            if (!titleMatch) {
                titleMatch = innerHtml.match(/alt="([^"]+)"/i);
            }
            var title = titleMatch ? titleMatch[1].replace(/&[^;]+;/g, '').trim() : "";
            
            if (!title) continue;

            var epsMatch = innerHtml.match(/class="mli-eps">([\s\S]*?)<\/span>/i) || innerHtml.match(/class="mli-timeschedule"[^>]*>([\s\S]*?)<\/span>/i);
            var epText = epsMatch ? epsMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

            var qMatch = innerHtml.match(/class="Qlty"[^>]*>([^<]+)<\/span>/i);
            var quality = qMatch ? qMatch[1].trim() : "HD";

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
        
        var currentPage = 1;
        var totalPages = 1;
        
        var curMatch = html.match(/<span class="current"[^>]*>(\d+)<\/span>/i) || html.match(/class="page-numbers current"[^>]*>(\d+)<\/span>/i);
        if (curMatch) currentPage = parseInt(curMatch[1]);
        
        var lastMatch = html.match(/href="[^"]*\/trang-(\d+)\.html"[^>]*>Cuối/i) || html.match(/href="[^"]*\/trang-(\d+)\.html"[^>]*class="last"/i);
        if (lastMatch) {
            totalPages = parseInt(lastMatch[1]);
        } else {
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
// CHIẾN THUẬT MỚI: BÓC TÁCH CHI TIẾT & TẬP PHIM BẰNG CẮT CHUỖI NGUYÊN THỦY
// (CHỐNG TRÀN BỘ NHỚ VỚI CÁC PHIM CÓ >1000 TẬP)
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
        
        // Chia khối máy chủ bằng Split thay vì Regex
        var sBlocks = html.split('class="server-name"');
        
        if (sBlocks.length < 2) {
            sBlocks = ["", html]; // Dự phòng nếu giao diện đổi tên class
        }

        for (var i = 1; i < sBlocks.length; i++) {
            var block = sBlocks[i];
            
            // Lọc tên Server
            var sName = "Server " + i;
            var nameEnd = block.indexOf('</h3>');
            if (nameEnd !== -1 && block.indexOf('>') !== -1) {
                var tmpName = block.substring(block.indexOf('>') + 1, nameEnd).replace(/<[^>]+>/g, '').trim();
                if(tmpName) sName = tmpName;
            }

            // Khoanh vùng cụm danh sách tập
            var ulStart = block.indexOf('<ul class="list-episode');
            if (ulStart === -1) ulStart = block.indexOf('<ul id="list-episode');
            if (ulStart === -1) continue;

            var ulEnd = block.indexOf('</ul>', ulStart);
            if (ulEnd === -1) ulEnd = block.length;

            var epBlock = block.substring(ulStart, ulEnd);
            var epItems = epBlock.split('<a ');
            var serverEps = [];

            // Quét từng nút bấm
            for (var j = 1; j < epItems.length; j++) {
                var epHtml = epItems[j];
                
                // Lấy Link href="..."
                var hrefStart = epHtml.indexOf('href="');
                if (hrefStart === -1) continue;
                hrefStart += 6;
                var hrefEnd = epHtml.indexOf('"', hrefStart);
                var epLink = epHtml.substring(hrefStart, hrefEnd);

                // Lấy Tên Tập (Ưu tiên title="..." trước, sau đó tới Text bên trong)
                var titleStr = "";
                var titleStart = epHtml.indexOf('title="');
                if (titleStart !== -1) {
                    titleStart += 7;
                    var titleEnd = epHtml.indexOf('"', titleStart);
                    titleStr = epHtml.substring(titleStart, titleEnd).trim();
                }

                var textStart = epHtml.indexOf('>');
                var textEnd = epHtml.indexOf('</a>');
                var innerText = "";
                if (textStart !== -1 && textEnd !== -1) {
                    innerText = epHtml.substring(textStart + 1, textEnd).replace(/<[^>]+>/g, '').trim();
                }

                var epName = titleStr ? titleStr : ("Tập " + innerText);

                if (epLink.indexOf('http') !== 0) {
                    epLink = DOMAIN + (epLink.startsWith('/') ? epLink : '/' + epLink);
                }

                serverEps.push({
                    id: epLink,
                    name: epName,
                    slug: epLink
                });
            }

            if (serverEps.length > 0) {
                servers.push({
                    name: sName,
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

    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi Tải Phim", servers: [] });
    }
}

// =============================================================================
// LẤY LINK IFRAME & QUẢN LÝ PLAYER_DATA
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var iframeUrl = "";

        // 1. Quét tìm khối JSON PLAYER_DATA bằng Cắt Chuỗi cho an toàn
        var pdIdx = html.indexOf('window.PLAYER_DATA');
        if (pdIdx > -1) {
            var jsonStart = html.indexOf('{', pdIdx);
            var jsonEnd = html.indexOf('};', jsonStart);
            if(jsonEnd === -1) jsonEnd = html.indexOf('}</script>', jsonStart);
            
            if (jsonStart > -1 && jsonEnd > -1) {
                try {
                    var jsonStr = html.substring(jsonStart, jsonEnd + 1);
                    var pData = JSON.parse(jsonStr);
                    
                    if (typeof pData.link === 'string') {
                        iframeUrl = pData.link;
                    } else if (Array.isArray(pData.link) && pData.link.length > 0) {
                        // Trường hợp App may mắn bóc được link API m3u8 thuần
                        return JSON.stringify({
                            url: pData.link[0].file,
                            isEmbed: false,
                            headers: { "Referer": DOMAIN + "/" }
                        });
                    }
                } catch(e){}
            }
        }

        // 2. Dự phòng quét thẻ Iframe trần
        if (!iframeUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) iframeUrl = iframeMatch[1];
        }

        if (iframeUrl) {
            if (iframeUrl.startsWith('//')) {
                iframeUrl = "https:" + iframeUrl;
            } else if (iframeUrl.startsWith('/')) {
                iframeUrl = DOMAIN + iframeUrl;
            }
            
            return JSON.stringify({
                url: iframeUrl,
                isEmbed: true, 
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Referer": DOMAIN + "/"
                }
            });
        }

        return JSON.stringify({ url: url, isEmbed: true });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

// =============================================================================
// BÓC VỎ IFRAME: HOOK TỌA ĐỘ 3 LỚP ÉP PHÁT VIDEO
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

        // Ưu tiên ném thẳng video m3u8 nếu bắt được
        var vidRegex = /(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
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

        // TỰ ĐỘNG CLICK 3 LỚP PIERCE-THROUGH (Rải thảm vào trung tâm Player)
        var hookScript = `
            var adClicks = 0;
            var forcePlay = setInterval(function() {
                var w = window.innerWidth / 2;
                var h = window.innerHeight / 2;
                
                try {
                    // Chích vào tọa độ trung tâm để làm bục túi quảng cáo
                    var el = document.elementFromPoint(w, h);
                    if(el) el.click();
                } catch(e) {}
                
                var b = document.querySelector('.jw-video, .vjs-big-play-button, .plyr__control--overlaid, #player, .play-icon');
                if(b) { try { b.click(); } catch(e){} }
                
                var v = document.querySelector('video');
                if (v) {
                    v.muted = false; // Nhả tiếng
                    var playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(function(){});
                    }
                }
                
                adClicks++;
                // Dừng lại sau 10 giây rải đạn
                if (adClicks > 20) { 
                    clearInterval(forcePlay);
                }
            }, 500);
        `;

        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            subtitles: subtitles, 
            script: hookScript
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
