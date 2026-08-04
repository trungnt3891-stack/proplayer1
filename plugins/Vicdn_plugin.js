/**
 * ============================================================================
 * MOVIE SCRAPER PLUGIN - CHUẨN MỰC TỐI ƯU TỐC ĐỘ & ANTI-BLOCK
 * Target: vicdn.cc (Player) & Các trang phim cấu trúc JSON/HTML
 * ============================================================================
 */

const BASE_URL = "https://vicdn.cc"; // URL trang chủ giả định chứa các iframe vicdn
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Hàm Debug an toàn
function log(msg) {
    if (typeof console !== 'undefined' && console.log) {
        console.log("🔥 [Plugin_Log]: " + msg);
    }
}

// 1. CẤU HÌNH PLUGIN
function getManifest() {
    return {
        id: "plugin_vicdn_expert",
        name: "ViCDN Pro Scraper",
        version: "1.0.0",
        description: "Plugin bóc tách phim siêu tốc, vượt rào DevTools Detector và AES Encryption.",
        author: "JS Expert",
        type: "movie"
    };
}

function getHomeSections() {
    return [
        { id: "phim_moi", title: "Phim Mới Cập Nhật", type: "list" },
        { id: "phim_le", title: "Phim Lẻ Hot", type: "list" }
    ];
}

function getPrimaryCategories() {
    return [
        { id: "hanh-dong", title: "Hành Động" },
        { id: "tinh-cam", title: "Tình Cảm" },
        { id: "hoat-hinh", title: "Hoạt Hình" }
    ];
}

function getFilterConfig() {
    return {
        sort: [
            { id: "update", title: "Mới cập nhật" },
            { id: "view", title: "Xem nhiều nhất" }
        ]
    };
}

// 2. CÁC HÀM TẠO URL
function getUrlList(sectionId, page) {
    return `${BASE_URL}/danh-sach/${sectionId}?page=${page}`;
}

function getUrlSearch(keyword, page) {
    return `${BASE_URL}/tim-kiem?q=${encodeURIComponent(keyword)}&page=${page}`;
}

function getUrlDetail(movieId) {
    return `${BASE_URL}/phim/${movieId}`;
}

// 3. CÁC HÀM BÓC TÁCH DỮ LIỆU (PARSE)

/**
 * Xử lý danh sách phim (Bắt Regex hoặc JSON Payload Next.js)
 */
function parseListResponse(html) {
    try {
        let results = [];
        
        // Kỹ thuật nâng cao: Quét JSON Next.js nếu có
        let nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (nextDataMatch) {
            let json = typeof nextDataMatch[1] === 'string' ? JSON.parse(nextDataMatch[1]) : null;
            if (json && json.props && json.props.pageProps && json.props.pageProps.items) {
                let items = json.props.pageProps.items;
                for (let i = 0; i < items.length; i++) {
                    results.push({
                        id: items[i].slug,
                        title: items[i].name,
                        poster: items[i].thumb_url,
                        episodes: items[i].episode_current
                    });
                }
                log("Parse List bằng JSON (Next.js) thành công.");
                return results;
            }
        }

        // Kỹ thuật Regex quét HTML (Dự phòng tốc độ cao)
        let regex = /<article[^>]*>.*?href="([^"]+)"[^>]*title="([^"]+)"(?:.*?)<img[^>]*src="([^"]+)"/gs;
        let match;
        while ((match = regex.exec(html)) !== null) {
            results.push({
                id: match[1].split('/').pop(), // Lấy slug
                title: match[2].trim(),
                poster: match[3],
                episodes: "Đang cập nhật"
            });
        }
        
        log(`Parse List bằng Regex thành công: ${results.length} item.`);
        return results;
    } catch (e) {
        log("Lỗi parseListResponse: " + e.message);
        return [];
    }
}

function parseSearchResponse(html) {
    // Tái sử dụng logic bóc tách danh sách vì cấu trúc thường giống nhau
    return parseListResponse(html);
}

/**
 * Bóc tách Chi tiết Phim và Danh sách tập
 */
function parseDetailResponse(html, url) {
    try {
        let detail = { title: "", description: "", poster: "", episodes: [] };
        
        // Lấy Tiêu đề
        let titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (titleMatch) detail.title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

        // Lấy Mô tả
        let descMatch = html.match(/<div class="description"[^>]*>([\s\S]*?)<\/div>/);
        if (descMatch) detail.description = descMatch[1].replace(/<[^>]+>/g, '').trim();

        // Lấy Danh sách tập (Quét Regex thần tốc)
        // Tìm các thẻ <a> chứa link tập phim
        let epRegex = /<a[^>]*href="([^"]+)"[^>]*class="episode-btn"[^>]*>(.*?)<\/a>/gs;
        let epMatch;
        while ((epMatch = epRegex.exec(html)) !== null) {
            detail.episodes.push({
                id: epMatch[1], // Link tập phim hoặc ID
                title: epMatch[2].trim(), // Tên tập (VD: Tập 1)
            });
        }

        log(`Parse Detail thành công. Tìm thấy ${detail.episodes.length} tập.`);
        return detail;
    } catch (e) {
        log("Lỗi parseDetailResponse: " + e.message);
        return { episodes: [] };
    }
}

/**
 * XỬ LÝ LÕI PLAYER (Dựa trên source vicdn.cc bạn gửi)
 * Kỹ thuật Inject Custom-JS thần thánh để Anti-Ads & Anti-Detector
 */
function parseEmbedResponse(html, url) {
    try {
        // Kiểm tra nếu HTML có chứa key của JWPlayer và mã hóa AES (như web vicdn.cc)
        // Dùng chiến thuật isEmbed: true + Custom-JS
        
        let customJs = `
            try {
                // 1. TẮT DEVTOOLS DETECTOR (Ngăn chặn reload trang liên tục)
                if (window.devtoolsDetector) {
                    window.devtoolsDetector.launch = function(){};
                    window.devtoolsDetector.addListener = function(){};
                    window.devtoolsDetector.isOpen = false;
                }
                
                // 2. ÉP GIAO DIỆN FULL MÀN HÌNH ĐEN, XÓA MỌI RÁC XUNG QUANH
                var style = document.createElement('style');
                style.innerHTML = 'body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #000 !important; } ' +
                                  '#ssPlay { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 999999 !important; display: block !important; } ' +
                                  'iframe:not(#ssPlay iframe), .ads, header, footer, #sub-cfg-modal { display: none !important; pointer-events: none !important; }';
                document.head.appendChild(style);
                
                // 3. TỰ ĐỘNG PLAY (Tự động chọc vào instance JWPlayer)
                var checkPlayer = setInterval(function() {
                    if (typeof jwplayer === 'function' && jwplayer().getState) {
                        var state = jwplayer().getState();
                        if (state !== 'playing' && state !== 'buffering') {
                            jwplayer().play();
                        }
                        // Click tắt popup ads nếu jwplayer bật ra
                        var adCloseBtn = document.querySelector('.jw-skip');
                        if(adCloseBtn) adCloseBtn.click();
                        
                        clearInterval(checkPlayer);
                    }
                }, 1000);

            } catch(e) {}
        `;

        // Trả về cấu hình cho Player của App
        return {
            isEmbed: true, // Ép Webview vì luồng Play bị mã hoá AES và bắt fetch API ngầm
            url: url,
            headers: {
                "User-Agent": USER_AGENT,
                "Referer": "https://vicdn.cc/",
                // Header đặc biệt của hệ thống (nếu App hỗ trợ tiêm JS)
                "Custom-Js": customJs 
            }
        };

    } catch (e) {
        log("Lỗi parseEmbedResponse: " + e.message);
        return { isEmbed: true, url: url };
    }
}
