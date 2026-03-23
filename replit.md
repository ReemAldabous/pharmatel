# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec) — shared libs only
- **Build**: esbuild / Vite (per package)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── mockup-sandbox/     # Vite sandbox
│   └── pharmatel/          # PharmaTel Expo mobile app (mock data + AsyncStorage)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval config
│   ├── api-client-react/   # Generated React Query hooks
│   └── api-zod/            # Generated Zod schemas
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## PharmaTel App (`artifacts/pharmatel`)

Expo + React Native app. **Data is local only**: `services/mockData.ts` seeds content; `services/storage.ts` persists with **AsyncStorage** (no backend, no database).

### Demo credentials

- Username: `john.doe`
- Password: `password123`

### Key files

- `context/AppContext.tsx` — global state
- `services/mockData.ts` — static demo data
- `services/storage.ts` — AsyncStorage read/write

## Root scripts

- `pnpm run build` — typecheck then recursive `build` in packages
- `pnpm run typecheck` — TypeScript project references
