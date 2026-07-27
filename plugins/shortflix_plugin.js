// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://www.shortflix.net"; 

function getManifest() {
    return JSON.stringify({
        "id": "shortflix",
        "name": "ShortFlix",
        "description": "Siêu phẩm Phim Ngắn. Hỗ trợ vuốt chuyển tập TikTok, chất lượng 1080p siêu tốc.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/images/shortflix-img.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm",           // KÍCH HOẠT CHẾ ĐỘ VUỐT DỌC TIKTOK
        "layoutType": "VERTICAL",
        "playerType": "exoplayer"      // PHÁT NATIVE SIÊU NHANH BẰNG EXOPLAYER
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[shortflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[shortflix] " + msg);
    }
}

// Giao diện trang chủ mượt mà
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/vi/home", "title": "Phim Ngắn Nổi Bật", "type": "Grid" },
        { "slug": "/vi/genres?sortBy=last_episode_at", "title": "Mới Cập Nhật", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Trang Chủ", "slug": "/vi/home" },
        { "name": "Mới Cập Nhật", "slug": "/vi/genres?sortBy=last_episode_at" },
        { "name": "Huyền Huyễn", "slug": "/vi/genres/huyen-huyen" },
        { "name": "Ngôn Tình", "slug": "/vi/genres/ngon-tinh" },
        { "name": "Sủng Ngọt", "slug": "/vi/genres/sung-ngot" },
        { "name": "Gia Đình", "slug": "/vi/genres/gia-dinh" },
        { "name": "Cổ Đại", "slug": "/vi/genres/co-dai" },
        { "name": "Ngược Luyến", "slug": "/vi/genres/nguoc-luyen" },
        { "name": "Báo Thù", "slug": "/vi/genres/bao-thu" },
        { "name": "Sự Trở Lại", "slug": "/vi/genres/su-tro-lai" },
        { "name": "Vươn Lên Từ Số Không", "slug": "/vi/genres/vuon-len-tu-so-khong" }
    ]);
}

function getFilterConfig() { 
    return JSON.stringify({}); 
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        let page = 1;
        let path = slug || "/vi/home";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }
        
        let resultUrl = BASEURL + (path.startsWith('/') ? '' : '/') + path;

        // Xử lý page (ShortFlix dùng ?page= hoặc &page= tùy ngữ cảnh)
        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl;
        
    } catch (e) {
        return BASEURL + "/vi/home";
    }
}

function getUrlSearch(keyword, filtersJson) {
    // API Search của ShortFlix thường nhúng thẳng vào URL
    return BASEURL + "/vi/search?q=" + encodeURIComponent(keyword.trim());
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + (slug.startsWith('/') ? '' : '/') + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

// HÀM LÕI 1: Bóc tách chuỗi JSON Payload của Next.js
function extractNextJsPayloads(html) {
    let dataBlocks = [];
    let regex = /self\.__next_f\.push\(\[(.*?)\]\)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        try {
            // Bao bọc lại thành mảng JSON chuẩn để parse
            let parsedArr = JSON.parse("[" + match[1] + "]");
            let rawString = parsedArr[1];
            if (typeof rawString === 'string') {
                // Xóa tiền tố định danh (vd: "1:", "d:", "b:")
                let cleanJsonStr = rawString.replace(/^[0-9a-zA-Z]+:/, '').replace(/\n$/, '');
                dataBlocks.push(JSON.parse(cleanJsonStr));
            }
        } catch (e) {}
    }
    return dataBlocks;
}

// HÀM LÕI 2: Quét đệ quy tìm Video Objects
function findVideosRecursive(obj, itemsArray, seenDict) {
    if (!obj) return;
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) findVideosRecursive(obj[i], itemsArray, seenDict);
    } else if (typeof obj === 'object') {
        // Đặc điểm của một đối tượng phim trên ShortFlix
        if (obj.slug && obj.title && obj.thumbnailUrl) {
            let url = "/vi/videos/" + obj.slug;
            let fullUrl = BASEURL + url;
            
            if (!seenDict[fullUrl]) {
                // Tạo một luợt xem mượt mà (VD: 154292 -> 154K)
                let viewText = "HD";
                if (obj.viewCount) {
                    viewText = (obj.viewCount >= 1000) ? Math.floor(obj.viewCount / 1000) + "K views" : obj.viewCount + " views";
                }

                itemsArray.push({
                    id: fullUrl,
                    title: obj.title,
                    posterUrl: obj.thumbnailUrl,
                    backdropUrl: obj.thumbnailUrl,
                    quality: "HD",
                    episode_current: viewText,
                    lang: "Vietsub",
                    year: new Date().getFullYear()
                });
                seenDict[fullUrl] = true;
            }
        }
        for (let key in obj) {
            findVideosRecursive(obj[key], itemsArray, seenDict);
        }
    }
}

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        // 1. Quét từ Payload ngầm của Next.js
        let payloads = extractNextJsPayloads(html);
        payloads.forEach(payload => {
            findVideosRecursive(payload, items, seen);
        });

        // 2. Dự phòng: Quét từ API JSON thẳng (nếu có gọi API)
        if (items.length === 0 && html.trim().startsWith("{")) {
            let data = JSON.parse(html);
            findVideosRecursive(data, items, seen);
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": items.length > 0 ? 99 : 1
            }
        });
        
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html, $url) {
    return parseListResponse(html, $url);
}

// HÀM LÕI 3: Quét tìm thông tin chi tiết phim
function findMovieDetailRecursive(obj, resultObj) {
    if (!obj) return;
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) findMovieDetailRecursive(obj[i], resultObj);
    } else if (typeof obj === 'object') {
        // Bắt object chính chứa mảng episodes
        if (obj.slug && obj.episodes && Array.isArray(obj.episodes)) {
            if (!resultObj.data) resultObj.data = obj;
        }
        // Trường hợp object bọc ngoài tên là "video"
        if (obj.video && typeof obj.video === 'object' && obj.video.episodes) {
            if (!resultObj.data) resultObj.data = obj.video;
        }
        for (let key in obj) {
            findMovieDetailRecursive(obj[key], resultObj);
        }
    }
}

function parseMovieDetail(html, $url) {
    try {
        let movieData = { data: null };

        let payloads = extractNextJsPayloads(html);
        payloads.forEach(payload => {
            findMovieDetailRecursive(payload, movieData);
        });

        let movie = movieData.data;

        let episodes = [];
        if (movie && movie.episodes) {
            movie.episodes.forEach(ep => {
                let streamUrl = "";
                
                // MÓC TRỰC TIẾP LINK M3U8 TỪ MẢNG VERSIONS!!!
                if (ep.versions && ep.versions.length > 0) {
                    streamUrl = ep.versions[0].videoUrl;
                }

                // Nếu có link m3u8, đưa thẳng vào ID để VAX phát luôn
                if (streamUrl && streamUrl.startsWith("http")) {
                    episodes.push({
                        id: streamUrl, 
                        name: "Tập " + ep.episodeNumber,
                        slug: "tap-" + ep.episodeNumber
                    });
                }
            });
        }

        // Đảm bảo tập phim được sắp xếp tăng dần
        episodes.sort((a, b) => {
            const numA = parseInt(a.name.replace(/[^\d]/g, '')) || 0;
            const numB = parseInt(b.name.replace(/[^\d]/g, '')) || 0;
            return numA - numB;
        });

        let servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "ShortFlix VIP",
                episodes: episodes
            });
        }

        // Bóc Meta tags nếu JSON bị thiếu
        let title = movie ? movie.title : "";
        if (!title) {
            let mTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
            title = mTitle ? mTitle[1].replace(/\|.*$/, "").trim() : "Phim Ngắn";
        }

        let poster = movie ? movie.thumbnailUrl : "";
        if (!poster) {
            let mImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            poster = mImg ? mImg[1] : "";
        }

        let desc = movie ? movie.description : "";
        if (!desc) {
            let mDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
            desc = mDesc ? mDesc[1] : "";
        }
        
        let tags = [];
        if (movie && movie.tags) {
            movie.tags.forEach(t => tags.push(t.title));
        }

        return JSON.stringify({
            id: $url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "1080p",
            year: new Date().getFullYear(),
            status: servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Đang cập nhật",
            category: tags.length > 0 ? tags.join(", ") : "Phim Ngắn",
            lang: "Vietsub"
        });

    } catch (e) {
        return JSON.stringify({ id: $url, title: "Lỗi dữ liệu", servers: [] });
    }
}

// BƯỚC CUỐI: TRẢ VỀ LINK M3U8 NATIVE CHO TRÌNH PHÁT VUỐT DỌC
function parseDetailResponse(html, url) {
    try {
        // Do hàm parseMovieDetail đã truyền thẳng link m3u8 vào biến "url"
        // Nên ở đây ta chỉ cần trả lại đúng cái URL đó, khai báo isEmbed: false
        return JSON.stringify({
            "url": url,
            "isEmbed": false,
            "mimeType": "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": false });
    }
}

// CÁC HÀM CƠ BẢN
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// Menu JSON Fallback
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
