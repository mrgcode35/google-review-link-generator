# Google Review Link Generator

Free, open-source tool that turns a Google **Place ID** (or a Google link that contains one) into:

- a **direct review link** that opens the Google "write a review" box,
- a **QR code** (PNG and SVG download),
- a **printable review card** with your own headline, message and colour — print it or save it as PDF.

Everything runs **in the browser**. No API key, no server, no sign-up, nothing is stored.

**Live version:** https://tools.serpnetic.cloud/google-review-link-generator/

## What it accepts

| You paste | Example |
|---|---|
| A Place ID | `ChIJN1t_tDeuEmsRUsoyG83frY4` |
| An existing review link | `https://search.google.com/local/writereview?placeid=…` |
| A Maps link with a Place ID | `https://www.google.com/maps/search/?api=1&query_place_id=…` |
| A Business Profile short link | `https://g.page/r/<code>/review` |

Shortened `maps.app.goo.gl` links and plain Maps URLs don't contain a Place ID. For those, the tool
points you to Google's free [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).

## Run it locally

```bash
npm install
npm run dev     # demo page at http://localhost:5173
npm test        # unit tests (Node 18+)
npm run build   # static files in dist/
```

## Use it in your own site

```js
import 'google-review-link-generator/style.css';
import { mountReviewLinkTool } from 'google-review-link-generator';

mountReviewLinkTool(document.getElementById('tool'), {
  defaultAccent: '#e07a2e', // optional
});
```

Theme it by overriding the `--rlg-*` CSS variables on `.rlg`. The logic is also exported on its own:

```js
import { parseInput } from 'google-review-link-generator';
parseInput('ChIJN1t_tDeuEmsRUsoyG83frY4').link;
// → https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4
```

## For agencies

The printable card carries **no third-party branding**, so you can hand it to clients as your own.

## Licence

[MIT](LICENSE) — free to use, copy and modify. Made by [Serpnetic](https://serpnetic.com).
