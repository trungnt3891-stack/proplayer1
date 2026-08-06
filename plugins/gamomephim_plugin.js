// =============================================================================
// PLUGIN VAX APP: GÀ MỜ MÊ PHIM (GAMOMEPHIM.COM)
// CHIẾN THUẬT: EMBED TO EXOPLAY (HOOK TRANG 2, TỰ ĐỘNG BẤM CHỌN SUB VÀ PLAY)
// =============================================================================

var BASEURL = "https://gamomephim.com";

function getManifest() {
    return JSON.stringify({
        "id": "gamomephim",
        "name": "Gà Mờ Mê Phim",
        "description": "Bản Hook Hoàn Hảo: Tự động bấm nút Play, loại bỏ 100% quảng cáo.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://r2.gamomephim.com/site/logo-1784305321242.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "shortfilm", // Kích hoạt giao diện vuốt dọc
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
    
    // ĐIỂM CHỐT 1: Cắt bỏ chữ /phim/ để quy chuẩn URL trỏ thẳng vào Trang 2 (Trang Player)
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

        // Trích xuất Metadata thông tin phim
        var metaTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
        if (metaTitle) title = metaTitle[1].replace(/ FULL - Gà Mờ Mê Phim/gi, "").replace(/ - Gà Mờ Mê Phim/gi, "").trim();

        var metaImg = html.match(/<meta property="og:image" content="([^"]+)"/i);
        if (metaImg) posterUrl = metaImg[1];

        var ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (ldJsonMatch) {
            try {
                var ldData = JSON.parse(ldJsonMatch[1]);
                if (ldData.name) title = ldData.name;
                if (ldData.description) description = ldData.description;
            } catch(e) {}
        }

        // ĐIỂM CHỐT 2: Tạo sẵn 2 tập với tham số truyền ngầm "|data:vs" và "|data:tm"
        var cleanUrl = url.split("|")[0];
        var servers = [{
            name: "Server Phát Nhanh (Native)",
            episodes: [
                { id: cleanUrl + "|data:vs", name: "Bản Vietsub", slug: "tap-vs" },
                { id: cleanUrl + "|data:tm", name: "Bản Thuyết Minh", slug: "tap-tm" }
            ]
        }];

        return JSON.stringify({
            id: url,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            quality: "FHD",
            year: 2026,
            rating: 9.5,
            status: "Hoàn Thành",
            servers: servers
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi nội dung", servers: [] });
    }
}

// BƯỚC HOOK: CAN THIỆP VÀO WEBVIEW NGẦM ĐỂ TỰ ĐỘNG BẤM NÚT VÀ LẤY LINK
function parseDetailResponse(html, apiUrl) {
    try {
        var isVietsub = apiUrl.indexOf('data:vs') > -1 ? true : false;
        var cleanUrl = apiUrl.split("|")[0]; 
        
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var isVietsub = ${isVietsub};
            var step = 0;
            var checkCount = 0;

            var timer = setInterval(function() {
                try {
                    // Xóa rác giao diện để tối ưu tốc độ load
                    var style = document.createElement('style');
                    style.innerHTML = 'header, footer, nav { display: none !important; }';
                    document.head.appendChild(style);

                    // BƯỚC 1: TÌM NÚT CHỌN THUYẾT MINH / VIETSUB VÀ BẤM VÀO
                    if (step === 0) {
                        var btns = document.querySelectorAll('button');
                        var clicked = false;
                        for (var i = 0; i < btns.length; i++) {
                            var txt = (btns[i].innerText || "").toLowerCase();
                            if (isVietsub && txt.indexOf('vietsub') > -1) {
                                btns[i].click(); 
                                clicked = true; 
                                break;
                            } else if (!isVietsub && txt.indexOf('thuyết minh') > -1) {
                                btns[i].click(); 
                                clicked = true; 
                                break;
                            }
                        }
                        // Chuyển sang bước 2 ngay cả khi không thấy nút ngôn ngữ (phòng hờ phim chỉ có 1 bản)
                        step = 1; 
                    }

                    // BƯỚC 2: TÌM NÚT PLAY TRÊN MÀN HÌNH VÀ BẤM VÀO
                    if (step === 1) {
                        var paths = document.querySelectorAll('svg path');
                        for (var j = 0; j < paths.length; j++) {
                            var d = paths[j].getAttribute('d');
                            // Dựa vào đoạn SVG bạn cung cấp, đây là icon nút Play
                            if (d && (d.indexOf('M8 5v14l11-7z') > -1 || d.indexOf('M18 13c0') > -1)) {
                                var btn = paths[j].parentNode;
                                while (btn && btn.tagName !== 'BUTTON' && btn.tagName !== 'BODY') {
                                    btn = btn.parentNode;
                                }
                                if (btn && btn.tagName === 'BUTTON') {
                                    btn.click();
                                    break;
                                }
                            }
                        }
                        
                        // Hỗ trợ ép play trực tiếp
                        var video = document.querySelector('video');
                        if (video && typeof video.play === 'function') {
                            video.play().catch(function(e){});
                        }
                        step = 2;
                    }

                    // BƯỚC 3: TÓM GỌN LINK VÀ GỬI SANG EXOPLAYER DỌC
                    if (step === 2) {
                        var v = document.querySelector('video');
                        if (v && v.src && v.src.indexOf('http') === 0) {
                            clearInterval(timer); // Dừng vòng lặp kiểm tra
                            
                            if (window.SnifferBridge) {
                                window.SnifferBridge.log("✅ Tóm link thành công: " + v.src);
                                var headers = JSON.stringify({
                                    "Referer": window.location.href,
                                    "User-Agent": navigator.userAgent
                                });
                                // Truyền thẳng link mp4 vào Native Player
                                window.SnifferBridge.play(v.src, headers);
                            }
                        }
                    }

                    checkCount++;
                    if (checkCount > 40) clearInterval(timer); // Tự hủy sau 20s nếu web lỗi
                } catch (e) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Lỗi Hook: " + e.message);
                }
            }, 500);
        })();
        `;

        return JSON.stringify({
            "url": cleanUrl, 
            "isEmbed": true, // MỞ WEBVIEW NGẦM CHẠY HOOK MÔ PHỎNG THAO TÁC TAY[cite: 11]
            "headers": {
                "Referer": BASEURL,
                "Block-Ads": "true",
                "Block-Redirects": "true",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
