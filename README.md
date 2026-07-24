# 9Router Cursor Subagent Fix / Cursor 多子代理修复

**Base / 基线:** official [decolua/9router](https://github.com/decolua/9router) **v0.5.40**  
**Issue / 问题:** [decolua/9router#2446](https://github.com/decolua/9router/issues/2446)

---

## 中文

### 这是什么

这是一个 **9Router 热修复 fork**，专门解决：通过 9Router 使用 Cursor 时，**本地多子代理（Subagent）无法启动**。

典型报错：

```text
cloud_base_branch may only be specified when environment equals cloud
```

原因：上游 Responses / Codex 路径可能把本可选字段变成必填，并输出空字符串 `"cloud_base_branch": ""`。Cursor 把空字符串当成「已指定」，在本地环境直接拒绝工具调用。

本仓库在返回给 Cursor 之前，去掉这些 strict 模式下的空占位参数（尤其是本地环境下的 `cloud_base_branch`），本地多子代理可以正常启动。

### 怎么用

#### 1）从本仓库运行（推荐）

```bash
git clone https://github.com/like3213934360-lab/9router-cursor-subagent-fix.git
cd 9router-cursor-subagent-fix
cp .env.example .env
npm install
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run start
```

开发模式：

```bash
PORT=20128 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run dev
```

打开控制台：http://localhost:20128

#### 2）Docker 构建本 fork

```bash
git clone https://github.com/like3213934360-lab/9router-cursor-subagent-fix.git
cd 9router-cursor-subagent-fix
docker build -t 9router-cursor-fix .
docker run -d --name 9router-cursor-fix \
  -p 20128:20128 \
  -v "$HOME/.9router:/app/data" \
  -e DATA_DIR=/app/data \
  9router-cursor-fix
```

需要本修复时，请用本仓库镜像，不要用官方 `decolua/9router:latest`（官方尚未合入该 fix）。

#### 3）给已安装的旧版 npm `9router` 打补丁（仅旧包）

适用于本机已装的约 `0.5.20`–`0.5.30`：

```bash
node patches/patch-cloud-base-branch.mjs
# 或
node patches/patch-cloud-base-branch.mjs /path/to/node_modules/9router
```

打完后重启 9Router。用 v0.5.40 请优先用上面的源码 / Docker 方式。

### 连接 Cursor

1. 打开本机 9Router 控制台，复制 API Key，配置 Provider / Combo。
2. Cursor → Settings → Models（OpenAI Compatible / Override）：
   - **Base URL:** `http://localhost:20128/v1`
   - **API Key:** 9Router 控制台里的 Key
   - **Model:** 例如 `cx/gpt-5.5` 或你的 Combo 名
3. 在 Agent 对话里启动**本地** Subagent，确认不再出现上述 `cloud_base_branch` 报错。

### 自检

```bash
node tests/test-sanitize-cloud-base-branch.mjs
```

应全部 `PASS`（含 `drops cloud_base_branch`）。

### 相关文件

| 文件 | 作用 |
|------|------|
| `open-sse/translator/response/openai-responses.js` | 缓冲并清洗工具参数 |
| `open-sse/utils/stream.js` | 把 request body 传入翻译状态 |
| `tests/test-sanitize-cloud-base-branch.mjs` | 单元测试 |
| `patches/patch-cloud-base-branch.mjs` | 旧安装包补丁脚本 |

---

## English

### What this is

A **9Router hotfix fork** for Cursor **local Subagent** startup failures when traffic goes through 9Router.

Typical error:

```text
cloud_base_branch may only be specified when environment equals cloud
```

Cause: the Responses / Codex path may strictify optional tool fields and emit `"cloud_base_branch": ""`. Cursor treats that empty string as “specified” and rejects the tool call for local environments.

This fork strips those empty strict-mode placeholders **before** arguments are returned to Cursor, so local multi-subagents can start.

### How to use

#### 1) Run from this repo (recommended)

```bash
git clone https://github.com/like3213934360-lab/9router-cursor-subagent-fix.git
cd 9router-cursor-subagent-fix
cp .env.example .env
npm install
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run start
```

Dev mode:

```bash
PORT=20128 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run dev
```

Dashboard: http://localhost:20128

#### 2) Docker (build this fork)

```bash
git clone https://github.com/like3213934360-lab/9router-cursor-subagent-fix.git
cd 9router-cursor-subagent-fix
docker build -t 9router-cursor-fix .
docker run -d --name 9router-cursor-fix \
  -p 20128:20128 \
  -v "$HOME/.9router:/app/data" \
  -e DATA_DIR=/app/data \
  9router-cursor-fix
```

Do **not** use `decolua/9router:latest` if you need this fix — upstream has not merged it yet.

#### 3) Patch an installed npm `9router` (legacy only)

For older installs (~`0.5.20`–`0.5.30`):

```bash
node patches/patch-cloud-base-branch.mjs
# or
node patches/patch-cloud-base-branch.mjs /path/to/node_modules/9router
```

Restart 9Router afterward. Prefer source/Docker on **v0.5.40**.

### Connect Cursor

1. Open this 9Router dashboard, copy the API key, configure providers/combos.
2. Cursor → Settings → Models (OpenAI Compatible / Override):
   - **Base URL:** `http://localhost:20128/v1`
   - **API Key:** from the 9Router dashboard
   - **Model:** e.g. `cx/gpt-5.5` or your combo name
3. Launch **local** Subagents in Agent chat; the `cloud_base_branch` error should be gone.

### Self-check

```bash
node tests/test-sanitize-cloud-base-branch.mjs
```

All checks should `PASS`, including `drops cloud_base_branch`.

### Key files

| File | Role |
|------|------|
| `open-sse/translator/response/openai-responses.js` | Buffer + sanitize tool args |
| `open-sse/utils/stream.js` | Pass request body into translator state |
| `tests/test-sanitize-cloud-base-branch.mjs` | Unit test |
| `patches/patch-cloud-base-branch.mjs` | Legacy install patch |

---

## License / 许可

MIT（与上游 9Router 相同）
