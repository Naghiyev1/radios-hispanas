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
const stationCount = document.getElementById("stationCount");
const favoriteCount = document.getElementById("favoriteCount");
const pills = Array.from(document.querySelectorAll(".pill"));

let stations = [];
let activeTag = "";
let favoriteStations = JSON.parse(localStorage.getItem("radiosHispanasFavoriteStations") || "[]");
let favorites = favoriteStations.map(station => station.stationuuid);

const countryNames = {
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

function updateFavoriteCount() {
  favoriteCount.textContent = favorites.length;
}

async function fetchStations() {
  if (activeTag === "__favorites") {
    renderFavoriteStations();
    return;
  }

  const countryCode = countrySelect.value;
  const searchTerm = searchInput.value.trim();
  const selectedCountryName = countryNames[countryCode] || countryCode;

  statusText.textContent = "Loading stations...";
  activeFilterLabel.textContent = `${selectedCountryName} · ${activeTag || searchTerm || "Popular"}`;
  stationsGrid.innerHTML = "";
  stationCount.textContent = "0";

  const params = new URLSearchParams({
    countrycode: countryCode,
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: "80"
  });

  if (searchTerm) {
    params.set("name", searchTerm);
  }

  if (activeTag) {
    params.set("tag", activeTag);
  }

  const url = `${API_BASE}/stations/search?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Radio API request failed.");
    }

    const data = await response.json();

    stations = data
      .filter(station => station.lastcheckok === 1)
      .filter(station => station.url_resolved || station.url)
      .filter(removeDuplicatesByUrl)
      .slice(0, 60);

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
      currentStation.textContent = station.name;
      currentMeta.textContent = `${station.country || ""}${station.codec ? " · " + station.codec.toUpperCase() : ""}${station.bitrate ? " · " + station.bitrate + " kbps" : ""}`;
      statusText.textContent = `Now playing: ${station.name}`;
    })
    .catch(error => {
      console.error(error);
      statusText.textContent = "This station could not be played in the browser. Try another one.";
    });
}

function toggleFavorite(stationId) {
  const station = stations.find(item => item.stationuuid === stationId)
    || favoriteStations.find(item => item.stationuuid === stationId);

  if (favorites.includes(stationId)) {
    favorites = favorites.filter(id => id !== stationId);
    favoriteStations = favoriteStations.filter(item => item.stationuuid !== stationId);
  } else if (station) {
    favorites.push(stationId);
    favoriteStations.push(station);
  }

  localStorage.setItem("radiosHispanasFavoriteStations", JSON.stringify(favoriteStations));
  updateFavoriteCount();

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

updateFavoriteCount();
fetchStations();
