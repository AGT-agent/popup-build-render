import type { JSX } from 'react';
import { useT } from '../i18n';

export type Align = 'left' | 'center' | 'right';

// --- Align toolbar ---------------------------------------------------------
// Segmented icon buttons. Values are physical (left/center/right) so the icons
// read the same in LTR and RTL.
export function AlignToolbar({ value, onChange }: { value: Align; onChange: (a: Align) => void }) {
  const t = useT();
  const opts: { v: Align; icon: JSX.Element; label: string }[] = [
    { v: 'left', icon: ALIGN_LEFT, label: t.enums.align.left },
    { v: 'center', icon: ALIGN_CENTER, label: t.enums.align.center },
    { v: 'right', icon: ALIGN_RIGHT, label: t.enums.align.right },
  ];
  return (
    <div className="seg-toolbar" role="group">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          className={`seg-btn${value === o.v ? ' active' : ''}`}
          aria-pressed={value === o.v}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.v)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// --- Color picker ----------------------------------------------------------
// A compact hex field with a small circular swatch at the inline-end. The
// swatch IS the native <input type="color"> (opacity 0) laid over a ring, so
// clicking it opens the OS picker; the text field keeps arbitrary values
// (empty, named colors) working.
export function ColorField({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder?: string;
  onChange: (c: string | undefined) => void;
}) {
  const swatch = toHex(value) ?? toHex(placeholder) ?? '#000000';
  return (
    <div className="color-field">
      <input
        type="text"
        className="color-hex"
        dir="ltr"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
      <span
        className="color-swatch"
        style={{ ['--swatch' as string]: value || placeholder || 'transparent' }}
      >
        <input
          type="color"
          value={swatch}
          aria-label="color"
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </div>
  );
}

// <input type="color"> only accepts #rrggbb. Coerce #rgb shorthand and reject
// anything else so the native picker still opens on a sensible default.
function toHex(c?: string): string | undefined {
  if (!c) return undefined;
  const v = c.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return undefined;
}

// --- Icons -----------------------------------------------------------------
const icon = (children: JSX.Element) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ALIGN_LEFT = icon(<><path d="M4 6h16M4 12h10M4 18h13" /></>);
const ALIGN_CENTER = icon(<><path d="M4 6h16M7 12h10M6 18h12" /></>);
const ALIGN_RIGHT = icon(<><path d="M4 6h16M10 12h10M7 18h13" /></>);
