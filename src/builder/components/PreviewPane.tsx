import { useMemo, useState } from 'react';
import type { PopupModal } from '@schema';
import { PopupMount } from '@renderer';

/** A mock fetch so preview submits resolve without hitting a real endpoint. */
function makeMockFetch(): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ data: { discountCode: 'PREVIEW10' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
}

export function PreviewPane({ popup }: { popup: PopupModal }) {
  const [replayKey, setReplayKey] = useState(0);
  const mockFetch = useMemo(makeMockFetch, []);

  return (
    <div>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <span className="pill">Live preview</span>
        <button onClick={() => setReplayKey((k) => k + 1)}>↻ Replay</button>
      </div>
      <div className="preview-frame">
        {/* forceOpen bypasses trigger + frequency; preview blocks real navigation. */}
        <PopupMount
          key={`${popup.id}-${replayKey}`}
          popup={popup}
          forceOpen
          preview
          fetchImpl={mockFetch}
          onClose={() => setReplayKey((k) => k + 1)}
        />
      </div>
      <p className="sub" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
        Preview ignores the trigger and frequency cap and never submits to a real endpoint.
      </p>
    </div>
  );
}
