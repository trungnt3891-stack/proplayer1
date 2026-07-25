// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var DOMAIN = "https://motchillw.blue";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native 19.0 (Slug-Matching): Chống bắt nhầm phim 100%, Xóa T Vietsub, Load Full API.",
        "version": "19.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" 
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
// PARSERS TRANG CHỦ & TÌM KIẾM
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        var jsonRegex = /"slug"\s*:\s*"([^"]+)","name"\s*:\s*"([^"]+)"(?:,"origin_name":"[^"]+")?,"thumb_url"\s*:\s*"([^"]+)"/gi;
        var jMatch;
        
        while ((jMatch = jsonRegex.exec(cleanHtml)) !== null) {
            var jUrl = BASEURL + "/phim/" + jMatch[1];
            var jTitle = unescape(jMatch[2].replace(/\\u/g, '%u'));
            var jImg = jMatch[3];
            if (jImg.indexOf('http') === -1) jImg = BASEURL + jImg;
            
            jTitle = jTitle.replace(/\\u003c[^>]*\\u003e/g, '').replace(/<[^>]*>/g, '').trim();

            if (!seen[jUrl] && jTitle.toLowerCase().indexOf('motchill') === -1) {
                items.push({
                    "id": jUrl, "title": jTitle, "posterUrl": jImg, "backdropUrl": jImg, "quality": "HD", "lang": "Vietsub", "episode_current": "Cập nhật"
                });
                seen[jUrl] = true;
            }
        }

        if (items.length === 0) {
            var htmlRegex = /<a([^>]+href=["'][^"']*\/phim\/[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
            var match;
            while ((match = htmlRegex.exec(html)) !== null) {
                var attrs = match[1];
                var inner = match[2];
                var hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
                var url = hrefMatch ? hrefMatch[1].trim() : "";
                
                var titleMatch = inner.match(/alt=["']([^"']+)["']/i) || inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || attrs.match(/title=["']([^"']+)["']/i);
                var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "";
                
                var imgMatch = inner.match(/src=["']([^"']+)["']/i);
                var img = imgMatch ? imgMatch[1].trim() : "";
                
                if (!url || !title || !img || title.toLowerCase().indexOf('motchill') > -1) continue;
                if (url.indexOf("http") === -1) url = BASEURL + (url.startsWith('/') ? '' : '/') + url;
                if (img.indexOf("http") === -1) img = BASEURL + (img.startsWith('/') ? '' : '/') + img;

                var curMatch = inner.match(/(Tập\s*\d+|Trọn bộ\s*\d+|Hoàn tất[\s\d\/]+|\d+\/\d+|Full)/i);
                var current = curMatch ? curMatch[1].trim() : "HD";
                var langMatch = inner.match(/(Vietsub|Thuyết Minh|Lồng Tiếng)/i);
                var lang = langMatch ? langMatch[1].trim() : "Vietsub";

                if (!seen[url]) {
                    items.push({
                        "id": url, "title": title, "posterUrl": img, "backdropUrl": img, "quality": "HD", "lang": lang, "episode_current": current
                    });
                    seen[url] = true;
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
// THUẬT TOÁN LÕI CHI TIẾT: KHÓA SLUG ĐỂ TRÁNH BẮT NHẦM ID PHIM ĐỀ XUẤT
// =============================================================================

var cachedMovieDetailId = ""; 
var cachedMovieObj = {};

function parseMovieDetail(html, url) {
    try {
        log("parseMovieDetail url: " + url);
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "Phim Mới";
        var episode_current = "";
        var quality = "HD";
        var year = 2026;
        var servers = [];
        var extra = "";
        
        if (!isJsonCall) {
            // LƯỢT 1: PHÂN TÍCH HTML VÀ KHÓA ID
            cachedMovieDetailId = id;
            var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // 1. Lấy Slug từ thanh địa chỉ để chống bắt nhầm ID của phim khác
            var urlSlug = url.split('/').filter(Boolean).pop().split('?')[0]; 
            var exactMovieId = null;

            // Truy quét cụm JSON chứa CHÍNH XÁC slug này
            var slugRegex1 = new RegExp('"id"\\s*:\\s*"?(\\d+)"?[^}]*?"slug"\\s*:\\s*"' + urlSlug + '"', 'i');
            var slugRegex2 = new RegExp('"slug"\\s*:\\s*"' + urlSlug + '"[^}]*?"id"\\s*:\\s*"?(\\d+)"?', 'i');
            
            var sm = cleanHtml.match(slugRegex1) || cleanHtml.match(slugRegex2);
            if (sm) {
                exactMovieId = sm[1];
            } else {
                // Dự phòng quét cụm "movie":{...} đặc trưng của bộ phim đang xem
                var mMatch = cleanHtml.match(/"movie"\s*:\s*\{\s*"id"\s*:\s*"?(\d+)"?/i);
                if (mMatch) exactMovieId = mMatch[1];
            }

            // 2. Lấy thông tin hiển thị cơ bản
            var titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (titleMatch) lname = titleMatch[1].split('-')[0].trim();

            var imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (imgMatch) limg = imgMatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;

            // Xử lý mô tả từ Meta tag để sạch 100% không dính \u003c
            var descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
            if (descMatch) ldes = descMatch[1].replace(/<[^>]*>/g, '').trim();

            // 3. Nếu chốt được ID chuẩn -> Kích hoạt API ở Lượt 2
            if (exactMovieId) {
                extra = BASEURL + "/baseapi/episodes?movie_id=" + exactMovieId;
                // Lưu tạm thông tin để ráp vào Lượt 2
                cachedMovieObj = { title: lname, posterUrl: limg, description: ldes };
            } else {
                // Fallback cứu cánh: Quét thẻ <a> trong DOM ảo nếu web thay đổi API
                var domEps = [];
                var aRegex = /<a([^>]+href=["'][^"']*\/xem-phim\/[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
                var aMatch;
                while ((aMatch = aRegex.exec(html)) !== null) {
                    var attrs = aMatch[1];
                    var inner = aMatch[2].replace(/<[^>]*>/g, '').trim();
                    var hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
                    if (hrefMatch && inner.length < 15 && inner.length > 0) {
                        var eUrl = hrefMatch[1];
                        if (eUrl.indexOf('http') === -1) eUrl = BASEURL + eUrl;
                        var eName = isNaN(inner) ? inner : "Tập " + inner;
                        domEps.push({ id: eUrl, name: eName, slug: eUrl });
                    }
                }
                
                if (domEps.length > 0) {
                    var uniqueEps = [];
                    var seenEps = {};
                    domEps.forEach(function(ep) {
                        if (!seenEps[ep.id]) { seenEps[ep.id] = true; uniqueEps.push(ep); }
                    });
                    servers.push({ name: "Server (Web Fallback)", episodes: uniqueEps });
                } else {
                    servers.push({ name: "Mặc định", episodes: [{ id: url, name: "Full", slug: "full" }] });
                }
            }
            
        } else {
            // LƯỢT 2: PARSE DỮ LIỆU TỪ API (HÌNH THỨC CHUẨN JSON CỦA BẠN)
            id = cachedMovieDetailId || url;
            lname = cachedMovieObj.title || lname;
            limg = cachedMovieObj.posterUrl || limg;
            ldes = cachedMovieObj.description || ldes;
            
            var data = JSON.parse(html); 
            
            if (data && data.servers && Array.isArray(data.servers)) {
                data.servers.forEach(function(server) {
                    var sName = server.name || "";
                    
                    // ==============================================
                    // BỘ LỌC TỐI THƯỢNG: CẮT CỔ T VIETSUB NGAY LẬP TỨC
                    // ==============================================
                    if (sName.toLowerCase().indexOf('t vietsub') > -1 || sName.toLowerCase().indexOf('t-vietsub') > -1) {
                        return; // Bỏ qua hoàn toàn server này
                    }
                    
                    var episodeMap = {};
                    
                    if (server.items && Array.isArray(server.items)) {
                        server.items.forEach(function(item) {
                            var link = item.link;
                            if (!link) return;
                            
                            if (link.startsWith("//")) link = "https:" + link;
                            if (link.indexOf('http') === -1 && link.startsWith('/')) {
                                link = BASEURL + link;
                            } else if (link.indexOf('http') !== 0) {
                                return;
                            }
                            
                            var eSlug = item.slug;
                            var eType = item.type;
                            var eName = item.name;
                            
                            // Gộp tập, ưu tiên link native M3U8 để chạy mượt, ném Embed đi
                            if (!episodeMap[eSlug] || eType === 'm3u8') {
                                episodeMap[eSlug] = {
                                    id: link,
                                    name: isNaN(eName) ? eName : "Tập " + eName,
                                    slug: eSlug
                                };
                            }
                        });
                    }
                    
                    var eps = Object.values(episodeMap);
                    
                    // Sắp xếp tập theo số thứ tự (1 -> 2 -> 3)
                    eps.sort(function(a, b) {
                        var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                        var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                        return nA - nB;
                    });
                    
                    if (eps.length > 0) {
                        servers.push({ name: sName, episodes: eps });
                    }
                });
            }
            extra = ""; // Cắt vòng lặp API
        }
        
        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: quality,
            year: year,
            rating: 8.5,
            category: category,
            episode_current: servers.length > 0 ? "Cập nhật" : "Full",
            servers: servers, 
            extra: extra 
        });
        
    } catch (e) {
        log("parseMovieDetail error: " + e);
        return JSON.stringify({ id: cachedMovieDetailId || url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// PARSER CHI TIẾT TẬP & CÀO LINK STREAM NATIVE / WEBVIEW
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var isEmbed = false;
        var streamUrl = url;

        // Nếu File ID truyền xuống không phải M3u8/Mp4, tự động mở Webview Iframe
        if (streamUrl.indexOf('.m3u8') === -1 && streamUrl.indexOf('.mp4') === -1) {
            isEmbed = true; 
        }

        // Chống lỗi đường dẫn Embed tương đối của Motchill
        if (streamUrl.startsWith('/player/master/')) {
            streamUrl = BASEURL + streamUrl;
            isEmbed = true; 
        } else if (streamUrl.startsWith("//")) {
            streamUrl = "https:" + streamUrl;
        }

        // Truyền cho Player của hệ thống
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
