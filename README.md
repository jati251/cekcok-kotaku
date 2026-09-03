# Cekcok Kotaku 🎮⚔️

> **Cekcok Kotaku** is a high-performance retro social game desktop launcher built with **Tauri v2**, **Rust**, **React 19**, **TypeScript**, **Zustand**, and **Tailwind CSS**. It features a comprehensive, authentic remaster of the classic 2011 social RTS **Empires & Allies**, with rich 2.5D procedural isometric art and complete gameplay loops.

---

## 🌟 Full Feature Roster

### 🚀 1. Desktop Game Launcher
- **Commander Profile & Ranks:** Real-time level progression, rank titles, and military statistics.
- **Game Library Carousel:** Switch between titles, view feature checklists, and launch active games.
- **Audio & Grid Settings:** Real-time Web Audio SFX volume slider, mute toggle, and diamond grid overlay switches.
- **Save Sync & Rust Persistence:** Forced save triggers and safe reset options stored locally on disk.

### 🏝️ 2. Empires & Allies (Complete Gameplay Systems)
- **High-Fidelity 2.5D Isometric Engine:**
  - Diamond projection grid with smooth pan (mouse drag) and zoom ($0.5\times$ to $2.0\times$).
  - Animated multi-layer ocean with shoreline foam and dynamic waves washing onto the golden beach.
  - Natural tropical palm trees with swaying fronds and coconut clusters.
  - Accurate depth-sorting (Painter’s algorithm) so tall structures, antennas, and multi-tile buildings occlude tiles behind them.
- **Authentic Building Suite:**
  - *Command Center / Headquarters (HQ)* ($3\times3$): Reinforced concrete fortress, helipad, waving flag, and $360^\circ$ rotating radar.
  - *Military Town Hall* ($3\times3$): Raises base population limit by $+50$.
  - *Officer Cottages & Staff Quarters* ($2\times2$): Residential housing generating gold rent and housing recruits.
  - *Military Barracks* ($2\times2$): Trains Vanguard Riflemen and Commandos.
  - *Armor Foundry* ($2\times2$): Manufactures Grizzly & Mammoth Heavy Tanks; features industrial chimneys with animated rising smoke particles.
  - *Airfield Hangar* ($3\times3$): Houses Falcon Jets and Stealth Bombers on striped tarmac.
  - *Naval Shipyard* ($3\times3$, Coastal): Coastal pier extending into the water with moored patrol gunboats.
  - *Lumber Mill* ($2\times2$): Produces wood with rotating waterwheel and saw blades.
  - *Gold Treasury* ($2\times2$): Mints coins with timber minecart tracks and gold ore nuggets.
  - *Fuel Refinery* ($2\times2$): Animated nodding donkey pump jack rocking up and down.
  - *Patriot Defense Tower* ($1\times1$): Automated surface-to-air missile turret.
  - *Supply Roads & Fortified Sandbags* ($1\times1$).
- **Wilderness Clearing & Island Expansion:**
  - Unclaimed island borders contain wild jungle trees, granite boulders, and crashed drone wreckage.
  - Click any obstacle to spend Energy and Coins to clear the plot, harvest raw wood/coins/XP, and unlock ground for base construction.
- **Recruitment Depot & Army Reserve:**
  - Train 9 unique combat unit types across 5 classes (Infantry, Armor, Artillery, Aircraft, Naval).
  - Units are stored in your **Army Reserve** and deployed directly into battles.
  - Population and Housing checks manage recruit mobilization caps.
- **Archipelago Campaign Map (5 Sectors):**
  - Interactive world map with 5 escalating difficulty sectors:
    - *Sector 1: Outer Atoll* (Raven Recon Vanguard)
    - *Sector 2: Iron Shallows* (Coastal Amphibious Assault)
    - *Sector 3: Razor Ridge* (Fortified Howitzer Batteries)
    - *Sector 4: Black Sky Airfield* (Supersonic Interceptors)
    - *Sector 5: Fortress Castor* (Supreme Boss Encounter!)
  - Earn stars, massive resource bounties, and rare war materials upon liberation.
- **Combat with Projectile Ballistics & Screen Shake:**
  - 4v4 tactical engagement with Rock-Paper-Scissors advantage matrix (+60% Critical Damage on favored matchups).
  - Animated bullet tracers, tank shell ballistic arcs with smoke contrails, and guided missile plumes.
  - Impact explosions with dynamic **screen shake**!
  - Tactical support powers: Air Strike and Field Medikit.
- **HQ War Room & Superweapons:**
  - Collect rare battlefield materials (Aluminum, Steel, Rubber, Copper, Microchips) dropped from harvests and victories.
  - Fabricate superweapons in the War Room: **Tactical Warheads**, **Orbital Ion Cannons**, and **Napalm Carpet Bombs**!
- **Allies Dock & Neighbor Island Visits:**
  - Dock featuring friendly commanders (*Major Foley*, *Captain Sophia*, *Lt. Ramirez*).
  - Visit ally bases, perform 5 daily helper actions (speeding up and assisting installations), and earn valuable **Honor Points**!
- **Story Campaign Quests & Briefings:**
  - Step-by-step briefings from Major Foley and General Castor.
  - Collapsible Quest Tracker HUD with instant reward collection.
- **Synthesized Web Audio SFX:**
  - Pure Web Audio API oscillators for clicks, builds, coin chimes, gunfire, heavy shell explosions, and fanfares.

### 🦀 3. Native Rust Backend (Tauri v2)
- **Tauri IPC Commands:** State serialization to `~/.cekcok-kotaku/save_empires_and_allies.json`.
- **Offline Idle Simulation:** Accurately calculates elapsed real-world time delta while the application is closed to restore player energy (1 energy per 5 minutes) and generate passive island resources.

---

## 🛠️ Tech Stack

- **Desktop Framework:** [Tauri v2](https://v2.tauri.app/)
- **Backend:** Rust 2021 edition (`serde`, `serde_json`, `tauri-plugin-opener`)
- **Frontend:** React 19 + TypeScript (Strict mode enabled, zero `any`)
- **Package Manager:** `pnpm`
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Icons:** [Lucide React](https://lucide.dev/)
- **Visual FX:** [canvas-confetti](https://github.com/catdad/canvas-confetti)

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
# Run Web / Frontend Preview
pnpm dev

# Run Native Desktop App with Tauri
pnpm tauri dev
```

### Building for Production
```bash
# Typecheck & build web bundle
pnpm build

# Build standalone desktop installer
pnpm tauri build
```

---

## 📜 License
MIT © [Jati Suryo](https://github.com/jati251)
