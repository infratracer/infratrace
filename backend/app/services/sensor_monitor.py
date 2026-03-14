import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assumption import Assumption
from app.models.sensor import SensorReading

logger = logging.getLogger(__name__)


async def check_thresholds(
    db: AsyncSession,
    reading: SensorReading,
    project_id: uuid.UUID,
) -> Assumption | None:
    """Compare a sensor reading against active assumptions with matching sensor_type.

    If the reading exceeds the assumption threshold, sets anomaly_flag=True
    and returns the matched assumption.
    """
    result = await db.execute(
        select(Assumption).where(
            Assumption.project_id == project_id,
            Assumption.sensor_type == reading.sensor_type,
            Assumption.status == "active",
            Assumption.threshold_value.isnot(None),
        )
    )
    assumptions = result.scalars().all()

    for assumption in assumptions:
        threshold = float(assumption.threshold_value)
        value = float(reading.value)

        if value > threshold:
            reading.anomaly_flag = True
            reading.related_assumption_id = assumption.id
            logger.info(
                "Anomaly detected: %s=%s exceeds threshold %s (assumption: %s)",
                reading.sensor_type,
                value,
                threshold,
                assumption.assumption_text[:50],
            )
            return assumption

    return None
