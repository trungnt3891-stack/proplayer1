/**
 * PLUGIN BÓC TÁCH PHIM/VIDEO TIKTOK - QIQI THẬT THẬT 00
 * Platform Target: Mobile Application
 * Author: Chuyên Gia Scraper Plugin
 */

// =========================================================================
// 1. CẤU HÌNH MANIFEST & DANH MỤC (CONFIG FUNCTIONS)
// =========================================================================

function getManifest() {
    return {
        id: "com.plugin.tiktok.qiqithatthat00",
        name: "TikTok - Qiqi Thật Thật 00",
        version: "1.0.0",
        baseUrl: "https://www.tiktok.com",
        icon: "https://www.tiktok.com/favicon.ico",
        description: "Plugin bóc tách video/phim ngắn từ kênh TikTok @qiqithatthat00"
    };
}

function getHomeSections() {
    return [
        {
            id: "latest_videos",
            title: "Phim Ngắn Mới Nhất",
            url: "https://www.tiktok.com/@qiqithatthat00?lang=en"
        }
    ];
}

function getPrimaryCategories() {
    return [
        { id: "all_episodes", title: "Tất Cả Tập Phim (@qiqithatthat00)" }
    ];
}

function getFilterConfig() {
    return [];
}

// =========================================================================
// 2. TẠO URL REQUEST (URL GENERATORS)
// =========================================================================

function getUrlList(categoryId, page) {
    return "https://www.tiktok.com/@qiqithatthat00?lang=en";
}

function getUrlSearch(keyword, page) {
    return "https://www.tiktok.com/search?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(url) {
    return url;
}

function getUrlCategories() {
    return "https://www.tiktok.com/@qiqithatthat00?lang=en";
}

// =========================================================================
// 3. HELPER UTILS (XỬ LÝ DỮ LIỆU NÂNG CAO & AN TOÀN)
// =========================================================================

/**
 * Hàm bổ trợ quét Regex trích xuất JSON Payload từ SSR HTML của TikTok
 */
function extractTikTokData(html) {
    log("Đang bóc tách JSON Payload từ HTML TikTok...");
    if (!html) return null;

    var dataStr = null;

    // 1. Bắt JSON Rehydration chính của TikTok
    var matchUni = html.match(/<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"\s+type="application\/json">([\s\S]*?)<\/script>/i);
    if (matchUni && matchUni[1]) {
        dataStr = matchUni[1].trim();
    } else {
        // 2. Dự phòng bắt SIGI_STATE nếu TikTok đổi cấu trúc render
        var matchSigi = html.match(/<script\s+id="SIGI_STATE"\s+type="application\/json">([\s\S]*?)<\/script>/i);
        if (matchSigi && matchSigi[1]) {
            dataStr = matchSigi[1].trim();
        }
    }

    if (dataStr) {
        try {
            // An toàn kiểm tra kiểu dữ liệu tránh crash
            return typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
        } catch (e) {
            log("Lỗi JSON.parse payload TikTok: " + e.message);
        }
    }
    return null;
}

// =========================================================================
// 4. CÁC HÀM PARSE DỮ LIỆU (PARSE FUNCTIONS)
// =========================================================================

function parseListResponse(html) {
    var items = [];
    try {
        log("Bắt đầu parse danh sách video...");
        var rawData = extractTikTokData(html);

        if (rawData) {
            var itemList = [];

            // Trích xuất mảng item từ __UNIVERSAL_DATA_FOR_REHYDRATION__
            var defaultScope = rawData["__DEFAULT_SCOPE__"] || rawData;
            if (defaultScope["webapp.user-detail"] && defaultScope["webapp.user-detail"].itemList) {
                itemList = defaultScope["webapp.user-detail"].itemList;
            } else if (rawData.ItemModule) {
                // Trích xuất từ SIGI_STATE
                itemList = Object.values(rawData.ItemModule);
            }

            for (var i = 0; i < itemList.length; i++) {
                var item = itemList[i];
                var videoId = item.id || (item.video ? item.id : null);
                var title = item.desc || ("Phim ngắn Qiqi #" + (i + 1));
                
                var cover = "";
                if (item.video) {
                    cover = item.video.originCover || item.video.cover || item.video.dynamicCover || "";
                }

                var author = (item.author && item.author.uniqueId) ? item.author.uniqueId : "qiqithatthat00";
                var videoUrl = item.shareUrl || ("https://www.tiktok.com/@" + author + "/video/" + videoId);

                if (videoId) {
                    items.push({
                        id: videoId,
                        title: title,
                        cover: cover,
                        url: videoUrl,
                        author: author
                    });
                }
            }
        } else {
            log("Không lấy được JSON Payload, quét Regex HTML dự phòng...");
            // Regex fallback quét trực tiếp link video trong HTML
            var videoRegex = /href="(https:\/\/www\.tiktok\.com\/@[^\/]+\/video\/(\d+))"/g;
            var match;
            var seenIds = {};

            while ((match = videoRegex.exec(html)) !== null) {
                var vUrl = match[1];
                var vId = match[2];
                if (!seenIds[vId]) {
                    seenIds[vId] = true;
                    items.push({
                        id: vId,
                        title: "Tập Phim #" + vId,
                        cover: "",
                        url: vUrl
                    });
                }
            }
        }

        log("Parse thành công " + items.length + " video.");
    } catch (e) {
        log("Lỗi trong parseListResponse: " + e.message);
    }
    return items;
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    try {
        log("Đang parse thông tin chi tiết video/phim tại URL: " + url);
        var rawData = extractTikTokData(html);
        
        var movieDetail = {
            title: "Qiqi Thật Thật 00 - Phim Ngắn",
            description: "",
            cover: "",
            episodes: []
        };

        if (rawData) {
            var defaultScope = rawData["__DEFAULT_SCOPE__"] || {};
            var videoDetail = defaultScope["webapp.video-detail"] || {};
            var itemInfo = videoDetail.itemInfo ? videoDetail.itemInfo.itemStruct : null;

            if (!itemInfo && rawData.ItemModule) {
                var keys = Object.keys(rawData.ItemModule);
                if (keys.length > 0) itemInfo = rawData.ItemModule[keys[0]];
            }

            if (itemInfo) {
                movieDetail.title = itemInfo.desc ? itemInfo.desc.split('#')[0].trim() : "Qiqi Thật Thật 00";
                movieDetail.description = itemInfo.desc || "";
                movieDetail.cover = itemInfo.video ? (itemInfo.video.originCover || itemInfo.video.cover) : "";

                movieDetail.episodes.push({
                    name: "Phát Video (Full HD)",
                    url: url
                });
            }
        }

        // Trường hợp không bóc tách được chi tiết, vẫn trả về tập mặc định
        if (movieDetail.episodes.length === 0) {
            movieDetail.episodes.push({
                name: "Tập 1",
                url: url
            });
        }

        return movieDetail;
    } catch (e) {
        log("Lỗi trong parseMovieDetail: " + e.message);
        return { title: "", description: "", cover: "", episodes: [] };
    }
}

function parseDetailResponse(html, url) {
    try {
        log("Bắt đầu xử lý nguồn phát (Source Parsing)...");
        var rawData = extractTikTokData(html);
        var directMp4 = "";

        if (rawData) {
            var defaultScope = rawData["__DEFAULT_SCOPE__"] || {};
            var videoDetail = defaultScope["webapp.video-detail"] || {};
            var itemStruct = videoDetail.itemInfo ? videoDetail.itemInfo.itemStruct : null;

            if (!itemStruct && rawData.ItemModule) {
                var keys = Object.keys(rawData.ItemModule);
                if (keys.length > 0) itemStruct = rawData.ItemModule[keys[0]];
            }

            if (itemStruct && itemStruct.video) {
                // Ưu tiên 1: Lấy Direct Link playAddr/downloadAddr gốc
                directMp4 = itemStruct.video.playAddr || itemStruct.video.downloadAddr || "";
                
                // Ưu tiên 2: Trích xuất từ bitrateInfo
                if (!directMp4 && itemStruct.video.bitrateInfo && itemStruct.video.bitrateInfo.length > 0) {
                    var bitrate = itemStruct.video.bitrateInfo[0];
                    if (bitrate.PlayAddr && bitrate.PlayAddr.UrlList && bitrate.PlayAddr.UrlList.length > 0) {
                        directMp4 = bitrate.PlayAddr.UrlList[0];
                    }
                }
            }
        }

        // =========================================================================
        // TRƯỜNG HỢP 1: BẮT ĐƯỢC DIRECT LINK (Phát Native Player)
        // =========================================================================
        if (directMp4) {
            log("Bắt thành công Direct Link MP4! Chuyển sang Native Player.");
            return {
                isEmbed: false,
                url: directMp4,
                mimeType: "video/mp4",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://www.tiktok.com/"
                }
            };
        }

        // =========================================================================
        // TRƯỜNG HỢP 2: FALLBACK WEBVIEW + CUSTOM-JS ANTI-ADS / CLEAN UI
        // =========================================================================
        log("Không tìm thấy Direct Link, sử dụng Webview Embed + Custom-JS Anti-Ads.");
        
        var customJs = `
            (function() {
                // 1. Inject CSS làm sạch giao diện và phủ đen toàn màn hình
                var css = 'header, footer, div[class*="banner"], div[class*="ad"], .tiktok-top-nav-container, .tiktok-feed-sidebar, div[class*="ButtonContainer"] { display: none !important; } ' +
                          'body, html { background-color: #000 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; } ' +
                          'video { width: 100% !important; height: 100% !important; object-fit: contain !important; }';
                
                var style = document.createElement('style');
                style.type = 'text/css';
                style.appendChild(document.createTextNode(css));
                (document.head || document.getElementsByTagName('head')[0]).appendChild(style);

                // 2. Tự động click tắt nút Quảng cáo / Nút mở App nếu xuất hiện
                setInterval(function() {
                    var closeBtns = document.querySelectorAll('button[class*="close"], div[class*="close"], a[class*="open-app"]');
                    closeBtns.forEach(function(btn) { btn.click(); });
                }, 1000);
            })();
        `;

        return {
            isEmbed: true,
            url: url,
            headers: {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
                "Custom-Js": customJs
            }
        };

    } catch (e) {
        log("Lỗi trong parseDetailResponse: " + e.message);
        return { isEmbed: true, url: url };
    }
}

function parseEmbedResponse(html, url) {
    return parseDetailResponse(html, url);
}
