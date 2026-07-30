// =============================================================================
// CẤU HÌNH DOMAIN PHIMNGANHDC (MOTCHILL CLONE)
// =============================================================================
var BASEURL = "https://phimnganhdc.com"; 
var DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "phimnganhdc",
        "name": "Phim Ngắn HDC",
        "description": "Bản Native iOS Tối Ưu: Load siêu tốc, bắt link m3u8 trực tiếp, không dùng Webview.",
        "version": "1.5.0",
        "info": "Tối ưu riêng cho iOS bằng thuật toán String Split. Phát phim qua ExoPlayer Native siêu mượt.",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "exoplayer" // [BẮT BUỘC] Dùng trình phát Native, KHÔNG mở Webview
    });
}

function log(msg) {
    if (DEV) {
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[PhimNganHDC] " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[PhimNganHDC] " + msg);
        }
    }
}

// -----------------------------------------------------------------------------
// MENU & CATEGORIES
// -----------------------------------------------------------------------------
function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'top-phim-ngay', title: 'Top Phim Ngày', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-ngan', title: 'Phim Ngắn', type: 'Horizontal', path: 'the-loai' },
        { slug: 'ngon-tinh', title: 'Ngôn Tình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'co-trang', title: 'Cổ Trang', type: 'Horizontal', path: 'the-loai' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Mới', slug: 'phim-moi' },
        { name: 'Top Phim', slug: 'top-phim-ngay' },
        { name: 'Phim Ngắn', slug: 'phim-ngan' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Ngôn Tình', slug: 'ngon-tinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Sắp xếp', value: '' }, { name: 'Mới cập nhật', value: 'update' }, { name: 'Thời gian đăng', value: 'create' }, { name: 'Năm sản xuất', value: 'year' }, { name: 'Lượt xem', value: 'view' }
        ],
        type: [
            { name: 'Định dạng', value: '' }, { name: 'Phim bộ', value: 'series' }, { name: 'Phim lẻ', value: 'single' }
        ],
        category: [
            { name: 'Thể loại', value: '' }, { name: 'Cổ Trang', value: '15' }, { name: 'Ngôn Tình', value: '32' }, { name: 'Phim ngắn', value: '38' }, { name: 'Hành Động', value: '10' }, { name: 'Hoạt Hình', value: '4' }
        ]
    });
}

// -----------------------------------------------------------------------------
// URL GENERATOR
// -----------------------------------------------------------------------------
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;

        if (filters.sort || filters.category || filters.type) {
            var params = [];
            if (filters.sort) params.push("filter[sort]=" + filters.sort);
            if (filters.type) params.push("filter[type]=" + filters.type);
            if (filters.category) params.push("filter[category]=" + filters.category);
            if (page > 1) params.push("page=" + page);
            return BASEURL + "/?" + params.join("&");
        }

        var path = "";
        if (slug === 'phim-de-cu' || slug === 'bang-xep-hang' || slug === 'top-phim-ngay' || slug === 'phim-chieu-rap' || slug === 'phim-moi') {
            path = "/danh-sach/" + slug;
        } else {
            path = "/the-loai/" + slug;
        }

        return BASEURL + path + (page > 1 ? "?page=" + page : "");
    } catch (e) {
        return BASEURL + "/danh-sach/phim-moi";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    return BASEURL + "/?search=" + encodeURIComponent(keyword).replace(/%20/g, "+") + (page > 1 ? "&page=" + page : "");
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + (slug.startsWith("/") ? slug.substring(1) : slug);
}

function getUrlCategories() { return BASEURL + "/the-loai"; }
function getUrlCountries() { return BASEURL + "/quoc-gia"; }
function getUrlYears() { return BASEURL + "/nam"; }

// -----------------------------------------------------------------------------
// PARSER 1: TRANG DANH SÁCH (TỐI ƯU BẰNG STRING SPLIT)
// -----------------------------------------------------------------------------
function parseListResponse(htmlContent) {
    try {
        var items = [];
        var blocks = htmlContent.split('<li class="item"'); // Cắt mảng lấy từng phim siêu tốc
        
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var titleMatch = block.match(/title=["']([^"']+)["']/i);
            var slugMatch = block.match(/href=["']([^"']+)["']/i);
            var imgMatch = block.match(/src=["']([^"']+)["']/i);
            var labelMatch = block.match(/class=["']label["']>([^<]+)/i);
            
            if (titleMatch && slugMatch && imgMatch) {
                var title = titleMatch[1].trim();
                var slug = slugMatch[1];
                var posterUrl = imgMatch[1];
                var label = labelMatch ? labelMatch[1].trim() : "";
                
                if (posterUrl.indexOf('http') !== 0) posterUrl = BASEURL + posterUrl;

                var episode_current = "";
                var epMatch = /(Tập \d+|Hoàn [tT]ất \(\d+\/\d+\)|Hoàn Tất \(\d+\/\d+\)|Full)/i.exec(label);
                if (epMatch) episode_current = epMatch[1];

                items.push({
                    id: slug,
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    episode_current: episode_current,
                    quality: label.indexOf('Full') > -1 ? "Full" : "HD"
                });
            }
        }

        var totalPages = 1;
        var pageMatch = htmlContent.match(/page=(\d+)["'][^>]*>\d+<\/a><\/li>\s*<\/ul>/i);
        if (pageMatch) totalPages = parseInt(pageMatch[1]);

        var currentPage = 1;
        var curMatch = htmlContent.match(/class=["']current["']>(\d+)<\/a>/i);
        if (curMatch) currentPage = parseInt(curMatch[1]);

        return JSON.stringify({
            items: items,
            pagination: { currentPage: currentPage, totalPages: totalPages, itemsPerPage: 20 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

// -----------------------------------------------------------------------------
// PARSER 2: TRANG CHI TIẾT (TỐI ƯU BẰNG REGEX & SPLIT)
// -----------------------------------------------------------------------------
function parseMovieDetail(htmlContent, pageUrl) {
    try {
        var titleMatch = htmlContent.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace(/Phim /i, '').split('-')[0].trim() : "Đang cập nhật";

        var imgMatch = htmlContent.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        var posterUrl = imgMatch ? imgMatch[1] : "";

        var descMatch = htmlContent.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        var description = descMatch ? descMatch[1] : "";

        // Trích xuất thông tin
        var epMatch = htmlContent.match(/Tập mới nhất[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>/i) || htmlContent.match(/class=["']badge badge-info["'][^>]*>([\s\S]*?)<\/span>/i);
        var episode_current = epMatch ? epMatch[1].trim().replace(/<[^>]*>/g, '') : "";

        var catRegex = /href=["'][^"']*\/the-loai\/[^"']*["'][^>]*>([^<]+)/gi;
        var cats = [], cM;
        while ((cM = catRegex.exec(htmlContent)) !== null) cats.push(cM[1].trim());

        // BÓC TÁCH MÁY CHỦ VÀ DANH SÁCH TẬP
        var servers = [];
        var serverBlocks = htmlContent.split('class="server-episode-block"');
        
        for (var i = 1; i < serverBlocks.length; i++) {
            var block = serverBlocks[i];
            
            var nameMatch = block.match(/Danh sách[^:]*:([\s\S]*?)<\/div>/i);
            var serverName = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : "Server " + i;

            var listBlock = block.split('class="list-episode')[1];
            if (!listBlock) continue;
            listBlock = listBlock.split('</div>')[0];

            var episodes = [];
            var epRegex = /href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var eMatch;
            
            while ((eMatch = epRegex.exec(listBlock)) !== null) {
                var epUrl = eMatch[1];
                if (epUrl.indexOf('http') !== 0) epUrl = BASEURL + epUrl;
                
                episodes.push({
                    id: epUrl, // Gửi link trang xem phim sang parseDetailResponse
                    name: eMatch[2].trim().replace(/<[^>]*>/g, ''),
                    slug: epUrl
                });
            }

            if (episodes.length > 0) {
                servers.push({ name: serverName, episodes: episodes });
            }
        }

        return JSON.stringify({
            id: pageUrl,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            episode_current: episode_current,
            category: cats.join(", "),
            servers: servers
        });

    } catch (error) {
        return JSON.stringify({ id: pageUrl || "error", title: "Lỗi chi tiết", servers: [] });
    }
}

// -----------------------------------------------------------------------------
// PARSER 3: BẮT LINK BÊN TRONG TRANG XEM PHIM (KHÔNG DÙNG WEBVIEW)
// -----------------------------------------------------------------------------
function parseDetailResponse(htmlContent, url) {
    try {
        // Tìm button Server đang Active để lấy Data-Link
        var linkMatch = htmlContent.match(/class=["'][^"']*streaming-server[^"']*active[^"']*["'][^>]*data-link=["']([^"']+)["']/i);
        if (!linkMatch) {
            // Fallback lấy nút đầu tiên nếu không có nút active
            linkMatch = htmlContent.match(/class=["'][^"']*streaming-server[^"']*["'][^>]*data-link=["']([^"']+)["']/i);
        }

        var streamUrl = linkMatch ? linkMatch[1] : "";

        if (streamUrl) {
            // Kiểm tra xem Data-Link là file m3u8 lộ diện hay là link Iframe (embed)
            var isDirect = streamUrl.indexOf('.m3u8') !== -1 || streamUrl.indexOf('.mp4') !== -1;

            if (isDirect) {
                // Link m3u8 thuần -> Trả về để ExoPlayer phát ngay lập tức
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: false,
                    mimeType: "application/x-mpegURL",
                    headers: { "Referer": BASEURL + "/", "User-Agent": "Mozilla/5.0" },
                    subtitles: []
                });
            } else {
                // Link Iframe (VD: tiktok.phimhdc.com/embed/...) -> Trả về kèm isEmbed: true
                // Do playerType = "exoplayer", VAX App sẽ KHÔNG HIỆN WEBVIEW!
                // App sẽ âm thầm tải cái URL Iframe này dưới background rồi ném vào hàm parseEmbedResponse bên dưới.
                return JSON.stringify({
                    url: streamUrl.indexOf('//') === 0 ? "https:" + streamUrl : streamUrl,
                    isEmbed: true, 
                    headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                    subtitles: []
                });
            }
        }

        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// -----------------------------------------------------------------------------
// PARSER 4: TRÍCH XUẤT M3U8 TỪ TRONG MÃ NGUỒN CỦA LINK IFRAME (ĐỆ QUY NGẦM)
// -----------------------------------------------------------------------------
function parseEmbedResponse(htmlContent, url) {
    try {
        // 1. Quét tìm đuôi .m3u8 hoặc .mp4 xuất hiện thẳng trong HTML của trang Embed
        var directMatch = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        
        if (directMatch) {
            var finalUrl = directMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false, // Ra lệnh dừng đệ quy và đưa link cho ExoPlayer phát
                mimeType: finalUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }

        // 2. Dự phòng nếu link giấu trong JS packer (VD: eval(function(p,a,c,k,e,d)...))
        var packMatch = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\),0,\{\}\))\)/);
        if (packMatch) {
            try {
                var unpacked = eval("(" + packMatch[1] + ")");
                var m3u8Hidden = unpacked.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
                if (m3u8Hidden) {
                    return JSON.stringify({
                        url: m3u8Hidden[1].replace(/\\/g, ''),
                        isEmbed: false,
                        mimeType: "application/x-mpegURL",
                        headers: { "Referer": url }
                    });
                }
            } catch (err) {}
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
