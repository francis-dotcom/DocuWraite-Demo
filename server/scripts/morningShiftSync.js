#!/usr/bin/env node
/**
 * CLI: npm run sync:morning-shift
 * Refreshes today's shift schedules for all demo clients (Therap/MAR-style morning feed).
 */

const { runMorningShiftSync } = require("../morningShiftSync");
const { getTodayShiftDate } = require("../storage");

const shiftDate = process.argv[2] || getTodayShiftDate();
const result = runMorningShiftSync({ shiftDate });

console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
