# WZB Studio 个人作品集网站 — 资料包（可直接复制给豆包）

> 作者：志斌 / WZB Studio，定位 Space Stylist & Interior Curator（空间软装设计 / 室内策展 / 艺术作品）
> 用途：本文汇总了「网站是什么、线上链接在哪、本地文件在哪、怎么自己看、怎么给客户发链接、怎么正式上线、技术栈、文件结构、已知坑」。复制整篇发给豆包即可。

---

## 1. 这个网站是什么
- 个人作品集官网，深色高级感、画廊级排版。
- 主要板块：空间软装项目（01 WORK / Cases）、艺术作品（02 ARTWORKS：玻璃艺术 / 漆画 / 综合媒材）、摄影（Photography）、形象照（Portraits）、联系（Contact）。
- 交互：GSAP 动画 + Lenis 平滑滚动，全屏菜单，作品灯箱。

## 2. ✅ 线上链接（已验证可访问）
- **主站（当前可用）：** https://wzb-studio.wzb1019941527.workers.dev  （刚测返回 200，正常）
- 这个是最稳的公网地址，直接发给客户/自己手机看都行。

## 3. ⚠️ 已失效 / 需确认的链接（别用）
- https://wangzhibin.edgeone.app  → 实测 404，已失效
- https://orange-hall-8e6c.wzb1019941527.workers.dev  → 实测 404，已失效
- 自定义域名 wangzhibin.cn 的 SSL 之前卡死过，没走通。

## 4. 本地文件在哪
- **项目根目录：** `E:\woekbuddy  ai\2026-07-19-18-50-25`
  - ⚠️ 注意：`woekbuddy` 和 `ai` 之间是**双空格**，路径要原样复制。
- **Git 仓库：** https://github.com/wzb1019941527-cell/wzb-studio.git
- **本地启动说明：** 项目里的 `本地站说明.txt`
- **一键启动脚本：** 项目里的 `1启看站.bat`

## 5. 怎么自己看（最快，无需联网）
1. 进项目目录 `E:\woekbuddy  ai\2026-07-19-18-50-25`
2. **双击 `1启看站.bat`**
3. 自动打开浏览器 `http://localhost:8080`（端口被占会自动顺延 8081…）
4. 黑色 cmd 窗口别关，关了 = 关站
- 原理：用 Python 起 `dist/` 目录的静态服务（你电脑已装 Python）。
- 要求：`dist/` 里要有 `index.html`（即要先 `npm run build` 出包，已经出过了）。

## 6. 怎么给客户发「临时公网链接」
先按第 5 步双击 `1启看站.bat` 把站起起来，再二选一：
- **Cloudflare Tunnel（免费免注册）：** 下载 cloudflared.exe 放 PATH，另开 cmd 跑 `cloudflared tunnel --url http://localhost:8080`，会打印 `https://xxxx.trycloudflare.com`，谁都能看。
- **ngrok（免费需注册 token）：** `ngrok http 8080` 同样给一行临时链接。
- 注意：这都是「临时演示」，不适合长期站。

## 7. 怎么正式长期上线
- 构建：`npm run build` → 生成 `dist/`（当前约 **349 MB**，因为 work 项目是高清图）。
- 上线：把 `dist/` 整个拖到 **EdgeOne Pages / Vercel / Netlify** 任意一家即可（注册账号后基本是拖拽 + 绑域名）。
- 当前 349MB 偏大，部分平台有体积限制；要长期稳定建议先把图片压到最长边 1200 / q80 webp。

## 8. 技术栈
- React 18.3 + Vite 6 + TypeScript + Tailwind CSS v4
- 动画：GSAP；平滑滚动：Lenis
- 纯前端，无后端数据库；图片/数据走静态文件。

## 9. 页面与文件结构（想改东西看这里）
- 入口：`src/App.tsx`
- 组件目录 `src/components/`：
  - `Cases.tsx` —— 01 WORK 空间项目页（含淡色左右切换键）
  - `Artworks.tsx` —— 02 ARTWORKS 艺术作品页（三段式 Header + 全屏菜单）
  - `Photography.tsx` —— 摄影页（数据来自 public/photos/city/cityManifest.json）
  - `Portraits.tsx` —— 形象照页
  - `Contact.tsx` —— 联系页
  - `Header.tsx` / `Menu.tsx` / `Modal.tsx` / `Lightbox.tsx` / `Hero.tsx` / `SubGallery.tsx` 等
- 图片资源：`public/photos/`（子目录 art/、city/、portraits/、p01~p22 等几十个项目文件夹）+ `public/textures/`
- 构建配置：`vite.config.ts`（注意 `emptyOutDir:false`，因沙盒保护）

## 10. 最近改了什么（2026-08 这批）
- Cases 页新增淡雅左右切换键（比 ARTWORKS 模态里的更克制）。
- Artworks 顶部视觉与 Cases 统一为三段式 Header；关闭走菜单/ESC。
- 修复 Artworks 内 Menu 点不出目录（根因：菜单 z-index 被模态盖住，已从 90 改 100）。
- 优化菜单入场动画（去掉下坠顿挫，改淡入 + 短延迟）。

## 11. 已知坑（避坑用）
- **WorkBuddy 沙盒预览会「开不了」：** 沙盒会杀后台 dev server，所以 WorkBuddy 里的预览面板/链接不稳定。这不是代码问题，用本地 `1启看站.bat` 看最稳。
- **dist 349MB：** CloudStudio 60MB 限制过不去（会 504），别用 CloudStudio 部署这个站。
- **图片绝对路径：** 代码里图片用 `/photos/...` 绝对路径，必须靠服务器（http.server / 任意静态托管）才能显示，直接双击 `index.html` 用 file:// 打开会图裂。

## 12. 给豆包的一句话总结
「这是我用 React+Vite+TS+Tailwind 做的个人作品集官网（WZB Studio，空间软装/艺术），本地项目在 E:\woekbuddy  ai\2026-07-19-18-50-25，已上线地址 https://wzb-studio.wzb1019941527.workers.dev 。我想（在这里写你的需求，比如：压图后部署到 EdgeOne Pages / 加一个博客页 / 改首页文案）。」
