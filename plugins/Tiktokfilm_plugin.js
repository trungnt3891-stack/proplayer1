// =============================================================================
// PLUGIN ĐỘNG PHIM NGẮN TRUNG (DONGPHIMNGAN.COM)
// NATIVE PLAYER - GIẢI MÃ BASE64 LẤY LINK MP4 TRỰC TIẾP
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "version": "1.0.0", 
        "baseUrl": "https://dongphimngan.com",
        "iconUrl": "https://dongphimngan.com/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" // Dùng Trình phát video gốc của App (Mượt, tự động lưu lịch sử)
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '', title: 'Phim Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'the-loai/ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal', path: '' },
        { slug: 'the-loai/cuoi-truoc-yeu-sau', title: 'Cưới Trước Yêu Sau', type: 'Horizontal', path: '' },
        { slug: 'the-loai/tong-tai', title: 'Tổng Tài Bá Đạo', type: 'Horizontal', path: '' },
        { slug: 'the-loai/nu-cuong', title: 'Nữ Cường', type: 'Horizontal', path: '' },
        { slug: 'the-loai/ngot-sung', title: 'Ngọt Sủng', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trang Chủ', slug: '' },
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
    
    var finalSlug = slug.replace(/^\//, ""); 
    var url = baseUrl + "/" + finalSlug;
    
    if (page > 1) {
        url += (url.indexOf('?') !== -1 ? "&page=" : "?page=") + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try { page = JSON.parse(filtersJson).page || 1; } catch(e){}
    }
    var url = "https://dongphimngan.com/tim-kiem?q=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://dongphimngan.com/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BỘ TIỆN ÍCH GIẢI MÃ BASE64 VÀ XỬ LÝ CHUỖI
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\\u0022/g, '"')
            .replace(/\s+/g, " ")
            .trim();
    },
    // Thuật toán bẻ khóa Link Base64 chuyên dụng
    base64Decode: function(str) {
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
        
        // Quét tất cả các thẻ <a> có chứa link /phim/
        var aRegex = /<a[^>]+href="\/phim\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/alt="([^"]+)"/i) || innerHtml.match(/<h[34][^>]*>([^<]+)<\/h[34]>/i);
            var imgMatch = innerHtml.match(/src="([^"]+)"/i);

            if (titleMatch && imgMatch) {
                var url = "https://dongphimngan.com/phim/" + slug;
                var img = imgMatch[1].split(' ')[0]; 
                if (img.indexOf("http") === -1) img = "https://dongphimngan.com" + img;
                
                var title = PluginUtils.cleanText(titleMatch[1]);
                
                if (!seen[slug]) {
                    items.push({
                        id: url,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        episode_current: "Full Tập",
                        quality: "FHD"
                    });
                    seen[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 10, totalItems: 9999 } 
        });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BẮT CHUẨN XÁC TẬP PHIM BẰNG CÁCH QUÉT NEXT.JS JSON
function parseMovieDetail(html, currentUrl) {
    try {
        // Dọn dẹp dấu gạch chéo ngược (\") của Next.js để Regex dễ đọc
        var cleanHtml = html.replace(/\\"/g, '"'); 
        
        var titleM = cleanHtml.match(/"title":"([^"]+)"/);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "Đang cập nhật";

        var posterM = cleanHtml.match(/"posterUrl":"([^"]+)"/) || cleanHtml.match(/"image":"([^"]+)"/);
        var poster = posterM ? posterM[1] : "";
        if (poster && poster.indexOf('http') === -1) poster = "https://dongphimngan.com" + poster;

        var descM = cleanHtml.match(/"description":"(.*?)"/);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        var slugMatch = cleanHtml.match(/"movieSlug":"([^"]+)"/);
        var movieSlug = slugMatch ? slugMatch[1] : currentUrl.split('/').pop();

        var eps = [];
        var added = {};
        
        // Quét tìm tất cả các tập (number và slug) trong mảng episodes
        var epRegex = /"number":"([^"]+)","slug":"([^"]+)"/g;
        var epMatch;
        while ((epMatch = epRegex.exec(cleanHtml)) !== null) {
            var num = epMatch[1];
            var eSlug = epMatch[2];
            if (!added[eSlug]) {
                eps.push({ num: num, slug: eSlug });
                added[eSlug] = true;
            }
        }

        // Sắp xếp tập từ bé đến lớn
        eps.sort(function(a, b) {
            var na = parseInt((a.num.match(/\d+/) || ["0"])[0], 10);
            var nb = parseInt((b.num.match(/\d+/) || ["0"])[0], 10);
            return na - nb;
        });

        var servers = [];
        if (eps.length > 0) {
            var vsEps = [];
            var tmEps = [];
            
            for (var i = 0; i < eps.length; i++) {
                var name = eps[i].num;
                // Nếu tập chỉ có số (vd: 1, 2, 3), tự động nối thêm chữ "Tập"
                if (/^\d+$/.test(name)) name = "Tập " + name;

                // GIẢ LẬP ĐƯỜNG DẪN XEM PHIM ĐỂ HÀM SAU NHẢY VÀO BẮT LINK
                vsEps.push({
                    id: "https://dongphimngan.com/xem-phim/" + movieSlug + "/1080/vietsub/" + eps[i].slug,
                    name: name,
                    slug: "vs_" + eps[i].slug
                });
                tmEps.push({
                    id: "https://dongphimngan.com/xem-phim/" + movieSlug + "/1080/thuyet-minh/" + eps[i].slug,
                    name: name,
                    slug: "tm_" + eps[i].slug
                });
            }
            servers.push({ name: "Phim Vietsub (Bản FHD)", episodes: vsEps });
            servers.push({ name: "Thuyết Minh (Bản FHD)", episodes: tmEps });
        } else {
             servers.push({ name: "Hệ Thống", episodes: [{ id: currentUrl, name: "Trọn Bộ", slug: "full" }] });
        }

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
            status: eps.length > 0 ? eps.length + " Tập" : "Full"
        });
    } catch (e) {
        return JSON.stringify({ id: currentUrl, title: "Lỗi chi tiết", servers: [] });
    }
}

// =============================================================================
// BỘ GIẢI MÃ VIDEO GỐC NATIVE (HOÀN TOÀN KHÔNG DÙNG WEBVIEW)
// =============================================================================
function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var cleanHtml = html.replace(/\\"/g, '"'); 
        
        // 1. Tìm chuỗi Base64 giấu trong "videoUrl"
        var base64Match = cleanHtml.match(/"videoUrl":"(aHR0cHM[^"]+)"/i);
        
        if (base64Match) {
            // 2. Kích hoạt thuật toán bẻ khóa thành Link MP4 nguyên chất
            streamUrl = PluginUtils.base64Decode(base64Match[1]);
        } else {
            // Backup nếu web thả lỏng không mã hóa nữa
            var rawMatch = cleanHtml.match(/"videoUrl":"(https?[^"]+)"/i);
            if (rawMatch) streamUrl = rawMatch[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // Ra lệnh cho App bật Native Player
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

function parseEmbedResponse(htmlContent, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
