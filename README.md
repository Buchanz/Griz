# GRiZ Site

Custom single-page GRiZ fan site with:

- A large animated home carousel
- Vinyl reveal interaction on centered albums
- Album detail pages with track lists
- About and Events overlays
- Glass-style top navigation

## Project Files

- `index.html` - Markup for home, overlays, and album pages
- `styles.css` - All visual styling and animations
- `script.js` - Carousel logic, overlay transitions, navigation behavior
- Local image assets - Album covers, vinyl PNGs, logos, profile image

## Run Locally

Use any static server. Example:

```bash
python3 -m http.server 5500
```

Then open:

- `http://127.0.0.1:5500`

## Current Interaction Notes

- Home chevrons navigate left/right across the album timeline.
- Open buttons launch album detail pages.
- Detail page chevrons navigate album-to-album.
- Clicking outside content on detail pages returns to Home with that album centered.
- Vinyl reveal on Home only triggers when a card is fully centered and hovered.

## Edit Content

To update album metadata, tracks, and ordering:

- Home cards and overlay markup: `index.html`
- Overlay navigation order and index mapping: `script.js`

## Deploy

This is a static site and can be deployed to:

- GitHub Pages
- Netlify
- Vercel (static)
- Any basic web host

