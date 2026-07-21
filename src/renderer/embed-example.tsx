// Standalone storefront embed example.
// This is how a merchant page consumes a popup JSON produced by the builder —
// no builder, no React knowledge required beyond this one call.
//
// Build it as its own entry, drop the script on the page, and the loader wires
// up the trigger, frequency cap and placement automatically.
import { mountPopup } from './mount';
import type { PopupModal } from '@schema';

// In practice this JSON comes from the merchant's saved config / API.
const popup: PopupModal = {
  id: 'welcome-15',
  name: 'Welcome 15% off',
  url: 'https://shop.example.com/api/subscribe',
  method: 'POST',
  trigger: { type: 'delay', seconds: 3 },
  design: 'basic',
  dismissible: true,
  frequency: 'session',
  onSuccess: { type: 'coupon', text: "You're in!", code: 'WELCOME15', copyable: true },
  contentItems: [
    { id: 'h', order: 0, type: 'heading', value: 'Get 15% off' },
    { id: 'e', order: 1, type: 'email', value: 'Your email', required: true, onSubmitRequest: { target: 'body', key: 'email' } },
    { id: 'b', order: 2, type: 'submit-button', value: 'Claim discount' },
  ],
};

mountPopup(popup);
