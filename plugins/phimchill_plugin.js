// =============================================================================
// PARSER CHI TIẾT TẬP PHIM & WEBVIEW HANDLER (TỰ ĐỘNG PHÓNG TO SAU KHI CHỌN TẬP)
// =============================================================================

function parseDetailResponse(html, url) {
    var smartScript = `
        window.addEventListener('DOMContentLoaded', function() {
            var allVideos = document.querySelectorAll('video, iframe');
            for(var i = 0; i < allVideos.length; i++) {
                try {
                    allVideos[i].removeAttribute('autoplay');
                } catch(e) {}
            }
        });

        // Lắng nghe sự kiện click chọn tập hoặc khi video bắt đầu được bấm phát
        document.addEventListener('click', function(e) {
            var target = e.target.closest('a, button, .streaming-server');
            if (target) {
                // Người dùng đã bấm chọn tập hoặc chuyển tập -> Cho phép phóng to sau một nhịp ngắn
                setTimeout(function() {
                    var videoEl = document.querySelector('video') || document.querySelector('iframe');
                    if (videoEl && videoEl.requestFullscreen) {
                        videoEl.requestFullscreen().catch(function(){});
                    }
                }, 1000);
            }
        });
    `;

    return JSON.stringify({
        "url": url,
        "isEmbed": true,
        "headers": {},
        "subtitles": [],
        "injectScript": smartScript
    });
}
