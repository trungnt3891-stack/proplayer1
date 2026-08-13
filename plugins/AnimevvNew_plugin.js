var BASEURL = "http://vkey.vn/animevv";
var DEV = true;

function getManifest() {
    return JSON.stringify({
        id: "animevv",
        name: "Nguồn Animevv",
        description: "Nguồn phim Animevv...",
        "version": "1.2.3",
        info: "Nguồn phim Animevv, nguồn này dùng servers riêng của họ nên cũng khá mượt mà..",
        "BASEURL": "http://vkey.vn/animevv",
        iconUrl: "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/animevv.png",
        isEnabled: true,
        "adblock": false,
        "layoutType": "HORIZONTAL",
        type: "MOVIE",
        playerType: "embedtoexoplay"
    });
}


function log(msg) {
    console.log(msg);
}



function getHomeSections() {
    return JSON.stringify([{
            "slug": "/top",
            "title": "Top Anime",
            "type": "Horizontal"
        },
        {
            "slug": "/quoc-gia/Trung%20Qu%E1%BB%91c",
            "title": "Trung Quốc",
            "type": "Horizontal"
        },
        {
            "slug": "/quoc-gia/Nh%E1%BA%ADt%20B%E1%BA%A3n",
            "title": "Nhật Bản",
            "type": "Horizontal"
        },
        {
            "slug": "/moi-cap-nhat",
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
        var resultUrl = BASEURL;

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
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
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
        var resultUrl = BASEURL + "/tim-kiem?q=" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}
// http://vkey.vn/animevv
// /quoc-gia/M%E1%BB%B9
// /top
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
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
        var $doc = _$(html)
        var json = $doc.find("script[type='application/json']").html();
        var $data = JSON.parse(json);
        listData = $data.props.results.data;
        var $items = [];
        listData.forEach(function(item) {
            // https://animevv.com/anime/kimi-no-koto-ga-daidaidaidaidaisuki-na-100-nin-no-kanojo-p5072
            var poster = BASEURL + item.thumbnailOptimized;
            var background = BASEURL + item.backgroundOptimized;
            var year = Number(item.year);
            $items.push({
                "id": BASEURL + "/anime/" + item.slug,
                "title": item.title,
                "quality": item.lastEpisodeName,
                "episode_current": item.statusEpisode,
                "posterUrl": typeof poster === "string" ? poster : "",
                "backdropUrl": typeof background === "string" ? background : "",
                "year": typeof year === "number" ? year : 2026
            });
        })
        return JSON.stringify({
            "items": $items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 9999
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

    function decodeHTMLEntities(str) {}
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
        var $doc = _$(html)
        var json = $doc.find("script[type='application/json']").html();
        var $data = JSON.parse(json);
        var anime = $data.props.anime;
        var slugVD = anime.slug;
        var poster = BASEURL + anime.backgroundOptimized;;
        var lname = anime.title;
        var ldes = anime.description;
        var ldirec = "";
        var lactor = "";
        var lduran = $doc.find(".items-center span:content('phút/tập')").text();
        var status = "Tập: " + anime.statusEpisode;
        var category = "";
        var merge = [];
        anime.genres.forEach(function(item) {
            merge.push("[" + item.name + "](/the-loai/" + item.slug + ")");
        })
        category = merge.join(", ");
        var episode_current = anime.lastEpisodeName;
        var year = Number(anime.year);
        var quality = "HD";
        var rating = anime.rating;
        var country = anime.country;
        var extra = "";
        var listEpi = $data.props.episodeGroups;
        var servers = [];
        listEpi.forEach(function(box, key) {
            var episodes = [];
            box.episodes.forEach(function(item) {
                episodes.push({
                    id: BASEURL + "/xem-phim/" + slugVD + "/" + item.watchKey,
                    name: item.name,
                    slug: "tap-" + item.slug
                })
            })
            servers.push({
                name: "Server " + (key + 1),
                episodes: episodes
            })
        })
        return JSON.stringify({
            id: url || "",
            title: lname || "",
            posterUrl: poster || "",
            backdropUrl: poster || "",
            description: ldes || "",
            quality: quality || "",
            year: year || "",
            rating: rating || "",
            status: status || "",
            category: category || "",
            episode_current: episode_current || "",
            servers: servers || "",
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            country: country || "",
            extra: extra || ""
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
        var rawJS = runJS();
        return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: BASEURL,
                "Block-Ads": false,
                "Block-Css": "html,body,*",
                "Custom-Js": rawJS
            },
            subtitles: [],
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


function runJS() {
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
(function injectCSS() {
  try {
    // 1. Khai báo nội dung CSS của bạn ở đây
    const cssStyle = "body,html,*{display:none!important,backgroud:black!important;opacity:0!important;z-index:-999999}";

    // 2. Tạo thẻ <style>
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.setAttribute('data-injected-by', 'custom-script');

    if (styleElement.styleSheet) {
      // Dành cho các trình duyệt IE cũ
      styleElement.styleSheet.cssText = cssStyle;
    } else {
      // Dành cho trình duyệt hiện đại
      styleElement.appendChild(document.createTextNode(cssStyle));
    }

    // 3. Tìm vị trí để chèn (ưu tiên <head>, nếu chưa có head thì lấy documentElement)
    const targetNode = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

    if (targetNode) {
      targetNode.appendChild(styleElement);
      bridgeLog("Chèn css ngay lập tức.")
    } else {
      // Fallback: Nếu DOM chưa sẵn sàng, chờ DOMContentLoaded rồi mới chèn
      document.addEventListener('DOMContentLoaded', function () {
        (document.head || document.documentElement).appendChild(styleElement);
        bridgeLog("Chèn Css sau khi load xong")
      });
    }
  } catch (error) {
    // Bắt toàn bộ lỗi để đảm bảo script chính vẫn tiếp tục chạy bình thường
    bridgeLog('Không thể chèn CSS tự động, bỏ qua lỗi:', error);
  }
})();

(function initLocalBlobSniffer() {
  if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  var hasDispatchedAny = 0;
  var isFinished = 0;
  var timeoutTimer = null;

  

  // =========================================================================
  // 1. GIỚI HẠN THỜI GIAN 10 GIÂY (TIMEOUT)
  // =========================================================================
  bridgeLog("Đang tiến hành tìm link Video, xin chờ....", true);

  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      bridgeLog("❌ [TIMEOUT] Đã quá 10 giây nhưng không tìm thấy Blob M3U8!", false);
      bridgeLog("Không tìm thấy link video (Hết thời gian 10s).", true);
      
      // Fallback khi không tìm thấy
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        window.SnifferBridge.play("https://google.com", "");
      }
    }
  }, 20000); // 10,000 ms = 10 giây

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // =========================================================================
  // 2. KIỂM TRA M3U8 HỢP LỆ
  // =========================================================================
  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    return trimmed.indexOf('#EXTM3U') === 0 && 
          (trimmed.indexOf('#EXTINF') !== -1 || trimmed.indexOf('#EXT-X-STREAM-INF') !== -1);
  }

  // =========================================================================
  // 3. CHUYỂN NỘI DUNG M3U8 VỀ APP (LOCAL SERVER)
  // =========================================================================
  function dispatchM3u8ToApp(m3u8Content) {
    if (!m3u8Content || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout(); // Hủy đếm ngược 10s khi đã lấy thành công

    bridgeLog('🎯 [LOCAL-DISPATCH] Đã tìm thấy M3U8! Đang nạp vào Local Player...');
    bridgeLog("🎯 Bắt link thành công! Đang phát video...", true);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
        // Truyền trực tiếp nội dung M3U8 thô + URL hiện tại làm Referer/BaseURL
        window.SnifferBridge.playM3u8Content(m3u8Content, window.location.href);
      } else {
        bridgeLog('❌ SnifferBridge.playM3u8Content không khả dụng!');
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // 4. HOOK URL.createObjectURL (BẮT TRỰC TIẾP DỮ LIỆU BLOB M3U8)
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              //bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 từ Blob RAM!');
              dispatchM3u8ToApp(content);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook thành công.');
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
})();
  `;
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
    return `[{\"link\":\"/the-loai/anime-bo\",\"name\":\"Anime bộ\"},{\"link\":\"/the-loai/anime-le\",\"name\":\"Anime lẻ\"},{\"link\":\"/the-loai/hanh-dong\",\"name\":\"Action\"},{\"link\":\"/the-loai/phieu-luu\",\"name\":\"Adventure\"},{\"link\":\"/the-loai/anime-sap-chieu\",\"name\":\"Anime sắp chiếu\"},{\"link\":\"/the-loai/dong-tinh-nam\",\"name\":\"Boys Love\"},{\"link\":\"/the-loai/cartoon\",\"name\":\"Cartoon\"},{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ Trang\"},{\"link\":\"/the-loai/hai-huoc\",\"name\":\"Comedy\"},{\"link\":\"/the-loai/dien-loan\",\"name\":\"Dementia\"}]`;
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
