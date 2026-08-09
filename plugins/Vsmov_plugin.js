// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: KẾT HỢP API GỐC (LẤY TẬP) + BÓC VỎ IFRAME (LẤY M3U8 & VIETSUB)
// =============================================================================

var DOMAIN = "https://vsmov.com";

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.8.1",
        "baseUrl": DOMAIN,
        "iconUrl": DOMAIN + "/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[VsMov] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[VsMov] " + msg);
    }
}

// =============================================================================
// TRANG CHỦ & TÌM KIẾM (GIỮ NGUYÊN)
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới cập nhật', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// QUẢN LÝ URL: CHUYỂN HƯỚNG LẤY CHI TIẾT SANG API
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        }
    } catch (e) {}

    if (!slug || slug === '/' || slug === 'home') slug = 'phim-moi';
    if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') slug = 'phim-moi';

    var danhSachSlugs = ['phim-moi', 'phim-bo', 'phim-le', 'dang-chieu', '4k', 'long-tieng', 'thuyet-minh'];
    var basePath = danhSachSlugs.indexOf(slug) !== -1 ? "danh-sach" : "the-loai"; 
    
    return DOMAIN + "/" + basePath + "/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    return DOMAIN + "/?search=" + encodeURIComponent(decodeURIComponent(keyword)) + "&page=1";
}

// BÍ QUYẾT: Yêu cầu VAX App gọi thẳng vào link API thay vì link Web bình thường
function getUrlDetail(slug) {
    if (!slug) return "";
    var id = slug;
    // Tách lấy slug phim chuẩn từ URL
    if (slug.indexOf('/phim/') !== -1) id = slug.split('/phim/')[1].split('?')[0];
    else if (slug.indexOf('http') === 0) id = slug.split('/').pop().split('?')[0];
    
    // Trả về link API chứa JSON siêu sạch
    return DOMAIN + "/api/phim/" + id;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS 
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        var match;
        
        while ((match = rowRegex.exec(html)) !== null) {
            var row = match[1];
            if (row.indexOf('<th') !== -1) continue;

            var slugMatch = row.match(/href="[^"]*\/phim\/([^"]+)"/i);
            if (!slugMatch) continue;
            var fullLink = DOMAIN + "/phim/" + slugMatch[1];

            var titleMatch = row.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var posterMatch = row.match(/data-original="([^"]+)"/i) || row.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";
            if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = DOMAIN + posterUrl;

            var statusMatch = row.match(/class="flex-1 text-inherit font-normal px-1">([\s\S]*?)<\/span>/i);

            items.push({
                id: fullLink,
                title: title,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                episode_current: statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : ""
            });
        }
        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// SỬ DỤNG JSON API TỪ VSMOV ĐỂ LOAD TẬP PHIM CHUẨN XÁC TỐC ĐỘ CAO
function parseMovieDetail(jsonString, url) {
    try {
        // Parse trực tiếp mã JSON API bạn cung cấp
        var data = JSON.parse(jsonString);
        var movie = data.movie || {};
        var epsList = data.episodes || [];

        var title = movie.name || "";
        var posterUrl = movie.poster_url || movie.thumb_url || "";
        var desc = movie.content || "";
        var servers = [];

        for (var i = 0; i < epsList.length; i++) {
            var serverObj = epsList[i];
            var sName = serverObj.server_name || "Vietsub";
            var sData = serverObj.server_data || []; // API dùng key "server_data"
            var serverEps = [];

            for (var j = 0; j < sData.length; j++) {
                var ep = sData[j];
                var mediaLink = ep.link_embed || ep.embed || "";
                if (mediaLink) {
                    serverEps.push({
                        id: mediaLink, // URL Iframe (vd: https://v1.streamvsmov.com/video/...)
                        name: "Tập " + (ep.name || (j + 1)),
                        slug: ep.slug || ""
                    });
                }
            }

            if (serverEps.length > 0) {
                servers.push({
                    name: sName.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
                    episodes: serverEps
                });
            }
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: desc,
            servers: servers 
        });
    } catch (error) {
        return JSON.stringify({ id: url, title: "Lỗi Tải Phim", servers: [] });
    }
}

// BƯỚC 1: TRUYỀN LINK IFRAME CHO HỆ THỐNG ĐỂ TẢI NGẦM TRANG WEB HTML
function parseDetailResponse(html, url) {
    return JSON.stringify({
        url: url,
        isEmbed: true, 
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": DOMAIN + "/"
        }
    });
}

// BƯỚC 2: QUÉT SẠCH SÀNH SANH IFRAME LẤY VIDEO VÀ PHỤ ĐỀ -> BẮN QUA NATIVE
function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    try {
        // 1. CẠO SẠCH PHỤ ĐỀ (Tất cả định dạng VTT, SRT)
        // Tìm trực tiếp trong thẻ <track> hoặc chuỗi cấu hình tracks của JS
        var subRegex = /["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var subMatch;
        while ((subMatch = subRegex.exec(html)) !== null) {
            var subUrl = subMatch[1].replace(/\\/g, '');
            var isDup = false;
            for (var i = 0; i < subtitles.length; i++) { if (subtitles[i].url === subUrl) isDup = true; }
            if (!isDup) subtitles.push({ url: subUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        // Tìm các file phụ đề dạng link tương đối (vd: "/subtitle/ep1.vtt")
        var domain = url.match(/^(https?:\/\/[^\/]+)/i) ? url.match(/^(https?:\/\/[^\/]+)/i)[1] : "";
        var relSubRegex = /["'](\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var rMatch;
        while ((rMatch = relSubRegex.exec(html)) !== null) {
            if (domain) {
                var sUrl2 = domain + rMatch[1].replace(/\\/g, '');
                var isDup2 = false;
                for (var j = 0; j < subtitles.length; j++) { if (subtitles[j].url === sUrl2) isDup2 = true; }
                if (!isDup2) subtitles.push({ url: sUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

        // 2. CẠO VIDEO LUỒNG M3U8
        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        // 3. XUẤT XƯỞNG
        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, 
                subtitles: subtitles, // Cung cấp cho Native Player
                headers: {
                    "Referer": url, 
                    "Origin": domain
                }
            });
        }

        // DỰ PHÒNG CHỐNG CHÁY NẾU MÃ HÓA
        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            subtitles: subtitles, // Giữ mạng sống cho Phụ Đề
            script: "setTimeout(function(){document.body.click();var b=document.querySelector('.jw-video,.vjs-big-play-button,.plyr__control--overlaid,#player');if(b)b.click();var v=document.querySelector('video');if(v){v.muted=true;v.play();}},1500);"
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}
