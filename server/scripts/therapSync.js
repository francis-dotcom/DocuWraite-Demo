#!/usr/bin/env node
/**
 * CLI: npm run sync:therap
 * Pulls shift + care plan from Therap (or demo fallback) into SQLite.
 *
 * Examples:
 *   npm run sync:therap
 *   npm run sync:therap -- --clients mary-bet,mark-brent --shift-only
 *   THERAP_API_BASE_URL=http://localhost:8787/therap-mock npm run sync:therap
 */

const { runTherapSync } = require("../therapSync");
const { getTodayShiftDate } = require("../storage");

function parseArgs(argv = []) {
  const options = {
    shiftDate: getTodayShiftDate(),
    clientIds: null,
    syncShiftSchedule: true,
    syncCarePlan: true,
    mode: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--shift-only") {
      options.syncCarePlan = false;
    } else if (arg === "--care-plan-only") {
      options.syncShiftSchedule = false;
    } else if (arg === "--demo") {
      options.mode = "demo";
    } else if (arg === "--live") {
      options.mode = "live";
    } else if (arg === "--date" && argv[index + 1]) {
      options.shiftDate = argv[index + 1];
      index += 1;
    } else if (arg === "--clients" && argv[index + 1]) {
      options.clientIds = argv[index + 1].split(",").map((id) => id.trim()).filter(Boolean);
      index += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runTherapSync(options);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
