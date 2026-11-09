const inicio = new Date("2026-06-25T18:50:00");

    function atualizar() {
      const agora = new Date();

      // quantos segundos se passaram desde o início
      const total = Math.floor((agora - inicio) / 1000);

      // transforma os segundos em dias, horas, minutos e segundos
      const dias    = Math.floor(total / 86400);
      const horas   = Math.floor((total % 86400) / 3600);
      const minutos = Math.floor((total % 3600) / 60);
      const segundos = total % 60;

      // escreve o resultado no parágrafo de id="contador"
      document.getElementById("dias").textContent = dias;
      document.getElementById("horas").textContent = horas;
      document.getElementById("minutos").textContent = minutos;
      document.getElementById("segundos").textContent = segundos;
    }

    atualizar();                    // mostra já na hora que abre
    setInterval(atualizar, 1000);   // e atualiza a cada 1 segundo