# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Start development server** (runs on port 3000):
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Environment Setup

Before running the app, create a `.env.local` file in the root directory and set the Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

The API key is exposed via `process.env.GEMINI_API_KEY` and `process.env.API_KEY` through Vite's config (see `vite.config.ts`).

## Project Architecture

**Application Type:** Single Page Application (SPA) with client-side routing

**Core Architecture Pattern:**
- **Centralized state management** in `App.tsx` using React hooks (useState)
- **Prop drilling** for passing state and handlers down to child components
- **ViewState enum** (defined in `types.ts`) controls which page is rendered
- **Navigation history tracking** via `previousView` state for back button functionality

**State Flow:**
```
App.tsx (root state)
  ├── shoppingList: Array<ShoppingItem>
  ├── currentView: ViewState
  └── previousView: ViewState
      ├── passed to pages via props
      └── BottomNav visibility controlled by currentView
```

**Key Files:**
- `App.tsx` - Root component with all state and view routing logic
- `types.ts` - TypeScript definitions (ViewState enum, Item/ShoppingItem interfaces)
- `vite.config.ts` - Vite configuration with path aliases (`@/` maps to root) and env var handling
- `components/BottomNav.tsx` - Main navigation (visible on all pages except Login, Scan, ItemDetail)
- `pages/*.tsx` - Individual page components

**Page Navigation Pattern:**
When adding navigation, use the `handleNavigate` function passed via props:
```typescript
onChangeView={handleNavigate}  // or onBack/onClose/onFinish for specific actions
```

The navigation system handles view transitions and tracks history for the back button.

## Tech Stack

- **React 19.2.3** with TypeScript 5.8.2
- **Vite 6.2.0** - Build tool and dev server
- **Recharts** - Data visualization (charts in Statistics page)
- **Material Icons** - Used via `<span class="material-symbols-outlined">`
- **Gemini AI API** - Receipt scanning functionality

## Styling Conventions

- **Tailwind CSS** via inline classes (no build-time CSS processing)
- **Dark theme** with primary blue accent color (#339cff, referenced as `primary` in Tailwind classes)
- **Glassmorphism** effects with `backdrop-blur-md` and semi-transparent backgrounds
- **Mobile-first** design with `max-w-md` containers
- **Custom animations** defined in `<style>` tags within components (e.g., scan animation in Scan.tsx)

## Component Patterns

**Props Interface:**
```typescript
interface PageProps {
    onClose?: () => void;          // Close/modal-dismiss action
    onFinish?: () => void;         // Complete action and navigate
    onBack?: () => void;           // Navigate back
    onChangeView?: (view: ViewState) => void;  // General navigation
}
```

**State Updates:**
When modifying arrays (shopping list, items), use the functional update pattern:
```typescript
setShoppingList(prev => [...prev, newItem]);
```

## Current Limitations

- No testing framework configured
- No linting/formatting tools (ESLint, Prettier)
- No backend - all state is client-side only
- No CI/CD pipeline
- No data persistence beyond runtime (could be added via localStorage)
