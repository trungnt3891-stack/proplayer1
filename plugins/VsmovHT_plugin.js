var BASEURL = "https://vsmov.com";
var BASEAPI = "https://vsmov.com/api";
var DEV = true;

function getManifest() {
    return JSON.stringify({
        id: "vsmov",
        name: "Nguồn Vsmov",
        description: "Nguồn phim Vsmov...",
        "version": "1.1",
        info: "Nguồn phim vietsub và thuyết minh mới.\n\n Hỗ trợ lồng tiếng và có tốc độ phát rất nhanh.",
        baseUrl: "https://vsmov.com",
        iconUrl: "https://vaxplugin.alokillgtv.workers.dev/img/vsmov.png",
        isEnabled: true,
        "adblock": false,
        "layoutType": "HORIZONTAL",
        type: "MOVIE",
        playerType: "exoplayer"
    });
}


function log(msg) {
    console.log(msg);
}

function getHomeSections() {
    return JSON.stringify([{
            "slug": "/danh-sach/long-tieng",
            "title": "Phim Lồng Tiếng",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/phim-le",
            "title": "Phim Lẻ",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/phim-bo",
            "title": "Phim Bộ",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/thuyet-minh",
            "title": "Thuyét Minh",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/phim-moi-cap-nhat/",
            "title": "Phim Mới",
            "type": "Grid"
        }
    ]);
}



function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("getPrimaryCategories[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({
            category: menulist
        });
    } catch (e) {
        log("getFilterConfig[err]:\n " + e);
        return JSON.stringify({
            category: []
        });
    }
}

function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http)
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }

        var page = 1;
        var path = slug || "";

        // 2. Xử lý an toàn filtersJson cho link tương đối
        if (filtersJson) {
            var fixedJson2 = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson2);
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

        // 3. Ghép URL an toàn với BASEURL
        if (path.indexOf("/danh-sach/phim-le") > -1 || path.indexOf("/danh-sach/phim-bo") > -1 || path.indexOf("/danh-sach/thuyet-minh") > -1 || path.indexOf("/danh-sach/long-tieng") > -1) {
            var resultUrl = BASEURL;
        } else {
            var resultUrl = BASEAPI;
        }

        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        // 4. Ghép tham số phân trang page (tự động nhận biết ? hay &)
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += "?page=" + page;
        }

        // 5. Làm sạch dấu // thừa ở path (giữ nguyên https://)
        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        var fallback = BASEAPI + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;

        // 1. Giải mã filtersJson lấy trang đúng chuẩn hàm gốc
        if (filtersJson) {
            var fixedJson = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        // 2. Khởi tạo URL tìm kiếm kèm cấu trúc /search?lang=vi-VN&q=
        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEAPI + "/tim-kiem?keyword=" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEAPI + "/tim-kiem?keyword=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}

// /type/hoat-hinh/
//filtersJson = "{page:5}"
//getUrlList("/danh-sach/phim-moi-cap-nhat", filtersJson)
//getUrlSearch("girl", filtersJson)

function getUrlDetail(slug) {
    try {
        log("getUrlDetail[url]: \n" + slug);
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        var detailUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + detailUrl);
        return detailUrl;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
        return "";
    }
}

function getUrlCategories() {
    try {
        log("getUrlCategories[url]: \n" + BASEURL);
        return BASEURL;
    } catch (e) {
        log("getUrlCategories[err]:\n " + e);
        return "";
    }
}


function getUrlCountries() {
    try {
        return "";
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
        return "";
    }
}

function getUrlYears() {
    try {
        return "";
    } catch (e) {
        log("getUrlYears[err]:\n " + e);
        return "";
    }
}

// =============================================================================
// PARSERS
// =============================================================================
function parseListResponse(html, $url) {
    try {
        if ($url.indexOf("/api") > -1) {
            log("api parse")
            return parseAPI(html, $url)
        } else {
            return parseRAW(html, $url)
        }
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [{
                "id": $url || "error_url",
                "title": "Lỗi: " + e,
                "posterUrl": "",
                "backdropUrl": ""
            }],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }
}

//html = sourceHTML;
// https://vicdn.cc/api/type/hoat-hinh/1
// https://vicdn.cc/?q=ta
function parseAPI(html, $url) {
    var $data = JSON.parse(html);
    var $items = $data.items;
    var items = [];
    for (var $j = 0; $j < $items.length; $j++) {
        var item = $items[$j];
        // var img = typeof item.thumb_url === "string" ? item.thumb_url : "";

        items.push({
            "id": BASEAPI + "/phim/" + item.slug,
            "title": item.name,
            "posterUrl": typeof item.poster_url === "string" ? item.poster_url : "",
            "backdropUrl": typeof item.thumb_url === "string" ? item.thumb_url : "",
            "year": typeof item.year === "number" ? item.year : 2026
        });
    }
    return JSON.stringify({
        "items": items,
        "pagination": {
            "currentPage": 1,
            "totalPages": 9999
        }
    });
}

function parseRAW(html, $url) {
    var $html = _$(html);
    var items = [];
    $html.find("tbody tr[class*='group/tr']").each(function() {
        var slug = this.find("a").attr("href");
        slug = slug.replace(BASEURL, BASEAPI);
        var name = this.find("h4").text();
        var poster = this.find("img").attr("data-original");
        var year = this.find("img.object-cover").closest("td").next().text();
        year = Number(year.trim());
        // var img = typeof year === "number" ? year : 2026;
        items.push({
            "id": slug,
            "title": name,
            "posterUrl": typeof poster === "string" ? poster : "",
            "backdropUrl": typeof poster === "string" ? poster : "",
            "year": typeof year === "number" ? year : 2026
        });
    })
    return JSON.stringify({
        "items": items,
        "pagination": {
            "currentPage": 1,
            "totalPages": 9999
        }
    });
}

//html = sourceHTML;
// https://vicdn.cc/api/type/hoat-hinh/1
// https://vicdn.cc/?q=ta
//JSON.parse(parseListResponse(sourceHTML, "https://vicdn.cc/api/type/hoat-hinh/1"))

//$data = parseJSDataIsolated(script);
function parseSearchResponse(html, url) {
    try {
        log("parseSearchResponse[url]: \n" + url);
        return parseListResponse(html, url);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }
}

function decodeHTMLEntities(str) {
    try {
        if (!str) return "";
        return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            if (dec) {
                return String.fromCharCode(parseInt(dec, 10));
            }
            if (hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
            return match;
        });
    } catch (e) {
        log("decodeHTMLEntities[err]:\n " + e);
    }
}

function parseMovieDetail(html, url) {
    try {
        log("parseMovieDetail[url]: \n" + url);

        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===
        var lurl = "";
        var limg = "";
        var lname = "Đang cập nhật...";
        var ldes = "Không có mô tả.";
        var ldirec = "";
        var lactor = "";
        var lduran = "";
        var status = "";
        var category = "";
        var episode_current = "";
        var year = 2026;
        var extra = "";
        var lang = "";
        var country = "";
        var quality = "";
        var director = "";
        var $movie = JSON.parse(html)
        $data = $movie.movie
        limg = $data.thumb_url;
        lname = $data.name;
        ldes = $data.content;
        lactor = $data.actor.join(" - ");
        lduran = $data.time;
        status = $data.status.replace("completed", "Hoàn Thành");
        var categoryArray = [];
        // Dùng forEach để duyệt qua từng object
        $data.category.forEach(function(item) {
            if (item.name && item.slug) {
                categoryArray.push("[" + item.name + "](/the-loai/" + item.slug + "/)");
            }
        });
        // Nối lại thành chuỗi phân cách bởi dấu phẩy
        category = categoryArray.join(", ");

        episode_current = $data.episode_current;
        year = $data.year;
        lang = $data.lang;
        var countryArray = [];
        // Dùng forEach để duyệt qua từng object
        $data.country.forEach(function(item) {
            if (item.name && item.slug) {
                countryArray.push("[" + item.name + "](/quoc-gia/" + item.slug + ")");
            }
        });
        // Nối lại thành chuỗi phân cách bởi dấu phẩy
        country = countryArray.join(", ");
        director = $data.director.join(" - ");;
        quality = $data.quality;

        var rawData = $movie.episodes;

        var servers = [];

        rawData.forEach(function(serverItem) {
            var episodes = [];

            // Duyệt qua từng tập phim trong server_data
            serverItem.server_data.forEach(function(episode) {
                episodes.push({
                    id: episode.link_embed, // + "?currennt=" + episode.name + "&list=" + url, 
                    name: "Tập " + episode.name,
                    slug: episode.slug
                });
            });

            // Làm sạch tên server (xóa khoảng trắng và ký tự \r\n thừa)
            var cleanServerName = serverItem.server_name.replace(/\r?\n|\r/g, "").trim().replace(/\s+/g, " ");

            // Đẩy vào mảng server
            servers.push({
                name: cleanServerName,
                episodes: episodes
            });
            servers.sort(function(a, b) {
                var aIsThuyetMinh = a.name.toLowerCase().includes("thuyết minh");
                var bIsThuyetMinh = b.name.toLowerCase().includes("thuyết minh");

                if (aIsThuyetMinh && !bIsThuyetMinh) return -1; // a lên trước b
                if (!aIsThuyetMinh && bIsThuyetMinh) return 1; // b lên trước a
                return 0; // Giữ nguyên vị trí nếu cùng loại
            });
        });

        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: quality,
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: director || "",
            lang: lang,
            country: country,
            extra: extra
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || url || "error",
            title: "error",
            servers: []
        });
    }
}

//var html = sourceHTML;
//var url = "https://hentaivietsub.com/hentai/enjo-kouhai-tap-11?//current=1&maxEpi=11"
//JSON.parse(parseMovieDetail(sourceHTML, "https://vicdn.cc/api/info/tv-278275-1"))

//$data = JSON.parse(sourceHTML)

/*
    var $doc = _$(html);
    var script = $doc.find("script:content('subtitles')").html()
    var match = script.match(/subtitles:\s*(\[\s*\{.*?\}\s*\])/s);
    var domain = url.replace(/^(https?:\/\/[^\/]+).*\/, "$1");
    var subs = [];
*/

function parseDetailResponse(html, url) {
    try {
        console.log("parseDetailResponse dang xu ly: " + url);
        var m3u8 = url.replace("/video/", "/stream/") + "/master.m3u8";
        var $doc = _$(html);
        var domain = url.replace(/^(https?:\/\/[^\/]+).*/, "$1");
        var script = $doc.find("script:content('subtitles')").html()
        var match = script.match(/subtitles:\s*(\[\s*\{.*?\}\s*\])/s);
        var subitem = [];
        if (match && match[1]) {
            var sublist = JSON.parse(match[1]);
            sublist.forEach(function(item, index) {
                var name = item.code.replace("vie", "Vietsub").replace("eng", "Engsub");
                var link = domain + item.url;
                subitem.push({
                    lang: name + " " + (index + 1),
                    url: link
                })
            })
        }
        console.log("stream: " + m3u8);
        return JSON.stringify({
            url: m3u8,
            isEmbed: false,
            mimeType: "application/x-mpegURL",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: BASEURL
            },
            subtitles: subitem,
        });
    } catch (e) {
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({
            url: "",
            isEmbed: false,
            headers: {},
            subtitles: [],
        });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("parseCategoriesResponse[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function parseCountriesResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseCountriesResponse[err]:\n " + e);
        return "[]";
    }
}

function parseYearsResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseYearsResponse[err]:\n " + e);
        return "[]";
    }
}


// https://vsmov.com/api/the-loai/hanh-dong
function getLISTmenu() {
    return `[{"link":"/the-loai/action-adventure/","name":"Action & Adventure"},{"link":"/the-loai/bi-an/","name":"Bí Ẩn"},{"link":"/the-loai/chien-tranh/","name":"Chiến Tranh"},{"link":"/the-loai/chinh-kich/","name":"Chính Kịch"},{"link":"/the-loai/chinh-tri-chien-tranh/","name":"Chính Trị - Chiến Tranh"},{"link":"/the-loai/chu-de-thuc-te/","name":"Chủ Đề Thực Tế"},{"link":"/the-loai/co-trang/","name":"Cổ Trang"},{"link":"/the-loai/drama/","name":"Drama"},{"link":"/the-loai/gia-dinh/","name":"Gia Đình"},{"link":"/the-loai/gia-tuong/","name":"Giả Tưởng"},{"link":"/the-loai/giat-gan/","name":"Giật Gân"},{"link":"/the-loai/hai/","name":"Hài"},{"link":"/the-loai/hanh-dong/","name":"Hành Động"},{"link":"/the-loai/hanh-dong-phieu-luu/","name":"Hành Động & Phiêu Lưu"},{"link":"/the-loai/hinh-su/","name":"Hình Sự"},{"link":"/the-loai/hoat-hinh/","name":"Hoạt Hình"},{"link":"/the-loai/hoc-duong/","name":"Học Đường"},{"link":"/the-loai/hon-nhan/","name":"Hôn Nhân"},{"link":"/the-loai/hu-cau/","name":"Hư Cấu"},{"link":"/the-loai/khoa-hoc-vien-tuong/","name":"Khoa Học Viễn Tưởng"},{"link":"/the-loai/khoa-hoc-vien-tuong-gia-tuong/","name":"Khoa Học Viễn Tưởng & Giả Tưởng"},{"link":"/the-loai/kiem-hiep/","name":"Kiếm hiệp"},{"link":"/the-loai/kinh-di/","name":"Kinh Dị"},{"link":"/the-loai/lang-man/","name":"Lãng Mạng"},{"link":"/the-loai/lang-mang/","name":"Lãng Mạng"},{"link":"/the-loai/lgbt/","name":"LGBT"},{"link":"/the-loai/phieu-luu/","name":"Phiêu Lưu"},{"link":"/the-loai/phim-nhac/","name":"Phim Nhạc"},{"link":"/the-loai/phuctrangcodai/","name":"Phụctrangcổđại"},{"link":"/the-loai/sci-fi-fantasy/","name":"Sci-Fi & Fantasy"},{"link":"/the-loai/thanh-xuan/","name":"Thanh Xuân"},{"link":"/the-loai/thieu-nhi/","name":"Thiếu Nhi"},{"link":"/the-loai/thuong-truong/","name":"Thương Trường"},{"link":"/the-loai/tien-hiep/","name":"Tiên Hiệp"},{"link":"/the-loai/tieu-thuyet-chuyen-the/","name":"Tiểu Thuyết Chuyển Thể"},{"link":"/the-loai/tinh-ban/","name":"Tình Bạn"},{"link":"/the-loai/tinh-tiet/","name":"Tình Tiết"},{"link":"/the-loai/tinh-yeu-ngot-ngao/","name":"Tình Yêu Ngọt Ngào"},{"link":"/the-loai/toi-pham/","name":"Tội Phạm"},{"link":"/the-loai/tra-thu/","name":"Trả Thù"},{"link":"/the-loai/truyen-hinh-thuc-te/","name":"Truyền Hình Thực Tế"},{"link":"/the-loai/vien-tuong/","name":"Viễn Tưởng"},{"link":"/the-loai/vo-hiep/","name":"Võ hiệp"},{"link":"/the-loai/vo-thuat/","name":"Võ Thuật"},{"link":"/the-loai/xa-hoi-den/","name":"Xã Hội Đen"}]`;
}

function buildMenu(menuStr, type) {
    var menuArray = JSON.parse(menuStr);
    let menulist = [];
    if (!menuArray || !Array.isArray(menuArray)) return menulist;
    var typeStr = type !== undefined ? String(type).trim() : undefined;
    for (var i = 0; i < menuArray.length; i++) {
        var item = menuArray[i];
        if (!item) continue;
        var link = item.link ? String(item.link).trim() : "";
        var name = item.name ? String(item.name).trim() : "";
        if (!link || !name) continue;
        var menuItem = {};
        if (typeStr === "false") {
            menuItem = {
                "slug": link,
                "title": name,
                "type": "Horizontal"
            };
        } else if (typeStr === "true") {
            menuItem = {
                "slug": link,
                "title": name,
                "type": "Grid"
            };
        } else {
            menuItem = {
                "slug": link,
                "name": name
            };
        }
        menulist.push(menuItem);
    }
    return menulist;
}

function _$(param) {
    // -------------------------------------------------------------
    // 1. HELPER PARSER & UTILS
    // -------------------------------------------------------------
    function parseHTML(htmlString) {
        let nodes = [];
        let root = {
            id: 0,
            tag: "ROOT",
            attrs: {},
            childrenIds: [],
            parentId: null
        };
        nodes.push(root);

        try {
            let html = (htmlString || "").trim();
            if (!html) return {
                root,
                nodes
            };

            const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
            let stack = [0];
            let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;

            let lastIndex = 0;
            let match;
            let maxIter = 50000;
            let iter = 0;

            while ((match = tagRegex.exec(html)) !== null && iter++ < maxIter) {
                let textBefore = html.slice(lastIndex, match.index).trim();
                let parentId = stack[stack.length - 1];

                if (textBefore) {
                    let textId = nodes.length;
                    nodes.push({
                        id: textId,
                        tag: "#text",
                        text: textBefore,
                        attrs: {},
                        childrenIds: [],
                        parentId: parentId
                    });
                    nodes[parentId].childrenIds.push(textId);
                }

                lastIndex = tagRegex.lastIndex;
                let isCloseTag = !!match[1];
                let tagName = (match[1] || match[2] || "").toLowerCase();
                let attrStr = match[3] || "";
                let isSelfClosing = !!match[4] || VOID_TAGS.has(tagName);

                if (isCloseTag) {
                    for (let i = stack.length - 1; i > 0; i--) {
                        if (nodes[stack[i]].tag === tagName) {
                            stack.splice(i);
                            break;
                        }
                    }
                } else {
                    let attrs = {};
                    let attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                        attrs[attrMatch[1].toLowerCase()] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
                    }

                    let nodeId = nodes.length;
                    let node = {
                        id: nodeId,
                        tag: tagName,
                        attrs: attrs,
                        childrenIds: [],
                        parentId: parentId
                    };
                    nodes.push(node);
                    nodes[parentId].childrenIds.push(nodeId);

                    if (!isSelfClosing) {
                        stack.push(nodeId);
                    }
                }
            }

            let remainingText = html.slice(lastIndex).trim();
            if (remainingText && stack.length > 0) {
                let parentId = stack[stack.length - 1];
                let textId = nodes.length;
                nodes.push({
                    id: textId,
                    tag: "#text",
                    text: remainingText,
                    attrs: {},
                    childrenIds: [],
                    parentId: parentId
                });
                nodes[parentId].childrenIds.push(textId);
            }
        } catch (err) {
            if (typeof window !== "undefined" && window.log) window.log("parseHTML error: " + err.message);
        }
        return {
            root,
            nodes
        };
    }

    function getNodeText(node, nodes, depth) {
        if (!node || (depth || 0) > 20) return "";
        if (node.tag === "#text") return node.text || "";
        let text = "";
        if (node.childrenIds) {
            for (let cid of node.childrenIds) {
                text += getNodeText(nodes[cid], nodes, (depth || 0) + 1) + " ";
            }
        }
        return text.trim();
    }

    // -------------------------------------------------------------
    // 2. QUERY ENGINE & SELECTOR MATCHING
    // -------------------------------------------------------------
    function matchSingleSelector(node, sel, nodes) {
        if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

        let cleanSel = sel;

        // 1. Tách pseudo positional (:first, :last, :eq)
        cleanSel = cleanSel.replace(/:first|:last|:eq\([0-9]+\)/gi, "").trim();

        // 2. Tách pseudo :content(...)
        let pseudoContentArg = null;
        let contentMatch = cleanSel.match(/:content\((['"]?)(.*?)\1\)/i);
        if (contentMatch) {
            pseudoContentArg = contentMatch[2];
            cleanSel = cleanSel.replace(contentMatch[0], "").trim();
        }

        // 3. Khớp Selector gốc
        if (cleanSel && cleanSel !== "*") {
            let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
            if (tagMatch && node.tag !== tagMatch[0].toLowerCase()) return false;

            let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
            if (idMatch && (!node.attrs || node.attrs.id !== idMatch[1])) return false;

            // Class matching (hỗ trợ Tailwind)
            let classMatches = cleanSel.match(/\.([a-zA-Z0-9_\-\/\\:]+)/g);
            if (classMatches) {
                if (!node.attrs || !node.attrs.class) return false;
                let elClasses = node.attrs.class.split(/\s+/);
                for (let c of classMatches) {
                    let targetClass = c.substring(1);
                    if (!elClasses.includes(targetClass)) return false;
                }
            }

            let attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);
            if (attrMatch) {
                let attrName = attrMatch[1].toLowerCase();
                let attrVal = attrMatch[2];
                if (!node.attrs || !(attrName in node.attrs)) return false;
                if (attrVal !== undefined && node.attrs[attrName] !== attrVal) return false;
            }
        }

        if (pseudoContentArg !== null) {
            let fullText = getNodeText(node, nodes, 0);
            let keywords = pseudoContentArg.split("|").map(k => k.trim().toLowerCase());
            let found = keywords.some(kw => fullText.toLowerCase().includes(kw));
            if (!found) return false;
        }

        return true;
    }

    function querySelectorAllSingleLevel(startNode, selector, nodes) {
        let results = [];

        function search(currentId, depth) {
            if (depth > 50) return;
            let current = nodes[currentId];
            if (!current) return;

            if (current.tag !== "ROOT" && current.tag !== "#text" && current.id !== startNode.id) {
                if (matchSingleSelector(current, selector, nodes)) {
                    results.push(current);
                }
            }
            if (current.childrenIds) {
                for (let cid of current.childrenIds) {
                    search(cid, depth + 1);
                }
            }
        }
        search(startNode.id, 0);

        if (selector.indexOf(":first") !== -1) return results.slice(0, 1);
        if (selector.indexOf(":last") !== -1) return results.slice(-1);

        let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
        if (eqMatch) {
            let idx = parseInt(eqMatch[1], 10);
            return results[idx] ? [results[idx]] : [];
        }

        return results;
    }

    function querySelectorAll(startNode, selector, nodes) {
        try {
            if (!startNode || !selector) return [];

            if (selector.indexOf(',') !== -1) {
                let groupSelectors = selector.split(',').map(s => s.trim());
                let resMap = new Map();
                for (let gSel of groupSelectors) {
                    let subRes = querySelectorAll(startNode, gSel, nodes);
                    for (let r of subRes) resMap.set(r.id, r);
                }
                return Array.from(resMap.values());
            }

            let spaceParts = selector.trim().split(/\s+/);
            if (spaceParts.length > 1) {
                let currentNodes = [startNode];
                for (let part of spaceParts) {
                    let nextLevelNodes = [];
                    let addedIds = new Set();
                    for (let cNode of currentNodes) {
                        let subResults = querySelectorAllSingleLevel(cNode, part, nodes);
                        for (let r of subResults) {
                            if (!addedIds.has(r.id)) {
                                addedIds.add(r.id);
                                nextLevelNodes.push(r);
                            }
                        }
                    }
                    currentNodes = nextLevelNodes;
                    if (currentNodes.length === 0) break;
                }
                return currentNodes;
            }

            return querySelectorAllSingleLevel(startNode, selector, nodes);
        } catch (err) {
            return [];
        }
    }

    // -------------------------------------------------------------
    // 3. MINIJQ CLASS CONSTRUCTOR & PROTOTYPE
    // -------------------------------------------------------------
    function MiniJQ(elements, nodesStore) {
        this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
        this.nodes = nodesStore || [];
        this.length = this.elements.length;
    }

    MiniJQ.prototype = {
        find: function(selector) {
            if (this.elements.length === 0) return new MiniJQ([], this.nodes);
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let res = querySelectorAll(el, selector, this.nodes);
                for (let r of res) {
                    if (!addedIds.has(r.id)) {
                        addedIds.add(r.id);
                        matched.push(r);
                    }
                }
            }
            return new MiniJQ(matched, this.nodes);
        },

        text: function() {
            if (this.elements.length === 0) return "";
            return getNodeText(this.elements[0], this.nodes, 0);
        },

        html: function() {
            if (this.elements.length === 0) return "";
            let self = this;
            let serialize = function(nodeId, depth) {
                if (depth > 20) return "";
                let node = self.nodes[nodeId];
                if (!node) return "";
                if (node.tag === "#text") return node.text || "";
                let attrs = Object.entries(node.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
                let childrenHTML = (node.childrenIds || []).map(cid => serialize(cid, depth + 1)).join("");
                return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
            };
            return (this.elements[0].childrenIds || []).map(cid => serialize(cid, 0)).join("");
        },

        attr: function(name, value) {
            if (value !== undefined) {
                for (let el of this.elements) {
                    if (el && el.tag !== "#text") {
                        if (!el.attrs) el.attrs = {};
                        el.attrs[name] = value;
                    }
                }
                return this;
            }
            if (this.elements.length === 0 || !this.elements[0].attrs) return "";
            return this.elements[0].attrs[name] || "";
        },

        each: function(callback) {
            if (typeof callback !== 'function') return this;
            this.elements.forEach((el, index) => {
                let jqEl = new MiniJQ([el], this.nodes);
                callback.call(jqEl, index, jqEl);
            });
            return this;
        },

        textAll: function(delimiter) {
            if (delimiter === undefined) delimiter = " ";
            let texts = [];
            for (let el of this.elements) {
                texts.push(getNodeText(el, this.nodes, 0));
            }
            return texts.join(delimiter);
        },

        first: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : [], this.nodes);
        },

        last: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : [], this.nodes);
        },

        eq: function(index) {
            return new MiniJQ(this.elements[index] ? [this.elements[index]] : [], this.nodes);
        },

        parent: function() {
            let parents = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                if (el && el.parentId !== null && el.parentId !== 0) {
                    let pNode = this.nodes[el.parentId];
                    if (pNode && !addedIds.has(pNode.id)) {
                        addedIds.add(pNode.id);
                        parents.push(pNode);
                    }
                }
            }
            return new MiniJQ(parents, this.nodes);
        },

        next: function() {
            let nexts = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx !== -1 && idx + 1 < siblings.length) {
                    nexts.push(siblings[idx + 1]);
                }
            }
            return new MiniJQ(nexts, this.nodes);
        },

        before: function() {
            let befores = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx > 0) {
                    befores.push(siblings[idx - 1]);
                }
            }
            return new MiniJQ(befores, this.nodes);
        },

        after: function() {
            return this.next();
        },

        closest: function(selector) {
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let currParentId = el.parentId;
                let depth = 0;
                while (currParentId !== null && currParentId !== 0 && depth++ < 30) {
                    let curr = this.nodes[currParentId];
                    if (!curr) break;
                    if (matchSingleSelector(curr, selector, this.nodes)) {
                        if (!addedIds.has(curr.id)) {
                            addedIds.add(curr.id);
                            matched.push(curr);
                        }
                        break;
                    }
                    currParentId = curr.parentId;
                }
            }
            return new MiniJQ(matched, this.nodes);
        }
    };

    // -------------------------------------------------------------
    // 4. MAIN ENTRY POINT LOGIC FOR _$
    // -------------------------------------------------------------
    try {
        if (!param) return new MiniJQ([], []);
        if (param instanceof MiniJQ) return param;
        if (typeof param === "string") {
            let parsed = parseHTML(param);
            return new MiniJQ(parsed.root, parsed.nodes);
        }
        return new MiniJQ(param, []);
    } catch (err) {
        return new MiniJQ([], []);
    }
}
