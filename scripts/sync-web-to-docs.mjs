import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function injectCacheBust(htmlPath, version) {
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!/\?v=/.test(html)) {
    console.warn(
      `sync-web-to-docs: в ${path.relative(root, htmlPath)} не найдено параметров ?v= (добавь ?v=… к статике в index.html)`
    );
  }
  const next = html.replace(/\?v=[^"'>\s]+/g, `?v=${version}`);
  fs.writeFileSync(htmlPath, next, "utf8");
}

const pkg = readJson(path.join(root, "package.json"));
const version = pkg.assetVersion;
if (!version || typeof version !== "string") {
  console.error('sync-web-to-docs: в package.json нужно строковое поле "assetVersion"');
  process.exit(1);
}

const webDir = path.join(root, "web");
const docsDir = path.join(root, "docs");

if (!fs.existsSync(webDir)) {
  console.error("sync-web-to-docs: каталог web/ не найден");
  process.exit(1);
}

rmDir(docsDir);
fs.mkdirSync(docsDir, { recursive: true });
copyDir(webDir, docsDir);

injectCacheBust(path.join(webDir, "index.html"), version);
injectCacheBust(path.join(docsDir, "index.html"), version);

console.log(`sync-web-to-docs: готово (assetVersion=${version})`);
