#!/usr/bin/env node
/**
 * Unit checks for the cloud_base_branch sanitizer used by the hotfix.
 */
function buildOptionalToolFieldMap(body) {
  const map = new Map();
  const tools = body?.tools;
  if (!Array.isArray(tools)) return map;
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") continue;
    const name = tool.name || tool.function?.name;
    const schema = tool.parameters || tool.function?.parameters;
    const properties = schema?.properties || {};
    const required = new Set(Array.isArray(schema?.required) ? schema.required : []);
    const optionalFields = new Set();
    for (const field of Object.keys(properties)) {
      if (!required.has(field)) optionalFields.add(field);
    }
    if (name) map.set(name, optionalFields);
  }
  return map;
}

function sanitizeToolArguments(toolName, argsText, optionalToolFields) {
  let args;
  try {
    args = JSON.parse(argsText);
  } catch {
    return argsText;
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) return argsText;
  const optionalFields = optionalToolFields?.get?.(toolName);
  if (optionalFields) {
    for (const field of optionalFields) {
      const value = args[field];
      const isEmpty =
        value === "" ||
        value === null ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) delete args[field];
    }
  }
  if (args.environment === "local" && args.cloud_base_branch === "") {
    delete args.cloud_base_branch;
  }
  return JSON.stringify(args);
}

const schemaBody = {
  tools: [{
    type: "function",
    function: {
      name: "Subagent",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          prompt: { type: "string" },
          model: { type: "string" },
          resume: { type: "string" },
          readonly: { type: "boolean" },
          subagent_type: { type: "string" },
          file_attachments: { type: "array", items: { type: "string" } },
          environment: { type: "string" },
          cloud_base_branch: { type: "string" },
          interrupt: { type: "boolean" },
          run_in_background: { type: "boolean" }
        },
        required: ["description", "prompt", "readonly", "subagent_type", "run_in_background"]
      }
    }
  }]
};

const optional = buildOptionalToolFieldMap(schemaBody);
const raw = JSON.stringify({
  description: "Local readonly connectivity test",
  prompt: "Connectivity test only.",
  model: "",
  resume: "",
  readonly: true,
  subagent_type: "generalPurpose",
  file_attachments: [],
  environment: "local",
  cloud_base_branch: "",
  interrupt: false,
  run_in_background: false
});

const out = JSON.parse(sanitizeToolArguments("Subagent", raw, optional));
const asserts = [
  ["keeps required", out.description === "Local readonly connectivity test"],
  ["keeps environment", out.environment === "local"],
  ["drops cloud_base_branch", !("cloud_base_branch" in out)],
  ["drops empty model", !("model" in out)],
  ["drops empty resume", !("resume" in out)],
  ["drops empty file_attachments", !("file_attachments" in out)],
  ["keeps interrupt false", out.interrupt === false],
  ["keeps run_in_background", out.run_in_background === false]
];

let failed = 0;
for (const [name, ok] of asserts) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failed++;
}
console.log("result:", JSON.stringify(out));
process.exit(failed ? 1 : 0);
