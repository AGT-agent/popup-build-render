import type { ContentItem, ContentType, CustomFieldDef, PopupDirection, PopupModal } from './types';
import { customFieldContentType } from './types';

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
    case 'spacer':
      return { ...base, height: 16 };
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

/**
 * A content item pre-filled from a host-supplied custom field. Starts from the
 * blank item for the mapped type, then locks the submit `key` to the field's
 * (the host's source of truth) and carries over its label, options, and
 * required flag.
 */
export function makeContentItemFromField(field: CustomFieldDef, order: number): ContentItem {
  const type = customFieldContentType(field.type);
  const base = makeContentItem(type, order);
  return {
    ...base,
    value: field.label,
    required: field.required ?? base.required,
    options: field.type === 'radio' ? (field.options ?? base.options) : base.options,
    onSubmitRequest: { target: base.onSubmitRequest?.target ?? 'body', key: field.key },
  };
}

/**
 * A new popup with attractive defaults: the `image-behind` design, a neutral
 * image, rounded corners, and generic starter copy. Looks good out of the box
 * while staying easy to rewrite for the host's own campaign.
 */
export function makePopup(name = 'Untitled popup', direction?: PopupDirection): PopupModal {
  return {
    id: makeId('popup'),
    name,
    url: 'https://example.com/api/subscribe',
    method: 'POST',
    trigger: { type: 'immediate' },
    design: 'image-behind',
    imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
    borderRadius: 18,
    dismissible: true,
    frequency: 'always',
    ...(direction ? { direction } : {}),
    contentItems: [
      {
        id: makeId('heading'),
        order: 0,
        type: 'heading',
        // No color: image-behind renders the body text white over the scrim.
        value: 'Join our newsletter',
        styleProps: { align: 'center' },
      },
      {
        id: makeId('text'),
        order: 1,
        type: 'text',
        value: 'Sign up to get the latest news and offers.',
        styleProps: { align: 'center' },
      },
      {
        id: makeId('email'),
        order: 2,
        type: 'email',
        value: 'Your email',
        required: true,
        onSubmitRequest: { target: 'body', key: 'email' },
      },
      {
        id: makeId('submit-button'),
        order: 3,
        type: 'submit-button',
        value: 'Subscribe',
        // White CTA pops against the photo; dark label keeps it readable.
        styleProps: { backgroundColor: '#ffffff', color: '#111827' },
      },
    ],
  };
}

/**
 * A polished, ready-to-show starter template: a full-bleed image with the form
 * laid over it (the `image-behind` design), warm copy, and a crisp white CTA.
 * Handy as the "this is what good looks like" example.
 */
export function makeExamplePopup(direction?: PopupDirection): PopupModal {
  return {
    id: makeId('welcome'),
    name: 'Welcome offer',
    url: 'https://shop.example.com/api/subscribe',
    method: 'POST',
    trigger: { type: 'delay', seconds: 5 },
    design: 'image-behind',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    borderRadius: 18,
    dismissible: true,
    frequency: 'session',
    ...(direction ? { direction } : {}),
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
        // No color set: image-behind renders the body text white over the scrim.
        value: 'Get 15% off your first order',
        styleProps: { align: 'center' },
      },
      {
        id: makeId('t'),
        order: 1,
        type: 'text',
        value: 'Join the list for early access to new drops and members-only deals.',
        styleProps: { align: 'center' },
      },
      {
        id: makeId('e'),
        order: 2,
        type: 'email',
        value: 'Your email',
        required: true,
        onSubmitRequest: { target: 'body', key: 'email' },
      },
      {
        id: makeId('c'),
        order: 3,
        type: 'checkbox',
        value: 'Email me deals',
        onSubmitRequest: { target: 'body', key: 'marketingOptIn' },
      },
      {
        id: makeId('btn'),
        order: 4,
        type: 'submit-button',
        value: 'Claim my discount',
        // White CTA pops against the photo; dark label keeps it readable.
        styleProps: { backgroundColor: '#ffffff', color: '#111827' },
      },
    ],
  };
}
