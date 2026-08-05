// -----------------------------------------------------------------------------
// ĐÃ NÂNG CẤP: AUTO-BYPASS QUẢNG CÁO VÀ TỰ ĐỘNG MỞ KHÓA TẬP PHIM
// -----------------------------------------------------------------------------
function parseDetailResponse(html, url) {
    try {
        // Script thông minh: Chỉ ẩn rác và tự động "bấm hộ" các nút xem quảng cáo/mở khóa
        var smartBypassJs = "var s=document.createElement('style');" +
            "s.innerHTML='header,.topbar,.topbar-inner,footer,.site-footer-wrap,.desktop-sidebar-left,.desktop-sidebar-right,.player-seo-block,.player-random-section,.watch-history-fab,.share-buttons{display:none!important}body,html{background:#000!important}';" +
            "document.head.appendChild(s);" +
            "setInterval(function(){" +
                // 1. Tự động bấm xác nhận thông báo / popup
                "var swalBtn = document.querySelector('.swal2-confirm');" +
                "if(swalBtn) { try { swalBtn.click(); } catch(e){} }" +
                
                // 2. Tự động tìm và bấm các nút: "Xem quảng cáo", "Mở khóa", "Watch Ad", "Unlock", "Tiếp tục"
                "var allClickables = document.querySelectorAll('button, a, div, span');" +
                "for(var i=0; i<allClickables.length; i++) {" +
                    "var txt = (allClickables[i].innerText || allClickables[i].textContent || '').toLowerCase();" +
                    "if(txt.indexOf('xem quảng cáo') > -1 || txt.indexOf('watch ad') > -1 || txt.indexOf('mở khóa') > -1 || txt.indexOf('unlock') > -1 || txt.indexOf('xem ngay') > -1) {" +
                        "try { allClickables[i].click(); } catch(e){}" +
                    "}" +
                "}" +
                
                // 3. Xóa các modal yêu cầu đăng nhập nếu vướng víu
                "var authModal = document.querySelector('.nd-auth-modal'); if(authModal) authModal.remove();" +
                "var authBackdrop = document.querySelector('.nd-auth-backdrop'); if(authBackdrop) authBackdrop.remove();" +
            "}, 300);";

        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Sử dụng WebView chuẩn playerType embed[cite: 1, 2]
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
                "Custom-Js": smartBypassJs
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": {} });
    }
}
