// src/utils/pdfHtml.ts
// Generates self-contained HTML pages that render PDFs via PDF.js (CDN).
// Optimized with:
// 1. Interactive Swiper (follows finger in portrait)
// 2. Windowed Rendering (only renders active +/- 2 pages to save RAM)
// 3. HiDPI support (devicePixelRatio)

const PDFJS_VERSION = '3.11.174';
const PDFJS_CDN  = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
const CMAPS_URL  = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`;

const VIEWER_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { background: #18082b; color: white; overflow: hidden; height: 100vh; width: 100vw; }
  #status, #error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 100vh;
    font: 15px -apple-system, sans-serif; gap: 14px;
  }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(167,139,250,0.2);
    border-top-color: #a78bfa; border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #error { display: none; color: #f87171; padding: 24px; text-align: center; }
  #pages { 
    display: flex; 
    flex-direction: row; 
    flex-wrap: nowrap; 
    height: 100%;
    will-change: transform;
  }
  .pageWrap {
    flex-shrink: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #18082b;
    overflow: hidden;
  }
  canvas { 
    display: block; 
    max-width: 100%; 
    max-height: 100%; 
    object-fit: contain;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }
  /* Landscape overrides */
  @media (orientation: landscape) {
    body { overflow: auto; height: auto; }
    #pages { flex-wrap: wrap; justify-content: center; padding: 10px; gap: 10px; }
    .pageWrap { width: 48vw; height: auto; min-height: 200px; }
  }
`;

const VIEWER_BODY = `
  <div id="status">
    <div class="spinner"></div>
    <span>Opening PDF…</span>
  </div>
  <div id="error">
    <span style="font-size:40px">⚠️</span>
    <strong>Could not load PDF</strong>
    <span id="errMsg" style="color:#fca5a5;font-size:13px"></span>
  </div>
  <div id="pages"></div>
`;

function viewerScript(pdfSourceExpr: string): string {
  return `
    pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_CDN}/pdf.worker.min.js';

    var container  = document.getElementById('pages');
    var pdfDoc     = null;
    var activePage = 1;
    var rendering  = {}; 
    var rendered   = {}; 
    var touchStartX = 0;
    var baseTranslateX = 0;
    var isTransitioning = false;

    var lastTapTime = 0;

    // Zoom & Pan State
    var activeScale = 1;
    var panX = 0;
    var panY = 0;
    var startPinchDist = 0;
    var startScale = 1;

    function post(data) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch(e) {}
    }

    function isPortrait() {
        return window.innerHeight > window.innerWidth;
    }

    /* Windowed Rendering Logic (RAM Saver) */
    function updateWindow() {
        if (!pdfDoc) return;
        var range = 2; // Keep 2 pages before/after
        var start = Math.max(1, activePage - range);
        var end   = Math.min(pdfDoc.numPages, activePage + range);

        for (var i = start; i <= end; i++) { renderPage(i); }
        for (var p in rendered) {
            var num = parseInt(p);
            if (num < start || num > end) killPage(num);
        }
    }

    function renderPage(num) {
        if (!pdfDoc || rendered[num] || rendering[num]) return;
        rendering[num] = true;
        var wrap = document.getElementById('page-wrap-' + num);
        if (!wrap) return;

        pdfDoc.getPage(num).then(function(page) {
            var dpr = window.devicePixelRatio || 1;
            var portrait = isPortrait();
            var winW = portrait ? window.innerWidth : (window.innerWidth / 2 - 15);
            var vp1 = page.getViewport({ scale: 1 });
            var logScale = winW / vp1.width;
            var vp = page.getViewport({ scale: logScale * dpr });

            var canvas = document.createElement('canvas');
            canvas.id = 'canvas-' + num;
            canvas.width = vp.width;
            canvas.height = vp.height;
            canvas.style.width = '100%';
            canvas.style.height = portrait ? 'auto' : (vp.height / dpr) + 'px';
            canvas.style.transformOrigin = 'center center';
            canvas.style.transition = 'transform 0.1s ease-out'; // Smooth panning

            wrap.appendChild(canvas);
            var task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
            task.promise.then(function() {
                rendered[num] = true;
                delete rendering[num];
                page.cleanup();
            });
        });
    }

    function killPage(num) {
        var canvas = document.getElementById('canvas-' + num);
        if (canvas) {
            canvas.width = 1; canvas.height = 1;
            canvas.remove();
        }
        delete rendered[num];
        delete rendering[num];
    }

    function resetZoom() {
        activeScale = 1;
        panX = 0;
        panY = 0;
        var canvas = document.getElementById('canvas-' + activePage);
        if (canvas) canvas.style.transform = 'translate(0,0) scale(1)';
    }

    function goToPage(num, instant) {
        if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;
        resetZoom();

        activePage = num;
        if (isPortrait()) {
            isTransitioning = !instant;
            container.style.transition = instant ? 'none' : 'transform 0.3s ease-out';
            baseTranslateX = -(activePage - 1) * window.innerWidth;
            container.style.transform = 'translateX(' + baseTranslateX + 'px)';
        } else {
            var wrap = document.getElementById('page-wrap-' + activePage);
            if (wrap) wrap.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
        }
        post({ type: 'page', current: activePage, total: pdfDoc.numPages });
        updateWindow();
    }

    container.addEventListener('transitionend', function() { isTransitioning = false; });

    function getDist(ts) {
        var dx = ts[0].pageX - ts[1].pageX;
        var dy = ts[0].pageY - ts[1].pageY;
        return Math.sqrt(dx*dx + dy*dy);
    }

    /* Gesture & Interaction Handler */
    window.addEventListener('touchstart', function(e) {
        if (!isPortrait() || isTransitioning) return;
        
        // Double-tap Prevention
        var now = Date.now();
        if (now - lastTapTime < 300) {
            e.preventDefault(); 
            resetZoom();
        }
        lastTapTime = now;

        if (e.touches.length === 2) {
            startPinchDist = getDist(e.touches);
            startScale = activeScale;
        } else {
            touchStartX = e.touches[0].screenX;
            touchStartY = e.touches[0].screenY;
        }
        container.style.transition = 'none';
    }, { passive: false });

    window.addEventListener('touchmove', function(e) {
        if (!isPortrait() || isTransitioning) return;

        if (e.touches.length === 2) {
            // Pinch-to-Zoom
            e.preventDefault();
            var dist = getDist(e.touches);
            activeScale = Math.min(4, Math.max(1, startScale * (dist / startPinchDist)));
            var canvas = document.getElementById('canvas-' + activePage);
            if (canvas) canvas.style.transform = 'translate('+panX+'px,'+panY+'px) scale('+activeScale+')';
        } else if (activeScale > 1) {
            // Pan while zoomed
            e.preventDefault();
            var dx = e.touches[0].screenX - touchStartX;
            var dy = e.touches[0].screenY - touchStartY;
            panX += dx;
            panY += dy;
            touchStartX = e.touches[0].screenX;
            touchStartY = e.touches[0].screenY;
            var canvas = document.getElementById('canvas-' + activePage);
            if (canvas) canvas.style.transform = 'translate('+panX+'px,'+panY+'px) scale('+activeScale+')';
        } else {
            // Normal Swipe
            var diff = e.touches[0].screenX - touchStartX;
            if ((activePage === 1 && diff > 0) || (activePage === pdfDoc.numPages && diff < 0)) diff *= 0.3;
            container.style.transform = 'translateX(' + (baseTranslateX + diff) + 'px)';
        }
    }, { passive: false });

    window.addEventListener('touchend', function(e) {
        if (!isPortrait() || isTransitioning) return;
        
        if (activeScale > 1 && e.touches.length === 0) {
            resetZoom();
            return;
        }

        if (activeScale > 1) return;
        
        var diff = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(diff) > 80) {
            if (diff > 0 && activePage > 1) goToPage(activePage - 1);
            else if (diff < 0 && activePage < pdfDoc.numPages) goToPage(activePage + 1);
            else goToPage(activePage);
        } else {
            goToPage(activePage);
        }
    }, { passive: true });

    /* Initial Load */
    pdfjsLib.getDocument(${pdfSourceExpr}).promise.then(function(pdf) {
        pdfDoc = pdf;
        document.getElementById('status').style.display = 'none';
        post({ type: 'loaded', pages: pdf.numPages });
        
        for (var i = 1; i <= pdf.numPages; i++) {
            var wrap = document.createElement('div');
            wrap.className = 'pageWrap';
            wrap.id = 'page-wrap-' + i;
            container.appendChild(wrap);
        }
        goToPage(activePage, true);
    }).catch(function(err) {
        document.getElementById('status').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
        document.getElementById('errMsg').textContent = err.message;
    });

    window.addEventListener('resize', function() { location.reload(); });
  `;
}

function wrapHtml(script: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>${VIEWER_STYLE}</style>
</head>
<body>
  ${VIEWER_BODY}
  <script src="${PDFJS_CDN}/pdf.min.js"></script>
  <script>${script}</script>
</body>
</html>`;
}

export function buildPdfHtml(remoteUrl: string): string {
  const src = `{url:decodeURIComponent('${encodeURIComponent(remoteUrl)}'),cMapUrl:'${CMAPS_URL}',cMapPacked:true}`;
  return wrapHtml(viewerScript(src));
}

export function buildLocalPdfHtml(relativePdfPath: string): string {
  const src = `{url:'${relativePdfPath}',cMapUrl:'${CMAPS_URL}',cMapPacked:true}`;
  return wrapHtml(viewerScript(src));
}
