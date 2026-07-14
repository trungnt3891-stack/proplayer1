// =============================================================================
// NJAV PLUGIN - https://www.njav.com
// Video URL: /en/xvideos/<slug>   (NO trailing slash)
// List URL:  /en/<category>/?page=N  (trailing slash required on categories)
// =============================================================================

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "njav",
        "name": "NJAV",
        "version": "1.0.3",
        "baseUrl": "https://www.njav.com",
        "referrer": "https://www.njav.com/",
        "iconUrl": "https://www.njav.com/favicon.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "subtitleCat": false
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'en/new-release/', title: 'Mới Phát Hành', type: 'Horizontal', path: '' },
        { slug: 'en/recent-update/', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: 'en/censored/', title: 'Có Che (Censored)', type: 'Horizontal', path: '' },
        { slug: 'en/uncensored/', title: 'Không Che (Uncensored)', type: 'Horizontal', path: '' },
        { slug: 'en/uncensored-leaked/', title: 'Không Che Rò Rỉ', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới phát hành', slug: 'en/new-release/' },
        { name: 'Mới cập nhật', slug: 'en/recent-update/' },
        { name: 'Có che (Censored)', slug: 'en/censored/' },
        { name: 'Không che (Uncensored)', slug: 'en/uncensored/' },
        { name: 'Không che rò rỉ', slug: 'en/uncensored-leaked/' },
        { name: 'Nghiệp dư (Amateur)', slug: 'en/amateur/' },
        { name: 'Chinese AV', slug: 'en/chinese-av/' },
        { name: 'Phụ đề tiếng Anh', slug: 'en/english-subtitle/' },
        { name: 'Thể loại', slug: 'en/genre/' },
        { name: 'Diễn viên', slug: 'en/actor/' },
        { name: 'Nhà sản xuất', slug: 'en/make/' },
        { name: 'Loạt phim (Series)', slug: 'en/series/' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mặc định', value: '' },
            { name: 'Mới nhất', value: 'new' },
            { name: 'Hôm nay', value: 'today' },
            { name: 'Tuần này', value: 'week' },
            { name: 'Tháng này', value: 'month' }
        ],
        category: [
            { name: "Mới phát hành", value: "en/new-release/" },
            { name: "Mới cập nhật", value: "en/recent-update/" },
            { name: "Có che (Censored)", value: "en/censored/" },
            { name: "Không che (Uncensored)", value: "en/uncensored/" },
            { name: "Không che rò rỉ", value: "en/uncensored-leaked/" },
            { name: "Nghiệp dư", value: "en/amateur/" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://www.njav.com";

    var path = (slug || "en/new-release/").trim();

    // Remove leading slash
    if (path.charAt(0) === '/') {
        path = path.substring(1);
    }

    // Ensure en/ prefix
    if (path.indexOf("en/") !== 0) {
        path = "en/" + path;
    }

    // Ensure trailing slash (NJAV requires trailing slash on category pages)
    if (path.charAt(path.length - 1) !== '/') {
        path = path + '/';
    }

    var url = baseUrl + '/' + path;

    // Append page param only if page > 1
    if (page > 1) {
        url += '?page=' + page;
    }

    // Append sort
    if (filters.sort && filters.sort !== '') {
        url += (url.indexOf('?') !== -1 ? '&' : '?') + 'sort=' + filters.sort;
    }

    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var url = "https://www.njav.com/en/search/?keyword=" + encodeURIComponent(keyword);
    if (page > 1) {
        url += "&page=" + page;
    }
    return url;
}

function getUrlDetail(slug) {
    // slug can be:
    //   full URL  : https://www.njav.com/en/xvideos/abc-123
    //   relative  : en/xvideos/abc-123
    //   just id   : abc-123
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    if (slug.indexOf("/") === 0) return "https://www.njav.com" + slug;
    if (slug.indexOf("en/xvideos/") === 0) return "https://www.njav.com/" + slug;
    if (slug.indexOf("xvideos/") === 0) return "https://www.njav.com/en/" + slug;
    return "https://www.njav.com/en/xvideos/" + slug;
}

function getUrlCategories() { return "https://www.njav.com/en/genre/"; }
function getUrlCountries()  { return ""; }
function getUrlYears()      { return ""; }

if (typeof globalThis !== 'undefined') {
    globalThis.getManifest         = getManifest;
    globalThis.getHomeSections     = getHomeSections;
    globalThis.getPrimaryCategories= getPrimaryCategories;
    globalThis.getFilterConfig     = getFilterConfig;
    globalThis.getUrlList          = getUrlList;
    globalThis.getUrlSearch        = getUrlSearch;
    globalThis.getUrlDetail        = getUrlDetail;
    globalThis.getUrlCategories    = getUrlCategories;
    globalThis.getUrlCountries     = getUrlCountries;
    globalThis.getUrlYears         = getUrlYears;
}

// =============================================================================
// UTILITY
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    },
    getMeta: function (html, property) {
        var r1 = new RegExp('(?:property|name)=["\']' + property + '["\'][^>]*content=(["\'])(.*?)\\1', 'i');
        var r2 = new RegExp('content=(["\'])(.*?)\\1[^>]*(?:property|name)=["\']' + property + '["\']', 'i');
        var m = html.match(r1) || html.match(r2);
        return m ? m[2] : "";
    }
};

// =============================================================================
// PARSERS
// =============================================================================

// SKIP_SEGMENTS: path segments that are not video slugs
var SKIP_SEGMENTS = {
    'tags': true, 'genre': true, 'actor': true, 'make': true, 'series': true,
    'recent-update': true, 'new-release': true, 'censored': true, 'uncensored': true,
    'uncensored-leaked': true, 'amateur': true, 'chinese-av': true, 'chinese-live': true,
    'korean-live': true, 'english-subtitle': true, 'contact': true, 'terms': true,
    'abuse': true, '2257': true, 'site': true, 'user': true, 'search': true,
    'type': true, 'xvideos': true, 'en': true, 'ja': true, 'ko': true, 'zh': true,
    'tw': true, 'vi': true, 'id': true, 'th': true, 'de': true, 'fr': true
};

function parseListResponse(html) {
    var movies = [];
    
    // DEBUG ITEM TO VIEW ON ANDROID UI
    movies.push({
        id: "debug-info",
        title: "DBG: Len=" + (html ? html.length : 0) + " | HTML=" + (html ? html.substring(0, 400).replace(/</g, '[').replace(/>/g, ']') : "null"),
        posterUrl: "",
        backdropUrl: "",
        description: "Debug info",
        year: 0,
        quality: "DEBUG",
        episode_current: "DBG",
        lang: "DBG"
    });

    // Tách các card phim bằng cách chia nhỏ HTML
    var splitPatterns = [
        'class="card"',
        'class="thumbnail"',
        'class="box"',
        'class="video-card"',
        'class="movie-card"',
        'class="video-item"',
        'class="col-6 col-sm-4 col-md-3"'
    ];

    var parts = [];
    var patternUsed = "";
    for (var p = 0; p < splitPatterns.length; p++) {
        var tempParts = html.split(splitPatterns[p]);
        if (tempParts.length > parts.length) {
            parts = tempParts;
            patternUsed = splitPatterns[p];
        }
    }

    // Nếu không tách được bằng class, thử tách bằng href="/en/xvideos/ hoặc href="https://www.njav.com/en/xvideos/
    if (parts.length <= 1) {
        parts = html.split(/href=["'](?:https?:\/\/www\.njav\.com)?\/en\/xvideos\//i);
    }

    var seenSlugs = {};

    for (var i = 1; i < parts.length; i++) {
        var cardHtml = parts[i];

        // Tìm link video trong cardHtml này
        var linkMatch = cardHtml.match(/href=["']([^"']*(?:\/en\/xvideos\/|\/xvideos\/)([a-zA-Z0-9\-\_]+))["']/i);
        
        // Nếu dùng split bằng href ở trên thì fallback lấy từ phần đầu của cardHtml
        var slug = "";
        if (linkMatch) {
            slug = linkMatch[2].toLowerCase();
        } else {
            // Khi split bằng href="/en/xvideos/ thì slug nằm ở ngay đầu chuỗi cardHtml trước dấu nháy tiếp theo
            var slugMatch = cardHtml.match(/^([a-zA-Z0-9\-\_]+)["']/);
            if (slugMatch) {
                slug = slugMatch[1].toLowerCase();
            }
        }

        if (!slug || SKIP_SEGMENTS[slug]) continue;

        var videoId = "en/xvideos/" + slug;
        if (seenSlugs[videoId]) continue;
        seenSlugs[videoId] = true;

        // ---- Extract Title ----
        var title = "";

        // 1. title="" attribute trong khối cardHtml này
        var titleAttrMatch = cardHtml.match(/title=["']([^"']{3,300})["']/i);
        if (titleAttrMatch) title = PluginUtils.cleanText(titleAttrMatch[1]);

        // 2. img alt attribute
        if (!title) {
            var altMatch = cardHtml.match(/<img[^>]+alt=["']([^"']{3,300})["']/i);
            if (altMatch) title = PluginUtils.cleanText(altMatch[1]);
        }

        // 3. Text content của thẻ a chứa slug này
        if (!title) {
            var escapedSlug = slug.replace(/([-_])/g, '\\$1');
            var anchorTextRx = new RegExp('(?:href=["\'][^"\']*' + escapedSlug + '[^>]*>|>)([\\s\\S]{2,300}?)<\/a>', 'i');
            var anchorTextMatch = cardHtml.match(anchorTextRx);
            if (anchorTextMatch) title = PluginUtils.cleanText(anchorTextMatch[1]);
        }

        // 4. Nhãn heading gần nhất
        if (!title || title.length < 2) {
            var hMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]{2,300}?)<\/h[2-5]>/i);
            if (hMatch) title = PluginUtils.cleanText(hMatch[1]);
        }

        // 5. Fallback từ slug
        if (!title || title.length < 2) {
            title = slug.replace(/-/g, ' ').replace(/\b[a-z]/g, function(c) { return c.toUpperCase(); });
        }

        // ---- Extract Poster ----
        var poster = "";
        var imgMatch = cardHtml.match(/<img[^>]+(?:data-src|data-lazy-src|data-original|data-bg|src)=["']([^"']+)["']/i);
        if (imgMatch) {
            poster = imgMatch[1];
            if (poster.indexOf("//") === 0) poster = "https:" + poster;
        }

        // ---- Extract Duration ----
        var duration = "";
        var durMatch = cardHtml.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
        if (durMatch) duration = durMatch[1];

        // ---- Detect quality ----
        var qualityLabel = "HD";
        if (slug.indexOf("uncensored-leak") !== -1) {
            qualityLabel = "UNCENSORED";
        } else if (slug.indexOf("fc2") !== -1 || slug.indexOf("heyzo") !== -1) {
            qualityLabel = "FC2";
        }

        // ---- Extract JAV code ----
        var code = "";
        var codeMatch = title.match(/([A-Z]{2,8}-\d{3,5})/i) || slug.match(/([a-z]{2,8}-\d{3,5})/i);
        if (codeMatch) code = codeMatch[1].toUpperCase();

        movies.push({
            id: videoId,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: duration ? "Thời lượng: " + duration : "",
            year: 0,
            quality: qualityLabel,
            episode_current: duration || "Full",
            lang: code || "NJAV"
        });
    }

    // ---- Pagination ----
    var currentPage = 1;
    var totalPages  = 1;

    var activePageM = html.match(/class="[^"]*(?:active|current)[^"]*"[^>]*>\s*(\d+)\s*<\/(?:a|span|li)>/i);
    if (activePageM) currentPage = parseInt(activePageM[1]);

    var pageMatches = html.match(/[?&]page=(\d+)/g);
    if (pageMatches) {
        for (var pi = 0; pi < pageMatches.length; pi++) {
            var pn = parseInt(pageMatches[pi].match(/\d+/)[0]);
            if (pn > totalPages) totalPages = pn;
        }
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: Math.max(totalPages, currentPage),
            totalItems: movies.length,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(htmlContent, pageUrl) {
    try {
        var title = PluginUtils.getMeta(htmlContent, "og:title") || "";
        var thumb = PluginUtils.getMeta(htmlContent, "og:image") || "";
        var desc  = PluginUtils.getMeta(htmlContent, "og:description") || "";

        // Helper: extract text from <dt>Label</dt><dd>...</dd>
        var getField = function(label) {
            var rx = new RegExp('<dt[^>]*>\\s*' + label + '\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>', 'i');
            var m = htmlContent.match(rx);
            return m ? PluginUtils.cleanText(m[1]) : "";
        };

        // Helper: extract comma-separated names from <a> links in a <dd>
        var getLinksField = function(label) {
            var rx = new RegExp('<dt[^>]*>\\s*' + label + '\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>', 'i');
            var m = htmlContent.match(rx);
            if (!m) return "";
            var linksHtml = m[1];
            var items = [];
            var lr = /<a[^>]+href="[^"]+"[^>]*>([^<]+)<\/a>/gi;
            var lm;
            while ((lm = lr.exec(linksHtml)) !== null) {
                var t = PluginUtils.cleanText(lm[1]);
                if (t) items.push(t);
            }
            return items.length > 0 ? items.join(", ") : PluginUtils.cleanText(linksHtml);
        };

        // Helper: extract actors/genres from page anchor links
        var extractFromLinks = function(pathSeg) {
            var rx = new RegExp('href=["\'](?:https?:\\/\\/www\\.njav\\.com)?\\/en\\/xvideos\\/' + pathSeg + '\\/([^"\']+)["\'][^>]*>([^<]+)<\\/a>', 'gi');
            var items = [];
            var seen = {};
            var m;
            while ((m = rx.exec(htmlContent)) !== null) {
                var t = PluginUtils.cleanText(m[2]);
                if (t && !seen[t]) { seen[t] = true; items.push(t); }
            }
            return items.join(", ");
        };

        var releaseDate = getField("Release date") || getField("Release") || getField("Released");
        var studio      = getField("Maker")  || getField("Studio") || getField("Label");
        var director    = getField("Director");
        var casts       = getLinksField("Actresses") || getLinksField("Actress") || extractFromLinks("actor");
        var genres      = getLinksField("Genres")    || getLinksField("Genre")   || extractFromLinks("genre");
        var series      = getField("Series") || extractFromLinks("series");

        var year = 0;
        if (releaseDate) {
            var yr = parseInt(releaseDate.substring(0, 4));
            if (yr > 1900) year = yr;
        }

        // Extract video numeric ID from petite-vue v-scope attribute
        // NJAV markup: <div id="page-video" v-scope="VideoPage({id: 12345, ...})">
        var videoId = "";

        var vScopeMatch = htmlContent.match(/id=["']page-video["'][^>]*v-scope=["']([^"']+)["']/i)
                       || htmlContent.match(/id=["']player["'][^>]*v-scope=["']([^"']+)["']/i)
                       || htmlContent.match(/v-scope=["']VideoPage\s*\(\s*\{([^}]+)\}/i);

        if (vScopeMatch) {
            var vScope  = vScopeMatch[1];
            var idMatch = vScope.match(/\bid\s*:\s*(\d+)/) || vScope.match(/"id"\s*:\s*(\d+)/);
            if (idMatch) videoId = idMatch[1];
        }

        // Fallback: VideoPage({id: NNN}) anywhere
        if (!videoId) {
            var vpMatch = htmlContent.match(/VideoPage\s*\(\s*\{[^}]*\bid\s*:\s*(\d+)/i);
            if (vpMatch) videoId = vpMatch[1];
        }

        // Fallback: data-id attribute
        if (!videoId) {
            var dataIdMatch = htmlContent.match(/data-id=["'](\d+)["']/i);
            if (dataIdMatch) videoId = dataIdMatch[1];
        }

        // Extract slug from canonical URL
        var slug = "";
        var canonicalM = htmlContent.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\/www\.njav\.com\/[a-z]+\/xvideos\/([^"'\/]+)["']/i);
        if (canonicalM) slug = canonicalM[1];

        // Build server list
        var servers = [];
        if (videoId) {
            var ajaxUrl = "https://www.njav.com/en/ajax/v/" + videoId + "/videos";
            servers.push({
                name: "NJAV HD",
                episodes: [{
                    id: ajaxUrl,
                    name: "Xem Phim",
                    slug: "njav-hd"
                }]
            });
        }

        // Fallback: iframe src
        if (servers.length === 0) {
            var iframeM = htmlContent.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeM) {
                servers.push({
                    name: "Embed",
                    episodes: [{ id: iframeM[1], name: "Embed", slug: "embed" }]
                });
            }
        }

        var statusLine = "";
        if (studio)      statusLine += "Studio: " + studio;
        if (releaseDate) statusLine += (statusLine ? " | " : "") + "Release: " + releaseDate;
        if (series)      statusLine += (statusLine ? " | " : "") + "Series: " + series;

        return JSON.stringify({
            id: slug || videoId || "",
            title: PluginUtils.cleanText(title),
            posterUrl: thumb,
            backdropUrl: thumb,
            description: PluginUtils.cleanText(desc),
            year: year,
            rating: 0,
            quality: "HD",
            servers: servers,
            episode_current: servers.length > 0 ? "Full" : "No Source",
            lang: "NJAV",
            category: genres,
            country: "Japan",
            director: director,
            casts: casts,
            status: statusLine
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(htmlContent, pageUrl) {
    var streamUrl = "";

    // Case 1: JSON response from AJAX endpoint
    // NJAV AJAX returns array: [{src:"...", label:"1080p"}, ...]
    try {
        var parsed = JSON.parse(htmlContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Prefer highest quality
            var best = parsed[0];
            for (var j = 0; j < parsed.length; j++) {
                var lbl = (parsed[j].label || "").toString();
                if (lbl.indexOf('1080') !== -1 || lbl.indexOf('720') !== -1) {
                    best = parsed[j];
                    break;
                }
            }
            streamUrl = best.src || best.url || "";
        } else if (parsed && parsed.url) {
            streamUrl = parsed.url;
        } else if (parsed && parsed.data && parsed.data.url) {
            streamUrl = parsed.data.url;
        }
    } catch (e) {
        // Not JSON
    }

    // Case 2: Extract "src":"..." from raw JSON string
    if (!streamUrl) {
        var srcRx = /"src"\s*:\s*"(https?:[^"]+)"/i;
        var srcM  = htmlContent.match(srcRx);
        if (srcM) streamUrl = srcM[1].replace(/\\\//g, '/');
    }

    // Case 3: v-scope attribute containing m3u8
    if (!streamUrl) {
        var vScopeM2 = htmlContent.match(/v-scope=["']([^"']+)["']/i);
        if (vScopeM2) {
            var decoded = vScopeM2[1]
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&amp;/g, '&');
            var m3uRx = /["'](https:[^"']+?(?:playlist|index)\.m3u8[^"']*)["']/;
            var m3uM  = decoded.match(m3uRx);
            if (m3uM) streamUrl = m3uM[1].replace(/\\\//g, '/');
        }
    }

    // Case 4: Any .m3u8 in response
    if (!streamUrl) {
        var m3u8M = htmlContent.match(/(https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*)/i);
        if (m3u8M) streamUrl = m3u8M[1].replace(/\\\//g, '/');
    }

    if (streamUrl) {
        return JSON.stringify({
            url: streamUrl,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.njav.com/",
                "Origin": "https://www.njav.com"
            },
            subtitles: []
        });
    }

    // Fallback: return pageUrl as embed
    return JSON.stringify({
        url: pageUrl || "",
        isEmbed: true,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.njav.com/"
        },
        subtitles: []
    });
}

function parseCategoriesResponse(html) {
    var categories = [];
    var seen = {};

    // Extract genre links from /en/genre/<name> or /en/xvideos/genre/<name>
    var rx = /href=["'](?:https?:\/\/www\.njav\.com)?\/en\/(?:xvideos\/)?genre\/([^"'\/\?]+)["'][^>]*>([^<]+)<\/a>/gi;
    var match;
    while ((match = rx.exec(html)) !== null) {
        var genreSlug = decodeURIComponent(match[1]).trim();
        var name      = PluginUtils.cleanText(match[2]);
        if (!name || name.length < 2) continue;

        // Clean post counts like (120) or 120
        name = name.replace(/\s*\(\d+\)\s*$/, '') // remove (120)
                   .replace(/\s*\d+\s*$/, '')     // remove 120
                   .trim();

        var id = "en/genre/" + genreSlug;
        if (!seen[id]) {
            categories.push({ name: name, slug: id });
            seen[id] = true;
        }
    }

    return JSON.stringify(categories);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html)     { return "[]"; }

if (typeof globalThis !== 'undefined') {
    globalThis.parseListResponse       = parseListResponse;
    globalThis.parseSearchResponse     = parseSearchResponse;
    globalThis.parseMovieDetail        = parseMovieDetail;
    globalThis.parseDetailResponse     = parseDetailResponse;
    globalThis.parseCategoriesResponse = parseCategoriesResponse;
    globalThis.parseCountriesResponse  = parseCountriesResponse;
    globalThis.parseYearsResponse      = parseYearsResponse;
}
