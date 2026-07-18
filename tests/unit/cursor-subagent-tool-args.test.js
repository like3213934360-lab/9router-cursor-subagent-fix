import { describe, expect, it } from "vitest";

import {
  buildOptionalToolFieldMap,
  openaiResponsesToOpenAIResponse,
  sanitizeToolArguments,
} from "../../open-sse/translator/response/openai-responses.js";

const requestBody = {
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
          run_in_background: { type: "boolean" },
        },
        required: ["description", "prompt", "readonly", "subagent_type", "run_in_background"],
      },
    },
  }],
};

const rawArgs = JSON.stringify({
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
  run_in_background: false,
});

describe("Cursor local Subagent tool arguments", () => {
  it("drops empty optional placeholders but preserves required and false values", () => {
    const optionalFields = buildOptionalToolFieldMap(requestBody);
    const out = JSON.parse(sanitizeToolArguments("Subagent", rawArgs, optionalFields));

    expect(out.description).toBe("Local readonly connectivity test");
    expect(out.environment).toBe("local");
    expect(out).not.toHaveProperty("cloud_base_branch");
    expect(out).not.toHaveProperty("model");
    expect(out).not.toHaveProperty("resume");
    expect(out).not.toHaveProperty("file_attachments");
    expect(out.interrupt).toBe(false);
    expect(out.run_in_background).toBe(false);
  });

  it("buffers Responses deltas and emits sanitized arguments when the item completes", () => {
    const state = { model: "gpt-5.6", requestBody };

    openaiResponsesToOpenAIResponse({
      type: "response.output_item.added",
      item: { type: "function_call", call_id: "call_subagent", name: "Subagent" },
    }, state);

    expect(openaiResponsesToOpenAIResponse({
      type: "response.function_call_arguments.delta",
      delta: rawArgs.slice(0, 80),
    }, state)).toBeNull();
    expect(openaiResponsesToOpenAIResponse({
      type: "response.function_call_arguments.delta",
      delta: rawArgs.slice(80),
    }, state)).toBeNull();

    const done = openaiResponsesToOpenAIResponse({
      type: "response.output_item.done",
      item: { type: "function_call", call_id: "call_subagent", name: "Subagent" },
    }, state);
    const emittedArgs = JSON.parse(done.choices[0].delta.tool_calls[0].function.arguments);

    expect(emittedArgs.environment).toBe("local");
    expect(emittedArgs).not.toHaveProperty("cloud_base_branch");
    expect(emittedArgs).not.toHaveProperty("model");
    expect(emittedArgs.run_in_background).toBe(false);
  });

  it("keeps malformed argument text unchanged", () => {
    expect(sanitizeToolArguments("Subagent", "{partial", new Map())).toBe("{partial");
  });
});
