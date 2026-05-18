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
  const normalized = String(text || "")
    .replace(/([A-Za-z0-9])\.\s+([0-9])/g, "$1.$2")
    .replace(/\s+\.pdf/gi, ".pdf");
  const matches = normalized.match(/[A-Za-z0-9._-]+\.pdf/gi) || [];
  return Array.from(
    new Set(
      matches
        .map((item) => item.replace(/\s+/g, ""))
        .filter((item) => item.split(".").length >= 4)
    )
  );
}

function extractParticipants(pages = []) {
  const source = getPageText(pages, 27);
  const rawLines = source.split("\n").map((line) => line.trim());
  const sectionStart = rawLines.findIndex((line) => /Participants/i.test(line));
  const sectionEnd = rawLines.findIndex((line) => /Signature Log/i.test(line));
  const lines = rawLines
    .slice(sectionStart >= 0 ? sectionStart + 1 : 0, sectionEnd >= 0 ? sectionEnd : rawLines.length)
    .filter(Boolean);
  const mergedLines = [];

  for (const line of lines) {
    if (/Relationship with|Participant Individual Plan/i.test(line)) {
      continue;
    }
    if (
      mergedLines.length &&
      !/\b(Yes|No)\b$/i.test(mergedLines[mergedLines.length - 1]) &&
      !/\b(Yes|No)\b$/i.test(line)
    ) {
      mergedLines[mergedLines.length - 1] = `${mergedLines[mergedLines.length - 1]} ${line}`.trim();
      continue;
    }
    mergedLines.push(line);
  }

  const participants = [];

  for (const line of mergedLines) {
    if (!/\b(Yes|No)\b/i.test(line)) {
      continue;
    }
    const match = line.match(/^([A-Z][A-Za-z'.,-]+(?:\s+[A-Z][A-Za-z'.,-]+)*)\s+(.+?)\s+(Yes|No)$/i);
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

function getPageText(pages = [], pageNumber) {
  return pages.find((page) => page.page === pageNumber)?.text || "";
}

function cleanExtractedText(value = "") {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/therapservices\.net\/\S+/gi, " ")
    .replace(/&backLink=%\S+/gi, " ")
    .replace(/formid=\S+/gi, " ")
    .replace(/formld=\S+/gi, " ")
    .replace(/\b\d+\/28\b/g, " ")
    .replace(/Therap :: Individual Plan/gi, " ")
    .replace(/\b5\/11\/26,\s*5:20 PM\b/gi, " ")
    .replace(/\b§\/11\/26,\s*5:20 PM\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function between(text = "", startPattern, endPattern) {
  const startMatch = text.match(startPattern);
  if (!startMatch) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const tail = text.slice(startIndex);
  if (!endPattern) {
    return cleanExtractedText(tail);
  }

  const endMatch = tail.match(endPattern);
  const raw = endMatch ? tail.slice(0, endMatch.index) : tail;
  return cleanExtractedText(raw);
}

function extractAboutMeCards(pages = [], fallback = []) {
  const page1 = getPageText(pages, 1);
  const page2 = getPageText(pages, 2);
  const merged = `${page1}\n${page2}`;

  const cards = [
    {
      title: "What People Admire About Me",
      body: between(merged, /What People/i, /What is Home:|Community:/i),
    },
    {
      title: "What Is Important To Me",
      body: cleanExtractedText(
        `${between(merged, /What is Home:/i, /Community:/i)} ${between(page2, /^.*?to invade her personal space\./i, /Community:/i)}`
      ),
    },
    {
      title: "Community Preferences",
      body: between(`${page2}\n${getPageText(pages, 20)}`, /Community:/i, /How to Supports in the Home:|Supports in the Home:|Things \| would like to do/i),
    },
  ].filter((card) => card.body);

  return cards.length ? cards : fallback;
}

function extractSupportCards(pages = [], fallback = []) {
  const page2 = getPageText(pages, 2);
  const page3 = getPageText(pages, 3);
  const page4 = getPageText(pages, 4);

  const cards = [
    {
      title: "Supports In The Home",
      body: between(`${page2}\n${page3}`, /How to Supports in the Home:|Supports in the Home:/i, /Supports in the Community:|ADLs & Household Chores:/i),
    },
    {
      title: "Supports In The Community",
      body: between(`${page2}\n${page3}`, /Supports in the Community:/i, /ADLs & Household Chores:/i),
    },
    {
      title: "ADLs & Household Chores",
      body: between(page3, /ADLs & Household Chores:/i, /Physical Therapy Services:|Enabling Technology & Medical Equipment:/i),
    },
    {
      title: "Clinical & Equipment Supports",
      body: cleanExtractedText(
        `${between(`${page3}\n${page4}`, /Physical Therapy Services:/i, /Previous Employment:|Consumer Direction:/i)} ${between(`${page3}\n${page4}`, /Enabling Technology & Medical Equipment:/i, /Clinical Nutrition Services:/i)}`
      ),
    },
  ].filter((card) => card.body);

  return cards.length ? cards : fallback;
}

function extractRightsCards(pages = [], fallback = []) {
  const page17 = getPageText(pages, 17);
  const page18 = getPageText(pages, 18);
  const page19 = getPageText(pages, 19);
  const joined = `${page17}\n${page18}\n${page19}`;

  const cards = [
    {
      title: "Decision Making",
      body: cleanExtractedText(
        `${between(page17, /My Decision Making & Rights/i, /Someone else makes decisions for me/i)} Someone else makes decisions for me ${between(page19, /Mary Bet likes to be in charge of her life/i, /Michael Dunn Center is the court appointed/i)}`
      ),
    },
    {
      title: "Advance Directives & Rights",
      body: between(joined, /I \(and my natural/i, /According to her previous provider/i),
    },
    {
      title: "Burial Plans & Legal Authority",
      body: cleanExtractedText(
        `${between(page19, /According to her previous provider/i, /Mary Bet likes to be in charge/i)} ${between(page19, /Michael Dunn Center is the court appointed/i, /My Community Activities/i)}`
      ),
    },
  ].filter((card) => card.body);

  return cards.length ? cards : fallback;
}

function extractActivityCards(pages = [], fallback = []) {
  const page19 = getPageText(pages, 19);
  const page20 = getPageText(pages, 20);
  const page21 = getPageText(pages, 21);

  const cards = [
    {
      title: "Current Community Activities",
      body: between(page19, /My Community Activities/i, /Things \| would like to do or learn about in the community include/i),
    },
    {
      title: "Community Goals & Needed Supports",
      body: between(page20, /Things \| would like to do or learn about in the community include/i, /Mary Bet is transported by/i),
    },
    {
      title: "Transportation & Safety",
      body: between(`${page20}\n${page21}`, /Mary Bet is transported by/i, /Natural\/Informal Supports|Restrictions|Action Plans/i),
    },
  ].filter((card) => card.body);

  return cards.length ? cards : fallback;
}

function extractDocumentChecklist(pages = [], fallback = []) {
  const page24 = getPageText(pages, 24);
  const page25 = getPageText(pages, 25);
  const page26 = getPageText(pages, 26);
  const lines = `${page24}\n${page25}\n${page26}`.split("\n").map((line) => line.trim());
  const items = [];
  let collecting = false;
  let current = [];

  const flush = () => {
    const value = cleanExtractedText(current.join(" "));
    if (
      value &&
      !/^(Checklist Attachment|Description|Uploaded By|Other)$/i.test(value) &&
      !/\.pdf|\(.*KB\)|Avery Quinn|Therap :: Individual Plan/i.test(value)
    ) {
      items.push(value);
    }
    current = [];
  };

  for (const line of lines) {
    if (/Document Checklist/i.test(line)) {
      collecting = true;
      continue;
    }
    if (!collecting) {
      continue;
    }
    if (/Participants|Acknowledgement Report/i.test(line)) {
      flush();
      break;
    }
    if (!line) {
      flush();
      continue;
    }
    if (/Therap :: Individual Plan|\.pdf|\(.*KB\)|Avery|Quinn,|Indepen|Support|Coordin|Description|Uploade|By/i.test(line)) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();

  const uniqueItems = Array.from(new Set(items)).filter((item) => item.split(" ").length >= 1);
  const qualityOk = uniqueItems.length >= 8 && uniqueItems.some((item) => item.split(" ").length >= 2);
  return qualityOk ? uniqueItems.slice(0, 24) : fallback;
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
  const aboutMeCards = extractAboutMeCards(pages, fallbackProfile.aboutMeCards || []);
  const supportCards = extractSupportCards(pages, fallbackProfile.supportCards || []);
  const rightsCards = extractRightsCards(pages, fallbackProfile.rightsCards || []);
  const activityCards = extractActivityCards(pages, fallbackProfile.activityCards || []);
  const documentChecklist = extractDocumentChecklist(pages, fallbackProfile.documentChecklist || []);

  return {
    sourcePath: PDF_SOURCE_PATH,
    extractedAt: new Date().toISOString(),
    pageCount: pages.length,
    editorContent: {
      carePlanHeader: header,
      aboutMeCards,
      supportCards,
      rightsCards,
      activityCards,
      documentChecklist,
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
