import { useBuilderStore } from '../store';

export function PopupList() {
  const popups = useBuilderStore((s) => s.popups);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const createPopup = useBuilderStore((s) => s.createPopup);

  return (
    <div className="sidebar">
      <h1>Popup Builder</h1>
      <p className="sub">{popups.length} saved</p>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="primary" onClick={() => createPopup(false)}>+ New</button>
        <button onClick={() => createPopup(true)}>Example</button>
      </div>

      {popups.map((p) => (
        <div
          key={p.id}
          className={`list-item${p.id === selectedId ? ' active' : ''}`}
          onClick={() => select(p.id)}
        >
          <div className="li-name">{p.name || 'Untitled'}</div>
          <div className="li-meta">{p.design} · {p.contentItems.length} items</div>
        </div>
      ))}

      {popups.length === 0 && <p className="sub">No popups yet — create one.</p>}
    </div>
  );
}
