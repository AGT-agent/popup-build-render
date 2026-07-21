# Popup Builder

JSON-driven popup modals: a **renderer** that turns a popup JSON into a working modal, and a visual **builder** for authoring that JSON. The two are independent — the builder outputs JSON, the renderer consumes it — so you can use either on its own.

## Quick start

```bash
npm install
npm run dev        # builder at http://localhost:5173/
                   # renderer demo at http://localhost:5173/demo.html
npm run build      # typecheck + production build
```

## Using the renderer

Drive everything from a popup JSON (shape defined in [`POPUP-COMPONENT-JSON-SCHEMA.md`](./POPUP-COMPONENT-JSON-SCHEMA.md)). Three entry points, from most to least batteries-included:

```ts
import { mountPopup, PopupMount, PopupContent } from './src/renderer';
```

- **`mountPopup(json)`** — for a storefront/plain page. Wires up the trigger, frequency cap, and placement (overlay, or inline if `htmlId` matches an element), then renders when appropriate. Returns `{ unmount() }`.
- **`<PopupMount popup={json} />`** — the same mount behavior as a React component.
- **`<PopupContent popup={json} />`** — just the drawing (design + fields + submit); no trigger/frequency logic. You control when it shows.

```ts
const handle = mountPopup(popupJson);
// handle.unmount() to tear down
```

The renderer injects its own styles on first render, so it's self-contained — no CSS import needed at the call site. See `src/renderer/demo.ts` for a complete standalone example.

## Using the builder

`npm run dev` opens the builder. It has two parts:

- **Saving view** — a list of your saved templates. Create one, or click a row to edit. Delete lives per-row here.
- **Editing view** — a menu on the left (delivery, design, submission, and content items via the **+ Add section** button), a live preview on the right, and **View JSON** to see/copy the result.

Templates are persisted to `localStorage` via a Zustand store. To get the JSON out: **View JSON → Copy** on any template, or read the array directly:

```ts
import { getAllPopups } from './src/builder/store';
const popups = getAllPopups();   // PopupModal[] — hand any to the renderer
```

## Project structure

```
src/
  schema/     Shared source of truth: TypeScript types, factories, validation.
  renderer/   Consumes a PopupModal JSON. Split into two halves:
                PopupContent  → pure rendering (design + fields + submit)
                PopupMount    → mount layer (trigger, frequency, dismiss, placement)
                mountPopup    → vanilla loader for embedding anywhere
  builder/    The authoring UI (Zustand store + editor + live preview).
```

The **schema** is imported by both halves, so the renderer and builder can never drift on the data shape.
