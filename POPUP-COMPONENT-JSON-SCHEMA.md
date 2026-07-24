# Popup Component — JSON Schema (v0 draft)

**Status:** Draft for review
**Purpose:** Define the JSON that the merchant builds in the Dashboard and that a single React/Lit component consumes to render the popup modal on the storefront. This is **only the data shape** — no rendering, no backend, no builder UI yet. Confirm this is the right structure before we build the component.

> Naming here follows the fields you described (`id`, `contentItems`, `type`, …). It is intentionally narrower than `.planning/POPUP-BUILDER-SPEC.md` — this doc is the concrete first-step contract for the renderer component.

---

## 1. Top-level object — `PopupModal`

```ts
interface PopupModal {
  id: string; // unique id of this modal component
  name: string; // human label for the merchant (list view, not rendered)
  url: string; // merchant API endpoint hit on submit
  method: "GET" | "POST"; // request type to the merchant API
  trigger: PopupTrigger; // when the modal opens
  design: PopupDesign; // layout template
  direction?: "ltr" | "rtl"; // text direction of the popup — default 'ltr'
  borderRadius?: number; // modal corner radius in px — default 14
  imageUrl?: string; // image source for the image-* designs
  htmlId?: string; // merchant-side mount point (see §7)
  dismissible?: boolean; // proposal: close button / overlay-click / esc — default true
  frequency?: PopupFrequency; // proposal: how often it may re-open — default 'always'
  onSuccess?: SubmitSuccess; // what the shopper sees after a successful submit (§6)
  onError?: SubmitError; // what the shopper sees after a failed submit (§6)
  onSubmitCallbackPayload?: CallbackPayloadEntry[]; // static extra key/value pairs sent with every submit (§6)
  contentItems: ContentItem[]; // ordered items rendered in the modal body
}

interface CallbackPayloadEntry {
  key: string; // the payload key
  value: string; // the static value sent under that key
}
```

| Field          | Type              | Notes                                                                                                                                                                           |
| -------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`          | Stable unique id for the modal.                                                                                                                                                 |
| `name`         | `string`          | Internal name; shown in the Dashboard list, never rendered in the popup.                                                                                                        |
| `url`          | `string`          | The merchant's endpoint the form submits to.                                                                                                                                    |
| `method`       | `'GET' \| 'POST'` | How the submit request is sent (see [§6 Submit assembly](#6-how-a-submit-is-assembled)).                                                                                        |
| `trigger`      | `PopupTrigger`    | See [§2](#2-popuptrigger).                                                                                                                                                      |
| `design`       | `PopupDesign`     | See [§3](#3-popupdesign).                                                                                                                                                       |
| `direction`    | `"ltr" \| "rtl"?` | Text direction of the rendered popup (e.g. `rtl` for Hebrew). Independent of the builder UI language. Default `ltr`.                                                            |
| `borderRadius` | `number?`         | Corner radius of the modal card, in px. Default `14`.                                                                                                                           |
| `imageUrl`     | `string?`         | Image URL used by `image-behind` / `image-right` / `image-left`. Ignored by `basic`.                                                                                            |
| `htmlId`       | `string?`         | If set, the modal renders **inline** into the merchant element with this id (see [§7](#7-htmlid--merchant-controlled-placement)). If absent, it renders as a full-page overlay. |
| `dismissible`  | `boolean?`        | **Proposal.** Whether the shopper can close it (X / overlay click / esc). Default `true`.                                                                                       |
| `frequency`    | `PopupFrequency?` | **Proposal.** Re-open cap, enforced via `localStorage`. Default `'always'`.                                                                                                     |
| `onSuccess`    | `SubmitSuccess?`  | Post-submit success behavior. See [§6](#after-submit--onsuccess--onerror). Default: close.                                                                                      |
| `onError`      | `SubmitError?`    | Post-submit error behavior. See [§6](#after-submit--onsuccess--onerror). Default: inline message, form stays open.                                                              |
| `onSubmitCallbackPayload` | `CallbackPayloadEntry[]?` | Static extra `key`/`value` pairs merged into every submit (the "custom submit callback values", currently hidden from the builder UI but still honored by the renderer). See [§6](#6-how-a-submit-is-assembled).                        |
| `contentItems` | `ContentItem[]`   | See [§4](#4-contentitem). Rendered in `order` order.                                                                                                                            |

---

## 2. `PopupTrigger`

Discriminated union on `type` — when the modal opens.

```ts
type PopupTrigger =
  | { type: "delay"; seconds: number } // open N seconds after page load
  | { type: "scroll"; percent: number } // open after scrolling N% of the page
  | { type: "immediate" }; // open as soon as the component mounts
```

---

## 3. `PopupDesign`

A pre-defined layout template the merchant picks between.

```ts
type PopupDesign =
  | "basic" // plain centered card, no image
  | "image-behind" // full-bleed background image (imageUrl), content overlaid
  | "image-right" // image (imageUrl) on the right, content on the left
  | "image-left"; // image (imageUrl) on the left, content on the right
```

The image-based designs read the top-level `imageUrl`.

---

## 4. `ContentItem`

Each entry in `contentItems`. Shared shape below; per-`type` specifics in [§5](#5-per-type-details).

```ts
interface ContentItem {
  id: string; // unique id for this item
  order: number; // sort order within the modal body
  type: ContentType; // what kind of item this is
  value?: string; // display text (heading / text); label for inputs / buttons
  placeholder?: string; // email / free-text-input only — input placeholder; falls back to `value` when omitted
  height?: number; // spacer only — vertical gap in px (default 16)
  styleProps?: StyleProps; // merged into the React component's style
  options?: PopupOption[]; // radio only — the selectable choices (see §5)
  required?: boolean; // proposal: inputs only — block submit if empty
  onSubmitRequest?: OnSubmitRequest; // how this item contributes to the request
}

type ContentType =
  | "heading"
  | "text"
  | "spacer" // a fixed-height vertical gap (see §5)
  | "email"
  | "radio"
  | "checkbox"
  | "free-text-input"
  | "submit-button"; // proposal: the control that fires the submit (see §5)

interface PopupOption {
  label: string; // shown to the shopper
  value: string; // sent in the request if selected
}
```

### `StyleProps`

Applied to the rendered item's `style`. Each key has a default when omitted.

```ts
interface StyleProps {
  align?: "left" | "center" | "right"; // default: 'center'  (maps to textAlign)
  color?: string; // default: inherit / theme text color
  backgroundColor?: string; // default: transparent / theme background
  // room to grow (fontSize, fontWeight, margin, …) — kept minimal for v0
}
```

---

## 5. Per-`type` details

Which fields are meaningful per type:

| `type`            | `value`           | `options`   | `onSubmitRequest` | Renders as |
| ----------------- | ----------------- | ----------- | ----------------- | ---------- | ----------------- |
| `heading`         | ✅ text shown     | —           | —                 | —          | a heading         |
| `text`            | ✅ text shown     | —           | —                 | —          | a paragraph       |
| `spacer`          | —                 | —           | —                 | —          | a vertical gap    |
| `email`           | field label       | —           | ✅                | optional   | an email input    |
| `radio`           | group label       | ✅ required | ✅                | optional   | a radio group     |
| `checkbox`        | label             | —           | ✅                | optional   | a checkbox        |
| `free-text-input` | field label       | —           | ✅                | optional   | a text input      |
| `submit-button`   | ✅ button label   | —           | —                 | —          | the submit button |

- **`email` / `free-text-input`** have a separate `placeholder`. `value` is the visible field label; `placeholder` is the greyed-out hint inside the input, edited independently in the builder. When `placeholder` is omitted it falls back to `value`.
- **`spacer`** ignores `value`; it renders an empty block whose height is `height` px (default `16`). Use it to add breathing room between items.
- **`radio` options** live on the content item as `options: { label, value }[]`. The label is rendered; the selected option's `value` is what gets submitted. Each `value` must be **URL-safe** (see §6).
- **`submit-button`** is what actually triggers the request assembly + `fetch`. Without it there's no way to submit; flagged as a proposal in case you'd rather the modal auto-submit some other way.

---

## 6. How a submit is assembled

Each input item declares, via `onSubmitRequest`, whether it contributes to the **URL query string** or the **body** of the request to `url`, and under what key. The **value is always resolved at submit time** from the item's `type` — that's why there's no static value here.

```ts
type RequestTarget = "query" | "body";

interface OnSubmitRequest {
  target: RequestTarget; // query vs body — default 'body'
  key?: string; // query param name / body key. Defaults to 'email' for the email item; required otherwise.
}
```

> **Key format.** Every submit key — `onSubmitRequest.key`, `radio` option `value`s, and
> `onSubmitCallbackPayload` keys — is used verbatim as a URL query/body key, so it must be
> **URL-safe**: no spaces, only RFC 3986 unreserved characters (letters, digits, and `-` `.` `_` `~`).
> The builder flags violations inline and as validation errors.

**Where the value comes from (by item `type`):**

| `type`            | submitted value                            |
| ----------------- | ------------------------------------------ |
| `email`           | the email the shopper typed                |
| `free-text-input` | the text the shopper typed                 |
| `checkbox`        | the boolean checked state (`true`/`false`) |
| `radio`           | the selected option's `value`              |

**Assembly at submit time:**

- `query` items → appended to the request URL's query string as `key=value`.
- `body` items → merged into the request body as `{ key: value }`.
- `onSubmitCallbackPayload` entries → merged into the request body as static `{ key: value }` pairs (query string for `GET`), alongside the resolved input values. These are fixed values the merchant sets in the builder, not tied to any input.
- For `GET`, "body" params instead go on the query string (TBD — see [§8](#8-open-questions)).

### Example

```jsonc
{
  "id": "welcome-15",
  "name": "Welcome 15% off",
  "url": "https://shop.example.com/api/subscribe",
  "method": "POST",
  "trigger": { "type": "delay", "seconds": 5 },
  "design": "image-right",
  "imageUrl": "https://cdn.example.com/promo.jpg",
  "dismissible": true,
  "frequency": "session",
  "contentItems": [
    {
      "id": "h1",
      "order": 0,
      "type": "heading",
      "value": "Get 15% off your first order",
      "styleProps": { "align": "center", "color": "#111827" },
    },
    {
      "id": "e1",
      "order": 1,
      "type": "email",
      "value": "Your email",
      "required": true,
      "onSubmitRequest": { "target": "body", "key": "email" },
    },
    {
      "id": "c1",
      "order": 2,
      "type": "checkbox",
      "value": "Email me deals",
      "onSubmitRequest": { "target": "body", "key": "marketingOptIn" },
    },
    {
      "id": "btn",
      "order": 3,
      "type": "submit-button",
      "value": "Claim my discount",
    },
  ],
}
```

Resulting `POST https://shop.example.com/api/subscribe` body:

```json
{ "email": "shopper@example.com", "marketingOptIn": true }
```

### After submit — `onSuccess` / `onError`

Once the merchant request resolves, the modal reacts per these top-level fields. Both are discriminated unions on `type`.

```ts
type SubmitSuccess =
  | { type: "close" } // just close the modal (default when onSuccess omitted)
  | {
      type: "message"; // swap the body for a success message
      text: string;
      autoCloseMs?: number;
    } // optional auto-close after N ms (else stays until dismissed)
  | {
      type: "coupon"; // reveal a discount code to copy
      text?: string; // e.g. "Here's your 15% off code:"
      code?: string; // static code, OR…
      codeFromResponsePath?: string; // …pull a per-shopper code from the merchant JSON response, e.g. "data.coupon"
      copyable?: boolean;
    } // show a copy button — default true
  | {
      type: "redirect"; // navigate the shopper somewhere
      url: string;
      newTab?: boolean;
    };

type SubmitError = { type: "message"; text: string }; // show an error, keep the form open to retry (default)
```

Notes:

- **Default success** (no `onSuccess`) = `{ type: 'close' }`. **Default error** = an inline generic message; the form stays open so the shopper can retry.
- **`coupon.codeFromResponsePath`** covers the common "merchant mints a unique code and returns it" case — a dot-path into the parsed JSON response. If both `code` and `codeFromResponsePath` are set, the response path wins; if the path resolves to nothing, fall back to `code`.
- "Success" vs "error" is decided by HTTP status (2xx = success). Whether we also inspect the response body for a merchant-signalled failure is an open question ([§10](#10-open-questions)).

Example success block for the welcome-15 popup above:

```jsonc
{
  "onSuccess": {
    "type": "coupon",
    "text": "You're in! Use this at checkout:",
    "codeFromResponsePath": "data.discountCode",
    "copyable": true,
  },
  "onError": {
    "type": "message",
    "text": "Something went wrong — please try again.",
  },
}
```

---

## 7. `htmlId` — merchant-controlled placement

- `htmlId` present → inline placement into that element.
- `htmlId` absent → default full-page overlay.

---

## 9. Proposals folded in (confirm or cut)

These aren't in your original list — I added them where the schema couldn't function without them or would nag users. Flagging so you can accept or drop each:

| #   | Addition                       | Why                                                                                         |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| P1  | `submit-button` content type   | Nothing else triggers the request; the form can't submit without it.                        |
| P2  | `dismissible?: boolean`        | Whether the shopper can close it (X / overlay / esc).                                       |
| P3  | `frequency?: PopupFrequency`   | Popups that re-open on every page view are a common complaint; `localStorage` cap fixes it. |
| P4  | `required?: boolean` on inputs | Validate before firing the merchant request.                                                |
| P5  | `PopupOption[]` for radio      | Radio can't render or submit without its choices.                                           |

```ts
type PopupFrequency = "session" | "day" | "ever" | "always";
```

---

## 10. Open questions

1. **Success detection** — is 2xx HTTP status enough to treat a submit as successful, or do we also inspect the response body for a merchant-signalled failure (e.g. `{ ok: false }`)? Affects when `onSuccess` vs `onError` fires.
2. **`GET` requests** — for `method: 'GET'`, do `body`-targeted params become query-string params, or is `body` disallowed for GET?
3. **Localization** — spec `POPUP-BUILDER-SPEC.md` (D5) proposes localized strings. Keep `value` / `onSuccess.text` a plain string for v0, or already `{ he, en, … }`?
4. **Multiple inputs of the same type** — e.g. two free-text inputs; `key` uniqueness is on the merchant/builder to enforce. Any validation needed?

```

```
