import { useBuilderStore } from '../store';
import { isRtl, useLang, useT } from '../i18n';
import { JsonPane } from './JsonPane';

export function SavingView() {
  const t = useT();
  const lang = useLang();
  const popups = useBuilderStore((s) => s.popups);
  const select = useBuilderStore((s) => s.select);
  const activeIds = useBuilderStore((s) => s.activeIds);
  const singleMode = useBuilderStore((s) => s.singleMode);
  const toggleActive = useBuilderStore((s) => s.toggleActive);
  const clearActive = useBuilderStore((s) => s.clearActive);
  const setSingleMode = useBuilderStore((s) => s.setSingleMode);
  const createPopup = useBuilderStore((s) => s.createPopup);
  const removePopup = useBuilderStore((s) => s.removePopup);

  const activePopups = popups.filter((p) => activeIds.includes(p.id));

  return (
    <div className="saving-view">
      <div className="saving-inner">
        <div className="head">
          <h1>{t.app.title}</h1>
          <div className="btn-row">
            {/* Seed the starter copy — and its direction — from the builder's
                own language, so a Hebrew author starts RTL. */}
            <button
              className="primary"
              onClick={() => createPopup(false, t.defaults, isRtl(lang) ? 'rtl' : undefined)}
            >
              {t.app.newPopup}
            </button>
            <button onClick={() => createPopup(true)}>{t.app.example}</button>
          </div>
        </div>
        <p className="sub">{t.app.savedCount(popups.length)}</p>

        {popups.length === 0 && <p className="empty">{t.app.emptyHint}</p>}

        {popups.map((p) => {
          const isActive = activeIds.includes(p.id);
          return (
            <div
              key={p.id}
              className={`template-row${isActive ? ' in-use' : ''}`}
              onClick={() => select(p.id)}
            >
              {/* Marking a row Active must not also open it in the editor. */}
              <label className="t-check" title={t.app.markActiveTitle} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleActive(p.id)}
                />
                {t.app.active}
              </label>
              <div className="t-body">
                <div className="t-name">{p.name || t.app.untitled}</div>
                <div className="t-meta">{p.design} · {p.trigger.type} · {t.app.items(p.contentItems.length)}</div>
              </div>
              <div className="t-actions">
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t.app.confirmDelete(p.name || t.app.untitled))) removePopup(p.id);
                  }}
                >
                  {t.app.delete}
                </button>
              </div>
            </div>
          );
        })}

        {activePopups.length > 0 && (
          <div className="active-bar">
            <div className="t-body">
              <div className="t-name">
                {singleMode
                  ? t.app.usingSingle(activePopups[0].name || t.app.untitled)
                  : t.app.usingMany(activePopups.length)}
              </div>
              <div className="t-meta">
                {t.app.jsonFromHost}{' '}
                <code>{singleMode ? 'getActivePopup()' : 'getActivePopups()'}</code>.
              </div>
              <label className="t-check single-toggle" title={t.app.singleToggleTitle}>
                <input
                  type="checkbox"
                  checked={singleMode}
                  onChange={(e) => setSingleMode(e.target.checked)}
                />
                {t.app.singleToggleLabel}
              </label>
            </div>
            <div className="btn-row">
              {singleMode ? (
                <JsonPane popup={activePopups[0]} label={t.app.showJson} />
              ) : (
                <JsonPane popups={activePopups} label={t.app.showJson} />
              )}
              <button className="ghost" onClick={clearActive}>{t.app.clear}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
