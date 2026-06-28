/* ── Scroll reveal ───────────────────────────────────────── */
(function () {
  'use strict';

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  });
})();

/* ── Terminal typing ─────────────────────────────────────── */
(function () {
  'use strict';

  function typeSequence(lines, container) {
    let lineIdx = 0;
    let charIdx = 0;
    let currentEl = null;

    function nextLine() {
      if (lineIdx >= lines.length) {
        /* add blinking cursor after last line */
        const cur = document.createElement('span');
        cur.className = 'cursor-blink';
        container.appendChild(cur);
        return;
      }

      const line = lines[lineIdx];
      const row  = document.createElement('div');

      if (line.type === 'cmd') {
        row.innerHTML = '<span class="t-prompt">$ </span><span class="t-cmd"></span>';
        container.appendChild(row);
        currentEl = row.querySelector('.t-cmd');
        typeChars(line.text, currentEl, function () {
          lineIdx++;
          setTimeout(nextLine, 200);
        });
      } else if (line.type === 'out') {
        row.innerHTML = '<span class="t-out">' + line.text + '</span>';
        container.appendChild(row);
        lineIdx++;
        setTimeout(nextLine, 60);
      } else if (line.type === 'blank') {
        row.innerHTML = '<span class="t-blank"></span>';
        container.appendChild(row);
        lineIdx++;
        setTimeout(nextLine, 80);
      }
    }

    function typeChars(text, el, cb) {
      let i = 0;
      function tick() {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, 42 + Math.random() * 20);
        } else {
          if (cb) setTimeout(cb, 150);
        }
      }
      tick();
    }

    setTimeout(nextLine, 600);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('term-output');
    if (!container) return;

    typeSequence([
      { type: 'cmd',   text: 'whoami' },
      { type: 'out',   text: 'GP Singh' },
      { type: 'out',   text: 'Cybersecurity Analyst I · Vancouver, BC' },
      { type: 'blank'  },
      { type: 'cmd',   text: 'skills --top' },
      { type: 'out',   text: 'Python · Burp Suite · MITRE ATT&CK' },
      { type: 'out',   text: 'SAST/DAST · Log Analysis · Ollama' },
      { type: 'blank'  },
      { type: 'cmd',   text: 'status' },
      { type: 'out',   text: '2 tools shipped // P4 in progress' },
      { type: 'out',   text: 'target: Senior SecEng by 2029' },
      { type: 'blank'  },
    ], container);
  });
})();
