/* ---------- theme toggle ---------- */
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('themeToggle');
    var icon = document.getElementById('themeIcon');
    var sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
    var moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
    // Light is the default; dark only when explicitly set to data-theme="dark".
    function isDark() { return root.getAttribute('data-theme') === 'dark'; }
    function sync() { icon.innerHTML = isDark() ? sun : moon; }
    btn.addEventListener('click', function () {
      root.setAttribute('data-theme', isDark() ? 'light' : 'dark');
      sync();
    });
    sync();
  })();

  /* ---------- mobile menu ---------- */
  (function () {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    var iconEl = document.getElementById('navToggleIcon');
    if (!toggle || !menu) return;
    var bars = '<path d="M4 7h16M4 12h16M4 17h16"/>';
    var close = '<path d="M6 6l12 12M18 6 6 18"/>';
    function setOpen(open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      iconEl.innerHTML = open ? close : bars;
    }
    toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
  })();

  /* ---------- contact form → posts to send.php, which relays over SMTP ---------- */
  (function () {
    var SUPPORT = 'support@wifiphonecalls.com';
    var form = document.getElementById('contactForm');
    var note = document.getElementById('formNote');
    if (!form) return;
    var button = form.querySelector('button[type="submit"]');
    var buttonHtml = button ? button.innerHTML : '';
    var sending = false;

    // kind: 'ok' | 'err' | undefined (neutral, e.g. the resting hint or "sending…")
    function setNote(text, kind) {
      note.textContent = text;
      note.classList.toggle('err', kind === 'err');
      note.classList.toggle('ok', kind === 'ok');
    }

    function setSending(on) {
      sending = on;
      if (!button) return;
      button.disabled = on;
      if (on) button.textContent = 'Sending…';
      else button.innerHTML = buttonHtml; // restore label + paper-plane icon
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var f = form.elements;
      var payload = {
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        subject: f.subject.value.trim(),
        message: f.message.value.trim(),
        hp_check: f.hp_check ? f.hp_check.value : '' // honeypot — real users leave it empty
      };
      if (!payload.name || !payload.email || !payload.subject || !payload.message) {
        setNote('Please fill in every field so we can help.', 'err');
        return;
      }

      setSending(true);
      setNote('Sending your message…');

      fetch('send.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          // A misconfigured host can answer HTML (a 500 page); don't let that throw.
          return res.json()
            .catch(function () { return {}; })
            .then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (r.ok && r.data.ok) {
            form.reset();
            setNote('Thanks — your message is on its way. We\'ll reply by email soon.', 'ok');
          } else {
            setNote(r.data.error || 'Sorry, we couldn\'t send that. Please email ' + SUPPORT + ' directly.', 'err');
          }
        })
        .catch(function () {
          setNote('Network error — check your connection, or email ' + SUPPORT + ' directly.', 'err');
        })
        .then(function () { setSending(false); });
    });
  })();

  /* ---------- hero: soft Wi-Fi broadcast rings on the gradient ---------- */
  (function () {
    var canvas = document.getElementById('signal');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, cx = 0, cy = 0, maxR = 0;

    function resize() {
      var host = canvas.parentElement;
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W * 0.5; cy = H * 0.42; maxR = Math.max(W, H) * 0.6;
    }
    resize();
    window.addEventListener('resize', resize);

    function ring(r, a) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + a + ')';
      ctx.lineWidth = 1.1; ctx.stroke();
    }
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      var period = 4200;
      for (var k = 0; k < 4; k++) {
        var phase = ((t + k * (period / 4)) % period) / period;
        var r = phase * maxR;
        if (r > 4) ring(r, (1 - phase) * 0.14);
      }
      requestAnimationFrame(frame);
    }
    if (reduce) { ring(maxR * 0.45, 0.1); ring(maxR * 0.72, 0.06); }
    else { requestAnimationFrame(frame); }
  })();
