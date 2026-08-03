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
 * How the popup is placed. `modal` is the default centered overlay; `inline`
 * marks it to be embedded into the page flow by the host (no overlay). The
 * bundled renderer currently always draws a modal — `inline` is a flag the
 * host reads to place the form itself.
 */
export type PopupPlacement = 'modal' | 'inline';

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
 * Where a field's value lands is derived from the popup's HTTP method, not
 * configured per field: GET → query string, POST → JSON body. Only the key
 * (the parameter name) is authored.
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

// ---------------------------------------------------------------------------
// Custom fields — host-supplied inputs.
//
// A SaaS embedding the builder passes its own backend fields in via config, and
// the "create new field" flow lets an author add one on the fly: the builder
// hands the draft to the host (`onCreateField`), the host persists it and
// returns the finalized def (with a real, validated `key`), and it becomes a
// pickable field. Custom fields map onto the input `ContentType`s below.
// ---------------------------------------------------------------------------

/** The input kinds a host can expose as a custom field. */
export type CustomFieldType = 'text' | 'email' | 'radio' | 'checkbox';

/** What the author fills in the "create new field" form, before the host finalizes it. */
export interface CustomFieldDraft {
  label: string;
  type: CustomFieldType;
  options?: PopupOption[]; // radio only
  required?: boolean;
}

/**
 * A finalized custom field. The host owns `key` — it lands verbatim in the
 * submit request, so the host assigns and validates it (URL-safe). `description`
 * is optional microcopy shown under the field in the picker.
 */
export interface CustomFieldDef extends CustomFieldDraft {
  key: string;
  id?: string;
  description?: string;
}

/** The `ContentType` a custom field renders as. `text` is our free-text input. */
export function customFieldContentType(type: CustomFieldType): ContentType {
  return type === 'text' ? 'free-text-input' : type;
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
  | {
      type: 'redirect';
      url: string;
      newTab?: boolean;
      /**
       * When true, the submitted field values are appended to the redirect URL
       * as query params (keyed by each field's submit key), so the destination
       * page can personalize — e.g. greet the visitor by name on a thank-you page.
       */
      forwardValues?: boolean;
    };

export type SubmitError = { type: 'message'; text: string };

export interface PopupModal {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  trigger: PopupTrigger;
  design: PopupDesign;
  /** Overlay modal vs. host-embedded inline. Defaults to 'modal' when omitted. */
  placement?: PopupPlacement;
  /** Text direction of the popup itself. Defaults to 'ltr' when omitted. */
  direction?: PopupDirection;
  borderRadius?: number;
  imageUrl?: string;
  htmlId?: string;
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

export const PLACEMENTS: PopupPlacement[] = ['modal', 'inline'];

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

/** Designs that consume the top-level `imageUrl`. */
export function designUsesImage(design: PopupDesign): boolean {
  return design !== 'basic';
}
