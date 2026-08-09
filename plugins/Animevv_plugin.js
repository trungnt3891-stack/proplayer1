// =============================================================================
// PLUGIN MOVIE SCRAPER: ANIMEVIETSUB.MOM
// VERSION: 1.1.5
// CHIẾN THUẬT: PURE HOOK + EMBEDTOPLAY & FIX LỖI TRANG CHỦ, FULL 1000+ TẬP
// =============================================================================

var DOMAIN = "https://animevietsub.mom";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.5",
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
// QUẢN LÝ URL (FIX LỖI TRANG CHỦ KHÔNG LOAD)
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
    
    // Khắc phục lỗi 404 khi gọi trang 1
    if (page === 1) {
        return DOMAIN + "/" + slug + "/";
    }
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
// BÓC TÁCH TRANG CHỦ (PHỤC HỒI CHUẨN 1.1.1 ĐỂ KHÔNG BỊ LỖI MẤT BÌA)
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
// CHI TIẾT & BẮT 1000+ TẬP PHIM NHANH GỌN (THUẬT TOÁN SPLIT CHỐNG TRÀN RAM)
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<h1 class="Title">([^<]+)<\/h1>/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(/Anime Vietsub.*/i, '').replace(/\|.*/i, '').trim() : "Phim Hay";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) || html.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<div class="Description">([\s\S]*?)<\/div>/i);
        var desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        var servers = [];
        var sBlocks = html.split('class="server-name"');
        
        if (sBlocks.length < 2) sBlocks = ["", html]; 

        for (var i = 1; i < sBlocks.length; i++) {
            var block = sBlocks[i];
            var sName = "Server " + i;
            var nameEnd = block.indexOf('</h3>');
            
            if (nameEnd !== -1 && block.indexOf('>') !== -1) {
                var tmpName = block.substring(block.indexOf('>') + 1, nameEnd).replace(/<[^>]+>/g, '').trim();
                if (tmpName) sName = tmpName;
            }

            var ulStart = block.indexOf('<ul class="list-episode');
            if (ulStart === -1) ulStart = block.indexOf('<ul id="list-episode');
            if (ulStart === -1) continue;

            var ulEnd = block.indexOf('</ul>', ulStart);
            if (ulEnd === -1) ulEnd = block.length;

            var epBlock = block.substring(ulStart, ulEnd);
            var epItems = epBlock.split('<a ');
            var serverEps = [];

            for (var j = 1; j < epItems.length; j++) {
                var epHtml = epItems[j];
                var hrefStart = epHtml.indexOf('href="');
                if (hrefStart === -1) continue;
                hrefStart += 6;
                var hrefEnd = epHtml.indexOf('"', hrefStart);
                var epLink = epHtml.substring(hrefStart, hrefEnd);

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
                    epLink = DOMAIN + (epLink.indexOf('/') === 0 ? epLink : '/' + epLink);
                }

                serverEps.push({ id: epLink, name: epName, slug: epLink });
            }

            if (serverEps.length > 0) servers.push({ name: sName, episodes: serverEps });
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
        var playerDataMatch = html.match(/window\.PLAYER_DATA\s*=\s*(\{.*?\});/);
        
        if (playerDataMatch && playerDataMatch[1]) {
            try {
                var pData = JSON.parse(playerDataMatch[1]);
                iframeUrl = pData.link || pData.url || "";
            } catch(e) {}
        }

        if (!iframeUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) iframeUrl = iframeMatch[1];
        }

        if (iframeUrl) {
            if (iframeUrl.startsWith('//')) iframeUrl = "https:" + iframeUrl;
            else if (iframeUrl.startsWith('/')) iframeUrl = DOMAIN + iframeUrl;
            
            return JSON.stringify({
                url: iframeUrl,
                isEmbed: true, 
                headers: {
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
// THIẾT LẬP PURE HOOK & EMBEDTOPLAY MÀ KHÔNG DÙNG JAVASCRIPT THỪA THÃI
// =============================================================================

function parseEmbedResponse(html, url) {
    var subtitles = [];
    try {
        // Cạo lấy file Vietsub đính kèm trên WebView (nếu có)
        var subRegex = /["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var match;
        while ((match = subRegex.exec(html)) !== null) {
            var sUrl = match[1].replace(/\\/g, '');
            if (sUrl.indexOf('.m3u8') === -1 && sUrl.indexOf('.mp4') === -1) {
                subtitles.push({ url: sUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

        // Truyền đúng 2 cờ yêu cầu để Native App tự động lặn tìm m3u8
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,         // Yêu cầu App theo dõi Request
            embedtoplay: true,  // Yêu cầu App ép Play iframe ngầm
            subtitles: subtitles
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
