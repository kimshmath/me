/* Hero animations for the essay pages (essays/*.html).

   Each hero is a real computation that runs in the reader's browser, not a recording:

   goldbach   "Turing and the Halting Problem". Program 4 of the essay, running. For every even
              number x = 4, 6, 8, ... it looks for primes p <= q with x = p + q, exactly as step (3)
              says, and plots one dot at height g(x) = the number of such pairs. The picture that
              grows is known as Goldbach's comet. The program stops only at a counterexample to
              Goldbach's conjecture, so nobody knows whether it halts.

   unit       "Humans, Mathematics, and AI". The unit distance problem: how many pairs among n points
              in the plane can be at distance exactly 1? Erdos (1946) conjectured n^(1 + o(1)); in May
              2026 an AI model disproved it with lattices coming from number fields of large degree,
              projected to the plane. The hero carries out that recipe in a field of degree 8: it
              finds the 931 lattice points in a window and all 2,580 pairs at distance exactly 1, in
              exact integer arithmetic, and draws them. The lattice lives in eight dimensions; its four
              embeddings give four different pictures, and the hero turns the plane of projection
              from one to the next. In between, the lengths spread out; at each embedding all are 1.
              The reader can drag the figure to turn it in space: a third axis from the other
              embeddings makes it a projection of the lattice into three dimensions, and the view
              from straight above is the planar shadow.

   Markup (see the essay pages): <figure class="essay-hero" data-hero="..."> with a <canvas>,
   a .hero-readout (.hero-num, .hero-sub) and a .hero-toggle button. Text templates live in
   data-* attributes on the figure, so the wording is edited in the HTML, not here.
   The comet fills the whole stage; the lattice figure is round, so its hero places a square
   canvas inside the stage and lays out its text beside or above it (see essay.css).

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

  /* The colours of both heroes, from 0 to 1: blue, violet, rose, gold, ivory. */
  var STOPS = [
    [0.00, 92, 134, 255], [0.22, 150, 142, 252], [0.38, 232, 150, 198],
    [0.50, 255, 200, 124], [0.72, 255, 224, 168], [1.00, 255, 246, 226]
  ];

  /* ------------------------------------------------------------------------------------------
     Runner shared by both heroes
     ------------------------------------------------------------------------------------------ */
  function mount(root, factory) {
    var stage = root.querySelector('.hero-stage');
    var canvas = root.querySelector('canvas');
    var toggle = root.querySelector('.hero-toggle');
    if (!stage || !canvas || !canvas.getContext) return;

    var ui = {
      readout: root.querySelector('.hero-readout'),
      num: root.querySelector('.hero-num'),
      sub: root.querySelector('.hero-sub'),
      alignLeft: function () {              // left edge of the page's text column, in CSS px
        var r = root.querySelector('.hero-readout');
        return r ? r.getBoundingClientRect().left - stage.getBoundingClientRect().left : 24;
      },
      readoutBottom: function () {
        var r = root.querySelector('.hero-readout');
        return r ? r.getBoundingClientRect().bottom - stage.getBoundingClientRect().top : 0;
      },
      headerHeight: function () {
        var h = document.querySelector('body > header');
        return h ? h.getBoundingClientRect().height : 0;
      },
      redraw: function () {                 // one frame now, even while paused (for a reader turning the figure by hand)
        if (running() || pend) return;
        pend = requestAnimationFrame(function () { pend = 0; if (sized) hero.draw(performance.now(), true); });
      }
    };
    var hero = factory(root, canvas, ui);
    var visible = true, hidden = document.hidden, paused = reduce.matches;
    var raf = 0, last = 0, sized = false, pend = 0;

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
      if (!running()) hero.draw(performance.now(), true);
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
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);   // text may wrap differently once the fonts are in
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
     unit: a lattice in eight dimensions and its shadows in the plane
     ------------------------------------------------------------------------------------------ */
  function unit(root, canvas, ui) {
    var ctx = canvas.getContext('2d');
    var glow = document.createElement('canvas'), gctx = glow.getContext('2d');   // small copy, drawn back enlarged: a soft halo

    /* ---- arithmetic in Z[z], z = exp(2 pi i / 15): the integers of a number field of degree 8 ---- */
    var M = 15, D = 8, F = 4;
    var REPS = [1, 2, 4, 7];                       // the embeddings z -> z^1, z^2, z^4, z^7, one from each conjugate pair
    var TOP = [-1, 1, 0, -1, 1, -1, 0, 1];         // z^8 = -1 + z - z^3 + z^4 - z^5 + z^7
    var POW = [], EC = [], ES = [];                // z^j in the basis 1, z, ..., z^7; cosines and sines of the embeddings
    (function () {
      var v = [1, 0, 0, 0, 0, 0, 0, 0], j, k, top, nv;
      for (j = 0; j < M; j++) {
        POW.push(v);
        top = v[D - 1]; nv = [0];
        for (k = 0; k < D - 1; k++) nv.push(v[k]);
        for (k = 0; k < D; k++) nv[k] += top * TOP[k];
        v = nv;
      }
      for (j = 0; j < F; j++) {
        EC.push([]); ES.push([]);
        for (k = 0; k < D; k++) {
          EC[j].push(Math.cos(2 * Math.PI * REPS[j] * k / M));
          ES[j].push(Math.sin(2 * Math.PI * REPS[j] * k / M));
        }
      }
    })();
    function mul(x, y) {
      var c = [], out = [0, 0, 0, 0, 0, 0, 0, 0], i, j;
      for (i = 0; i < 2 * D - 1; i++) c.push(0);
      for (i = 0; i < D; i++) if (x[i]) for (j = 0; j < D; j++) c[i + j] += x[i] * y[j];
      for (i = 0; i < 2 * D - 1; i++) if (c[i]) for (j = 0; j < D; j++) out[j] += c[i] * POW[i][j];
      return out;
    }
    function conj(x) {                             // complex conjugation: z -> z^14
      var out = [0, 0, 0, 0, 0, 0, 0, 0], i, j;
      for (i = 0; i < D; i++) if (x[i]) for (j = 0; j < D; j++) out[j] += x[i] * POW[(M - i) % M][j];
      return out;
    }

    /* ---- the configuration ----
       The recipe is Sawin's form of the construction (arXiv:2605.20579), with the ideal taken to be Z[z] itself and
       the window centred at 0. Take alpha in the real subfield, positive in every embedding. The points are the
       x in Z[z] with |s_j(x)|^2 <= R^2 s_j(alpha) for all four embeddings s_j. Two points are joined when their
       difference b satisfies b * conj(b) = alpha. In the plane of s_j, scaled by 1 / sqrt(s_j(alpha)), joined
       points are at distance exactly 1, and no other two points are (s_j is injective on the field).
       Here alpha is a prime above 31 (31 = 2 * 15 + 1 splits completely), so there are 2 * 30 such b.
       In a field of degree 8 this does not beat a square grid; the disproof needs fields of far larger degree. */
    var BETA = [1, -1, -1, 2, -1, 0, 1, -2];       // one b, of norm 31
    var ALPHA = mul(BETA, conj(BETA));
    var RWIN = 1.45;
    var SC = [];                                   // 1 / sqrt(s_j(alpha))
    var n = 0, pairs = 0;
    var PX = [], PY = [];                          // PX[j][i], PY[j][i]: point i in the plane of embedding j
    var DEG = null, maxDeg = 1;                    // number of partners of each point
    var EA = null, EB = null, ELV = null;          // pairs: the later point, the earlier point, the level that completes the pair
    var LVL = null, LN = [], LP = [], levels = 0;  // level of each point (its place in the order of arrival); points and pairs of each level
    var UX = [], UY = [];                          // the 60 differences b in each embedding (unit complex numbers)

    function lattice(R) {
      var B = [], L = [], out = [], cf = [0, 0, 0, 0, 0, 0, 0, 0], lim = R * R * (1 + 1e-9), i, j, k, s;
      for (j = 0; j < F; j++) {
        B.push([]); B.push([]);
        for (k = 0; k < D; k++) { B[2 * j].push(EC[j][k] * SC[j]); B[2 * j + 1].push(ES[j][k] * SC[j]); }
      }
      for (i = 0; i < D; i++) {                    // Cholesky factor of the Gram matrix of the columns of B
        L.push([0, 0, 0, 0, 0, 0, 0, 0]);
        for (j = 0; j <= i; j++) {
          s = 0;
          for (k = 0; k < 2 * F; k++) s += B[k][i] * B[k][j];
          for (k = 0; k < j; k++) s -= L[i][k] * L[j][k];
          L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j];
        }
      }
      // The sum over the embeddings of |s_j(x)|^2 / s_j(alpha) is sum_i (sum_{k >= i} L[k][i] c_k)^2 <= 4 R^2.
      // Fix c_7, c_6, ..., c_0 in turn, each within the range the remaining budget allows (Fincke and Pohst).
      (function down(i, rem) {
        var k, t, s, r, rad, rest, re, im, j;
        if (i < 0) {
          for (j = 0; j < F; j++) {
            re = 0; im = 0;
            for (k = 0; k < D; k++) { re += cf[k] * B[2 * j][k]; im += cf[k] * B[2 * j + 1][k]; }
            if (re * re + im * im > lim) return;
          }
          out.push(cf.slice());
          return;
        }
        s = 0;
        for (k = i + 1; k < D; k++) s += L[k][i] * cf[k];
        r = L[i][i]; rad = Math.sqrt(rem > 0 ? rem : 0);
        for (t = Math.ceil((-rad - s) / r - 1e-12); t <= Math.floor((rad - s) / r + 1e-12); t++) {
          cf[i] = t;
          rest = rem - (r * t + s) * (r * t + s);
          if (rest >= -1e-9) down(i - 1, rest);
        }
        cf[i] = 0;
      })(D - 1, F * lim);
      return out;
    }
    function key(c) {                              // one number per lattice point (coordinates stay far inside +-16)
      var v = 0, k;
      for (k = D - 1; k >= 0; k--) v = v * 33 + c[k] + 16;
      return v;
    }
    function build() {
      var i, j, k, s, t, re, im, r;
      for (j = 0; j < F; j++) {
        s = 0;
        for (k = 0; k < D; k++) s += ALPHA[k] * EC[j][k];
        SC.push(1 / Math.sqrt(s));
      }
      var pts = lattice(RWIN), info = [];
      for (i = 0; i < pts.length; i++) {
        var p = { c: pts[i], x: [], y: [], r: 0 };
        for (j = 0; j < F; j++) {
          re = 0; im = 0;
          for (k = 0; k < D; k++) { re += pts[i][k] * EC[j][k]; im += pts[i][k] * ES[j][k]; }
          p.x.push(re * SC[j]); p.y.push(im * SC[j]);
          r = Math.sqrt(re * re + im * im) * SC[j];
          if (r > p.r) p.r = r;
        }
        info.push(p);
      }
      info.sort(function (a, b) { return a.r - b.r; });   // the order in which a growing window meets the points
      n = info.length;
      for (j = 0; j < F; j++) { PX.push(new Float32Array(n)); PY.push(new Float32Array(n)); }
      LVL = new Int32Array(n); DEG = new Int32Array(n);
      var at = new Map();
      for (i = 0; i < n; i++) {
        if (i === 0 || info[i].r - info[i - 1].r > 1e-7) { LN.push(0); LP.push(0); }
        LVL[i] = LN.length - 1; LN[LVL[i]]++;
        for (j = 0; j < F; j++) { PX[j][i] = info[i].x[j]; PY[j][i] = info[i].y[j]; }
        at.set(key(info[i].c), i);
      }
      levels = LN.length;
      // the differences b with b * conj(b) = alpha: exact, in integers
      var steps = lattice(1 + 1e-7).filter(function (c) {
        var q = mul(c, conj(c)), k;
        for (k = 0; k < D; k++) if (q[k] !== ALPHA[k]) return false;
        return true;
      });
      for (j = 0; j < F; j++) {
        UX.push([]); UY.push([]);
        for (s = 0; s < steps.length; s++) {
          re = 0; im = 0;
          for (k = 0; k < D; k++) { re += steps[s][k] * EC[j][k]; im += steps[s][k] * ES[j][k]; }
          UX[j].push(re * SC[j]); UY[j].push(im * SC[j]);
        }
      }
      var ea = [], eb = [], sum = [0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < n; i++) {
        for (s = 0; s < steps.length; s++) {
          for (k = 0; k < D; k++) sum[k] = info[i].c[k] + steps[s][k];
          t = at.get(key(sum));
          if (t !== undefined && t > i) { ea.push(t); eb.push(i); DEG[t]++; DEG[i]++; LP[LVL[t]]++; }
        }
      }
      pairs = ea.length;
      var order = [];
      for (i = 0; i < pairs; i++) order.push(i);
      order.sort(function (p, q) { return LVL[ea[p]] - LVL[ea[q]] || p - q; });   // in order of arrival
      EA = new Int32Array(pairs); EB = new Int32Array(pairs); ELV = new Int32Array(pairs);
      for (i = 0; i < pairs; i++) { EA[i] = ea[order[i]]; EB[i] = eb[order[i]]; ELV[i] = LVL[EA[i]]; }
      for (i = 0; i < n; i++) if (DEG[i] > maxDeg) maxDeg = DEG[i];
      NN = new Float32Array(n);                    // |x|^2 in the norm above
      for (i = 0; i < n; i++) for (j = 0; j < F; j++) NN[i] += PX[j][i] * PX[j][i] + PY[j][i] * PY[j][i];
      var hmax = 0;
      for (i = 0; i < n; i++) hmax = Math.max(hmax, Math.sqrt(NN[i]));
      ZC = hmax / 2;                               // turn the figure about the middle of its height
    }

    /* ---- the show: the window opens; then the direction of projection turns from one embedding to the next ---- */
    var RISE = 1.25, HOLD = 7.5, TURN = 14;                   // seconds: one level arriving; rest; one turn
    var TOUR = [[0, 1], [2, -1], [3, -1], [1, -1]];           // embedding and mirror sign of the four shadows, in order
    var phase = 'grow', clock = 0, stop = 0, theta = 0, lastText = -1;
    var moved = true, dirty = true, glint = 0, settled = false;   // the figure changed; the canvas needs repainting; a glow as a shadow settles

    /* ---- the third dimension ----
       The picture is an orthogonal projection of the eight-dimensional lattice onto a plane (in the norm
       sum_j |s_j(x)|^2 / s_j(alpha), for which the four embeddings are orthonormal coordinates). The height of a
       point is its distance from that plane in eight dimensions: sqrt(|x|^2 - |shadow|^2). It is unchanged by the
       roots of unity, so the figure keeps its symmetry. Seen from straight above (pitch 0) the picture is exactly the
       planar shadow; tilting shows how far each point lies from the plane. */
    var yaw = 0, pitch = 0, goal = null, vel = 0, drag = null, lastCam = 0, PMAX = 1.45, DZv = null, NN = null, ZC = 1;
    var viewBtn = root.querySelector('.hero-view');
    function tilted() { return goal !== null ? goal > 0.05 : pitch > 0.05; }
    function viewLabel() {
      if (!viewBtn) return;
      var t = tilted(), l = t ? (root.dataset.lTop || 'View from above') : (root.dataset.lTilt || 'Tilt the view');
      if (viewBtn.getAttribute('aria-label') !== l) { viewBtn.setAttribute('aria-label', l); viewBtn.title = l; }
      viewBtn.classList.toggle('is-tilted', t);
    }
    function camera(now, manual) {                 // inertia, easing to a chosen view, a slow turn while tilted; true while still moving
      var dt = lastCam ? clamp((now - lastCam) / 1000, 0, 0.05) : 0, y0 = yaw, p0 = pitch;
      lastCam = now;
      if (!drag) {
        if (goal !== null) {
          pitch += (goal - pitch) * (1 - Math.exp(-dt / 0.25));
          if (Math.abs(goal - pitch) < 0.002) { pitch = goal; goal = null; viewLabel(); }
        }
        if (vel) { yaw += vel * dt; vel *= Math.exp(-dt / 0.9); if (Math.abs(vel) < 0.01) vel = 0; }
        else if (!manual && pitch > 0.05 && !reduce.matches) yaw += 0.045 * dt;
      }
      if (yaw !== y0 || pitch !== p0) moved = true;
      return goal !== null || vel !== 0;
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId, touch: e.pointerType === 'touch' };
      vel = 0; goal = null;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
      root.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var K = 3.2 / Math.max(240, canvas.getBoundingClientRect().width);   // a drag across the figure turns it about half a turn
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Math.max(8, e.timeStamp - drag.t) / 1000;
      yaw += dx * K;
      if (!drag.touch) pitch = clamp(pitch + dy * K, 0, PMAX);      // (on a touch screen a vertical drag scrolls the page)
      vel = 0.6 * vel + 0.4 * dx * K / dt;
      drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp;
      moved = true; viewLabel(); ui.redraw();
    });
    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.timeStamp - drag.t > 80) vel = 0;      // the pointer had stopped before it was let go
      drag = null; root.classList.remove('is-dragging'); ui.redraw();
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('dblclick', function () { goal = 0; vel = 0; viewLabel(); ui.redraw(); });
    if (viewBtn) viewBtn.addEventListener('click', function () { goal = tilted() ? 0 : 1.0; vel = 0; viewLabel(); ui.redraw(); });
    var nf2 = new Intl.NumberFormat(lang === 'ko' ? 'ko-KR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function ease(u) { return u * u * u * (u * (6 * u - 15) + 10); }
    function due(k) { return 0.3 + (k < 3 ? 0.7 * k : 2.1 + 0.95 * (k - 3)); }   // when level k starts to arrive
    function rise(k) { return clamp((clock - due(k)) / RISE, 0, 1); }            // how far it has arrived

    /* ---- drawing: lines are summed into a buffer of floats, then mapped to colour, as for the comet ---- */
    var S = 0, acc = null, img = null, pix = null, lo = null, hi = null, unit0 = 1, TXv = null, TYv = null;
    var LUT = new Uint32Array(4096);               // summed line weight -> one RGBA pixel
    var LITTLE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
    var quality = 1, slow = 0, seen = [0, 0, 1];   // fewer buffer cells on a device that cannot keep up
    function tone(gain) {                          // few lines: blue and violet; many lines through one place: gold, then ivory
      for (var i = 0; i < 4096; i++) {
        var v = gain * i / 256, t = 1 - Math.exp(-0.85 * v), k = 1;
        while (k < STOPS.length - 1 && STOPS[k][0] < t) k++;
        var a = STOPS[k - 1], b = STOPS[k], u = (t - a[0]) / (b[0] - a[0]);
        var R = (a[1] + (b[1] - a[1]) * u) | 0, G = (a[2] + (b[2] - a[2]) * u) | 0, B = (a[3] + (b[3] - a[3]) * u) | 0;
        var A = (255 * (1 - Math.exp(-2.2 * v))) | 0;
        LUT[i] = (LITTLE ? (A << 24) | (B << 16) | (G << 8) | R : (R << 24) | (G << 16) | (B << 8) | A) >>> 0;
      }
      LUT[0] = 0;
    }

    var WIDE = window.matchMedia   // the same test as in essay.css
      ? window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1), (min-width: 480px) and (min-aspect-ratio: 4/3)') : { matches: true };
    function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }
    function reserve() {                           // room for the longest readout, so that nothing below it moves when the text changes
      var ro = ui.readout, data = root.dataset, h = 0, a, b;
      if (!ro || !ui.num || !ui.sub) return;
      var keep = [ui.num.textContent, ui.sub.textContent];
      var nums = [fill(data.lCount, { n: nf.format(n), u: nf.format(pairs) }), fill(data.lLengths, { n: nf.format(n), lo: nf2.format(0.88), hi: nf2.format(1.88) })];
      var subs = [data.lGrow || '', fill(data.lView, { k: 4 }), data.lTurn || '', data.lSide || ''];
      ro.style.minHeight = '';
      for (a = 0; a < nums.length; a++) for (b = 0; b < subs.length; b++) {
        ui.num.textContent = nums[a]; ui.sub.textContent = subs[b];
        h = Math.max(h, ro.getBoundingClientRect().height);
      }
      ui.num.textContent = keep[0]; ui.sub.textContent = keep[1];
      ro.style.minHeight = Math.ceil(h) + 'px';
    }
    function resize(cw, chh, dpr) {
      var head = ui.headerHeight(), left = ui.alignLeft(), d, px, py, y, w;
      seen = [cw, chh, dpr];
      if (WIDE.matches) {                          // a column of text at the left, the figure beside it (see essay.css)
        var em = rem(), free = cw - 24 - left - 40;        // what the column and the figure share: a gap of 40 between them, 24 at the right
        d = Math.max(140, Math.min(chh - head - 20, free - 21 * em));
        var room = Math.round(Math.min(free - d, 26 * em));         // the column: 21rem to 26rem wide (less only on a very small screen)
        py = head + (chh - head) / 2;
        px = left + room + 40 + d / 2;
        root.style.setProperty('--hero-col', room + 'px');
        reserve();
      } else {                                     // the readout on top, the figure below it
        reserve();
        y = Math.max(ui.readoutBottom(), head + 40) + 6;
        d = Math.max(60, Math.min(cw - 12, chh - y - 6));
        px = cw / 2; py = y + d / 2;
      }
      var side = d * 1.12, scale = clamp(dpr, 1.5, cw < 700 ? 1.6 : 2);   // finer than the screen's own grid: thin lines
      if (side * scale > 960) scale = 960 / side;
      scale *= quality;
      canvas.style.left = (px - side / 2) + 'px'; canvas.style.top = (py - side / 2) + 'px';
      canvas.style.width = side + 'px'; canvas.style.height = side + 'px';
      S = Math.max(64, Math.round(side * scale));
      canvas.width = S; canvas.height = S;
      glow.width = glow.height = Math.max(8, Math.round(S / 6));
      acc = new Float32Array(S * S);
      img = ctx.createImageData(S, S);
      pix = new Uint32Array(img.data.buffer);
      lo = new Int32Array(S); hi = new Int32Array(S);      // only the inscribed disc is ever drawn
      for (y = 0; y < S; y++) {
        w = Math.sqrt(Math.max(0, S * S / 4 - (y + 0.5 - S / 2) * (y + 0.5 - S / 2)));
        lo[y] = Math.max(1, Math.floor(S / 2 - w)); hi[y] = Math.min(S - 1, Math.ceil(S / 2 + w));
      }
      unit0 = S / 2 / 1.12 / RWIN;
      tone(clamp(0.25 * unit0 / 250, 0.12, 0.34));          // a smaller figure packs more lines into each cell: keep the brightness the same
      if (!TXv) { TXv = new Float32Array(n); TYv = new Float32Array(n); DZv = new Float32Array(n); }
      moved = true;
    }

    function seg(x0, y0, x1, y1, w) {              // one line of weight w, two buffer cells wide, anti-aliased
      var dx = x1 - x0, dy = y1 - y0, t, g, k, x, y, i, f, e;
      if (!(x0 > 1 && x0 < S - 2 && x1 > 1 && x1 < S - 2 && y0 > 1 && y0 < S - 2 && y1 > 1 && y1 < S - 2)) return;
      if ((dx < 0 ? -dx : dx) >= (dy < 0 ? -dy : dy)) {
        if (dx < 0) { t = x0; x0 = x1; x1 = t; t = y0; y0 = y1; y1 = t; dx = -dx; dy = -dy; }
        if (dx < 1e-6) return;
        g = dy / dx; k = w * Math.sqrt(1 + g * g);
        x = Math.ceil(x0); e = Math.floor(x1); y = y0 + (x - x0) * g;
        for (; x <= e; x++, y += g) { i = y | 0; f = y - i; i = i * S + x; acc[i] += k * (1 - f); acc[i + S] += k * f; }
      } else {
        if (dy < 0) { t = x0; x0 = x1; x1 = t; t = y0; y0 = y1; y1 = t; dx = -dx; dy = -dy; }
        g = dx / dy; k = w * Math.sqrt(1 + g * g);
        y = Math.ceil(y0); e = Math.floor(y1); x = x0 + (y - y0) * g;
        for (; y <= e; y++, x += g) { i = x | 0; f = x - i; i = y * S + i; acc[i] += k * (1 - f); acc[i + 1] += k * f; }
      }
    }

    function trace() {                             // the figure as it stands now, into the buffer and through the colour map
      var a = TOUR[stop % 4], b = TOUR[(stop + 1) % 4], c = Math.cos(theta), s = Math.sin(theta);
      var ax = PX[a[0]], ay = PY[a[0]], bx = PX[b[0]], by = PY[b[0]], i, k, x, y, z, r, ext = RWIN * RWIN, p, q;
      var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), xr, yr, dz, f;
      for (i = 0; i < n; i++) {                    // the plane of projection, turned by theta from shadow a towards shadow b
        x = c * ax[i] + s * bx[i]; y = c * a[1] * ay[i] + s * b[1] * by[i];
        z = Math.sqrt(Math.max(0, NN[i] - x * x - y * y)) - ZC;   // distance from the plane (see above), centred
        xr = x * cy - y * sy; yr = x * sy + y * cy;            // turn about the vertical axis, then tip towards the reader
        dz = z * cp - yr * sp;                     // towards the reader
        f = 1 / (1 - 0.12 * sp * dz / RWIN);       // a little perspective once tilted; none from straight above
        TXv[i] = xr * f; TYv[i] = (yr * cp + z * sp) * f; DZv[i] = dz;
        r = TXv[i] * TXv[i] + TYv[i] * TYv[i]; if (r > ext) ext = r;
      }
      var u = unit0 * Math.min(1, 1.04 * RWIN / Math.sqrt(ext)), h = S / 2;  // step back while the shadow is wider
      for (i = 0; i < n; i++) { TXv[i] = h + u * TXv[i]; TYv[i] = h - u * TYv[i]; }
      var shade = sp > 0.001 ? 0.5 * sp / RWIN : 0, w, dim = 1 - 0.45 * sp;   // nearer is brighter; seen edge-on, lines pile up, so each is fainter

      acc.fill(0);
      var growing = phase === 'grow', lv = -1, t = 1, e = 1;
      for (k = 0; k < pairs; k++) {
        if (growing) {
          if (ELV[k] !== lv) { lv = ELV[k]; t = rise(lv); e = clamp((t - 0.08) / 0.92, 0, 1); e = 1 - (1 - e) * (1 - e) * (1 - e); }
          if (e <= 0) break;                       // later pairs belong to levels that have not arrived
        }
        p = EA[k]; q = EB[k];
        w = shade ? dim * clamp(1 + shade * (DZv[p] + DZv[q]) / 2, 0.3, 1.7) : 1;
        if (e >= 1) seg(TXv[p], TYv[p], TXv[q], TYv[q], w);
        else if (LVL[q] === lv) {                  // both ends are new: the thread grows from both
          seg(TXv[p], TYv[p], TXv[p] + (TXv[q] - TXv[p]) * e / 2, TYv[p] + (TYv[q] - TYv[p]) * e / 2, w);
          seg(TXv[q], TYv[q], TXv[q] + (TXv[p] - TXv[q]) * e / 2, TYv[q] + (TYv[p] - TYv[q]) * e / 2, w);
        } else seg(TXv[p], TYv[p], TXv[p] + (TXv[q] - TXv[p]) * e, TYv[p] + (TYv[q] - TYv[p]) * e, w);
      }

      var v, row, end;
      for (y = 0; y < S; y++) {
        row = y * S; end = row + hi[y];
        for (k = row + lo[y]; k < end; k++) {
          v = acc[k] * 256;
          pix[k] = LUT[v > 4095 ? 4095 : v | 0];
        }
      }
    }

    function show() {                              // onto the canvas: the lines, the points, a halo
      var growing = phase === 'grow', px1 = S / 560, i, t, v, r, near = Math.sin(pitch) / RWIN;
      ctx.putImageData(img, 0, 0);
      ctx.fillStyle = 'rgb(255, 246, 226)';        // the points themselves, brighter the more partners they have
      for (i = 0; i < n; i++) {
        t = growing ? clamp(rise(LVL[i]) / 0.3, 0, 1) : 1;
        if (t <= 0) break;                         // later levels have not arrived (the points are in order of arrival)
        v = DEG[i] / maxDeg;
        ctx.globalAlpha = t * (0.5 + 0.5 * v) * clamp(1 + 0.5 * near * DZv[i], 0.25, 1);
        r = px1 * (0.85 + 0.75 * v) * (1 + 1.6 * (1 - t));
        ctx.beginPath(); ctx.arc(TXv[i], TYv[i], r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;

      gctx.clearRect(0, 0, glow.width, glow.height);
      gctx.drawImage(canvas, 0, 0, glow.width, glow.height);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4 + 0.3 * glint;
      ctx.drawImage(glow, 0, 0, S, S);
      if (growing) {                               // a point arriving: a short flash
        for (i = 0; i < n; i++) {
          t = rise(LVL[i]);
          if (t <= 0) break;
          if (t >= 0.6) continue;
          v = 1 - t / 0.6; r = px1 * (2.2 + 2.6 * v);
          var grd = ctx.createRadialGradient(TXv[i], TYv[i], 0, TXv[i], TYv[i], r);
          grd.addColorStop(0, 'rgba(255, 240, 210, ' + (0.55 * v * v).toFixed(3) + ')');
          grd.addColorStop(1, 'rgba(255, 240, 210, 0)');
          ctx.globalAlpha = 1; ctx.fillStyle = grd;
          ctx.fillRect(TXv[i] - r, TYv[i] - r, 2 * r, 2 * r);
        }
      }
      ctx.restore();
    }

    function text(now, force) {
      if (!force && now - lastText < 90 && lastText >= 0 && now >= lastText) return;
      lastText = now;
      var data = root.dataset, shown = n, made = pairs, k, t;
      if (phase === 'turn') {                      // a difference seen as u in one shadow and v in the next now has length
                                                   // |cos(theta) u + sin(theta) v| = sqrt(1 + sin(2 theta) g), g = cosine of the angle from u to v
        var a = TOUR[stop % 4], b = TOUR[(stop + 1) % 4], s2 = Math.sin(2 * theta), mn = 1, mx = -1, g;
        for (k = 0; k < UX[0].length; k++) {
          g = UX[a[0]][k] * UX[b[0]][k] + a[1] * UY[a[0]][k] * b[1] * UY[b[0]][k];
          if (g < mn) mn = g; if (g > mx) mx = g;
        }
        write(ui.num, fill(data.lLengths, { n: nf.format(n), lo: nf2.format(Math.sqrt(Math.max(0, 1 + s2 * mn))), hi: nf2.format(Math.sqrt(1 + s2 * mx)) }));
        write(ui.sub, data.lTurn || '');
        return;
      }
      if (phase === 'grow') {
        shown = 0; made = 0;
        for (k = 0; k < levels; k++) {
          t = rise(k);
          if (t <= 0) break;
          shown += LN[k]; made += Math.round(LP[k] * clamp((t - 0.08) / 0.92, 0, 1));
        }
      }
      write(ui.num, fill(data.lCount, { n: nf.format(shown), u: nf.format(made) }));
      write(ui.sub, phase === 'grow' ? (data.lGrow || '') : pitch > 0.05 ? (data.lSide || '') : fill(data.lView, { k: stop % 4 + 1 }));
    }

    function step(dt) {
      clock += dt;
      if (phase === 'grow') {
        moved = true;
        if (clock > due(levels - 1) + RISE) { phase = 'hold'; clock = 0; settled = true; }
      } else if (phase === 'hold') {               // nothing moves: every segment has length 1
        if (settled) {                             // the figure has just locked into place: it glows for a moment
          glint = clock < 0.2 ? clock / 0.2 : Math.exp(-(clock - 0.2) / 0.55);
          if (glint < 0.01) { glint = 0; settled = false; }
          dirty = true;
        }
        if (clock > HOLD) { phase = 'turn'; clock = 0; glint = 0; settled = false; }
      } else {
        moved = true;
        theta = Math.PI / 2 * ease(clamp(clock / TURN, 0, 1));
        if (clock >= TURN) { phase = 'hold'; clock = 0; theta = 0; stop++; settled = true; }
      }
    }

    function draw(now, manual) {
      if (!img) return;
      var busy = camera(now || performance.now(), manual);
      var t0 = moved ? performance.now() : 0;
      if (moved) { moved = false; dirty = true; trace(); }
      if (dirty) { dirty = false; show(); }
      if (t0) {                                    // a frame of motion: if such frames keep taking too long, use a coarser buffer
        slow = performance.now() - t0 > 13 ? slow + 1 : Math.max(0, slow - 2);
        if (slow > 24 && quality > 0.7) {
          quality *= 0.8; slow = 0;
          resize(seen[0], seen[1], seen[2]);
          moved = false; trace(); show();          // (the canvas was cleared: repaint it in the same frame)
        }
      }
      text(now || 0, manual);
      if (manual && busy) ui.redraw();             // paused, but the figure is still coasting or easing: keep drawing
    }

    function still() {                             // for readers who prefer no motion: the first shadow, complete
      phase = 'hold'; clock = 0; theta = 0; stop = 0; glint = 0; settled = false; moved = true;
    }

    build();
    viewLabel();
    return { resize: resize, step: step, draw: draw, still: still };
  }

  /* ------------------------------------------------------------------------------------------ */
  var kinds = { goldbach: goldbach, unit: unit };
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
