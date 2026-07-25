// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var DOMAIN = "https://motchillw.blue";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native iOS 10.0: Bắt chuẩn xác 100% trang chủ, Không quảng cáo.",
        "version": "10.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // QUAN TRỌNG: Sử dụng trình phát Native để triệt tiêu lỗi Autoplay/Zoom
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

function getHomeSections() {
    var listurl = `
/danh-sach@@Phim Mới Cập Nhật@@true
/danh-sach/phim-le@@Phim Lẻ Mới@@true
/danh-sach/phim-bo@@Phim Bộ Mới@@true
/danh-sach/phim-hot-tuan@@Phim Hot Trong Tuần@@true
`;
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
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
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;
                    if (pageSearch > 1) {
                        var keywordMatch = slug.match(/\?q=([^&]+)/i);
                        if (keywordMatch && keywordMatch[1]) {
                            var searchPageUrl = BASEURL + "/search/" + pageSearch + "?q=" + keywordMatch[1];
                            return searchPageUrl.replace(/([^:]\/)\/+/g, "$1");
                        }
                    }
                } catch (jsonErr) {}
            }
            return slug;
        }

        var page = 1;
        var path = slug || "";

        if (filtersJson) {
            var fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) path = filters.category[0].slug;
                    else if (typeof filters.category === 'string') path = filters.category;
                }
            } catch (jsonErr) {}
        }

        var resultUrl = BASEURL;
        if (path) resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 1) resultUrl += "?page=" + page;

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        if (slug && slug.indexOf("http") > -1) return slug;
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEURL;
        if (page > 1) resultUrl += "/search/" + page + "?q=" + encodedKeyword;
        else resultUrl += "/search?q=" + encodedKeyword;

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + "/search?q=" + encodeURIComponent(keyword || "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS TRANG CHỦ & TÌM KIẾM (ĐÃ NÂNG CẤP CHỐNG TRƯỢT HTML)
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        // CÁCH 1: Quét HTML hiển thị thực tế
        var regex = /<a([^>]+href=["'][^"']*\/phim\/[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var attrs = match[1];
            var inner = match[2];
            
            var hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
            var titleMatch = attrs.match(/title=["']([^"']+)["']/i);
            
            var url = hrefMatch ? hrefMatch[1].trim() : "";
            var title = titleMatch ? titleMatch[1].trim() : "";
            
            // Cứu cánh nếu title không nằm trong <a> mà nằm trong thẻ p/h3/alt ảnh
            if (!title) {
                var imgAltMatch = inner.match(/alt=["']([^"']+)["']/i);
                if (imgAltMatch) title = imgAltMatch[1].trim();
            }
            if (!title) {
                var txtMatch = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                if (txtMatch) title = txtMatch[1].replace(/<[^>]*>/g, '').trim();
            }
            
            // Lấy ảnh
            var imgMatch = inner.match(/src=["']([^"']+)["']/i);
            var img = imgMatch ? imgMatch[1].trim() : "";
            
            if (!url || !title || !img || title.indexOf('Motchill') > -1) continue;
            
            if (url.indexOf("http") === -1) url = BASEURL + (url.startsWith('/') ? '' : '/') + url;
            if (img.indexOf("http") === -1) img = BASEURL + (img.startsWith('/') ? '' : '/') + img;

            title = title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
            img = img.replace(/&amp;/g, '&');

            var curMatch = inner.match(/(Tập\s*\d+|Trọn bộ\s*\d+\s*tập|Hoàn tất[\s\d\/]+|\d+\/\d+)/i);
            var current = curMatch ? curMatch[1].trim() : "HD";
            
            var langMatch = inner.match(/(Vietsub|Thuyết Minh|Lồng Tiếng)/i);
            var lang = langMatch ? langMatch[1].trim() : "Vietsub";

            if (!seen[url]) {
                items.push({
                    "id": url,
                    "title": title,
                    "posterUrl": img,
                    "backdropUrl": img,
                    "quality": "HD",
                    "lang": lang,
                    "episode_current": current
                });
                seen[url] = true;
            }
        }
        
        // CÁCH 2: DỰ PHÒNG CÀO THẲNG JSON CỦA NEXT.JS NẾU HTML BỊ MÃ HOÁ
        if (items.length === 0) {
            var jsonRegex = /"slug":"([^"]+)","name":"([^"]+)","origin_name":"([^"]+)",[^}]+"thumb_url":"([^"]+)"/gi;
            var jMatch;
            while ((jMatch = jsonRegex.exec(html)) !== null) {
                var slug = jMatch[1];
                var t1 = jMatch[2];
                var img1 = jMatch[4];
                
                // Giải mã unicode thủ công
                t1 = unescape(t1.replace(/\\u/g, '%u'));
                
                var fUrl = BASEURL + "/phim/" + slug;
                if (img1.indexOf("http") === -1) img1 = BASEURL + img1;
                
                if (!seen[fUrl]) {
                    items.push({
                        "id": fUrl,
                        "title": t1,
                        "posterUrl": img1,
                        "backdropUrl": img1,
                        "quality": "HD",
                        "lang": "Vietsub",
                        "episode_current": "Cập nhật"
                    });
                    seen[fUrl] = true;
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 99 }
        });
        
    } catch (e) {
        return JSON.stringify({
            "items": [{ "id": $url, "title": "Lỗi tải trang", "posterUrl": "", "backdropUrl": "" }],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// PARSER CHI TIẾT PHIM (CƠ CHẾ 2 LƯỢT QUÉT)
// =============================================================================

var cachedMovieDetailId = ""; 

function transformMovieData(data) {
    const servers = [];
    if (!data || !data.servers) return servers;

    data.servers.forEach(function(server) {
        const episodeMap = {};
        server.items.forEach(function(item) {
            var link = item.link;
            if (!link) return;
            if (link.startsWith("//")) link = "https:" + link;
            if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0 && link.indexOf('/') !== 0) return;
            
            const slug = item.slug;
            if (!episodeMap[slug] || (item.type === 'm3u8' && episodeMap[slug].type === 'embed')) {
                episodeMap[slug] = {
                    id: link,
                    name: item.name,
                    slug: item.slug,
                    type: item.type
                };
            }
        });
        
        const items = Object.values(episodeMap).map(function(ep) {
            var cleanName = ep.name;
            if (!cleanName.toLowerCase().includes("tập") && !isNaN(parseInt(cleanName))) {
                cleanName = "Tập " + cleanName;
            }
            return { id: ep.id, name: cleanName, slug: ep.slug };
        });
        
        if (items.length > 0) {
            servers.push({ name: server.name, episodes: items });
        }
    });
    return servers;
}

function parseMovieDetail(html, url) {
    try {
        log(url);
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        
        var id = "";
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "";
        var episode_current = "HD";
        var quality = "Vietsub";
        var year = 2026;
        var rating = 8;
        var servers = [];
        var extra = "";
        
        if (!isJsonCall) {
            // LƯỢT 1: ĐỌC TRANG THÔNG TIN PHIM
            var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) || /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
            id = idMatch ? idMatch[1] : (url || "");
            cachedMovieDetailId = id; 
            
            var rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (rmatch && rmatch[1]) limg = rmatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;
            
            rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (rmatch && rmatch[1]) lname = rmatch[1].split('-')[0].split('|')[0].trim();
            
            var descMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/"description":"([^"]+)"/i);
            if (descMatch) ldes = descMatch[1].replace(/<[^>]*>/g, '').replace(/\\n/g, ' ').trim();
            
            // Tìm movie_id để tạo link API lấy danh sách tập
            var idVideo = null;
            var movieJsonMatch = html.match(/"movie_id"\s*:\s*"?(\d+)"?/i) || html.match(/"id"\s*:\s*"?(\d+)"?,\s*"name"\s*:\s*"[^"]+",\s*"origin_name"/i);
                                 
            if (movieJsonMatch) {
                idVideo = movieJsonMatch[1];
            } else {
                var altApiMatch = html.match(/baseapi\/episodes\?movie_id=(\d+)/i);
                if (altApiMatch) idVideo = altApiMatch[1];
            }
            
            if (idVideo) {
                extra = BASEURL + "/baseapi/episodes?movie_id=" + idVideo;
            } else {
                var m3u8Fallback = html.match(/(https?:\/\/[^"'\s]+\.m3u8)/i);
                var iframeFallback = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                if (m3u8Fallback) {
                    servers.push({ name: "Phim Lẻ", episodes: [{ id: m3u8Fallback[1], name: "Full", slug: "full" }] });
                } else if (iframeFallback) {
                    servers.push({ name: "Embed Player", episodes: [{ id: iframeFallback[1], name: "Full", slug: "full" }] });
                }
            }
            
        } else {
            // LƯỢT 2: RÁP DANH SÁCH TẬP TỪ JSON
            id = cachedMovieDetailId || "";
            if (html) {
                var $json = JSON.parse(html.trim());
                servers = transformMovieData($json);
            }
            extra = ""; // Đặt rỗng để cắt đuôi vòng lặp
        }
        
        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: quality,
            year: year,
            rating: rating,
            category: "Phim Chill",
            episode_current: episode_current,
            servers: servers, 
            extra: extra 
        });
        
    } catch (e) {
        log(e);
        return JSON.stringify({ id: cachedMovieDetailId || url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// PARSER CHI TIẾT TẬP & CÀO LINK STREAM NATIVE
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var isEmbed = false;
        var streamUrl = url;

        if (streamUrl.indexOf('.m3u8') === -1 && streamUrl.indexOf('.mp4') === -1) {
            isEmbed = true; 
        }

        if (streamUrl.startsWith('/player/master/')) {
            streamUrl = BASEURL + streamUrl;
            isEmbed = true; 
        } else if (streamUrl.startsWith("//")) {
            streamUrl = "https:" + streamUrl;
        }

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "headers": {
                "Referer": BASEURL + "/",
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

// =============================================================================
// MENUS THỂ LOẠI (Chỉnh sửa chuẩn theo Motchill)
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
/danh-sach/phim-le@@Phim Lẻ
/danh-sach/phim-bo@@Phim Bộ
/the-loai/hanh-dong@@Hành Động
/the-loai/tinh-cam@@Tình Cảm
/the-loai/hai-huoc@@Hài Hước
/the-loai/co-trang@@Cổ Trang
/the-loai/tam-ly@@Tâm Lý
/the-loai/hinh-su@@Hình Sự
/the-loai/chien-tranh@@Chiến Tranh
/the-loai/the-thao@@Thể Thao
/the-loai/vo-thuat@@Võ Thuật
/the-loai/vien-tuong@@Viễn Tưởng
/the-loai/phieu-luu@@Phiêu Lưu
/the-loai/khoa-hoc@@Khoa Học
/the-loai/kinh-di@@Kinh Dị
/the-loai/am-nhac@@Âm Nhạc
/the-loai/than-thoai@@Thần Thoại
/the-loai/tai-lieu@@Tài Liệu
/the-loai/gia-dinh@@Gia Đình
/the-loai/chinh-kich@@Chính kịch
/the-loai/bi-an@@Bí ẩn
/the-loai/hoc-duong@@Học Đường
/the-loai/kinh-dien@@Kinh Điển
/the-loai/phim-18@@Phim 18+
/the-loai/hoat-hinh@@Anime & Hoạt Hình
/the-loai/tv-shows@@TV Shows
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
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}
