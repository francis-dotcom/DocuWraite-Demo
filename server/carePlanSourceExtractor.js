const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const PDF_SOURCE_PATH = path.join(__dirname, "..", "demoDocs", "care-plan.pdf");
const FALLBACK_PAGES_DIR = path.join(__dirname, "..", "demoCarePlanPages");

function splitPagesFromText(text = "") {
  return String(text || "")
    .split("\f")
    .map((pageText, index) => ({
      page: index + 1,
      text: String(pageText || "").trim(),
    }))
    .filter((page) => page.text);
}

function readPagesFromFallbackFiles() {
  const entries = fs
    .readdirSync(FALLBACK_PAGES_DIR)
    .filter((name) => /^page-\d+\.txt$/i.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  return entries.map((name) => ({
    page: Number(name.match(/page-(\d+)\.txt/i)?.[1] || 0),
    text: fs.readFileSync(path.join(FALLBACK_PAGES_DIR, name), "utf8").trim(),
  }));
}

function extractPagesFromPdf() {
  if (!fs.existsSync(PDF_SOURCE_PATH)) {
    return readPagesFromFallbackFiles();
  }

  const tmpFile = path.join(os.tmpdir(), `docuwraite-care-plan-${Date.now()}.txt`);
  try {
    execFileSync("pdftotext", ["-layout", PDF_SOURCE_PATH, tmpFile], {
      stdio: "ignore",
    });
    const output = fs.readFileSync(tmpFile, "utf8");
    const pages = splitPagesFromText(output);
    return pages.length ? pages : readPagesFromFallbackFiles();
  } catch (_error) {
    return readPagesFromFallbackFiles();
  } finally {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}

function normalizeWhitespace(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function findFirstMatch(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }
  return "";
}

function extractDocumentFiles(text = "") {
  const matches = String(text || "").match(/[A-Za-z0-9._-]+\.pdf/gi) || [];
  return Array.from(new Set(matches.map((item) => item.replace(/\s+/g, ""))));
}

function extractParticipants(pages = []) {
  const joined = pages.map((page) => page.text).join("\n");
  const lines = joined.split("\n").map((line) => line.trim()).filter(Boolean);
  const participants = [];

  for (const line of lines) {
    if (!/\bYes\b|\bNo\b/i.test(line)) {
      continue;
    }
    if (!/[A-Za-z]/.test(line) || /Therap|Signature Log|Participant/i.test(line)) {
      continue;
    }
    const match = line.match(/^(.+?)\s{2,}(.+?)\s+(Yes|No)$/i) || line.match(/^(.+?)\s+(.+?)\s+(Yes|No)$/i);
    if (!match) {
      continue;
    }
    participants.push({
      name: normalizeWhitespace(match[1]),
      relationship: normalizeWhitespace(match[2]),
      copy: match[3],
    });
  }

  return participants.slice(0, 12);
}

function extractSignatureLogs(documentFiles = []) {
  return documentFiles
    .filter((file) => /signature|informedchoice|risktool|speechpoc/i.test(file))
    .map((file) => `Source attachment found: ${file}`);
}

function extractHeader(pages = [], fallbackHeader = {}) {
  const joined = normalizeWhitespace(pages.map((page) => page.text).join(" "));

  const fullName = findFirstMatch(joined, [
    /Individual\s+([A-Z][A-Z\s.'-]+?)\s+Photo/i,
    /Individual\s+([A-Z][A-Z\s.'-]+?)\s+Oversight ID/i,
  ]);
  const oversightId = findFirstMatch(joined, [/Oversight ID\s+([A-Z0-9-]+)/i]);
  const dob = findFirstMatch(joined, [/Date of Birth\s+([0-9/]+)/i]);
  const medicaidId = findFirstMatch(joined, [
    /Medicaid\s+([A-Z0-9]+)/i,
    /Medicaid Number\s+([A-Z0-9]+)/i,
  ]);
  const planStart = findFirstMatch(joined, [/Start Date\s+([0-9/]+)/i]);
  const planEnd = findFirstMatch(joined, [/End Date\s+([0-9/]+)/i]);

  return {
    ...fallbackHeader,
    fullName: fullName || fallbackHeader.fullName || "",
    oversightId: oversightId || fallbackHeader.oversightId || "",
    dob: dob || fallbackHeader.dob || "",
    medicaidId: medicaidId || fallbackHeader.medicaidId || "",
    planStart: planStart || fallbackHeader.planStart || "",
    planEnd: planEnd || fallbackHeader.planEnd || "",
  };
}

function extractCarePlanFromSource({ fallbackProfile = {} } = {}) {
  const pages = extractPagesFromPdf();
  const fullText = pages.map((page) => page.text).join("\n");
  const documentFiles = extractDocumentFiles(fullText);
  const participants = extractParticipants(pages);
  const signatureLogs = extractSignatureLogs(documentFiles);
  const header = extractHeader(pages, fallbackProfile.carePlanHeader || {});

  return {
    sourcePath: PDF_SOURCE_PATH,
    extractedAt: new Date().toISOString(),
    pageCount: pages.length,
    editorContent: {
      carePlanHeader: header,
      carePlanTextPages: pages,
      documentFiles: documentFiles.length ? documentFiles : fallbackProfile.documentFiles || [],
      participants: participants.length ? participants : fallbackProfile.participants || [],
      signatureLogs: signatureLogs.length ? signatureLogs : fallbackProfile.signatureLogs || [],
    },
  };
}

module.exports = {
  extractCarePlanFromSource,
};
