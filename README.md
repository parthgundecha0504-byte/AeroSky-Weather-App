# AeroSky — Premium Weather SaaS Dashboard

AeroSky is a production-quality, responsive weather intelligence platform built with Python, Flask, and the Open-Meteo API. Designed with a premium SaaS-style interface, it features glassmorphism, responsive data grids, interactive Chart.js line charts, dark-themed Leaflet.js maps, and custom CSS-animated SVG weather animations.

## Key Features

- **Global City Search**: Fetch real-time weather metrics for any city in the world using the Open-Meteo Geocoding API.
- **Atmospheric Index & AQI**: Track US Air Quality Index (AQI), PM2.5 concentrations, and UV Index with customized circular visual progress gauges.
- **CSS-Animated SVG Weather Icons**: Dynamic, custom-built vector weather icons that rotate, drift, and slide in response to current weather codes (Clear, Cloudy, Rain, Snow, Storm, Fog).
- **Celsius/Fahrenheit Unit Toggle**: Instantly convert all temperature readouts across the hero card, 24-hour chart, hourly scroll, and 7-day forecast entirely client-side.
- **Interactive Temperature Trend Graph**: High-resolution line chart utilizing Chart.js with custom tooltips, gradients, and theme transitions.
- **Meteorological Map (Leaflet.js)**: View coordinates marked on an interactive Leaflet map styled with CartoDB Dark Matter tiles matching the SaaS theme.
- **Geo-Location Positioning**: Auto-detect your coordinates using the browser's Geolocation API, with reverse geocoding via OpenStreetMap Nominatim.
- **Favorites & Recent Searches**: Retain saved locations and past searches locally inside browser `localStorage` for rapid navigation.
- **Themed Radial Glows**: Automatic application changes based on weather conditions (Sunny, Rain, Snow, Overcast) alongside a manual light/dark theme switcher.

## Technical Architecture

```
weather-dashboard/
├── app.py                  # Flask Application server with API proxying & Nomianatim geocoding
├── requirements.txt        # Backend dependencies
├── README.md               # Documentation
├── templates/
│   └── index.html          # Shell layout structure for SaaS dashboard
└── static/
    ├── style.css           # Glassmorphic grid styles, animations & theme overrides
    └── script.js           # SVG generators, Chart.js & Map rendering, units controller
```

## Installation

### Prerequisites
- Python 3.11+
- pip (Python Package Installer)

### Steps

1. Clone or download this project workspace directory:
   ```bash
   cd weather-dashboard
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux (Bash):**
     ```bash
     source .venv/bin/activate
     ```

4. Install the requirements:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

Start the Flask server by running:
```bash
python app.py
```

Then, open your browser and navigate to `http://localhost:5000` or `http://127.0.0.1:5000`.

## API Integration

This application runs entirely on open-source, free endpoints with zero API keys required:
- **Weather Forecast API**: [Open-Meteo Forecast](https://open-meteo.com/en/docs)
- **Geocoding API**: [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api)
- **Air Quality API**: [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)
- **Reverse Geocoding**: [OpenStreetMap Nominatim Reverse Search](https://nominatim.org/)
- **Map Tiles**: [CartoDB Dark Matter / Positron Leaflet Tiles](https://carto.com/basemaps/)

## Interface Visuals

Below are screenshots demonstrating the live dashboard environment:

### Dark Mode View (Default Theme)
![SaaS Dark Dashboard](screenshots/dark_dashboard.png)

### Light Mode View
![SaaS Light Dashboard](screenshots/light_dashboard.png)

### Atmospheric Gauges and Interactive Leaflet Maps
![Meteorological Mapping and Gauges](screenshots/gauges_and_map.png)

---
*Developed for portfolio demonstration. Clean structure, type hinted Python code, and optimized JavaScript events.*
