// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var DOMAIN = "https://motchillw.blue";
var BASEURL = DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "motchill",
        "name": "Nguồn Phim Motchill",
        "description": "Bản Native 11.0: Cào JSON ngầm, lấy thẳng link m3u8. Không quảng cáo/zoom lỗi.",
        "version": "11.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/motchill.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto" // Bắt buộc dùng auto để kích hoạt Native Player của iOS
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
// PARSERS TRANG CHỦ & DANH SÁCH
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};
        
        // Quét cấu trúc thẻ <a> hiển thị ở trang chủ
        var regex = /<a([^>]+href=["'][^"']*\/phim\/[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var attrs = match[1];
            var inner = match[2];
            
            var hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
            var titleMatch = attrs.match(/title=["']([^"']+)["']/i);
            
            var url = hrefMatch ? hrefMatch[1].trim() : "";
            var title = titleMatch ? titleMatch[1].trim() : "";
            
            if (!title) {
                var imgAltMatch = inner.match(/alt=["']([^"']+)["']/i);
                if (imgAltMatch) title = imgAltMatch[1].trim();
            }
            if (!title) {
                var txtMatch = inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || inner.match(/<p[^>]*class=["'][^"']*line-clamp-1[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
                if (txtMatch) title = txtMatch[1].replace(/<[^>]*>/g, '').trim();
            }
            
            var imgMatch = inner.match(/src=["']([^"']+)["']/i);
            var img = imgMatch ? imgMatch[1].trim() : "";
            
            if (!url || !title || !img || title.toLowerCase().indexOf('motchill') > -1) continue;
            
            if (url.indexOf("http") === -1) url = BASEURL + (url.startsWith('/') ? '' : '/') + url;
            if (img.indexOf("http") === -1) img = BASEURL + (img.startsWith('/') ? '' : '/') + img;

            title = title.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
            img = img.replace(/&amp;/g, '&');

            var curMatch = inner.match(/>([^<]*(?:Tập|Trọn bộ|Hoàn tất)[\s\d\/]+(?:tập)?[^<]*)</i);
            var current = curMatch ? curMatch[1].trim() : "HD";
            
            var langMatch = inner.match(/>(Vietsub|Thuyết Minh|Lồng Tiếng|Raw)</i);
            var lang = langMatch ? langMatch[1].trim() : "Vietsub";

            if (!seen[url]) {
                items.push({
                    "id": url, "title": title, "posterUrl": img, "backdropUrl": img, "quality": "HD", "lang": lang, "episode_current": current
                });
                seen[url] = true;
            }
        }
        
        // Quét dự phòng cục JSON ngầm của NextJS nếu giao diện bị thay đổi
        if (items.length === 0) {
            var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            var jsonRegex = /"slug"\s*:\s*"([^"]+)","name"\s*:\s*"([^"]+)"(?:,"origin_name":"[^"]+")?,"thumb_url"\s*:\s*"([^"]+)"/gi;
            var jMatch;
            while ((jMatch = jsonRegex.exec(cleanHtml)) !== null) {
                var jUrl = BASEURL + "/phim/" + jMatch[1];
                var jTitle = unescape(jMatch[2].replace(/\\u/g, '%u'));
                var jImg = jMatch[3];
                if (jImg.indexOf('http') === -1) jImg = BASEURL + jImg;
                
                if (!seen[jUrl]) {
                    items.push({
                        "id": jUrl, "title": jTitle, "posterUrl": jImg, "backdropUrl": jImg, "quality": "HD", "lang": "Vietsub", "episode_current": "Cập nhật"
                    });
                    seen[jUrl] = true;
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 99 }
        });
        
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

// =============================================================================
// THUẬT TOÁN LÕI: CHIẾT XUẤT THÔNG TIN VÀ DANH SÁCH TẬP TỪ JSON CỦA NEXT.JS
// Bỏ qua thẻ HTML, cào thẳng dữ liệu máy chủ để lấy được link M3U8 cực xịn
// =============================================================================

function parseMovieDetail(html, url) {
    try {
        var idMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var year = new Date().getFullYear();
        var serversMap = {};
        var servers = [];
        
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (titleMatch) lname = titleMatch[1].split('-')[0].split('|')[0].trim();
        
        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (imgMatch) limg = imgMatch[1];
        if (limg && limg.indexOf('http') === -1) limg = BASEURL + limg;
        
        var descMatch = html.match(/<meta name="description" content="([^"]+)"/i) || html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (descMatch) ldes = descMatch[1].replace(/\\"/g, '"');
        
        // 1. Tẩy sạch chuỗi HTML Next.js bị mã hóa escape để dễ dùng Regex
        var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        
        // 2. Định vị ID ẩn của bộ phim
        var internalMovieId = "";
        var idJsonMatch = cleanHtml.match(/"movie"\s*:\s*\{"id"\s*:\s*"(\d+)"/i) || cleanHtml.match(/"id"\s*:\s*"(\d+)",\s*"name"\s*:\s*"[^"]+",\s*"origin_name"/i);
        if (idJsonMatch) {
            internalMovieId = idJsonMatch[1];
        }
        
        // 3. Móc ngoặc vào chuỗi JSON chứa danh sách tập và Link m3u8
        if (internalMovieId) {
            var epRegex = new RegExp('"movie_id"\\s*:\\s*"' + internalMovieId + '"\\s*,\\s*"server"\\s*:\\s*"([^"]+)"\\s*,\\s*"name"\\s*:\\s*"([^"]+)"\\s*,\\s*"slug"\\s*:\\s*"([^"]+)"\\s*,\\s*"type"\\s*:\\s*"([^"]+)"\\s*,\\s*"link"\\s*:\\s*"([^"]+)"', 'gi');
            var match;
            
            while ((match = epRegex.exec(cleanHtml)) !== null) {
                var srv = match[1].trim();
                var epNum = match[2].trim();
                var epType = match[4].trim(); // Thường là m3u8 hoặc embed
                var epLink = match[5].trim();
                
                // Khôi phục lại link nếu là dạng tương đối
                if (epLink.indexOf('http') === -1) {
                    epLink = BASEURL + (epLink.startsWith('/') ? '' : '/') + epLink;
                }
                
                if (!serversMap[srv]) serversMap[srv] = {};
                
                // Ưu tiên Server M3U8 hơn Embed (để app chạy Native cực mượt)
                if (!serversMap[srv][epNum] || (epType === 'm3u8' && serversMap[srv][epNum].type !== 'm3u8')) {
                    serversMap[srv][epNum] = {
                        id: epLink, // Bí quyết: Gán ID = Link Phát. Không cần cào tập con nữa!
                        name: isNaN(epNum) ? epNum : "Tập " + epNum,
                        slug: epNum,
                        type: epType
                    };
                }
            }
        }
        
        // 4. Định hình dữ liệu Server cho Vax
        for (var srvName in serversMap) {
            var epsArray = Object.values(serversMap[srvName]);
            // Sắp xếp tập theo thứ tự từ nhỏ đến lớn
            epsArray.sort(function(a, b) {
                var numA = parseFloat(a.slug.replace(/[^\d.]/g, '')) || 0;
                var numB = parseFloat(b.slug.replace(/[^\d.]/g, '')) || 0;
                return numA - numB;
            });
            servers.push({ name: srvName, episodes: epsArray });
        }
        
        // 5. Cứu cánh: Nếu JSON ngầm bị ẩn, thử móc iframe/m3u8 lộ ở trang chủ
        if (servers.length === 0) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            var m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8)/i);
            
            if (m3u8Match) {
                servers.push({ name: "Server Mặc Định", episodes: [{ id: m3u8Match[1], name: "Full", slug: "full" }] });
            } else if (iframeMatch) {
                var frameUrl = iframeMatch[1];
                if (frameUrl.indexOf('http') === -1) frameUrl = BASEURL + frameUrl;
                servers.push({ name: "Web Player", episodes: [{ id: frameUrl, name: "Full", slug: "full" }] });
            }
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
            servers: servers
        });
        
    } catch (e) {
        log(e);
        return JSON.stringify({ id: url || "error", title: "Lỗi tải phim", servers: [] });
    }
}

// =============================================================================
// TRÌNH PHÁT THÔNG MINH NATIVE AVPLAYER
// Không cần fetch trang web nữa, nhận thẳng link M3U8 từ hàm trên truyền xuống
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var isEmbed = false;
        var streamUrl = url;

        // Nếu link truyền vào không phải file video (.m3u8 hoặc .mp4) 
        // -> Buộc VaxApp mở iframe phụ nhúng web (isEmbed = true)
        if (streamUrl.indexOf('.m3u8') === -1 && streamUrl.indexOf('.mp4') === -1) {
            isEmbed = true; 
        }

        // Bơm script dọn quảng cáo lỡ như phải dùng iframe nhúng
        var antiAdScript = "";
        if (isEmbed) {
            antiAdScript = `
                document.documentElement.style.cssText = 'background:#000 !important;';
                document.body.style.cssText = 'background:#000 !important; margin:0; padding:0;';
                var vids = document.getElementsByTagName('video');
                for(var i=0; i<vids.length; i++) {
                    vids[i].setAttribute('playsinline', 'true');
                    vids[i].setAttribute('webkit-playsinline', 'true');
                }
            `;
        }

        // Quét trả về! App iOS sẽ dùng Native Player chạy cực êm
        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "headers": {
                "Referer": BASEURL + "/",
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            },
            "subtitles": [],
            "injectScript": antiAdScript
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
