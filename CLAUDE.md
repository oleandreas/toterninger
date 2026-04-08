# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

toterninger.no is an interactive dice game web application built with Vue 3, TypeScript, and Vite.

## Commands

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Type-check with vue-tsc then build for production
- `npm run preview` — Preview the production build locally

## Architecture

- **Framework:** Vue 3 with Composition API and `<script setup>` SFCs
- **Language:** TypeScript (strict mode via `tsconfig.app.json`)
- **Bundler:** Vite 8 with `@vitejs/plugin-vue`
- **Entry point:** `index.html` → `src/main.ts` → `src/App.vue`

### Source Layout

```
src/
  main.ts          — App bootstrap, mounts to #app
  App.vue          — Root component
  style.css        — Global styles
  assets/          — Static assets (images, SVGs)
  components/      — Vue single-file components
```

## Conventions

- Use `<script setup lang="ts">` in Vue SFCs
- The project uses ES modules (`"type": "module"` in package.json)
- TypeScript config is split: `tsconfig.app.json` for app code, `tsconfig.node.json` for Vite/Node config
