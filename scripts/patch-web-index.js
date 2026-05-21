const fs = require("fs");
const path = require("path");

const scale = process.env.EXPO_PUBLIC_WEB_INITIAL_SCALE || "0.85";
const indexPath = path.join(__dirname, "..", "dist", "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("patch-web-index: dist/index.html not found — run expo export -p web first");
  process.exit(1);
}

const viewport = `width=device-width, initial-scale=${scale}, maximum-scale=1`;
let html = fs.readFileSync(indexPath, "utf8");

if (/<meta\s+name="viewport"/i.test(html)) {
  html = html.replace(
    /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="viewport" content="${viewport}" />`
  );
} else {
  html = html.replace("<head>", `<head>\n    <meta name="viewport" content="${viewport}" />`);
}

// Make exported assets work when dist/index.html is opened outside a root-hosted web server.
html = html.replace(/(["'])\/_expo\//g, '$1./_expo/');
html = html.replace(/(["'])\/assets\//g, '$1./assets/');

fs.writeFileSync(indexPath, html);
console.log(`patch-web-index: viewport initial-scale=${scale}; asset paths rewritten to relative URLs`);
