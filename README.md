<div align="center">
  <a href="docs/images/banner-ocean-dark.svg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-ocean-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="docs/images/banner-ocean-light.svg">
      <img alt="OctoClash Header" src="docs/images/banner-ocean-dark.svg" width="100%">
    </picture>
  </a>

  <p align="center">
    <strong>Compare GitHub repositories side-by-side with high-density metrics, deep analytics, and publication-ready battle cards.</strong>
  </p>

  <p align="center">
    <a href="https://jovanjorelli.github.io/OctoClash/"><img src="https://img.shields.io/badge/Launch_App-0969da?style=flat&logo=github&logoColor=white" alt="Launch App" /></a>&nbsp;
    <a href="#features"><img src="https://img.shields.io/badge/Key_Features-8250df?style=flat&logo=octocat&logoColor=white" alt="Key Features" /></a>&nbsp;
    <a href="#interface-gallery"><img src="https://img.shields.io/badge/Gallery-Showcase-bf8700?style=flat&logo=image&logoColor=white" alt="Gallery" /></a>&nbsp;
    <a href="https://github.com/jovanjorelli/OctoClash/tags"><img src="https://img.shields.io/badge/Version-v1.0.2-1f883d?style=flat&logo=git&logoColor=white" alt="Version" /></a>&nbsp;
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2da44e?style=flat&logo=open-source-initiative&logoColor=white" alt="MIT License" /></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React 19" />&nbsp;
    <img src="https://img.shields.io/badge/Vite_8.3-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite 8.3" />&nbsp;
    <img src="https://img.shields.io/badge/Tailwind_3.4-06B6D4?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />&nbsp;
    <img src="https://img.shields.io/badge/Primer_Tokens-24292f?style=flat&logo=github&logoColor=white" alt="Primer Tokens" />&nbsp;
    <img src="https://img.shields.io/badge/Tests-22%2F22_Passed-2da44e?style=flat&logo=vitest&logoColor=white" alt="Vitest 22/22 Passed" />
  </p>

  <br />

  <a href="docs/images/octoclash-dark-preview.png">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/images/octoclash-dark-preview.png">
      <source media="(prefers-color-scheme: light)" srcset="docs/images/octoclash-light-preview.png">
      <img alt="OctoClash Comparison Matrix" src="docs/images/octoclash-dark-preview.png" width="100%">
    </picture>
  </a>
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

<a href="docs/images/battle-card-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/battle-card-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/battle-card-light.png">
    <img alt="OctoClash Battle Card" src="docs/images/battle-card-dark.png" width="100%">
  </picture>
</a>

### 📈 Multi-Angle Charts View
Instantly pivot from the tabular matrix into interactive visual charts:
- Health and maintenance scores
- Star growth trajectories from project inception to present with pagination synthesis
- Update frequency and commit volume
- Top contributor community benchmarks

<a href="docs/images/charts-dark-preview.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/charts-dark-preview.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/charts-light-preview.png">
    <img alt="OctoClash Charts View" src="docs/images/charts-dark-preview.png" width="100%">
  </picture>
</a>

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
| **Core Framework** | React 19 | Concurrent rendering, zero-overhead component trees |
| **Build Tooling** | Vite 8.3 | Rapid HMR, optimized tree-shaking and Rollup asset pipeline |
| **Design System** | Primer Design Tokens + Tailwind CSS | Native GitHub aesthetics, WCAG AAA contrast ratios |
| **Interaction Engine** | `@dnd-kit` | Accessible pointer & keyboard drag-and-drop mechanics |
| **State Management** | Zustand 5 | Lightweight immutable state with localStorage persistence |
| **Rendering Engine** | Native HTML5 Canvas 2D | In-memory image generation with zero backend dependencies |
| **Sanitizer** | DOMPurify | Strict XSS defense for external README markup |
| **Icons** | `@primer/octicons-react` | GitHub native iconography |

---

## 🔑 GitHub API Limits & PAT Support

OctoClash operates out-of-the-box using the public GitHub API (60 requests/hr per IP).

For uninterrupted high-volume comparisons:
1. Enter a GitHub Personal Access Token (PAT) directly into the token input in the footer (or click **Get PAT** to generate one on GitHub).
2. Your rate limit raises to **5,000 requests/hr**. The token is stored strictly in your browser session storage and is never sent to any external server.

---

<a id="interface-gallery"></a>
## 🖼️ Interface Gallery

Comprehensive visual showcase across dark and light themes:

### 🚀 Interactive Preset Launchpad
<a href="docs/images/launchpad-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/launchpad-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/launchpad-light.png">
    <img alt="Interactive Preset Launchpad" src="docs/images/launchpad-dark.png" width="100%">
  </picture>
</a>

### 📊 Comparison Matrix & Benchmarks
<a href="docs/images/octoclash-dark-preview.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/octoclash-dark-preview.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/octoclash-light-preview.png">
    <img alt="Comparison Matrix" src="docs/images/octoclash-dark-preview.png" width="100%">
  </picture>
</a>

### ♾️ Infinite Mode Multi-Repository View
<a href="docs/images/infinite-mode-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/infinite-mode-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/infinite-mode-light.png">
    <img alt="Infinite Mode Multi-Repository View" src="docs/images/infinite-mode-dark.png" width="100%">
  </picture>
</a>

### 📈 Multi-Angle Analytics & Velocity Charts
<a href="docs/images/charts-dark-preview.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/charts-dark-preview.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/charts-light-preview.png">
    <img alt="Charts View" src="docs/images/charts-dark-preview.png" width="100%">
  </picture>
</a>

### 🎯 Comparative Metrics & Statistical Summary
<a href="docs/images/radar-benchmark-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/radar-benchmark-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/radar-benchmark-light.png">
    <img alt="Comparative Metrics and Statistical Summary" src="docs/images/radar-benchmark-dark.png" width="100%">
  </picture>
</a>

### 🌐 Language Distribution Matrix
<a href="docs/images/languages-breakdown-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/languages-breakdown-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/languages-breakdown-light.png">
    <img alt="Language Distribution Matrix" src="docs/images/languages-breakdown-dark.png" width="100%">
  </picture>
</a>

### 👥 Interactive Maintainers & Contributor Profiles
Hovering over any contributor avatar renders an accessible tooltip with their GitHub handle; clicking opens their profile directly in a new tab:

<a href="docs/images/contributors-table-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/contributors-table-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/contributors-table-light.png">
    <img alt="Matrix Contributor Hover Tooltip" src="docs/images/contributors-table-dark.png" width="100%">
  </picture>
</a>

<a href="docs/images/contributors-grid-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/contributors-grid-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/contributors-grid-light.png">
    <img alt="Charts Contributor Breakdown Tooltip" src="docs/images/contributors-grid-dark.png" width="100%">
  </picture>
</a>

### 🎴 Battle Card Generator (2x Retina Density)
<a href="docs/images/battle-card-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/battle-card-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/battle-card-light.png">
    <img alt="Battle Card" src="docs/images/battle-card-dark.png" width="100%">
  </picture>
</a>

### ⚙️ Column Customization Panel
<a href="docs/images/settings-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/settings-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/settings-light.png">
    <img alt="Column Customization" src="docs/images/settings-dark.png" width="100%">
  </picture>
</a>

### 📖 In-App README Viewer Modal
<a href="docs/images/readme-modal-dark.png">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme-modal-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/readme-modal-light.png">
    <img alt="README Viewer" src="docs/images/readme-modal-dark.png" width="100%">
  </picture>
</a>

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
