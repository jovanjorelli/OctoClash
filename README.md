<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-ocean-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/banner-ocean-light.svg">
    <img alt="OctoClash Header" src="docs/images/banner-ocean-dark.svg" width="100%">
  </picture>

  <p align="center">
    <strong>Compare GitHub repositories side-by-side with high-density metrics, deep analytics, and publication-ready battle cards.</strong>
  </p>

  <p align="center">
    <a href="https://jovanjorelli.github.io/OctoClash/"><img src="https://img.shields.io/badge/Launch_App-0969da?style=flat&logo=github&logoColor=white" alt="Launch App" /></a>&nbsp;
    <a href="#features"><img src="https://img.shields.io/badge/Key_Features-8250df?style=flat&logo=octocat&logoColor=white" alt="Key Features" /></a>&nbsp;
    <a href="versions/"><img src="https://img.shields.io/badge/Versions-v1.0.0-1f883d?style=flat&logo=archive&logoColor=white" alt="Versions" /></a>&nbsp;
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2da44e?style=flat&logo=open-source-initiative&logoColor=white" alt="MIT License" /></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React 18" />&nbsp;
    <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite 8" />&nbsp;
    <img src="https://img.shields.io/badge/Tailwind_3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />&nbsp;
    <img src="https://img.shields.io/badge/Primer_Tokens-24292f?style=flat&logo=github&logoColor=white" alt="Primer Tokens" />&nbsp;
    <img src="https://img.shields.io/badge/Tests-22%2F22_Passed-2da44e?style=flat&logo=vitest&logoColor=white" alt="Vitest 22/22 Passed" />&nbsp;
    <img src="https://img.shields.io/badge/Deploy-GitHub_Pages-0969da?style=flat&logo=github-pages&logoColor=white" alt="GitHub Pages" />
  </p>

  <br />

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/octoclash-dark-preview.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/octoclash-light-preview.png">
    <img alt="OctoClash Comparison Matrix" src="docs/images/octoclash-dark-preview.png" width="100%">
  </picture>
</div>

---

## ⚡ Overview

**OctoClash** is a client-side benchmarking and intelligence suite for evaluating open-source software. Compare any combination of GitHub repositories across activity velocity, release cadences, maintenance health scores, weekly package registry volume, and community size without installing software or creating an account.

Everything runs directly in the browser: state is synced to URL permalinks, comparisons export as structured datasets (CSV / JSON), and graphics render directly via an in-memory Canvas 2D engine.

---

<a id="features"></a>
## 🚀 Key Features

### 📊 Dense Comparison Matrix
- **52-Week Commit Velocity**: Real-time activity sparklines calculated per repository.
- **Maintenance Health Score**: Algorithmic rating (0–100) factoring in release freshness, issue closure turnaround, SPDX licensing, and active maintainer depth (`A+` through `F`).
- **NPM Weekly Traction**: Live download statistics pulled directly from the npm registry.
- **Interactive Maintainers & Top Contributors**: Hover avatars in the matrix or charts to inspect GitHub handles in accessible tooltips, and click to navigate directly to their GitHub profiles.
- **Drag-and-Drop Reordering**: Tactile row reordering powered by `@dnd-kit` with keyboard and pointer sensor precision.
- **Multi-State Column Sorting**: Sort by stars, forks, issues, size, or health score with asc/desc/reset states.
- **Customizable Columns**: Hide or display any metric via the settings panel.
- **In-App README Viewer**: Built-in modal with DOMPurify sanitization and GitHub dark/light mode image compatibility.

### 🎴 Battle Card PNG Engine (Multi-Part Infinite Export)
Synthesize battle cards for social sharing, technical documentation, or engineering reviews:
- Rendered on-the-fly via native HTML5 Canvas at 2x retina density.
- Independent Theme Switcher: Export in dark or light mode regardless of current UI theme.
- **Infinite Mode Multi-Part Generation**: When comparing more than 10 repositories, the export engine automatically chunks cards into 10-repo parts (`Part 1 of N`, `Part 2 of N`), downloading each part sequentially.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/battle-card-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/battle-card-light.png">
  <img alt="OctoClash Battle Card" src="docs/images/battle-card-dark.png" width="100%">
</picture>

### 📈 Multi-Angle Charts View
Instantly pivot from the tabular matrix into interactive visual charts:
- Health and maintenance scores
- Star growth trajectories from project inception to present with pagination synthesis
- Update frequency and commit volume
- Top contributor community benchmarks

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/charts-dark-preview.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/charts-light-preview.png">
  <img alt="OctoClash Charts View" src="docs/images/charts-dark-preview.png" width="100%">
</picture>

### 🎯 Curated Presets
One-click presets across key modern developer ecosystems:
- **Frontend**: React vs. Vue vs. Svelte
- **Fullstack**: Next.js vs. Nuxt vs. SvelteKit vs. Remix vs. Astro
- **Runtimes**: Node.js vs. Deno vs. Bun
- **Backend**: Express vs. Fastify vs. NestJS vs. Koa vs. Hono
- **Mega Clash**: Top 10 Web Titans loaded simultaneously

---

## 🛠 Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Core Framework** | React 18 | Concurrent rendering, zero-overhead component trees |
| **Build Tooling** | Vite 8 | Rapid HMR, optimized tree-shaking and Rollup asset pipeline |
| **Design System** | Primer Design Tokens + Tailwind CSS | Native GitHub aesthetics, WCAG AAA contrast ratios |
| **Interaction Engine** | `@dnd-kit` | Accessible pointer & keyboard drag-and-drop mechanics |
| **State Management** | Zustand 5 | Lightweight immutable state with localStorage persistence |
| **Rendering Engine** | Native HTML5 Canvas 2D | In-memory image generation with zero backend dependencies |
| **Sanitizer** | DOMPurify | Strict XSS defense for external README markup |
| **Icons** | `@primer/octicons-react` | GitHub native iconography |

---

## 💻 Quickstart

### Prerequisites
- Node.js 18.0.0 or higher
- npm

### Installation
```bash
git clone https://github.com/jovanjorelli/OctoClash.git
cd OctoClash
npm install
```

### Development
```bash
npm run dev
```

### Full Verification Pipeline
Runs linting, unit tests, and production build in a single pass:
```bash
npm run check
```

### Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🔑 GitHub API Limits & PAT Support

OctoClash operates out-of-the-box using the public GitHub API (60 requests/hr per IP).

For uninterrupted high-volume comparisons:
1. Enter a GitHub Personal Access Token (PAT) directly into the token input in the footer (or click **Get PAT** to generate one on GitHub).
2. Your rate limit raises to **5,000 requests/hr**. The token is stored strictly in your browser session storage and is never sent to any external server.

---

## 📦 Release Archives

Offline source distribution compressed with maximum ratio is maintained in [`versions/`](versions/):

| Version | Distribution | Compression Algorithm | Package |
|---|---|---|---|
| **v1.0.0** | Source Archive | Maximum Deflate (Level 9) | [`v1.0.0.zip`](versions/v1.0.0.zip) |

---

## 🖼️ Interface Gallery

Comprehensive visual showcase across dark and light themes:

### 📊 Comparison Matrix & Benchmarks
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/octoclash-dark-preview.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/octoclash-light-preview.png">
  <img alt="Comparison Matrix" src="docs/images/octoclash-dark-preview.png" width="100%">
</picture>

### 📈 Multi-Angle Analytics & Velocity Charts
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/charts-dark-preview.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/charts-light-preview.png">
  <img alt="Charts View" src="docs/images/charts-dark-preview.png" width="100%">
</picture>

### 👥 Interactive Maintainers & Contributor Profiles
Hovering over any contributor avatar renders an accessible tooltip with their GitHub handle; clicking opens their profile directly in a new tab:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/contributors-table-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/contributors-table-light.png">
  <img alt="Matrix Contributor Hover Tooltip" src="docs/images/contributors-table-dark.png" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/contributors-grid-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/contributors-grid-light.png">
  <img alt="Charts Contributor Breakdown Tooltip" src="docs/images/contributors-grid-dark.png" width="100%">
</picture>

### 🎴 Battle Card Generator (2x Retina Density)
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/battle-card-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/battle-card-light.png">
  <img alt="Battle Card" src="docs/images/battle-card-dark.png" width="100%">
</picture>

### ⚙️ Column Customization Panel
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/settings-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/settings-light.png">
  <img alt="Column Customization" src="docs/images/settings-dark.png" width="100%">
</picture>

### 📖 In-App README Viewer Modal
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-modal-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/readme-modal-light.png">
  <img alt="README Viewer" src="docs/images/readme-modal-dark.png" width="100%">
</picture>

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
