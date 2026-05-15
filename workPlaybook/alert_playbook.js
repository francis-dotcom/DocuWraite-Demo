// server/alert_playbook.js

const ALERT_PLAYBOOK = {
  mobility: {
    title: "Mobility Support",
    subtypes: {
      fall_supervision: {
        severity: "high",
        microflow: [
          {
            id: "mobility_support_required",
            question: "Was mobility support required?",
            type: "single_select",
            options: [
              "Independent",
              "Verbal cueing",
              "Standby assist",
              "Physical assist",
              "Walker support",
              "Wheelchair support",
            ],
          },
          {
            id: "mobility_instability",
            question: "Any instability observed?",
            type: "single_select",
            options: [
              "None",
              "Mild unsteadiness",
              "Near fall",
              "Fall occurred",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: ["Near fall", "Fall occurred"],
            action: "trigger_fall_escalation",
          },
        ],
      },
    },
  },

  aspiration: {
    title: "Aspiration / Swallowing",
    subtypes: {
      choking_precautions: {
        severity: "high",
        microflow: [
          {
            id: "meal_supervision",
            question: "Was meal supervision provided?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "choking_observed",
            question: "Any coughing or choking observed?",
            type: "single_select",
            options: [
              "None observed",
              "Coughing observed",
              "Choking concern",
            ],
          },
          {
            id: "food_tolerance",
            question: "Did the client tolerate meal texture?",
            type: "single_select",
            options: [
              "Tolerated well",
              "Partially tolerated",
              "Did not tolerate",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: [
              "Choking concern",
              "Did not tolerate",
            ],
            action: "trigger_aspiration_escalation",
          },
        ],
      },
    },
  },

  behavior: {
    title: "Behavioral Support",
    subtypes: {
      verbal_redirection: {
        severity: "medium",
        microflow: [
          {
            id: "behavior_redirection",
            question: "Was redirection required?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "behavior_intervention",
            question: "What intervention was used?",
            type: "multi_select",
            options: [
              "Verbal cueing",
              "Reassurance",
              "Environmental change",
              "Break/rest",
              "Staff proximity",
            ],
          },
          {
            id: "behavior_response",
            question: "How did the client respond?",
            type: "single_select",
            options: [
              "Responsive",
              "Partially responsive",
              "Escalated",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: ["Escalated"],
            action: "trigger_behavior_escalation",
          },
        ],
      },
    },
  },

  medication: {
    title: "Medication",
    subtypes: {
      medication_supervision: {
        severity: "high",
        microflow: [
          {
            id: "medication_due",
            question: "Was medication due during this block?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "medication_administered",
            question: "Was medication administered?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "medication_compliance",
            question: "Did the client comply?",
            type: "single_select",
            options: [
              "Complied",
              "Refused",
              "Partial compliance",
            ],
          },
          {
            id: "medication_side_effects",
            question: "Any side effects observed?",
            type: "single_select",
            options: [
              "None",
              "Mild",
              "Significant",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: [
              "Refused",
              "Significant",
            ],
            action: "trigger_medication_escalation",
          },
        ],
      },
    },
  },

  hydration: {
    title: "Hydration Monitoring",
    subtypes: {
      hydration_monitoring: {
        severity: "medium",
        microflow: [
          {
            id: "hydration_encouraged",
            question: "Was hydration encouraged?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "hydration_intake",
            question: "Fluid intake status?",
            type: "single_select",
            options: [
              "Adequate",
              "Partial",
              "Refused",
            ],
          },
          {
            id: "dehydration_signs",
            question: "Any dehydration symptoms observed?",
            type: "single_select",
            options: [
              "No",
              "Possible symptoms",
              "Clear symptoms",
            ],
          },
        ],
      },
    },
  },

  dietary: {
    title: "Dietary Support",
    subtypes: {
      restricted_diet: {
        severity: "medium",
        microflow: [
          {
            id: "diet_followed",
            question: "Was prescribed diet followed?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "dietary_substitution",
            question: "Any substitutions made?",
            type: "single_select",
            options: ["No", "Approved substitution", "Unapproved substitution"],
          },
          {
            id: "diet_tolerance",
            question: "Any adverse dietary reactions?",
            type: "single_select",
            options: [
              "None",
              "Mild issue",
              "Significant issue",
            ],
          },
        ],
      },
    },
  },

  oxygen: {
    title: "Oxygen Monitoring",
    subtypes: {
      oxygen_support: {
        severity: "high",
        microflow: [
          {
            id: "oxygen_equipment",
            question: "Was oxygen equipment functioning properly?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "respiratory_distress",
            question: "Any respiratory distress observed?",
            type: "single_select",
            options: [
              "None",
              "Mild",
              "Severe",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: ["Severe"],
            action: "trigger_oxygen_escalation",
          },
        ],
      },
    },
  },

  communication: {
    title: "Communication Support",
    subtypes: {
      hearing_support: {
        severity: "medium",
        microflow: [
          {
            id: "communication_support",
            question: "Was communication assistance required?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "communication_barrier",
            question: "Any communication barriers observed?",
            type: "single_select",
            options: [
              "None",
              "Minor",
              "Significant",
            ],
          },
        ],
      },
    },
  },

  seizure: {
    title: "Seizure Monitoring",
    subtypes: {
      seizure_precautions: {
        severity: "critical",
        microflow: [
          {
            id: "seizure_activity",
            question: "Any seizure activity observed?",
            type: "single_select",
            options: ["No", "Possible", "Confirmed"],
          },
          {
            id: "seizure_duration",
            question: "Approximate seizure duration?",
            type: "single_select",
            options: [
              "<1 minute",
              "1-5 minutes",
              ">5 minutes",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: [
              "Confirmed",
              ">5 minutes",
            ],
            action: "trigger_seizure_emergency",
          },
        ],
      },
    },
  },

  elopement: {
    title: "Elopement / Wandering",
    subtypes: {
      wandering_risk: {
        severity: "high",
        microflow: [
          {
            id: "wandering_behavior",
            question: "Any wandering behavior observed?",
            type: "single_select",
            options: ["No", "Mild", "Significant"],
          },
          {
            id: "redirection_success",
            question: "Was redirection successful?",
            type: "single_select",
            options: ["Yes", "Partial", "No"],
          },
        ],
      },
    },
  },

  skin_integrity: {
    title: "Skin Integrity",
    subtypes: {
      skin_monitoring: {
        severity: "medium",
        microflow: [
          {
            id: "skin_check_completed",
            question: "Was skin check completed?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "skin_issue",
            question: "Any redness or open areas observed?",
            type: "single_select",
            options: [
              "None",
              "Minor",
              "Significant",
            ],
          },
        ],
      },
    },
  },

  diabetes: {
    title: "Diabetes Monitoring",
    subtypes: {
      glucose_monitoring: {
        severity: "high",
        microflow: [
          {
            id: "blood_sugar_checked",
            question: "Was blood sugar checked?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "blood_sugar_result",
            question: "Blood sugar status?",
            type: "single_select",
            options: [
              "Normal",
              "Low",
              "High",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: [
              "Low",
              "High",
            ],
            action: "trigger_diabetes_escalation",
          },
        ],
      },
    },
  },

  allergy: {
    title: "Allergy Monitoring",
    subtypes: {
      allergy_precautions: {
        severity: "high",
        microflow: [
          {
            id: "allergy_exposure",
            question: "Any allergy exposure risk observed?",
            type: "single_select",
            options: ["No", "Possible", "Confirmed"],
          },
          {
            id: "allergic_reaction",
            question: "Any allergic reaction observed?",
            type: "single_select",
            options: [
              "None",
              "Mild",
              "Severe",
            ],
          },
        ],
        escalationRules: [
          {
            whenAnswerIn: ["Severe"],
            action: "trigger_allergy_emergency",
          },
        ],
      },
    },
  },

  supervision: {
    title: "Supervision",
    subtypes: {
      line_of_sight: {
        severity: "high",
        microflow: [
          {
            id: "supervision_maintained",
            question: "Was required supervision maintained?",
            type: "single_select",
            options: ["Yes", "No"],
          },
          {
            id: "supervision_issue",
            question: "Any lapse in supervision?",
            type: "single_select",
            options: [
              "No",
              "Minor lapse",
              "Significant lapse",
            ],
          },
        ],
      },
    },
  },
};

module.exports = ALERT_PLAYBOOK;