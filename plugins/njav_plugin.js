// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "njav",
        "name": "NJAV",
        "version": "1.0.0",
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
        { slug: 'en/new-release', title: 'Mới Cập Nhật', type: 'Horizontal', path: '' },
        { slug: 'en/trending', title: 'Xem Nhiều / Xu Hướng', type: 'Horizontal', path: '' },
        { slug: 'en/censored', title: 'Phim Có Che (Censored)', type: 'Horizontal', path: '' },
        { slug: 'en/uncensored', title: 'Không Che (Uncensored)', type: 'Horizontal', path: '' },
        { slug: 'en/uncensored-leaked', title: 'Không Che Rò Rỉ', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'en/new-release' },
        { name: 'Thịnh hành', slug: 'en/trending' },
        { name: 'Có che (Censored)', slug: 'en/censored' },
        { name: 'Không che (Uncensored)', slug: 'en/uncensored' },
        { name: 'Không che rò rỉ', slug: 'en/uncensored-leaked' },
        { name: 'Thể loại', slug: 'en/genres' },
        { name: 'Diễn viên', slug: 'en/actresses' },
        { name: 'Nhà sản xuất', slug: 'en/makers' },
        { name: 'Loạt phim (Series)', slug: 'en/series' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới nhất', value: 'new' },
            { name: 'Hôm nay', value: 'today' },
            { name: 'Tuần này', value: 'week' },
            { name: 'Tháng này', value: 'month' }
        ],
        category: [
            { name: "Tất cả thể loại", value: "en/genres" },
            { name: "Có che (Censored)", value: "en/censored" },
            { name: "Không che (Uncensored)", value: "en/uncensored" },
            { name: "Không che rò rỉ", value: "en/uncensored-leaked" },
            { name: "Nữ diễn viên", value: "en/actresses" },
            { name: "Nhà sản xuất", value: "en/makers" },
            { name: "Loạt phim (Series)", value: "en/series" }
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
    
    var path = slug || "en/new-release";
    if (path === "en/new" || path === "/en/new") {
        path = "en/new-release";
    }
    
    // Ensure path has en/ prefix
    if (path.indexOf("en/") !== 0 && path.indexOf("/en/") !== 0) {
        if (path.indexOf("/") === 0) path = "en" + path;
        else path = "en/" + path;
    }
    
    if (path.indexOf("/") !== 0) path = "/" + path;
    
    // Ensure trailing slash (only if there is no query param already in the path)
    if (path.indexOf("?") === -1 && path.substring(path.length - 1) !== "/") {
        path += "/";
    }
    
    var url = baseUrl + path;
    
    // If slug is a specific page query
    if (url.indexOf("?") !== -1) {
        url += "&page=" + page;
    } else {
        url += "?page=" + page;
    }
    
    // Add sorting filter
    if (filters.sort && filters.sort !== 'new') {
        url += "&sort=" + filters.sort;
    }
    
    return url;
}

// Ensure global functions are accessible in the QuickJS environment
if (typeof globalThis !== 'undefined') {
    globalThis.getManifest = getManifest;
    globalThis.getHomeSections = getHomeSections;
    globalThis.getPrimaryCategories = getPrimaryCategories;
    globalThis.getFilterConfig = getFilterConfig;
    globalThis.getUrlList = getUrlList;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://www.njav.com/en/search?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    if (slug.indexOf("en/v/") === 0) return "https://www.njav.com/" + slug;
    if (slug.indexOf("/en/v/") === 0) return "https://www.njav.com" + slug;
    if (slug.indexOf("v/") === 0) return "https://www.njav.com/en/" + slug;
    if (slug.indexOf("/v/") === 0) return "https://www.njav.com/en" + slug;
    return "https://www.njav.com/en/v/" + slug;
}

function getUrlCategories() { return "https://www.njav.com/en/genres"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
    },
    getMeta: function (html, property) {
        var regex1 = new RegExp('(?:property|name)=["\']' + property + '["\'][^>]*content=(["\'])(.*?)\\1', 'i');
        var regex2 = new RegExp('content=(["\'])(.*?)\\1[^>]*(?:property|name)=["\']' + property + '["\']', 'i');
        var match = html.match(regex1) || html.match(regex2);
        return match ? match[2] : "";
    }
};

function parseListResponse(html) {
    var movies = [];
    
    // Check if it's the Actresses list page
    var actressLinkMatch = html.match(/href="[^"]*\/actresses\/[^"]+"/g);
    var isActressesPage = (actressLinkMatch && actressLinkMatch.length > 8 && html.indexOf('Actresses') !== -1);
    
    // Check if it's the Genres list page
    var isAllGenresPage = (html.indexOf('/genres/') !== -1 && html.indexOf('Genres') !== -1 && html.indexOf('title="Genres"') === -1);
    
    if (isActressesPage) {
        var actressRegex = /<a[^>]+href="([^"]*\/actresses\/([^"\/ \?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
        var foundActresses = {};
        var match;
        
        while ((match = actressRegex.exec(html)) !== null) {
            var url = match[1];
            var actressSlug = match[2];
            var name = PluginUtils.cleanText(match[3]);
            if (!name || name.length < 2 || name.match(/^\d+/) || name.indexOf('.') !== -1) continue;
            
            var slug = "en/actresses/" + actressSlug;
            if (!foundActresses[slug]) {
                movies.push({
                    id: slug,
                    title: name,
                    posterUrl: "",
                    backdropUrl: "",
                    description: "Nữ diễn viên",
                    year: 0,
                    quality: "ACTRESS",
                    episode_current: "",
                    lang: ""
                });
                foundActresses[slug] = true;
            }
        }
    } else if (isAllGenresPage) {
        var genreRegex = /<a[^>]+href="([^"]*\/genres\/([^"\/ \?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
        var foundGenres = {};
        var match;
        
        while ((match = genreRegex.exec(html)) !== null) {
            var url = match[1];
            var genreSlug = match[2];
            var name = PluginUtils.cleanText(match[3]).replace(/\d+,\d+|\d+/g, '').trim(); // Remove post count
            if (!name || name.length < 2) continue;
            
            var slug = "en/genres/" + genreSlug;
            if (!foundGenres[slug]) {
                movies.push({
                    id: slug,
                    title: name,
                    posterUrl: "",
                    backdropUrl: "",
                    description: "Thể loại",
                    year: 0,
                    quality: "CAT",
                    episode_current: "",
                    lang: ""
                });
                foundGenres[slug] = true;
            }
        }
    } else {
        // Find standard movie list
        // Strategy: try different class splits to support various layout types
        var splitPatterns = [
            'class="card"',
            'class="thumbnail"',
            'class="box"',
            'class="featured"',
            'class="video-card"',
            'class="movie-card"',
            'class="video-item"',
            'class="featured-video"'
        ];
        
        var bestParts = [];
        var bestPattern = "";
        
        for (var p = 0; p < splitPatterns.length; p++) {
            var tempParts = html.split(splitPatterns[p]);
            if (tempParts.length > bestParts.length) {
                bestParts = tempParts;
                bestPattern = splitPatterns[p];
            }
        }
        
        // If still no cards, try splitting by <a> tags that look like video links
        if (bestParts.length <= 1) {
            bestParts = html.split('<a href="');
        }
        
        var seenSlugs = {};
        for (var i = 1; i < bestParts.length; i++) {
            var cardHtml = bestParts[i];
            
            // Match watch link: /v/abc-123 or /en/v/abc-123 or /watch/abc-123
            var linkMatch = cardHtml.match(/href="([^"]*(?:\/v\/|\/watch\/)([^"\/ \?]+))"/i) || 
                            cardHtml.match(/href='([^']*(?:\/v\/|\/watch\/)([^'\/ \?]+))'/i);
            if (!linkMatch) continue;
            
            var rawUrl = linkMatch[1];
            var videoSlug = linkMatch[2];
            if (videoSlug.indexOf('item.') !== -1 || videoSlug.indexOf('{{') !== -1) continue;
            
            var slug = "en/v/" + videoSlug;
            if (seenSlugs[slug]) continue;
            seenSlugs[slug] = true;
            
            var title = "";
            // Extract title: look inside heading or img tags or generic text
            var titleMatch = cardHtml.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i) ||
                             cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\//i) ||
                             cardHtml.match(/class='[^']*title[^']*'[^>]*>([\s\S]*?)<\//i);
            if (titleMatch) {
                title = PluginUtils.cleanText(titleMatch[1]);
            } else {
                var altMatch = cardHtml.match(/<img[^>]+alt="([^"]+)"/i) ||
                               cardHtml.match(/<img[^>]+title="([^"]+)"/i);
                if (altMatch) title = PluginUtils.cleanText(altMatch[1]);
            }
            if (!title || title.length < 2) title = videoSlug;
            
            // Extract poster image
            var imgMatch = cardHtml.match(/<img[^>]+(?:src|data-src)="([^"]+)"/i) ||
                           cardHtml.match(/<img[^>]+(?:src|data-src)='([^']+)'/i);
            var poster = imgMatch ? imgMatch[1] : "";
            if (poster && poster.indexOf("//") === 0) poster = "https:" + poster;
            
            // Extract duration
            var durMatch = cardHtml.match(/class="(?:duration|featured__dur|card__dur|dur)"[^>]*>([^<]+)/i) ||
                           cardHtml.match(/>\s*(\d+:\d+(?::\d+)?)\s*</);
            var duration = durMatch ? PluginUtils.cleanText(durMatch[1]) : "";
            
            // Extract Code / ID (e.g. SNIS-123 or ABC-123)
            var code = "";
            var codeMatch = title.match(/[A-Z0-9]+-[0-9]+/i) || videoSlug.match(/[A-Z0-9]+-[0-9]+/i);
            if (codeMatch) code = codeMatch[0].toUpperCase();
            
            movies.push({
                id: slug,
                title: title,
                posterUrl: poster,
                backdropUrl: poster,
                description: duration ? "Thời lượng: " + duration : "",
                year: 0,
                quality: "HD",
                episode_current: duration || "Full",
                lang: code || "NJAV"
            });
        }
    }
    
    // Pagination parse
    var currentPage = 1;
    var totalPages = 1;
    
    var activePageMatch = html.match(/class="[^"]*(?:active|current)[^"]*"[^>]*>(\d+)<\/span>/i) || 
                          html.match(/class="[^"]*(?:active|current)[^"]*"[^>]*>(\d+)<\/a>/i);
    if (activePageMatch) currentPage = parseInt(activePageMatch[1]);
    
    var pageLinks = html.match(/page=(\d+)/g);
    if (pageLinks) {
        for (var p = 0; p < pageLinks.length; p++) {
            var num = parseInt(pageLinks[p].match(/\d+/)[0]);
            if (num > totalPages) totalPages = num;
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
        var desc = PluginUtils.getMeta(htmlContent, "og:description") || "";
        
        var getField = function(label) {
            var regex = new RegExp("<dt>\\s*" + label + "\\s*<\\/dt>\\s*<dd>([\\s\\S]*?)<\\/dd>", "i");
            var match = htmlContent.match(regex);
            if (match) {
                return PluginUtils.cleanText(match[1].replace(/<[^>]+>/g, ""));
            }
            return "";
        };
        
        var getLinksField = function(label) {
            var regex = new RegExp("<dt>\\s*" + label + "\\s*<\\/dt>\\s*<dd>([\\s\\S]*?)<\\/dd>", "i");
            var match = htmlContent.match(regex);
            if (match) {
                var linksHtml = match[1];
                var items = [];
                var linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
                var lm;
                while ((lm = linkRegex.exec(linksHtml)) !== null) {
                    var text = PluginUtils.cleanText(lm[2]);
                    if (text) items.push(text);
                }
                if (items.length > 0) return items.join(", ");
                return PluginUtils.cleanText(linksHtml.replace(/<[^>]+>/g, ""));
            }
            return "";
        };
        
                // Extract metadata fields
        var releaseDate = getField("Release date") || getField("Release") || getField("Ngày phát hành");
        var studio = getField("Maker") || getField("Studio") || getField("Nhà sản xuất");
        var director = getField("Director") || getField("Giám đốc");
        var casts = getLinksField("Actresses") || getLinksField("Actress") || getLinksField("Diễn viên") || getLinksField("Nữ diễn viên");
        var genres = getLinksField("Genres") || getLinksField("Genre") || getLinksField("Thể loại");
        
        var year = 0;
        if (releaseDate) {
            var yr = parseInt(releaseDate.substring(0, 4));
            if (yr) year = yr;
        }
        
        var statusLine = "";
        if (studio) statusLine += "Studio: " + studio;
        if (releaseDate) statusLine += (statusLine ? " | " : "") + "Released: " + releaseDate;
        
        // Extract video ID from Petite-Vue v-scope inside page-video
        var videoId = "";
        var pageVideoMatch = htmlContent.match(/id=["']page-video["'][^>]*v-scope=["']([^"']+)["']/i) ||
                             htmlContent.match(/id=["']player["'][^>]*v-scope=["']([^"']+)["']/i) ||
                             htmlContent.match(/v-scope=["']([^"']+)["']/i);
        if (pageVideoMatch) {
            var vScope = pageVideoMatch[1];
            var idMatch = vScope.match(/id\s*:\s*(\d+)/) || vScope.match(/id\s*:\s*["']?(\d+)["']?/);
            if (idMatch) {
                videoId = idMatch[1];
            }
        }
        
        // Fallback: look globally in HTML content
        if (!videoId) {
            var globalIdMatch = htmlContent.match(/id\s*:\s*(\d+)/) || htmlContent.match(/"id"\s*:\s*(\d+)/);
            if (globalIdMatch) {
                videoId = globalIdMatch[1];
            }
        }
        
        var servers = [];
        if (videoId) {
            var ajaxUrl = "https://www.njav.com/en/ajax/v/" + videoId + "/videos";
            servers.push({
                name: "NJAV Play",
                episodes: [{
                    id: ajaxUrl,
                    name: "Server HD",
                    slug: "server-hd"
                }]
            });
        }
        
        // Final fallback: look for iframe embeds
        if (servers.length === 0) {
            var iframeMatch = htmlContent.match(/<iframe[^>]+src="([^"]+)"/i);
            if (iframeMatch) {
                servers.push({
                    name: "NJAV Embed",
                    episodes: [{
                        id: iframeMatch[1],
                        name: "Server Embed",
                        slug: "server-embed"
                    }]
                });
            }
        }
        
        var slug = "";
        var canonicalMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.njav\.com\/[^"\/]+\/v\/([^"]+)"/i) ||
                             htmlContent.match(/\/v\/([^"\/ \?]+)/);
        if (canonicalMatch) slug = canonicalMatch[1];
        
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
    
    // Case 1: JSON response
    try {
        var parsed = JSON.parse(htmlContent);
        if (parsed && parsed.url) {
            streamUrl = parsed.url;
        } else if (parsed && parsed.data && parsed.data.url) {
            streamUrl = parsed.data.url;
        }
    } catch (e) {
        // Not a standard JSON, or parsing failed.
    }
    
    // Case 2: Manual regex extraction from JSON string
    if (!streamUrl) {
        var urlIdx = htmlContent.indexOf('"url"');
        if (urlIdx !== -1) {
            var start = htmlContent.indexOf('"', urlIdx + 5);
            if (start !== -1) {
                var end = htmlContent.indexOf('"', start + 1);
                if (end !== -1) {
                    streamUrl = htmlContent.substring(start + 1, end).replace(/\\/g, '');
                }
            }
        }
    }
    
    // Case 3: Petite-Vue v-scope within HTML player div
    if (!streamUrl) {
        var playerMatch = htmlContent.match(/id=["']player["'][^>]*v-scope=["']([^"']+)["']/i) || 
                          htmlContent.match(/v-scope=["']([^"']+)["']/i);
        if (playerMatch) {
            var decoded = playerMatch[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
            var streamMatch = decoded.match(/['"](https:[^'"]+?playlist\.m3u8[^'"]*)['"]/) ||
                              decoded.match(/(https:[^'"\s]+?playlist\.m3u8[^\s'"]*)/);
            if (streamMatch) {
                streamUrl = streamMatch[1].replace(/\\/g, '');
            }
        }
    }
    
    // Case 4: Any .m3u8 link in the response
    if (!streamUrl) {
        var m3u8Match = htmlContent.match(/(https?:[^\s"'><]+?\.m3u8[^\s"'><]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, '');
        }
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
    
    // Fallback: If everything else fails, return the pageUrl as is, marked as an Embed
    return JSON.stringify({
        url: pageUrl,
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
    categories.push({ name: "Tất cả thể loại", slug: "en/genres" });
    
    var genreRegex = /<a[^>]+href="([^"]*\/genres\/([^"\/ \?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
    var seen = {};
    var match;
    
    while ((match = genreRegex.exec(html)) !== null) {
        var genreSlug = match[2];
        var name = PluginUtils.cleanText(match[3]).replace(/\d+,\d+|\d+/g, '').trim();
        if (!name || name.length < 2) continue;
        
        var slug = "en/genres/" + genreSlug;
        if (!seen[slug]) {
            categories.push({ name: name, slug: slug });
            seen[slug] = true;
        }
    }
    return JSON.stringify(categories);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// Ensure global functions are accessible in the QuickJS environment
if (typeof globalThis !== 'undefined') {
    globalThis.getUrlSearch = getUrlSearch;
    globalThis.getUrlDetail = getUrlDetail;
    globalThis.getUrlCategories = getUrlCategories;
    globalThis.getUrlCountries = getUrlCountries;
    globalThis.getUrlYears = getUrlYears;
    globalThis.parseListResponse = parseListResponse;
    globalThis.parseSearchResponse = parseSearchResponse;
    globalThis.parseMovieDetail = parseMovieDetail;
    globalThis.parseDetailResponse = parseDetailResponse;
    globalThis.parseCategoriesResponse = parseCategoriesResponse;
    globalThis.parseCountriesResponse = parseCountriesResponse;
    globalThis.parseYearsResponse = parseYearsResponse;
}
