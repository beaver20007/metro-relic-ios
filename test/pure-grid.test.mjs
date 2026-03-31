import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

await import(pathToFileURL(path.join(import.meta.dirname, "../web/pure-grid.js")));

const P = globalThis.MetroRelicPure;

test("manhattan", () => {
  assert.equal(P.manhattan({ x: 0, y: 0 }, { x: 3, y: 4 }), 7);
  assert.equal(P.manhattan({ x: 2, y: 1 }, { x: 2, y: 1 }), 0);
});

test("samePos", () => {
  assert.equal(P.samePos({ x: 1, y: 2 }, { x: 1, y: 2 }), true);
  assert.equal(P.samePos({ x: 0, y: 0 }, { x: 0, y: 1 }), false);
});

test("inBounds", () => {
  assert.equal(P.inBounds(0, 0, 7), true);
  assert.equal(P.inBounds(6, 6, 7), true);
  assert.equal(P.inBounds(7, 0, 7), false);
  assert.equal(P.inBounds(-1, 3, 7), false);
});

test("floorCleared", () => {
  assert.equal(P.floorCleared([]), true);
  assert.equal(P.floorCleared([{ hp: 0 }, { hp: -1 }]), true);
  assert.equal(P.floorCleared([{ hp: 0 }, { hp: 1 }]), false);
});

test("isCellOccupied", () => {
  const player = { x: 1, y: 1 };
  const enemies = [{ x: 2, y: 2, hp: 2 }];
  assert.equal(P.isCellOccupied(1, 1, player, enemies), true);
  assert.equal(P.isCellOccupied(2, 2, player, enemies), true);
  assert.equal(P.isCellOccupied(0, 0, player, enemies), false);
  assert.equal(P.isCellOccupied(2, 2, player, [{ x: 2, y: 2, hp: 0 }]), false);
});

test("isValidSavePayload", () => {
  assert.equal(
    P.isValidSavePayload({
      floor: 1,
      hp: 10,
      scrap: 0,
      player: { x: 0, y: 0 },
      exit: { x: 6, y: 6 },
      enemies: []
    }),
    true
  );
  assert.equal(P.isValidSavePayload(null), false);
  assert.equal(
    P.isValidSavePayload({
      floor: "1",
      hp: 10,
      scrap: 0,
      player: {},
      exit: {},
      enemies: []
    }),
    false
  );
});
