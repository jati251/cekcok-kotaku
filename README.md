# Cekcok Kotaku 🎮⚔️🏙️

> **Cekcok Kotaku** is a high-performance retro social game desktop launcher built with **Tauri v2**, **Rust**, **React 19**, **TypeScript**, **Zustand**, and **Tailwind CSS**. It features full playable remasters of legendary social RTS & city-builder titles: **Empires & Allies** (2011) and **CityVille** (2010–2015).

---

## 🌟 Playable Games Roster

### 🏙️ 1. CityVille Retro (Complete 2010–2015 Gameplay Loop)
- **The Triangle Economy (Coins, Goods, Population):**
  - **Residences & Population:** Build Cottages, Suburban Homes, Brownstones, and High-Rise Luxury Condominiums. Citizens pay periodic rent in Coins.
  - **Community Buildings & Population Caps:** Civic facilities (*City Hall*, *Police Station*, *Firehouse*, *Post Office*) raise your city's maximum population capacity.
  - **Farming Plots & Crops:** Plow fertile plots and plant crops (*Strawberries*, *Carrots*, *Corn*, *Watermelon*) with real-time growth timers to harvest **Goods**.
  - **Businesses & Restocking:** Retail shops (*Sweet Crust Bakery*, *Java Perk Cafe*, *Toy Emporium*, *Starlight Cinema*) **consume Goods to open for business**. Citizens shop at stocked stores, paying massive Coin payouts and XP!
  - **Freight Shipping & Train Terminal:** Order long-distance cargo ships and freight trains for bulk Goods delivery.
  - **Urban Road Network & Traffic Simulation:** Paved asphalt streets with double-yellow lines and crosswalks, featuring animated yellow taxicabs, green goods delivery vans, and walking pedestrians.
  - **Decorations with Multipliers:** Granite fountains and botanical flower parks boost surrounding business payouts by $+5\%$ to $+10\%$.
  - **Story Quests:** Storyline directives from Mayor Samantha, Baker Pierre, and Farmer Paul.

---

### 🏝️ 2. Empires & Allies (Military Island RTS)
- **High-Fidelity 2.5D Isometric Engine:**
  - Diamond projection grid with smooth pan (mouse drag) and zoom ($0.5\times$ to $2.0\times$).
  - Animated shoreline foam, dynamic ocean waves, and tropical swaying palms.
  - Pre-rendered high-definition 2.5D isometric sprites for Headquarters, Barracks, Tank Foundry, and Airfield.
- **Authentic Building Suite:**
  - *Command Center / Headquarters (HQ)* ($3\times3$): Concrete bunker, helipad, and $360^\circ$ rotating radar.
  - *Military Barracks* ($2\times2$): Trains Vanguard Riflemen and Commandos.
  - *Armor Foundry* ($2\times2$): Heavy tank factory with animated rising smoke particles.
  - *Airfield Hangar* ($3\times3$): Supersonic jets on striped tarmac.
  - *Naval Port & Shipyard* ($3\times3$, Coastal): Coastal pier with moored patrol gunboats.
  - *Lumber Mill*, *Gold Treasury*, and *Fuel Refinery* (animated nodding pump jack).
- **Wilderness Clearing & Island Expansion:**
  - Clear wild jungle trees, granite boulders, and crashed drone wreckage to harvest resources and expand buildable ground.
- **Recruitment Depot & Army Reserve:**
  - Train 9 unique unit types across Infantry, Armor, Artillery, Aircraft, and Naval classes.
- **5-Sector Archipelago Campaign Map:**
  - Liberate island sectors from Raven Syndicate occupation and fight General Castor's boss dreadnought.
- **Turn-Based Combat Arena:**
  - 4v4 tactical engagement with Rock-Paper-Scissors advantage matrix (+60% Critical Damage).
  - Animated bullet tracers, ballistic artillery arcs with smoke trails, and explosive screen shake.
- **HQ War Room & Superweapons:**
  - Fabricate Tactical Warheads (Nukes), Orbital Ion Cannons, and Napalm Strikes with rare battlefield materials.
- **Allies Dock & Island Visits:**
  - Visit friendly commanders (*Major Foley*, *Captain Sophia*, *Lt. Ramirez*) and perform 5 daily assist actions for Honor points.

---

### 🚀 3. Desktop Game Launcher & Platform
- **Multi-Game Architecture:** Isolated game workspaces under `src/games/` separated cleanly from the launcher platform (`src/features/launcher/`).
- **Universal Retro Game Loading Screen:** Authentic social game launch splash screen featuring animated progress bars, live status readouts ("Calibrating radar...", "Paving avenues..."), and victory sound chimes upon completion.
- **Commander Profile & Ranks:** Real-time level progression, rank titles, and military stats.
- **Game Library Carousel:** Switch between **Empires & Allies** and **CityVille Retro** with dedicated "PLAY NOW" controls.
- **Audio & Grid Settings:** Real-time Web Audio synthesizer SFX volume, mute controls, and isometric grid overlays.
- **Native Rust Backend (Tauri v2):** Save state synchronization and real-world offline idle progression.
- **Husky Pre-commit Linter:** Pre-commit hook automatically verifies TypeScript compilation (`tsc`) and Vite bundle validation on every git commit.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Tauri v2](https://v2.tauri.app/)
- **Backend:** Rust 2021 edition (`serde`, `serde_json`, `tauri-plugin-opener`)
- **Frontend:** React 19 + TypeScript (Strict mode enabled, zero `any`)
- **Package Manager:** `pnpm`
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Git Hooks:** [Husky](https://typicode.github.io/husky/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Installation
```bash
# Clone the repository
git clone https://github.com/jati251/cekcok-kotaku.git
cd cekcok-kotaku

# Install dependencies using pnpm
pnpm install
```

### Running Locally
```bash
# Run Web Preview
pnpm dev

# Run Native Desktop App via Tauri
pnpm tauri dev
```

### Building for Production
```bash
# Typecheck & build web bundle (runs automatically via Husky before commit)
pnpm build

# Build standalone desktop installer
pnpm tauri build
```

---

## 🚢 Deployment to MinIO S3 & Auto-Updater

Cekcok Kotaku supports automated deployment of release artifacts (installers + auto-updater bundles) to a self-hosted MinIO object storage mirror at `https://releases.cekcok.my.id/cekcok-releases/`.

### 1. Automated CI/CD (GitHub Actions)
Triggered by pushing a version tag (e.g. `v0.1.0`) or via manual `workflow_dispatch`:
- Builds macOS (`aarch64`) DMG + `.app.tar.gz` updater archive.
- Builds Windows (`x64`) NSIS installer + `-setup.exe` signed updater artifact.
- Signs artifacts using `TAURI_SIGNING_PRIVATE_KEY` (Minisign).
- Uploads to MinIO bucket `s3://cekcok-releases/`.
- Publishes/merges the multi-platform updater manifest at `https://releases.cekcok.my.id/cekcok-releases/kotaku-latest.json`.

### 2. Local Deployment (`mc`)
You can build, sign, and deploy directly from your local machine using the MinIO Client:
```bash
# Build, sign, and upload to MinIO in one command
pnpm deploy
```

---

## 📜 License
MIT © [Jati Suryo](https://github.com/jati251)
