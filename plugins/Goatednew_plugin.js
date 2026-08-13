var BASEURL = "https://vercel.alokillgtv.workers.dev";
var BASEAPI = "https://vercel.alokillgtv.workers.dev";
var BASESV = "goated";
var BASELINK = BASEURL;

function getManifest() {
    try {
        return JSON.stringify({
            "id": "goated",
            "name": "Nguồn Goated",
            "description": "Nguồn phim Goated",
            "version": "1.0.6",
            "author": "Alokillgtv",
            "info": "Nguồn phim thuộc servers nước ngoài.\nDùng để sơ cua khi các nguồn trong nước bị sập.\nNguồn này được mình tích hợp rẩt nhiều subtitle nên có thể tự động dịch và lồng tiếng tự động.\nVì là nguồn nước ngoài nên đôi khi cần phải vượt DNS mới xem được.\nDo đó nếu không xem được hãy vào cài đặt bật DNS và DPI hoặc dùng ứng dụng 1.1.1.1 để vượt DNS.\nMột vài phim load sẽ hơi lâu, nhưng khi load được sẽ phát mượt. Nếu không load được hay bấm tải lại sẽ tự tìm link khác để phát.\nNếu vẫn không dược hãy thử hạ độ phân giải xuống 1 cấp sẽ coi được..",
            "BASEURL": "https://vercel.alokillgtv.workers.dev",
            "iconUrl": "https://vaxplugin.alokillgtv.workers.dev/img/goated.png",
            "isEnabled": true,
            "isAdult": false,
            "debug": true,
            "adblock": false,
            "layoutType": "HORIZONTAL",
            "type": "MOVIE",
            "subtitleCat": false,
            "playerType": "exoplayer"
        });
    } catch (e) {
        // VERTICAL
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
    //           {"slug": "/api/themoviedb?endpoint=tv/top_rated&language=vi-VN","title": "TV SHOW Hot","type": "Horizontal"},
    //           {"slug": "/api/themoviedb?endpoint=trending/movie/day&language=vi-VN","title": "Phim Mới","type": "Grid"}
    function getHomeSections() {
        localStorage.clear();
        return JSON.stringify([{
                "slug": "/api/themoviedb?endpoint=movie/now_playing&language=vi-VN",
                "title": "Phim Chiếu Rạp",
                "type": "Horizontal"
            },
            {
                "slug": "/api/themoviedb?endpoint=tv/top_rated&language=vi-VN",
                "title": "TV SHOW Hot",
                "type": "Horizontal"
            },
            {
                "slug": "/api/themoviedb?endpoint=movie/top_rated&language=vi-VN",
                "title": "Phim Lẻ Hot",
                "type": "Horizontal"
            },
            {
                "slug": "/api/themoviedb?endpoint=trending/movie/day&language=vi-VN",
                "title": "Phim Mới",
                "type": "Grid"
            },
        ]);
    }

    // Hàm khởi tạo thẻ chủ đề
    function getLISTmenu() {
        try {
            return `[
            { "name": "Phim Thịnh Hành", "link": "/api/themoviedb?endpoint=trending/movie/day&language=vi-VN" },
            { "name": "Phim Đang Chiếu Rạp", "link": "/api/themoviedb?endpoint=movie/now_playing&language=vi-VN" },
            { "name": "Phim Lẻ Đánh Giá Cao", "link": "/api/themoviedb?endpoint=movie/top_rated&language=vi-VN" },
            { "name": "TV Show Thịnh Hành", "link": "/api/themoviedb?endpoint=trending/tv/day&language=vi-VN" },
            { "name": "TV Show Đang Phát Sóng", "link": "/api/themoviedb?endpoint=tv/on_the_air&language=vi-VN" },
            { "name": "TV Show Đánh Giá Cao", "link": "/api/themoviedb?endpoint=tv/top_rated&language=vi-VN" },
            { "name": "Phim Hành Động", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=28&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Phiêu Lưu", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=12&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Hoạt Hình", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=16&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Hài Hước", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=35&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Hình Sự", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=80&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Tài Liệu", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=99&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Chính Kịch", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=18&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Gia Đình", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=10751&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Cổ Trang / Khai Phá", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=36&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Kinh Dị", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=27&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Âm Nhạc", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=10402&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Bí Ẩn / Trinh Thám", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=9648&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Lãng Mạn", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=10749&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Viễn Tưởng (Sci-Fi)", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=878&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Giật Gân / Gián Điệp", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=53&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Chiến Tranh", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=10752&sort_by=popularity.desc&language=vi-VN" },
            { "name": "Phim Miền Tây (Western)", "link": "/api/themoviedb?endpoint=discover/movie&with_genres=37&sort_by=popularity.desc&language=vi-VN" }
        ]`;
        } catch (e) {
            if (typeof log === "function") log("getLISTmenu[err]:\n " + e);
            return `[{"link":"/","name":"Đang lỗi getLISTmenu()"}]`;
        }
    }



} // getHomeSections(), getLISTmenu()
// ===== HÀM MENU LIST END ======

// ===== HÀM TẠO URL BEGIN ======
{
    function getUrlList(slug, filtersJson) {
        var paramPage = "&page=";
        try {
            log("getUrlList[url]: \n" + slug);
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

            // Kiểm tra xem đã có dấu ? hay chưa để nối &page= hoặc ?page=
            if (page > 0 && resultUrl.indexOf("page=") === -1) {
                var hasQuery = resultUrl.indexOf("?") > -1;
                resultUrl += (hasQuery ? "&page=" : "?page=") + page;
            }

            // CHỈ làm sạch // ở phần Domain, không đụng vào phần query string (?)
            var parts = resultUrl.split("?");
            parts[0] = parts[0].replace(/([^:]\/)\/+/g, "$1");
            var finalUrl = parts.join("?");

            return finalUrl;
        } catch (e) {
            log("getUrlList[err]:\n " + e);
            return BASEURL;
        }
    }

    function getUrlSearch(keyword, filtersJson) {
        var paramSearch = "/api/themoviedb?endpoint=search/multi&language=vi-VN&query=";
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
// /top
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
//getUrlSearch("girl", filtersJson)
// ===== HÀM TẠO URL END ======

// ===== HÀM TẠO KHỐI LIST PHIM BEGIN ======
function parseListResponse(html, $url) {
    log("ListGetURL:\n" + $url);
    try {
        if (!html) {
            return JSON.stringify({
                "items": [],
                "pagination": {
                    "currentPage": 1,
                    "totalPages": 1
                }
            });
        }

        var $data = (typeof html === 'object') ? html : JSON.parse(html);
        var items = [];

        var isTVList = false;
        if ($url && ($url.indexOf('endpoint=tv/') > -1 || $url.indexOf('endpoint=trending/tv') > -1 || $url.indexOf('discover/tv') > -1)) {
            isTVList = true;
        }

        var results = $data.results || $data.data || [];

        if (Array.isArray(results)) {
            results.forEach(function(item) {
                if (!item) return;

                var idvd = item.id + "&server=" + BASESV + "&getsv=true";

                var isTV = isTVList || item.media_type === "tv" || item.first_air_date !== undefined || item.name !== undefined;
                var mediaType = isTV ? "tv" : "movie";

                // TMDB: Movie dùng 'title', TV Show dùng 'name'
                var title = item.name || item.title || item.original_name || item.original_title || "";

                var poster = item.poster_path ? ("https://image.tmdb.org/t/p/w500" + item.poster_path) : "";
                var background = item.backdrop_path ? ("https://image.tmdb.org/t/p/w780" + item.backdrop_path) : "";

                var releaseDate = item.first_air_date || item.release_date || "";
                var year = releaseDate ? releaseDate.split('-')[0] : "";
                var quality = year || "HD";
                var lang = item.original_language ? item.original_language.toUpperCase() : "";

                // ĐỂ PATH TƯƠNG ĐỐI (Không cộng BASELINK ở đây)
                var id = "/api/themoviedb?endpoint=" + mediaType + "/" + idvd + "&language=vi-VN";

                if (title && idvd) {
                    items.push({
                        "id": id,
                        "title": title,
                        "quality": quality,
                        "episode_current": isTV ? "Phim Bộ" : "Phim Lẻ",
                        "posterUrl": poster,
                        "backdropUrl": background,
                        "year": year,
                        "lang": lang
                    });
                }
            });
        }

        log("parseListResponse parsed count: " + items.length + " for " + $url);

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": $data.page || 1,
                "totalPages": $data.total_pages || 1
            }
        });
    } catch (e) {
        log("parseListResponse[err]:\n " + e + "\nURL: " + $url);
        return JSON.stringify({
            "items": [],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }
}
// ===== HÀM TẠO KHỐI LIST PHIM END ======

// Bảng ánh xạ ID thể loại TMDB
var GENRE_MAP = {
    28: {
        name: "Hành Động",
        slug: "28"
    },
    12: {
        name: "Phiêu Lưu",
        slug: "12"
    },
    16: {
        name: "Hoạt Hình",
        slug: "16"
    },
    35: {
        name: "Hài Hước",
        slug: "35"
    },
    80: {
        name: "Hình Sự",
        slug: "80"
    },
    99: {
        name: "Tài Liệu",
        slug: "99"
    },
    18: {
        name: "Chính Kịch",
        slug: "18"
    },
    10751: {
        name: "Gia Đình",
        slug: "10751"
    },
    14: {
        name: "Phép Thuật / Kỳ Bào",
        slug: "14"
    },
    36: {
        name: "Lịch Sử",
        slug: "36"
    },
    27: {
        name: "Kinh Dị",
        slug: "27"
    },
    10402: {
        name: "Âm Nhạc",
        slug: "10402"
    },
    9648: {
        name: "Bí Ẩn / Trinh Thám",
        slug: "9648"
    },
    10749: {
        name: "Lãng Mạn",
        slug: "10749"
    },
    878: {
        name: "Viễn Tưởng",
        slug: "878"
    },
    10770: {
        name: "Phim Truyền Hình",
        slug: "10770"
    },
    53: {
        name: "Giật Gân",
        slug: "53"
    },
    10752: {
        name: "Chiến Tranh",
        slug: "10752"
    },
    37: {
        name: "Miền Tây",
        slug: "37"
    },
    // Thể loại dành riêng cho TV Show
    10759: {
        name: "Hành Động & Phiêu Lưu",
        slug: "10759"
    },
    10762: {
        name: "Trẻ Em",
        slug: "10762"
    },
    10763: {
        name: "Tin Tức",
        slug: "10763"
    },
    10764: {
        name: "Thực Tế",
        slug: "10764"
    },
    10765: {
        name: "Viễn Tưởng & Thần Thoại",
        slug: "10765"
    },
    10766: {
        name: "Phim Truyền Kỳ (Soap)",
        slug: "10766"
    },
    10767: {
        name: "Trò Truyện",
        slug: "10767"
    },
    10768: {
        name: "Chính Trị & Chiến Tranh",
        slug: "10768"
    }
};

/**
 * Chuyển mảng genre IDs thành chuỗi Markdown [tên](url)
 * @param {Array<number>} ids - Mảng chứa các ID thể loại
 * @param {string} baseUrl - Đường dẫn API gốc (mặc định trỏ về vercel endpoint)
 * @returns {string} Chuỗi danh sách thể loại phân cách bằng dấu phẩy
 */
function getGenres(ids = [], baseUrl = '/api/themoviedb?endpoint=discover/movie&with_genres=') {
    if (!Array.isArray(ids)) return '';

    return ids
        .map(id => {
            const genre = GENRE_MAP[id];
            if (!genre) return null;

            const url = `${baseUrl}${genre.slug}&sort_by=popularity.desc&language=vi-VN`;
            return `[${genre.name}](${url})`;
        })
        .filter(Boolean)
        .join(', ');
}

// --- VÍ DỤ SỬ DỤNG ---
//const input = [28, 80, 18, 53];
//const result = getGenres(input);

//console.log(result);



// ===== HÀM TẠO KHỐI CHI TIẾT PHIM BEGIN ======
// ===== HÀM TẠO KHỐI CHI TIẾT PHIM BEGIN ======
function parseMovieDetail(html, url) {
    log("parseMovieDetail[url]: \n" + url);
    try {
        var $data = JSON.parse(html);
        if (!$data) throw new Error("Empty JSON response");

        var id = url;

        // TMDB: Movie dùng 'title' / 'original_title', TV Show dùng 'name' / 'original_name'
        var title = $data.title || $data.name || $data.original_title || $data.original_name || "";
        var description = $data.overview || "Đang cập nhật nội dung...";

        var posterUrl = $data.poster_path ? ("https://image.tmdb.org/t/p/w500" + $data.poster_path) : "";
        var backdropUrl = $data.backdrop_path ? ("https://image.tmdb.org/t/p/w780" + $data.backdrop_path) : "";

        // Thời lượng & Ngày phát hành
        var releaseDate = $data.release_date || $data.first_air_date || "";
        var year = releaseDate ? releaseDate.split('-')[0] : "";
        var duration = $data.runtime ? ($data.runtime + " phút") : ($data.episode_run_time && $data.episode_run_time.length > 0 ? $data.episode_run_time[0] + " phút/tập" : "");

        // Đánh giá & Trạng thái
        var rating = $data.vote_average ? $data.vote_average.toFixed(1) : "0.0";
        var status = $data.status || "Hoàn thành";
        var quality = "HD";

        // Kiểm tra TV Show hay Movie
        var isTV = url.indexOf("endpoint=tv/") > -1 || $data.first_air_date !== undefined || $data.number_of_episodes !== undefined;
        var episode_current = isTV ? ($data.number_of_episodes ? ($data.number_of_episodes + " Tập") : "Phim Bộ") : "Phim Lẻ";

        // Thể loại (Genres)
        var category = "";
        if ($data.genres && Array.isArray($data.genres)) {
            category = $data.genres.map(function(g) {
                var searchEndpoint = isTV ? "discover/tv" : "discover/movie";
                return "[" + g.name + "](/api/themoviedb?endpoint=" + searchEndpoint + "&with_genres=" + g.id + "&sort_by=popularity.desc&language=vi-VN)";
            }).join(", ");
        }

        // Quốc gia
        var country = "";
        if ($data.production_countries && Array.isArray($data.production_countries)) {
            country = $data.production_countries.map(function(c) {
                return c.name;
            }).join(", ");
        }

        // Đạo diễn & Diễn viên
        var director = "";
        var casts = "";
        if ($data.credits) {
            if ($data.credits.crew) {
                var directors = $data.credits.crew.filter(function(person) {
                    return person.job === "Director";
                });
                director = directors.map(function(d) {
                    return d.name;
                }).join(", ");
            }
            if ($data.credits.cast) {
                casts = $data.credits.cast.slice(0, 5).map(function(c) {
                    return c.name;
                }).join(", ");
            }
        }

        // Trích xuất thông tin Server từ stream_data
        var streamData = $data.stream_data || {};
        var availableServers = streamData.servers || [];
        var totalServers = streamData.total_servers !== undefined ? streamData.total_servers : availableServers.length;

        var servers = [];
        var checkExtra = "";
        var tmdbId = $data.id || "";

        // Kiếm tra nếu không có server nào hoặc stream_data báo lỗi/không có dữ liệu
        if (totalServers === 0 || availableServers.length === 0 || streamData.status === "error") {
            servers = [{
                name: "Đã có lỗi xảy ra",
                episodes: [{
                    id: "",
                    name: "Phim chưa chiếu hoặc tập phim đã bị lỗi.",
                    slug: ""
                }]
            }];
        } else {
            // Có dữ liệu server hợp lệ -> Tiến hành phân loại TV Show / Movie
            if (isTV && $data.seasons && Array.isArray($data.seasons)) {

                var baseEpisodes = [];

                $data.seasons.forEach(function(item) {
                    var seasonNum = item.season_number !== undefined ? item.season_number : item.seasonNumber;
                    if (seasonNum === 0) return;

                    var totalEpisodes = item.episode_count || (item.episodes ? item.episodes.length : 0);

                    if (item.episodes && Array.isArray(item.episodes)) {
                        item.episodes.forEach(function(box) {
                            var epNum = box.episode_number !== undefined ? box.episode_number : box.episodeNumber;
                            baseEpisodes.push({
                                season: seasonNum,
                                episode: epNum,
                                name: "Mùa " + seasonNum + " Tập " + epNum,
                                slug: "mua-" + seasonNum + "-tap-" + epNum
                            });
                        });
                    } else if (totalEpisodes > 0) {
                        for (var i = 1; i <= totalEpisodes; i++) {
                            baseEpisodes.push({
                                season: seasonNum,
                                episode: i,
                                name: "Mùa " + seasonNum + " Tập " + i,
                                slug: "mua-" + seasonNum + "-tap-" + i
                            });
                        }
                    }
                });

                if (baseEpisodes.length > 0) {
                    availableServers.forEach(function(serverName) {
                        var serverEpisodes = baseEpisodes.map(function(ep) {
                            var epId = BASEAPI + "/api/" + BASESV + "/?mediaType=tv&id=" + tmdbId + "&season=" + ep.season + "&episode=" + ep.episode + "&source=all&debug=9780752" + "&server=" + encodeURIComponent(serverName.toLowerCase());

                            if (ep.season === 1 && ep.episode === 1 && !checkExtra) {
                                checkExtra = epId;
                            }

                            return {
                                id: epId,
                                name: ep.name,
                                slug: ep.slug
                            };
                        });

                        servers.push({
                            name: "Server " + serverName,
                            episodes: serverEpisodes
                        });
                    });
                }

            } else {
                // Phim lẻ (Movie)
                var movieEpisodes = [];

                availableServers.forEach(function(serverName, index) {
                    var idMovie = BASEAPI + "/api/" + BASESV + "/?mediaType=movie&id=" + tmdbId + "&source=all&debug=9780752" + "&server=" + encodeURIComponent(serverName.toLowerCase());
                    if (!checkExtra) {
                        checkExtra = idMovie;
                    }

                    movieEpisodes.push({
                        id: idMovie,
                        name: serverName,
                        slug: "full-" + (index + 1)
                    });
                });

                servers.push({
                    name: "Server",
                    episodes: movieEpisodes
                });
            }
        }

        var moviedata = JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: backdropUrl,
            description: description,
            quality: quality,
            year: year,
            rating: rating,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: duration,
            casts: casts,
            director: director,
            country: country
        });

        console.log("moviedata: \n" + moviedata);
        return moviedata;

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: "error",
            title: "Lỗi tải chi tiết",
            description: url + "\n" + e,
            servers: [{
                name: "Đã có lỗi xảy ra",
                episodes: [{
                    id: "",
                    name: "Phim chưa chiếu hoặc tập phim đã bị lỗi.",
                    slug: ""
                }]
            }]
        });
    }
} //var url = "https://novahd.cc/api/show/1413"
//var url = "http://vkey.vn/novahd/api/show/1413"
// https://novahd.cc/api/shows/1413
//var html = sourceHTML;
//JSON.parse(parseMovieDetail(sourceHTML, url))
// ===== HÀM TẠO KHỐI CHI TIẾT PHIM END ======

// ===== HÀM TẠO XỬ LÝ STREAM PHIM BEGIN ======

{

    function parseDetailResponse(html, url) {
        try {
            console.log("parseDetailResponse đang xử lý: " + url);
            if (!html) {
                throw new Error("Dữ liệu html rỗng hoặc không hợp lệ");
            }

            var $data = (typeof html === "object") ? html : JSON.parse(html);
            var sources = $data.sources || [];
            var subtitles = $data.subtitles || [];

            // 1. Lọc các nguồn stream hợp lệ (có URL)
            var validSources = sources.filter(function(item) {
                return item.url && typeof item.url === "string" && item.url.trim() !== "";
            });

            // Trích xuất tham số server từ URL (ví dụ: &server=orbit)
            var serverParamMatch = url.match(/[?&]server=([^&]+)/i);
            var targetServer = serverParamMatch ? decodeURIComponent(serverParamMatch[1]).toLowerCase() : "";

            // NẾU CÓ THAM SỐ &server=... : Sắp xếp đưa Server yêu cầu lên ĐẦU MẢNG, các Server còn lại xuống SAU
            if (targetServer && validSources.length > 1) {
                var matched = [];
                var others = [];

                validSources.forEach(function(item) {
                    var sName = (item.sourceName || item.source || "").toLowerCase();
                    if (sName === targetServer) {
                        matched.push(item);
                    } else {
                        others.push(item);
                    }
                });

                // Ghép mảng: Server được chọn đứng đầu (index 0), các server dự phòng nối tiếp phía sau
                if (matched.length > 0) {
                    validSources = matched.concat(others);
                }
            }

            var stream = "";
            var streamType = "";
            var sourceHeaders = {};

            if (validSources.length > 0) {
                // Định danh Key theo ID + Season + Episode (Bỏ targetServer khỏi Key để xoay vòng chung mảng)
                var idMatch = url.match(/[?&]id=([^&]+)/i);
                var seasonMatch = url.match(/[?&]season=(\d+)/i);
                var epMatch = url.match(/[?&]episode=(\d+)/i);

                var mediaId = idMatch ? idMatch[1] : "default";
                var season = seasonMatch ? seasonMatch[1] : "0";
                var episode = epMatch ? epMatch[1] : "0";

                var mediaKey = "stream_retry_" + mediaId + "_s" + season + "_e" + episode;

                // Đọc lịch sử xem từ localStorage
                var historyRaw = localStorage.getItem(mediaKey);
                var history = {
                    lastIndex: 0,
                    lastTime: 0
                };

                if (historyRaw) {
                    try {
                        history = JSON.parse(historyRaw);
                    } catch (e) {
                        console.log("Lỗi parse history cache:", e);
                    }
                }

                var now = Date.now();
                var currentIndex = typeof history.lastIndex === "number" ? history.lastIndex : 0;
                var lastTime = history.lastTime || 0;

                // KIỂM TRA: Nếu reload / gọi lại cùng tập này trong vòng 1 phút (60,000ms)
                if (lastTime > 0 && (now - lastTime < 60000)) {
                    // Tự động nhảy sang Server/Link tiếp theo trong mảng validSources
                    currentIndex = (currentIndex + 1) % validSources.length;
                    console.log("🔄 Thử lại trong vòng 1 phút! Tự động chuyển sang Link/Server tiếp theo (Index: " + currentIndex + "/" + validSources.length + ")");
                } else {
                    // Lần đầu mở hoặc quá 1 phút -> Luôn chọn Server đầu tiên (Index 0 - Ưu tiên server được chọn)
                    currentIndex = 0;
                    console.log("▶ Phát từ Server ưu tiên đầu tiên (Index 0).");
                }

                var selectedSource = validSources[currentIndex];
                stream = selectedSource.url;
                streamType = selectedSource.format ? String(selectedSource.format).toLowerCase() : "";

                // Lưu lại Index và Timestamp mới nhất
                localStorage.setItem(mediaKey, JSON.stringify({
                    lastIndex: currentIndex,
                    lastTime: now
                }));

                // Lấy headers nếu có
                if (selectedSource.headers) {
                    try {
                        sourceHeaders = (typeof selectedSource.headers === "object") ?
                            selectedSource.headers :
                            JSON.parse(selectedSource.headers);
                    } catch (e) {
                        console.log("Lỗi parse headers:", e);
                    }
                }

                console.log("▶ Đang phát (" + (currentIndex + 1) + "/" + validSources.length + "): " + (selectedSource.sourceName || selectedSource.source || "Unknown"));
            } else {
                console.log("Không tìm thấy bất kỳ nguồn stream nào.");
            }

            // 2. Tự động nhận diện MimeType
            var mimeType = "application/x-mpegURL";
            if (streamType === "mp4" || streamType === "file") {
                mimeType = "video/mp4";
            } else if (streamType === "hls" || streamType === "m3u8") {
                mimeType = "application/x-mpegURL";
            } else if (stream) {
                var cleanUrl = stream.split('?')[0].toLowerCase();
                if (cleanUrl.endsWith(".mp4")) {
                    mimeType = "video/mp4";
                }
            }

            // 3. Xử lý Subtitles
            var subtitleList = [];
            var viCount = 0;
            var enCount = 0;

            subtitles.forEach(function(item) {
                if (!item.url) return;

                var lang = (item.language || "").toLowerCase();
                var display = (item.display || "").toLowerCase();
                var type = (item.type || "").toLowerCase();

                var itemUrl = item.url;
                if (itemUrl.indexOf("https://subtitles.shegu.st/sub/") > -1) {
                    var encode = itemUrl.replace("https://subtitles.shegu.st/sub/", "");
                    itemUrl = BASE64.decode(encode);
                }

                function getSubtitleMimeType(type, itemUrl) {
                    var ext = (type || "").toLowerCase();
                    var urlStr = (itemUrl || "").toLowerCase();

                    var isExt = function(targetExt) {
                        return ext === targetExt || urlStr.indexOf("." + targetExt) > -1;
                    };

                    if (isExt("srt")) return "application/x-subrip";
                    if (isExt("ass") || isExt("ssa")) return "text/x-ssa";
                    if (isExt("vtt")) return "text/vtt";
                    if (isExt("sub")) return "text/x-microdvd";
                    if (isExt("ttml") || isExt("dfxp") || isExt("xml")) return "application/ttml+xml";
                    if (isExt("lrc")) return "text/x-lrc";

                    return "text/vtt";
                }

                var subMime = getSubtitleMimeType(type, itemUrl);

                if (lang === "vi" || display.indexOf("vietnamese") > -1 || display.indexOf("vietsub") > -1) {
                    viCount++;
                    subtitleList.push({
                        lang: "Vietsub " + (viCount > 1 ? viCount : "1") + " [" + subMime + "]",
                        url: itemUrl,
                        mimeType: subMime
                    });
                } else if ((lang === "en" || display.indexOf("english") > -1) && enCount < 3) {
                    enCount++;
                    subtitleList.push({
                        lang: "Engsub " + enCount + " [" + subMime + "]",
                        url: itemUrl,
                        mimeType: subMime
                    });
                }
            });

            var finalHeaders = Object.assign({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://goated.cx",
                "Origin": "https://goated.cx"
            }, sourceHeaders);

            return JSON.stringify({
                url: stream,
                mimeType: mimeType,
                isEmbed: false,
                headers: finalHeaders,
                subtitles: subtitleList
            });

        } catch (e) {
            console.log("parseDetailResponse[err]:\n " + e);
            return JSON.stringify({
                url: "",
                mimeType: "",
                isEmbed: false,
                headers: {},
                subtitles: []
            });
        }
    }

    function parseEmbedResponse(html, url) {
        log("parseEmbedResponse [url]: " + url); //console.log("parseEmbedResponse [Raw]: " + html);
        try {
            var stream = "";
            var customJS = clearJS(rawJS);
            // Mimetype application/x-mpegURL video/mp4
            console.log("parseEmbedResponse fetch\n" + stream);

            return JSON.stringify({
                url: stream,
                mimeType: "",
                isEmbed: false,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://novahd.cc",
                    "Origin": "https://novahd.cc",
                    "Block-Ads": false,
                    "Block-Css": "",
                    "Custom-Js": customJS
                },
                subtitles: [{
                    lang: "",
                    url: ""
                }],
            });
        } catch (e) {
            console.log("[Lỗi parseEmbedResponse]", e);
            return JSON.stringify({
                url: "",
                isEmbed: false,
                headers: {}
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
            var detailUrl = BASEURL + slug;
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
            return "https://subtitles.shegu.st/subtitles?type=movie&tmdb=96968";
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

    function buildMenu(menuStr, type) {
        try {
            var menuArray = JSON.parse(menuStr);
            var menulist = [];
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
        } catch (e) {
            if (typeof log === "function") log("buildMenu[err]:\n " + e);
            return [];
        }
    }




    function getPrimaryCategories() {
        try {
            var rawList = getLISTmenu();
            var menulist = buildMenu(rawList);
            return JSON.stringify(menulist);
        } catch (e) {
            if (typeof log === "function") log("getPrimaryCategories[err]:\n " + e);
            return JSON.stringify([]);
        }
    }

    // Tạo thẻ chủ đề filter cho App/Extension
    function getFilterConfig() {
        try {
            var listurl = getLISTmenu();
            var menulist = buildMenu(listurl);
            return JSON.stringify({
                category: menulist
            });
        } catch (e) {
            if (typeof log === "function") log("getFilterConfig[err]:\n " + e);
            return JSON.stringify({
                category: []
            });
        }
    }

    function parseCategoriesResponse(apiResponseJson) {
        try {
            var listurl = getLISTmenu();
            var menulist = buildMenu(listurl);
            return JSON.stringify(menulist);
        } catch (e) {
            if (typeof log === "function") log("parseCategoriesResponse[err]:\n " + e);
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



    // Hàm chuyển đổi text html %20 sang text thuần

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

    BASE64 = {
        encode: function(str) {
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
                            (code & 63) | 128
                        );
                    } else {
                        utf8Bytes.push(
                            (code >> 12) | 224,
                            ((code >> 6) & 63) | 128,
                            (code & 63) | 128
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
                console.log("[BASE64.encode Error]:", e.message || e);
                return "";
            }
        },

        decode: function(base64String) {
            try {
                if (!base64String) return "";

                // 1. Dọn dẹp chuỗi & xử lý nếu URL-encoded (ví dụ: %2B, %2F)
                var str = decodeURIComponent(base64String.trim());

                // Chuyển URL-safe base64 về base64 chuẩn
                str = str.replace(/-/g, "+").replace(/_/g, "/");

                // Bảng ký tự Base64
                var chars =
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                var output = [];
                var buffer = 0,
                    bits = 0;

                // 2. Decode Base64 thành Mảng Byte
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

                // 3. Decode UTF-8 từ mảng Byte ra String
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
                            ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
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
                console.log("[BASE64.decode Error]:", e.message || e);
                return "";
            }
        }
    };

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
                    fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
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
