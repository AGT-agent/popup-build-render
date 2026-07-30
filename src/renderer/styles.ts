// Base styles for the rendered popup. Injected once into the host document so
// the renderer stays self-contained and embeddable on any storefront.
export const POPUP_STYLE_ID = "popup-renderer-styles";

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
  width: 100%; max-width: 520px; min-height: 400px; overflow: hidden;
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
/* Colors are declared, not inherited: a host stylesheet with a bare \`input\`
   rule (the builder's own dark theme, for one) would otherwise bleed through. */
.pm-field input[type="email"], .pm-field input[type="text"] {
  padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px;
  background: #fff; color: #111827;
}
.pm-radio-group { display: flex; flex-direction: column; gap: 8px; }
.pm-radio-option, .pm-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.pm-submit {
  margin-top: auto; padding: 12px 16px; border: none; border-radius: 8px; cursor: pointer;
  background: #111827; color: #fff; font-size: 15px; font-weight: 600;
}
.pm-submit:disabled { opacity: 0.6; cursor: default; }
.pm-error { color: #b91c1c; font-size: 14px; margin: 0; }

/* --- Success screens (onSuccess message templates) ---------------------- */
.pm-success {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; width: 100%; flex: 1;
  animation: pm-rise 260ms ease-out both;
}
/* The stack swallows the card's spare height and centres its contents inside
   it. That keeps Done on the bottom edge — where the form's submit button sits
   — instead of floating mid-card above a growing void as the card gets taller. */
.pm-success-stack {
  flex: 1; width: 100%; min-height: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
}
.pm-success-heading { font-size: 21px; font-weight: 700; margin: 0; line-height: 1.25; }
.pm-success-text { font-size: 15px; margin: 0; opacity: 0.75; line-height: 1.5; max-width: 34ch; }
.pm-success-done { margin-top: 14px; width: 100%; }

/* Small confirmation badge on the simple + coupon templates. */
.pm-success-badge {
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border-radius: 50%; box-sizing: border-box;
  background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
  animation: pm-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.pm-success-badge svg { width: 26px; height: 26px; }

/* Full artwork on the illustration template. */
.pm-success-art { color: #111827; animation: pm-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.pm-success-art svg { width: 128px; height: 128px; display: block; }
/* The disc behind the line-art illustration — kept faint so the strokes read.
   The full-color pieces bake their own disc into the SVG instead. */
.pm-art-disc { fill: rgba(17, 24, 39, 0.06); }
.pm-image-behind .pm-success-art { color: #fff; }
.pm-image-behind .pm-art-disc { fill: rgba(255, 255, 255, 0.16); }
.pm-image-behind .pm-success-badge { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.4); color: #fff; }

/* The image template splits its message area two-to-one: photo across the top,
   copy and button beneath. \`.pm-body-flush\` drops the body padding so the photo
   really does reach the edges — the card's own \`overflow: hidden\` rounds it. */
.pm-body-flush { padding: 0; gap: 0; }
.pm-success-image {
  flex: 1; width: 100%; margin: 0; gap: 0;
  align-items: stretch; justify-content: stretch;
}
/* min-height:0 lets the photo give way; the panel deliberately has none, so a
   long heading pushes it past a third rather than clipping. */
.pm-success-photo {
  flex: 2 1 0; min-height: 0; width: 100%;
  display: block; object-fit: cover;
}
.pm-success-panel {
  flex: 1 1 0; box-sizing: border-box;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding: 18px 28px 22px; text-align: center;
}

/* Coupon ticket. Deliberately background-independent (no punched-out notches,
   which would have to match the card behind them) so it reads the same on a
   plain card and on the dark overlay of the image-behind design. */
.pm-coupon {
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; padding: 14px 18px;
  border: 2px dashed #d1d5db; border-radius: 12px;
  background: repeating-linear-gradient(135deg, #f9fafb 0 10px, #f3f4f6 10px 20px);
}
.pm-coupon-code {
  font-family: ui-monospace, monospace; font-size: 19px; font-weight: 700;
  letter-spacing: 0.12em; color: #111827; overflow-wrap: anywhere;
}
.pm-copy {
  border: none; background: #111827; color: #fff; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 600; flex: none;
}
.pm-copy:hover { opacity: 0.88; }

/* Confetti burst. Absolute, not fixed, so it fills whatever box the overlay
   occupies — the viewport on a storefront, the preview frame in the builder. */
.pm-confetti {
  position: absolute; inset: 0; z-index: 5;
  overflow: hidden; pointer-events: none;
}
.pm-confetti-piece {
  position: absolute; border-radius: 2px;
  animation-name: pm-confetti-fall;
  animation-timing-function: linear;
  animation-fill-mode: both;
}
.pm-confetti-round { border-radius: 50%; }
/* The fall is driven by \`top\` rather than a translate so the distance is
   relative to the overlay — a viewport-height translate would race through the
   builder's much shorter preview frame. */
@keyframes pm-confetti-fall {
  0% { top: -8%; transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; }
  85% { opacity: 1; }
  100% { top: 104%; transform: translate3d(var(--pm-drift), 0, 0) rotate(var(--pm-spin)); opacity: 0; }
}

@keyframes pm-pop {
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes pm-rise {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .pm-success, .pm-success-badge, .pm-success-art { animation: none; }
  .pm-confetti { display: none; }
}
@media (max-width: 560px) {
  .pm-layout { flex-direction: column !important; }
  .pm-media { min-height: 160px; }
}
`;

export function ensureStyles(doc: Document = document): void {
  if (doc.getElementById(POPUP_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = POPUP_STYLE_ID;
  el.textContent = POPUP_CSS;
  doc.head.appendChild(el);
}
