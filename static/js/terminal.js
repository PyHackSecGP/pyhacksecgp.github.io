/* Terminal typing animation */
(function () {
  'use strict';

  function typeText(el, text, speed, callback) {
    let i = 0;
    el.textContent = '';
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed + Math.random() * (speed * 0.4));
      } else if (callback) {
        setTimeout(callback, 200);
      }
    }
    tick();
  }

  function showElement(el) {
    el.style.display = '';
  }

  function runSequence(steps, idx) {
    if (idx >= steps.length) return;
    const step = steps[idx];

    if (step.type === 'type') {
      showElement(step.el.parentElement || step.el);
      typeText(step.el, step.text, step.speed || 45, function () {
        runSequence(steps, idx + 1);
      });
    } else if (step.type === 'show') {
      showElement(step.el);
      setTimeout(function () { runSequence(steps, idx + 1); }, step.delay || 100);
    } else if (step.type === 'wait') {
      setTimeout(function () { runSequence(steps, idx + 1); }, step.delay || 300);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const seq = document.querySelectorAll('[data-type-seq]');
    if (!seq.length) return;

    /* hide all animated elements initially */
    document.querySelectorAll('[data-type-target]').forEach(function (el) {
      el.style.display = 'none';
    });
    document.querySelectorAll('[data-show-after]').forEach(function (el) {
      el.style.display = 'none';
    });

    const steps = [];
    seq.forEach(function (el) {
      const kind = el.getAttribute('data-type-seq');
      if (kind === 'cmd') {
        steps.push({ type: 'type', el: el, text: el.getAttribute('data-text'), speed: 40 });
        steps.push({ type: 'wait', delay: 150 });
      } else if (kind === 'output') {
        steps.push({ type: 'show', el: el, delay: 80 });
      }
    });

    /* small initial delay */
    setTimeout(function () { runSequence(steps, 0); }, 400);
  });
})();
