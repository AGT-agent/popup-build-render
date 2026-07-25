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

- **Saving view** — a list of your saved templates. Create one, or click a row to edit. Delete lives per-row here. The **Active** checkbox on each row marks a template for handoff; check as many as you like. A bar below the list then offers **Show JSON** for the Active set.
- **Editing view** — a menu on the left (delivery, design, submission, and content items via the **+ Add section** button), a live preview on the right, and **View JSON** to see/copy the result.

**Active is multi-select by default** — check several templates and the handoff is a JSON **array**, ready to loop over with `mountPopup` (see [Using the renderer](#using-the-renderer)). The handoff bar carries a **Use just one (export a single JSON)** checkbox: tick it to constrain Active to a single row and emit one JSON **object** instead of an array.

Templates are persisted to `localStorage` via a Zustand store. To get the JSON out: **Show JSON → Copy**, or read it in code:

```ts
import { getAllPopups, getActivePopups, getActivePopup } from 'popup-build-render/builder';

const popups = getAllPopups();      // PopupModal[]   — every saved template
const active = getActivePopups();   // PopupModal[]   — the Active-checked ones
const one = getActivePopup();       // PopupModal|null — the first Active one (use with "Use just one")
```

### Reacting to the Active templates

Rather than polling, have the builder tell you. In React, pass `onActiveChangeMany` for the full Active set (or `onActiveChange` for just the single/first one). Each fires on mount, when the marks change, when an Active template is edited, and when the set is cleared or deleted:

```tsx
import { PopupBuilder } from 'popup-build-render/builder';

<PopupBuilder onActiveChangeMany={(popups) => save(popups)} />
<PopupBuilder onActiveChange={(popup) => save(popup)} />   // single/first
```

### Language

The builder UI ships with English (`en`, default) and Hebrew (`he`). Pass `lang` to switch; `he` also flips the chrome to right-to-left. This affects only the builder's own interface, not the popup content the host edits.

```tsx
<PopupBuilder lang="he" />
```

Translations live in `src/builder/i18n/en.ts` and `src/builder/i18n/he.ts` — one file per language, same shape (TypeScript enforces it). Add a language by adding a file and registering it in `src/builder/i18n/index.tsx`.

### Theme

The builder ships with a `light` (default) and a `dark` theme. Pass `theme` to switch. Like `lang`, this affects only the builder's own chrome — the popup being edited keeps the colors set in its own design section, in both themes.

```tsx
<PopupBuilder theme="dark" />
```

The theme is applied as `data-theme` on the builder's root element, and every color in `builder.css` comes from CSS variables defined per theme — so overriding `--bg`, `--panel`, `--text`, `--accent`, etc. under `[data-theme="dark"]` is enough to restyle it.

In local dev, `npm run dev` accepts `?theme=dark` (and `?lang=he`) to preview without editing code: <http://localhost:5173/?theme=dark>

### Subscribing outside React

Outside React, subscribe to the store directly. Both return an unsubscribe function:

```ts
import { subscribeActivePopups, subscribeActivePopup } from 'popup-build-render/builder';

const stop = subscribeActivePopups((popups) => save(popups));   // PopupModal[]
const stop1 = subscribeActivePopup((popup) => save(popup));     // PopupModal | null
```

All fire only on real changes to the Active set — opening a template in the editor or editing an inactive one stays quiet.

> The Active marks live in `localStorage` alongside the templates, so they're per-browser. If a storefront needs to know which popups to show, persist the JSON server-side from one of these callbacks — the checkboxes are a local staging choice, not a shared source of truth.

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
