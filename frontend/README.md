# NASA Front

React + TypeScript + Vite starter organized with Feature-Sliced Design.

## Commands

```bash
npm install
npm run dev
npm run build
```

## FSD layers

Dependencies should flow downward: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.

- `src/app` — application bootstrap, providers, routing, and global styles
- `src/pages` — route-level composition
- `src/widgets` — large reusable page blocks
- `src/features` — user interactions and business scenarios
- `src/entities` — domain models and entity UI
- `src/shared` — reusable UI, API clients, utilities, and configuration

Each slice exposes a public API from its `index.ts`; import through aliases instead of reaching into another slice's internals.
