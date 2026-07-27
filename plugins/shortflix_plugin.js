// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://www.shortflix.net";

function getManifest() {
    return JSON.stringify({
        "id": "shortflix",
        "name": "ShortFlix",
        "description": "Siêu phẩm Phim Ngắn. Hỗ trợ vuốt chuyển tập TikTok, 1080p siêu tốc.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/images/shortflix-img.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm",           // BẮT BUỘC: Kích hoạt chế độ xoay dọc và vuốt lên/xuống (TikTok style)
        "layoutType": "VERTICAL",
        "playerType": "exoplayer"      // BẮT BUỘC: Trả thẳng link m3u8 vào ExoPlayer để phát ngay lập tức
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[shortflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[shortflix] " + msg);
    }
}

// 1. CHỈ ĐỂ 5 MỤC NỔI BẬT Ở TRANG CHỦ CHỐNG LAG (1 Grid, 4 Vuốt ngang)
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/vi/home", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "/vi/genres/ngon-tinh", "title": "Ngôn Tình Tuyển Chọn", "type": "Horizontal" },
        { "slug": "/vi/genres/sung-ngot", "title": "Sủng Ngọt", "type": "Horizontal" },
        { "slug": "/vi/genres/nguoc-luyen", "title": "Ngược Luyến", "type": "Horizontal" },
        { "slug": "/vi/genres/bao-thu", "title": "Báo Thù - Rửa Hận", "type": "Horizontal" }
    ]);
}

// 2. GIẤU TOÀN BỘ CÁC DANH MỤC CÒN LẠI VÀO TRONG MENU THỂ LOẠI
function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Trang Chủ", "slug": "/vi/home" },
        { "name": "Phim Mới", "slug": "/vi/genres?sortBy=last_episode_at" },
        { "name": "Đang Thịnh Hành", "slug": "/vi/genres?sortBy=trending" },
        { "name": "Ngôn Tình", "slug": "/vi/genres/ngon-tinh" },
        { "name": "Huyền Huyễn", "slug": "/vi/genres/huyen-huyen" },
        { "name": "Sủng Ngọt", "slug": "/vi/genres/sung-ngot" },
        { "name": "Gia Đình", "slug": "/vi/genres/gia-dinh" },
        { "name": "Cổ Đại", "slug": "/vi/genres/co-dai" },
        { "name": "Ngược Luyến", "slug": "/vi/genres/nguoc-luyen" },
        { "name": "Báo Thù", "slug": "/vi/genres/bao-thu" },
        { "name": "Sự Trở Lại", "slug": "/vi/genres/su-tro-lai" },
        { "name": "Vươn Lên Từ Số Không", "slug": "/vi/genres/vuon-len-tu-so-khong" },
        { "name": "Tổng Tài", "slug": "/vi/genres/rich-family" },
        { "name": "One Night Stand", "slug": "/vi/genres/one-night-stand" },
        { "name": "Giả Tưởng", "slug": "/vi/genres/fantasy" }
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

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl;
        
    } catch (e) {
        return BASEURL + "/vi/home";
    }
}

function getUrlSearch(keyword, filtersJson) {
    // API Search của ShortFlix
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
// PARSERS LÕI (BÓC TÁCH PAYLOAD NEXT.JS)
// =============================================================================

// Hàm trích xuất dữ liệu ẩn trong React Server Components (Next.js)
function extractJsonPayloads(html) {
    let payloads = [];
    let regex = /self\.__next_f\.push\(\[(.*?)\]\)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        try {
            // Bao bọc thành mảng và parse an toàn
            let parsedArr = JSON.parse("[" + match[1] + "]");
            let rawString = parsedArr[1];
            if (typeof rawString === 'string') {
                // Xóa các tiền tố rác của RSC (vd: "1:", "d:", "b:")
                let cleanStr = rawString.replace(/^[a-zA-Z0-9]+:/, '').trim();
                if (cleanStr.startsWith('{') || cleanStr.startsWith('[')) {
                    payloads.push(JSON.parse(cleanStr));
                }
            }
        } catch(e) {}
    }
    return payloads;
}

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        // Lấy tất cả Payload giấu trong HTML
        let payloads = extractJsonPayloads(html);

        // Hàm Đệ Quy quét sâu vào Payload để gom danh sách phim
        function traverseList(node) {
            if (!node) return;
            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) traverseList(node[i]);
            } else if (typeof node === 'object') {
                // Nhận dạng chuẩn 1 object phim của ShortFlix
                if (node.id && node.title && node.slug && node.thumbnailUrl) {
                    let link = "/vi/videos/" + node.slug;
                    let fullUrl = BASEURL + link;
                    
                    if (!seen[fullUrl]) {
                        // Tính toán hiển thị số lượng người xem (viewCount)
                        let viewText = "HD";
                        if (node.viewCount !== undefined) {
                            viewText = node.viewCount >= 1000 ? Math.floor(node.viewCount/1000) + "K Lượt xem" : node.viewCount + " Xem";
                        }

                        items.push({
                            id: fullUrl,
                            title: node.title.trim(),
                            posterUrl: node.thumbnailUrl,
                            backdropUrl: node.thumbnailUrl,
                            quality: "1080p",
                            episode_current: viewText,
                            lang: "Vietsub",
                            year: 2026
                        });
                        seen[fullUrl] = true;
                    }
                }
                for (let key in node) traverseList(node[key]);
            }
        }

        payloads.forEach(traverseList);
        
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

function parseMovieDetail(html, $url) {
    try {
        let movieInfo = {};
        let episodesRaw = [];

        // Lấy Payload
        let payloads = extractJsonPayloads(html);

        // Đệ quy tìm Object Phim chứa tập phim (Episodes)
        function traverseDetail(node) {
            if (!node) return;
            if (Array.isArray(node)) {
                for (let i = 0; i < node.length; i++) traverseDetail(node[i]);
            } else if (typeof node === 'object') {
                // Bắt đối tượng chứa phim và các tập
                if (node.title && node.slug && node.episodes && Array.isArray(node.episodes)) {
                    movieInfo.title = node.title;
                    movieInfo.poster = node.thumbnailUrl;
                    movieInfo.desc = node.description;
                    episodesRaw = node.episodes;
                }
                for (let key in node) traverseDetail(node[key]);
            }
        }

        payloads.forEach(traverseDetail);

        let episodes = [];
        
        // 3. XỬ LÝ TẬP PHIM VÀ LẤY DIRECT LINK 1080p
        episodesRaw.forEach(ep => {
            let streamUrl = "";
            
            // ShortFlix giấu link m3u8 cực ngon trong mảng versions
            if (ep.versions && ep.versions.length > 0) {
                streamUrl = ep.versions[0].videoUrl; // Link .m3u8 trực tiếp!
            }
            
            if (streamUrl && streamUrl.startsWith("http")) {
                let epNum = ep.episodeNumber;
                
                // XỬ LÝ TẬP 0 (THƯỜNG LÀ TRAILER THEO YÊU CẦU CỦA BẠN)
                let epName = epNum === 0 ? "Trailer / Tập 0" : "Tập " + epNum;
                
                episodes.push({
                    id: streamUrl, // Ném THẲNG link m3u8 vào ID để VAX phát ngay không cần nghĩ!
                    name: epName,
                    slug: "tap-" + epNum
                });
            }
        });

        // Đảm bảo tập phim xếp chuẩn (0 -> 1 -> 2...)
        episodes.sort((a, b) => {
            let numA = parseInt(a.slug.replace("tap-", "")) || 0;
            let numB = parseInt(b.slug.replace("tap-", "")) || 0;
            return numA - numB;
        });

        let servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "ShortFlix 1080P",
                episodes: episodes
            });
        }

        // Nếu thiếu Meta Info, cào dự phòng từ thẻ Meta
        if (!movieInfo.title) {
            let mTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
            movieInfo.title = mTitle ? mTitle[1].replace(/\|.*$/, "").trim() : "Phim Ngắn";
        }
        if (!movieInfo.poster) {
            let mImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            movieInfo.poster = mImg ? mImg[1] : "";
        }
        if (!movieInfo.desc) {
            let mDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
            movieInfo.desc = mDesc ? mDesc[1] : "";
        }

        return JSON.stringify({
            id: $url,
            title: movieInfo.title,
            posterUrl: movieInfo.poster,
            backdropUrl: movieInfo.poster,
            description: movieInfo.desc,
            servers: servers,
            quality: "1080p",
            year: 2026,
            status: episodes.length > 0 ? (episodes.length + " Tập") : "Đang cập nhật",
            category: "Phim Ngắn Dọc",
            lang: "Vietsub"
        });

    } catch (e) {
        return JSON.stringify({ id: $url, title: "Lỗi chi tiết", servers: [] });
    }
}

// Hàm cuối: Vì Link M3U8 đã được truyền thẳng qua id của Tập phim, ta chỉ cần khai báo cho ExoPlayer phát
function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            "url": url,                 // Nhận lại link m3u8 từ id tập phim
            "isEmbed": false,           // BẮT BUỘC false ĐỂ KÍCH HOẠT VUỐT DỌC TIKTOK
            "mimeType": "application/x-mpegURL", // Báo cho ExoPlayer biết đây là luồng HLS
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

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
