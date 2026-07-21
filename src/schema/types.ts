// ---------------------------------------------------------------------------
// Popup Component — JSON schema types.
// Single source of truth shared by the renderer and the builder.
// Mirrors POPUP-COMPONENT-JSON-SCHEMA.md (v0 draft).
// ---------------------------------------------------------------------------

/** When the modal opens. Discriminated union on `type`. */
export type PopupTrigger =
  | { type: 'delay'; seconds: number }
  | { type: 'scroll'; percent: number }
  | { type: 'exitIntent' }
  | { type: 'immediate' };

/** Pre-defined layout template the merchant picks between. */
export type PopupDesign = 'basic' | 'image-behind' | 'image-right' | 'image-left';

/** How often the popup may re-open (enforced via localStorage). */
export type PopupFrequency = 'session' | 'day' | 'ever' | 'always';

export type ContentType =
  | 'heading'
  | 'text'
  | 'email'
  | 'radio'
  | 'checkbox'
  | 'free-text-input'
  | 'submit-button';

export type RequestTarget = 'header' | 'body';

export interface StyleProps {
  align?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
}

export interface PopupOption {
  label: string;
  value: string;
}

export interface OnSubmitRequest {
  target: RequestTarget;
  key?: string;
}

/** A static extra key/value pair sent with every submit (custom submit values). */
export interface CallbackPayloadEntry {
  key: string;
  value: string;
}

export interface ContentItem {
  id: string;
  order: number;
  type: ContentType;
  value?: string;
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
  method: 'GET' | 'POST';
  trigger: PopupTrigger;
  design: PopupDesign;
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
  'email',
  'radio',
  'checkbox',
  'free-text-input',
  'submit-button',
];

export const DESIGNS: PopupDesign[] = ['basic', 'image-behind', 'image-right', 'image-left'];

export const FREQUENCIES: PopupFrequency[] = ['always', 'session', 'day', 'ever'];

export function isInputType(type: ContentType): boolean {
  return INPUT_TYPES.includes(type);
}

/** Designs that consume the top-level `imageUrl`. */
export function designUsesImage(design: PopupDesign): boolean {
  return design !== 'basic';
}
