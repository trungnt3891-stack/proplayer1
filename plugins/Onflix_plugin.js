// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://onflix.lol"; 
var BASEAPI = "https://k8s.onflixcdn.com/api";

function getManifest() {
	return JSON.stringify({
		"id": "onflix",
		"name": "Onflix",
		"description": "Cập nhật danh sách hiển thị ngang ở trang chủ",
		"version": "2.1.0", // Đổi version để ép App iOS xóa cache cũ
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

// 1. THỂ HIỆN TRƯỢT NGANG (HORIZONTAL) TẤT CẢ CÁC FOLDER THEO YÊU CẦU
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/movies?sort=newest&limit=24", "title": "Phim Mới Cập Nhật", "type": "Grid" },
        { "slug": "/movies?sort=year_desc&limit=24&category=18-plus", "title": "Phim 18+", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=action-&-adventure", "title": "Action & Adventure", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=am-nhac", "title": "Âm Nhạc", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=bi-an", "title": "Bí Ẩn", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=chien-tranh", "title": "Chiến Tranh", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=chinh-kich", "title": "Chính Kịch", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=chuong-trinh-truyen-hinh", "title": "Chương Trình Truyền Hình", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=dang-cap-nhat", "title": "Đang Cập Nhật", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=gay-can", "title": "Gây Cấn", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=gia-dinh", "title": "Gia Đình", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=gia-tuong", "title": "Giả Tưởng", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hai-huoc", "title": "Hài Hước", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hanh-dong", "title": "Hành Động", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hoc-duong", "title": "Học Đường", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=huyen-huyen", "title": "Huyền Huyễn", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=khoa-hoc", "title": "Khoa Học", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=kinh-di", "title": "Kinh Dị", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=kinh-dien", "title": "Kinh Điển", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=lang-man", "title": "Lãng Mạn", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=lgbt", "title": "LGBT", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=lich-su", "title": "Lịch Sử", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=mien-tay", "title": "Miền Tây", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=hai", "title": "Phim Hài", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=ngan", "title": "Phim Ngắn", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=nhac", "title": "Phim Nhạc", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=short-drama", "title": "Short Drama", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=sitcom", "title": "Sitcom", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tai-lieu", "title": "Tài Liệu", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=talk", "title": "Talk", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tam-ly", "title": "Tâm Lý", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=than-thoai", "title": "Thần Thoại", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=than-tuong", "title": "Thần Tượng", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=the-thao", "title": "Thể Thao", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tien-hiep", "title": "Tiên Hiệp", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tinh-cam", "title": "Tình Cảm", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tinh-tiet", "title": "Tình Tiết", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tinh-yeu-ngot-ngao", "title": "Tình Yêu Ngọt Ngào", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=toi-pham", "title": "Tội Phạm", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=tre-em", "title": "Trẻ Em", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=vien-tuong", "title": "Viễn Tưởng", "type": "Horizontal" },
        { "slug": "/movies?sort=year_desc&limit=24&category=vo-thuat", "title": "Võ Thuật", "type": "Horizontal" }
    ]);
}

// 2. CHUẨN HÓA DANH SÁCH THỂ LOẠI
function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Phim Mới", "slug": "/movies?sort=newest&limit=24" },
        { "name": "Phim 18+", "slug": "/movies?sort=year_desc&limit=24&category=18-plus" },
        { "name": "Action & Adventure", "slug": "/movies?sort=year_desc&limit=24&category=action-&-adventure" },
        { "name": "Âm Nhạc", "slug": "/movies?sort=year_desc&limit=24&category=am-nhac" },
        { "name": "Bí Ẩn", "slug": "/movies?sort=year_desc&limit=24&category=bi-an" },
        { "name": "Chiến Tranh", "slug": "/movies?sort=year_desc&limit=24&category=chien-tranh" },
        { "name": "Chính Kịch", "slug": "/movies?sort=year_desc&limit=24&category=chinh-kich" },
        { "name": "Chương Trình Truyền Hình", "slug": "/movies?sort=year_desc&limit=24&category=chuong-trinh-truyen-hinh" },
        { "name": "Đang Cập Nhật", "slug": "/movies?sort=year_desc&limit=24&category=dang-cap-nhat" },
        { "name": "Gây Cấn", "slug": "/movies?sort=year_desc&limit=24&category=gay-can" },
        { "name": "Gia Đình", "slug": "/movies?sort=year_desc&limit=24&category=gia-dinh" },
        { "name": "Giả Tưởng", "slug": "/movies?sort=year_desc&limit=24&category=gia-tuong" },
        { "name": "Hài Hước", "slug": "/movies?sort=year_desc&limit=24&category=hai-huoc" },
        { "name": "Hành Động", "slug": "/movies?sort=year_desc&limit=24&category=hanh-dong" },
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
        { "name": "Tình Cảm", "slug": "/movies?sort=year_desc&limit=24&category=tinh-cam" },
        { "name": "Tình Tiết", "slug": "/movies?sort=year_desc&limit=24&category=tinh-tiet" },
        { "name": "Tình Yêu Ngọt Ngào", "slug": "/movies?sort=year_desc&limit=24&category=tinh-yeu-ngot-ngao" },
        { "name": "Tội Phạm", "slug": "/movies?sort=year_desc&limit=24&category=toi-pham" },
        { "name": "Trẻ Em", "slug": "/movies?sort=year_desc&limit=24&category=tre-em" },
        { "name": "Viễn Tưởng", "slug": "/movies?sort=year_desc&limit=24&category=vien-tuong" },
        { "name": "Võ Thuật", "slug": "/movies?sort=year_desc&limit=24&category=vo-thuat" }
    ]);
}

function getFilterConfig() { 
    return JSON.stringify({}); // Trả về rỗng để tránh lỗi bộ lọc
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
        
        // Luôn trỏ thẳng vào API để nhận JSON cho nhanh và không bị lỗi
        let resultUrl = BASEAPI + (path.startsWith('/') ? '' : '/') + path;

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl;
        
    } catch (e) {
        return BASEAPI + "/movies?sort=newest&limit=24";
    }
}

// 3. FIX LỖI TÌM KIẾM: Gọi thẳng vào API backend thay vì frontend HTML
function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            let filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    
    // API chuẩn của website Onflix: https://k8s.onflixcdn.com/api/search?q=...
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
        
        // Vì toàn bộ getUrlList & getUrlSearch đều gọi vào API -> Dữ liệu chắc chắn là JSON
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
    // API Search trả về JSON giống hệt API List, gọi chung 1 hàm
    return parseListResponse(html, $url);
}

function parseNextPayload(raw) {
    try {
        const match = raw.match(/self\.__next_f\.push\((.*)\)/);
        if (!match) return null;

        const pushArgs = JSON.parse(match[1]); 
        const rawString = pushArgs[1];
        const cleanJsonStr = rawString.replace(/^\w+:/, '').replace(/\n$/, '');

        return JSON.parse(cleanJsonStr);
    } catch (e) {
        return null;
    }
}

// Hàm lọc lấy đúng phim đang xem, bỏ qua phim đề xuất (related)
function extractCleanData(data) {
    let result = { movie: null, episodes: [] };

    function traverse(node, isRelated) {
        if (!node) return;

        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.movie && typeof node.movie === 'object' && !result.movie && !isRelated) {
                result.movie = node.movie;
            }
            if (Array.isArray(node.episodes) && node.episodes.length > 0 && result.episodes.length === 0 && !isRelated) {
                result.episodes = node.episodes;
            }

            for (let key in node) {
                if (node.hasOwnProperty(key)) {
                    traverse(node[key], isRelated || key === 'related' || key === 'collection');
                }
            }
        } else if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                traverse(node[i], isRelated);
            }
        }
    }

    traverse(data, false);
    return result;
}

function parseMovieDetail(html, $url) {
    try {
        let movie = null;
        let episodesList = [];

        // 1. Quét thẻ __NEXT_DATA__
        let nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
        if (nextDataMatch) {
            try {
                let nextJson = JSON.parse(nextDataMatch[1]);
                let extracted = extractCleanData(nextJson);
                if (extracted.movie) movie = extracted.movie;
                if (extracted.episodes) episodesList = extracted.episodes;
            } catch (err) {}
        }

        // 2. Quét Next.js RSC payload (bổ trợ)
        if (!movie || episodesList.length === 0) {
            var scripts = _$(html).find("script").elements;
            for (let i = 0; i < scripts.length; i++) {
                let scrText = _$(scripts[i]).text();
                if (scrText.indexOf("self.__next_f.push") > -1) {
                    let parsedPayload = parseNextPayload(scrText);
                    if (parsedPayload) {
                        let clean = extractCleanData(parsedPayload);
                        if (!movie && clean.movie) movie = clean.movie;
                        if (episodesList.length === 0 && clean.episodes && clean.episodes.length > 0) {
                            episodesList = clean.episodes;
                        }
                    }
                }
            }
        }

        var actors = "";
        if (movie && movie.actors) {
            movie.actors.forEach(actor => { actors += actor.name + ", "; });
        }

        // 3. Quét Payload Embed (Vì Onflix thường giấu link trong payload khác)
        var scriptEmbed = _$(html).find("script:content('\"link_embed\\\":\\\"http')").text();
        if (!scriptEmbed) {
            scriptEmbed = _$(html).find("script:content('\"link_m3u8\\\":\\\"http')").text();
        }
        var rawVDEmbed = parseNextPayload(scriptEmbed);
        var embedData = extractCleanData(rawVDEmbed);
        
        var $listEpi = (embedData.episodes && embedData.episodes.length > 0) ? embedData.episodes : episodesList;
        var serversMap = {};

        if ($listEpi && Array.isArray($listEpi)) {
            $listEpi.forEach(episode => {
                var rawServerName = episode.server_name || "Vietsub";
                var cleanServerName = "Vietsub";
                
                if (rawServerName.includes("PA") || rawServerName.toLowerCase().includes("kk")) cleanServerName = "KK Phim";
                else if (rawServerName.includes("OP") || rawServerName.toLowerCase().includes("ổ phim")) cleanServerName = "Ổ Phim";
                else if (rawServerName.includes("NC") || rawServerName.toLowerCase().includes("nguồn c")) cleanServerName = "Nguồn C";
                else if (rawServerName.toLowerCase().includes("thuyết minh")) cleanServerName = "Thuyết Minh";
                else cleanServerName = rawServerName;

                if (!serversMap[cleanServerName]) serversMap[cleanServerName] = {};

                var streamLink = episode.link_m3u8;
                if (!streamLink || streamLink.indexOf("https://ss.onflixstream.site") > -1) {
                    if (episode.link_embed) streamLink = episode.link_embed;
                }

                var epSlug = "tap-" + (episode.slug || episode.name || "1");
                
                // Chống đẩy link rỗng vào mảng
                if (streamLink && streamLink !== "undefined" && streamLink !== "null" && !serversMap[cleanServerName][epSlug]) {
                    serversMap[cleanServerName][epSlug] = {
                        id: streamLink,            
                        name: "Tập " + (episode.slug || episode.name || "1"),     
                        slug: epSlug        
                    };
                }
            });
        }

        var servers = [];
        for (var sName in serversMap) {
            var epsArray = Object.values(serversMap[sName]);
            epsArray.sort((a, b) => {
                const numA = parseInt(a.name.replace(/[^\d]/g, '')) || 0;
                const numB = parseInt(b.name.replace(/[^\d]/g, '')) || 0;
                return numA - numB;
            });

            // Chỉ thêm server nếu có ít nhất 1 tập phim
            if (epsArray.length > 0) {
                servers.push({
                    name: sName,
                    episodes: epsArray
                });
            }
        }

        servers.sort((a, b) => {
            const getPriority = (name) => {
                if (name.includes("KK Phim")) return 1;  
                if (name.includes("Ổ Phim")) return 2;    
                if (name.includes("Vietsub")) return 3;
                return 4;                                        
            };
            return getPriority(a.name) - getPriority(b.name);
        });

        // Xử lý Meta Tags nếu Next payload bị tịt
        let title = movie ? movie.title : "";
        if (!title) {
            let mTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
            title = mTitle ? mTitle[1].split('|')[0].trim() : "Phim Onflix";
        }

        let poster = movie ? movie.poster_url : "";
        if (!poster) {
            let mImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
            poster = mImg ? mImg[1] : "";
        }

        let desc = movie ? movie.content : "";
        if (!desc) {
            let mDesc = html.match(/<meta name="description" content="([^"]+)"/i);
            desc = mDesc ? mDesc[1] : "";
        }

        return JSON.stringify({
            id: $url,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: movie ? movie.quality : "HD",
            year: movie ? movie.year : 2026,
            status: servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Cập nhật",
            duration: movie ? movie.time : "",
            casts: actors,
            director: movie ? movie.directors : "",
            category: movie && movie.categories && movie.categories[0] ? movie.categories[0].name : "",
            lang: movie ? movie.lang : "Vietsub",
            country: movie && movie.countries && movie.countries[0] ? movie.countries[0].name : ""
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

// =============================================================================
// DOM LIBRARY _$
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match( /:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[ 3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match( /\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/ );if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);selectorToParse = selectorToParse.substring(0, idIndex) + ( nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} var isAttrOnly = (selector === "" && hasAttrFilter);for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = currentHtml.indexOf('>',pos);if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = "";if (spacePos === -1) {currentTagName = fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase();} else {currentTagName = fullOpenTag.substring(1,spacePos) .toLowerCase();} var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} if (isMatched && targetId) {var idMatchStr = "";var idPos = fullOpenTag.indexOf('id="');if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag .indexOf('"',startQuote));} else {idPos = fullOpenTag.indexOf("id='");if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (idMatchStr !== targetId) {isMatched = false;}} if (isMatched && targetClasses.length > 0) {var classMatchStr = "";var classPos = fullOpenTag.indexOf('class="');if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {classPos = fullOpenTag.indexOf("class='");if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {attrPos = fullOpenTag.indexOf(attrNameFilter + "='");if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (attrPos === -1) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta' ];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr .length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter) === -1) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[ 0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[ subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var searchStr = attrName + '="';var pos = elem.indexOf(searchStr);if (pos === -1) {searchStr = attrName + "='";pos = elem.indexOf(searchStr);} if (pos === -1) return "";var start = pos + searchStr.length;var quoteType = elem.charAt(start - 1);var end = elem.indexOf(quoteType,start);return end === -1 ? "" : elem.substring(start,end);},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) return elem.substring(start,end);return "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();} return "";}};return instance;}
