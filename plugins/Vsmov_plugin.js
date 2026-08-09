// =============================================================================
// PLUGIN MOVIE SCRAPER: VSMOV.COM 
// CHIẾN THUẬT: API LẤY TẬP + SLUG TĨNH (LƯU LỊCH SỬ) + BÓC VỎ EMBED PHÁT NATIVE
// CẬP NHẬT: TÍCH HỢP TÌM KIẾM BẰNG API CHUẨN (GIỮ NGUYÊN CODE LÕI CỦA BẠN)
// =============================================================================

var DOMAIN = "https://vsmov.com";

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VsMov",
        "version": "1.9.3",
        "baseUrl": DOMAIN,
        "iconUrl": DOMAIN + "/favicon-vsm.png",
        "isEnabled": true,
        "type": "MOVIE"
        // Đã xóa "playerType": "embed" để trả lại quyền phát bằng Native Player
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

// CHỈ SỬA: SỬ DỤNG LINK API ĐỂ TÌM KIẾM NHANH NHẤT (THEO GỢI Ý CỦA BẠN)
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
    return DOMAIN + "/api/films/search?keyword=" + safeKeyword + "&page=" + page;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    var id = slug;
    if (slug.indexOf('/phim/') !== -1) id = slug.split('/phim/')[1].split('?')[0];
    else if (slug.indexOf('http') === 0) id = slug.split('/').pop().split('?')[0];
    
    // Gọi thẳng vào API mượt mà của VSMOV
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

// CHỈ SỬA: ĐỌC DỮ LIỆU JSON TỪ API TÌM KIẾM CỦA VSMOV
function parseSearchResponse(jsonString) {
    try {
        if (jsonString.trim().indexOf('{') === 0) {
            var data = JSON.parse(jsonString);
            if (data.status && data.items) {
                var items = [];
                // Nối tên miền ảnh nếu server trả về đường dẫn tương đối
                var imgDomain = data.APP_IMAGE_URL || data.pathImage || (DOMAIN + "/storage/images");
                
                for (var i = 0; i < data.items.length; i++) {
                    var item = data.items[i];
                    var thumb = item.thumb_url || item.poster_url || "";
                    if (thumb && thumb.indexOf("http") !== 0) {
                        thumb = imgDomain + "/" + thumb;
                    }

                    items.push({
                        // Truyền thẳng slug vào API chi tiết để click vào là mở phim ngay
                        id: DOMAIN + "/api/phim/" + item.slug,
                        title: item.name,
                        originalTitle: item.origin_name || "",
                        posterUrl: thumb,
                        backdropUrl: thumb,
                        episode_current: item.episode_current || "",
                        year: item.year || 0,
                        quality: item.quality || ""
                    });
                }
                
                var currentPage = data.paginate ? data.paginate.current_page : 1;
                var totalPages = data.paginate ? data.paginate.total_page : 1;
                
                return JSON.stringify({
                    items: items,
                    pagination: { currentPage: currentPage, totalPages: totalPages }
                });
            }
        }
    } catch (e) {}

    // Dự phòng an toàn: Rơi về cạo bằng HTML nếu API bị trục trặc
    return parseListResponse(jsonString);
}

// =============================================================================
// PHẦN CODE LÕI ĐANG CHẠY ỔN ĐỊNH CỦA BẠN (GIỮ NGUYÊN 100%)
// =============================================================================

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
                
                // Gán Slug Tĩnh để ứng dụng ghi nhớ lịch sử chuẩn xác
                var staticSlug = ep.slug || ("tap-" + (j + 1)); 

                if (mediaLink) {
                    serverEps.push({
                        // ID lúc này là đường link API cộng thêm tham số tập (?ep=tap-1)
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

function parseDetailResponse(html, url) {
    try {
        var targetUrl = "";
        
        var epSlugMatch = url.match(/\?ep=([^&]+)/);
        var epSlug = epSlugMatch ? epSlugMatch[1] : "";

        if (epSlug && html.trim().indexOf('{') === 0) {
            var data = JSON.parse(html);
            var epsList = data.episodes || [];
            
            for (var i = 0; i < epsList.length; i++) {
                var sData = epsList[i].server_data || epsList[i].list || [];
                for (var j = 0; j < sData.length; j++) {
                    var ep = sData[j];
                    var currentSlug = ep.slug || ("tap-" + (j + 1));
                    
                    if (currentSlug === epSlug) {
                        targetUrl = ep.link_embed || ep.embed || ep.link || "";
                        break;
                    }
                }
                if (targetUrl) break;
            }
        } else {
            targetUrl = url; 
        }

        if (targetUrl && targetUrl.indexOf("http") !== 0) {
            targetUrl = "https://vsmov.com" + (targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl);
        }

        return JSON.stringify({
            url: targetUrl, 
            isEmbed: true, 
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": DOMAIN + "/"
            }
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true });
    }
}

function parseEmbedResponse(html, url) {
    var subtitles = [];
    var videoUrl = "";

    function isSub(arr, u) {
        for(var i=0; i<arr.length; i++){ if(arr[i].url===u) return true; }
        return false;
    }

    try {
        var domain = url.match(/^(https?:\/\/[^\/]+)/i) ? url.match(/^(https?:\/\/[^\/]+)/i)[1] : "";

        var subRegex = /["'](https?:\/\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var subMatch;
        while ((subMatch = subRegex.exec(html)) !== null) {
            var sUrl = subMatch[1].replace(/\\/g, '');
            if (sUrl.indexOf('.m3u8') !== -1 || sUrl.indexOf('.mp4') !== -1) continue;
            if (!isSub(subtitles, sUrl)) subtitles.push({ url: sUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
        }

        var relSubRegex = /["'](\/[^"'\s]+\.(?:vtt|srt)[^"'\s]*)["']/gi;
        var rMatch;
        while ((rMatch = relSubRegex.exec(html)) !== null) {
            if (domain) {
                var sUrl2 = domain + rMatch[1].replace(/\\/g, '');
                if (sUrl2.indexOf('.m3u8') !== -1 || sUrl2.indexOf('.mp4') !== -1) continue;
                if (!isSub(subtitles, sUrl2)) subtitles.push({ url: sUrl2, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
            }
        }

        var tracksRegex = /tracks\s*:\s*\[(.*?)\]/gi;
        var trackMatch;
        while((trackMatch = tracksRegex.exec(html)) !== null) {
             var fileRegex = /"file"\s*:\s*"([^"]+)"/gi;
             var fMatch;
             while((fMatch = fileRegex.exec(trackMatch[1])) !== null) {
                 var tUrl = fMatch[1].replace(/\\/g, '');
                 if (tUrl.indexOf('.vtt') > -1 || tUrl.indexOf('.srt') > -1) {
                     if (tUrl.indexOf('http') !== 0 && domain) tUrl = domain + tUrl;
                     if (!isSub(subtitles, tUrl)) subtitles.push({ url: tUrl, name: "Vietsub " + (subtitles.length + 1), lang: "vi" });
                 }
             }
        }

        var vidRegex = /(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i;
        var matchVid = html.match(vidRegex);
        if (matchVid && matchVid[1]) {
            videoUrl = matchVid[1].replace(/\\/g, '');
        }

        if (videoUrl) {
            return JSON.stringify({
                url: videoUrl,
                isEmbed: false, 
                subtitles: subtitles, 
                headers: {
                    "Referer": url, 
                    "Origin": domain
                }
            });
        }

        return JSON.stringify({
            url: url,
            isEmbed: true,
            hook: true,
            embedtoplay: true,
            subtitles: subtitles, 
            script: "setTimeout(function(){document.body.click();var b=document.querySelector('.jw-video,.vjs-big-play-button,.plyr__control--overlaid,#player');if(b)b.click();var v=document.querySelector('video');if(v){v.muted=true;v.play();}},1000);"
        });

    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, hook: true, embedtoplay: true });
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
