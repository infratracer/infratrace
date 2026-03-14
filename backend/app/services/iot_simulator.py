import logging
import math
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor import SensorReading

logger = logging.getLogger(__name__)

SENSOR_CONFIGS: dict[str, dict] = {
    "steel_price": {
        "base": 1000, "unit": "$/tonne", "range": (800, 1400), "noise": 50,
    },
    "copper_price": {
        "base": 9000, "unit": "$/tonne", "range": (7500, 11000), "noise": 200,
    },
    "labour_rate": {
        "base": 82, "unit": "$/hour", "range": (70, 100), "noise": 5,
    },
    "rainfall": {
        "base": 10, "unit": "mm/day", "range": (0, 50), "noise": 8,
    },
    "temperature": {
        "base": 28, "unit": "°C", "range": (15, 42), "noise": 4,
    },
    "delivery_status": {
        "base": 3, "unit": "days delayed", "range": (0, 21), "noise": 3,
    },
}


def generate_reading(
    sensor_type: str,
    step: int = 0,
    seed: int | None = None,
) -> tuple[float, str]:
    """Generate a single realistic sensor reading with drift and noise."""
    config = SENSOR_CONFIGS[sensor_type]
    rng = random.Random(seed) if seed is not None else random

    base = config["base"]
    noise = config["noise"]
    low, high = config["range"]

    drift = math.sin(step * 0.05) * noise * 2
    noise_val = rng.gauss(0, noise)

    value = base + drift + noise_val
    value = max(low, min(high, value))

    return round(value, 4), config["unit"]


def generate_batch(
    project_id: uuid.UUID,
    days: int = 30,
    readings_per_day: int = 4,
    seed: int = 42,
    anomaly_types: dict[str, float] | None = None,
) -> list[SensorReading]:
    """Generate historical sensor readings for seeding.

    anomaly_types: dict mapping sensor_type to threshold — readings above
    this will be flagged as anomalies.
    """
    if anomaly_types is None:
        anomaly_types = {}

    readings: list[SensorReading] = []
    rng = random.Random(seed)
    base_time = datetime.now(timezone.utc) - timedelta(days=days)

    for sensor_type in SENSOR_CONFIGS:
        for day in range(days):
            for reading_num in range(readings_per_day):
                step = day * readings_per_day + reading_num
                value, unit = generate_reading(sensor_type, step=step, seed=rng.randint(0, 100000))

                if sensor_type in ["steel_price", "copper_price"] and day > days * 0.7:
                    spike = rng.uniform(0, SENSOR_CONFIGS[sensor_type]["noise"] * 3)
                    value = min(value + spike, SENSOR_CONFIGS[sensor_type]["range"][1])
                    value = round(value, 4)

                threshold = anomaly_types.get(sensor_type)
                anomaly = threshold is not None and value > threshold

                timestamp = base_time + timedelta(
                    days=day,
                    hours=reading_num * (24 // readings_per_day),
                    minutes=rng.randint(0, 59),
                )

                readings.append(
                    SensorReading(
                        project_id=project_id,
                        sensor_type=sensor_type,
                        value=value,
                        unit=unit,
                        source="iot_simulator",
                        anomaly_flag=anomaly,
                        created_at=timestamp,
                    )
                )

    return readings
