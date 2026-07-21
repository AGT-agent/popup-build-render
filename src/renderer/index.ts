// Renderer public API.
// Two halves, usable independently:
//   - PopupContent : pure rendering of a PopupModal (design + contentItems + submit)
//   - PopupMount   : the mount layer (trigger, frequency, dismiss, placement)
//   - mountPopup   : vanilla loader for embedding on a storefront
export { PopupContent } from './PopupContent';
export type { PopupContentProps } from './PopupContent';
export { PopupMount } from './PopupMount';
export type { PopupMountProps } from './PopupMount';
export { mountPopup } from './mount';
export type { MountHandle, MountOptions } from './mount';
export { useTrigger } from './useTrigger';
export { canOpen, markShown } from './frequency';
export {
  assembleRequest,
  submitPopup,
  firstMissingRequired,
  readPath,
} from './submit';
export type { FormValues, SubmitOutcome, AssembledRequest } from './submit';
export { ensureStyles } from './styles';
