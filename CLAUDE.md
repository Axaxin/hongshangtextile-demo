# 鸿尚纺织官网 — CLAUDE.md

## 项目概览

佛山市鸿尚纺织有限公司（Foshan Hongshang Textile Co., Ltd.）的 B2B 官方网站。
目标：产品展示 + 询盘转化，面向国内采购商和海外客户。

## 技术架构

- **静态托管**：Cloudflare Pages（Git 推送自动部署）
- **表单后端**：Cloudflare Worker（`worker/inquiry.js`，路由 `POST /api/inquiry`）
- **数据存储**：Cloudflare KV（binding: `INQUIRIES`，key 格式: `inquiry:{timestamp}-{uuid}`）
- **邮件通知**：MailChannels API（非致命，失败不影响 KV 写入）
- **前端**：纯静态 HTML + CSS + JS，无框架，ES modules

## 多语言

- 中文：根路径 `/`（`index.html`, `products.html`, `about.html`, `contact.html`）
- 英文：`/en/` 子目录（`en/index.html` 等），资产路径用 `../` 前缀
- 两套独立 HTML，共用同一套 CSS 和图片，导航栏 ZH/EN 链接切换

## 关键命令

```bash
npm test                    # 运行 Vitest 单元测试（16 个）
python3 -m http.server 8080 # 本地静态预览（不含 Worker，表单提交会 404）
npx wrangler dev            # 含 Worker 的完整本地环境
npx wrangler deploy         # 部署 Worker
```

## 文件结构

```
/
├── index.html / about.html / products.html / contact.html   # 中文页
├── en/                    # 英文页（结构同中文）
├── assets/
│   ├── css/style.css      # 全部样式（CSS 变量 + 各页面组件）
│   └── js/
│       ├── nav.js         # 滚动透明导航 + 移动端菜单
│       ├── products.js    # 产品页分类过滤 + 询盘 Modal
│       └── contact.js     # 联系页表单校验 + fetch 提交
├── shop-pic/              # 现有素材图片（直接引用，不处理）
├── worker/
│   ├── inquiry.js         # CF Worker 主体（含 validateInquiry 导出）
│   └── inquiry.test.js    # Worker 测试
├── assets/js/*.test.js    # products / contact 前端测试
├── wrangler.toml          # Worker 配置（含占位符，部署前需替换）
├── intro.md               # 1688 公司资料原文（页面文案参考用）
└── docs/superpowers/
    ├── specs/2026-05-24-textile-website-design.md   # 设计文档
    └── plans/2026-05-24-textile-website.md          # 实施计划
```

## 视觉设计

| CSS 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#1a1a2e` | 页面背景（深海军蓝） |
| `--bg-card` | `#252540` | 卡片背景 |
| `--accent` | `#e8650a` | 强调色（鸿尚橙） |
| `--text` | `#ffffff` | 主文字 |
| `--text-muted` | `#aaaaaa` | 次级文字 |

字体：中文系统字体栈，英文 Inter（Google Fonts CDN）。

## 重要模式

**JS DOM 守卫**：所有浏览器 DOM 操作都包裹在 `if (typeof document !== 'undefined')` 内，
使 Vitest（Node 环境）能安全 import 并测试纯函数。

**产品 Modal**：通过 `data-category`、`data-code`、`data-name`、`data-spec` 属性驱动，
`products.js` 读取这些属性填充 Modal。`role="dialog"` 放在内层 `.modal` 上，不在 `.modal-backdrop`。

**表单校验**：前端 `contact.js` 的 `validateContactForm()` 和 Worker 的 `validateInquiry()`
各自独立校验，都有单元测试。

## 图片素材（shop-pic/）

| 文件 | 用途 |
|---|---|
| `Homepage Image.jpg` | 资质证书 Banner |
| `Homepage Image (1).jpg` | 产品图（色织棋盘格 9282#） |
| `Homepage Image (2).jpg` | 产品图（方块格棉布 9231#） |
| `Homepage Image (3).jpg` | Hero 主图（工厂实景） |
| `Homepage Image (4).jpg` | 公司 Logo |
| `Image from Hongshangfangzhi.jpg` | 工厂数字指标横条 |
| `Image from Hongshangfangzhi (1).jpg` | 关于我们文案+优势图标 |
| `Image from Hongshangfangzhi (2).jpg` | 工厂车间实景 |
| `Image from Hongshangfangzhi (3).jpg` | 定制流程图（6步） |
| `Image from Hongshangfangzhi (4).jpg` | 热销产品（提花弹力罗纹 9193#） |

## 部署状态

- **CF Pages**：已连接 GitHub `Axaxin/hongshangtextile-demo`，push main 自动部署
- **CF Worker**：尚未部署，需先完成下方待处理事项

## 待处理事项（部署前）

1. **替换占位联系方式**（全局搜索替换所有 HTML + wrangler.toml）：
   - `+86 XXXX XXXX` → 真实 WhatsApp 号码
   - `contact@hongshang-textile.com` → 真实邮箱（或保留）
   - `wrangler.toml` 中 `NOTIFY_EMAIL` → 接收询盘的邮箱
   - `wrangler.toml` 中 `NOTIFY_FROM` → 发件邮箱（需配置 SPF/DKIM）

2. **创建 KV namespace** 并更新 `wrangler.toml`：
   ```bash
   npx wrangler kv namespace create INQUIRIES
   # 将输出的 id 填入 wrangler.toml 的 YOUR_KV_NAMESPACE_ID
   ```

3. **部署 Worker**：
   ```bash
   npx wrangler deploy
   ```

4. **配置 Worker 路由**：在 wrangler.toml 的 `[[routes]]` 中填入真实域名，再次 `npx wrangler deploy`
