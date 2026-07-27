// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://onflix.lol"; 
var BASEAPI = "https://k8s.onflixcdn.com/api";

function getManifest() {
	return JSON.stringify({
		"id": "onflix",
		"name": "Onflix",
		"description": "Bản Tối Ưu: Mượt trang chủ, Bắt link Regex chuẩn 100%",
		"version": "2.2.0", // Đổi version để ép App iOS xóa cache cũ
		"baseUrl": BASEURL,
		"iconUrl": BASEURL + "/app/asset/logo.png",
		"isEnabled": true,
		"isAdult": false,
		"type": "MOVIE",
		"layoutType": "VERTICAL",
		"playerType": "embedtoexoplay" // Dùng sức mạnh native VAX để chặn quảng cáo
	});
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[onflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[onflix] " + msg);
    }
}

// 1. FIX LAG TRANG CHỦ: Chỉ để 5 mục Hot nhất hiển thị ngoài trang chủ (1 Grid, 4 Trượt ngang)
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/movies?sort=newest&limit=24", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hanh-dong", "title": "Phim Hành Động", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=co-trang", "title": "Phim Cổ Trang", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tinh-cam", "title": "Phim Tình Cảm", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hoat-hinh", "title": "Hoạt Hình Anime", "type": "Horizontal" }
    ]);
}

// 2. Gom TOÀN BỘ 40+ folder còn lại vào Menu Thể Loại (Tránh lag trang chủ)
function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Phim Mới", "slug": "/movies?sort=newest&limit=24" },
        { "name": "Hành Động", "slug": "/movies?sort=year_desc&limit=24&category=action-&-adventure" },
        { "name": "Âm Nhạc", "slug": "/movies?sort=year_desc&limit=24&category=am-nhac" },
        { "name": "Bí Ẩn", "slug": "/movies?sort=year_desc&limit=24&category=bi-an" },
        { "name": "Chiến Tranh", "slug": "/movies?sort=year_desc&limit=24&category=chien-tranh" },
        { "name": "Chính Kịch", "slug": "/movies?sort=year_desc&limit=24&category=chinh-kich" },
        { "name": "Gameshow", "slug": "/movies?sort=year_desc&limit=24&category=chuong-trinh-truyen-hinh" },
        { "name": "Gây Cấn", "slug": "/movies?sort=year_desc&limit=24&category=gay-can" },
        { "name": "Gia Đình", "slug": "/movies?sort=year_desc&limit=24&category=gia-dinh" },
        { "name": "Giả Tưởng", "slug": "/movies?sort=year_desc&limit=24&category=gia-tuong" },
        { "name": "Hài Hước", "slug": "/movies?sort=year_desc&limit=24&category=hai-huoc" },
        { "name": "Học Đường", "slug": "/movies?sort=year_desc&limit=24&category=hoc-duong" },
        { "name": "Huyền Huyễn", "slug": "/movies?sort=year_desc&limit=24&category=huyen-huyen" },
        { "name": "Khoa Học", "slug": "/movies?sort=year_desc&limit=24&category=khoa-hoc" },
        { "name": "Kinh Dị", "slug": "/movies?sort=year_desc&limit=24&category=kinh-di" },
        { "name": "Kinh Điển", "slug": "/movies?sort=year_desc&limit=24&category=kinh-dien" },
        { "name": "Lãng Mạn", "slug": "/movies?sort=year_desc&limit=24&category=lang-man" },
        { "name": "LGBT", "slug": "/movies?sort=year_desc&limit=24&category=lgbt" },
        { "name": "Lịch Sử", "slug": "/movies?sort=year_desc&limit=24&category=lich-su" },
        { "name": "Miền Tây", "slug": "/movies?sort=year_desc&limit=24&category=mien-tay" },
        { "name": "Phim Hài", "slug": "/movies?sort=year_desc&limit=24&category=hai" },
        { "name": "Phim Ngắn", "slug": "/movies?sort=year_desc&limit=24&category=ngan" },
        { "name": "Phim Nhạc", "slug": "/movies?sort=year_desc&limit=24&category=nhac" },
        { "name": "Short Drama", "slug": "/movies?sort=year_desc&limit=24&category=short-drama" },
        { "name": "Sitcom", "slug": "/movies?sort=year_desc&limit=24&category=sitcom" },
        { "name": "Tài Liệu", "slug": "/movies?sort=year_desc&limit=24&category=tai-lieu" },
        { "name": "Talk", "slug": "/movies?sort=year_desc&limit=24&category=talk" },
        { "name": "Tâm Lý", "slug": "/movies?sort=year_desc&limit=24&category=tam-ly" },
        { "name": "Thần Thoại", "slug": "/movies?sort=year_desc&limit=24&category=than-thoai" },
        { "name": "Thần Tượng", "slug": "/movies?sort=year_desc&limit=24&category=than-tuong" },
        { "name": "Thể Thao", "slug": "/movies?sort=year_desc&limit=24&category=the-thao" },
        { "name": "Tiên Hiệp", "slug": "/movies?sort=year_desc&limit=24&category=tien-hiep" },
        { "name": "Tình Tiết", "slug": "/movies?sort=year_desc&limit=24&category=tinh-tiet" },
        { "name": "Tình Yêu", "slug": "/movies?sort=year_desc&limit=24&category=tinh-yeu-ngot-ngao" },
        { "name": "Tội Phạm", "slug": "/movies?sort=year_desc&limit=24&category=toi-pham" },
        { "name": "Trẻ Em", "slug": "/movies?sort=year_desc&limit=24&category=tre-em" },
        { "name": "Viễn Tưởng", "slug": "/movies?sort=year_desc&limit=24&category=vien-tuong" },
		{ "name": "Phim 18+", "slug": "/movies?sort=year_desc&limit=24&category=18-plus" },
        { "name": "Võ Thuật", "slug": "/movies?sort=year_desc&limit=24&category=vo-thuat" }
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
        let path = slug || "/movies?sort=newest&limit=24";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }
        
        // Trỏ thẳng API
        let resultUrl = BASEAPI + (path.startsWith('/') ? '' : '/') + path;

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl;
        
    } catch (e) {
        return BASEAPI + "/movies?sort=newest&limit=24";
    }
}

function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            let filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    
    let searchUrl = BASEAPI + "/search?q=" + encodeURIComponent(keyword.trim()) + "&type=all";
    if (page > 1) {
        searchUrl += "&page=" + page;
    }
    return searchUrl;
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

function parseListResponse(html, $url) {
    try {
        var items = [];
        
        var videoData = JSON.parse(html);
        var currentpg = videoData.pagination ? videoData.pagination.current_page : 1;
        var total_pages = videoData.pagination ? videoData.pagination.total_pages : 1;
        
        var dataList = videoData.data || videoData.items || videoData.movies || videoData;
        
        if (Array.isArray(dataList)) {
            for (var j = 0; j < dataList.length; j++) {
                var block = dataList[j];
                var itemSlug = block.slug || (block.link_url ? block.link_url.replace(/^\//, "") : "");
                if (!itemSlug) continue;

                var itemUrl = itemSlug.indexOf("http") === 0 ? itemSlug : BASEURL + "/phim/" + itemSlug.replace(/^phim\//, "");
                
                items.push({
                    "id": itemUrl,
                    "title": (block.title || block.name || "").trim(),
                    "posterUrl": block.poster_url || block.image_url || block.thumb_url || "",
                    "backdropUrl": block.thumb_url || block.background_url || block.poster_url || "",
                    "year": block.year || 2026,
                    "quality": block.quality || "HD",
                    "episode_current": block.episode_current || "Cập nhật",
                    "lang": block.lang || "Vietsub"
                });
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": currentpg,
                "totalPages": total_pages
            }
        });
        
    } catch (e) {
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, $url) {
    return parseListResponse(html, $url);
}


// 3. FIX LỖI TÌM TẬP PHIM: SIÊU REGEX CÀO PAYLOAD MÃ HÓA
function parseMovieDetail(html, $url) {
    try {
        var serversMap = {};
        
        // Giải mã chuỗi Next.js (Xóa các dấu gạch chéo ngược \)
        var cleanHtml = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

        // REGEX 1: Bắt các Object JSON chứa thông tin tập phim (Khớp 100% với Onflix)
        // Tìm cấu trúc: {"server_name":"Vietsub","name":"1","slug":"1","link_embed":"...","link_m3u8":"..."}
        var objRegex = /\{[^{]*?"server_name"\s*:\s*"[^"]+"[^{]*?"link_m3u8"\s*:\s*"[^"]*"[^{]*?\}/gi;
        var objMatches = cleanHtml.match(objRegex) || [];
        
        objMatches.forEach(function(str) {
            try {
                var ep = JSON.parse(str);
                if (ep.server_name && (ep.link_m3u8 || ep.link_embed)) {
                    var rawServerName = ep.server_name;
                    var cleanServerName = "Vietsub";
                    
                    if (rawServerName.includes("PA") || rawServerName.toLowerCase().includes("kk")) cleanServerName = "KK Phim";
                    else if (rawServerName.includes("OP") || rawServerName.toLowerCase().includes("ổ phim")) cleanServerName = "Ổ Phim";
                    else if (rawServerName.includes("NC") || rawServerName.toLowerCase().includes("nguồn c")) cleanServerName = "Nguồn C";
                    else if (rawServerName.toLowerCase().includes("thuyết minh")) cleanServerName = "Thuyết Minh";
                    else cleanServerName = rawServerName;

                    if (!serversMap[cleanServerName]) serversMap[cleanServerName] = {};

                    var streamLink = ep.link_m3u8;
                    if (!streamLink || streamLink.indexOf("https://ss.onflixstream.site") > -1) {
                        if (ep.link_embed) streamLink = ep.link_embed;
                    }

                    var epNameStr = ep.name || ep.slug || "1";
                    var epSlug = "tap-" + epNameStr;
                    var epDisplayName = epNameStr.toLowerCase().includes("tập") ? epNameStr : "Tập " + epNameStr;
                    
                    if (streamLink && streamLink !== "undefined" && streamLink !== "null" && !serversMap[cleanServerName][epSlug]) {
                        serversMap[cleanServerName][epSlug] = {
                            id: streamLink,            
                            name: epDisplayName,     
                            slug: epSlug        
                        };
                    }
                }
            } catch(e) {}
        });

        var servers = [];
        for (var sName in serversMap) {
            var epsArray = Object.values(serversMap[sName]);
            epsArray.sort((a, b) => {
                const numA = parseInt(a.name.replace(/[^\d]/g, '')) || 0;
                const numB = parseInt(b.name.replace(/[^\d]/g, '')) || 0;
                return numA - numB;
            });

            if (epsArray.length > 0) {
                servers.push({
                    name: sName,
                    episodes: epsArray
                });
            }
        }

        // Ưu tiên server
        servers.sort((a, b) => {
            const getPriority = (name) => {
                if (name.includes("KK Phim")) return 1;  
                if (name.includes("Ổ Phim")) return 2;    
                if (name.includes("Vietsub")) return 3;
                return 4;                                        
            };
            return getPriority(a.name) - getPriority(b.name);
        });

        // Xử lý Meta Tags (Tiêu đề, ảnh, mô tả)
        let title = "";
        let mTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (mTitle) title = mTitle[1].split('|')[0].trim();
        else title = "Phim Onflix";

        let poster = "";
        let mImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (mImg) poster = mImg[1];

        let desc = "";
        let mDesc = html.match(/<meta name="description" content="([^"]+)"/i);
        if (mDesc) desc = mDesc[1];

        return JSON.stringify({
            id: $url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD",
            year: 2026,
            status: servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Đang cập nhật",
            duration: "",
            casts: "",
            director: "",
            category: "",
            lang: "Vietsub",
            country: ""
        });
    } 
    catch (e) {
        return JSON.stringify({ id: $url, title: "Lỗi chi tiết phim", servers: [] });
    }
}

function parseDetailResponse(html, url) {
	try {
		var $stream = url;
		var isEmbed = $stream.indexOf(".m3u8") === -1 && $stream.indexOf(".mp4") === -1;
		
		return JSON.stringify({
			"url": $stream,
			"isEmbed": isEmbed,
			"mimeType": isEmbed ? "" : "application/x-mpegURL",
			"headers": {
				"Referer": BASEURL,
				"Origin": BASEURL,
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"Block-Ads": "true",
				"Block-Redirects": "true"
			},
			"subtitles": []
		});
		
	} catch (e) {
		return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
	}
}

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
