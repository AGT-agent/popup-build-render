import { useRef } from 'react';
import type { PopupModal } from '@schema';
import { useBuilderStore } from './store';
import { PopupList } from './components/PopupList';
import { SettingsEditor } from './components/SettingsEditor';
import { ContentItemsEditor } from './components/ContentItemsEditor';
import { PreviewPane } from './components/PreviewPane';
import { JsonPane } from './components/JsonPane';

export function App() {
  const popups = useBuilderStore((s) => s.popups);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const updatePopup = useBuilderStore((s) => s.updatePopup);
  const duplicatePopup = useBuilderStore((s) => s.duplicatePopup);
  const removePopup = useBuilderStore((s) => s.removePopup);
  const importPopups = useBuilderStore((s) => s.importPopups);

  const selected = popups.find((p) => p.id === selectedId) ?? null;
  const fileInput = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<PopupModal>) => selected && updatePopup(selected.id, p);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(popups, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'popups.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const arr: PopupModal[] = Array.isArray(parsed) ? parsed : [parsed];
      importPopups(arr);
    } catch {
      alert('Could not parse that file as popup JSON.');
    }
  };

  return (
    <div className="app">
      <PopupList />

      <div className="editor">
        {!selected ? (
          <p className="empty">Select a popup on the left, or create a new one.</p>
        ) : (
          <>
            <div className="toolbar">
              <input
                className="name-input"
                value={selected.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
              <div className="btn-row">
                <button onClick={() => duplicatePopup(selected.id)}>Duplicate</button>
                <button className="danger" onClick={() => removePopup(selected.id)}>Delete</button>
              </div>
            </div>

            <SettingsEditor popup={selected} onChange={patch} />
            <ContentItemsEditor popup={selected} onChange={patch} />

            <div className="btn-row" style={{ marginTop: 4 }}>
              <button onClick={exportAll}>Export all (JSON)</button>
              <button onClick={() => fileInput.current?.click()}>Import</button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          </>
        )}
      </div>

      <div className="preview-pane">
        {selected ? (
          <>
            <PreviewPane popup={selected} />
            <JsonPane popup={selected} />
          </>
        ) : (
          <p className="empty">No popup selected.</p>
        )}
      </div>
    </div>
  );
}
