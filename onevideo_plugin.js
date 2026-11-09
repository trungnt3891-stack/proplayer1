// =============================================================================
// VAAPP Plugin: ONE 一个 (直连官方接口 · 自动获取游客 Token · 完整版 MP4)
// =============================================================================

var APP_KEY = "l*bv%Ziq000Biaog";
var APP_IV = "8597506002939249";
var SIGN_SALT = "m4n2hjPeYWkD6tFpqKF^3HO^h24P@idT";
var APP_VERSION = "1.6.0"; // 关键：<= 2.0.0 旧版协议无需登录即可在 video_download 下发完整 MP4
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

var SEED_HOSTS = [
    "https://api.2b37894.com",
    "https://api.35a46dd.com",
    "https://api.43b8477.com",
    "https://api.5ce3771.com",
    "https://api.61c76a0.com",
    "https://api.632d809.com",
    "https://api.3459381.com",
    "https://api.em1oifd0.com",
    "https://api.j7y675.com"
];

var PLAIN_HOSTS = [
    "https://imgpw807.s7n7ue8.com",
    "https://imgpw807.2u7qzt7.com",
    "https://img807.hkq57tt.com"
];
var ENC_HOSTS = ["gdliren123.com", "u3wwetf.com", "m6qzbb4.com", "bdsy56.com", "gzjsqx.com", "k8b3rsp.com"];
var BAD_HOSTS = ["imgsu807.hkq57tt.com"];

var SES_KEY = "one_vaapp_session_v2";
var S = null;

// =============================================================================
// NHÓM 1: CẤU HÌNH (Config & Metadata) - 严格遵循 VAAPP Manifest 规范
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "one_video",
        "name": "ONE 一个",
        "description": "ONE 一个 · 影视类内容（直连官方接口，游客 token 自动获取）",
        "version": "2.2.0",
        "author": "YG / VAAPP",
        "baseUrl": "https://api.2b37894.com",
        "iconUrl": "https://wsrv.nl/?url=https://img807.hkq57tt.com/favicon.ico",
        "isEnabled": true,
        "isAdult": true,
        "adblock": true,
        "type": "MOVIE",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer",
        "subtitleCat": false,
        "debug": false
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "newest", "title": "最新视频", "type": "Horizontal" },
        { "slug": "hot", "title": "热门视频", "type": "Horizontal" },
        { "slug": "part_jp", "title": "日本分区", "type": "Horizontal" },
        { "slug": "part_cn", "title": "国产分区", "type": "Horizontal" },
        { "slug": "part_us", "title": "欧美分区", "type": "Horizontal" },
        { "slug": "part_live", "title": "ONE 直播合集", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "最新视频", "slug": "newest" },
        { "name": "热门视频", "slug": "hot" },
        { "name": "日本", "slug": "part_jp" },
        { "name": "国产", "slug": "part_cn" },
        { "name": "欧美", "slug": "part_us" },
        { "name": "ONE 直播", "slug": "part_live" },
        { "name": "今日推荐", "slug": "day" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        "category": [
            { "name": "最新视频", "slug": "newest" },
            { "name": "热门视频", "slug": "hot" },
            { "name": "日本", "slug": "part_jp" },
            { "name": "国产", "slug": "part_cn" },
            { "name": "欧美", "slug": "part_us" },
            { "name": "ONE 直播", "slug": "part_live" }
        ]
    });
}

// =============================================================================
// NHÓM 2: SINH URL (使用 |data: 传递内部查询参数)
// =============================================================================

function getDummyUrl() {
    loadSession();
    return (S && S.host ? S.host : SEED_HOSTS[0]) + "/v2.5/bootstrap";
}

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "newest";

        if (filtersJson) {
            var fixedJson = String(filtersJson).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page, 10) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug || path;
                    } else if (typeof filters.category === "string" && filters.category !== "") {
                        path = filters.category;
                    }
                }
            } catch (e) {}
        }

        var payload = encodeURIComponent(JSON.stringify({ kind: path, page: page }));
        return getDummyUrl() + "|data:" + payload;
    } catch (e) {
        return getDummyUrl() + "|data:" + encodeURIComponent(JSON.stringify({ kind: "newest", page: 1 }));
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            var fixedJson = String(filtersJson).replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page, 10) || 1;
            } catch (e) {}
        }
        var payload = encodeURIComponent(JSON.stringify({ kind: "search", keyword: keyword || "", page: page }));
        return getDummyUrl() + "|data:" + payload;
    } catch (e) {
        return getDummyUrl() + "|data:" + encodeURIComponent(JSON.stringify({ kind: "search", keyword: keyword || "", page: 1 }));
    }
}

function getUrlDetail(slug, datasend) {
    var cleanSlug = String(slug || "").split("|")[0];
    if (/^https?:\/\/.*\.(mp4|m3u8)(\?|$)/i.test(cleanSlug)) {
        return cleanSlug;
    }
    var pipeData = datasend || getPipeData(slug) || cleanSlug;
    return getDummyUrl() + "|data:" + pipeData;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// NHÓM 3: PARSERS (列表、搜索、详情与播放源解析)
// =============================================================================

function getPipeData(rawUrl) {
    if (!rawUrl) return "";
    var i = String(rawUrl).indexOf("|");
    if (i < 0) return "";
    var s = String(rawUrl).substring(i + 1).replace(/^\s+/, "");
    if (s.toLowerCase().indexOf("data:") === 0) {
        s = s.substring(5);
    }
    return s;
}

function parseListResponse(html, apiUrl, datasend) {
    try {
        bootstrap(false);
        var rawData = datasend || getPipeData(apiUrl);
        var params = { kind: "newest", page: 1 };
        if (rawData) {
            try {
                params = JSON.parse(decodeURIComponent(rawData));
            } catch (e) {}
        }

        var kind = params.kind || "newest";
        var page = Math.max(1, parseInt(params.page, 10) || 1);
        var items = [];

        if (kind === "search") {
            items = fetchSearchItems(params.keyword, page);
        } else if (kind === "day") {
            items = fetchDayItems(page);
        } else if (kind === "hot") {
            items = fetchHotItems(page);
        } else if (kind === "part_live") {
            items = fetchLiveItems(page);
        } else if (kind.indexOf("part_") === 0) {
            var partId = kind.replace("part_", "");
            items = fetchPartitionItems(partId, page);
        } else {
            items = fetchNewestItems(page);
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": page,
                "totalPages": 200
            }
        });
    } catch (e) {
        console.log("parseListResponse[err]: " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, apiUrl, datasend) {
    return parseListResponse(html, apiUrl, datasend);
}

function parseMovieDetail(html, apiUrl, datasend) {
    try {
        bootstrap(false);
        var rawId = datasend || getPipeData(apiUrl) || apiUrl;
        var id = String(rawId).replace(/^one:\/\/a\//, "").split("|")[0].replace(/\/.*$/, "").trim();

        var a = callApi("article/detail", { id: id });
        if (!a) throw new Error("未返回详情: " + id);

        var cover = bestImage(a);
        var liveInfo = stripLiveTag(clean(pick(a.title, a.video_name, "ONE #" + id)));
        var title = liveInfo.title;

        // 拼接标签 Markdown 链接
        var tagArr = [];
        var rawTags = (a.tag_list && a.tag_list.length) ? a.tag_list : (a.tags || []);
        for (var ti = 0; ti < rawTags.length; ti++) {
            var tt = rawTags[ti];
            var nm = typeof tt === "string" ? tt : (tt && (tt.slug || tt.name || tt.title || tt.tag_name)) || "";
            nm = clean(nm);
            if (nm && tagArr.indexOf(nm) < 0) {
                tagArr.push(nm);
            }
        }

        var servers = [];
        // 如果是多场次直播回放合集
        if (a.collection_list && a.collection_list.length > 0) {
            var eps = [];
            for (var ei = 0; ei < a.collection_list.length; ei++) {
                var ep = a.collection_list[ei];
                var epTitle = clean(pick(ep.video_name, ep.title, "第 " + (ep.episode || ei + 1) + " 场"));
                var epLines = buildVideoLines(ep);
                var epSlug = "ep-" + (ep.id || (ei + 1));

                if (epLines.length > 0) {
                    var idsArr = [];
                    for (var li = 0; li < epLines.length; li++) {
                        idsArr.push({
                            "name": epLines[li].name,
                            "url": epLines[li].url
                        });
                    }
                    eps.push({
                        "id": epLines[0].url,
                        "name": epTitle,
                        "slug": epSlug,
                        "ids": idsArr
                    });
                } else {
                    eps.push({
                        "id": String(ep.id) + "|data:" + String(ep.id),
                        "name": epTitle,
                        "slug": epSlug
                    });
                }
            }
            if (eps.length > 0) {
                servers.push({
                    "name": "直播回放合集",
                    "episodes": eps
                });
            }
        }

        // 单部影片的多条 CDN 线路
        if (servers.length === 0) {
            var mainLines = buildVideoLines(a);
            if (mainLines.length > 0) {
                var singleEps = [];
                for (var idx = 0; idx < mainLines.length; idx++) {
                    singleEps.push({
                        "id": mainLines[idx].url,
                        "name": mainLines[idx].name,
                        "slug": "line-" + (idx + 1)
                    });
                }
                servers.push({
                    "name": "ONE 直连线路",
                    "episodes": singleEps
                });
            }
        }

        var descBits = [];
        descBits.push(liveInfo.live ? "直播回放" : modelName(a.model_id));
        if (a.published_at) descBits.push(String(a.published_at).slice(0, 10));
        if (a.views) descBits.push("观看 " + a.views);
        if (a.like_number) descBits.push("赞 " + a.like_number);
        if (sizeLabel(a.size)) descBits.push(sizeLabel(a.size));

        var bodyDesc = clean(pick(a.description, a.video_name, ""));
        var fullDesc = descBits.join(" · ") + (bodyDesc ? "\n" + bodyDesc : "");

        var dsec = durationSeconds(a);
        var yearNum = a.published_at ? (parseInt(String(a.published_at).slice(0, 4), 10) || 2026) : 2026;

        return JSON.stringify({
            "id": String(a.id),
            "title": title,
            "originName": clean(a.video_name || title),
            "posterUrl": cover,
            "backdropUrl": cover,
            "description": fullDesc,
            "quality": isPreviewOnly(a) ? "预告" : "HD",
            "year": yearNum,
            "rating": 8.5,
            "status": liveInfo.live ? "直播回放" : modelName(a.model_id),
            "category": tagArr.join(", "),
            "episode_current": dsec > 0 ? secondsToText(dsec) : "Full",
            "duration": dsec > 0 ? secondsToText(dsec) : "",
            "casts": a.author ? clean(a.author) : "",
            "director": "",
            "country": "",
            "lang": "HD",
            "servers": servers
        });
    } catch (e) {
        console.log("parseMovieDetail[err]: " + e);
        return JSON.stringify({
            "id": "error",
            "title": "加载失败",
            "description": String(e),
            "servers": []
        });
    }
}

function parseDetailResponse(html, apiUrl, datasend) {
    try {
        var cleanUrl = String(apiUrl || "").split("|")[0];
        if (/^https?:\/\/.*\.(mp4|m3u8)(\?|$)/i.test(cleanUrl)) {
            var isHls = /\.m3u8(\?|$)/i.test(cleanUrl);
            return JSON.stringify({
                "url": cleanUrl,
                "isEmbed": false,
                "mimeType": isHls ? "application/x-mpegURL" : "video/mp4",
                "headers": {
                    "User-Agent": UA
                },
                "subtitles": []
            });
        }

        bootstrap(false);
        var rawId = datasend || getPipeData(apiUrl) || cleanUrl;
        var id = String(rawId).replace(/^one:\/\/a\//, "").split("|")[0].trim();
        var a = callApi("article/detail", { id: id });
        var lines = buildVideoLines(a);

        if (lines.length > 0) {
            var streamUrl = lines[0].url;
            var isM3u8 = /\.m3u8(\?|$)/i.test(streamUrl);
            return JSON.stringify({
                "url": streamUrl,
                "isEmbed": false,
                "mimeType": isM3u8 ? "application/x-mpegURL" : "video/mp4",
                "headers": {
                    "User-Agent": UA
                },
                "subtitles": []
            });
        }

        throw new Error("未找到可用视频源");
    } catch (e) {
        console.log("parseDetailResponse[err]: " + e);
        return JSON.stringify({
            "url": "",
            "isEmbed": false,
            "headers": {},
            "subtitles": []
        });
    }
}

function parseCategoriesResponse(html) { return getPrimaryCategories(); }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// 业务逻辑与月度分区数据抓取
// =============================================================================

var VIDEO_MODELS = [6, 3];

function fetchMonthPage(model, offset, page, size, sortMode) {
    try {
        var arr = callApi("article/discovery", {
            model_id: model,
            published_at: monthStart(offset),
            page: page,
            size: size,
            sort: sortMode || "published_at"
        });
        return arr || [];
    } catch (e) {
        return [];
    }
}

function fetchNewestItems(page) {
    var offset = page - 1; // 页码对应月份回溯（第1页=当月，第2页=上月...）
    var label = monthLabel(offset);
    var combined = [];
    var seen = {};

    for (var m = 0; m < VIDEO_MODELS.length; m++) {
        var list = fetchMonthPage(VIDEO_MODELS[m], offset, 1, 60, "published_at");
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var id = String(it.id);
            if (seen[id] || isPreviewOnly(it)) continue;
            seen[id] = 1;
            combined.push(it);
        }
    }

    combined.sort(function (x, y) {
        return String(y.published_at || "").localeCompare(String(x.published_at || ""));
    });

    var out = [];
    for (var k = 0; k < combined.length; k++) {
        out.push(toVaappItem(combined[k], label));
    }
    return out;
}

function fetchHotItems(page) {
    var offset = page - 1;
    var label = monthLabel(offset) + "热门";
    var combined = [];
    var seen = {};

    for (var m = 0; m < VIDEO_MODELS.length; m++) {
        var list = fetchMonthPage(VIDEO_MODELS[m], offset, 1, 60, "like_number");
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var id = String(it.id);
            if (seen[id] || isPreviewOnly(it)) continue;
            seen[id] = 1;
            combined.push(it);
        }
    }

    combined.sort(function (x, y) {
        return (parseInt(y.like_number, 10) || 0) - (parseInt(x.like_number, 10) || 0);
    });

    var out = [];
    for (var k = 0; k < combined.length; k++) {
        out.push(toVaappItem(combined[k], label));
    }
    return out;
}

function fetchPartitionItems(partId, page) {
    var offset = page - 1;
    var label = monthLabel(offset);
    var combined = [];
    var seen = {};

    for (var m = 0; m < VIDEO_MODELS.length; m++) {
        var list = fetchMonthPage(VIDEO_MODELS[m], offset, 1, 100, "published_at");
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var id = String(it.id);
            if (seen[id] || isPreviewOnly(it)) continue;
            if (classifyPart(it) !== partId) continue;
            seen[id] = 1;
            combined.push(it);
        }
    }

    combined.sort(function (x, y) {
        return String(y.published_at || "").localeCompare(String(x.published_at || ""));
    });

    var out = [];
    for (var k = 0; k < combined.length; k++) {
        out.push(toVaappItem(combined[k], label));
    }
    return out;
}

function fetchLiveItems(page) {
    var arr = callApi("article/search", {
        keyword: "ONE直播",
        model_id: 0,
        series_category: 0,
        page: page,
        size: 24
    }) || [];

    var out = [];
    for (var i = 0; i < arr.length; i++) {
        if (isPreviewOnly(arr[i])) continue;
        out.push(toVaappItem(arr[i], "直播合集"));
    }
    return out;
}

function fetchSearchItems(keyword, page) {
    var kw = clean(keyword);
    if (!kw) return [];
    var arr = callApi("article/search", {
        keyword: kw,
        model_id: 0,
        series_category: 0,
        page: page,
        size: 24
    }) || [];

    var out = [];
    for (var i = 0; i < arr.length; i++) {
        out.push(toVaappItem(arr[i], "搜索"));
    }
    return out;
}

function fetchDayItems(page) {
    if (page > 1) return [];
    var date = todayStr();
    try {
        var last = callApi("article/last/date", null);
        if (last && last.date) date = String(last.date).slice(0, 10);
    } catch (e) {}

    var data = callApi("article/day", { published_at: date });
    var info = (data && data.info) || [];
    var out = [];
    for (var i = 0; i < info.length; i++) {
        out.push(toVaappItem(info[i], date));
    }
    return out;
}

function toVaappItem(a, prefixLabel) {
    var id = String(a.id);
    var cover = bestImage(a);
    var liveInfo = stripLiveTag(clean(pick(a.title, a.video_name, "ONE #" + id)));
    var sec = durationSeconds(a);
    var durText = sec > 0 ? secondsToText(sec) : (liveInfo.live ? "直播回放" : modelName(a.model_id));
    var qualText = sizeLabel(a.size) || (liveInfo.live ? "LIVE" : modelName(a.model_id));

    return {
        "id": id + "|data:" + id,
        "title": liveInfo.title,
        "posterUrl": cover,
        "backdropUrl": cover,
        "quality": qualText,
        "episode_current": durText,
        "year": a.published_at ? (parseInt(String(a.published_at).slice(0, 4), 10) || 2026) : 2026,
        "lang": prefixLabel || ""
    };
}

// =============================================================================
// 会话管理与同步 HTTP 通信 (适配 VAAPP httpRequest & localStorage)
// =============================================================================

function loadSession() {
    if (S) return S;
    var raw = null;
    try { raw = localStorage.getItem(SES_KEY); } catch (e) { raw = null; }
    if (typeof raw === "string" && raw) {
        try {
            var saved = JSON.parse(raw);
            if (saved && saved.token) {
                S = saved;
                return S;
            }
        } catch (e) {}
    }
    S = {
        uuid: makeUuid(),
        host: "",
        token: "",
        api: [],
        image: [],
        resource: [],
        fimg: [],
        video: [],
        video_hls: [],
        audio: [],
        vplay: [],
        vdl: [],
        audl: [],
        ts: 0
    };
    return S;
}

function saveSession() {
    try { localStorage.setItem(SES_KEY, JSON.stringify(S)); } catch (e) {}
}

function applyDomains(domain) {
    if (!domain) return;
    if (domain.api && domain.api.length) S.api = domain.api.slice();
    if (domain.image && domain.image.length) S.image = domain.image.slice();
    if (domain.resource && domain.resource.length) S.resource = domain.resource.slice();
    if (domain.flutter_img && domain.flutter_img.length) S.fimg = domain.flutter_img.slice();
    if (domain.video && domain.video.length) S.video = domain.video.slice();
    if (domain.video_hls && domain.video_hls.length) S.video_hls = domain.video_hls.slice();
    if (domain.audio && domain.audio.length) S.audio = domain.audio.slice();
    if (domain.flutter_video_play && domain.flutter_video_play.length) S.vplay = domain.flutter_video_play.slice();
    if (domain.flutter_video_download && domain.flutter_video_download.length) S.vdl = domain.flutter_video_download.slice();
    if (domain.audio_download && domain.audio_download.length) S.audl = domain.audio_download.slice();
}

function hostCandidates() {
    var list = [];
    if (S && S.host) list.push(S.host);
    if (S && S.api) {
        for (var i = 0; i < S.api.length; i++) {
            if (list.indexOf(S.api[i]) < 0) list.push(S.api[i]);
        }
    }
    for (var j = 0; j < SEED_HOSTS.length; j++) {
        if (list.indexOf(SEED_HOSTS[j]) < 0) list.push(SEED_HOSTS[j]);
    }
    return list;
}

function buildHeaders(token) {
    var ts = Math.floor(Date.now() / 1000);
    var sign = md5Hex(md5Hex("0.0.0.0.3." + ts + ".." + S.uuid) + SIGN_SALT);
    return {
        "platform": "3",
        "uuid": S.uuid,
        "timestamp": String(ts),
        "token": token === undefined ? (S.token || "") : token,
        "app-version": APP_VERSION,
        "sign": sign,
        "user-key": "",
        "ip": "0.0.0.0",
        "User-Agent": UA,
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded"
    };
}

function parsePayload(text) {
    if (text === null || text === undefined) return null;
    var str = typeof text === "string" ? text : JSON.stringify(text);
    str = str.trim();
    if (!str) return null;
    if (str.charAt(0) === "{") {
        try { return JSON.parse(str); } catch (e) { return null; }
    }
    var plain = "";
    try { plain = aesDecryptCbc(APP_KEY, APP_IV, str); } catch (e) { plain = ""; }
    if (!plain) return null;
    try { return JSON.parse(plain); } catch (e) { return null; }
}

function postRaw(host, path, params, token) {
    var body = "";
    var qs = encQuery(params);
    if (qs) body = aesEncryptCbcBase64(APP_KEY, APP_IV, qs);
    var url = host + "/v2.5/" + path;
    var resp = httpRequest(url, {
        method: "POST",
        headers: buildHeaders(token),
        body: body
    });
    if (!resp || !resp.body) return null;
    return parsePayload(resp.body);
}

function bootstrap(force) {
    loadSession();
    if (!force && S.token && S.host) return S;
    var hosts = hostCandidates();
    var lastErr = null;
    for (var i = 0; i < hosts.length; i++) {
        try {
            var json = postRaw(hosts[i], "bootstrap", null, "");
            if (json && json.code === 200 && json.data) {
                var user = json.data.user || {};
                S.host = hosts[i];
                S.token = user.token || "";
                applyDomains(json.data.domain);
                S.ts = Date.now();
                saveSession();
                return S;
            }
            lastErr = new Error("bootstrap " + (json && json.code));
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error("ONE 初始化失败");
}

function callApi(path, params) {
    loadSession();
    var retried = false;
    var bootstrapped = !!S.token;
    for (var attempt = 0; attempt < 2; attempt++) {
        var hosts = hostCandidates();
        var lastErr = null;
        for (var i = 0; i < hosts.length; i++) {
            try {
                var json = postRaw(hosts[i], path, params);
                if (!json) { lastErr = new Error("empty response"); continue; }
                if (json.code === 200) {
                    S.host = hosts[i];
                    saveSession();
                    return json.data;
                }
                if (json.code === 401) {
                    lastErr = new Error("401 " + (json.message || ""));
                    break;
                }
                throw new Error("ONE " + json.code + " " + (json.message || ""));
            } catch (e) {
                lastErr = e;
            }
        }
        if (!retried && (String(lastErr && lastErr.message || "").indexOf("401") >= 0 || !bootstrapped)) {
            retried = true;
            bootstrap(true);
            bootstrapped = true;
            continue;
        }
        throw lastErr || new Error("ONE 请求失败");
    }
    throw new Error("ONE 请求失败");
}

// =============================================================================
// 媒体地址与地区分类工具
// =============================================================================

function hostIsBad(h) {
    for (var i = 0; i < BAD_HOSTS.length; i++) {
        if (String(h).indexOf(BAD_HOSTS[i]) >= 0) return true;
    }
    return false;
}

function imgHosts() {
    var list = [];
    function add(arr) {
        if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
            var h = String(arr[i] || "").replace(/\/+$/, "");
            if (!h || list.indexOf(h) >= 0 || hostIsBad(h)) continue;
            list.push(h);
        }
    }
    if (S) { add(S.fimg); add(S.resource); }
    add(PLAIN_HOSTS);
    return list;
}

function pathOf(url) {
    var m = String(url || "").match(/^https?:\/\/[^\/]+(\/.*)$/);
    return m ? m[1] : String(url || "");
}

function pickImgHost(p) {
    var hosts = imgHosts();
    if (!hosts.length) return "https://img807.hkq57tt.com";
    var h = 0;
    for (var i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) >>> 0;
    return hosts[h % hosts.length];
}

function gifToJpeg(url) {
    if (!/\.gif(\?|$)/i.test(String(url))) return url;
    return "https://wsrv.nl/?url=" + encodeURIComponent(url) + "&output=jpg&w=520";
}

function absImage(path) {
    if (!path) return "";
    var p = String(path);
    if (/^https?:\/\//.test(p)) {
        for (var i = 0; i < ENC_HOSTS.length; i++) {
            if (p.indexOf(ENC_HOSTS[i]) >= 0) return pickImgHost(pathOf(p)) + pathOf(p);
        }
        return p;
    }
    return pickImgHost(p) + (p.charAt(0) === "/" ? "" : "/") + p;
}

function bestImage(a) {
    if (!a) return "";
    var cands = [a.thumbnail, a.thumb, a.video_cover, a.cover, a.thumb_tiny];
    if (a.multi_pic_thumbnail && a.multi_pic_thumbnail.length) cands = cands.concat(a.multi_pic_thumbnail);
    if (a.thumbnail_list && a.thumbnail_list.length) cands = cands.concat(a.thumbnail_list);
    var gif = "";
    for (var i = 0; i < cands.length; i++) {
        var u = absImage(cands[i]);
        if (!u) continue;
        if (/\.gif(\?|$)/i.test(u)) {
            if (!gif) gif = u;
            continue;
        }
        return u;
    }
    return gif ? gifToJpeg(gif) : "";
}

function videoHosts() {
    var list = [];
    function add(arr) {
        if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
            var h = String(arr[i] || "").replace(/\/+$/, "");
            if (!h || list.indexOf(h) >= 0 || hostIsBad(h)) continue;
            list.push(h);
        }
    }
    if (S) { add(S.video); add(S.vdl); add(S.vplay); add(S.audl); add(S.audio); }
    if (!list.length) list = ["https://46e9nz.mfpt8g.com", "https://f86xxm.upmf83.com"];
    return list;
}

function absVideo(path, kind) {
    if (!path) return "";
    var p = String(path);
    if (/^https?:\/\//.test(p)) return p;
    var hosts = kind === "hls" ? (S && S.video_hls) : kind === "audio" ? (S && S.audio) : (S && S.video);
    if (!hosts || !hosts.length) hosts = ["https://46e9nz.mfpt8g.com"];
    return hosts[0] + (p.charAt(0) === "/" ? "" : "/") + p;
}

function isPreviewOnly(a) {
    if (!a) return true;
    if (String(a.video_download || "")) return false;
    var file = String(a.video_file || "");
    if (!file) {
        if (!String(a.preview_video || "")) return false;
        return true;
    }
    if (String(a.preview_video || "") === file) return true;
    if (/preview|sample|_pr\.mp4|-pr\.mp4/i.test(file)) return true;
    return false;
}

function buildVideoLines(a) {
    var lines = [];
    var hosts = videoHosts();
    function pushMp4(path, label) {
        if (!path) return;
        var p = String(path);
        for (var i = 0; i < hosts.length && i < 4; i++) {
            var url = /^https?:\/\//.test(p) ? p : hosts[i] + (p.charAt(0) === "/" ? "" : "/") + p;
            lines.push({
                name: label + " · 线路" + (i + 1),
                url: url
            });
        }
    }
    var previewOnly = isPreviewOnly(a);
    pushMp4(a.video_download, "完整版");
    if (!previewOnly && a.video_file && String(a.video_file) !== String(a.video_download || "")) {
        pushMp4(a.video_file, "直连");
    } else if (previewOnly) {
        pushMp4(a.video_file, "预告");
    }
    if (!lines.length && a.preview_video) {
        lines.push({ name: "预览片段", url: absVideo(a.preview_video) });
    }
    return lines;
}

var TAG_US = /^(欧美|美国|英国|德国|法国|意大利|西班牙|荷兰|瑞典|瑞士|奥地利|波兰|捷克|匈牙利|罗马尼亚|保加利亚|俄罗斯|乌克兰|白俄罗斯|拉脱维亚|立陶宛|爱沙尼亚|巴西|墨西哥|阿根廷|哥伦比亚|秘鲁|智利|古巴|委内瑞拉|拉美|拉丁|加拿大|澳洲|澳大利亚|新西兰|印度|泰国|越南|菲律宾|印尼|马来西亚|阿拉伯|异域|土耳其|迪拜|以色列|伊朗|黑人|金发|白人|碧眼|西方|外国|欧美无码|欧美精品)$/;
var TAG_JP = /^(日本|日系|日韩|日本无码|日本精品)$/;
var TAG_CN = /^(国产|国语|华语|国产精品|国产无码|港台|台湾|香港|新加坡)$/;
var STRONG_US = /(p站|onlyfans|fansly|faphouse|pjgirls|deeper|tushy|vixen|blacked|brazzers|realitykings|bangbros|teamskeet|mylf|chaturbate|cb站|推特|fansone|manyvids)/i;
var STRONG_CN = /(ai短剧|短剧|探花|门事件|绿播|微密圈|抖音|快手|b站|91|抖阴|杏吧|麻豆|天美|糖心|精东|国语|华语|国产精品)/i;

function classifyPart(a) {
    var title = String(pick(a.title, a.video_name, "") || "");
    if (title.indexOf("[ONE直播") >= 0 || (/直播回放/.test(title) && /one直播/i.test(title))) return "live";
    if (STRONG_US.test(title)) return "us";
    if (STRONG_CN.test(title)) return "cn";
    if (/[\u3040-\u30ff]/.test(title) || /\b[a-z]{2,5}[-_]\d{2,5}\b/i.test(title)) return "jp";

    var arr = (a && a.tags) || [];
    var us = 0, jp = 0, cn = 0;
    for (var i = 0; i < arr.length; i++) {
        var t = arr[i];
        var v = typeof t === "string" ? t : (t && (t.slug || t.name || t.title || t.tag_name)) || "";
        v = String(v).replace(/\s+/g, " ").trim();
        if (TAG_US.test(v)) us++;
        else if (TAG_JP.test(v)) jp++;
        else if (TAG_CN.test(v)) cn++;
    }
    if (us && us >= jp && us >= cn) return "us";
    if (jp && jp >= cn) return "jp";
    if (cn) return "cn";

    var fullText = (title + " " + String(a.author || "")).toLowerCase();
    if (/(pornhub|洋马|白人|金发|碧眼|欧美|美国|俄罗斯|乌克兰|拉美|latina|ebony|russian|blonde)/i.test(fullText)) return "us";
    if (/(无码|有码|人妻|女优|痴女|素人|日系|日本|fc2|jav|中文字幕|熟女)/i.test(fullText)) return "jp";
    return "cn";
}

// =============================================================================
// 基础工具与加密算法 (UTF-8 / Base64 / MD5 / AES-128-CBC)
// =============================================================================

function clean(s) {
    return String(s === null || s === undefined ? "" : s)
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
}

function pick() {
    for (var i = 0; i < arguments.length; i++) {
        var v = arguments[i];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
}

function encQuery(params) {
    if (!params) return "";
    var parts = [];
    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = params[k];
        if (v === undefined || v === null || v === "") continue;
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
    }
    return parts.join("&");
}

function todayStr() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function monthStart(offset) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (parseInt(offset, 10) || 0));
    var m = d.getMonth() + 1;
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : "" + m) + "-01";
}

function monthLabel(offset) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (parseInt(offset, 10) || 0));
    return d.getFullYear() + "年" + (d.getMonth() + 1) + "月";
}

function makeUuid() {
    var hex = [];
    for (var i = 0; i < 32; i++) hex.push("0123456789abcdef".charAt(Math.floor(Math.random() * 16)));
    var s = hex.join("");
    return s.slice(0, 8) + "-" + s.slice(8, 12) + "-4" + s.slice(13, 16) + "-a" + s.slice(17, 20) + "-" + s.slice(20, 32);
}

function modelName(mid) {
    var m = parseInt(mid, 10);
    if (m === 1) return "图集";
    if (m === 2 || m === 3) return "视频";
    if (m === 4) return "图文";
    if (m === 5) return "音频";
    if (m === 6) return "长视频";
    return "视频";
}

function stripLiveTag(title) {
    var t = String(title || "");
    var m = t.match(/^\[(ONE\s*直播[^\]]*)\]\s*/i);
    if (!m) return { title: t, live: false };
    return { title: t.slice(m[0].length).trim(), live: true };
}

function sizeLabel(v) {
    var t = String(v == null ? "" : v).trim();
    if (!t) return "";
    return /^\d+(\.\d+)?\s*(KB|MB|GB|TB)$/i.test(t) ? t : "";
}

function durationSeconds(a) {
    if (!a) return 0;
    var vl = parseInt(a.video_length, 10) || 0;
    if (vl > 0) return vl;
    var len = String(a.length || a.duration || "").trim();
    if (!len) return 0;
    var hms = len.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hms) {
        return hms[3] ? (+hms[1]) * 3600 + (+hms[2]) * 60 + (+hms[3]) : (+hms[1]) * 60 + (+hms[2]);
    }
    var mins = len.match(/(\d+(?:\.\d+)?)\s*(?:分钟|分|min)/i);
    if (mins) return Math.round(parseFloat(mins[1]) * 60);
    var hrs = len.match(/(\d+(?:\.\d+)?)\s*(?:小时|h)/i);
    if (hrs) return Math.round(parseFloat(hrs[1]) * 3600);
    var secs = len.match(/(\d+)\s*(?:秒|s)$/i);
    if (secs) return parseInt(secs[1], 10);
    return 0;
}

function secondsToText(sec) {
    var s = parseInt(sec, 10) || 0;
    if (s <= 0) return "";
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return h > 0 ? h + ":" + p(m) + ":" + p(ss) : m + ":" + p(ss);
}

function utf8Encode(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 0x80) out.push(c);
        else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 63)); }
        else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
            var c2 = str.charCodeAt(i + 1);
            var cp = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
            i++;
            out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
        } else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return out;
}

function utf8Decode(bytes) {
    var s = "", i = 0;
    while (i < bytes.length) {
        var b = bytes[i++];
        if (b < 0x80) s += String.fromCharCode(b);
        else if (b < 0xe0) { s += String.fromCharCode(((b & 31) << 6) | (bytes[i++] & 63)); }
        else if (b < 0xf0) { s += String.fromCharCode(((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63)); }
        else {
            var cp = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            cp -= 0x10000;
            s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
        }
    }
    return s;
}

var B64C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var B64R = null;

function base64EncodeBytes(bytes) {
    var out = "", i;
    for (i = 0; i + 2 < bytes.length; i += 3) {
        var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        out += B64C[(n >> 18) & 63] + B64C[(n >> 12) & 63] + B64C[(n >> 6) & 63] + B64C[n & 63];
    }
    var rem = bytes.length - i;
    if (rem === 1) { var n1 = bytes[i] << 16; out += B64C[(n1 >> 18) & 63] + B64C[(n1 >> 12) & 63] + "=="; }
    else if (rem === 2) { var n2 = (bytes[i] << 16) | (bytes[i + 1] << 8); out += B64C[(n2 >> 18) & 63] + B64C[(n2 >> 12) & 63] + B64C[(n2 >> 6) & 63] + "="; }
    return out;
}

function base64DecodeBytes(str) {
    if (!B64R) { B64R = {}; for (var k = 0; k < B64C.length; k++) B64R[B64C.charAt(k)] = k; }
    var s = String(str || "").replace(/[^A-Za-z0-9+/]/g, "");
    var out = [], i;
    for (i = 0; i + 3 < s.length; i += 4) {
        var n = (B64R[s.charAt(i)] << 18) | (B64R[s.charAt(i + 1)] << 12) | (B64R[s.charAt(i + 2)] << 6) | B64R[s.charAt(i + 3)];
        out.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
    }
    var rest = s.length - i;
    if (rest === 3) { var m = (B64R[s.charAt(i)] << 18) | (B64R[s.charAt(i + 1)] << 12) | (B64R[s.charAt(i + 2)] << 6); out.push((m >> 16) & 255, (m >> 8) & 255); }
    else if (rest === 2) { var m2 = (B64R[s.charAt(i)] << 18) | (B64R[s.charAt(i + 1)] << 12); out.push((m2 >> 16) & 255); }
    return out;
}

function md5Hex(str) {
    var msg = utf8Encode(str), len = msg.length;
    var bitLen = len * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var lo = bitLen >>> 0, hi = Math.floor(bitLen / 4294967296) >>> 0;
    msg.push(lo & 255, (lo >>> 8) & 255, (lo >>> 16) & 255, (lo >>> 24) & 255);
    msg.push(hi & 255, (hi >>> 8) & 255, (hi >>> 16) & 255, (hi >>> 24) & 255);
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var S_MD5 = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    var K = [];
    for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
    for (var off = 0; off < msg.length; off += 64) {
        var M = [];
        for (var j = 0; j < 16; j++) M[j] = msg[off + j * 4] | (msg[off + j * 4 + 1] << 8) | (msg[off + j * 4 + 2] << 16) | (msg[off + j * 4 + 3] << 24);
        var A = a0, B = b0, C = c0, D = d0;
        for (var r = 0; r < 64; r++) {
            var F, g;
            if (r < 16) { F = (B & C) | (~B & D); g = r; }
            else if (r < 32) { F = (D & B) | (~D & C); g = (5 * r + 1) % 16; }
            else if (r < 48) { F = B ^ C ^ D; g = (3 * r + 5) % 16; }
            else { F = C ^ (B | ~D); g = (7 * r) % 16; }
            var tmp = D; D = C; C = B;
            var sum = (A + F + K[r] + M[g]) | 0;
            B = (B + ((sum << S_MD5[r]) | (sum >>> (32 - S_MD5[r])))) | 0;
            A = tmp;
        }
        a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    function w(x) { var s = ""; for (var i = 0; i < 4; i++) { var b = (x >>> (i * 8)) & 255; s += ("0" + b.toString(16)).slice(-2); } return s; }
    return w(a0) + w(b0) + w(c0) + w(d0);
}

var AES = (function () {
    function xt(a) { return ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff; }
    function mul(a, b) { var r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r & 0xff; }
    var SBOX = [], INV = [];
    for (var a = 0; a < 256; a++) {
        var inv = 0;
        if (a) { for (var b = 1; b < 256; b++) { if (mul(a, b) === 1) { inv = b; break; } } }
        var x = inv;
        var s = x ^ ((x << 1 | x >> 7) & 255) ^ ((x << 2 | x >> 6) & 255) ^ ((x << 3 | x >> 5) & 255) ^ ((x << 4 | x >> 4) & 255) ^ 0x63;
        SBOX[a] = s & 0xff;
    }
    for (var i = 0; i < 256; i++) INV[SBOX[i]] = i;
    function expandKey(key) {
        var w = [], i;
        w[0] = (key[0] << 24) | (key[1] << 16) | (key[2] << 8) | key[3];
        w[1] = (key[4] << 24) | (key[5] << 16) | (key[6] << 8) | key[7];
        w[2] = (key[8] << 24) | (key[9] << 16) | (key[10] << 8) | key[11];
        w[3] = (key[12] << 24) | (key[13] << 16) | (key[14] << 8) | key[15];
        var rcon = 1;
        for (i = 4; i < 44; i++) {
            var t = w[i - 1];
            if (i % 4 === 0) {
                t = ((t << 8) | (t >>> 24)) >>> 0;
                t = ((SBOX[(t >>> 24) & 255] << 24) | (SBOX[(t >>> 16) & 255] << 16) | (SBOX[(t >>> 8) & 255] << 8) | SBOX[t & 255]) >>> 0;
                t = (t ^ (rcon << 24)) >>> 0;
                rcon = xt(rcon);
            }
            w[i] = (w[i - 4] ^ t) >>> 0;
        }
        return w;
    }
    function encBlock(w, s) {
        var st = [];
        for (var i = 0; i < 4; i++) st[i] = s[i] ^ w[i];
        for (var round = 1; round <= 10; round++) {
            var t = [];
            for (var c = 0; c < 4; c++) {
                t[c] = (SBOX[(st[c] >>> 24) & 255] << 24) | (SBOX[(st[c] >>> 16) & 255] << 16) | (SBOX[(st[c] >>> 8) & 255] << 8) | SBOX[st[c] & 255];
            }
            var sh = [];
            for (var c2 = 0; c2 < 4; c2++) {
                sh[c2] = [(t[c2] >>> 24) & 255, (t[c2] >>> 16) & 255, (t[c2] >>> 8) & 255, t[c2] & 255];
            }
            var rows = [[], [], [], []];
            for (var col = 0; col < 4; col++) for (var row = 0; row < 4; row++) rows[row][col] = sh[col][row];
            for (var row2 = 0; row2 < 4; row2++) {
                var tmp = rows[row2].slice();
                for (var col2 = 0; col2 < 4; col2++) rows[row2][col2] = tmp[(col2 + row2) % 4];
            }
            for (var col3 = 0; col3 < 4; col3++) for (var row3 = 0; row3 < 4; row3++) sh[col3][row3] = rows[row3][col3];
            var mixed = [];
            for (var c3 = 0; c3 < 4; c3++) {
                var a0 = sh[c3][0], a1 = sh[c3][1], a2 = sh[c3][2], a3 = sh[c3][3];
                if (round !== 10) {
                    mixed[c3] = ((mul(a0, 2) ^ mul(a1, 3) ^ a2 ^ a3) << 24 | (a0 ^ mul(a1, 2) ^ mul(a2, 3) ^ a3) << 16 | (a0 ^ a1 ^ mul(a2, 2) ^ mul(a3, 3)) << 8 | (mul(a0, 3) ^ a1 ^ a2 ^ mul(a3, 2))) >>> 0;
                } else {
                    mixed[c3] = ((a0 << 24) | (a1 << 16) | (a2 << 8) | a3) >>> 0;
                }
            }
            for (var c4 = 0; c4 < 4; c4++) st[c4] = (mixed[c4] ^ w[round * 4 + c4]) >>> 0;
        }
        return st;
    }
    function invShift(st) {
        var cols = [];
        for (var c = 0; c < 4; c++) cols[c] = [(st[c] >>> 24) & 255, (st[c] >>> 16) & 255, (st[c] >>> 8) & 255, st[c] & 255];
        var rows = [[], [], [], []];
        for (var cc = 0; cc < 4; cc++) for (var rr = 0; rr < 4; rr++) rows[rr][cc] = cols[cc][rr];
        for (var r2 = 0; r2 < 4; r2++) { var t2 = rows[r2].slice(); for (var c2 = 0; c2 < 4; c2++) rows[r2][(c2 + r2) % 4] = t2[c2]; }
        for (var c3 = 0; c3 < 4; c3++) for (var r3 = 0; r3 < 4; r3++) cols[c3][r3] = rows[r3][c3];
        var out = [];
        for (var c4 = 0; c4 < 4; c4++) out[c4] = ((cols[c4][0] << 24) | (cols[c4][1] << 16) | (cols[c4][2] << 8) | cols[c4][3]) >>> 0;
        return out;
    }
    function invSub(st) {
        var out = [];
        for (var c = 0; c < 4; c++) out[c] = ((INV[(st[c] >>> 24) & 255] << 24) | (INV[(st[c] >>> 16) & 255] << 16) | (INV[(st[c] >>> 8) & 255] << 8) | INV[st[c] & 255]) >>> 0;
        return out;
    }
    function invMix(st) {
        var out = [];
        for (var c = 0; c < 4; c++) {
            var b0 = (st[c] >>> 24) & 255, b1 = (st[c] >>> 16) & 255, b2 = (st[c] >>> 8) & 255, b3 = st[c] & 255;
            out[c] = ((mul(b0, 14) ^ mul(b1, 11) ^ mul(b2, 13) ^ mul(b3, 9)) << 24 |
                      (mul(b0, 9) ^ mul(b1, 14) ^ mul(b2, 11) ^ mul(b3, 13)) << 16 |
                      (mul(b0, 13) ^ mul(b1, 9) ^ mul(b2, 14) ^ mul(b3, 11)) << 8 |
                      (mul(b0, 11) ^ mul(b1, 13) ^ mul(b2, 9) ^ mul(b3, 14))) >>> 0;
        }
        return out;
    }
    function decBlock(w, s) {
        var st = [];
        for (var i = 0; i < 4; i++) st[i] = s[i] >>> 0;
        for (var round = 10; round >= 1; round--) {
            for (var k = 0; k < 4; k++) st[k] = (st[k] ^ w[round * 4 + k]) >>> 0;
            if (round !== 10) st = invMix(st);
            st = invShift(st);
            st = invSub(st);
        }
        for (var k2 = 0; k2 < 4; k2++) st[k2] = (st[k2] ^ w[k2]) >>> 0;
        return st;
    }
    function cbc(keyBytes, ivBytes, dataBytes, encrypt) {
        var w = expandKey(keyBytes);
        var iv = [];
        for (var i = 0; i < 4; i++) iv[i] = ((ivBytes[i * 4] << 24) | (ivBytes[i * 4 + 1] << 16) | (ivBytes[i * 4 + 2] << 8) | ivBytes[i * 4 + 3]) >>> 0;
        var out = [], prev = iv;
        for (var off = 0; off < dataBytes.length; off += 16) {
            var blk = [];
            for (var j = 0; j < 4; j++) blk[j] = ((dataBytes[off + j * 4] << 24) | (dataBytes[off + j * 4 + 1] << 16) | (dataBytes[off + j * 4 + 2] << 8) | dataBytes[off + j * 4 + 3]) >>> 0;
            var res;
            if (encrypt) res = encBlock(w, [blk[0] ^ prev[0], blk[1] ^ prev[1], blk[2] ^ prev[2], blk[3] ^ prev[3]]);
            else {
                res = decBlock(w, blk);
                res = [(res[0] ^ prev[0]) >>> 0, (res[1] ^ prev[1]) >>> 0, (res[2] ^ prev[2]) >>> 0, (res[3] ^ prev[3]) >>> 0];
            }
            for (var j2 = 0; j2 < 4; j2++) out.push((res[j2] >>> 24) & 255, (res[j2] >>> 16) & 255, (res[j2] >>> 8) & 255, res[j2] & 255);
            if (encrypt) prev = res;
            else prev = blk;
        }
        return out;
    }
    return { cbc: cbc };
})();

function aesEncryptCbcBase64(keyStr, ivStr, plainStr) {
    var data = utf8Encode(plainStr);
    var pad = 16 - (data.length % 16);
    for (var i = 0; i < pad; i++) data.push(pad);
    return base64EncodeBytes(AES.cbc(utf8Encode(keyStr), utf8Encode(ivStr), data, true));
}

function aesDecryptCbc(keyStr, ivStr, b64) {
    var bytes = base64DecodeBytes(b64);
    if (!bytes.length || bytes.length % 16 !== 0) return "";
    var out = AES.cbc(utf8Encode(keyStr), utf8Encode(ivStr), bytes, false);
    var pad = out[out.length - 1];
    if (pad >= 1 && pad <= 16) out = out.slice(0, out.length - pad);
    return utf8Decode(out);
}
