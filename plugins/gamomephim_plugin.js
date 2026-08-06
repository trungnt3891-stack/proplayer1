// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: TRỰC TIẾP MP4 SIÊU TỐC + DỰ PHÒNG HOOK (HYBRID)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Bản Hybrid Tối Cao: Moi trực tiếp link MP4 + Có Hook tự động click nút 'Vào Xem Phim'.",
        "version": "9.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt giao diện vuốt dọc (TikTok-style)
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // Hỗ trợ chạy Webview ngầm cho chức năng Hook dự phòng
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
        { name: 'Cưới Trước Yêu Sau', slug: 'the-loai/cuoi-truoc-yeu-sau' },
        { name: 'Dân Quốc', slug: 'the-loai/dan-quoc' },
        { name: 'Gương Vỡ Lại Lành', slug: 'the-loai/guong-vo-lai-lanh' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Hiện Đại', slug: 'the-loai/hien-dai' },
        { name: 'Niên Đại', slug: 'the-loai/nien-dai' },
        { name: 'Thanh Xuân', slug: 'the-loai/thanh-xuan' },
        { name: 'Trà Xanh Nam', slug: 'the-loai/tra-xanh-nam' },
        { name: 'Trọng Sinh', slug: 'the-loai/trong-sinh' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Yêu Thầm', slug: 'the-loai/yeu-tham' }
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
                
                if (titleMatch && !added[slug]) {
                    added[slug] = true;
                    items.push({
                        id: slug, 
                        title: titleMatch[1],
                        posterUrl: imgMatch ? imgMatch[1] : "",
                        backdropUrl: imgMatch ? imgMatch[1] : "",
                        quality: badgeMatch ? badgeMatch[1] : "HD",
                        episode_current: badgeMatch ? badgeMatch[1] : "Cập nhật"
                    });
                }
            } catch (errJson) {}
        }

        if (items.length === 0) {
            var domRegex = /<a[^>]+href="(?:\/phim)?\/([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"/gi;
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
                        episode_current: "Full"
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

        // Bóc tách Thông Tin Metadata
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
        // TRỤC CHÍNH: MOI TRỰC TIẾP LINK MP4 TỪ MÃ NGUỒN (KHÔNG CẦN CHẠY WEBVIEW)
        // Dùng Regex siêu mạnh tóm gọn cả JSON đã escape (\")
        // =====================================================================
        var svSub = [];
        var svTm = [];
        var addedEps = {};
        
        var epRegex = /\{[^{}]*?"m3u8Url\\?"\s*:\s*\\?"(https:[^"\\]+)[^{}]*?\}/gi;
        var match;
        while ((match = epRegex.exec(html)) !== null) {
            var block = match[0];
            var urlM = block.match(/"m3u8Url\\?"\s*:\s*\\?"(https:[^"\\]+)/i);
            var numM = block.match(/"episodeNumber\\?"\s*:\s*(\d+)/i);
            var audioM = block.match(/"audioType\\?"\s*:\s*\\?"([^"\\]+)/i);
            
            if (urlM && urlM[1]) {
                var link = urlM[1].replace(/\\\//g, '/'); // Gỡ rối dấu gạch chéo
                var num = numM ? numM[1] : "1";
                var audio = audioM ? audioM[1] : "VIETSUB";
                var slug = (audio === "THUYET_MINH" ? "tm-" : "vs-") + num;
                
                if (!addedEps[slug]) {
                    addedEps[slug] = true;
                    // Tống thẳng link .mp4 vào ID để player phát liền tay
                    if (audio === "THUYET_MINH") {
                        svTm.push({ id: link, name: "Tập " + num, slug: slug });
                    } else {
                        svSub.push({ id: link, name: "Tập " + num, slug: slug });
                    }
                }
            }
        }

        var servers = [];
        if (svTm.length > 0) servers.push({ name: "Phát Ngay - Thuyết Minh (Native)", episodes: svTm });
        if (svSub.length > 0) servers.push({ name: "Phát Ngay - Vietsub (Native)", episodes: svSub });

        // TẠO SERVER DỰ PHÒNG CHẠY BẰNG HOOK TỰ ĐỘNG BẤM NÚT "VÀO XEM PHIM"
        var cleanUrl = url.split("|")[0];
        servers.push({
            name: "Dự phòng (Chạy Hook Tự Động)",
            episodes: [
                { id: cleanUrl + "|data:hook=vs", name: "Tự động Vietsub", slug: "hook-vs" },
                { id: cleanUrl + "|data:hook=tm", name: "Tự động Thuyết Minh", slug: "hook-tm" }
            ]
        });

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

// XỬ LÝ NHÁNH: PHÁT TRỰC TIẾP MP4 HOẶC GỌI WEBVIEW NGẦM CHẠY HOOK
function parseDetailResponse(html, apiUrl) {
    try {
        var url = apiUrl.split("|")[0];

        // 1. NHÁNH NATIVE: Nếu ID là link MP4 (Trích xuất thành công từ bước 1)
        if (url.indexOf(".mp4") > -1 || url.indexOf(".m3u8") > -1) {
            var mimeType = url.indexOf(".m3u8") > -1 ? "application/x-mpegURL" : "video/mp4";
            return JSON.stringify({
                "url": url, 
                "isEmbed": false, // KÍCH HOẠT PLAYER NATIVE DỌC CỦA VAX APP, 0% quảng cáo
                "mimeType": mimeType,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                "subtitles": []
            });
        }

        // 2. NHÁNH HOOK: Tự động giả lập bấm nút VÀO XEM PHIM -> BẤM NGÔN NGỮ -> BẤM PLAY
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
                    // BƯỚC 1: XÓA SẠCH QUẢNG CÁO HIỂN THỊ
                    var style = document.createElement('style');
                    style.innerHTML = 'header, footer, nav, iframe, .ads { display: none !important; }';
                    document.head.appendChild(style);

                    // BƯỚC 2: TÌM VÀ CLICK NÚT "VÀO XEM PHIM"
                    if (step === 0) {
                        var links = document.querySelectorAll('a');
                        var found = false;
                        for (var i = 0; i < links.length; i++) {
                            if (links[i].innerText && links[i].innerText.toUpperCase().indexOf('VÀO XEM PHIM') > -1) {
                                links[i].click();
                                found = true;
                                if(window.SnifferBridge) window.SnifferBridge.log("Hook: Đã click [VÀO XEM PHIM]");
                                break;
                            }
                        }
                        if (found || document.querySelector('video')) step = 1; 
                    }

                    // BƯỚC 3: CHỌN NGÔN NGỮ
                    if (step === 1) {
                        var btns = document.querySelectorAll('button');
                        var clicked = false;
                        for (var j = 0; j < btns.length; j++) {
                            var text = (btns[j].innerText || "").toLowerCase();
                            if (isVietsub && text.indexOf('vietsub') > -1) {
                                btns[j].click(); clicked = true; break;
                            } else if (!isVietsub && text.indexOf('thuyết minh') > -1) {
                                btns[j].click(); clicked = true; break;
                            }
                        }
                        if (clicked) step = 2;
                    }

                    // BƯỚC 4: BẤM PLAY VÀ TÓM LINK MP4 ĐẨY RA NGOÀI
                    if (step === 2) {
                        var svgPaths = document.querySelectorAll('svg path');
                        for (var k = 0; k < svgPaths.length; k++) {
                            var d = svgPaths[k].getAttribute('d');
                            if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                                var parentBtn = svgPaths[k].parentNode;
                                while(parentBtn && parentBtn.tagName !== 'BUTTON' && parentBtn.tagName !== 'BODY') parentBtn = parentBtn.parentNode;
                                if (parentBtn && parentBtn.tagName === 'BUTTON') {
                                    parentBtn.click(); break;
                                }
                            }
                        }
                        var vid = document.querySelector('video');
                        if (vid && typeof vid.play === 'function') vid.play().catch(function(){});
                        step = 3;
                    }

                    if (step === 3) {
                        var video = document.querySelector('video');
                        if (video && video.src && video.src.indexOf('http') === 0) {
                            if (window.SnifferBridge) {
                                window.SnifferBridge.log("✅ HOOK THÀNH CÔNG MP4: " + video.src);
                                var headers = JSON.stringify({"Referer": window.location.href, "User-Agent": navigator.userAgent});
                                window.SnifferBridge.play(video.src, headers);
                            }
                            clearInterval(checkInterval);
                        }
                    }

                    checkCount++;
                    if (checkCount > 50) clearInterval(checkInterval); // Tự hủy sau 25s
                } catch (err) {}
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": url, 
            "isEmbed": true, // Kích hoạt Webview ngầm chạy Hook
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
