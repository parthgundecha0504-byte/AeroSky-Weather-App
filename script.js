// AeroSky - Premium SaaS Weather Dashboard Logic

// DOM Element Selectors
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const alertBox = document.getElementById("alertBox");
const loadingState = document.getElementById("loadingState");
const weatherContent = document.getElementById("weatherContent");

// Hero Weather Card Nodes
const cityName = document.getElementById("cityName");
const locationDetails = document.getElementById("locationDetails");
const locationBreadcrumb = document.getElementById("locationBreadcrumb");
const currentTemp = document.getElementById("currentTemp");
const currentCondition = document.getElementById("currentCondition");
const currentWeatherIcon = document.getElementById("currentWeatherIcon");
const feelsLike = document.getElementById("feelsLike");
const sunriseTime = document.getElementById("sunriseTime");
const sunsetTime = document.getElementById("sunsetTime");
const saveFavorite = document.getElementById("saveFavorite");

// Gauges & Stats Nodes
const aqiProgressRing = document.getElementById("aqiProgressRing");
const aqiValue = document.getElementById("aqiValue");
const aqiLabel = document.getElementById("aqiLabel");
const uvProgressRing = document.getElementById("uvProgressRing");
const statUV = document.getElementById("statUV");
const statHumidity = document.getElementById("statHumidity");
const statWind = document.getElementById("statWind");
const statPressure = document.getElementById("statPressure");
const statRain = document.getElementById("statRain");

// Forecast Containers
const hourlyList = document.getElementById("hourlyList");
const dailyList = document.getElementById("dailyList");

// Sidebar Panels
const favoritesList = document.getElementById("favoritesList");
const historyList = document.getElementById("historyList");
const favCount = document.getElementById("favCount");

// Settings Controls
const themeToggle = document.getElementById("themeToggle");
const unitCBtn = document.getElementById("unitC");
const unitFBtn = document.getElementById("unitF");
const locateButton = document.getElementById("locateButton");

// App State
let tempChart = null;
let weatherData = null; // Caches API response for client-side unit conversions
let currentUnit = "C";   // 'C' or 'F'
let map = null;
let mapMarker = null;

// LocalStorage Keys
const SEARCH_HISTORY_KEY = "aeroSkySearchHistory";
const FAVORITES_KEY = "aeroSkyFavorites";

/* --- ANIMATED WEATHER SVG GENERATOR --- */
function getAnimatedWeatherIcon(code, isLarge = false) {
  const size = isLarge ? 90 : 44;
  const view = "0 0 64 64";
  
  // Categorize weather codes based on Open-Meteo descriptions
  let type = "cloudy";
  if (code === 0 || code === 1) type = "sunny";
  else if (code === 2 || code === 3) type = "cloudy";
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) type = "rain";
  else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) type = "snow";
  else if (code === 45 || code === 48) type = "fog";
  else if (code >= 95 && code <= 99) type = "storm";

  let content = "";
  if (type === "sunny") {
    content = `
      <circle cx="32" cy="32" r="13" class="anim-sun" fill="url(#sunGrad)"/>
      <g class="anim-sun" stroke="url(#sunGrad)" stroke-width="3" stroke-linecap="round">
        <line x1="32" y1="10" x2="32" y2="4" />
        <line x1="32" y1="54" x2="32" y2="60" />
        <line x1="10" y1="32" x2="4" y2="32" />
        <line x1="54" y1="32" x2="60" y2="32" />
        <line x1="16.5" y1="16.5" x2="12.2" y2="12.2" />
        <line x1="47.5" y1="47.5" x2="51.8" y2="51.8" />
        <line x1="16.5" y1="47.5" x2="12.2" y2="51.8" />
        <line x1="47.5" y1="16.5" x2="51.8" y2="12.2" />
      </g>
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
    `;
  } else if (type === "cloudy") {
    content = `
      <circle cx="42" cy="24" r="8" class="anim-sun" fill="#f59e0b" opacity="0.8"/>
      <path d="M46,38a8,8,0,0,0-7.8-6.2A10,10,0,0,0,19.2,34,6,6,0,0,0,20,46H46a6,6,0,0,0,0-12Z" class="anim-cloud" />
    `;
  } else if (type === "rain") {
    content = `
      <path d="M46,36a8,8,0,0,0-7.8-6.2A10,10,0,0,0,19.2,32,6,6,0,0,0,20,44H46a6,6,0,0,0,0-12Z" class="anim-cloud" />
      <g stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
        <line x1="25" y1="46" x2="23" y2="52" class="anim-rain-drop" />
        <line x1="32" y1="46" x2="30" y2="52" class="anim-rain-drop" style="animation-delay: 0.4s;" />
        <line x1="39" y1="46" x2="37" y2="52" class="anim-rain-drop" style="animation-delay: 0.8s;" />
      </g>
    `;
  } else if (type === "snow") {
    content = `
      <path d="M46,36a8,8,0,0,0-7.8-6.2A10,10,0,0,0,19.2,32,6,6,0,0,0,20,44H46a6,6,0,0,0,0-12Z" class="anim-cloud" />
      <g fill="#e2e8f0" class="snow-drops">
        <circle cx="25" cy="48" r="2" class="anim-snow" />
        <circle cx="32" cy="50" r="2" class="anim-snow" style="animation-delay: 1s;" />
        <circle cx="39" cy="48" r="2" class="anim-snow" style="animation-delay: 2s;" />
      </g>
    `;
  } else if (type === "storm") {
    content = `
      <path d="M46,36a8,8,0,0,0-7.8-6.2A10,10,0,0,0,19.2,32,6,6,0,0,0,20,44H46a6,6,0,0,0,0-12Z" class="anim-cloud-back" />
      <path d="M29,42 L24,51 L28,51 L23,59 L33,48 L28,48 Z" class="anim-lightning" />
      <line x1="37" y1="46" x2="35" y2="52" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" class="anim-rain-drop"/>
    `;
  } else if (type === "fog") {
    content = `
      <path d="M46,32a8,8,0,0,0-7.8-6.2A10,10,0,0,0,19.2,28,6,6,0,0,0,20,40H46a6,6,0,0,0,0-12Z" class="anim-cloud" />
      <line x1="16" y1="44" x2="48" y2="44" class="anim-fog-line" />
      <line x1="12" y1="49" x2="44" y2="49" class="anim-fog-line" style="animation-delay: 1.5s;" />
      <line x1="18" y1="54" x2="50" y2="54" class="anim-fog-line" style="animation-delay: 0.7s;" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" width="${size}" height="${size}">${content}</svg>`;
}

/* --- TEMPERATURE UTILS --- */
function cToF(c) {
  return (c * 9) / 5 + 32;
}

function formatTemp(c, unit) {
  if (c === null || c === undefined) return "--";
  const val = unit === "C" ? c : cToF(c);
  return `${Math.round(val)}°${unit}`;
}

function formatTempNoUnit(c, unit) {
  if (c === null || c === undefined) return 0;
  const val = unit === "C" ? c : cToF(c);
  return Math.round(val);
}

/* --- ALERT & NOTIFICATION SYSTEM --- */
function showAlert(message) {
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hideAlert() {
  alertBox.classList.add("hidden");
}

/* --- LOADER MANAGEMENT --- */
function showLoading() {
  loadingState.classList.remove("hidden");
  weatherContent.classList.add("hidden");
}

function hideLoading() {
  loadingState.classList.add("hidden");
  weatherContent.classList.remove("hidden");
}

/* --- THEME CONTROLLER --- */
function initTheme() {
  const saved = localStorage.getItem("aeroSkyTheme");
  if (saved === "light") {
    document.documentElement.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  } else {
    document.documentElement.classList.remove("light-mode");
    themeToggle.textContent = "🌙";
  }
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle("light-mode");
  localStorage.setItem("aeroSkyTheme", isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "☀️" : "🌙";
  
  // Reload Leaflet tile colors by updating view
  if (map && weatherData) {
    const lat = weatherData.location.latitude;
    const lon = weatherData.location.longitude;
    const city = weatherData.location.city;
    updateMap(lat, lon, city);
  }
}

function updateBgTheme(condition) {
  document.body.classList.remove("sunny-theme", "rain-theme", "snow-theme", "cloudy-theme");
  
  const mapping = {
    Clear: "sunny-theme",
    "Mainly Clear": "sunny-theme",
    "Partly Cloudy": "cloudy-theme",
    Overcast: "cloudy-theme",
    Fog: "cloudy-theme",
    "Light Drizzle": "rain-theme",
    "Moderate Drizzle": "rain-theme",
    "Heavy Rain": "rain-theme",
    "Rain Showers": "rain-theme",
    "Thunderstorm": "rain-theme",
    "Slight Snow": "snow-theme",
    "Moderate Snow": "snow-theme",
    "Heavy Snow": "snow-theme",
  };
  const themeClass = mapping[condition] || "cloudy-theme";
  document.body.classList.add(themeClass);
}

/* --- GEOLOCATION AND COORDINATE ROUTING --- */
function detectUserLocation() {
  if (!navigator.geolocation) {
    showAlert("Geolocation is not supported by your browser.");
    return;
  }
  
  showLoading();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      hideLoading();
      showAlert("Location access denied. Please type a city name instead.");
    }
  );
}

/* --- API DATA FETCHERS --- */
async function fetchWeather(city) {
  hideAlert();
  showLoading();
  
  try {
    const response = await fetch(`/weather?city=${encodeURIComponent(city.trim())}`);
    const data = await response.json();
    
    if (!response.ok) {
      hideLoading();
      showAlert(data.error || "City search query failed.");
      return;
    }
    
    weatherData = data;
    renderDashboard(data);
    saveSearchHistory(data.location.city);
    hideLoading();
  } catch (error) {
    hideLoading();
    showAlert("Failed to connect to weather services. Verify internet connection.");
    console.error(error);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  hideAlert();
  showLoading();
  
  try {
    const response = await fetch(`/weather?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    
    if (!response.ok) {
      hideLoading();
      showAlert(data.error || "Coordinates query failed.");
      return;
    }
    
    weatherData = data;
    renderDashboard(data);
    saveSearchHistory(data.location.city);
    hideLoading();
  } catch (error) {
    hideLoading();
    showAlert("Failed to connect to weather services. Verify internet connection.");
    console.error(error);
  }
}

/* --- PROGRESS CIRCLE GAUGE HELPER --- */
function updateGauge(elementId, value, maxVal) {
  const circle = document.getElementById(elementId);
  if (!circle) return;
  const circumference = 238.76; // 2 * pi * r (r=38)
  const safeVal = Math.min(Math.max(value, 0), maxVal);
  const offset = circumference - (safeVal / maxVal) * circumference;
  circle.style.strokeDashoffset = offset;
}

/* --- RENDER FUNCTIONS --- */
function renderDashboard(data) {
  // Breadcrumbs
  locationBreadcrumb.textContent = `${data.location.city}, ${data.location.country || ""}`;
  
  // Hero Current Details
  cityName.textContent = `${data.location.city}, ${data.location.country || ""}`;
  locationDetails.textContent = `${data.location.latitude.toFixed(3)}°N, ${data.location.longitude.toFixed(3)}°E • Timezone: ${data.location.timezone}`;
  currentCondition.textContent = data.current.condition;
  currentWeatherIcon.innerHTML = getAnimatedWeatherIcon(data.current.weathercode, true);
  
  // Format Sunrise & Sunset (e.g. "2026-06-21T06:04" -> "06:04 AM")
  const formatTimeStr = (isoStr) => {
    if (!isoStr) return "--:--";
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  sunriseTime.textContent = formatTimeStr(data.current.sunrise);
  sunsetTime.textContent = formatTimeStr(data.current.sunset);
  
  // Statistics & Atmospheric Index
  statHumidity.textContent = `${data.statistics.humidity ?? 0}%`;
  statWind.textContent = `${data.statistics.wind_speed ?? 0} km/h`;
  statPressure.textContent = data.statistics.pressure ? `${data.statistics.pressure} hPa` : "--";
  statRain.textContent = `${data.statistics.rain_probability ?? 0}%`;
  
  // AQI Gauge
  const aqiVal = data.statistics.aqi;
  aqiValue.textContent = aqiVal !== null ? aqiVal : "--";
  aqiLabel.textContent = data.statistics.aqi_label;
  aqiLabel.style.backgroundColor = `${data.statistics.aqi_color}1b`;
  aqiLabel.style.color = data.statistics.aqi_color;
  
  // Scale AQI gauge circle (US AQI max scale is generally 300 for normal gauge, max 500)
  updateGauge("aqiProgressRing", aqiVal !== null ? aqiVal : 0, 300);
  
  // UV Index Gauge (Max index is typically 11/12)
  const uvVal = data.statistics.uv_index;
  statUV.textContent = uvVal !== null ? uvVal : "--";
  updateGauge("uvProgressRing", uvVal !== null ? uvVal : 0, 12);
  
  // Render Collections
  renderTemperatures();
  renderHourly(data.hourly);
  renderDaily(data.daily);
  
  // Render Map and Favorite Buttons
  updateMap(data.location.latitude, data.location.longitude, data.location.city);
  updateBgTheme(data.current.condition);
  updateFavoriteUIState(data.location.city);
}

function renderTemperatures() {
  if (!weatherData) return;
  
  // Hero Temp and Apparent Feels Like
  currentTemp.textContent = formatTemp(weatherData.current.temperature, currentUnit);
  feelsLike.textContent = formatTemp(weatherData.statistics.humidity !== null ? weatherData.current.temperature - (1 - weatherData.statistics.humidity/100)*3 : weatherData.current.temperature, currentUnit);
  
  // Redraw trend chart with correctly formatted unit array
  renderChart(weatherData.chart.times, weatherData.chart.temperatures);
}

function renderHourly(hourly) {
  hourlyList.innerHTML = "";
  hourly.forEach((item) => {
    const card = document.createElement("div");
    card.className = "hourly-card";
    
    // Parse time
    const time = new Date(item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const tempStr = formatTemp(item.temperature, currentUnit);
    const pop = item.precipitation_probability !== null ? `${item.precipitation_probability}%` : "";
    
    card.innerHTML = `
      <span class="hourly-time">${time}</span>
      <div class="hourly-icon">${getAnimatedWeatherIcon(item.weathercode, false)}</div>
      <strong class="hourly-temp">${tempStr}</strong>
      ${pop ? `<span class="hourly-pop">💧 ${pop}</span>` : ""}
    `;
    hourlyList.appendChild(card);
  });
}

function renderDaily(daily) {
  dailyList.innerHTML = "";
  daily.forEach((item) => {
    const card = document.createElement("div");
    card.className = "daily-card";
    
    // Parse date
    const dateObj = new Date(item.date);
    const day = dateObj.toLocaleDateString([], { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const maxTempStr = formatTemp(item.max_temp, currentUnit);
    const minTempStr = formatTemp(item.min_temp, currentUnit);
    const pop = item.precipitation_probability !== null ? `${item.precipitation_probability}%` : "";
    
    card.innerHTML = `
      <span class="daily-day">${day}</span>
      <span class="daily-date">${formattedDate}</span>
      <div class="daily-icon">${getAnimatedWeatherIcon(item.weathercode, false)}</div>
      <div class="daily-temp-range">
        <span class="daily-max-temp">${maxTempStr}</span>
        <span class="daily-min-temp">${minTempStr}</span>
      </div>
      ${pop ? `<span class="daily-pop">💧 ${pop}</span>` : ""}
    `;
    dailyList.appendChild(card);
  });
}

/* --- INTERACTIVE CHART.JS LINE GRAPH --- */
function renderChart(times, temps) {
  const ctx = document.getElementById("tempChart").getContext("2d");
  if (tempChart) {
    tempChart.destroy();
  }
  
  const unitTemps = temps.map(t => formatTempNoUnit(t, currentUnit));
  const timeLabels = times.map(t => {
    return new Date(t).toLocaleTimeString([], { hour: 'numeric' });
  });

  const isLight = document.documentElement.classList.contains("light-mode");
  const accentColor = isLight ? "#0284c7" : "#38bdf8";
  const gridColor = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.05)";
  const fontColor = isLight ? "#475569" : "#94a3b8";

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [
        {
          label: `Temperature (°${currentUnit})`,
          data: unitTemps,
          borderColor: accentColor,
          borderWidth: 3,
          backgroundColor: isLight ? "rgba(2, 132, 199, 0.06)" : "rgba(56, 189, 248, 0.08)",
          tension: 0.38,
          pointRadius: 4,
          pointBackgroundColor: accentColor,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: accentColor,
          pointHoverBorderWidth: 3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? "#ffffff" : "#0f172a",
          titleColor: isLight ? "#0f172a" : "#ffffff",
          bodyColor: isLight ? "#475569" : "#f8fafc",
          borderColor: isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.08)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return ` ${context.parsed.y}°${currentUnit}`;
            }
          }
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: fontColor, font: { family: 'Outfit', size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: fontColor, font: { family: 'Outfit', size: 11 } },
        },
      },
    },
  });
}

/* --- LEAFLET DARK MAP TILES MANAGER --- */
function updateMap(lat, lon, city) {
  const isLight = document.documentElement.classList.contains("light-mode");
  
  // Custom dark mode/light mode basemaps from CartoDB matching SaaS layouts
  const tileUrl = isLight 
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  if (!map) {
    map = L.map("weatherMap", {
      center: [lat, lon],
      zoom: 10,
      scrollWheelZoom: false,
      zoomControl: false
    });
    
    L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);
    
    mapMarker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
  } else {
    map.setView([lat, lon], 10);
    
    // Clear old tile layers and load correct themed tiles
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    if (mapMarker) {
      mapMarker.setLatLng([lat, lon]).setPopupContent(city).openPopup();
    } else {
      mapMarker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
    }
  }
}

/* --- RECENT SEARCH HISTORY STORAGE --- */
function saveSearchHistory(city) {
  const rawHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
  let history = rawHistory ? JSON.parse(rawHistory) : [];
  const normalized = city.trim();
  if (!normalized) return;
  
  // De-duplicate and add to top
  history = [normalized, ...history.filter(item => item.toLowerCase() !== normalized.toLowerCase())];
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
  renderSearchHistory();
}

function renderSearchHistory() {
  const rawHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
  const history = rawHistory ? JSON.parse(rawHistory) : [];
  historyList.innerHTML = "";
  
  if (history.length === 0) {
    historyList.innerHTML = `<p class="empty-list-text">No recent searches</p>`;
    return;
  }

  history.forEach((city) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <span>${city}</span>
      <button class="btn-item-delete" title="Remove">&times;</button>
    `;
    
    // Search city on click
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-item-delete")) {
        e.stopPropagation();
        removeSearchHistory(city);
      } else {
        fetchWeather(city);
      }
    });
    historyList.appendChild(item);
  });
}

function removeSearchHistory(city) {
  const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  const filtered = history.filter(item => item.toLowerCase() !== city.toLowerCase());
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  renderSearchHistory();
}

/* --- FAVORITES MANAGEMENT STORAGE --- */
function toggleFavoriteCity() {
  if (!weatherData) return;
  const city = weatherData.location.city;
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  
  if (favorites.includes(city)) {
    const filtered = favorites.filter(item => item !== city);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    saveFavorite.classList.remove("is-fav");
  } else {
    favorites.unshift(city);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 8)));
    saveFavorite.classList.add("is-fav");
  }
  
  renderFavoritesList();
}

function updateFavoriteUIState(city) {
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  if (favorites.includes(city)) {
    saveFavorite.classList.add("is-fav");
  } else {
    saveFavorite.classList.remove("is-fav");
  }
}

function renderFavoritesList() {
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  favCount.textContent = favorites.length;
  favoritesList.innerHTML = "";
  
  if (favorites.length === 0) {
    favoritesList.innerHTML = `<p class="empty-list-text">No saved locations</p>`;
    return;
  }

  favorites.forEach((city) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <span>⭐ ${city}</span>
      <button class="btn-item-delete" title="Remove">&times;</button>
    `;
    
    item.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-item-delete")) {
        e.stopPropagation();
        removeFavoriteCity(city);
      } else {
        fetchWeather(city);
      }
    });
    favoritesList.appendChild(item);
  });
}

function removeFavoriteCity(city) {
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  const filtered = favorites.filter(item => item !== city);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  
  if (weatherData && weatherData.location.city === city) {
    saveFavorite.classList.remove("is-fav");
  }
  
  renderFavoritesList();
}

/* --- EVENT LISTENERS INITIALIZATION --- */
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (query) {
    fetchWeather(query);
  }
});

locateButton.addEventListener("click", detectUserLocation);
themeToggle.addEventListener("click", toggleTheme);
saveFavorite.addEventListener("click", toggleFavoriteCity);

// Celsius / Fahrenheit Conversion Listeners
unitCBtn.addEventListener("click", () => {
  if (currentUnit === "C") return;
  currentUnit = "C";
  unitCBtn.classList.add("active");
  unitFBtn.classList.remove("active");
  renderTemperatures();
  if (weatherData) {
    renderHourly(weatherData.hourly);
    renderDaily(weatherData.daily);
  }
});

unitFBtn.addEventListener("click", () => {
  if (currentUnit === "F") return;
  currentUnit = "F";
  unitFBtn.classList.add("active");
  unitCBtn.classList.remove("active");
  renderTemperatures();
  if (weatherData) {
    renderHourly(weatherData.hourly);
    renderDaily(weatherData.daily);
  }
});

/* --- APPLICATION BOOTSTRAP --- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderSearchHistory();
  renderFavoritesList();
  
  // Preload a default location or attempt user detection
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  if (favorites.length > 0) {
    fetchWeather(favorites[0]);
  } else {
    // If no favorites, start with Tokyo as default and then try location detection
    fetchWeather("Tokyo");
    // Attempt auto detect (silent fallback if denied)
    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
          () => {} // Ignore block or error on first auto check
        );
      }
    }, 1000);
  }
});
