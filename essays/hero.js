/* Hero animations for the essay pages (essays/*.html).

   Each hero is a real computation that runs in the reader's browser, not a recording:

   goldbach   "Turing and the Halting Problem". Program 4 of the essay, running. For every even
              number x = 4, 6, 8, ... it looks for primes p <= q with x = p + q, exactly as step (3)
              says, and plots one dot at height g(x) = the number of such pairs. The picture that
              grows is known as Goldbach's comet. The program stops only at a counterexample to
              Goldbach's conjecture, so nobody knows whether it halts.

   fourcolor  "Humans, Mathematics, and AI". A map (the Voronoi cells of slowly drifting points)
              that the machine keeps properly coloured with four colours. Whenever the drift makes
              two countries of the same colour touch, it repairs the colouring by recolouring as
              few countries as it can. That a colouring is correct is visible at a glance; why four
              colours always suffice (Appel-Haken 1976) is not.

   Markup (see the essay pages): <figure class="essay-hero" data-hero="..."> with a <canvas>,
   a .hero-readout (.hero-num, .hero-sub) and a .hero-toggle button. Text templates live in
   data-* attributes on the figure, so the wording is edited in the HTML, not here.

   Motion: honours prefers-reduced-motion (starts paused on a finished still), pauses when the
   hero is off screen or the tab is hidden, and has a pause/play button. */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var nf = new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US');
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fill(tpl, map) {
    return (tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return k in map ? map[k] : m; });
  }
  function write(el, s) {                    // touch the page only when the text has changed
    if (el && el.textContent !== s) el.textContent = s;
  }

  /* ------------------------------------------------------------------------------------------
     Runner shared by both heroes
     ------------------------------------------------------------------------------------------ */
  function mount(root, factory) {
    var stage = root.querySelector('.hero-stage');
    var canvas = root.querySelector('canvas');
    var toggle = root.querySelector('.hero-toggle');
    if (!stage || !canvas || !canvas.getContext) return;

    var ui = {
      num: root.querySelector('.hero-num'),
      sub: root.querySelector('.hero-sub'),
      alignLeft: function () {              // left edge of the page's text column, in CSS px
        var r = root.querySelector('.hero-readout');
        return r ? r.getBoundingClientRect().left - stage.getBoundingClientRect().left : 24;
      },
      headerHeight: function () {
        var h = document.querySelector('body > header');
        return h ? h.getBoundingClientRect().height : 0;
      }
    };
    var hero = factory(root, canvas, ui);
    var visible = true, hidden = document.hidden, paused = reduce.matches;
    var raf = 0, last = 0, sized = false;

    function running() { return sized && visible && !hidden && !paused; }
    function frame(now) {
      raf = 0;
      if (!running()) return;
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      hero.step(dt, now);
      hero.draw(now);
      raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (running() && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function label() {
      if (!toggle) return;
      toggle.setAttribute('aria-label', paused ? (root.dataset.lPlay || 'Play') : (root.dataset.lPause || 'Pause'));
      toggle.classList.toggle('is-paused', paused);
    }
    function size() {
      var r = stage.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      hero.resize(r.width, r.height, Math.min(window.devicePixelRatio || 1, 2));
      if (!sized) {
        sized = true;
        if (paused) hero.still();
      }
      if (!running()) hero.draw(performance.now());
    }

    if (toggle) {
      toggle.addEventListener('click', function () { paused = !paused; label(); kick(); });
    }
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; kick(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; kick(); }).observe(stage);
    }
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(stage);
    else window.addEventListener('resize', size);

    label();
    size();
    kick();
  }

  /* ------------------------------------------------------------------------------------------
     goldbach: Program 4, running
     ------------------------------------------------------------------------------------------ */
  function goldbach(root, canvas, ui) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, scale = 1;                 // internal buffer size; CSS px -> buffer px
    var img = null, accI = null, accR = null, accG = null, accB = null;
    var glow = document.createElement('canvas'), gctx = glow.getContext('2d');   // small copy, drawn back enlarged: a soft halo
    var ox = 0, oy = 0, pw = 1, ph = 1;          // plot origin and extent, buffer px

    /* primes */
    var MAXLIM = 1 << 23;                         // stop extending the table of primes at about 8 million
    var LIM = 1 << 21, sieve = null, primes = null;
    function buildSieve() {
      var s = new Uint8Array(LIM + 1), i, j, c = 0;
      s.fill(1); s[0] = 0; s[1] = 0;
      for (i = 2; i * i <= LIM; i++) if (s[i]) for (j = i * i; j <= LIM; j += i) s[j] = 0;
      for (i = 2; i <= LIM; i++) c += s[i];
      var p = new Int32Array(c + 1);
      for (i = 2, j = 0; i <= LIM; i++) if (s[i]) p[j++] = i;
      p[c] = 0x7fffffff;                          // sentinel
      sieve = s; primes = p;
    }

    /* the dots: entry i belongs to x = 4 + 2i */
    var cap = 1 << 15, n = 0;
    var gv = new Uint32Array(cap);               // g(x): number of ways x = p + q, p <= q prime
    var tv = new Uint8Array(cap);                // colour index, from the odd prime factors of x
    var x = 2, firstP = 2, gmax = 1, halted = false, spent = false;
    function push(c, t) {
      if (n === cap) {
        cap *= 2;
        var g2 = new Uint32Array(cap), t2 = new Uint8Array(cap);
        g2.set(gv); t2.set(tv); gv = g2; tv = t2;
      }
      gv[n] = c; tv[n] = t; n++;
      if (c > gmax) gmax = c;
    }

    /* Hardy and Littlewood's heuristic for g(x) carries the factor
       prod over odd primes p | x of (p - 1)/(p - 2); it is what splits the comet into bands.
       Colour by that factor: blue for 1 (no small odd prime factor), through violet and rose,
       to gold at 2 and ivory above. The factor 2 comes from p = 3, and the other x are held
       below gold, so a dot is gold or lighter exactly when 3 | x. */
    var SMALL = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
    function band(v) {
      var f = 1, i, p, t;
      for (i = 0; i < SMALL.length; i++) { p = SMALL[i]; if (v % p === 0) f *= (p - 1) / (p - 2); }
      t = Math.log(f) / 1.386;                   // ln f / ln 4
      if (v % 3 !== 0 && t > 0.38) t = 0.38;     // e.g. 5 * 7 * 11 * 13 | x would otherwise drift into gold
      return Math.round(255 * clamp(t, 0, 1));
    }
    var STOPS = [
      [0.00, 92, 134, 255], [0.22, 150, 142, 252], [0.38, 232, 150, 198],
      [0.50, 255, 200, 124], [0.72, 255, 224, 168], [1.00, 255, 246, 226]
    ];
    var ramp = new Float32Array(256 * 3);
    (function () {
      for (var i = 0; i < 256; i++) {
        var t = i / 255, k = 1;
        while (k < STOPS.length - 1 && STOPS[k][0] < t) k++;
        var a = STOPS[k - 1], b = STOPS[k], u = (t - a[0]) / (b[0] - a[0]);
        for (var c = 0; c < 3; c++) ramp[i * 3 + c] = (a[c + 1] + (b[c + 1] - a[c + 1]) * u) / 255;
      }
    })();

    /* Step (2) and step (3) of Program 4, repeated until the time budget is spent. */
    function advance(xLimit, budgetMs) {
      var t0 = performance.now(), made = 0;
      while (!halted && x + 2 <= xLimit) {
        var nx = x + 2;
        if (nx > LIM) {
          if (LIM >= MAXLIM) { spent = true; return; }   // the table of primes ends here; so does this run
          LIM *= 2; buildSieve();
        }
        var half = nx >> 1, c = 0, fp = 0, i = 0, p = primes[0];
        for (; p <= half; p = primes[++i]) {
          if (sieve[nx - p]) { c++; if (!fp) fp = p; }
        }
        x = nx;
        if (c === 0) { halted = true; return; }   // a counterexample: step (4), the program halts
        firstP = fp;
        push(c, band(nx));
        if ((++made & 7) === 0 && performance.now() - t0 > budgetMs) return;
      }
    }

    /* pacing: x doubles every T2 seconds until the arithmetic itself becomes the limit */
    var T2 = 1.25, X0 = 56, clock = 0, elapsed = 0;
    function pace(t) { return 4 + X0 * (Math.pow(2, t / T2) - 1); }
    var Xv = 96, Yv = 6;                           // the view: x in [0, Xv], g in [0, Yv]
    var builtX = 0, builtY = 0, builtN = 0, builtW = 1;   // what the density buffer currently holds
    var sparks = [], lastText = 0, dirty = true, held = 0, tickNo = 0, drawNo = 0;

    function resize(cw, chh, dpr) {
      scale = Math.min(dpr, 1.5);
      if (cw * scale > 1500) scale = 1500 / cw;
      W = Math.max(2, Math.round(cw * scale)); H = Math.max(2, Math.round(chh * scale));
      canvas.width = W; canvas.height = H;
      glow.width = Math.max(2, Math.round(W / 5)); glow.height = Math.max(2, Math.round(H / 5));
      img = ctx.createImageData(W, H);
      accI = new Float32Array(W * H); accR = new Float32Array(W * H);
      accG = new Float32Array(W * H); accB = new Float32Array(W * H);
      ox = Math.round(ui.alignLeft() * scale);
      oy = Math.round(H * 0.93);
      var top = Math.round((ui.headerHeight() + 18) * scale);
      pw = W - ox - 2; ph = Math.max(10, oy - top);
      builtN = -1; dirty = true;
    }

    var LUT = new Uint8Array(4096);
    (function () { for (var i = 0; i < 4096; i++) LUT[i] = Math.round(255 * (1 - Math.exp(-2.1 * i / 256))); })();

    function splat(i0, i1, weight, kernel) {
      var sx = pw / Xv, sy = ph / Yv, i, px, py, ix, iy, fx, fy, k, w, r, g, b, t;
      for (i = i0; i < i1; i++) {
        px = ox + (4 + 2 * i) * sx; py = oy - gv[i] * sy;
        if (px < 1 || px >= W - 2 || py < 1 || py >= H - 2) continue;
        t = tv[i] * 3; r = ramp[t]; g = ramp[t + 1]; b = ramp[t + 2];
        ix = px | 0; iy = py | 0;
        if (kernel === 0) {
          k = iy * W + ix;
          accI[k] += weight; accR[k] += weight * r; accG[k] += weight * g; accB[k] += weight * b;
        } else if (kernel === 2) {                 // few dots on screen: draw each one 3 x 3, soft-edged
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            w = weight * (dx === 0 ? 1 : 0.5) * (dy === 0 ? 1 : 0.5);
            k = (iy + dy) * W + ix + dx;
            accI[k] += w; accR[k] += w * r; accG[k] += w * g; accB[k] += w * b;
          }
        } else {
          fx = px - ix; fy = py - iy;
          k = iy * W + ix;
          w = weight * (1 - fx) * (1 - fy); accI[k] += w; accR[k] += w * r; accG[k] += w * g; accB[k] += w * b;
          w = weight * fx * (1 - fy); accI[k + 1] += w; accR[k + 1] += w * r; accG[k + 1] += w * g; accB[k + 1] += w * b;
          k += W;
          w = weight * (1 - fx) * fy; accI[k] += w; accR[k] += w * r; accG[k] += w * g; accB[k] += w * b;
          w = weight * fx * fy; accI[k + 1] += w; accR[k + 1] += w * r; accG[k + 1] += w * g; accB[k + 1] += w * b;
        }
      }
    }

    function weightFor(count) {                    // keeps the mean brightness steady as dots pile up
      return Math.min(1, 0.26 * pw * ph / Math.max(1, count));
    }

    function rebuild() {
      accI.fill(0); accR.fill(0); accG.fill(0); accB.fill(0);
      builtW = weightFor(n);
      if (n < 9000) splat(0, n, builtW * clamp(1.5 - n / 9000, 0.5, 1.2), 2);
      else splat(0, n, builtW, n > 40000 ? 0 : 1);   // dense enough: one texel per dot
      builtX = Xv; builtY = Yv; builtN = n;
    }

    function paint() {
      var d = img.data, len = W * H, k, o, s, a, m;
      for (k = 0, o = 0; k < len; k++, o += 4) {
        s = accI[k];
        if (s <= 0.002) { d[o + 3] = 0; continue; }
        a = s * 256; m = 255 / s;
        d[o] = accR[k] * m; d[o + 1] = accG[k] * m; d[o + 2] = accB[k] * m;
        d[o + 3] = LUT[a > 4095 ? 4095 : a | 0];
      }
      ctx.putImageData(img, 0, 0);
      gctx.clearRect(0, 0, glow.width, glow.height);
      gctx.drawImage(canvas, 0, 0, glow.width, glow.height);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.42;
      ctx.drawImage(glow, 0, 0, W, H);
      ctx.restore();
    }

    function text(now) {
      if (now - lastText < 90 && !halted) return;
      lastText = now;
      write(ui.num, halted ? nf.format(x) : nf.format(x) + ' = ' + nf.format(firstP) + ' + ' + nf.format(x - firstP));
      write(ui.sub, halted
        ? fill(root.dataset.lHalted, { x: nf.format(x) })
        : fill(root.dataset.lChecked, { n: nf.format(n) }));
    }

    function step(dt) {
      if ((halted || spent) && !sparks.length) return;       // nothing more to compute: the last sparks fade, then rest
      if (elapsed > 45 && (++tickNo & 1)) { held = dt; return; }   // once the comet has formed, work on every other frame
      dt += held; held = 0;
      dirty = true;
      clock += dt; elapsed += dt;
      // generous while the comet takes shape, then a light load for as long as the page stays open
      var budget = elapsed < 26 ? 3.6 : Math.max(1.3, 3.6 - (elapsed - 26) * 0.12);
      var before = n;
      advance(Math.floor(pace(clock) / 2) * 2, budget);
      if (x + 2 < pace(clock)) clock = T2 * Math.log(1 + (x - 4) / X0) / Math.LN2 + 0.02;   // arithmetic-bound: do not let the pace run ahead
      var k = 1 - Math.exp(-dt / 0.10);
      Xv += (Math.max(96, x * 1.022) - Xv) * k;
      Yv += (Math.max(5.6, gmax * 1.07) - Yv) * (1 - Math.exp(-dt / 0.30));
      var born = n - before;
      for (var j = 0, m = Math.min(born, born > 40 ? 2 : 4); j < m; j++) {
        sparks.push({ i: n - 1 - Math.floor(j * born / m), age: 0 });
      }
      for (j = sparks.length - 1; j >= 0; j--) { sparks[j].age += dt; if (sparks[j].age > 0.7) sparks.splice(j, 1); }
      if (sparks.length > 70) sparks.splice(0, sparks.length - 70);
    }

    function draw(now) {
      if (!img) return;
      if (!dirty && builtN >= 0) { text(now || 0); return; }
      // with tens of thousands of dots the picture changes slowly: redraw it on every other frame
      if (n > 50000 && elapsed <= 45 && builtN >= 0 && (++drawNo & 1)) { text(now || 0); return; }
      dirty = false;
      var moved = Math.abs(Xv / builtX - 1) * pw > 0.3 || Math.abs(Yv / builtY - 1) * ph > 0.3;
      if (builtN < 0 || moved || n < 60000 || weightFor(n) < 0.97 * builtW) rebuild();
      else if (n > builtN) { splat(builtN, n, builtW, 0); builtN = n; }
      paint();

      var sx = pw / Xv, sy = ph / Yv;
      ctx.save();
      ctx.fillStyle = 'rgba(240, 232, 216, 0.10)';             // the axis g = 0
      ctx.fillRect(ox, oy + Math.round(1.5 * scale), pw, Math.max(1, Math.round(scale)));
      ctx.globalCompositeOperation = 'lighter';
      for (var j = 0; j < sparks.length; j++) {
        var s = sparks[j], i = s.i, px = ox + (4 + 2 * i) * sx, py = oy - gv[i] * sy;
        if (px > W) continue;
        var a = 1 - s.age / 0.7, t = tv[i] * 3, rad = (0.9 + 1.5 * a) * scale;
        var grd = ctx.createRadialGradient(px, py, 0, px, py, rad * 2.2);
        var col = Math.round(ramp[t] * 255) + ',' + Math.round(ramp[t + 1] * 255) + ',' + Math.round(ramp[t + 2] * 255);
        grd.addColorStop(0, 'rgba(' + col + ',' + (0.75 * a * a).toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = grd;
        ctx.fillRect(px - rad * 2.2, py - rad * 2.2, rad * 4.4, rad * 4.4);
      }
      ctx.restore();
      text(now || 0);
    }

    function still() {                             // a finished picture for readers who prefer no motion
      advance(40000, 400);
      clock = T2 * Math.log(1 + (x - 4) / X0) / Math.LN2;
      Xv = Math.max(96, x * 1.022); Yv = Math.max(5.6, gmax * 1.07);
    }

    buildSieve();
    return { resize: resize, step: step, draw: draw, still: still };
  }

  /* ------------------------------------------------------------------------------------------
     fourcolor: a drifting map, kept four-coloured
     ------------------------------------------------------------------------------------------ */
  function fourcolor(root, canvas, ui) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var PAL = [[50, 86, 180], [200, 160, 86], [214, 206, 189], [116, 47, 81]];   // blue, gold, ivory, wine
    var SPREAD = 0.8, HOLD = 0.42;                         // seconds: a recolouring spreading; a clash shown before its repair
    var BG = '#08080a';
    var N = 0, hx, hy, ax, ay, w1, w2, p1, p2, shade;     // homes and orbits of the points
    var sx, sy, cand;                                      // positions now; candidate neighbours
    var polyX = [], polyY = [], polyO = [];                // cell i: vertices, and who lies across each edge
    var color, on, stamp, onList = [], nbrs = [], frameId = 0, use = [0, 0, 0, 0];
    var mark, markId = 0;
    var fromC, toC, t0C, reach;                            // displayed colour: the new one spreads over the old
    var flashes = [];                                      // clashes being repaired
    var time = 0, lastText = 0, shown = 0, ready = false;
    var seedRand = 20261119;
    function rnd() {                                       // small deterministic generator
      seedRand = (seedRand + 0x6D2B79F5) | 0;
      var t = Math.imul(seedRand ^ (seedRand >>> 15), 1 | seedRand);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function layout() {
      var area = clamp(W * H / 72, 5600, 15000);           // CSS px^2 per country
      var s = Math.sqrt(area / 0.866), rowH = s * 0.866;
      var cols = Math.ceil(W / s) + 4, rows = Math.ceil(H / rowH) + 4, r, c, i;
      N = cols * rows;
      hx = new Float32Array(N); hy = new Float32Array(N); ax = new Float32Array(N); ay = new Float32Array(N);
      w1 = new Float32Array(N); w2 = new Float32Array(N); p1 = new Float32Array(N); p2 = new Float32Array(N);
      shade = new Float32Array(N); sx = new Float32Array(N); sy = new Float32Array(N);
      cand = [];
      for (r = 0, i = 0; r < rows; r++) for (c = 0; c < cols; c++, i++) {
        hx[i] = (c - 1.5 + (r & 1 ? 0.5 : 0) + (rnd() - 0.5) * 0.36) * s;
        hy[i] = (r - 1.5 + (rnd() - 0.5) * 0.36) * rowH;
        ax[i] = s * (0.30 + 0.16 * rnd()); ay[i] = s * (0.30 + 0.16 * rnd());
        w1[i] = (rnd() < 0.5 ? -1 : 1) * 2 * Math.PI / (170 + 170 * rnd());   // a slow drift: one loop takes minutes
        w2[i] = (rnd() < 0.5 ? -1 : 1) * 2 * Math.PI / (170 + 170 * rnd());
        p1[i] = rnd() * 6.283; p2[i] = rnd() * 6.283;
        shade[i] = 0.93 + 0.14 * rnd();
        var list = [];
        for (var dr = -3; dr <= 3; dr++) for (var dc = -3; dc <= 3; dc++) {
          var rr = r + dr, cc = c + dc;
          if ((dr || dc) && rr >= 0 && rr < rows && cc >= 0 && cc < cols) list.push(rr * cols + cc);
        }
        cand.push(list);
      }
      color = new Int8Array(N).fill(-1); use = [0, 0, 0, 0];
      on = new Uint8Array(N * N); stamp = new Int32Array(N * N); onList = [];
      mark = new Int32Array(N); markId = 0;
      fromC = new Int8Array(N); toC = new Int8Array(N); t0C = new Float64Array(N); reach = new Float32Array(N);
      polyX = []; polyY = []; polyO = []; nbrs = [];
      for (i = 0; i < N; i++) { polyX.push([]); polyY.push([]); polyO.push([]); nbrs.push([]); }
      flashes = []; ready = false; frameId = 0;
    }

    function resize(cw, chh, d) {
      var first = !W;
      dpr = d;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr);
      if (first || Math.abs(cw - W) > 40 || Math.abs(chh - H) > 40) { W = cw; H = chh; layout(); update(0); }
      else { W = cw; H = chh; }
    }

    /* Voronoi cell of point i inside the stage: start from the rectangle, cut by each bisector. */
    var tx = [], ty = [], to = [], dd = [];
    function cell(i) {
      var X = polyX[i], Y = polyY[i], O = polyO[i], m, k, a, b, j, c, list = cand[i];
      X.length = 4; Y.length = 4; O.length = 4;
      X[0] = 0; Y[0] = 0; X[1] = W; Y[1] = 0; X[2] = W; Y[2] = H; X[3] = 0; Y[3] = H;
      O[0] = O[1] = O[2] = O[3] = -1;
      var px = sx[i], py = sy[i];
      for (c = 0; c < list.length; c++) {
        j = list[c];
        var nx = sx[j] - px, ny = sy[j] - py, mx = (sx[j] + px) / 2, my = (sy[j] + py) / 2, cut = false;
        m = X.length;
        if (m === 0) return;
        for (k = 0; k < m; k++) { dd[k] = (X[k] - mx) * nx + (Y[k] - my) * ny; if (dd[k] > 0) cut = true; }
        if (!cut) continue;
        tx.length = 0; ty.length = 0; to.length = 0;
        for (a = 0; a < m; a++) {
          b = a + 1 === m ? 0 : a + 1;
          var da = dd[a], db = dd[b];
          if (da <= 0) {
            tx.push(X[a]); ty.push(Y[a]); to.push(O[a]);
            if (db > 0) { var u = da / (da - db); tx.push(X[a] + (X[b] - X[a]) * u); ty.push(Y[a] + (Y[b] - Y[a]) * u); to.push(j); }
          } else if (db <= 0) {
            var v = da / (da - db); tx.push(X[a] + (X[b] - X[a]) * v); ty.push(Y[a] + (Y[b] - Y[a]) * v); to.push(O[a]);
          }
        }
        X.length = Y.length = O.length = tx.length;
        for (k = 0; k < tx.length; k++) { X[k] = tx[k]; Y[k] = ty[k]; O[k] = to[k]; }
      }
    }

    /* Which countries share a border now. A border counts once it is 2 px long and until it
       shrinks under 0.6 px, so a border that is being born or dying does not flicker. */
    function borderScan() {
      var i, k, m, j, key, len, fresh = [];
      frameId++;
      for (i = 0; i < N; i++) {
        var X = polyX[i], Y = polyY[i], O = polyO[i];
        m = X.length;
        if (m < 3) continue;
        for (k = 0; k < m; k++) {
          j = O[k];
          if (j <= i) continue;                                   // each pair once (j > i); -1 is the frame
          if (polyX[j].length < 3) continue;
          var b = k + 1 === m ? 0 : k + 1;
          len = Math.hypot(X[b] - X[k], Y[b] - Y[k]);
          key = i * N + j;
          if (len > 2 || (on[key] && len > 0.6)) {
            stamp[key] = frameId;
            if (!on[key]) { on[key] = 1; onList.push(key); fresh.push(key); }
          }
        }
      }
      for (k = onList.length - 1; k >= 0; k--) {
        key = onList[k];
        if (stamp[key] !== frameId) { on[key] = 0; onList[k] = onList[onList.length - 1]; onList.pop(); }
      }
      for (i = 0; i < N; i++) nbrs[i].length = 0;
      for (k = 0; k < onList.length; k++) {
        key = onList[k]; i = (key / N) | 0; j = key - i * N;
        nbrs[i].push(j); nbrs[j].push(i);
      }
      return fresh;
    }

    /* ---- colouring ---- */
    function maskOf(i) {                                   // colours taken by the neighbours of country i
      var m = 0, a = nbrs[i], k;
      for (k = 0; k < a.length; k++) if (color[a[k]] >= 0) m |= 1 << color[a[k]];
      return m;
    }
    function leastUsed(mask) {                             // a free colour, the rarest first: keeps the four in balance
      var best = -1, c;
      for (c = 0; c < 4; c++) if (!(mask & (1 << c)) && (best < 0 || use[c] < use[best])) best = c;
      return best;
    }
    function put(i, c) {
      if (color[i] >= 0) use[color[i]]--;
      color[i] = c;
      if (c >= 0) use[c]++;
    }
    function show(i, when) {                               // let the displayed colour follow, starting at `when`
      if (time - t0C[i] > SPREAD * 0.5) fromC[i] = toC[i];  // (interrupted halfway: start from whichever colour covers more)
      toC[i] = color[i] < 0 ? 0 : color[i];
      t0C[i] = when;
    }

    /* Kempe chain: every country coloured a or b that can be reached from `starts` through
       countries coloured a or b, without passing through `skip`. Exchanging a and b on the whole
       chain keeps every border properly coloured. This exchange is Kempe's idea of 1879, and
       it is still at the heart of the proof of the four colour theorem. */
    function chain(starts, a, b, skip) {
      var cells = [], depth = [], head = 0, k, x, y, list;
      markId++;
      for (k = 0; k < starts.length; k++) if (mark[starts[k]] !== markId) { mark[starts[k]] = markId; cells.push(starts[k]); depth.push(0); }
      while (head < cells.length) {
        x = cells[head]; list = nbrs[x];
        for (k = 0; k < list.length; k++) {
          y = list[k];
          if (y !== skip && mark[y] !== markId && (color[y] === a || color[y] === b)) { mark[y] = markId; cells.push(y); depth.push(depth[head] + 1); }
        }
        head++;
      }
      return { a: a, b: b, cells: cells, depth: depth };
    }

    /* How to give country w a colour that none of its neighbours has, changing as little as possible:
       a free colour if there is one; otherwise the smallest Kempe chain whose exchange frees one. */
    function plan(w) {
      var c = leastUsed(maskOf(w));
      if (c >= 0) return { paint: c, swap: null, cost: 1 };
      var best = null, a, b, k, list = nbrs[w], A;
      for (a = 0; a < 4; a++) {
        A = [];
        for (k = 0; k < list.length; k++) if (color[list[k]] === a) A.push(list[k]);
        for (b = 0; b < 4; b++) {
          if (b === a) continue;
          var ch = chain(A, a, b, w), bad = false;
          for (k = 0; k < list.length; k++) if (color[list[k]] === b && mark[list[k]] === markId) { bad = true; break; }
          if (!bad && (!best || ch.cells.length < best.cells.length)) best = ch;
        }
      }
      return best ? { paint: best.a, swap: best, cost: 1 + best.cells.length } : null;
    }
    function exchange(ch, when, lag) {
      for (var k = 0; k < ch.cells.length; k++) {
        var x = ch.cells[k];
        put(x, color[x] === ch.a ? ch.b : ch.a);
        if (when !== undefined) show(x, when + lag * ch.depth[k]);
      }
    }
    function carry(w, pl, when) {                          // carry out a plan; with `when`, animate it
      var last = 0;
      if (pl.swap) {
        exchange(pl.swap, when, 0.075);
        last = pl.swap.depth[pl.swap.depth.length - 1] || 0;
      }
      put(w, pl.paint);
      if (when !== undefined) show(w, when + (pl.swap ? Math.min(0.5, 0.075 * last) : 0));
    }
    function settle(w, when) {                             // w must get a proper colour, whatever it takes
      var pl = plan(w), tries, list, x, b;
      for (tries = 0; !pl && tries < 400; tries++) {       // no single exchange works: shake nearby chains and look again
        list = nbrs[w];
        x = list[(rnd() * list.length) | 0];
        b = (color[x] + 1 + ((rnd() * 3) | 0)) % 4;
        exchange(chain([x], color[x], b, w), when, 0.05);
        pl = plan(w);
      }
      if (!pl) return false;
      carry(w, pl, when);
      return true;
    }

    /* Colour the whole map. Order: repeatedly set aside a country with the fewest remaining
       neighbours (a planar map always has one with at most five), then colour in reverse. */
    function colorAll() {
      var i, k, deg = new Int32Array(N), gone = new Uint8Array(N), order = [], vis = [];
      for (i = 0; i < N; i++) { color[i] = -1; if (polyX[i].length > 2) { vis.push(i); deg[i] = nbrs[i].length; } }
      use = [0, 0, 0, 0];
      for (k = 0; k < vis.length; k++) {
        var best = -1;
        for (i = 0; i < vis.length; i++) if (!gone[vis[i]] && (best < 0 || deg[vis[i]] < deg[best])) best = vis[i];
        gone[best] = 1; order.push(best);
        for (i = 0; i < nbrs[best].length; i++) deg[nbrs[best][i]]--;
      }
      for (k = order.length - 1; k >= 0; k--) if (!settle(order[k])) return false;
      return true;
    }

    function update(dt) {
      var i, k;
      time += dt;
      for (i = 0; i < N; i++) {
        sx[i] = hx[i] + ax[i] * Math.cos(w1[i] * time + p1[i]);
        sy[i] = hy[i] + ay[i] * Math.sin(w2[i] * time + p2[i]);
      }
      for (i = 0; i < N; i++) cell(i);
      var fresh = borderScan();
      if (!ready) {
        for (k = 0; k < 8 && !colorAll(); k++);            // (a retry reshuffles the random exchanges)
        for (i = 0; i < N; i++) { fromC[i] = toC[i] = color[i] < 0 ? 0 : color[i]; t0C[i] = -10; }
        ready = true;
        return;
      }
      for (i = 0; i < N; i++) {                            // a country drifting into view for the first time
        if (color[i] < 0 && polyX[i].length > 2) { settle(i); show(i, time - 10); }
      }
      for (k = 0; k < fresh.length; k++) {
        var u = (fresh[k] / N) | 0, v = fresh[k] - u * N;
        if (color[u] !== color[v] || color[u] < 0) continue;
        // a new border with the same colour on both sides: repair it at the cheaper end
        var pu = plan(u), pv = plan(v), w = u, pl = pu;
        if (pv && (!pu || pv.cost < pu.cost)) { w = v; pl = pv; }
        flashes.push({ u: u, v: v, t: time });
        if (pl) carry(w, pl, time + HOLD);
        else if (!settle(u, time + HOLD)) { colorAll(); for (i = 0; i < N; i++) show(i, time + HOLD); }
      }
      for (k = flashes.length - 1; k >= 0; k--) if (time - flashes[k].t > HOLD + 0.6) flashes.splice(k, 1);
    }

    function step(dt) { update(dt); }

    function trace(i) {
      var X = polyX[i], Y = polyY[i], k;
      ctx.beginPath();
      ctx.moveTo(X[0], Y[0]);
      for (k = 1; k < X.length; k++) ctx.lineTo(X[k], Y[k]);
      ctx.closePath();
    }

    function ink(c, i) {
      var p = PAL[c], f = shade[i];
      return 'rgb(' + ((p[0] * f) | 0) + ',' + ((p[1] * f) | 0) + ',' + ((p[2] * f) | 0) + ')';
    }

    function draw(now) {
      if (!ready) return;
      var i, k, u, e;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = 'round';
      shown = 0;
      for (i = 0; i < N; i++) {
        if (polyX[i].length < 3) continue;
        shown++;
        u = (time - t0C[i]) / SPREAD;
        trace(i);
        if (u >= 1 || fromC[i] === toC[i]) {
          ctx.fillStyle = ink(toC[i], i);
          ctx.fill();
        } else {
          ctx.fillStyle = ink(fromC[i], i);
          ctx.fill();
          if (u > 0) {                                       // the new colour spreads from the middle of the country
            var X = polyX[i], Y = polyY[i], far = 0, d;
            for (k = 0; k < X.length; k++) { d = Math.hypot(X[k] - sx[i], Y[k] - sy[i]); if (d > far) far = d; }
            e = u * u * (3 - 2 * u);
            ctx.save();
            ctx.clip();
            ctx.beginPath();
            ctx.arc(sx[i], sy[i], far * e, 0, 6.2832);
            ctx.fillStyle = ink(toC[i], i);
            ctx.fill();
            ctx.restore();
            trace(i);
          }
        }
        ctx.strokeStyle = BG; ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      var lx = W * (0.62 + 0.2 * Math.sin(time * 0.05)), ly = H * 0.18, glowR = Math.max(W, H) * 0.75;
      var light = ctx.createRadialGradient(lx, ly, 0, lx, ly, glowR);   // light behind the glass, slowly moving
      light.addColorStop(0, 'rgba(255, 246, 226, 0.34)');
      light.addColorStop(1, 'rgba(255, 246, 226, 0)');
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      for (k = 0; k < flashes.length; k++) {                // two countries of one colour have just met
        var f = flashes[k], age = time - f.t, al = age < HOLD ? Math.min(1, age / 0.12) : Math.max(0, 1 - (age - HOLD) / 0.6);
        if (polyX[f.u].length < 3 || polyX[f.v].length < 3) continue;
        ctx.strokeStyle = 'rgba(255, 250, 238, ' + (0.9 * al).toFixed(3) + ')';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(255, 244, 214, 0.8)'; ctx.shadowBlur = 14 * al;
        trace(f.u); ctx.stroke();
        trace(f.v); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      if ((now || 0) - lastText > 180 || !lastText) {
        lastText = now || 1;
        var clashes = 0, borders = 0;
        for (k = 0; k < flashes.length; k++) if (time - flashes[k].t < HOLD) clashes++;
        for (k = 0; k < onList.length; k++) borders++;
        write(ui.num, fill(root.dataset.lMap, { c: nf.format(shown), b: nf.format(borders) }));
        write(ui.sub, fill(root.dataset.lClash, { k: nf.format(clashes) }));
      }
    }

    function still() { update(0); }

    return { resize: resize, step: step, draw: draw, still: still };
  }

  /* ------------------------------------------------------------------------------------------ */
  var kinds = { goldbach: goldbach, fourcolor: fourcolor };
  function start() {
    var roots = document.querySelectorAll('.essay-hero[data-hero]');
    for (var i = 0; i < roots.length; i++) {
      var make = kinds[roots[i].dataset.hero];
      if (make) mount(roots[i], make);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
