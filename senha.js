/* ==========================================================
   senha.js — tela de senha antes de mostrar o site
   ----------------------------------------------------------
   1) Ao abrir, só aparece a tela de senha (o resto do site fica escondido).
   2) Se a senha estiver certa, a tela some e a animação da rosa começa.
   ========================================================== */
(function () {

  // ====== PERSONALIZE AQUI ======
  var SENHA = "25062026";                            // TROQUE pela senha que só ela vai saber
  var DICA = "Uma dica: O dia em que te pedi em namoro ♥";      // aparece embaixo do campo (apague o texto para não mostrar)
  var TITULO = "Esse site é só para uma pessoa especial";
  // ==============================

  var html = document.documentElement;

  // esconde o site inteiro até a senha ser digitada
  html.classList.add("bloqueado");

  var css = document.createElement("style");
  css.textContent =
    "html.bloqueado body>:not(#tela-senha){display:none!important}" +
    "#tela-senha{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;" +
    "align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;" +
    "color:#ffe6ec;font-family:Georgia,serif;transition:opacity .7s ease;" +
    "background:radial-gradient(ellipse at 50% 35%,#3b0c1f 0%,#1b0613 45%,#07030a 100%)}" +
    "#tela-senha .coracao{font-size:56px;color:#ff7a93;text-shadow:0 0 26px rgba(255,70,110,.8);" +
    "animation:batida 1.4s ease-in-out infinite}" +
    "#tela-senha h1{margin:14px 0 22px;font-family:'Brush Script MT',cursive;font-weight:normal;" +
    "font-size:clamp(30px,8vw,42px);color:#ff7a93;text-shadow:0 0 22px rgba(255,70,110,.55)}" +
    "#tela-senha form{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:300px}" +
    "#tela-senha input{width:100%;box-sizing:border-box;padding:13px 16px;font-size:18px;text-align:center;" +
    "color:#ffe6ec;background:rgba(255,255,255,.06);border:1px solid rgba(255,122,147,.5);" +
    "border-radius:999px;outline:none}" +
    "#tela-senha input:focus{border-color:#ff7a93;box-shadow:0 0 18px rgba(255,70,110,.35)}" +
    "#tela-senha button{padding:12px 30px;font-size:17px;color:#ff7a93;background:transparent;" +
    "border:1px solid rgba(255,122,147,.7);border-radius:999px;cursor:pointer}" +
    "#tela-senha button:hover{background:rgba(255,122,147,.15)}" +
    "#tela-senha .erro{min-height:22px;margin:4px 0 0;font-size:15px;color:#ff9fb3}" +
    "#tela-senha .dica{margin:18px 0 0;font-size:14px;color:#e9b4c2;font-style:italic}" +
    "#tela-senha .tremer{animation:tremer .4s}" +
    "@keyframes batida{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}" +
    "@keyframes tremer{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}";
  document.head.appendChild(css);

  // evita que o Google guarde o site nos resultados de busca
  var meta = document.createElement("meta");
  meta.name = "robots";
  meta.content = "noindex, nofollow";
  document.head.appendChild(meta);

  function liberar(tela) {
    // carrega a animação da rosa; só mostra o site quando ela já estiver pronta para começar
    var rosa = document.createElement("script");
    rosa.src = "rosa.js";
    function depois() {
      html.classList.remove("bloqueado");
      tela.style.opacity = "0";
      setTimeout(function () { tela.remove(); }, 800);
    }
    rosa.onload = depois;
    rosa.onerror = depois;      // se o rosa.js não for encontrado, o site aparece mesmo assim
    document.head.appendChild(rosa);
  }

  function montarTela() {
    var tela = document.createElement("div");
    tela.id = "tela-senha";
    tela.innerHTML =
      '<div class="coracao">♥</div>' +
      "<h1></h1>" +
      '<form autocomplete="off">' +
      '<input type="password" placeholder="Digite a senha" aria-label="Senha" autocomplete="off">' +
      '<button type="submit">Entrar</button>' +
      "</form>" +
      '<p class="erro"></p>' +
      '<p class="dica"></p>';
    tela.querySelector("h1").textContent = TITULO;
    tela.querySelector(".dica").textContent = DICA;
    document.body.insertBefore(tela, document.body.firstChild);

    var campo = tela.querySelector("input");
    var erro = tela.querySelector(".erro");
    campo.focus();

    tela.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      // ignora espaços nas pontas e diferença entre maiúscula e minúscula (o celular costuma pôr maiúscula sozinho)
      var digitada = campo.value.trim().toLowerCase();
      if (digitada === SENHA.trim().toLowerCase()) {
        erro.textContent = "";
        liberar(tela);
      } else {
        erro.textContent = "Senha incorreta, tente de novo ♥";
        campo.value = "";
        campo.classList.remove("tremer");
        void campo.offsetWidth;          // reinicia a animação de tremer
        campo.classList.add("tremer");
        campo.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarTela);
  } else {
    montarTela();
  }
})();
