import type { PopupModal } from '@schema';
import { useBuilderStore } from '../store';
import { SettingsEditor } from './SettingsEditor';
import { ContentItemsEditor } from './ContentItemsEditor';
import { PreviewPane } from './PreviewPane';
import { JsonPane } from './JsonPane';

export function EditingView({ popup }: { popup: PopupModal }) {
  const select = useBuilderStore((s) => s.select);
  const updatePopup = useBuilderStore((s) => s.updatePopup);

  const patch = (p: Partial<PopupModal>) => updatePopup(popup.id, p);

  return (
    <div className="editing-view">
      {/* Narrow menu on the left */}
      <div className="edit-menu">
        <button className="ghost back" onClick={() => select(null)}>← All templates</button>
        <input
          className="name-input"
          value={popup.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
        <SettingsEditor popup={popup} onChange={patch} />
        <ContentItemsEditor popup={popup} onChange={patch} />
      </div>

      {/* Big display on the right */}
      <div className="edit-display">
        <div className="display-preview">
          <PreviewPane popup={popup} />
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <JsonPane popup={popup} />
        </div>
      </div>
    </div>
  );
}
