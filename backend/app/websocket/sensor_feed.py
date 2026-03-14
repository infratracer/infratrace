import asyncio
import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.iot_simulator import SENSOR_CONFIGS, generate_reading

logger = logging.getLogger(__name__)

router = APIRouter()

connected_clients: dict[str, set[WebSocket]] = defaultdict(set)
active_simulators: dict[str, asyncio.Task] = {}


async def broadcast(project_id: str, message: dict) -> None:
    """Send a message to all WebSocket clients connected to a project."""
    disconnected = set()
    for ws in connected_clients[project_id]:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.add(ws)

    connected_clients[project_id] -= disconnected


async def run_simulator(project_id: str, interval: int = 5) -> None:
    """Background task that generates and broadcasts sensor readings."""
    step = 0
    while True:
        for sensor_type in SENSOR_CONFIGS:
            value, unit = generate_reading(sensor_type, step=step)
            message = {
                "sensor_type": sensor_type,
                "value": value,
                "unit": unit,
                "anomaly": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await broadcast(project_id, message)
        step += 1
        await asyncio.sleep(interval)


@router.websocket("/ws/sensors/{project_id}")
async def sensor_websocket(websocket: WebSocket, project_id: str) -> None:
    await websocket.accept()
    connected_clients[project_id].add(websocket)
    logger.info("WebSocket client connected for project %s", project_id)

    if project_id not in active_simulators or active_simulators[project_id].done():
        active_simulators[project_id] = asyncio.create_task(
            run_simulator(project_id)
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
