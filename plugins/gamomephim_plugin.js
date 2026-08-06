// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHUYÊN GIA TỐI ƯU: NATIVE SHORTFILM + HOOK EMBED TO EXOPLAY (NO ADS)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Nền tảng xem phim ngắn FULL HD. Sử dụng Hook bắt link siêu tốc, xóa sạch quảng cáo.",
        "version": "3.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt trình phát phim dọc
        "layoutType": "VERTICAL",
        "playerType": "embedtoexoplay" // BẮT BUỘC: Mở Webview ngầm tàng hình để Hook chạy
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

function getFilterConfig() {
    return JSON.stringify({});
}

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
    
    // ĐIỂM CHỐT QUAN TRỌNG: Cắt bỏ chữ /phim/ để ép App lao thẳng vào trang Watch Video, 
    // né hoàn toàn trang giới thiệu có nút "Vào Xem Phim"
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

        // Cứu vớt DOM nếu API đổi
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

// BƯỚC 1: TẠO GIAO DIỆN CHỌN TẬP PHIM NATIVE DỌC
function parseMovieDetail(html, url) {
    try {
        var title = "Đang cập nhật...";
        var posterUrl = "";
        var description = "Không có mô tả.";
        var year = 2026;

        // Trích xuất Metadata trực tiếp từ trang Watch
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
        var yearMatch = unescapedHtml.match(/"releaseYear"\s*:\s*(\d+)/);
        if (yearMatch) year = parseInt(yearMatch[1]);

        // Tạo 2 nút bấm Phát Nhanh theo đúng chuẩn |data: của Vax App
        var cleanUrl = url.split("|")[0];
        var servers = [{
            name: "Phát Nhanh (Không Quảng Cáo)",
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
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// BƯỚC 2: HOOK CUSTOM-JS VÀO WEBVIEW NGẦM ĐỂ ÉP RA LINK MEDIA VÀ ĐẨY SANG EXOPLAYER
function parseDetailResponse(html, apiUrl) {
    try {
        // App sẽ tự tách chuỗi |data: truyền vào
        var isVietsub = apiUrl.indexOf('lang=vs') > -1 ? true : false;
        var cleanUrl = apiUrl.split("|")[0];
        
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var isVietsub = ${isVietsub};
            var langClicked = false;
            var playClicked = false;
            var checkCount = 0;

            var checkInterval = setInterval(function() {
                try {
                    // 1. Tự động click vào ngôn ngữ Thuyết Minh / Vietsub
                    if (!langClicked) {
                        var btns = document.querySelectorAll('button');
                        for (var i = 0; i < btns.length; i++) {
                            var text = (btns[i].innerText || "").toLowerCase();
                            if (isVietsub && text.indexOf('vietsub') > -1) {
                                btns[i].click(); langClicked = true; break;
                            } else if (!isVietsub && text.indexOf('thuyết minh') > -1) {
                                btns[i].click(); langClicked = true; break;
                            }
                        }
                        if (!langClicked && btns.length > 0) langClicked = true; 
                    }

                    // 2. Tự động click Play trên Player Web để lấy link
                    if (langClicked && !playClicked) {
                        var svgPaths = document.querySelectorAll('button svg path');
                        for (var j = 0; j < svgPaths.length; j++) {
                            var d = svgPaths[j].getAttribute('d');
                            // Biểu tượng nút Play
                            if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                                var btnNode = svgPaths[j].parentNode;
                                while(btnNode && btnNode.tagName !== 'BUTTON' && btnNode.tagName !== 'BODY') {
                                    btnNode = btnNode.parentNode;
                                }
                                if (btnNode && btnNode.tagName === 'BUTTON') {
                                    btnNode.click();
                                    playClicked = true;
                                    break;
                                }
                            }
                        }
                        // Ép video play
                        var vid = document.querySelector('video');
                        if (vid && typeof vid.play === 'function') {
                            vid.play().catch(function(){});
                        }
                    }

                    // 3. TÓM ĐƯỢC LINK THÌ GỬI NGAY CHO EXOPLAYER
                    var video = document.querySelector('video');
                    if (video && video.src && video.src.indexOf('http') === 0) {
                        if (window.SnifferBridge) {
                            window.SnifferBridge.log("Đã tóm gọn link MP4: " + video.src);
                            var headers = JSON.stringify({
                                "Referer": window.location.href,
                                "User-Agent": navigator.userAgent
                            });
                            // Truyền link cho ExoPlayer (Lệnh Native)
                            window.SnifferBridge.play(video.src, headers);
                        }
                        clearInterval(checkInterval);
                    }

                    checkCount++;
                    if (checkCount > 50) clearInterval(checkInterval); // Giải phóng sau 25s
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Lỗi Hook: " + err.message);
                }
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": cleanUrl, 
            "isEmbed": true, // MỞ WEBVIEW NGẦM CHẠY HOOK
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true", // Triệt tiêu quảng cáo
                "Block-Redirects": "true", // Chống chuyển tab
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
