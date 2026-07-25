// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var DOMAIN = "https://motchillw.blue";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native 13.0: Target-Lock ID phim chuẩn xác 100%, không dư/thiếu tập.",
        "version": "13.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // Bắt buộc dùng auto để kích hoạt Native Player siêu mượt của iOS
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
            
            // Xóa rác HTML nếu có lọt vào title
            jTitle = jTitle.replace(/\\u003c[^>]*\\u003e/g, '').replace(/<[^>]*>/g, '').trim();

            if (!seen[jUrl] && jTitle.toLowerCase().indexOf('motchill') === -1) {
                items.push({
                    "id": jUrl, "title": jTitle, "posterUrl": jImg, "backdropUrl": jImg, "quality": "HD", "lang": "Vietsub", "episode_current": "Cập nhật"
                });
                seen[jUrl] = true;
            }
        }

        // Cứu cánh quyét giao diện nếu JSON thất bại
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
// THUẬT TOÁN LÕI CHI TIẾT: KHÓA MỤC TIÊU MOVIE_ID & LOẠI BỎ TẬP RÁC
// =============================================================================

var cachedMovieDetailId = ""; 
var cachedMovieObj = {};

function parseMovieDetail(html, url) {
    try {
        log(url);
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var year = new Date().getFullYear();
        var serversMap = {};
        var servers = [];
        var extra = "";
        
        if (!isJsonCall) {
            // LƯỢT 1: ĐỌC TRANG THÔNG TIN PHIM
            cachedMovieDetailId = id; 
            var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            
            // 1. TÌM CHÍNH XÁC ID CỦA PHIM (KHÓA MỤC TIÊU)
            var currentSlug = url.split('/').filter(Boolean).pop().split('?')[0]; // ex: co-meo-nghien-thuoc-la-1784858422
            var exactMovieId = "";
            
            // Tìm block ID liên kết trực tiếp với Slug của url
            var idLockRegex = new RegExp('"id"\\s*:\\s*"(\\d+)"[^}]*?"slug"\\s*:\\s*"' + currentSlug + '"', 'i');
            var idMatch = cleanHtml.match(idLockRegex);
            
            if (!idMatch) { // Thử đảo ngược vị trí
                idLockRegex = new RegExp('"slug"\\s*:\\s*"' + currentSlug + '"[^}]*?"id"\\s*:\\s*"(\\d+)"', 'i');
                idMatch = cleanHtml.match(idLockRegex);
            }
            
            if (idMatch) {
                exactMovieId = idMatch[1];
            } else {
                // Dự phòng quét id bọc trong thẻ <MovieComments>
                var altIdMatch = cleanHtml.match(/"movieId"\s*:\s*"(\d+)"/i);
                if (altIdMatch) exactMovieId = altIdMatch[1];
            }

            // 2. LẤY THÔNG TIN CƠ BẢN
            var titleMatch = cleanHtml.match(/"name"\s*:\s*"([^"]+)"[^}]*?"slug"\s*:\s*"/i) || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (titleMatch) lname = titleMatch[1].split('-')[0].trim();
            
            var imgMatch = cleanHtml.match(/"thumb_url"\s*:\s*"([^"]+)"/i) || html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (imgMatch) limg = imgMatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;
            
            // 3. XỬ LÝ MÔ TẢ & LÀM SẠCH UNICODE (\u003cp\u003e)
            var descMatch = cleanHtml.match(/"content2"\s*:\s*"([^"]+)"/i) || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
            if (descMatch) {
                var rawDesc = descMatch[1];
                // Giải mã unicode thẻ HTML (\u003c -> <)
                rawDesc = rawDesc.replace(/\\u003c/gi, '<').replace(/\\u003e/gi, '>').replace(/\\u0026/gi, '&');
                // Decode ký tự tiếng việt
                try { rawDesc = unescape(rawDesc.replace(/\\u/g, '%u')); } catch(e){}
                // Tẩy sạch thẻ HTML dư thừa
                ldes = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\\n/g, ' ').trim();
            }

            // 4. QUÉT CÁC TẬP PHIM CHỈ THUỘC VỀ ID ĐÃ KHÓA (CHỐNG LỌT TẬP 16)
            var foundEps = false;
            
            if (exactMovieId) {
                // Regex chỉ khớp với cụm json có "movie_id" === exactMovieId
                var epRegex = /\{"id":"[^"]+","movie_id":"(\d+)","server":"([^"]+)","name":"([^"]+)","slug":"([^"]+)","type":"([^"]+)","link":"([^"]+)"/gi;
                var epMatch;
                
                while ((epMatch = epRegex.exec(cleanHtml)) !== null) {
                    var epMovieId = epMatch[1];
                    
                    // CHỐT CHẶN AN TOÀN: Bỏ qua tập của phim đề xuất
                    if (epMovieId !== exactMovieId) continue; 
                    
                    foundEps = true;
                    var sName = epMatch[2].trim();
                    var eName = epMatch[3].trim();
                    var eSlug = epMatch[4].trim();
                    var eType = epMatch[5].trim(); 
                    var eLink = epMatch[6].trim();
                    
                    if (eLink.indexOf('http') === -1) eLink = BASEURL + (eLink.startsWith('/') ? '' : '/') + eLink;

                    if (!serversMap[sName]) serversMap[sName] = {};
                    
                    // Ưu tiên m3u8 (Native) để chống lỗi Player webview
                    if (!serversMap[sName][eSlug] || eType === 'm3u8') {
                        serversMap[sName][eSlug] = {
                            id: eLink, 
                            name: isNaN(eName) ? eName : "Tập " + eName,
                            slug: eSlug,
                            type: eType
                        };
                    }
                }
            }

            // 5. GÓI DỮ LIỆU HOẶC GỌI API DỰ PHÒNG
            if (foundEps) {
                for (var srv in serversMap) {
                    var eps = Object.values(serversMap[srv]);
                    eps.sort((a, b) => {
                        var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                        var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                        return nA - nB;
                    });
                    servers.push({ name: srv, episodes: eps });
                }
            } else if (exactMovieId) {
                // Kích hoạt Lượt 2 nếu không tìm thấy array episodes trong HTML
                extra = BASEURL + "/baseapi/episodes?movie_id=" + exactMovieId;
                // Lưu lại thông tin cơ bản cho Lượt 2 xài
                cachedMovieObj = { title: lname, posterUrl: limg, backdropUrl: limg, description: ldes };
            } else {
                // Cứu cánh phim lẻ nếu mất tích ID
                var m3u8Fallback = cleanHtml.match(/(https?:\/\/[^"'\s]+\.m3u8)/i);
                if (m3u8Fallback) {
                    servers.push({ name: "H.VIP", episodes: [{ id: m3u8Fallback[1], name: "Full", slug: "full" }] });
                } else {
                    servers.push({ name: "Dự phòng", episodes: [{ id: url, name: "Full", slug: "full" }] });
                }
            }
            
        } else {
            // LƯỢT 2: RÁP DANH SÁCH TẬP TỪ API
            id = cachedMovieDetailId || url;
            lname = cachedMovieObj.title || lname;
            limg = cachedMovieObj.posterUrl || limg;
            ldes = cachedMovieObj.description || ldes;
            
            var data = JSON.parse(html);
            if (data && data.servers) {
                data.servers.forEach(server => {
                    var episodeMap = {};
                    server.items.forEach(item => {
                        var link = item.link;
                        if (link && link.startsWith("//")) link = "https:" + link;
                        if (!link || link.indexOf('http') !== 0) return;
                        
                        var slug = item.slug;
                        if (!episodeMap[slug] || item.type === 'm3u8') {
                            episodeMap[slug] = {
                                id: link,
                                name: isNaN(item.name) ? item.name : "Tập " + item.name,
                                slug: item.slug
                            };
                        }
                    });
                    var eps = Object.values(episodeMap);
                    // Sắp xếp
                    eps.sort((a, b) => {
                        var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                        var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                        return nA - nB;
                    });
                    if (eps.length > 0) servers.push({ name: server.name, episodes: eps });
                });
            }
            extra = ""; 
        }
        
        return JSON.stringify({
            id: id, 
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: 8.5,
            category: "Motchill",
            episode_current: servers.length > 0 ? "Cập nhật" : "Full",
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
