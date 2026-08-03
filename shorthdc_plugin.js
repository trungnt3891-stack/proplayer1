// =============================================================================
// CẤU HÌNH DOMAIN & METADATA
// =============================================================================
var BASEURL = "https://phimnganhdc.com"; 

function getManifest() {
    return JSON.stringify({
        "id": "phimnganhdc",
        "name": "Phim Ngắn HDC",
        "description": "Chuyên Phim Ngắn: Hỗ trợ vuốt dọc chuyển tập, Tốc độ cao, Lọc dữ liệu thông minh.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt trình phát xoay dọc và vuốt chuyển tập
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Dùng Sniffer bắt link m3u8 để phát siêu mượt
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[PhimNganHDC] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[PhimNganHDC] " + msg);
    }
}

// =============================================================================
// MENU & TRANG CHỦ (CHỈ LẤY PHIM NGẮN - CATEGORY 38)
// =============================================================================
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/the-loai/phim-ngan", "title": "Phim Ngắn Mới Cập Nhật", "type": "Grid" },
        { "slug": "/?filter[category]=38&filter[sort]=view", "title": "Phim Ngắn Xem Nhiều Nhất", "type": "Horizontal" },
        { "slug": "/?filter[category]=38&filter[sort]=create", "title": "Phim Ngắn Mới Đăng Tải", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "/the-loai/phim-ngan", "name": "Tất Cả Phim Ngắn" },
        { "slug": "/?filter[category]=38&filter[sort]=view", "name": "Xem Nhiều Nhất" },
        { "slug": "/?filter[category]=38&filter[sort]=update", "name": "Mới Cập Nhật" }
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
        if (filtersJson) {
            try {
                var filters = JSON.parse(filtersJson);
                page = parseInt(filters.page) || 1;
            } catch(e) {}
        }
        
        var url = slug;
        if (url.indexOf("http") === -1) {
            url = BASEURL + (url.indexOf("/") === 0 ? "" : "/") + url;
        }
        
        if (page > 1) {
            url += (url.indexOf('?') > -1 ? '&' : '?') + "page=" + page;
        }
        return url.replace(/([^:]\/)\/+/g, "$1");
    } catch(e) {
        return BASEURL + "/the-loai/phim-ngan";
    }
}

// Tìm kiếm mặc định luôn ép kèm filter chuyên mục Phim Ngắn (category=38)
function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try { page = parseInt(JSON.parse(filtersJson).page) || 1; } catch(e) {}
    }
    var url = BASEURL + "/?search=" + encodeURIComponent(keyword.trim()) + "&filter[category]=38";
    if (page > 1) url += "&page=" + page;
    return url;
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
// PARSERS (BÓC TÁCH DỮ LIỆU)
// =============================================================================
function parseListResponse(html, url) {
    try {
        var items = [];
        var match;
        // Regex siêu nhẹ bóc tách khối <li> phim
        var regex = /<li\s+class="item[^>]*>[\s\S]*?<span\s+class="label">([^<]+)<\/span>[\s\S]*?<a\s+href="([^"]+)".*?<img[^>]+src="([^"]+)".*?<div\s+class="name">[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi;
        
        while ((match = regex.exec(html)) !== null) {
            var status = match[1].trim();
            var link = match[2].trim();
            var img = match[3].trim();
            var title = match[4].trim();
            
            if (img.indexOf('http') === -1) img = BASEURL + img;
            if (link.indexOf('http') === -1) link = BASEURL + link;
            
            items.push({
                id: link,
                title: title,
                posterUrl: img,
                backdropUrl: img,
                episode_current: status,
                quality: "HD",
                lang: ""
            });
        }
        
        // Tìm số trang lớn nhất
        var totalPages = 1;
        var pageRegex = /page=(\d+)"/g;
        var pMatch;
        while ((pMatch = pageRegex.exec(html)) !== null) {
            var p = parseInt(pMatch[1]);
            if (p > totalPages) totalPages = p;
        }
        
        var currentPage = 1;
        if (url) {
            var urlPageMatch = url.match(/page=(\d+)/);
            if (urlPageMatch) currentPage = parseInt(urlPageMatch[1]);
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
        var titleMatch = /<span\s+class="title"\s+itemprop="name">([^<]+)<\/span>/i.exec(html);
        if (titleMatch) title = titleMatch[1].trim();
        else {
            var metaTitle = /<meta\s+property="og:title"\s+content="([^"]+)"/i.exec(html);
            if (metaTitle) title = metaTitle[1].trim();
        }

        var posterUrl = "";
        var posterMatch = /<img\s+itemprop="image"\s+src="([^"]+)"/i.exec(html);
        if (!posterMatch) posterMatch = /<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html);
        if (posterMatch) posterUrl = posterMatch[1];
        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = BASEURL + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = "";
        var descMatch = /<div\s+class="tab">[\s\S]*?<div\s+style="text-align:\s+justify;">([\s\S]*?)<\/div>/i.exec(html);
        if (!descMatch) descMatch = /<div\s+style="text-align:\s*justify;">([\s\S]*?)<\/div>/i.exec(html);
        if (descMatch) description = descMatch[1].replace(/<[^>]*>/g, "").trim();

        // Regex bóc tách danh sách Server và Tập phim
        var servers = [];
        var serverPattern = /<div[^>]*class="server-episode-block"[^>]*>[\s\S]*?Danh sách\s*(?:Sever)?\s*([^:]+):[\s\S]*?<div[^>]*class="list-episode[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        var match;

        while ((match = serverPattern.exec(html)) !== null) {
            var serverName = match[1].trim().replace(/^Server\s+/i, '').replace(/^z/i, '').replace(/\s*#\d+$/, '').trim();
            var episodesHtml = match[2];
            var episodes = [];
            
            var epPattern = /<a\s+href="([^"]+)"[\s\S]*?title="([^"]+)"/gi;
            var epMatch;
            while ((epMatch = epPattern.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1];
                if (epUrl.indexOf('http') === -1) epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;

                episodes.push({
                    id: epUrl,
                    name: epMatch[2].trim().replace(/Phim /i, ""),
                    slug: epUrl
                });
            }
            if (episodes.length > 0) {
                // Tự động đảo ngược nếu trang web để tập mới nhất lên đầu
                var firstMatch = /Tập\s+(\d+)/i.exec(episodes[0].name);
                var lastMatch = /Tập\s+(\d+)/i.exec(episodes[episodes.length - 1].name);
                if (firstMatch && lastMatch && parseInt(firstMatch[1]) > parseInt(lastMatch[1])) {
                    episodes.reverse();
                } else if (!firstMatch) {
                    episodes.reverse(); 
                }
                servers.push({ name: serverName, episodes: episodes });
            }
        }
        
        // Nếu không có server nào, tạo nút ảo để bắt luồng video ở trang Detail luôn
        if (servers.length === 0) {
            servers.push({
                name: "Server Mặc Định",
                episodes: [{ id: url, name: "Tập 1", slug: url }]
            });
        }

        return JSON.stringify({
            id: url,
            title: title || "Đang cập nhật",
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            servers: servers,
            quality: "HD",
            episode_current: servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Đang cập nhật",
            year: 2026,
            category: "Phim Ngắn",
            status: "Hoàn Thành"
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi chi tiết", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var isEmbed = false;
        
        // Dò iframe hoặc thẻ nhúng
        var iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
        if (iframeMatch) {
            streamUrl = iframeMatch[1];
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;
            
            // Xử lý các link player trung gian thường gặp trên HDC
            if (streamUrl.indexOf("player.php?") !== -1) {
                var matchLink = /[?&](?:link|url)=([^&]+)/.exec(streamUrl);
                if (matchLink) {
                    streamUrl = decodeURIComponent(matchLink[1]);
                }
            }
            
            // Nếu link đích cuối cùng vẫn là m3u8/mp4
            if (streamUrl.indexOf(".m3u8") > -1 || streamUrl.indexOf(".mp4") > -1) {
                isEmbed = false;
            } else {
                isEmbed = true; // Gửi cho Sniffer dò tiếp
            }
        } else {
            // Dò link m3u8/mp4 chìm trong file HTML
            var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
            if (m3u8Match) {
                streamUrl = m3u8Match[1].replace(/\\/g, "");
            } else {
                var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
                if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
            }
        }
        
        return JSON.stringify({
            "url": streamUrl || url, // Fallback lại URL cũ nếu không thấy gì
            "isEmbed": isEmbed,
            "mimeType": (streamUrl.indexOf(".m3u8") > -1) ? "application/x-mpegURL" : (streamUrl.indexOf(".mp4") > -1 ? "video/mp4" : ""),
            "headers": {
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Block-Ads": "true" // Yêu cầu Sniffer chặn quảng cáo nếu mở Iframe
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    try {
        var streamUrl = "";
        
        // 1. Nếu API trả về cấu trúc JSON chứa link m3u8 (Thường là gọi ajax)
        if (html.indexOf("securedLink") !== -1 || url.indexOf("do=getVideo") !== -1) {
            try {
                var jData = JSON.parse(html);
                streamUrl = jData.securedLink || jData.videoSource || (jData.videoSources ? jData.videoSources[0].file : "");
            } catch(e) {}
        }
        
        // 2. Tìm thẳng chuỗi m3u8/mp4 trong HTML
        if (!streamUrl) {
            var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
            if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, "");
        }
        
        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                mimeType: streamUrl.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "Referer": url,
                    "Origin": url.split('/').slice(0, 3).join('/'),
                    "User-Agent": "Mozilla/5.0"
                }
            });
        }
        
        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
