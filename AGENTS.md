# Repository Guidelines

## Project Structure & Module Organization

Zefer Smart Map is a premium real estate map for developments in Penha, Picarras, Porto Belo, Itapema, and Navegantes. It uses Next.js, TypeScript, Tailwind CSS, Mapbox GL JS, and Supabase. Application code lives in `src/app/`: `layout.tsx` defines the root shell, `page.tsx` is the home route, and `globals.css` contains Tailwind v4 and global tokens. Static assets belong in `public/`.

Keep code organized into small components. Prefer `src/components/`, `src/lib/`, `src/data/`, and `src/types/` as the app grows. Put mocked developments in `src/data/`, shaped so Supabase queries can later replace them without rewriting UI components.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local development server, usually at `http://localhost:3000`.
- `npm run build`: create a production Next.js build and run framework checks.
- `npm run start`: serve the production build after `npm run build`.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Keep route files lowercase and framework-named (`page.tsx`, `layout.tsx`, `loading.tsx`), and use PascalCase for reusable components. Prefer the `@/*` alias for `src/` imports. Follow the existing two-space indentation, double quotes, semicolons, and Tailwind utilities. Keep global CSS limited to tokens and base styles.

## Product & Design Direction

Build a sophisticated, technological, premium real estate experience. Use a restrained black, gold, and white visual language with responsive layouts. Prioritize the MVP: an elegant interactive map, mocked developments, and simple filters or cards when they support presentation. Prepare for Supabase, but skip dashboards, authentication, admin tools, and complex workflows until needed.

## Testing Guidelines

No test runner is configured yet, so treat `npm run lint` and `npm run build` as required checks. If tests are introduced, add `npm test`, use names like `Home.test.tsx`, and cover route behavior, rendering states, and user-visible interactions.

## Commit & Pull Request Guidelines

Current history only shows the Create Next App initial commit, so use clear imperative commits such as `Add map search panel` or `Fix mobile layout spacing`. Pull requests should include a summary, verification commands, linked issues when applicable, and screenshots or recordings for UI changes.

## Agent-Specific Instructions

This project uses a recent Next.js release with possible breaking changes. Before changing framework APIs or file conventions, read the relevant local docs under `node_modules/next/dist/docs/` after dependencies are installed.
