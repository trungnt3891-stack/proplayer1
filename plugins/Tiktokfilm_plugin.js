// =============================================================================
// PLUGIN VAAPP: PHIMNGAN.NET (Phim Ngắn / Phim Dọc) - BẢN SỬA LỖI
// =============================================================================

var BASEURL = "https://phimngan.net";

function getManifest() {
    return JSON.stringify({
        "id": "phimngan_net",
        "name": "PhimNgan.Net",
        "description": "Nền tảng xem phim ngắn, phim dọc người thật đóng và phim AI.",
        "version": "1.0.1",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/icons/icon-192x192.png",
        "isEnabled": true,
        "type": "shortfilm",           
        "layoutType": "VERTICAL",      
        "playerType": "embedtoexoplay" 
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[phimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[phimngan] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '', title: 'Mới Cập Nhật', type: 'Grid' },
        { slug: 'genres/phim-ai', title: 'Phim AI', type: 'Horizontal' },
        { slug: 'genres/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal' },
        { slug: 'genres/tong-tai', title: 'Tổng Tài', type: 'Horizontal' },
        { slug: 'genres/cung-dau', title: 'Cung Đấu', type: 'Grid' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: '' },
        { name: 'Phim AI', slug: 'genres/phim-ai' },
        { name: 'Ngôn Tình', slug: 'genres/ngon-tinh' },
        { name: 'Tổng Tài', slug: 'genres/tong-tai' },
        { name: 'Cung Đấu', slug: 'genres/cung-dau' },
        { name: 'Gia Đình', slug: 'genres/gia-dinh' },
        { name: 'Hài Hước', slug: 'genres/hai-huoc' },
        { name: 'Phục Thù', slug: 'genres/phuc-thu' },
        { name: 'Xuyên Không', slug: 'genres/xuyen-khong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var filters = JSON.parse(filtersJson);
            page = parseInt(filters.page) || 1;
        }

        if (slug && slug.indexOf("http") === 0) return slug;

        var resultUrl = BASEURL + (slug ? "/" + slug : "");

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        
        return resultUrl;
    } catch (e) {
        return BASEURL;
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

function parseListResponse(html, apiUrl) {
    try {
        var items = [];
        
        // Quét trực tiếp cấu trúc HTML thay vì đọc mảng JSON của Next.js để tránh lỗi escape
        var regex = /<a[^>]*href=["'](\/(?:phim|watch)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        var seen = {}; // Chống trùng lặp

        while ((match = regex.exec(html)) !== null) {
            var link = match[1];
            var block = match[2];
            
            if (seen[link]) continue;
            seen[link] = true;

            var titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
            if (!titleMatch) continue;
            var title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
            
            var imgMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
            var img = imgMatch ? imgMatch[1] : "";
            
            // Xử lý ảnh bọc qua bộ nén tối ưu của Next.js
            if(img.indexOf("_next/image?url=") > -1) {
                var urlMatch = img.match(/url=([^&]+)/);
                if(urlMatch) img = decodeURIComponent(urlMatch[1]);
            } else if(img !== "" && img.indexOf("http") !== 0) {
                img = BASEURL + img;
            }
            
            var epMatch = block.match(/<span[^>]*uppercase[^>]*>([\s\S]*?)<\/span>/i);
            var ep = epMatch ? epMatch[1].replace(/<[^>]+>/g, '').trim() : "Full";
            
            items.push({
                id: BASEURL + link,
                title: title,
                posterUrl: img,
                backdropUrl: img,
                quality: "HD",
                episode_current: ep
            });
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: 99 // Hỗ trợ cuộn load trang
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

        // App tự lo phần bắt link gốc và cơ chế vuốt chuyển tập. Trả thẳng URL trang web làm ID tập.
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

            var checkCount = 0;
            var checkInterval = setInterval(function() {
                try {
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
                    if (checkCount > 30) clearInterval(checkInterval);
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
