import { useBuilderStore } from '../store';
import { PRESETS, type Preset } from '../presets';
import { useT, useDir } from '../i18n';
import { TemplateThumb } from './TemplateThumb';

/** The starter gallery — a blank option plus one card per layout preset.
 *  `onPicked` fires after any choice so a host modal can close itself. */
export function TemplateGallery({ onPicked }: { onPicked?: () => void }) {
  const t = useT();
  const dir = useDir();
  const addPopup = useBuilderStore((s) => s.addPopup);
  const createPopup = useBuilderStore((s) => s.createPopup);

  return (
    <div className="gallery">
      <div className="gallery-head">
        <p className="sub">{t.gallery.subheading}</p>
      </div>
      <div className="gallery-grid">
        <BlankCard
          title={t.gallery.blank}
          layout={t.gallery.blankLayout}
          onPick={() => {
            createPopup(false, dir);
            onPicked?.();
          }}
        />
        {PRESETS.map((preset) => (
          <GalleryCard
            key={preset.key}
            preset={preset}
            title={t.presets[preset.titleKey]}
            layout={t.enums.design[preset.design]}
            onPick={(name) => {
              addPopup({ ...preset.make(name), direction: dir });
              onPicked?.();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GalleryCard({
  preset,
  title,
  layout,
  onPick,
}: {
  preset: Preset;
  title: string;
  layout: string;
  onPick: (name: string) => void;
}) {
  return (
    <button type="button" className="tpl-card" onClick={() => onPick(title)}>
      <TemplateThumb design={preset.design} image={preset.image} />
      <div className="tpl-info">
        <span className="tpl-title">{title}</span>
        <span className="tpl-layout">{layout}</span>
      </div>
    </button>
  );
}

/** Start-from-scratch card: an empty dashed thumb instead of a layout preview. */
function BlankCard({
  title,
  layout,
  onPick,
}: {
  title: string;
  layout: string;
  onPick: () => void;
}) {
  return (
    <button type="button" className="tpl-card" onClick={onPick}>
      <div className="tpl-thumb tpl-blank">
        <span className="tpl-blank-plus">+</span>
      </div>
      <div className="tpl-info">
        <span className="tpl-title">{title}</span>
        <span className="tpl-layout">{layout}</span>
      </div>
    </button>
  );
}
