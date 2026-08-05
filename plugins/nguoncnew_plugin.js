// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguoncnew",
        "name": "Phim NguonC Xoá Quảng Cáo",
        "version": "1.39", // Xử lý triệt để bằng kỹ thuật Hook Blob M3U8 + Thẻ Video
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embedtoexoplay" // Bắt buộc dùng để kích hoạt EmbedSniffer ngầm
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'phim-moi-cap-nhat' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'updated' },
            { name: 'Mới nhất', value: 'new' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "updated";

        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=" + page;
        }

        if (filters.category) return "https://phim.nguonc.com/api/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        if (filters.country) return "https://phim.nguonc.com/api/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        if (filters.year) return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;

        if (/^\d{4}$/.test(slug)) return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;

        var listSlugs = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
        if (listSlugs.indexOf(slug) >= 0) {
            if (slug !== 'hoat-hinh') {
                return "https://phim.nguonc.com/api/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
            }
        }

        var countrySlugs = [
            'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam', 'phap', 'hong-kong',
            'han-quoc', 'nhat-ban', 'thai-lan', 'dai-loan', 'nga', 'ha-lan',
            'philippines', 'an-do', 'quoc-gia-khac'
        ];
        if (countrySlugs.indexOf(slug) >= 0) return "https://phim.nguonc.com/api/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;

        return "https://phim.nguonc.com/api/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;
    } catch (e) {
        return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://phim.nguonc.com/api/films/search?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    var realSlug = slug.split("|")[0];
    if (realSlug.indexOf("http") === 0) return slug;
    return "https://phim.nguonc.com/api/film/" + slug;
}

function getUrlCategories() { return "https://phim.nguonc.com"; }
function getUrlCountries() { return "https://phim.nguonc.com"; }
function getUrlYears() { return "https://phim.nguonc.com"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === "string" ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(response.items)) items = response.items;
        else if (data.items && Array.isArray(data.items)) items = data.items;

        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.current_episode || item.episode_current || "",
                lang: item.language || item.lang || ""
            };
        });

        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;

        var totalPages = paginate.total_page || paginate.totalPages || 0;
        if (totalPages === 0 && itemsPerPage > 0) totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: currentPage, totalPages: totalPages, totalItems: totalItems, itemsPerPage: itemsPerPage }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === "string" ? JSON.parse(apiResponseJson) : apiResponseJson;
        var movie = response.movie || response.data?.item || response.data || {};

        var rawEpisodes = movie.episodes || response.episodes || response.data?.item?.episodes || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];

                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var embed = ep.embed || ep.link_embed || "";
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";
                        
                        var link = m3u8 || embed;

                        if (link) {
                            episodes.push({
                                // Gắn cờ "direct" nếu là link M3U8 gốc để phát thẳng không cần Webview
                                id: link + (m3u8 ? "|data:direct" : "|data:embed"),
                                name: ep.name || ep.episode_name || "",
                                slug: ep.slug || ep.episode_slug || ""
                            });
                        }
                    });
                }

                if (episodes.length > 0) {
                    servers.push({
                        name: server.server_name || server.name || "Server",
                        episodes: episodes
                    });
                }
            });
        }

        var extractGroup = function (categoryObj, groupName) {
            if (!categoryObj) return "";
            for (var key in categoryObj) {
                var group = categoryObj[key];
                if (group && group.group && group.group.name === groupName && group.list && group.list.length > 0) {
                    return group.list.map(function (item) { return item.name; }).join(", ");
                }
            }
            return "";
        };

        var extractedYear = extractGroup(movie.category, "Năm");

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.description || movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year || extractedYear) || 0,
            rating: parseFloat(movie.view) || 0,
            quality: movie.quality || "HD",
            servers: servers,
            episode_current: movie.current_episode || movie.episode_current || "",
            lang: movie.language || movie.lang || "",
            casts: movie.casts || movie.actor || "",
            director: movie.director || "",
            category: extractGroup(movie.category, "Thể loại"),
            country: extractGroup(movie.category, "Quốc gia"),
            view: parseInt(movie.view) || 0,
            status: movie.status || ""
        });
    } catch (error) {
        return "{}";
    }
}

// Hàm lấy dữ liệu ẩn sau dấu |
function getPipeData(url) {
    var i = url.indexOf("|");
    if (i < 0) return "";
    var s = url.substring(i + 1).replace(/^\s+/, "").trim();
    if (s.toLowerCase().indexOf("data:") === 0) s = s.substring(5);
    return s;
}

// =============================================================================
// SỨC MẠNH TỐI THƯỢNG: HOOK BLOB M3U8 & BẮT THẺ VIDEO
// =============================================================================
function parseDetailResponse(html, apiUrl) {
    try {
        var dataType = getPipeData(apiUrl);
        var url = apiUrl.split("|")[0];

        // 1. NẾU LÀ LINK M3U8 TRỰC TIẾP (Phát luôn, miễn gọi Webview)
        if (dataType === "direct" || url.indexOf('.m3u8') !== -1 || url.indexOf('.mp4') !== -1) {
            return JSON.stringify({
                "url": url,
                "isEmbed": false,
                "mimeType": url.indexOf('.mp4') !== -1 ? "video/mp4" : "application/x-mpegURL",
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Origin": "https://phim.nguonc.com",
                    "Referer": "https://phim.nguonc.com/"
                }
            });
        }
        
        // 2. NẾU LÀ LINK EMBED -> ÉP MỞ WEBVIEW NGẦM KÈM HOOK JS CHUẨN TÀI LIỆU
        var hookJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            // 1. Hook Blob M3U8
            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                var originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = function(blob) {
                    var blobUrl = originalCreateObjectURL.apply(this, arguments);
                    if (blob && (blob instanceof Blob || blob instanceof File)) {
                        var processContent = function(content) {
                            if (content && content.trim().indexOf('#EXTM3U') === 0) {
                                if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
                                    window.SnifferBridge.log("✅ Bắt được Blob M3U8 từ bộ nhớ RAM!");
                                    window.SnifferBridge.playM3u8Content(content, window.location.href);
                                }
                            }
                        };
                        if (typeof blob.text === 'function') {
                            blob.text().then(processContent).catch(function(){});
                        } else {
                            var reader = new FileReader();
                            reader.onload = function(e) { processContent(e.target.result); };
                            reader.readAsText(blob);
                        }
                    }
                    return blobUrl;
                };
            }

            // 2. Quét thẻ Video theo thời gian thực
            var checkVideo = setInterval(function() {
                try {
                    var video = document.querySelector('video');
                    if (video && video.src) {
                        if (video.src.indexOf('blob:') !== 0) {
                            if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
                                window.SnifferBridge.log("✅ Đã bắt được link video trực tiếp: " + video.src);
                                window.SnifferBridge.play(video.src);
                            }
                            clearInterval(checkVideo);
                        } else {
                            if (window.SnifferBridge) window.SnifferBridge.log("⏳ Đang chờ bắt Blob...");
                        }
                    } else {
                        if (window.SnifferBridge) window.SnifferBridge.log("⏳ Đang chờ thẻ video xuất hiện...");
                    }
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("❌ Lỗi CustomJS: " + err.message);
                }
            }, 1000);

            // 3. Tự động Click nút Play ẩn (giúp Web nhả link)
            var clickPlay = setInterval(function() {
                var btn = document.querySelector('.jw-icon-display, .vjs-big-play-button, .plyr__control--overlaid, .play-btn');
                if (btn) btn.click();
            }, 1000);

            // Tự hủy Click Play sau 15 giây để không tốn RAM
            setTimeout(function() { clearInterval(clickPlay); }, 15000);
        })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Bật Webview ngầm
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://phim.nguonc.com/",
                
                // --- LỚP KHIÊN CHỐNG QUẢNG CÁO TUYỆT ĐỐI ---
                "Block-Ads": "true",
                "Block-Redirects": "true",
                "Block-Domains": "googlesyndication.com, doubleclick.net, googleadservices.com, popads.net, popcash.net, propellerads.com, exoclick.com, juicyads.com, clickadu.com, adsterra.com, vidoomy.com",
                "Block-Keywords": "/adserv/, /adstream/, /popunder, /popup.js, /ads.js, ad_provider, pop_under, vast.xml, vpaid.js",
                "Block-Css": "iframe[src*='ad'], iframe[src*='pop'], div[class*='ad-'], div[id*='ad-'], .popunder, .popup, .ad-box",
                // ------------------------------------------

                "Custom-Js": hookJsCode.replace(/\r\n|\r|\n/g, " ").trim()
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": apiUrl.split("|")[0], "isEmbed": true });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://img.phimapi.com/" + path;
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
