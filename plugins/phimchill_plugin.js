// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

// Tên miền hiện tại theo HTML bạn cung cấp là phimchillhdb.im
var DOMAIN = "https://phimchillhdb.im";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Bản Native: Cào trực tiếp link m3u8, siêu mượt, không quảng cáo/autoplay.",
        "version": "5.0.0",             
        "baseUrl": BASEURL,
        "iconUrl": DOMAIN + "/favicon.ico", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // Dùng trình phát Native của Vax (chống lỗi Autoplay 100%)
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "danh-sach/phim-moi.html", "title": "Phim Mới Đề Cử", "type": "Grid" },
        { "slug": "quoc-gia/han-quoc.html", "title": "Phim Hàn Quốc", "type": "Grid" },
        { "slug": "quoc-gia/trung-quoc.html", "title": "Phim Trung Quốc", "type": "Grid" },
        { "slug": "quoc-gia/au-my.html", "title": "Phim Âu Mỹ", "type": "Grid" },
        { "slug": "danh-sach/phim-le.html", "title": "Top Phim Lẻ", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({ category: menulist });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") > -1) return slug;
    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        var page = parseInt(filters.page) || 1;
        var path = slug || "";
        if (filters.category) {
            if (Array.isArray(filters.category) && filters.category.length > 0) path = filters.category[0].slug || path;
            else if (typeof filters.category === "string") path = filters.category;
        }
        var url = BASEURL + (path ? "/" + path : "");
        if (page > 1) url += "?page=" + page;
        return url.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "");
    var page = 1;
    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        page = parseInt(filters.page) || 1;
    } catch (e) {}
    var url = BASEURL + "/?search=" + encodedKeyword;
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(id) {
    if (!id) return "";
    if (id.indexOf('http') === 0) return id;
    return BASEURL + (id.startsWith('/') ? '' : '/') + id;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS - LOAD TRANG CHỦ & THƯ MỤC
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};
        var regex = /<a[^>]*href=["']([^"']+\/phim\/[^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*(?:src|data-src)=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var url = match[1].trim();
            var title = match[2].replace(/<[^>]*>/g, '').trim();
            var posterUrl = match[3].trim();

            if (!title || title === "Video không tiêu đề") continue;
            if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) posterUrl = BASEURL + posterUrl;
            else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) posterUrl = BASEURL + "/" + posterUrl;
            if (url.indexOf("tap-") !== -1) continue;

            if (!seen[url]) {
                items.push({ "id": url, "title": title, "posterUrl": posterUrl, "backdropUrl": posterUrl, "quality": "HD" });
                seen[url] = true;
            }
        }

        // Dự phòng
        if (items.length === 0) {
            var articleRegex = /<article[\s\S]*?<\/article>/gi;
            var articles = html.match(articleRegex) || [];
            for (var j = 0; j < articles.length; j++) {
                var block = articles[j];
                var hMatch = block.match(/href="([^"]+\/phim\/[^"]+)"/i);
                var tMatch = block.match(/title="([^"]+)"/i);
                var iMatch = block.match(/(?:src|data-src)="([^"]+)"/i);

                if (hMatch && tMatch) {
                    var link = hMatch[1].trim();
                    var name = tMatch[1].trim();
                    var img = iMatch ? iMatch[1].trim() : "";

                    if (img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = BASEURL + img;
                    if (link.indexOf("tap-") !== -1) continue;

                    if (!seen[link]) {
                        items.push({ "id": link, "title": name, "posterUrl": img, "backdropUrl": img, "quality": "HD" });
                        seen[link] = true;
                    }
                }
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 50, "totalItems": items.length * 50, "itemsPerPage": 24 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// PARSER CHI TIẾT PHIM (CÀO CHUẨN XÁC TỪ HTML GỐC)
// =============================================================================

function parseMovieDetail(htmlContent, url) {
    try {
        var idMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || htmlContent.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        
        var rmatch = htmlContent.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];
        
        // Lấy tên phim sạch sẽ
        rmatch = htmlContent.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) {
            lname = rmatch[1].split('-')[0].split('|')[0].trim();
        }
        
        rmatch = htmlContent.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];

        var servers = [];
        
        // BÓC TÁCH SERVER & TẬP PHIM CHUẨN XÁC DỰA VÀO CẤU TRÚC HTML THỰC TẾ
        // Tách các block bằng thẻ span có chữ "Danh Sách"
        var serverBlocks = htmlContent.split(/<span[^>]*class=["'][^"']*uppercase[^"']*["'][^>]*>/i);
        
        // Block 0 là phần đầu HTML, ta xét từ Block 1 trở đi
        for (var i = 1; i < serverBlocks.length; i++) {
            var block = serverBlocks[i];
            
            // Lấy tên Server (VD: "Danh Sách Vietsub #1")
            var nameMatch = block.match(/^([^<]+)<\/span>/i);
            var serverName = nameMatch ? nameMatch[1].trim() : "Server " + i;
            
            // Giới hạn vùng chứa các tập phim để tránh quét nhầm phim đề cử bên dưới
            var epContainerMatch = block.match(/<div class=["']flex flex-row flex-wrap["']>([\s\S]*?)<\/div>/i);
            if (!epContainerMatch) continue;
            
            var episodesHtml = epContainerMatch[1];
            var episodes = [];
            var seenEp = {};
            
            var epRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var epMatch;
            
            while ((epMatch = epRegex.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1].trim();
                var epNameRaw = epMatch[2].replace(/<[^>]*>/g, '').trim();
                
                if (epUrl.indexOf('http') !== 0) epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
                
                if (!seenEp[epUrl]) {
                    // Nếu thẻ a chỉ chứa số (như trong ảnh), thêm chữ "Tập " vào trước
                    var cleanName = isNaN(epNameRaw) ? epNameRaw : ("Tập " + epNameRaw);
                    
                    episodes.push({
                        id: epUrl,
                        name: cleanName,
                        slug: epUrl.split('/').pop()
                    });
                    seenEp[epUrl] = true;
                }
            }
            
            if (episodes.length > 0) {
                servers.push({
                    name: serverName,
                    episodes: episodes
                });
            }
        }
        
        // Xử lý Phim Lẻ (Nếu không tìm thấy block Server nào)
        if (servers.length === 0) {
            var xemPhimMatch = htmlContent.match(/href="([^"]+\/phim\/[^"]+\/tap-[^"]*\.html)"/i);
            var targetUrl = id;
            if (xemPhimMatch) {
                targetUrl = xemPhimMatch[1];
                if (targetUrl.indexOf('http') !== 0) targetUrl = BASEURL + (targetUrl.startsWith('/') ? '' : '/') + targetUrl;
            }
            servers.push({
                name: "Phim Lẻ",
                episodes: [{ id: targetUrl, name: "Full", slug: "full" }]
            });
        }

        return JSON.stringify({
            id: id, 
            title: lname, 
            posterUrl: limg, 
            backdropUrl: limg, 
            description: ldes,
            quality: "HD", 
            year: new Date().getFullYear(), 
            rating: 8.0, 
            servers: servers
        });
        
    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// BÓC TÁCH LINK STREAM VIDEO CỐT LÕI TỪ TRANG TẬP PHIM
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var isEmbed = false;
        
        // 1. Quét tìm Link M3U8 trực tiếp từ button Server theo HTML bạn cung cấp
        // Mẫu: data-type="m3u8" data-link="https://stream...m3u8"
        var m3u8Match = html.match(/data-type=["']m3u8["'][^>]*data-link=["']([^"']+)["']/i) || 
                        html.match(/data-link=["']([^"']+\.m3u8[^"']*)["']/i);
        
        // 2. Tìm Link Embed nhúng
        var embedMatch = html.match(/data-type=["']embed["'][^>]*data-link=["']([^"']+)["']/i);
        var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        
        if (m3u8Match) { 
            streamUrl = m3u8Match[1]; 
        } else if (embedMatch) { 
            streamUrl = embedMatch[1]; 
            isEmbed = true; 
        } else if (iframeMatch) { 
            streamUrl = iframeMatch[1]; 
            isEmbed = true; 
        }

        // Bắt dự phòng
        if (!streamUrl) {
            var scriptMatch = html.match(/['"](https?:\/\/[^"']+(?:\.m3u8|\/embed\/)[^"']*)['"]/i);
            if (scriptMatch) {
                streamUrl = scriptMatch[1];
                isEmbed = streamUrl.includes("/embed/") || streamUrl.includes("iframe");
            }
        }

        if (streamUrl) {
            if (streamUrl.startsWith("//")) streamUrl = "https:" + streamUrl;
        } else {
            // Nếu không quét được, truyền chính URL để iframe thử load
            streamUrl = url;
            isEmbed = true;
        }

        // Trả link trực tiếp về Trình Phát Native Của Ứng Dụng (Không dùng Webview JS nữa)
        return JSON.stringify({
            url: streamUrl,
            isEmbed: isEmbed,
            headers: { 
                "Referer": BASEURL + "/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
            },
            subtitles: []
        });

    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// =============================================================================
// MENUS THỂ LOẠI
// =============================================================================

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
danh-sach/phim-le.html@@Phim Lẻ
danh-sach/phim-bo.html@@Phim Bộ
the-loai/short-drama.html@@Phim Ngắn
the-loai/tinh-cam.html@@Tình Cảm
the-loai/am-nhac.html@@Âm Nhạc
the-loai/tam-ly.html@@Tâm Lý
the-loai/kinh-di.html@@Kinh Dị
the-loai/tai-lieu.html@@Tài Liệu
the-loai/tv-shows.html@@TV Shows
the-loai/hanh-dong.html@@Hành Động
the-loai/vien-tuong.html@@Viễn Tưởng
the-loai/than-thoai.html@@Thần Thoại
the-loai/vo-thuat.html@@Võ Thuật
the-loai/chien-tranh.html@@Chiến Tranh
the-loai/chinh-kich.html@@Chính Kịch
the-loai/phieu-luu.html@@Phiêu Lưu
the-loai/hai-huoc.html@@Hài Hước
the-loai/co-trang.html@@Cổ Trang
the-loai/gia-dinh.html@@Gia Đình
the-loai/hoc-duong.html@@Học Đường
the-loai/hinh-su.html@@Hình Sự
the-loai/bi-an.html@@Bí Ẩn
the-loai/phim-18.html@@Phim 18+
`;
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        if (!link || !name) continue;
        menulist.push({ "slug": link, "name": name });
    }
    return menulist;
}
