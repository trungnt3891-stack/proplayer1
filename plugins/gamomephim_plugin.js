// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================
var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Đã chia đủ thư mục, fix lỗi không tua được video, tích hợp vuốt tập TikTok.",
        "version": "1.5.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "layoutType": "VERTICAL", // Fix khung dọc dành riêng cho phim ngắn
        "type": "shortfilm",      // Kích hoạt tính năng vuốt tập
        "playerType": "exoplayer"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog(msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
    }
}

function getHomeSections() {
    // Hiển thị một số mục nổi bật ra màn hình chính
    var listurl = `
/@@Phim Mới@@true
/the-loai/hien-dai@@Hiện Đại@@false
/the-loai/co-trang@@Cổ Trang@@false
/the-loai/tong-tai@@Tổng Tài@@false
/the-loai/xuyen-khong@@Xuyên Không@@false
`;
    return JSON.stringify(buildMenu(listurl));
}

function getLISTmenu() {
    // Đã phân chia đầy đủ các danh mục theo đúng hình ảnh "image_e17a99.png"
    return `
/@@Phim Mới
/the-loai/chua-lanh@@Chữa Lành
/the-loai/co-trang@@Cổ Trang
/the-loai/cuoi-truoc-yeu-sau@@Cưới Trước Yêu Sau
/the-loai/dan-quoc@@Dân Quốc
/the-loai/guong-vo-lai-lanh@@Gương Vỡ Lại Lành
/the-loai/hai-huoc@@Hài Hước
/the-loai/hien-dai@@Hiện Đại
/the-loai/nien-dai@@Niên Đại
/the-loai/thanh-xuan@@Thanh Xuân
/the-loai/tra-xanh-nam@@Trà Xanh Nam
/the-loai/trong-sinh@@Trọng Sinh
/the-loai/xuyen-khong@@Xuyên Không
/the-loai/yeu-tham@@Yêu Thầm
`;
}

function getPrimaryCategories() {
    return JSON.stringify(buildMenu(getLISTmenu()));
}

function getFilterConfig() {
    return JSON.stringify({ category: buildMenu(getLISTmenu()) });
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    var path = slug || "";

    if (filtersJson) {
        try {
            var fixedJson = filtersJson.replace(/([\{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            var filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
            if (filters.category) {
                path = Array.isArray(filters.category) ? filters.category[0].slug : filters.category;
            }
        } catch (e) {}
    }
    
    var res = BASEURL + path;
    if (page > 1) res += "?page=" + page;
    return res.replace(/([^:]\/)\/+/g, "$1");
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var fixedJson = filtersJson.replace(/([\{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            var filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    var url = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + slug;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};

        // 1. Quét JSON State nội bộ của Next.js (chính xác và đầy đủ data nhất)
        var regex = /\{"item":\{"title":"([^"]+)","slug":"([^"]+)","img":"([^"]+)","badge":"([^"]*)"/g;
        var match;
        while ((match = regex.exec(html)) !== null) {
            var slug = match[2];
            if (!seen[slug]) {
                seen[slug] = true;
                items.push({
                    id: "/phim/" + slug,
                    title: match[1],
                    posterUrl: match[3],
                    backdropUrl: match[3],
                    episode_current: match[4],
                    quality: "HD"
                });
            }
        }

        // 2. Dự phòng quét HTML nếu JSON ko load kịp
        if (items.length === 0) {
            var htmlRegex = /<a[^>]+href=["']\/phim\/([^"']+)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?(?:<span[^>]*>([^<]+)<\/span>)?[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
            while ((match = htmlRegex.exec(html)) !== null) {
                var slug = match[1];
                if (!seen[slug]) {
                    seen[slug] = true;
                    items.push({
                        id: "/phim/" + slug,
                        title: match[4].trim(),
                        posterUrl: match[2],
                        backdropUrl: match[2],
                        episode_current: match[3] ? match[3].trim() : "Full",
                        quality: "HD"
                    });
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 100 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    try {
        // Thông tin cơ bản
        var titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(" FULL - Gà Mờ Mê Phim", "").trim() : "Đang cập nhật...";

        var imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1] : "";

        var servers = [];
        var tmEps = [];
        var subEps = [];

        // Trích xuất trực tiếp kho dữ liệu JSON chứa toàn bộ link tập phim
        var startToken = '"video":{';
        var startIndex = html.indexOf(startToken);
        if (startIndex !== -1) {
            var endIndex = html.indexOf(',"shopeeLockerConfig"');
            if (endIndex === -1) endIndex = html.indexOf(',"telegramConfig"');
            
            if (endIndex !== -1) {
                var jsonStr = "{" + html.substring(startIndex, endIndex) + "}";
                // Fix lỗi parse syntax Date ($D) của Next.js
                jsonStr = jsonStr.replace(/"\$D([^"]+)"/g, '"$1"');
                
                try {
                    var videoData = JSON.parse(jsonStr).video;
                    if (videoData && videoData.episodes) {
                        videoData.episodes.forEach(function(ep) {
                            var epNum = ep.episodeNumber || 1;
                            var epName = "Tập " + epNum;
                            // Thu thập link mp4 (ẩn dưới tên m3u8Url)
                            var epUrl = ep.m3u8Url || ep.videoUrl || ep.url;
                            
                            if (epUrl) {
                                // Truyền thẳng url vào id để parseDetailResponse bắt trực tiếp
                                var item = { id: epUrl, name: epName, slug: "tap-" + epNum };
                                if (ep.audioType === "THUYET_MINH") {
                                    tmEps.push(item);
                                } else {
                                    subEps.push(item);
                                }
                            }
                        });
                    }
                } catch(e) {}
            }
        }

        if (tmEps.length > 0) servers.push({ name: "Thuyết Minh", episodes: tmEps });
        if (subEps.length > 0) servers.push({ name: "Vietsub", episodes: subEps });
        
        var totalEps = (tmEps.length > subEps.length) ? tmEps.length : subEps.length;

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD",
            lang: (tmEps.length > 0 && subEps.length > 0) ? "Vietsub / Thuyết Minh" : (tmEps.length > 0 ? "Thuyết Minh" : "Vietsub"),
            year: 2026,
            category: "Phim Ngắn",
            status: totalEps > 0 ? totalEps + " Tập" : "Đang Cập Nhật"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html, url) {
    try {
        // [QUAN TRỌNG] FIX LỖI "TUA VIDEO": 
        // Phân biệt đúng MIME Type. Nếu đuôi là mp4, phải ép về video/mp4 để máy phát hiểu đây ko phải luồng Live
        var isMp4 = url.indexOf('.mp4') > -1;
        var mime = isMp4 ? "video/mp4" : "application/x-mpegURL";

        return JSON.stringify({
            url: url,
            isEmbed: false,
            mimeType: mime, 
            headers: {
                "Referer": BASEURL
            }
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
