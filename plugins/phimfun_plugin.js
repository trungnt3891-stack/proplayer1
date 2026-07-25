var BASEURL = "https://phimfun.net"; 
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
    return JSON.stringify({
      "id": "phimfun",
      "name": "Nguồn Phim Fun",
      "description": "Nguồn phim mới.",
      "version": "1.0.4",
      "info": "Nguồn phim dự phòng, có server riêng có thể sơ cưa khi những nguồn khác bị lỗi. Có cơ chế lưu lại tập vừa xem và có thể chuyển tập không cần quay lại menu phim.",
      "baseUrl": "https://phimfun.net",
      "iconUrl": "https://phimfun.net/Content/PhimFun/Imgs/phimFun.png",
      "isEnabled": true,
      "type": "MOVIE",
      "playerTpye": "embed"
    })
};

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("["+BASEURL+"] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("["+BASEURL+"] " + msg);
    }
}

function getHomeSections() {
    var listurl = '[{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"}]';
    var menulist = buildMenu(listurl, true);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}



function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl,"filter");
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
function decodeHTMLEntities(str) {
    if (!str) return '';
    return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
        if (dec) {
            return String.fromCharCode(parseInt(dec, 10));
        }
        if (hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }
        return match;
    });
}


function getUrlList(slug, filtersJson) {
    try {
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
          	resultUrl = resultUrl.replace(/(\d+)$/i,"");
            resultUrl += page;
        }
      	log("urlList: " + resultUrl)
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        console.log(e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    if (filtersJson) {
        var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
        try {
            var filters = JSON.parse(fixedJson);
            var page = parseInt(filters.page) || 1;
            if (page > 1) {
                return BASEURL + "/search?k=" + encodeURIComponent(keyword) + "&page=" + page;
            } else {
                return BASEURL + "/search?k=" + encodeURIComponent(keyword);
            }
        } catch (jsonErr) {
            return BASEURL + "/search?k=" + encodeURIComponent(keyword);
        }
    }
    return BASEURL + "/search?k=" + encodeURIComponent(keyword);
}

// https://phimfun.net/tuyen-tap-3
// https://phimfun.net/the-loai/phim-le-245
// https://phimfun.net/the-loai/chien-tranh-6
// https://phimfun.net/search?k=t%C3%B4i
// https://phimfun.net/filter?filmForm=440&category=393&country=&sort=&release=
//var BASEURL = "https://phimfun.net";
//var filtersJson = '{page:2}';
//console.log(getUrlList("https://phimfun.net/search?k=t%C3%B4i", filtersJson));
//console.log(getUrlSearch("the boy",filtersJson))


function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function fixHref(href) {
    if (!href) return '';

    // 1. Loại bỏ khoảng trắng thừa ở đầu và cuối
    let cleanHref = href.trim();

    // 2. Các mẫu đường dẫn cần bỏ qua (không gắn thêm BASEURL)
    const ignorePattern = /^(#|https?:\/\/|\/\/|mailto:|tel:|javascript:|data:|blob:)/i;

    if (ignorePattern.test(cleanHref)) {
        return cleanHref;
    }

    // 3. Xử lý trường hợp đường dẫn bắt đầu bằng dấu / (server-relative path)
    if (cleanHref.startsWith('/')) {
        try {
            const urlObj = new URL(BASEURL);
            return urlObj.origin + cleanHref;
        } catch (e) {
            return BASEURL + cleanHref;
        }
    }

    // 4. Đường dẫn tương đối thông thường
    return BASEURL + cleanHref;
}


function parseListResponse(html, $url) {
  	log("parseListResponse: " + $url)
    try {
      	var quality = "";
        var items = [];
        _$(html).find(".MovieList").find("li").each(function() {
            var href = this.find("a").attr("href");
            href = fixHref(href);
          	href = href.replace("/phim/","/xem-phim/");
            var title = this.find("img").attr("alt");
          	title =  decodeHTMLEntities(title)
            var src = this.find("img").attr("src");
          	if(src.indexOf("base64") > -1){
              src = this.find("img").attr("data-src");
            }
            src = fixHref(src)

            var episode_current = this.find(".mc__ep-badge").text().trim();
           // var quality = this.find(".Info").find("span.Qlty").text().trim();

            // Hàm kiểm tra URL có phải là link thật hay chứa mã JS rác
            function isValidMediaUrl(url) {
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
            }
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
        log("parseListResponse: " + e);
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

/*
var BASEURL = "https://animehay09.site/lich-su";
//var BASEAPI = "https://k8s.onflixcdn.com/api";
var htmlsource = $("#labHtmlEditorWrap #labHtmlTreeContainer .lab-dom-pure-text").html();
JSON.parse(parseListResponse(sourceHTML, BASEURL));
//var html = outerHTML;

*/



function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}
function parseMovieDetail(html, url) {
  	log("parseMovieDetail: " + url)
    try {
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
        lname = _$(html).find("h1").text();
				lname =  decodeHTMLEntities(lname)
        var ldes = _$(html).find("h2:content('Thông tin về phim')").next().text();
      	ldes =  decodeHTMLEntities(ldes)
        var year = 2026;
        var extra = "";

        var rawText = _$(html).find(".Date").text();

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
        status = _$(html).find(".aim-hero__meta").find(".aim-status--airing").text();

        var categoryResult = [];
        _$(html).find(".Description").find(".Genre").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();
            name =  decodeHTMLEntities(name);

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                categoryResult.push("[" + name + "](" + slug + ")");
            }
        });

        // THÊM DÒNG NÀY: Chuyển mảng thành Chuỗi nối nhau bằng dấu phẩy
        category = categoryResult.join(", ");
        var actorResult = [];
        _$(html).find(".Description").find(".Cast").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();
            name =  decodeHTMLEntities(name);

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                actorResult.push("[" + name + "](" + slug + ")");
            }
        });

        // THÊM DÒNG NÀY: Chuyển mảng thành Chuỗi nối nhau bằng dấu phẩy
        lactor = actorResult.join(", ");


        quality = _$(html).find("span.Time").text();
        episode_current = _$(html).find(".aim-hero__meta").find("span:last").text();
        rating = _$(html).find(".post-ratings").text();
        rating = parseInt(rating, 10);
        var servers = [];
        stastus = 0;
        numSV = 0;
        $listSV = _$(html).find(".SeasonBx:content('Danh sách máy chủ')").find("a").each(function() {
            numSV++;
            var nameSV = "Server " + numSV;
            var items = [];
            _$(html).find(".SeasonBx:content('Danh sách tập')").find("#halim-list-server").find("a").each(function() {
                var link = this.attr("href");
                link = fixHref(link);
                if(numSV > 1){
                    link = link + "?sv"+numSV+"=true";
                }
                var name = this.attr("title");
                items.push({
                    id: link,
                    name: name,
                    slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1")
                })
                stastus++;
            });
            servers.push({
                name: nameSV,
                episodes: items
            })
            servers = sortEpisodesByName(servers);
        })
        episode_current = "Đang có: " + status;
				log("servers: " + JSON.stringify(servers))
        // === BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐỒNG NHẤT ID ===
        return JSON.stringify({
            id: id, // BẮT BUỘC: ID phải là slug rút gọn của bộ phim để cả 2 lần fetch khớp nhau
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: quality,
            year: year,
            rating: rating,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers, // Lần 1 (trang chi tiết) sẽ là []. Lần 2 (khi chạy qua extra) sẽ có đầy đủ tập
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra // Lần 2 (trang xem phim) extra sẽ rỗng để dừng chu kỳ tải ngầm
        });

    } catch (e) {
        log("parseMovieDetail:" + e)
        return JSON.stringify({
            id: slug || url || "error",
            title: "error",
            servers: []
        });
    }
}

/*
// https://edge.narto-drama.com/e/rs/detail/watch/tro-choi-cong-so/9/refresh-source?lang=vi-VN


BASEURL = "https://phimfun.net";
var html = sourceHTML;
var $url = "https://animehay09.site/thong-tin-phim/tenkou-saki-no-seiso-karen-na-bishoujo-ga-4780.html";
JSON.parse(parseMovieDetail(sourceHTML, $url));
// https://edge.narto-drama.com/e/rs/detail/watch/tro-choi-cong-so/check-new-episodes?_t=1784684483895&_=1784684480875
*/


function sortEpisodesByName(data) {
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
}




function parseDetailResponse(html, url) {
    try {
        var dataSV = {};
        var $stream = _$(html).find("#iframeStream").attr("src");
        var servers = [];
        dataSV.stream = $stream;
      	dataSV.current = url;
        stastus = 0;
        numSV = 0;
        $listSV = _$(html).find(".SeasonBx:content('Danh sách máy chủ')").find("a").each(function() {
            numSV++;
            var nameSV = "Server " + numSV;
            var items = [];
            _$(html).find(".SeasonBx:content('Danh sách tập')").find("#halim-list-server").find("a").each(function() {
                var link = this.attr("href");
                link = fixHref(link);
                if (numSV > 1) {
                    link = link + "?sv" + numSV + "=true";
                }
                var name = this.attr("title");
                items.push({
                    id: link,
                    name: name,
                    slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1")
                })
                stastus++;
            });
            servers.push({
                name: nameSV,
                episodes: items
            })
            servers = sortEpisodesByName(servers);
        })
        dataSV.servers = servers;
        var customJS = rawJS(dataSV);
         return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": url,
                "Custom-Js": customJS
            },
            subtitles: []
        });
    } catch (e) {
        log("parseDetailResponse error: " + e.message);
        return JSON.stringify({
            url: "",
            isEmbed: false,
            headers: {},
            subtitles: []
        });
    }
}

function rawJS(config) {
    return `
(function() {
    // =========================================================
    // 1. DIỆT SẠCH HEAD VÀ BODY CỦA WEB GỐC
    // =========================================================
    if (document.head) {
        document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
    }
    document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

    // =========================================================
    // 2. DỮ LIỆU & BIẾN KHỞI TẠO
    // =========================================================
    const DATA = ${JSON.stringify(config)};
    const INITIAL_STREAM = DATA.stream || "";
    const CURRENT_URL = DATA.current || "";
    const SERVERS = Array.isArray(DATA.servers) ? DATA.servers : [];
    const AUTO_HIDE_TIME = 15000; // 15 giây tự ẩn UI
    const movieId = DATA.movieId || "movie_default_id";
    const storageKey = "anime_history_" + movieId;
    const widthStorageKey = "anime_player_iframe_width";
    const heightStorageKey = "anime_player_iframe_height";
    const scaleStorageKey = "anime_player_iframe_scale";

    let currentServerIndex = 0;
    let currentEpisodeIndex = 0;
    let hideTimer = null;

    // =========================================================
    // 3. INJECT CSS CLEAN MỚI
    // =========================================================
    let styleTag = document.createElement('style');
    styleTag.textContent = \`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
        
        #framePlay {
            position: fixed !important; top: 50% !important; left: 50% !important;
            transform-origin: center center !important; border: none !important;
            margin: 0 !important; padding: 0 !important; z-index: 1 !important;
            display: block !important;
            transition: width 0.15s ease, height 0.15s ease, transform 0.15s ease !important;
        }

        /* Lớp phủ tương tác đè lên iframe */
        #iframe-event-overlay {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            z-index: 10 !important; background: transparent !important;
            cursor: pointer !important;
        }

        .floating-control-ui { 
            opacity: 0 !important; 
            pointer-events: none !important;
            transition: opacity 0.4s ease !important; 
        }
        .floating-control-ui.active-show { 
            opacity: 1 !important; 
            pointer-events: auto !important;
        }

        /* Thông báo Play nằm ở giữa màn hình (dịch xuống 50px) */
        #center-play-notice {
            position: fixed !important;
            top: calc(50% + 50px) !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 999999 !important;
            background: rgba(15, 15, 18, 0.92) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: #fff !important;
            padding: 12px 24px !important;
            border-radius: 30px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease, transform 0.3s ease !important;
            opacity: 0;
            text-align: center !important;
            white-space: nowrap !important;
        }

        #server-select-box {
            appearance: none !important; -webkit-appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
            background-repeat: no-repeat !important; background-position: right 6px center !important;
            background-size: 10px !important; padding-right: 22px !important;
        }
        .dim-btn {
            background: rgba(255, 255, 255, 0.12) !important; color: #fff !important; border: none !important;
            border-radius: 4px !important; width: 22px !important; height: 22px !important; cursor: pointer !important;
            font-size: 13px !important; font-weight: bold !important; display: inline-flex !important;
            align-items: center !important; justify-content: center !important; padding: 0 !important; line-height: 1 !important;
        }
        .dim-btn:hover { background: rgba(255, 255, 255, 0.25) !important; }
        .dim-input {
            width: 38px !important; background: transparent !important; border: none !important;
            color: #fff !important; text-align: center !important; font-size: 12px !important;
            font-weight: 700 !important; outline: none !important; padding: 0 !important;
        }
        .dim-input::-webkit-outer-spin-button, .dim-input::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
        .dim-input[type=number] { -moz-appearance: textfield !important; }
        
        .ep-grid-btn {
            display: flex !important; align-items: center !important; justify-content: center !important;
            padding: 8px 12px !important; border-radius: 6px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #fff !important; cursor: pointer !important; font-size: 12px !important; font-weight: 700 !important;
            text-align: center !important; white-space: nowrap !important; transition: all 0.2s ease !important;
            user-select: none !important; box-sizing: border-box !important; width: 100% !important; min-height: 36px !important;
        }
        .ep-grid-btn:hover { border-color: rgba(255, 255, 255, 0.3) !important; }
        .ep-grid-btn.active { background-color: #e50914 !important; border-color: #e50914 !important; }
        .ep-grid-btn.inactive { background-color: rgba(255, 255, 255, 0.08) !important; }

        .toast-action-btn {
            background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; border: 1px solid rgba(255, 255, 255, 0.2) !important;
            padding: 5px 10px !important; border-radius: 5px !important; font-size: 11px !important; font-weight: 700 !important;
            cursor: pointer !important; transition: background 0.2s ease !important; display: inline-flex !important; align-items: center !important;
        }
        .toast-action-btn:hover { background: rgba(255, 255, 255, 0.3) !important; }
        .toast-action-btn.primary { background: #e50914 !important; border-color: #e50914 !important; }
        .toast-action-btn.primary:hover { background: #b80710 !important; }
    \`;
    document.head.appendChild(styleTag);

    // =========================================================
    // 4. OVERLAY LOADING & TRUNG TÂM PLAY NOTICE
    // =========================================================
    let overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: '999998', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff'
    });

    function showLoading(msg) {
        msg = msg || 'Đang tải...';
        overlay.innerHTML = '<div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite;"></div><div style="margin-top: 14px; font-size: 13px; color: #ccc; font-weight: 500;">' + msg + '</div>';
        overlay.style.opacity = '1';
        overlay.style.display = 'flex';
        if (!document.getElementById('loading-overlay')) document.body.appendChild(overlay);
    }

    function hideLoading() {
        overlay.style.transition = 'opacity 0.25s ease';
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.style.display = 'none'; }, 250);
    }

    // Quản lý Dòng thông báo Nhấn Play giữa màn hình
    function showCenterPlayNotice(text) {
        let notice = document.getElementById('center-play-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.id = 'center-play-notice';
            document.body.appendChild(notice);
        }
        notice.textContent = text;
        requestAnimationFrame(function() {
            notice.style.opacity = '1';
        });

        // Bật lại lớp phủ iframe để bắt cú click đầu tiên của người dùng
        let overlayEvt = document.getElementById('iframe-event-overlay');
        if (overlayEvt) overlayEvt.style.display = 'block';
    }

    function hideCenterPlayNotice() {
        let notice = document.getElementById('center-play-notice');
        if (notice) notice.style.opacity = '0';
        
        // Ẩn lớp phủ event tạm thời để bấm trực tiếp vào nút Play của iframe
        let overlayEvt = document.getElementById('iframe-event-overlay');
        if (overlayEvt) overlayEvt.style.display = 'none';
    }

    // Toast Lịch sử xem
    function showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName) {
        let toast = document.getElementById('mini-action-toast');
        if (toast) toast.remove();

        toast = document.createElement('div');
        toast.id = 'mini-action-toast';
        toast.className = 'floating-control-ui active-show';
        toast.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important; background-color: rgba(22, 22, 26, 0.95) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff !important; padding: 12px 16px !important; border-radius: 8px !important; font-size: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; transition: opacity 0.4s ease !important; opacity: 0; display: flex !important; flex-direction: column !important; gap: 10px !important; max-width: 380px !important;';

        let title = document.createElement('div');
        title.innerHTML = '📍 Lần trước bạn đã xem đến <b>' + savedEpName + '</b>.';

        let btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex !important; gap: 6px !important; align-items: center !important;';

        let btnHistory = document.createElement('button');
        btnHistory.className = 'toast-action-btn primary';
        btnHistory.textContent = savedEpName;
        btnHistory.onclick = function(e) {
            e.stopPropagation();
            toast.remove();
            fetchAndPlayEpisode(savedSrvIdx, savedEpIdx);
        };

        let btnNext = null;
        if (nextEpIdx !== null) {
            btnNext = document.createElement('button');
            btnNext.className = 'toast-action-btn';
            btnNext.textContent = 'Xem ' + nextEpName;
            btnNext.onclick = function(e) {
                e.stopPropagation();
                toast.remove();
                fetchAndPlayEpisode(savedSrvIdx, nextEpIdx);
            };
        }

        let btnCancel = document.createElement('button');
        btnCancel.className = 'toast-action-btn';
        btnCancel.textContent = 'Hủy ✕';
        btnCancel.onclick = function(e) { e.stopPropagation(); toast.remove(); };

        btnGroup.appendChild(btnHistory);
        if (btnNext) btnGroup.appendChild(btnNext);
        btnGroup.appendChild(btnCancel);

        toast.appendChild(title);
        toast.appendChild(btnGroup);
        document.body.appendChild(toast);

        requestAnimationFrame(function() { toast.classList.add('active-show'); });
        resetAutoHideTimer();
    }

    // =========================================================
    // 5. HIỂN THỊ / ẨN THANH CÔNG CỤ TỰ ĐỘNG
    // =========================================================
    function resetAutoHideTimer() {
        let elements = document.querySelectorAll('.floating-control-ui');
        elements.forEach(function(el) { el.classList.add('active-show'); });

        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function() {
            elements.forEach(function(el) { el.classList.remove('active-show'); });
            let popupGrid = document.getElementById("episode-grid-popup");
            let scalePopupGrid = document.getElementById("scale-grid-popup");
            if (popupGrid) popupGrid.style.display = "none";
            if (scalePopupGrid) scalePopupGrid.style.display = "none";

            // Khi UI tự ẩn, hiển thị lại lớp phủ để lần hover/click tiếp theo lại kích hoạt UI
            let overlayEvt = document.getElementById('iframe-event-overlay');
            if (overlayEvt) overlayEvt.style.display = 'block';
        }, AUTO_HIDE_TIME);
    }

    // =========================================================
    // 6. XỬ LÝ LỊCH SỬ XEM
    // =========================================================
    function matchCurrentEpisode() {
        let foundServer = 0;
        let foundEpisode = 0;

        if (CURRENT_URL) {
            SERVERS.forEach(function(srv, sIdx) {
                if (srv && Array.isArray(srv.episodes)) {
                    srv.episodes.forEach(function(ep, eIdx) {
                        if (ep.id === CURRENT_URL || ep.url === CURRENT_URL || (ep.id && CURRENT_URL.includes(ep.id))) {
                            foundServer = sIdx;
                            foundEpisode = eIdx;
                        }
                    });
                }
            });
        }

        currentServerIndex = foundServer;
        currentEpisodeIndex = foundEpisode;

        let savedHistoryRaw = localStorage.getItem(storageKey);
        if (savedHistoryRaw) {
            try {
                let savedHistory = JSON.parse(savedHistoryRaw);
                let savedSrvIdx = savedHistory.serverIndex || 0;
                let savedEpIdx = savedHistory.episodeIndex || 0;

                let diff = Math.abs(currentEpisodeIndex - savedEpIdx);

                if (diff > 2) {
                    let savedSrv = SERVERS[savedSrvIdx];
                    let savedEp = savedSrv && savedSrv.episodes ? savedSrv.episodes[savedEpIdx] : null;
                    
                    if (savedEp) {
                        let savedEpName = savedEp.name || savedEp.slug || ('Tập ' + (savedEpIdx + 1));
                        let nextEpIdx = (savedEpIdx + 1 < savedSrv.episodes.length) ? (savedEpIdx + 1) : null;
                        let nextEpName = "";
                        if (nextEpIdx !== null) {
                            let nextEp = savedSrv.episodes[nextEpIdx];
                            nextEpName = nextEp ? (nextEp.name || nextEp.slug || ('Tập ' + (nextEpIdx + 1))) : ('Tập ' + (nextEpIdx + 1));
                        }

                        setTimeout(function() {
                            showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName);
                        }, 800);
                    }
                }
            } catch (e) {
                console.error("Error reading history", e);
            }
        }

        saveCurrentState();
    }

    function saveCurrentState() {
        localStorage.setItem(storageKey, JSON.stringify({
            serverIndex: currentServerIndex,
            episodeIndex: currentEpisodeIndex,
            timestamp: Date.now()
        }));
    }

    // =========================================================
    // 7. KÍCH THƯỚC IFRAME
    // =========================================================
    function getSavedWidth() { return parseInt(localStorage.getItem(widthStorageKey), 10) || window.innerWidth; }
    function getSavedHeight() { return parseInt(localStorage.getItem(heightStorageKey), 10) || window.innerHeight; }
    function getSavedScale() { return parseFloat(localStorage.getItem(scaleStorageKey)) || 1.0; }

    function applyIframeDimensions(w, h, s) {
        w = Math.max(150, parseInt(w, 10) || window.innerWidth);
        h = Math.max(100, parseInt(h, 10) || window.innerHeight);
        s = parseFloat(s) || 1.0;

        let iframe = document.getElementById("framePlay");
        if (iframe) {
            iframe.style.setProperty('width', w + 'px', 'important');
            iframe.style.setProperty('height', h + 'px', 'important');
            iframe.style.setProperty('transform', 'translate(-50%, -50%) scale(' + s + ')', 'important');
        }

        localStorage.setItem(widthStorageKey, w);
        localStorage.setItem(heightStorageKey, h);
        localStorage.setItem(scaleStorageKey, s);

        let wInput = document.getElementById("iframe-w-input");
        let hInput = document.getElementById("iframe-h-input");
        let scaleTrigger = document.getElementById("scale-select-trigger");

        if (wInput && document.activeElement !== wInput) wInput.value = w;
        if (hInput && document.activeElement !== hInput) hInput.value = h;
        if (scaleTrigger) scaleTrigger.textContent = "Scale " + s.toFixed(1) + "x ▼";
    }

    function fetchAndPlayEpisode(serverIdx, epIdx) {
        currentServerIndex = serverIdx;
        currentEpisodeIndex = epIdx;
        saveCurrentState();

        let activeServer = SERVERS[currentServerIndex];
        let activeEpisode = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;

        if (!activeEpisode || !activeEpisode.id) return;

        let epName = activeEpisode.name || ('Tập ' + (currentEpisodeIndex + 1));
        showLoading('Đang tải ' + epName.toLowerCase() + '...');

        fetch(activeEpisode.id, { headers: { 'Accept': 'text/html' } })
            .then(function(res) { return res.text(); })
            .then(function(htmlText) {
                let parser = new DOMParser();
                let doc = parser.parseFromString(htmlText, 'text/html');
                let iframeStream = doc.querySelector('#iframeStream');

                if (iframeStream && iframeStream.getAttribute('src')) {
                    let realStreamUrl = iframeStream.getAttribute('src').trim();
                    if (realStreamUrl.startsWith("//")) realStreamUrl = window.location.protocol + realStreamUrl;

                    let framePlay = document.getElementById('framePlay');
                    if (framePlay) {
                        framePlay.setAttribute("referrerpolicy", "no-referrer");
                        framePlay.src = realStreamUrl;
                        
                        framePlay.onload = function() {
                            hideLoading();
                            // Hiển thị thông báo yêu cầu nhấn Play sau khi tải tập mới xong
                            showCenterPlayNotice('▶ Đã chuyển ' + epName + '. Vui lòng nhấn Play để tiếp tục xem!');
                        };
                    }
                } else {
                    hideLoading();
                }
            })
            .catch(function(err) {
                console.error(err);
                hideLoading();
            })
            .finally(function() {
                updateEpisodeGridState();
                updateNavState();
                resetAutoHideTimer();
            });
    }

    // =========================================================
    // 8. LAYOUT BẢNG CÔNG CỤ VÀ LỚP PHỦ EVENTS
    // =========================================================
    function initBaseLayout() {
        matchCurrentEpisode();
        showLoading("Đang tải...");

        // 1. Tạo IFRAME Video
        let framePlay = document.createElement("iframe");
        framePlay.id = "framePlay";
        framePlay.scrolling = "no";
        framePlay.setAttribute("referrerpolicy", "no-referrer");
        framePlay.setAttribute("allowfullscreen", "true");
        framePlay.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
        
        let cleanInitialStream = INITIAL_STREAM;
        if (cleanInitialStream.startsWith("//")) cleanInitialStream = window.location.protocol + cleanInitialStream;
        framePlay.src = cleanInitialStream;

        framePlay.onload = function() {
            hideLoading();
            applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
            // Lần tải đầu tiên -> Hiện thông báo yêu cầu nhấn Play ngay giữa màn hình
            showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');
        };
        document.body.appendChild(framePlay);

        // 2. Tạo Lớp phủ bắt sự kiện Hover / Click đè lên iframe
        let eventOverlay = document.createElement("div");
        eventOverlay.id = "iframe-event-overlay";
        
        function handleOverlayTrigger() {
            resetAutoHideTimer();
            hideCenterPlayNotice(); // Nhấp/hover vào overlay sẽ ẩn ngay dòng thông báo để xem video
        }

        eventOverlay.addEventListener('mousemove', handleOverlayTrigger);
        eventOverlay.addEventListener('click', handleOverlayTrigger);
        eventOverlay.addEventListener('touchstart', handleOverlayTrigger, { passive: true });
        document.body.appendChild(eventOverlay);

        // 3. Thanh điều hướng công cụ (Top Right)
        let container = document.createElement("div");
        container.id = "floating-select-box";
        container.className = "floating-control-ui active-show";
        
        Object.assign(container.style, {
            position: "fixed", top: "16px", right: "20px", zIndex: "999999",
            backgroundColor: "rgba(22, 22, 26, 0.92)", backdropFilter: "blur(16px)", webkitBackdropFilter: "blur(16px)",
            padding: "5px 8px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.6)", color: "#fff",
            fontSize: "12px", display: "flex", flexDirection: "row", alignItems: "center",
            gap: "6px", boxSizing: "border-box", flexWrap: "nowrap"
        });

        function createDimensionControl(type) {
            let isW = (type === 'W');
            let group = document.createElement("div");
            Object.assign(group.style, {
                display: "flex", alignItems: "center", gap: "2px",
                backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 5px",
                borderRadius: "5px", border: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box"
            });

            let lbl = document.createElement("span");
            lbl.textContent = isW ? "W:" : "H:";
            lbl.style.cssText = "font-size: 11px !important; color: #aaa !important; font-weight: 700 !important; margin-right: 2px !important;";

            let btnMinus = document.createElement("button");
            btnMinus.className = "dim-btn"; btnMinus.textContent = "-";
            btnMinus.onclick = function(e) {
                e.stopPropagation();
                let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                applyIframeDimensions(isW ? curW - 20 : curW, isW ? curH : curH - 20, curS);
            };

            let input = document.createElement("input");
            input.id = isW ? "iframe-w-input" : "iframe-h-input";
            input.type = "number"; input.className = "dim-input";
            input.value = isW ? getSavedWidth() : getSavedHeight();
            input.onchange = function(e) {
                let val = parseInt(e.target.value, 10);
                if (!isNaN(val)) {
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? val : curW, isW ? curH : val, curS);
                }
            };
            input.onkeydown = function(e) { e.stopPropagation(); };

            let btnPlus = document.createElement("button");
            btnPlus.className = "dim-btn"; btnPlus.textContent = "+";
            btnPlus.onclick = function(e) {
                e.stopPropagation();
                let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                applyIframeDimensions(isW ? curW + 20 : curW, isW ? curH : curH + 20, curS);
            };

            group.appendChild(lbl); group.appendChild(btnMinus); group.appendChild(input); group.appendChild(btnPlus);
            return group;
        }

        let widthCtrl = createDimensionControl('W');
        let heightCtrl = createDimensionControl('H');

        let scaleTrigger = document.createElement("span");
        scaleTrigger.id = "scale-select-trigger";
        scaleTrigger.textContent = "Scale " + getSavedScale().toFixed(1) + "x ▼";
        styleClickable(scaleTrigger, "rgba(255, 255, 255, 0.08)");

        let serverSelect = document.createElement("select");
        serverSelect.id = "server-select-box";
        styleSelect(serverSelect);

        SERVERS.forEach(function(srv, idx) {
            let opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = srv.name || ("Server " + (idx + 1));
            opt.style.backgroundColor = "#1c1c1e";
            opt.style.color = "#fff";
            serverSelect.appendChild(opt);
        });
        serverSelect.value = currentServerIndex;

        serverSelect.onchange = function(e) {
            let newSrvIdx = parseInt(e.target.value, 10) || 0;
            currentServerIndex = newSrvIdx;
            renderEpisodeGrid();
            fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex);
        };

        let epTrigger = document.createElement("span");
        epTrigger.id = "ep-select-trigger";
        styleClickable(epTrigger, "#e50914");

        container.appendChild(widthCtrl);
        container.appendChild(heightCtrl);
        container.appendChild(scaleTrigger);
        container.appendChild(serverSelect);
        container.appendChild(epTrigger);

        let scalePopupGrid = createPopup("scale-grid-popup", "240px");
        let popupGrid = createPopup("episode-grid-popup", "340px");

        scaleTrigger.onclick = function(e) {
            e.stopPropagation();
            popupGrid.style.display = "none";
            scalePopupGrid.style.display = (scalePopupGrid.style.display === "grid") ? "none" : "grid";
        };

        epTrigger.onclick = function(e) {
            e.stopPropagation();
            scalePopupGrid.style.display = "none";
            popupGrid.style.display = (popupGrid.style.display === "grid") ? "none" : "grid";
        };

        function handleOutsideClick(e) {
            if (!container.contains(e.target) && !popupGrid.contains(e.target) && !scalePopupGrid.contains(e.target)) {
                popupGrid.style.display = "none";
                scalePopupGrid.style.display = "none";
            }
        }
        document.addEventListener("click", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick, { passive: true });

        // 4. Nút Prev / Next
        let navPrev = createNavButton("nav-prev-item", "&#10094;", "left", "30px");
        navPrev.onclick = function(e) {
            e.stopPropagation();
            if (currentEpisodeIndex > 0) fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex - 1);
        };

        let navNext = createNavButton("nav-next-item", "&#10095;", "right", "30px");
        navNext.onclick = function(e) {
            e.stopPropagation();
            let activeServer = SERVERS[currentServerIndex];
            if (activeServer && activeServer.episodes && currentEpisodeIndex < activeServer.episodes.length - 1) {
                fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex + 1);
            }
        };

        document.body.appendChild(container);
        document.body.appendChild(popupGrid);
        document.body.appendChild(scalePopupGrid);
        document.body.appendChild(navPrev);
        document.body.appendChild(navNext);

        resetAutoHideTimer();
        renderEpisodeGrid();
        renderScaleGrid();
        applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
    }

    function createPopup(id, width) {
        let el = document.createElement("div");
        el.id = id;
        el.className = "floating-control-ui active-show";
        Object.assign(el.style, {
            position: "fixed", top: "58px", right: "20px", zIndex: "1000000",
            backgroundColor: "rgba(22, 22, 26, 0.95)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px", borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)", width: width, maxHeight: "250px",
            overflowY: "auto", display: "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px"
        });
        return el;
    }

    function createNavButton(id, arrow, side, offset) {
        let btn = document.createElement("span");
        btn.id = id;
        btn.className = "floating-control-ui active-show";
        btn.innerHTML = arrow;
        Object.assign(btn.style, {
            position: "fixed", top: "50%", zIndex: "999999",
            transform: "translateY(-50%)", width: "42px", height: "42px", borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.6)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff",
            fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", userSelect: "none"
        });
        btn.style[side] = offset;
        return btn;
    }

    function renderEpisodeGrid() {
        let popupGrid = document.getElementById("episode-grid-popup");
        if (!popupGrid) return;
        popupGrid.innerHTML = "";

        let activeServer = SERVERS[currentServerIndex];
        let episodes = activeServer ? (activeServer.episodes || []) : [];

        episodes.forEach(function(ep, idx) {
            let epItem = document.createElement("div");
            epItem.className = "ep-grid-btn " + (idx === currentEpisodeIndex ? "active" : "inactive");
            epItem.textContent = ep.name || ep.slug || ("Tập " + (idx + 1));
            
            epItem.onclick = function(e) {
                e.stopPropagation();
                popupGrid.style.display = "none";
                fetchAndPlayEpisode(currentServerIndex, idx);
            };
            popupGrid.appendChild(epItem);
        });
        updateEpisodeGridState();
    }

    function updateEpisodeGridState() {
        let epTrigger = document.getElementById("ep-select-trigger");
        if (epTrigger) {
            let activeServer = SERVERS[currentServerIndex];
            let ep = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
            epTrigger.textContent = (ep ? (ep.name || ep.slug) : "Chọn Tập") + " ▼";
        }
    }

    function updateNavState() {
        let navPrev = document.getElementById("nav-prev-item");
        let navNext = document.getElementById("nav-next-item");
        let activeServer = SERVERS[currentServerIndex];
        let maxEp = activeServer && activeServer.episodes ? activeServer.episodes.length : 0;

        if (navPrev) navPrev.style.opacity = currentEpisodeIndex <= 0 ? "0.3" : "1";
        if (navNext) navNext.style.opacity = currentEpisodeIndex >= maxEp - 1 ? "0.3" : "1";
    }

    function renderScaleGrid() {
        let scalePopupGrid = document.getElementById("scale-grid-popup");
        if (!scalePopupGrid) return;
        scalePopupGrid.innerHTML = "";
        let curSavedScale = getSavedScale();

        for (let sVal = 0.5; sVal <= 2.05; sVal += 0.1) {
            let formattedVal = Math.round(sVal * 10) / 10;
            let item = document.createElement("div");
            item.className = "ep-grid-btn " + ((Math.abs(formattedVal - curSavedScale) < 0.05) ? "active" : "inactive");
            item.textContent = formattedVal.toFixed(1) + "x";
            item.onclick = function(e) {
                e.stopPropagation();
                scalePopupGrid.style.display = "none";
                applyIframeDimensions(getSavedWidth(), getSavedHeight(), formattedVal);
            };
            scalePopupGrid.appendChild(item);
        }
    }

    function styleSelect(el) {
        Object.assign(el.style, {
            padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#fff", cursor: "pointer",
            fontSize: "12px", outline: "none", boxSizing: "border-box", fontWeight: "600"
        });
    }

    function styleClickable(el, bgColor) {
        Object.assign(el.style, {
            padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: bgColor, color: "#fff", cursor: "pointer",
            fontSize: "12px", fontWeight: "700", textAlign: "center",
            transition: "background 0.2s", display: "inline-block", userSelect: "none",
            boxSizing: "border-box", flexShrink: "0"
        });
    }

    initBaseLayout();
})();
    `;
}
/*

BASEURL = "https://animehay09.site";
var html = sourceHTML;
//JSON.parse(parseDetailResponse(sourceHTML, BASEURL))
JSON.parse(parseEmbedResponse(sourceHTML, BASEURL))
// 'AHS': 'https://ahay.stream/embed-jw/75913'

*/


function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

/*
{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"},
{\"link\":\"/the-loai/phim-le-1\",\"name\":\"Phim Lẻ\"},
{\"link\":\"/the-loai/phim-bole-1\",\"name\":\"Phim Bộ\"},
{\"link\":\"/tuyen-tap-1\",\"name\":\"Loạt Phim\"},
 */
function getLISTmenu() {
    return `[{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/phim-le-1\",\"name\":\"Phim Lẻ\"},{\"link\":\"/the-loai/phim-bo-1\",\"name\":\"Phim Bộ\"},{\"link\":\"/the-loai/than-thoai-co-trang-1\",\"name\":\"Cổ trang\"},{\"link\":\"/the-loai/hanh-dong-1\",\"name\":\"Hành động\"},{\"link\":\"/the-loai/tam-ly-1\",\"name\":\"Tâm lý\"},{\"link\":\"/the-loai/chien-tranh-1\",\"name\":\"Chiến tranh\"},{\"link\":\"/the-loai/vo-thuat-kiem-hiep-1\",\"name\":\"Võ thuật - Kiếm hiệp\"},{\"link\":\"/the-loai/nhac-kich-1\",\"name\":\"Nhạc kịch\"},{\"link\":\"/the-loai/kinh-di-1\",\"name\":\"Kinh dị\"},{\"link\":\"/the-loai/toi-pham-hinh-su-1\",\"name\":\"Tội phạm - Hình sự\"},{\"link\":\"/the-loai/phieu-luu-1\",\"name\":\"Phiêu lưu\"},{\"link\":\"/the-loai/hai-huoc-1\",\"name\":\"Hài hước\"},{\"link\":\"/the-loai/vien-tuong-1\",\"name\":\"Viễn tưởng\"},{\"link\":\"/the-loai/khoa-hoc-tai-lieu-1\",\"name\":\"Khoa học - Tài liệu\"},{\"link\":\"/the-loai/hoat-hinh-1\",\"name\":\"Hoạt hình\"},{\"link\":\"/the-loai/the-thao-1\",\"name\":\"Thể thao\"},{\"link\":\"/the-loai/tinh-cam-lang-man-1\",\"name\":\"Tình cảm - Lãng mạn\"},{\"link\":\"/the-loai/ky-ao-1\",\"name\":\"Kỳ ảo\"},{\"link\":\"/the-loai/giat-gan-1\",\"name\":\"Giật gân\"},{\"link\":\"/the-loai/gia-dinh-1\",\"name\":\"Gia đình\"},{\"link\":\"/the-loai/bi-an-1\",\"name\":\"Bí ẩn\"},{\"link\":\"/the-loai/lich-su-1\",\"name\":\"Lịch sử\"},{\"link\":\"/the-loai/vien-tay-1\",\"name\":\"Viễn Tây\"},{\"link\":\"/the-loai/tieu-su-1\",\"name\":\"Tiểu sử\"},{\"link\":\"/the-loai/chuong-trinh-truyen-hinh-1\",\"name\":\"GameShow\"},{\"link\":\"/the-loai/dramatv-1\",\"name\":\"DramaTV\"}]`  
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
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else if(typeStr === "filter"){
          	menuItem = { "value": link, "name": name}; 
        }
        
        else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}




function _$(htmlOrBlock){ if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(currentHtml)) !== null) { var isClose = match[1] === '/'; var fullMatched = match[0]; if (isClose) { depth--; } else if (fullMatched.indexOf('/>') === -1) { depth++; } if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } if (depth > 0) { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var tagRegex = new RegExp('<(/?)' + currentTagName + '(?:\\s+[^>]*|\\s*>)', 'gi'); tagRegex.lastIndex = endOpenTag + 1; var match; while ((match = tagRegex.exec(this.sourceHtml)) !== null) { if (match[1] === '/') depth--; else if (match[0].indexOf('/>') === -1) depth++; if (depth === 0) { endTagPos = tagRegex.lastIndex; break; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; }
