import type { ContentItem, ContentType, PopupModal } from './types';

// Deterministic id generator. Kept dependency-free; unique enough for authoring.
let counter = 0;
export function makeId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** A blank content item of the given type, with the fields that type needs. */
export function makeContentItem(type: ContentType, order: number): ContentItem {
  const base: ContentItem = { id: makeId(type), order, type };

  switch (type) {
    case 'heading':
      return { ...base, value: 'Heading', styleProps: { align: 'center' } };
    case 'text':
      return { ...base, value: 'Some descriptive text.', styleProps: { align: 'center' } };
    case 'email':
      return {
        ...base,
        value: 'Your email',
        required: true,
        onSubmitRequest: { target: 'body', key: 'email' },
      };
    case 'free-text-input':
      return {
        ...base,
        value: 'Your answer',
        onSubmitRequest: { target: 'body', key: 'field' },
      };
    case 'checkbox':
      return {
        ...base,
        value: 'I agree',
        onSubmitRequest: { target: 'body', key: 'optIn' },
      };
    case 'radio':
      return {
        ...base,
        value: 'Pick one',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
        onSubmitRequest: { target: 'body', key: 'choice' },
      };
    case 'submit-button':
      return { ...base, value: 'Submit' };
    default:
      return base;
  }
}

/** A new, empty popup with sensible defaults. */
export function makePopup(name = 'Untitled popup'): PopupModal {
  return {
    id: makeId('popup'),
    name,
    url: 'https://example.com/api/subscribe',
    method: 'POST',
    trigger: { type: 'immediate' },
    design: 'basic',
    dismissible: true,
    frequency: 'always',
    contentItems: [
      makeContentItem('heading', 0),
      makeContentItem('email', 1),
      makeContentItem('submit-button', 2),
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
