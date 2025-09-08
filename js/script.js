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

    // Novo: Define o ícone e a classe com base na aba
    const actionIcon = isGrimoireTab ? "&#xe14c;" : "&#xe145;"; // '-' ou '+'
    const actionClass = isGrimoireTab
      ? "remove-from-grimoire-icon"
      : "add-to-grimoire-icon";
    const actionTooltip = isGrimoireTab
      ? "Remover do Grimório"
      : "Adicionar ao Grimório";

    card.innerHTML = `
    <div class="material-icons action-icon ${actionClass}" data-spell-name="${
      spell.name
    }" title="${actionTooltip}">${actionIcon}</div>
        <div class="field fonte"><strong>Fonte:</strong> ${spell.fonte}</div>
        <h2 class="nome">${spell.name}</h2>
        <div class="field nivel-nome"><strong>Nível:</strong> <div class="nivel">${
          spell.level
        }</div></div>
        <div class="field escola"><strong>Escola:</strong> ${spell.school}</div>
        <div class="field duration"><strong>Duração:</strong> ${
          spell.duration
        }</div>
        <div class="field tempo-conjuracao"><strong>Tempo de Conjuração:</strong> ${
          spell.time
        }</div>
        <div class="field alcance"><strong>Alcance:</strong> ${
          spell.range
        }</div>
        <div class="field nome-classes"><strong>Classes:</strong> <div class="classes">${classTags}</div></div>
        
        <div class="details hidden">
          
          
          <div class="field componente"><strong>Componentes:</strong> ${
            spell.components
          }</div>
          <div class="text-section">${spell.text
            .map((t) => `<p>${t}</p>`)
            .join("")}</div>
        </div>

        <button class="toggle-details-btn">Ver Mais</button>
        `;
    container.appendChild(card);
  });

  // Event listeners para o botão de detalhes (Ver Mais/Menos)
  container.querySelectorAll(".toggle-details-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const details = e.target.closest(".card").querySelector(".details");
      details.classList.toggle("hidden");
      e.target.textContent = details.classList.contains("hidden")
        ? "Ver Mais"
        : "Ver Menos";
    });
  });

  // NOVO: Event listeners para os ícones de adicionar/remover
  container.querySelectorAll(".action-icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      const spellName = e.target.dataset.spellName;
      if (e.target.classList.contains("remove-from-grimoire-icon")) {
        removeSpellFromGrimoire(spellName);
      } else if (e.target.classList.contains("add-to-grimoire-icon")) {
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
    grimoireSpells.push(spell);
    allSpells = allSpells.filter((s) => s.name !== spellName);
    filterSpells();

    // Substitua o alert() por showNotification()
    showNotification(`Magia "${spellName}" adicionada ao grimório!`);
  }
}

function removeSpellFromGrimoire(spellName) {
  const spell =
    allSpells.find((s) => s.name === spellName) ||
    grimoireSpells.find((s) => s.name === spellName);
  grimoireSpells = grimoireSpells.filter((s) => s.name !== spellName);
  if (spell && !allSpells.some((s) => s.name === spellName)) {
    allSpells.push(spell);
    allSpells.sort((a, b) => a.name.localeCompare(b.name));
  }
  renderSpells("grimoireContainer", grimoireSpells, true);
  filterSpells();

  // Substitua o alert() por showNotification()
  showNotification(`Magia "${spellName}" removida do grimório!`);
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

// Função para exibir um popup de notificação temporário
function showNotification(message, duration = 2000) {
  // 1. Cria o elemento div para a notificação
  const notification = document.createElement("div");
  notification.className = "notification-popup";
  notification.textContent = message;

  // 2. Adiciona o popup ao corpo do documento
  document.body.appendChild(notification);

  // 3. Aplica o estilo de entrada (fadeIn)
  setTimeout(() => {
    notification.classList.add("visible");
  }, 10); // Pequeno atraso para a transição funcionar

  // 4. Agenda a remoção do popup após a duração especificada
  setTimeout(() => {
    notification.classList.remove("visible");
    // Remove o elemento do DOM após a transição de saída
    notification.addEventListener("transitionend", () => {
      notification.remove();
    });
  }, duration);
}
