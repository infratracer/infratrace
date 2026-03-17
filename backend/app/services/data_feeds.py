"""Data feed providers for real-time sensor readings.

Each provider implements get_reading(config) -> (value, unit) or None on failure.
The system falls back to the simulator if the real API is unavailable.
"""
import logging
import math
import random

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def fetch_reading(sensor_config) -> tuple[float, str] | None:
    """Fetch a reading from the configured data source.

    Returns (value, unit) or None if the source fails (triggering simulator fallback).
    """
    source = sensor_config.data_source
    config = sensor_config.source_config or {}

    if source == "api":
        provider = config.get("provider", "")
        try:
            if provider == "openweathermap":
                return await _fetch_openweathermap(config, sensor_config.unit)
            elif provider == "metalpriceapi":
                return await _fetch_metalpriceapi(config, sensor_config.unit)
            elif provider == "exchangerate":
                return await _fetch_exchangerate(config, sensor_config.unit)
            else:
                logger.warning("Unknown API provider: %s", provider)
                return None
        except Exception as e:
            logger.error("Data feed error for %s/%s: %s", sensor_config.name, provider, e)
            return None

    elif source == "manual":
        # Manual readings are entered via API, not fetched
        return None

    # Default: simulator
    return _generate_simulated(sensor_config)


def _generate_simulated(sensor_config, step: int = 0) -> tuple[float, str]:
    """Generate a simulated reading using the sensor's configured parameters."""
    base = float(sensor_config.base_value or 100)
    noise = float(sensor_config.noise_factor or base * 0.05)
    low = float(sensor_config.range_min or base * 0.5)
    high = float(sensor_config.range_max or base * 1.5)

    drift = math.sin(random.random() * math.pi * 2) * noise * 2
    noise_val = random.gauss(0, noise)
    value = base + drift + noise_val
    value = max(low, min(high, value))

    return round(value, 4), sensor_config.unit


# ---------------------------------------------------------------------------
# OpenWeatherMap — temperature, rainfall, humidity, wind
# Free tier: 1000 calls/day
# source_config: { "provider": "openweathermap", "city": "Perth,AU", "field": "main.temp" }
# ---------------------------------------------------------------------------

async def _fetch_openweathermap(config: dict, unit: str) -> tuple[float, str] | None:
    api_key = config.get("api_key") or settings.OPENWEATHERMAP_API_KEY
    if not api_key:
        logger.debug("OpenWeatherMap API key not configured")
        return None

    city = config.get("city", "Perth,AU")
    field = config.get("field", "main.temp")  # main.temp, main.humidity, rain.1h, wind.speed
    units = config.get("units", "metric")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": api_key, "units": units},
        )
        resp.raise_for_status()
        data = resp.json()

    # Navigate nested field path like "main.temp" or "rain.1h"
    value = data
    for key in field.split("."):
        if isinstance(value, dict):
            value = value.get(key)
        else:
            value = None
            break

    if value is None:
        # Some fields (like rain) may not exist if there's no rain
        return 0.0, unit

    return round(float(value), 4), unit


# ---------------------------------------------------------------------------
# MetalpriceAPI — commodity prices (steel, copper, aluminium, zinc, etc.)
# Free tier: 100 requests/month
# source_config: { "provider": "metalpriceapi", "base": "USD", "symbol": "CU" }
# Symbols: XCU=copper, IRON=iron ore, ALU=aluminium, XAU=gold, XAG=silver
# ---------------------------------------------------------------------------

async def _fetch_metalpriceapi(config: dict, unit: str) -> tuple[float, str] | None:
    api_key = config.get("api_key") or settings.METALPRICEAPI_KEY
    if not api_key:
        logger.debug("MetalpriceAPI key not configured")
        return None

    base_currency = config.get("base", "USD")
    symbol = config.get("symbol", "CU")
    multiplier = float(config.get("multiplier", 1))  # convert per-oz to per-tonne etc.

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://api.metalpriceapi.com/v1/latest",
            params={"api_key": api_key, "base": base_currency, "currencies": symbol},
        )
        resp.raise_for_status()
        data = resp.json()

    if not data.get("success"):
        logger.warning("MetalpriceAPI returned error: %s", data)
        return None

    rates = data.get("rates", {})
    rate = rates.get(symbol) or rates.get(f"{base_currency}{symbol}")
    if rate is None:
        logger.warning("MetalpriceAPI: symbol %s not in response", symbol)
        return None

    value = float(rate) * multiplier
    return round(value, 4), unit


# ---------------------------------------------------------------------------
# Exchange Rate API — currency conversion
# Free tier: 1500 requests/month (exchangerate-api.com)
# source_config: { "provider": "exchangerate", "from": "USD", "to": "AUD" }
# ---------------------------------------------------------------------------

async def _fetch_exchangerate(config: dict, unit: str) -> tuple[float, str] | None:
    from_currency = config.get("from", "USD")
    to_currency = config.get("to", "AUD")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"https://open.er-api.com/v6/latest/{from_currency}"
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("result") != "success":
        return None

    rate = data.get("rates", {}).get(to_currency)
    if rate is None:
        return None

    return round(float(rate), 4), unit
