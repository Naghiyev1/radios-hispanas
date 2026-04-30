# Radios Hispanas

A simple, free radio player for Spanish-speaking radio stations across Spain, Latin America and beyond.

## What it does

- Searches live radio stations by country
- Supports Spanish-speaking countries including Spain, Mexico, Argentina, Colombia, Chile, Peru, Venezuela and more
- Plays stations directly in the browser
- Includes quick filters such as News, Music, Talk, Sports, Latin, Salsa and Rock
- Saves favourites locally in the browser
- Requires no login, no backend and no paid services

## Tech stack

- HTML
- CSS
- JavaScript
- GitHub Pages
- Radio Browser public API

## Project structure

```text
radios-hispanas/
  index.html
  style.css
  app.js
  README.md
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

1. Create a new public GitHub repository called `radios-hispanas`.
2. Upload these files to the root of the repository.
3. Go to **Settings**.
4. Go to **Pages**.
5. Under **Build and deployment**, select:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.

Your app will be available at:

```text
https://yourusername.github.io/radios-hispanas/
```

## Notes

Some stations may not play because of broken streams, browser restrictions, mixed-content issues or stream formats. The app filters for stations marked as working by the Radio Browser API, but internet radio data is never perfect.

