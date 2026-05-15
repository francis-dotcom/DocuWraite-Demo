const fs = require("fs");
const path = require("path");

const CURATED_PAGE_NUMBERS = [2, 3, 6, 7, 19, 20];

let carePlanPagesCache;

function loadCarePlanPages() {
  if (carePlanPagesCache) {
    return carePlanPagesCache;
  }

  const sourcePath = path.join(__dirname, "..", "carePlanText.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const match = source.match(/export const carePlanText = (\[[\s\S]*\]);/);
  if (!match) {
    carePlanPagesCache = [];
    return carePlanPagesCache;
  }

  carePlanPagesCache = JSON.parse(match[1]);
  return carePlanPagesCache;
}

function normalizeCarePlanText(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCuratedCarePlanExcerpts() {
  const pages = loadCarePlanPages();
  const wanted = new Set(CURATED_PAGE_NUMBERS);

  return pages
    .filter((entry) => wanted.has(entry.page))
    .map((entry) => `Page ${entry.page}: ${normalizeCarePlanText(entry.text)}`)
    .join("\n\n");
}

function getCompactCarePlanContext(maxLength = 1800) {
  const excerpts = getCuratedCarePlanExcerpts();
  if (excerpts.length <= maxLength) {
    return excerpts;
  }
  return `${excerpts.slice(0, maxLength).trim()}...`;
}

module.exports = {
  CURATED_PAGE_NUMBERS,
  getCuratedCarePlanExcerpts,
  getCompactCarePlanContext,
};
