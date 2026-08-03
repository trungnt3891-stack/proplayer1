// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "phimhdcs",
        "name": "PhimHDCS",
        "version": "1.1.6", // Đã fix lỗi không load được danh sách và bìa phim bằng Regex 100%
        "baseUrl": "https://phimhdcss.com",
        "iconUrl": "https://phimhdcss.com/favicon.ico",
        "isEnabled": true,
        "playerType": "exoplayer",
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
        if (slug === 'phim-de-cu') {
            path = "/danh-sach/bang-xep-hang";
        } else if (slug === 'bang-xep-hang' || slug === 'top-phim-ngay' || slug === 'phim-chieu-rap' || slug === 'phim-moi') {
            path = "/danh-sach/" + slug;
        } else {
            path = "/the-loai/" + slug;
        }

        var url = baseUrl + path;
        if (page > 1) {
            url += "?page=" + page;
        }

        return url;
    } catch (e) {
        return "https://phimhdcss.com/danh-sach/phim-moi";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://phimhdcss.com/?search=" + encodeURIComponent(keyword).replace(/%20/g, "+");
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    var path = slug.startsWith("/") ? slug.substring(1) : slug;
    return "https://phimhdcss.com/" + path;
}

function getUrlCategories() {
    return "https://phimhdcss.com/the-loai";
}

function getUrlCountries() {
    return "https://phimhdcss.com/quoc-gia";
}

function getUrlYears() {
    return "https://phimhdcss.com/nam";
}

// =============================================================================
// HTML PARSERS (ĐÃ SỬA: SỬ DỤNG REGEX CHUẨN ĐỂ VƯỢT LỖI XUỐNG DÒNG)
// =============================================================================

function parseDynamicFilters(html) {
    var result = {};
    try {
        var parseSelect = function (namePattern) {
            var list = [];
            var selectMatch = new RegExp('<select[^>]+name="' + namePattern + '"[\\s\\S]*?>([\\s\\S]*?)<\\/select>', 'i').exec(html);
            if (selectMatch) {
                var optionsHtml = selectMatch[1];
                var optionPattern = /<option\s+value="([^"]*)"[^>]*>\s*([\s\S]*?)\s*<\/option>/gi;
                var optMatch;
                while ((optMatch = optionPattern.exec(optionsHtml)) !== null) {
                    var val = optMatch[1];
                    var name = optMatch[2].replace(/<[^>]*>/g, "").trim();
                    if (val && name) list.push({ name: name, value: val });
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
        
        // Regex siêu chuẩn để bóc khối <li> chứa phim
        var itemPattern = /<li[^>]*class=["'][^"']*item[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']label["'][^>]*>([^<]*)<\/span>[\s\S]*?<a[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi;
        var match;

        while ((match = itemPattern.exec(htmlContent)) !== null) {
            var label = match[1].trim();
            var slug = match[2];
            var title = match[3];
            var posterUrl = match[4];

            if (slug.indexOf("http") === -1) slug = 'https://phimhdcss.com' + (slug.startsWith('/') ? '' : '/') + slug;
            if (posterUrl.indexOf("http") === -1) posterUrl = 'https://phimhdcss.com' + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

            var year = 0;
            var yearMatch = /(\d{4})/.exec(title);
            if (yearMatch) year = parseInt(yearMatch[1]);

            var episode_current = "";
            var epMatch = /(Tập \d+|Hoàn [tT]ất.*|Full)/i.exec(label);
            if (epMatch) episode_current = epMatch[1];

            var lang = label.replace(episode_current, "").trim();
            if (lang.indexOf("+") === 0) lang = lang.substring(1).trim();

            var quality = "";
            if (label.indexOf('Full') > -1) quality = "Full";
            else if (label.indexOf('HD') > -1) quality = "HD";

            movies.push({
                id: slug,
                title: title.trim(),
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                year: year,
                quality: quality,
                episode_current: episode_current || label,
                lang: lang
            });
        }

        var totalPages = 1;
        var pagePattern = /<a[^>]*href=["'][^"']*page=(\d+)["'][^>]*>/gi;
        var match2;
        while ((match2 = pagePattern.exec(htmlContent)) !== null) {
            var pageNum = parseInt(match2[1]);
            if (pageNum > totalPages) totalPages = pageNum;
        }

        var currentPage = 1;
        var currentPageMatch = /<a[^>]*class=["'][^"']*current[^"']*["'][^>]*>(\d+)<\/a>/i.exec(htmlContent);
        if (currentPageMatch) currentPage = parseInt(currentPageMatch[1]);

        var filterOptions = parseDynamicFilters(htmlContent);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalPages * 20,
                itemsPerPage: 20
            },
            filterOptions: filterOptions
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

function parseMovieDetail(htmlContent, url) {
    try {
        var title = "";
        var titleMatch = /<h1[^>]*class=["'][^"']*title[^"']*["'][^>]*>([^<]+)<\/h1>/i.exec(htmlContent) || /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(htmlContent);
        if (titleMatch) title = titleMatch[1].replace(/Phim /gi, "").trim();

        var originalTitle = "";
        var origMatch = /<span[^>]*class=["'][^"']*real-name[^"']*["'][^>]*>([^<]+)<\/span>/i.exec(htmlContent);
        if (origMatch) originalTitle = origMatch[1].trim();

        var posterUrl = "";
        var posterMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(htmlContent);
        if (posterMatch) posterUrl = posterMatch[1];
        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = 'https://phimhdcss.com' + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = "";
        var descMatch = /<div[^>]*class=["'][^"']*tab[^"']*["'][^>]*>[\s\S]*?<div[^>]*style=["'][^"']*text-align:\s*justify;[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(htmlContent);
        if (!descMatch) descMatch = /<div[^>]*class=["'][^"']*tab[^"']*["'][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i.exec(htmlContent);
        if (descMatch) description = descMatch[1].replace(/<[^>]*>/g, "").trim();

        function extractInfo(label) {
            var regex = new RegExp('<dt[^>]*>\\s*' + label + ':?\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>', 'i');
            var match = regex.exec(htmlContent);
            if (match) return match[1].replace(/<[^>]*>/g, "").trim();
            return "";
        }

        var director = extractInfo("Đạo diễn");
        var duration = extractInfo("Thời lượng");
        var totalEpisodes = extractInfo("Số tập");
        var statusInfo = extractInfo("Tình trạng");
        var language = extractInfo("Ngôn ngữ");
        var prodYear = extractInfo("Năm sản xuất");
        var countryTag = extractInfo("Quốc gia");

        var year = parseInt(prodYear) || 2026;
        if (!year && originalTitle) {
            var yearMatch = /(\d{4})/.exec(originalTitle);
            if (yearMatch) year = parseInt(yearMatch[1]);
        }

        var rating = 0;
        var ratingMatch = /ratingValue[^>]*>([^<]+)</i.exec(htmlContent);
        if (ratingMatch) rating = parseFloat(ratingMatch[1]);

        var episode_current = statusInfo;
        var statusMatch = /class=["'][^"']*film-status[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i.exec(htmlContent);
        if (statusMatch) episode_current = statusMatch[1].replace(/<[^>]*>/g, "").trim();

        var categories = [];
        var catPattern = /<a[^>]*href=["'][^"']*\/the-loai\/[^"']*["'][^>]*>([^<]+)<\/a>/gi;
        var match;
        while ((match = catPattern.exec(htmlContent)) !== null) categories.push(match[1].trim());

        var countries = [];
        var countryPattern = /<a[^>]*href=["'][^"']*\/quoc-gia\/[^"']*["'][^>]*>([^<]+)<\/a>/gi;
        while ((match = countryPattern.exec(htmlContent)) !== null) countries.push(match[1].trim());
        if (countries.length === 0 && countryTag) countries.push(countryTag);

        var actors = [];
        var actorPattern = /<a[^>]*href=["'][^"']*\/dien-vien\/[^"']*["'][^>]*>([^<]+)<\/a>/gi;
        while ((match = actorPattern.exec(htmlContent)) !== null) actors.push(match[1].trim());

        var servers = [];
        var serverPattern = /<div[^>]*class=["'][^"']*server-episode-block[^"']*["'][^>]*>[\s\S]*?Danh sách\s*(?:Sever)?\s*([^:]+):[\s\S]*?<div[^>]*class=["'][^"']*list-episode[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;

        while ((match = serverPattern.exec(htmlContent)) !== null) {
            var serverName = match[1].trim().replace(/^Server\s+/i, '').replace(/^z/i, '').replace(/\s*#\d+$/, '').trim();
            var episodesHtml = match[2];
            var episodes = [];
            
            var epPattern = /<a[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["']/gi;
            var epMatch;
            while ((epMatch = epPattern.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1];
                if (epUrl.indexOf('http') !== 0) epUrl = 'https://phimhdcss.com' + (epUrl.startsWith('/') ? '' : '/') + epUrl;

                episodes.push({
                    id: epUrl,
                    name: epMatch[2].trim(),
                    slug: epUrl
                });
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
                servers.push({ name: serverName, episodes: episodes });
            }
        }

        var extraUrl = "";
        var btnPlayMatch = /class=["'][^"']*btn-see[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(htmlContent);
        if (btnPlayMatch) extraUrl = btnPlayMatch[1];
        if (extraUrl && extraUrl.indexOf('http') !== 0) extraUrl = 'https://phimhdcss.com' + (extraUrl.startsWith('/') ? '' : '/') + extraUrl;

        var fullDesc = description;
        if (duration) fullDesc += "\nThời lượng: " + duration;
        if (totalEpisodes) fullDesc += "\nSố tập: " + totalEpisodes;
        if (statusInfo) fullDesc += "\nTình trạng: " + statusInfo;

        return JSON.stringify({
            id: url || 'https://phimhdcss.com',
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: fullDesc,
            year: year,
            rating: rating,
            quality: "HD",
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
        return JSON.stringify({ id: url, title: "Lỗi chi tiết phim", servers: [] });
    }
}

// =============================================================================
// PHẦN LOGIC PHÁT VIDEO CHÍNH CỦA BẠN (ĐƯỢC GIỮ NGUYÊN 100%)
// =============================================================================

function parseDetailResponse(htmlContent, pageUrl) {
    try {
        var decodeBase64 = function (str) {
            try {
                var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var result = '';
                str = String(str).replace(/[^A-Za-z0-9+\/=]/g, '');
                var len = str.length;
                for (var i = 0; i < len; i += 4) {
                    var a = lookup.indexOf(str.charAt(i));
                    var b = i + 1 < len ? lookup.indexOf(str.charAt(i + 1)) : 0;
                    var c = i + 2 < len ? lookup.indexOf(str.charAt(i + 2)) : -1;
                    var d = i + 3 < len ? lookup.indexOf(str.charAt(i + 3)) : -1;
                    result += String.fromCharCode((a << 2) | (b >> 4));
                    if (c !== -1) result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
                    if (d !== -1) result += String.fromCharCode(((c & 3) << 6) | d);
                }
                return result;
            } catch (e) { return null; }
        };

        var decodeChunksWithSalt = function (chunks, saltString) {
            var revBase64 = chunks.join('');
            var base64 = revBase64.split('').reverse().join('');
            if (saltString) base64 = base64.replace(saltString, '');
            return decodeBase64(base64);
        };

        var saltMatch = /(?:const|let|var)\s+_0xS\s*=\s*["']([^"']+)["']/.exec(htmlContent);
        var saltString = saltMatch ? saltMatch[1] : "";

        var oxData = null;
        var realObjMatch = /(?:const|let|var)\s+realObj\s*=\s*JSON\.parse\(\s*atob\(\s*["']([^"']+)["']\s*\)\s*\)/i.exec(htmlContent);
        
        if (realObjMatch) {
            try {
                var decodedRealObj = decodeBase64(realObjMatch[1]);
                if (decodedRealObj) {
                    oxData = JSON.parse(decodedRealObj);
                }
            } catch (e) {}
        }

        if (!oxData) {
            var dataMatch = /(?:const|let|var)\s+_0xData\s*=\s*(\{[\s\S]*?\})\s*;/.exec(htmlContent);
            if (dataMatch) {
                try {
                    var startIdx = dataMatch.index + dataMatch[0].indexOf('{');
                    var braceCount = 0;
                    var jsonEnd = -1;
                    for (var j = startIdx; j < htmlContent.length && j < startIdx + 100000; j++) {
                        if (htmlContent[j] === '{') braceCount++;
                        else if (htmlContent[j] === '}') {
                            braceCount--;
                            if (braceCount === 0) { jsonEnd = j + 1; break; }
                        }
                    }
                    if (jsonEnd > 0) {
                        var jsonStr = htmlContent.substring(startIdx, jsonEnd);
                        oxData = JSON.parse(jsonStr);
                    }
                } catch (e) {}
            }
        }

        if (oxData) {
            var curId = null;
            var curIdPatterns = [
                /(?:const|let|var)\s+curId\s*=\s*['"]?(\d+)['"]?/,
                /(?:const|let|var)\s+episode\s*=\s*['"]?(\d+)['"]?/,
                /(?:const|let|var)\s+episode_id\s*=\s*['"]?(\d+)['"]?/,
                /(?:const|let|var)\s+currentEpisodeId\s*=\s*['"]?(\d+)['"]?/,
                /data-id="(\d+)"[^>]*class="[^"]*active[^"]*streaming-server/i,
                /class="[^"]*active[^"]*streaming-server[^"]*"[^>]*data-id="(\d+)"/i
            ];
            for (var pi = 0; pi < curIdPatterns.length; pi++) {
                var m = curIdPatterns[pi].exec(htmlContent);
                if (m) { curId = m[1]; break; }
            }

            var targetId = curId;

            if (!targetId && pageUrl) {
                var urlIdMatch = /(\d{5,})(?:\?|$|#)/.exec(pageUrl);
                if (!urlIdMatch) urlIdMatch = /-(\d{5,})$/.exec(pageUrl);
                if (urlIdMatch && oxData[urlIdMatch[1]]) {
                    targetId = urlIdMatch[1];
                }
            }

            if (!targetId) {
                var keys = [];
                for (var k in oxData) { if (oxData.hasOwnProperty(k)) keys.push(k); }
                if (keys.length > 0) targetId = keys[0];
            }

            if (targetId && oxData[targetId] && Array.isArray(oxData[targetId])) {
                var chunks = oxData[targetId];
                var playerUrl = decodeChunksWithSalt(chunks, saltString);

                if (playerUrl && playerUrl.indexOf("player.php?") !== -1) {
                    var matchLink = /[?&](?:link|url)=([^&]+)/.exec(playerUrl);
                    if (matchLink) {
                        playerUrl = decodeURIComponent(matchLink[1]);
                    }
                }
                
                if (playerUrl && playerUrl.indexOf('http') === 0) {
                    var isDirect = playerUrl.indexOf('.m3u8') !== -1 || playerUrl.indexOf('.mp4') !== -1;
                    if (isDirect) {
                        return JSON.stringify({
                            url: playerUrl,
                            isEmbed: false,
                            mimeType: "application/x-mpegURL",
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Referer": "https://phimhdcss.com/"
                            },
                            subtitles: []
                        });
                    } else {
                        return JSON.stringify({
                            url: playerUrl,
                            isEmbed: true,
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Referer": "https://phimhdcss.com/"
                            },
                            subtitles: []
                        });
                    }
                }
            }
        }

        var iframeMatch = htmlContent.match(/<iframe[^>]*src="([^"]+)"/i);
        if (iframeMatch) {
            var embedUrl = iframeMatch[1];
            if (embedUrl.indexOf('//') === 0) embedUrl = "https:" + embedUrl;
            
            if (embedUrl.indexOf("player.php?") !== -1) {
                var matchLink = /[?&](?:link|url)=([^&]+)/.exec(embedUrl);
                if (matchLink) embedUrl = decodeURIComponent(matchLink[1]);
            }

            if (embedUrl && embedUrl !== pageUrl && embedUrl.length > 5) {
                var isDirect = embedUrl.indexOf('.m3u8') !== -1 || embedUrl.indexOf('.mp4') !== -1;
                return JSON.stringify({
                    url: embedUrl,
                    isEmbed: !isDirect,
                    mimeType: isDirect ? "application/x-mpegURL" : undefined,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": "https://phimhdcss.com/"
                    },
                    subtitles: []
                });
            }
        }

        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });

    } catch (error) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function parseEmbedResponse(htmlContent, url) {
    try {
        if (url.indexOf("do=getVideo") !== -1 || (htmlContent.indexOf("securedLink") !== -1 && htmlContent.indexOf("hls") !== -1)) {
            var jData = JSON.parse(htmlContent);
            var streamUrl = "";
            if (jData.securedLink) streamUrl = jData.securedLink;
            else if (jData.videoSource) streamUrl = jData.videoSource;
            else if (jData.videoSources && jData.videoSources.length > 0) streamUrl = jData.videoSources[0].file;
            
            var subtitles = [];
            var subMatch = /[?&]subs=([^&]+)/.exec(url);
            if (subMatch) {
                try { subtitles = JSON.parse(decodeURIComponent(subMatch[1])); } catch(e) {}
            }
            
            if (streamUrl) {
                return JSON.stringify({
                    url: streamUrl,
                    isEmbed: false, 
                    mimeType: "application/x-mpegURL",
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": "https://play.streamxemphimhd.site/"
                    },
                    subtitles: subtitles
                });
            } else {
                return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
            }
        }

        var embedId = null;
        var idMatch = /\/video\/([a-zA-Z0-9]+)/.exec(url);
        if (idMatch) embedId = idMatch[1];
        
        var subtitles = [];
        var match = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\),0,\{\}\))\)/);
        if (match) {
            var innerCode = match[1];
            try {
                var unpacked = eval("(" + innerCode + ")");
                var firePlayerIdMatch = /FirePlayer\(\s*["']([^"']+)["']/.exec(unpacked);
                if (firePlayerIdMatch) embedId = firePlayerIdMatch[1];
                
                var tracksMatch = /"tracks"\s*:\s*(\[[\s\S]*?\])/.exec(unpacked);
                if (tracksMatch) {
                    var tracks = JSON.parse(tracksMatch[1]);
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        if (track.kind === "captions" && track.file && track.label) {
                            subtitles.push({
                                lang: track.label,
                                url: track.file,
                                isAutoTranslated: false
                            });
                        }
                    }
                }
            } catch (e) {}
        }
        
        if (!embedId) {
            return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
        }
        
        var subtitlesQuery = encodeURIComponent(JSON.stringify(subtitles));
        var postUrl = "https://play.streamxemphimhd.site/player/index.php?data=" + embedId + "&do=getVideo&subs=" + subtitlesQuery;
        var postBody = "hash=" + embedId + "&r=https%3A%2F%2Fphimhdcss.com%2F";
        var headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": url,
            "Origin": "https://play.streamxemphimhd.site",
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest"
        };
        
        return JSON.stringify({
            url: postUrl,
            isEmbed: true, 
            postBody: postBody,
            headers: headers,
            subtitles: []
        });
        
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function parseCategoriesResponse(htmlContent) {
    try {
        var filters = parseDynamicFilters(htmlContent);
        if (filters.category && filters.category.length > 0) return JSON.stringify(filters.category);

        var categories = [];
        var catPattern = /<a[^>]+href="https:\/\/phimhdcss\.com\/the-loai\/([^"]+)">([^<]+)<\/a>/gi;
        var match;
        while ((match = catPattern.exec(htmlContent)) !== null) {
            var slug = match[1];
            var name = match[2].trim();
            var exists = false;
            for (var i = 0; i < categories.length; i++) {
                if (categories[i].value === slug) { exists = true; break; }
            }
            if (!exists) categories.push({ name: name, value: slug });
        }
        return JSON.stringify(categories);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(htmlContent) {
    try {
        var filters = parseDynamicFilters(htmlContent);
        if (filters.country && filters.country.length > 0) return JSON.stringify(filters.country);

        var countries = [];
        var countryPattern = /<a[^>]+href="https:\/\/phimhdcss\.com\/quoc-gia\/([^"]+)">([^<]+)<\/a>/gi;
        var match;
        while ((match = countryPattern.exec(htmlContent)) !== null) {
            var slug = match[1];
            var name = match[2].trim();
            var exists = false;
            for (var i = 0; i < countries.length; i++) {
                if (countries[i].value === slug) { exists = true; break; }
            }
            if (!exists) countries.push({ name: name, value: slug });
        }
        return JSON.stringify(countries);
    } catch (e) { return "[]"; }
}

function parseYearsResponse(htmlContent) {
    try {
        var filters = parseDynamicFilters(htmlContent);
        if (filters.year && filters.year.length > 0) return JSON.stringify(filters.year);

        var years = [];
        for (var y = 2026; y >= 2000; y--) years.push({ name: y.toString(), value: y.toString() });
        return JSON.stringify(years);
    } catch (e) { return "[]"; }
}
