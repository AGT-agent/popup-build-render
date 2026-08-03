import {
  makeId,
  type ContentItem,
  type PopupDesign,
  type PopupModal,
} from '@schema';
import type { Strings } from './i18n';

/**
 * A gallery template. `make()` returns a fresh PopupModal (new ids each call);
 * `image` is the thumbnail shown on the gallery card; `titleKey` resolves the
 * card's name against `t.presets` so it stays translated.
 */
export interface Preset {
  key: string;
  design: PopupDesign;
  /** Thumbnail for the gallery card. Empty for the image-less `basic` layout. */
  image: string;
  titleKey: keyof Strings['presets'];
  make: (name: string) => PopupModal;
}

// Shared content pieces so each preset stays short and consistent.
const heading = (value: string): ContentItem => ({
  id: makeId('heading'),
  order: 0,
  type: 'heading',
  value,
  styleProps: { align: 'center' },
});

const text = (value: string): ContentItem => ({
  id: makeId('text'),
  order: 1,
  type: 'text',
  value,
  styleProps: { align: 'center' },
});

const email = (): ContentItem => ({
  id: makeId('email'),
  order: 2,
  type: 'email',
  value: 'Your email',
  required: true,
  onSubmitRequest: { target: 'body', key: 'email' },
});

const submit = (value: string, onImage = true): ContentItem => ({
  id: makeId('submit-button'),
  order: 9,
  type: 'submit-button',
  value,
  // White CTA reads well on a photo; the basic layout keeps the default dark.
  styleProps: onImage ? { backgroundColor: '#ffffff', color: '#111827' } : undefined,
});

// Pexels stock photos (stable hosted URLs).
const IMG = {
  gradient: 'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=800',
  fashion: 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=800',
  product: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800',
  neon: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800',
  desk: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const base = (name: string, design: PopupDesign, image?: string): Omit<PopupModal, 'contentItems'> => ({
  id: makeId('popup'),
  name,
  url: 'https://example.com/api/subscribe',
  method: 'POST',
  trigger: { type: 'immediate' },
  design,
  ...(image ? { imageUrl: image } : {}),
  borderRadius: 18,
  dismissible: true,
  frequency: 'always',
});

/** The starter gallery — one entry per layout, plus a couple of variations. */
export const PRESETS: Preset[] = [
  {
    key: 'newsletter',
    design: 'image-behind',
    image: IMG.gradient,
    titleKey: 'newsletter',
    make: (name) => ({
      ...base(name, 'image-behind', IMG.gradient),
      contentItems: [
        heading('Join our newsletter'),
        text('Sign up to get the latest news and offers.'),
        email(),
        submit('Subscribe'),
      ],
    }),
  },
  {
    key: 'discount',
    design: 'image-right',
    image: IMG.fashion,
    titleKey: 'discount',
    make: (name) => ({
      ...base(name, 'image-right', IMG.fashion),
      onSuccess: { type: 'coupon', text: "You're in! Use this at checkout:", code: 'WELCOME15', copyable: true },
      contentItems: [
        heading('Get 15% off your first order'),
        text('Join the list for early access to new drops.'),
        email(),
        {
          id: makeId('checkbox'),
          order: 3,
          type: 'checkbox',
          value: 'Email me deals',
          onSubmitRequest: { target: 'body', key: 'marketingOptIn' },
        },
        submit('Claim my discount', false),
      ],
    }),
  },
  {
    key: 'launch',
    design: 'image-left',
    image: IMG.product,
    titleKey: 'launch',
    make: (name) => ({
      ...base(name, 'image-left', IMG.product),
      contentItems: [
        heading('Something new is coming'),
        text('Be the first to know when we launch.'),
        email(),
        submit('Notify me', false),
      ],
    }),
  },
  {
    key: 'waitlist',
    design: 'image-behind',
    image: IMG.neon,
    titleKey: 'waitlist',
    make: (name) => ({
      ...base(name, 'image-behind', IMG.neon),
      contentItems: [
        heading('Get early access'),
        text('Join the waitlist and skip the line.'),
        email(),
        submit('Join the waitlist'),
      ],
    }),
  },
  {
    key: 'feedback',
    design: 'image-left',
    image: IMG.desk,
    titleKey: 'feedback',
    make: (name) => ({
      ...base(name, 'image-left', IMG.desk),
      contentItems: [
        heading('How are we doing?'),
        text('Tell us what you think — it takes a minute.'),
        {
          id: makeId('free-text-input'),
          order: 2,
          type: 'free-text-input',
          value: 'Your feedback',
          onSubmitRequest: { target: 'body', key: 'feedback' },
        },
        submit('Send feedback', false),
      ],
    }),
  },
  {
    key: 'minimal',
    design: 'basic',
    image: '',
    titleKey: 'minimal',
    make: (name) => ({
      ...base(name, 'basic'),
      contentItems: [
        heading('Stay in the loop'),
        text('No spam. Unsubscribe anytime.'),
        email(),
        submit('Sign up', false),
      ],
    }),
  },
];
