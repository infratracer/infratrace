"""InfraTrace seed data script.

Run via: python -m app.seed.demo_data

Creates the EnergyConnect case study with:
- 4 users
- 3 projects
- 15 decisions with REAL SHA-256 hash chains
- 30 days of sensor history
- 4 AI analysis findings
- Blockchain anchor placeholders
- 5 assumptions with thresholds
- 15 audit log entries
"""

import asyncio
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text

from app.config import settings
from app.core.security import hash_password
from app.database import async_session
from app.models.analysis import AIAnalysisResult
from app.models.assumption import Assumption
from app.models.audit import AuditLog
from app.models.blockchain import BlockchainAnchor
from app.models.decision import DecisionRecord
from app.models.project import Project, ProjectMember
from app.models.project_sensor import ProjectSensor
from app.models.sensor import SensorReading
from app.models.user import User
from app.services.hash_chain import GENESIS_HASH, compute_hash
from app.services.iot_simulator import generate_batch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


async def seed() -> None:
    async with async_session() as db:
        existing = await db.execute(select(User).where(User.email == "admin@infratrace.io"))
        if existing.scalar_one_or_none() is not None:
            logger.info("Seed data already exists — skipping")
            return

        logger.info("Seeding InfraTrace demo data...")

        admin_password = settings.SEED_ADMIN_PASSWORD
        demo_password = settings.SEED_DEMO_PASSWORD

        admin = User(
            email="admin@infratrace.io",
            password_hash=hash_password(admin_password),
            full_name="System Administrator",
            role="admin",
            organisation="InfraTrace",
        )
        sarah = User(
            email="sarah.chen@infratrace.io",
            password_hash=hash_password(demo_password),
            full_name="Sarah Chen",
            role="project_manager",
            organisation="EnergyConnect Pty Ltd",
        )
        auditor = User(
            email="auditor@infratrace.io",
            password_hash=hash_password(demo_password),
            full_name="James Wilson",
            role="auditor",
            organisation="National Audit Office",
        )
        stakeholder = User(
            email="stakeholder@infratrace.io",
            password_hash=hash_password(demo_password),
            full_name="Maria Santos",
            role="stakeholder",
            organisation="Department of Energy",
        )

        db.add_all([admin, sarah, auditor, stakeholder])
        await db.flush()
        logger.info("Seeded 4 users")

        energy_connect = Project(
            name="EnergyConnect",
            description="High-voltage transmission line connecting renewable energy zones across New South Wales. "
                        "A critical infrastructure project spanning 900km with multiple substations.",
            original_budget=2100000000,
            current_budget=3420000000,
            status="active",
            start_date=datetime(2019, 3, 1).date(),
            expected_end=datetime(2025, 12, 31).date(),
            created_by=sarah.id,
        )
        western_renewables = Project(
            name="Western Renewables Hub",
            description="Solar and wind farm complex with grid integration in Western Australia. "
                        "Includes 500MW solar and 200MW wind generation capacity.",
            original_budget=850000000,
            current_budget=920000000,
            status="active",
            start_date=datetime(2022, 6, 1).date(),
            expected_end=datetime(2026, 6, 30).date(),
            created_by=sarah.id,
        )
        metro_tunnel = Project(
            name="Metro Tunnel Stage 2",
            description="Underground rail extension through Melbourne CBD with 5 new stations. "
                        "Second phase of the Metro Tunnel Project connecting northern and southern rail networks.",
            original_budget=4200000000,
            current_budget=4680000000,
            status="planning",
            start_date=datetime(2025, 1, 1).date(),
            expected_end=datetime(2030, 12, 31).date(),
            created_by=sarah.id,
        )

        db.add_all([energy_connect, western_renewables, metro_tunnel])
        await db.flush()
        logger.info("Seeded 3 projects")

        members = [
            ProjectMember(project_id=energy_connect.id, user_id=sarah.id, project_role="pm"),
            ProjectMember(project_id=energy_connect.id, user_id=auditor.id, project_role="auditor"),
            ProjectMember(project_id=energy_connect.id, user_id=stakeholder.id, project_role="stakeholder"),
            ProjectMember(project_id=western_renewables.id, user_id=sarah.id, project_role="pm"),
            ProjectMember(project_id=western_renewables.id, user_id=auditor.id, project_role="auditor"),
            ProjectMember(project_id=metro_tunnel.id, user_id=sarah.id, project_role="pm"),
            ProjectMember(project_id=metro_tunnel.id, user_id=auditor.id, project_role="auditor"),
        ]
        db.add_all(members)
        await db.flush()
        logger.info("Seeded project members")

        # Seed project sensor configurations
        sensor_configs_data = [
            {"name": "steel_price", "label": "Steel Price", "unit": "$/tonne", "category": "commodity",
             "data_source": "simulator", "base_value": 1000, "range_min": 800, "range_max": 1400, "noise_factor": 50,
             "threshold_max": 1100, "warning_threshold": 1000, "display_order": 0,
             "source_config": {"provider": "metalpriceapi", "base": "USD", "symbol": "FE", "multiplier": 1}},
            {"name": "copper_price", "label": "Copper Price", "unit": "$/tonne", "category": "commodity",
             "data_source": "simulator", "base_value": 9000, "range_min": 7500, "range_max": 11000, "noise_factor": 200,
             "threshold_max": 9500, "warning_threshold": 9000, "display_order": 1,
             "source_config": {"provider": "metalpriceapi", "base": "USD", "symbol": "CU", "multiplier": 1}},
            {"name": "labour_rate", "label": "Labour Rate", "unit": "$/hour", "category": "labour",
             "data_source": "simulator", "base_value": 82, "range_min": 70, "range_max": 100, "noise_factor": 5,
             "threshold_max": 92, "warning_threshold": 88, "display_order": 2},
            {"name": "rainfall", "label": "Rainfall", "unit": "mm/day", "category": "weather",
             "data_source": "simulator", "base_value": 10, "range_min": 0, "range_max": 50, "noise_factor": 8,
             "threshold_max": 30, "warning_threshold": 20, "display_order": 3,
             "source_config": {"provider": "openweathermap", "city": "Perth,AU", "field": "rain.1h"}},
            {"name": "temperature", "label": "Temperature", "unit": "\u00b0C", "category": "weather",
             "data_source": "simulator", "base_value": 28, "range_min": 15, "range_max": 42, "noise_factor": 4,
             "threshold_max": 38, "warning_threshold": 35, "display_order": 4,
             "source_config": {"provider": "openweathermap", "city": "Perth,AU", "field": "main.temp"}},
            {"name": "delivery_status", "label": "Delivery Delay", "unit": "days", "category": "logistics",
             "data_source": "simulator", "base_value": 3, "range_min": 0, "range_max": 21, "noise_factor": 3,
             "threshold_max": 14, "warning_threshold": 10, "display_order": 5},
        ]

        sensor_config_objs = {}
        for sc in sensor_configs_data:
            obj = ProjectSensor(
                project_id=energy_connect.id,
                name=sc["name"],
                label=sc["label"],
                unit=sc["unit"],
                category=sc.get("category"),
                data_source=sc.get("data_source", "simulator"),
                source_config=sc.get("source_config"),
                base_value=sc.get("base_value"),
                range_min=sc.get("range_min"),
                range_max=sc.get("range_max"),
                noise_factor=sc.get("noise_factor"),
                threshold_max=sc.get("threshold_max"),
                warning_threshold=sc.get("warning_threshold"),
                display_order=sc.get("display_order", 0),
                created_by=sarah.id,
            )
            db.add(obj)
            sensor_config_objs[sc["name"]] = obj
        await db.flush()
        logger.info("Seeded %d project sensor configs for EnergyConnect", len(sensor_configs_data))

        assumptions_data = [
            {
                "text": "Steel costs will not exceed $1,100/tonne",
                "category": "cost",
                "threshold_value": 1100,
                "threshold_unit": "$/tonne",
                "sensor_type": "steel_price",
                "status": "invalidated",
            },
            {
                "text": "Copper costs will not exceed $9,500/tonne",
                "category": "cost",
                "threshold_value": 9500,
                "threshold_unit": "$/tonne",
                "sensor_type": "copper_price",
                "status": "active",
            },
            {
                "text": "Labour rates will remain below $92/hour",
                "category": "cost",
                "threshold_value": 92,
                "threshold_unit": "$/hour",
                "sensor_type": "labour_rate",
                "status": "active",
            },
            {
                "text": "Construction delays will not exceed 14 days",
                "category": "schedule",
                "threshold_value": 14,
                "threshold_unit": "days",
                "sensor_type": "delivery_status",
                "status": "active",
            },
            {
                "text": "Environmental approval by Q2 2023",
                "category": "regulatory",
                "threshold_value": None,
                "threshold_unit": None,
                "sensor_type": None,
                "status": "invalidated",
            },
        ]

        assumption_objs = []
        for a in assumptions_data:
            sensor_cfg = sensor_config_objs.get(a["sensor_type"]) if a["sensor_type"] else None
            obj = Assumption(
                project_id=energy_connect.id,
                assumption_text=a["text"],
                category=a["category"],
                status=a["status"],
                threshold_value=a["threshold_value"],
                threshold_unit=a["threshold_unit"],
                sensor_type=a["sensor_type"],
                sensor_config_id=sensor_cfg.id if sensor_cfg else None,
            )
            db.add(obj)
            assumption_objs.append(obj)
        await db.flush()
        logger.info("Seeded 5 assumptions")

        anomaly_thresholds = {
            "steel_price": 1100,
            "copper_price": 9500,
        }
        sensor_readings = generate_batch(
            project_id=energy_connect.id,
            days=30,
            readings_per_day=4,
            seed=42,
            anomaly_types=anomaly_thresholds,
        )
        for reading in sensor_readings:
            for assumption in assumption_objs:
                if (
                    assumption.sensor_type == reading.sensor_type
                    and assumption.threshold_value is not None
                    and float(reading.value) > float(assumption.threshold_value)
                ):
                    reading.related_assumption_id = assumption.id
                    break
        db.add_all(sensor_readings)
        await db.flush()
        logger.info("Seeded %d sensor readings", len(sensor_readings))

        anomaly_readings = [r for r in sensor_readings if r.anomaly_flag]

        decisions_spec = [
            {
                "date": "2019-03-15", "type": "approval", "title": "Project approved at A$2.1B",
                "description": "The EnergyConnect project received formal approval from the Australian Energy Regulator. "
                               "Initial budget set at A$2.1 billion covering 900km of transmission infrastructure.",
                "justification": "Critical infrastructure needed to connect renewable energy zones across NSW. "
                                 "Cost-benefit analysis demonstrated long-term savings and grid reliability improvements.",
                "cost": 0, "risk": "low", "schedule": 0,
            },
            {
                "date": "2020-01-20", "type": "assumption_change", "title": "Revised material cost estimates",
                "description": "Global steel and copper prices increased significantly following pandemic-related supply chain disruptions. "
                               "Material cost assumptions updated to reflect current market conditions.",
                "justification": "Supply chain analysis showed 15-20% increase in raw material costs since project inception. "
                                 "Procurement team recommended budget adjustment to secure materials at current prices.",
                "cost": 180000000, "risk": "medium", "schedule": 0, "sensor_triggered": True,
            },
            {
                "date": "2020-06-10", "type": "scope_change", "title": "Extended route via western corridor",
                "description": "Route extension through the western corridor adds 120km of transmission line to connect "
                               "additional wind farms being developed in the region.",
                "justification": "Strategic decision to maximise renewable energy capture. The western corridor extension "
                                 "will serve three planned wind farms with combined capacity of 1.2GW.",
                "cost": 320000000, "risk": "high", "schedule": 90,
            },
            {
                "date": "2021-02-05", "type": "contractor_change", "title": "Replaced contractor Segment 4",
                "description": "Primary contractor for Segment 4 terminated due to persistent quality issues and schedule delays. "
                               "New contractor selected through competitive tender process.",
                "justification": "Independent quality audits revealed systematic deficiencies in welding standards. "
                                 "Continued work posed safety risks and would require extensive remediation.",
                "cost": 150000000, "risk": "high", "schedule": 120,
            },
            {
                "date": "2021-08-22", "type": "risk_acceptance", "title": "Accepted supply chain delay risk",
                "description": "Formal acceptance of supply chain delay risk for specialised transformer equipment. "
                               "Lead times extended from 12 to 18 months for critical high-voltage transformers.",
                "justification": "No alternative suppliers available for 500kV transformer units. Mitigation involves "
                                 "parallel procurement of secondary components and schedule buffer.",
                "cost": 95000000, "risk": "medium", "schedule": 60,
            },
            {
                "date": "2022-01-14", "type": "assumption_change", "title": "Updated labour rate assumptions",
                "description": "Labour rate assumptions revised upward following industry-wide skilled worker shortage. "
                               "Electrician and line worker rates increased by 12% year-over-year.",
                "justification": "Labour market analysis confirmed structural shortage of qualified transmission line workers. "
                                 "Competitive rates necessary to attract and retain experienced crews.",
                "cost": 42000000, "risk": "low", "schedule": 0,
            },
            {
                "date": "2022-05-30", "type": "scope_change", "title": "Added battery storage Buronga",
                "description": "Addition of 200MW/400MWh battery energy storage system at Buronga substation. "
                               "Integrated with transmission line to provide grid stabilisation services.",
                "justification": "AEMO identified Buronga as critical node for grid stability. Battery storage will generate "
                                 "revenue through frequency control ancillary services market.",
                "cost": 128000000, "risk": "medium", "schedule": 45,
            },
            {
                "date": "2022-09-18", "type": "cost_revision", "title": "Mid-project cost reconciliation",
                "description": "Comprehensive cost reconciliation at project midpoint identified additional expenditure "
                               "across multiple work packages not captured in previous revisions.",
                "justification": "Internal audit required reconciliation of actual vs projected costs. Variance attributable "
                                 "to cumulative impacts of supply chain disruptions and scope additions.",
                "cost": 85000000, "risk": "medium", "schedule": 0,
            },
            {
                "date": "2023-01-25", "type": "assumption_change", "title": "Revised copper wire costs (+18%)",
                "description": "Copper wire procurement costs exceeded assumptions by 18% due to sustained global demand "
                               "from electrification projects and limited mine output.",
                "justification": "Commodities analysis indicated structural increase in copper demand. Forward contracts "
                                 "secured at current prices to limit further exposure.",
                "cost": 64000000, "risk": "medium", "schedule": 0, "sensor_triggered": True,
            },
            {
                "date": "2023-04-08", "type": "schedule_change", "title": "Extended timeline 6 months",
                "description": "Project timeline extended by 6 months to accommodate cumulative delays from contractor "
                               "changes, supply chain issues, and environmental approvals.",
                "justification": "Critical path analysis showed 6-month delay inevitable given current work package status. "
                                 "Extension avoids quality compromises from schedule compression.",
                "cost": 45000000, "risk": "medium", "schedule": 180,
            },
            {
                "date": "2023-07-12", "type": "contractor_change", "title": "Replaced subcontractor Segment 2",
                "description": "Subcontractor responsible for foundation works in Segment 2 replaced following insolvency. "
                               "Replacement contractor mobilised within 6 weeks.",
                "justification": "Subcontractor entered voluntary administration. Urgent replacement necessary to maintain "
                                 "construction schedule on critical path segment.",
                "cost": 156000000, "risk": "high", "schedule": 45,
            },
            {
                "date": "2023-09-05", "type": "risk_acceptance", "title": "Environmental compliance delay",
                "description": "Accepted delay in environmental compliance certification for Segment 5 crossing through "
                               "protected habitat area. Additional surveys and mitigation measures required.",
                "justification": "Environmental regulator required additional biodiversity offset study. Proceeding without "
                                 "certification would risk stop-work orders and potential penalties.",
                "cost": 32000000, "risk": "medium", "schedule": 60,
            },
            {
                "date": "2023-12-01", "type": "scope_change", "title": "Enhanced monitoring systems",
                "description": "Addition of real-time structural health monitoring and weather stations along the transmission "
                               "line route for operational safety and predictive maintenance.",
                "justification": "Insurance underwriters required enhanced monitoring as condition of coverage renewal. "
                                 "System will reduce long-term maintenance costs through predictive analytics.",
                "cost": 38000000, "risk": "low", "schedule": 30,
            },
            {
                "date": "2024-03-15", "type": "assumption_change", "title": "Updated steel procurement model",
                "description": "Steel procurement model updated from spot purchasing to forward contracting following "
                               "analysis of price volatility impact on remaining project phases.",
                "justification": "Price volatility analysis showed 25% variation in steel costs over previous 12 months. "
                                 "Forward contracts provide budget certainty for remaining tower fabrication.",
                "cost": 87000000, "risk": "medium", "schedule": 0, "sensor_triggered": True,
            },
            {
                "date": "2024-06-20", "type": "cost_revision", "title": "Revised total to A$3.6B",
                "description": "Final cost revision incorporating all approved scope changes, assumption adjustments, "
                               "and contractor changes. Revised project total set at A$3.6 billion.",
                "justification": "Board-level review and approval of revised project cost. Independent cost estimator "
                                 "validated the revised figure within 5% margin of error.",
                "cost": 205000000, "risk": "critical", "schedule": 0,
            },
        ]

        previous_hash = GENESIS_HASH
        decision_objs: list[DecisionRecord] = []
        sensor_trigger_indices = {1, 8, 13}

        for i, spec in enumerate(decisions_spec):
            seq = i + 1
            created_at = datetime.fromisoformat(spec["date"] + "T12:00:00.000000+00:00")

            triggered_sensor_id = None
            if spec.get("sensor_triggered") and anomaly_readings:
                triggered_sensor_id = anomaly_readings[i % len(anomaly_readings)].id

            record_hash = compute_hash(
                project_id=energy_connect.id,
                sequence_number=seq,
                decision_type=spec["type"],
                title=spec["title"],
                description=spec["description"],
                justification=spec["justification"],
                cost_impact=float(spec["cost"]),
                approved_by=sarah.id,
                created_at=created_at,
                previous_hash=previous_hash,
            )

            decision = DecisionRecord(
                project_id=energy_connect.id,
                sequence_number=seq,
                decision_type=spec["type"],
                title=spec["title"],
                description=spec["description"],
                justification=spec["justification"],
                cost_impact=spec["cost"],
                schedule_impact_days=spec.get("schedule", 0),
                risk_level=spec.get("risk"),
                approved_by=sarah.id,
                created_by=sarah.id,
                previous_hash=previous_hash,
                record_hash=record_hash,
                chain_verified=True,
                triggered_by_sensor=triggered_sensor_id,
                created_at=created_at,
            )
            db.add(decision)
            decision_objs.append(decision)
            previous_hash = record_hash

        await db.flush()
        logger.info("Seeded 15 decisions with real SHA-256 hash chain")

        # Seed blockchain anchors (placeholders for demo)
        for decision in decision_objs:
            fake_tx = "0x" + secrets.token_hex(32)
            anchor = BlockchainAnchor(
                decision_id=decision.id,
                record_hash=decision.record_hash,
                tx_hash=fake_tx,
                block_number=45000000 + decision.sequence_number * 1000,
                network="amoy",
                status="confirmed",
                gas_used=85000 + decision.sequence_number * 500,
                confirmed_at=decision.created_at + timedelta(minutes=2),
            )
            db.add(anchor)

            decision.tx_hash = fake_tx
            decision.block_number = anchor.block_number

        await db.flush()
        logger.info("Seeded 15 blockchain anchor records")

        # AI analysis findings
        findings = [
            AIAnalysisResult(
                project_id=energy_connect.id,
                analysis_type="scope_creep",
                severity="critical",
                finding="Three scope expansion decisions (#3, #7, #13) have been identified across the project lifecycle. "
                        "The cumulative cost impact of A$486M represents a 23% increase from the original budget. "
                        "The pattern suggests reactive scope management rather than proactive planning, with each addition "
                        "driven by external demands rather than project-initiated improvements.",
                related_decisions=[3, 7, 13],
                confidence_score=0.91,
                model_version="seed-v1.0",
            ),
            AIAnalysisResult(
                project_id=energy_connect.id,
                analysis_type="assumption_drift",
                severity="warning",
                finding="Four assumption changes (#2, #6, #9, #14) indicate systematic drift in cost planning parameters. "
                        "Material cost assumptions have been revised upward three times, suggesting initial estimates were "
                        "overly optimistic or failed to account for market volatility trends.",
                related_decisions=[2, 6, 9, 14],
                confidence_score=0.87,
                model_version="seed-v1.0",
            ),
            AIAnalysisResult(
                project_id=energy_connect.id,
                analysis_type="approval_pattern",
                severity="warning",
                finding="All 15 decisions were approved by a single project manager. While this is common for PM-led projects, "
                        "it represents a concentration of authority risk. Decisions #3, #7, and #11 each involved cost impacts "
                        "exceeding A$100M and would typically require board-level or committee approval.",
                related_decisions=[2, 4, 6, 7, 9, 11, 14, 15],
                confidence_score=0.82,
                model_version="seed-v1.0",
            ),
            AIAnalysisResult(
                project_id=energy_connect.id,
                analysis_type="sensor_contradiction",
                severity="warning",
                finding="IoT sensor data for steel prices shows sustained readings above the assumed $1,100/tonne threshold. "
                        "The steel cost assumption was invalidated but the procurement strategy was only partially updated "
                        "in decision #14, suggesting incomplete response to market signals.",
                related_decisions=[11],
                related_sensors=[str(r.id) for r in anomaly_readings[:5]] if anomaly_readings else None,
                confidence_score=0.79,
                model_version="seed-v1.0",
            ),
        ]
        db.add_all(findings)
        await db.flush()
        logger.info("Seeded 4 AI analysis findings")

        # Audit log entries
        now = datetime.now(timezone.utc)
        audit_entries = [
            AuditLog(user_id=admin.id, action="login", created_at=now - timedelta(days=7)),
            AuditLog(user_id=sarah.id, action="login", created_at=now - timedelta(days=6)),
            AuditLog(user_id=sarah.id, action="project_created", resource_type="project", resource_id=energy_connect.id, created_at=now - timedelta(days=6)),
            AuditLog(user_id=sarah.id, action="decision_created", resource_type="decision", metadata_={"sequence": 1}, created_at=now - timedelta(days=5)),
            AuditLog(user_id=sarah.id, action="decision_created", resource_type="decision", metadata_={"sequence": 15}, created_at=now - timedelta(days=4)),
            AuditLog(user_id=auditor.id, action="login", created_at=now - timedelta(days=3)),
            AuditLog(user_id=auditor.id, action="chain_verified", resource_type="project", resource_id=energy_connect.id, metadata_={"valid": True, "total": 15}, created_at=now - timedelta(days=3)),
            AuditLog(user_id=sarah.id, action="analysis_triggered", resource_type="project", resource_id=energy_connect.id, created_at=now - timedelta(days=2)),
            AuditLog(user_id=sarah.id, action="analysis_completed", resource_type="project", resource_id=energy_connect.id, created_at=now - timedelta(days=2)),
            AuditLog(user_id=stakeholder.id, action="login", created_at=now - timedelta(days=1)),
            AuditLog(user_id=auditor.id, action="report_exported", resource_type="project", resource_id=energy_connect.id, created_at=now - timedelta(hours=12)),
            AuditLog(user_id=admin.id, action="user_created", resource_type="user", created_at=now - timedelta(hours=6)),
            AuditLog(user_id=sarah.id, action="assumption_created", resource_type="assumption", created_at=now - timedelta(hours=3)),
            AuditLog(user_id=auditor.id, action="blockchain_verified", resource_type="project", resource_id=energy_connect.id, metadata_={"verified": 15}, created_at=now - timedelta(hours=1)),
            AuditLog(user_id=sarah.id, action="login", created_at=now),
        ]
        db.add_all(audit_entries)

        await db.commit()
        logger.info("Seed complete: 4 users, 3 projects, 15 decisions, %d sensor readings, 4 AI findings, 15 anchors, 5 assumptions, 15 audit entries", len(sensor_readings))


if __name__ == "__main__":
    asyncio.run(seed())
