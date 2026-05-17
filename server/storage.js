const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const decisionNodes = require("../decisionAlgo/nodes.json");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "docuwraite.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.exec("PRAGMA foreign_keys = ON");

function tableExists(tableName) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName)
  );
}

function tableHasColumn(tableName, columnName) {
  if (!tableExists(tableName)) {
    return false;
  }

  return db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
}

if (tableExists("decision_assignments") && !tableHasColumn("decision_assignments", "id")) {
  db.exec("ALTER TABLE decision_assignments RENAME TO decision_assignments_legacy");
}

if (tableExists("decision_assignments_legacy")) {
  db.exec(`
    DROP TABLE IF EXISTS decision_assignment_nodes;
    DROP TABLE IF EXISTS decision_include_final_flags;
    DROP TABLE IF EXISTS decision_audit_log;
  `);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS decision_libraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    version TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS decision_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (library_id, key),
    FOREIGN KEY (library_id) REFERENCES decision_libraries(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS decision_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    section_id INTEGER,
    node_key TEXT NOT NULL,
    title TEXT,
    question TEXT,
    step_key TEXT,
    kind TEXT,
    depth INTEGER,
    source_file TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (library_id, node_key),
    FOREIGN KEY (library_id) REFERENCES decision_libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES decision_sections(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_node_choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    choice_key TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (node_id, choice_key),
    FOREIGN KEY (node_id) REFERENCES decision_nodes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS decision_node_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,
    condition_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES decision_nodes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS decision_workspace_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL UNIQUE,
    selected_library_id INTEGER,
    selected_depth INTEGER,
    include_mode TEXT,
    selected_target_type TEXT,
    selected_target_id TEXT,
    documentation_session_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (selected_library_id) REFERENCES decision_libraries(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_time_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_state_id INTEGER NOT NULL,
    block_key TEXT NOT NULL,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_state_id, block_key),
    FOREIGN KEY (workspace_state_id) REFERENCES decision_workspace_states(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS decision_case_note_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_state_id INTEGER NOT NULL,
    row_key TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT,
    workflow_id TEXT,
    theme TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_state_id, row_key),
    FOREIGN KEY (workspace_state_id) REFERENCES decision_workspace_states(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS decision_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_state_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    library_id INTEGER,
    selected_depth INTEGER,
    include_mode TEXT,
    assigned_node_summary TEXT,
    assigned_json TEXT,
    assigned_node_config_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_state_id, target_type, target_id),
    FOREIGN KEY (workspace_state_id) REFERENCES decision_workspace_states(id) ON DELETE CASCADE,
    FOREIGN KEY (library_id) REFERENCES decision_libraries(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_assignment_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    node_id INTEGER,
    node_key TEXT,
    include_in_final INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES decision_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES decision_nodes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_selection_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_state_id INTEGER NOT NULL,
    library_id INTEGER,
    name TEXT,
    selected_depth INTEGER,
    include_mode TEXT,
    target_type TEXT,
    target_id TEXT,
    selected_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_state_id) REFERENCES decision_workspace_states(id) ON DELETE CASCADE,
    FOREIGN KEY (library_id) REFERENCES decision_libraries(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_selection_set_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    selection_set_id INTEGER NOT NULL,
    node_id INTEGER,
    node_key TEXT NOT NULL,
    include_in_final INTEGER NOT NULL DEFAULT 0,
    is_checked INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (selection_set_id, node_key),
    FOREIGN KEY (selection_set_id) REFERENCES decision_selection_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES decision_nodes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_include_final_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    node_id INTEGER,
    node_key TEXT NOT NULL,
    include_in_final INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id, node_key),
    FOREIGN KEY (assignment_id) REFERENCES decision_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES decision_nodes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_ui_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL UNIQUE,
    collapsed_sections_json TEXT,
    last_selected_library_id INTEGER,
    last_target_type TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (last_selected_library_id) REFERENCES decision_libraries(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS decision_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    workspace_state_id INTEGER,
    assignment_id INTEGER,
    event_type TEXT NOT NULL,
    event_payload_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_state_id) REFERENCES decision_workspace_states(id) ON DELETE SET NULL,
    FOREIGN KEY (assignment_id) REFERENCES decision_assignments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS row_prompt_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS row_prompt_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    prompt_key TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, prompt_key),
    FOREIGN KEY (category_id) REFERENCES row_prompt_categories(id) ON DELETE CASCADE
  );
`);

if (!tableHasColumn("decision_workspace_states", "staged_assignments_json")) {
  db.exec("ALTER TABLE decision_workspace_states ADD COLUMN staged_assignments_json TEXT");
}

const upsertLibraryStatement = db.prepare(`
  INSERT INTO decision_libraries (slug, name, version, is_active, updated_at)
  VALUES (?, ?, ?, 1, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    version = excluded.version,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
  RETURNING id
`);

const getLibraryBySlugStatement = db.prepare(`
  SELECT id, slug, name
  FROM decision_libraries
  WHERE slug = ?
`);

const upsertSectionStatement = db.prepare(`
  INSERT INTO decision_sections (library_id, key, title, sort_order, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(library_id, key) DO UPDATE SET
    title = excluded.title,
    sort_order = excluded.sort_order,
    updated_at = excluded.updated_at
  RETURNING id
`);

const upsertNodeStatement = db.prepare(`
  INSERT INTO decision_nodes (
    library_id,
    section_id,
    node_key,
    title,
    question,
    step_key,
    kind,
    depth,
    source_file,
    sort_order,
    is_active,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  ON CONFLICT(library_id, node_key) DO UPDATE SET
    section_id = excluded.section_id,
    title = excluded.title,
    question = excluded.question,
    step_key = excluded.step_key,
    kind = excluded.kind,
    depth = excluded.depth,
    source_file = excluded.source_file,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
  RETURNING id
`);

const deleteNodeChoicesStatement = db.prepare(`
  DELETE FROM decision_node_choices
  WHERE node_id = ?
`);

const insertNodeChoiceStatement = db.prepare(`
  INSERT INTO decision_node_choices (node_id, choice_key, label, value, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const deleteNodeConditionsStatement = db.prepare(`
  DELETE FROM decision_node_conditions
  WHERE node_id = ?
`);

const insertNodeConditionStatement = db.prepare(`
  INSERT INTO decision_node_conditions (node_id, condition_text, sort_order)
  VALUES (?, ?, ?)
`);

const getNodeByLibraryAndKeyStatement = db.prepare(`
  SELECT id
  FROM decision_nodes
  WHERE library_id = ? AND node_key = ?
`);

const getWorkspaceStateRowStatement = db.prepare(`
  SELECT
    ws.id,
    ws.client_id,
    ws.selected_library_id,
    dl.slug AS selected_library_slug,
    ws.selected_depth,
    ws.include_mode,
    ws.selected_target_type,
    ws.selected_target_id,
    ws.documentation_session_json,
    ws.staged_assignments_json,
    ws.created_at,
    ws.updated_at
  FROM decision_workspace_states ws
  LEFT JOIN decision_libraries dl ON dl.id = ws.selected_library_id
  WHERE ws.client_id = ?
`);

const upsertWorkspaceStateStatement = db.prepare(`
  INSERT INTO decision_workspace_states (
    client_id,
    selected_library_id,
    selected_depth,
    include_mode,
    selected_target_type,
    selected_target_id,
    documentation_session_json,
    staged_assignments_json,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(client_id) DO UPDATE SET
    selected_library_id = excluded.selected_library_id,
    selected_depth = excluded.selected_depth,
    include_mode = excluded.include_mode,
    selected_target_type = excluded.selected_target_type,
    selected_target_id = excluded.selected_target_id,
    documentation_session_json = excluded.documentation_session_json,
    staged_assignments_json = excluded.staged_assignments_json,
    updated_at = excluded.updated_at
  RETURNING id
`);

const deleteTimeBlocksByWorkspaceStatement = db.prepare(`
  DELETE FROM decision_time_blocks
  WHERE workspace_state_id = ?
`);

const insertTimeBlockStatement = db.prepare(`
  INSERT INTO decision_time_blocks (
    workspace_state_id,
    block_key,
    label,
    sort_order,
    updated_at
  ) VALUES (?, ?, ?, ?, ?)
`);

const getTimeBlocksByWorkspaceStatement = db.prepare(`
  SELECT block_key, label
  FROM decision_time_blocks
  WHERE workspace_state_id = ?
  ORDER BY sort_order, id
`);

const deleteRowsByWorkspaceStatement = db.prepare(`
  DELETE FROM decision_case_note_rows
  WHERE workspace_state_id = ?
`);

const insertRowStatement = db.prepare(`
  INSERT INTO decision_case_note_rows (
    workspace_state_id,
    row_key,
    description,
    source,
    workflow_id,
    theme,
    sort_order,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const getRowsByWorkspaceStatement = db.prepare(`
  SELECT row_key, description, source, workflow_id, theme
  FROM decision_case_note_rows
  WHERE workspace_state_id = ?
  ORDER BY sort_order, id
`);

const getAssignmentRowStatement = db.prepare(`
  SELECT id
  FROM decision_assignments
  WHERE workspace_state_id = ? AND target_type = ? AND target_id = ?
`);

const upsertAssignmentStatement = db.prepare(`
  INSERT INTO decision_assignments (
    workspace_state_id,
    target_type,
    target_id,
    library_id,
    selected_depth,
    include_mode,
    assigned_node_summary,
    assigned_json,
    assigned_node_config_json,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(workspace_state_id, target_type, target_id) DO UPDATE SET
    library_id = excluded.library_id,
    selected_depth = excluded.selected_depth,
    include_mode = excluded.include_mode,
    assigned_node_summary = excluded.assigned_node_summary,
    assigned_json = excluded.assigned_json,
    assigned_node_config_json = excluded.assigned_node_config_json,
    updated_at = excluded.updated_at
  RETURNING id
`);

const deleteAssignmentNodesStatement = db.prepare(`
  DELETE FROM decision_assignment_nodes
  WHERE assignment_id = ?
`);

const insertAssignmentNodeStatement = db.prepare(`
  INSERT INTO decision_assignment_nodes (
    assignment_id,
    node_id,
    node_key,
    include_in_final,
    sort_order
  ) VALUES (?, ?, ?, ?, ?)
`);

const deleteIncludeFinalFlagsStatement = db.prepare(`
  DELETE FROM decision_include_final_flags
  WHERE assignment_id = ?
`);

const insertIncludeFinalFlagStatement = db.prepare(`
  INSERT INTO decision_include_final_flags (
    assignment_id,
    node_id,
    node_key,
    include_in_final,
    updated_at
  ) VALUES (?, ?, ?, ?, ?)
`);

const deleteSelectionSetsByWorkspaceStatement = db.prepare(`
  DELETE FROM decision_selection_sets
  WHERE workspace_state_id = ?
`);

const insertSelectionSetStatement = db.prepare(`
  INSERT INTO decision_selection_sets (
    workspace_state_id,
    library_id,
    name,
    selected_depth,
    include_mode,
    target_type,
    target_id,
    selected_count,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getLatestSelectionSetByWorkspaceStatement = db.prepare(`
  SELECT id, selected_depth, include_mode, target_type, target_id
  FROM decision_selection_sets
  WHERE workspace_state_id = ?
  ORDER BY updated_at DESC, id DESC
  LIMIT 1
`);

const deleteSelectionSetNodesBySelectionSetStatement = db.prepare(`
  DELETE FROM decision_selection_set_nodes
  WHERE selection_set_id = ?
`);

const insertSelectionSetNodeStatement = db.prepare(`
  INSERT INTO decision_selection_set_nodes (
    selection_set_id,
    node_id,
    node_key,
    include_in_final,
    is_checked,
    sort_order,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getSelectionSetNodesBySelectionSetStatement = db.prepare(`
  SELECT node_key, include_in_final, is_checked
  FROM decision_selection_set_nodes
  WHERE selection_set_id = ?
  ORDER BY sort_order, id
`);

const upsertUiPreferencesStatement = db.prepare(`
  INSERT INTO decision_ui_preferences (
    client_id,
    collapsed_sections_json,
    last_selected_library_id,
    last_target_type,
    updated_at
  ) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(client_id) DO UPDATE SET
    collapsed_sections_json = excluded.collapsed_sections_json,
    last_selected_library_id = excluded.last_selected_library_id,
    last_target_type = excluded.last_target_type,
    updated_at = excluded.updated_at
`);

const getUiPreferencesByClientStatement = db.prepare(`
  SELECT
    collapsed_sections_json,
    dl.slug AS last_selected_library,
    last_target_type
  FROM decision_ui_preferences dip
  LEFT JOIN decision_libraries dl ON dl.id = dip.last_selected_library_id
  WHERE dip.client_id = ?
`);

const insertAuditLogStatement = db.prepare(`
  INSERT INTO decision_audit_log (
    client_id,
    workspace_state_id,
    assignment_id,
    event_type,
    event_payload_json
  ) VALUES (?, ?, ?, ?, ?)
`);

const getAssignmentsByClientStatement = db.prepare(`
  SELECT
    da.id,
    ws.client_id,
    da.target_type,
    da.target_id,
    dl.slug AS library_slug,
    da.selected_depth,
    da.include_mode,
    da.assigned_node_summary,
    da.assigned_json,
    da.assigned_node_config_json,
    da.updated_at
  FROM decision_assignments da
  INNER JOIN decision_workspace_states ws ON ws.id = da.workspace_state_id
  LEFT JOIN decision_libraries dl ON dl.id = da.library_id
  WHERE ws.client_id = ?
  ORDER BY da.target_type, da.target_id
`);

const upsertRowPromptCategoryStatement = db.prepare(`
  INSERT INTO row_prompt_categories (key, label, sort_order, is_active, updated_at)
  VALUES (?, ?, ?, 1, ?)
  ON CONFLICT(key) DO UPDATE SET
    label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
  RETURNING id
`);

const getRowPromptCategoryByKeyStatement = db.prepare(`
  SELECT id, key, label, sort_order
  FROM row_prompt_categories
  WHERE key = ? AND is_active = 1
`);

const getAllRowPromptCategoriesStatement = db.prepare(`
  SELECT id, key, label, sort_order
  FROM row_prompt_categories
  WHERE is_active = 1
  ORDER BY sort_order, id
`);

const upsertRowPromptTemplateStatement = db.prepare(`
  INSERT INTO row_prompt_templates (
    category_id,
    prompt_key,
    prompt_text,
    sort_order,
    is_active,
    updated_at
  ) VALUES (?, ?, ?, ?, 1, ?)
  ON CONFLICT(category_id, prompt_key) DO UPDATE SET
    prompt_text = excluded.prompt_text,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
`);

const getRowPromptTemplatesByCategoryStatement = db.prepare(`
  SELECT rpt.id, rpt.prompt_key, rpt.prompt_text, rpc.key AS category_key, rpc.label AS category_label
  FROM row_prompt_templates rpt
  INNER JOIN row_prompt_categories rpc ON rpc.id = rpt.category_id
  WHERE rpc.key = ? AND rpt.is_active = 1 AND rpc.is_active = 1
  ORDER BY rpt.sort_order, rpt.id
`);

function parseJson(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function serializeCollapsedSectionsFromRows(rows = []) {
  const sectionMap = {};
  rows.forEach((row) => {
    if (row?.section) {
      sectionMap[row.section] = true;
    }
  });
  return JSON.stringify(sectionMap);
}

function runInTransaction(callback) {
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function getLibraryIdBySlug(slug) {
  if (!slug) {
    return null;
  }
  return getLibraryBySlugStatement.get(slug)?.id || null;
}

function seedDecisionCatalog() {
  const libraries = Array.isArray(decisionNodes?.libraries) ? decisionNodes.libraries : [];
  const now = new Date().toISOString();

  runInTransaction(() => {
    libraries.forEach((library, libraryIndex) => {
      const librarySlug = library.library || `library-${libraryIndex + 1}`;
      const libraryId = upsertLibraryStatement.get(
        librarySlug,
        librarySlug,
        "1",
        now
      ).id;

      const sectionIds = new Map();
      const encounteredSections = [];

      (library.nodes || []).forEach((node, nodeIndex) => {
        const sectionTitle = node.section || "Uncategorized";
        if (!sectionIds.has(sectionTitle)) {
          encounteredSections.push(sectionTitle);
          const sectionId = upsertSectionStatement.get(
            libraryId,
            sectionTitle,
            sectionTitle,
            encounteredSections.length - 1,
            now
          ).id;
          sectionIds.set(sectionTitle, sectionId);
        }

        const nodeKey = node.id || node.stepKey || `node-${nodeIndex + 1}`;
        const nodeId = upsertNodeStatement.get(
          libraryId,
          sectionIds.get(sectionTitle),
          nodeKey,
          node.title || null,
          node.question || null,
          node.stepKey || null,
          node.kind || null,
          Number.isFinite(node.depth) ? node.depth : null,
          node.source || null,
          nodeIndex,
          now
        ).id;

        deleteNodeChoicesStatement.run(nodeId);
        (node.choices || []).forEach((choice, choiceIndex) => {
          const label = typeof choice === "string" ? choice : choice?.label || choice?.value || `Choice ${choiceIndex + 1}`;
          const value = typeof choice === "string" ? choice : choice?.value || choice?.label || label;
          const choiceKey = typeof choice === "string"
            ? `choice-${choiceIndex + 1}`
            : choice?.key || `choice-${choiceIndex + 1}`;
          insertNodeChoiceStatement.run(nodeId, choiceKey, label, String(value), choiceIndex);
        });

        deleteNodeConditionsStatement.run(nodeId);
        (node.conditions || []).forEach((condition, conditionIndex) => {
          insertNodeConditionStatement.run(nodeId, String(condition), conditionIndex);
        });
      });
    });
  });
}

function seedRowPromptCatalog() {
  const now = new Date().toISOString();
  const categories = [
    { key: "behavior", label: "Behavior" },
    { key: "adl", label: "ADL" },
    { key: "meal", label: "Meal" },
    { key: "communication", label: "Communication" },
    { key: "community", label: "Community" },
    { key: "medication", label: "Medication" },
  ];

  const behaviorTemplates = [
    "Document the behavior observed, what happened before it, staff response, and the person's outcome.",
    "Document verbal escalation, redirection used, and whether the person returned to baseline.",
    "Document physical aggression or threatening behavior, safety intervention used, and follow-up action.",
    "Document self-injurious behavior, staff protection steps, and observed recovery.",
    "Document property destruction, environmental trigger, staff intervention, and resolution.",
    "Document elopement risk or exit-seeking behavior, supervision response, and current status.",
    "Document inappropriate social behavior, teaching or redirection provided, and response.",
    "Document refusal behavior, staff prompting sequence, and final outcome.",
    "Document agitation during transition, calming support provided, and whether the person re-engaged.",
    "Document repeated behavioral pattern, suspected trigger, and support strategy used.",
  ];

  const adlTemplates = [
    "Document toileting support provided, prompt level required, and observed response.",
    "Document showering or bathing support, safety assistance used, and how the person tolerated the task.",
    "Document dressing support, balance assistance provided, and level of independence observed.",
    "Document grooming or hygiene support, verbal or physical prompts used, and completion status.",
    "Document oral care support provided and the person's participation or tolerance.",
    "Document incontinence care completed, skin concerns observed, and follow-up action taken.",
    "Document transfer or ambulation support during ADLs and any fall-prevention measures used.",
    "Document bedtime or wake-up ADL routine, cues provided, and response.",
    "Document laundry or household chore participation, support level, and observed outcome.",
    "Document refusal or difficulty with ADL task, staff intervention, and final status.",
  ];

  const mealTemplates = [
    "Document meal support provided, intake observed, and the person's response during the meal.",
    "Document diet-plan compliance, prompts given, and whether the meal was completed safely.",
    "Document feeding assistance level, adaptive support used, and tolerance of the meal.",
    "Document food refusal, encouragement provided, and final intake outcome.",
    "Document hydration support, fluids offered, and amount accepted if known.",
    "Document choking precaution or swallowing support used during meal service.",
    "Document meal-related behavior, redirection used, and outcome.",
    "Document community meal support, staff assistance provided, and diet adherence observed.",
    "Document snack or supplemental nutrition support and the person's participation.",
    "Document nausea, poor appetite, or other meal concern and who was notified.",
  ];

  const communicationTemplates = [
    "Document communication support provided, prompts used, and how the person expressed needs or choices.",
    "Document use of visual supports, gestures, or adaptive communication tools during the interaction.",
    "Document staff interpretation or clarification support needed for the person's communication.",
    "Document difficulty understanding directions, teaching strategy used, and response.",
    "Document successful choice-making support and the communication method used.",
    "Document refusal or shutdown in communication, staff approach, and outcome.",
    "Document social conversation support and how the person engaged with others.",
    "Document communication during medical or community interaction and support provided.",
    "Document misunderstanding or conflict related to communication and how it was resolved.",
    "Document expressive or receptive communication change observed during the shift.",
  ];

  const communityTemplates = [
    "Document community outing support provided, participation level, and the person's response.",
    "Document transportation support, safety supervision, and transition into or out of the community setting.",
    "Document shopping or purchase support, prompts provided, and outcome.",
    "Document social engagement in the community and how the person interacted with others.",
    "Document fatigue, overstimulation, or request to return home during outing and staff response.",
    "Document mobility support used in the community, including wheelchair or gait assistance.",
    "Document community choice-making support and activity selected by the person.",
    "Document behavioral concern in the community, redirection provided, and resolution.",
    "Document dining-out support, diet adherence, and staff assistance given.",
    "Document community safety issue or risk observed and the follow-up action taken.",
  ];

  const medicationTemplates = [
    "Document that all medications were administered as ordered and note the person's response.",
    "Document any refused medication, staff response, and follow-up action.",
    "Document PRN medication use, symptom observed, reason given, and outcome after administration.",
    "Document medication pass completion, including prompts provided and level of assistance required.",
    "Document observed side effects or adverse reactions after medication administration.",
    "Document that medication count, packaging, or supply issue was identified and escalated.",
    "Document missed or delayed medication, reason, supervisor notification, and corrective action.",
    "Document glucose check related to medication support and the action taken.",
    "Document oxygen, nebulizer, or other health-support treatment provided alongside medication support.",
    "Document staff cueing needed for the person to take medication safely.",
    "Document swallowing difficulty, choking risk, or adaptive support used during medication administration.",
    "Document medication education or reassurance provided to reduce refusal or anxiety.",
    "Document physician or nurse instruction received related to medication administration.",
    "Document medication observation during community outing or off-site administration.",
    "Document handoff note for medication issue that the next shift must monitor.",
  ];

  runInTransaction(() => {
    const categoryIds = new Map();

    categories.forEach((category, index) => {
      const categoryId = upsertRowPromptCategoryStatement.get(
        category.key,
        category.label,
        index,
        now
      ).id;
      categoryIds.set(category.key, categoryId);
    });

    behaviorTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("behavior"),
        `behavior-${index + 1}`,
        promptText,
        index,
        now
      );
    });

    adlTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("adl"),
        `adl-${index + 1}`,
        promptText,
        index,
        now
      );
    });

    mealTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("meal"),
        `meal-${index + 1}`,
        promptText,
        index,
        now
      );
    });

    communicationTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("communication"),
        `communication-${index + 1}`,
        promptText,
        index,
        now
      );
    });

    communityTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("community"),
        `community-${index + 1}`,
        promptText,
        index,
        now
      );
    });

    medicationTemplates.forEach((promptText, index) => {
      upsertRowPromptTemplateStatement.run(
        categoryIds.get("medication"),
        `medication-${index + 1}`,
        promptText,
        index,
        now
      );
    });
  });
}

function getRowPromptCategories() {
  return getAllRowPromptCategoriesStatement.all();
}

function getRowPromptTemplates(categoryKey) {
  return getRowPromptTemplatesByCategoryStatement.all(categoryKey);
}

function getWorkspaceState(clientId) {
  const row = getWorkspaceStateRowStatement.get(clientId);
  if (!row) {
    return null;
  }

  const selectionSet = getLatestSelectionSetByWorkspaceStatement.get(row.id);
  const selectionNodes = selectionSet
    ? getSelectionSetNodesBySelectionSetStatement.all(selectionSet.id)
    : [];
  const uiPreferences = getUiPreferencesByClientStatement.get(clientId);
  const checkedNodes = {};
  const includeInFinalMap = {};

  selectionNodes.forEach((node) => {
    checkedNodes[node.node_key] = Boolean(node.is_checked);
    includeInFinalMap[node.node_key] = Boolean(node.include_in_final);
  });

  return {
    id: row.id,
    clientId: row.client_id,
    selectedLibraryId: row.selected_library_id,
    selectedLibrary: row.selected_library_slug,
    selectedDepth: row.selected_depth,
    includeMode: row.include_mode,
    selectedTargetType: row.selected_target_type,
    selectedTargetId: row.selected_target_id,
    documentationSession: parseJson(row.documentation_session_json, null),
    timeBlocks: getTimeBlocksByWorkspaceStatement.all(row.id).map((item) => ({
      id: item.block_key,
      label: item.label,
    })),
    rows: getRowsByWorkspaceStatement.all(row.id).map((item) => ({
      id: item.row_key,
      description: item.description,
      source: item.source,
      workflowId: item.workflow_id,
      theme: item.theme,
    })),
    selectionState: {
      selectedLibrary: row.selected_library_slug || uiPreferences?.last_selected_library || null,
      selectedDepth: selectionSet?.selected_depth ?? row.selected_depth ?? null,
      includeMode: selectionSet?.include_mode || row.include_mode || null,
      targetType: selectionSet?.target_type || row.selected_target_type || uiPreferences?.last_target_type || null,
      selectedTargetKey:
        selectionSet?.target_type && selectionSet?.target_id
          ? `${selectionSet.target_type === "case-note-row" ? "row" : "time"}:${selectionSet.target_id}`
          : null,
      checkedNodes,
      includeInFinalMap,
      stagedAssignments: parseJson(row.staged_assignments_json, []),
      collapsedSections: parseJson(uiPreferences?.collapsed_sections_json, {}),
    },
    updatedAt: row.updated_at,
  };
}

function saveWorkspaceState({
  clientId,
  timeBlocks = [],
  rows = [],
  documentationSession = null,
  selectedLibrary = null,
  selectedDepth = null,
  includeMode = null,
  selectedTargetType = null,
  selectedTargetId = null,
  checkedNodes = {},
  includeInFinalMap = {},
  stagedAssignments = [],
  collapsedSections = null,
  updatedAt = new Date().toISOString(),
}) {
  return runInTransaction(() => {
    const selectedLibraryId = getLibraryIdBySlug(selectedLibrary);
    const workspaceStateId = upsertWorkspaceStateStatement.get(
      clientId,
      selectedLibraryId,
      selectedDepth,
      includeMode,
      selectedTargetType,
      selectedTargetId,
      documentationSession ? JSON.stringify(documentationSession) : null,
      JSON.stringify(stagedAssignments || []),
      updatedAt
    ).id;

    deleteTimeBlocksByWorkspaceStatement.run(workspaceStateId);
    timeBlocks.forEach((block, index) => {
      insertTimeBlockStatement.run(
        workspaceStateId,
        block.id || `block-${index + 1}`,
        block.label || "",
        index,
        updatedAt
      );
    });

    deleteRowsByWorkspaceStatement.run(workspaceStateId);
    rows.forEach((row, index) => {
      insertRowStatement.run(
        workspaceStateId,
        row.id || `row-${index + 1}`,
        row.description || "",
        row.source || null,
        row.workflowId || null,
        row.theme || null,
        index,
        updatedAt
      );
    });

    deleteSelectionSetsByWorkspaceStatement.run(workspaceStateId);
    insertSelectionSetStatement.run(
      workspaceStateId,
      selectedLibraryId,
      "Current selection",
      selectedDepth,
      includeMode,
      selectedTargetType,
      selectedTargetId,
      Object.keys(checkedNodes).filter((key) => checkedNodes[key]).length,
      updatedAt
    );

    const selectionSet = getLatestSelectionSetByWorkspaceStatement.get(workspaceStateId);
    if (selectionSet) {
      deleteSelectionSetNodesBySelectionSetStatement.run(selectionSet.id);
      Object.keys(checkedNodes)
        .filter((nodeKey) => checkedNodes[nodeKey])
        .forEach((nodeKey, index) => {
          const resolvedNodeId = selectedLibraryId
            ? getNodeByLibraryAndKeyStatement.get(selectedLibraryId, nodeKey)?.id || null
            : null;
          insertSelectionSetNodeStatement.run(
            selectionSet.id,
            resolvedNodeId,
            nodeKey,
            includeInFinalMap[nodeKey] ? 1 : 0,
            1,
            index,
            updatedAt
          );
        });
    }

    upsertUiPreferencesStatement.run(
      clientId,
      collapsedSections ? JSON.stringify(collapsedSections) : serializeCollapsedSectionsFromRows(rows),
      selectedLibraryId,
      selectedTargetType,
      updatedAt
    );

    insertAuditLogStatement.run(
      clientId,
      workspaceStateId,
      null,
      "workspace_state_saved",
      JSON.stringify({
        timeBlockCount: timeBlocks.length,
        rowCount: rows.length,
        selectedLibrary,
        selectedDepth,
        includeMode,
        selectedTargetType,
        selectedTargetId,
        checkedNodeCount: Object.keys(checkedNodes).filter((key) => checkedNodes[key]).length,
        stagedAssignmentCount: Array.isArray(stagedAssignments) ? stagedAssignments.length : 0,
      })
    );

    return getWorkspaceState(clientId);
  });
}

function saveAssignment({
  clientId,
  target,
  assigned = [],
  assignedNodeConfig = null,
  updatedAt = new Date().toISOString(),
}) {
  return runInTransaction(() => {
    let workspace = getWorkspaceState(clientId);
    if (!workspace) {
      workspace = saveWorkspaceState({
        clientId,
        timeBlocks: [],
        rows: [],
        documentationSession: null,
        updatedAt,
      });
    }

    const librarySlug = assignedNodeConfig?.selectedLibrary || assigned?.[0]?.library || null;
    const libraryId = getLibraryIdBySlug(librarySlug);
    const assignedNodeSummary = assigned
      .map((node) => `${node.includeInFinal ? "[FINAL] " : ""}${node.question || node.title || node.id || node.stepKey || ""}`)
      .join("\n");

    const assignmentId = upsertAssignmentStatement.get(
      workspace.id,
      target?.type || "",
      target?.targetId || "",
      libraryId,
      assignedNodeConfig?.selectedDepth || null,
      assignedNodeConfig?.includeMode || null,
      assignedNodeSummary,
      JSON.stringify(assigned),
      assignedNodeConfig ? JSON.stringify(assignedNodeConfig) : null,
      updatedAt
    ).id;

    deleteAssignmentNodesStatement.run(assignmentId);
    deleteIncludeFinalFlagsStatement.run(assignmentId);

    assigned.forEach((node, index) => {
      const resolvedNodeId = libraryId
        ? getNodeByLibraryAndKeyStatement.get(libraryId, node.id || node.stepKey || "")?.id || null
        : null;
      insertAssignmentNodeStatement.run(
        assignmentId,
        resolvedNodeId,
        node.id || node.stepKey || null,
        node.includeInFinal ? 1 : 0,
        index
      );
      insertIncludeFinalFlagStatement.run(
        assignmentId,
        resolvedNodeId,
        node.id || node.stepKey || `node-${index + 1}`,
        node.includeInFinal ? 1 : 0,
        updatedAt
      );
    });

    deleteSelectionSetsByWorkspaceStatement.run(workspace.id);
    insertSelectionSetStatement.run(
      workspace.id,
      libraryId,
      "Current selection",
      assignedNodeConfig?.selectedDepth || null,
      assignedNodeConfig?.includeMode || null,
      target?.type || null,
      target?.targetId || null,
      assigned.length,
      updatedAt
    );

    upsertUiPreferencesStatement.run(
      clientId,
      null,
      libraryId,
      target?.type || null,
      updatedAt
    );

    insertAuditLogStatement.run(
      clientId,
      workspace.id,
      assignmentId,
      "assignment_saved",
      JSON.stringify({
        target,
        selectedLibrary: librarySlug,
        selectedDepth: assignedNodeConfig?.selectedDepth || null,
        includeMode: assignedNodeConfig?.includeMode || null,
        assignedCount: assigned.length,
      })
    );

    return {
      clientId,
      target,
      assigned,
      assignedNodeConfig,
      updatedAt,
    };
  });
}

function getAssignmentsByClient(clientId) {
  return getAssignmentsByClientStatement.all(clientId).map((row) => ({
    id: row.id,
    clientId: row.client_id,
    target: {
      type: row.target_type,
      targetId: row.target_id,
    },
    selectedLibrary: row.library_slug,
    selectedDepth: row.selected_depth,
    includeMode: row.include_mode,
    assignedNodeSummary: row.assigned_node_summary,
    assigned: parseJson(row.assigned_json, []),
    assignedNodeConfig: parseJson(row.assigned_node_config_json, null),
    updatedAt: row.updated_at,
  }));
}

seedDecisionCatalog();
seedRowPromptCatalog();

module.exports = {
  dbPath,
  getAssignmentsByClient,
  getRowPromptCategories,
  getRowPromptTemplates,
  getWorkspaceState,
  saveAssignment,
  saveWorkspaceState,
};
