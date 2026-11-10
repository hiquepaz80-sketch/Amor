/* ==========================================================
   rosa.js — rosa feita de palavras, como fundo do site
   ----------------------------------------------------------
   Como funciona:
   1) Ao abrir o site, o conteúdo some e a rosa se escreve sozinha.
   2) Quando termina, o conteúdo aparece e a rosa fica de fundo, mais suave.
   3) Tocar/clicar durante a animação pula direto para a rosa pronta.
   Este arquivo cria sozinho o <canvas> e o CSS que precisa.
   ========================================================== */
(function () {

  // ====== PERSONALIZE AQUI ======
  var TEXT = "Eu te amo";          // palavra que forma as pétalas
  var CAPTION = "Eu te amo";       // frase grande no fim da animação (ex.: "Eu te amo, Jessyca")
  var STEM_CHARS = "Eu te amo ";   // letras do caule e das folhas
  var TURNS = 8;                   // voltas da espiral (mais voltas = rosa mais cheia)
  var OPACIDADE_FUNDO = 0.5;       // força da rosa depois da abertura (0 a 1)
  // ==============================

  var html = document.documentElement;

  // 1) Esconde o conteúdo durante a abertura (a classe sai quando a animação termina)
  html.classList.add("rosa-intro");

  var css = document.createElement("style");
  css.textContent =
    "#rosa-fundo{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;" +
    "pointer-events:none;transition:opacity 1.2s ease}" +
    "body>:not(#rosa-fundo){position:relative;z-index:1;transition:opacity 1.4s ease}" +
    "html.rosa-intro{overflow:hidden}" +
    "html.rosa-intro body>:not(#rosa-fundo){opacity:0;pointer-events:none}";
  document.head.appendChild(css);

  // Plano B: se algo travar, o conteúdo aparece de qualquer jeito depois de 25 s
  setTimeout(terminarIntro, 25000);

  // 2) Fontes bonitas (se não carregarem, o site usa Georgia e funciona igual)
  var linkFontes = document.createElement("link");
  linkFontes.rel = "stylesheet";
  linkFontes.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,700&family=Great+Vibes&display=swap";
  var fontesCss = new Promise(function (ok) {
    linkFontes.addEventListener("load", ok);
    linkFontes.addEventListener("error", ok);
    setTimeout(ok, 2000);
  });
  document.head.appendChild(linkFontes);

  var introFeita = false;
  var canvas;

  function terminarIntro() {
    if (introFeita) return;
    introFeita = true;
    html.classList.remove("rosa-intro");
    if (canvas) canvas.style.opacity = opacidade();
  }

  // a rosa fica mais suave depois da abertura e escurece um pouco mais ao rolar
  function opacidade() {
    if (!introFeita) return 1;
    var k = Math.min(1, window.scrollY / (window.innerHeight * 0.7));
    return OPACIDADE_FUNDO - 0.2 * k;
  }

  // 3) Começa quando a página estiver pronta
  function iniciar() {
    var FONT = '"Cormorant Garamond", Georgia, serif';
    var SCRIPT = '"Great Vibes", "Brush Script MT", cursive';
    var TH_MAX = TURNS * Math.PI * 2;
    var reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    canvas = document.createElement("canvas");
    canvas.id = "rosa-fundo";
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");
    var layer = document.createElement("canvas");   // camada onde a planta vai sendo "escrita"
    var lctx = layer.getContext("2d");

    var W, H, sc, dpr, roseC, R, stemTop, stemBottom, lastW = 0, lastH = 0;
    var glyphs = [], petals = [];
    var drawnG = 0, drawnP = 0, frame = 0, doneFrames = 0, capAlpha = 0;
    var falling = [];

    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    function rand(a, b) { return a + Math.random() * (b - a); }

    var stars = [];
    for (var s = 0; s < 70; s++) {
      stars.push({ x: Math.random(), y: Math.random(), r: rand(0.5, 1.6), ph: rand(0, 6.28) });
    }

    /* ---------- geometria ---------- */
    function roseRadius(th) {
      var k = th / TH_MAX;
      var lobes = 1 + 0.11 * k * Math.sin(5.35 * th);   // bordas onduladas, como pétalas
      return R * Math.pow(k, 0.9) * lobes;
    }

    function stemPoint(t) {
      return {
        x: stemBottom.x + Math.sin(t * 3) * sc * 0.035 * t,
        y: stemBottom.y + (stemTop.y - stemBottom.y) * t
      };
    }

    function buildStem() {
      var sz = sc * 0.030;
      var n = Math.floor((stemBottom.y - stemTop.y) / (sz * 0.78));
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        var p = stemPoint(t), q = stemPoint(Math.min(1, t + 0.01));
        glyphs.push({
          ch: STEM_CHARS[i % STEM_CHARS.length], x: p.x, y: p.y,
          ang: Math.atan2(q.y - p.y, q.x - p.x) + Math.PI / 2,
          font: "600 " + sz + "px " + FONT,
          color: "hsl(135, 55%, " + (30 + 22 * t) + "%)",
          glow: "hsla(140,80%,50%,.25)", blur: 4
        });
      }
    }

    function buildLeaf(side, t0) {
      var s0 = stemPoint(t0);
      var Lx = sc * 0.27, Lh = sc * 0.07, Lv = sc * 0.05, Wd = sc * 0.034;
      function cl(u) {
        return { x: s0.x + side * u * Lx, y: s0.y - Lh * Math.sin(u * Math.PI * 0.85) - u * Lv };
      }
      var arc = Math.hypot(Lx, Lh + Lv) * 1.1;
      var size = sc * 0.020;
      var n = Math.round(arc / (size * 0.62));
      for (var i = 0; i < n; i++) {
        var u = (i + 0.5) / n;
        var p = cl(u), q = cl(u + 0.01);
        var a = Math.atan2(q.y - p.y, q.x - p.x);
        var env = Math.pow(Math.sin(u * Math.PI), 0.7);
        var w = Wd * env;
        var gs = size * (0.75 + 0.25 * env);
        [0, -1, 1].forEach(function (j) {            // nervura central + duas fileiras laterais
          if (j !== 0 && w < gs * 0.9) return;
          glyphs.push({
            ch: STEM_CHARS[(i + j * 3 + 9) % STEM_CHARS.length],
            x: p.x - Math.sin(a) * j * w, y: p.y + Math.cos(a) * j * w,
            ang: side === 1 ? a : a + Math.PI,
            font: "600 " + gs + "px " + FONT,
            color: "hsl(" + (140 + j * 6) + ", 62%, " + (j === 0 ? 54 : 36 + 8 * env) + "%)",
            glow: "hsla(140,80%,50%,.25)", blur: 4
          });
        });
      }
    }

    function buildSepals() {
      var b = { x: roseC.x, y: roseC.y + R * 0.62 };
      var size = sc * 0.017;
      [-0.95, -0.5, 0, 0.5, 0.95].forEach(function (d) {
        var dx = Math.sin(d), dy = Math.cos(d) * 0.9;
        var len = sc * 0.11 * (1 - Math.abs(d) * 0.25);
        var n = Math.round(len / (size * 0.6));
        for (var i = 0; i < n; i++) {
          var u = (i + 0.5) / n;
          var gs = size * (1 - 0.3 * u);
          glyphs.push({
            ch: STEM_CHARS[i % STEM_CHARS.length],
            x: b.x + dx * u * len, y: b.y + dy * u * len,
            ang: Math.atan2(dy, dx),
            font: "600 " + gs + "px " + FONT,
            color: "hsl(130, 55%, " + (34 + 10 * u) + "%)",
            glow: "hsla(140,80%,50%,.2)", blur: 3
          });
        }
      });
    }

    function buildPetals(rng) {
      function pos(th) {
        var r = roseRadius(th);
        return { x: Math.cos(th) * r, y: Math.sin(th) * r * 0.92 };   // leve achatamento = perspectiva
      }
      var th = 3.0;
      while (th < TH_MAX) {
        var k = th / TH_MAX;
        var size = sc * (0.016 + 0.024 * k);
        var font = "italic 700 " + size + "px " + FONT;
        lctx.font = font;
        var w = lctx.measureText(TEXT).width * 1.1;
        var arc = 0, th2 = th, p0 = pos(th);
        while (arc < w && th2 < TH_MAX) {
          th2 += 0.01;
          var p1 = pos(th2);
          arc += Math.hypot(p1.x - p0.x, p1.y - p0.y);
          p0 = p1;
        }
        var a = pos(th), b = pos(th2), m = pos((th + th2) / 2);
        var band = Math.sin(5.35 * th);              // luz e sombra em cada pétala
        var light = 30 + 34 * k + 9 * band * (0.4 + k) + (k > 0.85 ? 6 : 0) + (rng() - 0.5) * 6;
        var hue = 352 + 8 * k + (rng() - 0.5) * 6;
        var sat = 78 + 14 * k;
        petals.push({
          ch: TEXT, x: roseC.x + m.x, y: roseC.y + m.y,
          ang: Math.atan2(b.y - a.y, b.x - a.x),
          font: font,
          color: "hsl(" + (hue % 360) + ", " + sat + "%, " + light + "%)",
          glow: "hsla(350,100%," + (50 + 20 * k) + "%," + (0.3 + 0.4 * k) + ")",
          blur: 6 + 6 * k
        });
        th = th2;
      }
    }

    function rebuild() {
      roseC = { x: W / 2, y: H * 0.35 };
      R = sc * 0.30;
      stemBottom = { x: W / 2, y: H * 0.80 };
      stemTop = { x: roseC.x, y: roseC.y + R * 0.7 };
      glyphs = []; petals = [];
      buildStem();
      buildLeaf(-1, 0.28);
      buildLeaf(1, 0.46);
      buildSepals();
      buildPetals(mulberry32(7));
    }

    /* ---------- desenho ---------- */
    function drawGlyph(c, g) {
      c.save();
      c.translate(g.x, g.y);
      c.rotate(g.ang);
      c.font = g.font;
      c.fillStyle = g.color;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.shadowColor = g.glow;
      c.shadowBlur = g.blur * dpr;
      c.fillText(g.ch, 0, 0);
      c.restore();
    }

    function redrawLayer() {
      lctx.clearRect(0, 0, W, H);
      for (var i = 0; i < drawnG; i++) drawGlyph(lctx, glyphs[i]);
      for (var j = 0; j < drawnP; j++) drawGlyph(lctx, petals[j]);
    }

    function drawStars() {
      stars.forEach(function (s) {
        var a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.025 + s.ph));
        ctx.fillStyle = "rgba(255,220,230," + a + ")";
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, 6.2832);
        ctx.fill();
      });
    }

    function newFalling(anywhere) {
      return {
        x: Math.random() * W, y: anywhere ? Math.random() * H : -20,
        vy: rand(0.3, 0.9), ph: rand(0, 6.28), amp: rand(10, 30),
        rot: rand(0, 6.28), vr: rand(-0.02, 0.02),
        size: sc * rand(0.016, 0.03),
        ch: [TEXT, "♥", "amo", "♥"][Math.floor(Math.random() * 4)],
        a: rand(0.3, 0.8)
      };
    }

    function drawFalling(fade) {
      if (!falling.length) {
        for (var n = 0; n < 24; n++) falling.push(newFalling(true));
      }
      for (var i = 0; i < falling.length; i++) {
        var f = falling[i];
        f.y += f.vy; f.rot += f.vr;
        if (f.y > H + 30) { falling[i] = newFalling(false); continue; }
        var x = f.x + Math.sin(frame * 0.012 + f.ph) * f.amp;
        ctx.save();
        ctx.globalAlpha = f.a * fade;
        ctx.translate(x, f.y);
        ctx.rotate(f.rot);
        ctx.font = "italic 600 " + f.size + "px " + FONT;
        ctx.fillStyle = "hsl(345, 90%, 72%)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.ch, 0, 0);
        ctx.restore();
      }
    }

    function drawCaption(alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      var size = sc * 0.12;
      ctx.font = size + "px " + SCRIPT;
      var maxW = W * 0.9, w0 = ctx.measureText(CAPTION).width;
      if (w0 > maxW) size *= maxW / w0;
      ctx.font = size + "px " + SCRIPT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      var w = ctx.measureText(CAPTION).width;
      var grad = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
      grad.addColorStop(0, "#ff8fa8");
      grad.addColorStop(0.5, "#ffd6e0");
      grad.addColorStop(1, "#ff8fa8");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(255,70,110,.95)";
      ctx.shadowBlur = 26 * dpr;
      ctx.fillText(CAPTION, W / 2, H * 0.88);
      ctx.shadowBlur = 8 * dpr;
      ctx.fillText(CAPTION, W / 2, H * 0.88);
      ctx.restore();
    }

    /* ---------- animação ---------- */
    function loop() {
      frame++;

      if (drawnG < glyphs.length) {                       // 1) caule, folhas e sépalas
        var endG = Math.min(glyphs.length, drawnG + 5);
        for (; drawnG < endG; drawnG++) drawGlyph(lctx, glyphs[drawnG]);
      } else if (drawnP < petals.length) {                // 2) a rosa desabrocha
        var endP = Math.min(petals.length, drawnP + 4);
        for (; drawnP < endP; drawnP++) drawGlyph(lctx, petals[drawnP]);
      } else {
        doneFrames++;                                     // 3) frase final
        if (doneFrames >= 100) terminarIntro();           // depois de ~1,5 s mostra o site
      }

      // a frase aparece no fim da abertura e some quando o site aparece
      if (!introFeita) capAlpha = Math.min(1, doneFrames / 60);
      else capAlpha = Math.max(0, capAlpha - 0.02);

      ctx.clearRect(0, 0, W, H);
      drawStars();

      var bloom = petals.length ? drawnP / petals.length : 0;
      if (bloom > 0) {                                    // brilho atrás da rosa
        var g = ctx.createRadialGradient(roseC.x, roseC.y, 0, roseC.x, roseC.y, R * 1.9);
        g.addColorStop(0, "rgba(255,45,85," + (0.28 * bloom) + ")");
        g.addColorStop(1, "rgba(255,45,85,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      var grow = glyphs.length ? drawnG / glyphs.length : 0;
      var sway = Math.sin(frame / 110) * 0.022 * grow;    // balanço suave
      ctx.save();
      ctx.translate(stemBottom.x, stemBottom.y);
      ctx.rotate(sway);
      ctx.translate(-stemBottom.x, -stemBottom.y);
      ctx.drawImage(layer, 0, 0, W, H);
      ctx.restore();

      if (doneFrames > 0) drawFalling(Math.min(1, doneFrames / 90));
      if (capAlpha > 0) drawCaption(capAlpha);

      requestAnimationFrame(loop);
    }

    function resize(force) {
      var w = window.innerWidth, h = window.innerHeight;
      // no celular a barra do navegador muda a altura ao rolar: ignora variações pequenas
      if (!force && w === lastW && Math.abs(h - lastH) < 120) return;
      lastW = w; lastH = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = h;
      canvas.width = layer.width = Math.round(W * dpr);
      canvas.height = layer.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sc = Math.min(W, H * 1.05);
      var oldG = glyphs.length, oldP = petals.length;
      rebuild();
      drawnG = oldG ? Math.round(drawnG / oldG * glyphs.length) : 0;
      drawnP = oldP ? Math.round(drawnP / oldP * petals.length) : 0;
      redrawLayer();
    }

    // tocar ou clicar durante a abertura pula direto para a rosa pronta
    window.addEventListener("pointerdown", function () {
      if (introFeita || !glyphs.length) return;
      drawnG = glyphs.length; drawnP = petals.length;
      redrawLayer();
      doneFrames = Math.max(doneFrames, 40);
    });

    window.addEventListener("scroll", function () {
      canvas.style.opacity = opacidade();
    }, { passive: true });

    // espera as fontes carregarem (no máximo ~3 s) para medir as palavras direito
    fontesCss.then(function () {
      return Promise.race([
        Promise.all([
          document.fonts.load('italic 700 20px "Cormorant Garamond"'),
          document.fonts.load('600 20px "Cormorant Garamond"'),
          document.fonts.load('40px "Great Vibes"')
        ]),
        new Promise(function (ok) { setTimeout(ok, 1500); })
      ]);
    }).catch(function () {}).then(function () {
      window.scrollTo(0, 0);
      resize(true);
      window.addEventListener("resize", function () { resize(false); });
      if (reduzir) {                                      // quem prefere menos movimento já vê a rosa pronta
        drawnG = glyphs.length; drawnP = petals.length;
        redrawLayer();
        terminarIntro();
      }
      requestAnimationFrame(loop);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
