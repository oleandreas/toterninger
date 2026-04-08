# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Toterninger is an interactive two-dice roller web app, primarily designed for Settlers of Catan. It features animated dice, shake-to-roll on mobile, sound effects, roll statistics with contextual analysis, and a Catan mode that highlights when the robber (7) is rolled.

## Commands

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Type-check with vue-tsc then build for production
- `npm run preview` — Preview the production build locally

## Architecture

- **Framework:** Vue 3 with Composition API and `<script setup>` SFCs
- **Language:** TypeScript (strict mode via `tsconfig.app.json`)
- **Bundler:** Vite 8 with `@vitejs/plugin-vue`
- **Entry point:** `index.html` → `src/main.ts` → `src/App.vue`
- **UI language:** Norwegian (bokmål)

### Key Architecture Decisions

- **Tab-based SPA**: `App.vue` manages three tabs (Kast, Statistikk, Innstillinger) with `v-if` — no router needed
- **Composables for shared state**: Settings, statistics, and shake detection are extracted into `src/composables/`. Settings and stats use reactive singletons persisted to localStorage
- **Web Audio API for sound**: Dice sounds are synthesized procedurally in `useSound.ts` — no audio files needed
- **CSS dice faces**: `DiceFace.vue` renders dot patterns using CSS Grid — no images or canvas
- **DeviceMotion API**: `useShake.ts` detects phone shaking with iOS 13+ permission handling

### Catan Mode

When enabled (default), the sum is displayed prominently. Rolling a 7 triggers a pulsing red alarm with "Flytt røveren!" text. The number 7 is highlighted red throughout the statistics view.

## Conventions

- Use `<script setup lang="ts">` in Vue SFCs
- ES modules (`"type": "module"` in package.json)
- TypeScript config is split: `tsconfig.app.json` for app code, `tsconfig.node.json` for Vite/Node config
- All user-facing text is in Norwegian
