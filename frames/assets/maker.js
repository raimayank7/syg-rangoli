/* Photo frame maker and collage maker. Photos are read by the browser and drawn on a canvas on this device. Nothing is uploaded. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var SIZES = { sq: [1080, 1080], po: [1080, 1350], st: [1080, 1920], la: [1350, 1080], pr: [1200, 1800] };
  var SERIF = 'Georgia,"Times New Roman","Noto Serif Devanagari","Nirmala UI",serif', SANS = 'Inter,"Segoe UI",Roboto,"Noto Sans Devanagari","Nirmala UI",Arial,sans-serif';
  var TAU = Math.PI * 2;

  function rnd(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function grad(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s, i) { g.addColorStop(i / (stops.length - 1), s); }); return g; }
  function dot(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function petal(c, x, y, r, a, col) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.ellipse(r * .9, 0, r, r * .42, 0, 0, TAU); c.fill(); c.restore(); }
  function flower(c, x, y, r, n, col, mid) { for (var i = 0; i < n; i++) petal(c, x, y, r, i * TAU / n, col); dot(c, x, y, r * .45, mid); }
  function heart(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.3, y, x - s * .6, y - s, x, y - s * .3); c.bezierCurveTo(x + s * .6, y - s, x + s * 1.3, y, x, y + s * .9); c.fill(); }
  function star(c, x, y, r, col, n) { n = n || 5; c.fillStyle = col; c.beginPath(); for (var i = 0; i < 2 * n; i++) { var rr2 = i % 2 ? r * .42 : r, a = -Math.PI / 2 + i * Math.PI / n; c.lineTo(x + rr2 * Math.cos(a), y + rr2 * Math.sin(a)); } c.closePath(); c.fill(); }
  function diya(c, x, y, s) {
    var g = c.createRadialGradient(x, y - s * 1.1, 0, x, y - s * 1.1, s * 2); g.addColorStop(0, 'rgba(253,224,71,.55)'); g.addColorStop(1, 'rgba(253,224,71,0)'); c.fillStyle = g; c.fillRect(x - s * 2, y - s * 3.1, s * 4, s * 4);
    c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(x, y - s * 1.9); c.quadraticCurveTo(x + s * .5, y - s * .9, x, y - s * .35); c.quadraticCurveTo(x - s * .5, y - s * .9, x, y - s * 1.9); c.fill();
    c.fillStyle = '#c2410c'; c.beginPath(); c.moveTo(x - s * 1.15, y - s * .35); c.quadraticCurveTo(x, y + s * 1.1, x + s * 1.15, y - s * .35); c.closePath(); c.fill();
  }
  function balloon(c, x, y, s, col) {
    c.strokeStyle = '#9ca3af'; c.lineWidth = s * .04; c.beginPath(); c.moveTo(x, y + s); c.quadraticCurveTo(x + s * .3, y + s * 2, x - s * .1, y + s * 3); c.stroke();
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, s * .8, s, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x - s * .3, y - s * .4, s * .14, s * .26, .5, 0, TAU); c.fill();
  }
  function confetti(c, W, H, n, cols, seed, edge) {
    var r = rnd(seed), u = W / 1080;
    for (var i = 0; i < n; i++) {
      var x = r() * W, y = r() * H;
      if (edge && x > edge && x < W - edge && y > edge && y < H - edge) { if (r() < .5) x = r() < .5 ? r() * edge : W - r() * edge; else y = r() < .5 ? r() * edge : H - r() * edge; }
      c.save(); c.translate(x, y); c.rotate(r() * 3); c.fillStyle = cols[i % cols.length]; c.fillRect(0, 0, 16 * u, 7 * u); c.restore();
    }
  }
  function line(c, text, x, y, maxW, size, font, col) {
    if (!text) return;
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
    do { c.font = font.replace('$', Math.round(size)); size *= .94; } while (c.measureText(text).width > maxW && size > 12);
    c.fillText(text, x, y);
  }

  /* a photo slot: image, zoom, offset (-1..1 of the spare room) */
  function Slot(im) { this.im = im || null; this.z = 1; this.x = 0; this.y = 0; }
  function place(c, s, x, y, w, h, shape, r) {
    c.save();
    if (shape === 'circle') { c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, TAU); c.closePath(); } else rr(c, x, y, w, h, r || 0);
    c.clip();
    if (s && s.im) {
      var im = s.im, sc = Math.max(w / im.naturalWidth, h / im.naturalHeight) * s.z, dw = im.naturalWidth * sc, dh = im.naturalHeight * sc, mx = (dw - w) / 2, my = (dh - h) / 2;
      s.x = Math.max(-1, Math.min(1, s.x)); s.y = Math.max(-1, Math.min(1, s.y)); s.mx = mx; s.my = my;
      c.drawImage(im, x - mx + s.x * mx, y - my + s.y * my, dw, dh);
    } else {
      c.fillStyle = grad(c, x, y, x, y + h, ['#cbd5e1', '#94a3b8']); c.fillRect(x, y, w, h);
      var m = Math.min(w, h); c.fillStyle = 'rgba(255,255,255,.75)';
      c.beginPath(); c.arc(x + w / 2, y + h * .42, m * .14, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(x + w / 2, y + h * .82, m * .27, m * .2, 0, Math.PI, TAU); c.fill();
    }
    c.restore();
  }
  function load(files, each) {
    [].forEach.call(files, function (f) {
      if (!/^image\//.test(f.type)) { SYG.toast('Please choose picture files'); return; }
      var im = new Image(); im.onload = function () { each(im); }; im.onerror = function () { SYG.toast('That picture could not be opened'); }; im.src = URL.createObjectURL(f);
    });
  }
  function download(cv, name) {
    cv.toBlob(function (b) {
      var a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      SYG.toast('Picture saved to your downloads');
    }, 'image/png');
  }
  function shareCv(cv, name) {
    cv.toBlob(function (b) {
      var f = new File([b], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(function () {}); else download(cv, name);
    }, 'image/png');
  }
  /* drag on the canvas to move the photo under the finger */
  function drag(cv, pick, redraw) {
    var cur = null, px = 0, py = 0;
    cv.addEventListener('pointerdown', function (e) {
      var b = cv.getBoundingClientRect(), k = cv.width / b.width; cur = pick((e.clientX - b.left) * k, (e.clientY - b.top) * k); px = e.clientX; py = e.clientY;
      if (cur) { cv.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!cur || !cur.im) return;
      var k = cv.width / cv.getBoundingClientRect().width, dx = (e.clientX - px) * k, dy = (e.clientY - py) * k; px = e.clientX; py = e.clientY;
      if (cur.mx > 1) cur.x += dx / cur.mx; if (cur.my > 1) cur.y += dy / cur.my; redraw();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { cur = null; }); });
  }

  /* ------------------------------------------------------------ frames. Each draws the whole picture: f(c, W, H, slot, caption) */
  function basic(c, W, H, s, cap, o) {   // o: bg, m, capH, ink, font, r, always (keep the caption band even when empty)
    var u = W / 1080, m = o.m * u, ch = (cap || o.always) ? o.capH * u : 0;
    c.fillStyle = typeof o.bg === 'function' ? o.bg(c, W, H) : o.bg; c.fillRect(0, 0, W, H);
    var R = { x: m, y: m + (o.top || 0) * u, w: W - 2 * m, h: H - 2 * m - ch - (o.top || 0) * u - (o.bottom || 0) * u };
    if (o.under) o.under(c, W, H, R, u);
    place(c, s, R.x, R.y, R.w, R.h, null, (o.r || 0) * u);
    if (o.over) o.over(c, W, H, R, u);
    if (cap) line(c, cap, W / 2, R.y + R.h + ch / 2 + (o.capDy || 0) * u, W - 2 * m - 40 * u, (o.size || 58) * u, (o.font || 'bold $px ' + SERIF), o.ink);
    return R;
  }
  var HOLI = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];
  var FRAMES = [
    { id: 'white', name: 'White border', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) { basic(c, W, H, s, cap, { bg: '#ffffff', m: 44, capH: 120, ink: '#1f2937' }); } },
    { id: 'polaroid', name: 'Instant photo', tag: 'Simple', cap: 'A day to remember', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#fbfbf8', m: 64, capH: 210, always: 1, ink: '#374151', font: 'italic $px ' + SERIF, size: 62, over: function (c2, W2, H2, R, u) { c2.strokeStyle = 'rgba(0,0,0,.12)'; c2.lineWidth = 2 * u; c2.strokeRect(R.x, R.y, R.w, R.h); c2.strokeRect(u, u, W2 - 2 * u, H2 - 2 * u); } }); } },
    { id: 'gallery', name: 'Gallery black', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#111111', m: 96, capH: 110, ink: '#f5f5f4', font: '$px ' + SERIF, size: 48, capDy: 30, over: function (c2, W2, H2, R, u) { c2.strokeStyle = '#f5f5f4'; c2.lineWidth = 3 * u; c2.strokeRect(R.x - 14 * u, R.y - 14 * u, R.w + 28 * u, R.h + 28 * u); } }); } },
    { id: 'gold', name: 'Classic gold', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: function (c2, W2, H2) { return grad(c2, 0, 0, W2, H2, ['#a8780a', '#f6e27a', '#b8860b', '#f6e27a', '#a8780a']); }, m: 78, capH: 110, ink: '#3b2a00', capDy: 26,
        over: function (c2, W2, H2, R, u) { c2.strokeStyle = '#5c4300'; c2.lineWidth = 4 * u; c2.strokeRect(R.x, R.y, R.w, R.h); c2.strokeRect(22 * u, 22 * u, W2 - 44 * u, H2 - 44 * u); } }); } },
    { id: 'wood', name: 'Wooden', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#7a4a21', m: 84, capH: 110, ink: '#fdf3d7', capDy: 28, under: function (c2, W2, H2, R, u) {
        var r = rnd(5); c2.strokeStyle = 'rgba(40,20,5,.35)';
        for (var i = 0; i < 70; i++) { var y = r() * H2; c2.lineWidth = (1 + r() * 3) * u; c2.beginPath(); c2.moveTo(0, y); c2.bezierCurveTo(W2 * .3, y + (r() - .5) * 30 * u, W2 * .6, y + (r() - .5) * 30 * u, W2, y + (r() - .5) * 20 * u); c2.stroke(); }
        c2.fillStyle = '#3b2210'; c2.fillRect(R.x - 10 * u, R.y - 10 * u, R.w + 20 * u, R.h + 20 * u); } }); } },
    { id: 'soft', name: 'Soft pastel', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: function (c2, W2, H2) { return grad(c2, 0, 0, W2, H2, ['#fde2e4', '#e2ece9', '#dfe7fd']); }, m: 90, capH: 120, r: 48, ink: '#475569', capDy: 30,
        under: function (c2, W2, H2, R, u) { c2.save(); c2.shadowColor = 'rgba(0,0,0,.25)'; c2.shadowBlur = 40 * u; c2.shadowOffsetY = 16 * u; c2.fillStyle = '#fff'; rr(c2, R.x, R.y, R.w, R.h, 48 * u); c2.fill(); c2.restore(); } }); } },
    { id: 'floral', name: 'Flowers', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#fffaf0', m: 80, capH: 130, ink: '#9a3412', capDy: 26, over: function (c2, W2, H2, R, u) {
        [[R.x, R.y], [R.x + R.w, R.y], [R.x, R.y + R.h], [R.x + R.w, R.y + R.h]].forEach(function (p, i) {
          flower(c2, p[0], p[1], 34 * u, 8, i % 2 ? '#f472b6' : '#fb923c', '#fde68a'); flower(c2, p[0] + (i % 2 ? -1 : 1) * 78 * u, p[1] + (i < 2 ? -6 : 6) * u, 20 * u, 6, '#fbbf24', '#fff'); flower(c2, p[0] + (i % 2 ? 6 : -6) * u, p[1] + (i < 2 ? 1 : -1) * 78 * u, 20 * u, 6, '#f9a8d4', '#fff');
          petal(c2, p[0], p[1], 30 * u, (i < 2 ? .9 : -.9) + (i % 2 ? 1.4 : 0), '#4ade80'); }); } }); } },
    { id: 'film', name: 'Film strip', tag: 'Simple', cap: '', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#111111', m: 130, capH: 100, ink: '#e5e5e5', font: '$px ' + SANS, size: 44, capDy: 40, over: function (c2, W2, H2, R, u) {
        c2.fillStyle = '#e5e5e5'; for (var y = 40 * u; y < H2 - 80 * u; y += 92 * u) { rr(c2, 38 * u, y, 54 * u, 60 * u, 10 * u); c2.fill(); rr(c2, W2 - 92 * u, y, 54 * u, 60 * u, 10 * u); c2.fill(); } } }); } },
    { id: 'birthday', name: 'Birthday', tag: 'Occasions', cap: 'Happy Birthday', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#fff7e6', m: 90, capH: 160, r: 30, ink: '#db2777', size: 76, capDy: 24, under: function (c2, W2, H2) { confetti(c2, W2, H2, 110, HOLI, 11, W2 * .09); },
        over: function (c2, W2, H2, R, u) { [[70, 110, 0], [165, 60, 1], [250, 125, 2]].forEach(function (b) { balloon(c2, b[0] * u, b[1] * u, 58 * u, HOLI[b[2]]); balloon(c2, W2 - b[0] * u, b[1] * u, 58 * u, HOLI[b[2] + 3]); }); } }); } },
    { id: 'hearts', name: 'Hearts', tag: 'Occasions', cap: 'Happy Anniversary', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#ffe4ec', m: 96, capH: 150, r: 24, ink: '#be123c', font: 'italic bold $px ' + SERIF, size: 68, capDy: 24, under: function (c2, W2, H2, R, u) {
        var r = rnd(21), n = 46, i, x, y; for (i = 0; i < n; i++) { if (i % 2) { x = r() * W2; y = r() < .5 ? r() * 90 * u : H2 - r() * 90 * u; } else { y = r() * H2; x = r() < .5 ? r() * 90 * u : W2 - r() * 90 * u; } heart(c2, x, y, (14 + r() * 22) * u, ['#fb7185', '#f43f5e', '#fda4af'][i % 3]); } } }); } },
    { id: 'wedding', name: 'Wedding', tag: 'Occasions', cap: 'Shubh Vivah', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: function (c2, W2, H2) { return grad(c2, 0, 0, 0, H2, ['#651224', '#3a0a14']); }, m: 100, capH: 150, ink: '#e7c873', font: 'italic bold $px ' + SERIF, size: 70, capDy: 22, over: function (c2, W2, H2, R, u) {
        c2.strokeStyle = '#e7c873'; c2.lineWidth = 4 * u; c2.strokeRect(34 * u, 34 * u, W2 - 68 * u, H2 - 68 * u); c2.lineWidth = 1.5 * u; c2.strokeRect(50 * u, 50 * u, W2 - 100 * u, H2 - 100 * u); c2.lineWidth = 3 * u; c2.strokeRect(R.x, R.y, R.w, R.h);
        [[0, 0, 1, 1], [W2, 0, -1, 1], [0, H2, 1, -1], [W2, H2, -1, -1]].forEach(function (k) { c2.save(); c2.translate(k[0], k[1]); c2.scale(k[2], k[3]); c2.lineWidth = 2 * u; for (var q = 50; q <= 110; q += 30) { c2.beginPath(); c2.arc(50 * u, 50 * u, q * u, 0, Math.PI / 2); c2.stroke(); } c2.restore(); }); } }); } },
    { id: 'baby', name: 'New baby', tag: 'Occasions', cap: 'Welcome, little one', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#e0f2fe', m: 96, capH: 150, r: 60, ink: '#0369a1', size: 64, capDy: 22, under: function (c2, W2, H2, R, u) {
        var r = rnd(31); for (var i = 0; i < 26; i++) star(c2, r() * W2, r() < .5 ? r() * 90 * u : H2 - r() * 150 * u, (10 + r() * 14) * u, i % 2 ? '#fde047' : '#fda4af');
        [[150, 70], [W2 / u - 170, 60]].forEach(function (p) { dot(c2, p[0] * u, p[1] * u, 34 * u, '#fff'); dot(c2, (p[0] + 40) * u, (p[1] - 14) * u, 42 * u, '#fff'); dot(c2, (p[0] + 86) * u, p[1] * u, 32 * u, '#fff'); }); } }); } },
    { id: 'congrats', name: 'Congratulations', tag: 'Occasions', cap: 'Congratulations', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#0f172a', m: 96, capH: 150, ink: '#fcd34d', size: 70, capDy: 22, under: function (c2, W2, H2) { confetti(c2, W2, H2, 130, ['#fcd34d', '#fde68a', '#f59e0b', '#ffffff'], 41, W2 * .09); },
        over: function (c2, W2, H2, R, u) { c2.strokeStyle = '#fcd34d'; c2.lineWidth = 4 * u; c2.strokeRect(R.x, R.y, R.w, R.h); } }); } },
    { id: 'memory', name: 'In loving memory', tag: 'Occasions', cap: 'In loving memory', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#f5f5f4', m: 110, capH: 170, ink: '#1c1917', font: '$px ' + SERIF, size: 58, capDy: 30, over: function (c2, W2, H2, R, u) {
        c2.strokeStyle = '#1c1917'; c2.lineWidth = 3 * u; c2.strokeRect(40 * u, 40 * u, W2 - 80 * u, H2 - 80 * u); c2.lineWidth = 1.5 * u; c2.strokeRect(R.x - 12 * u, R.y - 12 * u, R.w + 24 * u, R.h + 24 * u);
        c2.fillStyle = '#1c1917'; c2.fillRect(W2 / 2 - 60 * u, R.y + R.h + 34 * u, 120 * u, 2 * u); } }); } },
    { id: 'diwali', name: 'Diwali', tag: 'Festivals', cap: 'Happy Diwali', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: function (c2, W2, H2) { return grad(c2, 0, 0, 0, H2, ['#3b0d0d', '#7c2d12']); }, m: 90, top: 30, capH: 200, always: 1, ink: '#fde68a', size: 70, capDy: -6, over: function (c2, W2, H2, R, u) {
        c2.strokeStyle = '#fbbf24'; c2.lineWidth = 4 * u; c2.strokeRect(R.x, R.y, R.w, R.h);
        for (var i = 0; i <= 14; i++) flower(c2, 60 * u + i * (W2 - 120 * u) / 14, 64 * u + (i % 2) * 14 * u, 22 * u, 8, i % 2 ? '#f59e0b' : '#ea580c', '#fde68a');
        [120, 250].forEach(function (x) { diya(c2, x * u, H2 - 70 * u, 34 * u); diya(c2, W2 - x * u, H2 - 70 * u, 34 * u); }); } }); } },
    { id: 'tricolour', name: 'Tricolour', tag: 'Festivals', cap: 'Happy Independence Day', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#ffffff', m: 70, top: 70, bottom: 70, capH: 130, ink: '#000080', size: 60, capDy: 0, under: function (c2, W2, H2, R, u) {
        c2.fillStyle = '#ff9933'; c2.fillRect(0, 0, W2, 100 * u); c2.fillStyle = '#138808'; c2.fillRect(0, H2 - 100 * u, W2, 100 * u); },
        over: function (c2, W2, H2, R, u) { c2.strokeStyle = '#000080'; c2.lineWidth = 3 * u; c2.strokeRect(R.x, R.y, R.w, R.h); } }); } },
    { id: 'holi', name: 'Holi colours', tag: 'Festivals', cap: 'Happy Holi', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#fffdf7', m: 96, capH: 150, r: 24, ink: '#7c3aed', size: 72, capDy: 22, under: function (c2, W2, H2, R, u) {
        var r = rnd(51); for (var i = 0; i < 60; i++) { var x, y; if (i % 2) { x = r() * W2; y = r() < .5 ? r() * 110 * u : H2 - r() * 110 * u; } else { y = r() * H2; x = r() < .5 ? r() * 110 * u : W2 - r() * 110 * u; }
          c2.globalAlpha = .55; dot(c2, x, y, (20 + r() * 60) * u, HOLI[i % 6]); } c2.globalAlpha = 1; } }); } },
    { id: 'eid', name: 'Eid', tag: 'Festivals', cap: 'Eid Mubarak', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: function (c2, W2, H2) { return grad(c2, 0, 0, 0, H2, ['#0f3d3e', '#115e59']); }, m: 96, capH: 150, ink: '#fcd34d', font: 'italic bold $px ' + SERIF, size: 70, capDy: 22, over: function (c2, W2, H2, R, u) {
        c2.strokeStyle = '#fcd34d'; c2.lineWidth = 3 * u; c2.strokeRect(40 * u, 40 * u, W2 - 80 * u, H2 - 80 * u); c2.strokeRect(R.x, R.y, R.w, R.h);
        var x = W2 - 150 * u, y = 150 * u; dot(c2, x, y, 78 * u, '#0f3d3e'); dot(c2, x, y, 62 * u, '#fcd34d'); dot(c2, x + 22 * u, y - 8 * u, 52 * u, '#0f3d3e'); star(c2, x + 30 * u, y - 4 * u, 20 * u, '#fcd34d'); } }); } },
    { id: 'christmas', name: 'Christmas', tag: 'Festivals', cap: 'Merry Christmas', f: function (c, W, H, s, cap) {
      basic(c, W, H, s, cap, { bg: '#14532d', m: 96, capH: 150, ink: '#ffffff', size: 70, capDy: 22, under: function (c2, W2, H2, R, u) {
        var r = rnd(61); for (var i = 0; i < 120; i++) dot(c2, r() * W2, r() * H2, (2 + r() * 5) * u, 'rgba(255,255,255,.8)'); c2.fillStyle = '#b91c1c'; c2.fillRect(0, H2 - 190 * u, W2, 190 * u); },
        over: function (c2, W2, H2, R, u) { c2.strokeStyle = '#fff'; c2.lineWidth = 4 * u; c2.strokeRect(R.x, R.y, R.w, R.h);
          [[R.x, R.y, 1], [R.x + R.w, R.y, -1]].forEach(function (p) { petal(c2, p[0], p[1], 40 * u, p[2] > 0 ? .5 : Math.PI - .5, '#22c55e'); petal(c2, p[0], p[1], 40 * u, p[2] > 0 ? 1.3 : Math.PI - 1.3, '#16a34a'); dot(c2, p[0], p[1], 14 * u, '#ef4444'); dot(c2, p[0] + p[2] * 20 * u, p[1] - 10 * u, 12 * u, '#dc2626'); }); } }); } },
    { id: 'dp-gold', name: 'Round: gold ring', tag: 'Profile picture', cap: '', round: 1, f: function (c, W, H, s) { ring(c, W, H, s, function (i) { return ['#a8780a', '#f6e27a'][i % 2]; }, 24); } },
    { id: 'dp-tricolour', name: 'Round: tricolour ring', tag: 'Profile picture', cap: '', round: 1, f: function (c, W, H, s) { ring(c, W, H, s, function (i) { return ['#ff9933', '#ffffff', '#138808'][i % 3]; }, 3); } },
    { id: 'dp-rainbow', name: 'Round: rainbow ring', tag: 'Profile picture', cap: '', round: 1, f: function (c, W, H, s) { ring(c, W, H, s, function (i) { return 'hsl(' + i * 10 + ',85%,55%)'; }, 36); } }
  ];
  function ring(c, W, H, s, col, n) {
    var m = Math.min(W, H), cx = W / 2, cy = H / 2, R = m / 2 - 6, w = m * .045;
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    place(c, s, cx - R + w, cy - R + w, 2 * (R - w), 2 * (R - w), 'circle');
    c.lineWidth = w;
    for (var i = 0; i < n; i++) { c.strokeStyle = col(i); c.beginPath(); c.arc(cx, cy, R - w / 2, -Math.PI / 2 + i * TAU / n - (n === 3 ? Math.PI / 3 : 0), -Math.PI / 2 + (i + 1) * TAU / n + .01 - (n === 3 ? Math.PI / 3 : 0)); c.stroke(); }
    c.lineWidth = Math.max(1, m * .004); c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, R - w, 0, TAU); c.stroke();
  }

  /* thumbnails of every frame: on the maker (buttons) and on the home page (links) */
  function thumbs(box, asLink, onPick) {
    FRAMES.forEach(function (fr) {
      var el = d.createElement(asLink ? 'a' : 'button'), cv = d.createElement('canvas'), cap = d.createElement('span');
      cv.width = 216; cv.height = fr.round ? 216 : 270; fr.f(cv.getContext('2d'), cv.width, cv.height, null, fr.cap);
      cap.textContent = fr.name; el.appendChild(cv); el.appendChild(cap); el.setAttribute('data-tag', fr.tag);
      if (asLink) el.href = '/frames/frame-maker/?f=' + fr.id; else { el.type = 'button'; el.value = fr.id; el.setAttribute('aria-pressed', 'false'); el.addEventListener('click', function () { onPick(fr.id); }); }
      box.appendChild(el);
    });
  }
  var gal = $('frame-gallery'); if (gal) thumbs(gal, true);

  /* ------------------------------------------------------------ frame maker page */
  var fc = $('fcv');
  if (fc) (function () {
    var ctx = fc.getContext('2d'), slot = new Slot(), cur = FRAMES[0], pend = 0;
    function draw() {
      pend = 0;
      var sz = cur.round ? SIZES.sq : (SIZES[$('f-size').value] || SIZES.po);
      if (fc.width !== sz[0] || fc.height !== sz[1]) { fc.width = sz[0]; fc.height = sz[1]; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); slot.z = parseFloat($('f-zoom').value) || 1;
      cur.f(ctx, sz[0], sz[1], slot, $('f-cap').value.trim());
    }
    function later() { if (!pend) pend = requestAnimationFrame(draw); }
    function pick(id, keepCap) {
      FRAMES.forEach(function (f) { if (f.id === id) cur = f; });
      d.querySelectorAll('#f-frames button').forEach(function (b) { b.setAttribute('aria-pressed', b.value === cur.id ? 'true' : 'false'); });
      if (!keepCap) $('f-cap').value = cur.cap;
      $('f-size').disabled = !!cur.round; $('f-cap').disabled = !!cur.round; later();
    }
    thumbs($('f-frames'), false, function (id) { pick(id); });
    pick(new URLSearchParams(location.search).get('f') || 'white');
    $('f-photo').addEventListener('change', function () { load(this.files, function (im) { slot.im = im; slot.x = slot.y = 0; $('f-zoom').value = 1; fc.classList.add('has'); later(); }); });
    ['f-size', 'f-zoom', 'f-cap'].forEach(function (id) { $(id).addEventListener('input', later); $(id).addEventListener('change', later); });
    drag(fc, function () { return slot.im ? slot : null; }, later);
    $('f-dl').addEventListener('click', function () { draw(); download(fc, 'photo-frame-' + cur.id + '.png'); });
    $('f-sh').addEventListener('click', function () { draw(); shareCv(fc, 'photo-frame-' + cur.id + '.png'); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(later);
  })();

  /* ------------------------------------------------------------ collage maker page */
  var cc = $('ccv');
  if (cc) (function () {
    var ctx = cc.getContext('2d'), slots = [], sel = -1, lay = 0, pend = 0, rects = [];
    var T = 1 / 3, LAY = {
      1: [[[0, 0, 1, 1]]],
      2: [[[0, 0, .5, 1], [.5, 0, .5, 1]], [[0, 0, 1, .5], [0, .5, 1, .5]]],
      3: [[[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]], [[0, 0, 1, .56], [0, .56, .5, .44], [.5, .56, .5, .44]], [[0, 0, T, 1], [T, 0, T, 1], [2 * T, 0, T, 1]], [[0, 0, 1, T], [0, T, 1, T], [0, 2 * T, 1, T]]],
      4: [[[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], [[0, 0, 1, .62], [0, .62, T, .38], [T, .62, T, .38], [2 * T, .62, T, .38]], [[0, 0, .62, 1], [.62, 0, .38, T], [.62, T, .38, T], [.62, 2 * T, .38, T]]],
      5: [[[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, T, .5], [T, .5, T, .5], [2 * T, .5, T, .5]], [[0, 0, .5, 1], [.5, 0, .25, .5], [.75, 0, .25, .5], [.5, .5, .25, .5], [.75, .5, .25, .5]]],
      6: [[[0, 0, T, .5], [T, 0, T, .5], [2 * T, 0, T, .5], [0, .5, T, .5], [T, .5, T, .5], [2 * T, .5, T, .5]], [[0, 0, .5, T], [.5, 0, .5, T], [0, T, .5, T], [.5, T, .5, T], [0, 2 * T, .5, T], [.5, 2 * T, .5, T]],
          [[0, 0, 2 * T, 2 * T], [2 * T, 0, T, T], [2 * T, T, T, T], [0, 2 * T, T, T], [T, 2 * T, T, T], [2 * T, 2 * T, T, T]]],
      7: [[[0, 0, .5, .4], [.5, 0, .5, .4], [0, .4, T, .3], [T, .4, T, .3], [2 * T, .4, T, .3], [0, .7, .5, .3], [.5, .7, .5, .3]]],
      8: [[[0, 0, .5, .25], [.5, 0, .5, .25], [0, .25, .5, .25], [.5, .25, .5, .25], [0, .5, .5, .25], [.5, .5, .5, .25], [0, .75, .5, .25], [.5, .75, .5, .25]], [[0, 0, .25, .5], [.25, 0, .25, .5], [.5, 0, .25, .5], [.75, 0, .25, .5], [0, .5, .25, .5], [.25, .5, .25, .5], [.5, .5, .25, .5], [.75, .5, .25, .5]]],
      9: [[[0, 0, T, T], [T, 0, T, T], [2 * T, 0, T, T], [0, T, T, T], [T, T, T, T], [2 * T, T, T, T], [0, 2 * T, T, T], [T, 2 * T, T, T], [2 * T, 2 * T, T, T]]]
    };
    function draw(clean) {
      pend = 0;
      var sz = SIZES[$('c-size').value] || SIZES.sq, W = sz[0], H = sz[1], u = W / 1080, cap = $('c-cap').value.trim();
      if (cc.width !== W || cc.height !== H) { cc.width = W; cc.height = H; }
      var gap = parseFloat($('c-gap').value) * u, rad = parseFloat($('c-rad').value) * u, bg = $('c-bg').value, capH = cap ? 130 * u : 0, n = Math.max(1, slots.length);
      var opts = LAY[n] || LAY[9]; if (lay >= opts.length) lay = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      rects = opts[lay].map(function (r) { return { x: gap / 2 + r[0] * (W - gap) + gap / 2, y: gap / 2 + r[1] * (H - capH - gap) + gap / 2, w: r[2] * (W - gap) - gap, h: r[3] * (H - capH - gap) - gap }; });
      rects.forEach(function (r, i) {
        place(ctx, slots[i] || null, r.x, r.y, r.w, r.h, null, rad);
        if (!clean && i === sel && slots.length > 1) { ctx.strokeStyle = '#25d366'; ctx.lineWidth = 8 * u; rr(ctx, r.x + 4 * u, r.y + 4 * u, r.w - 8 * u, r.h - 8 * u, rad); ctx.stroke(); }
      });
      if (cap) line(ctx, cap, W / 2, H - capH / 2 - gap / 4, W - 80 * u, 62 * u, 'bold $px ' + SERIF, /^#(f|e)/i.test(bg) ? '#1f2937' : '#ffffff');
    }
    function later() { if (!pend) pend = requestAnimationFrame(function () { draw(); }); }
    function ui() {
      var n = slots.length, box = $('c-lay'), opts = LAY[Math.max(1, n)] || LAY[9];
      box.innerHTML = '';
      opts.forEach(function (o, i) {
        var b = d.createElement('button'), cv = d.createElement('canvas'), x = cv.getContext('2d'); b.type = 'button'; b.setAttribute('aria-pressed', i === lay ? 'true' : 'false'); b.setAttribute('aria-label', 'Layout ' + (i + 1));
        cv.width = 64; cv.height = 64; x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#64748b'; o.forEach(function (r) { x.fillRect(3 + r[0] * 58 + 1.5, 3 + r[1] * 58 + 1.5, r[2] * 58 - 3, r[3] * 58 - 3); });
        b.appendChild(cv); b.addEventListener('click', function () { lay = i; ui(); later(); }); box.appendChild(b);
      });
      $('c-count').textContent = n ? n + (n === 1 ? ' photo' : ' photos') + (n >= 9 ? ' (the most a collage holds)' : '') : 'No photos yet';
      $('c-selbox').hidden = sel < 0 || !slots[sel];
      if (slots[sel]) { $('c-zoom').value = slots[sel].z; $('c-selname').textContent = 'Photo ' + (sel + 1) + ' of ' + n; }
    }
    $('c-photos').addEventListener('change', function () {
      load(this.files, function (im) { if (slots.length >= 9) { SYG.toast('A collage holds up to 9 photos'); return; } slots.push(new Slot(im)); sel = slots.length - 1; lay = 0; cc.classList.add('has'); ui(); later(); });
      this.value = '';
    });
    ['c-size', 'c-gap', 'c-rad', 'c-bg', 'c-cap'].forEach(function (id) { $(id).addEventListener('input', later); $(id).addEventListener('change', later); });
    $('c-zoom').addEventListener('input', function () { if (slots[sel]) { slots[sel].z = parseFloat(this.value) || 1; later(); } });
    $('c-remove').addEventListener('click', function () { if (slots[sel]) { slots.splice(sel, 1); sel = Math.min(sel, slots.length - 1); lay = 0; ui(); later(); } });
    $('c-first').addEventListener('click', function () { if (slots[sel] && sel > 0) { var s = slots.splice(sel, 1)[0]; slots.splice(sel - 1, 0, s); sel--; ui(); later(); } });
    $('c-shuffle').addEventListener('click', function () { for (var i = slots.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = slots[i]; slots[i] = slots[j]; slots[j] = t; } sel = slots.length ? 0 : -1; ui(); later(); });
    $('c-clear').addEventListener('click', function () { slots = []; sel = -1; lay = 0; cc.classList.remove('has'); ui(); later(); });
    drag(cc, function (x, y) {
      for (var i = 0; i < rects.length; i++) { var r = rects[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h && slots[i]) { sel = i; ui(); later(); return slots[i]; } }
      return null;
    }, later);
    $('c-dl').addEventListener('click', function () { if (!slots.length) { SYG.toast('Add photos first'); return; } draw(true); download(cc, 'photo-collage.png'); later(); });
    $('c-sh').addEventListener('click', function () { if (!slots.length) { SYG.toast('Add photos first'); return; } draw(true); shareCv(cc, 'photo-collage.png'); later(); });
    ui(); draw();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(later);
  })();

  /* ------------------------------------------------------------ print size checker */
  var pw = $('p-w');
  if (pw) {
    var run = function () {
      var w = parseFloat(pw.value), h = parseFloat($('p-h').value), o = $('p-out');
      if (!(w > 0 && h > 0)) { o.textContent = 'Type the width and height of your photo in pixels.'; return; }
      var a = Math.max(w, h), b = Math.min(w, h), f = function (dpi) { return (a / dpi).toFixed(1) + ' × ' + (b / dpi).toFixed(1) + ' inches (' + Math.round(a / dpi * 2.54) + ' × ' + Math.round(b / dpi * 2.54) + ' cm)'; };
      o.innerHTML = '<b>' + (w * h / 1e6).toFixed(1) + ' megapixels.</b><br>Sharp print (300 dots per inch): up to ' + f(300) + '<br>Good print (200 dots per inch): up to ' + f(200) + '<br>Poster seen from a distance (100 dots per inch): up to ' + f(100);
    };
    pw.addEventListener('input', run); $('p-h').addEventListener('input', run); run();
  }
})();
