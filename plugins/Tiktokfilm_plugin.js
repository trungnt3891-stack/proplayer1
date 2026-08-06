// =============================================================================
// PLUGIN VAAPP: PHIMNGAN.NET (Phim Ngắn / Phim Dọc)
// =============================================================================

var BASEURL = "https://phimngan.net";

function getManifest() {
    return JSON.stringify({
        "id": "phimngan_net",
        "name": "PhimNgan.Net",
        "description": "Nền tảng xem phim ngắn, phim dọc người thật đóng và phim AI.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/icon-192x192.png",
        "isEnabled": true,
        "type": "shortfilm",           // Kích hoạt trình phát video dọc (Portrait Zoom) và vuốt chuyển tập
        "layoutType": "VERTICAL",      // Hiển thị poster tỷ lệ 2:3
        "playerType": "embedtoexoplay" // Dùng Webview ngầm bắt link gốc đưa qua ExoPlayer
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[phimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[phimngan] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-ai', title: 'Phim AI', type: 'Horizontal', path: 'genres' },
        { slug: 'ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal', path: 'genres' },
        { slug: 'tong-tai', title: 'Tổng Tài', type: 'Horizontal', path: 'genres' },
        { slug: 'cung-dau', title: 'Cung Đấu', type: 'Grid', path: 'genres' },
        { slug: 'hanh-dong', title: 'Hành Động', type: 'Horizontal', path: 'genres' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim AI', slug: 'phim-ai' },
        { name: 'Ngôn Tình', slug: 'ngon-tinh' },
        { name: 'Tổng Tài', slug: 'tong-tai' },
        { name: 'Cung Đấu', slug: 'cung-dau' },
        { name: 'Gia Đình', slug: 'gia-dinh' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Phục Thù', slug: 'phuc-thu' },
        { name: 'Xuyên Không', slug: 'xuyen-khong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "phim-ngan";

        if (filtersJson) {
            var filters = JSON.parse(filtersJson);
            page = parseInt(filters.page) || 1;
        }

        // Nếu path đã chứa đầy đủ url, giữ nguyên
        if (path.indexOf("http") === 0) return path;

        // PhimNgan.net sử dụng cấu trúc: /genres/{slug}
        var targetPath = path.indexOf('/') > -1 ? path : "genres/" + path;
        
        return BASEURL + "/" + targetPath;
    } catch (e) {
        return BASEURL + "/genres/phim-ngan";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encoded = encodeURIComponent(keyword.trim());
    return BASEURL + "/search?q=" + encoded;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL + "/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, apiUrl) {
    try {
        var items = [];
        
        // PhimNgan.net trả về dữ liệu phim dưới dạng JSON nhúng trong Next.js payload (self.__next_f.push)
        // Đây là cách an toàn và lấy dữ liệu sạch nhất thay vì parse DOM.
        var jsonMatch = html.match(/"videos":(\[.+?\]),"totalCount"/);
        
        if (jsonMatch && jsonMatch[1]) {
            var videos = JSON.parse(jsonMatch[1]);
            
            for (var i = 0; i < videos.length; i++) {
                var v = videos[i];
                var itemUrl = BASEURL + (v.is_series ? "/phim/" : "/watch/") + v.slug;
                
                // Giải mã ảnh từ Next.js Image Optimizer
                var poster = v.poster_url || "";
                if (poster && poster.indexOf("http") !== 0) poster = "https:" + poster;

                items.push({
                    id: itemUrl,
                    title: v.title || "Không tên",
                    posterUrl: poster,
                    backdropUrl: poster,
                    quality: "HD",
                    episode_current: v.is_series ? (v.part_count + " Phần") : "Full"
                });
            }
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: 99 // Nền tảng dùng cuộn vô hạn/client-side, gán cứng để App cho phép cuộn
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(" - PhimNgan.Net", "") : "Phim Ngắn";

        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1] : "";

        // Đối với phim ngắn/dọc, ta trả thẳng URL của phim để tạo nút "Xem Ngay". 
        // App sẽ tự lo phần bắt link gốc và cơ chế vuốt chuyển tập.
        var servers = [{
            name: "Phim Ngắn",
            episodes: [{
                id: url,
                name: "Xem Phim & Vuốt Chuyển Tập",
                slug: "full"
            }]
        }];

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD"
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi phim", servers: [] });
    }
}

// Sử dụng EmbedToExoPlay kết hợp Snipper để vượt qua cơ chế chặn của React/Next.js
function parseDetailResponse(html, url) {
    try {
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var playerHeaders = JSON.stringify({
                "Referer": "https://phimngan.net/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
            });

            // 1. Hook bắt Blob M3U8 (nếu website dùng HLS bảo mật)
            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                var originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = function(blob) {
                    var blobUrl = originalCreateObjectURL.apply(this, arguments);
                    if (blob && (blob instanceof Blob || blob instanceof File)) {
                        var processContent = function(content) {
                            if (content && content.trim().indexOf('#EXTM3U') === 0) {
                                if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
                                    window.SnifferBridge.playM3u8Content(content, window.location.href, playerHeaders);
                                }
                            }
                        };
                        if (typeof blob.text === 'function') {
                            blob.text().then(processContent).catch(function(){});
                        } else {
                            var reader = new FileReader();
                            reader.onload = function(e) { processContent(e.target.result); };
                            reader.readAsText(blob);
                        }
                    }
                    return blobUrl;
                };
            }

            // 2. Bắt link MP4/M3U8 truyền thống từ thẻ Video
            var checkCount = 0;
            var checkInterval = setInterval(function() {
                try {
                    // Tự động nhấn nút Play nếu có
                    var playBtn = document.querySelector('.vjs-big-play-button, .plyr__control--overlaid, button[aria-label="Play"]');
                    if (playBtn) playBtn.click();

                    var video = document.querySelector('video');
                    if (video && video.src && video.src.indexOf('http') === 0) {
                        if (window.SnifferBridge) {
                            window.SnifferBridge.play(video.src, playerHeaders);
                        }
                        clearInterval(checkInterval);
                    }
                    
                    checkCount++;
                    if (checkCount > 20) clearInterval(checkInterval);
                } catch (err) {}
            }, 1000);
        })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
                "Block-Ads": "true",
                "Custom-Js": customJsCode.replace(/\n/g, " ").replace(/\r/g, "").trim()
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
