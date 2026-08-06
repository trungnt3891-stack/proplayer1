// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHIẾN THUẬT: EMBED TO EXOPLAY (HOOK VÀO TRANG 2 TỰ ĐỘNG BẤM PLAY)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Bản Hook Tuyệt Đối: Mở ngầm trang 2, tự động bấm Play và tóm link sang màn hình dọc.",
        "version": "9.9.9",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt UI vuốt dọc TikTok
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // BẮT BUỘC: Cho phép Webview tàng hình chạy mã Hook
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
    
    // GỌI VÀO TRANG 1 TRƯỚC (/phim/...)
    var cleanSlug = slug.replace(/^\//, "").replace(/^phim\//, "");
    return BASEURL + "/phim/" + cleanSlug;
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

// BÓC THÔNG TIN TRANG 1 & TRẢ VỀ ID LÀ LINK CỦA TRANG 2
function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "Không có mô tả.";
        var year = 2026;
        var casts = "";
        var duration = "";

        // Trích xuất Metadata cơ bản
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").replace(/ - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (metaImg) posterUrl = metaImg[1];
        
        var ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (ldJsonMatch) {
            try {
                var ldData = JSON.parse(ldJsonMatch[1]);
                if (ldData.name) title = ldData.name;
                if (ldData.description) description = ldData.description;
            } catch(e) {}
        }
        
        var unescapedHtml = html.replace(/\\"/g, '"');
        var castMatch = unescapedHtml.match(/"cast"\s*:\s*\\?"([^"\\]+)/);
        if (castMatch) casts = castMatch[1];
        var durationMatch = unescapedHtml.match(/"durationString"\s*:\s*\\?"([^"\\]+)/);
        if (durationMatch) duration = durationMatch[1];
        var yearMatch = unescapedHtml.match(/"releaseYear"\s*:\s*(\d+)/);
        if (yearMatch) year = parseInt(yearMatch[1]);

        // ĐIỂM CỐT LÕI: TẠO ID TRỎ THẲNG VÀO TRANG 2 (BỎ CHỮ /PHIM/) ĐỂ WEBVIEW MỞ TRANG ĐÓ
        var cleanSlug = url.split("?")[0].split("|")[0].replace("/phim/", "/");
        var watchUrl = cleanSlug;

        // Tạo 2 tập tương ứng với 2 nút. Gắn data:vs và data:tm để Hook nhận diện
        var servers = [{
            name: "Server Tự Động (Hook)",
            episodes: [
                { id: watchUrl + "|data:vs", name: "Bản Vietsub", slug: "tap-vs" },
                { id: watchUrl + "|data:tm", name: "Bản Thuyết Minh", slug: "tap-tm" }
            ]
        }];

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            quality: "FHD",
            year: year,
            rating: 9.5,
            status: "Hoàn Thành",
            casts: casts,
            duration: duration,
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// BƯỚC HOOK: TRANG 2 NÀY SẼ CHẠY NGẦM, JS SẼ CLICK NÚT NGÔN NGỮ VÀ PLAY
function parseDetailResponse(html, apiUrl) {
    try {
        var isVietsub = apiUrl.indexOf('data:vs') > -1 ? true : false;
        var cleanUrl = apiUrl.split("|")[0]; // Link trang 2 sạch sẽ
        
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var isVietsub = ${isVietsub};
            var clickedLang = false;
            var clickedPlay = false;
            var checkCount = 0;

            var checkTimer = setInterval(function() {
                try {
                    // Dọn dẹp DOM rác (nếu có)
                    var ads = document.querySelectorAll('header, footer, nav');
                    for(var a=0; a<ads.length; a++) ads[a].style.display = 'none';

                    // 1. TÌM VÀ CLICK NÚT NGÔN NGỮ
                    if (!clickedLang) {
                        var btns = document.querySelectorAll('button');
                        for(var i = 0; i < btns.length; i++) {
                            var txt = (btns[i].innerText || "").toLowerCase();
                            if (isVietsub && txt.indexOf('vietsub') > -1) {
                                btns[i].click(); 
                                clickedLang = true; 
                                if(window.SnifferBridge) window.SnifferBridge.log("Hook: Đã click Vietsub");
                                break;
                            } else if (!isVietsub && txt.indexOf('thuyết minh') > -1) {
                                btns[i].click(); 
                                clickedLang = true; 
                                if(window.SnifferBridge) window.SnifferBridge.log("Hook: Đã click Thuyết Minh");
                                break;
                            }
                        }
                        if (!clickedLang && btns.length > 0) clickedLang = true; 
                    }

                    // 2. CLICK NÚT PLAY LỚN TRÊN PLAYER ĐỂ ÉP NẠP LINK
                    if (clickedLang && !clickedPlay) {
                        var svgPaths = document.querySelectorAll('svg path');
                        for (var k = 0; k < svgPaths.length; k++) {
                            var d = svgPaths[k].getAttribute('d');
                            if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                                var parentBtn = svgPaths[k].parentNode;
                                while(parentBtn && parentBtn.tagName !== 'BUTTON' && parentBtn.tagName !== 'BODY') {
                                    parentBtn = parentBtn.parentNode;
                                }
                                if (parentBtn && parentBtn.tagName === 'BUTTON') {
                                    parentBtn.click();
                                    clickedPlay = true;
                                    if(window.SnifferBridge) window.SnifferBridge.log("Hook: Đã click nút Play");
                                    break;
                                }
                            }
                        }
                        var v = document.querySelector('video');
                        if (v && typeof v.play === 'function') v.play().catch(function(){});
                    }

                    // 3. CANH ME THẺ VIDEO, THẤY LINK LÀ VỚT NGAY LẬP TỨC
                    var video = document.querySelector('video');
                    if (video && video.src && video.src.indexOf('http') === 0) {
                        clearInterval(checkTimer);
                        if (window.SnifferBridge) {
                            window.SnifferBridge.log("✅ HOOK THÀNH CÔNG: " + video.src);
                            var headers = JSON.stringify({
                                "Referer": window.location.href,
                                "User-Agent": navigator.userAgent
                            });
                            // LỆNH GỬI LINK SANG EXOPLAYER VÀ ĐÓNG WEBVIEW
                            window.SnifferBridge.play(video.src, headers);
                        }
                    }

                    checkCount++;
                    if (checkCount > 50) clearInterval(checkTimer); // Hủy sau 25 giây
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Lỗi Hook: " + err.message);
                }
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": cleanUrl, 
            "isEmbed": true, // Cho phép Webview tàng hình chạy để Hook hoạt động
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
