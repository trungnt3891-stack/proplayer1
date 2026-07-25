// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://motchillw.blue";

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native JSON Core: Cào 100% chuẩn xác, Link m3u8 trực tiếp, Siêu mượt.",
        "version": "12.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // Dùng trình phát mặc định Native để loại bỏ hoàn toàn quảng cáo và lỗi webview
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchill] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchill] " + msg);
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
// PARSERS TRANG CHỦ & TÌM KIẾM (CÀO TRỰC TIẾP TỪ LÕI JSON NEXT.JS)
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        // Loại bỏ các ký tự escape để biến chuỗi thành JSON sạch
        var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        
        // Quét cục JSON chứa cấu trúc: {"id":"123","name":"Tên Phim","slug":"ten-phim","thumb_url":"..."}
        var jsonRegex = /\{"id":"\d+","name":"([^"]+)","origin_name":"[^"]*","slug":"([^"]+)","thumb_url":"([^"]+)"(?:,"poster_url":"[^"]*")?[^\}]+?"episode_current":"([^"]+)"/gi;
        var match;

        while ((match = jsonRegex.exec(cleanHtml)) !== null) {
            var title = match[1];
            var slug = match[2];
            var img = match[3];
            var current = match[4];

            var url = BASEURL + "/phim/" + slug;
            if (img.indexOf("http") === -1) img = BASEURL + img;

            // Giải mã kí tự unicode (nếu có)
            try { title = unescape(title.replace(/\\u/g, '%u')); } catch(e) {}

            if (!seen[url]) {
                items.push({
                    "id": url,
                    "title": title,
                    "posterUrl": img,
                    "backdropUrl": img,
                    "quality": "HD",
                    "lang": "Vietsub",
                    "episode_current": current
                });
                seen[url] = true;
            }
        }
        
        // Cứu cánh nếu không bắt được JSON, dùng regex cào HTML
        if (items.length === 0) {
            var htmlRegex = /<a[^>]+href=["'](\/phim\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            while ((match = htmlRegex.exec(html)) !== null) {
                var cUrl = BASEURL + match[1];
                var inner = match[2];

                var titleMatch = inner.match(/alt=["']([^"']+)["']/i) || inner.match(/<h3[^>]*>([^<]+)<\/h3>/i) || inner.match(/title=["']([^"']+)["']/i);
                var imgMatch = inner.match(/src=["']([^"']+)["']/i);
                var curMatch = inner.match(/(Tập\s*\d+|Trọn bộ\s*\d+|Hoàn tất\s*[\d\/]+|Full)/i);

                if (titleMatch && imgMatch) {
                    var cTitle = titleMatch[1].trim();
                    var cImg = imgMatch[1].trim();
                    if (cImg.indexOf("http") === -1) cImg = BASEURL + cImg;

                    if (!seen[cUrl] && cTitle.toLowerCase().indexOf('motchill') === -1) {
                        items.push({
                            "id": cUrl,
                            "title": cTitle,
                            "posterUrl": cImg,
                            "backdropUrl": cImg,
                            "quality": "HD",
                            "lang": "Vietsub",
                            "episode_current": curMatch ? curMatch[1] : "HD"
                        });
                        seen[cUrl] = true;
                    }
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
// PARSER CHI TIẾT PHIM VÀ LẤY DANH SÁCH TẬP TỪ JSON
// =============================================================================

var cachedMovieDetailId = ""; 

function parseMovieDetail(html, url) {
    try {
        log(url);
        var isJsonCall = html && /^\s*[\{\[]/s.test(html);
        
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "";
        var year = new Date().getFullYear();
        var servers = [];
        var extra = "";
        
        if (!isJsonCall) {
            // LƯỢT 1: ĐỌC TRANG THÔNG TIN PHIM
            cachedMovieDetailId = id; 
            
            // Tẩy sạch HTML để lấy JSON ngầm
            var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            
            // Bóc tách thông tin phim
            var titleMatch = cleanHtml.match(/"movie"\s*:\s*\{"id"\s*:\s*"\d+","name"\s*:\s*"([^"]+)"/i) || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (titleMatch) lname = titleMatch[1].split('-')[0].trim();
            
            var imgMatch = cleanHtml.match(/"thumb_url"\s*:\s*"([^"]+)"/i) || html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (imgMatch) limg = imgMatch[1];
            if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;
            
            var descMatch = cleanHtml.match(/"content2"\s*:\s*"([^"]+)"/i);
            if (descMatch) ldes = descMatch[1].replace(/<[^>]*>/g, '').trim();
            
            // Tìm movie_id siêu ẩn
            var movieIdMatch = cleanHtml.match(/"movie"\s*:\s*\{"id"\s*:\s*"(\d+)"/i) || cleanHtml.match(/"id"\s*:\s*"(\d+)",\s*"name"/i);
            var idVideo = movieIdMatch ? movieIdMatch[1] : null;

            // BÓC TÁCH DANH SÁCH TẬP PHIM CHUẨN XÁC TỪ JSON
            var serversMap = {};
            var foundEps = false;
            
            // Quét định dạng episodes ngầm: {"id":"526079149","movie_id":"78632","server":"Vietsub #1","name":"1","slug":"tap-1","type":"m3u8","link":"https..."}
            var epRegex = /\{"id":"\d+","movie_id":"\d+","server":"([^"]+)","name":"([^"]+)","slug":"([^"]+)","type":"([^"]+)","link":"([^"]+)"[^\}]*\}/g;
            var epMatch;
            
            while ((epMatch = epRegex.exec(cleanHtml)) !== null) {
                foundEps = true;
                var sName = epMatch[1].trim();
                var eName = epMatch[2].trim();
                var eSlug = epMatch[3].trim();
                var eType = epMatch[4].trim(); // m3u8 hoặc embed
                var eLink = epMatch[5].trim();
                
                if (eLink.indexOf('http') === -1) eLink = BASEURL + (eLink.startsWith('/') ? '' : '/') + eLink;

                if (!serversMap[sName]) serversMap[sName] = {};
                
                // Lọc trùng lập slug, ưu tiên link m3u8
                if (!serversMap[sName][eSlug] || eType === 'm3u8') {
                    serversMap[sName][eSlug] = {
                        id: eLink, // Lưu thẳng Link làm ID để Trình phát load luôn
                        name: isNaN(eName) ? eName : "Tập " + eName,
                        slug: eSlug,
                        type: eType
                    };
                }
            }

            // Gói lại thành mảng Servers
            if (foundEps) {
                for (var srv in serversMap) {
                    var eps = Object.values(serversMap[srv]);
                    // Sắp xếp tập
                    eps.sort((a, b) => {
                        var nA = parseFloat(a.name.replace(/[^\d.]/g, '')) || 0;
                        var nB = parseFloat(b.name.replace(/[^\d.]/g, '')) || 0;
                        return nA - nB;
                    });
                    servers.push({ name: srv, episodes: eps });
                }
            } else if (idVideo) {
                // Nếu trang quá nặng ẩn mất tập, gọi API Lượt 2
                extra = BASEURL + "/baseapi/episodes?movie_id=" + idVideo;
            } else {
                // Cứu cánh phim lẻ
                servers.push({ name: "Phim Lẻ", episodes: [{ id: url, name: "Full", slug: "full" }] });
            }
            
        } else {
            // LƯỢT 2: RÁP DANH SÁCH TẬP TỪ API
            id = cachedMovieDetailId || url;
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
                    if (eps.length > 0) servers.push({ name: server.name, episodes: eps });
                });
            }
            extra = ""; // Cắt vòng lặp
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
        var streamUrl = url; // url ở đây chính là eLink mà ta đã lấy ở hàm trên!

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
