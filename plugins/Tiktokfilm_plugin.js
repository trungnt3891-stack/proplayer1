// =============================================================================
// PLUGIN ĐỘNG PHIM NGẮN TRUNG (DONGPHIMNGAN.COM)
// ĐÃ BỔ SUNG: GIAO DIỆN FOLDER TRANG CHỦ & BẢNG LƯỚT NGANG
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "version": "1.0.1", 
        "baseUrl": "https://dongphimngan.com",
        "iconUrl": "https://dongphimngan.com/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" 
    });
}

// KHỞI TẠO CÁC FOLDER Ở TRANG CHỦ BẰNG DẠNG LƯỚT NGANG (HORIZONTAL) VÀ LƯỚI (GRID)
function getHomeSections() {
    return JSON.stringify([
        { slug: '?section=Phim Mới Cập Nhật', title: 'Phim Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: '?section=Top 10', title: 'Bảng Xếp Hạng Top 10', type: 'Horizontal', path: '' },
        { slug: '?section=Ngọt đến sâu răng', title: 'Ngọt Sủng Sâu Răng', type: 'Horizontal', path: '' },
        { slug: 'the-loai/ngon-tinh', title: 'Phim Ngôn Tình', type: 'Grid', path: '' },
        { slug: 'the-loai/cuoi-truoc-yeu-sau', title: 'Cưới Trước Yêu Sau', type: 'Horizontal', path: '' },
        { slug: 'the-loai/tong-tai', title: 'Tổng Tài Bá Đạo', type: 'Horizontal', path: '' },
        { slug: 'the-loai/nu-cuong', title: 'Nữ Cường & Báo Thù', type: 'Horizontal', path: '' },
        { slug: 'the-loai/hai-huoc', title: 'Phim Hài Hước', type: 'Horizontal', path: '' }
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
    
    // Nếu là load Folder (Mục phân mảnh) ở trang chủ
    if (slug.indexOf('?section=') === 0) {
        return baseUrl + "/" + slug; 
    }
    
    // Nếu là load Danh mục bình thường
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
// BỘ TIỆN ÍCH
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
// PARSERS: THUẬT TOÁN BÓC TÁCH FOLDER VÀ BẢNG LƯỚT
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var seen = {};
        var urlStr = url || "";
        var targetSection = "";
        
        // Trích xuất tên Folder mục tiêu từ URL ảo
        if (urlStr.indexOf('?section=') !== -1) {
            targetSection = decodeURIComponent(urlStr.split('?section=')[1]);
        }
        
        // Kỹ thuật phân mảnh: Chỉ lấy phim nằm trong Folder được yêu cầu
        if (targetSection) {
            var sections = html.split('<section');
            var foundHtml = "";
            for (var i = 1; i < sections.length; i++) {
                var sec = sections[i];
                var titleMatch = sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
                // Nếu tìm thấy Tên Folder khớp với dữ liệu trên web
                if (titleMatch && PluginUtils.cleanText(titleMatch[1]).indexOf(targetSection) !== -1) {
                    foundHtml = sec;
                    break;
                }
            }
            if (foundHtml) {
                html = foundHtml; // Thu hẹp phạm vi quét phim chỉ trong Folder này
            } else {
                return JSON.stringify({ items: [] });
            }
        }
        
        // Quét mổ xẻ lấy Phim
        var aRegex = /<a[^>]+href="\/phim\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/<h[34][^>]*>([^<]+)<\/h[34]>/i) || innerHtml.match(/alt="([^"]+)"/i);
            var imgMatch = innerHtml.match(/src="([^"]+)"/i);

            if (titleMatch && imgMatch) {
                var phimUrl = "https://dongphimngan.com/phim/" + slug;
                var img = imgMatch[1].split(' ')[0]; 
                if (img.indexOf("http") === -1) img = "https://dongphimngan.com" + img;
                
                var title = PluginUtils.cleanText(titleMatch[1]);
                var epMatch = innerHtml.match(/>(Trọn bộ|Tập \d+|Full[^<]*)<\/span>/i);
                var episode = epMatch ? epMatch[1] : "Full Tập";
                
                if (!seen[slug]) {
                    items.push({
                        id: phimUrl,
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
            // Với Folder ở Trang chủ chỉ load 1 trang, với Danh mục được quyền lướt trang tiếp theo
            pagination: { currentPage: 1, totalPages: targetSection ? 1 : 10, totalItems: 9999 } 
        });
    } catch (e) {
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// PARSE MOVIE DETAIL (GIỮ NGUYÊN 100% NHƯ YÊU CẦU)
// =============================================================================
function parseMovieDetail(html, currentUrl) {
    try {
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
                if (/^\d+$/.test(name)) name = "Tập " + name;

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
// PARSE DETAIL RESPONSE (GIỮ NGUYÊN 100% BỘ BẮT LINK)
// =============================================================================
function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var cleanHtml = html.replace(/\\"/g, '"'); 
        
        var base64Match = cleanHtml.match(/"videoUrl":"(aHR0cHM[^"]+)"/i);
        
        if (base64Match) {
            streamUrl = PluginUtils.base64Decode(base64Match[1]);
        } else {
            var rawMatch = cleanHtml.match(/"videoUrl":"(https?[^"]+)"/i);
            if (rawMatch) streamUrl = rawMatch[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, 
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
