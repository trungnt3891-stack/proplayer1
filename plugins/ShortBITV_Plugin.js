// =============================================================================
// PLUGIN ĐỘNG PHIM NGẮN TRUNG (DONGPHIMNGAN.COM)
// NATIVE PLAYER - DIRECT LINK EXTRACTOR - BASE64 DECODER
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "version": "1.0.0", // Bản Native: Lấy link MP4/M3U8 trực tiếp, KHÔNG dùng Webview
        "baseUrl": "https://dongphimngan.com",
        "iconUrl": "https://dongphimngan.com/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" // Dùng Trình phát video gốc của App (Lưu lịch sử hoàn hảo)
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '/', title: 'Trang Chủ & Đề Xuất', type: 'Grid', path: '' },
        { slug: 'the-loai/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal', path: '' },
        { slug: 'the-loai/cuoi-truoc-yeu-sau', title: 'Cưới Trước Yêu Sau', type: 'Horizontal', path: '' },
        { slug: 'the-loai/tong-tai', title: 'Tổng Tài Bá Đạo', type: 'Horizontal', path: '' },
        { slug: 'the-loai/nu-cuong', title: 'Nữ Cường', type: 'Horizontal', path: '' },
        { slug: 'the-loai/ngot-sung', title: 'Ngọt Sủng', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trang Chủ', slug: '/' },
        { name: 'Ngôn Tình', slug: 'the-loai/ngon-tinh' },
        { name: 'Chữa Lành', slug: 'the-loai/chua-lanh' },
        { name: 'Cưới Trước Yêu Sau', slug: 'the-loai/cuoi-truoc-yeu-sau' },
        { name: 'Nữ Cường', slug: 'the-loai/nu-cuong' },
        { name: 'Ngọt Sủng', slug: 'the-loai/ngot-sung' },
        { name: 'Tổng Tài Bá Đạo', slug: 'the-loai/tong-tai' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Hiện Đại', slug: 'the-loai/hien-dai' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATOR
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://dongphimngan.com";
    
    var finalSlug = slug.replace(/^\//, ""); // Xóa dấu / ở đầu nếu có
    if (page === 1) return baseUrl + "/" + finalSlug;
    
    // Xử lý phân trang (nếu web hỗ trợ)
    return baseUrl + "/" + finalSlug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://dongphimngan.com/tim-kiem?q=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://dongphimngan.com/" + slug.replace(/^\//, "");
}

// =============================================================================
// BỘ TIỆN ÍCH GIẢI MÃ BASE64 VÀ XỬ LÝ CHUỖI
// =============================================================================

var Utils = {
    cleanStr: function(str) {
        if (!str) return "";
        return str.replace(/\\u0022/g, '"')
                  .replace(/\\n/g, ' ')
                  .replace(/\\r/g, ' ')
                  .replace(/\\t/g, ' ')
                  .replace(/\\/g, '')
                  .trim();
    },
    base64Decode: function(str) {
        if (typeof atob !== 'undefined') {
            try { return atob(str); } catch (e) {}
        }
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var output = '';
        str = String(str).replace(/=+$/, '');
        for (var bc = 0, bs, buffer, idx = 0;
            buffer = str.charAt(idx++);
            ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }
        return output;
    }
};

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};
        
        // Quét tất cả các thẻ a có chứa link phim (/phim/...)
        var blockRegex = /<a[^>]*href="\/phim\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = blockRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/alt="([^"]+)"/i);
            var imgMatch = innerHtml.match(/src="([^"]+)"/i) || innerHtml.match(/srcSet="([^"]+)"/i);
            var epMatch = innerHtml.match(/>([^<]+)<\/span><\/div>/i); // Bắt chữ Trọn bộ hoặc Tập 1

            if (titleMatch && imgMatch) {
                var url = "https://dongphimngan.com/phim/" + slug;
                var img = imgMatch[1].split(' ')[0]; // Xử lý srcSet nếu có
                if (img.indexOf("http") === -1) img = "https://dongphimngan.com" + img;
                
                var title = titleMatch[1].trim();
                var episode = "HD";
                if (innerHtml.indexOf('Trọn bộ') !== -1) episode = "Trọn Bộ";
                else if (epMatch && epMatch[1]) episode = epMatch[1].trim();
                
                if (!seen[slug]) {
                    items.push({
                        id: url,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        episode_current: episode,
                        quality: "FHD"
                    });
                    seen[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 10, totalItems: 9999 } // Mặc định cho phép vuốt tiếp
        });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BẮT CHUẨN XÁC DANH SÁCH TẬP PHIM BẰNG JSON CỦA NEXT.JS
function parseMovieDetail(html, currentUrl) {
    try {
        // 1. Tách thông tin cơ bản
        var titleM = html.match(/"title":"([^"]+)"/);
        var title = titleM ? Utils.cleanStr(titleM[1]) : "Phim Ngắn";

        var posterM = html.match(/"posterUrl":"([^"]+)"/) || html.match(/"image":"([^"]+)"/);
        var poster = posterM ? posterM[1] : "";
        if (poster && poster.indexOf('http') === -1) poster = "https://dongphimngan.com" + poster;

        var descM = html.match(/"description":"(.*?)"/);
        var desc = descM ? Utils.cleanStr(descM[1]) : "";

        // Tách Slug gốc của phim
        var slugMatch = html.match(/"movieSlug":"([^"]+)"/);
        var movieSlug = slugMatch ? slugMatch[1] : currentUrl.split('/').pop();

        // 2. Thuật toán quét Tập phim siêu chuẩn từ JSON Array
        var servers = [];
        var vietsubEps = [];
        var thuyetMinhEps = [];
        
        var epArrayStrMatch = html.match(/"episodes":(\[.*?\])(?=,"seriesMovies"|,"initialSource")/);
        if (epArrayStrMatch) {
            var eps = JSON.parse(epArrayStrMatch[1]);
            
            for (var i = 0; i < eps.length; i++) {
                var ep = eps[i];
                var epName = ep.title || ep.number;
                if (/^\d+$/.test(epName)) epName = "Tập " + epName; // Gắn chữ Tập nếu chỉ có số
                
                // [HUYỆT ĐẠO]: Tạo ID URL giả lập đường dẫn sang trang Xem Phim để lát nữa Hàm parseDetailResponse nhảy vào lấy link
                // Cấu trúc web: /xem-phim/[slug-phim]/[server]/[audio]/[slug-tap]
                
                vietsubEps.push({
                    id: "https://dongphimngan.com/xem-phim/" + movieSlug + "/1080/vietsub/" + ep.slug,
                    name: epName,
                    slug: ep.slug
                });
                
                thuyetMinhEps.push({
                    id: "https://dongphimngan.com/xem-phim/" + movieSlug + "/1080/thuyet-minh/" + ep.slug,
                    name: epName,
                    slug: ep.slug
                });
            }
        }

        if (vietsubEps.length > 0) servers.push({ name: "Vietsub (1080p)", episodes: vietsubEps });
        if (thuyetMinhEps.length > 0) servers.push({ name: "Thuyết Minh (1080p)", episodes: thuyetMinhEps });

        // Fallback nếu không parse được JSON
        if (servers.length === 0) {
            servers.push({
                name: "Hệ Thống",
                episodes: [{ id: currentUrl, name: "Tập 1 / Trọn Bộ", slug: "full" }]
            });
        }

        var total = vietsubEps.length > 0 ? vietsubEps.length : 1;

        return JSON.stringify({
            id: currentUrl,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "FHD",
            lang: "Vietsub / Thuyết Minh",
            year: 2026,
            rating: 10,
            category: "Phim Ngắn",
            status: total + " Tập"
        });
    } catch (e) {
        return JSON.stringify({ id: currentUrl, title: "Lỗi chi tiết", servers: [] });
    }
}

// BỘ GIẢI MÃ VIDEO GỐC NATIVE (KHÔNG DÙNG WEBVIEW)
function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        // Cú lừa của web: Mã hóa Base64 giấu link trong "videoUrl"
        // Tìm chữ "videoUrl":"aHR0cHM..."
        var base64Match = html.match(/"videoUrl":"(aHR0cHM6[^"]+)"/);
        
        if (base64Match) {
            var encodedStr = base64Match[1];
            streamUrl = Utils.base64Decode(encodedStr);
        } 
        
        // Backup: Quét link thô nếu web ngưng mã hóa
        if (!streamUrl) {
            var rawMatch = html.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (rawMatch) streamUrl = rawMatch[1].replace(/\\/g, "");
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // Báo cho App biết đây là link thật, KHÔNG phải iframe
                mimeType: streamUrl.indexOf('.m3u8') !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "Referer": "https://dongphimngan.com/",
                    "Origin": "https://dongphimngan.com",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                }
            });
        }
        
        return JSON.stringify({});
    } catch (e) {
        return JSON.stringify({});
    }
}

// Không cần thiết vì luồng trên đã làm xuất sắc
function parseEmbedResponse(htmlContent, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
