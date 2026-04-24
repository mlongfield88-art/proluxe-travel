/* ============================================================
   ProLuxe Travel , Private referral page
   Two motion beats:
     1. Olive branch canvas hero (full-bleed, muted, grow-in + idle drift)
     2. Letter-by-letter headline + word-by-word subline on load
   Reduced-motion safe. Canvas pauses when off-screen.
   ============================================================ */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
     Animation 2: Letter-by-letter hero headline + word subline
     Characters are wrapped per-word so words never break mid-letter.
     ------------------------------------------------------------ */
  function splitHeadline() {
    var headline = document.querySelector('.private-hero__headline');
    var subline = document.querySelector('.private-hero__subline');
    if (!headline || !subline) return;

    var headlineText = headline.textContent;
    var sublineText = subline.textContent;
    headline.textContent = '';
    subline.textContent = '';
    headline.setAttribute('aria-label', headlineText);
    subline.setAttribute('aria-label', sublineText);

    // Headline: wrap each word so "handling" cannot break across lines.
    // Inside each word wrapper, every character gets its own span for stagger.
    var chars = [];
    var headlineTokens = headlineText.split(/(\s+)/);
    for (var i = 0; i < headlineTokens.length; i++) {
      var token = headlineTokens[i];
      if (/^\s+$/.test(token)) {
        headline.appendChild(document.createTextNode(token));
        continue;
      }
      var wordWrap = document.createElement('span');
      wordWrap.className = 'private-word-wrap';
      wordWrap.setAttribute('aria-hidden', 'true');
      for (var c = 0; c < token.length; c++) {
        var ch = token.charAt(c);
        var span = document.createElement('span');
        span.className = 'private-char';
        span.textContent = ch;
        wordWrap.appendChild(span);
        chars.push(span);
      }
      headline.appendChild(wordWrap);
    }

    // Subline: one span per word (already naturally word-bounded)
    var words = sublineText.split(/(\s+)/);
    var wordSpans = [];
    for (var j = 0; j < words.length; j++) {
      if (/^\s+$/.test(words[j])) {
        subline.appendChild(document.createTextNode(words[j]));
      } else {
        var wspan = document.createElement('span');
        wspan.className = 'private-word';
        wspan.setAttribute('aria-hidden', 'true');
        wspan.textContent = words[j];
        subline.appendChild(wspan);
        wordSpans.push(wspan);
      }
    }

    if (REDUCED) {
      chars.forEach(function (c) { c.style.opacity = '1'; c.style.transform = 'none'; });
      wordSpans.forEach(function (w) { w.style.opacity = '1'; w.style.transform = 'none'; });
      return;
    }

    // Initial state
    chars.forEach(function (c) { c.style.opacity = '0'; c.style.transform = 'translateY(10px)'; });
    wordSpans.forEach(function (w) { w.style.opacity = '0'; w.style.transform = 'translateY(10px)'; });

    if (typeof gsap === 'undefined') {
      // Fallback , reveal without motion
      chars.forEach(function (c) { c.style.opacity = '1'; c.style.transform = 'none'; });
      wordSpans.forEach(function (w) { w.style.opacity = '1'; w.style.transform = 'none'; });
      return;
    }

    var headlineStagger = 0.035; // 35ms per character
    var headlineDuration = chars.length * headlineStagger;
    var sublineStartOffset = headlineDuration * 0.7; // subline starts at 70% of headline

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      stagger: headlineStagger,
    });

    gsap.to(wordSpans, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.09,
      delay: sublineStartOffset,
    });
  }

  /* ------------------------------------------------------------
     Animation 1: Olive branch canvas (adapted from waypoints.js)
     Full-bleed hero background, muted, single entrance + idle drift.
     ------------------------------------------------------------ */
  function wireCanvas() {
    var canvas = document.getElementById('privateCanvas');
    if (!canvas) return;

    var host = canvas.parentElement;
    var ctx = canvas.getContext('2d');

    var CREAM = { r: 245, g: 240, b: 232 };
    var OLIVE = { r: 66, g: 70, b: 50 };

    var W, H, dpr;
    var branches = [];
    var leaves = [];
    var seeds = [];
    var t = 0;
    var rafId = null;
    var running = false;
    var initialised = false;

    var branchMaxAge = 2000; // slow decay so branches linger
    var branchGrowSpeed = 1.4;
    var branchMaxLen = 110;
    var branchMinLen = 22;
    var splitChance = 0.55;
    var leafChance = 0.8;
    var seedCount = 18;
    var seedCountMobile = 10;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = host.offsetWidth;
      H = host.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var target = W < 768 ? seedCountMobile : seedCount;
      while (seeds.length < target) seeds.push(createSeed());
      while (seeds.length > target) seeds.pop();
    }

    function createSeed() {
      return {
        x: Math.random() * (W || 1),
        y: Math.random() * (H || 1),
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.08 - 0.03,
        size: 1 + Math.random() * 1.4,
        opacity: 0.05 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      };
    }

    function createBranch(x, y, angle, len, depth) {
      return {
        x0: x, y0: y,
        angle: angle,
        targetLen: Math.min(len, branchMaxLen),
        currentLen: 0,
        depth: depth || 0,
        age: 0,
        done: false,
        children: [],
        hasLeaf: false,
        bend: (Math.random() - 0.5) * 0.4,
      };
    }

    function seedInitialGrowth() {
      // Plant three gentle branch roots at staggered points along the bottom.
      // Growing upward. Keep it sparse so the headline stays dominant.
      var anchors = [
        { x: W * 0.18, y: H + 10 },
        { x: W * 0.52, y: H + 10 },
        { x: W * 0.82, y: H + 10 },
      ];
      for (var i = 0; i < anchors.length; i++) {
        var baseAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        var len = 70 + Math.random() * 40;
        branches.push(createBranch(anchors[i].x, anchors[i].y, baseAngle, len, 0));
      }
    }

    function growBranch(b) {
      if (b.done) return;
      b.currentLen += branchGrowSpeed + Math.random() * 0.3;
      if (b.currentLen >= b.targetLen) {
        b.currentLen = b.targetLen;
        b.done = true;

        if (b.depth < 3 && b.targetLen > branchMinLen && branches.length < 80) {
          var numChildren = Math.random() < splitChance ? 2 : (Math.random() < 0.3 ? 1 : 0);
          for (var c = 0; c < numChildren; c++) {
            var childAngle = b.angle + b.bend + (Math.random() - 0.5) * 1.0;
            var childLen = b.targetLen * (0.55 + Math.random() * 0.3);
            if (childLen > branchMinLen) {
              var endX = b.x0 + Math.cos(b.angle + b.bend * 0.5) * b.currentLen;
              var endY = b.y0 + Math.sin(b.angle + b.bend * 0.5) * b.currentLen;
              var child = createBranch(endX, endY, childAngle, childLen, b.depth + 1);
              branches.push(child);
              b.children.push(child);
            }
          }
        }

        if (b.depth >= 1 && Math.random() < leafChance && !b.hasLeaf) {
          b.hasLeaf = true;
          var lx = b.x0 + Math.cos(b.angle + b.bend * 0.5) * b.currentLen;
          var ly = b.y0 + Math.sin(b.angle + b.bend * 0.5) * b.currentLen;
          leaves.push({
            x: lx, y: ly,
            angle: b.angle + (Math.random() - 0.5) * 0.6,
            size: 3 + Math.random() * 3,
            age: 0,
            maxAge: branchMaxAge,
            growth: 0,
          });
        }
      }
    }

    function drawBranch(b) {
      // Gentle fade once branches have hit old age, but keep most of them visible.
      var fade = b.age < branchMaxAge * 0.7 ? 1 : 1 - ((b.age - branchMaxAge * 0.7) / (branchMaxAge * 0.3));
      if (fade <= 0) return;

      var endX = b.x0 + Math.cos(b.angle + b.bend * 0.5) * b.currentLen;
      var endY = b.y0 + Math.sin(b.angle + b.bend * 0.5) * b.currentLen;
      var midX = (b.x0 + endX) / 2 + Math.cos(b.angle + Math.PI / 2) * b.bend * b.currentLen * 0.3;
      var midY = (b.y0 + endY) / 2 + Math.sin(b.angle + Math.PI / 2) * b.bend * b.currentLen * 0.3;

      var thickness = Math.max(0.4, 1.6 - b.depth * 0.3);
      // Muted olive so the headline stays dominant.
      var alpha = (0.14 + (1 - b.depth / 4) * 0.08) * fade;

      ctx.strokeStyle = 'rgba(' + OLIVE.r + ',' + OLIVE.g + ',' + OLIVE.b + ',' + alpha + ')';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x0, b.y0);
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.stroke();
    }

    function drawLeaf(leaf) {
      var fade = leaf.age < leaf.maxAge * 0.7 ? 1 : 1 - ((leaf.age - leaf.maxAge * 0.7) / (leaf.maxAge * 0.3));
      if (fade <= 0) return;

      leaf.growth = Math.min(leaf.growth + 0.03, 1);
      var s = leaf.size * leaf.growth;

      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);

      var alpha = 0.18 * fade;
      ctx.fillStyle = 'rgba(' + OLIVE.r + ',' + OLIVE.g + ',' + OLIVE.b + ',' + alpha + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.8, s * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(' + CREAM.r + ',' + CREAM.g + ',' + CREAM.b + ',' + alpha * 0.4 + ')';
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(-s * 1.4, 0);
      ctx.lineTo(s * 1.4, 0);
      ctx.stroke();
      ctx.restore();
    }

    function animate() {
      if (!running) return;
      t++;
      ctx.clearRect(0, 0, W, H);

      // Ambient seeds always drift
      for (var i = 0; i < seeds.length; i++) {
        var s = seeds[i];
        s.x += s.vx + Math.sin(t * 0.003 + s.phase) * 0.12;
        s.y += s.vy + Math.cos(t * 0.002 + s.phase) * 0.06;
        if (s.x < -10) s.x = W + 10;
        if (s.x > W + 10) s.x = -10;
        if (s.y < -10) s.y = H + 10;
        if (s.y > H + 10) s.y = -10;

        ctx.fillStyle = 'rgba(' + OLIVE.r + ',' + OLIVE.g + ',' + OLIVE.b + ',' + s.opacity + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Grow branches
      for (var j = branches.length - 1; j >= 0; j--) {
        var b = branches[j];
        growBranch(b);
        b.age++;
        drawBranch(b);
        if (b.age > branchMaxAge) {
          branches.splice(j, 1);
        }
      }

      for (var k = leaves.length - 1; k >= 0; k--) {
        var leaf = leaves[k];
        leaf.age++;
        drawLeaf(leaf);
        if (leaf.age > leaf.maxAge) {
          leaves.splice(k, 1);
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    function drawStaticFrame() {
      // For reduced-motion: seed growth, tick a fixed number of frames with drawing only, then stop.
      seedInitialGrowth();
      // Fast-forward growth
      var maxIter = 200;
      for (var iter = 0; iter < maxIter; iter++) {
        for (var j = 0; j < branches.length; j++) growBranch(branches[j]);
      }
      ctx.clearRect(0, 0, W, H);
      for (var s = 0; s < seeds.length; s++) {
        var sd = seeds[s];
        ctx.fillStyle = 'rgba(' + OLIVE.r + ',' + OLIVE.g + ',' + OLIVE.b + ',' + sd.opacity + ')';
        ctx.beginPath();
        ctx.arc(sd.x, sd.y, sd.size, 0, Math.PI * 2);
        ctx.fill();
      }
      for (var bi = 0; bi < branches.length; bi++) drawBranch(branches[bi]);
      for (var li = 0; li < leaves.length; li++) {
        leaves[li].growth = 1;
        drawLeaf(leaves[li]);
      }
    }

    function start() {
      if (initialised) return;
      initialised = true;
      resize();
      if (REDUCED) {
        drawStaticFrame();
        return;
      }
      seedInitialGrowth();
      running = true;
      rafId = requestAnimationFrame(animate);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function resume() {
      if (!initialised || REDUCED) return;
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () {
      if (!initialised) return;
      resize();
    });

    // Lazy-init via IntersectionObserver , wait until hero is actually on screen.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!initialised) start();
            else resume();
          } else {
            stop();
          }
        });
      }, { threshold: 0.05 });
      io.observe(host);
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  function init() {
    splitHeadline();
    wireCanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
