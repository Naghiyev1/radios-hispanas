const API_BASE = "https://de1.api.radio-browser.info/json";

const stationsGrid = document.getElementById("stationsGrid");
const statusText = document.getElementById("statusText");
const activeFilterLabel = document.getElementById("activeFilterLabel");
const searchInput = document.getElementById("searchInput");
const countrySelect = document.getElementById("countrySelect");
const searchButton = document.getElementById("searchButton");
const audioPlayer = document.getElementById("audioPlayer");
const currentStation = document.getElementById("currentStation");
const currentMeta = document.getElementById("currentMeta");
const playerLogo = document.getElementById("playerLogo");
const playerFavoriteButton = document.getElementById("playerFavoriteButton");
const stopButton = document.getElementById("stopButton");
const themeToggle = document.getElementById("themeToggle");
const stationCount = document.getElementById("stationCount");
const favoriteCount = document.getElementById("favoriteCount");
const pills = Array.from(document.querySelectorAll(".pill"));

let stations = [];
let activeTag = "";
let favoriteStations = JSON.parse(localStorage.getItem("radiosHispanasFavoriteStations") || "[]");
let recentlyPlayedStations = JSON.parse(localStorage.getItem("radiosHispanasRecentlyPlayed") || "[]");
let favorites = favoriteStations.map(station => station.stationuuid);
let currentPlayingStation = null;
let preferredTheme = localStorage.getItem("radiosHispanasTheme") || "light";

const spanishSpeakingCountryCodes = [
  "ES",
  "MX",
  "AR",
  "CO",
  "CL",
  "PE",
  "VE",
  "EC",
  "BO",
  "PY",
  "UY",
  "CR",
  "PA",
  "DO",
  "GT",
  "HN",
  "SV",
  "NI",
  "CU",
  "PR",
  "US"
];

const countryNames = {
  ALL: "All countries",
  ES: "Spain",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  VE: "Venezuela",
  EC: "Ecuador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  CR: "Costa Rica",
  PA: "Panama",
  DO: "Dominican Republic",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  NI: "Nicaragua",
  CU: "Cuba",
  PR: "Puerto Rico",
  US: "United States"
};

const featuredStationQueries = [
  { name: "Cadena SER", countryCode: "ES" },
  { name: "Los 40", countryCode: "ES" },
  { name: "COPE", countryCode: "ES" },
  { name: "Onda Cero", countryCode: "ES" },
  { name: "RNE Radio Nacional", countryCode: "ES" },
  { name: "Radio Marca", countryCode: "ES" },
  { name: "RAC1", countryCode: "ES" },
  { name: "Catalunya Ràdio", countryCode: "ES" },
  { name: "Radio Mitre", countryCode: "AR" },
  { name: "La 100", countryCode: "AR" },
  { name: "W Radio", countryCode: "MX" },
  { name: "Radio Fórmula", countryCode: "MX" },
  { name: "Caracol Radio", countryCode: "CO" },
  { name: "RCN Radio", countryCode: "CO" },
  { name: "Blu Radio", countryCode: "CO" },
  { name: "Radio Cooperativa", countryCode: "CL" },
  { name: "RPP Noticias", countryCode: "PE" },
  { name: "Unión Radio", countryCode: "VE" },
  { name: "Radio Caracas Radio", countryCode: "VE" },
  { name: "Zeta 93", countryCode: "PR" }
];


function updateFavoriteCount() {
  favoriteCount.textContent = favorites.length;
}

async function fetchStations() {
  if (activeTag === "__favorites") {
    renderFavoriteStations();
    return;
  }

  if (activeTag === "__featured") {
    await renderFeaturedStations();
    return;
  }

  if (activeTag === "__recent") {
    renderRecentlyPlayedStations();
    return;
  }

  const countryCode = countrySelect.value;
  const searchTerm = searchInput.value.trim();
  const selectedCountryName = countryNames[countryCode] || countryCode;

  statusText.textContent = countryCode === "ALL"
    ? "Loading stations across Spanish-speaking countries..."
    : "Loading stations...";

  activeFilterLabel.textContent = `${selectedCountryName} · ${activeTag || searchTerm || "Popular"}`;
  stationsGrid.innerHTML = "";
  stationCount.textContent = "0";

  try {
    const data = countryCode === "ALL"
      ? await fetchStationsForAllCountries(searchTerm, activeTag)
      : await fetchStationsForCountry(countryCode, searchTerm, activeTag, 80);

    stations = data
      .filter(station => station.lastcheckok === 1)
      .filter(station => station.url_resolved || station.url)
      .filter(removeDuplicatesByUrl)
      .sort(sortStations)
      .slice(0, countryCode === "ALL" ? 120 : 60);

    renderStations(stations);

    stationCount.textContent = stations.length;
    statusText.textContent = stations.length
      ? `${stations.length} working stations found`
      : "No working stations found. Try a different search or filter.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not load stations. The free radio directory may be temporarily unavailable.";
    stationsGrid.innerHTML = `<div class="empty-state">Something went wrong while loading stations.</div>`;
  }
}


async function renderFeaturedStations() {
  const selectedCountryName = countryNames[countrySelect.value] || countrySelect.value;

  statusText.textContent = "Loading curated featured stations...";
  activeFilterLabel.textContent = `${selectedCountryName} · Featured`;
  stationsGrid.innerHTML = "";
  stationCount.textContent = "0";

  try {
    const featuredResults = await Promise.all(
      featuredStationQueries.map(query =>
        fetchFeaturedStation(query.name, query.countryCode)
          .catch(error => {
            console.warn(`Could not load featured station: ${query.name}`, error);
            return null;
          })
      )
    );

    const searchTerm = searchInput.value.trim().toLowerCase();

    const curatedStations = featuredResults
      .filter(Boolean)
      .filter(station => station.lastcheckok === 1)
      .filter(station => station.url_resolved || station.url)
      .filter(removeDuplicatesByUrl)
      .filter(station => {
        if (!searchTerm) {
          return true;
        }

        return [
          station.name,
          station.country,
          station.tags,
          station.state
        ].some(value => String(value || "").toLowerCase().includes(searchTerm));
      });

    stations = curatedStations;
    renderStations(stations);

    stationCount.textContent = stations.length;
    statusText.textContent = stations.length
      ? `${stations.length} featured station${stations.length === 1 ? "" : "s"} loaded`
      : "No featured stations matched your search.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not load featured stations.";
    stationsGrid.innerHTML = `<div class="empty-state">Featured stations could not be loaded.</div>`;
  }
}

async function fetchFeaturedStation(name, countryCode) {
  const params = new URLSearchParams({
    name,
    countrycode: countryCode,
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: "8"
  });

  const url = `${API_BASE}/stations/search?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Featured station lookup failed for ${name}.`);
  }

  const results = await response.json();

  return results
    .filter(station => station.lastcheckok === 1)
    .filter(station => station.url_resolved || station.url)
    .sort(sortStations)[0] || null;
}

async function fetchStationsForAllCountries(searchTerm, tag) {
  const requests = spanishSpeakingCountryCodes.map(countryCode =>
    fetchStationsForCountry(countryCode, searchTerm, tag, 18)
      .catch(error => {
        console.warn(`Could not load ${countryCode}`, error);
        return [];
      })
  );

  const countryResults = await Promise.all(requests);
  return countryResults.flat();
}

async function fetchStationsForCountry(countryCode, searchTerm, tag, limit = 80) {
  const params = new URLSearchParams({
    countrycode: countryCode,
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: String(limit)
  });

  if (searchTerm) {
    params.set("name", searchTerm);
  }

  if (tag) {
    params.set("tag", tag);
  }

  const url = `${API_BASE}/stations/search?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Radio API request failed for ${countryCode}.`);
  }

  return response.json();
}

function sortStations(a, b) {
  const clickDifference = Number(b.clickcount || 0) - Number(a.clickcount || 0);

  if (clickDifference !== 0) {
    return clickDifference;
  }

  return String(a.name || "").localeCompare(String(b.name || ""));
}

function removeDuplicatesByUrl(station, index, array) {
  const currentUrl = station.url_resolved || station.url;
  return array.findIndex(item => (item.url_resolved || item.url) === currentUrl) === index;
}

function renderStations(stationsToRender) {
  stationsGrid.innerHTML = "";

  if (!stationsToRender.length) {
    stationsGrid.innerHTML = `<div class="empty-state">No stations to show yet.</div>`;
    return;
  }

  stationsToRender.forEach(station => {
    const card = document.createElement("article");
    card.className = "station-card";

    const streamUrl = station.url_resolved || station.url;
    const isFavorite = favorites.includes(station.stationuuid);
    const initials = getInitials(station.name);
    const tags = station.tags ? shortenTags(station.tags) : "No tags available";
    const codec = station.codec ? station.codec.toUpperCase() : "stream";
    const bitrate = station.bitrate ? `${station.bitrate} kbps` : "live";

    card.innerHTML = `
      <div class="station-top">
        <div class="station-logo-wrap">
          ${station.favicon ? `<img class="station-logo" src="${escapeHTML(station.favicon)}" alt="" loading="lazy" />` : initials}
        </div>
        <div>
          <div class="station-name">${escapeHTML(station.name)}</div>
          <div class="station-country">${escapeHTML(station.country || "Unknown country")}</div>
        </div>
      </div>

      <div class="station-tags">${escapeHTML(tags)}</div>

      <div class="station-tech">
        <span class="tech-chip">${escapeHTML(codec)}</span>
        <span class="tech-chip">${escapeHTML(bitrate)}</span>
      </div>

      <div class="station-actions">
        <button type="button" class="play-button">Play</button>
        <button type="button" class="favorite-button ${isFavorite ? "active" : ""}" aria-label="Toggle favourite">★</button>
      </div>
    `;

    const logo = card.querySelector(".station-logo");

    if (logo) {
      logo.addEventListener("error", () => {
        logo.parentElement.textContent = initials;
      });
    }

    card.querySelector(".play-button").addEventListener("click", () => {
      playStation(station, streamUrl);
    });

    card.querySelector(".favorite-button").addEventListener("click", event => {
      toggleFavorite(station.stationuuid);
      event.currentTarget.classList.toggle("active");
    });

    stationsGrid.appendChild(card);
  });
}

function playStation(station, streamUrl) {
  statusText.textContent = `Trying to play ${station.name}...`;
  audioPlayer.src = streamUrl;

  audioPlayer.play()
    .then(() => {
      currentPlayingStation = station;
      updatePlayerStation(station);
      statusText.textContent = `Now playing: ${station.name}`;
      saveRecentlyPlayed(station);

      if (activeTag === "__recent") {
        renderRecentlyPlayedStations();
      }
    })
    .catch(error => {
      console.error(error);
      statusText.textContent = "This station could not be played in the browser. Try another one.";
    });
}

function updatePlayerStation(station) {
  currentStation.textContent = station.name;
  currentMeta.textContent = `${station.country || ""}${station.codec ? " · " + station.codec.toUpperCase() : ""}${station.bitrate ? " · " + station.bitrate + " kbps" : ""}`;

  const initials = getInitials(station.name);

  if (station.favicon) {
    playerLogo.innerHTML = `<img src="${escapeHTML(station.favicon)}" alt="" />`;
    const logoImage = playerLogo.querySelector("img");
    logoImage.addEventListener("error", () => {
      playerLogo.textContent = initials;
    });
  } else {
    playerLogo.textContent = initials;
  }

  playerFavoriteButton.disabled = false;
  stopButton.disabled = false;
  playerFavoriteButton.classList.toggle("active", favorites.includes(station.stationuuid));
}

function stopCurrentStation() {
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  audioPlayer.load();

  currentPlayingStation = null;
  currentStation.textContent = "Nothing playing";
  currentMeta.textContent = "Choose a station to start listening";
  playerLogo.textContent = "RH";
  playerFavoriteButton.disabled = true;
  playerFavoriteButton.classList.remove("active");
  stopButton.disabled = true;
  statusText.textContent = "Playback stopped.";
}

function saveRecentlyPlayed(station) {
  recentlyPlayedStations = recentlyPlayedStations.filter(item => item.stationuuid !== station.stationuuid);
  recentlyPlayedStations.unshift(station);
  recentlyPlayedStations = recentlyPlayedStations.slice(0, 20);

  localStorage.setItem("radiosHispanasRecentlyPlayed", JSON.stringify(recentlyPlayedStations));
}

function toggleFavorite(stationId) {
  const station = stations.find(item => item.stationuuid === stationId)
    || favoriteStations.find(item => item.stationuuid === stationId)
    || recentlyPlayedStations.find(item => item.stationuuid === stationId);

  if (favorites.includes(stationId)) {
    favorites = favorites.filter(id => id !== stationId);
    favoriteStations = favoriteStations.filter(item => item.stationuuid !== stationId);
  } else if (station) {
    favorites.push(stationId);
    favoriteStations.push(station);
  }

  localStorage.setItem("radiosHispanasFavoriteStations", JSON.stringify(favoriteStations));
  updateFavoriteCount();

  if (currentPlayingStation && currentPlayingStation.stationuuid === stationId) {
    playerFavoriteButton.classList.toggle("active", favorites.includes(stationId));
  }

  if (activeTag === "__favorites") {
    renderFavoriteStations();
  }
}

function renderFavoriteStations() {
  const selectedCountryName = countryNames[countrySelect.value] || countrySelect.value;

  statusText.textContent = favoriteStations.length
    ? `${favoriteStations.length} favourite station${favoriteStations.length === 1 ? "" : "s"} saved`
    : "No favourites yet. Save stations with the star button.";

  activeFilterLabel.textContent = `${selectedCountryName} · Favorites`;
  stationCount.textContent = favoriteStations.length;
  renderStations(favoriteStations);
}

function renderRecentlyPlayedStations() {
  const selectedCountryName = countryNames[countrySelect.value] || countrySelect.value;

  statusText.textContent = recentlyPlayedStations.length
    ? `${recentlyPlayedStations.length} recently played station${recentlyPlayedStations.length === 1 ? "" : "s"}`
    : "No recently played stations yet. Play a station and it will appear here.";

  activeFilterLabel.textContent = `${selectedCountryName} · Recently Played`;
  stationCount.textContent = recentlyPlayedStations.length;
  renderStations(recentlyPlayedStations);
}

function getInitials(name) {
  return String(name || "R")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function shortenTags(tags) {
  return tags
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function applyTheme(theme) {
  const safeTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("dark", safeTheme === "dark");
  themeToggle.textContent = safeTheme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", safeTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  localStorage.setItem("radiosHispanasTheme", safeTheme);
  preferredTheme = safeTheme;
}

function toggleTheme() {
  applyTheme(preferredTheme === "dark" ? "light" : "dark");
}

searchButton.addEventListener("click", fetchStations);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    fetchStations();
  }
});

countrySelect.addEventListener("change", fetchStations);

pills.forEach(pill => {
  pill.addEventListener("click", () => {
    pills.forEach(item => item.classList.remove("active"));
    pill.classList.add("active");
    activeTag = pill.dataset.tag || "";
    fetchStations();
  });
});

playerFavoriteButton.addEventListener("click", () => {
  if (!currentPlayingStation) {
    return;
  }

  toggleFavorite(currentPlayingStation.stationuuid);
});

stopButton.addEventListener("click", stopCurrentStation);
themeToggle.addEventListener("click", toggleTheme);

applyTheme(preferredTheme);
updateFavoriteCount();
fetchStations();


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
