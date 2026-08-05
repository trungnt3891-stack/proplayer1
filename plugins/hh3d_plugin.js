function getManifest() {
    return JSON.stringify({
        id: "yanhh3d_love",
        name: "YanHH3D",
        version: "2.0.0",
        description: "Hoạt Hình Trung Quốc Thuyết Minh 3D",
        author: "Gemini",
        baseUrl: "https://yanhh3d.love",
        type: "MOVIE",
        playerType: "exoplayer", // Khuyến nghị dùng exoplayer vì web có link m3u8 trực tiếp
        adblock: true,
        debug: false
    });
}

// ===================================================================
// 1. CÁC HÀM TẠO URL
// ===================================================================

function getUrlList(slug, filtersJson) {
    // Xử lý phân trang cho danh mục
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
    // Vì trong hàm parseMovieDetail chúng ta truyền id tập phim là URL đầy đủ
    // Nên hàm này chỉ cần return chính slug đó
    return slug; 
}

// ===================================================================
// 2. CÁC HÀM XỬ LÝ DỮ LIỆU (PARSER)
// ===================================================================

function parseListResponse(html, apiUrl) {
    var items = [];
    // Quét các thẻ chứa phim ngoài trang chủ hoặc trang danh mục
    var regex = /<div class="flw-item">[\s\S]*?href="([^"]+)"[^>]*title="([^"]+)"[\s\S]*?data-src="([^"]+)"[\s\S]*?<div class="tick tick-rate">([^<]+)<\/div>/g;
    var match;
    
    while ((match = regex.exec(html)) !== null) {
        var url = match[1];
        items.push({
            id: url, // Truyền luôn URL làm ID để tiện parse chi tiết
            title: match[2].trim(),
            posterUrl: match[3],
            episode_current: match[4].trim()
        });
    }

    // Xử lý phân trang (nếu có)
    var totalPages = 1;
    var pageMatch = html.match(/href="[^"]+page=(\d+)"[^>]*>>/); // Tìm nút Last/Trang cuối
    if (pageMatch) {
        totalPages = parseInt(pageMatch[1]);
    } else if (html.indexOf('class="pagination"') > -1) {
        totalPages = 2; // Giả lập nếu có pagination nhưng ko bắt được nút cuối
    }

    return JSON.stringify({
        items: items,
        pagination: {
            totalPages: totalPages
        }
    });
}

function parseSearchResponse(html, apiUrl) {
    // Cấu trúc search tương tự list
    return parseListResponse(html, apiUrl);
}

function parseMovieDetail(html, apiUrl) {
    // 1. Lấy thông tin cơ bản của phim (Dùng thẻ meta OpenGraph cho chính xác)
    var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var descMatch = html.match(/<div class="film-description m-hide">\s*<div class="text">([\s\S]*?)<\/div>/);
    
    var title = titleMatch ? titleMatch[1].replace("Xem phim ", "").trim() : "Không xác định";
    var posterUrl = posterMatch ? posterMatch[1] : "";
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    // 2. Lấy danh sách tập phim & Tách Server Thuyết Minh / Vietsub
    var servers = [];
    
    // Hàm nội bộ quét tập phim trong 1 block HTML
    function parseEpisodes(htmlBlock) {
        var eps = [];
        var epRegex = /<a[^>]*class="[^"]*ssl-item ep-item[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;
        var m;
        while ((m = epRegex.exec(htmlBlock)) !== null) {
            var epUrl = m[1];
            var epTitle = m[2].trim();
            // LỖI SAI TẬP NẰM Ở ĐÂY: Tạo slug DUY NHẤT bằng cách lấy đoạn cuối của URL
            var uniqueSlug = epUrl.replace("https://yanhh3d.love/", "").replace(/\//g, "-");
            
            eps.push({
                id: epUrl, // Truyền full URL để getUrlDetail bắt được
                name: epTitle,
                slug: uniqueSlug 
            });
        }
        // Trang yanhh3d xếp tập mới nhất lên đầu (185 -> 1). App cần tập cũ xếp trước (1 -> 185)
        return eps.reverse(); 
    }

    // Tách block Thuyết Minh (id="top-comment")
    var tmBlock = html.match(/<div id="top-comment"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if (tmBlock) {
        var tmEps = parseEpisodes(tmBlock[0]);
        if (tmEps.length > 0) {
            servers.push({ name: "Thuyết Minh", episodes: tmEps });
        }
    }

    // Tách block Vietsub (id="new-comment")
    var vsBlock = html.match(/<div id="new-comment"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if (vsBlock) {
        var vsEps = parseEpisodes(vsBlock[0]);
        if (vsEps.length > 0) {
            servers.push({ name: "Vietsub", episodes: vsEps });
        }
    }

    // Nếu không tìm thấy tab, thử quét toàn bộ
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
    // TỐI ƯU TỐC ĐỘ: Lấy thẳng link m3u8 từ thuộc tính data-src của nút chọn Server
    // Bỏ qua WebView Sniffer gây chậm luồng
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

    // Ưu tiên tìm link m3u8 hoặc mp4 để phát trực tiếp (Native ExoPlayer)
    var directLink = null;
    for (var i = 0; i < links.length; i++) {
        if (links[i].url.indexOf('.m3u8') !== -1 || links[i].url.indexOf('.mp4') !== -1) {
            directLink = links[i].url;
            break;
        }
    }

    // Nếu có m3u8 -> Phát ngay lập tức, tắt Embed. Nếu chỉ có iframe -> Bật Embed
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

// Nếu trang web có sử dụng iframe chuyển hướng phức tạp, hàm này mới được gọi (Khi isEmbed = true)
function parseEmbedResponse(html, apiUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}
