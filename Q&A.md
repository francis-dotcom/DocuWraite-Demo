# Q&A

## Q: where is the pdf care plan uploaded to

- `demoDocs/care-plan.pdf` for the demo source.

## Q: what does the extraction oo fwhat is needed to in the pdf

- The extraction pulls out only the care-plan facts needed for a specific workflow, like `#toileting`, from the PDF text.

## Q: pulls #toileting infomration and stores it where

- It stores the extracted `#toileting` information in `AILogic/clientContexts/BPhagan.toiletingContext.json`.

## Q: what does he do with he json AILogic/clientContexts/BPhagan.toiletingContext.json

- He uses that JSON as the ready-to-use care-plan context input for the toileting AI workflow.

## Q: which one does this i asked • He uses that JSON as the ready-to-use care-plan context input for the toileting AI workflow.

- `App.js` does that by loading and attaching the JSON as workflow care-plan context.

## Q: what does this code then do both

- `carePlanContextRegistry.json` defines all possible care-plan context fields the AI system knows about, like labels, descriptions, data types, and tags.
- `workflowContextRequirements.json` tells the system which of those fields are required or optional for a specific workflow, like `#toileting`.

## Q: is there a link between all 3 files

- Yes.
- `AILogic/ADLai/Toileting/toileting.logic.json` defines the `ADL -> Toileting` AI workflow.
- `AILogic/workflowContextRequirements.json` says which care-plan context keys that workflow needs for `#toileting`.
- `AILogic/carePlanContextRegistry.json` defines what each of those keys means.
- So the link is: `toileting.logic.json -> workflowContextRequirements.json -> carePlanContextRegistry.json`
