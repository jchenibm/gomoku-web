# Gomoku Web (原生 HTML/CSS/JS)

一个使用原生 HTML/CSS/JS 搭建的五子棋（Gomoku）Web 项目骨架，包含基础页面、目录结构与 GitHub Pages 自动发布配置。后续任务将逐步实现规则、对局状态、AI 与性能优化等。

## 线上预览（GitHub Pages）

启用后访问：

- https://<your-username>.github.io/gomoku-web/

> 提示：仓库 Settings → Pages 中将 Source 选择为 "GitHub Actions"，并合并本分支到 main 后推送，即可自动部署。

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
│   ├── ai
│   │   ├── evaluator.js
│   │   ├── moveGenerator.js
│   │   └── search.js
│   └── worker
│       └── aiWorker.js
├── assets
│   └── sounds
│       ├── place.wav
│       ├── win.mp3
│       └── hint.wav
└── .github
    └── workflows
        └── pages.yml
```

所有 `src/**` 文件目前为占位与基础框架，方便后续直接填充实现。

## 本地开发 / 预览

项目无需构建步骤，直接作为静态站点运行。你可以使用任何静态服务器方案，例如：

- 使用 npm 生态：
  - `npx serve .`  # 需要 Node.js 环境
- 使用 Python：
  - `python3 -m http.server 5173`

启动后在浏览器访问终端输出的本地地址（如 http://localhost:3000 或 http://localhost:5173）。

## GitHub Pages 自动发布

本仓库已配置 GitHub Actions Workflow（`.github/workflows/pages.yml`）：

- 触发：对 `main` 分支的 push 或手动 `workflow_dispatch`；
- 构建：对纯静态站点无需额外构建，直接上传仓库根目录作为制品；
- 部署：使用官方 `actions/deploy-pages` 部署到 GitHub Pages。

首次启用需在仓库 Settings → Pages 将 Source 选择为 "GitHub Actions"。

## License

MIT
