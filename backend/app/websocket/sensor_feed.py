"""WebSocket sensor feed — reads from project_sensors config, not hardcoded types.

For each connected project:
1. Loads the project's sensor configs from DB
2. For each active sensor, fetches a reading from the configured data source
   (real API or simulator fallback)
3. Checks thresholds for anomaly detection
4. Persists reading to database
5. Broadcasts to connected WebSocket clients
"""
import asyncio
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.database import async_session
from app.models.assumption import Assumption
from app.models.project_sensor import ProjectSensor
from app.models.sensor import SensorReading
from app.services.data_feeds import fetch_reading, _generate_simulated

logger = logging.getLogger(__name__)

router = APIRouter()

connected_clients: dict[str, set[WebSocket]] = defaultdict(set)
active_simulators: dict[str, asyncio.Task] = {}


async def broadcast(project_id: str, message: dict) -> None:
    disconnected = set()
    for ws in connected_clients[project_id]:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)
    connected_clients[project_id] -= disconnected


async def run_sensor_feed(project_id: str, interval: int = 5) -> None:
    """Background task that fetches, persists, and broadcasts sensor readings."""
    while True:
        try:
            async with async_session() as db:
                # Load this project's active sensor configs
                result = await db.execute(
                    select(ProjectSensor).where(
                        ProjectSensor.project_id == uuid.UUID(project_id),
                        ProjectSensor.is_active == True,  # noqa: E712
                    ).order_by(ProjectSensor.display_order.asc())
                )
                sensors = result.scalars().all()

                if not sensors:
                    # No sensors configured — sleep and retry
                    await asyncio.sleep(interval)
                    continue

                # Load assumption thresholds for anomaly checking
                assumptions_result = await db.execute(
                    select(Assumption).where(
                        Assumption.project_id == uuid.UUID(project_id),
                        Assumption.status == "active",
                        Assumption.threshold_value.is_not(None),
                    )
                )
                assumptions_by_sensor = {}
                for a in assumptions_result.scalars().all():
                    if a.sensor_config_id:
                        assumptions_by_sensor[str(a.sensor_config_id)] = float(a.threshold_value)
                    elif a.sensor_type:
                        assumptions_by_sensor[a.sensor_type] = float(a.threshold_value)

                for sensor in sensors:
                    # Try real data source, fall back to simulator
                    reading_result = await fetch_reading(sensor)
                    if reading_result is None:
                        reading_result = _generate_simulated(sensor)

                    value, unit = reading_result

                    # Anomaly detection — check sensor threshold + assumption threshold
                    threshold = None
                    if sensor.threshold_max is not None:
                        threshold = float(sensor.threshold_max)
                    # Override with assumption threshold if linked
                    assumption_thresh = assumptions_by_sensor.get(str(sensor.id)) or assumptions_by_sensor.get(sensor.name)
                    if assumption_thresh is not None:
                        threshold = assumption_thresh

                    anomaly = threshold is not None and value > threshold
                    deviation_pct = round(((value - threshold) / threshold) * 100, 1) if threshold and value > threshold else None

                    # Persist
                    reading = SensorReading(
                        project_id=uuid.UUID(project_id),
                        sensor_type=sensor.name,
                        value=value,
                        unit=unit,
                        source=sensor.data_source,
                        anomaly_flag=anomaly,
                        sensor_config_id=sensor.id,
                    )
                    db.add(reading)

                    # Broadcast
                    message = {
                        "sensor_type": sensor.name,
                        "sensor_id": str(sensor.id),
                        "label": sensor.label,
                        "value": value,
                        "unit": unit,
                        "category": sensor.category,
                        "anomaly": anomaly,
                        "threshold": threshold,
                        "deviation_pct": deviation_pct,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    await broadcast(project_id, message)

                await db.commit()

        except Exception as e:
            logger.error("Sensor feed error for project %s: %s", project_id, e)

        await asyncio.sleep(interval)


@router.websocket("/ws/sensors/{project_id}")
async def sensor_websocket(websocket: WebSocket, project_id: str) -> None:
    await websocket.accept()
    connected_clients[project_id].add(websocket)
    logger.info("WebSocket client connected for project %s", project_id)

    if project_id not in active_simulators or active_simulators[project_id].done():
        active_simulators[project_id] = asyncio.create_task(
            run_sensor_feed(project_id)
        )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients[project_id].discard(websocket)
        logger.info("WebSocket client disconnected for project %s", project_id)

        if not connected_clients[project_id] and project_id in active_simulators:
            active_simulators[project_id].cancel()
            del active_simulators[project_id]
