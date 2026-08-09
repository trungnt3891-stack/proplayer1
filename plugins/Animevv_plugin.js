// =============================================================================
// PLUGIN MOVIE SCRAPER: ANIMEVIETSUB.MOM
// VERSION: 1.1.2
// CHIẾN THUẬT: CẮT CHUỖI ÉP LOAD 1000+ TẬP & HOOK EMBEDTOPLAY XUYÊN 3 LỚP ADS
// =============================================================================

var DOMAIN = "https://animevietsub.mom";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.2",
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
        } else if (typeof filtersJson === 'number') page = filtersJson;
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
// BÓC TÁCH TRANG CHỦ & PHÂN TRANG (GIỮ NGUYÊN VÌ ĐÃ CHẠY TỐT Ở V1.1.1)
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

            var titleMatch = innerHtml.match(/class="Title"[^>]*>([^<]+)<\//i) || innerHtml.match(/alt="([^"]+)"/i);
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
// CHIẾN THUẬT MỚI: BÓC TÁCH CHI TIẾT & DANH SÁCH TẬP (CẮT CHUỖI)
// GIẢI QUYẾT TRIỆT ĐỂ BỆNH "THIẾU TẬP" DO REGEX QUÁ TẢI (VD: ONE PIECE 1000+ TẬP)
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
        
        // CHIA CHUỖI THEO SERVER (Không dùng Regex để tránh tràn bộ đệm engine)
        var serverBlocks = html.split('class="server-name"');
        
        for (var i = 1; i < serverBlocks.length; i++) {
            var block = serverBlocks[i];
            
            // Lấy tên Server
            var sNameEnd = block.indexOf('</h3>');
            var sName = "Server " + i;
            if (sNameEnd !== -1) {
                var sNameStr = block.substring(block.indexOf('>') + 1, sNameEnd).replace(/<[^>]+>/g, '').trim();
                if (sNameStr) sName = sNameStr;
            }

            // Khoanh vùng cụm danh sách tập
            var ulStart = block.indexOf('<ul class="list-episode');
            var ulEnd = block.indexOf('</ul>', ulStart);

            if (ulStart !== -1 && ulEnd !== -1) {
                var epBlock = block.substring(ulStart, ulEnd);
                
                // Quét từng thẻ <a> (Tập Phim) bên trong vùng đã giới hạn
                var epRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                var epMatch;
                var serverEps = [];

                while ((epMatch = epRegex.exec(epBlock)) !== null) {
                    var epLink = epMatch[1];
                    var epInner = epMatch[2].replace(/<[^>]+>/g, '').trim();
                    
                    // Ưu tiên thuộc tính title (Tập 001) thay vì ruột HTML (001)
                    var titleAttrMatch = epMatch[0].match(/title="([^"]+)"/i);
                    var epName = titleAttrMatch ? titleAttrMatch[1].trim() : ("Tập " + epInner);
                    
                    if (epLink.indexOf('http') !== 0) {
                        epLink = DOMAIN + (epLink.startsWith('/') ? epLink : '/' + epLink);
                    }

                    serverEps.push({
                        id: epLink, // ID là link gốc trang xem
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
// CẠO LẤY LINK IFRAME & CẤU HÌNH HOOK 3 LỚP THEO YÊU CẦU
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var iframeUrl = "";

        // Bắt mảng window.PLAYER_DATA chứa link bí mật
        var playerDataMatch = html.match(/window\.PLAYER_DATA\s*=\s*(\{.*?\});/);
        if (playerDataMatch && playerDataMatch[1]) {
            var pData = JSON.parse(playerDataMatch[1]);
            iframeUrl = pData.link || pData.url || "";
        }

        if (!iframeUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) iframeUrl = iframeMatch[1];
        }

        if (iframeUrl && iframeUrl.indexOf('http') !== 0) {
            if (iframeUrl.startsWith('//')) iframeUrl = "https:" + iframeUrl;
        }

        if (!iframeUrl) iframeUrl = url;

        // Ép bật WebView 
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
// JAVASCRIPT XUYÊN PHÁ QUẢNG CÁO 3 LỚP (HOOK + EMBEDTOPLAY)
// =============================================================================

function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    try {
        // Tùy chọn 1: Nếu web không giấu M3U8, bắt luôn luồng Video và ném ra Native
        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, 
                proxy: true,
                headers: { "Referer": url }
            });
        }

        // Tùy chọn 2 (Chuẩn Web này): Bị che bởi Invisible Ads và Player -> Sử dụng Hook Click 3 Lớp
        var clickScript = `
            var adClicks = 0;
            var forcePlay = setInterval(function() {
                // Rải thảm Click ảo lên giữa màn hình để đâm xuyên 3-4 lớp quảng cáo Pop-under
                var w = window.innerWidth / 2;
                var h = window.innerHeight / 2;
                var targets = [document.body, document.documentElement, document.querySelector('.jw-video'), document.querySelector('video')];
                
                targets.forEach(function(el) {
                    if(el) {
                        try {
                            el.dispatchEvent(new MouseEvent('click', {view: window, bubbles: true, cancelable: true, clientX: w, clientY: h}));
                        } catch(e) {}
                    }
                });
                
                adClicks++;

                // Tìm và ép video chạy
                var v = document.querySelector('video');
                if (v) {
                    v.muted = false; // Bỏ tắt tiếng
                    var playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(function(error) {});
                    }
                }

                // Dừng rải thảm click sau 12 vòng (tương đương 6 giây)
                if (adClicks > 12) { 
                    clearInterval(forcePlay);
                }
            }, 500);
        `;

        // Trả cấu hình EmbedToPlay + Hook + Đoạn mã tự Auto Clicker
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            script: clickScript
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
