const TASK_SCOPED_AI_LOGIC_CATALOG = {
  "communication-support": {
    category: "Communication",
    broadTask: "Communication Support",
    sourceQuestionId: "communication_task",
    tasks: [
      {
        task: "Prompting to Express Needs",
        pathKey: "prompting-to-express-needs",
        signals: ["express needs", "state needs", "ask for help", "report needs", "verbalize needs"],
        questionLabel: "What prompting to express needs support was provided?",
        detailOptions: [
          "Prompted to state needs",
          "Prompted to ask for help",
          "Prompted to report discomfort",
          "Prompted to make a request",
          "Prompted to choose between options",
          "Other",
        ],
        noteDirective:
          "Include the prompting to express needs support rendered, observed response, and any barriers or follow-up needs.",
      },
      {
        task: "Repetition or Clarification",
        pathKey: "repetition-or-clarification",
        signals: ["repetition", "clarification", "repeat instruction", "repeated explanation", "restated"],
        questionLabel: "What repetition or clarification support was provided?",
        detailOptions: [
          "Repeated instructions",
          "Clarified the request",
          "Restated information slowly",
          "Checked understanding",
          "Used simpler phrasing",
          "Other",
        ],
        noteDirective:
          "Include the repetition or clarification support rendered, observed response, and any barriers or follow-up needs.",
      },
      {
        task: "Hearing-support Cueing",
        pathKey: "hearing-support-cueing",
        signals: ["hearing aid", "hearing support", "hearing cue", "auditory cue", "hard of hearing"],
        questionLabel: "What hearing-support cueing was provided?",
        detailOptions: [
          "Prompted hearing-aid use",
          "Checked hearing-aid placement",
          "Used slower pacing",
          "Used louder or clearer verbal cueing",
          "Repeated information with hearing support",
          "Other",
        ],
        noteDirective:
          "Include the hearing-support cueing rendered, observed response, and any barriers or follow-up needs.",
      },
      {
        task: "Communication-device Support",
        pathKey: "communication-device-support",
        signals: ["communication device", "device support", "aac", "tablet communication", "assistive device"],
        questionLabel: "What communication-device support was provided?",
        detailOptions: [
          "Set up the communication device",
          "Prompted use of the device",
          "Troubleshot the device",
          "Supported message selection",
          "Used the device during interaction",
          "Other",
        ],
        noteDirective:
          "Include the communication-device support rendered, observed response, and any barriers or follow-up needs.",
      },
      {
        task: "Social Interaction Support",
        pathKey: "social-interaction-support",
        signals: ["social interaction", "conversation", "peer interaction", "greeting support", "social cue"],
        questionLabel: "What social interaction support was provided?",
        detailOptions: [
          "Prompted greetings or responses",
          "Modeled conversation",
          "Supported turn taking",
          "Encouraged social participation",
          "Redirected interaction respectfully",
          "Other",
        ],
        noteDirective:
          "Include the social interaction support rendered, observed response, and any barriers or follow-up needs.",
      },
    ],
  },
  "medication-support": {
    category: "Medication",
    broadTask: "Medication Support",
    sourceQuestionId: "medication_task",
    tasks: [
      {
        task: "Medication Reminder",
        pathKey: "medication-reminder",
        signals: ["medication reminder", "med reminder", "prompted medication time", "reminded to take medication"],
        questionLabel: "What medication reminder support was provided?",
        detailOptions: [
          "Provided scheduled medication reminder",
          "Prompted medication time awareness",
          "Repeated reminder after delay",
          "Observed acknowledgment of reminder",
          "Prompted medication retrieval",
          "Other",
        ],
        noteDirective:
          "Include the medication reminder support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Medication Observation",
        pathKey: "medication-observation",
        signals: ["medication observation", "observed medication", "watched medication", "med pass observation"],
        questionLabel: "What medication observation support was provided?",
        detailOptions: [
          "Observed medication self-administration",
          "Observed medication completion",
          "Observed after reminder",
          "Observed with follow-up prompting",
          "Observed medication routine compliance",
          "Other",
        ],
        noteDirective:
          "Include the medication observation support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Medication Refusal Follow-up",
        pathKey: "medication-refusal-follow-up",
        signals: ["medication refusal", "refused medication", "declined medication", "refusal follow up"],
        questionLabel: "What medication refusal follow-up support was provided?",
        detailOptions: [
          "Documented refusal and re-approached",
          "Provided calm redirection after refusal",
          "Offered follow-up reminder",
          "Observed refusal response",
          "Initiated refusal follow-up process",
          "Other",
        ],
        noteDirective:
          "Include the medication refusal follow-up rendered, observed response, and any required follow-up needs.",
      },
      {
        task: "PRN-related Support",
        pathKey: "prn-related-support",
        signals: ["prn", "as needed medication", "prn support", "prn follow up"],
        questionLabel: "What PRN-related support was provided?",
        detailOptions: [
          "Supported PRN request process",
          "Monitored after PRN use",
          "Observed PRN-related response",
          "Prompted reporting of symptoms",
          "Completed PRN follow-up checks",
          "Other",
        ],
        noteDirective:
          "Include the PRN-related support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Oxygen Support",
        pathKey: "oxygen-support",
        signals: ["oxygen", "o2", "oxygen check", "oxygen support", "oxygen monitoring"],
        questionLabel: "What oxygen support was provided?",
        detailOptions: [
          "Checked oxygen setup",
          "Observed oxygen use",
          "Monitored oxygen-related tolerance",
          "Prompted oxygen compliance",
          "Completed oxygen safety check",
          "Other",
        ],
        noteDirective:
          "Include the oxygen support rendered, observed response, and any safety or follow-up needs.",
      },
    ],
  },
  mobility: {
    category: "Mobility",
    broadTask: "Mobility Support",
    sourceQuestionId: "mobility_task",
    tasks: [
      {
        task: "Transfer Assistance",
        pathKey: "transfer-assistance",
        signals: ["transfer assistance", "transfer", "bed to chair", "chair to toilet", "stand pivot"],
        questionLabel: "What transfer assistance was provided?",
        detailOptions: [
          "Supported bed-to-chair transfer",
          "Supported chair-to-toilet transfer",
          "Used gait belt during transfer",
          "Provided stand-pivot assistance",
          "Provided transfer cueing",
          "Other",
        ],
        noteDirective:
          "Include the transfer assistance rendered, observed response, and any mobility or follow-up needs.",
      },
      {
        task: "Ambulation Support",
        pathKey: "ambulation-support",
        signals: ["ambulation", "walking support", "walked", "gait support", "walker"],
        questionLabel: "What ambulation support was provided?",
        detailOptions: [
          "Supported walking with supervision",
          "Supported walking with device",
          "Provided gait cueing",
          "Monitored pace and balance",
          "Provided repeated ambulation prompting",
          "Other",
        ],
        noteDirective:
          "Include the ambulation support rendered, observed response, and any mobility or follow-up needs.",
      },
      {
        task: "Wheelchair Support",
        pathKey: "wheelchair-support",
        signals: ["wheelchair", "wheel chair", "chair positioning", "wheelchair safety", "wheelchair transfer"],
        questionLabel: "What wheelchair support was provided?",
        detailOptions: [
          "Positioned wheelchair safely",
          "Assisted wheelchair mobility",
          "Completed wheelchair safety check",
          "Supported wheelchair transfer setup",
          "Adjusted wheelchair placement",
          "Other",
        ],
        noteDirective:
          "Include the wheelchair support rendered, observed response, and any mobility or follow-up needs.",
      },
      {
        task: "Positioning Support",
        pathKey: "positioning-support",
        signals: ["positioning", "reposition", "body position", "pressure relief", "chair positioning"],
        questionLabel: "What positioning support was provided?",
        detailOptions: [
          "Repositioned for comfort",
          "Repositioned for safety",
          "Supported pressure-relief positioning",
          "Provided cueing for posture",
          "Adjusted seated or lying position",
          "Other",
        ],
        noteDirective:
          "Include the positioning support rendered, observed response, and any mobility or follow-up needs.",
      },
      {
        task: "Fall-prevention Support",
        pathKey: "fall-prevention-support",
        signals: ["fall prevention", "fall risk", "near fall", "fall-prevention", "prevented fall"],
        questionLabel: "What fall-prevention support was provided?",
        detailOptions: [
          "Provided close fall-risk supervision",
          "Used fall-prevention cueing",
          "Maintained line-of-sight monitoring",
          "Adjusted environment for safety",
          "Responded to loss-of-balance risk",
          "Other",
        ],
        noteDirective:
          "Include the fall-prevention support rendered, observed response, and any mobility or follow-up needs.",
      },
    ],
  },
  "behavior-support": {
    category: "Behavior Support",
    broadTask: "Behavior Support",
    sourceQuestionId: "behavior_observed",
    tasks: [
      {
        task: "Needed Redirection",
        pathKey: "needed-redirection",
        signals: ["needed redirection", "redirected", "redirection", "redirectable"],
        questionLabel: "What behavior requiring redirection was observed?",
        detailOptions: [
          "Off-task behavior needing redirection",
          "Rule or routine reminder needed",
          "Mild disruptive behavior redirected",
          "Repeated redirection needed",
          "Redirected back to activity",
          "Other",
        ],
        noteDirective:
          "Include the behavior requiring redirection, staff response, observed outcome, and any follow-up needs.",
      },
      {
        task: "Refusal Behavior",
        pathKey: "refusal-behavior",
        signals: ["refusal behavior", "refused", "declined support", "resisted care", "refused initially"],
        questionLabel: "What refusal behavior was observed?",
        detailOptions: [
          "Refused task participation",
          "Refused staff direction",
          "Refused support initially",
          "Resisted care activity",
          "Stopped activity after prompting",
          "Other",
        ],
        noteDirective:
          "Include the refusal behavior, staff response, observed outcome, and any follow-up needs.",
      },
      {
        task: "Agitation or Escalation",
        pathKey: "agitation-or-escalation",
        signals: ["agitation", "escalation", "dysregulation", "upset", "escalated"],
        questionLabel: "What agitation or escalation was observed?",
        detailOptions: [
          "Verbal agitation observed",
          "Escalation during transition",
          "Heightened emotional response",
          "Required calming support",
          "Escalation with supervision needed",
          "Other",
        ],
        noteDirective:
          "Include the agitation or escalation observed, staff response, observed outcome, and any follow-up needs.",
      },
      {
        task: "Exit-seeking Behavior",
        pathKey: "exit-seeking-behavior",
        signals: ["exit-seeking", "elopement", "leave area", "door seeking", "wander toward exit"],
        questionLabel: "What exit-seeking behavior was observed?",
        detailOptions: [
          "Moved toward exit",
          "Attempted to leave supervised area",
          "Required elopement redirection",
          "Needed close door-area supervision",
          "Exit-seeking during transition",
          "Other",
        ],
        noteDirective:
          "Include the exit-seeking behavior observed, staff response, observed outcome, and any follow-up needs.",
      },
      {
        task: "Aggression",
        pathKey: "aggression",
        signals: ["aggression", "aggressive", "hit", "kicked", "threw", "swung"],
        questionLabel: "What aggression was observed?",
        detailOptions: [
          "Verbal aggression observed",
          "Physical aggression observed",
          "Threatening behavior observed",
          "Aggression toward property",
          "Aggression requiring incident response",
          "Other",
        ],
        noteDirective:
          "Include the aggression observed, staff response, observed outcome, and any follow-up needs.",
      },
    ],
  },
  "community-outing": {
    category: "Community Outing",
    broadTask: "Community Outing",
    sourceQuestionId: "outing_task",
    tasks: [
      {
        task: "Transportation Support",
        pathKey: "transportation-support",
        signals: ["transportation", "ride", "vehicle", "car transfer", "transport support"],
        questionLabel: "What transportation support was provided?",
        detailOptions: [
          "Assisted vehicle entry or exit",
          "Provided ride supervision",
          "Supported seatbelt compliance",
          "Provided transition cueing for transport",
          "Monitored transportation tolerance",
          "Other",
        ],
        noteDirective:
          "Include the transportation support rendered, observed response, and any supervision or follow-up needs.",
      },
      {
        task: "Shopping Support",
        pathKey: "shopping-support",
        signals: ["shopping", "store", "purchase", "mall", "grocery"],
        questionLabel: "What shopping support was provided?",
        detailOptions: [
          "Supported item selection",
          "Supported community purchasing",
          "Provided shopping supervision",
          "Prompted decision making during shopping",
          "Supported checkout participation",
          "Other",
        ],
        noteDirective:
          "Include the shopping support rendered, observed response, and any supervision or follow-up needs.",
      },
      {
        task: "Community Supervision",
        pathKey: "community-supervision",
        signals: ["community supervision", "close supervision", "public supervision", "community monitoring"],
        questionLabel: "What community supervision was provided?",
        detailOptions: [
          "Provided close public supervision",
          "Maintained line-of-sight in community",
          "Monitored safety during outing",
          "Redirected to remain with staff",
          "Supported safe movement through community setting",
          "Other",
        ],
        noteDirective:
          "Include the community supervision rendered, observed response, and any supervision or follow-up needs.",
      },
      {
        task: "Transition Support",
        pathKey: "transition-support",
        signals: ["transition support", "transition", "leaving home", "return home", "change of setting"],
        questionLabel: "What transition support was provided during the outing?",
        detailOptions: [
          "Prepared for departure",
          "Supported transition into outing",
          "Supported transition between community stops",
          "Supported return-home transition",
          "Provided repeated transition cueing",
          "Other",
        ],
        noteDirective:
          "Include the transition support rendered, observed response, and any supervision or follow-up needs.",
      },
      {
        task: "Social Participation Support",
        pathKey: "social-participation-support",
        signals: ["social participation", "peer interaction", "community participation", "social outing", "engagement in community"],
        questionLabel: "What social participation support was provided during the outing?",
        detailOptions: [
          "Encouraged community participation",
          "Prompted interaction with others",
          "Supported engagement in activity",
          "Modeled social behavior in community",
          "Re-engaged the person in outing activity",
          "Other",
        ],
        noteDirective:
          "Include the social participation support rendered, observed response, and any supervision or follow-up needs.",
      },
    ],
  },
  "night-adl": {
    category: "Sleep Support",
    broadTask: "Sleep Support",
    sourceQuestionId: "sleep_task",
    tasks: [
      {
        task: "Bedtime Routine Support",
        pathKey: "bedtime-routine-support",
        signals: ["bedtime routine", "bedtime support", "ready for bed", "night routine"],
        questionLabel: "What bedtime routine support was provided?",
        detailOptions: [
          "Prompted bedtime routine",
          "Supported bedtime preparation",
          "Provided routine cueing before bed",
          "Assisted settling into bed",
          "Supported completion of bedtime steps",
          "Other",
        ],
        noteDirective:
          "Include the bedtime routine support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Overnight Monitoring",
        pathKey: "overnight-monitoring",
        signals: ["overnight monitoring", "overnight check", "night check", "sleep check"],
        questionLabel: "What overnight monitoring was provided?",
        detailOptions: [
          "Completed scheduled overnight checks",
          "Maintained overnight supervision",
          "Monitored during sleep",
          "Responded during overnight check",
          "Completed safety monitoring overnight",
          "Other",
        ],
        noteDirective:
          "Include the overnight monitoring rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Nighttime Toileting Support",
        pathKey: "nighttime-toileting-support",
        signals: ["nighttime toileting", "overnight toileting", "toileting at night", "bedside commode"],
        questionLabel: "What nighttime toileting support was provided?",
        detailOptions: [
          "Assisted nighttime toileting",
          "Prompted toileting overnight",
          "Supported transfer for toileting at night",
          "Completed toileting check",
          "Supported return to bed after toileting",
          "Other",
        ],
        noteDirective:
          "Include the nighttime toileting support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Settling or Reassurance Support",
        pathKey: "settling-or-reassurance-support",
        signals: ["reassurance", "settling", "comforted", "calming at bedtime", "needed reassurance"],
        questionLabel: "What settling or reassurance support was provided?",
        detailOptions: [
          "Provided verbal reassurance",
          "Provided calming support",
          "Redirected back to rest",
          "Supported settling after waking",
          "Monitored response to reassurance",
          "Other",
        ],
        noteDirective:
          "Include the settling or reassurance support rendered, observed response, and any follow-up needs.",
      },
      {
        task: "Sleep-redirection Support",
        pathKey: "sleep-redirection-support",
        signals: ["sleep redirection", "redirected to bed", "redirected to sleep", "re-directed to rest"],
        questionLabel: "What sleep-redirection support was provided?",
        detailOptions: [
          "Redirected back to bed",
          "Redirected away from nighttime activity",
          "Provided repeated sleep cueing",
          "Supported return to routine after waking",
          "Monitored response to redirection",
          "Other",
        ],
        noteDirective:
          "Include the sleep-redirection support rendered, observed response, and any follow-up needs.",
      },
    ],
  },
  "in-home-leisure": {
    category: "Safety Monitoring",
    broadTask: "Safety Monitoring",
    sourceQuestionId: "monitoring_task",
    tasks: [
      {
        task: "Routine Safety Checks",
        pathKey: "routine-safety-checks",
        signals: ["routine safety check", "routine checks", "environmental check", "basic safety monitoring"],
        questionLabel: "What routine safety checks were completed?",
        detailOptions: [
          "Completed scheduled safety check",
          "Checked environment for hazards",
          "Verified safety setup",
          "Monitored routine compliance",
          "Documented routine safety observation",
          "Other",
        ],
        noteDirective:
          "Include the routine safety checks completed, observed response, and any follow-up needs.",
      },
      {
        task: "Fall-risk Monitoring",
        pathKey: "fall-risk-monitoring",
        signals: ["fall risk", "fall-risk monitoring", "near fall", "balance check", "fall concern"],
        questionLabel: "What fall-risk monitoring was completed?",
        detailOptions: [
          "Monitored balance and gait",
          "Maintained close fall-risk supervision",
          "Checked environment for fall hazards",
          "Responded to near-fall concern",
          "Documented fall-risk observation",
          "Other",
        ],
        noteDirective:
          "Include the fall-risk monitoring completed, observed response, and any follow-up needs.",
      },
      {
        task: "Aspiration Monitoring",
        pathKey: "aspiration-monitoring",
        signals: ["aspiration monitoring", "aspiration precaution", "swallow safety", "choking concern", "pocketing"],
        questionLabel: "What aspiration monitoring was completed?",
        detailOptions: [
          "Observed swallowing safety",
          "Monitored during eating or drinking",
          "Followed aspiration precautions",
          "Checked response to pacing or cueing",
          "Documented aspiration-related observation",
          "Other",
        ],
        noteDirective:
          "Include the aspiration monitoring completed, observed response, and any follow-up needs.",
      },
      {
        task: "Elopement-risk Monitoring",
        pathKey: "elopement-risk-monitoring",
        signals: ["elopement risk", "exit-seeking", "door monitoring", "wander risk", "elopement concern"],
        questionLabel: "What elopement-risk monitoring was completed?",
        detailOptions: [
          "Maintained door-area monitoring",
          "Observed for exit-seeking behavior",
          "Maintained line-of-sight supervision",
          "Redirected from exit area",
          "Documented elopement-risk observation",
          "Other",
        ],
        noteDirective:
          "Include the elopement-risk monitoring completed, observed response, and any follow-up needs.",
      },
      {
        task: "Line-of-sight Supervision",
        pathKey: "line-of-sight-supervision",
        signals: ["line of sight", "line-of-sight", "continuous supervision", "close visual supervision"],
        questionLabel: "What line-of-sight supervision was completed?",
        detailOptions: [
          "Maintained continuous visual supervision",
          "Stayed within line-of-sight during activity",
          "Provided close monitoring during movement",
          "Used line-of-sight to prevent unsafe behavior",
          "Documented supervision response",
          "Other",
        ],
        noteDirective:
          "Include the line-of-sight supervision completed, observed response, and any follow-up needs.",
      },
    ],
  },
};

module.exports = {
  TASK_SCOPED_AI_LOGIC_CATALOG,
};
