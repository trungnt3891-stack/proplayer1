function getManifest() {
    return JSON.stringify({
        id: "yanhh3d_love",
        name: "YanHH3D",
        version: "2.1.0",
        description: "Hoạt Hình Trung Quốc Thuyết Minh 3D, 2D, 4K",
        author: "Gemini",
        baseUrl: "https://yanhh3d.love",
        type: "MOVIE",
        playerType: "exoplayer",
        adblock: true,
        debug: false
    });
}

// ===================================================================
// 1. CẤU HÌNH MENU & TRANG CHỦ (DỰA THEO MENU WEB)
// ===================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: "moi-cap-nhat", name: "Mới Cập Nhật" },
        { slug: "hoat-hinh-3d", name: "Hoạt Hình 3D" },
        { slug: "hoat-hinh-4k", name: "Hoạt Hình 4K" },
        { slug: "dang-chieu", name: "Đang Chiếu" },
        { slug: "hoan-thanh", name: "Đã Hoàn Thành" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { slug: "moi-cap-nhat", name: "Mới Cập Nhật" },
        { slug: "hoat-hinh-3d", name: "Hoạt Hình 3D" },
        { slug: "hoat-hinh-2d", name: "Hoạt Hình 2D" },
        { slug: "hoat-hinh-4k", name: "Hoạt Hình 4K" },
        { slug: "hoat-hinh-ai", name: "Hoạt Hình AI" },
        { slug: "hoan-thanh", name: "Đã Hoàn Thành" },
        { slug: "dang-chieu", name: "Đang Chiếu" },
        { slug: "phim-le", name: "Phim Lẻ | OVA" },
        // Nhóm Thể Loại
        { slug: "the-loai/huyen-huyen", name: "Huyền Huyễn" },
        { slug: "the-loai/xuyen-khong", name: "Xuyên Không" },
        { slug: "the-loai/trung-sinh", name: "Trùng Sinh" },
        { slug: "the-loai/tien-hiep", name: "Tiên Hiệp" },
        { slug: "the-loai/co-trang", name: "Cổ Trang" },
        { slug: "the-loai/hai-huoc", name: "Hài Hước" },
        { slug: "the-loai/kiem-hiep", name: "Kiếm Hiệp" },
        { slug: "the-loai/hien-dai", name: "Hiện Đại" }
    ]);
}

// ===================================================================
// 2. CÁC HÀM TẠO URL (URL BUILDERS)
// ===================================================================

function getUrlList(slug, filtersJson) {
    var filters = {};
    if (filtersJson) {
        try { filters = JSON.parse(filtersJson); } catch (e) {}
    }
    var page = filters.page ? filters.page : 1;
    
    // Ghép slug chuẩn với domain chính
    var url = "https://yanhh3d.love/" + slug.replace(/^\//, "");
    if (page > 1) {
        url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = {};
    if (filtersJson) {
        try { filters = JSON.parse(filtersJson); } catch (e) {}
    }
    var page = filters.page ? filters.page : 1;
    var url = "https://yanhh3d.love/search?keysearch=" + encodeURIComponent(keyword);
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    return slug; 
}

// ===================================================================
// 3. CÁC HÀM PHÂN TÍCH DỮ LIỆU (PARSERS)
// ===================================================================

function parseListResponse(html, apiUrl) {
    var items = [];
    
    // Biểu thức chính quy quét các card phim (.flw-item) trên web
    var regex = /<div class="flw-item">[\s\S]*?href="([^"]+)"[^>]*title="([^"]+)"[\s\S]*?data-src="([^"]+)"[\s\S]*?<div class="tick tick-rate">([^<]+)<\/div>/g;
    var match;
    
    while ((match = regex.exec(html)) !== null) {
        var filmUrl = match[1];
        var title = match[2].trim();
        var poster = match[3];
        var epCurrent = match[4].trim();

        // Đảm bảo URL là đường dẫn tuyệt đối
        if (filmUrl.indexOf("http") !== 0) {
            filmUrl = "https://yanhh3d.love" + (filmUrl.charAt(0) === "/" ? "" : "/") + filmUrl;
        }

        items.push({
            id: filmUrl,
            title: title,
            posterUrl: poster,
            episode_current: epCurrent
        });
    }

    // Xử lý tổng số trang (Pagination)
    var totalPages = 1;
    var pageRegex = /href="[^"]*page=(\d+)"[^>]*>[^<]*<\/a>\s*<\/li>\s*(?:<li[^>]*>\s*<a[^>]*>>)?/g;
    var maxPage = 1;
    var pageMatch;
    while ((pageMatch = pageRegex.exec(html)) !== null) {
        var p = parseInt(pageMatch[1], 10);
        if (p > maxPage) maxPage = p;
    }
    if (maxPage > 1) {
        totalPages = maxPage;
    } else if (html.indexOf('class="pagination"') > -1 || html.indexOf('?page=2') > -1) {
        totalPages = 20; // Giá trị dự phòng nếu có phân trang nhưng không bắt được số trang cuối
    }

    return JSON.stringify({
        items: items,
        pagination: {
            currentPage: 1,
            totalPages: totalPages
        }
    });
}

function parseSearchResponse(html, apiUrl) {
    return parseListResponse(html, apiUrl);
}

function parseMovieDetail(html, apiUrl) {
    var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var descMatch = html.match(/<div class="film-description m-hide">\s*<div class="text">([\s\S]*?)<\/div>/);
    
    var title = titleMatch ? titleMatch[1].replace("Xem phim ", "").trim() : "Không xác định";
    var posterUrl = posterMatch ? posterMatch[1] : "";
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    var servers = [];
    
    function parseEpisodes(htmlBlock) {
        var eps = [];
        var epRegex = /<a[^>]*class="[^"]*ssl-item ep-item[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;
        var m;
        while ((m = epRegex.exec(htmlBlock)) !== null) {
            var epUrl = m[1];
            var epTitle = m[2].trim();
            if (epUrl.indexOf("http") !== 0) {
                epUrl = "https://yanhh3d.love" + (epUrl.charAt(0) === "/" ? "" : "/") + epUrl;
            }
            var uniqueSlug = epUrl.replace("https://yanhh3d.love/", "").replace(/\//g, "-");
            
            eps.push({
                id: epUrl,
                name: epTitle,
                slug: uniqueSlug 
            });
        }
        return eps.reverse(); 
    }

    // Quét tab Thuyết Minh (#top-comment)
    var tmBlock = html.match(/<div id="top-comment"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if (tmBlock) {
        var tmEps = parseEpisodes(tmBlock[0]);
        if (tmEps.length > 0) {
            servers.push({ name: "Thuyết Minh", episodes: tmEps });
        }
    }

    // Quét tab Vietsub (#new-comment)
    var vsBlock = html.match(/<div id="new-comment"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if (vsBlock) {
        var vsEps = parseEpisodes(vsBlock[0]);
        if (vsEps.length > 0) {
            servers.push({ name: "Vietsub", episodes: vsEps });
        }
    }

    if (servers.length === 0) {
        servers.push({ name: "Mặc Định", episodes: parseEpisodes(html) });
    }

    return JSON.stringify({
        id: apiUrl,
        title: title,
        posterUrl: posterUrl,
        description: description,
        servers: servers
    });
}

function parseDetailResponse(html, apiUrl) {
    var links = [];
    var regex = /data-src="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    var match;

    while ((match = regex.exec(html)) !== null) {
        links.push({
            url: match[1],
            label: match[2].trim()
        });
    }

    if (links.length === 0) {
        return JSON.stringify({ url: "", isEmbed: false });
    }

    var directLink = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i].url.indexOf('.m3u8') !== -1 || links[i].url.indexOf('.mp4') !== -1) {
            directLink = links[i].url;
            break;
        }
    }

    var finalUrl = directLink ? directLink : links[0].url;
    var isM3u8 = finalUrl.indexOf('.m3u8') !== -1;
    var isMp4 = finalUrl.indexOf('.mp4') !== -1;
    var isEmbed = !(isM3u8 || isMp4);

    var mimeType = "";
    if (isM3u8) mimeType = "application/x-mpegURL";
    else if (isMp4) mimeType = "video/mp4";

    return JSON.stringify({
        url: finalUrl,
        isEmbed: isEmbed,
        mimeType: mimeType,
        headers: {
            "Referer": "https://yanhh3d.love/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
    });
}

function parseEmbedResponse(html, apiUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
