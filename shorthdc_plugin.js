// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================
var BASEURL = "https://phimhdcss.com";

function getManifest() {
    return JSON.stringify({
        "id": "phimhdcs",
        "name": "PhimHDCS",
        "version": "1.1.5", // Đã fix lỗi không load được ảnh bìa và chi tiết phim
        "baseUrl": BASEURL,
        "iconUrl": BASEURL + "/favicon.ico",
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

            return BASEURL + "/?" + params.join("&");
        }

        var path = "";
        if (slug === 'phim-de-cu') {
            path = "/danh-sach/bang-xep-hang";
        } else if (slug === 'bang-xep-hang' || slug === 'top-phim-ngay' || slug === 'phim-chieu-rap' || slug === 'phim-moi') {
            path = "/danh-sach/" + slug;
        } else {
            path = "/the-loai/" + slug;
        }

        var url = BASEURL + path;
        if (page > 1) {
            url += "?page=" + page;
        }

        return url;
    } catch (e) {
        return BASEURL + "/danh-sach/phim-moi";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = BASEURL + "/?search=" + encodeURIComponent(keyword).replace(/%20/g, "+");
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    var path = slug.startsWith("/") ? slug.substring(1) : slug;
    return BASEURL + "/" + path;
}

function getUrlCategories() { return BASEURL + "/the-loai"; }
function getUrlCountries() { return BASEURL + "/quoc-gia"; }
function getUrlYears() { return BASEURL + "/nam"; }

// =============================================================================
// HTML PARSERS (ĐÃ SỬA: SỬ DỤNG DOM _$ ĐỂ KHÔNG BỊ LỖI KHI XUỐNG DÒNG)
// =============================================================================

function parseDynamicFilters(html) {
    var result = {};
    try {
        var parseSelect = function (namePattern) {
            var list = [];
            _$(html).find('select[name="' + namePattern + '"]').find('option').each(function() {
                var val = this.attr('value');
                var name = this.text().trim();
                if (val && name) list.push({ name: name, value: val });
            });
            return list;
        };

        result.category = parseSelect('filter[category]');
        result.country = parseSelect('filter[region]');
        result.language = parseSelect('filter[language]');
        result.year = parseSelect('filter[year]');
        result.sort = parseSelect('filter[sort]');
        result.type = parseSelect('filter[type]');
    } catch (e) { }
    return result;
}

function parseListResponse(htmlContent) {
    try {
        var movies = [];
        
        // Quét cấu trúc DOM an toàn thay vì dùng Regex thô
        _$(htmlContent).find("li.item").each(function() {
            var aTag = this.find("a").eq(0);
            if (!aTag.elements.length) return;
            
            var href = aTag.attr("href");
            var title = aTag.attr("title") || this.find(".name").find("a").text();
            var imgTag = aTag.find("img");
            var src = imgTag.attr("src") || imgTag.attr("data-src") || "";
            var label = this.find(".label").text().trim();

            if (href && title && src) {
                if (href.indexOf("http") === -1) href = BASEURL + (href.startsWith("/") ? "" : "/") + href;
                if (src.indexOf("http") === -1) src = BASEURL + (src.startsWith("/") ? "" : "/") + src;

                var cleanThumb = src.replace(/&amp;/g, '&');
                
                var year = 0;
                var yearMatch = /(\d{4})/.exec(title);
                if (yearMatch) year = parseInt(yearMatch[1]);
                
                var episode_current = "";
                var epMatch = /(Tập \d+|Hoàn [tT]ất \(\d+\/\d+\)|Hoàn Tất \(\d+\/\d+\)|Full)/i.exec(label);
                if (epMatch) episode_current = epMatch[1];
                
                var lang = label.replace(episode_current, "").trim();
                if (lang.indexOf("+") === 0) lang = lang.substring(1).trim();

                movies.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": label.indexOf("HD") > -1 ? "HD" : (label.indexOf("Full") > -1 ? "Full" : ""),
                    "episode_current": episode_current || label,
                    "lang": lang,
                    "year": year
                });
            }
        });

        var totalPages = 1;
        var pageRegex = /page=(\d+)"/gi;
        var pMatch;
        while ((pMatch = pageRegex.exec(htmlContent)) !== null) {
            var pNum = parseInt(pMatch[1]);
            if (pNum > totalPages) totalPages = pNum;
        }

        var currentPage = 1;
        var currentMatch = htmlContent.match(/class="current"[^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1]);

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
        var title = _$(htmlContent).find("h1").text() || _$(htmlContent).find('meta[property="og:title"]').attr("content") || "";
        title = title.replace(/Phim /gi, "").trim();

        var originalTitle = _$(htmlContent).find(".real-name").text().trim();

        var posterUrl = _$(htmlContent).find('meta[property="og:image"]').attr("content") || "";
        if (!posterUrl) {
            var posterMatch = /<img\s+itemprop="image"\s+src="([^"]+)"/i.exec(htmlContent);
            if (posterMatch) posterUrl = posterMatch[1];
        }
        if (posterUrl && posterUrl.indexOf('http') === -1) posterUrl = BASEURL + (posterUrl.startsWith('/') ? '' : '/') + posterUrl;

        var description = _$(htmlContent).find(".tab").text() || _$(htmlContent).find('meta[property="og:description"]').attr("content") || "";
        description = description.replace(/<[^>]*>/g, "").trim();

        var director = _$(htmlContent).find("dt:content('Đạo diễn')").next().text().trim();
        var duration = _$(htmlContent).find("dt:content('Thời lượng')").next().text().trim();
        var totalEpisodes = _$(htmlContent).find("dt:content('Số tập')").next().text().trim();
        var statusInfo = _$(htmlContent).find("dt:content('Tình trạng')").next().text().trim();
        var language = _$(htmlContent).find("dt:content('Ngôn ngữ')").next().text().trim();
        var prodYear = _$(htmlContent).find("dt:content('Năm sản xuất')").next().text().trim();
        var country = _$(htmlContent).find("dt:content('Quốc gia')").next().text().trim();
        var category = _$(htmlContent).find("dt:content('Thể loại')").next().text().trim();

        var year = parseInt(prodYear) || 2026;
        if (!year && originalTitle) {
            var yearMatch = /(\d{4})/.exec(originalTitle);
            if (yearMatch) year = parseInt(yearMatch[1]);
        }

        var rating = 0;
        var ratingMatch = htmlContent.match(/ratingValue[^>]*>([^<]+)</i);
        if (ratingMatch) rating = parseFloat(ratingMatch[1]);

        var episode_current = statusInfo;
        var statusMatch = htmlContent.match(/class="film-status"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
        if (statusMatch) episode_current = statusMatch[1].trim();

        var servers = [];
        var serverPattern = /<div[^>]*class="server-episode-block"[^>]*>[\s\S]*?Danh sách\s*(?:Sever)?\s*([^:]+):[\s\S]*?<div[^>]*class="list-episode[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
        var match;

        while ((match = serverPattern.exec(htmlContent)) !== null) {
            var serverName = match[1].trim()
                .replace(/^Server\s+/i, '')
                .replace(/^z/i, '')
                .replace(/\s*#\d+$/, '')
                .trim();

            var episodesHtml = match[2];
            var episodes = [];
            
            // Tìm tất cả các thẻ <a> bên trong danh sách tập
            var epPattern = /<a\s+href="([^"]+)"[^>]*title="([^"]+)"/gi;
            var epMatch;
            while ((epMatch = epPattern.exec(episodesHtml)) !== null) {
                var epUrl = epMatch[1];
                if (epUrl.indexOf('http') !== 0) epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;

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
        var btnPlayMatch = htmlContent.match(/class="btn-see[^"]*"\s+href="([^"]+)"/i);
        if (btnPlayMatch) extraUrl = btnPlayMatch[1];
        if (extraUrl && extraUrl.indexOf('http') !== 0) extraUrl = BASEURL + (extraUrl.startsWith('/') ? '' : '/') + extraUrl;

        var fullDesc = description;
        if (duration) fullDesc += "\nThời lượng: " + duration;
        if (totalEpisodes) fullDesc += "\nSố tập: " + totalEpisodes;
        if (statusInfo) fullDesc += "\nTình trạng: " + statusInfo;

        return JSON.stringify({
            id: url || BASEURL,
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
            category: category,
            country: country,
            director: director,
            casts: "",
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

        var makeResult = function (playerUrl) {
            return JSON.stringify({
                url: playerUrl,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": BASEURL + "/"
                },
                subtitles: []
            });
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
                    log('PHIMHDCS_DEBUG Found realObj in JS code successfully');
                }
            } catch (e) {
                log('PHIMHDCS_DEBUG realObj parse error: ' + e);
            }
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
                        log('PHIMHDCS_DEBUG Found fallback _0xData successfully');
                    }
                } catch (e) {
                    log('PHIMHDCS_DEBUG _0xData parse error: ' + e);
                }
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
                log('PHIMHDCS_DEBUG decoding targetId=' + targetId + ', chunks=' + chunks.length + ', salt=' + saltString);
                var playerUrl = decodeChunksWithSalt(chunks, saltString);
                log('PHIMHDCS_DEBUG decoded playerUrl: ' + playerUrl);

                if (playerUrl && playerUrl.indexOf("player.php?") !== -1) {
                    var matchLink = /[?&](?:link|url)=([^&]+)/.exec(playerUrl);
                    if (matchLink) {
                        var decodedLink = decodeURIComponent(matchLink[1]);
                        log('PHIMHDCS_DEBUG extracted direct link from player.php: ' + decodedLink);
                        playerUrl = decodedLink;
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
                                "Referer": BASEURL + "/"
                            },
                            subtitles: []
                        });
                    } else {
                        return JSON.stringify({
                            url: playerUrl,
                            isEmbed: true,
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                "Referer": BASEURL + "/"
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
                if (matchLink) {
                    var decodedLink = decodeURIComponent(matchLink[1]);
                    log('PHIMHDCS_DEBUG extracted direct link from player.php in iframe: ' + decodedLink);
                    embedUrl = decodedLink;
                }
            }

            if (embedUrl && embedUrl !== pageUrl && embedUrl.length > 5) {
                var isDirect = embedUrl.indexOf('.m3u8') !== -1 || embedUrl.indexOf('.mp4') !== -1;
                return JSON.stringify({
                    url: embedUrl,
                    isEmbed: !isDirect,
                    mimeType: isDirect ? "application/x-mpegURL" : undefined,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": BASEURL + "/"
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
        log("parseEmbedResponse input url: " + url);
        
        if (url.indexOf("do=getVideo") !== -1 || (htmlContent.indexOf("securedLink") !== -1 && htmlContent.indexOf("hls") !== -1)) {
            log("parseEmbedResponse processing getVideo JSON response");
            var jData = JSON.parse(htmlContent);
            var streamUrl = "";
            if (jData.securedLink) {
                streamUrl = jData.securedLink;
            } else if (jData.videoSource) {
                streamUrl = jData.videoSource;
            } else if (jData.videoSources && jData.videoSources.length > 0) {
                streamUrl = jData.videoSources[0].file;
            }
            
            var subtitles = [];
            var subMatch = /[?&]subs=([^&]+)/.exec(url);
            if (subMatch) {
                try {
                    subtitles = JSON.parse(decodeURIComponent(subMatch[1]));
                } catch(e) {
                    log("parseEmbedResponse parse subs query parameter error: " + e);
                }
            }
            
            if (streamUrl) {
                log("parseEmbedResponse found streamUrl: " + streamUrl);
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
                log("parseEmbedResponse no streamUrl found in JSON");
                return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
            }
        }

        log("parseEmbedResponse processing HTML embed page");
        
        var embedId = null;
        var idMatch = /\/video\/([a-zA-Z0-9]+)/.exec(url);
        if (idMatch) {
            embedId = idMatch[1];
        }
        
        var subtitles = [];
        var match = htmlContent.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]+?split\('\|'\),0,\{\}\))\)/);
        if (match) {
            var innerCode = match[1];
            try {
                var unpacked = eval("(" + innerCode + ")");
                log("parseEmbedResponse unpacked packer successfully");
                
                var firePlayerIdMatch = /FirePlayer\(\s*["']([^"']+)["']/.exec(unpacked);
                if (firePlayerIdMatch) {
                    embedId = firePlayerIdMatch[1];
                }
                
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
                    log("parseEmbedResponse found subtitles: " + subtitles.length);
                }
            } catch (e) {
                log("parseEmbedResponse eval packer error: " + e);
            }
        }
        
        if (!embedId) {
            log("parseEmbedResponse cannot find embedId, aborting");
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
        
        log("parseEmbedResponse returning POST request to getVideo API");
        return JSON.stringify({
            url: postUrl,
            isEmbed: true, 
            postBody: postBody,
            headers: headers,
            subtitles: []
        });
        
    } catch (e) {
        log("parseEmbedResponse error: " + e);
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

// =============================================================================
// THƯ VIỆN DOM ẢO CHUYÊN DỤNG (_$) - KHÔI PHỤC ĐỂ ĐẢM BẢO KHÔNG LỖI HTML
// =============================================================================
function _$(htmlOrBlock){if (htmlOrBlock&&typeof htmlOrBlock==='object'&&htmlOrBlock.elements){return htmlOrBlock;}var instance={sourceHtml:typeof htmlOrBlock==='string'?htmlOrBlock:'',elements:Array.isArray(htmlOrBlock)?htmlOrBlock:(htmlOrBlock?[htmlOrBlock]:[]),find:function(selector){var results=[];var contentFilter="";if (selector.indexOf(":content(")!==-1){var contentMatch=selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);if (contentMatch){contentFilter=contentMatch[1]||contentMatch[2]||contentMatch[3]||"";selector=selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,"");}}var attrNameFilter="";var attrValueFilter="";var hasAttrFilter=false;var attrMatch=selector.match(/\[([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);if (attrMatch){hasAttrFilter=true;attrNameFilter=attrMatch[1];attrValueFilter=attrMatch[2]||attrMatch[3]||attrMatch[4]||"";selector=selector.replace(/\[.*?\]/,"");}var notSelector="";if (selector.indexOf(":not(")!==-1){var notMatch=selector.match(/:not\(([^)]+)\)/);if (notMatch){notSelector=notMatch[1];selector=selector.replace(/:not\([^)]+\)/,"");}}var isFirstFilter=selector.indexOf(":first")!==-1;var isLastFilter=selector.indexOf(":last")!==-1;selector=selector.replace(/:first|:last/g,"");var isClass=selector.indexOf('.')===0;var isId=selector.indexOf('#')===0;var isAttrOnly=(selector===""&&hasAttrFilter);var targetClasses=[];var targetId="";var targetTagName="";if (isClass){targetClasses=selector.split('.').filter(function(c){return c.length > 0;});}else if (isId){targetId=selector.substring(1);}else if (!isAttrOnly){targetTagName=selector.toLowerCase();}for (var i=0;i < this.elements.length;i++){var currentHtml=this.elements[i];var pos=0;var subResults=[];while ((pos=currentHtml.indexOf('<',pos))!==-1){if (currentHtml.charAt(pos+1)==='/'||currentHtml.charAt(pos+1)==='!'){pos++;continue;}var endOpenTag=currentHtml.indexOf('>',pos);if (endOpenTag===-1)break;var fullOpenTag=currentHtml.substring(pos,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName="";if (spacePos===-1){currentTagName=fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase();}else{currentTagName=fullOpenTag.substring(1,spacePos).toLowerCase();}var isMatched=false;if (isClass){var classMatchStr="";var classPos=fullOpenTag.indexOf('class="');if (classPos!==-1){var startQuote=classPos+7;classMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));}else{classPos=fullOpenTag.indexOf("class='");if (classPos!==-1){var startQuote=classPos+7;classMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}}if (classMatchStr){var currentClasses=classMatchStr.split(/\s+/);var matchCount=0;for (var c=0;c < targetClasses.length;c++){if (currentClasses.indexOf(targetClasses[c])!==-1)matchCount++;}if (matchCount===targetClasses.length)isMatched=true;}}else if (isId){var idMatchStr="";var idPos=fullOpenTag.indexOf('id="');if (idPos!==-1){var startQuote=idPos+4;idMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf('"',startQuote));}else{idPos=fullOpenTag.indexOf("id='");if (idPos!==-1){var startQuote=idPos+4;idMatchStr=fullOpenTag.substring(startQuote,fullOpenTag.indexOf("'",startQuote));}}if (idMatchStr===targetId)isMatched=true;}else if (isAttrOnly){isMatched=true;}else{if (currentTagName===targetTagName)isMatched=true;}if (isMatched&&hasAttrFilter){var searchStr1=attrNameFilter+'="'+attrValueFilter+'"';var searchStr2=attrNameFilter+"='"+attrValueFilter+"'";if (fullOpenTag.indexOf(searchStr1)===-1&&fullOpenTag.indexOf(searchStr2)===-1){isMatched=false;}}if (isMatched){var startTagPos=pos;var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var scanPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&scanPos < currentHtml.length){var nextOpen=currentHtml.indexOf(openStr,scanPos);var nextClose=currentHtml.indexOf(closeStr,scanPos);if (nextClose===-1){scanPos=currentHtml.length;break;}if (nextOpen!==-1&&nextOpen < nextClose){depth++;scanPos=nextOpen+openStr.length;}else{depth--;scanPos=nextClose+closeStr.length;if (depth===0)endTagPos=nextClose+closeStr.length;}}}var foundBlock=currentHtml.substring(startTagPos,endTagPos);if (contentFilter){var pureText=foundBlock.replace(/<[^>]+>/g,"").trim();if (pureText.indexOf(contentFilter)===-1){pos=endTagPos;continue;}}if (notSelector){var isNotClass=notSelector.indexOf('.')===0;var isNotId=notSelector.indexOf('#')===0;var notValue=notSelector.substring(1);var hasNot=false;if (isNotClass&&fullOpenTag.indexOf('class="')!==-1&&fullOpenTag.indexOf(notValue)!==-1)hasNot=true;if (isNotId&&fullOpenTag.indexOf('id="')!==-1&&fullOpenTag.indexOf(notValue)!==-1)hasNot=true;if (!hasNot)subResults.push(foundBlock);}else{subResults.push(foundBlock);}pos=endTagPos;}else{pos++;}}if (isFirstFilter&&subResults.length > 0)subResults=[subResults[0]];if (isLastFilter&&subResults.length > 0)subResults=[subResults[subResults.length-1]];results=results.concat(subResults);}var newInstance=_$(results);newInstance.sourceHtml=this.sourceHtml||currentHtml;return newInstance;},each:function(callback){for (var i=0;i < this.elements.length;i++){var childInstance=_$(this.elements[i]);childInstance.sourceHtml=this.sourceHtml;callback.call(childInstance,i,this.elements[i]);}return this;},eq:function(index){if (index < 0)index=this.elements.length+index;var matchedElement=this.elements[index];this.elements=matchedElement?[matchedElement]:[];return this;},attr:function(attrName){if (this.elements.length===0)return "";var elem=this.elements[0];var searchStr=attrName+'="';var pos=elem.indexOf(searchStr);if (pos===-1){searchStr=attrName+"='";pos=elem.indexOf(searchStr);}if (pos===-1)return "";var start=pos+searchStr.length;var quoteType=elem.charAt(start-1);var end=elem.indexOf(quoteType,start);return end===-1?"":elem.substring(start,end);},html:function(){if (this.elements.length===0)return "";var elem=this.elements[0];var start=elem.indexOf('>')+1;var end=elem.lastIndexOf('</');if (start > 0&&end > start)return elem.substring(start,end);return "";},text:function(){if (this.elements.length===0)return "";var elem=this.elements[0];var start=elem.indexOf('>')+1;var end=elem.lastIndexOf('</');if (start > 0&&end > start){var content=elem.substring(start,end);return content.replace(/<\/?[^>]+(>|$)/g,"").trim();}return "";},next:function(){var results=[];if (!this.sourceHtml)return this;for (var i=0;i < this.elements.length;i++){var elem=this.elements[i];var idx=this.sourceHtml.indexOf(elem);if (idx===-1)continue;var scanPos=idx+elem.length;var nextOpen=this.sourceHtml.indexOf('<',scanPos);if (nextOpen!==-1){if (this.sourceHtml.charAt(nextOpen+1)==='/') continue;var endOpenTag=this.sourceHtml.indexOf('>',nextOpen);if (endOpenTag===-1)continue;var fullOpenTag=this.sourceHtml.substring(nextOpen,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName=(spacePos===-1)?fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase():fullOpenTag.substring(1,spacePos).toLowerCase();var startTagPos=nextOpen;var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var sPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&sPos < this.sourceHtml.length){var nOpen=this.sourceHtml.indexOf(openStr,sPos);var nClose=this.sourceHtml.indexOf(closeStr,sPos);if (nClose===-1)break;if (nOpen!==-1&&nOpen < nClose){depth++;sPos=nOpen+openStr.length;}else{depth--;sPos=nClose+closeStr.length;if (depth===0)endTagPos=nClose+closeStr.length;}}}results.push(this.sourceHtml.substring(startTagPos,endTagPos));}}var nextInstance=_$(results);nextInstance.sourceHtml=this.sourceHtml;this.elements=results;return this;},parent:function(){var results=[];if (!this.sourceHtml)return this;for (var i=0;i < this.elements.length;i++){var elem=this.elements[i];var idx=this.sourceHtml.indexOf(elem);if (idx <=0)continue;var scanPos=idx-1;while (scanPos >=0){var openTagPos=this.sourceHtml.lastIndexOf('<',scanPos);if (openTagPos===-1)break;if (this.sourceHtml.charAt(openTagPos+1)!=='/'&&this.sourceHtml.charAt(openTagPos+1)!=='!'){var endOpenTag=this.sourceHtml.indexOf('>',openTagPos);if (endOpenTag!==-1&&endOpenTag > openTagPos){var fullOpenTag=this.sourceHtml.substring(openTagPos,endOpenTag+1);var spacePos=fullOpenTag.indexOf(' ');var currentTagName=(spacePos===-1)?fullOpenTag.substring(1,fullOpenTag.length-1).toLowerCase():fullOpenTag.substring(1,spacePos).toLowerCase();var endTagPos=endOpenTag+1;var selfClosingTags=['img','source','input','br','hr','link','meta'];if (selfClosingTags.indexOf(currentTagName)===-1&&fullOpenTag.indexOf('/>')===-1){var depth=1;var sPos=endOpenTag+1;var openStr='<'+currentTagName;var closeStr='</'+currentTagName+'>';while (depth > 0&&sPos < this.sourceHtml.length){var nOpen=this.sourceHtml.indexOf(openStr,sPos);var nClose=this.sourceHtml.indexOf(closeStr,sPos);if (nClose===-1)break;if (nOpen!==-1&&nOpen < nClose){depth++;sPos=nOpen+openStr.length;}else{depth--;sPos=nClose+closeStr.length;if (depth===0)endTagPos=nClose+closeStr.length;}}}if (endTagPos >=idx+elem.length){var parentBlock=this.sourceHtml.substring(openTagPos,endTagPos);if (results.indexOf(parentBlock)===-1)results.push(parentBlock);break;}}}scanPos=openTagPos-1;}}var parentInstance=_$(results);parentInstance.sourceHtml=this.sourceHtml;this.elements=results;return this;}};return instance;};
