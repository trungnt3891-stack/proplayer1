// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://onflix.lat";
var BASEAPI = "https://k8s.onflixcdn.com/api";

function getManifest() {
    return JSON.stringify({
        "id": "onflix",
        "name": "Onflix",
        "description": "Bản Master: Fix Search, Cào RSC Next.js, Chặn Server Rỗng",
        "version": "1.9.0",
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/app/asset/logo.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[onflix] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[onflix] " + msg);
    }
}

// Giữ duy nhất 1 mục Phim Mới theo yêu cầu của bạn
function getHomeSections() {
    var listurl = `
/movies?sort=newest&limit=24@@Phim Mới Cập Nhật@@true
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
        if (slug && (slug.indexOf("http") > -1 || slug.indexOf("search") > -1)) {
            return slug;
        }
        let page = 1;
        let path = slug || "";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }
        
        // Gọi thẳng vào API để lấy danh sách cho chuẩn
        let resultUrl = BASEAPI;
        if (path && path.indexOf("/themes/") === 0) {
            resultUrl = BASEURL + path; // Các themes phải gọi từ frontend
        } else if (path) {
            resultUrl += path;
        }

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
        
    } catch (e) {
        return BASEURL + (slug ? "/" + slug : "");
    }
}

// ĐÃ SỬA: Hàm search khớp với frontend của website
function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            let filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    
    // Gửi search query lên frontend
    let searchUrl = BASEURL + "/tim-kiem?search=" + encodeURIComponent(keyword.trim());
    if (page > 1) searchUrl += "&page=" + page;
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
        var seen = {};

        // 1. Quét Dữ Liệu Từ RSC Payload (Trang Chủ & Tìm Kiếm Frontend)
        // Lấy tất cả các object JSON chứa link_url và title từ chuỗi thô của Next.js
        var rscBlocks = html.match(/\{[^{}]*"link_url"[^{}]*"title"[^{}]*\}/gi) || 
                        html.match(/\{[^{}]*"title"[^{}]*"link_url"[^{}]*\}/gi) || [];
        
        rscBlocks.forEach(function(block) {
            try {
                var cleanBlock = block.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                var movie = JSON.parse(cleanBlock);
                
                if (movie.link_url && movie.title) {
                    var slug = movie.link_url.replace(/^\//, "");
                    var url = BASEURL + "/phim/" + slug.replace(/^phim\//, "");
                    
                    if (!seen[url]) {
                        items.push({
                            id: url,
                            title: movie.title.trim(),
                            posterUrl: movie.image_url || movie.poster_url || movie.background_url || "",
                            backdropUrl: movie.background_url || movie.image_url || "",
                            quality: movie.quality || "HD",
                            episode_current: movie.episode_current || "Cập nhật",
                            year: movie.year || 2026,
                            lang: "Vietsub"
                        });
                        seen[url] = true;
                    }
                }
            } catch(e) {}
        });

        // 2. Quét Dữ Liệu Từ API JSON Chuẩn (Nếu truy cập qua đường API)
        if (items.length === 0 && html.trim().startsWith("{")) {
            var videoData = JSON.parse(html);
            var dataList = videoData.data || videoData.items || videoData.movies || videoData;
            
            if (Array.isArray(dataList)) {
                for (var j = 0; j < dataList.length; j++) {
                    var block = dataList[j];
                    var itemSlug = block.slug || (block.link_url ? block.link_url.replace(/^\//, "") : "");
                    if (!itemSlug) continue;

                    var itemUrl = itemSlug.indexOf("http") === 0 ? itemSlug : BASEURL + "/phim/" + itemSlug.replace(/^phim\//, "");
                    
                    if (!seen[itemUrl]) {
                        items.push({
                            "id": itemUrl,
                            "title": (block.title || block.name || "").trim(),
                            "posterUrl": block.poster_url || block.image_url || "",
                            "backdropUrl": block.thumb_url || block.background_url || "",
                            "year": block.year || 2026,
                            "quality": block.quality || "HD",
                            "episode_current": block.episode_current || "Cập nhật",
                            "lang": block.lang || "Vietsub"
                        });
                        seen[itemUrl] = true;
                    }
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 99
            }
        });
        
    } catch (e) {
        log("parseListResponse err: " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, $url) {
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

// ĐÃ SỬA: Thêm cờ 'isRelated' để KHÔNG bóc nhầm các tập phim của phim đề xuất
function extractCleanData(data) {
    let result = { movie: null, episodes: [] };

    function traverse(node, isRelated) {
        if (!node) return;

        if (typeof node === 'object' && !Array.isArray(node)) {
            // Lấy movie nếu chưa có
            if (node.movie && typeof node.movie === 'object' && !result.movie && !isRelated) {
                result.movie = node.movie;
            }
            // Chỉ lấy episodes nếu nó KHÔNG nằm trong nhánh phim đề xuất (related)
            if (Array.isArray(node.episodes) && node.episodes.length > 0 && result.episodes.length === 0 && !isRelated) {
                result.episodes = node.episodes;
            }

            for (let key in node) {
                if (node.hasOwnProperty(key)) {
                    // Nếu nhánh này là phim liên quan/đề xuất, khóa cờ isRelated = true
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

        // Quét Next.js payload từ mã HTML
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

        var actors = "";
        if (movie && movie.actors) {
            movie.actors.forEach(actor => {
                actors += actor.name + ", ";
            });
        }

        var serversMap = {};

        // ĐÃ SỬA: Lọc chặt chẽ các tập phim
        if (episodesList && Array.isArray(episodesList)) {
            episodesList.forEach(episode => {
                var streamLink = episode.link_m3u8;
                // Nếu link m3u8 bị chặn, dùng embed
                if (!streamLink || streamLink.indexOf("https://ss.onflixstream.site") > -1) {
                    if (episode.link_embed) {
                        streamLink = episode.link_embed;
                    }
                }

                // Nếu không có link xem, BỎ QUA NGAY LẬP TỨC
                if (!streamLink || streamLink === "undefined" || streamLink === "null") return;

                var rawServerName = episode.server_name || "Vietsub";
                var cleanServerName = "Vietsub";
                
                if (rawServerName.includes("PA") || rawServerName.toLowerCase().includes("kk")) cleanServerName = "KK Phim";
                else if (rawServerName.includes("OP") || rawServerName.toLowerCase().includes("ổ phim")) cleanServerName = "Ổ Phim";
                else if (rawServerName.includes("NC") || rawServerName.toLowerCase().includes("nguồn c")) cleanServerName = "Nguồn C";
                else if (rawServerName.toLowerCase().includes("thuyết minh")) cleanServerName = "Thuyết Minh";
                else cleanServerName = rawServerName;

                if (!serversMap[cleanServerName]) serversMap[cleanServerName] = {};

                var epSlug = "tap-" + (episode.slug || episode.name || "1");
                if (!serversMap[cleanServerName][epSlug]) {
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
            
            // Sắp xếp tập tăng dần
            epsArray.sort((a, b) => {
                const numA = parseInt(a.name.replace(/[^\d]/g, '')) || 0;
                const numB = parseInt(b.name.replace(/[^\d]/g, '')) || 0;
                return numA - numB;
            });

            // CHỐT CHẶN BẢO VỆ: Chỉ thêm Server khi mảng epsArray có dữ liệu
            if (epsArray.length > 0) {
                servers.push({
                    name: sName,
                    episodes: epsArray
                });
            }
        }

        // Sắp xếp mức độ ưu tiên của Server (KK Phim và Ổ phim thường mượt hơn)
        servers.sort((a, b) => {
            const getPriority = (name) => {
                if (name.includes("KK Phim")) return 1;  
                if (name.includes("Ổ Phim")) return 2;    
                if (name.includes("Vietsub")) return 3;
                if (name.includes("Thuyết Minh")) return 4;
                return 5;                                        
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
            year: movie ? movie.year : new Date().getFullYear(),
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
        log("Lỗi detail: " + e);
        return JSON.stringify({
            id: $url,
            title: "Lỗi chi tiết phim",
            servers: [],
        });
    }
}

// Xóa bỏ mớ textJS cồng kềnh, chuyển thẳng link cho Native Player của App
function parseDetailResponse(html, url) {
    try {
        var streamUrl = url;
        
        // Fix đường dẫn tương đối
        if (streamUrl.startsWith("//")) streamUrl = "https:" + streamUrl;
        else if (streamUrl.startsWith("/")) streamUrl = BASEURL + streamUrl;

        // Phân loại link trực tiếp (.m3u8/.mp4) hay embed trung gian
        var isEmbed = streamUrl.indexOf(".m3u8") === -1 && streamUrl.indexOf(".mp4") === -1;
        
        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "mimeType": isEmbed ? "" : "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL + "/",
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Block-Ads": "true", // Vũ khí tối thượng của VAX để diệt popup
                "Block-Redirects": "true"
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}

// =============================================================================
// CATEGORIES & FILTER (Giữ nguyên)
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
/movies?sort=year_desc&limit=24&category=action-&-adventure@@Action & Adventure
/movies?sort=year_desc&limit=24&category=am-nhac@@Âm Nhạc
/movies?sort=year_desc&limit=24&category=bi-an@@Bí Ẩn
/movies?sort=year_desc&limit=24&category=chien-tranh@@Chiến Tranh
/movies?sort=year_desc&limit=24&category=chinh-kich@@Chính Kịch
/movies?sort=year_desc&limit=24&category=chuong-trinh-truyen-hinh@@Chương Trình Truyền Hình
/movies?sort=year_desc&limit=24&category=chuyen-the@@Chuyển Thể
/movies?sort=year_desc&limit=24&category=dang-cap-nhat@@Đang cập nhật
/movies?sort=year_desc&limit=24&category=gay-can@@Gây Cấn
/movies?sort=year_desc&limit=24&category=gia-dinh@@Gia Đình
/movies?sort=year_desc&limit=24&category=gia-tuong@@Giả Tưởng
/movies?sort=year_desc&limit=24&category=hai-huoc@@Hài Hước
/movies?sort=year_desc&limit=24&category=hanh-dong@@Hành Động
/movies?sort=year_desc&limit=24&category=hinh-su@@Hình Sự
/movies?sort=year_desc&limit=24&category=hoat-hinh@@Hoạt Hình
/movies?sort=year_desc&limit=24&category=hoc-duong@@Học Đường
/movies?sort=year_desc&limit=24&category=huyen-huyen@@Huyền Huyễn
/movies?sort=year_desc&limit=24&category=khoa-hoc@@Khoa Học
/movies?sort=year_desc&limit=24&category=khoa-hoc-vien-tuong@@Khoa Học Viễn Tưởng
/movies?sort=year_desc&limit=24&category=kinh-di@@Kinh Dị
/movies?sort=year_desc&limit=24&category=kinh-dien@@Kinh Điển
/movies?sort=year_desc&limit=24&category=lang-man@@Lãng Mạn
/movies?sort=year_desc&limit=24&category=lgbt@@LGBT
/movies?sort=year_desc&limit=24&category=lich-su@@Lịch Sử
/movies?sort=year_desc&limit=24&category=mien-tay@@Miền Tây
/movies?sort=year_desc&limit=24&category=phieu-luu@@Phiêu Lưu
/movies?sort=year_desc&limit=24&category=phim-18@@Phim 18+
/movies?sort=year_desc&limit=24&category=phim-hai@@Phim Hài
/movies?sort=year_desc&limit=24&category=phim-ngan@@Phim Ngắn
/movies?sort=year_desc&limit=24&category=sci-fi-&-fantasy@@Sci-Fi & Fantasy
/movies?sort=year_desc&limit=24&category=short-drama@@Short Drama
/movies?sort=year_desc&limit=24&category=sitcom@@Sitcom
/movies?sort=year_desc&limit=24&category=soap@@Soap
/movies?sort=year_desc&limit=24&category=tai-lieu@@Tài Liệu
/movies?sort=year_desc&limit=24&category=talk@@Talk
/movies?sort=year_desc&limit=24&category=tam-ly@@Tâm Lý
/movies?sort=year_desc&limit=24&category=than-thoai@@Thần Thoại
/movies?sort=year_desc&limit=24&category=than-tuong@@Thần Tượng
/movies?sort=year_desc&limit=24&category=thanh-xuan@@Thanh Xuân
/movies?sort=year_desc&limit=24&category=the-thao@@Thể Thao
/movies?sort=year_desc&limit=24&category=thuong-truong@@Thương Trường
/movies?sort=year_desc&limit=24&category=tien-hiep@@Tiên Hiệp
/movies?sort=year_desc&limit=24&category=tinh-cam@@Tình Cảm
/movies?sort=year_desc&limit=24&category=tinh-tiet@@Tình Tiết
/movies?sort=year_desc&limit=24&category=tinh-yeu-ngot-ngao@@Tình Yêu Ngọt Ngào
/movies?sort=year_desc&limit=24&category=toi-pham@@Tội Phạm
/movies?sort=year_desc&limit=24&category=tre-em@@Trẻ Em
/movies?sort=year_desc&limit=24&category=vien-tuong@@Viễn Tưởng
/movies?sort=year_desc&limit=24&category=vo-thuat@@Võ Thuật
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

// BỘ DOM ẢO _$ THEO CHUẨN VAX
function _$(htmlOrBlock){if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {return htmlOrBlock;} var instance = {sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),find: function (selector) {if (selector.indexOf(',') !== -1) {var results = [];var selectors = selector.split(',').map(function (s) {return s.trim();});for (var s = 0;s < selectors.length;s++) {if (selectors[s] === "") continue;var subInstance = this.find(selectors[s]);for (var r = 0;r < subInstance.elements.length;r++) {var element = subInstance.elements[r];if (results.indexOf(element) === -1) {results.push(element);}}} var multiInstance = _$(results);multiInstance.sourceHtml = this.sourceHtml;return multiInstance;} var results = [];var contentFilter = "";if (selector.indexOf(":content(") !== -1) {var contentMatch = selector.match( /:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch) {contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[ 3] || "";selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}} var attrNameFilter = "";var attrValueFilter = "";var attrOperator = "=";var hasAttrFilter = false;var attrMatch = selector.match( /\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/ );if (attrMatch) {hasAttrFilter = true;attrNameFilter = attrMatch[1];attrOperator = attrMatch[2];attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";selector = selector.replace(/\[.*?\]/,"");} var notSelector = "";if (selector.indexOf(":not(") !== -1) {var notMatch = selector.match(/:not\(([^)]+)\)/);if (notMatch) {notSelector = notMatch[1];selector = selector.replace(/:not\([^)]+\)/,"");}} var isFirstFilter = selector.indexOf(":first") !== -1;var isLastFilter = selector.indexOf(":last") !== -1;selector = selector.replace(/:first|:last/g,"");var targetTagName = "";var targetId = "";var targetClasses = [];var selectorToParse = selector.trim();if (selectorToParse !== "") {var idIndex = selectorToParse.indexOf('#');if (idIndex !== -1) {var afterId = selectorToParse.substring(idIndex + 1);var nextDot = afterId.indexOf('.');targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);selectorToParse = selectorToParse.substring(0, idIndex) + ( nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));} var classParts = selectorToParse.split('.');var possibleTag = classParts.shift();if (possibleTag) {targetTagName = possibleTag.toLowerCase();} targetClasses = classParts.filter(function (c) {return c.length > 0;});} var isAttrOnly = (selector === "" && hasAttrFilter);for (var i = 0;i < this.elements.length;i++) {var currentHtml = this.elements[i];var pos = 0;var subResults = [];while ((pos = currentHtml.indexOf('<',pos)) !== -1) {if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {pos++;continue;} var endOpenTag = currentHtml.indexOf('>',pos);if (endOpenTag === -1) break;var fullOpenTag = currentHtml.substring(pos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = "";if (spacePos === -1) {currentTagName = fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase();} else {currentTagName = fullOpenTag.substring(1,spacePos) .toLowerCase();} var isMatched = true;if (targetTagName && targetTagName !== currentTagName) {isMatched = false;} if (isMatched && targetId) {var idMatchStr = "";var idPos = fullOpenTag.indexOf('id="');if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag .indexOf('"',startQuote));} else {idPos = fullOpenTag.indexOf("id='");if (idPos !== -1) {var startQuote = idPos + 4;idMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (idMatchStr !== targetId) {isMatched = false;}} if (isMatched && targetClasses.length > 0) {var classMatchStr = "";var classPos = fullOpenTag.indexOf('class="');if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {classPos = fullOpenTag.indexOf("class='");if (classPos !== -1) {var startQuote = classPos + 7;classMatchStr = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (classMatchStr) {var currentClasses = classMatchStr.trim().split(/\s+/);for (var c = 0;c < targetClasses.length;c++) {if (currentClasses.indexOf(targetClasses[c]) === -1) {isMatched = false;break;}}} else {isMatched = false;}} if (isMatched && hasAttrFilter) {var actualValue = "";var attrPos = fullOpenTag.indexOf(attrNameFilter + '="');if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));} else {attrPos = fullOpenTag.indexOf(attrNameFilter + "='");if (attrPos !== -1) {var startQuote = attrPos + attrNameFilter.length + 2;actualValue = fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}} if (attrPos === -1) {isMatched = false;} else {if (attrOperator === "=") {if (attrNameFilter === "class") {var classes = actualValue.trim().split(/\s+/);if (classes.indexOf(attrValueFilter) === -1) isMatched = false;} else if (actualValue !== attrValueFilter) {isMatched = false;}} else if (attrOperator === "*=") {if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false;} else if (attrOperator === "^=") {if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false;} else if (attrOperator === "$=") {if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false;}}} if (isMatched) {var startTagPos = pos;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta' ];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var scanPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && scanPos < currentHtml.length) {var nextOpen = currentHtml.indexOf(openStr,scanPos);var nextClose = currentHtml.indexOf(closeStr,scanPos);if (nextClose === -1) {scanPos = currentHtml.length;break;} if (nextOpen !== -1 && nextOpen < nextClose) {depth++;scanPos = nextOpen + openStr.length;} else {depth--;scanPos = nextClose + closeStr.length;if (depth === 0) endTagPos = nextClose + closeStr .length;}}} var foundBlock = currentHtml.substring(startTagPos,endTagPos);if (contentFilter) {var pureText = foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter) === -1) {pos = endTagPos;continue;}} if (notSelector) {var isNotClass = notSelector.indexOf('.') === 0;var isNotId = notSelector.indexOf('#') === 0;var notValue = notSelector.substring(1);var hasNot = false;if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;if (!hasNot) subResults.push(foundBlock);} else {subResults.push(foundBlock);} pos = endTagPos;} else {pos++;}} if (isFirstFilter && subResults.length > 0) subResults = [subResults[ 0]];if (isLastFilter && subResults.length > 0) subResults = [subResults[ subResults.length - 1]];results = results.concat(subResults);} var newInstance = _$(results);newInstance.sourceHtml = this.sourceHtml || currentHtml;return newInstance;},each: function (callback) {for (var i = 0;i < this.elements.length;i++) {var childInstance = _$(this.elements[i]);childInstance.sourceHtml = this.sourceHtml;callback.call(childInstance,i,this.elements[i]);} return this;},eq: function (index) {if (index < 0) index = this.elements.length + index;var matchedElement = this.elements[index];this.elements = matchedElement ? [matchedElement] : [];return this;},attr: function (attrName) {if (this.elements.length === 0) return "";var elem = this.elements[0];var searchStr = attrName + '="';var pos = elem.indexOf(searchStr);if (pos === -1) {searchStr = attrName + "='";pos = indexOf(searchStr);} if (pos === -1) return "";var start = pos + searchStr.length;var quoteType = elem.charAt(start - 1);var end = elem.indexOf(quoteType,start);return end === -1 ? "" : elem.substring(start,end);},html: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) return elem.substring(start,end);return "";},text: function () {if (this.elements.length === 0) return "";var elem = this.elements[0];var start = elem.indexOf('>') + 1;var end = elem.lastIndexOf('</');if (start > 0 && end > start) {var content = elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();} return "";},next: function () {var results = [];if (!this.sourceHtml) return this;for (var i = 0;i < this.elements.length;i++) {var elem = this.elements[i];var idx = this.sourceHtml.indexOf(elem);if (idx === -1) continue;var scanPos = idx + elem.length;var nextOpen = this.sourceHtml.indexOf('<',scanPos);if (nextOpen !== -1) {if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue;var endOpenTag = this.sourceHtml.indexOf('>',nextOpen);if (endOpenTag === -1) continue;var fullOpenTag = this.sourceHtml.substring(nextOpen,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1,fullOpenTag.length - 1).toLowerCase() : fullOpenTag .substring(1,spacePos).toLowerCase();var startTagPos = nextOpen;var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta' ];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag .indexOf('/>') === -1) {var depth = 1;var sPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && sPos < this.sourceHtml.length) {var nOpen = this.sourceHtml.indexOf(openStr,sPos);var nClose = this.sourceHtml.indexOf(closeStr,sPos);if (nClose === -1) break;if (nOpen !== -1 && nOpen < nClose) {depth++;sPos = nOpen + openStr.length;} else {depth--;sPos = nClose + closeStr.length;if (depth === 0) endTagPos = nClose + closeStr.length;}}} results.push(this.sourceHtml.substring(startTagPos,endTagPos));}} var nextInstance = _$(results);nextInstance.sourceHtml = this.sourceHtml;this.elements = results;return this;},parent: function () {var results = [];if (!this.sourceHtml) return this;for (var i = 0;i < this.elements.length;i++) {var elem = this.elements[i];var idx = this.sourceHtml.indexOf(elem);if (idx <= 0) continue;var scanPos = idx - 1;while (scanPos >= 0) {var openTagPos = this.sourceHtml.lastIndexOf('<',scanPos);if (openTagPos === -1) break;if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this .sourceHtml.charAt(openTagPos + 1) !== '!') {var endOpenTag = this.sourceHtml.indexOf('>',openTagPos);if (endOpenTag !== -1 && endOpenTag > openTagPos) {var fullOpenTag = this.sourceHtml.substring(openTagPos,endOpenTag + 1);var spacePos = fullOpenTag.indexOf(' ');var currentTagName = (spacePos === -1) ? fullOpenTag .substring(1,fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1,spacePos).toLowerCase();var endTagPos = endOpenTag + 1;var selfClosingTags = ['img','source','input','br','hr','link','meta' ];if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {var depth = 1;var sPos = endOpenTag + 1;var openStr = '<' + currentTagName;var closeStr = '</' + currentTagName + '>';while (depth > 0 && sPos < this.sourceHtml.length) {var nOpen = this.sourceHtml.indexOf(openStr,sPos);var nClose = this.sourceHtml.indexOf(closeStr,sPos);if (nClose === -1) break;if (nOpen !== -1 && nOpen < nClose) {depth++;sPos = nOpen + openStr.length;} else {depth--;sPos = nClose + closeStr.length;if (depth === 0) endTagPos = nClose + closeStr .length;}}} if (endTagPos >= idx + elem.length) {var parentBlock = this.sourceHtml.substring(openTagPos,endTagPos);if (results.indexOf(parentBlock) === -1) results.push( parentBlock);break;}}} scanPos = openTagPos - 1;}} var parentInstance = _$(results);parentInstance.sourceHtml = this.sourceHtml;this.elements = results;return this;},closest: function (selector) {var results = [];if (!this.sourceHtml || this.elements.length === 0) return _$([]);for (var i = 0; i < this.elements.length; i++) {var currentElem = this.elements[i];var currentObj = _$(currentElem);currentObj.sourceHtml = this.sourceHtml;var selfCheck = _$(this.sourceHtml).find(selector);var isSelfMatched = false;for (var s = 0; s < selfCheck.elements.length; s++) {if (selfCheck.elements[s] === currentElem) {isSelfMatched = true;break;}} if (isSelfMatched) {if (results.indexOf(currentElem) === -1) results.push(currentElem);continue;} var parentObj = currentObj.parent();while (parentObj.elements.length > 0) {var parentElem = parentObj.elements[0];var checkMatch = _$(this.sourceHtml).find(selector);var isMatched = false;for (var j = 0; j < checkMatch.elements.length; j++) {if (checkMatch.elements[j] === parentElem) {isMatched = true;break;}} if (isMatched) {if (results.indexOf(parentElem) === -1) results.push( parentElem);break;} parentObj = parentObj.parent();}} var closestInstance = _$(results);closestInstance.sourceHtml = this.sourceHtml;return closestInstance;}};return instance;};
