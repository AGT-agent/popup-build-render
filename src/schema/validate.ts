import {
  CONTENT_TYPES,
  DESIGNS,
  FREQUENCIES,
  designUsesImage,
  isInputType,
  type ContentItem,
  type PopupModal,
} from './types';

export interface ValidationIssue {
  path: string;
  message: string;
  level: 'error' | 'warning';
}

const TRIGGER_TYPES = ['delay', 'scroll', 'exitIntent', 'immediate'];

function validateContentItem(item: ContentItem, index: number, issues: ValidationIssue[]): void {
  const at = `contentItems[${index}]`;
  if (!item.id) issues.push({ path: `${at}.id`, message: 'Item id is required.', level: 'error' });
  if (!CONTENT_TYPES.includes(item.type)) {
    issues.push({ path: `${at}.type`, message: `Unknown type "${item.type}".`, level: 'error' });
  }

  if ((item.type === 'heading' || item.type === 'text' || item.type === 'submit-button') && !item.value) {
    issues.push({ path: `${at}.value`, message: `"${item.type}" needs a value.`, level: 'warning' });
  }

  if (item.type === 'radio' && (!item.options || item.options.length === 0)) {
    issues.push({ path: `${at}.options`, message: 'Radio needs at least one option.', level: 'error' });
  }

  if (isInputType(item.type)) {
    const req = item.onSubmitRequest;
    if (req && req.target !== 'header' && req.target !== 'body') {
      issues.push({ path: `${at}.onSubmitRequest.target`, message: 'target must be "header" or "body".', level: 'error' });
    }
    // email defaults its key to "email"; every other input must declare one.
    if (item.type !== 'email' && req && !req.key) {
      issues.push({ path: `${at}.onSubmitRequest.key`, message: 'A submit key is required for this input.', level: 'warning' });
    }
  }
}

/** Structural validation. Returns issues; empty array = valid. */
export function validatePopup(popup: PopupModal): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!popup.id) issues.push({ path: 'id', message: 'id is required.', level: 'error' });
  if (!popup.name) issues.push({ path: 'name', message: 'name is required.', level: 'warning' });
  if (!popup.url) issues.push({ path: 'url', message: 'url is required.', level: 'error' });
  if (popup.method !== 'GET' && popup.method !== 'POST') {
    issues.push({ path: 'method', message: 'method must be GET or POST.', level: 'error' });
  }
  if (!DESIGNS.includes(popup.design)) {
    issues.push({ path: 'design', message: `Unknown design "${popup.design}".`, level: 'error' });
  }
  if (designUsesImage(popup.design) && !popup.imageUrl) {
    issues.push({ path: 'imageUrl', message: `Design "${popup.design}" needs an imageUrl.`, level: 'warning' });
  }
  if (!popup.trigger || !TRIGGER_TYPES.includes(popup.trigger.type)) {
    issues.push({ path: 'trigger', message: 'A valid trigger is required.', level: 'error' });
  } else if (popup.trigger.type === 'delay' && typeof popup.trigger.seconds !== 'number') {
    issues.push({ path: 'trigger.seconds', message: 'delay trigger needs seconds.', level: 'error' });
  } else if (popup.trigger.type === 'scroll' && typeof popup.trigger.percent !== 'number') {
    issues.push({ path: 'trigger.percent', message: 'scroll trigger needs percent.', level: 'error' });
  }
  if (popup.frequency && !FREQUENCIES.includes(popup.frequency)) {
    issues.push({ path: 'frequency', message: `Unknown frequency "${popup.frequency}".`, level: 'error' });
  }

  if (!Array.isArray(popup.contentItems) || popup.contentItems.length === 0) {
    issues.push({ path: 'contentItems', message: 'At least one content item is required.', level: 'error' });
  } else {
    popup.contentItems.forEach((item, i) => validateContentItem(item, i, issues));
    if (!popup.contentItems.some((i) => i.type === 'submit-button')) {
      issues.push({ path: 'contentItems', message: 'No submit-button — the form cannot be submitted.', level: 'warning' });
    }
  }

  return issues;
}

export function isValidPopup(popup: PopupModal): boolean {
  return validatePopup(popup).every((i) => i.level !== 'error');
}
