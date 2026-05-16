Yes. That is exactly the right use for those fields.

You would assign a category module to a client’s playbook, and then the engine would run that module’s questions automatically based on the assignment rules.

Here is what each field means in plain English.

`id`
A unique name for the module.
Example:
`risk-fall`
This is how the system identifies that exact reusable package.

`category`
The top-level bucket.
Example:
`risk`
Other examples could be:
`compliance`, `hydration`, `behavior`, `medication`, `communication`

This is mostly for organizing your library.

`subcategory`
The specific package inside the category.
Example:
`fall-risk`
So:
- category = `risk`
- subcategory = `fall-risk`

That lets you build a library like:
- `risk / fall-risk`
- `risk / aspiration`
- `risk / seizure`
- `communication / hearing-support`

`maxDepthAvailable`
How deep this module is allowed to go in total.
Example:
`C`

Meaning the module supports:
- depth A
- depth B
- depth C

If a client is assigned only to depth `A`, the engine stops at A even if B and C exist.

`entryQuestions`
The first questions asked when this module is activated.
These are the “start here” questions.

Example for `fall-risk`:
- Was fall-prevention supervision maintained?
- Was mobility support needed this block?

These are the base questions for that subcategory.

`branchQuestions`
These are follow-up questions that appear only if the DSP’s answer triggers them.

Example:
If DSP says “No” to fall-prevention supervision:
- Was the lapse brief or ongoing?
- Was supervisor notified?
- Was the client redirected to a safer position?

So `entryQuestions` start the module.
`branchQuestions` deepen it.

`triggerConditions`
The rule for whether the module should run.

Examples:
- client has `fall risk`
- block is `morning-adl`
- active alert contains `fall`
- previous answer contains `refused`
- hydration answer was `No`

This is what makes the engine automatic instead of manual.

`required or conditional`
This decides whether the module must always run or only run when triggered.

`required`
If assigned to the playbook, it always runs.

Example:
A `hydration-monitoring` module for a client who must always have fluids tracked.

`conditional`
Only runs if the condition is met.

Example:
A `refusal-followup` module that runs only if a refusal happened.

`priority`
This controls ordering when many modules are assigned.

Example:
- `1` = ask first
- `2` = ask next
- `3` = ask later

Without priority, your drag-and-drop modules may run in random or messy order.

Typical idea:
- safety/risk first
- compliance next
- behavior/context next
- AI follow-up near the end
- readiness last

`dedupeThemes`
This prevents duplicate questions.

Example:
If your base playbook already asked about `mobility`, and your `fall-risk` module also covers `mobility`, you do not want to ask the same thing twice.

So a module might declare:
- `dedupeThemes: ["mobility", "supervision"]`

Then the engine checks:
“Was this theme already covered by the base playbook or another module?”
If yes, skip or compress the duplicate question.

Example of the full idea

Say you create this module:

- `id`: `risk-fall`
- `category`: `risk`
- `subcategory`: `fall-risk`
- `maxDepthAvailable`: `C`
- `entryQuestions`:
  - Was fall-prevention supervision maintained?
  - Was mobility support needed?
- `branchQuestions`:
  - If no supervision: ask escalation questions
  - If mobility issue: ask transfer/support details
- `triggerConditions`:
  - client has fall risk
  - workflow is `morning-adl` or `community-outing`
- `requiredOrConditional`: `required`
- `priority`: `1`
- `dedupeThemes`: `["mobility", "supervision"]`

Then for Mary Bet’s `morning-adl` playbook, you assign:
- `risk-fall` at depth `B`

The engine does:

1. Load base `morning-adl` playbook
2. See assigned module `risk-fall`
3. Check triggers
4. Since Mary Bet has fall risk and the workflow matches, activate it
5. Ask entry questions
6. Allow branches only up to depth `B`
7. Skip any question whose theme was already covered

That is the basic system.

The most important design rule is this:

A playbook should not store every question directly.
A playbook should store module assignments.

So instead of:
- “this playbook has these 40 questions”

you want:
- “this playbook uses these 6 modules at these depths”

That makes the system scalable.

A good mental model is:

- `playbook` = fixed workflow skeleton
- `module library` = reusable i-playbook categories
- `assignment` = which modules this client/block uses
- `engine` = decides what actually gets asked

If `npm run server` fails with `EADDRINUSE` on port 8787, another Node process is already listening. Example PID: `21189`.

Fix:

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill 21189
npm run server
```

Use the PID from `lsof` if it is not `21189`.
