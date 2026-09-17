const fs = require("fs");
const path = require("path");

const root = __dirname;
const outDir = path.join(root, "public");
const entries = [
  ".nojekyll",
  "app.js",
  "assets",
  "index.html",
  "manifest.webmanifest",
  "styles.css",
  "sw.js"
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(root, entry);
  const destination = path.join(outDir, entry);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, destination, { recursive: true });
}

console.log("Static site copied to public/");
