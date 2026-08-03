import { useMemo, useState } from 'react';
import type { PopupModal } from '@schema';
import { PopupMount } from '@renderer';
import { useT } from '../i18n';

/** A mock fetch so preview submits resolve without hitting a real endpoint. */
function makeMockFetch(): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ data: { discountCode: 'PREVIEW10' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
}

export function PreviewPane({
  popup,
  onPublish,
}: {
  popup: PopupModal;
  onPublish?: (popup: PopupModal) => void;
}) {
  const t = useT();
  const [replayKey, setReplayKey] = useState(0);
  const mockFetch = useMemo(makeMockFetch, []);
  const replay = () => setReplayKey((k) => k + 1);

  return (
    <div className="preview-wrap">
      {onPublish && (
        <div className="toolbar preview-toolbar">
          <button className="primary" onClick={() => onPublish(popup)}>{t.preview.publish}</button>
        </div>
      )}
      <div className="preview-frame">
        {/* Replay floats over the preview; it re-mounts the popup to its initial
            state after you close or submit it. */}
        <button className="preview-replay" onClick={replay}>{t.preview.replay}</button>
        {/* forceOpen bypasses trigger + frequency; preview blocks real navigation. */}
        <PopupMount
          key={`${popup.id}-${replayKey}`}
          popup={popup}
          forceOpen
          preview
          fetchImpl={mockFetch}
          onClose={replay}
        />
      </div>
    </div>
  );
}
