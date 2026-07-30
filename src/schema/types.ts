// ---------------------------------------------------------------------------
// Popup Component — JSON schema types.
// Single source of truth shared by the renderer and the builder.
// Mirrors POPUP-COMPONENT-JSON-SCHEMA.md (v0 draft).
// ---------------------------------------------------------------------------

/** When the modal opens. Discriminated union on `type`. */
export type PopupTrigger =
  | { type: 'delay'; seconds: number }
  | { type: 'scroll'; percent: number }
  | { type: 'immediate' };

/** Pre-defined layout template the merchant picks between. */
export type PopupDesign = 'basic' | 'image-behind' | 'image-right' | 'image-left';

/** How often the popup may re-open (enforced via localStorage). */
export type PopupFrequency = 'session' | 'day' | 'ever' | 'always';

/**
 * Text direction of the rendered popup. Independent of the builder UI language —
 * a merchant running an English builder can still author a right-to-left popup.
 */
export type PopupDirection = 'ltr' | 'rtl';

export type ContentType =
  | 'heading'
  | 'text'
  | 'spacer'
  | 'email'
  | 'radio'
  | 'checkbox'
  | 'free-text-input'
  | 'submit-button';

export interface StyleProps {
  align?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
}

export interface PopupOption {
  label: string;
  value: string;
}

/**
 * Marks an input as contributing to the submit request, under `key`. Where the
 * value lands is decided by the popup's `method`, not per-item: `GET` sends
 * everything on the query string, `POST` sends everything in both the query
 * string and the JSON body.
 */
export interface OnSubmitRequest {
  key?: string;
}

/** A static extra key/value pair sent with every submit (custom submit callback values). */
export interface CallbackPayloadEntry {
  key: string;
  value: string;
}

export interface ContentItem {
  id: string;
  order: number;
  type: ContentType;
  value?: string;
  placeholder?: string; // email / free-text-input only — input placeholder, independent of the label
  height?: number; // spacer only — vertical gap in px
  styleProps?: StyleProps;
  options?: PopupOption[];
  required?: boolean;
  onSubmitRequest?: OnSubmitRequest;
}

export type SubmitSuccess =
  | { type: 'close' }
  | { type: 'message'; text: string; autoCloseMs?: number }
  | {
      type: 'coupon';
      text?: string;
      code?: string;
      codeFromResponsePath?: string;
      copyable?: boolean;
    }
  | { type: 'redirect'; url: string; newTab?: boolean };

export type SubmitError = { type: 'message'; text: string };

export interface PopupModal {
  id: string;
  name: string;
  url: string;
  /**
   * How submitted values reach `url`. `GET` puts everything on the query
   * string; `POST` sends everything on the query string *and* in the JSON body.
   */
  method: 'GET' | 'POST';
  trigger: PopupTrigger;
  design: PopupDesign;
  /** Text direction of the popup itself. Defaults to 'ltr' when omitted. */
  direction?: PopupDirection;
  borderRadius?: number;
  imageUrl?: string;
  /**
   * CSS selector gating *whether* the popup shows, not where. Renders only on
   * pages where it matches something; omit to always show. Accepts a selector
   * list (`.cart, #product`) to match any of several elements.
   */
  selector?: string;
  dismissible?: boolean;
  frequency?: PopupFrequency;
  onSuccess?: SubmitSuccess;
  onError?: SubmitError;
  onSubmitCallbackPayload?: CallbackPayloadEntry[];
  contentItems: ContentItem[];
}

/** Content types that collect a value and contribute to the submit request. */
export const INPUT_TYPES: ContentType[] = ['email', 'radio', 'checkbox', 'free-text-input'];

export const CONTENT_TYPES: ContentType[] = [
  'heading',
  'text',
  'spacer',
  'email',
  'radio',
  'checkbox',
  'free-text-input',
  'submit-button',
];

export const DESIGNS: PopupDesign[] = ['basic', 'image-behind', 'image-right', 'image-left'];

export const FREQUENCIES: PopupFrequency[] = ['always', 'session', 'day', 'ever'];

export const DIRECTIONS: PopupDirection[] = ['ltr', 'rtl'];

export function isInputType(type: ContentType): boolean {
  return INPUT_TYPES.includes(type);
}

/**
 * A submit key or radio value ends up verbatim in a URL query/body key, so it
 * must be URL-safe: no spaces, only RFC 3986 unreserved characters
 * (letters, digits, and `-` `.` `_` `~`).
 */
export const URL_TOKEN_RE = /^[A-Za-z0-9._~-]+$/;

export function isUrlSafeToken(value: string): boolean {
  return URL_TOKEN_RE.test(value);
}

export const URL_TOKEN_HINT = 'No spaces or special characters — use letters, digits, . _ ~ -';

// ---------------------------------------------------------------------------
// Generated page tag — the "no CSS knowledge required" path to a `selector`.
//
// Instead of hunting for an existing class or id to gate on, a merchant can
// generate a tag here and paste the matching element onto every page the popup
// belongs on. A `data-*` attribute keeps that pasted markup valid HTML — a bare
// `popup-selector="…"` would still match in `querySelector`, but it is not a
// legal attribute name per the HTML spec.
// ---------------------------------------------------------------------------

export const POPUP_TAG_ATTR = 'data-popup';

/** Matches a generated tag inside a (possibly longer) selector list. */
export const POPUP_TAG_RE = new RegExp(`\\[${POPUP_TAG_ATTR}=["']?([^"'\\]]+)["']?\\]`);

/**
 * Turns a popup name into an attribute value: lowercased, runs of anything that
 * isn't a letter or digit collapsed to `-`. Letters stay Unicode-aware so a
 * Hebrew name yields a readable Hebrew tag rather than an empty one. Falls back
 * to `fallback` (the popup id) when the name has nothing usable in it.
 */
export function popupTagValue(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

/** The selector stored in `selector` for a generated tag. */
export function popupTagSelector(value: string): string {
  return `[${POPUP_TAG_ATTR}="${value}"]`;
}

/** The markup the merchant pastes onto every page the popup should show on. */
export function popupTagSnippet(value: string): string {
  return `<div ${POPUP_TAG_ATTR}="${value}"></div>`;
}

/** The tag value already present in a selector, if any. */
export function readPopupTag(selector?: string): string | undefined {
  return selector?.match(POPUP_TAG_RE)?.[1];
}

/**
 * Puts `tag` into an existing selector: replacing a tag that's already there
 * (so a regenerate after a rename swaps rather than duplicates), otherwise
 * appending to the selector list so hand-written entries survive.
 */
export function withPopupTag(selector: string | undefined, tag: string): string {
  const current = (selector ?? '').trim();
  if (!current) return tag;
  if (POPUP_TAG_RE.test(current)) return current.replace(POPUP_TAG_RE, () => tag);
  return `${current}, ${tag}`;
}

/** Designs that consume the top-level `imageUrl`. */
export function designUsesImage(design: PopupDesign): boolean {
  return design !== 'basic';
}
