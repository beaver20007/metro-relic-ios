# Metro Relic iOS Bootstrap

Готовый стартовый проект оффлайн-игры с веб-ядром и оберткой iOS через Capacitor.

## Что уже сделано

- Играбельный оффлайн прототип (`web/`): сетка, враги, 3 этажа, босс, реликвии.
- Конфиг Capacitor (`capacitor.config.ts`) для сборки iOS-приложения.
- NPM-скрипты для запуска локально и синхронизации iOS-проекта.

## Быстрый старт

1. Установить Node.js LTS (18+).
2. Выполнить:

```bash
npm install
```

3. Локально проверить игру:

```bash
npm run dev
```

4. Открыть в браузере:

```text
http://localhost:4173
```

## iOS сборка (без публикации в App Store)

После установки Capacitor-зависимостей:

```bash
npx cap add ios
npm run sync:ios
npm run open:ios
```

Дальше в Xcode:

1. Выбрать Team (Apple ID / Developer).
2. Обновить Bundle Identifier при необходимости.
3. Выбрать подключенный iPhone как target.
4. Нажать Run.

Для тестирования командой без App Store используйте TestFlight internal testing.
