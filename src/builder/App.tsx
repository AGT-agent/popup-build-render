import { useBuilderStore } from './store';
import { SavingView } from './components/SavingView';
import { EditingView } from './components/EditingView';

export function App() {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const popups = useBuilderStore((s) => s.popups);
  const selected = popups.find((p) => p.id === selectedId) ?? null;

  // Two parts: the saving view (template list) and the editing view.
  // Selecting a template moves you into editing; "← All templates" returns.
  return selected ? <EditingView popup={selected} /> : <SavingView />;
}
