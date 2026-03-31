const size = 7;
const totalFloors = 3;

const relicPool = [
  { id: "steel", name: "Стальная обшивка (+3 HP)", apply: (s) => (s.hp += 3) },
  { id: "claw", name: "Заточка (+1 урон)", apply: (s) => (s.playerDamage += 1) },
  { id: "battery", name: "Энергоячейка (+2 scrap)", apply: (s) => (s.scrap += 2) },
  { id: "boots", name: "Тактические ботинки (рывок раз в бой)", apply: (s) => (s.dashCharges += 1) }
];

const state = {
  floor: 1,
  hp: 10,
  scrap: 0,
  playerDamage: 2,
  dashCharges: 0,
  player: { x: 0, y: 0 },
  exit: { x: 6, y: 6 },
  enemies: [],
  over: false
};

const SAVE_KEY = "metroRelicSaveV1";
const SETTINGS_KEY = "metroRelicSettingsV1";

const grid = document.getElementById("grid");
const hpEl = document.getElementById("hp");
const scrapEl = document.getElementById("scrap");
const floorEl = document.getElementById("floor");
const logEl = document.getElementById("log");
const endTurnBtn = document.getElementById("endTurnBtn");
const restartBtn = document.getElementById("restartBtn");
const settingsBtn = document.getElementById("settingsBtn");
const howToBtn = document.getElementById("howToBtn");
const faqBtn = document.getElementById("faqBtn");
const whatsNewBtn = document.getElementById("whatsNewBtn");
const reportBugBtn = document.getElementById("reportBugBtn");
const relicModal = document.getElementById("relicModal");
const relicOptions = document.getElementById("relicOptions");
const infoModal = document.getElementById("infoModal");
const infoModalTitle = document.getElementById("infoModalTitle");
const infoModalBody = document.getElementById("infoModalBody");
const infoModalCloseBtn = document.getElementById("infoModalCloseBtn");

const infoScreens = {
  howTo: {
    title: "Как играть",
    body: `
      <p>Добро пожаловать в Metro Relic — пошаговую тактическую игру на поле 7x7.</p>
      <h3>Цель</h3>
      <ul>
        <li>Пройти 3 этажа.</li>
        <li>Уничтожить всех врагов на этаже.</li>
        <li>Дойти до выхода X.</li>
      </ul>
      <h3>Обозначения</h3>
      <ul>
        <li>P — игрок</li>
        <li>E — обычный враг</li>
        <li>B — босс на последнем этаже</li>
        <li>X — выход</li>
      </ul>
      <h3>Управление</h3>
      <ul>
        <li>Нажимай на соседнюю клетку, чтобы переместиться.</li>
        <li>Нажимай на соседнего врага, чтобы атаковать.</li>
        <li>После твоего действия враги делают ход.</li>
      </ul>
    `
  },
  faq: {
    title: "Частые ошибки",
    body: `
      <h3>Этаж не завершается на X</h3>
      <p>Выход срабатывает только после полной зачистки всех врагов.</p>
      <h3>Не могу сделать ход</h3>
      <p>Доступны только соседние свободные клетки, диагонали запрещены.</p>
      <h3>Атака не проходит</h3>
      <p>Атаковать можно только врага на соседней клетке.</p>
      <h3>Слишком быстро погибаю</h3>
      <p>Старайся не входить в окружение, выманивай врагов по одному.</p>
      <h3>Прогресс не восстановился</h3>
      <p>Это баг. Сообщи устройство, браузер и шаги, после которых пропал прогресс.</p>
    `
  },
  whatsNew: {
    title: "Что нового",
    body: `
      <p><strong>Текущая тестовая версия:</strong></p>
      <ul>
        <li>Добавлено автосохранение прогресса.</li>
        <li>Подготовлен iOS-билд через Capacitor.</li>
        <li>Добавлены встроенные экраны инструкции и FAQ.</li>
        <li>Улучшен онбординг для внешних тестеров.</li>
      </ul>
    `
  },
  reportBug: {
    title: "Сообщить о баге",
    body: `
      <p>Если заметил проблему, отправь отчёт в чат/канал тестирования проекта.</p>
      <h3>Что прислать</h3>
      <ul>
        <li>Устройство и платформу (например, iPhone 16 Pro Max / Safari).</li>
        <li>Шаги воспроизведения по пунктам.</li>
        <li>Ожидаемый и фактический результат.</li>
        <li>Скриншот или короткое видео.</li>
        <li>Повторяемость: всегда / иногда / один раз.</li>
      </ul>
    `
  }
};

function rand(max) {
  return Math.floor(Math.random() * max);
}

function setLog(msg) {
  logEl.textContent = msg;
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function isOccupied(x, y) {
  if (state.player.x === x && state.player.y === y) return true;
  return state.enemies.some((e) => e.x === x && e.y === y && e.hp > 0);
}

function spawnFloor() {
  state.enemies = [];
  state.player = { x: 0, y: 0 };
  state.exit = { x: size - 1, y: size - 1 };

  const enemyCount = state.floor + 2;
  for (let i = 0; i < enemyCount; i += 1) {
    let x = 0;
    let y = 0;
    do {
      x = rand(size);
      y = rand(size);
    } while ((x === 0 && y === 0) || (x === size - 1 && y === size - 1) || isOccupied(x, y));

    const isBoss = state.floor === totalFloors && i === enemyCount - 1;
    state.enemies.push({
      x,
      y,
      hp: isBoss ? 8 : 4,
      damage: isBoss ? 3 : 1,
      boss: isBoss
    });
  }
}

function tileClass(x, y) {
  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  if (state.player.x === x && state.player.y === y) return "tile player";
  if (enemy) return `tile ${enemy.boss ? "enemy-boss" : "enemy"} enemy`;

  const adjacent = manhattan(state.player, { x, y }) === 1;
  const isExit = state.exit.x === x && state.exit.y === y;
  return `tile ${adjacent ? "adjacent" : ""} ${isExit ? "exit" : ""}`;
}

function tileSymbol(x, y) {
  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  if (state.player.x === x && state.player.y === y) return "P";
  if (enemy) return enemy.boss ? "B" : "E";
  if (state.exit.x === x && state.exit.y === y) return "X";
  return "";
}

function updateStats() {
  hpEl.textContent = `HP: ${state.hp}`;
  scrapEl.textContent = `Scrap: ${state.scrap}`;
  floorEl.textContent = `Этаж: ${state.floor}/${totalFloors}`;
}

function saveGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const payload = {
      floor: state.floor,
      hp: state.hp,
      scrap: state.scrap,
      playerDamage: state.playerDamage,
      dashCharges: state.dashCharges,
      player: { ...state.player },
      exit: { ...state.exit },
      enemies: state.enemies.map((e) => ({ ...e })),
      over: state.over
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (e) {
    // безопасно игнорируем ошибки сохранения
    console.error("Failed to save game state", e);
  }
}

function loadGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data.floor !== "number" ||
      typeof data.hp !== "number" ||
      typeof data.scrap !== "number" ||
      !data.player ||
      !data.exit ||
      !Array.isArray(data.enemies)
    ) {
      return false;
    }

    state.floor = data.floor;
    state.hp = data.hp;
    state.scrap = data.scrap;
    state.playerDamage = data.playerDamage ?? state.playerDamage;
    state.dashCharges = data.dashCharges ?? state.dashCharges;
    state.player = { ...state.player, ...data.player };
    state.exit = { ...state.exit, ...data.exit };
    state.enemies = data.enemies.map((e) => ({ ...e }));
    state.over = Boolean(data.over);

    return true;
  } catch (e) {
    console.error("Failed to load game state", e);
    return false;
  }
}

function clearSavedGame() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error("Failed to clear saved game state", e);
  }
}

function loadSettings() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return {};
    return data;
  } catch (e) {
    console.error("Failed to load settings", e);
    return {};
  }
}

function saveSettings(settings) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

function applySettingsToUi(settings) {
  try {
    const root = document.documentElement;
    if (!root || !settings) return;

    const scale = settings.uiScale || 1;
    root.style.setProperty("--ui-scale", String(scale));
  } catch (e) {
    console.error("Failed to apply settings", e);
  }
}

function openSettings() {
  const settings = loadSettings();
  const modalBody = `
    <p>Настройки применяются только на этом устройстве.</p>
    <h3>Размер интерфейса</h3>
    <p>
      <label>
        Масштаб:
        <select id="uiScaleSelect">
          <option value="0.9">90%</option>
          <option value="1">100%</option>
          <option value="1.1">110%</option>
          <option value="1.25">125%</option>
        </select>
      </label>
    </p>
    <h3>Прогресс</h3>
    <p>Можно начать новый забег и очистить текущее автосохранение.</p>
    <button id="settingsResetRunBtn" type="button">Сбросить прогресс и начать новый забег</button>
  `;

  openInfoModal("howTo"); // откроет модалку, затем перезапишем содержимое
  if (!infoModalTitle || !infoModalBody) return;
  infoModalTitle.textContent = "Настройки";
  infoModalBody.innerHTML = modalBody;

  const uiScaleSelect = document.getElementById("uiScaleSelect");
  if (uiScaleSelect && settings.uiScale) {
    uiScaleSelect.value = String(settings.uiScale);
  }

  uiScaleSelect?.addEventListener("change", () => {
    const next = {
      ...settings,
      uiScale: Number(uiScaleSelect.value)
    };
    saveSettings(next);
    applySettingsToUi(next);
  });

  const resetRunBtn = document.getElementById("settingsResetRunBtn");
  if (resetRunBtn) {
    resetRunBtn.addEventListener("click", () => {
      clearSavedGame();
      closeInfoModal();
      resetGame();
    });
  }
}

function openInfoModal(screenKey) {
  try {
    const screen = infoScreens[screenKey];
    if (!screen || !infoModal || !infoModalTitle || !infoModalBody) return;
    infoModalTitle.textContent = screen.title;
    infoModalBody.innerHTML = screen.body;
    infoModal.classList.remove("hidden");
  } catch (e) {
    console.error("Failed to open info modal", e);
  }
}

function closeInfoModal() {
  try {
    if (!infoModal) return;
    infoModal.classList.add("hidden");
  } catch (e) {
    console.error("Failed to close info modal", e);
  }
}

function render() {
  updateStats();
  grid.innerHTML = "";

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const btn = document.createElement("button");
      btn.className = tileClass(x, y);
      btn.textContent = tileSymbol(x, y);
      btn.type = "button";
      btn.addEventListener("click", () => onTileTap(x, y));
      grid.appendChild(btn);
    }
  }

  saveGame();
}

function attackEnemy(enemy) {
  enemy.hp -= state.playerDamage;
  setLog(`Ты ударил врага на ${state.playerDamage}.`);
  if (enemy.hp <= 0) {
    state.scrap += enemy.boss ? 5 : 2;
    setLog(enemy.boss ? "Босс уничтожен! +5 scrap." : "Враг уничтожен! +2 scrap.");
  }
}

function enemyTurn() {
  for (const enemy of state.enemies.filter((e) => e.hp > 0)) {
    const dist = manhattan(enemy, state.player);
    if (dist === 1) {
      state.hp -= enemy.damage;
      if (state.hp <= 0) {
        state.over = true;
        setLog("Ты погиб в туннелях. Нажми 'Новый забег'.");
        return;
      }
      continue;
    }

    const dx = state.player.x === enemy.x ? 0 : state.player.x > enemy.x ? 1 : -1;
    const dy = state.player.y === enemy.y ? 0 : state.player.y > enemy.y ? 1 : -1;

    const candidateA = { x: enemy.x + dx, y: enemy.y };
    const candidateB = { x: enemy.x, y: enemy.y + dy };
    const move = [candidateA, candidateB].find(
      (c) => inBounds(c.x, c.y) && !isOccupied(c.x, c.y) && !samePos(c, state.exit)
    );
    if (move) {
      enemy.x = move.x;
      enemy.y = move.y;
    }
  }
}

function floorCleared() {
  return state.enemies.every((e) => e.hp <= 0);
}

function maybeFinishFloor() {
  if (!floorCleared() || !samePos(state.player, state.exit)) return;

  if (state.floor >= totalFloors) {
    state.over = true;
    setLog(`Победа! Ты выбрался из метро с ${state.scrap} scrap.`);
    render();
    return;
  }

  chooseRelic(() => {
    state.floor += 1;
    spawnFloor();
    setLog(`Этаж ${state.floor}. Враги стали сильнее.`);
    render();
  });
}

function onTileTap(x, y) {
  if (state.over) return;

  const enemy = state.enemies.find((e) => e.x === x && e.y === y && e.hp > 0);
  const dist = manhattan(state.player, { x, y });

  if (enemy && dist === 1) {
    attackEnemy(enemy);
    enemyTurn();
    render();
    maybeFinishFloor();
    return;
  }

  if (dist !== 1 || enemy) {
    setLog("Можно ходить только на соседнюю свободную клетку.");
    return;
  }

  state.player.x = x;
  state.player.y = y;
  enemyTurn();
  render();
  maybeFinishFloor();
}

function resetGame() {
  clearSavedGame();
  state.floor = 1;
  state.hp = 10;
  state.scrap = 0;
  state.playerDamage = 2;
  state.dashCharges = 0;
  state.over = false;
  spawnFloor();
  setLog("Новый забег. Уничтожь врагов и зайди на выход X.");
  render();
}

function pickTwoRelics() {
  const bag = [...relicPool].sort(() => Math.random() - 0.5);
  return bag.slice(0, 2);
}

function chooseRelic(onChosen) {
  relicOptions.innerHTML = "";
  relicModal.classList.remove("hidden");
  const options = pickTwoRelics();

  options.forEach((relic) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "relic-btn";
    btn.textContent = relic.name;
    btn.addEventListener("click", () => {
      relic.apply(state);
      relicModal.classList.add("hidden");
      setLog(`Получена реликвия: ${relic.name}`);
      onChosen();
    });
    relicOptions.appendChild(btn);
  });
}

endTurnBtn.addEventListener("click", () => {
  if (state.over) return;
  enemyTurn();
  render();
  maybeFinishFloor();
});

restartBtn.addEventListener("click", resetGame);
if (settingsBtn) {
  settingsBtn.addEventListener("click", openSettings);
}

if (howToBtn) {
  howToBtn.addEventListener("click", () => openInfoModal("howTo"));
}
if (faqBtn) {
  faqBtn.addEventListener("click", () => openInfoModal("faq"));
}
if (whatsNewBtn) {
  whatsNewBtn.addEventListener("click", () => openInfoModal("whatsNew"));
}
if (reportBugBtn) {
  reportBugBtn.addEventListener("click", () => openInfoModal("reportBug"));
}
if (infoModalCloseBtn) {
  infoModalCloseBtn.addEventListener("click", closeInfoModal);
}
if (infoModal) {
  infoModal.addEventListener("click", (event) => {
    if (event.target === infoModal) {
      closeInfoModal();
    }
  });
}

function initGame() {
  applySettingsToUi(loadSettings());
  const restored = loadGame();
  if (restored) {
    setLog("Продолжаем последний забег.");
    render();
    return;
  }

  resetGame();
}

initGame();
