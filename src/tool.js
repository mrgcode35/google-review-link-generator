import QRCode from 'qrcode';
import { parseInput } from './review-link.js';

const DEFAULT_FINDER_URL =
  'https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder';

/**
 * Render the Google Review Link Generator into `root`.
 *
 * @param {HTMLElement} root
 * @param {object}  [options]
 * @param {string}  [options.finderUrl]   Link shown for finding a Place ID.
 * @param {string}  [options.defaultHeadline]
 * @param {string}  [options.defaultSubline]
 * @param {string}  [options.defaultAccent]
 */
export function mountReviewLinkTool(root, options = {}) {
  const opts = {
    finderUrl: DEFAULT_FINDER_URL,
    defaultHeadline: 'Enjoyed your visit?',
    defaultSubline: 'Scan to leave us a quick Google review. It really helps!',
    defaultAccent: '#1a73e8',
    ...options,
  };

  root.classList.add('rlg');
  // Static structure only — user-entered text is always set with textContent / value.
  root.innerHTML = `
    <form class="rlg-panel rlg-form" novalidate>
      <label class="rlg-label" for="rlg-input">Place ID or Google link</label>
      <div class="rlg-row">
        <input id="rlg-input" class="rlg-input" name="place" type="text" autocomplete="off" spellcheck="false"
               placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4 or a g.page/r/… link" />
        <button class="rlg-btn rlg-btn-primary" type="submit">Generate link</button>
      </div>
      <p class="rlg-error" role="alert" hidden></p>
      <details class="rlg-help">
        <summary>How do I find my Place ID?</summary>
        <ol>
          <li>Open Google's free <a class="rlg-finder" target="_blank" rel="noopener noreferrer">Place ID Finder</a>.</li>
          <li>Type the business name in the map's search box and pick it from the list.</li>
          <li>Copy the <strong>Place ID</strong> shown on the map (it usually starts with <code>ChIJ</code>) and paste it above.</li>
        </ol>
        <p>Own the profile? In Google Business Profile, choose <strong>Ask for reviews</strong> and paste that <code>g.page/r/…</code> link instead.</p>
      </details>
    </form>

    <section class="rlg-results" hidden aria-live="polite">
      <div class="rlg-panel">
        <h3 class="rlg-h">Your review link</h3>
        <div class="rlg-row">
          <input class="rlg-input rlg-link" type="text" readonly aria-label="Review link" />
          <button class="rlg-btn rlg-copy" type="button">Copy</button>
          <a class="rlg-btn rlg-open" target="_blank" rel="noopener noreferrer">Test link</a>
        </div>
        <p class="rlg-note">Send this link by text, email or WhatsApp. It opens the Google review box directly.</p>
      </div>

      <div class="rlg-grid">
        <div class="rlg-panel">
          <h3 class="rlg-h">QR code</h3>
          <div class="rlg-qr" aria-label="QR code for the review link"></div>
          <div class="rlg-row rlg-row-wrap">
            <button class="rlg-btn rlg-dl-png" type="button">Download PNG</button>
            <button class="rlg-btn rlg-dl-svg" type="button">Download SVG</button>
          </div>
        </div>

        <div class="rlg-panel">
          <h3 class="rlg-h">Printable review card</h3>
          <label class="rlg-label" for="rlg-name">Business name (optional)</label>
          <input id="rlg-name" class="rlg-input rlg-name" type="text" maxlength="60" placeholder="Acme Plumbing" />
          <label class="rlg-label" for="rlg-headline">Headline</label>
          <input id="rlg-headline" class="rlg-input rlg-headline" type="text" maxlength="60" />
          <label class="rlg-label" for="rlg-subline">Message</label>
          <input id="rlg-subline" class="rlg-input rlg-subline" type="text" maxlength="120" />
          <label class="rlg-label" for="rlg-accent">Accent colour</label>
          <input id="rlg-accent" class="rlg-color rlg-accent" type="color" />
        </div>
      </div>

      <div class="rlg-panel">
        <div class="rlg-card-wrap">
          <div class="rlg-card">
            <div class="rlg-card-bar"></div>
            <p class="rlg-card-name"></p>
            <p class="rlg-card-headline"></p>
            <div class="rlg-card-qr"></div>
            <p class="rlg-card-subline"></p>
            <p class="rlg-card-stars" aria-hidden="true">★★★★★</p>
          </div>
        </div>
        <div class="rlg-row rlg-row-center">
          <button class="rlg-btn rlg-btn-primary rlg-print" type="button">Print / Save as PDF</button>
        </div>
        <p class="rlg-note rlg-center">The card has no third-party branding, so agencies can hand it to clients as their own.</p>
      </div>
    </section>
  `;

  const $ = (sel) => root.querySelector(sel);
  const form = $('.rlg-form');
  const input = $('.rlg-input');
  const error = $('.rlg-error');
  const results = $('.rlg-results');
  const linkField = $('.rlg-link');
  const openBtn = $('.rlg-open');
  const copyBtn = $('.rlg-copy');
  const qrBox = $('.rlg-qr');
  const cardQr = $('.rlg-card-qr');
  const nameIn = $('.rlg-name');
  const headlineIn = $('.rlg-headline');
  const sublineIn = $('.rlg-subline');
  const accentIn = $('.rlg-accent');
  const card = $('.rlg-card');

  $('.rlg-finder').href = opts.finderUrl;
  headlineIn.value = opts.defaultHeadline;
  sublineIn.value = opts.defaultSubline;
  accentIn.value = opts.defaultAccent;

  let currentLink = '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = parseInput(input.value);
    if (!result.ok) {
      error.textContent = result.hint;
      error.hidden = false;
      results.hidden = true;
      return;
    }
    error.hidden = true;
    currentLink = result.link;
    linkField.value = currentLink;
    openBtn.href = currentLink;
    await renderQr();
    updateCard();
    results.hidden = false;
    root.dispatchEvent(new CustomEvent('rlg:generated', { bubbles: true, detail: { source: result.source } }));
  });

  copyBtn.addEventListener('click', async () => {
    await copyText(currentLink, linkField);
    flash(copyBtn, 'Copied!');
  });

  $('.rlg-dl-png').addEventListener('click', async () => {
    const url = await QRCode.toDataURL(currentLink, { width: 1024, margin: 2, errorCorrectionLevel: 'M' });
    download(url, 'google-review-qr.png');
  });

  $('.rlg-dl-svg').addEventListener('click', async () => {
    const svg = await QRCode.toString(currentLink, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    download(url, 'google-review-qr.svg');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  [nameIn, headlineIn, sublineIn, accentIn].forEach((el) => el.addEventListener('input', updateCard));

  $('.rlg-print').addEventListener('click', () => {
    document.body.classList.add('rlg-printing');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('rlg-printing'));

  async function renderQr() {
    // SVG output from the qrcode library, generated from a validated https URL.
    const svg = await QRCode.toString(currentLink, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    qrBox.innerHTML = svg;
    cardQr.innerHTML = svg;
  }

  function updateCard() {
    const name = nameIn.value.trim();
    $('.rlg-card-name').textContent = name;
    $('.rlg-card-name').hidden = !name;
    $('.rlg-card-headline').textContent = headlineIn.value.trim();
    $('.rlg-card-subline').textContent = sublineIn.value.trim();
    card.style.setProperty('--rlg-card-accent', accentIn.value);
  }

  return {
    /** Programmatically fill the input and generate. */
    generate(value) {
      input.value = value;
      form.requestSubmit();
    },
  };
}

async function copyText(text, field) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    field.select();
    document.execCommand('copy');
  }
}

function download(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function flash(button, label) {
  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => { button.textContent = original; }, 1500);
}
