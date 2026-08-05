// ===================================================================
// CẬP NHẬT HÀM PARSE CHI TIẾT PHIM (TỰ ĐỘNG DÒ SERVER)
// ===================================================================

function parseMovieDetail(html, apiUrl) {
    // 1. Lấy thông tin cơ bản của phim
    var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    var descMatch = html.match(/<div class="film-description m-hide">\s*<div class="text">([\s\S]*?)<\/div>/);
    
    var title = titleMatch ? titleMatch[1].replace("Xem phim ", "").trim() : "Không xác định";
    var posterUrl = posterMatch ? posterMatch[1] : "";
    var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

    // 2. Hàm nội bộ quét tập phim trong 1 block HTML
    function parseEpisodes(htmlBlock) {
        var eps = [];
        // Bắt tất cả thẻ a có class chứa "ssl-item ep-item" (tương thích cả trạng thái đang active)
        var epRegex = /<a[^>]*class="[^"]*ssl-item ep-item[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g;
        var m;
        while ((m = epRegex.exec(htmlBlock)) !== null) {
            var epUrl = m[1];
            var epTitle = m[2].trim();
            // Tạo slug DUY NHẤT cực kỳ quan trọng cho VAAPP (Ví dụ: sever2-pham-nhan-tu-tien-tap-1)
            var uniqueSlug = epUrl.replace("https://yanhh3d.love/", "").replace(/\//g, "-");
            
            eps.push({
                id: epUrl, // URL đầy đủ dùng cho getUrlDetail fetch thẳng stream
                name: epTitle,
                slug: uniqueSlug 
            });
        }
        // Đảo ngược mảng để UX tập 1, 2, 3... hiển thị từ trên xuống
        return eps.reverse(); 
    }

    var servers = [];

    // 3. TỰ ĐỘNG lấy danh sách Server/Tab có trên website
    var tabRegex = /<a[^>]*data-toggle="tab"[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/g;
    var tabs = [];
    var tabMatch;
    while ((tabMatch = tabRegex.exec(html)) !== null) {
        tabs.push({ 
            id: tabMatch[1], // ID của div nội dung (VD: top-comment)
            name: tabMatch[2].trim() // Tên hiển thị (VD: Thuyết Minh)
        });
    }

    // 4. Bóc tách tập phim tương ứng với từng Tab
    if (tabs.length > 0) {
        for (var i = 0; i < tabs.length; i++) {
            // Tìm vị trí bắt đầu của div nội dung Tab hiện tại
            var startIdx = html.indexOf('id="' + tabs[i].id + '"');
            if (startIdx > -1) {
                var endIdx = html.length;
                // Giới hạn vùng cắt HTML đến vị trí của Tab tiếp theo (nếu có)
                if (i < tabs.length - 1) {
                    var nextIdx = html.indexOf('id="' + tabs[i+1].id + '"', startIdx);
                    if (nextIdx > -1) endIdx = nextIdx;
                }
                
                // Cắt lấy đúng vùng HTML chứa tập của Server này
                var blockHtml = html.substring(startIdx, endIdx);
                var eps = parseEpisodes(blockHtml);
                
                // Chỉ đẩy lên App nếu Server đó có tập phim
                if (eps.length > 0) {
                    servers.push({ name: tabs[i].name, episodes: eps });
                }
            }
        }
    } else {
        // Trường hợp fallback: Web không chia tab Server nào
        var eps = parseEpisodes(html);
        if (eps.length > 0) {
            servers.push({ name: "Mặc Định", episodes: eps });
        }
    }

    return JSON.stringify({
        id: apiUrl,
        title: title,
        posterUrl: posterUrl,
        description: description,
        servers: servers
    });
}
