const DARK_MODE_KEY = "dnd_dark_mode";
const JSON_URL = "magias.json";
const CACHE_KEY = "dnd_data_cache";
const GRIMOIRE_KEY = "dnd_grimoire";
const CHARACTER_INFO_KEY = "dnd_character_info";

let allSpells = [];
let grimoireSpells = [];

// Referência ao novo input do slider
const themeToggleBtn = document.getElementById("theme-toggle-btn");

function loadThemePreference() {
  const savedTheme = localStorage.getItem(DARK_MODE_KEY);
  const isDarkMode = savedTheme === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
  // Sincroniza o estado do slider com a preferência salva
  themeToggleBtn.checked = isDarkMode;
}

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle("dark-mode");
  const isDarkMode = body.classList.contains("dark-mode");
  localStorage.setItem(DARK_MODE_KEY, isDarkMode);
}

// Usa o evento 'change' para o input do tipo 'checkbox'
themeToggleBtn.addEventListener("change", toggleDarkMode);

function renderSpells(containerId, spells, isGrimoireTab) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (spells.length === 0) {
    container.innerHTML = `<p style="text-align: center; font-style: italic;">Nenhuma magia encontrada.</p>`;
    return;
  }
  spells.forEach((spell) => {
    const card = document.createElement("div");
    card.className = "card";

    const classTags = spell.classes
      .map((c) => {
        const className = c.split(" ")[0];
        return `<span class="class-tag ${className}">${c}</span>`;
      })
      .join(" ");

    const buttonText = isGrimoireTab
      ? "Remover do Grimório"
      : "Adicionar ao Grimório";
    const buttonClass = isGrimoireTab
      ? "add-to-grimoire-btn remove"
      : "add-to-grimoire-btn";

    card.innerHTML = `
        <div class="field"><strong>Fonte:</strong> ${spell.fonte}</div>
        <h2>${spell.name}</h2>
        <div class="field"><strong>Nível:</strong> ${spell.level}</div>
        <div class="field"><strong>Escola:</strong> ${spell.school}</div>
        <div class="field"><strong>Duração:</strong> ${spell.duration}</div>
        <div class="field"><strong>Classes:</strong> <div class="classes">${classTags}</div></div>
        
        <div class="details hidden">
          <div class="field"><strong>Tempo de Conjuração:</strong> ${
            spell.time
          }</div>
          <div class="field"><strong>Alcance:</strong> ${spell.range}</div>
          <div class="field"><strong>Componentes:</strong> ${
            spell.components
          }</div>
          <div class="text-section">${spell.text
            .map((t) => `<p>${t}</p>`)
            .join("")}</div>
        </div>

        <button class="toggle-details-btn">Ver Mais</button>
        <button class="${buttonClass}" data-spell-name="${
      spell.name
    }">${buttonText}</button>
    `;
    container.appendChild(card);
  });

  // Adiciona os event listeners para o novo botão
  container.querySelectorAll(".toggle-details-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const details = e.target.closest(".card").querySelector(".details");
      details.classList.toggle("hidden");
      e.target.textContent = details.classList.contains("hidden")
        ? "Ver Mais"
        : "Ver Menos";
    });
  });

  container.querySelectorAll(".add-to-grimoire-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const spellName = e.target.dataset.spellName;
      if (isGrimoireTab) {
        removeSpellFromGrimoire(spellName);
      } else {
        addSpellToGrimoire(spellName);
      }
    });
  });
}

function populateFilters(spells) {
  const sources = [...new Set(spells.map((s) => s.fonte))].sort();

  // 1. Coleta os níveis e os separa
  const allLevels = [...new Set(spells.map((s) => s.level))];
  const trickLevel = allLevels.find((level) => level === "Truque"); // Encontra o "Truque"
  const numericLevels = allLevels.filter((level) => level !== "Truque"); // Filtra os numéricos

  // 2. Ordena os níveis numéricos
  numericLevels.sort((a, b) => parseInt(a) - parseInt(b));

  // 3. Junta tudo de volta, colocando "Truque" no início se ele existir
  const levels = trickLevel ? [trickLevel, ...numericLevels] : numericLevels;

  const schools = [...new Set(spells.map((s) => s.school))].sort();
  const classes = [
    ...new Set(spells.flatMap((s) => s.classes.map((c) => c.split(" ")[0]))),
  ].sort();

  const filterSource = document.getElementById("filterSource");
  filterSource.innerHTML += sources
    .map((source) => `<option value="${source}">${source}</option>`)
    .join("");

  const filterLevel = document.getElementById("filterLevel");
  // 4. Mapeia a nova lista ordenada para o select
  filterLevel.innerHTML += levels
    .map((level) => `<option value="${level}">${level}</option>`)
    .join("");

  const filterSchool = document.getElementById("filterSchool");
  filterSchool.innerHTML += schools
    .map((school) => `<option value="${school}">${school}</option>`)
    .join("");

  const filterClasses = document.getElementById("filterClasses");
  filterClasses.innerHTML += classes
    .map((cls) => `<option value="${cls}">${cls}</option>`)
    .join("");
}

function filterSpells() {
  const filterName = document.getElementById("filterName").value.toLowerCase();
  const filterSource = document.getElementById("filterSource").value;
  const filterLevel = document.getElementById("filterLevel").value;
  const filterSchool = document.getElementById("filterSchool").value;
  const filterClasses = document.getElementById("filterClasses").value;

  const filteredSpells = allSpells.filter((spell) => {
    const nameMatch = spell.name.toLowerCase().includes(filterName);
    const sourceMatch = !filterSource || spell.fonte === filterSource;
    const levelMatch = !filterLevel || spell.level === filterLevel;
    const schoolMatch = !filterSchool || spell.school === filterSchool;
    const classMatch =
      !filterClasses ||
      spell.classes.some((c) => c.split(" ")[0] === filterClasses);

    return nameMatch && sourceMatch && levelMatch && schoolMatch && classMatch;
  });

  renderSpells("cardsContainer", filteredSpells, false);
}

function addSpellToGrimoire(spellName) {
  const spell = allSpells.find((s) => s.name === spellName);
  if (spell && !grimoireSpells.some((s) => s.name === spellName)) {
    // 1. Adiciona a magia ao grimório
    grimoireSpells.push(spell);

    // 2. Remove a magia da lista principal (allSpells)
    allSpells = allSpells.filter((s) => s.name !== spellName);

    // 3. Atualiza a visualização da lista principal para mostrar a mudança
    // Re-aplica os filtros atuais para renderizar a lista
    filterSpells();

    alert(
      `Magia "${spellName}" adicionada ao grimório! Lembre-se de salvar para persistir.`
    );
  }
}

function removeSpellFromGrimoire(spellName) {
  // Encontra a magia que está sendo removida
  const spell =
    allSpells.find((s) => s.name === spellName) ||
    grimoireSpells.find((s) => s.name === spellName);

  // 1. Remove a magia da lista do grimório
  grimoireSpells = grimoireSpells.filter((s) => s.name !== spellName);

  // 2. Adiciona a magia de volta à lista principal
  if (spell && !allSpells.some((s) => s.name === spellName)) {
    allSpells.push(spell);

    // Re-ordena a lista principal para manter a ordem alfabética
    allSpells.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 3. Atualiza a visualização da lista do grimório (para refletir a remoção)
  renderSpells("grimoireContainer", grimoireSpells, true);

  // 4. Atualiza a visualização da lista principal (para refletir a adição)
  filterSpells();

  alert(
    `Magia "${spellName}" removida do grimório! Lembre-se de salvar para persistir.`
  );
}

function saveEverything() {
  const characterInfo = {
    name: document.getElementById("charName").value,
    level: document.getElementById("charLevel").value,
    race: document.getElementById("charRace").value,
    class: document.getElementById("charClass").value,
  };
  localStorage.setItem(CHARACTER_INFO_KEY, JSON.stringify(characterInfo));
  localStorage.setItem(GRIMOIRE_KEY, JSON.stringify(grimoireSpells));
  alert("Informações do personagem e grimório salvos!");
}

function loadEverything() {
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (cachedData) {
    const { spells, timestamp } = JSON.parse(cachedData);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (now - timestamp < oneWeek) {
      allSpells = spells;
      // Adicione esta linha para ordenar o array do cache
      allSpells.sort((a, b) => a.name.localeCompare(b.name));
      console.log("Magias carregadas do cache.");
      return true;
    }
  }
  return false;
}

function cacheSpells(data) {
  const cacheData = {
    spells: data,
    timestamp: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  console.log("Magias salvas no cache.");
}

function loadCharacterInfo() {
  const characterInfo = JSON.parse(localStorage.getItem(CHARACTER_INFO_KEY));
  if (characterInfo) {
    document.getElementById("charName").value = characterInfo.name || "";
    document.getElementById("charLevel").value = characterInfo.level || "";
    document.getElementById("charRace").value = characterInfo.race || "";
    document.getElementById("charClass").value = characterInfo.class || "";
  }
}

function loadGrimoire() {
  const savedGrimoire = localStorage.getItem(GRIMOIRE_KEY);
  if (savedGrimoire) {
    grimoireSpells = JSON.parse(savedGrimoire);
  }
}

function openTab(tabId, event) {
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => content.classList.remove("active"));

  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => button.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  event.target.classList.add("active");

  if (tabId === "grimoire") {
    renderSpells("grimoireContainer", grimoireSpells, true);
  } else {
    filterSpells();
  }
}

// --- Início da execução ---
document
  .getElementById("saveGrimoireBtn")
  .addEventListener("click", saveEverything);
document.getElementById("filterName").addEventListener("keyup", filterSpells);
document
  .getElementById("filterSource")
  .addEventListener("change", filterSpells);
document.getElementById("filterLevel").addEventListener("change", filterSpells);
document
  .getElementById("filterSchool")
  .addEventListener("change", filterSpells);
document
  .getElementById("filterClasses")
  .addEventListener("change", filterSpells);
loadThemePreference();

if (loadEverything()) {
  loadGrimoire();
  loadCharacterInfo();
  populateFilters(allSpells);
  filterSpells();
} else {
  fetch(JSON_URL)
    .then((res) => res.json())
    .then((data) => {
      allSpells = data;
      // Adicione esta linha para ordenar o array de magias
      allSpells.sort((a, b) => a.name.localeCompare(b.name));

      cacheSpells(data);
      loadGrimoire();
      loadCharacterInfo();
      populateFilters(allSpells);
      filterSpells();
    })
    .catch((err) => {
      document.body.innerHTML = `<p>Erro ao carregar o arquivo JSON.</p>`;
      console.error(err);
    });
}

document.getElementById("printGrimoireBtn").addEventListener("click", () => {
  // Salva as informações do personagem e as magias do grimório no localStorage
  // com chaves temporárias para a página de impressão
  const characterInfo = {
    name: document.getElementById("charName").value,
    level: document.getElementById("charLevel").value,
    race: document.getElementById("charRace").value,
    class: document.getElementById("charClass").value,
  };
  localStorage.setItem("PRINT_CHARACTER_INFO", JSON.stringify(characterInfo));
  localStorage.setItem("PRINT_GRIMOIRE_SPELLS", JSON.stringify(grimoireSpells));

  // Abre a nova página de impressão
  const printWindow = window.open("./print_page.html", "_blank");

  // Opcional: limpar o localStorage após a janela fechar (ou quando for impressa)
  if (printWindow) {
    printWindow.onafterprint = () => {
      localStorage.removeItem("PRINT_CHARACTER_INFO");
      localStorage.removeItem("PRINT_GRIMOIRE_SPELLS");
    };
  }
});
