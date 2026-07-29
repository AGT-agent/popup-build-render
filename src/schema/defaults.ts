import type { ContentItem, ContentType, PopupDirection, PopupModal } from './types';

// Deterministic id generator. Kept dependency-free; unique enough for authoring.
let counter = 0;
export function makeId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/**
 * Placeholder copy seeded into a brand-new popup or section. Passed in rather
 * than hardcoded so the builder can seed in the author's language — the schema
 * itself stays free of any i18n dependency, since the renderer shares it.
 * Only prose lives here: submit keys and option values are URL-safe tokens and
 * are never translated.
 */
export interface DefaultText {
  popupName: string;
  heading: string;
  text: string;
  emailLabel: string;
  freeTextLabel: string;
  checkboxLabel: string;
  radioLabel: string;
  optionA: string;
  optionB: string;
  submit: string;
}

/** English seeds — used whenever a caller doesn't supply its own. */
export const DEFAULT_TEXT: DefaultText = {
  popupName: 'Untitled popup',
  heading: 'Heading',
  text: 'Some descriptive text.',
  emailLabel: 'Your email',
  freeTextLabel: 'Your answer',
  checkboxLabel: 'I agree',
  radioLabel: 'Pick one',
  optionA: 'Option A',
  optionB: 'Option B',
  submit: 'Submit',
};

/** A blank content item of the given type, with the fields that type needs. */
export function makeContentItem(
  type: ContentType,
  order: number,
  text: DefaultText = DEFAULT_TEXT,
): ContentItem {
  const base: ContentItem = { id: makeId(type), order, type };

  switch (type) {
    case 'heading':
      return { ...base, value: text.heading, styleProps: { align: 'center' } };
    case 'text':
      return { ...base, value: text.text, styleProps: { align: 'center' } };
    case 'spacer':
      return { ...base, height: 16 };
    case 'email':
      return {
        ...base,
        value: text.emailLabel,
        required: true,
        onSubmitRequest: { target: 'body', key: 'email' },
      };
    case 'free-text-input':
      return {
        ...base,
        value: text.freeTextLabel,
        onSubmitRequest: { target: 'body', key: 'field' },
      };
    case 'checkbox':
      return {
        ...base,
        value: text.checkboxLabel,
        onSubmitRequest: { target: 'body', key: 'optIn' },
      };
    case 'radio':
      return {
        ...base,
        value: text.radioLabel,
        options: [
          { label: text.optionA, value: 'a' },
          { label: text.optionB, value: 'b' },
        ],
        onSubmitRequest: { target: 'body', key: 'choice' },
      };
    case 'submit-button':
      return { ...base, value: text.submit };
    default:
      return base;
  }
}

/**
 * A new, empty popup with sensible defaults. `direction` seeds the popup's own
 * text direction — omit it to leave the key off the JSON entirely, which the
 * renderer reads as `ltr`.
 */
export function makePopup(
  name?: string,
  text: DefaultText = DEFAULT_TEXT,
  direction?: PopupDirection,
): PopupModal {
  return {
    id: makeId('popup'),
    name: name ?? text.popupName,
    url: 'https://example.com/api/subscribe',
    method: 'POST',
    trigger: { type: 'immediate' },
    design: 'basic',
    ...(direction ? { direction } : {}),
    dismissible: true,
    frequency: 'always',
    contentItems: [
      makeContentItem('heading', 0, text),
      makeContentItem('email', 1, text),
      makeContentItem('submit-button', 2, text),
    ],
  };
}

/** The worked example from the schema doc — handy as a starter template. */
export function makeExamplePopup(): PopupModal {
  return {
    id: makeId('welcome'),
    name: 'Welcome 15% off',
    url: 'https://shop.example.com/api/subscribe',
    method: 'POST',
    trigger: { type: 'delay', seconds: 5 },
    design: 'image-right',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
    dismissible: true,
    frequency: 'session',
    onSuccess: {
      type: 'coupon',
      text: "You're in! Use this at checkout:",
      code: 'WELCOME15',
      copyable: true,
    },
    onError: { type: 'message', text: 'Something went wrong — please try again.' },
    contentItems: [
      {
        id: makeId('h'),
        order: 0,
        type: 'heading',
        value: 'Get 15% off your first order',
        styleProps: { align: 'center', color: '#111827' },
      },
      {
        id: makeId('e'),
        order: 1,
        type: 'email',
        value: 'Your email',
        required: true,
        onSubmitRequest: { target: 'body', key: 'email' },
      },
      {
        id: makeId('c'),
        order: 2,
        type: 'checkbox',
        value: 'Email me deals',
        onSubmitRequest: { target: 'body', key: 'marketingOptIn' },
      },
      { id: makeId('btn'), order: 3, type: 'submit-button', value: 'Claim my discount' },
    ],
  };
}
