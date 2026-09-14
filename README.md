# 知遇录 · ZHIYULU

> 长在知乎生态里的「个人成长操作系统」
> 知乎黑客松 2026 · 校园新锐季 · 知识炼金场 参赛作品

**把知乎上真实走过的路，重组成你自己的下一步。**

别人做的是「一个 AI 功能」，知遇录做的是「AI 陪你成为一个更好的人」。

---

## 在线体验

🔗 https://my-name-yyx-d0g5pjy204f53929a-1469577695.tcloudbaseapp.com/zhiyulu/

> 首次进入若看到 CloudBase 测试域名的风险提示，点「继续访问」即可。移动端已适配。

---

## 它解决什么

互联网和 AI 把知识拆成碎片，每个人捧着一地信息，却越来越难看清「自己到底有什么价值、还能走多远」。

知乎沉淀了多年真实人生经验，但每个迷茫的人还在从零试错——读完一篇回答，仍然不知道自己该不该转、怎么走。

**内容不缺，缺的是把内容「炼」成个人路径的机制。**

---

## 核心创新

| 维度 | 做法 |
| --- | --- |
| **形态创新** | 不是单点工具，而是「识己 → 见知 → 淬识 → 成册」的完整闭环操作系统。每一次复盘、打卡、足迹都沿**时间轴**可追溯、可回看 |
| **立意创新** | 刘看山（知乎官方 IP）是**提问式教练**：先反问澄清 → 再拆矛盾 → 最后才轻轻给视角，不替你下定论；缺资料就显式标注【推断】，绝不冒充事实 |
| **生态创新** | 不生产内容，只重新组织知乎真实经验。每条前人路径都附答主与原文链接，流量回流知乎；成长成果可润色成知乎想法草稿回流社区 |

---

## 功能矩阵

- **识己** — 对话式自我认知（不替你贴标签，让你自己拍板）+ 复盘（每轮动态引用最贴切的思维方法）
- **见知** — 知遇·检索（秒级知乎知识卡 / 深度检索 Agent 双模式，结论全部锚定真实来源）+ 领域速通（教练对话 + 学习方法 + 30 天计划）
- **淬识** — 大佬思维模型（把知乎高手方法论蒸馏成可复用思维卡）+ 成长检验（复习卡片 + 费曼 / 知乎体 / 复现三关）
- **成册** — 私人知识库（支持知乎 OAuth 登录，看自己真实的创作 / 关注 / 收藏）+ 养成系统（等级 / 时间轴 / 雷达图 / 图章）+ 人生传记（生命之书）+ 知识星球（成长关系星图）
- **贯穿全站** — 刘看山陪伴桌宠 + 实时对话，回答基于知乎实时检索、附真实来源与防幻觉徽标

**真实接入知乎生态**：热榜、站内搜索、全网搜索、直答、关注流、本人创作、OAuth 用户数据——全部真数据、可溯源；未登录优雅降级，不伪造、不白屏。

---

## 技术架构

```
zhiyulu/
├── index.html              前端 SPA 入口（无构建，直接打开即跑）
├── poster.html             裂变海报
├── go.html / _root_redirect.html
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js          主应用（模块路由 / 状态 / 渲染）
│   │   ├── lixuan.js       玄学引擎
│   │   ├── zx-corpus.js    知行语料（开源精简样本，51 条）
│   │   ├── zhixing-chains.js
│   │   └── lib/            three.min.js / OrbitControls.js / html-to-image.js
│   └── img/
└── zhiyu-api/              腾讯云开发云函数（Node.js 18）
    ├── index.js            全部后端逻辑：知乎 API 代理 / OAuth / 检索编排
    └── package.json
```

- **前端**：零构建纯静态 SPA，`hash` 路由，localStorage 持久化，无云端同步
- **后端**：单个云函数 `zhiyu-api`，持久层为 CloudBase 对象存储
- **渲染铁律**：禁止在正文罗列来源清单，来源统一由前端按域名分组渲染成卡片

### 知乎开放平台接入

- Base：`https://developer.zhihu.com`
- `GET /content/zhihu_search | global_search | hot_list`
- `POST /v1/chat/completions`（model: `zhida-thinking-1p5`）
- 用户数据只读：`/user/contents | followees | favlists | favlist_contents | collections`
- OAuth：`openapi.zhihu.com/authorize`；`app_key` / `token` 只存后端，前端只持 `sid`

---

## 本地运行

```bash
# 前端（任意静态服务器）
cd zhiyulu
python -m http.server 8899 --bind 127.0.0.1
# 打开 http://127.0.0.1:8899/

# 后端云函数本地联调
cd zhiyu-api
ZHIHU_ACCESS_SECRET=<你的密钥> PORT=9145 node index.js
```

前端通过 `window.ZHIYU_API_BASE` 指定后端地址。

---

## 部署

### 前端

```bash
tcb hosting deploy . /zhiyulu --yes
```

> ⚠️ 部署前必须剔除 `.git` / `output/` / `node_modules`，并 bump `index.html` 里的 `app.js?v=YYYYMMDDNN` 版本号。

### 后端

```bash
tcb fn deploy zhiyu-api --force
```

---

## 🔐 安全与密钥

**本项目不含任何密钥。** 密钥通过云函数环境变量注入，不进代码库。

首次部署前，请自行创建 `cloudbaserc.json`（已被 `.gitignore` 屏蔽）：

```json
{
  "envId": "<你的 CloudBase 环境 ID>",
  "functionRoot": ".",
  "functions": [
    {
      "name": "zhiyu-api",
      "runtime": "Nodejs18.15",
      "timeout": 60,
      "memorySize": 256,
      "isHTTP": true,
      "dir": "zhiyu-api",
      "envVariables": {
        "ZHIHU_ACCESS_SECRET": "<知乎开放平台密钥>",
        "ZHIHU_OAUTH_APP_ID": "",
        "ZHIHU_OAUTH_APP_KEY": "",
        "ZHIHU_OAUTH_REDIRECT": "",
        "ZHIHU_OAUTH_ENABLED": "1"
      }
    }
  ]
}
```

`.gitignore` 同时屏蔽了 `cloudbaserc*.json`、`*.key`、`*.pem`、`.env`、`zhiyu-api/lixuan_corpus*.json`（私有语料，有版权风险）。

---

## 免责说明

- 刘看山为知乎官方 IP，本项目仅于比赛期内合规使用，不商用。
- 玄学相关模块为娱乐向内容，不构成任何决策建议。

---

*知遇录 · 见人见己，你的个人成长操作系统。*
