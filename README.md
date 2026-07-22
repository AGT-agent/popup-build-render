# Popup Builder

JSON-driven popup modals: a **renderer** that turns a popup JSON into a working modal, and a visual **builder** for authoring that JSON. The two are independent — the builder outputs JSON, the renderer consumes it — so you can use either on its own.

## Quick start

```bash
npm install
npm run dev        # builder at http://localhost:5173/
                   # renderer demo at http://localhost:5173/demo.html
npm run build      # build the installable library into lib/
npm run build:app  # typecheck + build the builder/demo pages into dist/
```

## Installing in another project

The package ships as an ESM library. `react` and `react-dom` are peer dependencies — the host app provides them.

```bash
# from GitHub (a branch, tag, or commit after #)
npm i github:AGT-agent/popup-build-render
npm i github:AGT-agent/popup-build-render#v0.1.0

# from a local checkout, for development
npm i ../popup-build-render     # symlinks; rebuild with `npm run build` after edits

# from npm, once published
npm i popup-build-render
```

Installing from GitHub or a local path runs the `prepare` script, which builds `lib/` — so no build output needs to be committed.

Three entry points:

```ts
import { PopupMount, mountPopup, validatePopup } from 'popup-build-render';
import { PopupBuilder } from 'popup-build-render/builder';
import 'popup-build-render/builder.css';   // only needed with the builder
```

If you install from a local path, add `resolve: { dedupe: ['react', 'react-dom'] }` to the consuming app's Vite config — a symlinked package otherwise resolves its own React copy and hooks break.

## Using the renderer

Drive everything from a popup JSON (shape defined in [`POPUP-COMPONENT-JSON-SCHEMA.md`](./POPUP-COMPONENT-JSON-SCHEMA.md)). Three entry points, from most to least batteries-included:

```ts
import { mountPopup, PopupMount, PopupContent } from 'popup-build-render';
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

- **Saving view** — a list of your saved templates. Create one, or click a row to edit. Delete lives per-row here. The radio on each row marks a template **in use**; a bar below the list then offers **Show JSON** for that one.
- **Editing view** — a menu on the left (delivery, design, submission, and content items via the **+ Add section** button), a live preview on the right, and **View JSON** to see/copy the result.

Templates are persisted to `localStorage` via a Zustand store. To get the JSON out: **Show JSON → Copy**, or read it in code:

```ts
import { getAllPopups, getActivePopup } from 'popup-build-render/builder';

const popups = getAllPopups();     // PopupModal[] — hand any to the renderer
const inUse = getActivePopup();    // PopupModal | null — the radio-marked one
```

### Reacting to the in-use template

Rather than polling, have the builder tell you. In React, pass `onActiveChange` — it fires on mount, when a different template is marked, when the marked one is edited, and with `null` when it's cleared or deleted:

```tsx
import { PopupBuilder } from 'popup-build-render/builder';

<PopupBuilder onActiveChange={(popup) => save(popup)} />
```

Outside React, subscribe to the store directly. Returns an unsubscribe function:

```ts
import { subscribeActivePopup } from 'popup-build-render/builder';

const stop = subscribeActivePopup((popup) => save(popup));
```

Both fire only on real changes to the in-use popup — opening a template in the editor or editing a *different* one stays quiet.

> The in-use mark lives in `localStorage` alongside the templates, so it's per-browser. If a storefront needs to know which popup to show, persist the JSON server-side from one of these callbacks — the radio is a local staging choice, not a shared source of truth.

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
