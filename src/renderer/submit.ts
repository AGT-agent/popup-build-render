import type { ContentItem, PopupModal, SubmitError, SubmitSuccess } from '@schema';

/** Live form values, keyed by content item id. */
export type FormValues = Record<string, string | boolean>;

export interface SubmitOutcome {
  ok: boolean;
  success?: SubmitSuccess;
  error?: SubmitError;
  /** Resolved coupon code, when onSuccess is a coupon. */
  couponCode?: string;
}

/** The value an input contributes to the request, resolved from its type. */
function resolveItemValue(item: ContentItem, values: FormValues): string | boolean | undefined {
  const raw = values[item.id];
  switch (item.type) {
    case 'checkbox':
      return Boolean(raw);
    case 'email':
    case 'free-text-input':
    case 'radio':
      return raw === undefined ? '' : String(raw);
    default:
      return undefined;
  }
}

function defaultKey(item: ContentItem): string {
  return item.onSubmitRequest?.key ?? (item.type === 'email' ? 'email' : item.id);
}

/** Read a dot-path (e.g. "data.coupon") out of a parsed JSON response. */
export function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export interface AssembledRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
}

/** Build the outgoing request from the popup's input items and current values. */
export function assembleRequest(popup: PopupModal, values: FormValues): AssembledRequest {
  const headers: Record<string, string> = {};
  const bodyObj: Record<string, string | boolean> = {};
  const query: Record<string, string> = {};

  for (const item of popup.contentItems) {
    if (!item.onSubmitRequest) continue;
    const value = resolveItemValue(item, values);
    if (value === undefined) continue;
    const key = defaultKey(item);
    const target = item.onSubmitRequest.target ?? 'body';

    if (target === 'header') {
      headers[key] = String(value);
    } else if (popup.method === 'GET') {
      query[key] = String(value);
    } else {
      bodyObj[key] = value;
    }
  }

  let url = popup.url;
  const qs = new URLSearchParams(query).toString();
  if (qs) url += (url.includes('?') ? '&' : '?') + qs;

  const req: AssembledRequest = { url, method: popup.method, headers };
  if (popup.method === 'POST') {
    req.headers = { 'Content-Type': 'application/json', ...headers };
    req.body = JSON.stringify(bodyObj);
  }
  return req;
}

/** Validate required inputs. Returns the id of the first offending item, or null. */
export function firstMissingRequired(popup: PopupModal, values: FormValues): string | null {
  for (const item of popup.contentItems) {
    if (!item.required) continue;
    const v = values[item.id];
    if (item.type === 'checkbox') {
      if (!v) return item.id;
    } else if (v === undefined || String(v).trim() === '') {
      return item.id;
    }
  }
  return null;
}

function resolveCoupon(success: SubmitSuccess, responseJson: unknown): string | undefined {
  if (success.type !== 'coupon') return undefined;
  if (success.codeFromResponsePath) {
    const fromResponse = readPath(responseJson, success.codeFromResponsePath);
    if (fromResponse != null && fromResponse !== '') return String(fromResponse);
  }
  return success.code;
}

/**
 * Submit the popup form to the merchant endpoint and derive the post-submit
 * behavior. Success/error is decided by HTTP status (2xx = success).
 */
export async function submitPopup(
  popup: PopupModal,
  values: FormValues,
  fetchImpl: typeof fetch = fetch,
): Promise<SubmitOutcome> {
  const req = assembleRequest(popup, values);
  const success: SubmitSuccess = popup.onSuccess ?? { type: 'close' };
  const error: SubmitError = popup.onError ?? { type: 'message', text: 'Something went wrong. Please try again.' };

  try {
    const res = await fetchImpl(req.url, { method: req.method, headers: req.headers, body: req.body });
    if (!res.ok) return { ok: false, error };

    let json: unknown = undefined;
    try {
      json = await res.clone().json();
    } catch {
      /* non-JSON response is fine unless we need a coupon path */
    }
    return { ok: true, success, couponCode: resolveCoupon(success, json) };
  } catch {
    return { ok: false, error };
  }
}
