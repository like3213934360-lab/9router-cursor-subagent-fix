# 9Router Cursor 多子代理修复

> 完整中英双语说明见 [README.md](./README.md)。

**基线:** 官方 [decolua/9router](https://github.com/decolua/9router) **v0.5.40**  
**问题:** [decolua/9router#2446](https://github.com/decolua/9router/issues/2446)

## 这是什么

通过 9Router 使用 Cursor 时，**本地多子代理无法启动** 的热修复 fork。

报错：

```text
cloud_base_branch may only be specified when environment equals cloud
```

本仓库在返回给 Cursor 前去掉 `"cloud_base_branch": ""` 等空占位参数。

## 怎么用（推荐：源码）

```bash
git clone https://github.com/like3213934360-lab/9router-cursor-subagent-fix.git
cd 9router-cursor-subagent-fix
cp .env.example .env
npm install
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run start
```

控制台：http://localhost:20128

Cursor Base URL：`http://localhost:20128/v1`

自检：

```bash
node tests/test-sanitize-cloud-base-branch.mjs
```

更多（Docker / 旧包补丁 / 英文）见 [README.md](./README.md)。
