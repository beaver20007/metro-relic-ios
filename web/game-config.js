window.GAME_CONFIG = {
  size: 7,
  totalFloors: 3,
  floorTransitionMs: 1200,
  resultAnnounceMs: 1900,
  saveKey: "metroRelicSaveV1",
  settingsKey: "metroRelicSettingsV1",
  metricsKey: "metroRelicMetricsV1",
  bugReportGithubNewIssueUrl: "https://github.com/beaver20007/metro-relic-ios/issues/new",
  defaultSettings: {
    uiScale: 1,
    difficulty: "normal",
    soundEnabled: true,
    volume: 70,
    locale: "ru"
  },
  defaultMetrics: {
    runs: 0,
    wins: 0,
    defeats: 0,
    maxFloorReached: 1,
    lastPlayedAt: null
  },
  floorStations: {
    1: "Станция: Речной вокзал",
    2: "Станция: Театральная",
    3: "Станция: Депо-13"
  },
  difficultyPresets: {
    easy: {
      label: "Легко",
      playerHp: 12,
      playerDamage: 3,
      enemyHpBonus: -1,
      enemyDamageBonus: 0,
      enemyCountBonus: -1,
      scrapMultiplier: 1.2
    },
    normal: {
      label: "Нормально",
      playerHp: 10,
      playerDamage: 2,
      enemyHpBonus: 0,
      enemyDamageBonus: 0,
      enemyCountBonus: 0,
      scrapMultiplier: 1
    },
    hard: {
      label: "Сложно",
      playerHp: 8,
      playerDamage: 2,
      enemyHpBonus: 1,
      enemyDamageBonus: 1,
      enemyCountBonus: 1,
      scrapMultiplier: 0.9
    }
  },
  relicPool: [
    { id: "steel", name: "Стальная обшивка (+3 жизни)", apply: (s) => (s.hp += 3) },
    { id: "claw", name: "Заточка (+1 урон)", apply: (s) => (s.playerDamage += 1) },
    { id: "battery", name: "Энергоячейка (+2 трофея)", apply: (s) => (s.scrap += 2) },
    { id: "boots", name: "Тактические ботинки (рывок раз в бой)", apply: (s) => (s.dashCharges += 1) },
    { id: "injector", name: "Боевой инжектор (+2 жизни, +1 урон)", apply: (s) => ((s.hp += 2), (s.playerDamage += 1)) },
    { id: "scrapper", name: "Сборщик трофеев (+4 трофея)", apply: (s) => (s.scrap += 4) }
  ]
};
