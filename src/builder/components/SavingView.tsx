import { useEffect, useState } from 'react';
import type { PopupModal } from '@schema';
import { useBuilderStore } from '../store';
import { useT } from '../i18n';
import { TemplateGallery } from './TemplateGallery';
import { TemplateThumb } from './TemplateThumb';

export function SavingView() {
  const t = useT();
  const popups = useBuilderStore((s) => s.popups);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="saving-view">
      <div className="saving-inner">
        <div className="head">
          <h1>{t.app.title}</h1>
          <div className="btn-row">
            <button className="primary" onClick={() => setPickerOpen(true)}>{t.app.newPopup}</button>
          </div>
        </div>
        <p className="sub">{t.app.savedCount(popups.length)}</p>

        {popups.length === 0 && <p className="empty">{t.app.emptyHint}</p>}

        {popups.map((p) => (
          <PopupRow key={p.id} popup={p} />
        ))}
      </div>

      {pickerOpen && <TemplatePickerModal onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

/** "New popup" opens this: the full template gallery in a modal. Picking any
 *  card creates the popup and opens the editor, so the modal goes away with it. */
function TemplatePickerModal({ onClose }: { onClose: () => void }) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="gallery-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gallery-modal" role="dialog" aria-modal="true">
        <div className="gallery-modal-head">
          <strong>{t.gallery.heading}</strong>
          <button className="ghost" onClick={onClose}>{t.gallery.close}</button>
        </div>
        <div className="gallery-modal-body">
          <TemplateGallery onPicked={onClose} />
        </div>
      </div>
    </div>
  );
}

/** One saved-popup row. Holds a local "confirming delete" flag so removal is a
 *  two-step click instead of a blocking browser confirm dialog. */
function PopupRow({ popup: p }: { popup: PopupModal }) {
  const t = useT();
  const select = useBuilderStore((s) => s.select);
  const removePopup = useBuilderStore((s) => s.removePopup);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="template-row" onClick={() => select(p.id)}>
      <TemplateThumb design={p.design} image={p.imageUrl} className="t-thumb" />
      <div className="t-body">
        <div className="t-name">{p.name || t.app.untitled}</div>
        <div className="t-meta">{p.design} · {p.trigger.type} · {t.app.items(p.contentItems.length)}</div>
      </div>
      <div className="t-actions" onClick={(e) => e.stopPropagation()}>
        {confirming ? (
          <>
            <button className="danger" onClick={() => removePopup(p.id)}>{t.app.confirmDeleteYes}</button>
            <button className="ghost" onClick={() => setConfirming(false)}>{t.app.cancel}</button>
          </>
        ) : (
          <button className="danger" onClick={() => setConfirming(true)}>{t.app.delete}</button>
        )}
      </div>
    </div>
  );
}
