// ===================================================================
// PLUGIN YANHH3D CHO VAAPP (FINAL VERSION)
// Tối ưu: Bắt thẳng m3u8 không độ trễ, tự dò tab Server, Fix nhảy tập
// ===================================================================

function getManifest() {
    return JSON.stringify({
        id: "yanhh3d_love",
        name: "YanHH3D",
        version: "2.0.1",
        description: "Hoạt Hình Trung Quốc Thuyết Minh 3D",
        author: "Gemini",
        baseUrl: "https://yanhh3d.love",
        type: "MOVIE",
        playerType: "exoplayer",
        adblock: true,
        debug: false
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: "moi-cap-nhat", name: "Mới Cập Nhật" },
        { slug: "hoat-hinh-3d", name: "Hoạt Hình 3D" },
        { slug: "hoat-hinh-2d", name: "Hoạt Hình 2D" },
        { slug: "hoat-hinh-4k", name: "Hoạt Hình 4K" },
        { slug: "hoat-hinh-ai", name: "Hoạt Hình AI" },
        { slug: "hoan-thanh", name: "Đã Hoàn Thành" },
        { slug: "dang-chieu", name: "Đang Chiếu" },
        { slug: "phim-le", name: "Phim Lẻ | Ova" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
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
// CÁC HÀM TẠO URL
// ===================================================================

function getUrlList(slug, filtersJson) {
    var filters = {};
    if (filtersJson) {
        try { filters = JSON.parse(filtersJson); } catch (e) {}
    }
    var page = filters.page ? filters.page : 1;
    var url = "https://yanhh3d.love/" + slug;
    if (page > 1) {
        url += "?page=" + page;
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
    return slug; // Vì chúng ta đã lưu full URL vào id tập phim nên chỉ cần return ra
}

// ===================================================================
// CÁC HÀM PARSE DỮ LIỆU HTML
// ===================================================================

function parseListResponse(html, apiUrl) {
    var items = [];
    
    // Cắt từng khối chứa 1 bộ phim riêng biệt
    var blockRegex = /<div class="flw-item">([\s\S]*?)<div class="clearfix"><\/div><\/div>/g;
    var matchBlock;
    
    while ((matchBlock = blockRegex.exec(html)) !== null) {
        var itemHtml = matchBlock[1];
        
        var urlMatch = itemHtml.match(/href="([^"]+)"/);
        var titleMatch = itemHtml.match(/title="([^"]+)"/);
        var posterMatch = itemHtml.match(/data-src="([^"]+)"/);
        var epMatch = itemHtml.match(/<div class="tick tick-rate">([^<]+)<\/div>/);

        if (urlMatch && titleMatch) {
            items.push({
                id: urlMatch[1], 
                title: titleMatch[1].trim(),
                posterUrl: posterMatch ? posterMatch[1] : "",
                episode_current: epMatch ? epMatch[1].trim() : ""
            });
        }
    }

    // Xử lý phân trang (Pagination)
    var totalPages = 1;
    var pageMatch = html.match(/href="[^"]+page=(\d+)"[^>]*>>/);
    if (pageMatch) {
        totalPages = parseInt(pageMatch[1]);
    } else if (html.indexOf('class="pagination"') > -1 || html.indexOf('Xem thêm') > -1) {
        totalPages = 2; 
    }

    return JSON.stringify({
        items: items,
        pagination: {
            totalPages: totalPages
        }
    });
}

function parseSearchResponse(html, apiUrl) {
    return parseListResponse(html, apiUrl);
}

function parseMovieDetail(html, apiUrl) {
    // 1. Lấy thông tin phim
    var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var descMatch = html.match(/<div class="film-description m-hide">\s*<div class="text">([\s\S]*?)<\/div>/);
    
    var title = titleMatch ? titleMatch[1].replace("Xem phim ", "").trim() : "Không xác định";
    var posterUrl = posterMatch ? posterMatch[1] : "";
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    // 2. Hàm nội bộ quét tập
    function parseEpisodes(htmlBlock) {
        var eps = [];
        var epRegex = /<a[^>]*class="[^"]*ssl-item ep-item[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;
        var m;
        while ((m = epRegex.exec(htmlBlock)) !== null) {
            var epUrl = m[1];
            var epTitle = m[2].trim();
            // Slug DUY NHẤT để tránh nhảy tập
            var uniqueSlug = epUrl.replace("https://yanhh3d.love/", "").replace(/\//g, "-");
            
            eps.push({
                id: epUrl, 
                name: epTitle,
                slug: uniqueSlug 
            });
        }
        return eps.reverse(); 
    }

    var servers = [];

    // 3. Tự động lấy danh sách Tab Server (Thuyết Minh, Vietsub, v.v)
    var tabRegex = /<a[^>]*data-toggle="tab"[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/g;
    var tabs = [];
    var tabMatch;
    while ((tabMatch = tabRegex.exec(html)) !== null) {
        tabs.push({ 
            id: tabMatch[1], 
            name: tabMatch[2].trim() 
        });
    }

    // 4. Bóc tách tập theo từng Tab Server tìm được
    if (tabs.length > 0) {
        for (var i = 0; i < tabs.length; i++) {
            var startIdx = html.indexOf('id="' + tabs[i].id + '"');
            if (startIdx > -1) {
                var endIdx = html.length;
                if (i < tabs.length - 1) {
                    var nextIdx = html.indexOf('id="' + tabs[i+1].id + '"', startIdx);
                    if (nextIdx > -1) endIdx = nextIdx;
                }
                
                var blockHtml = html.substring(startIdx, endIdx);
                var eps = parseEpisodes(blockHtml);
                
                if (eps.length > 0) {
                    servers.push({ name: tabs[i].name, episodes: eps });
                }
            }
        }
    } else {
        // Fallback khi không có tab server
        var eps = parseEpisodes(html);
        if (eps.length > 0) {
            servers.push({ name: "Mặc Định", episodes: eps });
        }
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

    // Quét link m3u8 có sẵn trong HTML (bỏ qua Sniffer rườm rà)
    while ((match = regex.exec(html)) !== null) {
        links.push({
            url: match[1],
            label: match[2].trim()
        });
    }

    if (links.length === 0) {
        return JSON.stringify({ url: "", isEmbed: false });
    }

    // Ưu tiên phát trực tiếp m3u8 / mp4
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    });
}

function parseEmbedResponse(html, apiUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
