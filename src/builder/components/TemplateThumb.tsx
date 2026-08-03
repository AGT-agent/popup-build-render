import type { PopupDesign } from '@schema';

/** A little wireframe of a popup layout: the real image (when the design uses
    one) plus bars standing in for the heading, field, and button. Arrangement
    is driven by `design`. Shared by the starter gallery and the saved list. */
export function TemplateThumb({
  design,
  image,
  className = '',
}: {
  design: PopupDesign;
  image?: string;
  className?: string;
}) {
  return (
    <div className={`tpl-thumb tpl-${design} ${className}`.trim()}>
      {image && (
        <div className="tpl-media" style={{ backgroundImage: `url(${image})` }} />
      )}
      <div className="tpl-mock">
        <span className="tpl-bar tpl-bar-title" />
        <span className="tpl-bar tpl-bar-input" />
        <span className="tpl-bar tpl-bar-btn" />
      </div>
    </div>
  );
}
