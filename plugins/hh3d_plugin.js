function getManifest() {
    return JSON.stringify({
        id: "yanhh3d_love",
        name: "YanHH3D",
        version: "2.0.7",
        description: "Hoạt Hình Trung Quốc Thuyết Minh 3D",
        author: "Gemini",
        baseUrl: "https://yanhh3d.love",
        type: "MOVIE",
        playerType: "auto", // Tự động giao m3u8/mp4 cho ExoPlayer, đẩy iframe cho WebView
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

function getUrlList(slug, filtersJson) {
    var filters = {};
    if (filtersJson) {
        try { filters = JSON.parse(filtersJson); } catch (e) {}
    }
    var page = filters.page ? filters.page : 1;
    var url = "https://yanhh3d.love/" + slug;
    if (page > 1) url += "?page=" + page;
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = {};
    if (filtersJson) {
        try { filters = JSON.parse(filtersJson); } catch (e) {}
    }
    var page = filters.page ? filters.page : 1;
    var url = "https://yanhh3d.love/search?keysearch=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    return slug; 
}

// ===================================================================
// HÀM LẤY DANH SÁCH BẰNG PHƯƠNG PHÁP DOM SPLIT (KHÔNG THỂ TRƯỢT)
// ===================================================================
function parseListResponse(html, apiUrl) {
    var items = [];
    
    // Cắt vụn HTML ra thành nhiều phần, mỗi phần là 1 bộ phim
    var splits = html.split('film-poster');
    for (var i = 1; i < splits.length; i++) {
        var block = splits[i].substring(0, 800); 
        
        var urlMatch = block.match(/href="([^"]+)"/i);
        var titleMatch = block.match(/title="([^"]+)"/i) || block.match(/alt="([^"]+)"/i);
        var posterMatch = block.match(/data-src="([^"]+)"/i) || block.match(/src="([^"]+)"/i);
        var epMatch = block.match(/(?:tick-rate|fdi-item)[^>]*>([^<]+)</i);

        if (urlMatch && titleMatch && posterMatch) {
            var url = urlMatch[1];
            if (url.indexOf("http") === -1) url = "https://yanhh3d.love" + url;
            
            // Lọc bỏ danh sách thừa (nếu có thẻ a dính link the-loai)
            if (url.indexOf('/the-loai/') !== -1) continue;

            var exists = false;
            for(var j = 0; j < items.length; j++) {
                if(items[j].id === url) { exists = true; break; }
            }
            
            if(!exists) {
                items.push({
                    id: url, 
                    title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
                    posterUrl: posterMatch[1].trim(),
                    episode_current: epMatch ? epMatch[1].trim() : ""
                });
            }
        }
    }

    // Xử lý Pagination tự động (Tìm số trang lớn nhất)
    var totalPages = 1;
    var pageMatch = html.match(/href="[^"]+page=(\d+)"/g);
    if (pageMatch) {
        for (var i = 0; i < pageMatch.length; i++) {
            var num = parseInt(pageMatch[i].match(/page=(\d+)/)[1]);
            if (num > totalPages) totalPages = num;
        }
    } else if (html.indexOf('class="pagination"') > -1 || html.indexOf('Xem thêm') > -1) {
        totalPages = 2; 
    }

    return JSON.stringify({
        items: items,
        pagination: { totalPages: totalPages }
    });
}

function parseSearchResponse(html, apiUrl) {
    return parseListResponse(html, apiUrl);
}

// ===================================================================
// HÀM BÓC TÁCH CHI TIẾT TẬP VÀ SẮP XẾP BẰNG SỐ CHUẨN XÁC
// ===================================================================
function parseMovieDetail(html, apiUrl) {
    var title = "Không xác định";
    var posterUrl = "";
    
    var titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (titleMatch) title = titleMatch[1].replace("Xem phim ", "").split(/( Tập | Phần )/i)[0].trim();
    
    var posterMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (posterMatch) posterUrl = posterMatch[1];
    
    var descMatch = html.match(/film-description[^>]*>([\s\S]*?)<\/div>/i);
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    var servers = [];
    
    // Quét Tab Server
    var navTabsMatch = html.match(/<ul[^>]*nav-tabs[^>]*>([\s\S]*?)<\/ul>/i);
    var tabs = [];
    if (navTabsMatch) {
        var aTagRegex = /<a[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        var aMatch;
        while ((aMatch = aTagRegex.exec(navTabsMatch[1])) !== null) {
            tabs.push({ id: aMatch[1].trim(), name: aMatch[2].replace(/<[^>]+>/g, '').trim() });
        }
    }

    function getEps(blockHtml) {
        var eps = [];
        // Cắt DOM list tập phim bằng từ khóa ep-item
        var splits = blockHtml.split('ep-item');
        for (var i = 1; i < splits.length; i++) {
            var block = splits[i].substring(0, 500); 
            var urlMatch = block.match(/href="([^"]+)"/i);
            var orderMatch = block.match(/ssli-order[^>]*>([^<]+)/i);
            
            if (urlMatch) {
                var epUrl = urlMatch[1];
                if (epUrl.indexOf("http") === -1) epUrl = "https://yanhh3d.love" + epUrl;
                
                var epName = orderMatch ? orderMatch[1].trim() : epUrl.split('/').pop().replace('tap-', '');
                var uniqueSlug = epUrl.replace(/^https?:\/\/[^\/]+\//i, "").replace(/\//g, "-");
                
                var exists = false;
                for (var j = 0; j < eps.length; j++) {
                    if (eps[j].id === epUrl) { exists = true; break; }
                }
                if (!exists) eps.push({ id: epUrl, name: epName, slug: uniqueSlug });
            }
        }
        
        // Sắp xếp lại thứ tự từ bé đến lớn theo con số (Chấp luôn các tập có chữ)
        eps.sort(function(a, b) {
            var numA = parseInt((a.name.match(/\d+/) || ["0"])[0]);
            var numB = parseInt((b.name.match(/\d+/) || ["0"])[0]);
            if (numA === numB) return a.name.length - b.name.length;
            return numA - numB;
        });
        return eps;
    }

    if (tabs.length > 0) {
        for (var i = 0; i < tabs.length; i++) {
            var startStr = 'id="' + tabs[i].id + '"';
            var startIdx = html.indexOf(startStr);
            if (startIdx !== -1) {
                var endIdx = html.length;
                if (i + 1 < tabs.length) {
                    var nextStartStr = 'id="' + tabs[i+1].id + '"';
                    var nextStartIdx = html.indexOf(nextStartStr, startIdx);
                    if (nextStartIdx !== -1) endIdx = nextStartIdx;
                }
                var blockHtml = html.substring(startIdx, endIdx);
                var eps = getEps(blockHtml);
                if (eps.length > 0) servers.push({ name: tabs[i].name, episodes: eps });
            }
        }
    } 

    if (servers.length === 0) {
        var eps = getEps(html);
        if (eps.length > 0) servers.push({ name: "Mặc Định", episodes: eps });
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
    var splits = html.split('btn3dsv');
    
    for (var i = 1; i < splits.length; i++) {
        var block = splits[i].substring(0, 300);
        var srcMatch = block.match(/data-src="([^"]+)"/i);
        var labelMatch = block.match(/>([^<]+)<\/a>/i);
        if (srcMatch && labelMatch) {
            links.push({ url: srcMatch[1], label: labelMatch[1].trim() });
        }
    }

    if (links.length === 0) {
        var iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
        if (iframeMatch) {
            links.push({ url: iframeMatch[1], label: "Iframe" });
        }
    }

    if (links.length === 0) {
        return JSON.stringify({ url: "", isEmbed: false });
    }

    var finalUrl = links[0].url;
    for (var i = 0; i < links.length; i++) {
        if (links[i].url.indexOf('.m3u8') !== -1 || links[i].url.indexOf('.mp4') !== -1) {
            finalUrl = links[i].url;
            break;
        }
    }

    var isEmbed = false;
    var mimeType = "";

    if (finalUrl.indexOf('.m3u8') !== -1) {
        mimeType = "application/x-mpegURL";
    } else if (finalUrl.indexOf('.mp4') !== -1) {
        mimeType = "video/mp4";
    } else {
        isEmbed = true; 
    }

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
