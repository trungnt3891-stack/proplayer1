var BASEURL = "http://vkey.vn/animehay";
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
    return JSON.stringify({
        "id": "animehay",
        "name": "Nguồn Animehay",
        "description": "Anime siêu hay.",
        "version": "1.0.7",
        "info": "Nguồn phim anime chất lượng cao. Cập nhật khá nhanh.\nTuy nhiên nguồn này hay đổi tên miền, nên nếu các bạn ko xem được hãy tìm bằng từ khoá animehay.\nTừ đó các bạn sẽ thấy được tên miền gốc của nó, và hãy tự đổi ở phần cài đặt trước khi đợi plugin cập nhật.\nHãy thông báo lên nhóm để cập nhật nhanh nhất.",
        "baseUrl": "http://vkey.vn/animehay",
        "iconUrl": "http://vkey.vn/img/animehay.png",
        "isEnabled": true,
        debug: true,
        "layoutType": "HORIZONTAL",
        "type": "MOVIE",
        "playerTpye": "exoplayer"
    })
};

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[" + BASEURL + "] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[" + BASEURL + "] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([{
            "slug": "/the-loai/anime-1.html",
            "title": "Anime",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/hanh-dong-2.html",
            "title": "Hành Động",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/tien-hiep-35.html",
            "title": "Tiên Hiệp",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/kinh-di-29.html",
            "title": "Kinh Dị",
            "type": "Horizontal"
        },
        {
            "slug": "/phim-moi-cap-nhap/tat-ca-1.html",
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
        var menulist = buildMenu(listurl, "filter");
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

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        if (slug && slug.indexOf("http") > -1) {
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
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        var resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        if (page > 1) {
            resultUrl += "/trang-" + page + ".html";
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var resUrl = "";
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                var page = parseInt(filters.page) || 1;
                if (page > 1) {
                    resUrl = BASEURL + "/tim-kiem/trang-" + page + ".html?keyword=" + keyword;
                } else {
                    resUrl = BASEURL + "/tim-kiem/?keyword=" + encodeURIComponent(keyword);
                }
            } catch (jsonErr) {
                resUrl = BASEURL + "/tim-kiem/?keyword=" + encodeURIComponent(keyword);
            }
        } else {
            resUrl = BASEURL + "/tim-kiem/?keyword=" + encodeURIComponent(keyword);
        }

        log("getUrlSearch[url]: \n" + resUrl);
        return resUrl;
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        return BASEURL + "/tim-kiem/?keyword=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    try {
        log("getUrlDetail[url]: \n" + slug);
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;

        var resUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + resUrl);
        return resUrl;
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

function fixHref(href) {
    try {
        if (!href) return '';

        // 1. Loại bỏ khoảng trắng thừa ở đầu và cuối
        let cleanHref = href.trim();

        // 2. Các mẫu đường dẫn cần bỏ qua (không gắn thêm BASEURL)
        const ignorePattern = /^(#|https?:\/\/|\/\/|mailto:|tel:|javascript:|data:|blob:)/i;

        if (ignorePattern.test(cleanHref)) {
            log("fixHref[url]: \n" + cleanHref);
            return cleanHref;
        }

        // 3. Xử lý trường hợp đường dẫn bắt đầu bằng dấu / (server-relative path)
        var resUrl = "";
        if (cleanHref.startsWith('/')) {
            try {
                const urlObj = new URL(BASEURL);
                resUrl = urlObj.origin + cleanHref;
            } catch (e) {
                resUrl = BASEURL + cleanHref;
            }
        } else {
            // 4. Đường dẫn tương đối thông thường
            resUrl = BASEURL + cleanHref;
        }

        log("fixHref[url]: \n" + resUrl);
        return resUrl;
    } catch (e) {
        log("fixHref[err]:\n " + e);
        return href || '';
    }
}

function isValidMediaUrl(url) {
    try {
        log("isValidMediaUrl[url]: \n" + url);
        if (!url || typeof url !== 'string') return false;

        var cleanUrl = url.trim();

        // 1. Loại bỏ nếu dính chuỗi nối code JS, biến hoặc hàm (như _spEsc, +, ', ${...)
        if (cleanUrl.indexOf('_spEsc') > -1 ||
            cleanUrl.indexOf("'+") > -1 ||
            cleanUrl.indexOf("+'") > -1 ||
            cleanUrl.indexOf("${") > -1 ||
            cleanUrl.indexOf("javascript:") > -1) {
            return false;
        }

        // 2. Kiểm tra định dạng URL http/https hợp lệ (không chứa khoảng trắng, ngoặc đơn/kép, dấu +)
        var httpPattern = /^https?:\/\/[^\s"'<>+]+$/i;
        return httpPattern.test(cleanUrl);
    } catch (e) {
        log("isValidMediaUrl[err]:\n " + e);
        return false;
    }
}

function parseListResponse(html, $url) {
    log("parseListResponse[url]: \n" + $url);
    try {
        var items = [];
        var $doc = _$(html);
        $doc.find(".mc").each(function() {
            var href = this.find("a").attr("href");
            href = fixHref(href);
            var title = this.find("a").attr("title");
            var src = this.find("img").attr("src");
            src = fixHref(src);

            var episode_current = this.find(".mc__ep-badge").text().trim();
            var quality = this.find(".mc__score").text().trim();

            if (isValidMediaUrl(href)) {
                var cleanThumb = (src || "").replace(/&amp;/g, '&').trim();

                // Đảm bảo cleanThumb cũng là link ảnh hợp lệ, nếu không có thì fallback
                if (cleanThumb && cleanThumb.indexOf('http') !== 0) {
                    cleanThumb = 'https:' + cleanThumb;
                }

                items.push({
                    "id": href.trim(),
                    "title": (title || "").trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": quality || "",
                    "lang": "",
                    "episode_current": episode_current || ""
                });
            }
        });

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
            }
        });
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

function parseSearchResponse(html, url) {
    log("parseSearchResponse[url]: \n" + url);
    try {
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

function parseMovieDetail(html, url) {
    log("parseMovieDetail[url]: \n" + url);
    try {
        var $doc = _$(html);
        // === BƯỚC 1: ĐỒNG NHẤT ID PHIM BẰNG REGEX META (Y hệt tác giả) ===
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");

        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/_.]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        if (!slug) {
            var slugMatch2 = /\/phim\/([^/_.]+)/.exec(html);
            slug = slugMatch2 ? slugMatch2[1] : "";
        }

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

        var rmatch = html.match(/meta\s+property="og:url"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lurl = rmatch[1];

        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];

        if (limg.indexOf("//") === 0) {
            limg = "https:" + limg;
        } else if (limg.indexOf("http") === -1) {
            limg = BASEURL + limg;
        }
        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];

        ldes = $doc.find("#aim-desc-content").text();
        var year = 2026;
        var extra = "";

        var rawText = $doc.find(".aim-hero__meta").find("span:first").text();

        // 1. Dùng Regex lọc chính xác 4 chữ số năm (dạng 19xx hoặc 20xx)
        var match = rawText.match(/\b(19|20)\d{2}\b/);

        if (match) {
            // 2. Ép kiểu về Số Nguyên bằng parseInt với cơ số 10
            year = parseInt(match[0], 10);
        }

        // 3. Chốt chặn an toàn: Nếu parse thất bại (NaN), trả về năm mặc định
        if (isNaN(year)) {
            year = 2026;
        }
        status = $doc.find(".aim-hero__meta").find(".aim-status--airing").text();

        var categoryResult = [];
        $doc.find(".aim-cate-chip").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                categoryResult.push("[" + name + "](" + slug + ")");
            }
        });

        // THÊM DÒNG NÀY: Chuyển mảng thành Chuỗi nối nhau bằng dấu phẩy
        category = categoryResult.join(", ");

        episode_current = $doc.find(".aim-hero__meta").find("span:last").text();

        var servers = [];
        var items = [];
        $doc.find(".aim-ep-btn").each(function() {
            var link = this.attr("href");
            var name = this.attr("title");
            items.push({
                id: link,
                name: name,
                slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1")
            });
        });
        servers.push({
            name: "Server",
            episodes: items
        });
        servers = sortEpisodesByName(servers);

        // === BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐỒNG NHẤT ID ===
        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: slug || url || "error",
            title: "error",
            servers: []
        });
    }
}

function sortEpisodesByName(data) {
    try {
        if (!Array.isArray(data)) return data;

        data.forEach(function(server) {
            if (server.episodes && Array.isArray(server.episodes)) {
                server.episodes.sort(function(a, b) {
                    var nameA = a.name || '';
                    var nameB = b.name || '';

                    // Bắt chuỗi số đầu tiên xuất hiện trong tên (hỗ trợ cả số thập phân như 2.5)
                    var matchA = nameA.match(/\d+(\.\d+)?/);
                    var matchB = nameB.match(/\d+(\.\d+)?/);

                    var numA = matchA ? parseFloat(matchA[0]) : null;
                    var numB = matchB ? parseFloat(matchB[0]) : null;

                    // 1. Nếu cả 2 đều tìm thấy số -> so sánh theo giá trị số
                    if (numA !== null && numB !== null) {
                        if (numA !== numB) {
                            return numA - numB;
                        }
                    }

                    // 2. Nếu 1 bên có số, 1 bên không -> ưu tiên item có số đứng trước
                    if (numA !== null) return -1;
                    if (numB !== null) return 1;

                    // 3. Nếu cả 2 không có số (hoặc số bằng nhau) -> sắp xếp tự nhiên theo chuỗi
                    return nameA.localeCompare(nameB, undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    });
                });
            }
        });

        return data;
    } catch (e) {
        log("sortEpisodesByName[err]:\n " + e);
        return data;
    }
}

function parseDetailResponse(html, url) {
    log("parseDetailResponse[url]: \n" + url);
    try {
        var $doc = _$(html);
        var script = $doc.find("script:content('wp_servers')").html();
        var embed = script.match(/AHS["'][^"']+["']([^"']+)["']/i);
        var stream = "";
        if (embed && embed[1]) {
            stream = embed[1];
        }
        log("parseDetailResponse[embed]: \n" + stream);
        return JSON.stringify({
            "url": stream,
            "isEmbed": true,
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
    } catch (e) {
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({
            "url": "",
            "headers": {}
        });
    }
}

function parseEmbedResponse(html, url) {
    log("parseEmbedResponse[url]: \n" + url);
    try {
        var linkstream = "";

        // Tìm link m3u8 ẩn trong mã nguồn của trang iframe
        var linkmatch = html.match(/(https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*)/i);
        if (linkmatch && linkmatch[1]) {
            linkstream = linkmatch[1].replace(/\\/g, "");
        }

        log("parseEmbedResponse[url]: \n" + linkstream);
        return JSON.stringify({
            url: linkstream,
            isEmbed: false,
            mimeType: linkstream.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
            headers: {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
    } catch (e) {
        log("parseEmbedResponse[err]:\n " + e);
        return JSON.stringify({
            url: "",
            isEmbed: false
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
    return "[]";
}

function parseYearsResponse(html) {
    return "[]";
}

// /phim-moi-cap-nhap/tat-ca-1.html
// {\"link\":\"/phim-moi-cap-nhap/tat-ca-1.html\",\"name\":\"Phim Mới\"},
function getLISTmenu() {
    return `[{\"link\":\"/phim-moi-cap-nhap/tat-ca-1.html\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/anime-1.html\",\"name\":\"Anime\"},{\"link\":\"/the-loai/hanh-dong-2.html\",\"name\":\"Hành động\"},{\"link\":\"/the-loai/hai-huoc-3.html\",\"name\":\"Hài hước\"},{\"link\":\"/the-loai/tinh-cam-4.html\",\"name\":\"Tình cảm\"},{\"link\":\"/the-loai/harem-5.html\",\"name\":\"Harem\"},{\"link\":\"/the-loai/bi-an-6.html\",\"name\":\"Bí ẩn\"},{\"link\":\"/the-loai/bi-kich-7.html\",\"name\":\"Bi kịch\"},{\"link\":\"/the-loai/gia-tuong-8.html\",\"name\":\"Giả tưởng\"},{\"link\":\"/the-loai/hoc-duong-9.html\",\"name\":\"Học đường\"},{\"link\":\"/the-loai/doi-thuong-10.html\",\"name\":\"Đời thường\"},{\"link\":\"/the-loai/vo-thuat-11.html\",\"name\":\"Võ thuật\"},{\"link\":\"/the-loai/tro-choi-12.html\",\"name\":\"Trò chơi\"},{\"link\":\"/the-loai/tham-tu-13.html\",\"name\":\"Thám tử\"},{\"link\":\"/the-loai/lich-su-14.html\",\"name\":\"Lịch sử\"},{\"link\":\"/the-loai/sieu-nang-luc-15.html\",\"name\":\"Siêu năng lực\"},{\"link\":\"/the-loai/shounen-16.html\",\"name\":\"Shounen\"},{\"link\":\"/the-loai/shounen-ai-17.html\",\"name\":\"Shounen AI\"},{\"link\":\"/the-loai/shoujo-18.html\",\"name\":\"Shoujo\"},{\"link\":\"/the-loai/shoujo-ai-19.html\",\"name\":\"Shoujo AI\"},{\"link\":\"/the-loai/the-thao-20.html\",\"name\":\"Thể thao\"},{\"link\":\"/the-loai/am-nhac-21.html\",\"name\":\"Âm nhạc\"},{\"link\":\"/the-loai/psychological-22.html\",\"name\":\"Psychological\"},{\"link\":\"/the-loai/mecha-23.html\",\"name\":\"Mecha\"},{\"link\":\"/the-loai/quan-doi-24.html\",\"name\":\"Quân đội\"},{\"link\":\"/the-loai/drama-25.html\",\"name\":\"Drama\"},{\"link\":\"/the-loai/seinen-26.html\",\"name\":\"Seinen\"},{\"link\":\"/the-loai/sieu-nhien-27.html\",\"name\":\"Siêu nhiên\"},{\"link\":\"/the-loai/phieu-luu-28.html\",\"name\":\"Phiêu lưu\"},{\"link\":\"/the-loai/kinh-di-29.html\",\"name\":\"Kinh dị\"},{\"link\":\"/the-loai/ma-ca-rong-30.html\",\"name\":\"Ma cà rồng\"},{\"link\":\"/the-loai/tokusatsu-31.html\",\"name\":\"Tokusatsu\"},{\"link\":\"/the-loai/samurai-32.html\",\"name\":\"Samurai\"},{\"link\":\"/the-loai/vien-tuong-33.html\",\"name\":\"Viễn tưởng\"},{\"link\":\"/the-loai/cn-animation-34.html\",\"name\":\"CN Animation\"},{\"link\":\"/the-loai/tien-hiep-35.html\",\"name\":\"Tiên hiệp\"},{\"link\":\"/the-loai/kiem-hiep-36.html\",\"name\":\"Kiếm hiệp\"},{\"link\":\"/the-loai/xuyen-khong-37.html\",\"name\":\"Xuyên không\"},{\"link\":\"/the-loai/trung-sinh-38.html\",\"name\":\"Trùng sinh\"},{\"link\":\"/the-loai/huyen-ao-39.html\",\"name\":\"Huyền ảo\"},{\"link\":\"/the-loai/cna-ngon-tinh-40.html\",\"name\":\"[CNA] Ngôn tình\"},{\"link\":\"/the-loai/di-gioi-41.html\",\"name\":\"Dị giới\"},{\"link\":\"/the-loai/cna-hai-huoc-42.html\",\"name\":\"[CNA] Hài hước\"},{\"link\":\"/the-loai/dam-my-43.html\",\"name\":\"Đam mỹ\"},{\"link\":\"/the-loai/vo-hiep-44.html\",\"name\":\"Võ hiệp\"},{\"link\":\"/the-loai/ecchi-45.html\",\"name\":\"Ecchi\"},{\"link\":\"/the-loai/demon-46.html\",\"name\":\"Demon\"},{\"link\":\"/the-loai/live-action-47.html\",\"name\":\"Live Action\"},{\"link\":\"/the-loai/thriller-48.html\",\"name\":\"Thriller\"},{\"link\":\"/the-loai/khoa-huyen-49.html\",\"name\":\"Khoa huyễn\"}]`
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
        } else if (typeStr === "filter") {
            menuItem = {
                "value": link,
                "name": name
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
