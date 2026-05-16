export const CLIENT_ROSTER = [
  {
    id: "mary-bet",
    displayName: "Mary Bet",
    searchTerms: ["mary", "bet", "mary bet"],
  },
  {
    id: "mark-brent",
    displayName: "Mark Brent",
    searchTerms: ["mark", "brent", "mark brent"],
  },
  {
    id: "elias-brian",
    displayName: "Elias Brian",
    searchTerms: ["elias", "brian", "elias brian"],
  },
];

export function searchClients(query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return CLIENT_ROSTER;
  }

  return CLIENT_ROSTER.filter((client) => {
    if (client.displayName.toLowerCase().includes(normalized)) {
      return true;
    }
    return client.searchTerms.some((term) => term.includes(normalized) || normalized.includes(term));
  });
}

export function getClientById(clientId) {
  if (clientId === "mark-brent") {
    return getMarkBrentProfile();
  }
  if (clientId === "elias-brian") {
    return getEliasBrianProfile();
  }
  return null;
}

export function getMarkBrentProfile() {
  const displayName = "Mark Brent";

  const documentationTimeBlocks = [
    { id: "1-2", label: "1pm–2pm" },
    { id: "2-3", label: "2pm–3pm" },
    { id: "3-4", label: "3pm–4pm" },
    { id: "4-5", label: "4pm–5pm" },
    { id: "5-6", label: "5pm–6pm" },
    { id: "6-7", label: "6pm–7pm" },
  ];

  const timeBlockMappings = {
    "1pm–2pm": {
      prompt: `Document arrival routine, seizure precautions, and glucose check for ${displayName} during 1pm–2pm.`,
      source: "Shift Timeline / Arrival and Health Check",
      workflowId: "morning-adl",
    },
    "2pm–3pm": {
      prompt: `Document vocational skills practice, task sequencing, and staff coaching for ${displayName} during 2pm–3pm.`,
      source: "Shift Timeline / Vocational Skills Lab",
      workflowId: "in-home-leisure",
    },
    "3pm–4pm": {
      prompt: `Document sensory regulation, coping strategies, and observed response for ${displayName} during 3pm–4pm.`,
      source: "Shift Timeline / Sensory Regulation Block",
      workflowId: "in-home-leisure",
    },
    "4pm–5pm": {
      prompt: `Document community budgeting outing, transportation, and safety supports for ${displayName} during 4pm–5pm.`,
      source: "Shift Timeline / Community Budgeting Outing",
      workflowId: "community-outing",
    },
    "5pm–6pm": {
      prompt: `Document dinner support, carbohydrate consistency, and mealtime glucose monitoring for ${displayName} during 5pm–6pm.`,
      source: "Shift Timeline / Dinner and Diabetes Support",
      workflowId: "feeding-support",
    },
    "6pm–7pm": {
      prompt: `Document evening transition, medication review, and handoff details for ${displayName} during 6pm–7pm.`,
      source: "Shift Timeline / Evening Transition",
      workflowId: "return-home",
    },
  };

  const riskCards = [
    {
      title: "Seizure Activity",
      severity: "High",
      notes:
        "Mark Brent has a documented seizure disorder with prior emergency room visits after missed medication and poor sleep. Staff must monitor post-ictal confusion, pacing, and headache complaints.",
      guidance:
        "Follow the seizure action plan, time episodes, clear the area, avoid restraint unless safety requires it, and document triggers and recovery supports.",
    },
    {
      title: "Elopement / Unsafe Wandering",
      severity: "High",
      notes:
        "Mark Brent may leave supervised areas when overstimulated or when transitions are rushed. He responds best to visual countdowns and previewed schedule changes.",
      guidance:
        "Use line-of-sight supervision in community settings, confirm door alarms, and document redirection and return-to-program outcomes.",
    },
    {
      title: "Blood Sugar Instability",
      severity: "Medium",
      notes:
        "Type 2 diabetes requires consistent meal timing, carbohydrate counting, and glucose checks before community outings and after meals.",
      guidance:
        "Document glucose results, snacks provided, fluid intake, and observed symptoms such as shakiness, irritability, or fatigue.",
    },
    {
      title: "Sensory Overload",
      severity: "Medium",
      notes:
        "Crowded stores, loud break rooms, and unexpected schedule changes can lead to pacing, humming, or brief refusal.",
      guidance:
        "Offer noise-reduction supports, scheduled breaks, and a calm recovery space. Document what helped the individual re-engage.",
    },
    {
      title: "Medication Adherence",
      severity: "Low",
      notes:
        "Mark Brent sometimes forgets afternoon medication unless staff use a visual checklist and direct handoff at transition points.",
      guidance:
        "Document reminders given, whether medication was taken, and any reported side effects or refusals.",
    },
  ];

  const actionPlans = [
    {
      title: "Action Plan 1",
      outcome:
        "Mark Brent will maintain stable blood glucose through consistent meal timing, carbohydrate counting, and staff-supported monitoring.",
      issue:
        "Mark Brent has type 2 diabetes and needs structured meal support to avoid highs and lows during afternoon programming.",
      steps: [
        {
          step: "Mark Brent completes a pre-meal glucose check before lunch and dinner with staff documentation.",
          responsible: "Home: Mark Brent and RN\nOther: Mark Brent and DSP",
          frequency: "Daily",
          record: "Shift notes",
          notes: "Record result, snack or correction given, and observed response.",
        },
        {
          step: "Mark Brent follows the consistent-carbohydrate meal plan during dinner programming.",
          responsible: "Home: Mark Brent and RD\nOther: Mark Brent and DSP",
          frequency: "Daily",
          record: "Daily documentation",
          notes: "Document portions, fluids, and any refusal or nausea.",
        },
      ],
    },
    {
      title: "Action Plan 2",
      outcome: "Mark Brent will build vocational readiness through structured task practice and community budgeting routines.",
      issue:
        "Mark Brent needs repeated coaching to complete multi-step tasks independently and to use a budget in community settings.",
      steps: [
        {
          step: "Mark Brent completes a 3-step vocational task sequence with no more than one verbal prompt.",
          responsible: "Home: Mark Brent and Vocational Coach\nOther: Mark Brent and DSP",
          frequency: "3x weekly",
          record: "ISP data",
          notes: "Document task name, prompts used, and completion outcome.",
        },
        {
          step: "Mark Brent practices a community purchase using a prepared list and debit card with staff supervision.",
          responsible: "Home: Mark Brent and DSP\nOther: Mark Brent and CP",
          frequency: "Weekly",
          record: "Community outing notes",
          notes: "Document transportation, spending choices, and observed response.",
        },
      ],
    },
    {
      title: "Action Plan 3",
      outcome: "Mark Brent will use sensory regulation strategies before escalation during transitions.",
      issue:
        "Unexpected changes and noisy environments increase pacing, humming, and brief refusal behaviors.",
      steps: [
        {
          step: "Mark Brent identifies one calming strategy before community departure and uses it when prompted.",
          responsible: "Home: Mark Brent and BCBA\nOther: Mark Brent and DSP",
          frequency: "Daily",
          record: "Behavior data",
          notes: "Document strategy offered, whether it was effective, and recovery time.",
        },
      ],
    },
  ];

  const ispFormDescriptions = [
    `Measurable outcome: ${displayName} completes vocational task sequences with documented prompt level and observed response.`,
    `Target behavior: ${displayName} will use sensory regulation strategies during transitions with staff support rendered.`,
    `Community goal: ${displayName} participates in structured budgeting outings with documented safety supports and return-to-program transitions.`,
  ];

  const supplementalDocumentationItems = [
    `${displayName} completed glucose monitoring before the community outing.`,
    `${displayName} used a visual schedule during vocational skills practice.`,
    `${displayName} practiced a budgeting purchase with staff supervision and documented observed response.`,
  ];

  const previousShiftSnapshot = {
    timeBlocks: [
      {
        label: "2pm–3pm",
        score: "Verbal Prompt",
        comment: "Vocational sorting task completed with one verbal prompt and cooperative observed response.",
      },
      {
        label: "4pm–5pm",
        score: "Completed",
        comment: "Community budgeting outing completed with staff support rendered and safe return to program.",
      },
    ],
    rows: [
      {
        score: "Completed",
        comment: "Sensory break provided after noisy hallway transition. Recovery strategy was effective.",
      },
    ],
    shiftSummary:
      "Mood was generally calm. No seizure activity noted. Diabetes supports and vocational goals were addressed with stable participation.",
  };

  return {
    id: "mark-brent",
    displayName,
    carePlanHeader: {
      fullName: "MARK BRENT",
      medicaidId: "2C884219703",
      dob: "09/14/1998",
      oversightId: "0000021184 (DIDD-TN)",
      guardian: "Patricia Glenn",
      planStart: "03/01/2026",
      planEnd: "02/28/2027",
      status: "Approved",
    },
    aboutMeCards: [
      {
        title: "What people admire about me",
        body:
          "Mark Brent is curious, dependable, and quick to learn routines when they are shown step by step. He enjoys helping set up the vocational lab, organizing supply bins, and finishing a task list before community outings.",
      },
      {
        title: "What is important to me",
        body:
          "Mark Brent values predictable schedules, quiet breaks, earning community time, and choosing between two approved snack options. He likes music in headphones, short walks, and calling his sister on approved phone time.",
      },
      {
        title: "How best to support me",
        body:
          "Support Mark Brent with visual schedules, previewed transitions, glucose checks, seizure precautions, and calm coaching during sensory overload. Give choices between two options and document prompt level and observed response.",
      },
    ],
    riskCards,
    supportCards: [
      {
        title: "Supports at Home",
        body:
          "Mark Brent lives in a staffed group home in Murfreesboro, TN with two roommates. Supports include medication reminders, meal-plan supervision, laundry coaching, room organization, and bedtime routine structure.",
      },
      {
        title: "Supports in Community",
        body:
          "Community participation focuses on vocational practice, grocery budgeting, library visits, and short recreational walks. Staff provide transportation, elopement monitoring, and return-to-program transitions.",
      },
      {
        title: "Daily Living and Independence",
        body:
          "Mark Brent completes hygiene with verbal prompts, needs coaching for shaving and oral care, and benefits from step-by-step meal preparation guidance. He can sort clothing and make a simple snack with supervision.",
      },
      {
        title: "Communication Style",
        body:
          "Mark Brent uses short sentences, gestures, and a communication card when overwhelmed. He may pace or hum when anxious. Staff should lower stimulation, offer a break, and avoid rapid-fire questioning.",
      },
    ],
    serviceCards: [
      {
        title: "Day Services - Vocational Habilitation",
        provider: "Northline Day Services - Middle",
        funding: "CAC - Comprehensive Aggregate Cap",
        status: "Approved",
        dateRange: "03/01/2026 - 02/28/2027",
        detail: "Afternoon vocational programming with structured task practice and community budgeting outings.",
      },
      {
        title: "Supported Living Level 2",
        provider: "Harbor House Supports - Middle",
        funding: "CAC - Comprehensive Aggregate Cap",
        status: "Approved",
        dateRange: "03/01/2026 - 02/28/2027",
        detail: "Shared residential supports with medication reminders and diabetes meal supervision.",
      },
      {
        title: "Behavior Consultation",
        provider: "Bridge Behavior Group - Middle",
        funding: "CAC - Comprehensive Aggregate Cap",
        status: "Approved",
        dateRange: "03/01/2026 - 02/28/2027",
        detail: "Sensory regulation planning, transition supports, and elopement prevention strategies.",
      },
      {
        title: "Nursing Supports",
        provider: "Community Nurse Partners - Middle",
        funding: "CAC - Comprehensive Aggregate Cap",
        status: "Approved",
        dateRange: "03/01/2026 - 02/28/2027",
        detail: "Glucose monitoring oversight, seizure action plan review, and medication coordination.",
      },
    ],
    rightsCards: [
      {
        title: "Decision Making & Rights",
        body:
          "Mark Brent makes daily choices about clothing, snacks, and community activity order when options are presented clearly. Legal guardian approves major medical and financial decisions.",
      },
      {
        title: "Community Access",
        body:
          "Mark Brent has the right to participate in community activities with reasonable supports and documented safety planning for diabetes and seizure risks.",
      },
    ],
    activityCards: [
      {
        title: "Current community activities",
        body:
          "Mark Brent participates in grocery budgeting, library visits, short walking groups, and vocational supply shopping when the schedule is previewed in the morning.",
      },
      {
        title: "Supports needed for independence",
        body:
          "Staff provide visual schedules, noise-reduction headphones, glucose checks, transportation, and coaching for multi-step purchases and task completion.",
      },
    ],
    actionPlans,
    documentationTimeBlocks,
    timeBlockMappings,
    ispFormDescriptions,
    supplementalDocumentationItems,
    previousShiftSnapshot,
    shiftIntelligenceData: {
      overdue: ["Vocational data sheet (05/13/2026)", "Behavior plan signature", "Glucose log review"],
      activeRisks: riskCards.filter((risk) => risk.severity === "High").map((risk) => `${risk.title} (${risk.severity})`),
      appointments: ["Vocational coach check-in 2:15 PM", "Community budgeting outing 4:15 PM"],
      medicationsDue: ["Afternoon anticonvulsant 1:30 PM", "Bedtime medication review 6:45 PM"],
      alerts: ["Seizure precautions active", "Glucose check before outing", "Noise-reduction supports available"],
      incompleteGoals: actionPlans.map((plan) => plan.outcome),
    },
    documentChecklist: [
      "Seizure action plan on file",
      "Diabetes meal plan posted in kitchen",
      "Vocational task data sheet current",
      "Community outing authorization signed",
    ],
    documentFiles: [
      "Seizure Action Plan.pdf",
      "Diabetes Meal Plan.pdf",
      "Vocational Skills Inventory.pdf",
      "Behavior Support Summary.pdf",
    ],
    participants: [
      { name: "Mark Brent", relationship: "Individual", copy: "Yes" },
      { name: "Patricia Glenn", relationship: "Guardian", copy: "Yes" },
      { name: "Jordan Ellis", relationship: "Supported Living Manager", copy: "No" },
      { name: "Alicia Monroe", relationship: "Nurse", copy: "No" },
    ],
    signatureLogs: [
      "03/01/2026 Guardian acknowledgement on file",
      "03/04/2026 DSP orientation completed",
      "03/10/2026 Behavior plan review signed",
    ],
    carePlanTextPages: [
      {
        page: 1,
        text:
          "Mark Brent is a 27-year-old individual receiving afternoon day services and shared residential supports. His plan emphasizes vocational readiness, diabetes stability, seizure safety, and sensory regulation during community participation.",
      },
      {
        page: 2,
        text:
          "Clinical risks include seizure activity, elopement when overstimulated, blood sugar instability, and sensory overload during crowded community settings. Staff document glucose checks, redirection, and recovery strategies.",
      },
      {
        page: 3,
        text:
          "Programming runs on a six-hour afternoon schedule from 1pm to 7pm with arrival health checks, vocational practice, sensory regulation, community budgeting, dinner support, and evening transition.",
      },
    ],
    ispRows: [
      {
        name: "Vocational Readiness (Northline)",
        startDate: "03/01/2026",
        endDate: "02/28/2027",
        frequency: "Daily",
        schedule: "Afternoon",
        ispData: "Open",
      },
      {
        name: "Community Budgeting (Northline)",
        startDate: "03/01/2026",
        endDate: "02/28/2027",
        frequency: "Weekly",
        schedule: "Thursday",
        ispData: "Open",
      },
      {
        name: "Daily Documentation",
        startDate: "03/01/2026",
        endDate: "02/28/2027",
        frequency: "Daily",
        schedule: "1pm-7pm",
        ispData: "Open",
      },
    ],
    workspaceStatus: "Active Day Program",
  };
}

export function getEliasBrianProfile() {
  const displayName = "Elias Brian";

  const documentationTimeBlocks = [{ id: "10-11", label: "10am–11am" }];

  const timeBlockMappings = {
    "10am–11am": {
      prompt: `Document birthday outing support, fatigue monitoring, and return-home planning for ${displayName} during 10am–11am.`,
      source: "Shift Timeline / Birthday Community Outing",
      workflowId: "community-outing",
    },
  };

  const riskCards = [
    {
      title: "Fatigue During Community Activity",
      severity: "High",
      notes:
        "Elias Brian becomes visibly tired during longer outings and may need a seated break or early transition back home.",
      guidance:
        "Document rest breaks, reduced pacing, wheelchair use if offered, and the observed response after recovery support.",
    },
    {
      title: "Fall Risk During Transfers",
      severity: "Medium",
      notes:
        "Elias Brian needs close supervision during curb steps, van transfers, and uneven walking surfaces.",
      guidance:
        "Use line-of-sight support and document mobility assistance during all transitions.",
    },
  ];

  const actionPlans = [
    {
      title: "Action Plan 1",
      outcome:
        "Elias Brian will participate in community celebrations with fatigue-aware pacing, safe transitions, and clear handoff documentation.",
      issue:
        "Extended outings can lead to fatigue and reduced participation unless staff pace the event and support transitions.",
      steps: [
        {
          step: "Elias Brian receives rest-break prompting and pacing support during community activities longer than 30 minutes.",
          responsible: "Home: Elias Brian and DSP\nOther: Elias Brian and DSP",
          frequency: "As needed",
          record: "Case note",
          notes: "Document what recovery support was offered and whether participation improved afterward.",
        },
      ],
    },
  ];

  return {
    id: "elias-brian",
    displayName,
    carePlanHeader: {
      fullName: "ELIAS BRIAN",
      medicaidId: "5E117420882",
      dob: "08/05/1996",
      oversightId: "0000045219 (DIDD-TN)",
      guardian: "Monica Brian",
      planStart: "01/01/2026",
      planEnd: "12/31/2026",
      status: "Approved",
    },
    aboutMeCards: [
      {
        title: "What people admire about me",
        body:
          "Elias Brian is upbeat, social, and enjoys simple celebrations. He responds well to calm encouragement and likes being included in group activities.",
      },
      {
        title: "What is important to me",
        body:
          "Elias Brian enjoys birthday events, music, short community trips, and returning home before he becomes overly tired.",
      },
      {
        title: "How best to support me",
        body:
          "Support Elias Brian with safe mobility supervision, fatigue checks, offered rest breaks, and clear transition planning when community activity runs long.",
      },
    ],
    riskCards,
    supportCards: [
      {
        title: "Supports at Home",
        body:
          "Elias Brian lives in a staffed home and benefits from structured routines, mobility supervision, and calm verbal prompting when tired.",
      },
      {
        title: "Supports in Community",
        body:
          "Community support focuses on pacing, safe transfers, wheelchair availability when needed, and return-home transitions when fatigue increases.",
      },
    ],
    serviceCards: [
      {
        title: "Community Living Supports",
        provider: "Summit Support Services",
        funding: "CAC - Comprehensive Aggregate Cap",
        status: "Approved",
        dateRange: "01/01/2026 - 12/31/2026",
        detail: "Short-duration community outings with mobility supervision and transition support.",
      },
    ],
    rightsCards: [
      {
        title: "Decision Making & Rights",
        body:
          "Elias Brian chooses preferred outings and activities when options are presented simply, with guardian support for major medical decisions.",
      },
    ],
    activityCards: [
      {
        title: "Current community activities",
        body:
          "Birthday lunches, music outings, and short celebrations with fatigue-aware pacing and early return options.",
      },
    ],
    actionPlans,
    documentationTimeBlocks,
    timeBlockMappings,
    ispFormDescriptions: [
      `Measurable outcome: ${displayName} participates in a one-hour community activity with documented pacing support and observed response.`,
    ],
    supplementalDocumentationItems: [
      `${displayName} attended a birthday outing with staff support, fatigue monitoring, and safe transition planning.`,
    ],
    previousShiftSnapshot: {
      timeBlocks: [
        {
          label: "10am–11am",
          score: "Partial Assist",
          comment:
            "Birthday outing completed with mobility supervision, offered rest break, and calm return-home transition when fatigue increased.",
        },
      ],
      rows: [
        {
          score: "Completed",
          comment:
            "Community celebration note completed with observed response, pacing support, and transition details.",
        },
      ],
      shiftSummary:
        "Elias Brian enjoyed the activity, accepted pacing support, and returned home safely after fatigue was observed.",
    },
    shiftIntelligenceData: {
      overdue: ["Case note review signature"],
      activeRisks: riskCards.map((risk) => `${risk.title} (${risk.severity})`),
      appointments: ["Birthday lunch outing 10:15 AM"],
      medicationsDue: ["Midday medication reminder 11:15 AM"],
      alerts: ["Monitor for fatigue during outing", "Wheelchair available if rest support needed"],
      incompleteGoals: actionPlans.map((plan) => plan.outcome),
    },
    documentChecklist: ["Community outing plan on file", "Guardian birthday outing approval signed"],
    documentFiles: ["Community Outing Support Plan.pdf", "Celebration Approval.pdf"],
    participants: [
      { name: "Elias Brian", relationship: "Individual", copy: "Yes" },
      { name: "Monica Brian", relationship: "Guardian", copy: "Yes" },
    ],
    signatureLogs: ["01/02/2026 Guardian approval on file"],
    carePlanTextPages: [
      {
        page: 1,
        text:
          "Elias Brian participates best in short one-hour community activities with pacing support, safe mobility supervision, and early transition home when fatigue increases.",
      },
    ],
    ispRows: [
      {
        name: "Daily Documentation",
        startDate: "01/01/2026",
        endDate: "12/31/2026",
        frequency: "Daily",
        schedule: "10am-11am",
        ispData: "Open",
      },
    ],
    workspaceStatus: "One-Hour Demo Profile",
    caseNoteEntries: [
      {
        description: `Document the one-hour birthday outing, fatigue recovery support, and return-home transition for ${displayName}.`,
        workflowId: "community-outing",
        theme: "outing",
      },
    ],
  };
}

export function buildMeasurableDocumentationItems(clientProfile) {
  const displayName = clientProfile.displayName;
  const items = clientProfile.ispFormDescriptions.map((description, index) => ({
    id: `isp-form-${index}`,
    description,
    source: "ISP Data / Measurable Outcome",
    linkedFromCarePlan: true,
  }));

  clientProfile.riskCards.forEach((risk) => {
    items.push({
      id: `risk-${risk.title}`,
      description: `Risk-informed prompt (${risk.title}): ${risk.guidance}`,
      source: `Care Plan Risk / ${risk.severity}`,
      linkedFromCarePlan: true,
    });
  });

  clientProfile.actionPlans.forEach((plan) => {
    items.push({
      id: `${plan.title}-outcome`,
      description: `Desired outcome: ${plan.outcome}`,
      source: plan.title,
      linkedFromCarePlan: true,
    });
    plan.steps.forEach((step, index) => {
      items.push({
        id: `${plan.title}-step-${index}`,
        description: `Measurable step: ${step.step}`,
        source: plan.title,
        linkedFromCarePlan: true,
      });
    });
  });

  clientProfile.supplementalDocumentationItems.forEach((description, index) => {
    items.push({
      id: `supplement-${index}`,
      description: `Staff support rendered: ${description}`,
      source: "Shift Support",
      linkedFromCarePlan: true,
    });
  });

  return items;
}

export function buildCaseNoteDocumentationItems(clientProfile) {
  const displayName = clientProfile.displayName;
  const entries = clientProfile.caseNoteEntries || [
    {
      description: `Document target behavior, sensory regulation, and intervention implemented during the shift for ${displayName}.`,
      workflowId: "behavior-support",
      theme: "behavior",
    },
    {
      description: `Document vocational task support, prompt level, and observed response for ${displayName}.`,
      workflowId: "in-home-leisure",
      theme: "behavior",
    },
    {
      description: `Document glucose monitoring, meal support, and diabetes precautions for ${displayName}.`,
      workflowId: "feeding-support",
      theme: "meal",
    },
    {
      description: `Document seizure precautions, medication reminders, and observed response for ${displayName}.`,
      workflowId: "medication-support",
      theme: "medication",
    },
    {
      description: `Document community budgeting outing, transportation, and return-to-program transition for ${displayName}.`,
      workflowId: "community-outing",
      theme: "outing",
    },
    {
      description: `Document elopement prevention, redirection, and staff support rendered for ${displayName}.`,
      workflowId: "behavior-support",
      theme: "behavior",
    },
  ];

  return entries.map((entry, index) => ({
    id: `case-note-${index}`,
    description: entry.description,
    source: "Case Note",
    linkedFromCarePlan: true,
    workflowId: entry.workflowId,
    theme: entry.theme,
  }));
}
