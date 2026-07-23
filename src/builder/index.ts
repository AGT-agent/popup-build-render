// Builder public API. Import 'popup-build-render/builder.css' alongside this —
// Vite emits the stylesheet as a separate file rather than injecting it.
import './builder.css';

export { App as PopupBuilder } from './App';
export type { PopupBuilderProps } from './App';
export {
  useBuilderStore,
  getAllPopups,
  getActivePopup,
  getActivePopups,
  selectActivePopup,
  selectActivePopups,
  subscribeActivePopup,
  subscribeActivePopups,
} from './store';
export type { BuilderState } from './store';
