import { useBuilderStore } from '../store';

export function SavingView() {
  const popups = useBuilderStore((s) => s.popups);
  const select = useBuilderStore((s) => s.select);
  const createPopup = useBuilderStore((s) => s.createPopup);
  const removePopup = useBuilderStore((s) => s.removePopup);

  return (
    <div className="saving-view">
      <div className="saving-inner">
        <div className="head">
          <h1>Popup Builder</h1>
          <div className="btn-row">
            <button className="primary" onClick={() => createPopup(false)}>+ New popup</button>
            <button onClick={() => createPopup(true)}>Example</button>
          </div>
        </div>
        <p className="sub">{popups.length} saved template{popups.length === 1 ? '' : 's'}</p>

        {popups.length === 0 && <p className="empty">No templates yet — create one to get started.</p>}

        {popups.map((p) => (
          <div key={p.id} className="template-row" onClick={() => select(p.id)}>
            <div className="t-body">
              <div className="t-name">{p.name || 'Untitled'}</div>
              <div className="t-meta">{p.design} · {p.trigger.type} · {p.contentItems.length} items</div>
            </div>
            <div className="t-actions">
              <button
                className="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${p.name || 'Untitled'}"?`)) removePopup(p.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
