// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM (ADVANCED HTML SCRAPER)
// AUTHOR: JAVASCRIPT EXPERT
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.0.5",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal' },
        { slug: 'game-show', title: 'TV Shows', type: 'Horizontal' },
        { slug: '4k', title: 'Phim 4K Mới', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'TV Shows', slug: 'game-show' },
        { name: 'Chiếu Rạp', slug: 'phim-chieu-rap' }
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
// URL GENERATION (ĐỊNH TUYẾN THÔNG MINH DANH SÁCH & THỂ LOẠI)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        }
    } catch (e) {}

    // Xử lý chuẩn hóa tên miền & slug
    if (slug === 'phim-moi-cap-nhat' || slug === 'phim-moi-cap-nhat-v3') slug = 'phim-moi';

    // ĐỊNH TUYẾN: Phân biệt rõ đâu là Thể loại, đâu là Danh sách dựa trên cấu trúc vsmov
    var danhSachSlugs = ['phim-moi', 'phim-bo', 'phim-le', 'dang-chieu', '4k', 'long-tieng', 'thuyet-minh', 'subteam'];
    var basePath = "the-loai"; // Mặc định Hoạt hình, TV Shows (game-show), Hành động... là thể loại
    
    if (danhSachSlugs.indexOf(slug) !== -1) {
        basePath = "danh-sach";
    }

    return "https://vsmov.com/" + basePath + "/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    try {
        if (typeof filtersJson === 'string' && filtersJson !== "") {
            page = JSON.parse(filtersJson).page || 1;
        } else if (typeof filtersJson === 'number') {
            page = filtersJson;
        }
    } catch (e) {}
    
    // Web VSMOV dùng form submit trực tiếp ở trang chủ /?search=keyword
    var safeKeyword = encodeURIComponent(decodeURIComponent(keyword));
    return "https://vsmov.com/?search=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://vsmov.com/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// DATA PARSERS (REGEX BÓC TÁCH KHÔNG GÓC CHẾT)
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        // Vét sạch tất cả các Hàng <tr> chứa phim
        var rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        var match;
        
        while ((match = rowRegex.exec(html)) !== null) {
            var row = match[1];
            if (row.indexOf('<th') !== -1) continue;

            var slugMatch = row.match(/href="[^"]*\/phim\/([^"]+)"/i);
            if (!slugMatch) continue;
            var slug = slugMatch[1];

            var titleMatch = row.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var posterMatch = row.match(/data-original="([^"]+)"/i) || row.match(/<img[^>]+src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";
            if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = "https://vsmov.com" + posterUrl;

            var originMatch = row.match(/class="text-sub-text[^"]*">([\s\S]*?)<\/div>/i);
            var originalTitle = originMatch ? originMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var statusMatch = row.match(/class="flex-1 text-inherit font-normal px-1">([\s\S]*?)<\/span>/i);
            var status = statusMatch ? statusMatch[1].replace(/<[^>]+>/g, '').trim() : "";

            var yearMatch = row.match(/<span>(\d{4})<\/span>/i);
            var year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

            items.push({
                id: slug,
                title: title,
                originalTitle: originalTitle,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                episode_current: status,
                year: year,
                quality: row.indexOf('4K') !== -1 ? '4K' : (row.indexOf('HD') !== -1 ? 'HD' : '')
            });
        }

        var currentPage = 1;
        var totalPages = 1;
        var pageMatch = html.match(/Trang\s+(\d+)\/(\d+)/i);
        if (pageMatch) {
            currentPage = parseInt(pageMatch[1], 10);
            totalPages = parseInt(pageMatch[2], 10);
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BÓC TÁCH CHI TIẾT & SỐ TẬP PHIM HOÀN HẢO CỦA VSMOV
function parseMovieDetail(html, url) {
    try {
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        var title = titleMatch ? titleMatch[1].replace(/- VSMOV.*/i, '').trim() : "";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";
        if (posterUrl && posterUrl.indexOf("http") !== 0) posterUrl = "https://vsmov.com" + posterUrl;

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var desc = descMatch ? descMatch[1].trim() : "";

        // ========================================================
        // THUẬT TOÁN VÉT SẠCH TẬP PHIM TỪ GIAO DIỆN HTML VSMOV
        // ========================================================
        var episodes = [];
        var addedLinks = {}; // Chống trùng lặp tập
        
        // Quét tất cả các thẻ <a> trên trang web
        var aRegex = /<a[^>]+href="([^"]*?(?:\/phim\/|\/xem-phim\/|\/tap-phim\/|\/episode)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;

        while ((match = aRegex.exec(html)) !== null) {
            var href = match[1];
            var btnText = match[2].replace(/<[^>]+>/g, '').trim();

            // Link tập phim thường chứa chữ 'tap-', 'ep-', hoặc nút text chứa chữ 'Tập x', 'Số x'
            var isEpisode = href.match(/-(tap|ep|chuong)-/i) || 
                            href.match(/\/(tap|ep|chuong)-/i) || 
                            btnText.match(/^(Tập\s*\d+|\d+|Full|Trailer)$/i);

            // Bỏ qua các thẻ rác, javascript...
            if (isEpisode && href.indexOf('javascript') === -1 && href.indexOf('facebook.com') === -1) {
                var fullHref = href.indexOf('http') === 0 ? href : "https://vsmov.com" + href;
                
                if (!addedLinks[fullHref]) {
                    addedLinks[fullHref] = true;
                    episodes.push({
                        id: fullHref, // ID giữ nguyên link web tập đó
                        name: btnText || "Tập Phim",
                        slug: fullHref.split('/').pop()
                    });
                }
            }
        }

        // Nếu phim lẻ không có list tập phim, tạo 1 nút Xem Phim mặc định gọi thẳng vào link detail hiện tại
        if (episodes.length === 0) {
            episodes.push({
                id: url,
                name: "Phát Phim",
                slug: "full"
            });
        }

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: desc,
            servers: [{
                name: "VSMov (VIP)",
                episodes: episodes
            }]
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(html, url) {
    // NHÚNG JAVASCRIPT XÓA RÁC CHO WEBVIEW CHUẨN RẠP HÁT
    var customJs = "document.querySelectorAll('header, footer, nav, aside, .ads, .sidebar, iframe[sandbox]').forEach(function(e){e.style.display='none'});";
    // Ép Video giãn 100% màn hình
    customJs += "var v = document.querySelector('video, iframe'); if(v){ v.style.width='100vw'; v.style.height='100vh'; v.style.position='fixed'; v.style.top='0'; v.style.left='0'; v.style.zIndex='999999'; }";
    
    return JSON.stringify({
        url: url,
        isEmbed: true,
        headers: { 
            "Referer": "https://vsmov.com/",
            "Custom-Js": customJs 
        }
    });
}

function parseEmbedResponse(html, url) {
    return JSON.stringify({ url: url, isEmbed: true });
}

function parseCategoriesResponse(apiResponseJson) {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' },
        { name: 'TV Shows', slug: 'game-show' }
    ]);
}

function parseCountriesResponse(apiResponseJson) {
    return JSON.stringify([
        { name: 'Trung Quốc', value: 'trung-quoc' },
        { name: 'Hàn Quốc', value: 'han-quoc' },
        { name: 'Âu Mỹ', value: 'au-my' },
        { name: 'Nhật Bản', value: 'nhat-ban' }
    ]);
}
