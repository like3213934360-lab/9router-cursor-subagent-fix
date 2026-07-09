# 9router Cursor Subagent Fix

Hotfix for [decolua/9router#2446](https://github.com/decolua/9router/issues/2446):

> Cursor local Subagent fails with:
> `cloud_base_branch may only be specified when environment equals cloud`

## Root cause

When Cursor talks to Codex through 9router:

1. Client sends `cloud_base_branch` as an **optional** tool field.
2. Codex Responses strictifies the schema (`strict: true`, every property required).
3. The model is forced to emit `"cloud_base_branch": ""` even for `environment: "local"`.
4. 9router's Responses → OpenAI translator streams those args through unchanged.
5. Cursor rejects the empty string as a specified cloud-only field.

## What this repo provides

1. **Source-level patch** for `open-sse`:
   - `open-sse/translator/response/openai-responses.js`
   - `open-sse/utils/stream.js`
2. **Installed-package hotfix script** for 9router `0.5.x`:
   - `patches/patch-cloud-base-branch.mjs`
3. **Unit test** for the sanitizer:
   - `tests/test-sanitize-cloud-base-branch.mjs`

## Quick fix for an installed 9router (macOS Homebrew)

```bash
# Apply hotfix to the installed package
node patches/patch-cloud-base-branch.mjs /opt/homebrew/lib/node_modules/9router

# Restart 9router so the patched chunks are loaded
kill $(lsof -tiTCP:20128 -sTCP:LISTEN)
9router --skip-update
```

The script:

- backs up `8833.js` / `8895.js` as `*.bak-cloud-base-branch`
- buffers tool-call arguments instead of streaming raw deltas
- strips empty optional fields (`""`, `[]`, `null`) using the original client schema
- also deletes `cloud_base_branch: ""` when `environment === "local"`

## Verify without restarting 9router

```bash
npm test
```

This validates the sanitizer against the failing argument shape from issue #2446.

## Notes

- This is a **local hotfix**, not an official 9router release.
- `npm i -g 9router@latest` will overwrite the patched install.
- Upstream should ideally land the same Responses → OpenAI sanitizer in `open-sse`.

## Related

- Issue: https://github.com/decolua/9router/issues/2446
- Similar Claude-path sanitizer precedent: https://github.com/decolua/9router/pull/1280
