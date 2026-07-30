// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phimhdcs",
        "name": "PhimHDCS",
        "version": "1.2.5",
        "info": "Bản Tối Ưu Native iOS: Load siêu tốc, Đệ quy bắt trực tiếp link m3u8 qua nhiều lớp iframe.",
        "baseUrl": "https://phimhdcss.com",
        "iconUrl": "https://phimhdcss.com/favicon.ico",
        "isEnabled": true,
        "playerType": "exoplayer", // Ép 100% Native Player
        "type": "MOVIE"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[PhimHDCS] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[PhimHDCS] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'top-phim-ngay', title: 'Top Phim Ngày', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'bang-xep-hang', title: 'Phim Đề Cử', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-ngan', title: 'Phim Ngắn', type: 'Horizontal', path: 'the-loai' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi' },
        { name: 'Top phim ngày', slug: 'top-phim-ngay' },
        { name: 'Phim chiếu rạp', slug: 'phim-chieu-rap' },
        { name: 'Phim ngắn', slug: 'phim-ngan' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Sắp xếp', value: '' },
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Thời gian đăng', value: 'create' },
            { name: 'Năm sản xuất', value: 'year' },
            { name: 'Lượt xem', value: 'view' }
        ],
        type: [
            { name: 'Phim bộ', value: 'series' },
            { name: 'Phim lẻ', value: 'single' }
        ],
        category: [
            { name: 'Thể loại', value: '' },
            { name: 'Âm Nhạc', value: '16' }, { name: 'Báo Thù', value: '52' }, { name: 'Bí ẩn', value: '13' },
            { name: 'Boyloves', value: '29' }, { name: 'Chiến Tranh', value: '18' }, { name: 'Chính kịch', value: '1' },
            { name: 'Chuyển Thể', value: '28' }, { name: 'Cổ Trang', value: '15' }, { name: 'Dân Quốc', value: '30' },
            { name: 'Đô Thị', value: '35' }, { name: 'Gây Cấn', value: '44' }, { name: 'Gia Đình', value: '3' },
            { name: 'Giả Tưởng', value: '43' }, { name: 'Hài Hước', value: '5' }, { name: 'Hành Động', value: '10' },
            { name: 'Hệ Thống', value: '51' }, { name: 'Hiện Đại', value: '36' }, { name: 'Hình Sự', value: '37' },
            { name: 'Hoạt Hình', value: '4' }, { name: 'Học Đường', value: '20' }, { name: 'Huyền Huyễn', value: '25' },
            { name: 'Khoa Học', value: '17' }, { name: 'Khoa Học Viễn Tưởng', value: '42' }, { name: 'Kinh Di Đồ', value: '12' },
            { name: 'Kỳ Ảo', value: '53' }, { name: 'Lãng Mạn', value: '40' }, { name: 'Lịch Sử', value: '46' },
            { name: 'Netflix', value: '48' }, { name: 'Ngôn Tình', value: '32' }, { name: 'Ngọt Sủng', value: '54' },
            { name: 'Phá Án', value: '11' }, { name: 'Phiêu Lưu', value: '9' }, { name: 'Phim 18+', value: '24' },
            { name: 'Phim ngắn', value: '38' }, { name: 'Tâm Lý', value: '6' }, { name: 'Thần Thoại', value: '23' },
            { name: 'Tiên Hiệp', value: '26' }, { name: 'Tình Cảm', value: '2' }, { name: 'Tội Phạm', value: '39' },
            { name: 'Trọng Sinh', value: '56' }, { name: 'TV Shows', value: '8' }, { name: 'Viễn Tưởng', value: '14' },
            { name: 'Võ Thuật', value: '21' }, { name: 'Xuyên Không', value: '27' }, { name: 'Xuyên Sách', value: '50' },
            { name: 'Y Khoa', value: '31' }
        ],
        country: [
            { name: 'Quốc gia', value: '' },
            { name: 'Thái Lan', value: '1' }, { name: 'Trung Quốc', value: '5' }, { name: 'Hàn Quốc', value: '6' },
            { name: 'Nhật Bản', value: '4' }, { name: 'Âu Mỹ', value: '2' }, { name: 'Hồng Kông', value: '26' },
            { name: 'Đài Loan', value: '22' }, { name: 'Việt Nam', value: '34' }, { name: 'Ấn Độ', value: '8' },
            { name: 'Anh', value: '7' }, { name: 'Pháp', value: '10' }, { name: 'Đức', value: '23' },
            { name: 'Tây Ban Nha', value: '12' }, { name: 'Thổ Nhĩ Kỳ', value: '3' }, { name: 'Nga', value: '18' },
            { name: 'Úc', value: '17' }, { name: 'Canada', value: '13' }, { name: 'Brazil', value: '28' },
            { name: 'Singapore', value: '45' }, { name: 'Philippines', value: '20' }, { name: 'Indonesia', value: '16' }
        ],
        language: [
            { name: 'Ngôn ngữ', value: '' },
            { name: 'Vietsub', value: 'Vietsub' },
            { name: 'Thuyết Minh', value: 'Thuyết Minh' },
            { name: 'Vietsub + Thuyết Minh', value: 'Vietsub + Thuyết Minh' },
            { name: 'Lồng Tiếng', value: 'Lồng Tiếng' }
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
        var baseUrl = "https://phimhdcss.com";
        var hasFilter = filters.sort || filters.category || filters.country || filters.year || filters.type || filters.language;

        if (hasFilter) {
            var params = [];
            if (filters.sort) params.push("filter[sort]=" + filters.sort);
            if (filters.type) params.push("filter[type]=" + filters.type);
            if (filters.category) params.push("filter[category]=" + filters.category);
            if (filters.country) params.push("filter[region]=" + filters.country);
            if (filters.year) params.push("filter[year]=" + filters.year);
            if (filters.language) params.push("filter[language]=" + encodeURIComponent(filters.language));
            if (page > 1) params.push("page=" + page);
            return baseUrl + "/?" + params.join("&");
        }

        var path = "";
        if (slug === 'phim-de-cu') path = "/danh-sach/bang-xep-hang";
        else if (slug === 'bang-xep-hang' || slug === 'top-phim-ngay' || slug === 'phim-chieu-rap' || slug === 'phim-moi') path = "/danh-sach/" + slug;
        else path = "/the-loai/" + slug;

        return baseUrl + path + (page > 1 ? "?page=" + page : "");
    } catch (e) {
        return "https://phimhdcss.com/danh-sach/phim-moi";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://phimhdcss.com/?search=" + encodeURIComponent(keyword).replace(/%20/g, "+");
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://phimhdcss.com/" + (slug.startsWith("/") ? slug.substring(1) : slug);
}

function getUrlCategories() { return "https://phimhdcss.com/the-loai"; }
function getUrlCountries() { return "https://phimhdcss.com/quoc-gia"; }
function getUrlYears() { return "https://phimhdcss.com/nam"; }

// =============================================================================
// HTML PARSERS TỐI ƯU SIÊU TỐC
// =============================================================================

function parseDynamicFilters(html) {
    var result = {};
    try {
        var parseSelect = function (nameAttr) {
            var list = [];
            var parts = html.split('name="' + nameAttr + '"');
            if (parts.length > 1) {
                var optionsHtml = parts[1].split('</select>')[0];
                var optBlocks = optionsHtml.split('<option');
                for (var i = 1; i < optBlocks.length; i++) {
                    var valMatch = optBlocks[i].match(/value="([^"]*)"/i);
                    var nameMatch = optBlocks[i].match(/>([^<]+)/);
                    if (valMatch && nameMatch) {
                        var val = valMatch[1];
                        var name = nameMatch[1].trim();
                        if (val && name) list.push({ name: name, value: val });
                    }
                }
            }
            return list;
        };

        result.category = parseSelect('filter\\[category\\]');
        result.country = parseSelect('filter\\[region\\]');
        result.language = parseSelect('filter\\[language\\]');
        result.year = parseSelect('filter\\[year\\]');
        result.sort = parseSelect('filter\\[sort\\]');
        result.type = parseSelect('filter\\[type\\]');
    } catch (e) { }
    return result;
}

function parseListResponse(htmlContent) {
    try {
        var movies = [];
        var itemBlocks = htmlContent.split('class="item '); 
        
        for (var i = 1; i < itemBlocks.length; i++) {
            var block = itemBlocks[i];
            
            var labelMatch = block.match(/class="label">([^<]+)/i);
            var titleMatch = block.match(/title="([^"]+)"/i);
            var slugMatch = block.match(/href="https:\/\/phimhdcss\.com\/([^"]+)"/i) || block.match(/href="\/([^"]+)"/i);
            var imgMatch = block.match(/src="([^"]+)"/i);
            
            if (titleMatch && slugMatch && imgMatch) {
                var label = labelMatch ? labelMatch[1].trim() : "";
                var title = titleMatch[1];
                var slug = slugMatch[1];
                var posterUrl = imgMatch[1];
                
                var year = 0;
                var yearMatch = /(\d{4})/.exec(title);
                if (yearMatch) year = parseInt(yearMatch[1]);

                var episode_current = "";
                var epMatch = /(Tập \d+|Hoàn [tT]ất \(\d+\/\d+\)|Hoàn Tất \(\d+\/\d+\)|Full)/i.exec(label);
                if (epMatch) episode_current = epMatch[1];

                var langPart = label.replace(episode_current, "").trim();
                if (langPart.indexOf("+") === 0) langPart = langPart.substring(1).trim();
                var lang = langPart || "";

                var quality = "";
                if (label.indexOf('Full') > -1) quality = "Full";
                else if (label.indexOf('HD') > -1) quality = "HD";

                movies.push({
                    id: slug,
                    title: title,
                    posterUrl: posterUrl.indexOf('http') === 0 ? posterUrl : 'https://phimhdcss.com' + posterUrl,
                    backdropUrl: posterUrl.indexOf('http') === 0 ? posterUrl : 'https://phimhdcss.com' + posterUrl,
                    year: year,
                    quality: quality,
                    episode_current: episode_current,
                    lang: lang
                });
            }
        }

        var totalPages = 1;
        var pageBlocks = htmlContent.split('page=');
        for(var p = 1; p < pageBlocks.length; p++) {
            var pn = parseInt(pageBlocks[p]);
            if (pn > totalPages) totalPages = pn;
        }

        var currentPage = 1;
        var currentPageMatch = /class="current">(\d+)<\/a>/i.exec(htmlContent);
        if (currentPageMatch) currentPage = parseInt(currentPageMatch[1]);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalPages * 20,
                itemsPerPage: 20
            },
            filterOptions: parseDynamicFilters(htmlContent)
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

function parseMovieDetail(htmlContent, pageUrl) {
    try {
        var slugMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="https:\/\/phimhdcss\.com\/([^"\/]+)"/i);
        var slug = slugMatch ? slugMatch[1] : (pageUrl || "");

        var titleMatch = htmlContent.match(/itemprop="name">([^<]+)/i);
        var title = titleMatch ? titleMatch[1].trim() : "Đang cập nhật...";

        var origMatch = htmlContent.match(/class="real-name">([^<]+)/i);
        var originalTitle = origMatch ? origMatch[1].trim() : "";

        var posterMatch = htmlContent.match(/itemprop="image"\s+src="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";
        if (posterUrl && posterUrl.indexOf('http') !== 0) posterUrl = 'https://phimhdcss.com' + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = "";
        var descParts = htmlContent.split('text-align: justify;');
        if (descParts.length > 1) {
            var rawDesc = descParts[1].split('</div>')[0].replace(/>/g, "> ");
            description = rawDesc.replace(/<[^>]*>/g, "").trim();
        }

        var extractInfoFast = function(label) {
            var idx = htmlContent.indexOf('<dt>' + label + ':</dt>');
            if (idx !== -1) {
                var ddStart = htmlContent.indexOf('<dd>', idx);
                var ddEnd = htmlContent.indexOf('</dd>', ddStart);
                if (ddStart !== -1 && ddEnd !== -1) {
                    return htmlContent.substring(ddStart + 4, ddEnd).replace(/<[^>]*>/g, "").trim();
                }
            }
            return "";
        };

        var director = extractInfoFast("Đạo diễn");
        var duration = extractInfoFast("Thời lượng");
        var totalEpisodes = extractInfoFast("Số tập");
        var statusInfo = extractInfoFast("Tình trạng");
        var language = extractInfoFast("Ngôn ngữ");
        var prodYear = extractInfoFast("Năm sản xuất");
        var countryTag = extractInfoFast("Quốc gia");

        var year = parseInt(prodYear) || 0;
        if (!year && originalTitle) {
            var yearMatch = /(\d{4})/.exec(originalTitle);
            if (yearMatch) year = parseInt(yearMatch[1]);
        }

        var ratingMatch = htmlContent.match(/itemprop="ratingValue">([^<]+)/i);
        var rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

        var episode_current = "";
        var statusMatch = htmlContent.match(/<dd\s+class="film-status">[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
        if (statusMatch) episode_current = statusMatch[1].replace(/<[^>]*>/g, "").trim();
        if (!episode_current) episode_current = statusInfo;

        var categories = [], countries = [], actors = [];
        var links = htmlContent.split('<a ');
        for (var i = 1; i < links.length; i++) {
            var link = links[i];
            if (link.indexOf('/the-loai/') !== -1) {
                var m = link.match(/>([^<]+)<\/a>/);
                if (m && categories.indexOf(m[1].trim()) === -1) categories.push(m[1].trim());
            } else if (link.indexOf('/quoc-gia/') !== -1) {
                var m = link.match(/>([^<]+)<\/a>/);
                if (m && countries.indexOf(m[1].trim()) === -1) countries.push(m[1].trim());
            } else if (link.indexOf('/dien-vien/') !== -1) {
                var m = link.match(/>([^<]+)<\/a>/);
                if (m && actors.indexOf(m[1].trim()) === -1) actors.push(m[1].trim());
            }
        }
        if (countries.length === 0 && countryTag) countries.push(countryTag);

        var servers = [];
        var serverBlocks = htmlContent.split('class="server-episode-block"');
        for (var i = 1; i < serverBlocks.length; i++) {
            var sBlock = serverBlocks[i];
            var nameMatch = sBlock.match(/Danh sách\s*(?:Sever)?\s*([^:]+):/i);
            if (!nameMatch) continue;
            var cleanServerName = nameMatch[1].replace(/^Server\s+/i, '').replace(/^z/i, '').replace(/\s*#\d+$/, '').trim();

            var epsBlock = sBlock.split('class="list-episode')[1];
            if (!epsBlock) continue;
            epsBlock = epsBlock.split('</div>')[0];

            var episodes = [];
            var epParts = epsBlock.split('<a ');
            for (var j = 1; j < epParts.length; j++) {
                var eMatch = epParts[j].match(/href="([^"]+)"[^>]*title="([^"]+)"/i);
                if (eMatch) {
                    var epUrl = eMatch[1];
                    if (epUrl.indexOf('http') !== 0) epUrl = 'https://phimhdcss.com' + (epUrl.startsWith('/') ? '' : '/') + epUrl;
                    episodes.push({
                        id: epUrl,
                        name: eMatch[2].trim(),
                        slug: epUrl
                    });
                }
            }

            if (episodes.length > 0) {
                var firstEpNumMatch = /Tập\s+(\d+)/i.exec(episodes[0].name);
                var lastEpNumMatch = /Tập\s+(\d+)/i.exec(episodes[episodes.length - 1].name);
                if (firstEpNumMatch && lastEpNumMatch) {
                    if (parseInt(firstEpNumMatch[1]) > parseInt(lastEpNumMatch[1])) {
                        episodes.reverse();
                    }
                } else {
                    episodes.reverse();
                }
                servers.push({ name: cleanServerName, episodes: episodes });
            }
        }

        var extraUrl = "";
        var btnPlayMatch = htmlContent.match(/<a\s+class="btn-see btn btn-danger btn-stream-link"\s+href="([^"]+)"/i);
        if (btnPlayMatch) extraUrl = btnPlayMatch[1];
        if (extraUrl && extraUrl.indexOf('http') !== 0) extraUrl = 'https://phimhdcss.com' + (extraUrl.startsWith('/') ? '' : '/') + extraUrl;

        var fullDesc = description;
        if (duration) fullDesc += "\nThời lượng: " + duration;
        if (totalEpisodes) fullDesc += "\nSố tập: " + totalEpisodes;
        if (statusInfo) fullDesc += "\nTình trạng: " + statusInfo;

        return JSON.stringify({
            id: slug,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: fullDesc,
            year: year,
            rating: rating,
            quality: "",
            servers: servers,
            episode_current: episode_current,
            lang: language,
            category: categories.join(", "),
            country: countries.join(", "),
            director: director,
            casts: actors.join(", "),
            extra: extraUrl 
        });
    } catch (error) {
        return "null";
    }
}

// =============================================================================
// BẮT LINK CHÍNH THỨC (PHÁT NATIVE)
// =============================================================================

function parseDetailResponse(htmlContent, url) {
    try {
        // Tìm button Server đang Active để lấy Data-Link
        var streamUrl = "";
        var linkMatch = htmlContent.match(/class=["'][^"']*streaming-server[^"']*active[^"']*["'][^>]*data-link=["']([^"']+)["']/i);
        
        // Dự phòng: Lấy thẻ chứa data-link bất kỳ nếu không có nút active
        if (!linkMatch) linkMatch = htmlContent.match(/data-link=["']([^"']+)["'][^>]*class=["'][^"']*streaming-server/i);
        
        if (linkMatch) {
            streamUrl = linkMatch[1];
            if (streamUrl.indexOf('//') === 0) streamUrl = "https:" + streamUrl;

            // Kiểm tra xem Data-Link là file m3u8 lộ diện hay là link Iframe (embed)
            var isDirect = streamUrl.indexOf('.m3u8') !== -1 || streamUrl.indexOf('.mp4') !== -1;

            if (isDirect) {
                // Link m3u8 thuần -> Trả về để ExoPlayer phát ngay lập tức
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: false,
                    mimeType: "application/x-mpegURL",
                    headers: { "Referer": "https://phimhdcss.com/", "User-Agent": "Mozilla/5.0" },
                    subtitles: []
                });
            } else {
                // Link Iframe (VD: tiktok.phimhdc.com/embed/...) -> Trả về kèm isEmbed: true
                // VAX App sẽ tải ngầm Iframe này và chạy parseEmbedResponse
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: true, 
                    headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                    subtitles: []
                });
            }
        }

        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

// =============================================================================
// BẮT LINK ĐỆ QUY (TÌM M3U8 BÊN TRONG CÁC LỚP IFRAME / API)
// =============================================================================

function parseEmbedResponse(htmlContent, url) {
    try {
        // 1. Quét tìm đuôi .m3u8 hoặc .mp4 xuất hiện thẳng trong HTML của trang Embed
        var directMatch = htmlContent.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
        if (directMatch) {
            var finalUrl = directMatch[1].replace(/\\/g, '');
            return JSON.stringify({
                url: finalUrl,
                isEmbed: false, // Dừng đệ quy, gửi cho Player phát
                mimeType: finalUrl.indexOf('.m3u8') > -1 ? "application/x-mpegURL" : "video/mp4",
                headers: { "Referer": url, "User-Agent": "Mozilla/5.0" },
                subtitles: []
            });
        }

        // 2. Kiểm tra nếu Iframe trả về dạng JSON (Ví dụ từ API do=getVideo)
        if (htmlContent.indexOf('{"') === 0 || htmlContent.indexOf('[{') === 0) {
            var fileMatch = htmlContent.match(/["'](?:file|link|securedLink|videoSource)["']\s*:\s*["']([^"']+)["']/i);
            var m3u8JsonMatch = htmlContent.match(/["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            var foundLink = (fileMatch && fileMatch[1]) ? fileMatch[1] : (m3u8JsonMatch ? m3u8JsonMatch[1] : "");

            if (foundLink) {
                return JSON.stringify({
                    url: foundLink.replace(/\\/g, ''),
                    isEmbed: false, 
                    mimeType: "application/x-mpegURL",
                    headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                });
            }
        }

        // 3. Dự phòng nếu link giấu trong JS packer (VD: eval(function(p,a,c,k,e,d)...))
        var packMatch = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\),0,\{\}\))\)/);
        if (packMatch) {
            try {
                var unpacked = eval("(" + packMatch[1] + ")");
                var m3u8Hidden = unpacked.match(/(https?:\/\/[^"'\s<>]*\.(?:m3u8|mp4)[^"'\s<>]*)/i);
                if (m3u8Hidden) {
                    return JSON.stringify({
                        url: m3u8Hidden[1].replace(/\\/g, ''),
                        isEmbed: false,
                        mimeType: "application/x-mpegURL",
                        headers: { "Referer": url }
                    });
                }
                
                // Đôi khi code nén lại in ra 1 Iframe khác
                var iframeHidden = unpacked.match(/<iframe[^>]*src=["']([^"']+)["']/i);
                if (iframeHidden) {
                    var nextUrl = iframeHidden[1].replace(/\\/g, '');
                    if (nextUrl.indexOf('//') === 0) nextUrl = "https:" + nextUrl;
                    return JSON.stringify({
                        url: nextUrl,
                        isEmbed: true, // Ra lệnh cho App đào sâu thêm 1 lớp Iframe nữa
                        headers: { "Referer": url }
                    });
                }
            } catch (err) {}
        }

        // 4. Nếu Iframe này lại chứa 1 Iframe khác (Đệ quy nhiều lớp)
        var iframeMatch = htmlContent.match(/<iframe[^>]*src=["']([^"']+)["']/i);
        if (iframeMatch) {
            var nextUrl2 = iframeMatch[1];
            if (nextUrl2.indexOf('//') === 0) nextUrl2 = "https:" + nextUrl2;
            if(nextUrl2 !== url) {
                 return JSON.stringify({
                    url: nextUrl2,
                    isEmbed: true, // CẤP BÁO CHO VAX TIẾP TỤC TRUY VẾT
                    headers: { "Referer": url, "User-Agent": "Mozilla/5.0" }
                });
            }
        }

        // 5. Bắt luồng API đặc biệt của Abyss/StreamXemphimHD
        var firePlayerMatch = htmlContent.match(/FirePlayer\(\s*["']([^"']+)["']/i);
        if (firePlayerMatch) {
            var embedId = firePlayerMatch[1];
            var originDomain = url.match(/^(https?:\/\/[^\/]+)/)[1];
            var apiUrl = originDomain + "/player/index.php?data=" + embedId + "&do=getVideo";
            return JSON.stringify({
                url: apiUrl,
                isEmbed: true, // Yêu cầu App fetch JSON từ API này
                postBody: "hash=" + embedId + "&r=",
                headers: {
                    "Referer": url,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });

    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// -----------------------------------------------------------------------------
// UTILS BẮT BUỘC KHÁC
// -----------------------------------------------------------------------------
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
