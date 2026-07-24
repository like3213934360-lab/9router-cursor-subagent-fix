#!/usr/bin/env node
/**
 * Legacy hotfix for installed 9router 0.5.20-0.5.30 packages.
 * The v0.5.40 source tree in this fork already contains the fix directly.
 *
 * Codex Responses strictifies optional tool fields (e.g. cloud_base_branch:""),
 * and the Responses→OpenAI translator previously streamed those args through.
 * This patch buffers args and strips empty optional placeholders before Cursor sees them.
 *
 * Usage:
 *   node patch-cloud-base-branch.mjs
 *   node patch-cloud-base-branch.mjs /opt/homebrew/lib/node_modules/9router
 */
import fs from "fs";
import path from "path";

const pkgRoot = process.argv[2] || "/opt/homebrew/lib/node_modules/9router";
const chunksDir = path.join(pkgRoot, "app/.next-cli-build/server/chunks");
const file8833 = path.join(chunksDir, "8833.js");
const file8895 = path.join(chunksDir, "8895.js");

function backup(filePath) {
  const bak = `${filePath}.bak-cloud-base-branch`;
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(filePath, bak);
    console.log(`backup: ${bak}`);
  } else {
    console.log(`backup exists: ${bak}`);
  }
}

function mustReplace(filePath, from, to, label) {
  const text = fs.readFileSync(filePath, "utf8");
  if (text.includes("/* cloud_base_branch_hotfix */")) {
    console.log(`skip ${label}: already patched`);
    return false;
  }
  if (!text.includes(from)) {
    throw new Error(`pattern not found for ${label} in ${filePath}`);
  }
  const next = text.replace(from, to);
  if (next === text) {
    throw new Error(`replace produced no change for ${label}`);
  }
  fs.writeFileSync(filePath, next);
  console.log(`patched ${label}: ${filePath}`);
  return true;
}

// Inject helpers + buffer/sanitize into Responses→OpenAI translator (module 4845 in 8833.js)
const oldHandler = `if("response.output_item.added"===c&&(d.item?.type===j.Du.FUNCTION_CALL||d.item?.type==="custom_tool_call")){let a=d.item;return b.currentToolCallId=a.call_id||(0,h.eG)(),(0,f.k)({id:b.chatId,created:b.created,model:b.model||j.rP},{tool_calls:[{index:b.toolCallIndex,id:b.currentToolCallId,type:j.x4.FUNCTION,function:{name:a.name||"",arguments:""}}]})}if("response.function_call_arguments.delta"===c||"response.custom_tool_call_input.delta"===c){let a=d.delta||"";return a?(0,f.k)({id:b.chatId,created:b.created,model:b.model||j.rP},{tool_calls:[{index:b.toolCallIndex,function:{arguments:a}}]}):null}if("response.output_item.done"===c&&(d.item?.type===j.Du.FUNCTION_CALL||d.item?.type==="custom_tool_call"))return b.toolCallIndex++,null;`;

const helperPrelude = `/* cloud_base_branch_hotfix */function __buildOptionalToolFieldMap(a){let b=new Map,c=a?.tools;if(!Array.isArray(c))return b;for(let a of c){if(!a||"object"!=typeof a)continue;let c=a.name||a.function?.name,d=a.parameters||a.function?.parameters,e=d?.properties||{},f=new Set(Array.isArray(d?.required)?d.required:[]),g=new Set;for(let a of Object.keys(e))f.has(a)||g.add(a);c&&b.set(c,g)}return b}function __sanitizeToolArguments(a,b,c){let d;try{d=JSON.parse(b)}catch{return b}if(!d||"object"!=typeof d||Array.isArray(d))return b;let e=c?.get?.(a);if(e)for(let a of e){let b=d[a];(""===b||null===b||Array.isArray(b)&&0===b.length)&&delete d[a]}"local"===d.environment&&""===d.cloud_base_branch&&delete d.cloud_base_branch;return JSON.stringify(d)}`;

const newHandler = `${helperPrelude}if("response.output_item.added"===c&&(d.item?.type===j.Du.FUNCTION_CALL||d.item?.type==="custom_tool_call")){let a=d.item;return b.currentToolCallId=a.call_id||(0,h.eG)(),b.currentToolCallName=a.name||"",b.currentToolCallArgs="",b.optionalToolFields||(b.optionalToolFields=__buildOptionalToolFieldMap(b.requestBody||b.body)),(0,f.k)({id:b.chatId,created:b.created,model:b.model||j.rP},{tool_calls:[{index:b.toolCallIndex,id:b.currentToolCallId,type:j.x4.FUNCTION,function:{name:a.name||"",arguments:""}}]})}if("response.function_call_arguments.delta"===c||"response.custom_tool_call_input.delta"===c){let a=d.delta||"";return a?(b.currentToolCallArgs=(b.currentToolCallArgs||"")+a,null):null}if("response.output_item.done"===c&&(d.item?.type===j.Du.FUNCTION_CALL||d.item?.type==="custom_tool_call")){let a=b.currentToolCallArgs||d.item?.arguments||d.item?.input||"{}",c=b.currentToolCallName||d.item?.name||"",e=__sanitizeToolArguments(c,a,b.optionalToolFields),g=(0,f.k)({id:b.chatId,created:b.created,model:b.model||j.rP},{tool_calls:[{index:b.toolCallIndex,function:{arguments:e}}]});return b.toolCallIndex++,b.currentToolCallArgs="",b.currentToolCallName="",g}`;

// Pass request body into translator state so optional-field map can be built.
const oldState = `A=b===l?{...(0,d.Ws)(o),provider:p,toolNameMap:r,model:s}:null`;
const newState = `A=b===l?{...(0,d.Ws)(o),provider:p,toolNameMap:r,model:s,requestBody:u,body:u}:null`;

if (!fs.existsSync(file8833) || !fs.existsSync(file8895)) {
  console.error(`chunks not found under ${chunksDir}`);
  process.exit(1);
}

backup(file8833);
backup(file8895);
mustReplace(file8833, oldHandler, newHandler, "8833 responses→openai tool args");
mustReplace(file8895, oldState, newState, "8895 stream state requestBody");
console.log("done. Restart 9router for the patch to take effect.");
