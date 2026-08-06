// =============================================================================
// CẤU HÌNH DOMAIN (CHỈ CẦN SỬA TÊN MIỀN Ở ĐÂY NẾU WEB CÓ THAY ĐỔI)
// =============================================================================
var MAIN_DOMAIN = "dongphimngan.com"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN ĐỘNG PHIM NGẮN TRUNG - BẮT LINK NGUYÊN CHẤT (NATIVE PLAYER)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "description": "Giải mã Base64 bắt link MP4 trực tiếp, không qua Webview. Lưu lịch sử chuẩn.",
        "version": "6.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" // Dùng Trình phát video gốc của App (Mượt, tự động lưu lịch sử)
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[dongphimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[dongphimngan] " + msg);
    }
}

// KHỞI TẠO CÁC FOLDER Ở TRANG CHỦ (CHIA BẢNG LƯỚT NGANG & LƯỚI)
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
    var filters = {};
    try { filters = JSON.parse(filtersJson || "{}"); } catch(e){}
    var page = filters.page || 1;
    
    // Nếu là load Folder phân mảnh ở trang chủ (có chứa ?section=)
    if (slug && slug.indexOf('?section=') === 0) {
        return BASEURL + "/" + slug; 
    }
    
    // Nếu là load Danh mục bình thường
    var finalSlug = (slug || "").replace(/^\//, ""); 
    var url = BASEURL + "/" + finalSlug;
    
    if (page > 1) {
        url += (url.indexOf('?') !== -1 ? "&page=" : "?page=") + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try { page = JSON.parse(filtersJson || "{}").page || 1; } catch(e){}
    var url = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// BỘ TIỆN ÍCH GIẢI MÃ BASE64 VÀ XỬ LÝ CHUỖI
// =============================================================================

function cleanText(text) {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/\\u0022/g, '"')
        .replace(/\s+/g, " ")
        .trim();
}

function decodeBase64(str) {
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

// =============================================================================
// PARSERS: THUẬT TOÁN BÓC TÁCH FOLDER VÀ BẢNG LƯỚT
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        var targetSection = "";
        
        // Trích xuất tên Folder mục tiêu (Nếu load từ Trang chủ)
        if (url && url.indexOf('?section=') !== -1) {
            targetSection = decodeURIComponent(url.split('?section=')[1]).toLowerCase();
        }
        
        // Kỹ thuật phân mảnh: Cắt đúng khu vực chứa phim của Folder đó
        if (targetSection) {
            var sections = html.split('<section');
            var foundHtml = "";
            for (var i = 1; i < sections.length; i++) {
                var sec = sections[i];
                var titleMatch = sec.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
                if (titleMatch && cleanText(titleMatch[1]).toLowerCase().indexOf(targetSection) !== -1) {
                    foundHtml = sec;
                    break;
                }
            }
            if (foundHtml) html = foundHtml; 
            else return JSON.stringify({ items: [] }); // Trả về rỗng nếu không tìm thấy Folder
        }
        
        // Quét mổ xẻ lấy Phim
        var aRegex = /<a[^>]+href=["']\/phim\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = aRegex.exec(html)) !== null) {
            var slug = match[1];
            var innerHtml = match[2];
            
            var titleMatch = innerHtml.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i) || innerHtml.match(/alt=["']([^"']+)["']/i);
            var imgMatch = innerHtml.match(/src=["']([^"']+)["']/i);

            if (titleMatch && imgMatch) {
                var phimUrl = BASEURL + "/phim/" + slug;
                var img = imgMatch[1].split(' ')[0]; 
                if (img.indexOf("http") === -1) img = BASEURL + img;
                
                var title = cleanText(titleMatch[1]);
                var epMatch = innerHtml.match(/>\s*(Trọn bộ|Tập \d+|Full[^<]*)\s*<\/span>/i);
                var episode = epMatch ? epMatch[1].trim() : "Full Tập";
                
                if (!added[slug] && title) {
                    items.push({
                        id: phimUrl,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        episode_current: episode,
                        quality: "FHD"
                    });
                    added[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: targetSection ? 1 : 10, totalItems: 9999 } 
        });
    } catch (e) {
        log("List Error: " + e.message);
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// PARSE MOVIE DETAIL: BÓC TẬP TỪ DỮ LIỆU NEXT.JS ĐỂ VAX LƯU LỊCH SỬ
// =============================================================================

function parseMovieDetail(html, currentUrl) {
    try {
        // Lấy thông tin cơ bản bằng Thẻ Meta
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? cleanText(titleM[1]).split('-')[0].split('|')[0].trim() : "Đang cập nhật";

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";
        if (poster && poster.indexOf('http') === -1) poster = BASEURL + poster;

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/name="description" content="([^"]+)"/i);
        var desc = descM ? cleanText(descM[1]) : "";

        var movieSlug = currentUrl.split('/').pop().split('?')[0];

        // Mổ xẻ lấy số tập từ dữ liệu ngầm JSON của Next.js
        var cleanHtml = html.replace(/\\"/g, '"'); 
        var eps = [];
        var added = {};
        
        var epRegex = /"number"\s*:\s*"?([^",}]+)"?\s*,\s*"slug"\s*:\s*"([^"]+)"/gi;
        var epMatch;
        while ((epMatch = epRegex.exec(cleanHtml)) !== null) {
            var num = epMatch[1];
            var eSlug = epMatch[2];
            if (!added[eSlug]) {
                eps.push({ num: num, slug: eSlug });
                added[eSlug] = true;
            }
        }

        // Ép kiểu sắp xếp thứ tự các tập
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
                else if (name.toLowerCase() === "full") name = "Full Tập";

                // Bơm link giả lập để hàm parseDetailResponse nhảy vào lấy link phát thật sự
                vsEps.push({
                    id: BASEURL + "/xem-phim/" + movieSlug + "/1080/vietsub/" + eps[i].slug,
                    name: name,
                    slug: "vs_" + eps[i].slug
                });
                tmEps.push({
                    id: BASEURL + "/xem-phim/" + movieSlug + "/1080/thuyet-minh/" + eps[i].slug,
                    name: name,
                    slug: "tm_" + eps[i].slug
                });
            }
            servers.push({ name: "Phim Vietsub (Bản FHD)", episodes: vsEps });
            servers.push({ name: "Thuyết Minh (Bản FHD)", episodes: tmEps });
        } else {
             // Fallback vớt vát nếu web ẩn dữ liệu
             servers.push({ 
                 name: "Hệ Thống", 
                 episodes: [
                     { id: BASEURL + "/xem-phim/" + movieSlug + "/1080/vietsub/full", name: "Vietsub (Trọn Bộ)", slug: "vs_full" },
                     { id: BASEURL + "/xem-phim/" + movieSlug + "/1080/thuyet-minh/full", name: "Thuyết Minh (Trọn Bộ)", slug: "tm_full" }
                 ] 
             });
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
            status: eps.length > 0 ? eps.length + " Tập" : "Đang Cập Nhật"
        });
    } catch (e) {
        log("Detail Error: " + e.message);
        return JSON.stringify({ id: currentUrl, title: "Lỗi chi tiết", servers: [] });
    }
}

// =============================================================================
// GIẢI MÃ NATIVE: PHÁ BỎ BASE64, BẮT MP4 TRỰC TIẾP, KHÔNG DÙNG WEBVIEW
// =============================================================================

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var cleanHtml = html.replace(/\\"/g, '"'); 
        
        // 1. Tóm đoạn mã giấu Link Video
        var videoMatch = cleanHtml.match(/"videoUrl"\s*:\s*"([^"]+)"/i);
        
        if (videoMatch) {
            var rawUrl = videoMatch[1];
            // 2. Nếu phát hiện bị mã hóa Base64 (bắt đầu bằng aHR0c...) -> Bẻ khóa
            if (rawUrl.indexOf('aHR0c') === 0) {
                streamUrl = decodeBase64(rawUrl);
            } else {
                streamUrl = rawUrl; 
            }
        } else {
            // Backup dự phòng quét thẳng bằng Regex
            var rawMatch = cleanHtml.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
            if (rawMatch) streamUrl = rawMatch[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // TUYỆT ĐỐI KHÔNG DÙNG WEBVIEW MÀ ĐẨY THẲNG CHO EXOPLAYER
                mimeType: streamUrl.indexOf('.m3u8') !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { 
                    "Referer": BASEURL + "/",
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                }
            });
        }
        
        return JSON.stringify({});
    } catch (e) {
        log("Stream Error: " + e.message);
        return JSON.stringify({});
    }
}

function parseEmbedResponse(htmlContent, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
