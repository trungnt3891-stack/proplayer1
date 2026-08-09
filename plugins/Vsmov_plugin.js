// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: KẸP THAM SỐ VÀO API ĐỂ LẤY TOKEN TƯƠI & BẢO TOÀN LỊCH SỬ
// =============================================================================

var DOMAIN = "https://vsmov.com";

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.8.5",
        "baseUrl": DOMAIN,
        "iconUrl": DOMAIN + "/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embed" // Ép buộc giao diện mở Webview Player
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
// TRANG CHỦ & TÌM KIẾM
// =============================================================================

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'dang-chieu', title: 'Phim Đang Chiếu', type: 'Horizontal', path: 'danh-sach' },
        { slug: '4k', title: 'Phim 4K', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới cập nhật', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim lồng tiếng', slug: 'long-tieng' },
        { name: 'Phim thuyết minh', slug: 'thuyet-minh' },
        { name: 'Phim đang chiếu', slug: 'dang-chieu' },
        { name: 'Phim 4K', slug: '4k' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Năm phát hành', value: 'year' }
        ]
    });
}

// =============================================================================
// QUẢN LÝ URL
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (slug && slug.indexOf("http") === 0) return slug;
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
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            page = JSON.parse(fixedJson).page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {}
    
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return DOMAIN + "/?search=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    var id = slug;
    if (slug.indexOf('/phim/') !== -1) id = slug.split('/phim/')[1].split('?')[0];
    else if (slug.indexOf('http') === 0) id = slug.split('/').pop().split('?')[0];
    
    // Gọi thẳng vào API siêu mượt của VSMOV
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

            var originMatch = row.match(/class="text-sub-text[^"]*">([\s\S]*?)<\/div>/i);
            var originalTitle = originMatch ? originMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var statusMatch = row.match(/class="flex-1 text-inherit font-normal px-1">([\s\S]*?)<\/span>/i);
            var status = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            items.push({
                id: fullLink,
                title: title,
                originalTitle: originalTitle,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                episode_current: status,
                quality: row.indexOf('4K') !== -1 ? '4K' : (row.indexOf('HD') !== -1 ? 'HD' : '')
            });
        }
        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// SỬ DỤNG JSON API VÀ ĐẶT MỎ NEO BẰNG URL API ĐỂ CHỐNG LỖI TOKEN
function parseMovieDetail(jsonString, url) {
    try {
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
            var sData = serverObj.server_data || serverObj.list || []; 
            var serverEps = [];

            for (var j = 0; j < sData.length; j++) {
                var ep = sData[j];
                var mediaLink = ep.link_embed || ep.embed || ep.link || "";
                var staticSlug = ep.slug || ("tap-" + (j + 1)); 

                if (mediaLink) {
                    serverEps.push({
                        // BÍ QUYẾT: ID là link API gốc kẹp thêm tham số ?ep=slug 
                        // -> Lịch sử xem giữ nguyên dạng tĩnh, mà khi click App vẫn request API
                        id: url + "?ep=" + staticSlug, 
                        name: "Tập " + (ep.name || (j + 1)),
                        slug: staticSlug
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

// BÓC TÁCH LINK TƯƠI MỚI TỪ JSON API ĐỂ MỞ WEBVIEW
function parseDetailResponse(html, url) {
    try {
        var targetUrl = "";
        
        // Tách lấy slug của tập phim từ đường link (vd: ?ep=tap-1 -> "tap-1")
        var epSlugMatch = url.match(/\?ep=([^&]+)/);
        var epSlug = epSlugMatch ? epSlugMatch[1] : "";

        // Mã HTML nhận được lúc này là nguyên một bộ JSON API cực kì đầy đủ
        if (epSlug && html.trim().indexOf('{') === 0) {
            var data = JSON.parse(html);
            var epsList = data.episodes || [];
            
            for (var i = 0; i < epsList.length; i++) {
                var sData = epsList[i].server_data || epsList[i].list || [];
                for (var j = 0; j < sData.length; j++) {
                    var ep = sData[j];
                    var currentSlug = ep.slug || ("tap-" + (j + 1));
                    
                    // Nếu dò thấy đúng tập đang bấm, húp ngay link Embed mới tinh
                    if (currentSlug === epSlug) {
                        targetUrl = ep.link_embed || ep.embed || ep.link || "";
                        break;
                    }
                }
                if (targetUrl) break;
            }
        } else {
            // Backup nếu không tìm thấy
            targetUrl = url; 
        }

        // Đóng gói Webview siêu sạch
        if (targetUrl && targetUrl.indexOf("http") !== 0) {
            targetUrl = "https://vsmov.com" + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
        }

        var customJs = "document.body.style.margin='0'; document.body.style.padding='0'; document.body.style.overflow='hidden'; document.body.style.backgroundColor='#000';";
        customJs += "var v=document.querySelector('video, iframe, #player, .jwplayer'); if(v){ v.style.width='100vw'; v.style.height='100vh'; v.style.position='fixed'; v.style.top='0'; v.style.left='0'; v.style.zIndex='999999'; }";

        return JSON.stringify({
            url: targetUrl, 
            isEmbed: true, 
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": DOMAIN + "/",
                "Custom-Js": customJs
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
