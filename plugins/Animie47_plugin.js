const BASEURL = "https://anime47.best";
const BASEAPI = "https://anime47.love/api";
const BASEHOST = "https://anime47.alokillgtv.workers.dev/api";
const BASELINK = BASEAPI;

// ===== HÀM CẤU HÌNH MANIFEST =====
function getManifest() {
    try {
        return JSON.stringify({
            id: "anime47",
            name: "Nguồn Anime47",
            description: "Nguồn phim Anime47",
            version: "1.3.2",
            author: "Alokillgtv",
            info: "Nguồn phim Anime của VN.\nNguồn có server riêng nên xem video rất nhanh và mượt.",
            baseUrl: BASEURL,
            iconUrl: "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/anime47.png",
            playerType: "exoplayer",
            layoutType: "HORIZONTAL",
            type: "ANIME",
            isEnabled: true,
            isAdult: false,
            adblock: true,
            subtitleCat: false
        });
    } catch (e) {
        return JSON.stringify({
            id: "loiapp",
            name: "Plugin bị lỗi cài đặt",
            version: "1.0",
            info: "Plugin đang bị lỗi: \n" + e,
            baseUrl: "http://vkey.vn/",
            iconUrl: "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/novahd.png",
            isEnabled: true,
            type: "MOVIE",
            playerType: "exoplayer"
        });
    }
}

// ===== HÀM MENU LIST =====
function getHomeSections() {
    localStorage.clear();
    return JSON.stringify([
        { slug: "/list/dang/specials?lang=vi", title: "Đặc Biệt", type: "Horizontal" },
        { slug: "/list/dang/ova-series?lang=vi", title: "Ova Series", type: "Horizontal" },
        { slug: "/list/dang/movies?lang=vi", title: "Anime Movies", type: "Horizontal" },
        { slug: "/list/dang/tv-series?lang=vi", title: "Anime Bộ", type: "Horizontal" },
        { slug: "/anime/filter?lang=vi&sort=latest", title: "Anime Mới", type: "Grid" },
    ]);
}

function getLISTmenu() {
    try {
        return JSON.stringify([
            { link: "/genres/action/anime?lang=vi", name: "Hành Động" },
            { link: "/genres/adventure/anime?lang=vi", name: "Phiêu Lưu" },
            { link: "/genres/comedy/anime?lang=vi", name: "Hài Hước" },
            { link: "/genres/drama/anime?lang=vi", name: "Tâm Lý" },
            { link: "/genres/fantasy/anime?lang=vi", name: "Huyền Ảo" },
            { link: "/genres/horror/anime?lang=vi", name: "Kinh Dị" },
            { link: "/genres/mystery/anime?lang=vi", name: "Bí Ẩn" },
            { link: "/genres/romance/anime?lang=vi", name: "Tình Cảm" },
            { link: "/genres/scifi/anime?lang=vi", name: "Viễn Tưởng" },
            { link: "/genres/slice-of-slice/anime?lang=vi", name: "Đời Thường" },
            { link: "/genres/sports/anime?lang=vi", name: "Thể Thao" },
            { link: "/genres/supernatural/anime?lang=vi", name: "Siêu Nhiên" }
        ]);
    } catch (e) {
        log("getLISTmenu[err]:\n " + e);
        return JSON.stringify([{ link: "/", name: "Đang lỗi getLISTmenu()" }]);
    }
}

// ===== HÀM TẠO URL =====
function getUrlList(slug, filtersJson) {
    const paramPage = "&page=";
    try {
        if (slug && slug.indexOf("http") > -1) return slug;

        let page = 1;
        let path = slug || "";

        if (filtersJson) {
            const fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                const filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    path = Array.isArray(filters.category) && filters.category.length > 0 
                        ? filters.category[0].slug 
                        : (typeof filters.category === 'string' ? filters.category : path);
                }
            } catch (e) {
                log("getUrlList():\n" + e);
            }
        }

        let resultUrl = BASELINK;
        if (path) resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        if (page > 0 && resultUrl.indexOf("page=") === -1) resultUrl += paramPage + page;
        
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    const paramSearch = "/search/full/?lang=vi&keyword=";
    const paramPage = "&page=";
    try {
        let page = 1;
        if (filtersJson) {
            const fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                const filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (e) {
                log("getUrlList():\n" + e);
            }
        }

        let resultUrl = BASELINK + paramSearch + encodeURIComponent(keyword || "");
        if (page > 1) resultUrl += paramPage + page;

        const finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        return BASEURL;
    }
}

// ===== HÀM TẠO KHỐI LIST PHIM =====
function parseListResponse(html, $url) {
    try {
        const $data = JSON.parse(html);
        const isSearch = $url.indexOf("search") > -1;
        const $list = isSearch ? $data.results : $data.data.posts;
        const items = [];

        $list.forEach(item => {
            const id = `${BASEHOST}/anime/info/${item.id}?lang=vi`;
            const title = item.title;
            const poster = isSearch ? item.image : item.poster;
            const status = item.status 
                ? item.status.replace(/Ongoing/, "Đang Ra").replace(/Completed/, "Hoàn Thành").replace(/Upcoming/, "Sắp Ra") 
                : "";

            if (title.length > 1 && poster.length > 5) {
                items.push({
                    id: id || "",
                    title: title || "",
                    quality: item.type || "",
                    episode_current: `Tập ${item.current_episode}` || "",
                    posterUrl: poster || "",
                    backdropUrl: poster || "",
                    year: item.year || "",
                    lang: status || ""
                });
            }
        });

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 9999 }
        });
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        return JSON.stringify({
            items: [{ id: $url || "error_url", title: `Lỗi: ${e}`, posterUrl: "", backdropUrl: "" }],
            pagination: { currentPage: 1, totalPages: 1 }
        });
    }
}

// ===== HÀM TẠO KHỐI CHI TIẾT PHIM =====
function parseMovieDetail(html, url) {
    log("parseMovieDetail[url]: \n" + url);
    try {
        const $data = JSON.parse(html);
        let extra = "", servers = [], episodes = [], item = $data.data;
        
        let id = url, title = "", posterUrl = "", backdropUrl = "", description = "";
        let quality = "", year = "", rating = "", status = "", category = "";
        let episode_current = "", duration = "", casts = "", director = "r", country = "";

        if (!$data.teams) {
            extra = `${BASEHOST}/anime/${item.id}/episodes?lang=vi`;
            id = `${BASEHOST}/anime/info/${item.id}?lang=vi`;
            posterUrl = item.poster;
            backdropUrl = item.poster;
            title = item.title;
            description = item.description;
            duration = item.duration === "Unknown" ? "" : item.duration;
            status = item.status ? item.status.replace(/Ongoing/, "Đang Ra").replace(/Completed/, "Hoàn Thành").replace(/Upcoming/, "Sắp Ra") : item.status;
            episode_current = `Tập ${item.episodes.total}`;
            year = item.year;
            quality = item.quality;
            rating = item.rating;

            if (item.genres && item.genres.length > 0) {
                category = item.genres.map(box => {
                    const link = box.link ? box.link.replace("the-loai", "genres") + "/anime?lang=vi" : "";
                    return `[${box.name}](${link})`;
                }).join(", ");
            }

            if (item.characters && item.characters.length > 0) {
                casts = item.characters.map(box => {
                    const role = box.role ? box.role.replace("main", "Chính").replace("supporting", "Phụ") : "";
                    return `${box.name} [${role}]`;
                }).join(", ");
            }

            if (item.producers && item.producers.length > 0) {
                director = item.producers.map(box => box.title || "").join(", ");
            }
        } else {
            $data.teams.forEach((box, index) => {
                let currentEpisodes = [];
                if (box.groups) {
                    box.groups.forEach(parent => {
                        if (parent.episodes) {
                            parent.episodes.forEach(child => {
                                currentEpisodes.push({
                                    id: `${BASEHOST}/anime/watch/episode/${child.id}?lang=vi`,
                                    name: `Tập ${child.number}`,
                                    slug: `tap-${child.number}`
                                });
                            });
                        }
                    });
                }
                servers.push({ name: `Server ${index + 1}`, episodes: currentEpisodes });
            });
        }

        return JSON.stringify({
            id, title, posterUrl, backdropUrl, description, quality, year, rating,
            status, category, episode_current, servers, duration, casts, director, country, extra
        });
    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({ id: "error", title: "error", description: `${url}\n${e}`, servers: [] });
    }
}

// ===== HÀM TẠO XỬ LÝ STREAM PHIM =====
function parseDetailResponse(html, url) {
    console.log("parseDetailResponse dang xu ly: " + url);
    try {
        const data = JSON.parse(html);
        const streams = data.streams || [];
        
        // Ưu tiên stream Thuyết minh/Lồng tiếng (bỏ qua Phụ đề)
        const selectedStream = streams.find(s => s.server_name && s.server_name.toLowerCase() !== "phụ đề") || streams[0];
        const streamUrl = selectedStream ? selectedStream.url : "";

        // Lấy phụ đề
        const subtitles = (selectedStream && selectedStream.subtitles) || [];
        const targetLangs = ["Tiếng Việt", "English"];
        const subsObject = [];

        subtitles.forEach(sub => {
            let langUpper = sub.label === "Tiếng Việt" ? "Việt" : (sub.label === "English" ? "ENG" : "");
            if (targetLangs.includes(sub.label)) {
                subsObject.push({
                    url: sub.file,
                    lang: langUpper,
                    mimeType: sub.file.includes(".srt") ? "application/x-subrip" : "text/vtt"
                });
            }
        });

        if (data.id) {
            localStorage.setItem(`subtitles_${data.id}`, JSON.stringify(subsObject));
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
        return JSON.stringify({ url: "", mimeType: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function parseEmbedResponse(html, url) {
    log("parseEmbedResponse [url]: " + url);
    try {
        const customJS = clearJS(rawJS);
        const parts = html.split(/\s+/);
        let targetPath = "";

        for (let item of parts) {
            item = item.trim();
            if (item.startsWith("/m3u8/") || item.startsWith("http")) {
                targetPath = item;
                break;
            }
        }

        const realM3u8Url = targetPath.startsWith("http") ? targetPath : `https://pl.vlogphim.net${targetPath}`;
        let subsObject = [];

        try {
            const urlMatch = url.match(/\/file\/([a-zA-Z0-9]+)/);
            const fileId = urlMatch ? urlMatch[1] : "";
            const savedSubs = (fileId ? localStorage.getItem(`subtitles_${fileId}`) : null) || localStorage.getItem("latest_subtitles");
            
            if (savedSubs) subsObject = JSON.parse(savedSubs);
        } catch (subErr) {
            console.log("[Lỗi đọc subtitles từ localStorage]:", subErr);
        }

        console.log("Link stream HTTP gửi Player:", realM3u8Url);
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
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

// ==== HÀM TẠO CUSTOM SCRIPT ====
function rawJS() {
    function LOG(msg, check) {
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
            window.SnifferBridge.log(msg);
            if (check) window.SnifferBridge.toast(msg, 1000);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log(msg);
        }
    }
    try {
        LOG("Test");
    } catch (e) {
        LOG("Lỗi CUSTOMJS: \n" + e);
    }
}

// ==== HÀM HỖ TRỢ MENU & TIỆN ÍCH ====
function getUrlDetail(slug) {
    try {
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        return `${BASEURL}/${slug}`;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
        return "";
    }
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

function parseCategoriesResponse(apiResponseJson) {
    try { return JSON.stringify(buildMenu(getLISTmenu())); }
    catch (e) { return JSON.stringify([]); }
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function parseSearchResponse(html, url) {
    try { return parseListResponse(html, url); }
    catch (e) { return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } }); }
}

function getPrimaryCategories() {
    try { return JSON.stringify(buildMenu(getLISTmenu())); }
    catch (e) { return JSON.stringify([]); }
}

function getFilterConfig() {
    try { return JSON.stringify({ category: buildMenu(getLISTmenu()) }); }
    catch (e) { return JSON.stringify({ category: [] }); }
}

function sortEpisodesByName(data) {
    try {
        if (Array.isArray(data)) {
            data.forEach(server => {
                if (Array.isArray(server.episodes)) {
                    server.episodes.sort((a, b) => {
                        const matchA = a.name.match(/Tập\s*(\d+)/i);
                        const matchB = b.name.match(/Tập\s*(\d+)/i);
                        return (matchA ? parseInt(matchA[1], 10) : 0) - (matchB ? parseInt(matchB[1], 10) : 0);
                    });
                }
            });
        }
        return data;
    } catch (e) {
        return data;
    }
}

function buildMenu(menuStr, type) {
    const menuArray = JSON.parse(menuStr);
    const menulist = [];
    if (!Array.isArray(menuArray)) return menulist;
    const typeStr = type !== undefined ? String(type).trim() : undefined;

    menuArray.forEach(item => {
        if (!item) return;
        const link = item.link ? String(item.link).trim() : "";
        const name = item.name ? String(item.name).trim() : "";
        if (!link || !name) return;

        if (typeStr === "false") {
            menulist.push({ slug: link, title: name, type: "Horizontal" });
        } else if (typeStr === "true") {
            menulist.push({ slug: link, title: name, type: "Grid" });
        } else {
            menulist.push({ slug: link, name: name });
        }
    });
    return menulist;
}

// ==============================================================
// THƯ VIỆN DOM PARSER (MINIJQ) & UTILITIES
// ==============================================================
function _$(param) {
    function parseHTML(htmlString) {
        let nodes = [];
        let root = { id: 0, tag: "ROOT", attrs: {}, childrenIds: [], parentId: null };
        nodes.push(root);

        try {
            let html = (htmlString || "").trim();
            if (!html) return { root, nodes };

            const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
            let stack = [0];
            let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
            let lastIndex = 0, match, maxIter = 50000, iter = 0;

            while ((match = tagRegex.exec(html)) !== null && iter++ < maxIter) {
                let textBefore = html.slice(lastIndex, match.index).trim();
                let parentId = stack[stack.length - 1];

                if (textBefore) {
                    let textId = nodes.length;
                    nodes.push({ id: textId, tag: "#text", text: textBefore, attrs: {}, childrenIds: [], parentId: parentId });
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
                    let node = { id: nodeId, tag: tagName, attrs: attrs, childrenIds: [], parentId: parentId };
                    nodes.push(node);
                    nodes[parentId].childrenIds.push(nodeId);

                    if (!isSelfClosing) stack.push(nodeId);
                }
            }

            let remainingText = html.slice(lastIndex).trim();
            if (remainingText && stack.length > 0) {
                let parentId = stack[stack.length - 1];
                let textId = nodes.length;
                nodes.push({ id: textId, tag: "#text", text: remainingText, attrs: {}, childrenIds: [], parentId: parentId });
                nodes[parentId].childrenIds.push(textId);
            }
        } catch (err) { }
        return { root, nodes };
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

    function matchSingleSelector(node, sel, nodes) {
        if (!node || node.tag === "#text" || node.tag === "ROOT") return false;
        let cleanSel = sel.replace(/:first|:last|:eq\([0-9]+\)/gi, "").trim();

        let pseudoContentArg = null;
        let contentMatch = cleanSel.match(/:content\((['"]?)(.*?)\1\)/i);
        if (contentMatch) {
            pseudoContentArg = contentMatch[2];
            cleanSel = cleanSel.replace(contentMatch[0], "").trim();
        }

        if (cleanSel && cleanSel !== "*") {
            let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
            if (tagMatch && node.tag !== tagMatch[0].toLowerCase()) return false;

            let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
            if (idMatch && (!node.attrs || node.attrs.id !== idMatch[1])) return false;

            let classMatches = cleanSel.match(/\.([a-zA-Z0-9_\-\/\\:]+)/g);
            if (classMatches) {
                if (!node.attrs || !node.attrs.class) return false;
                let elClasses = node.attrs.class.split(/\s+/);
                for (let c of classMatches) {
                    if (!elClasses.includes(c.substring(1))) return false;
                }
            }

            let attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);
            if (attrMatch) {
                let attrName = attrMatch[1].toLowerCase(), attrVal = attrMatch[2];
                if (!node.attrs || !(attrName in node.attrs)) return false;
                if (attrVal !== undefined && node.attrs[attrName] !== attrVal) return false;
            }
        }

        if (pseudoContentArg !== null) {
            let fullText = getNodeText(node, nodes, 0).toLowerCase();
            if (!pseudoContentArg.split("|").some(kw => fullText.includes(kw.trim().toLowerCase()))) return false;
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
                if (matchSingleSelector(current, selector, nodes)) results.push(current);
            }
            if (current.childrenIds) {
                for (let cid of current.childrenIds) search(cid, depth + 1);
            }
        }
        search(startNode.id, 0);

        if (selector.includes(":first")) return results.slice(0, 1);
        if (selector.includes(":last")) return results.slice(-1);
        let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
        if (eqMatch) return results[parseInt(eqMatch[1], 10)] ? [results[parseInt(eqMatch[1], 10)]] : [];
        return results;
    }

    function querySelectorAll(startNode, selector, nodes) {
        try {
            if (!startNode || !selector) return [];
            if (selector.includes(',')) {
                let resMap = new Map();
                selector.split(',').forEach(gSel => {
                    querySelectorAll(startNode, gSel.trim(), nodes).forEach(r => resMap.set(r.id, r));
                });
                return Array.from(resMap.values());
            }

            let spaceParts = selector.trim().split(/\s+/);
            if (spaceParts.length > 1) {
                let currentNodes = [startNode];
                for (let part of spaceParts) {
                    let nextLevelNodes = [], addedIds = new Set();
                    currentNodes.forEach(cNode => {
                        querySelectorAllSingleLevel(cNode, part, nodes).forEach(r => {
                            if (!addedIds.has(r.id)) { addedIds.add(r.id); nextLevelNodes.push(r); }
                        });
                    });
                    currentNodes = nextLevelNodes;
                    if (currentNodes.length === 0) break;
                }
                return currentNodes;
            }
            return querySelectorAllSingleLevel(startNode, selector, nodes);
        } catch (err) { return []; }
    }

    function MiniJQ(elements, nodesStore) {
        this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
        this.nodes = nodesStore || [];
        this.length = this.elements.length;
    }

    MiniJQ.prototype = {
        find: function(selector) {
            if (this.elements.length === 0) return new MiniJQ([], this.nodes);
            let matched = [], addedIds = new Set();
            this.elements.forEach(el => {
                querySelectorAll(el, selector, this.nodes).forEach(r => {
                    if (!addedIds.has(r.id)) { addedIds.add(r.id); matched.push(r); }
                });
            });
            return new MiniJQ(matched, this.nodes);
        },
        text: function() { return this.elements.length ? getNodeText(this.elements[0], this.nodes, 0) : ""; },
        html: function() {
            if (this.elements.length === 0) return "";
            const self = this;
            const serialize = (nodeId, depth) => {
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
                this.elements.forEach(el => {
                    if (el && el.tag !== "#text") {
                        if (!el.attrs) el.attrs = {};
                        el.attrs[name] = value;
                    }
                });
                return this;
            }
            return (this.elements.length > 0 && this.elements[0].attrs) ? (this.elements[0].attrs[name] || "") : "";
        },
        each: function(callback) {
            if (typeof callback === 'function') {
                this.elements.forEach((el, index) => {
                    let jqEl = new MiniJQ([el], this.nodes);
                    callback.call(jqEl, index, jqEl);
                });
            }
            return this;
        },
        textAll: function(delimiter = " ") { return this.elements.map(el => getNodeText(el, this.nodes, 0)).join(delimiter); },
        first: function() { return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : [], this.nodes); },
        last: function() { return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : [], this.nodes); },
        eq: function(index) { return new MiniJQ(this.elements[index] ? [this.elements[index]] : [], this.nodes); },
        parent: function() {
            let parents = [], addedIds = new Set();
            this.elements.forEach(el => {
                if (el && el.parentId) {
                    let pNode = this.nodes[el.parentId];
                    if (pNode && !addedIds.has(pNode.id)) { addedIds.add(pNode.id); parents.push(pNode); }
                }
            });
            return new MiniJQ(parents, this.nodes);
        },
        next: function() {
            let nexts = [];
            this.elements.forEach(el => {
                if (el && el.parentId !== null) {
                    let pNode = this.nodes[el.parentId];
                    if (pNode) {
                        let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                        let idx = siblings.findIndex(s => s.id === el.id);
                        if (idx !== -1 && idx + 1 < siblings.length) nexts.push(siblings[idx + 1]);
                    }
                }
            });
            return new MiniJQ(nexts, this.nodes);
        }
    };

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

// ==== TIỆN ÍCH CHUỖI & BASE64 ====
function log(msg) { console.log(msg); }

function BASE64DECODE(base64String) {
    try {
        if (!base64String) return "";
        let str = decodeURIComponent(base64String.trim()).replace(/-/g, "+").replace(/_/g, "/");
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let output = [], buffer = 0, bits = 0;

        for (let i = 0; i < str.length; i++) {
            let char = str.charAt(i);
            if (char === "=") break;
            let index = chars.indexOf(char);
            if (index === -1) continue;

            buffer = (buffer << 6) | index;
            bits += 6;
            if (bits >= 8) {
                bits -= 8;
                output.push((buffer >> bits) & 0xff);
            }
        }

        let result = "", j = 0;
        while (j < output.length) {
            let c = output[j++];
            if (c < 128) result += String.fromCharCode(c);
            else if (c > 191 && c < 224) result += String.fromCharCode(((c & 31) << 6) | (output[j++] & 63));
            else if (c > 223 && c < 240) result += String.fromCharCode(((c & 15) << 12) | ((output[j++] & 63) << 6) | (output[j++] & 63));
            else if (c >= 240) {
                let u = (((c & 7) << 18) | ((output[j++] & 63) << 12) | ((output[j++] & 63) << 6) | (output[j++] & 63)) - 0x10000;
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
        let utf8Bytes = [];
        for (let i = 0; i < str.length; i++) {
            let code = str.charCodeAt(i);
            if (code < 128) utf8Bytes.push(code);
            else if (code < 2048) utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
            else if ((code & 0xfc00) === 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
                code = 0x10000 + ((code & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                utf8Bytes.push((code >> 18) | 240, ((code >> 12) & 63) | 128, ((code >> 6) & 63) | 128, (code & 63) | 128);
            } else {
                utf8Bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
            }
        }

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let encoded = "";
        for (let j = 0; j < utf8Bytes.length; j += 3) {
            let byte1 = utf8Bytes[j];
            let byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
            let byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;

            let b1 = byte1 >> 2;
            let b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
            let b3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
            let b4 = isNaN(byte3) ? 64 : byte3 & 63;

            encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
        }
        return encoded;
    } catch (e) {
        console.log("[BASE64ENCODE Error]:", e.message || e);
        return "";
    }
}

function checkRaw(scriptStr, returnFixed) {
    try {
        if (!scriptStr || typeof scriptStr !== "string") return scriptStr || "";
        
        const lines = scriptStr.split("\n");
        const fixedLines = [];

        lines.forEach(currentLine => {
            let fixedLine = currentLine;
            if (returnFixed) {
                fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, " "); 
            }
            fixedLines.push(fixedLine);
        });

        return returnFixed ? fixedLines.join("\n") : scriptStr;
    } catch (e) {
        return scriptStr;
    }
}

function decodeHTMLtext(str) {
    try {
        if (!str) return "";
        return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            return String.fromCharCode(parseInt(dec || hex, dec ? 10 : 16));
        });
    } catch (e) {
        return str;
    }
}

function clearJS(func) {
    if (typeof func !== "function") return "";
    const match = func.toString().match(/\{([\s\S]*)\}/);
    return match ? checkRaw(match[1].trim(), true) : "";
}
