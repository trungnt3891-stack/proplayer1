var BASEURL = "http://vkey.vn/hhpanda";
var LOGGER = false;
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
    return JSON.stringify({
        "id": "hhpanda",
        "name": "Nguồn HHPanda",
        "description": "Anime siêu hay.",
        "version": "1.2.6",
        "info": "",
        "baseUrl": "http://vkey.vn/hhpanda",
        "iconUrl": "https://vaxplugin.alokillgtv.workers.dev/img/hhpanda.png",
        "isEnabled": true,
        "layoutType": "HORIZONTAL",
        "adblock": false,
        "type": "ANIME",
        "popup_html": "<div class='donate-container'><h2 class='donate-heading'>DONATE</h2><p class='donate-description'>Anh em yêu quý có thể mời bọn mình 2 ly cà phê nhé. Để có động lực duy trì App, cập nhật plugin và tìm thêm nhiều nguồn mới và hay cho anh em. Một chút lòng thành cũng làm bọn mình tiếp tục hoạt động tốt hơn, cám ơn anh em.</p><div class='donate-grid'><div class='donate-card'><div class='donate-title'>Donate Tác giả Plugin</div><div class='qr-wrapper'><img src='https://vaxplugin.alokillgtv.workers.dev/img/qrht.png?cache=true' alt='Donate Tác giả Plugin' /></div></div><div class='donate-card'><div class='donate-title'>Donate Tác giả App</div><div class='qr-wrapper'><img src='https://vaxplugin.alokillgtv.workers.dev/img/qryb.png?cache=true' alt='Donate Tác giả App' /></div></div></div></div><style>.donate-container{max-width:800px;margin:0 auto;padding:10px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center;color:#eee}.donate-heading{font-size:22px;font-weight:bold;margin:0 0 12px 0;color:#fff;text-transform:uppercase;letter-spacing:1px}.donate-description{font-size:14px;line-height:1.5;margin-bottom:18px;color:#ccc}.donate-grid{display:flex;flex-direction:row;justify-content:center;align-items:stretch;gap:16px}.donate-card{flex:1;min-width:0;background:#22252a;border-radius:12px;padding:14px;border:1px solid #33373e;display:flex;flex-direction:column;align-items:center}.donate-title{font-weight:bold;font-size:15px;margin-bottom:12px;color:#fff}.qr-wrapper{width:100%;max-width:240px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:#181a1d;border-radius:8px;padding:8px;box-sizing:border-box}.qr-wrapper img{width:100%;height:100%;object-fit:contain;border-radius:4px}@media(max-width:600px){.donate-grid{flex-direction:column}.donate-heading{font-size:18px;margin-bottom:8px}.donate-description{font-size:13px;margin-bottom:12px}.qr-wrapper{max-width:180px}}</style>",
        "playerType": "embed"
    })
};

function log(msg) {
    if (LOGGER == "true") {
        if (typeof console !== 'undefined' && console.log) {
            console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
        }
    }
}

function getHomeSections() {
    return JSON.stringify([{
            "slug": "/hoan-thanh",
            "title": "Phim Hoàn Thành",
            "type": "Horizontal"
        },
        {
            "slug": "/most-viewed",
            "title": "Phim Xem Nhiều",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/tu-tien",
            "title": "Tu Tiên",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/do-thi",
            "title": "Đô thị",
            "type": "Horizontal"
        },
        {
            "slug": "/moi-cap-nhat/",
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
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
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
            resultUrl += "/page/" + page;
        }
        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
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
                    resUrl = BASEURL + "/page/" + page + "?s=" + encodeURIComponent(keyword);
                } else {
                    resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
                }
            } catch (jsonErr) {
                resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
            }
        } else {
            resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
        }
        log("getUrlSearch[url]: \n" + resUrl);
        return resUrl;
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallbackUrl = BASEURL + "?s=" + encodeURIComponent(keyword || "");
        log("getUrlSearch[url]: \n" + fallbackUrl);
        return fallbackUrl;
    }
}

function getUrlDetail(slug) {
    try {
        if (!slug) {
            log("getUrlDetail[url]: \n");
            return "";
        }
        if (slug.indexOf('http') === 0) {
            log("getUrlDetail[url]: \n" + slug);
            return slug;
        }
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
        log("getUrlCountries[url]: \n");
        return "";
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
        return "";
    }
}

function getUrlYears() {
    try {
        log("getUrlYears[url]: \n");
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
    } catch (e) {
        log("fixHref[err]:\n " + e);
        return href || '';
    }
}

function isValidMediaUrl(url) {
    try {
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
    try {
        var items = [];
        var $doc = _$(html);
        $doc.find("article").each(function() {
            var href = this.find("a").attr("href");
            href = fixHref(href);
            var title = this.find("a").attr("title");
            var src = this.find("img").attr("src");
            src = fixHref(src);

            var episode_current = this.find(".status").text().trim();
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
    try {
        // === BƯỚC 1: ĐỒNG NHẤT ID PHIM BẰNG REGEX META (Y hệt tác giả) ===
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");
        var $doc = _$(html);
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
        var rating = 5;
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

        var ldes = $doc.find(".video-item").find("article").text();
        var year = 2026;
        var extra = "";

        status = $doc.find(".hh3d-info").find("span").parent().text(" - ");

        var categoryResult = [];
        $doc.find(".list_cate").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                slug = slug.replace(BASEURL, "");
                categoryResult.push("[" + name + "](" + slug + ")");
            }
        });

        category = categoryResult.join(", ");
        episode_current = $doc.find("span.new-ep").text();

        var servers = [];

        $doc.find("#halim-list-server").find(".halim-server").each(function() {
            var $namesv = this.find(".halim-server-name").text();
            var items = [];
            this.find(".halim-list-eps").each(function() {
                this.find("a").each(function() {
                    var id = this.attr("href");
                    var name = this.attr("title");
                    var slug = this.attr("data-ep");
                    items.push({
                        id: id,
                        name: name,
                        slug: slug
                    });
                });
            });
            servers.push({
                name: $namesv,
                episodes: items
            });
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
            rating: rating,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            datasend: lname,
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

                    var matchA = nameA.match(/\d+(\.\d+)?/);
                    var matchB = nameB.match(/\d+(\.\d+)?/);

                    var numA = matchA ? parseFloat(matchA[0]) : null;
                    var numB = matchB ? parseFloat(matchB[0]) : null;

                    if (numA !== null && numB !== null) {
                        if (numA !== numB) {
                            return numA - numB;
                        }
                    }

                    if (numA !== null) return -1;
                    if (numB !== null) return 1;

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

function checkRaw(scriptStr, returnFixed) {
    try {
        if (!scriptStr || typeof scriptStr !== 'string') {
            console.log("[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!");
            return scriptStr || "";
        }

        var lines = scriptStr.split('\n');
        var fixedLines = [];
        var hasError = false;

        for (var i = 0; i < lines.length; i++) {
            var currentLine = lines[i];
            var lineNum = i + 1;
            var lineErrorFound = false;

            // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
            // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép
            if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
                console.log("[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " + lineNum + ": " + currentLine.trim());
                lineErrorFound = true;
            }

            // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ
            if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
                console.log("[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " + lineNum + ": " + currentLine.trim());
                lineErrorFound = true;
            }

            // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)
            if (/([^\\])\\$/.test(currentLine)) {
                console.log("[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " + lineNum + ": " + currentLine.trim());
                lineErrorFound = true;
            }

            if (lineErrorFound) {
                hasError = true;
            }

            // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true
            var fixedLine = currentLine;
            if (returnFixed) {
                // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
                fixedLine = fixedLine
                    .replace(/\r/g, "")
                    .replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
            }

            fixedLines.push(fixedLine);
        }

        // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không
        try {
            new Function(scriptStr);
        } catch (syntaxErr) {
            hasError = true;
            console.log("[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " + syntaxErr.message);
        }

        if (!hasError) {
            console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
        }

        // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed
        return returnFixed ? fixedLines.join('\n') : scriptStr;

    } catch (e) {
        console.log("[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message);
        return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
    }
}

function parseDetailResponse(html, pageUrl, datasend) {
    console.log("parseDetail:\n" + pageUrl)
    try {
        var $doc = _$(html);
        var currentlink = $doc.find("meta[property='og:url']").attr("content");
        var matchC = currentlink.match(/sv(\d+)/i);
        var currentserver = 1;
        var currenttap = 1;
        var matchA = currentlink.match(/(tap-\d+)/i);
        if (matchC && matchC[1]) {
            currentserver = matchC[1];
        }
        if (matchA && matchA[1]) {
            currenttap = matchA[1];
        }
        if (currentlink.indexOf("-full") > -1) {
            currenttap = "tap-full";
        }
        var currentid = $doc.find("#main-contents").attr("data-id");
        var typecurrent = $doc.find("#halim-ajax-list-server").find("span:first").attr("data-type");
        var framelink = `https://hhpanda.st/player/player.php?action=dox_ajax_player&post_id=${currentid}&chapter_st=${currenttap}&type=${typecurrent}&sv=${currentserver}`;
        var $dataSv = {};
        $dataSv.movieid = currentid;
        $dataSv.serverhientai = currentserver;
        $dataSv.hqhientai = typecurrent;
        $dataSv.taphientai = currenttap;

        var servers = [];
        $doc.find(".halim-server").each(function() {
            var $namesv = this.find(".halim-server-name").text();
            var items = [];
            var type = 1;
            var maxEpi = 1;
            maxEpi = this.find(".halim-episode").find("a").length;

            this.find(".halim-episode").each(function() {
                type = this.find("a:first").attr("data-sv");
            });

            servers.push({
                name: $namesv,
                type: type,
                maxEpi: maxEpi
            });
        });
        $dataSv.servers = servers;
        $dataSv.name = datasend;
        console.log("datasend: " + datasend)
        var serverHQ = [];
        $doc.find("#halim-ajax-list-server").find("span").each(function() {
            var name = this.text();
            var type = this.attr("data-type");
            serverHQ.push({
                nname: name,
                type: type
            });
        });
        $dataSv.HQ = serverHQ;

        var bypassJs = checkRaw(customJS($dataSv), true);
        console.log("parseDetailResponse[url]: \n" + framelink + "\ndataSv:\n" + JSON.stringify($dataSv));

        var $return = JSON.stringify({
            url: framelink,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": pageUrl,
                "Block-Ads": false,
                "Custom-Js": bypassJs
            },
            subtitles: []
        });
        // console.log("Return Data:\n" + $return)
        return $return
    } catch (e) {
        console.log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({
            url: "",
            isEmbed: false,
            headers: {},
            subtitles: []
        });
    }
}

/*

BASEURL = "https://animehay09.site";
var html = sourceHTML;
//JSON.parse(parseDetailResponse(sourceHTML, BASEURL))
JSON.parse(parseEmbedResponse(sourceHTML, BASEURL))
// 'AHS': 'https://ahay.stream/embed-jw/75913'

*/
function customJS(config) {
    const configStr = JSON.stringify(config);

    return `
function bridgeLog(msg, check) {
    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(msg);
        if (check === true && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast(msg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
      }
    } catch(e) {}
}
(function() {
    console.log('[PhimHDCS] WAITING FOR EXISTING IFRAME...');

    const CONFIG = ${configStr};

    // 0. SAFE STORAGE WRAPPER
    const memoryStorage = {};
    const SafeStorage = {
        getItem: function(key) {
            try { return window.localStorage.getItem(key); } catch (e) {
                try { return window.sessionStorage.getItem(key); } catch (e2) { return memoryStorage[key] || null; }
            }
        },
        setItem: function(key, value) {
            try { window.localStorage.setItem(key, value); } catch (e) {
                try { window.sessionStorage.setItem(key, value); } catch (e2) { memoryStorage[key] = String(value); }
            }
        }
    };

    function initPhimHDCS(oldIframe) {
        if (window.__PHIMHDCS_INITED__) return;
        window.__PHIMHDCS_INITED__ = true;
        
        console.log('[PhimHDCS] 🚀 FOUND EXISTING IFRAME! WRAPPING IT UP...');

        // 1. CHÈN CSS GIAO DIỆN
        const customStyle = document.createElement('style');
        customStyle.id = 'v-phimhdcs-style';
        customStyle.textContent = \`
            body, html, iframe { overflow: hidden !important; }
            #v-player-wrapper {
                position: relative; width: 100vw; height: 100vh;
                background-color: #000; overflow: hidden;
            }
            .v-styled-iframe {
                position: absolute !important; top: 50% !important; left: 50% !important;
                border: none !important; transform-origin: center center !important;
                transition: width 0.2s, height 0.2s !important;          
            }
            #v-control-bar, .v-nav-btn, #v-title-badge {
                opacity: 0.1; transition: opacity 0.2s ease;
            }
            #v-control-bar:hover, #v-control-bar.v-active,
            .v-nav-btn:hover, .v-nav-btn.v-active,
            #v-title-badge:hover, #v-title-badge.v-active {
                opacity: 1 !important;
            }
            #v-title-badge {
                position: absolute; top: 10px; left: 10px; z-index: 9999;
                background: rgba(0, 0, 0, 0.8); color: #fff;
                padding: 6px 14px; border-radius: 6px; backdrop-filter: blur(4px);
                font-size: 14px; font-weight: bold; border: 1px solid rgba(255, 255, 255, 0.1);
                pointer-events: none; max-width: 60vw; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis;
            }
            #v-control-bar {
                position: absolute; top: 10px; right: 10px; z-index: 9999;
                display: flex; gap: 8px; background: rgba(0,0,0,0.8);
                padding: 6px 12px; border-radius: 6px; backdrop-filter: blur(4px);
            }
            .v-nav-btn {
                position: absolute; top: 50%; z-index: 9999; transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.7); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
                width: 46px; height: 46px; border-radius: 50%;
                font-size: 20px; cursor: pointer; display: flex;
                align-items: center; justify-content: center;
                backdrop-filter: blur(4px); user-select: none;
            }
            .v-nav-btn:hover { background: #e50914; border-color: #e50914; }
            #v-prev-ep { left: 5%; }
            #v-next-ep { right: 5%; }
            .v-btn {
                background: #2a2a2a; color: #fff; border: 1px solid #444;
                padding: 6px 12px; border-radius: 4px; font-size: 13px;
                cursor: pointer; font-weight: bold; transition: 0.2s; white-space: nowrap;
            }
            .v-btn:hover { background: #e50914; border-color: #e50914; }
            #v-modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.85);
                z-index: 10000; display: none; align-items: center; justify-content: center;
            }
            .v-dialog {
                background: #181818; border: 1px solid #333; border-radius: 8px;
                width: 90%; max-width: 520px; max-height: 80vh; padding: 16px;
                display: none; flex-direction: column; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            }
            .v-dialog-header {
                font-size: 16px; font-weight: bold; margin-bottom: 12px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .v-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
                gap: 8px; overflow-y: auto; max-height: 60vh; padding-right: 4px;
            }
            .v-grid-item {
                padding: 8px 4px; border-radius: 4px; text-align: center;
                font-weight: bold; cursor: pointer; background: #2a2a2a; color: #fff;
                user-select: none; transition: 0.1s; white-space: nowrap; font-size: 13px;
            }
            .v-grid-item.active { background: #e50914 !important; }
            .v-grid-item:hover { background: #444; }
            .v-input-group { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
            .v-input-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
            .v-input-row label { font-size: 14px; font-weight: bold; }
            .v-input-row input {
                background: #2a2a2a; border: 1px solid #444; color: #fff;
                padding: 8px; border-radius: 4px; width: 60%; font-size: 14px;
            }
            .v-save-btn {
                background: #e50914; color: #fff; border: none; padding: 10px;
                border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px;
            }
        \`;
        document.head.appendChild(customStyle);

        // 2. LẤY DỮ LIỆU BAN ĐẦU
        let currentTapNum = 1;
        if (CONFIG.taphientai) {
            let extracted = String(CONFIG.taphientai).replace(/[^0-9]/g, '');
            if (extracted) currentTapNum = parseInt(extracted, 10);
        }

        let currentServerIndex = 0;
        if (CONFIG.serverhientai) {
            let svIdx = parseInt(CONFIG.serverhientai, 10) - 1;
            if (!isNaN(svIdx) && CONFIG.servers && CONFIG.servers[svIdx]) {
                currentServerIndex = svIdx;
            }
        }

        const movieName = CONFIG.name || "Đang xem phim";

        function getMaxEpi() {
            let maxEpi = 40;
            if (CONFIG.servers && CONFIG.servers[currentServerIndex] && CONFIG.servers[currentServerIndex].maxEpi) {
                maxEpi = parseInt(CONFIG.servers[currentServerIndex].maxEpi, 10);
            } else if (CONFIG.servers && CONFIG.servers[0] && CONFIG.servers[0].maxEpi) {
                maxEpi = parseInt(CONFIG.servers[0].maxEpi, 10);
            }
            return maxEpi;
        }

        function getCleanScale() {
            let raw = SafeStorage.getItem("anime_player_iframe_scale") || "1.0";
            let parsed = parseFloat(raw);
            return isNaN(parsed) ? 1.0 : Math.round(parsed * 10) / 10;
        }

        function getIframeSize() {
            const savedWidth = SafeStorage.getItem("anime_player_iframe_width");
            const savedHeight = SafeStorage.getItem("anime_player_iframe_height");

            if (savedWidth && savedHeight) {
                return { w: savedWidth, h: savedHeight };
            }

            // Kiểm tra nếu là màn hình có chiều cao thấp (điện thoại xoay ngang hoặc chiều cao <= 500px)
            const isLowHeightScreen = window.innerHeight <= 500 || (window.innerWidth > window.innerHeight && window.innerHeight <= 600);
            
            if (isLowHeightScreen) {
                return { w: "80%", h: "100%" };
            }

            return { w: "100%", h: "90%" };
        }

        function updateTitleText() {
            const titleEl = document.getElementById("v-title-badge");
            if (titleEl) {
                const svName = (CONFIG.servers && CONFIG.servers[currentServerIndex]) ? CONFIG.servers[currentServerIndex].name : "";
                titleEl.textContent = \`\${movieName} - Tập \${currentTapNum} \${svName ? '(' + svName + ')' : ''}\`;
            }
        }

        // 3. BỌC WRAPPER VÀ STYLE IFRAME
        let currentIframe = oldIframe;
        const wrapper = document.createElement("div");
        wrapper.id = "v-player-wrapper";

        oldIframe.parentNode.insertBefore(wrapper, oldIframe);
        wrapper.appendChild(oldIframe);

        function applyStyleToIframe(iframeEl) {
            const size = getIframeSize();
            const scale = getCleanScale();

            iframeEl.id = "v-main-frame";
            iframeEl.classList.add("v-styled-iframe");
            iframeEl.setAttribute("scrolling", "no");
            iframeEl.style.width = size.w;
            iframeEl.style.height = size.h;
            iframeEl.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
        }

        applyStyleToIframe(currentIframe);

        // Tự động cập nhật kích thước iframe khi người dụng xoay màn hình hoặc đổi kích thước cửa sổ
        window.addEventListener("resize", function() {
            if (currentIframe) {
                const size = getIframeSize();
                currentIframe.style.width = size.w;
                currentIframe.style.height = size.h;
            }
        });

        // 4. HÀM CHUYỂN TẬP & SERVER
        async function changeEpisode(targetEp) {
            const maxEpi = getMaxEpi();
            if (targetEp < 1 || targetEp > maxEpi) return;

            currentTapNum = targetEp;
            updateTitleText();
            if (typeof wakeControlBar === 'function') wakeControlBar();

            let postId = CONFIG.movieid || CONFIG.post_id || 256;
            let currentServerObj = (CONFIG.servers && CONFIG.servers[currentServerIndex]) ? CONFIG.servers[currentServerIndex] : {};
            
            // Xác định param 'type' và 'sv' theo cấu trúc dữ liệu server
            let svTypeParam = currentServerObj.type || (currentServerIndex + 1);
            let hqTypeParam = (CONFIG.HQ && CONFIG.HQ[0] && CONFIG.HQ[0].type) ? CONFIG.HQ[0].type : "pro";

            let fetchUrl = "";

            if (currentServerObj.episodes && currentServerObj.episodes[targetEp]) {
                fetchUrl = currentServerObj.episodes[targetEp];
            } else if (CONFIG.episodes && CONFIG.episodes[targetEp]) {
                fetchUrl = CONFIG.episodes[targetEp];
            } else {
                fetchUrl = \`https://hhpanda.st/player/player.php?action=dox_ajax_player&post_id=\${postId}&chapter_st=tap-\${targetEp}&type=\${hqTypeParam}&sv=\${svTypeParam}\`;
            }

            bridgeLog(\`[PhimHDCS] 🚀 FETCHING | Server: \${currentServerObj.name || ('#' + (currentServerIndex + 1))} | Type: \${svTypeParam} | Ep: \${targetEp} | URL: \${fetchUrl}\`);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(fetchUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': window.location.href
                    },
                    credentials: 'include',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                bridgeLog('[PhimHDCS] 📡 Status Code: ' + response.status);

                if (!response.ok) {
                    bridgeLog('[PhimHDCS] ❌ Fetch failed with Status: ' + response.status);
                    return;
                }

                const htmlText = await response.text();
                bridgeLog('[PhimHDCS] 📄 Response Length: ' + htmlText.length);

                if (!htmlText || htmlText.trim() === "") {
                    bridgeLog('[PhimHDCS] ⚠️ Empty HTML response', true);
                    return;
                }

                let embedSrc = "";

                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    const iframeEl = doc.querySelector('iframe');
                    if (iframeEl) {
                        embedSrc = iframeEl.getAttribute('src') || iframeEl.getAttribute('data-src') || iframeEl.getAttribute('data-embed') || "";
                    }
                } catch(e) {}

                if (!embedSrc) {
                    const directUrlMatch = htmlText.match(/https?:\\/\\/[^\\s"'<>]+\\/(?:embed|player|v|e)\\/[^\\s"'<>]+/i);
                    if (directUrlMatch) {
                        embedSrc = directUrlMatch[0];
                    }
                }

                bridgeLog('[PhimHDCS] 🔗 EXTRACTED EMBED SRC: ' + embedSrc);

                if (embedSrc) {
                    let newBrowserUrl = window.location.origin + window.location.pathname.replace(/tap-\\d+/g, 'tap-' + targetEp);
                    window.history.pushState({ ep: targetEp }, '', newBrowserUrl);

                    currentIframe.src = embedSrc;
                    bridgeLog('[PhimHDCS] ✅ Updated iframe src successfully!');
                } else {
                    bridgeLog('[PhimHDCS] ❌ Failed to extract embed src from response');
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    bridgeLog('[PhimHDCS] ❌ Request Timeout (10s)');
                } else {
                    bridgeLog('[PhimHDCS] ❌ Fetch Error: ' + err);
                }
            }

            // Cập nhật giao diện UI Nút bấm & Grid
            const epBtn = document.getElementById("v-ep-trigger");
            if (epBtn) epBtn.textContent = "Tập " + currentTapNum + " ▼";

            const gridItems = document.querySelectorAll("#v-ep-grid .v-grid-item");
            gridItems.forEach((item, index) => {
                if (index + 1 === currentTapNum) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });
        }

        // Tạo UI Controls & Modal
        const currentServerName = (CONFIG.servers && CONFIG.servers[currentServerIndex]) ? CONFIG.servers[currentServerIndex].name : "Server";
        const uiControls = document.createElement("div");
        uiControls.innerHTML = \`
            <div id="v-title-badge">\${movieName} - Tập \${currentTapNum} (\${currentServerName})</div>
            <div id="v-control-bar">
                <button class="v-btn" id="v-server-trigger">\${currentServerName} ▼</button>
                <button class="v-btn" id="v-ep-trigger">Tập \${currentTapNum} ▼</button>
                <button class="v-btn" id="v-scale-trigger">Scale \${getCleanScale().toFixed(1)}x ▼</button>
                <button class="v-btn" id="v-size-trigger">Size ▼</button>
            </div>
            <button class="v-nav-btn" id="v-prev-ep" title="Tập trước">❮</button>
            <button class="v-nav-btn" id="v-next-ep" title="Tập tiếp">❯</button>

            <div id="v-modal-overlay">
                <div id="v-server-dialog" class="v-dialog">
                    <div class="v-dialog-header">
                        <span>Chọn Server</span>
                        <span style="cursor:pointer;" onclick="closeModal()">✕</span>
                    </div>
                    <div id="v-server-grid" class="v-grid" style="grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));"></div>
                </div>

                <div id="v-ep-dialog" class="v-dialog">
                    <div class="v-dialog-header">
                        <span>Danh sách tập</span>
                        <span style="cursor:pointer;" onclick="closeModal()">✕</span>
                    </div>
                    <div id="v-ep-grid" class="v-grid"></div>
                </div>

                <div id="v-scale-dialog" class="v-dialog">
                    <div class="v-dialog-header">
                        <span>Điều chỉnh Scale</span>
                        <span style="cursor:pointer;" onclick="closeModal()">✕</span>
                    </div>
                    <div id="v-scale-grid" class="v-grid"></div>
                </div>

                <div id="v-size-dialog" class="v-dialog">
                    <div class="v-dialog-header">
                        <span>Cấu hình Size Iframe</span>
                        <span style="cursor:pointer;" onclick="closeModal()">✕</span>
                    </div>
                    <div class="v-input-group">
                        <div class="v-input-row">
                            <label>Width (chiều rộng):</label>
                            <input type="text" id="v-inp-width" placeholder="Ví dụ: 80% hoặc 1280px">
                        </div>
                        <div class="v-input-row">
                            <label>Height (chiều cao):</label>
                            <input type="text" id="v-inp-height" placeholder="Ví dụ: 100% hoặc 720px">
                        </div>
                        <button class="v-save-btn" id="v-save-size-btn">Lưu cấu hình</button>
                    </div>
                </div>
            </div>
        \`;
        wrapper.appendChild(uiControls);

        // 5. HIỆU ỨNG TỰ ẨN CÁC THANH CÔNG CỤ
        let hideTimeout = null;
        function wakeControlBar() {
            const bar = document.getElementById("v-control-bar");
            const prevBtn = document.getElementById("v-prev-ep");
            const nextBtn = document.getElementById("v-next-ep");
            const titleBadge = document.getElementById("v-title-badge");

            [bar, prevBtn, nextBtn, titleBadge].forEach(el => el && el.classList.add("v-active"));
            
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                [bar, prevBtn, nextBtn, titleBadge].forEach(el => el && el.classList.remove("v-active"));
            }, 10000);
        }

        window.addEventListener("mousemove", wakeControlBar);
        window.addEventListener("touchstart", wakeControlBar);
        window.addEventListener("click", wakeControlBar);

        // 6. RENDER DỮ LIỆU MODAL
        function buildModalGrids() {
            const activeScale = getCleanScale();
            document.getElementById("v-scale-trigger").textContent = "Scale " + activeScale.toFixed(1) + "x ▼";
            
            // Scale Grid
            const scaleGrid = document.getElementById("v-scale-grid");
            if (scaleGrid) {
                scaleGrid.innerHTML = "";
                for (let i = 5; i <= 40; i++) {
                    let val = Math.round(i) / 10;
                    let btn = document.createElement("div");
                    btn.className = "v-grid-item" + (val === activeScale ? " active" : "");
                    btn.textContent = val.toFixed(1) + "x";
                    
                    btn.onclick = function(e) {
                        e.stopPropagation();
                        SafeStorage.setItem("anime_player_iframe_scale", val.toString());
                        if (currentIframe) {
                            currentIframe.style.transform = "translate(-50%, -50%) scale(" + val + ")";
                        }
                        window.closeModal();
                        document.getElementById("v-scale-trigger").textContent = "Scale " + val.toFixed(1) + "x ▼";
                    };
                    scaleGrid.appendChild(btn);
                }
            }

            // Server Grid
            const serverGrid = document.getElementById("v-server-grid");
            if (serverGrid && CONFIG.servers) {
                serverGrid.innerHTML = "";
                CONFIG.servers.forEach((sv, idx) => {
                    let btn = document.createElement("div");
                    btn.className = "v-grid-item" + (idx === currentServerIndex ? " active" : "");
                    btn.textContent = sv.name || ("Server " + (idx + 1));

                    btn.onclick = function(e) {
                        e.stopPropagation();
                        currentServerIndex = idx;
                        const svTrigger = document.getElementById("v-server-trigger");
                        if (svTrigger) svTrigger.textContent = (sv.name || "Server") + " ▼";

                        buildModalGrids();
                        
                        // Kiểm tra nếu tập hiện tại vượt quá maxEpi của server mới
                        const maxEpiNew = getMaxEpi();
                        if (currentTapNum > maxEpiNew) {
                            currentTapNum = maxEpiNew;
                        }
                        
                        changeEpisode(currentTapNum);
                        window.closeModal();
                    };
                    serverGrid.appendChild(btn);
                });
            }

            // Episode Grid
            const epGrid = document.getElementById("v-ep-grid");
            if (epGrid) {
                epGrid.innerHTML = "";
                const maxEpi = getMaxEpi();

                for (let i = 1; i <= maxEpi; i++) {
                    let btn = document.createElement("div");
                    btn.className = "v-grid-item" + (i === currentTapNum ? " active" : "");
                    btn.textContent = "Tập " + i;
                    
                    btn.onclick = function(e) {
                        e.stopPropagation();
                        changeEpisode(i);
                        window.closeModal();
                    };
                    epGrid.appendChild(btn);
                }
            }
        }

        // 7. SỰ KIỆN NÚT BẤM
        document.getElementById("v-prev-ep").onclick = function(e) {
            e.stopPropagation();
            changeEpisode(currentTapNum - 1);
        };

        document.getElementById("v-next-ep").onclick = function(e) {
            e.stopPropagation();
            changeEpisode(currentTapNum + 1);
        };

        window.closeModal = function() {
            document.getElementById("v-modal-overlay").style.display = "none";
            document.getElementById("v-server-dialog").style.display = "none";
            document.getElementById("v-ep-dialog").style.display = "none";
            document.getElementById("v-scale-dialog").style.display = "none";
            document.getElementById("v-size-dialog").style.display = "none";
        };

        document.getElementById("v-server-trigger").onclick = function() {
            document.getElementById("v-modal-overlay").style.display = "flex";
            document.getElementById("v-server-dialog").style.display = "flex";
        };

        document.getElementById("v-ep-trigger").onclick = function() {
            document.getElementById("v-modal-overlay").style.display = "flex";
            document.getElementById("v-ep-dialog").style.display = "flex";
        };

        document.getElementById("v-scale-trigger").onclick = function() {
            document.getElementById("v-modal-overlay").style.display = "flex";
            document.getElementById("v-scale-dialog").style.display = "flex";
        };

        document.getElementById("v-size-trigger").onclick = function() {
            const activeSize = getIframeSize();
            document.getElementById("v-inp-width").value = activeSize.w;
            document.getElementById("v-inp-height").value = activeSize.h;

            document.getElementById("v-modal-overlay").style.display = "flex";
            document.getElementById("v-size-dialog").style.display = "flex";
        };

        document.getElementById("v-save-size-btn").onclick = function() {
            const defaultSize = getIframeSize();
            const w = document.getElementById("v-inp-width").value.trim() || defaultSize.w;
            const h = document.getElementById("v-inp-height").value.trim() || defaultSize.h;

            SafeStorage.setItem("anime_player_iframe_width", w);
            SafeStorage.setItem("anime_player_iframe_height", h);

            if (currentIframe) {
                currentIframe.style.width = w;
                currentIframe.style.height = h;
            }

            window.closeModal();
        };

        document.getElementById("v-modal-overlay").onclick = function(e) {
            if (e.target === this) window.closeModal();
        };

        buildModalGrids();
        wakeControlBar();
    }

    function findAndWrapIframe() {
        const existingIframe = document.querySelector('iframe');
        if (existingIframe) {
            initPhimHDCS(existingIframe);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const iframeFound = document.querySelector('iframe');
            if (iframeFound) {
                obs.disconnect();
                initPhimHDCS(iframeFound);
            }
        });

        observer.observe(document.documentElement || document, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', findAndWrapIframe, { once: true });
    } else {
        findAndWrapIframe();
    }
})();
    `;
}


function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) {
    return "[]";
}

function parseYearsResponse(html) {
    return "[]";
}

// https://hhpanda.st/moi-cap-nhat/page/3
// {\"link\":\"/moi-cap-nhat/\",\"name\":\"Phim Mới\"},
function getLISTmenu() {
    return `[{\"link\":\"/moi-cap-nhat/\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/tu-tien\",\"name\":\"Tu Tiên\"},{\"link\":\"/the-loai/kiem-hiep\",\"name\":\"Kiếm Hiệp\"},{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ Trang\"},{\"link\":\"/the-loai/huyen-huyen\",\"name\":\"Huyền Huyễn\"},{\"link\":\"/the-loai/khoa-huyen\",\"name\":\"Khoa Huyễn\"},{\"link\":\"/the-loai/ky-ao\",\"name\":\"Kỳ Ảo\"},{\"link\":\"/the-loai/huyen-nghi\",\"name\":\"Huyền Nghi\"},{\"link\":\"/the-loai/canh-ky\",\"name\":\"Cạnh Kỹ\"},{\"link\":\"/the-loai/da-su\",\"name\":\"Dã Sử\"},{\"link\":\"/the-loai/do-thi\",\"name\":\"Đô Thị\"},{\"link\":\"/the-loai/dong-nhan\",\"name\":\"Đồng Nhân\"}]`
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
