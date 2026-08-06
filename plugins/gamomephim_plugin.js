// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: NATIVE SHORTFILM + HOOK EMBED TO EXOPLAY (NO ADS)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Nền tảng xem phim ngắn FULL HD. Hook siêu tốc, tự động vượt rào, 0% quảng cáo.",
        "version": "7.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt giao diện vuốt dọc (TikTok-style)
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // BẮT BUỘC: Mở Webview tàng hình để Hook JS chạy
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
            try {
                var filters = JSON.parse(filtersJson);
                page = parseInt(filters.page) || 1;
            } catch (e) {}
        }
        var url = BASEURL + "/" + slug.replace(/^\//, "");
        if (page > 1) {
            url += (url.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
        }
        return url;
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;
        if (filtersJson) {
            try {
                page = JSON.parse(filtersJson).page || 1;
            } catch (e) {}
        }
        return BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword) + (page > 1 ? "&page=" + page : "");
    } catch (e) {
        return BASEURL;
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
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

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: items.length > 0 ? 99 : 1 }
        });

    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "Không có mô tả.";
        var year = 2026;
        var casts = "";
        var duration = "";

        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").trim();

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
        var castMatch = unescapedHtml.match(/"cast"\s*:\s*"([^"]+)"/);
        if (castMatch) casts = castMatch[1];
        var durationMatch = unescapedHtml.match(/"durationString"\s*:\s*"([^"]+)"/);
        if (durationMatch) duration = durationMatch[1];
        var yearMatch = unescapedHtml.match(/"releaseYear"\s*:\s*(\d+)/);
        if (yearMatch) year = parseInt(yearMatch[1]);

        // Tạo Menu chọn tập. Sử dụng |data: để nhét thông số loại phụ đề vào App
        var cleanUrl = url.split("|")[0];
        var servers = [{
            name: "Vào Xem Phim (Native)",
            episodes: [
                { id: cleanUrl + "|data:lang=vs", name: "Bản Vietsub", slug: "tap-vs" },
                { id: cleanUrl + "|data:lang=tm", name: "Bản Thuyết Minh", slug: "tap-tm" }
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

// BƯỚC QUYẾT ĐỊNH: HOOK CUSTOM-JS VƯỢT LƯỜI 4 BƯỚC
function parseDetailResponse(html, apiUrl) {
    try {
        var isVietsub = apiUrl.indexOf('lang=vs') > -1 ? true : false;
        var cleanUrl = apiUrl.split("|")[0];
        
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var isVietsub = ${isVietsub};
            var step = 0; // 0: Click VÀO XEM PHIM, 1: Chọn Sub/TM, 2: Click Play, 3: Đợi Link
            var checkCount = 0;

            var checkInterval = setInterval(function() {
                try {
                    // BƯỚC 1: TÌM VÀ CLICK NÚT "VÀO XEM PHIM"
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
                        // Dù tìm thấy nút hay không, nếu đã có thẻ video xuất hiện tức là đã ở trong trang player
                        if (found || document.querySelector('video')) {
                            step = 1; 
                        }
                    }

                    // BƯỚC 2: CHỌN NGÔN NGỮ THUYẾT MINH / VIETSUB
                    if (step === 1) {
                        var btns = document.querySelectorAll('button');
                        var langClicked = false;
                        for (var j = 0; j < btns.length; j++) {
                            var text = btns[j].innerText || "";
                            if (isVietsub && text.toLowerCase().indexOf('vietsub') > -1) {
                                btns[j].click(); langClicked = true; break;
                            } else if (!isVietsub && text.toLowerCase().indexOf('thuyết minh') > -1) {
                                btns[j].click(); langClicked = true; break;
                            }
                        }
                        step = 2; // Qua bước tiếp theo
                    }

                    // BƯỚC 3: TỰ ĐỘNG BẤM PLAY GIỮA MÀN HÌNH
                    if (step === 2) {
                        var playBtns = document.querySelectorAll('button');
                        for (var k = 0; k < playBtns.length; k++) {
                            var htmlContent = playBtns[k].innerHTML || "";
                            if (htmlContent.indexOf('M8 5v14l11-7z') > -1 || htmlContent.indexOf('M18 13c0') > -1) {
                                playBtns[k].click();
                                break;
                            }
                        }
                        // Ép trình duyệt cấp quyền play
                        var vid = document.querySelector('video');
                        if (vid && typeof vid.play === 'function') vid.play().catch(function(){});
                        step = 3;
                    }

                    // BƯỚC 4: TÓM GỌN LINK MEDIA ĐẨY SANG EXOPLAYER VÀ PHÁT NATIVE
                    if (step === 3) {
                        var video = document.querySelector('video');
                        if (video && video.src && video.src.indexOf('http') === 0) {
                            if (window.SnifferBridge) {
                                window.SnifferBridge.log("✅ HOOK THÀNH CÔNG MP4: " + video.src);
                                var headers = JSON.stringify({
                                    "Referer": window.location.href,
                                    "User-Agent": navigator.userAgent
                                });
                                // Gọi API Native của Vax App để kích hoạt ExoPlayer dọc
                                window.SnifferBridge.play(video.src, headers);
                            }
                            clearInterval(checkInterval);
                        }
                    }

                    checkCount++;
                    if (checkCount > 50) clearInterval(checkInterval); // Tự hủy sau 25s
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Lỗi Hook: " + err.message);
                }
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": cleanUrl, 
            "isEmbed": true, // Kích hoạt Webview ngầm
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true", // Triệt tiêu quảng cáo web
                "Block-Redirects": "true", // Chống web tự nhảy trang
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                // Chèn mã JS Hook vào Webview
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
