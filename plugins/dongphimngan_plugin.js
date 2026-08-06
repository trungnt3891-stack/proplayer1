// =============================================================================
// CẤU HÌNH DOMAIN (CHỈ CẦN SỬA TÊN MIỀN Ở ĐÂY NẾU WEB CÓ THAY ĐỔI)
// =============================================================================
var MAIN_DOMAIN = "dongphimngan.com"; 
var BASEURL = "https://" + MAIN_DOMAIN; 

// =============================================================================
// PLUGIN ĐỘNG PHIM NGẮN TRUNG - NATIVE PLAYER (KHÔNG DÙNG WEBVIEW)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "dongphimngan",
        "name": "Động Phim Ngắn",
        "description": "Nội soi JSON bóc tập chuẩn xác. Bẻ khóa Base64URL bắt link MP4 trực tiếp. Tua mượt, lưu lịch sử 100%.",
        "version": "8.0.0", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/uploads/4260e165-e0c7-45e7-9ac1-6740b4f50510-pc.webp",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" // Tuyệt đối dùng Trình phát nội bộ của Vax (Native Player)
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[dongphimngan] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[dongphimngan] " + msg);
    }
}

// KHỞI TẠO CÁC FOLDER Ở TRANG CHỦ
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
    
    // Nếu là load Folder phân mảnh ở trang chủ
    if (slug && slug.indexOf('?section=') === 0) {
        return BASEURL + "/" + slug; 
    }
    
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
// BỘ TIỆN ÍCH GIẢI MÃ BASE64URL (ĐÃ FIX LỖI KÝ TỰ - VÀ _)
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
    // Chuyển đổi Base64URL sang Base64 tiêu chuẩn để chống gãy mã
    var fixedStr = String(str).replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    for (var bc = 0, bs, buffer, idx = 0;
        buffer = fixedStr.charAt(idx++);
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
        
        if (url && url.indexOf('?section=') !== -1) {
            targetSection = decodeURIComponent(url.split('?section=')[1]).toLowerCase();
        }
        
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
            else return JSON.stringify({ items: [] });
        }
        
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
        return JSON.stringify({ items: [] });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

// =============================================================================
// PARSE MOVIE DETAIL: BÓC ĐÚNG THÔNG SỐ SERVER CHỐNG LỖI 404
// =============================================================================

function parseMovieDetail(html, currentUrl) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? cleanText(titleM[1]).split('-')[0].split('|')[0].trim() : "Đang cập nhật";

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";
        if (poster && poster.indexOf('http') === -1) poster = BASEURL + poster;

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/name="description" content="([^"]+)"/i);
        var desc = descM ? cleanText(descM[1]) : "";

        var movieSlug = currentUrl.split('/').pop().split('?')[0];

        // Dọn dẹp HTML và thu hẹp khu vực chứa JSON tập phim
        var cleanHtml = html.replace(/\\"/g, '"'); 
        var vsEps = [];
        var tmEps = [];
        var added = {};
        
        var epsStart = cleanHtml.indexOf('"episodes":[');
        var epsEnd = cleanHtml.indexOf('"initialSource"');
        if (epsEnd === -1) epsEnd = cleanHtml.length;
        
        var epsBlock = cleanHtml.substring(epsStart, epsEnd);

        // Thuật toán bóc tách cực mạnh: Quét Tên Tập + Slug + Thông số Server (1080/HD)
        var epRegex = /"number"\s*:\s*"([^"]+)"\s*,\s*"slug"\s*:\s*"([^"]+)".*?"sources"\s*:\s*\[(.*?)\]/g;
        var match;
        
        while ((match = epRegex.exec(epsBlock)) !== null) {
            var epNum = match[1];
            var epSlug = match[2];
            var sourcesStr = match[3];
            
            if (added[epSlug]) continue;
            added[epSlug] = true;

            var epName = epNum;
            if (/^\d+$/.test(epName)) epName = "Tập " + epName;
            else if (epName.toLowerCase() === "full") epName = "Full Tập";

            var vsServer = "";
            var tmServer = "";
            
            // Tìm Server phân giải phù hợp (Độc trị lỗi 404)
            var srcRegex = /"serverGroup"\s*:\s*"([^"]+)"\s*,\s*"serverName"\s*:\s*"([^"]+)"/g;
            var sMatch;
            while ((sMatch = srcRegex.exec(sourcesStr)) !== null) {
                var group = sMatch[1].toUpperCase();
                var srv = sMatch[2]; // Có thể là 1080, HD, V4...
                
                if (group === "VIETSUB" && !vsServer) vsServer = srv;
                if (group === "THUYẾT MINH" && !tmServer) tmServer = srv;
            }

            // Fallback nếu JSON bị lỗi cấu trúc
            if (!vsServer && sourcesStr.indexOf('VIETSUB') !== -1) vsServer = "1080";
            if (!tmServer && sourcesStr.indexOf('THUYẾT MINH') !== -1) tmServer = "1080";

            // Kiến tạo URL hoàn hảo gọi trực tiếp dữ liệu Video
            if (vsServer) {
                vsEps.push({
                    id: BASEURL + "/xem-phim/" + movieSlug + "/" + vsServer + "/vietsub/" + epSlug,
                    name: epName,
                    slug: "vs_" + epSlug
                });
            }
            if (tmServer) {
                tmEps.push({
                    id: BASEURL + "/xem-phim/" + movieSlug + "/" + tmServer + "/thuyet-minh/" + epSlug,
                    name: epName,
                    slug: "tm_" + epSlug
                });
            }
        }

        var servers = [];
        if (vsEps.length > 0) servers.push({ name: "Phim Vietsub (Bản Đẹp)", episodes: vsEps });
        if (tmEps.length > 0) servers.push({ name: "Thuyết Minh (Bản Đẹp)", episodes: tmEps });

        // Vớt vát nếu web ẩn hoàn toàn mảng episodes
        if (servers.length === 0) {
             servers.push({ 
                 name: "Hệ Thống", 
                 episodes: [
                     { id: BASEURL + "/xem-phim/" + movieSlug + "/1080/vietsub/full", name: "Vietsub (Trọn Bộ)", slug: "vs_full" },
                     { id: BASEURL + "/xem-phim/" + movieSlug + "/1080/thuyet-minh/full", name: "Thuyết Minh (Trọn Bộ)", slug: "tm_full" }
                 ] 
             });
        }

        var totalEps = (vsEps.length > 0) ? vsEps.length : 1;

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
            status: totalEps + " Tập"
        });
    } catch (e) {
        log("Lỗi Parse Detail: " + e.message);
        return JSON.stringify({ id: currentUrl, title: "Lỗi chi tiết", servers: [] });
    }
}

// =============================================================================
// SIÊU CÔNG CỤ BẮT LINK: BẺ KHÓA BASE64URL MỞ PHIM TRỰC TIẾP!
// =============================================================================

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var cleanHtml = html.replace(/\\"/g, '"');
        
        // 1. Càn quét tìm mốc chứa URL mã hóa
        var videoMatch = cleanHtml.match(/"videoUrl"\s*:\s*"([^"]+)"/i);
        
        if (videoMatch) {
            var rawUrl = videoMatch[1];
            // Nếu phát hiện chuỗi mã hóa (aHR0cHM = https) -> Bẻ khóa ngay
            if (rawUrl.indexOf('aHR0c') === 0) {
                streamUrl = decodeBase64(rawUrl);
            } else {
                streamUrl = rawUrl; 
            }
        } 
        
        // 2. Dự phòng: Quét Link MP4 thô trong HTML nếu web ngừng mã hóa
        if (!streamUrl) {
            var rawRegex = /(https?:\/\/[^"'\\]+\.(?:mp4|m3u8)[^"'\\]*)/gi;
            var rawMatch = rawRegex.exec(cleanHtml);
            if (rawMatch) {
                streamUrl = rawMatch[1].replace(/\\/g, "");
            }
        }

        if (streamUrl) {
            log("🎯 Đã bắt được link trực tiếp: " + streamUrl);
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // TUYỆT ĐỐI FALSE ĐỂ CHẠY TRÌNH PHÁT VIDEO CỦA APP
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
        log("Lỗi Bắt Link: " + e.message);
        return JSON.stringify({});
    }
}

function parseEmbedResponse(htmlContent, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
