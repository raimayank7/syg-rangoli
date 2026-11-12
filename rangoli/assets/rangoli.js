/* Rangoli: gallery filter, colour / outline switch, print, download as a picture. Runs in the browser only. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;

  /* gallery: search box + level chips + occasion chips */
  var q = d.getElementById('q'), cards = [].slice.call(d.querySelectorAll('#gal > li'));
  if (cards.length) {
    var lev = '', tag = '';
    var run = function () {
      var s = q ? q.value.trim().toLowerCase() : '', n = 0;
      cards.forEach(function (c) {
        var hit = (!s || c.textContent.toLowerCase().indexOf(s) > -1 || c.getAttribute('data-tags').indexOf(s) > -1) && (!lev || c.getAttribute('data-level') === lev) && (!tag || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') > -1);
        c.hidden = !hit; if (hit) n++;
      });
      var none = d.getElementById('none'); if (none) none.hidden = n > 0;
    };
    if (q) q.addEventListener('input', run);
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lev],[data-tag]'); if (!b) return;
      var isLev = b.hasAttribute('data-lev');
      if (isLev) lev = b.getAttribute('data-lev'); else tag = b.getAttribute('data-tag');
      d.querySelectorAll(isLev ? '[data-lev]' : '[data-tag]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      run();
    });
  }

  /* colour or outline (an outline can be printed and coloured in) */
  function setMode(m) {
    root.classList.toggle('outline', m === 'outline');
    d.querySelectorAll('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-mode') === m ? 'true' : 'false'); });
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode],[data-print],[data-save]'); if (!b) return;
    if (b.hasAttribute('data-mode')) setMode(b.getAttribute('data-mode'));
    else if (b.hasAttribute('data-print')) window.print();
    else save(d.querySelector(b.getAttribute('data-save')), b.getAttribute('data-name') || 'rangoli');
  });

  function save(svg, name) {
    if (!svg) return;
    var c = svg.cloneNode(true), src = svg.querySelectorAll('.s,.bg'), dst = c.querySelectorAll('.s,.bg');
    for (var i = 0; i < src.length; i++) {   // copy what is on screen (colour or outline) into the picture
      var cs = getComputedStyle(src[i]);
      dst[i].setAttribute('fill', cs.fill); dst[i].setAttribute('stroke', cs.stroke); dst[i].setAttribute('stroke-width', cs.strokeWidth);
    }
    var vb = svg.viewBox.baseVal, W = 1200, H = Math.round(W * vb.height / vb.width);
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('width', W); c.setAttribute('height', H);
    var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)], { type: 'image/svg+xml' })), im = new Image();
    im.onload = function () {
      var cv = d.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(im, 0, 0, W, H); URL.revokeObjectURL(url);
      cv.toBlob(function (b) {
        var a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = name + (root.classList.contains('outline') ? '-outline' : '') + '.png'; d.body.appendChild(a); a.click(); a.remove();
        if (window.SYG) SYG.toast('Picture saved to your downloads');
      }, 'image/png');
    };
    im.onerror = function () { if (window.SYG) SYG.toast('Could not make the picture on this device'); };
    im.src = url;
  }
})();
