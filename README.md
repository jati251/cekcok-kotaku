# Cekcok Kotaku 🎮⚔️

> **Cekcok Kotaku** is a high-performance retro social game desktop launcher built with **Tauri v2**, **Rust**, **React 19**, **TypeScript**, **Zustand**, and **Tailwind CSS**. It includes a recreation of the classic 2011 social RTS **Empires & Allies**, alongside upcoming roadmap placeholders for nostalgic classics like **CityVille**.

---

## 🌟 Features

### 🚀 1. Desktop Game Launcher
- **Commander Profile & Ranks:** Real-time level progression, rank titles, and military stats.
- **Game Library Carousel:** Switch between titles, view feature checklists, and quick-launch active games.
- **Audio & Grid Settings:** Real-time Web Audio SFX volume slider, mute toggle, and visual diamond grid overlay switches.
- **Local Persistence & Save Sync:** Forced save triggers and safe reset options stored locally on disk.

### 🏝️ 2. Empires & Allies (Playable Game)
- **60fps Isometric Canvas Engine:**
  - Diamond projection grid with smooth pan (drag) and zoom (scroll wheel / buttons: 0.5x – 2.0x).
  - Multi-layer procedural rendering: ocean wave ripples, golden sand shoreline, lush grassland tiles, asphalt roads.
  - Accurate depth-sorting (Painter’s algorithm) so structures and multi-tile buildings occlude tiles behind them.
  - Hover cursor with real-time collision detection (green when clear, red when colliding or out of bounds).
- **Base Building & Production Loop:**
  - *Command Center / Headquarters (HQ)* (3x3)
  - *Military Barracks* (2x2)
  - *Armor Foundry / Tank Factory* (2x2)
  - *Airfield Hangar* (3x3)
  - *Lumber Mill* (2x2, yields wood over time)
  - *Gold Treasury* (2x2, yields gold coins over time)
  - *Fuel Refinery* (2x2, yields oil over time)
  - *Patriot Defense Tower* (1x1)
  - *Supply Roads & Sandbags* (1x1)
  - Floating harvest bubbles (click-to-collect bouncing coin/wood/oil icons when production cycles complete).
  - Interactive Building Inspector (view details, move structures across the island, demolish).
- **Tactical Turn-Based Combat Arena:**
  - 4v4 combat lanes: Vanguard Squad (Player) vs Raven Syndicate Invaders.
  - **Rock-Paper-Scissors Advantage Matrix:**
    - *Infantry* > *Artillery* (+60% Critical Damage)
    - *Artillery* > *Armor* (+60% Critical Damage)
    - *Armor* > *Infantry* (+60% Critical Damage)
    - *Fighter Jet* > *Naval Gunboats* (+60% Critical Damage)
  - Tactical support powers: Call in **Airstrikes** (area-of-effect bombardment) or deploy **Field Medikits** (+70 HP squad repair).
  - Floating damage numbers, combat ticker log, victory fanfare, and confetti celebrations.
- **Story Quests & Military Briefings:**
  - Advisor dialogue modals featuring Major Foley and General Castor.
  - Collapsible Campaign Directives HUD with progress bars and instant reward collection.
- **Synthesized Web Audio SFX:**
  - Crisp retro sound effects created purely via Web Audio API oscillators (button clicks, building placement, gold chimes, gunfire, artillery explosions, victory fanfares) with zero external audio asset loading risk.

### 🦀 3. Native Rust Backend (Tauri v2)
- **Tauri IPC Commands:** State serialization to `~/.cekcok-kotaku/save_empires_and_allies.json`.
- **Offline Idle Simulation:** Accurately calculates elapsed real-world time delta while the application is closed to restore player energy (1 energy per 5 minutes) and generate passive island resources.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Tauri v2](https://v2.tauri.app/)
- **Backend:** Rust 2021 edition (`serde`, `serde_json`, `tauri-plugin-opener`)
- **Frontend:** React 19 + TypeScript (Strict mode enabled, zero `any`)
- **Package Manager:** `pnpm`
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (Feature-driven vertical slice structure)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Visual FX:** [canvas-confetti](https://github.com/catdad/canvas-confetti)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`corepack enable pnpm` or `npm i -g pnpm`)
- [Rust](https://www.rust-lang.org/) (rustc, cargo)

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
# Run Web / Frontend Preview
pnpm dev

# Run Native Desktop App with Tauri
pnpm tauri dev
```

### Building for Production
```bash
# Typecheck & build web bundle
pnpm build

# Build standalone desktop installer (.app / .dmg / .exe / .deb)
pnpm tauri build
```

---

## 📂 Project Structure

```text
cekcok-kotaku/
├── src-tauri/
│   ├── src/
│   │   ├── commands.rs       # Tauri IPC commands (save/load, offline progress)
│   │   ├── state.rs          # Serializable Rust game state & resources schema
│   │   ├── lib.rs            # Tauri setup & command registration
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json       # App metadata & window sizing
├── src/
│   ├── app/                  # Route layouts
│   ├── components/ui/        # Reusable primitives (Button, Modal, Badge)
│   ├── config/               # Building catalogs, unit advantage definitions, quests
│   ├── features/             # Feature-driven vertical slices
│   │   ├── launcher/         # Game cards, carousel, launcher header, settings
│   │   ├── city-builder/     # Isometric canvas engine, build menu, inspector
│   │   ├── combat/           # Turn-based 4v4 battle arena, tactical powers
│   │   ├── economy/          # Resource HUD, energy timers, level calculations
│   │   └── quests/           # Story dialogue modals, quest tracker HUD
│   ├── services/             # Tauri bridge & game persistence manager
│   ├── stores/               # Zustand global stores (launcherStore)
│   ├── types/                # Global TypeScript definitions
│   ├── utils/                # Audio synthesizer (Web Audio API)
│   ├── App.tsx               # Main application entry switcher
│   ├── index.css             # Tailwind v4 theme & tactical font tokens
│   └── main.tsx              # Hydration & React root
└── package.json
```

---

## 📜 License
MIT © [Jati Suryo](https://github.com/jati251)
