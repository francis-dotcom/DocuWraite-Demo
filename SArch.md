# DocuWraite AI Documentation Architecture

```text
DocuWraite AI Documentation Architecture
│
├── AI Documentation Orchestrator
│   ├── Coordinates the full documentation workflow
│   ├── Connects logic, context, safety, classification, and note generation
│   ├── Manages AI conversation progression
│   └── Produces final structured note instructions
│
├── AI Prompt Builder
│   ├── Central prompt-construction engine
│   ├── Turns rules and context into prompts
│   ├── Dynamically builds AI instructions
│   ├── Resolves documentation logic
│   ├── Injects operational context
│   ├── Controls AI conversation flow
│   └── Sends final prompt state to note generation
│
├── Input Logic Layer
│   │
│   ├── AI Logic Resolver
│   │   ├── aiLogicResolver.js
│   │   ├── Reads workflow logic files
│   │   ├── Example:
│   │   │   └── ADL/bathing/bathing.logic.json
│   │   ├── Resolves conditional workflow logic
│   │   ├── Determines required questions
│   │   ├── Maps outcomes to prompt rules
│   │   ├── Activates conditional prompt paths
│   │   └── Determines next AI actions
│   │
│   └── Answer Flag Adapter
│       ├── answerFlagAdapter.js
│       ├── Detects risky responses
│       ├── Flags missing information
│       ├── Detects contradictions
│       ├── Detects incomplete documentation
│       ├── Routes validation warnings
│       ├── Triggers clarification requests
│       └── Sends validation flags to AI safety and classification
│
├── Context Injection Layer
│   │
│   ├── Care Plan Context Loader
│   │   ├── carePlanContextLoader.js
│   │   ├── Pulls client care plan data
│   │   ├── Injects risks
│   │   ├── Injects goals and outcomes
│   │   ├── Injects behavioral supports
│   │   ├── Injects dietary restrictions
│   │   ├── Injects mobility supports
│   │   └── Injects documentation constraints
│   │
│   ├── Shift Context Manager
│   │   ├── shiftContextManager.js
│   │   ├── Pulls shift timeline
│   │   ├── Tracks activities
│   │   ├── Tracks staff interventions
│   │   ├── Tracks behavioral events
│   │   ├── Tracks medication events
│   │   ├── Tracks environmental events
│   │   ├── Maintains note continuity
│   │   └── Maintains end-of-shift awareness
│   │
│   └── Display Context Adapter
│       ├── displayContextAdapter.js
│       ├── Formats UI display context
│       ├── Structures prompt visibility
│       ├── Prioritizes critical information
│       ├── Controls DSP guidance flow
│       └── Adapts context for mobile and desktop views
│
├── AI Conversation Layer
│   │
│   └── AI Question Session Manager
│       ├── aiQuestionSessionManager.js
│       ├── Generates follow-up questions
│       ├── Maintains conversational state
│       ├── Stores AI question answers
│       ├── Tracks missing documentation
│       ├── Detects ambiguity
│       ├── Maintains session memory
│       ├── Ensures documentation completeness
│       └── Feeds updated answers and context back into the prompt builder
│
├── Safety and Compliance Layer
│   │
│   └── AI Safety Context
│       ├── aiSafetyContext.js
│       ├── Injects AI safety rules
│       ├── Enforces documentation guardrails
│       ├── Prevents unsafe AI responses
│       ├── Prevents hallucinations
│       ├── Enforces compliance rules
│       ├── Checks sensitive language
│       ├── Validates final prompt safety
│       └── Receives validation flags from Answer Flag Adapter
│
├── Response Evaluation and Escalation Layer
│   │
│   └── Final Note Classification Builder
│       ├── finalNoteClassificationBuilder.js
│       ├── Evaluates DSP answers
│       ├── Detects documentation severity levels
│       ├── Applies response classification logic
│       ├── Determines AI follow-up behavior
│       ├── Controls prompt escalation paths
│       ├── Determines required documentation depth
│       ├── Routes documentation to the correct note structure
│       │
│       ├── Response Classification System
│       │   │
│       │   ├── Blue Response
│       │   │   ├── Normal response
│       │   │   ├── Continues workflow
│       │   │   ├── Requires minimal follow-up
│       │   │   ├── Uses standard documentation flow
│       │   │   └── Continues AI question session
│       │   │
│       │   ├── Yellow Response
│       │   │   ├── Yellow flag
│       │   │   ├── Requires additional questions
│       │   │   ├── Activates clarification logic
│       │   │   ├── Expands documentation requirements
│       │   │   ├── Triggers AI drill-down questions
│       │   │   ├── Requests more context
│       │   │   ├── May trigger staff follow-up
│       │   │   └── Increases narrative detail requirements
│       │   │
│       │   └── Red Response
│       │       ├── Red flag
│       │       ├── High-risk response
│       │       ├── Activates escalation workflow
│       │       ├── Triggers critical documentation rules
│       │       ├── Requires immediate follow-up questions
│       │       ├── Activates safety context rules
│       │       ├── Flags supervisor review
│       │       ├── Flags incident-level documentation
│       │       ├── Forces detailed narrative generation
│       │       └── May route to incident note templates
│       │
│       ├── AI Prompt Behavior Engine
│       │   ├── Evaluates selected DSP choices
│       │   ├── Detects selection severity
│       │   ├── Determines prompt continuation path
│       │   ├── Dynamically modifies AI questions
│       │   ├── Changes prompt tone based on severity
│       │   ├── Injects additional safety instructions
│       │   ├── Activates conditional follow-up chains
│       │   └── Adjusts final documentation structure
│       │
│       ├── Dynamic Prompt Routing
│       │   ├── Blue
│       │   │   └── Continues normal prompt flow
│       │   ├── Yellow
│       │   │   ├── Activates drill-down questions
│       │   │   ├── Gathers additional context
│       │   │   └── Expands documentation scope
│       │   └── Red
│       │       ├── Triggers escalation prompts
│       │       ├── Triggers safety validation
│       │       ├── Requires incident-level details
│       │       ├── Flags administrative review
│       │       └── Triggers supervisor notification logic
│       │
│       └── Final Output Control
│           ├── Determines final note type
│           ├── Determines documentation category
│           ├── Determines narrative complexity
│           ├── Applies note drafting rules
│           ├── Applies compliance rules
│           ├── Applies behavioral documentation rules
│           ├── Applies incident documentation structures
│           ├── Applies risk documentation standards
│           ├── Builds the final structured AI prompt
│           └── Generates final documentation context
│
├── Note Generation Layer
│   │
│   └── Note Type Templates
│       ├── Drafting rules
│       ├── Documentation structures
│       ├── Narrative templates
│       ├── Compliance formatting
│       ├── Shift note templates
│       ├── Incident note templates
│       ├── Behavior note templates
│       └── Goal tracking templates
│
├── End-to-End Flow
│   ├── AI Logic Resolver determines workflow requirements
│   ├── Care Plan Context Loader and Shift Context Manager inject operational context
│   ├── AI Prompt Builder creates the active prompt
│   ├── AI Question Session Manager runs the follow-up conversation
│   ├── Answer Flag Adapter validates answers as they arrive
│   ├── AI Safety Context applies guardrails and compliance checks
│   ├── Final Note Classification Builder classifies severity and routes escalation
│   ├── Dynamic Prompt Routing adjusts the prompt path
│   ├── Final Output Control selects structure and documentation depth
│   └── Note Type Templates produce the final note-ready drafting framework
│
└── Core Outcome
    ├── Safe AI-assisted DSP documentation
    ├── Context-aware question flow
    ├── Risk-based escalation handling
    ├── Compliance-aligned prompt generation
    └── Structured final note output
```
