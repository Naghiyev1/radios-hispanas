# Radios Hispanas

A simple, free radio player for Spanish-speaking radio stations across Spain, Latin America and beyond.

## What it does

- Searches live radio stations by country
- Includes an **All Spanish-speaking countries** mode
- Includes a curated **Featured** section for well-known Spanish-speaking stations
- Supports Spain, Mexico, Argentina, Colombia, Chile, Peru, Venezuela, Ecuador, Bolivia, Paraguay, Uruguay, Costa Rica, Panama, Dominican Republic, Guatemala, Honduras, El Salvador, Nicaragua, Cuba, Puerto Rico and the United States
- Plays stations directly in the browser
- Includes quick filters such as News, Music, Talk, Sports, Latin, Salsa and Rock
- Saves favourites locally in the browser
- Saves recently played stations locally in the browser
- Includes mobile layout polish
- Includes a web app manifest, app icon and service worker
- Can be added to a phone home screen as a lightweight PWA
- Requires no login, no backend and no paid services

## Tech stack

- HTML
- CSS
- JavaScript
- GitHub Pages
- Radio Browser public API
- Progressive Web App basics

## Project structure

```text
radios-hispanas/
  index.html
  style.css
  app.js
  README.md
  icon.svg
  manifest.json
  service-worker.js
```

## Run locally

Open `index.html` in your browser.

For a cleaner local preview, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy on GitHub Pages

1. Create or open your GitHub repository.
2. Upload these files to the root of the repository.
3. Go to **Settings**.
4. Go to **Pages**.
5. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.

## Install on mobile

After deployment:

### iPhone / Safari

1. Open the site in Safari.
2. Tap the share icon.
3. Tap **Add to Home Screen**.

### Android / Chrome

1. Open the site in Chrome.
2. Tap the browser menu.
3. Tap **Install app** or **Add to Home screen**.

## Notes

Some stations may not play because of broken streams, browser restrictions, mixed-content issues or stream formats. The app filters for stations marked as working by the Radio Browser API, but internet radio data is never perfect.

The Featured section is curated by station name and country, then resolved through the free Radio Browser API. This avoids hardcoding fragile stream URLs, but availability still depends on the public directory.
