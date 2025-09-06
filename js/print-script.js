// js/print-script.js

document.addEventListener("DOMContentLoaded", () => {
  const characterInfo = JSON.parse(
    localStorage.getItem("PRINT_CHARACTER_INFO")
  );
  const grimoireSpells = JSON.parse(
    localStorage.getItem("PRINT_GRIMOIRE_SPELLS")
  );

  const printCharName = document.getElementById("printCharName");
  const printCharLevel = document.getElementById("printCharLevel");
  const printCharRace = document.getElementById("printCharRace");
  const printCharClass = document.getElementById("printCharClass");
  const printGrimoireCards = document.getElementById("printGrimoireCards");

  // Preenche as informações do personagem
  if (characterInfo) {
    printCharName.textContent = characterInfo.name || "N/A";
    printCharLevel.textContent = characterInfo.level || "N/A";
    printCharRace.textContent = characterInfo.race || "N/A";
    printCharClass.textContent = characterInfo.class || "N/A";
  }

  // Renderiza as magias como cartas
  if (grimoireSpells && grimoireSpells.length > 0) {
    grimoireSpells.forEach((spell) => {
      const card = document.createElement("div");
      card.className = "print-spell-card";

      const classTags = spell.classes
        .map((c) => {
          const className = c.split(" ")[0];
          return `<span class="class-tag ${className}">${c}</span>`;
        })
        .join(" ");

      card.innerHTML = `
                <h2>${spell.name}</h2>
                <div class="field"><strong>Nível:</strong> ${spell.level}</div>
                <div class="field"><strong>Escola:</strong> ${
                  spell.school
                }</div>
                <div class="field"><strong>Tempo de Conjuração:</strong> ${
                  spell.time
                }</div>
                <div class="field"><strong>Alcance:</strong> ${
                  spell.range
                }</div>
                <div class="field"><strong>Componentes:</strong> ${
                  spell.components
                }</div>
                <div class="field"><strong>Duração:</strong> ${
                  spell.duration
                }</div>
                <div class="field"><strong>Classes:</strong> <div class="classes">${classTags}</div></div>
                <div class="text-section">${spell.text
                  .map((t) => `<p>${t}</p>`)
                  .join("")}</div>
            `;
      printGrimoireCards.appendChild(card);
    });
  } else {
    printGrimoireCards.innerHTML =
      '<p style="text-align: center;">Nenhuma magia no grimório para imprimir.</p>';
  }

  // Inicia o diálogo de impressão automaticamente após renderizar
  // Pequeno atraso para garantir que tudo foi renderizado
  setTimeout(() => {
    window.print();
    // Opcional: Fechar a janela após a impressão, se for uma popup
    // window.onafterprint = () => window.close();
  }, 500);
});
