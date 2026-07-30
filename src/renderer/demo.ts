// Standalone renderer demo — NOT the builder.
// A plain page that hands a popup JSON to `mountPopup` and lets you edit it.
// Paste any JSON the builder produces (its "Copy JSON" button) into the box.
import type { PopupModal } from '@schema';
import { mountPopup, type MountHandle } from './index';

// A self-contained starter popup. Trigger is `immediate` and frequency `always`
// so it opens the moment you click Render, every time — handy for a demo.
const STARTER: PopupModal = {
  id: 'demo-popup',
  name: 'Demo popup',
  url: 'https://httpbin.org/post',
  method: 'POST',
  trigger: { type: 'immediate' },
  design: 'basic',
  dismissible: true,
  frequency: 'always',
  onSuccess: {
    type: 'message',
    template: 'coupon',
    heading: "You're in!",
    text: 'Use this code at checkout:',
    code: 'DEMO15',
    copyable: true,
  },
  onError: { type: 'message', text: 'Something went wrong — please try again.' },
  onSubmitCallbackPayload: [{ key: 'source', value: 'demo-page' }],
  contentItems: [
    { id: 'h', order: 0, type: 'heading', value: 'Get 15% off your first order', styleProps: { align: 'center' } },
    { id: 't', order: 1, type: 'text', value: 'Join the list and grab your code.', styleProps: { align: 'center' } },
    { id: 'e', order: 2, type: 'email', value: 'Your email', required: true, onSubmitRequest: { key: 'email' } },
    { id: 'b', order: 3, type: 'submit-button', value: 'Claim my discount', styleProps: { backgroundColor: '#4f46e5' } },
  ],
};

const app = document.getElementById('app')!;
app.innerHTML = `
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #f3f4f6; color: #111827; }
    .wrap { max-width: 760px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    p.sub { color: #6b7280; margin: 0 0 20px; font-size: 14px; }
    textarea { width: 100%; height: 320px; font-family: ui-monospace, monospace; font-size: 12px; padding: 12px; border: 1px solid #d1d5db; border-radius: 10px; box-sizing: border-box; }
    .row { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; align-items: center; }
    button { font: inherit; cursor: pointer; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; padding: 9px 14px; font-size: 14px; }
    button.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
    .err { color: #b91c1c; font-size: 13px; }
    .hint { color: #6b7280; font-size: 12px; }
    code { background: #e5e7eb; padding: 1px 5px; border-radius: 4px; }
  </style>
  <div class="wrap">
    <h1>Renderer demo</h1>
    <p class="sub">This page calls <code>mountPopup(json)</code> directly — no builder involved. Edit the JSON and hit Render.</p>
    <textarea id="json" spellcheck="false"></textarea>
    <div class="row">
      <button class="primary" id="render">Render popup</button>
      <button id="reset-freq">Reset frequency cap</button>
      <span id="msg" class="err"></span>
    </div>
    <p class="hint">Submit posts to <code>httpbin.org</code> and shows the coupon on success. The <code>Reset frequency cap</code> button clears this popup's <code>localStorage</code>/<code>sessionStorage</code> record so a capped popup can reopen.</p>
  </div>
`;

const textarea = document.getElementById('json') as HTMLTextAreaElement;
const msg = document.getElementById('msg')!;
textarea.value = JSON.stringify(STARTER, null, 2);

let handle: MountHandle | null = null;

document.getElementById('render')!.addEventListener('click', () => {
  msg.textContent = '';
  let popup: PopupModal;
  try {
    popup = JSON.parse(textarea.value);
  } catch (e) {
    msg.textContent = `Invalid JSON: ${(e as Error).message}`;
    return;
  }
  handle?.unmount();
  handle = mountPopup(popup);
});

document.getElementById('reset-freq')!.addEventListener('click', () => {
  msg.textContent = '';
  try {
    const { id } = JSON.parse(textarea.value) as PopupModal;
    localStorage.removeItem(`popup-seen:${id}`);
    sessionStorage.removeItem(`popup-seen:${id}`);
    msg.style.color = '#059669';
    msg.textContent = `Cleared frequency record for "${id}".`;
    setTimeout(() => (msg.textContent = ''), 1500);
  } catch {
    msg.style.color = '#b91c1c';
    msg.textContent = 'Fix the JSON first.';
  }
});
