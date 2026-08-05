function getManifest() {
    return JSON.stringify({
        id: "yanhh3d_love",
        name: "YanHH3D",
        version: "2.0.6",
        description: "Hoạt Hình Trung Quốc Thuyết Minh 3D",
        author: "Gemini",
        baseUrl: "https://yanhh3d.love",
        type: "MOVIE",
        playerType: "auto", 
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

function parseListResponse(html, apiUrl) {
    var items = [];
    var blockRegex = /<div\s+class="[^"]*flw-item[^"]*">([\s\S]*?)<div\s+class="clearfix"><\/div><\/div>/gi;
    var matchBlock;
    
    while ((matchBlock = blockRegex.exec(html)) !== null) {
        var itemHtml = matchBlock[1];
        
        var urlMatch = itemHtml.match(/href="([^"]+)"/i);
        var titleMatch = itemHtml.match(/title="([^"]+)"/i);
        var posterMatch = itemHtml.match(/data-src="([^"]+)"/i);
        var epMatch = itemHtml.match(/tick-rate[^>]*>([^<]+)<\/div>/i);

        if (urlMatch && titleMatch) {
            var url = urlMatch[1];
            if (url.indexOf("http") === -1) url = "https://yanhh3d.love" + url;
            
            var exists = false;
            for(var j = 0; j < items.length; j++) {
                if(items[j].id === url) { exists = true; break; }
            }
            if(!exists) {
                items.push({
                    id: url, 
                    title: titleMatch[1].trim(),
                    posterUrl: posterMatch ? posterMatch[1] : "",
                    episode_current: epMatch ? epMatch[1].trim() : ""
                });
            }
        }
    }

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

function parseMovieDetail(html, apiUrl) {
    var title = "Không xác định";
    var posterUrl = "";
    
    // Tách tiêu đề sạch đẹp
    var titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (titleMatch) title = titleMatch[1].replace("Xem phim ", "").split(/ Tập /i)[0].trim();
    
    var posterMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (posterMatch) posterUrl = posterMatch[1];
    
    var descMatch = html.match(/class="[^"]*film-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    var servers = [];
    
    // 1. Tự động bóc tách tên các Tab Server (Thuyết Minh / Vietsub)
    var navTabsMatch = html.match(/<ul[^>]*nav-tabs[^>]*>([\s\S]*?)<\/ul>/i);
    var tabs = [];
    if (navTabsMatch) {
        var aTagRegex = /<a[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        var aMatch;
        while ((aMatch = aTagRegex.exec(navTabsMatch[1])) !== null) {
            tabs.push({
                id: aMatch[1].trim(), 
                name: aMatch[2].replace(/<[^>]+>/g, '').trim()
            });
        }
    }

    // 2. Hàm gom tập phim BẤT CHẤP CLASS BỊ SAI LỆCH 
    function getEps(blockHtml) {
        var eps = [];
        // Tóm mọi thẻ a có /tap- trong link (Chuẩn xác 100% không bao giờ trượt)
        var epRegex = /<a[^>]*href="([^"]+\/tap-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = epRegex.exec(blockHtml)) !== null) {
            var url = match[1];
            if (url.indexOf("http") === -1) url = "https://yanhh3d.love" + url;
            
            var inner = match[2];
            var orderMatch = inner.match(/ssli-order[^>]*>([^<]+)/i);
            var titleMatch = match[0].match(/title="([^"]+)"/i);
            
            var name = "N/A";
            if (orderMatch) name = orderMatch[1].trim();
            else if (titleMatch) name = titleMatch[1].trim();
            else name = url.split('/').pop().replace('tap-', '');
            
            var slug = url.replace(/^https?:\/\/[^\/]+\//i, "").replace(/\//g, "-");
            
            var exists = false;
            for (var i = 0; i < eps.length; i++) {
                if (eps[i].id === url) { exists = true; break; }
            }
            if (!exists) eps.push({ id: url, name: name, slug: slug });
        }
        
        // Cân bằng lại thứ tự tập (Sắp xếp từ nhỏ đến lớn 1 -> 185)
        eps.sort(function(a, b) {
            var numA = parseInt((a.name.match(/\d+/) || ["0"])[0]);
            var numB = parseInt((b.name.match(/\d+/) || ["0"])[0]);
            if (numA === numB) return a.name.length - b.name.length;
            return numA - numB;
        });
        return eps;
    }

    // 3. Tiến hành mổ xẻ nội dung theo Tab
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

    // Nếu web không có tab nào, hốt trọn trang vào list Mặc định
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
    var aTagRegex = /<a[^>]*data-src="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    var aMatch;
    
    // Rút gọn link M3U8 siêu tốc
    while ((aMatch = aTagRegex.exec(html)) !== null) {
        links.push({ url: aMatch[1], label: aMatch[2].trim() });
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
