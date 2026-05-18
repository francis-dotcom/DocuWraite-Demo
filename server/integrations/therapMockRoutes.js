/**
 * Local mock Therap API for testing the live HTTP path.
 * Set THERAP_API_BASE_URL=http://localhost:8787/therap-mock
 */

const express = require("express");
const { listRegisteredClientIds } = require("./therapClientRegistry");
const { fetchDemoShiftFeed, fetchDemoCarePlan } = require("./therapDemoProvider");
const { getTodayShiftDate } = require("../storage");

function createTherapMockRouter() {
  const router = express.Router();

  router.get("/shift-feed", (req, res) => {
    const individualId = String(req.query.individualId || "").trim();
    const shiftDate = req.query.shiftDate || getTodayShiftDate();
    const clientId = listRegisteredClientIds().find(
      (id) => require("./therapClientRegistry").resolveTherapIndividualId(id) === individualId
    );

    if (!clientId) {
      res.status(404).json({ error: `Unknown Therap individualId: ${individualId}` });
      return;
    }

    const feed = fetchDemoShiftFeed(clientId, shiftDate);
    if (!feed) {
      res.status(404).json({ error: "No shift feed for client" });
      return;
    }

    res.json({
      individualId,
      shiftDate: feed.shiftDate,
      schedule: feed.schedule,
      intelligenceOptions: feed.intelligenceOptions,
    });
  });

  router.get("/care-plan", (req, res) => {
    const individualId = String(req.query.individualId || "").trim();
    const clientId = listRegisteredClientIds().find(
      (id) => require("./therapClientRegistry").resolveTherapIndividualId(id) === individualId
    );

    if (!clientId) {
      res.status(404).json({ error: `Unknown Therap individualId: ${individualId}` });
      return;
    }

    const carePlan = fetchDemoCarePlan(clientId);
    if (!carePlan) {
      res.status(404).json({ error: "No care plan for client" });
      return;
    }

    res.json({
      individualId,
      riskCards: carePlan.riskCards,
      actionPlans: carePlan.actionPlans,
      intelligenceOptions: carePlan.intelligenceOptions,
    });
  });

  return router;
}

module.exports = {
  createTherapMockRouter,
};
