/**
 * Movie Scraper Plugin for motchille.tv
 * Coded by JavaScript Expert 
 * Techniques: Next.js Payload Regex, Custom-JS Inject, Anti-Crash JSON.parse
 */

function log(msg) {
    // Hàm debug nội bộ (App sẽ bắt log này qua console)
    console.log("[Motchille Plugin] " + msg);
}

// ==========================================
// 1. CẤU HÌNH CƠ BẢN CỦA PLUGIN
// ==========================================

function getManifest() {
    return {
        id: "plugin.motchille.tv",
        name: "Motchill NextJS",
        version: "1.0.0",
        description: "Scraper tối ưu hoá cho web NextJS, tích hợp Anti-Ads Webview",
        domain: "https://motchille.tv",
        author: "JS Expert"
    };
}

function getHomeSections() {
    return [
        { id: "phim-moi", title: "Phim Mới Cập Nhật", path: "/phim-moi" },
        { id: "phim-le", title: "Phim Lẻ", path: "/phim-le" },
        { id: "phim-bo", title: "Phim Bộ", path: "/phim-bo" },
        { id: "hoat-hinh", title: "Hoạt Hình", path: "/hoat-hinh" }
    ];
}

function getPrimaryCategories() {
    return [
        { id: "hanh-dong", title: "Hành Động" },
        { id: "tinh-cam", title: "Tình Cảm" },
        { id: "kinh-di", title: "Kinh Dị" },
        { id: "hai-huoc", title: "Hài Hước" }
    ];
}

function getFilterConfig() {
    return []; // Tạm thời để mảng rỗng nếu chưa cần filter phức tạp
}

// ==========================================
// 2. CÁC HÀM TẠO URL (ROUTING)
// ==========================================

function getUrlList(sectionId, page) {
    var baseUrl = getManifest().domain;
    return baseUrl + (sectionId.startsWith("/") ? sectionId : "/the-loai/" + sectionId) + "?page=" + (page || 1);
}

function getUrlSearch(keyword, page) {
    var baseUrl = getManifest().domain;
    return baseUrl + "/tim-kiem?q=" + encodeURIComponent(keyword) + "&page=" + (page || 1);
}

function getUrlDetail(url) {
    return url;
}

function getUrlCategories() {
    return getManifest().domain;
}

// ==========================================
// 3. CÁC HÀM BÓC TÁCH (PARSER)
// ==========================================

function parseListResponse(html) {
    try {
        var list = [];
        var baseUrl = getManifest().domain;

        // Kỹ Thuật 1: Quét Next.js Payload (__NEXT_DATA__) ưu tiên tốc độ
        var nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
            log("Tìm thấy __NEXT_DATA__, tiến hành parse JSON.");
            var jsonRaw = nextDataMatch[1];
            // Kỹ thuật kiểm tra kiểu dữ liệu để chống crash
            var json = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
            
            // Giả lập bóc tách từ Next.js props (tuỳ biến theo cấu trúc thực tế của JSON)
            var items = json?.props?.pageProps?.data?.items || json?.props?.pageProps?.movies || [];
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                list.push({
                    title: item.name || item.title,
                    link: baseUrl + "/phim/" + item.slug,
                    poster: item.thumb_url || item.poster_url,
                    episodes: item.episode_current || ""
                });
            }
            if (list.length > 0) return list;
        }

        // Kỹ Thuật 2: Fallback bằng Regular Expression cực mạnh (Chống đứt gãy thẻ)
        log("Không tìm thấy Next Data, sử dụng Regex Fallback.");
        // Tìm chuỗi: <a href="/phim/..." title="..."> ... <img src="..." />
        var regex = /<a[^>]*href=["'](\/(?:phim|info)\/[^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi;
        var match;
        while ((match = regex.exec(html)) !== null) {
            var href = match[1].startsWith("http") ? match[1] : baseUrl + match[1];
            list.push({
                link: href,
                title: match[2],
                poster: match[3].startsWith("http") ? match[3] : baseUrl + match[3]
            });
        }

        return list;
    } catch (e) {
        log("Lỗi ở parseListResponse: " + e.toString());
        return [];
    }
}

function parseSearchResponse(html) {
    // Tái sử dụng logic của hàm List
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    try {
        var detail = {
            title: "",
            poster: "",
            description: "",
            episodes: []
        };

        // Lấy Tiêu đề
        var titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) detail.title = titleMatch[1].trim();

        // Lấy Ảnh bìa (Poster)
        var posterMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (posterMatch) detail.poster = posterMatch[1];

        // Lấy Nội dung
        var descMatch = html.match(/<div[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (descMatch) {
            detail.description = descMatch[1].replace(/<[^>]+>/g, "").trim(); // Xóa sạch HTML tags
        }

        // Bóc tách danh sách tập phim bằng Regex
        // Motchill thường có cấu trúc: <a href="/xem-phim/abc-tap-1" class="episode"> Tập 1 </a>
        var epRegex = /<a[^>]*href=["'](\/xem-phim\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        var baseUrl = getManifest().domain;

        while ((epMatch = epRegex.exec(html)) !== null) {
            var epLink = epMatch[1];
            var epName = epMatch[2].replace(/<[^>]+>/g, "").trim();
            
            if (epLink && epName) {
                detail.episodes.push({
                    name: epName,
                    link: epLink.startsWith("http") ? epLink : baseUrl + epLink
                });
            }
        }

        // Fallback lấy tập phim từ Next.js Payload nếu regex trượt
        if (detail.episodes.length === 0) {
            var nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (nextDataMatch) {
                var jsonRaw = nextDataMatch[1];
                var json = typeof jsonRaw === 'string' ? JSON.parse(jsonRaw) : jsonRaw;
                var serverData = json?.props?.pageProps?.movie?.episodes?.[0]?.server_data || [];
                for (var j = 0; j < serverData.length; j++) {
                    detail.episodes.push({
                        name: serverData[j].name,
                        link: baseUrl + "/xem-phim/" + json?.props?.pageProps?.movie?.slug + "-tap-" + serverData[j].slug
                    });
                }
            }
        }

        return detail;
    } catch (e) {
        log("Lỗi ở parseMovieDetail: " + e.toString());
        return { episodes: [] };
    }
}

function parseDetailResponse(html, url) {
    try {
        // Tìm iFrame phát phim
        var iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/i);
        var playerUrl = iframeMatch ? iframeMatch[1] : "";

        if (!playerUrl) {
            // Đôi khi Player link giấu trong biến javascript (VD: playVoucher)
            var jsPlayerMatch = html.match(/['"](https?:\/\/[^'"]+(?:m3u8|mp4)[^'"]*)['"]/i);
            if (jsPlayerMatch) {
                return parseEmbedResponse(html, jsPlayerMatch[1]); // Quăng qua xử lý direct
            }
        }

        if (playerUrl.startsWith("//")) {
            playerUrl = "https:" + playerUrl;
        }

        return parseEmbedResponse(html, playerUrl);
    } catch (e) {
        log("Lỗi ở parseDetailResponse: " + e.toString());
        return {};
    }
}

function parseEmbedResponse(html, url) {
    try {
        // Kỹ thuật 3: Bắt Direct Link (nếu là M3U8 hoặc MP4)
        if (url && (url.includes(".m3u8") || url.includes(".mp4"))) {
            log("Tìm thấy Direct Link, sử dụng Native Player.");
            return {
                isEmbed: false,
                url: url,
                mimeType: url.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4"
            };
        }

        // Kỹ thuật 4: Webview + Anti-Ads Custom-JS mạnh mẽ
        log("Sử dụng Webview và Inject Custom-JS khử quảng cáo.");
        
        var customJsString = `
            try {
                // 1. Ép toàn màn hình đen và khóa cuộn
                var style = document.createElement('style');
                style.innerHTML = '
                    body, html { background: #000 !important; color: #fff !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
                    /* Ẩn Header, Footer, Thanh điều hướng, Comment */
                    header, footer, nav, .sidebar, .comments, .footer-wrap { display: none !important; pointer-events: none !important; }
                    /* Phóng to Container chứa Video */
                    #player-area, .video-container, iframe { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 999999 !important; border: none !important; }
                    /* Ẩn triệt để lớp phủ Quảng cáo */
                    [class*="ads"], [id*="ads"], [class*="popup"], .overlay { display: none !important; z-index: -1 !important; opacity: 0 !important; }
                ';
                document.head.appendChild(style);

                // 2. Vòng lặp tắt quảng cáo tự động
                setInterval(function() {
                    var adCloseBtns = document.querySelectorAll('.close-ad, .skip-ad, [id*="close"], [class*="close"]');
                    for (var i = 0; i < adCloseBtns.length; i++) {
                        if (adCloseBtns[i].style.display !== 'none') {
                            adCloseBtns[i].click();
                        }
                    }
                }, 1000);
            } catch(err) {}
        `;

        // Bỏ các ký tự xuống dòng thừa trong JS để truyền header không bị lỗi
        customJsString = customJsString.replace(/\n/g, "").replace(/\s\s+/g, " ");

        return {
            isEmbed: true,
            url: url,
            headers: {
                "Custom-Js": customJsString,
                "Referer": getManifest().domain,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        };

    } catch (e) {
        log("Lỗi ở parseEmbedResponse: " + e.toString());
        return { isEmbed: true, url: url };
    }
}
