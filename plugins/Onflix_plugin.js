// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://onflix.lol"; 
var BASEAPI = "https://k8s.onflixcdn.com/api";

function getManifest() {
    return JSON.stringify({
        "id": "onflix",
        "name": "Onflix",
        "description": "Bản Master: Bắt chuẩn Link Stream bị giấu, 1 Folder Phim Mới.",
        "version": "2.0.3", 
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/app/asset/logo.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" 
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[onflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[onflix] " + msg);
    }
}

// 1. CHỈ ĐỂ DUY NHẤT 1 FOLDER PHIM MỚI NHƯ YÊU CẦU
function getHomeSections() {
    return JSON.stringify([
        { 
            "slug": "/movies?sort=newest&limit=24", 
            "title": "Phim Mới", 
            "type": "Grid" 
        }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Phim Mới", "slug": "/movies?sort=newest&limit=24" }
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

// Hàm lọc lấy đúng phim đang xem, TÌM CHÍNH XÁC MẢNG CHỨA LINK
function extractCleanData(data) {
    let result = { movie: null, episodes: [] };

    function traverse(node, isRelated) {
        if (!node) return;

        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.movie && typeof node.movie === 'object' && !result.movie && !isRelated) {
                result.movie = node.movie;
            }
            
            // Chỉ lấy mảng episodes nếu KHÔNG phải phim đề xuất
            if (Array.isArray(node.episodes) && node.episodes.length > 0 && !isRelated) {
                // Ưu tiên mảng có chứa link_m3u8 hoặc link_embed
                if (node.episodes[0].link_m3u8 || node.episodes[0].link_embed) {
                    result.episodes = node.episodes;
                } else if (result.episodes.length === 0) {
                    result.episodes = node.episodes;
                }
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

        // QUÉT TOÀN BỘ NEXT.JS PAYLOAD ĐỂ BẮT ĐƯỢC GÓI CHỨA LINK ẨN
        let regex = /self\.__next_f\.push\((\[.*?\])\)/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            try {
                let pushArgs = JSON.parse(match[1]);
                let rawString = pushArgs[1];
                if (typeof rawString === 'string') {
                    let cleanJsonStr = rawString.replace(/^\w+:/, '').replace(/\n$/, '');
                    let payload = JSON.parse(cleanJsonStr);
                    
                    let extracted = extractCleanData(payload);
                    if (extracted.movie && !movie) movie = extracted.movie;
                    
                    if (extracted.episodes && extracted.episodes.length > 0) {
                        // Chốt chặn quan trọng: Chỉ ghi đè nếu mảng tìm được CÓ CHỨA LINK STREAM
                        if (extracted.episodes[0].link_m3u8 || extracted.episodes[0].link_embed) {
                            episodesList = extracted.episodes;
                        } else if (episodesList.length === 0) {
                            episodesList = extracted.episodes;
                        }
                    }
                }
            } catch(e) {}
        }

        var actors = "";
        if (movie && movie.actors) {
            movie.actors.forEach(actor => { actors += actor.name + ", "; });
        }

        var serversMap = {};

        if (episodesList && Array.isArray(episodesList)) {
            episodesList.forEach(episode => {
                var rawServerName = episode.server_name || "Vietsub";
                var cleanServerName = "Vietsub";
                
                if (rawServerName.includes("PA") || rawServerName.toLowerCase().includes("kk")) cleanServerName = "KK Phim";
                else if (rawServerName.includes("OP") || rawServerName.toLowerCase().includes("ổ phim")) cleanServerName = "Ổ Phim";
                else if (rawServerName.includes("NC") || rawServerName.toLowerCase().includes("nguồn c")) cleanServerName = "Nguồn C";
                else if (rawServerName.toLowerCase().includes("thuyết minh")) cleanServerName = "Thuyết Minh";
                else cleanServerName = rawServerName;

                if (!serversMap[cleanServerName]) serversMap[cleanServerName] = {};

                // Lấy link trực tiếp
                var streamLink = episode.link_m3u8;
                if (!streamLink || streamLink.indexOf("https://ss.onflixstream.site") > -1) {
                    if (episode.link_embed) streamLink = episode.link_embed;
                }

                var epSlug = "tap-" + (episode.slug || episode.name || "1");
                
                // Chỉ nhận tập phim KHI CÓ LINK XEM THỰC SỰ
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

            // Gạt bỏ hoàn toàn server không có tập
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
            status: servers.length > 0 ? (servers[0].episodes.length + " Tập") : "Đang cập nhật",
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

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
