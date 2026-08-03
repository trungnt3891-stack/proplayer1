// =============================================================================
// CẤU HÌNH DOMAIN & METADATA CHO NETSHORT
// =============================================================================
var BASEURL = "https://netshort.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "netshort",
        "name": "NetShort VN",
        "description": "Bắt thẳng link MP4 gốc cho tập miễn phí. Các tập khóa dùng Webview sạch rác.",
        "version": "1.1.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt trình phát xoay dọc và vuốt chuyển tập
        "layoutType": "VERTICAL",
        "playerType": "auto" // [QUAN TRỌNG] "auto" để App tự chuyển đổi: Native cho tập Free, Webview cho tập Khóa
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[NetShort] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[NetShort] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/vi/drama/all-plots", "title": "Tất Cả Phim Ngắn", "type": "Grid" },
        { "slug": "/vi/drama/Ngh%E1%BB%8Bch%20c%E1%BA%A3nh-1984208314792402961", "title": "Phim Nghịch Cảnh", "type": "Horizontal" },
        { "slug": "/vi/drama/Ng%E1%BB%8Dt%20s%E1%BB%A7ng-1983832091151032332", "title": "Phim Ngọt Sủng", "type": "Horizontal" },
        { "slug": "/vi/drama/B%C3%A1o%20th%C3%B9-1983832036302733325", "title": "Phim Báo Thù", "type": "Horizontal" },
        { "slug": "/vi/drama/C%C6%B0%E1%BB%9Bi%20tr%C6%B0%E1%BB%9Bc%20y%C3%AAu%20sau-1983832091939561484", "title": "Cưới Trước Yêu Sau", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "/vi/drama/all-plots", "name": "Tất Cả Các Tập" },
        { "slug": "/vi/drama/Ngh%E1%BB%8Bch%20c%E1%BA%A3nh-1984208314792402961", "name": "Nghịch cảnh" },
        { "slug": "/vi/drama/K%E1%BB%8Bch%20t%C3%ADnh-1983832091029397515", "name": "Kịch tính" },
        { "slug": "/vi/drama/C%E1%BB%95%20%C4%91%E1%BA%A1i-1983832036533420044", "name": "Cổ đại" },
        { "slug": "/vi/drama/Ng%E1%BB%8Dt%20s%E1%BB%A7ng-1983832091151032332", "name": "Ngọt sủng" },
        { "slug": "/vi/drama/B%C3%A1o%20th%C3%B9-1983832036302733325", "name": "Báo thù" },
        { "slug": "/vi/drama/Ng%C6%B0%E1%BB%A3c%20t%C3%A2m-1983832091079729160", "name": "Ngược tâm" },
        { "slug": "/vi/drama/Trinh%20th%C3%A1m-1983832092497403916", "name": "Trinh thám" },
        { "slug": "/vi/drama/Tr%C3%B9ng%20sinh-1983832036273373197", "name": "Trùng sinh" },
        { "slug": "/vi/drama/C%C6%B0%E1%BB%9Bi%20tr%C6%B0%E1%BB%9Bc%20y%C3%AAu%20sau-1983832091939561484", "name": "Cưới trước yêu sau" },
        { "slug": "/vi/drama/%C4%90%E1%BA%A1o%20%C4%91%E1%BB%A9c%20gia%20%C4%91%C3%ACnh-1983832092405129228", "name": "Đạo đức gia đình" }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try { page = parseInt(JSON.parse(filtersJson).page) || 1; } catch(e) {}
        }
        var url = slug;
        if (url.indexOf("http") === -1) url = BASEURL + (url.indexOf("/") === 0 ? "" : "/") + url;
        if (page > 1) url += (url.indexOf('?') > -1 ? '&' : '?') + "page=" + page;
        return url;
    } catch(e) {
        return BASEURL + "/vi/drama/all-plots";
    }
}

function getUrlSearch(keyword, filtersJson) {
    // API Tìm kiếm của NetShort
    return BASEURL + "/vi/search?q=" + encodeURIComponent(keyword.trim());
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + (slug.indexOf("/") === 0 ? "" : "/") + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// HELPER: BÓC TÁCH DỮ LIỆU JSON ẨN CỦA NEXT.JS
// =============================================================================
function parseNextPayload(raw) {
    try {
        var match = raw.match(/self\.__next_f\.push\((.*)\)/);
        if (!match) return null;
        var pushArgs = JSON.parse(match[1]);
        if (Array.isArray(pushArgs) && pushArgs.length > 1) {
            var rawString = pushArgs[1];
            if (typeof rawString === 'string') {
                var cleanJsonStr = rawString.replace(/^[0-9a-zA-Z]+:/, '').replace(/\n$/, '');
                return JSON.parse(cleanJsonStr);
            }
        }
    } catch (e) {}
    return null;
}

function extractData(node, key) {
    var result = null;
    function traverse(n) {
        if (result) return;
        if (!n) return;
        if (typeof n === 'object' && !Array.isArray(n)) {
            if (n[key] !== undefined) {
                result = n[key];
                return;
            }
            for (var k in n) {
                if (n.hasOwnProperty(k)) traverse(n[k]);
            }
        } else if (Array.isArray(n)) {
            for (var i = 0; i < n.length; i++) traverse(n[i]);
        }
    }
    traverse(node);
    return result;
}

function extractListData(data) {
    var resultList = [];
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.itemListElement && Array.isArray(node.itemListElement)) {
                for(var i=0; i<node.itemListElement.length; i++){
                    if(node.itemListElement[i].item && node.itemListElement[i].item.name) {
                        resultList.push(node.itemListElement[i].item);
                    }
                }
            }
            if (node.hotRecommendList && Array.isArray(node.hotRecommendList)) {
                for(var i=0; i<node.hotRecommendList.length; i++){
                    resultList.push(node.hotRecommendList[i]);
                }
            }
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) traverse(node[i]);
        }
    }
    traverse(data);
    return resultList;
}

// =============================================================================
// PARSERS (BÓC TÁCH DỮ LIỆU)
// =============================================================================
function parseListResponse(html, url) {
    try {
        var items = [];
        var foundJson = false;
        
        var scripts = html.match(/<script>self\.__next_f\.push\([^>]+<\/script>/gi);
        if (!scripts) scripts = html.match(/self\.__next_f\.push\([^>]+/gi);

        if (scripts) {
            for(var i = 0; i < scripts.length; i++){
                var payload = parseNextPayload(scripts[i]);
                if (payload) {
                    var listData = extractListData(payload);
                    if (listData && listData.length > 0) {
                        foundJson = true;
                        for (var j = 0; j < listData.length; j++) {
                            var item = listData[j];
                            var name = item.name || item.shortPlayName || "";
                            var link = item.url || item.shortPlayNameUrl || item.fullEpisodeNameUrl || "";
                            var img = item.image || item.shortPlayCover || "";
                            var ep = item.numberOfEpisodes || item.totalEpisode || "";
                            
                            if (name && link) {
                                items.push({
                                    id: link,
                                    title: name.replace(/Xem trực tuyến - NetShort/i, "").trim(),
                                    posterUrl: img,
                                    backdropUrl: img,
                                    episode_current: ep ? "Full " + ep : "HD",
                                    quality: "HD",
                                    lang: ""
                                });
                            }
                        }
                        break;
                    }
                }
            }
        }
        
        // Fallback HTML nếu cấu trúc Web bị đổi
        if (!foundJson) {
            var itemPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][\s\S]*?<a[^>]*class=["'][^"']*video-list-item-name[^"']*["'][^>]*>([^<]+)<\/a>/gi;
            var match;
            while ((match = itemPattern.exec(html)) !== null) {
                var link = match[1];
                var img = match[2];
                var title = match[3];
                if (img.indexOf('url(') > -1) {
                    var m = img.match(/url\(['"]?([^'"\)]+)['"]?\)/);
                    if (m) img = m[1];
                }
                items.push({
                    id: link,
                    title: title.trim(),
                    posterUrl: img,
                    backdropUrl: img,
                    episode_current: "HD",
                    quality: "HD"
                });
            }
        }
        
        for(var k=0; k<items.length; k++) {
            if(items[k].id.indexOf("#") > -1) items[k].id = items[k].id.split("#")[0];
        }
        
        var totalPages = 1;
        var currentPage = 1;
        var pageMatch = html.match(/<span[^>]*class=["'][^"']*tabular-nums[^"']*["'][^>]*>(\d+)[^<]*\/[^<]*(\d+)<\/span>/i);
        if(pageMatch) {
            currentPage = parseInt(pageMatch[1]);
            totalPages = parseInt(pageMatch[2]);
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var title = "";
        var posterUrl = "";
        var description = "";
        var totalEpisodes = 0;
        var categories = [];
        var eps = [];
        
        var scripts = html.match(/self\.__next_f\.push\([^>]+/gi);
        
        if (scripts) {
            for(var i = 0; i < scripts.length; i++){
                var payload = parseNextPayload(scripts[i]);
                if (payload) {
                    var detailData = extractData(payload, 'shortPlayDetailVo');
                    if (detailData) {
                        title = detailData.shortPlayName || "";
                        posterUrl = detailData.shortPlayCover || "";
                        description = detailData.shotIntroduce || "";
                        
                        if(detailData.labelList) {
                            for(var j=0; j<detailData.labelList.length; j++){
                                categories.push(detailData.labelList[j].labelName);
                            }
                        }
                        
                        // Lấy danh sách toàn bộ các tập (Gom từ các Chunk nếu phim dài)
                        if (detailData.episodeChunkList) {
                            detailData.episodeChunkList.forEach(chunk => {
                                if (chunk.data && Array.isArray(chunk.data)) {
                                    chunk.data.forEach(ep => {
                                        var epName = "Tập " + ep.episodeNo;
                                        if (ep.isLock) epName += " 🔒"; // Báo hiệu tập VIP
                                        eps.push({
                                            id: ep.url,
                                            name: epName,
                                            slug: "tap-" + ep.episodeNo
                                        });
                                    });
                                }
                            });
                        } else if (detailData.videoEpisodeInfos) {
                            detailData.videoEpisodeInfos.forEach(ep => {
                                var epName = "Tập " + ep.episodeNo;
                                if (ep.isLock) epName += " 🔒";
                                // Giả lập link tập nếu ko có sẵn
                                var epUrl = url + "-ep-" + ep.episodeNo; 
                                eps.push({ id: epUrl, name: epName, slug: "tap-" + ep.episodeNo });
                            });
                        }
                        break;
                    }
                }
            }
        }
        
        if (!title) {
            var mTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (mTitle) title = mTitle[1].replace(/Xem trực tuyến - NetShort/i, "").trim();
        }
        if (!posterUrl) {
            var mImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (mImg) posterUrl = mImg[1];
        }

        if (posterUrl && !posterUrl.startsWith("http")) posterUrl = BASEURL + posterUrl;

        var servers = [];
        if (eps.length > 0) {
            servers.push({ name: "NetShort VN", episodes: eps });
            totalEpisodes = eps.length;
        } else {
            servers.push({
                name: "NetShort VN",
                episodes: [{ id: url, name: "Tập 1", slug: "tap-1" }]
            });
        }

        return JSON.stringify({
            id: url,
            title: title || "Đang cập nhật...",
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            servers: servers,
            quality: "HD",
            episode_current: totalEpisodes ? (totalEpisodes + " Tập") : "Full",
            year: 2026,
            category: categories.join(", ") || "Phim Ngắn",
            status: "Hoàn Thành"
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// [QUAN TRỌNG] BẮT LINK GỐC NẾU MIỄN PHÍ, MỞ WEBVIEW NẾU KHÓA
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var isEmbed = true; // Mặc định là bật Webview (nếu bị khóa)
        var subs = [];

        var scripts = html.match(/self\.__next_f\.push\([^>]+/gi);
        var epInfo = null;

        if (scripts) {
            for (var i = 0; i < scripts.length; i++) {
                var payload = parseNextPayload(scripts[i]);
                if (payload) {
                    var obj = extractData(payload, 'initialCurrentEpisodeInfo');
                    if (obj) { epInfo = obj; break; }
                }
            }
        }

        // --- CỐT LÕI YÊU CẦU CỦA BẠN: LẤY LINK DIRECT NẾU PHIM KHÔNG BỊ GIỚI HẠN ---
        if (epInfo) {
            if (epInfo.playVoucher) {
                streamUrl = epInfo.playVoucher; // ĐÃ CHỘP ĐƯỢC LINK GỐC MP4/M3U8
                isEmbed = false; // Tắt Webview, bắt App chạy bằng ExoPlayer (Nhanh, nhẹ, tua mượt)
            }
            if (epInfo.subtitleList && Array.isArray(epInfo.subtitleList)) {
                epInfo.subtitleList.forEach(sub => {
                    subs.push({
                        lang: sub.subtitleLanguage || sub.format,
                        url: sub.url,
                        isAutoTranslated: false
                    });
                });
            }
        }

        // NẾU TẬP KHÔNG BỊ GIỚI HẠN (isEmbed = false) -> TRẢ VỀ LINK GỐC ĐỂ PHÁT
        if (!isEmbed && streamUrl && (streamUrl.indexOf('.m3u8') > -1 || streamUrl.indexOf('.mp4') > -1 || streamUrl.indexOf('mime_type=video_mp4') > -1)) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: streamUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": BASEURL + "/"
                },
                subtitles: subs
            });
        }

        // NẾU TẬP BỊ GIỚI HẠN (playVoucher = null) -> TRẢ VỀ WEBVIEW SẠCH ĐỂ USER THẤY KHÓA
        var killAdsCssJs = `
            (function() {
                var style = document.createElement('style');
                style.innerHTML = 'header, footer, nav, .header, .footer, .download-app, .app-download, .comments-title, .comments-list, .pc-container, .mobile-container, [class*="ad-"], [id*="ad-"], .popup, .modal, .google-auto-placed, iframe[src*="ads"], .bottom-nav, .navigation, .sidebar { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -9999 !important; } ' +
                'body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; } ' +
                '.episode-page-container, .detail-container, .flex-contatiner, .video-container, .video-content, .video-ref { width: 100vw !important; height: 100vh !important; max-width: 100% !important; max-height: 100% !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; } ' +
                '.video-info-container { display: none !important; }';
                document.head.appendChild(style);

                setInterval(function() {
                    var closeBtns = document.querySelectorAll('.close, .btn-close, [aria-label="Close"]');
                    for (var j = 0; j < closeBtns.length; j++) {
                        try { closeBtns[j].click(); } catch(e){}
                    }
                }, 500);
            })();
        `;
        
        var fixedScript = killAdsCssJs.replace(/\r/g, "").replace(/\n/g, " ").replace(/\t/g, "  ").trim();

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36",
                "Custom-Js": fixedScript
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
