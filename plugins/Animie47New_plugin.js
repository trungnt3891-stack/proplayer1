var BASEURL = "https://anime47.best";
var BASEAPI = "https://anime47.love/api"
var BASEHOST = "https://anime47.alokillgtv.workers.dev/api";
var BASELINK = BASEAPI;
// https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/phimchill.ico
function getManifest() {
    try {
        return JSON.stringify({
            "id": "anime47",
            "name": "Nguồn Anime47",
            "description": "Nguồn phim Anime47",
            "version": "1.3.2",
            "author": "Alokillgtv",
            "info": "Nguồn phim Anime của VN.\nNguồn có server riêng nên xem video rất nhanh và mượt.",
            "baseUrl": "https://anime47.best",
            "iconUrl": "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/anime47.png",
            "playerType": "exoplayer",
            "layoutType": "HORIZONTAL",
            "type": "ANIME",
            "isEnabled": true,
            "isAdult": false,
            "adblock": true,
            "subtitleCat": false,
            "popup_html": "<div class='donate-container'><h2 class='donate-heading'>DONATE</h2><p class='donate-description'>Anh em yêu quý có thể mời bọn mình 2 ly cà phê nhé. Để có động lực duy trì App, cập nhật plugin và tìm thêm nhiều nguồn mới và hay cho anh em. Một chút lòng thành cũng làm bọn mình tiếp tục hoạt động tốt hơn, cám ơn anh em.</p><div class='donate-grid'><div class='donate-card'><div class='donate-title'>Donate Tác giả Plugin</div><div class='qr-wrapper'><img src='https://vaxplugin.alokillgtv.workers.dev/img/qrht.png' alt='Donate Tác giả Plugin' /></div></div><div class='donate-card'><div class='donate-title'>Donate Tác giả App</div><div class='qr-wrapper'><img src='https://vaxplugin.alokillgtv.workers.dev/img/qryb.png' alt='Donate Tác giả App' /></div></div></div></div><style>.donate-container{max-width:800px;margin:0 auto;padding:10px;box-sizing:border-box;font-family:Arial,sans-serif;text-align:center;color:#eee}.donate-heading{font-size:22px;font-weight:bold;margin:0 0 12px 0;color:#fff;text-transform:uppercase;letter-spacing:1px}.donate-description{font-size:14px;line-height:1.5;margin-bottom:18px;color:#ccc}.donate-grid{display:flex;flex-direction:row;justify-content:center;align-items:stretch;gap:16px}.donate-card{flex:1;min-width:0;background:#22252a;border-radius:12px;padding:14px;border:1px solid #33373e;display:flex;flex-direction:column;align-items:center}.donate-title{font-weight:bold;font-size:15px;margin-bottom:12px;color:#fff}.qr-wrapper{width:100%;max-width:240px;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:#181a1d;border-radius:8px;padding:8px;box-sizing:border-box}.qr-wrapper img{width:100%;height:100%;object-fit:contain;border-radius:4px}@media(max-width:600px){.donate-grid{flex-direction:column}.donate-heading{font-size:18px;margin-bottom:8px}.donate-description{font-size:13px;margin-bottom:12px}.qr-wrapper{max-width:180px}}</style>"
        });
    } catch (e) {
        return JSON.stringify({
            "id": "loiapp",
            "name": "Plugin bị lỗi cài đặt",
            "version": "1.0",
            "info": "Plugin đang bị lỗi: \n" + e,
            "baseUrl": "http://vkey.vn/",
            "iconUrl": "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/novahd.png",
            "isEnabled": true,
            "type": "MOVIE",
            "playerType": "exoplayer"
        });
    }
}

// ===== HÀM MENU LIST BEGIN ======
{
    // Tạo List phim ở menu Home
    // https://anime47.best/filter/trang-1?sort=latest
    // https://anime47.love/api/search/full/?lang=vi&keyword=naruto&page=1
    // https://anime47.love/api/anime/filter?lang=vi&sort=latest&page=5
    // https://anime47.love/api/genres/action/anime?lang=vi&page=1
    // https://anime47.love/api/list/dang/tv-series?lang=vi&page=1
    function getHomeSections() {
        localStorage.clear();
        return JSON.stringify([{
                "slug": "/list/dang/specials?lang=vi",
                "title": "Đặc Biệt",
                "type": "Horizontal"
            },
            {
                "slug": "/list/dang/ova-series?lang=vi",
                "title": "Ova Series",
                "type": "Horizontal"
            },
            {
                "slug": "/list/dang/movies?lang=vi",
                "title": "Anime Movies",
                "type": "Horizontal"
            },
            {
                "slug": "/list/dang/tv-series?lang=vi",
                "title": "Anime Bộ",
                "type": "Horizontal"
            },
            {
                "slug": "/anime/filter?lang=vi&sort=latest",
                "title": "Anime Mới",
                "type": "Grid"
            },
        ]);
    }
    // https://anime47.love/api/anime/filter?lang=vi&page=5&sort=latest

    // Hàm khởi tạo thẻ chủ đề
    function getLISTmenu() {
        try {
            return `[
        {"link": "/genres/action/anime?lang=vi", "name": "Hành Động"},
        {"link": "/genres/adventure/anime?lang=vi", "name": "Phiêu Lưu"},
        {"link": "/genres/comedy/anime?lang=vi", "name": "Hài Hước"},
        {"link": "/genres/drama/anime?lang=vi", "name": "Tâm Lý"},
        {"link": "/genres/fantasy/anime?lang=vi", "name": "Huyền Ảo"},
        {"link": "/genres/horror/anime?lang=vi", "name": "Kinh Dị"},
        {"link": "/genres/mystery/anime?lang=vi", "name": "Bí Ẩn"},
        {"link": "/genres/romance/anime?lang=vi", "name": "Tình Cảm"},
        {"link": "/genres/scifi/anime?lang=vi", "name": "Viễn Tưởng"},
        {"link": "/genres/slice-of-slice/anime?lang=vi", "name": "Đời Thường"},
        {"link": "/genres/sports/anime?lang=vi", "name": "Thể Thao"},
        {"link": "/genres/supernatural/anime?lang=vi", "name": "Siêu Nhiên"}
      ]
`;
        } catch (e) {
            log("getLISTmenu[err]:\n " + e);
            return `[
        {"link":"/","name":"Đang lỗi getLISTmenu()"},
      ]`;
        }
    }
} // getHomeSections(), getLISTmenu()
// ===== HÀM MENU LIST END ======

// ===== HÀM TẠO URL BEGIN ======
{
    function getUrlList(slug, filtersJson) {
        var paramPage = "&page=";
        try {
            //log("getUrlList[url]: \n" + slug);
            if (slug && slug.indexOf("http") > -1) {
                return slug;
            }
            var page = 1;
            var path = slug || "";
            if (filtersJson) {
                var fixedJson2 = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
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
                } catch (e) {
                    log("getUrlList():\n" + e)
                }
            }
            var resultUrl = BASELINK;
            if (path) {
                resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
            }
            if (page > 0 && resultUrl.indexOf("page=") === -1) {
                resultUrl += paramPage + page;
            }
            var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
            return finalUrl;
        } catch (e) {
            log("getUrlList[err]:\n " + e);
            return BASEURL;
        }
    }
    // https://anime47.love/api/search/full/?lang=vi&keyword=naruto&page=1
    function getUrlSearch(keyword, filtersJson) {
        var paramSearch = "/search/full/?lang=vi&keyword=";
        var paramPage = "&page=";

        try {
            var page = 1;
            if (filtersJson) {
                var fixedJson = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filters = JSON.parse(fixedJson);
                    page = parseInt(filters.page) || 1;
                } catch (e) {
                    log("getUrlList():\n" + e)
                }
            }
            var encodedKeyword = encodeURIComponent(keyword || "");

            var resultUrl = BASELINK + paramSearch + encodedKeyword;
            if (page > 1) {
                resultUrl += paramPage + page;
            }

            var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");

            log("getUrlSearch[url]: \n" + finalUrl);
            return finalUrl;

        } catch (e) {
            log("getUrlSearch[err]:\n " + e);
            return BASEURL;
        }
    }
} // getUrlList, getUrlSearch
// http://vkey.vn/animevv
// /quoc-gia/M%E1%BB%B9
// /
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
//getUrlSearch("girl", filtersJson)
// ===== HÀM TẠO URL END ======

// ===== HÀM TẠO KHỐI LIST PHIM BEGIN ======
function parseListResponse(html, $url) {
    try {
        var $data = JSON.parse(html);
        var check = "";
        if ($url.indexOf("search") > -1) {
            var $list = $data.results;
            check = true;
        } else {
            var $list = $data.data.posts;
            check = false;
        }
        var items = [];
        $list.forEach(function(item) {
            var id = BASEHOST + "/anime/info/" + item.id + "?lang=vi";
            var title = item.title;
            if (check == true) {
                var poster = item.image;
            } else {
                var poster = item.poster;
            }
            var background = poster;
            var quality = item.type;
            var status = item.status;
            if (item.status) {
                status = status.replace(/Ongoing/, "Đang Ra").replace(/Completed/, "Hoàn Thành").replace(/Upcoming/, "Sắp Ra");
            }
            var episode_current = "Tập " + item.current_episode;
            var year = item.year;
            var lang = status;
            if (title.length > 1 && poster.length > 5) {
                items.push({
                    "id": id || "",
                    "title": title || "",
                    "quality": quality || "",
                    "episode_current": episode_current || "",
                    "posterUrl": poster || "",
                    "backdropUrl": background || "",
                    "year": year || "",
                    "lang": lang || ""
                });
            }
        })

        //console.log("List item ["+$url+"]: \n" + JSON.stringify(items))
        return JSON.stringify({
            "items": items,
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
//$data = parseJSDataIsolated(script);
// ===== HÀM TẠO KHỐI LIST PHIM END ======

// ===== HÀM TẠO KHỐI CHI TIẾT PHIM BEGIN ======

function parseMovieDetail(html, url) {
    log("parseMovieDetail[url]: \n" + url);
    try {
        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===  
        var $data = JSON.parse(html);
        var extra = "";
        var servers = [];
        var episodes = [];
        if (!$data.teams) {
            // https://black-dew-dda7.alokillgtv03.workers.dev/api/anime/9585/episodes?lang=vi         
            var item = $data.data;
            var extra = BASEHOST + "/anime/" + item.id + "/episodes?lang=vi";
            var id = BASEHOST + "/anime/info/" + item.id + "?lang=vi";;
            var posterUrl = item.poster;
            var backdropUrl = item.poster;
            var title = item.title;
            var description = item.description;
            var director = "r";
            var casts = "";
            var category = "";
            // menu category
            var duration = item.duration === "Unknown" ? "" : item.duration;
            var status = item.status != null ? item.status.replace(/Ongoing/, "Đang Ra").replace(/Completed/, "Hoàn Thành").replace(/Upcoming/, "Sắp Ra") : item.status;
            var episode_current = "Tập " + item.episodes.total;
            var year = item.year;
            var quality = item.quality;
            var rating = item.rating;
            var country = "";
            if (item.genres.length > 0) {
                var merge = [];
                // https://anime47.love/api/genres/action/anime?lang=vi&page=1
                item.genres.forEach(function(box) {
                    var link = "";
                    if (box.link) {
                        link = box.link.replace("the-loai", "genres") + "/anime?lang=vi";
                    }
                    merge.push("[" + box.name + "](" + link + ")");
                })
                category = merge.join(", ");
            }



            if (item.characters.length > 0) {
                var merge = [];
                // https://anime47.love/api/genres/action/anime?lang=vi&page=1
                item.characters.forEach(function(box) {
                    var role = box.role;
                    if (role) {
                        role = role.replace("main", "Chính").replace("supporting", "Phụ");
                    }
                    var name = box.name + " [" + role + "]"
                    merge.push(name);
                })
                casts = merge.join(", ");
            }


            if (item.producers.length > 0) {
                var merge = [];
                // https://anime47.love/api/genres/action/anime?lang=vi&page=1
                item.producers.forEach(function(box) {
                    var link = box.link + "/anime?lang=vi";
                    var name = box.title;
                    if (name) {
                        name.join(" - ");
                    }
                    merge.push(name);
                })
                director = merge.join(", ");
            }

        } else {
            var episodes = [];
            $data.teams.forEach(function(box, index) {
                if (box.groups) {
                    box.groups.forEach(function(parent) {
                        if (parent.episodes) {
                            parent.episodes.forEach(function(child) {
                                episodes.push({
                                    id: BASEHOST + "/anime/watch/episode/" + child.id + "?lang=vi",
                                    name: "Tập " + child.number,
                                    slug: "tap-" + child.number
                                })
                            })
                        }
                    })
                }
                servers.push({
                    name: "Server " + (index + 1),
                    episodes: episodes
                })
            })

        }

        return JSON.stringify({
            id: url || "",
            title: title || "",
            posterUrl: posterUrl || "",
            backdropUrl: backdropUrl || "",
            description: description || "",
            quality: quality || "",
            year: year || "",
            rating: rating || "",
            status: status || "",
            category: category || "",
            episode_current: episode_current || "",
            servers: servers || "",
            duration: duration || "",
            casts: casts || "",
            director: director || "",
            country: country || "",
            extra: extra || ""
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: "error",
            title: "error",
            description: url + "\n" + e,
            servers: []
        });
    }
}

//var url = "https://novahd.cc/api/show/1413"
//var url = "http://vkey.vn/novahd/api/show/1413"
// https://novahd.cc/api/shows/1413
//var html = sourceHTML;
//JSON.parse(parseMovieDetail(sourceHTML, url))
// ===== HÀM TẠO KHỐI CHI TIẾT PHIM END ======

// ===== HÀM TẠO XỬ LÝ STREAM PHIM BEGIN ======
{

    function parseDetailResponse(html, url) {
        console.log("parseDetailResponse dang xu ly: " + url);
        try {
            var stream = "";
            var customJS = "";
            var data = JSON.parse(html);

            // 1. Lọc và ưu tiên stream (Thuyết minh/Lồng tiếng > Phụ đề)
            var streams = data.streams || [];
            var selectedStream = streams.find(function(s) {
                return s.server_name && s.server_name.toLowerCase() !== "phụ đề";
            }) || streams[0];

            var streamUrl = selectedStream ? selectedStream.url : "";

            // 2. Lưu link stream vào localStorage và xoay vòng (round-robin)

            // 3. Lấy phụ đề tiếng Việt và tiếng Anh, kèm mimeType chuẩn
            var subtitles = (selectedStream && selectedStream.subtitles) || [];
            var targetLangs = ["Tiếng Việt", "English"];

            var subsObject = [];
            subtitles.forEach(function(sub) {
                var langUpper = "";
                if (sub.label === "Tiếng Việt") {
                    langUpper = "Việt";
                } else if (sub.label === "English") {
                    langUpper = "ENG";
                }

                if (targetLangs.indexOf(sub.label) !== -1) {
                    var mimeType = "text/vtt";
                    if (sub.file.indexOf(".srt") !== -1) {
                        mimeType = "application/x-subrip";
                    }

                    subsObject.push({
                        url: sub.file,
                        lang: langUpper,
                        mimeType: mimeType
                    });
                }
            });

            // --- BỔ SUNG: Lưu danh sách phụ đề vào localStorage theo ID nội dung ---
            if (data.id) {
                var subStorageKey = "subtitles_" + data.id;
                localStorage.setItem(subStorageKey, JSON.stringify(subsObject));
                // Lưu thêm một key toàn cục phòng trường hợp ở hàm embed không có ID
                localStorage.setItem("latest_subtitles", JSON.stringify(subsObject));
            }

            console.log("parseDetailResponse fetch\n" + streamUrl);
            return JSON.stringify({
                url: streamUrl,
                mimeType: "application/x-mpegURL",
                isEmbed: false,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://anime47.best/",
                    "Origin": "https://anime47.best",
                },
                subtitles: subsObject
            });
        } catch (e) {
            console.log("parseDetailResponse[err]:\n " + e);
            return JSON.stringify({
                url: "",
                mimeType: "",
                isEmbed: false,
                headers: {},
                subtitles: [],
            });
        }
    }

    function parseEmbedResponse(html, url) {
        log("parseEmbedResponse [url]: " + url);
        try {
            var customJS = clearJS(rawJS);
            var m3u8Content = html;

            // 1. Tách lấy đường dẫn /m3u8/... từ nội dung html
            var parts = m3u8Content.split(/\s+/);
            var targetPath = "";
            for (var i = 0; i < parts.length; i++) {
                var item = parts[i].trim();
                if (item.indexOf("/m3u8/") === 0 || item.indexOf("http") === 0) {
                    targetPath = item;
                    break;
                }
            }

            // 2. Tạo link full m3u8 HTTP
            var realM3u8Url = targetPath.indexOf("http") === 0 ? targetPath : "https://pl.vlogphim.net" + targetPath;

            // --- BỔ SUNG: Đọc danh sách phụ đề từ localStorage ---
            var subsObject = [];
            try {
                // Thử trích xuất ID từ URL embed nếu có (ví dụ: .../file/8a93...)
                var urlMatch = url.match(/\/file\/([a-zA-Z0-9]+)/);
                var fileId = urlMatch ? urlMatch[1] : "";

                var savedSubs = null;
                if (fileId) {
                    savedSubs = localStorage.getItem("subtitles_" + fileId);
                }

                // Nếu không tìm thấy theo ID, lấy từ key phụ đề mới nhất
                if (!savedSubs) {
                    savedSubs = localStorage.getItem("latest_subtitles");
                }

                if (savedSubs) {
                    subsObject = JSON.parse(savedSubs);
                }
            } catch (subErr) {
                console.log("[Lỗi đọc subtitles từ localStorage]:", subErr);
            }

            console.log("Link stream HTTP gửi Player:", realM3u8Url);

            // 3. Trả về JSON hoàn chỉnh kèm phụ đề đã lưu
            return JSON.stringify({
                url: realM3u8Url,
                mimeType: "application/x-mpegURL",
                isEmbed: false,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
                    "Referer": "https://anime47.best/",
                    "Origin": "https://anime47.best",
                    "Accept-Language": "vi-VN",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "cross-site",
                    "Block-Ads": false,
                    "Block-Css": "",
                    "Custom-Js": customJS
                },
                subtitles: subsObject
            });
        } catch (e) {
            console.log("[Lỗi parseEmbedResponse]", e);
            return JSON.stringify({
                url: "",
                isEmbed: false,
                headers: {},
                subtitles: []
            });
        }
    }



} // parseDetailResponse, parseEmbedResponse
// ===== HÀM TẠO XỬ LÝ STREAM PHIM END ======

// ==== HÀM TẠO CUSTOM SCRIPT BEGIN ====
function rawJS() {
    function LOG(msg, check) {
        var logMsg = msg;
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
            window.SnifferBridge.log(logMsg);
            if (check === true) {
                window.SnifferBridge.toast(logMsg, 1000);
            }
        } else if (typeof console !== 'undefined' && console.log) {
            console.log(logMsg);
        }
    }
    try {
        LOG("Test");
    } catch (e) {
        LOG("Lỗi CUSTOMJS: \n" + e);
    }
}
// ==== HÀM TẠO CUSTOM SCRIPT END ====


// ==== HIDEMENU ====
{
    // ## Hàm Hỗ Trợ. Hide function
    function getUrlDetail(slug) {
        try {
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
    // Tạo thẻ chủ đè ở menu home lấy dữ liệu ben dưới
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
    // Tạo thẻ chủ đề filter..
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

    function sortEpisodesByName(data) {
        try {
            if (data && Array.isArray(data)) {
                data.forEach(function(server) {
                    if (server.episodes && Array.isArray(server.episodes)) {
                        server.episodes.sort(function(a, b) {
                            var matchA = a.name.match(/Tập\s*(\d+)/i);
                            var matchB = b.name.match(/Tập\s*(\d+)/i);
                            var numA = matchA ? parseInt(matchA[1], 10) : 0;
                            var numB = matchB ? parseInt(matchB[1], 10) : 0;
                            return numA - numB;
                        });
                    }
                });
            }
            return data;
        } catch (e) {
            log("sortEpisodesByName[err]:\n " + e);
            return data;
        }
    }

    // Hàm chuyển đổi text html %20 sang text thuần
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

    function log(msg) {
        console.log(msg);
    }

    function BASE64DECODE(base64String) {
        try {
            if (!base64String) return "";

            // 1. Dọn dẹp chuỗi & xử lý nếu App tự động mã hóa URL (ví dụ: %2B, %2F)
            var str = decodeURIComponent(base64String.trim());

            // Chuyển URL-safe base64 về base64 chuẩn
            str = str.replace(/-/g, "+").replace(/_/g, "/");

            // Bảng ký tự Base64
            var chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output = [];
            var buffer = 0,
                bits = 0;

            // 2. Decode Base64 thành Mảng Byte (Uint8Array)
            for (var i = 0; i < str.length; i++) {
                var char = str.charAt(i);
                if (char === "=") break; // Bỏ qua padding
                var index = chars.indexOf(char);
                if (index === -1) continue; // Bỏ qua ký tự không hợp lệ

                buffer = (buffer << 6) | index;
                bits += 6;

                if (bits >= 8) {
                    bits -= 8;
                    output.push((buffer >> bits) & 0xff);
                }
            }

            // 3. Decode UTF-8 từ mảng Byte ra String (không dùng TextDecoder)
            var result = "";
            var j = 0;
            while (j < output.length) {
                var c = output[j++];
                if (c < 128) {
                    result += String.fromCharCode(c);
                } else if (c > 191 && c < 224) {
                    var c2 = output[j++];
                    result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                } else if (c > 223 && c < 240) {
                    var c2 = output[j++];
                    var c3 = output[j++];
                    result += String.fromCharCode(
                        ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
                    );
                } else if (c >= 240) {
                    var c2 = output[j++];
                    var c3 = output[j++];
                    var c4 = output[j++];
                    var u =
                        (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
                        0x10000;
                    result += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 0x3ff));
                }
            }

            return result;
        } catch (e) {
            console.log("[BASE64DECODE Error]:", e.message || e);
            return "";
        }
    }

    function BASE64ENCODE(str) {
        try {
            if (!str) return "";

            // 1. Encode String ra mảng UTF-8 Bytes trước
            var utf8Bytes = [];
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i);
                if (code < 128) {
                    utf8Bytes.push(code);
                } else if (code < 2048) {
                    utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
                } else if (
                    (code & 0xfc00) === 0xd800 &&
                    i + 1 < str.length &&
                    (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00
                ) {
                    // Ký tự Surrogate Pair
                    code =
                        0x10000 + ((code & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                    utf8Bytes.push(
                        (code >> 18) | 240,
                        ((code >> 12) & 63) | 128,
                        ((code >> 6) & 63) | 128,
                        (code & 63) | 128,
                    );
                } else {
                    utf8Bytes.push(
                        (code >> 12) | 224,
                        ((code >> 6) & 63) | 128,
                        (code & 63) | 128,
                    );
                }
            }

            // 2. Chuyển mảng UTF-8 Bytes thành chuỗi Base64
            var chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var encoded = "";
            var byte1, byte2, byte3;
            var b1, b2, b3, b4;

            for (var j = 0; j < utf8Bytes.length; j += 3) {
                byte1 = utf8Bytes[j];
                byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
                byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;

                b1 = byte1 >> 2;
                b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
                b3 = isNaN(byte2) ?
                    64 :
                    ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
                b4 = isNaN(byte3) ? 64 : byte3 & 63;

                encoded +=
                    chars.charAt(b1) +
                    chars.charAt(b2) +
                    chars.charAt(b3) +
                    chars.charAt(b4);
            }

            return encoded;
        } catch (e) {
            console.log("[BASE64ENCODE Error]:", e.message || e);
            return "";
        }
    }

    function checkRaw(scriptStr, returnFixed) {
        try {
            if (!scriptStr || typeof scriptStr !== "string") {
                console.log(
                    "[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!",
                );
                return scriptStr || "";
            }

            var lines = scriptStr.split("\n");
            var fixedLines = [];
            var hasError = false;

            for (var i = 0; i < lines.length; i++) {
                var currentLine = lines[i];
                var lineNum = i + 1;
                var lineErrorFound = false; // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
                // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép

                if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
                    console.log(
                        "[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " +
                        lineNum +
                        ": " +
                        currentLine.trim(),
                    );
                    lineErrorFound = true;
                } // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ

                if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
                    console.log(
                        "[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " +
                        lineNum +
                        ": " +
                        currentLine.trim(),
                    );
                    lineErrorFound = true;
                } // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)

                if (/([^\\])\\$/.test(currentLine)) {
                    console.log(
                        "[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " +
                        lineNum +
                        ": " +
                        currentLine.trim(),
                    );
                    lineErrorFound = true;
                }

                if (lineErrorFound) {
                    hasError = true;
                } // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true

                var fixedLine = currentLine;
                if (returnFixed) {
                    // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
                    fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
                }

                fixedLines.push(fixedLine);
            } // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không

            try {
                new Function(scriptStr);
            } catch (syntaxErr) {
                hasError = true;
                console.log(
                    "[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " +
                    syntaxErr.message,
                );
            }

            if (!hasError) {
                console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
            } // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed

            return returnFixed ? fixedLines.join("\n") : scriptStr;
        } catch (e) {
            console.log(
                "[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message,
            );
            return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
        }
    }

    function decodeHTMLtext(str) {
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

    function clearJS(func) {
        if (typeof func !== "function") return "";

        // Lấy toàn bộ mã nguồn của hàm dưới dạng string
        var funcStr = func.toString();

        // Dùng Regex bóc tách lấy nội dung bên trong cặp ngoặc nhọn {} đầu tiên và cuối cùng
        var match = funcStr.match(/\{([\s\S]*)\}/);
        if (!match) return "";

        var innerCode = match[1].trim();

        // (Tùy chọn) Bạn có thể tận dụng luôn hàm checkRaw sẵn có trong template của bạn 
        // để nó tự động rà soát và fix các ký tự xuống dòng/tab nguy hiểm cho an toàn tuyệt đối:
        var safeCode = checkRaw(innerCode, true);

        return safeCode;
    }
}
// ==== HIDEMENU ====
