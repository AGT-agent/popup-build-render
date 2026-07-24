// Base styles for the rendered popup. Injected once into the host document so
// the renderer stays self-contained and embeddable on any storefront.
export const POPUP_STYLE_ID = 'popup-renderer-styles';

export const POPUP_CSS = `
.pm-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(17, 24, 39, 0.55); padding: 16px;
}
.pm-card {
  position: relative; box-sizing: border-box;
  display: flex; flex-direction: column;
  background: #fff; color: #111827; border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%; max-width: 520px; min-height: 350px; overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
.pm-card.pm-has-image { max-width: 720px; }
.pm-layout { display: flex; flex: 1; }
.pm-layout.pm-image-left { flex-direction: row; }
.pm-layout.pm-image-right { flex-direction: row-reverse; }
.pm-media { flex: 1 1 45%; min-height: 240px; background-size: cover; background-position: center; }
.pm-body { flex: 1 1 55%; padding: 28px; display: flex; flex-direction: column; gap: 14px; }
.pm-image-behind .pm-body { position: relative; z-index: 1; color: #fff; }
.pm-image-behind .pm-media {
  position: absolute; inset: 0; z-index: 0;
}
.pm-image-behind .pm-media::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
.pm-close {
  position: absolute; top: 10px; right: 12px; z-index: 2;
  border: none; background: transparent; font-size: 22px; line-height: 1;
  cursor: pointer; color: inherit; opacity: 0.7;
}
.pm-close:hover { opacity: 1; }
[dir="rtl"] .pm-close { right: auto; left: 12px; }
.pm-heading { font-size: 22px; font-weight: 700; margin: 0; }
.pm-text { font-size: 15px; margin: 0; opacity: 0.9; }
.pm-spacer { flex: none; width: 100%; }
.pm-field { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.pm-field input[type="email"], .pm-field input[type="text"] {
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;
}
.pm-radio-group { display: flex; flex-direction: column; gap: 8px; }
.pm-radio-option, .pm-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.pm-submit {
  margin-top: auto; padding: 12px 16px; border: none; border-radius: 8px; cursor: pointer;
  background: #111827; color: #fff; font-size: 15px; font-weight: 600;
}
.pm-submit:disabled { opacity: 0.6; cursor: default; }
.pm-error { color: #b91c1c; font-size: 14px; margin: 0; }
.pm-coupon-code {
  display: inline-flex; align-items: center; gap: 10px;
  border: 1px dashed #9ca3af; border-radius: 8px; padding: 10px 14px;
  font-family: ui-monospace, monospace; font-size: 16px; font-weight: 700;
}
.pm-copy { border: none; background: #111827; color: #fff; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
@media (max-width: 560px) {
  .pm-layout { flex-direction: column !important; }
  .pm-media { min-height: 160px; }
}
`;

export function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(POPUP_STYLE_ID)) return;
  const el = doc.createElement('style');
  el.id = POPUP_STYLE_ID;
  el.textContent = POPUP_CSS;
  doc.head.appendChild(el);
}
