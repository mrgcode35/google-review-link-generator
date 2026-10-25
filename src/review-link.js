/**
 * Pure helpers for building a Google review link.
 * No DOM, no network — safe to use in the browser, in Node, or in tests.
 */

const WRITE_REVIEW_BASE = 'https://search.google.com/local/writereview?placeid=';

// Google Place IDs are URL-safe base64-ish strings. Most start with "ChIJ",
// but other prefixes exist, so only the character set and length are checked.
const PLACE_ID_RE = /^[A-Za-z0-9_-]{20,300}$/;

/**
 * True when `value` looks like a Google Place ID.
 * @param {string} value
 */
export function isPlaceId(value) {
  return typeof value === 'string' && PLACE_ID_RE.test(value.trim());
}

/**
 * Build the "write a review" link for a Place ID.
 * @param {string} placeId
 */
export function buildReviewLink(placeId) {
  const id = String(placeId || '').trim();
  if (!isPlaceId(id)) throw new Error('Invalid Place ID');
  return WRITE_REVIEW_BASE + encodeURIComponent(id);
}

/**
 * Turn whatever the user pasted into a review link.
 *
 * Accepts:
 *  - a raw Place ID                          ChIJN1t_tDeuEmsRUsoyG83frY4
 *  - a link with ?placeid= / ?place_id=     search.google.com/local/writereview?placeid=…
 *  - a link containing place_id:<id>        google.com/maps/search/?api=1&query_place_id=…
 *  - a Google Business Profile short link   g.page/r/<code>  or  g.page/r/<code>/review
 *
 * Returns { ok: true, link, placeId?, source } or { ok: false, error, hint }.
 * @param {string} input
 */
export function parseInput(input) {
  const raw = String(input || '').trim();
  if (!raw) {
    return { ok: false, error: 'empty', hint: 'Paste a Place ID or a Google link.' };
  }

  if (isPlaceId(raw)) {
    return { ok: true, placeId: raw, link: buildReviewLink(raw), source: 'place-id' };
  }

  const url = toUrl(raw);
  if (!url) {
    return { ok: false, error: 'unrecognised', hint: 'That is not a Place ID or a web link.' };
  }

  const host = url.hostname.replace(/^www\./, '');

  // Google Business Profile short link: g.page/r/<code>[/review]
  if (host === 'g.page') {
    const m = url.pathname.match(/^\/r\/([A-Za-z0-9_-]+)/);
    if (m) {
      return { ok: true, link: `https://g.page/r/${m[1]}/review`, source: 'g-page' };
    }
  }

  // Query parameters that carry a Place ID directly.
  for (const key of ['placeid', 'place_id', 'query_place_id']) {
    const value = url.searchParams.get(key);
    if (isPlaceId(value)) {
      return { ok: true, placeId: value, link: buildReviewLink(value), source: 'url-param' };
    }
  }

  // "place_id:<id>" anywhere in the link (e.g. inside a q= search).
  const inline = decodeSafe(raw).match(/place_id[:=]([A-Za-z0-9_-]{20,300})/);
  if (inline) {
    return { ok: true, placeId: inline[1], link: buildReviewLink(inline[1]), source: 'url-inline' };
  }

  // Links we recognise but cannot convert without calling Google's servers.
  if (host === 'maps.app.goo.gl' || host === 'goo.gl') {
    return {
      ok: false,
      error: 'short-link',
      hint: 'Shortened Maps links hide the Place ID. Use the Place ID Finder link below instead.',
    };
  }
  if (host.startsWith('google.') || host.endsWith('.google.com') || host === 'google.com') {
    return {
      ok: false,
      error: 'maps-link-without-id',
      hint: 'This Google link does not include a Place ID. Use the Place ID Finder link below to get it.',
    };
  }

  return { ok: false, error: 'unrecognised', hint: 'Paste a Place ID (it usually starts with "ChIJ") or a Google link that contains one.' };
}

function toUrl(value) {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes('.') ? url : null;
  } catch {
    return null;
  }
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
