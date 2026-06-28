/* ── Particle network background ─────────────────────────── */
(function () {
  'use strict';

  var canvas, ctx, W, H, particles, raf;
  var LINK_DIST  = 140;   /* max distance to draw a line */
  var MOUSE_DIST = 160;   /* mouse repulsion radius */
  var mouse      = { x: -9999, y: -9999 };

  function count() {
    /* ~1 particle per 12 000px² of screen area, capped 60-120 */
    return Math.min(120, Math.max(60, Math.floor((W * H) / 12000)));
  }

  function Particle() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    var spd = 0.18 + Math.random() * 0.22;
    var ang = Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.r  = 1.2 + Math.random() * 1.4;
  }

  Particle.prototype.update = function () {
    /* mouse repulsion */
    var dx = this.x - mouse.x;
    var dy = this.y - mouse.y;
    var d2 = dx * dx + dy * dy;
    if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 0) {
      var d   = Math.sqrt(d2);
      var f   = (MOUSE_DIST - d) / MOUSE_DIST * 0.012;
      this.vx += (dx / d) * f;
      this.vy += (dy / d) * f;
    }

    /* dampen so speed doesn't grow unbounded */
    this.vx *= 0.999;
    this.vy *= 0.999;

    /* ensure minimum speed */
    var spd2 = this.vx * this.vx + this.vy * this.vy;
    if (spd2 < 0.01) {
      var ang = Math.random() * Math.PI * 2;
      this.vx += Math.cos(ang) * 0.05;
      this.vy += Math.sin(ang) * 0.05;
    }

    this.x += this.vx;
    this.y += this.vy;

    /* wrap edges with a small buffer */
    if (this.x < -20) this.x = W + 20;
    if (this.x > W + 20) this.x = -20;
    if (this.y < -20) this.y = H + 20;
    if (this.y > H + 20) this.y = -20;
  };

  function init() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    particles = [];
    var n = count();
    for (var i = 0; i < n; i++) particles.push(new Particle());
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    loop();
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function onMouse(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    draw();
    particles.forEach(function (p) { p.update(); });
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    var n = particles.length;

    /* draw lines */
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var d  = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          var alpha = (1 - d / LINK_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(0,255,178,' + alpha + ')';
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    /* draw nodes */
    for (var k = 0; k < n; k++) {
      var p = particles[k];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,178,0.5)';
      ctx.fill();

      /* subtle glow */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,178,0.06)';
      ctx.fill();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
