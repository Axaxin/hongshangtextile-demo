# Hongshang Textile Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (Chinese/English) static 4-page website for Foshan Hongshang Textile Co., deployed on Cloudflare Pages with a Worker handling inquiry form submissions.

**Architecture:** Pure static HTML/CSS/JS on Cloudflare Pages (Git-auto-deploy). A Cloudflare Worker at `/api/inquiry` receives POST requests, validates fields, writes to KV, and sends email via MailChannels. Two sets of HTML pages share one CSS file and one images folder.

**Tech Stack:** HTML5 · CSS3 (custom properties) · Vanilla JS (ES modules) · Cloudflare Pages · Cloudflare Workers · Cloudflare KV · MailChannels API · Vitest (unit tests for Worker and form logic)

---

## File Map

```
/
├── index.html                  # Homepage (Chinese)
├── products.html               # Product catalog (Chinese)
├── about.html                  # About us (Chinese)
├── contact.html                # Contact & inquiry form (Chinese)
├── en/
│   ├── index.html              # Homepage (English)
│   ├── products.html           # Product catalog (English)
│   ├── about.html              # About us (English)
│   └── contact.html            # Contact & inquiry form (English)
├── assets/
│   ├── css/style.css           # Design system: variables, reset, all shared components
│   └── js/
│       ├── nav.js              # Sticky nav scroll background
│       ├── products.js         # Tab filter + modal open/close
│       └── contact.js          # Form validation + fetch to Worker
├── shop-pic/                   # Existing images (do not modify)
├── worker/
│   ├── inquiry.js              # CF Worker: validate → KV write → email
│   └── inquiry.test.js         # Vitest unit tests for validateInquiry()
├── package.json
├── vitest.config.js
└── wrangler.toml
```

**Spec:** `docs/superpowers/specs/2026-05-24-textile-website-design.md`

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`
- Create: `wrangler.toml`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "hongshang-demo",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create wrangler.toml**

> Replace `YOUR_KV_NAMESPACE_ID` after running `wrangler kv namespace create INQUIRIES` in step 12.
> Replace `your@email.com` with the actual notification email.

```toml
name = "hongshang-inquiry"
main = "worker/inquiry.js"
compatibility_date = "2024-09-23"

[[kv_namespaces]]
binding = "INQUIRIES"
id = "YOUR_KV_NAMESPACE_ID"

[vars]
NOTIFY_EMAIL = "your@email.com"
NOTIFY_FROM = "noreply@yourdomain.com"
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
.superpowers/
dist/
.wrangler/
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Create directory structure**

```bash
mkdir -p assets/css assets/js en worker
```

- [ ] **Step 7: Commit**

```bash
git init
git add package.json vitest.config.js wrangler.toml .gitignore
git commit -m "chore: project scaffolding"
```

---

### Task 2: CSS Design System

**Files:**
- Create: `assets/css/style.css`

- [ ] **Step 1: Write the complete CSS file**

```css
/* Design tokens */
:root {
  --bg: #1a1a2e;
  --bg-card: #252540;
  --bg-card-hover: #2e2e55;
  --accent: #e8650a;
  --accent-hover: #d45a00;
  --text: #ffffff;
  --text-muted: #aaaaaa;
  --border: rgba(255,255,255,0.08);
  --font-zh: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  --font-en: 'Inter', sans-serif;
  --radius: 6px;
  --transition: 0.2s ease;
}

/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--font-zh); line-height: 1.6; }
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; border: none; background: none; font: inherit; }

/* Google Font (English pages) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

/* ===== NAVIGATION ===== */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 5%;
  height: 64px;
  transition: background var(--transition), backdrop-filter var(--transition);
}
.nav.scrolled {
  background: rgba(26,26,46,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.nav-logo { display: flex; align-items: center; gap: 10px; }
.nav-logo img { height: 36px; }
.nav-logo-text { font-size: 16px; font-weight: 700; letter-spacing: 1px; color: var(--text); }
.nav-links { display: flex; align-items: center; gap: 32px; }
.nav-links a { font-size: 14px; color: var(--text-muted); transition: color var(--transition); }
.nav-links a:hover, .nav-links a.active { color: var(--text); }
.nav-lang {
  font-size: 12px; font-weight: 600; color: var(--accent);
  border: 1px solid var(--accent); padding: 4px 10px; border-radius: 3px;
  transition: all var(--transition);
}
.nav-lang:hover { background: var(--accent); color: #fff; }
.nav-menu-btn { display: none; flex-direction: column; gap: 5px; padding: 4px; }
.nav-menu-btn span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; }
.nav-mobile { display: none; position: fixed; inset: 64px 0 0; background: var(--bg); z-index: 99;
  flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
.nav-mobile.open { display: flex; }
.nav-mobile a { font-size: 20px; color: var(--text-muted); }

/* ===== HERO ===== */
.hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center;
  background-size: cover; background-position: center; background-repeat: no-repeat;
}
.hero::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(26,26,46,0.85) 0%, rgba(26,26,46,0.5) 60%, transparent 100%);
}
.hero-content {
  position: relative; z-index: 1;
  max-width: 600px; padding: 0 5%;
}
.hero-tag { font-size: 12px; letter-spacing: 4px; color: var(--accent); margin-bottom: 16px; text-transform: uppercase; }
.hero-title { font-size: clamp(32px, 5vw, 56px); font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
.hero-subtitle { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }
.btn-primary {
  display: inline-block; background: var(--accent); color: #fff;
  padding: 14px 32px; border-radius: var(--radius); font-size: 15px; font-weight: 600;
  transition: background var(--transition), transform var(--transition);
}
.btn-primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
.btn-secondary {
  display: inline-block; border: 1px solid var(--accent); color: var(--accent);
  padding: 13px 31px; border-radius: var(--radius); font-size: 15px;
  transition: all var(--transition); margin-left: 12px;
}
.btn-secondary:hover { background: var(--accent); color: #fff; }

/* ===== STATS BAR ===== */
.stats { padding: 48px 5%; }
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  max-width: 900px; margin: 0 auto;
}
.stat-card {
  background: var(--bg-card); border-radius: var(--radius);
  padding: 24px; text-align: center;
  border: 1px solid var(--border);
}
.stat-number { font-size: 32px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

/* ===== SECTION COMMON ===== */
.section { padding: 80px 5%; }
.section-header { text-align: center; margin-bottom: 48px; }
.section-tag { font-size: 11px; letter-spacing: 4px; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; }
.section-title { font-size: clamp(24px, 3vw, 36px); font-weight: 700; }
.section-subtitle { font-size: 15px; color: var(--text-muted); margin-top: 8px; }

/* ===== PRODUCT GRID (homepage) ===== */
.product-grid-home {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  max-width: 1200px; margin: 0 auto;
}
.product-tile {
  position: relative; overflow: hidden; border-radius: var(--radius);
  aspect-ratio: 1; background: var(--bg-card); cursor: pointer;
}
.product-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.product-tile:hover img { transform: scale(1.05); }
.product-tile-label {
  position: absolute; inset: 0;
  display: flex; align-items: flex-end; padding: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
}
.product-tile-label span { font-size: 15px; font-weight: 600; }

/* ===== FEATURES (why choose us) ===== */
.features-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  max-width: 1000px; margin: 0 auto;
}
.feature-card {
  background: var(--bg-card); border-radius: var(--radius);
  padding: 32px 24px; text-align: center; border: 1px solid var(--border);
  transition: border-color var(--transition), transform var(--transition);
}
.feature-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.feature-icon { font-size: 36px; margin-bottom: 12px; }
.feature-name { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.feature-name-en { font-size: 11px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 8px; }
.feature-desc { font-size: 13px; color: var(--text-muted); }

/* ===== CERT BANNER ===== */
.cert-banner { padding: 0 5% 80px; }
.cert-banner img { width: 100%; max-width: 1200px; margin: 0 auto; border-radius: var(--radius); }

/* ===== CTA SECTION ===== */
.cta-section {
  padding: 80px 5%; text-align: center;
  background: linear-gradient(135deg, var(--bg-card), var(--bg));
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.cta-title { font-size: clamp(24px, 3vw, 40px); font-weight: 700; margin-bottom: 12px; }
.cta-subtitle { font-size: 16px; color: var(--text-muted); margin-bottom: 32px; }

/* ===== FOOTER ===== */
footer {
  padding: 48px 5% 24px;
  border-top: 1px solid var(--border);
}
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px;
  max-width: 1200px; margin: 0 auto 40px;
}
.footer-brand-name { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.footer-brand-sub { font-size: 12px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 12px; }
.footer-brand-desc { font-size: 13px; color: var(--text-muted); line-height: 1.7; }
.footer-col-title { font-size: 12px; font-weight: 600; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.footer-col ul li a { font-size: 14px; color: var(--text-muted); transition: color var(--transition); }
.footer-col ul li a:hover { color: var(--text); }
.footer-contact-item { font-size: 14px; color: var(--text-muted); margin-bottom: 8px; }
.footer-bottom {
  border-top: 1px solid var(--border); padding-top: 24px;
  text-align: center; font-size: 12px; color: var(--text-muted);
}

/* ===== PRODUCT CATALOG PAGE ===== */
.page-hero {
  padding: 120px 5% 48px;
  background: linear-gradient(135deg, var(--bg-card), var(--bg));
  border-bottom: 1px solid var(--border);
}
.page-hero-title { font-size: clamp(28px, 4vw, 48px); font-weight: 700; margin-bottom: 8px; }
.page-hero-sub { font-size: 14px; color: var(--text-muted); letter-spacing: 3px; }

.tabs { display: flex; gap: 8px; flex-wrap: wrap; padding: 32px 5% 0; border-bottom: 1px solid var(--border); }
.tab-btn {
  padding: 10px 20px; font-size: 14px; color: var(--text-muted);
  border-bottom: 2px solid transparent; transition: all var(--transition);
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

.products-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px; padding: 40px 5%;
  max-width: 1400px; margin: 0 auto;
}
.product-card {
  background: var(--bg-card); border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--border);
  transition: border-color var(--transition), transform var(--transition);
  cursor: pointer;
}
.product-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.product-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
.product-card-body { padding: 16px; }
.product-code { font-size: 18px; font-weight: 700; color: var(--accent); }
.product-name { font-size: 15px; font-weight: 600; margin: 4px 0; }
.product-spec { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
.btn-inquire {
  width: 100%; padding: 10px; background: var(--accent); color: #fff;
  border-radius: var(--radius); font-size: 14px; font-weight: 600;
  transition: background var(--transition);
}
.btn-inquire:hover { background: var(--accent-hover); }

/* ===== MODAL ===== */
.modal-backdrop {
  display: none; position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  align-items: center; justify-content: center; padding: 20px;
}
.modal-backdrop.open { display: flex; }
.modal {
  background: var(--bg-card); border-radius: var(--radius);
  max-width: 600px; width: 100%; padding: 32px;
  position: relative; border: 1px solid var(--border);
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  font-size: 24px; color: var(--text-muted); line-height: 1;
}
.modal-close:hover { color: var(--text); }
.modal-img { width: 100%; border-radius: 4px; margin-bottom: 16px; }
.modal-code { font-size: 22px; font-weight: 700; color: var(--accent); }
.modal-name { font-size: 18px; font-weight: 600; margin: 4px 0 8px; }
.modal-spec { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; }

/* ===== ABOUT PAGE ===== */
.about-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding: 100px 5% 60px; }
.about-text h2 { font-size: clamp(24px, 3vw, 36px); font-weight: 700; margin-bottom: 16px; }
.about-text p { font-size: 15px; color: var(--text-muted); line-height: 1.8; margin-bottom: 12px; }
.about-img { border-radius: var(--radius); overflow: hidden; }
.about-img img { width: 100%; }
.factory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 32px; }
.factory-grid img { border-radius: var(--radius); width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.process-img { padding: 0 5% 80px; }
.process-img img { width: 100%; border-radius: var(--radius); }

/* ===== CONTACT PAGE ===== */
.contact-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; padding: 100px 5% 80px; max-width: 1200px; margin: 0 auto; }
.contact-info h2 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.contact-info p { font-size: 15px; color: var(--text-muted); margin-bottom: 32px; }
.contact-item { display: flex; gap: 12px; margin-bottom: 20px; }
.contact-item-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.contact-item-label { font-size: 12px; color: var(--accent); font-weight: 600; letter-spacing: 1px; margin-bottom: 2px; }
.contact-item-value { font-size: 15px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
.form-group label .required { color: var(--accent); margin-left: 2px; }
.form-control {
  width: 100%; padding: 12px 16px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--text); font-size: 14px; font-family: inherit;
  transition: border-color var(--transition);
}
.form-control:focus { outline: none; border-color: var(--accent); }
.form-control.error { border-color: #e85c0a; }
.form-error { font-size: 12px; color: #e85c0a; margin-top: 4px; display: none; }
.form-error.visible { display: block; }
textarea.form-control { resize: vertical; min-height: 100px; }
.form-success {
  display: none; padding: 16px; background: rgba(232,101,10,0.1);
  border: 1px solid var(--accent); border-radius: var(--radius);
  text-align: center; font-size: 15px;
}
.form-success.visible { display: block; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-menu-btn { display: flex; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .product-grid-home { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
  .about-intro { grid-template-columns: 1fr; }
  .contact-layout { grid-template-columns: 1fr; }
  .factory-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .product-grid-home { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/style.css
git commit -m "feat: add CSS design system with dark industrial theme"
```

---

### Task 3: Shared navigation JS

**Files:**
- Create: `assets/js/nav.js`

- [ ] **Step 1: Create nav.js**

```js
// Sticky nav: add .scrolled class after scrolling 20px
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Mobile menu toggle
const menuBtn = document.querySelector('.nav-menu-btn');
const mobileNav = document.querySelector('.nav-mobile');
if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/nav.js
git commit -m "feat: add sticky nav with mobile menu toggle"
```

---

### Task 4: Homepage — Chinese (`index.html`)

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>鸿尚纺织 — 专业针织面料源头工厂</title>
  <meta name="description" content="佛山市鸿尚纺织有限公司，1688超级工厂认证，专注针织面料研发生产20年，提供棉麻、色织、提花、罗纹等多系列面料。">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <!-- Navigation -->
  <nav class="nav">
    <div class="nav-logo">
      <img src="shop-pic/Homepage Image (4).jpg" alt="鸿尚纺织 Logo">
    </div>
    <div class="nav-links">
      <a href="products.html">产品系列</a>
      <a href="about.html">关于我们</a>
      <a href="contact.html">联系我们</a>
      <a href="en/index.html" class="nav-lang">EN</a>
    </div>
    <button class="nav-menu-btn" aria-label="菜单">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">产品系列</a>
    <a href="about.html">关于我们</a>
    <a href="contact.html">联系我们</a>
    <a href="en/index.html" class="nav-lang">EN</a>
  </div>

  <!-- Hero -->
  <section class="hero" style="background-image: url('shop-pic/Homepage Image (3).jpg');">
    <div class="hero-content">
      <p class="hero-tag">1688 超级工厂认证 · Alibaba Field Certified</p>
      <h1 class="hero-title">专业针织面料<br>源头工厂直供</h1>
      <p class="hero-subtitle">20年专注 · 先进设备 · 支持定制 · 现货充足</p>
      <a href="contact.html" class="btn-primary">立即询盘</a>
      <a href="products.html" class="btn-secondary">查看产品</a>
    </div>
  </section>

  <!-- Stats -->
  <section class="stats">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">4600㎡</div><div class="stat-label">工厂面积</div></div>
      <div class="stat-card"><div class="stat-number">5000万+</div><div class="stat-label">年交易额</div></div>
      <div class="stat-card"><div class="stat-number">50+</div><div class="stat-label">加工设备</div></div>
      <div class="stat-card"><div class="stat-number">20年</div><div class="stat-label">行业经验</div></div>
    </div>
  </section>

  <!-- Product Series -->
  <section class="section">
    <div class="section-header">
      <p class="section-tag">Our Products</p>
      <h2 class="section-title">面料系列</h2>
      <p class="section-subtitle">多品类面料，满足不同应用场景</p>
    </div>
    <div class="product-grid-home">
      <a href="products.html?cat=cotton-linen" class="product-tile">
        <img src="shop-pic/Homepage Image (2).jpg" alt="棉麻系列">
        <div class="product-tile-label"><span>棉麻系列</span></div>
      </a>
      <a href="products.html?cat=dyed-woven" class="product-tile">
        <img src="shop-pic/Homepage Image (1).jpg" alt="色织系列">
        <div class="product-tile-label"><span>色织系列</span></div>
      </a>
      <a href="products.html?cat=jacquard" class="product-tile">
        <img src="shop-pic/Image from Hongshangfangzhi (4).jpg" alt="提花系列">
        <div class="product-tile-label"><span>提花系列</span></div>
      </a>
      <a href="products.html?cat=rib" class="product-tile">
        <img src="shop-pic/Image from Hongshangfangzhi (4).jpg" alt="罗纹系列">
        <div class="product-tile-label"><span>罗纹系列</span></div>
      </a>
      <a href="products.html?cat=all-cotton" class="product-tile">
        <img src="shop-pic/Homepage Image (2).jpg" alt="全棉系列">
        <div class="product-tile-label"><span>全棉系列</span></div>
      </a>
      <a href="products.html?cat=wool" class="product-tile">
        <img src="shop-pic/Homepage Image (1).jpg" alt="毛纺系列">
        <div class="product-tile-label"><span>毛纺系列</span></div>
      </a>
      <a href="products.html?cat=warp-knit" class="product-tile">
        <img src="shop-pic/Image from Hongshangfangzhi (2).jpg" alt="经编系列">
        <div class="product-tile-label"><span>经编系列</span></div>
      </a>
      <a href="products.html?cat=blended" class="product-tile">
        <img src="shop-pic/Image from Hongshangfangzhi (2).jpg" alt="混纺系列">
        <div class="product-tile-label"><span>混纺系列</span></div>
      </a>
    </div>
  </section>

  <!-- Why Choose Us -->
  <section class="section" style="background: var(--bg-card);">
    <div class="section-header">
      <p class="section-tag">Why Choose Us</p>
      <h2 class="section-title">为什么选择鸿尚</h2>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🏭</div>
        <div class="feature-name">超级工厂</div>
        <div class="feature-name-en">SUPER FACTORY</div>
        <p class="feature-desc">1688平台超级工厂认证，源头厂家，实地认证</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🌐</div>
        <div class="feature-name">跨境经验丰富</div>
        <div class="feature-name-en">CROSS-BORDER EXPERTISE</div>
        <p class="feature-desc">丰富的海外出口经验，熟悉国际贸易流程</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">✂️</div>
        <div class="feature-name">加工定制</div>
        <div class="feature-name-en">CUSTOM PROCESSING</div>
        <p class="feature-desc">支持订染、订制，根据客户需求定制面料</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📦</div>
        <div class="feature-name">大量现货</div>
        <div class="feature-name-en">LARGE STOCK</div>
        <p class="feature-desc">库存充足，出货快捷，质量稳定</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔬</div>
        <div class="feature-name">研发团队</div>
        <div class="feature-name-en">R&amp;D TEAM</div>
        <p class="feature-desc">专业针织面料研发团队，每季推出新型面料</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤝</div>
        <div class="feature-name">一站式服务</div>
        <div class="feature-name-en">ONE-STOP SERVICE</div>
        <p class="feature-desc">研发、设计、生产、销售一体化服务</p>
      </div>
    </div>
  </section>

  <!-- Certificate Banner -->
  <div class="cert-banner" style="padding-top: 80px;">
    <img src="shop-pic/Homepage Image.jpg" alt="资质证书 · 权威认证">
  </div>

  <!-- CTA -->
  <section class="cta-section">
    <h2 class="cta-title">准备好开始合作了吗？</h2>
    <p class="cta-subtitle">发送询盘，我们将在1-2个工作日内回复您</p>
    <a href="contact.html" class="btn-primary">立即发送询盘</a>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">鸿尚纺织</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">专注针织面料研发、设计、生产和销售一体化的现代化纺织企业，位于中国针织名镇广东佛山张槎。</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">快速链接</div>
        <ul>
          <li><a href="products.html">产品系列</a></li>
          <li><a href="about.html">关于我们</a></li>
          <li><a href="contact.html">联系我们</a></li>
          <li><a href="en/index.html">English</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">联系方式</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 广东省佛山市张槎</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 佛山市鸿尚纺织有限公司 · All Rights Reserved</div>
  </footer>

  <script type="module" src="assets/js/nav.js"></script>
</body>
</html>
```

> **Before committing:** Replace `contact@hongshang-textile.com` and `+86 XXXX XXXX` with the real contact details.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add Chinese homepage"
```

---

### Task 5: About page — Chinese (`about.html`)

**Files:**
- Create: `about.html`

- [ ] **Step 1: Create about.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>关于我们 — 鸿尚纺织</title>
  <meta name="description" content="佛山市鸿尚纺织有限公司，1688超级工厂，专注针织面料20年，工厂4600㎡，50+设备。">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="nav-logo">
      <img src="shop-pic/Homepage Image (4).jpg" alt="鸿尚纺织 Logo">
    </div>
    <div class="nav-links">
      <a href="products.html">产品系列</a>
      <a href="about.html" class="active">关于我们</a>
      <a href="contact.html">联系我们</a>
      <a href="en/about.html" class="nav-lang">EN</a>
    </div>
    <button class="nav-menu-btn" aria-label="菜单">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">产品系列</a>
    <a href="about.html">关于我们</a>
    <a href="contact.html">联系我们</a>
    <a href="en/about.html" class="nav-lang">EN</a>
  </div>

  <!-- About Intro -->
  <div class="about-intro">
    <div class="about-text">
      <h2>关于鸿尚纺织</h2>
      <p>佛山市鸿尚纺织有限公司坐落于中国针织名镇 — 张槎，专业从事时尚针织面料研发、设计、生产和销售一体化的自主创新大型现代化纺织企业。</p>
      <p>公司拥有一支专业的针织面料研发团队，每季度持续推出多款新型面料，并承诺为客户提供时尚、潮流、质优价廉的面料。</p>
      <p>主营产品类型：棉麻布、色织布、提花布、罗纹布、全棉布、毛纺面料、经编布、混纺交织系列，产品面料广泛应用于中高档时装、休闲、运动服等，直接或间接服务于全球较多知名品牌。</p>
    </div>
    <div class="about-img">
      <img src="shop-pic/Image from Hongshangfangzhi (3).jpg" alt="工厂实景">
    </div>
  </div>

  <!-- Stats -->
  <section class="stats" style="padding-top: 0;">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">4600㎡</div><div class="stat-label">工厂面积</div></div>
      <div class="stat-card"><div class="stat-number">5000万+</div><div class="stat-label">年交易额</div></div>
      <div class="stat-card"><div class="stat-number">50+</div><div class="stat-label">加工设备</div></div>
      <div class="stat-card"><div class="stat-number">20年</div><div class="stat-label">行业经验</div></div>
    </div>
  </section>

  <!-- Factory Images -->
  <section class="section" style="padding-top: 0;">
    <div class="section-header">
      <p class="section-tag">Our Factory</p>
      <h2 class="section-title">工厂实景</h2>
    </div>
    <div class="factory-grid" style="max-width:1200px;margin:0 auto;">
      <img src="shop-pic/Image from Hongshangfangzhi (2).jpg" alt="车间实景1">
      <img src="shop-pic/Image from Hongshangfangzhi (2).jpg" alt="车间实景2">
    </div>
  </section>

  <!-- Certificate -->
  <div class="cert-banner">
    <img src="shop-pic/Homepage Image.jpg" alt="资质证书 · 权威认证">
  </div>

  <!-- Custom Process -->
  <section class="section">
    <div class="section-header">
      <p class="section-tag">Customized</p>
      <h2 class="section-title">定制流程</h2>
      <p class="section-subtitle">致力于打造让您满意的产品</p>
    </div>
    <div class="process-img">
      <img src="shop-pic/Image from Hongshangfangzhi (3).jpg" alt="定制流程">
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <h2 class="cta-title">准备好开始合作了吗？</h2>
    <p class="cta-subtitle">发送询盘，我们将在1-2个工作日内回复您</p>
    <a href="contact.html" class="btn-primary">立即发送询盘</a>
  </section>

  <!-- Footer -->
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">鸿尚纺织</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">专注针织面料研发、设计、生产和销售一体化的现代化纺织企业，位于中国针织名镇广东佛山张槎。</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">快速链接</div>
        <ul>
          <li><a href="products.html">产品系列</a></li>
          <li><a href="about.html">关于我们</a></li>
          <li><a href="contact.html">联系我们</a></li>
          <li><a href="en/index.html">English</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">联系方式</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 广东省佛山市张槎</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 佛山市鸿尚纺织有限公司 · All Rights Reserved</div>
  </footer>

  <script type="module" src="assets/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add about.html
git commit -m "feat: add Chinese about page"
```

---

### Task 6: Worker validation — TDD

**Files:**
- Create: `worker/inquiry.js` (validateInquiry export only, fetch handler in Task 7)
- Create: `worker/inquiry.test.js`

- [ ] **Step 1: Write failing tests**

Create `worker/inquiry.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateInquiry } from './inquiry.js';

describe('validateInquiry', () => {
  it('returns empty array for valid minimal data', () => {
    expect(validateInquiry({ name: 'Alice', email: 'alice@example.com' })).toEqual([]);
  });

  it('returns error when name is missing', () => {
    const errors = validateInquiry({ name: '', email: 'a@b.com' });
    expect(errors).toContain('Name is required');
  });

  it('returns error when name is whitespace only', () => {
    const errors = validateInquiry({ name: '   ', email: 'a@b.com' });
    expect(errors).toContain('Name is required');
  });

  it('returns error when email is missing', () => {
    const errors = validateInquiry({ name: 'Bob', email: '' });
    expect(errors).toContain('Email is required');
  });

  it('returns error for invalid email format', () => {
    const errors = validateInquiry({ name: 'Bob', email: 'not-an-email' });
    expect(errors).toContain('Invalid email format');
  });

  it('returns multiple errors when both fields are missing', () => {
    const errors = validateInquiry({ name: '', email: '' });
    expect(errors.length).toBe(2);
  });

  it('accepts valid email with subdomains', () => {
    expect(validateInquiry({ name: 'Alice', email: 'a@sub.domain.com' })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: `FAIL worker/inquiry.test.js` — "validateInquiry is not a function" or similar.

- [ ] **Step 3: Implement validateInquiry**

Create `worker/inquiry.js` with the exported function only:

```js
export function validateInquiry(data) {
  const errors = [];
  if (!data.name?.trim()) {
    errors.push('Name is required');
  }
  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('Invalid email format');
  }
  return errors;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```

Expected: `PASS worker/inquiry.test.js` — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add worker/inquiry.js worker/inquiry.test.js
git commit -m "feat: add inquiry validation with tests"
```

---

### Task 7: Worker fetch handler

**Files:**
- Modify: `worker/inquiry.js` (add default export)

- [ ] **Step 1: Add fetch handler to worker/inquiry.js**

Append below the existing `validateInquiry` export:

```js
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const errors = validateInquiry(data);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join('; ') }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const key = `inquiry:${Date.now()}-${crypto.randomUUID()}`;
    const entry = {
      name: data.name,
      company: data.company || '',
      email: data.email,
      whatsapp: data.whatsapp || '',
      products: data.products || '',
      note: data.note || '',
      timestamp: new Date().toISOString(),
    };

    await env.INQUIRIES.put(key, JSON.stringify(entry));

    // Send notification email via MailChannels (non-fatal if it fails)
    try {
      const emailBody = [
        `姓名: ${entry.name}`,
        `公司: ${entry.company || '-'}`,
        `邮箱: ${entry.email}`,
        `WhatsApp: ${entry.whatsapp || '-'}`,
        `产品意向: ${entry.products || '-'}`,
        `备注: ${entry.note || '-'}`,
        `时间: ${entry.timestamp}`,
      ].join('\n');

      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.NOTIFY_EMAIL }] }],
          from: { email: env.NOTIFY_FROM, name: '鸿尚纺织网站' },
          subject: `新询盘 — ${entry.name}${entry.company ? ` (${entry.company})` : ''}`,
          content: [{ type: 'text/plain', value: emailBody }],
        }),
      });
    } catch {
      // Email failure is non-fatal — inquiry already persisted in KV
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  },
};
```

- [ ] **Step 2: Run existing tests to confirm they still pass**

```bash
npm test
```

Expected: 7 tests still pass (fetch handler doesn't affect validateInquiry tests).

- [ ] **Step 3: Commit**

```bash
git add worker/inquiry.js
git commit -m "feat: add Worker fetch handler with KV storage and MailChannels email"
```

---

### Task 8: Products JS — TDD

**Files:**
- Create: `assets/js/products.js`

> The filter and modal are DOM-based. Extract the pure filtering logic into a testable function; the DOM wiring is not unit-tested.

- [ ] **Step 1: Write failing test**

Create `assets/js/products.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { matchesCategory } from './products.js';

describe('matchesCategory', () => {
  it('returns true when category is "all"', () => {
    expect(matchesCategory('cotton-linen', 'all')).toBe(true);
  });

  it('returns true when card category matches selected', () => {
    expect(matchesCategory('jacquard', 'jacquard')).toBe(true);
  });

  it('returns false when categories differ', () => {
    expect(matchesCategory('rib', 'jacquard')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: `FAIL assets/js/products.test.js`.

- [ ] **Step 3: Implement products.js**

Create `assets/js/products.js`:

```js
export function matchesCategory(cardCategory, selectedCategory) {
  return selectedCategory === 'all' || cardCategory === selectedCategory;
}

// DOM wiring — runs only in browser
if (typeof document !== 'undefined') {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.product-card');

  function applyFilter(selected) {
    cards.forEach(card => {
      card.style.display = matchesCategory(card.dataset.category, selected) ? '' : 'none';
    });
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === selected);
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.category));
  });

  // Apply filter from URL query param on load (?cat=jacquard)
  const params = new URLSearchParams(location.search);
  const initial = params.get('cat') || 'all';
  applyFilter(initial);

  // Modal
  const backdrop = document.getElementById('modal-backdrop');
  const modalImg = document.getElementById('modal-img');
  const modalCode = document.getElementById('modal-code');
  const modalName = document.getElementById('modal-name');
  const modalSpec = document.getElementById('modal-spec');
  const modalInquireBtn = document.getElementById('modal-inquire');

  if (backdrop) {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.classList.contains('btn-inquire')) return;
        modalImg.src = card.querySelector('img').src;
        modalCode.textContent = card.dataset.code;
        modalName.textContent = card.dataset.name;
        modalSpec.textContent = card.dataset.spec;
        modalInquireBtn.href = `contact.html?product=${encodeURIComponent(card.dataset.code)}`;
        backdrop.classList.add('open');
      });
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      backdrop.classList.remove('open');
    });

    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') backdrop.classList.remove('open');
    });
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```

Expected: all 10 tests pass (7 from Task 6 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add assets/js/products.js assets/js/products.test.js
git commit -m "feat: add product filter and modal with tests"
```

---

### Task 9: Products page — Chinese (`products.html`)

**Files:**
- Create: `products.html`

- [ ] **Step 1: Create products.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>产品系列 — 鸿尚纺织</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="nav-logo">
      <img src="shop-pic/Homepage Image (4).jpg" alt="鸿尚纺织 Logo">
    </div>
    <div class="nav-links">
      <a href="products.html" class="active">产品系列</a>
      <a href="about.html">关于我们</a>
      <a href="contact.html">联系我们</a>
      <a href="en/products.html" class="nav-lang">EN</a>
    </div>
    <button class="nav-menu-btn" aria-label="菜单"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">产品系列</a>
    <a href="about.html">关于我们</a>
    <a href="contact.html">联系我们</a>
    <a href="en/products.html" class="nav-lang">EN</a>
  </div>

  <div class="page-hero">
    <div class="page-hero-sub">OUR PRODUCTS</div>
    <h1 class="page-hero-title">面料系列</h1>
  </div>

  <!-- Category Tabs -->
  <div class="tabs" role="tablist">
    <button class="tab-btn active" data-category="all" role="tab">全部</button>
    <button class="tab-btn" data-category="cotton-linen" role="tab">棉麻</button>
    <button class="tab-btn" data-category="dyed-woven" role="tab">色织</button>
    <button class="tab-btn" data-category="jacquard" role="tab">提花</button>
    <button class="tab-btn" data-category="rib" role="tab">罗纹</button>
    <button class="tab-btn" data-category="all-cotton" role="tab">全棉</button>
    <button class="tab-btn" data-category="wool" role="tab">毛纺</button>
    <button class="tab-btn" data-category="warp-knit" role="tab">经编</button>
    <button class="tab-btn" data-category="blended" role="tab">混纺</button>
  </div>

  <!-- Product Grid -->
  <div class="products-grid">

    <div class="product-card"
      data-category="dyed-woven"
      data-code="9282#"
      data-name="涤棉色织棋盘格"
      data-spec="幅宽：175cm · 克重：200g/㎡">
      <img src="shop-pic/Homepage Image (1).jpg" alt="9282# 涤棉色织棋盘格">
      <div class="product-card-body">
        <div class="product-code">9282#</div>
        <div class="product-name">涤棉色织棋盘格</div>
        <div class="product-spec">幅宽 175cm · 克重 200g/㎡</div>
        <button class="btn-inquire">询盘</button>
      </div>
    </div>

    <div class="product-card"
      data-category="cotton-linen"
      data-code="9231#"
      data-name="方块格棉布"
      data-spec="幅宽：175cm · 克重：200g/㎡">
      <img src="shop-pic/Homepage Image (2).jpg" alt="9231# 方块格棉布">
      <div class="product-card-body">
        <div class="product-code">9231#</div>
        <div class="product-name">方块格棉布</div>
        <div class="product-spec">幅宽 175cm · 克重 200g/㎡</div>
        <button class="btn-inquire">询盘</button>
      </div>
    </div>

    <div class="product-card"
      data-category="jacquard"
      data-code="9193#"
      data-name="提花弹力罗纹布"
      data-spec="幅宽：165cm · 克重：200g/㎡">
      <img src="shop-pic/Image from Hongshangfangzhi (4).jpg" alt="9193# 提花弹力罗纹布">
      <div class="product-card-body">
        <div class="product-code">9193#</div>
        <div class="product-name">提花弹力罗纹布</div>
        <div class="product-spec">幅宽 165cm · 克重 200g/㎡</div>
        <button class="btn-inquire">询盘</button>
      </div>
    </div>

  </div>
  <!-- Add more product cards above following the same data-* attribute pattern -->

  <!-- Modal -->
  <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal">
      <button class="modal-close" id="modal-close" aria-label="关闭">×</button>
      <img class="modal-img" id="modal-img" src="" alt="">
      <div class="modal-code" id="modal-code"></div>
      <div class="modal-name" id="modal-name"></div>
      <div class="modal-spec" id="modal-spec"></div>
      <a class="btn-primary" id="modal-inquire" href="contact.html" style="display:inline-block;margin-top:8px;">发送询盘</a>
    </div>
  </div>

  <!-- Footer (same as index.html) -->
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">鸿尚纺织</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">专注针织面料研发、设计、生产和销售一体化的现代化纺织企业，位于中国针织名镇广东佛山张槎。</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">快速链接</div>
        <ul>
          <li><a href="products.html">产品系列</a></li>
          <li><a href="about.html">关于我们</a></li>
          <li><a href="contact.html">联系我们</a></li>
          <li><a href="en/index.html">English</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">联系方式</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 广东省佛山市张槎</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 佛山市鸿尚纺织有限公司 · All Rights Reserved</div>
  </footer>

  <script type="module" src="assets/js/nav.js"></script>
  <script type="module" src="assets/js/products.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add products.html
git commit -m "feat: add Chinese products page with filter tabs and modal"
```

---

### Task 10: Contact form JS — TDD

**Files:**
- Create: `assets/js/contact.js`
- Create: `assets/js/contact.test.js`

- [ ] **Step 1: Write failing tests**

Create `assets/js/contact.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateContactForm } from './contact.js';

describe('validateContactForm', () => {
  it('returns no errors for valid data', () => {
    const errs = validateContactForm({ name: 'Alice', email: 'alice@example.com' });
    expect(errs).toEqual({});
  });

  it('requires name', () => {
    const errs = validateContactForm({ name: '', email: 'a@b.com' });
    expect(errs.name).toBeTruthy();
  });

  it('requires email', () => {
    const errs = validateContactForm({ name: 'Bob', email: '' });
    expect(errs.email).toBeTruthy();
  });

  it('rejects invalid email format', () => {
    const errs = validateContactForm({ name: 'Bob', email: 'notanemail' });
    expect(errs.email).toBeTruthy();
  });

  it('accepts valid email', () => {
    const errs = validateContactForm({ name: 'Bob', email: 'bob@corp.io' });
    expect(errs.email).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: `FAIL assets/js/contact.test.js`.

- [ ] **Step 3: Implement contact.js**

Create `assets/js/contact.js`:

```js
export function validateContactForm(data) {
  const errors = {};
  if (!data.name?.trim()) {
    errors.name = '请填写您的姓名';
  }
  if (!data.email?.trim()) {
    errors.email = '请填写邮箱地址';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

// DOM wiring — runs only in browser
if (typeof document !== 'undefined') {
  const form = document.getElementById('inquiry-form');
  if (!form) return;

  const successEl = document.getElementById('form-success');

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errEl = document.getElementById(`${fieldId}-error`);
    if (input) input.classList.add('error');
    if (errEl) { errEl.textContent = message; errEl.classList.add('visible'); }
  }

  function clearErrors() {
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  }

  // Pre-fill product field from URL (?product=9282%23)
  const params = new URLSearchParams(location.search);
  const productParam = params.get('product');
  if (productParam) {
    const productsEl = document.getElementById('products');
    if (productsEl) productsEl.value = productParam;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();

    const data = {
      name: form.name.value,
      company: form.company.value,
      email: form.email.value,
      whatsapp: form.whatsapp.value,
      products: form.products.value,
      note: form.note.value,
    };

    const errors = validateContactForm(data);
    if (Object.keys(errors).length > 0) {
      if (errors.name) showFieldError('name', errors.name);
      if (errors.email) showFieldError('email', errors.email);
      return;
    }

    const submitBtn = form.querySelector('[type=submit]');
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.style.display = 'none';
        successEl.classList.add('visible');
      } else {
        const json = await res.json();
        alert(json.error || '提交失败，请稍后再试');
        submitBtn.disabled = false;
        submitBtn.textContent = '发送询盘';
      }
    } catch {
      alert('网络错误，请检查连接后重试');
      submitBtn.disabled = false;
      submitBtn.textContent = '发送询盘';
    }
  });
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test
```

Expected: all 15 tests pass.

- [ ] **Step 5: Commit**

```bash
git add assets/js/contact.js assets/js/contact.test.js
git commit -m "feat: add contact form validation with tests"
```

---

### Task 11: Contact page — Chinese (`contact.html`)

**Files:**
- Create: `contact.html`

- [ ] **Step 1: Create contact.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>联系我们 — 鸿尚纺织</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="nav-logo">
      <img src="shop-pic/Homepage Image (4).jpg" alt="鸿尚纺织 Logo">
    </div>
    <div class="nav-links">
      <a href="products.html">产品系列</a>
      <a href="about.html">关于我们</a>
      <a href="contact.html" class="active">联系我们</a>
      <a href="en/contact.html" class="nav-lang">EN</a>
    </div>
    <button class="nav-menu-btn" aria-label="菜单"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">产品系列</a>
    <a href="about.html">关于我们</a>
    <a href="contact.html">联系我们</a>
    <a href="en/contact.html" class="nav-lang">EN</a>
  </div>

  <div class="contact-layout">

    <!-- Contact Info -->
    <div class="contact-info">
      <h2>联系我们</h2>
      <p>请填写下方表单，我们将在1-2个工作日内回复您。也可以直接通过以下方式联系我们。</p>

      <div class="contact-item">
        <div class="contact-item-icon">📧</div>
        <div>
          <div class="contact-item-label">EMAIL</div>
          <div class="contact-item-value">contact@hongshang-textile.com</div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">💬</div>
        <div>
          <div class="contact-item-label">WHATSAPP</div>
          <div class="contact-item-value">+86 XXXX XXXX</div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">📍</div>
        <div>
          <div class="contact-item-label">ADDRESS</div>
          <div class="contact-item-value">广东省佛山市禅城区张槎街道</div>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">🏭</div>
        <div>
          <div class="contact-item-label">工厂面积</div>
          <div class="contact-item-value">4600㎡ · 50+ 加工设备</div>
        </div>
      </div>
    </div>

    <!-- Inquiry Form -->
    <div>
      <form id="inquiry-form" novalidate>
        <div class="form-group">
          <label for="name">姓名 <span class="required">*</span></label>
          <input type="text" id="name" name="name" class="form-control" placeholder="您的姓名" autocomplete="name">
          <div class="form-error" id="name-error"></div>
        </div>
        <div class="form-group">
          <label for="company">公司名称</label>
          <input type="text" id="company" name="company" class="form-control" placeholder="公司名称（选填）" autocomplete="organization">
        </div>
        <div class="form-group">
          <label for="email">邮箱 <span class="required">*</span></label>
          <input type="email" id="email" name="email" class="form-control" placeholder="your@email.com" autocomplete="email">
          <div class="form-error" id="email-error"></div>
        </div>
        <div class="form-group">
          <label for="whatsapp">WhatsApp / 电话</label>
          <input type="tel" id="whatsapp" name="whatsapp" class="form-control" placeholder="+86 或国际号码（选填）">
        </div>
        <div class="form-group">
          <label for="products">感兴趣的产品系列</label>
          <select id="products" name="products" class="form-control">
            <option value="">请选择（选填）</option>
            <option value="棉麻系列">棉麻系列</option>
            <option value="色织系列">色织系列</option>
            <option value="提花系列">提花系列</option>
            <option value="罗纹系列">罗纹系列</option>
            <option value="全棉系列">全棉系列</option>
            <option value="毛纺系列">毛纺系列</option>
            <option value="经编系列">经编系列</option>
            <option value="混纺系列">混纺系列</option>
          </select>
        </div>
        <div class="form-group">
          <label for="note">备注 / 具体需求</label>
          <textarea id="note" name="note" class="form-control" placeholder="请描述您的面料需求，如数量、用途、特殊要求等（选填）"></textarea>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">发送询盘</button>
      </form>
      <div class="form-success" id="form-success">
        ✅ 感谢您的询盘！我们将在1-2个工作日内联系您。
      </div>
    </div>

  </div>

  <!-- Footer -->
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">鸿尚纺织</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">专注针织面料研发、设计、生产和销售一体化的现代化纺织企业，位于中国针织名镇广东佛山张槎。</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">快速链接</div>
        <ul>
          <li><a href="products.html">产品系列</a></li>
          <li><a href="about.html">关于我们</a></li>
          <li><a href="contact.html">联系我们</a></li>
          <li><a href="en/index.html">English</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">联系方式</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 广东省佛山市张槎</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 佛山市鸿尚纺织有限公司 · All Rights Reserved</div>
  </footer>

  <script type="module" src="assets/js/nav.js"></script>
  <script type="module" src="assets/js/contact.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add contact.html
git commit -m "feat: add Chinese contact and inquiry page"
```

---

### Task 12: English pages (`en/`)

**Files:**
- Create: `en/index.html`
- Create: `en/products.html`
- Create: `en/about.html`
- Create: `en/contact.html`

All English pages share the same structure as Chinese counterparts. Key differences: `lang="en"`, English text throughout, asset paths use `../` prefix, language toggle links back to `../index.html` etc.

- [ ] **Step 1: Create en/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hongshang Textile — Premium Knit Fabric Manufacturer</title>
  <meta name="description" content="Foshan Hongshang Textile Co., Ltd. — Alibaba 1688 Super Factory. 20 years specializing in knit fabric: cotton-linen, dyed-woven, jacquard, rib and more.">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="nav-logo">
      <img src="../shop-pic/Homepage Image (4).jpg" alt="Hongshang Textile Logo">
    </div>
    <div class="nav-links">
      <a href="products.html">Products</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="../index.html" class="nav-lang">中文</a>
    </div>
    <button class="nav-menu-btn" aria-label="Menu"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">Products</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <a href="../index.html" class="nav-lang">中文</a>
  </div>

  <section class="hero" style="background-image: url('../shop-pic/Homepage Image (3).jpg');">
    <div class="hero-content">
      <p class="hero-tag">Alibaba 1688 Super Factory · Field Certified</p>
      <h1 class="hero-title">Premium Knit Fabric<br>Direct from the Source</h1>
      <p class="hero-subtitle">20 Years Experience · Advanced Equipment · Custom Orders · Large Stock</p>
      <a href="contact.html" class="btn-primary">Get a Quote</a>
      <a href="products.html" class="btn-secondary">View Products</a>
    </div>
  </section>

  <section class="stats">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">4,600㎡</div><div class="stat-label">Factory Area</div></div>
      <div class="stat-card"><div class="stat-number">$7M+</div><div class="stat-label">Annual Sales</div></div>
      <div class="stat-card"><div class="stat-number">50+</div><div class="stat-label">Machines</div></div>
      <div class="stat-card"><div class="stat-number">20 Yrs</div><div class="stat-label">Experience</div></div>
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <p class="section-tag">Our Products</p>
      <h2 class="section-title">Fabric Collections</h2>
      <p class="section-subtitle">Multiple fabric categories to suit every application</p>
    </div>
    <div class="product-grid-home">
      <a href="products.html?cat=cotton-linen" class="product-tile">
        <img src="../shop-pic/Homepage Image (2).jpg" alt="Cotton-Linen">
        <div class="product-tile-label"><span>Cotton-Linen</span></div>
      </a>
      <a href="products.html?cat=dyed-woven" class="product-tile">
        <img src="../shop-pic/Homepage Image (1).jpg" alt="Dyed-Woven">
        <div class="product-tile-label"><span>Dyed-Woven</span></div>
      </a>
      <a href="products.html?cat=jacquard" class="product-tile">
        <img src="../shop-pic/Image from Hongshangfangzhi (4).jpg" alt="Jacquard">
        <div class="product-tile-label"><span>Jacquard</span></div>
      </a>
      <a href="products.html?cat=rib" class="product-tile">
        <img src="../shop-pic/Image from Hongshangfangzhi (4).jpg" alt="Rib">
        <div class="product-tile-label"><span>Rib</span></div>
      </a>
      <a href="products.html?cat=all-cotton" class="product-tile">
        <img src="../shop-pic/Homepage Image (2).jpg" alt="All-Cotton">
        <div class="product-tile-label"><span>All-Cotton</span></div>
      </a>
      <a href="products.html?cat=wool" class="product-tile">
        <img src="../shop-pic/Homepage Image (1).jpg" alt="Woolen">
        <div class="product-tile-label"><span>Woolen</span></div>
      </a>
      <a href="products.html?cat=warp-knit" class="product-tile">
        <img src="../shop-pic/Image from Hongshangfangzhi (2).jpg" alt="Warp Knit">
        <div class="product-tile-label"><span>Warp Knit</span></div>
      </a>
      <a href="products.html?cat=blended" class="product-tile">
        <img src="../shop-pic/Image from Hongshangfangzhi (2).jpg" alt="Blended">
        <div class="product-tile-label"><span>Blended</span></div>
      </a>
    </div>
  </section>

  <section class="section" style="background: var(--bg-card);">
    <div class="section-header">
      <p class="section-tag">Why Choose Us</p>
      <h2 class="section-title">Our Advantages</h2>
    </div>
    <div class="features-grid">
      <div class="feature-card"><div class="feature-icon">🏭</div><div class="feature-name">Super Factory</div><div class="feature-name-en">ALIBABA CERTIFIED</div><p class="feature-desc">1688 platform super factory, verified on-site by Alibaba</p></div>
      <div class="feature-card"><div class="feature-icon">🌐</div><div class="feature-name">Export Experience</div><div class="feature-name-en">CROSS-BORDER EXPERTISE</div><p class="feature-desc">Extensive experience in international trade and export logistics</p></div>
      <div class="feature-card"><div class="feature-icon">✂️</div><div class="feature-name">Custom Orders</div><div class="feature-name-en">OEM / ODM</div><p class="feature-desc">Custom dyeing, weaving and finishing to your specifications</p></div>
      <div class="feature-card"><div class="feature-icon">📦</div><div class="feature-name">Large Stock</div><div class="feature-name-en">READY TO SHIP</div><p class="feature-desc">Ample inventory, fast shipping, consistent quality</p></div>
      <div class="feature-card"><div class="feature-icon">🔬</div><div class="feature-name">R&amp;D Team</div><div class="feature-name-en">IN-HOUSE INNOVATION</div><p class="feature-desc">Dedicated fabric R&amp;D team, new designs every season</p></div>
      <div class="feature-card"><div class="feature-icon">🤝</div><div class="feature-name">One-Stop Service</div><div class="feature-name-en">END-TO-END</div><p class="feature-desc">R&amp;D, design, production and sales all under one roof</p></div>
    </div>
  </section>

  <div class="cert-banner" style="padding-top: 80px;">
    <img src="../shop-pic/Homepage Image.jpg" alt="Company Certificates">
  </div>

  <section class="cta-section">
    <h2 class="cta-title">Ready to Start a Partnership?</h2>
    <p class="cta-subtitle">Send us an inquiry and we'll reply within 1-2 business days</p>
    <a href="contact.html" class="btn-primary">Send Inquiry</a>
  </section>

  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">Hongshang Textile</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">A modern textile enterprise integrating R&amp;D, design, production and sales of fashionable knit fabrics, located in Zhangcha, Foshan — China's knitting capital.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Quick Links</div>
        <ul>
          <li><a href="products.html">Products</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="../index.html">中文</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Contact</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 Zhangcha, Foshan, Guangdong, China</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 Foshan Hongshang Textile Co., Ltd. · All Rights Reserved</div>
  </footer>

  <script type="module" src="../assets/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create en/about.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Us — Hongshang Textile</title>
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-logo"><img src="../shop-pic/Homepage Image (4).jpg" alt="Hongshang Textile Logo"></div>
    <div class="nav-links">
      <a href="products.html">Products</a>
      <a href="about.html" class="active">About</a>
      <a href="contact.html">Contact</a>
      <a href="../about.html" class="nav-lang">中文</a>
    </div>
    <button class="nav-menu-btn" aria-label="Menu"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">Products</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <a href="../about.html" class="nav-lang">中文</a>
  </div>

  <div class="about-intro">
    <div class="about-text">
      <h2>About Hongshang Textile</h2>
      <p>Foshan Hongshang Textile Co., Ltd. is located in Zhangcha, Foshan — China's premier knitting town. We are a large-scale modern textile enterprise integrating R&amp;D, design, production and sales of fashionable knit fabrics.</p>
      <p>Our dedicated fabric R&amp;D team develops new materials every season, committed to providing fashionable, trendy and competitively priced fabrics to customers worldwide.</p>
      <p>Main product lines include: cotton-linen, dyed-woven, jacquard, rib, all-cotton, woolen, warp-knit and blended fabric series — widely used in mid-to-high-end fashion, casual and sportswear, serving globally recognized brands.</p>
    </div>
    <div class="about-img">
      <img src="../shop-pic/Image from Hongshangfangzhi (3).jpg" alt="Factory">
    </div>
  </div>

  <section class="stats" style="padding-top: 0;">
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-number">4,600㎡</div><div class="stat-label">Factory Area</div></div>
      <div class="stat-card"><div class="stat-number">$7M+</div><div class="stat-label">Annual Sales</div></div>
      <div class="stat-card"><div class="stat-number">50+</div><div class="stat-label">Machines</div></div>
      <div class="stat-card"><div class="stat-number">20 Yrs</div><div class="stat-label">Experience</div></div>
    </div>
  </section>

  <section class="section" style="padding-top: 0;">
    <div class="section-header">
      <p class="section-tag">Our Factory</p>
      <h2 class="section-title">Factory Tour</h2>
    </div>
    <div class="factory-grid" style="max-width:1200px;margin:0 auto;">
      <img src="../shop-pic/Image from Hongshangfangzhi (2).jpg" alt="Factory floor 1">
      <img src="../shop-pic/Image from Hongshangfangzhi (2).jpg" alt="Factory floor 2">
    </div>
  </section>

  <div class="cert-banner">
    <img src="../shop-pic/Homepage Image.jpg" alt="Company Certificates">
  </div>

  <section class="section">
    <div class="section-header">
      <p class="section-tag">Customized</p>
      <h2 class="section-title">Custom Order Process</h2>
      <p class="section-subtitle">Committed to delivering exactly what you need</p>
    </div>
    <div class="process-img">
      <img src="../shop-pic/Image from Hongshangfangzhi (3).jpg" alt="Custom process">
    </div>
  </section>

  <section class="cta-section">
    <h2 class="cta-title">Ready to Start a Partnership?</h2>
    <p class="cta-subtitle">Send us an inquiry and we'll reply within 1-2 business days</p>
    <a href="contact.html" class="btn-primary">Send Inquiry</a>
  </section>

  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">Hongshang Textile</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">A modern textile enterprise integrating R&amp;D, design, production and sales of fashionable knit fabrics, located in Zhangcha, Foshan — China's knitting capital.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Quick Links</div>
        <ul>
          <li><a href="products.html">Products</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="../index.html">中文</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Contact</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 Zhangcha, Foshan, Guangdong, China</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 Foshan Hongshang Textile Co., Ltd. · All Rights Reserved</div>
  </footer>

  <script type="module" src="../assets/js/nav.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create en/products.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Products — Hongshang Textile</title>
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-logo"><img src="../shop-pic/Homepage Image (4).jpg" alt="Hongshang Textile Logo"></div>
    <div class="nav-links">
      <a href="products.html" class="active">Products</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="../products.html" class="nav-lang">中文</a>
    </div>
    <button class="nav-menu-btn" aria-label="Menu"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">Products</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <a href="../products.html" class="nav-lang">中文</a>
  </div>

  <div class="page-hero">
    <div class="page-hero-sub">OUR PRODUCTS</div>
    <h1 class="page-hero-title">Fabric Collections</h1>
  </div>

  <div class="tabs" role="tablist">
    <button class="tab-btn active" data-category="all" role="tab">All</button>
    <button class="tab-btn" data-category="cotton-linen" role="tab">Cotton-Linen</button>
    <button class="tab-btn" data-category="dyed-woven" role="tab">Dyed-Woven</button>
    <button class="tab-btn" data-category="jacquard" role="tab">Jacquard</button>
    <button class="tab-btn" data-category="rib" role="tab">Rib</button>
    <button class="tab-btn" data-category="all-cotton" role="tab">All-Cotton</button>
    <button class="tab-btn" data-category="wool" role="tab">Woolen</button>
    <button class="tab-btn" data-category="warp-knit" role="tab">Warp Knit</button>
    <button class="tab-btn" data-category="blended" role="tab">Blended</button>
  </div>

  <div class="products-grid">
    <div class="product-card" data-category="dyed-woven" data-code="9282#" data-name="Polyester-Cotton Check" data-spec="Width: 175cm · Weight: 200g/㎡">
      <img src="../shop-pic/Homepage Image (1).jpg" alt="9282#">
      <div class="product-card-body">
        <div class="product-code">9282#</div>
        <div class="product-name">Polyester-Cotton Check</div>
        <div class="product-spec">Width 175cm · Weight 200g/㎡</div>
        <button class="btn-inquire">Inquire</button>
      </div>
    </div>
    <div class="product-card" data-category="cotton-linen" data-code="9231#" data-name="Waffle Cotton" data-spec="Width: 175cm · Weight: 200g/㎡">
      <img src="../shop-pic/Homepage Image (2).jpg" alt="9231#">
      <div class="product-card-body">
        <div class="product-code">9231#</div>
        <div class="product-name">Waffle Cotton</div>
        <div class="product-spec">Width 175cm · Weight 200g/㎡</div>
        <button class="btn-inquire">Inquire</button>
      </div>
    </div>
    <div class="product-card" data-category="jacquard" data-code="9193#" data-name="Jacquard Stretch Rib" data-spec="Width: 165cm · Weight: 200g/㎡">
      <img src="../shop-pic/Image from Hongshangfangzhi (4).jpg" alt="9193#">
      <div class="product-card-body">
        <div class="product-code">9193#</div>
        <div class="product-name">Jacquard Stretch Rib</div>
        <div class="product-spec">Width 165cm · Weight 200g/㎡</div>
        <button class="btn-inquire">Inquire</button>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal">
      <button class="modal-close" id="modal-close" aria-label="Close">×</button>
      <img class="modal-img" id="modal-img" src="" alt="">
      <div class="modal-code" id="modal-code"></div>
      <div class="modal-name" id="modal-name"></div>
      <div class="modal-spec" id="modal-spec"></div>
      <a class="btn-primary" id="modal-inquire" href="contact.html" style="display:inline-block;margin-top:8px;">Send Inquiry</a>
    </div>
  </div>

  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">Hongshang Textile</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">A modern textile enterprise integrating R&amp;D, design, production and sales, located in Zhangcha, Foshan.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Quick Links</div>
        <ul>
          <li><a href="products.html">Products</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="../index.html">中文</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Contact</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 Zhangcha, Foshan, China</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 Foshan Hongshang Textile Co., Ltd. · All Rights Reserved</div>
  </footer>

  <script type="module" src="../assets/js/nav.js"></script>
  <script type="module" src="../assets/js/products.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create en/contact.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us — Hongshang Textile</title>
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-logo"><img src="../shop-pic/Homepage Image (4).jpg" alt="Hongshang Textile Logo"></div>
    <div class="nav-links">
      <a href="products.html">Products</a>
      <a href="about.html">About</a>
      <a href="contact.html" class="active">Contact</a>
      <a href="../contact.html" class="nav-lang">中文</a>
    </div>
    <button class="nav-menu-btn" aria-label="Menu"><span></span><span></span><span></span></button>
  </nav>
  <div class="nav-mobile">
    <a href="products.html">Products</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
    <a href="../contact.html" class="nav-lang">中文</a>
  </div>

  <div class="contact-layout">
    <div class="contact-info">
      <h2>Contact Us</h2>
      <p>Fill in the form and we'll reply within 1-2 business days. You can also reach us directly via the details below.</p>
      <div class="contact-item">
        <div class="contact-item-icon">📧</div>
        <div><div class="contact-item-label">EMAIL</div><div class="contact-item-value">contact@hongshang-textile.com</div></div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">💬</div>
        <div><div class="contact-item-label">WHATSAPP</div><div class="contact-item-value">+86 XXXX XXXX</div></div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">📍</div>
        <div><div class="contact-item-label">ADDRESS</div><div class="contact-item-value">Zhangcha, Chancheng, Foshan, Guangdong, China</div></div>
      </div>
      <div class="contact-item">
        <div class="contact-item-icon">🏭</div>
        <div><div class="contact-item-label">FACTORY</div><div class="contact-item-value">4,600㎡ · 50+ Machines</div></div>
      </div>
    </div>

    <div>
      <form id="inquiry-form" novalidate>
        <div class="form-group">
          <label for="name">Name <span class="required">*</span></label>
          <input type="text" id="name" name="name" class="form-control" placeholder="Your name" autocomplete="name">
          <div class="form-error" id="name-error"></div>
        </div>
        <div class="form-group">
          <label for="company">Company</label>
          <input type="text" id="company" name="company" class="form-control" placeholder="Company name (optional)" autocomplete="organization">
        </div>
        <div class="form-group">
          <label for="email">Email <span class="required">*</span></label>
          <input type="email" id="email" name="email" class="form-control" placeholder="your@email.com" autocomplete="email">
          <div class="form-error" id="email-error"></div>
        </div>
        <div class="form-group">
          <label for="whatsapp">WhatsApp / Phone</label>
          <input type="tel" id="whatsapp" name="whatsapp" class="form-control" placeholder="+1 or international number (optional)">
        </div>
        <div class="form-group">
          <label for="products">Product Interest</label>
          <select id="products" name="products" class="form-control">
            <option value="">Select (optional)</option>
            <option value="Cotton-Linen">Cotton-Linen</option>
            <option value="Dyed-Woven">Dyed-Woven</option>
            <option value="Jacquard">Jacquard</option>
            <option value="Rib">Rib</option>
            <option value="All-Cotton">All-Cotton</option>
            <option value="Woolen">Woolen</option>
            <option value="Warp Knit">Warp Knit</option>
            <option value="Blended">Blended</option>
          </select>
        </div>
        <div class="form-group">
          <label for="note">Notes / Requirements</label>
          <textarea id="note" name="note" class="form-control" placeholder="Please describe your fabric requirements: quantity, end use, special specifications, etc. (optional)"></textarea>
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Send Inquiry</button>
      </form>
      <div class="form-success" id="form-success">
        ✅ Thank you for your inquiry! We'll be in touch within 1-2 business days.
      </div>
    </div>
  </div>

  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand-name">Hongshang Textile</div>
        <div class="footer-brand-sub">FOSHAN HONGSHANG TEXTILE CO., LTD.</div>
        <p class="footer-brand-desc">A modern textile enterprise integrating R&amp;D, design, production and sales, located in Zhangcha, Foshan.</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Quick Links</div>
        <ul>
          <li><a href="products.html">Products</a></li>
          <li><a href="about.html">About</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="../index.html">中文</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Contact</div>
        <div class="footer-contact-item">📧 contact@hongshang-textile.com</div>
        <div class="footer-contact-item">💬 WhatsApp: +86 XXXX XXXX</div>
        <div class="footer-contact-item">📍 Zhangcha, Foshan, China</div>
      </div>
    </div>
    <div class="footer-bottom">© 2025 Foshan Hongshang Textile Co., Ltd. · All Rights Reserved</div>
  </footer>

  <script type="module" src="../assets/js/nav.js"></script>
  <script type="module" src="../assets/js/contact.js"></script>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add en/
git commit -m "feat: add English pages"
```

---

### Task 13: Cloudflare deployment

**Files:**
- Modify: `wrangler.toml` (add real KV ID)

- [ ] **Step 1: Create KV namespace**

```bash
npx wrangler kv namespace create INQUIRIES
```

Expected output includes a line like:
```
id = "abc123def456..."
```

Copy that ID.

- [ ] **Step 2: Update wrangler.toml with real KV ID**

Replace `YOUR_KV_NAMESPACE_ID` in `wrangler.toml` with the ID from Step 1:

```toml
[[kv_namespaces]]
binding = "INQUIRIES"
id = "abc123def456..."   # ← paste the real ID here
```

- [ ] **Step 3: Update contact details in all HTML files**

Search and replace these placeholders across all HTML files before going live:

| Placeholder | Replace with |
|---|---|
| `contact@hongshang-textile.com` | Real notification email |
| `+86 XXXX XXXX` | Real WhatsApp number |
| `noreply@yourdomain.com` in `wrangler.toml` `NOTIFY_FROM` | Sender email (must match your domain's SPF/DKIM) |
| `your@email.com` in `wrangler.toml` `NOTIFY_EMAIL` | Email where inquiries should arrive |

```bash
# Verify no placeholders remain
grep -r "XXXX XXXX\|your@email\|yourdomain" --include="*.html" --include="*.toml" .
```

Expected: no output (all placeholders replaced).

- [ ] **Step 4: Deploy Worker**

```bash
npx wrangler deploy
```

Expected: Worker deployed to `https://hongshang-inquiry.<your-account>.workers.dev`

- [ ] **Step 5: Connect Cloudflare Pages**

In the Cloudflare dashboard:
1. Go to **Workers & Pages → Create → Pages → Connect to Git**
2. Select the repository
3. Build settings: Framework preset = **None**, Build command = *(leave empty)*, Output directory = *(leave empty / root)*
4. Save and deploy

- [ ] **Step 6: Set Worker route**

In `wrangler.toml`, add a route so the Worker handles `/api/inquiry` on the Pages domain:

```toml
[[routes]]
pattern = "yourdomain.com/api/inquiry"
zone_name = "yourdomain.com"
```

Then redeploy the Worker:

```bash
npx wrangler deploy
```

- [ ] **Step 7: Run all tests one final time**

```bash
npm test
```

Expected: 15 tests pass.

- [ ] **Step 8: Final commit**

```bash
git add wrangler.toml
git commit -m "chore: configure CF KV namespace and deployment routes"
```
