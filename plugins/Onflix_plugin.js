// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimnganhdc.com";

function getManifest() {
    return JSON.stringify({
        "id": "phimnganhdc",
        "name": "Phim Ngắn HDC",
        "description": "Phim ngắn trung quốc tổng hợp.",
        "version": "1.3",
        "BASEURL": BASEURL,
        "iconUrl": BASEURL + "/storage/files/logo-phimnganhdc.png",
        "isEnabled": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[phimnganhdc] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[phimnganhdc] " + msg);
    }
}

function getHomeSections() {
    var listurl = `
/danh-sach/phim-hoan-thanh@@Phim Đã Full@@false
/danh-sach/top-phim-ngay@@Top Trong Ngày@@false
/the-loai/phim-ngan@@Phim Mới@@true
`;
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && (slug.indexOf("http") > -1 || slug.indexOf("search") > -1)) {
            return slug;
        }
        let page = 1;
        let path = slug || "";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');
            
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }
        
        let resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        if (page > 1) {
            resultUrl += "?page=" + page;
        }
        
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
        
    } catch (e) {
        let fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/?search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        
        _$(html).find(".item").each(function() {
            var href = this.find("a").attr("href");
            var title = this.find(".img-film").attr("title") || this.find("img").attr("alt");
            var src = this.find(".img-film").attr("src") || this.find("img").attr("src");
            
            if (src && src.indexOf("http") === -1) {
                src = BASEURL + src;
            }
            
            if (href && title) {
                if (href.indexOf("http") === -1) {
                    href = BASEURL + (href.startsWith('/') ? '' : '/') + href;
                }
                var cleanThumb = (src || "").replace(/&amp;/g, '&');
                
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb
                });
            }
        });
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 999 }
        });
        
    } catch (e) {
        return JSON.stringify({
            "items": [{ "id": $url, "title": "Lỗi: " + e, "posterUrl": "", "backdropUrl": "" }],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html, $url) {
    return parseListResponse(html, $url);
}

function parseMovieDetail(html, url) {
    var lurl = url || "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "";
    var rating = "????";
    var servers = [];
    var category = "";
    var country = "";
    var lang = "";

    try {
        var info = _$(html).find(".dinfo").html();
        limg = _$(html).find(".adspruce-streamlink").find("img").attr("src") || _$(html).find(".poster img").attr("src");
        if (limg && limg.indexOf("http") === -1) {
            limg = BASEURL + (limg.startsWith('/') ? '' : '/') + limg;
        }
        
        lname = _$(html).find(".title").text() || _$(html).find("h1").text();
        ldes = _$(html).find("#info-film").text().replace(/\s\s/g, "");
        
        if (info) {
            status = _$(info).find("dt:content('Tình trạng')").next().text();
            year = _$(info).find("dt:content('Năm sản xuất')").next().text();
            cast = _$(info).find("dt:content('Diễn viên:')").next().text();
            duration = _$(info).find("dt:content('Thời lượng:')").next().text();
            category = _$(info).find("dt:content('Thể loại:')").next().text();
            country = _$(info).find("dt:content('Quốc gia:')").next().text();
            lang = _$(info).find("dt:content('Ngôn ngữ:')").next().text();
        }

        var $listserver = _$(html).find(".latest-episode").html();
        _$($listserver).find(".control-box").each(function(index, el) {
            var epi = [];
            var tap = 0;
            var nameserver = _$(el).find(".server-episode-block").text(); 
            this.find(".list-episode").find("a").each(function(index, Bl) {
                tap += 1;
                var ahref = this.attr("href"); 
                var name = this.text();
                if (ahref && ahref.indexOf("http") === -1) {
                    ahref = BASEURL + (ahref.startsWith('/') ? '' : '/') + ahref;
                }
                epi.push({ id: ahref, name: name, slug: "tap-" + tap });
            });
            if (epi.length > 0) {
                servers.push({
                   name: nameserver || "Server " + (index + 1),
                   episodes: epi
                });
            }
        });

        servers = sortEpisodesByName(servers);

        return JSON.stringify({
            id: url,
            title: lname.trim(),
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            servers: servers,
            quality: "HD",
            year: year,
            status: status,
            duration: duration,
            casts: cast,
            director: direc,
            country: country,
            category: category,
            lang: lang
        });
    } catch (e) {
        return JSON.stringify({
            id: lurl,
            title: "Lỗi tải chi tiết phim",
            posterUrl: limg,
            backdropUrl: limg,
            description: e.message || "",
            servers: [],
            quality: "HD",
            year: 2026,
            status: status,
            duration: duration,
            casts: cast,
            director: direc
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        var stream = "";
        var server = [];
        _$(html).find(".tip-change-server").find(".streaming-server").each(function() {
            var ahref = this.attr("data-link");
            var name = this.text();
            if (name === "HDC") {
                stream = ahref;
            }
            var $item = { link: ahref, name: name };
            server.push($item);
        });
        if (stream === "" && server.length > 0) {
            stream = server[0].link;
        }
        var customjs = textJS(server);
        return JSON.stringify({
            "url": stream,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?1",
                "Sec-Ch-Ua-Platform": '"Android"',
                "Accept": "*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "X-Requested-With": "com.android.chrome",
                "Custom-Js": customjs.trim()
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function sortEpisodesByName(data) {
    data.forEach(server => {
        if (server.episodes && Array.isArray(server.episodes)) {
            server.episodes.sort((a, b) => {
                const matchA = a.name.match(/Tập\s*(\d+)/i);
                const matchB = b.name.match(/Tập\s*(\d+)/i);
                
                const numA = matchA ? parseInt(matchA[1], 10) : 0;
                const numB = matchB ? parseInt(matchB[1], 10) : 0;
                
                return numA - numB;
            });
        }
    });
    return data;
}

function textJS($links) {
    return `
LINKVIDEO = ${JSON.stringify($links)}

SCRIPTURL = "https://script.google.com/macros/s/AKfycbwsvLFzWMdxvX9ZH-3wnP3GJzS58v0CtT_0mlEYeOz6cOsgen9IR3c6VPv_EssPXMFzwQ/exec?name=phimnganhdc&type=js"; 
const style = document.createElement('style');
var customcss = 'body { background: black; overflow: hidden; }body * {background: black;display:none!important}';
style.innerHTML = customcss;

(function() {
    const serverData = LINKVIDEO;
    let isRotated = false;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'page-main-wrapper';
    
    while (document.body.firstChild) {
        wrapper.appendChild(document.body.firstChild);
    }
    document.body.appendChild(wrapper);
    
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;
    const originalInsertBefore = document.body.insertBefore;
    
    document.body.appendChild = function(child) {
        if (child === loadingEl || child.tagName === 'STYLE') {
            return originalAppendChild.call(this, child);
        }
        return wrapper.appendChild(child);
    };
    
    document.body.removeChild = function(child) {
        if (wrapper.contains(child)) {
            return wrapper.removeChild(child);
        }
        if (child.parentNode === this) {
            return originalRemoveChild.call(this, child);
        }
        if (child.parentNode) {
            return child.parentNode.removeChild(child);
        }
        return child;
    };
    
    document.body.insertBefore = function(newChild, refChild) {
        if (refChild && wrapper.contains(refChild)) {
            return wrapper.insertBefore(newChild, refChild);
        }
        if (!refChild || refChild.parentNode === this) {
            return originalInsertBefore.call(this, newChild, refChild);
        }
        if (refChild && refChild.parentNode) {
            return refChild.parentNode.insertBefore(newChild, refChild);
        }
        return originalInsertBefore.call(this, newChild, refChild);
    };
    
    const style = document.createElement('style');
    style.textContent = 'html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden;}.page-main-wrapper {width: 100%;height: 100%;position: relative;}.page-main-wrapper.force-rotate {position: fixed !important;top: 50% !important;left: 50% !important;width: 100vh !important;  height: 100vw !important; transform: translate(-50%, -50%) rotate(-90deg) !important;transform-origin: center !important;z-index: 9996 !important;background: #000 !important;overflow: hidden !important;}.server-container { position: fixed; top: 15px; right: 15px; z-index: 10000; font-family: Arial, sans-serif; display: flex; flex-direction: row!important; gap: 8px; align-items: center;font-size:12px}.server-btn-wrapper { position: relative;}.server-main-btn, .server-rotate-btn {background: rgba(0, 0, 0, 0.6); color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); padding: 4px 4px!important; border-radius: 4px; cursor: pointer; backdrop-filter: blur(5px); font-weight: bold; min-width: 60px!important; text-align: center; box-sizing: border-box;}.server-main-btn:hover, .server-rotate-btn:hover { background: rgba(0, 0, 0, 0.8); border-color: rgba(255, 255, 255, 0.6);}.server-dropdown { display: none; position: absolute; top: 100%; right: 0; margin-top: 6px; background: rgba(20, 20, 20, 0.95); border: 1px solid #444; border-radius: 4px; min-width: 160px; overflow: hidden;}.server-dropdown.show { display: block;}.server-item { padding: 12px 15px; color: #ccc; cursor: pointer; transition: all 0.2s; text-align: left; font-size: 14px; border-left: 4px solid transparent;}.server-item:hover { background: #333; color: #fff;}.server-item.active { color: #fff; background: rgba(0, 255, 0, 0.15); border-left: 4px solid #00ff00; font-weight: bold;}.overlay-black { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: #000 !important; z-index: 9990 !important; display: none;}.iframe-wrapper { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 9991 !important; border: none !important; display: none; background: #000 !important;}.server-loading-box { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; display: none; text-align: center; color: #fff; pointer-events: none; font-family: Arial, sans-serif;}.server-spinner { width: 45px; height: 45px; border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #00ff00; border-radius: 50%; margin: 0 auto 12px auto; animation: server-spin 0.8s linear infinite;}@keyframes server-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);}}';
    document.head.appendChild(style);
    
    const loadingEl = document.createElement('div');
    loadingEl.className = 'server-loading-box';
    loadingEl.innerHTML = '<div class="server-spinner"></div><div>Đang tải server...</div>';
    originalAppendChild.call(document.body, loadingEl);
    
    const container = document.createElement('div');
    container.className = 'server-container';
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay-black';
    wrapper.appendChild(overlay);
    
    const iframeCache = {};
    
    function pauseAllVideos() {
        wrapper.querySelectorAll('video').forEach(v => v.pause());
    }
    
    function toggleRotation() {
        isRotated = !isRotated;
        btnRotate.innerText = isRotated ? 'Xoay' : 'Xoay';
        wrapper.classList.toggle('force-rotate', isRotated);
    }
    
    function switchServer(targetLink) {
        const isCurrentPage = window.location.href.includes(targetLink) || targetLink.includes(window.location.href);
        
        if (isCurrentPage) {
            overlay.style.display = 'none';
            loadingEl.style.display = 'none';
            wrapper.querySelectorAll('.iframe-wrapper').forEach(el => el.style.display = 'none');
            updateButtons(targetLink);
            return;
        }
        
        pauseAllVideos();
        overlay.style.display = 'block';
        wrapper.querySelectorAll('.iframe-wrapper').forEach(el => el.style.display = 'none');
        
        if (!iframeCache[targetLink]) {
            loadingEl.style.display = 'block';
            
            const iframe = document.createElement('iframe');
            iframe.className = 'iframe-wrapper';
            iframe.src = targetLink;
            iframe.allowFullscreen = true;
            iframe.allow = "autoplay; encrypted-media";
            
            iframe.onload = function() {
                loadingEl.style.display = 'none';
            };
            
            wrapper.appendChild(iframe);
            iframeCache[targetLink] = iframe;
        } else {
            loadingEl.style.display = 'none';
        }
        
        iframeCache[targetLink].style.display = 'block';
        updateButtons(targetLink);
    }
    
    function updateButtons(activeLink) {
        document.querySelectorAll('.server-item').forEach(el => {
            const link = el.getAttribute('data-link');
            el.classList.toggle('active', link === activeLink);
        });
    }
    
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'server-btn-wrapper';
    
    const btnMain = document.createElement('button');
    btnMain.className = 'server-main-btn';
    btnMain.innerText = 'Server';
    
    const dropdown = document.createElement('div');
    dropdown.className = 'server-dropdown';
    
    serverData.forEach(s => {
        const item = document.createElement('div');
        item.className = 'server-item';
        item.innerText = s.name;
        item.setAttribute('data-link', s.link);
        item.onclick = () => {
            switchServer(s.link);
            dropdown.classList.remove('show');
        };
        dropdown.appendChild(item);
    });
    
    btnMain.onclick = (e) => { 
        e.stopPropagation();
        dropdown.classList.toggle('show'); 
    };
    document.addEventListener('click', () => dropdown.classList.remove('show'));
    
    btnWrapper.appendChild(btnMain);
    btnWrapper.appendChild(dropdown);
    
    const btnRotate = document.createElement('button');
    btnRotate.className = 'server-rotate-btn';
    btnRotate.innerText = 'Xoay';
    btnRotate.onclick = (e) => {
        e.stopPropagation();
        toggleRotation();
    };
    
    container.appendChild(btnWrapper);
    container.appendChild(btnRotate);
    wrapper.appendChild(container);
    
    const currentUrl = window.location.href;
    const initialMatch = serverData.find(s => currentUrl.includes(s.link) || s.link.includes(currentUrl));
    if (initialMatch) {
        updateButtons(initialMatch.link);
    }
})();

function injectScriptAfterLoad(scriptUrl) {
    function doFetchAndInject() {
        fetch(SCRIPTURL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Mã phản hồi từ Server không tốt: ' + response.status);
                }
                return response.text(); 
            })
            .then(codeText => {
                const scriptElement = document.createElement('script');
                scriptElement.type = 'text/javascript';
                scriptElement.textContent = codeText;
                document.body.appendChild(scriptElement);
            })
            .catch(error => {});
    }
    
    if (document.readyState !== 'loading') {
        doFetchAndInject();
    } else {
        document.addEventListener('DOMContentLoaded', doFetchAndInject);
    }
}

function initCustomVideoFix() {
    if (SCRIPTURL && SCRIPTURL !== "undefined") {
        injectScriptAfterLoad(SCRIPTURL);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomVideoFix);
} else {
    initCustomVideoFix();
}
`;
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
/danh-sach/phim-hoan-thanh@@Phim Đã Full
/danh-sach/top-phim-ngay@@Top Trong Ngày
/the-loai/phim-ngan@@Phim Ngắn
/the-loai/phim-bo@@Phim Bộ
/quoc-gia/han-quoc@@Hàn Quốc
/quoc-gia/trung-quoc@@Trung Quốc
/quoc-gia/thai-lan@@Thái Lan
/the-loai/huyen-huyen@@Huyền Huyễn
/the-loai/tien-hiep@@Tiên Hiệp
/the-loai/xuyen-khong@@Xuyên Không
/the-loai/chuyen-the@@Chuyển Thể
/the-loai/boy-love@@Boylove
/the-loai/pha-an@@Phá Án
/the-loai/dan-quoc@@Dân Quốc
/the-loai/y-khoa@@Y Khoa
/the-loai/ngon-tinh@@Ngôn Tình
/the-loai/nguoc-luyen@@Ngược Luyến
/the-loai/nghe-nghiep@@Nghề Nghiệp
/the-loai/do-thi@@Đô Thị
/the-loai/hien-dai@@Hiện Đại
/the-loai/toi-pham@@Tội Phạm
/the-loai/lang-man@@Lãng Mạn
/the-loai/phim-hai@@Phim Hài
/the-loai/khoa-hoc-vien-tuong@@Khoa Học Viễn Tưởng
/the-loai/gia-tuong@@Giả Tưởng
/the-loai/gay-can@@Gây Cấn
/the-loai/lich-su@@Lịch Sử
/the-loai/xuyen-sach@@Xuyên Sách
/the-loai/he-thong@@Hệ Thống
/the-loai/bao-thu@@Báo Thù
/the-loai/ky-ao@@Kỳ Ảo
/the-loai/ngot-sung@@Ngọt Sủng
/the-loai/va-mat-tra-nam@@Vả Mặt Tra Nam
/the-loai/trong-sinh@@Trọng Sinh
/the-loai/co-con@@Có Con
/the-loai/cuoi-truoc-yeu-sau@@Cưới Trước Yêu Sau
/the-loai/truy-the@@Truy Thê
/the-loai/hanh-dong@@Hành Động
/the-loai/hai-huoc@@Hài Hước
/the-loai/hoc-duong@@Học Đường
/the-loai/co-trang@@Cổ Trang
/the-loai/kinh-di@@Kinh Dị
/the-loai/tinh-cam@@Tình Cảm
/the-loai/vo-thuat@@Võ Thuật
/the-loai/phieu-luu@@Phiêu Lưu
/the-loai/vien-tuong@@Viễn Tưởng
/the-loai/chinh-kich@@Chính Kịch
/the-loai/the-thao@@Thể Thao
/the-loai/am-nhac@@Âm Nhạc
/the-loai/khoa-hoc@@Khoa Học
/the-loai/tam-ly@@Tâm Lý
/the-loai/hinh-su@@Hình Sự
/the-loai/bi-an@@Bí Ẩn
/the-loai/gia-dinh@@Gia Đình
/the-loai/hoat-hinh@@Hoạt Hình
/the-loai/tv-shows@@TV Shows
`;
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}

function _$(htmlOrBlock) {
    if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {
        return htmlOrBlock;
    }
    var instance = {
        sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',
        elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),
        find: function(selector) {
            var results = [];
            var contentFilter = "";
            if (selector.indexOf(":content(") !== -1) {
                var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);
                if (contentMatch) {
                    contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";
                    selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, "");
                }
            }
            var attrNameFilter = "";
            var attrValueFilter = "";
            var hasAttrFilter = false;
            var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);
            if (attrMatch) {
                hasAttrFilter = true;
                attrNameFilter = attrMatch[1];
                attrValueFilter = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
                selector = selector.replace(/\[.*?\]/, "");
            }
            var notSelector = "";
            if (selector.indexOf(":not(") !== -1) {
                var notMatch = selector.match(/:not\(([^)]+)\)/);
                if (notMatch) {
                    notSelector = notMatch[1];
                    selector = selector.replace(/:not\([^)]+\)/, "");
                }
            }
            var isFirstFilter = selector.indexOf(":first") !== -1;
            var isLastFilter = selector.indexOf(":last") !== -1;
            selector = selector.replace(/:first|:last/g, "");

            var isClass = selector.indexOf('.') === 0;
            var isId = selector.indexOf('#') === 0;
            var isAttrOnly = (selector === "" && hasAttrFilter);

            var targetClasses = [];
            var targetId = "";
            var targetTagName = "";

            if (isClass) {
                targetClasses = selector.split('.').filter(function(c) { return c.length > 0; });
            } else if (isId) {
                targetId = selector.substring(1);
            } else if (!isAttrOnly) {
                targetTagName = selector.toLowerCase();
            }

            for (var i = 0; i < this.elements.length; i++) {
                var currentHtml = this.elements[i];
                var pos = 0;
                var subResults = [];

                while ((pos = currentHtml.indexOf('<', pos)) !== -1) {
                    if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') {
                        pos++;
                        continue;
                    }
                    var endOpenTag = currentHtml.indexOf('>', pos);
                    if (endOpenTag === -1) break;

                    var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1);
                    var spacePos = fullOpenTag.indexOf(' ');
                    var currentTagName = "";
                    if (spacePos === -1) {
                        currentTagName = fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase();
                    } else {
                        currentTagName = fullOpenTag.substring(1, spacePos).toLowerCase();
                    }

                    var isMatched = false;
                    if (isClass) {
                        var classMatchStr = "";
                        var classPos = fullOpenTag.indexOf('class="');
                        if (classPos !== -1) {
                            var startQuote = classPos + 7;
                            classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            classPos = fullOpenTag.indexOf("class='");
                            if (classPos !== -1) {
                                var startQuote = classPos + 7;
                                classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (classMatchStr) {
                            var currentClasses = classMatchStr.split(/\s+/);
                            var matchCount = 0;
                            for (var c = 0; c < targetClasses.length; c++) {
                                if (currentClasses.indexOf(targetClasses[c]) !== -1) matchCount++;
                            }
                            if (matchCount === targetClasses.length) isMatched = true;
                        }
                    } else if (isId) {
                        var idMatchStr = "";
                        var idPos = fullOpenTag.indexOf('id="');
                        if (idPos !== -1) {
                            var startQuote = idPos + 4;
                            idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            idPos = fullOpenTag.indexOf("id='");
                            if (idPos !== -1) {
                                var startQuote = idPos + 4;
                                idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (idMatchStr === targetId) isMatched = true;
                    } else if (isAttrOnly) {
                        isMatched = true;
                    } else {
                        if (currentTagName === targetTagName) isMatched = true;
                    }

                    if (isMatched && hasAttrFilter) {
                        var searchStr1 = attrNameFilter + '="' + attrValueFilter + '"';
                        var searchStr2 = attrNameFilter + "='" + attrValueFilter + "'";
                        if (fullOpenTag.indexOf(searchStr1) === -1 && fullOpenTag.indexOf(searchStr2) === -1) {
                            isMatched = false;
                        }
                    }

                    if (isMatched) {
                        var startTagPos = pos;
                        var endTagPos = endOpenTag + 1;
                        var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta'];

                        if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {
                            var depth = 1;
                            var scanPos = endOpenTag + 1;
                            var openStr = '<' + currentTagName;
                            var closeStr = '</' + currentTagName + '>';

                            while (depth > 0 && scanPos < currentHtml.length) {
                                var nextOpen = currentHtml.indexOf(openStr, scanPos);
                                var nextClose = currentHtml.indexOf(closeStr, scanPos);
                                if (nextClose === -1) { scanPos = currentHtml.length; break; }

                                if (nextOpen !== -1 && nextOpen < nextClose) {
                                    depth++;
                                    scanPos = nextOpen + openStr.length;
                                } else {
                                    depth--;
                                    scanPos = nextClose + closeStr.length;
                                    if (depth === 0) endTagPos = nextClose + closeStr.length;
                                }
                            }
                        }

                        var foundBlock = currentHtml.substring(startTagPos, endTagPos);

                        if (contentFilter) {
                            var pureText = foundBlock.replace(/<[^>]+>/g, "").trim();
                            if (pureText.indexOf(contentFilter) === -1) {
                                pos = endTagPos;
                                continue;
                            }
                        }

                        subResults.push(foundBlock);
                        pos = endTagPos;
                    } else {
                        pos++;
                    }
                }

                if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]];
                if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]];

                results = results.concat(subResults);
            }
            var newInstance = _$(results);
            newInstance.sourceHtml = this.sourceHtml || currentHtml;
            return newInstance;
        },
        each: function(callback) {
            for (var i = 0; i < this.elements.length; i++) {
                var childInstance = _$(this.elements[i]);
                childInstance.sourceHtml = this.sourceHtml;
                callback.call(childInstance, i, this.elements[i]);
            }
            return this;
        },
        eq: function(index) {
            if (index < 0) index = this.elements.length + index;
            var matchedElement = this.elements[index];
            this.elements = matchedElement ? [matchedElement] : [];
            return this;
        },
        attr: function(attrName) {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var searchStr = attrName + '="';
            var pos = elem.indexOf(searchStr);
            if (pos === -1) {
                searchStr = attrName + "='";
                pos = elem.indexOf(searchStr);
            }
            if (pos === -1) return "";
            var start = pos + searchStr.length;
            var quoteType = elem.charAt(start - 1);
            var end = elem.indexOf(quoteType, start);
            return end === -1 ? "" : elem.substring(start, end);
        },
        html: function() {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var start = elem.indexOf('>') + 1;
            var end = elem.lastIndexOf('</');
            if (start > 0 && end > start) return elem.substring(start, end);
            return "";
        },
        text: function() {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var start = elem.indexOf('>') + 1;
            var end = elem.lastIndexOf('</');
            if (start > 0 && end > start) {
                var content = elem.substring(start, end);
                return content.replace(/<\/?[^>]+(>|$)/g, "").trim();
            }
            return "";
        }
    };
    return instance;
};
