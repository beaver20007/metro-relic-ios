window.MetroRelicI18n = {
  bundles: {
    ru: {
      unknownStation: "Станция: Неизвестная линия",
      meta: { htmlLang: "ru", dateLocale: "ru-RU" },
      dom: {
        splashTagline: "Выбраться любой ценой",
        splashStart: "Начать забег",
        splashHowTo: "Как играть",
        splashMeta: "Тестовая сборка • v0.1",
        gridAria: "Игровое поле",
        endTurn: "Пропустить ход",
        restart: "Новый забег",
        settings: "Настройки",
        howTo: "Как играть",
        faq: "Частые ошибки",
        whatsNew: "Что нового",
        stats: "Статистика",
        reportBug: "Сообщить о баге",
        infoDefaultTitle: "Информация",
        closeAria: "Закрыть",
        relicPickTitle: "Выбери реликвию",
        initialLog: "Начало забега. Доберись до выхода."
      },
      stats: {
        hpLine: "Жизни: {n}",
        scrapLine: "Трофеи: {n}",
        floorLine: "Этаж: {cur}/{total} • {diff}"
      },
      dash: {
        armed: "Рывок… ({n})",
        idle: "Рывок ({n})"
      },
      settings: {
        title: "Настройки",
        intro: "Настройки применяются только на этом устройстве.",
        languageHeading: "Язык",
        languageHint: "Интерфейс и сообщения игры.",
        languageRu: "Русский",
        languageEn: "English",
        difficultyHeading: "Сложность",
        presetLabel: "Пресет:",
        uiScaleHeading: "Размер интерфейса",
        scaleLabel: "Масштаб:",
        soundHeading: "Звук",
        soundOn: "Включен",
        volumeLabel: "Громкость:",
        progressHeading: "Прогресс",
        progressHint: "Можно начать новый забег и очистить текущее автосохранение.",
        applyDifficulty: "Применить сложность и начать новый забег",
        resetRun: "Сбросить прогресс и начать новый забег"
      },
      statsModal: {
        title: "Статистика",
        section: "Общая",
        runs: "Запусков забега: {n}",
        wins: "Побед: {n}",
        defeats: "Поражений: {n}",
        maxFloor: "Максимальный этаж: {m}/{t}",
        lastPlay: "Последняя игра: {when}",
        never: "еще не было"
      },
      logs: {
        continueRun: "Продолжаем последний забег.",
        startRun: "{station}. Новый забег: {lives}. Уничтожь врагов и зайди на выход X.",
        hit: "Ты ударил врага на {dmg}.",
        bossKill: "Босс уничтожен! +{gain}.",
        enemyKill: "Враг уничтожен! +{gain}.",
        win: "Победа! Ты выбрался из метро, набрав {scrap}.",
        defeat: "Поражение! Ты погиб в туннелях. Нажми 'Новый забег'.",
        finishedFloor: "Этаж {floor} пройден. Переход на этаж {next}...",
        newFloor: "{station}. Этаж {floor}. Враги стали сильнее.",
        exitCloser: "Подойди к выходу X вплотную.",
        moveAdjacentOnly: "Можно ходить только на соседнюю свободную клетку.",
        dashBadPath: "Рывок невозможен: нужны две свободные клетки в ряд.",
        wall: "Дальше туннельной стены идти нельзя.",
        noDash: "Нет зарядов рывка.",
        noDashBoots: "Нет зарядов рывка. Они появляются от реликвии «Тактические ботинки».",
        dashArmOn: "Свайпни по полю — рывок на 2 клетки. Или Shift + стрелка / WASD.",
        dashArmOff: "Режим рывка выключен.",
        difficultyRestart: "Сложность: {label}. Новый забег начат.",
        relicTaken: "Получена реликвия: {name}"
      },
      transitions: {
        genericTitle: "Переход",
        genericSubtitle: "Переход...",
        victoryTitle: "ПОБЕДА",
        victoryLoot: "Добыча: {scrap}",
        defeatTitle: "ПОРАЖЕНИЕ",
        defeatSubtitle: "Нажми «Новый забег»",
        floorBanner: "ЭТАЖ {n}"
      },
      relics: {
        steel: "Стальная обшивка (+3 жизни)",
        claw: "Заточка (+1 урон)",
        battery: "Энергоячейка (+2 трофея)",
        boots: "Тактические ботинки (рывок раз в бой)",
        injector: "Боевой инжектор (+2 жизни, +1 урон)",
        scrapper: "Сборщик трофеев (+4 трофея)"
      },
      presets: {
        easy: "Легко",
        normal: "Нормально",
        hard: "Сложно"
      },
      stations: {},
      bug: {
        defaultTitle: "Баг-репорт",
        buildFailTitle: "Баг-репорт",
        buildFailText: "Не удалось собрать отчёт автоматически.",
        valTitle: "Заголовок должен быть не короче 6 символов.",
        valSteps: "Опиши шаги воспроизведения (минимум 10 символов).",
        valExpected: "Укажи ожидаемый результат (минимум 6 символов).",
        valActual: "Укажи фактический результат (минимум 6 символов).",
        valGeneric: "Не удалось проверить форму. Попробуй снова.",
        copyOk: "Отчёт скопирован. Вставь его в тикет/чат.",
        copyFail: "Не удалось скопировать автоматически. Скопируй вручную.",
        issueOk: "Открыта страница создания issue.",
        issueFail: "Не удалось открыть GitHub Issue.",
        mailOk: "Открыт почтовый клиент.",
        mailFail: "Не удалось открыть почтовый клиент.",
        lblTitle: "Заголовок:",
        lblSteps: "Шаги воспроизведения:",
        lblExpected: "Ожидаемый результат:",
        lblActual: "Фактический результат:",
        lblContact: "Контакт:",
        lblTech: "Техданные:",
        lblUrl: "URL:",
        lblUa: "User-Agent:",
        lblFloor: "Этаж:",
        lblHp: "Жизни:",
        lblScrap: "Трофеи:",
        lblState: "Состояние:",
        stateOver: "run-over",
        stateRun: "in-run",
        unset: "Не указано",
        noContact: "Не указан"
      },
      infoScreens: {
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
      <h3>Между этажами</h3>
      <p>Дойдя до выхода <strong>X</strong> (когда все враги уничтожены), выбери одну из двух предложенных реликвий — бонус сразу применяется.</p>
      <h3>Рывок</h3>
      <p>Заряды рывка даёт реликвия «Тактические ботинки» (и за них же в логе есть подсказка). Нажми <strong>«Рывок»</strong>, затем свайп — прыжок на <strong>две</strong> свободные клетки по прямой (не через врагов). На клавиатуре: <strong>Shift</strong> + стрелка или WASD — сразу рывок в эту сторону.</p>
      <h3>Управление</h3>
      <ul>
        <li>Свайпай по полю в нужную сторону, чтобы двигаться и атаковать.</li>
        <li>На клавиатуре используй стрелки или WASD.</li>
        <li>После твоего действия враги делают ход.</li>
      </ul>
    `
        },
        faq: {
          title: "Частые ошибки",
          body: `
      <h3>Этаж не завершается на X</h3>
      <p>В текущей версии этаж должен завершаться сразу при входе на X. Если этого не произошло — это баг, отправь отчёт через форму “Сообщить о баге”.</p>
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
        <li>Добавлены звуки действий и экран статистики.</li>
        <li>Расширены реликвии и атмосфера метро по этажам.</li>
        <li>Между этажами снова выбирается реликвия из двух вариантов.</li>
        <li>Работает рывок на две клетки (ботинки и кнопка «Рывок» / Shift+направление).</li>
        <li>Улучшен онбординг для внешних тестеров.</li>
      </ul>
    `
        },
        reportBug: {
          title: "Сообщить о баге",
          body: `
      <p>Заполни форму ниже: мы соберем готовый отчёт для отправки.</p>
      <p>
        <label>
          Краткий заголовок проблемы
          <input id="bugTitleInput" type="text" placeholder="Например: На 2 этаже не играет звук победы" />
        </label>
      </p>
      <p>
        <label>
          Шаги воспроизведения
          <textarea id="bugStepsInput" rows="4" placeholder="1) Открыть игру...&#10;2) Сделать ход...&#10;3) Получилось..."></textarea>
        </label>
      </p>
      <p>
        <label>
          Ожидаемый результат
          <textarea id="bugExpectedInput" rows="2" placeholder="Что должно было произойти"></textarea>
        </label>
      </p>
      <p>
        <label>
          Фактический результат
          <textarea id="bugActualInput" rows="2" placeholder="Что произошло на самом деле"></textarea>
        </label>
      </p>
      <p>
        <label>
          Контакты (опционально)
          <input id="bugContactInput" type="text" placeholder="@telegram / email" />
        </label>
      </p>
      <button id="bugCopyBtn" type="button">Скопировать отчёт</button>
      <button id="bugOpenIssueBtn" type="button">Открыть заявку на GitHub</button>
      <button id="bugEmailBtn" type="button">Отправить по email</button>
      <p id="bugReportStatus" style="margin-top:8px; opacity:.9;"></p>
    `
        }
      }
    },
    en: {
      unknownStation: "Station: Unknown",
      meta: { htmlLang: "en", dateLocale: "en-US" },
      dom: {
        splashTagline: "Get out at any cost",
        splashStart: "Start run",
        splashHowTo: "How to play",
        splashMeta: "Test build • v0.1",
        gridAria: "Game board",
        endTurn: "Skip turn",
        restart: "New run",
        settings: "Settings",
        howTo: "How to play",
        faq: "FAQ",
        whatsNew: "What’s new",
        stats: "Statistics",
        reportBug: "Report a bug",
        infoDefaultTitle: "Info",
        closeAria: "Close",
        relicPickTitle: "Choose a relic",
        initialLog: "Start of the run. Reach the exit."
      },
      stats: {
        hpLine: "HP: {n}",
        scrapLine: "Scrap: {n}",
        floorLine: "Floor: {cur}/{total} • {diff}"
      },
      dash: {
        armed: "Dash… ({n})",
        idle: "Dash ({n})"
      },
      settings: {
        title: "Settings",
        intro: "These options apply only on this device.",
        languageHeading: "Language",
        languageHint: "Interface and in-game messages.",
        languageRu: "Russian",
        languageEn: "English",
        difficultyHeading: "Difficulty",
        presetLabel: "Preset:",
        uiScaleHeading: "UI size",
        scaleLabel: "Scale:",
        soundHeading: "Sound",
        soundOn: "Enabled",
        volumeLabel: "Volume:",
        progressHeading: "Progress",
        progressHint: "Start a fresh run and clear the current autosave.",
        applyDifficulty: "Apply difficulty & new run",
        resetRun: "Clear save & new run"
      },
      statsModal: {
        title: "Statistics",
        section: "Overall",
        runs: "Runs started: {n}",
        wins: "Wins: {n}",
        defeats: "Defeats: {n}",
        maxFloor: "Best floor: {m}/{t}",
        lastPlay: "Last played: {when}",
        never: "never"
      },
      logs: {
        continueRun: "Resuming your last run.",
        startRun: "{station}. New run: {lives}. Clear enemies and reach exit X.",
        hit: "You hit the enemy for {dmg}.",
        bossKill: "Boss destroyed! +{gain}.",
        enemyKill: "Enemy destroyed! +{gain}.",
        win: "Victory! You escaped the metro with {scrap}.",
        defeat: "Defeat! You died in the tunnels. Tap “New run”.",
        finishedFloor: "Floor {floor} cleared. Moving to floor {next}...",
        newFloor: "{station}. Floor {floor}. Enemies grow stronger.",
        exitCloser: "Move next to exit X.",
        moveAdjacentOnly: "You can only move to a free neighbouring tile.",
        dashBadPath: "Dash impossible: need two free tiles in a line.",
        wall: "You can’t go past the tunnel wall.",
        noDash: "No dash charges.",
        noDashBoots: "No dash charges. The “Tactical boots” relic grants charges.",
        dashArmOn: "Swipe on the board — dash 2 tiles. Or Shift + arrow / WASD.",
        dashArmOff: "Dash mode off.",
        difficultyRestart: "Difficulty: {label}. New run started.",
        relicTaken: "Relic acquired: {name}"
      },
      transitions: {
        genericTitle: "Transition",
        genericSubtitle: "Moving…",
        victoryTitle: "VICTORY",
        victoryLoot: "Loot: {scrap}",
        defeatTitle: "DEFEAT",
        defeatSubtitle: "Tap “New run”",
        floorBanner: "FLOOR {n}"
      },
      relics: {
        steel: "Steel plating (+3 HP)",
        claw: "Sharpening (+1 damage)",
        battery: "Power cell (+2 scrap)",
        boots: "Tactical boots (dash charge)",
        injector: "Combat injector (+2 HP, +1 damage)",
        scrapper: "Scrap collector (+4 scrap)"
      },
      presets: {
        easy: "Easy",
        normal: "Normal",
        hard: "Hard"
      },
      stations: {
        1: "Station: River Terminal",
        2: "Station: Theater",
        3: "Station: Depot-13"
      },
      bug: {
        defaultTitle: "Bug report",
        buildFailTitle: "Bug report",
        buildFailText: "Could not build the report automatically.",
        valTitle: "Title must be at least 6 characters.",
        valSteps: "Describe steps to reproduce (min. 10 characters).",
        valExpected: "Expected result required (min. 6 characters).",
        valActual: "Actual result required (min. 6 characters).",
        valGeneric: "Could not validate the form. Try again.",
        copyOk: "Report copied. Paste it into a ticket or chat.",
        copyFail: "Could not copy automatically. Copy manually.",
        issueOk: "GitHub new-issue page opened.",
        issueFail: "Could not open GitHub issue page.",
        mailOk: "Mail client opened.",
        mailFail: "Could not open mail client.",
        lblTitle: "Title:",
        lblSteps: "Steps:",
        lblExpected: "Expected:",
        lblActual: "Actual:",
        lblContact: "Contact:",
        lblTech: "Technical:",
        lblUrl: "URL:",
        lblUa: "User-Agent:",
        lblFloor: "Floor:",
        lblHp: "HP:",
        lblScrap: "Scrap:",
        lblState: "State:",
        stateOver: "run-over",
        stateRun: "in-run",
        unset: "Not provided",
        noContact: "None"
      },
      infoScreens: {
        howTo: {
          title: "How to play",
          body: `
      <p>Metro Relic is a turn-based tactics game on a 7×7 grid.</p>
      <h3>Goal</h3>
      <ul>
        <li>Clear 3 floors.</li>
        <li>Defeat all enemies on each floor.</li>
        <li>Reach exit <strong>X</strong>.</li>
      </ul>
      <h3>Symbols</h3>
      <ul>
        <li>P — player</li>
        <li>E — enemy</li>
        <li>B — boss (last floor)</li>
        <li>X — exit</li>
      </ul>
      <h3>Between floors</h3>
      <p>After clearing enemies, step on <strong>X</strong> and pick one of two relics — the bonus applies immediately.</p>
      <h3>Dash</h3>
      <p>Dash charges come from the “Tactical boots” relic. Tap <strong>Dash</strong>, then swipe to jump <strong>two</strong> empty tiles in a straight line (not through enemies). Keyboard: <strong>Shift</strong> + arrow / WASD dashes instantly.</p>
      <h3>Controls</h3>
      <ul>
        <li>Swipe on the board to move and attack.</li>
        <li>Keyboard: arrows or WASD.</li>
        <li>After your action, enemies move.</li>
      </ul>
    `
        },
        faq: {
          title: "FAQ",
          body: `
      <h3>Floor won’t end on X</h3>
      <p>It should finish as soon as you enter X. If not, please report via “Report a bug”.</p>
      <h3>I can’t move</h3>
      <p>Only orthogonal neighbour tiles; no diagonals.</p>
      <h3>Attack doesn’t work</h3>
      <p>You must stand next to an enemy to hit it.</p>
      <h3>I die too fast</h3>
      <p>Try to pull enemies one by one; avoid being surrounded.</p>
      <h3>Save didn’t restore</h3>
      <p>Please report device, browser, and what you did before it happened.</p>
    `
        },
        whatsNew: {
          title: "What’s new",
          body: `
      <p><strong>Current test build:</strong></p>
      <ul>
        <li>Autosave progress.</li>
        <li>iOS wrapper via Capacitor.</li>
        <li>In-game help, FAQ, changelog.</li>
        <li>SFX and statistics screen.</li>
        <li>Relics and metro-themed floors.</li>
        <li>Relic choice between floors.</li>
        <li>Two-tile dash (boots + Dash / Shift-move).</li>
      </ul>
    `
        },
        reportBug: {
          title: "Report a bug",
          body: `
      <p>Fill the form — we’ll build a ready-to-send report.</p>
      <p>
        <label>
          Short title
          <input id="bugTitleInput" type="text" placeholder="e.g. Victory sound missing on floor 2" />
        </label>
      </p>
      <p>
        <label>
          Steps to reproduce
          <textarea id="bugStepsInput" rows="4" placeholder="1) Open…&#10;2) Do…&#10;3) See…"></textarea>
        </label>
      </p>
      <p>
        <label>
          Expected result
          <textarea id="bugExpectedInput" rows="2" placeholder="What should happen"></textarea>
        </label>
      </p>
      <p>
        <label>
          Actual result
          <textarea id="bugActualInput" rows="2" placeholder="What happened"></textarea>
        </label>
      </p>
      <p>
        <label>
          Contact (optional)
          <input id="bugContactInput" type="text" placeholder="@telegram / email" />
        </label>
      </p>
      <button id="bugCopyBtn" type="button">Copy report</button>
      <button id="bugOpenIssueBtn" type="button">Open GitHub issue</button>
      <button id="bugEmailBtn" type="button">Send via email</button>
      <p id="bugReportStatus" style="margin-top:8px; opacity:.9;"></p>
    `
        }
      }
    }
  }
};
