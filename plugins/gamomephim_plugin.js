// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: TRỰC TIẾP MP4 + DỰ PHÒNG HOOK (HYBRID)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Bản Hybrid Tối Cao: Moi trực tiếp link MP4 + Có sẵn Hook tự động click dự phòng.",
        "version": "8.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Bắt buộc: Kích hoạt giao diện Player Dọc
        "layoutType": "VERTICAL",
        "playerType": "auto" // Tự động chọn Native ExoPlayer hoặc Webview Hook
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[GaMoMePhim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[GaMoMePhim] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới', type: 'Grid' },
        { slug: 'the-loai/hien-dai', title: 'Hiện Đại', type: 'Horizontal' },
        { slug: 'the-loai/co-trang', title: 'Cổ Trang', type: 'Horizontal' },
        { slug: 'the-loai/hai-huoc', title: 'Hài Hước', type: 'Horizontal' },
        { slug: 'the-loai/tra-xanh-nam', title: 'Trà Xanh Nam', type: 'Horizontal' },
        { slug: 'ban-xep-hang', title: 'Bảng Xếp Hạng', type: 'Horizontal' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Mới', slug: 'phim-moi' },
        { name: 'Bảng Xếp Hạng', slug: 'ban-xep-hang' },
        { name: 'Chữa Lành', slug: 'the-loai/chua-lanh' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Hiện Đại', slug: 'the-loai/hien-dai' },
        { name: 'Thanh Xuân', slug: 'the-loai/thanh-xuan' },
        { name: 'Trà Xanh Nam', slug: 'the-loai/tra-xanh-nam' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try { page = JSON.parse(filtersJson).page || 1; } catch (e) {}
        }
        var url = BASEURL + "/" + slug.replace(/^\//, "");
        if (page > 1) url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        return url;
    } catch (e) { return BASEURL; }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try { page = JSON.parse(filtersJson).page || 1; } catch (e) {}
        }
        return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword) + (page > 1 ? "&page=" + page : "");
    } catch (e) { return BASEURL; }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    // Bỏ chữ /phim/ để quy chuẩn URL
    var cleanSlug = slug.replace(/^\//, "").replace(/^phim\//, "");
    return BASEURL + "/" + cleanSlug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, url) {
    try {
        var items = [];
        var added = {};
        
        var unescapedHtml = html.replace(/\\"/g, '"');
        var regex = /"item"\s*:\s*(\{[^{}]*"slug"\s*:\s*"([^"]+)"[^{}]*\})/g;
        var match;
        
        while ((match = regex.exec(unescapedHtml)) !== null) {
            try {
                var objStr = match[1];
                var slug = match[2];
                var titleMatch = objStr.match(/"title"\s*:\s*"([^"]+)"/);
                var imgMatch = objStr.match(/"img"\s*:\s*"([^"]+)"/);
                var badgeMatch = objStr.match(/"badge"\s*:\s*"([^"]+)"/);
                var yearMatch = objStr.match(/"year"\s*:\s*(\d+)/);
                
                if (titleMatch && !added[slug]) {
                    added[slug] = true;
                    items.push({
                        id: slug, 
                        title: titleMatch[1],
                        posterUrl: imgMatch ? imgMatch[1] : "",
                        backdropUrl: imgMatch ? imgMatch[1] : "",
                        quality: badgeMatch ? badgeMatch[1] : "HD",
                        year: yearMatch ? parseInt(yearMatch[1]) : 0,
                        episode_current: badgeMatch ? badgeMatch[1] : "Cập nhật"
                    });
                }
            } catch (errJson) {}
        }

        if (items.length === 0) {
            var domRegex = /<a[^>]+href="(?:\/phim)?\/([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?(?:<span[^>]*>([^<]+)<\/span>)?/gi;
            var domMatch;
            while ((domMatch = domRegex.exec(html)) !== null) {
                var dSlug = domMatch[1];
                if (!added[dSlug]) {
                    added[dSlug] = true;
                    items.push({
                        id: dSlug,
                        title: domMatch[2].trim(),
                        posterUrl: domMatch[3],
                        backdropUrl: domMatch[3],
                        episode_current: domMatch[4] ? domMatch[4].trim() : "Full"
                    });
                }
            }
        }

        return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: items.length > 0 ? 99 : 1 } });
    } catch (e) { return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } }); }
}

function parseSearchResponse(html, url) { return parseListResponse(html, url); }

function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "Không có mô tả.";
        var year = 2026;
        var casts = "";
        var duration = "";

        // Trích Metadata
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").replace(/ - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (metaImg) posterUrl = metaImg[1];
        
        var castMatch = html.match(/"cast"\s*:\s*\\?"([^"\\]+)/);
        if (castMatch) casts = castMatch[1];
        
        var durationMatch = html.match(/"durationString"\s*:\s*\\?"([^"\\]+)/);
        if (durationMatch) duration = durationMatch[1];
        
        var ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (ldJsonMatch) {
            try {
                var ldData = JSON.parse(ldJsonMatch[1]);
                if (ldData.name) title = ldData.name;
                if (ldData.description) description = ldData.description;
            } catch(e) {}
        }

        // =====================================================================
        // TRỤC CHÍNH: MOI TRỰC TIẾP LINK MP4 TỪ HTML GỐC BẰNG SPLIT (SIÊU CHUẨN)
        // =====================================================================
        var svSub = [];
        var svTm = [];
        var addedEps = {};
        
        // Tách chuỗi cực mạnh, chống lỗi dính chùm JSON
        var blocks = html.split(/\\?"episodeNumber\\?"\s*:/);
        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var numMatch = block.match(/^(\d+)/);
            var epNum = numMatch ? numMatch[1] : "1";
            
            var linkMatch = block.match(/m3u8Url\\?"\s*:\s*\\?"(https:[^"\\]+)/);
            var epLink = linkMatch ? linkMatch[1] : "";
            
            var audioMatch = block.match(/audioType\\?"\s*:\s*\\?"([^"\\]+)/);
            var audioType = audioMatch ? audioMatch[1] : "VIETSUB";
            
            if (epLink) {
                var slug = (audioType === "THUYET_MINH" ? "tm-" : "vs-") + epNum;
                if (!addedEps[slug]) {
                    addedEps[slug] = true;
                    // Nhét trực tiếp link .mp4 vào ID
                    if (audioType === "THUYET_MINH") {
                        svTm.push({ id: epLink, name: "Tập " + epNum, slug: slug });
                    } else {
                        svSub.push({ id: epLink, name: "Tập " + epNum, slug: slug });
                    }
                }
            }
        }

        var servers = [];
        if (svTm.length > 0) servers.push({ name: "Phát Ngay - Thuyết Minh", episodes: svTm });
        if (svSub.length > 0) servers.push({ name: "Phát Ngay - Vietsub", episodes: svSub });

        // NẾU MOI LINK THẤT BẠI HOẶC BẠN MUỐN DÙNG HOOK, TẠO SERVER DỰ PHÒNG CHẠY HOOK
        var cleanUrl = url.split("|")[0];
        servers.push({
            name: "Dự phòng (Chạy Hook tự động)",
            episodes: [
                { id: cleanUrl + "|data:hook=vs", name: "Bản Vietsub", slug: "hook-vs" },
                { id: cleanUrl + "|data:hook=tm", name: "Bản Thuyết Minh", slug: "hook-tm" }
            ]
        });

        // Sort eps
        servers.forEach(function(s) {
            s.episodes.sort(function(a, b) {
                var matchA = a.slug.match(/\d+/);
                var matchB = b.slug.match(/\d+/);
                return (matchA ? parseInt(matchA[0]) : 0) - (matchB ? parseInt(matchB[0]) : 0);
            });
        });

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            quality: "FHD",
            year: year,
            rating: 9.5,
            status: "Full " + Math.max(svSub.length, svTm.length) + " Tập",
            casts: casts,
            duration: duration,
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// XỬ LÝ 2 NHÁNH: PHÁT TRỰC TIẾP HOẶC CHẠY HOOK
function parseDetailResponse(html, apiUrl) {
    try {
        var url = apiUrl.split("|")[0];

        // 1. NHÁNH NATIVE: Nếu ID truyền vào đã là link MP4 (Moi thành công)
        if (url.indexOf(".mp4") > -1 || url.indexOf(".m3u8") > -1) {
            var mimeType = url.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4";
            return JSON.stringify({
                "url": url, 
                "isEmbed": false, // Bật Native Player Dọc, 0% quảng cáo
                "mimeType": mimeType,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                "subtitles": []
            });
        }

        // 2. NHÁNH HOOK: Nếu bạn bấm vào các tập ở "Server Dự Phòng"
        var isVietsub = apiUrl.indexOf('hook=vs') > -1 ? true : false;
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var isVietsub = ${isVietsub};
            var step = 0; 
            var checkCount = 0;

            var checkInterval = setInterval(function() {
                try {
                    // BƯỚC 1: CLICK NÚT VÀO XEM PHIM (MỞ KHÓA PLAYER)
                    if (step === 0) {
                        var links = document.querySelectorAll('a');
                        var found = false;
                        for (var i = 0; i < links.length; i++) {
                            if (links[i].innerText && links[i].innerText.toUpperCase().indexOf('VÀO XEM PHIM') > -1) {
                                links[i].click();
                                found = true;
                                break;
                            }
                        }
                        if (found || document.querySelector('video')) step = 1; 
                    }

                    // BƯỚC 2: CHỌN NGÔN NGỮ THUYẾT MINH / VIETSUB
                    if (step === 1) {
                        var btns = document.querySelectorAll('button');
                        for (var j = 0; j < btns.length; j++) {
                            var text = (btns[j].innerText || "").toLowerCase();
                            if (isVietsub && text.indexOf('vietsub') > -1) {
                                btns[j].click(); break;
                            } else if (!isVietsub && text.indexOf('thuyết minh') > -1) {
                                btns[j].click(); break;
                            }
                        }
                        step = 2;
                    }

                    // BƯỚC 3: CLICK NÚT PLAY ĐỂ WEB LOAD MP4
                    if (step === 2) {
                        var svgPaths = document.querySelectorAll('svg path');
                        for (var k = 0; k < svgPaths.length; k++) {
                            var d = svgPaths[k].getAttribute('d');
                            if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                                var parentBtn = svgPaths[k].parentNode;
                                while(parentBtn && parentBtn.tagName !== 'BUTTON' && parentBtn.tagName !== 'BODY') {
                                    parentBtn = parentBtn.parentNode;
                                }
                                if (parentBtn && parentBtn.tagName === 'BUTTON') {
                                    parentBtn.click(); break;
                                }
                            }
                        }
                        var vid = document.querySelector('video');
                        if (vid && typeof vid.play === 'function') vid.play().catch(function(){});
                        step = 3;
                    }

                    // BƯỚC 4: TÓM GỌN LINK MP4 VÀ ĐẨY SANG EXOPLAYER NATIVE
                    if (step === 3) {
                        var video = document.querySelector('video');
                        if (video && video.src && video.src.indexOf('http') === 0) {
                            if (window.SnifferBridge) {
                                var headers = JSON.stringify({
                                    "Referer": window.location.href,
                                    "User-Agent": navigator.userAgent
                                });
                                window.SnifferBridge.play(video.src, headers);
                            }
                            clearInterval(checkInterval);
                        }
                    }

                    checkCount++;
                    if (checkCount > 50) clearInterval(checkInterval); // Giải phóng sau 25s
                } catch (err) {}
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": url, 
            "isEmbed": true, // Kích hoạt Webview ngầm cho chức năng Hook
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true",
                "Block-Redirects": "true",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                "Custom-Js": customJsCode.replace(/\n/g, " ").replace(/\r/g, "").trim()
            },
            "subtitles": []
        });

    } catch (e) {
        return JSON.stringify({ "url": apiUrl.split("|")[0], "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(html, url) { 
    return JSON.stringify({ url: url, isEmbed: false }); 
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
