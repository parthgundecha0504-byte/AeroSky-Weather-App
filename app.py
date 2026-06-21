from datetime import datetime
from typing import Any, Dict, Optional
import time
import logging

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Basic logging configuration for timing and diagnostics
logging.basicConfig(level=logging.INFO)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
# Timeout for external API calls (seconds)
TIMEOUT = 20
RETRIES = 3
BACKOFF_FACTOR = 0.5


def _get_with_retries(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Perform GET with simple retries and exponential backoff, return parsed JSON."""
    for attempt in range(1, RETRIES + 1):
        t0 = time.time()
        try:
            resp = requests.get(url, params=params, timeout=TIMEOUT)
            elapsed = time.time() - t0
            app.logger.info("External GET %s attempt=%d elapsed=%.3fs status=%s", url, attempt, elapsed, resp.status_code)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as exc:
            elapsed = time.time() - t0
            app.logger.warning("External GET failed %s attempt=%d elapsed=%.3fs error=%s", url, attempt, elapsed, exc)
            if attempt == RETRIES:
                raise
            backoff = BACKOFF_FACTOR * (2 ** (attempt - 1))
            time.sleep(backoff)



def get_coordinates(city: str) -> Optional[Dict[str, Any]]:
    """Fetch latitude and longitude for a city using Open-Meteo Geocoding API."""
    params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json",
    }
    data = _get_with_retries(GEOCODING_URL, params)

    if not data.get("results"):
        return None

    return data["results"][0]


def fetch_weather(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch weather data from Open-Meteo for the provided coordinates."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,uv_index,windspeed_10m,pressure_msl",
        "daily": "temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,precipitation_probability_max",
        "current_weather": "true",
        "timezone": "auto",
    }
    return _get_with_retries(WEATHER_URL, params)


def weather_code_to_description(code: int) -> Dict[str, str]:
    """Map Open-Meteo weather code to description and icon."""
    mapping = {
        0: {"label": "Clear", "icon": "☀️", "theme": "sunny"},
        1: {"label": "Mainly Clear", "icon": "🌤", "theme": "sunny"},
        2: {"label": "Partly Cloudy", "icon": "⛅️", "theme": "cloudy"},
        3: {"label": "Overcast", "icon": "☁️", "theme": "cloudy"},
        45: {"label": "Fog", "icon": "🌫️", "theme": "cloudy"},
        48: {"label": "Depositing Rime Fog", "icon": "🌫️", "theme": "cloudy"},
        51: {"label": "Light Drizzle", "icon": "🌦️", "theme": "rain"},
        53: {"label": "Moderate Drizzle", "icon": "🌦️", "theme": "rain"},
        55: {"label": "Dense Drizzle", "icon": "🌧️", "theme": "rain"},
        56: {"label": "Freezing Drizzle", "icon": "🌧️", "theme": "rain"},
        57: {"label": "Freezing Drizzle", "icon": "🌧️", "theme": "rain"},
        61: {"label": "Slight Rain", "icon": "🌧️", "theme": "rain"},
        63: {"label": "Moderate Rain", "icon": "🌧️", "theme": "rain"},
        65: {"label": "Heavy Rain", "icon": "⛈️", "theme": "rain"},
        66: {"label": "Freezing Rain", "icon": "🌧️", "theme": "rain"},
        67: {"label": "Heavy Freezing Rain", "icon": "⛈️", "theme": "rain"},
        71: {"label": "Slight Snow", "icon": "❄️", "theme": "snow"},
        73: {"label": "Moderate Snow", "icon": "❄️", "theme": "snow"},
        75: {"label": "Heavy Snow", "icon": "❄️", "theme": "snow"},
        77: {"label": "Snow Grains", "icon": "❄️", "theme": "snow"},
        80: {"label": "Rain Showers", "icon": "🌦️", "theme": "rain"},
        81: {"label": "Moderate Showers", "icon": "🌧️", "theme": "rain"},
        82: {"label": "Violent Showers", "icon": "⛅️", "theme": "rain"},
        85: {"label": "Slight Snow Showers", "icon": "❄️", "theme": "snow"},
        86: {"label": "Heavy Snow Showers", "icon": "❄️", "theme": "snow"},
        95: {"label": "Thunderstorm", "icon": "⛈️", "theme": "rain"},
        96: {"label": "Thunderstorm with Hail", "icon": "⛈️", "theme": "rain"},
        99: {"label": "Thunderstorm with Hail", "icon": "⛅️", "theme": "rain"},
    }
    return mapping.get(code, {"label": "Unknown", "icon": "❔", "theme": "cloudy"})


def aqi_to_category(aqi: Optional[int]) -> Dict[str, str]:
    if aqi is None:
        return {"label": "Unavailable", "color": "#64748b"}
    if aqi <= 50:
        return {"label": "Good", "color": "#22c55e"}
    if aqi <= 100:
        return {"label": "Moderate", "color": "#eab308"}
    if aqi <= 150:
        return {"label": "Unhealthy for Sensitive", "color": "#f97316"}
    if aqi <= 200:
        return {"label": "Unhealthy", "color": "#ef4444"}
    if aqi <= 300:
        return {"label": "Very Unhealthy", "color": "#a855f7"}
    return {"label": "Hazardous", "color": "#7f1d1d"}


def fetch_air_quality(lat: float, lon: float) -> Dict[str, Any]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "us_aqi,pm2_5",
        "timezone": "auto",
    }
    return _get_with_retries(AQI_URL, params)


# Request timing and simple logging
@app.before_request
def _start_timer() -> None:
    request._start_time = time.time()


@app.after_request
def _log_response(response):
    start = getattr(request, "_start_time", None)
    if start:
        elapsed = time.time() - start
        # Expose response time header and log the request
        response.headers["X-Response-Time"] = f"{elapsed:.3f}"
        app.logger.info(f"{request.method} {request.path} completed in {elapsed:.3f}s status={response.status_code}")
    return response


def parse_weather_response(raw: Dict[str, Any], location: Dict[str, Any], air_quality: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Convert raw Open-Meteo response to a clean JSON payload for the frontend."""
    current = raw.get("current_weather", {})
    hourly = raw.get("hourly", {})
    daily = raw.get("daily", {})

    current_code = int(current.get("weathercode", 0))
    current_weather = weather_code_to_description(current_code)
    timezone = raw.get("timezone", "UTC")

    hourly_times = hourly.get("time", [])
    hourly_temps = hourly.get("temperature_2m", [])
    hourly_humidity = hourly.get("relativehumidity_2m", [])
    hourly_precip_prob = hourly.get("precipitation_probability", [])
    hourly_codes = hourly.get("weathercode", [])
    hourly_pressure = hourly.get("pressure_msl", [])

    hourly_forecast = []
    for i in range(min(24, len(hourly_times))):
        hourly_code = int(hourly_codes[i]) if i < len(hourly_codes) else 0
        forecast = weather_code_to_description(hourly_code)
        hourly_forecast.append(
            {
                "time": hourly_times[i],
                "temperature": hourly_temps[i],
                "humidity": hourly_humidity[i] if i < len(hourly_humidity) else None,
                "precipitation_probability": hourly_precip_prob[i] if i < len(hourly_precip_prob) else None,
                "weathercode": hourly_code,
                "condition": forecast["label"],
                "icon": forecast["icon"],
            }
        )

    daily_forecast = []
    daily_times = daily.get("time", [])
    daily_min = daily.get("temperature_2m_min", [])
    daily_max = daily.get("temperature_2m_max", [])
    daily_codes = daily.get("weathercode", [])
    daily_precip = daily.get("precipitation_probability_max", [])
    sunrise_times = daily.get("sunrise", [])
    sunset_times = daily.get("sunset", [])

    for i in range(min(7, len(daily_times))):
        daily_code = int(daily_codes[i]) if i < len(daily_codes) else 0
        forecast = weather_code_to_description(daily_code)
        day_name = datetime.fromisoformat(daily_times[i]).strftime("%A")
        daily_forecast.append(
            {
                "date": daily_times[i],
                "day": day_name,
                "min_temp": daily_min[i] if i < len(daily_min) else None,
                "max_temp": daily_max[i] if i < len(daily_max) else None,
                "precipitation_probability": daily_precip[i] if i < len(daily_precip) else None,
                "weathercode": daily_code,
                "condition": forecast["label"],
                "icon": forecast["icon"],
            }
        )

    aqi_value = None
    aqi_label = "Unavailable"
    aqi_color = "#64748b"
    pm2_5 = None
    if air_quality:
        aqi_values = air_quality.get("hourly", {}).get("us_aqi", [])
        pm2_5_values = air_quality.get("hourly", {}).get("pm2_5", [])
        if aqi_values:
            aqi_value = aqi_values[0]
            aqi_data = aqi_to_category(aqi_value)
            aqi_label = aqi_data["label"]
            aqi_color = aqi_data["color"]
        if pm2_5_values:
            pm2_5 = pm2_5_values[0]

    statistics = {
        "humidity": hourly_humidity[0] if hourly_humidity else None,
        "wind_speed": current.get("windspeed"),
        "pressure": hourly_pressure[0] if hourly_pressure else None,
        "rain_probability": hourly_precip_prob[0] if hourly_precip_prob else None,
        "uv_index": hourly.get("uv_index", [None])[0] if hourly.get("uv_index") else None,
        "aqi": aqi_value,
        "aqi_label": aqi_label,
        "aqi_color": aqi_color,
        "pm2_5": pm2_5,
    }

    return {
        "location": {
            "city": location.get("name"),
            "country": location.get("country"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "timezone": timezone,
        },
        "current": {
            "temperature": current.get("temperature"),
            "windspeed": current.get("windspeed"),
            "weathercode": current_code,
            "condition": current_weather["label"],
            "icon": current_weather["icon"],
            "time": current.get("time"),
            "sunrise": sunrise_times[0] if sunrise_times else None,
            "sunset": sunset_times[0] if sunset_times else None,
        },
        "hourly": hourly_forecast,
        "daily": daily_forecast,
        "chart": {
            "times": hourly_times[:24],
            "temperatures": hourly_temps[:24],
        },
        "statistics": statistics,
    }


@app.route("/")
def home() -> str:
    """Render the main dashboard page."""
    return render_template("index.html")


@app.route("/weather")
def get_weather() -> Any:
    """Fetch weather data for a city or coordinates and return normalized JSON."""
    city = request.args.get("city", "").strip()
    lat_val = request.args.get("lat", "").strip()
    lon_val = request.args.get("lon", "").strip()

    if not city and not (lat_val and lon_val):
        return jsonify({"error": "Please enter a city name or supply latitude and longitude coordinates."}), 400

    try:
        if lat_val and lon_val:
            try:
                lat = float(lat_val)
                lon = float(lon_val)
            except ValueError:
                return jsonify({"error": "Invalid latitude or longitude coordinates."}), 400

            location = {
                "name": "Your Location",
                "country": "",
                "latitude": lat,
                "longitude": lon
            }
            try:
                headers = {"User-Agent": "AeroSkyWeatherDashboard/1.0 (contact: test@example.com)"}
                resp = requests.get(
                    f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json",
                    headers=headers,
                    timeout=5
                )
                if resp.status_code == 200:
                    addr = resp.json().get("address", {})
                    city_name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or "Your Location"
                    country_name = addr.get("country") or ""
                    location["name"] = city_name
                    location["country"] = country_name
            except Exception as e:
                app.logger.warning("Nominatim reverse geocoding failed: %s", e)
        else:
            location_data = get_coordinates(city)
            if location_data is None:
                return jsonify({"error": "City not found. Please try another search."}), 404
            location = {
                "name": location_data.get("name"),
                "country": location_data.get("country"),
                "latitude": location_data.get("latitude"),
                "longitude": location_data.get("longitude")
            }

        raw_weather = fetch_weather(location["latitude"], location["longitude"])
        air_quality = {}
        try:
            air_quality = fetch_air_quality(location["latitude"], location["longitude"])
        except Exception as e:
            app.logger.warning("Air quality fetch failed: %s", e)
            air_quality = {}

        parsed = parse_weather_response(raw_weather, location, air_quality)
        return jsonify(parsed)

    except requests.exceptions.Timeout:
        app.logger.warning("External API timeout while fetching data for city=%s lat=%s lon=%s", city, lat_val, lon_val)
        return jsonify({"error": "Upstream service timeout while fetching weather data."}), 504
    except requests.exceptions.RequestException:
        return jsonify({"error": "Network error while fetching weather data."}), 503
    except ValueError:
        return jsonify({"error": "Unexpected response from weather service."}), 502
    except Exception:
        return jsonify({"error": "Unable to fetch weather. Try again later."}), 500


if __name__ == "__main__":
    # By default run without the reloader to avoid duplicate processes
    # and blocking behavior in some terminals. Set FLASK_DEBUG=1 to enable debug mode.
    import os
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode, use_reloader=False)
