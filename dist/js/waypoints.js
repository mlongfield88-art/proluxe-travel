/* ============================================================
   ProLuxe Travel — Olive Canopy
   Interactive fractal olive branches grow from the cursor.
   Branches split organically, sprouting olive leaves at tips.
   Old growth fades like seasons turning. Ambient seed particles
   drift in the background for texture.
   ============================================================ */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.getElementById('waypointCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hero = canvas.closest('.hero');

  /* ---------- PALETTE ---------- */
  var CREAM  = { r: 245, g: 240, b: 232 };
  var OLIVE  = { r: 66,  g: 70,  b: 50  };
  var TEAL   = { r: 45,  g: 106, b: 106 };

  /* ---------- CONFIG ---------- */
  var branchSpawnInterval = 4;     // frames between new branch spawns while moving
  var branchMaxAge = 320;          // frames before full fade
  var branchGrowSpeed = 2.2;       // px per frame growth
  var branchMaxLen = 100;          // max segment length before splitting
  var branchMinLen = 18;           // min length before stopping
  var splitChance = 0.55;          // chance a branch splits at end
  var leafChance = 0.75;           // chance a leaf appears at a tip
  var maxBranches = 150;           // cap to prevent slowdown
  var seedCount = 25;              // ambient floating seeds
  var seedCountMobile = 12;

  /* ---------- STATE ---------- */
  var branches = [];
  var leaves = [];
  var seeds = [];
  var mouse = { x: null, y: null, px: null, py: null, moving: false };
  var spawnTimer = 0;
  var W, H, dpr;

  /* ---------- RESIZE ---------- */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = W < 768 ? seedCountMobile : seedCount;
    while (seeds.length < target) seeds.push(createSeed());
    while (seeds.length > target) seeds.pop();
  }

  /* ---------- AMBIENT SEEDS ---------- */
  function createSeed() {
    return {
      x: Math.random() * (W || 1),
      y: Math.random() * (H || 1),
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1 - 0.05,
      size: 1 + Math.random() * 1.5,
      opacity: 0.08 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    };
  }

  /* ---------- BRANCH CREATION ---------- */
  function createBranch(x, y, angle, len, depth) {
    return {
      x0: x, y0: y,
      angle: angle,
      targetLen: Math.min(len, branchMaxLen),
      currentLen: 0,
      depth: depth || 0,
      age: 0,
      done: false,      // finished growing
      children: [],
      hasLeaf: false,
      // Curve control — slight random bend
      bend: (Math.random() - 0.5) * 0.4,
    };
  }

  /* ---------- SPAWN BRANCH FROM CURSOR ---------- */
  function spawnFromCursor() {
    if (mouse.x === null || branches.length >= maxBranches) return;

    // Grow upward with random spread (like a tree reaching up)
    var baseAngle = -Math.PI / 2; // upward
    var spread = (Math.random() - 0.5) * Math.PI * 0.8;
    var angle = baseAngle + spread;
    var len = 40 + Math.random() * 50;

    branches.push(createBranch(mouse.x, mouse.y, angle, len, 0));
  }

  /* ---------- GROW A BRANCH ---------- */
  function growBranch(b) {
    if (b.done) return;

    b.currentLen += branchGrowSpeed + Math.random() * 0.5;

    if (b.currentLen >= b.targetLen) {
      b.currentLen = b.targetLen;
      b.done = true;

      // Possibly split into child branches
      if (b.depth < 4 && b.targetLen > branchMinLen && branches.length < maxBranches) {
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

      // Leaf at tip
      if (b.depth >= 1 && Math.random() < leafChance && !b.hasLeaf) {
        b.hasLeaf = true;
        var endX = b.x0 + Math.cos(b.angle + b.bend * 0.5) * b.currentLen;
        var endY = b.y0 + Math.sin(b.angle + b.bend * 0.5) * b.currentLen;
        leaves.push({
          x: endX, y: endY,
          angle: b.angle + (Math.random() - 0.5) * 0.6,
          size: 3 + Math.random() * 4,
          age: 0,
          maxAge: branchMaxAge,
          growth: 0,
        });
      }
    }
  }

  /* ---------- DRAW BRANCH ---------- */
  function drawBranch(b) {
    var fade = 1 - (b.age / branchMaxAge);
    if (fade <= 0) return;

    var endX = b.x0 + Math.cos(b.angle + b.bend * 0.5) * b.currentLen;
    var endY = b.y0 + Math.sin(b.angle + b.bend * 0.5) * b.currentLen;

    // Curve via quadratic bezier with bend control point
    var midX = (b.x0 + endX) / 2 + Math.cos(b.angle + Math.PI / 2) * b.bend * b.currentLen * 0.3;
    var midY = (b.y0 + endY) / 2 + Math.sin(b.angle + Math.PI / 2) * b.bend * b.currentLen * 0.3;

    // Thinner at higher depth
    var thickness = Math.max(0.4, 1.8 - b.depth * 0.3);
    var alpha = (0.18 + (1 - b.depth / 4) * 0.14) * fade;

    ctx.strokeStyle = 'rgba(' + CREAM.r + ',' + CREAM.g + ',' + CREAM.b + ',' + alpha + ')';
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x0, b.y0);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
  }

  /* ---------- DRAW LEAF ---------- */
  function drawLeaf(leaf) {
    var fade = 1 - (leaf.age / leaf.maxAge);
    if (fade <= 0) return;

    // Grow in
    leaf.growth = Math.min(leaf.growth + 0.04, 1);
    var s = leaf.size * leaf.growth;

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);

    // Olive leaf shape — elongated ellipse
    var alpha = 0.25 * fade;
    ctx.fillStyle = 'rgba(' + OLIVE.r + ',' + OLIVE.g + ',' + OLIVE.b + ',' + alpha + ')';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.8, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lighter vein line
    ctx.strokeStyle = 'rgba(' + CREAM.r + ',' + CREAM.g + ',' + CREAM.b + ',' + alpha * 0.5 + ')';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-s * 1.4, 0);
    ctx.lineTo(s * 1.4, 0);
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- MOUSE TRACKING ---------- */
  var moveTimeout;
  hero.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.moving = true;
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(function () { mouse.moving = false; }, 100);
  });
  hero.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
    mouse.moving = false;
  });

  /* ---------- TOUCH TRACKING ---------- */
  var touchThrottle = 0;
  hero.addEventListener('touchstart', function (e) {
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.moving = true;
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(function () { mouse.moving = false; }, 200);
  }, { passive: true });

  hero.addEventListener('touchmove', function (e) {
    var now = Date.now();
    if (now - touchThrottle < 200) return;
    touchThrottle = now;
    var touch = e.touches[0];
    var rect = canvas.getBoundingClientRect();
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.moving = true;
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(function () { mouse.moving = false; }, 200);
  }, { passive: true });

  hero.addEventListener('touchend', function () {
    mouse.moving = false;
  }, { passive: true });

  /* ---------- ANIMATION LOOP ---------- */
  var t = 0;

  function animate() {
    t++;
    ctx.clearRect(0, 0, W, H);

    /* --- Ambient seeds --- */
    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i];
      s.x += s.vx + Math.sin(t * 0.003 + s.phase) * 0.15;
      s.y += s.vy + Math.cos(t * 0.002 + s.phase) * 0.08;

      // Wrap around
      if (s.x < -10) s.x = W + 10;
      if (s.x > W + 10) s.x = -10;
      if (s.y < -10) s.y = H + 10;
      if (s.y > H + 10) s.y = -10;

      // Brighten near mouse
      var op = s.opacity;
      if (mouse.x !== null) {
        var dx = mouse.x - s.x;
        var dy = mouse.y - s.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) op += (1 - d / 200) * 0.2;
      }

      ctx.fillStyle = 'rgba(' + CREAM.r + ',' + CREAM.g + ',' + CREAM.b + ',' + op + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- Spawn new branches from cursor --- */
    if (mouse.moving && mouse.x !== null) {
      spawnTimer++;
      if (spawnTimer >= branchSpawnInterval) {
        spawnTimer = 0;
        spawnFromCursor();
      }
    }

    /* --- Grow and age branches --- */
    for (var i = branches.length - 1; i >= 0; i--) {
      var b = branches[i];
      growBranch(b);
      b.age++;
      drawBranch(b);

      // Remove fully faded
      if (b.age > branchMaxAge) {
        branches.splice(i, 1);
      }
    }

    /* --- Age and draw leaves --- */
    for (var i = leaves.length - 1; i >= 0; i--) {
      var leaf = leaves[i];
      leaf.age++;
      drawLeaf(leaf);

      if (leaf.age > leaf.maxAge) {
        leaves.splice(i, 1);
      }
    }

    /* --- Subtle mouse glow --- */
    if (mouse.x !== null) {
      var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60);
      grad.addColorStop(0, 'rgba(' + TEAL.r + ',' + TEAL.g + ',' + TEAL.b + ',0.04)');
      grad.addColorStop(1, 'rgba(' + TEAL.r + ',' + TEAL.g + ',' + TEAL.b + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  /* ---------- INIT ---------- */
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(animate);

})();
