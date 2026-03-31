(function attachMetroRelicPure(globalObj) {
  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function samePos(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function inBounds(x, y, size) {
    return x >= 0 && y >= 0 && x < size && y < size;
  }

  function floorCleared(enemies) {
    return Array.isArray(enemies) && enemies.every((e) => e.hp <= 0);
  }

  function isCellOccupied(x, y, player, enemies) {
    if (!player || !Array.isArray(enemies)) return true;
    if (player.x === x && player.y === y) return true;
    return enemies.some((e) => e.x === x && e.y === y && e.hp > 0);
  }

  function isValidSavePayload(data) {
    return Boolean(
      data &&
      typeof data === "object" &&
      typeof data.floor === "number" &&
      typeof data.hp === "number" &&
      typeof data.scrap === "number" &&
      data.player &&
      typeof data.player === "object" &&
      data.exit &&
      typeof data.exit === "object" &&
      Array.isArray(data.enemies)
    );
  }

  globalObj.MetroRelicPure = {
    manhattan,
    samePos,
    inBounds,
    floorCleared,
    isCellOccupied,
    isValidSavePayload
  };
})(typeof window !== "undefined" ? window : globalThis);
