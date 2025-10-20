# Gomoku Web (原生 HTML/CSS/JS)

一个使用原生 HTML/CSS/JS 搭建的五子棋（Gomoku）Web 项目，包含提示（AI 建议落点）、移动端触控优化与基础对局逻辑。

## 在线试玩

GitHub Pages（启用后将自动发布）：

- https://<your-username>.github.io/gomoku-web/

> 提示：仓库 Settings → Pages 中将 Source 选择为 "GitHub Actions"，并合并本分支到 main 后推送，即可自动部署。

## 功能概览

- 棋盘与落子：点击/触控即可在 15x15 棋盘落子，支持悔棋与重开；
- 胜负判定：内置五连检测；
- 提示（Hint）：基于当前局面与玩家视角，调用轻量搜索（生成候选、启发式评估、α-β 剪枝）在 2 秒内给出建议点；
  - 建议点以半透明标记显示，并播放提示音；
  - 计算期间提示按钮禁用，并显示加载指示；
  - 对弈结束后自动隐藏提示；
- 移动端优化：
  - 触控容差：对点击位置做容差处理，减少误触；
  - 控件尺寸与布局自适配小屏；

## 目录结构

```
.
├── index.html
├── styles.css
├── src
│   ├── main.js
│   ├── game
│   │   ├── board.js
│   │   ├── rules.js
│   │   ├── gameState.js
│   │   ├── ui.js
│   │   └── sounds.js
│   └── ai
│       ├── evaluator.js
│       ├── moveGenerator.js
│       └── search.js
├── assets
│   └── sounds
│       ├── place.wav
│       ├── win.mp3
│       └── hint.wav
└── .github
    └── workflows
        └── pages.yml
```

## 使用说明

- 点击棋盘放置当前方（黑/白）棋子；
- 点击「提示」按钮获取建议落子点（半透明标记），再次落子后提示会自动清除；
- 「悔棋」撤销上一步；「重开」重新开始；
- 右侧开关可打开/关闭音效；

## 本地开发 / 预览

作为静态站点运行，可使用任一静态服务器：

- 使用 npm 生态：
  - `npx serve .`  # 需要 Node.js 环境
- 使用 Python：
  - `python3 -m http.server 5173`

启动后访问终端输出的本地地址（如 http://localhost:3000 或 http://localhost:5173）。

## 轻量测试

使用 Vitest 提供基础单元/烟雾测试：

- 胜负判定单元：`tests/rules.test.js`
- 搜索烟雾测试：`tests/search.smoke.test.js`（确保在 2 秒内返回建议点）

运行：

```
npm i
npm test
```

## GitHub Pages 自动发布

本仓库已配置 GitHub Actions Workflow（`.github/workflows/pages.yml`）：

- 触发：对 `main` 分支的 push 或手动 `workflow_dispatch`；
- 构建：对纯静态站点无需额外构建，直接上传仓库根目录作为制品；
- 部署：使用官方 `actions/deploy-pages` 部署到 GitHub Pages。

首次启用需在仓库 Settings → Pages 将 Source 选择为 "GitHub Actions"。

## License

MIT
