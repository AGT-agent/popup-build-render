# Popup Builder

JSON-driven popup modals: a **renderer** that turns a popup JSON into a working modal, and a **builder** that lets you author, save, and edit those JSONs visually. The two are independent — the builder produces JSON, the renderer consumes it — so you can use either on its own.

The JSON contract lives in [`POPUP-COMPONENT-JSON-SCHEMA.md`](./POPUP-COMPONENT-JSON-SCHEMA.md) and is implemented as shared TypeScript in `src/schema`.

## Layout

```
src/
  schema/     Shared source of truth: TS types, factories, runtime validation.
  renderer/   Consumes a PopupModal JSON. Split into two halves:
                - PopupContent  → pure rendering (design + contentItems + submit)
                - PopupMount    → the mount layer (trigger, frequency, dismiss, placement)
                - mountPopup    → vanilla loader for embedding on a storefront
  builder/    The authoring UI. Zustand store holds the array of popup JSONs
              (persisted to localStorage); editor menus build each JSON part;
              a live preview reuses the real renderer.
```

### Mount vs. render — the deliberate split

- **Render** (`PopupContent`) knows only how to draw a popup: it reads `design`, `imageUrl`, `contentItems`, and handles the submit + `onSuccess`/`onError`. It has no idea when or why it appeared.
- **Mount** (`PopupMount`) owns *delivery*: `trigger` (when to open), `frequency` (localStorage cap), `dismissible` (X / overlay / esc), and `htmlId` (inline vs. full-page overlay). It decides when to render `PopupContent`.

This means the builder can force-open `PopupContent` for a live preview without any trigger/frequency logic getting in the way, and the storefront gets the full mount behavior via `mountPopup`.

## Run the builder

```bash
npm install
npm run dev      # opens the builder
npm run build    # typecheck + production build
npm run typecheck
```

## Use the renderer standalone

```ts
import { mountPopup } from './src/renderer';

const handle = mountPopup(popupJson);   // wires up trigger, frequency, placement
// handle.unmount() to tear down
```

Or drive rendering directly in a React app:

```tsx
import { PopupMount } from './src/renderer';

<PopupMount popup={popupJson} />
```

See `src/renderer/embed-example.tsx` for a full storefront example.

## Get the JSON out of the builder

The builder store exposes the array of saved popups:

```ts
import { getAllPopups } from './src/builder/store';

const popups = getAllPopups();   // PopupModal[] — hand any of these to the renderer
```

The UI also has **Export all / Import** buttons and a per-popup **Copy JSON**.
