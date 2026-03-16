<p align="center">
  <h1 align="center">InfraTrace</h1>
  <p align="center">
    <strong>Infrastructure Decision Accountability Platform</strong>
  </p>
  <p align="center">
    Tamper-evident logging &middot; Blockchain anchoring &middot; AI-powered analysis &middot; Real-time IoT monitoring
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
    <img src="https://img.shields.io/badge/version-2.0.0-blue" alt="Version" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
    <img src="https://img.shields.io/badge/python-3.11%2B-yellow" alt="Python" />
    <img src="https://img.shields.io/badge/react-19-61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/polygon-amoy-8247E5" alt="Polygon" />
  </p>
</p>

---

InfraTrace is an infrastructure decision accountability platform that combines append-only hash-chain logging, Polygon Amoy blockchain anchoring, AI-driven risk analysis, and real-time IoT sensor monitoring into a single auditable system. It provides multi-stakeholder transparency for infrastructure projects where decisions involve public funds, regulatory oversight, or contractual obligations.

Built as a capstone project for the Harvard Extension School course on Innovation in Blockchain, AI and IoT Technology.

```mermaid
graph TB
    subgraph Frontend["Frontend (React 19 / Vite 8)"]
        UI[Glass Morphism UI]
        WS_CLIENT[WebSocket Client]
    end

    subgraph Backend["Backend (FastAPI / Python 3.11)"]
        API[REST API - 55+ Endpoints]
        AUTH[JWT Auth + RBAC]
        ORG[Multi-Tenant Orgs]
        HASH[SHA-256 Hash Chain]
        AI_SVC[AI Analysis Engine]
        FEEDS[Data Feed Service]
        WS_SERVER[WebSocket Server]
        PDF[PDF Report Generator]
        SEARCH[Full-Text Search]
        DOCS[Document Storage]
    end

    subgraph Storage["Data Layer"]
        PG[(PostgreSQL / Neon)]
        BC[Polygon Amoy Testnet]
        OR[OpenRouter API]
    end

    subgraph External["External Data Feeds"]
        OWM[OpenWeatherMap]
        METAL[MetalpriceAPI]
    end

    UI -->|HTTPS| API
    WS_CLIENT <-->|WSS| WS_SERVER
    API --> AUTH
    API --> ORG
    API --> HASH
    API --> AI_SVC
    API --> PDF
    API --> SEARCH
    API --> DOCS
    FEEDS --> WS_SERVER
    FEEDS --> OWM
    FEEDS --> METAL
    HASH --> PG
    AI_SVC --> OR
    HASH --> BC
    FEEDS --> PG
    AUTH --> PG
```

---

## What is InfraTrace? (The Non-Technical Version)

### The problem, in plain terms

When governments and organizations build infrastructure — roads, bridges, hospitals, power grids, water systems — billions of dollars move through long chains of decisions. Someone picks a contractor. Someone approves a budget increase. Someone changes the timeline. Someone accepts a risk.

These decisions shape whether a project comes in on budget or blows past it by 200%. Whether materials meet safety standards or don't. Whether public money goes where it should or disappears into someone's pocket.

Today, the records of these decisions live in spreadsheets, email threads, meeting minutes, and filing cabinets. They can be edited after the fact. They can be deleted. They can be "lost." By the time an auditor shows up — often years later — the trail is cold, the story has been rewritten, and accountability is impossible.

This isn't a hypothetical problem. The International Monetary Fund estimates a roughly 30% efficiency gap between what countries spend on infrastructure and what they actually get. Globally, that's trillions of dollars lost every year to a combination of corruption, poor decisions, and zero accountability.

### What InfraTrace actually does

InfraTrace is a record-keeping system for infrastructure decisions — but one that nobody can tamper with.

Think of it like a flight recorder (black box) for infrastructure projects. Every time someone makes a decision — approves a contract, changes a budget, modifies a timeline, accepts a risk — InfraTrace captures it: who made the decision, when, why, what information was available at the time, and what alternatives were considered.

Once a decision is recorded, it cannot be changed. Not by the person who made it. Not by their manager. Not by the system administrator. Not by anyone. The record is cryptographically sealed and independently verifiable.

If someone tries to alter a past record, the system detects it immediately and alerts every stakeholder.

### Who sees what

Different people need different views of the same project data. InfraTrace gives each stakeholder exactly what they need:

| Who | What they see | Why it matters |
|-----|--------------|----------------|
| **Project managers** | Full decision timeline, budget tracking, sensor alerts | Day-to-day project oversight |
| **Government officials** | Compliance dashboards, approval chains, audit reports | Regulatory accountability |
| **Auditors** | Verification tools, hash chain integrity checks, blockchain proofs | Independent confirmation that records haven't been altered |
| **Investors & lenders** | Risk scores, decision quality metrics, anomaly alerts | Protecting capital and monitoring project health |
| **Citizens & media** | Public timeline, plain-language summaries, budget breakdowns | Knowing where tax money goes |
| **Contractors** | Their own submissions, milestone tracking, payment status | Fair process, documented delivery |

Everyone works from the same verified truth. Nobody gets a special version of events.

### Three technologies, explained simply

InfraTrace combines three technologies. Here's what each one does in plain language:

**Blockchain** (Polygon network)
> Every decision record gets a digital fingerprint. That fingerprint is published to a public ledger that nobody controls — like stamping a document at a notary office, except the notary is a global computer network that runs 24/7 and can't be bribed or shut down. Anyone, anywhere, at any time can verify that a record is genuine and hasn't been changed.

**AI Analysis** (powered by large language models)
> The system watches the full stream of decisions and flags things that look wrong — a cost that doubled overnight with no explanation, a single person approving every decision with no oversight, budget assumptions that contradict what sensors are reporting on the ground. It doesn't make judgments. It raises questions that humans should be asking.

**IoT Sensor Monitoring** (real-time data feeds)
> Infrastructure projects make assumptions: "Steel will cost $1,100 per tonne." "Delivery will take 14 days." "Rainfall won't exceed 30mm." InfraTrace connects to real-world data streams — commodity prices, weather stations, delivery tracking — and watches whether reality matches those assumptions. When it doesn't, the system alerts project managers before small problems become expensive ones.

### What this means in practice

A project manager logs a decision to change contractors mid-project. InfraTrace records it with their name, the timestamp, their justification, the supporting documents, and the budget impact. The record is hashed, chained to every previous decision, and anchored to the blockchain.

Three months later, when costs have escalated and questions are being asked, nobody can claim the decision was never made, was made by someone else, or was justified differently than it actually was. The record is there, verified, and immutable.

That's the core of InfraTrace. Everything else — the dashboards, the AI analysis, the sensor feeds, the PDF reports — exists to make this fundamental capability useful to real people doing real work on real projects.

### Getting started is simple

A new organization deploys InfraTrace and the first administrator sets up their account through a guided bootstrap process. From there:

1. **Admin creates the organization** — name, country, industry sector
2. **Admin invites team members** by email — each person receives a secure link to set their own password
3. **Project managers create projects** — a setup wizard walks them through configuring sensors, adding team members, and defining key assumptions
4. **Users self-register** if the organization allows it, or join via invitation links

No seed scripts. No hardcoded passwords. No IT intervention required. The platform is designed so that a non-technical government officer can set it up from a browser.

---

## Table of Contents

- [What is InfraTrace?](#what-is-infratrace-the-non-technical-version)
- [The Problem](#the-problem)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [API Reference](#api-reference)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Security](#security)
- [Roadmap](#roadmap)
- [Use Cases](#use-cases)
- [Comparison Matrix](#comparison-matrix)
- [Contributing](#contributing)
- [License](#license)
- [Team & Contact](#team--contact)

---

## The Problem

Global infrastructure spending exceeds $2.5 trillion annually. The IMF estimates a 30% efficiency gap between what is spent and the value delivered. Trillions of dollars are lost to cost overruns, scope creep, opaque decision-making, and corruption. Despite this, no existing platform combines:

- **Project-contextual decision logging** with cryptographic integrity
- **Blockchain-anchored verification** accessible to any stakeholder
- **AI-driven pattern detection** across decision chains, assumptions, and sensor data
- **Real-time IoT monitoring** linked to project assumptions
- **Multi-stakeholder access control** with role-based transparency

Infrastructure decisions are made behind closed doors, recorded in spreadsheets or emails, and rarely subjected to systematic audit. When overruns occur, the chain of decisions that led to them is fragmented, editable, and opaque.

InfraTrace closes this gap by making every decision append-only, hash-chained, and optionally anchored on a public blockchain, while providing AI analysis to detect patterns that humans miss across complex project histories.

---

## Key Features

### 1. Tamper-Evident Decision Logging

Every decision record is appended to a SHA-256 hash chain. Records cannot be edited or deleted. Each record's hash is computed from the previous record's hash, forming a linked chain identical in principle to a blockchain.

```mermaid
graph LR
    G["Genesis<br/>0x0000...0000"] -->|previous_hash| D1["Decision #1<br/>SHA-256(project|1|type|title|...|0x0000)"]
    D1 -->|previous_hash| D2["Decision #2<br/>SHA-256(project|2|type|title|...|hash_1)"]
    D2 -->|previous_hash| D3["Decision #3<br/>SHA-256(project|3|type|title|...|hash_2)"]
    D3 -->|previous_hash| D4["Decision #N<br/>SHA-256(project|N|type|title|...|hash_N-1)"]

    style G fill:#1a1a2e,stroke:#e94560,color:#fff
    style D1 fill:#16213e,stroke:#0f3460,color:#fff
    style D2 fill:#16213e,stroke:#0f3460,color:#fff
    style D3 fill:#16213e,stroke:#0f3460,color:#fff
    style D4 fill:#16213e,stroke:#0f3460,color:#fff
```

<details>
<summary>Hash computation formula</summary>

```
SHA-256(
    project_id |
    sequence_number |
    decision_type |
    title |
    description |
    justification |
    cost_impact |
    approved_by |
    created_at_iso |
    previous_hash
)
```

- All fields converted to strings; `None` becomes empty string `""`
- UUIDs: lowercase hex with hyphens
- `cost_impact`: 2 decimal places; `None` becomes `""`
- `created_at`: ISO 8601 UTC with microseconds
- Pipe `|` delimiter between fields
- Genesis hash: 64 zero characters (`0` x 64)

</details>

**Decision types supported:** `scope_change`, `cost_revision`, `assumption_change`, `contractor_change`, `schedule_change`, `risk_acceptance`, `approval`

**Risk levels:** `low`, `medium`, `high`, `critical`

---

### 2. Project Lifecycle Management

Full CRUD for infrastructure projects with budget tracking, member management, and status transitions.

```mermaid
stateDiagram-v2
    [*] --> planning
    planning --> active : Start project
    active --> on_hold : Suspend
    on_hold --> active : Resume
    active --> completed : Finish
    completed --> [*]
    active --> archived : Admin archive
    on_hold --> archived : Admin archive
```

Each project tracks:
- Original budget and current budget (auto-updated by decision cost impacts)
- Start date and expected end date
- Smart contract address (if blockchain anchoring is configured)
- Member roster with project-level roles (`pm`, `auditor`, `stakeholder`)

---

### 3. AI Analysis Engine

InfraTrace uses OpenRouter to access multiple LLMs (Llama 3.3 70B, Mistral Small 3.1, Gemma 3, Qwen 3) with automatic model rotation on rate limits. A rule-based fallback engine provides analysis when AI services are unavailable.

```mermaid
graph TD
    TRIGGER["Trigger Analysis<br/>POST /projects/{id}/analysis"] --> COLLECT["Collect Project Data"]
    COLLECT --> DECISIONS["Decision Chain"]
    COLLECT --> ASSUMPTIONS["Assumptions Register"]
    COLLECT --> SENSORS["Sensor Readings"]
    COLLECT --> BUDGET["Budget Trajectory"]

    DECISIONS --> PROMPT["Build Analysis Prompt"]
    ASSUMPTIONS --> PROMPT
    SENSORS --> PROMPT
    BUDGET --> PROMPT

    PROMPT --> OR_CHECK{OpenRouter<br/>Available?}
    OR_CHECK -->|Yes| MODEL_1["Llama 3.3 70B"]
    OR_CHECK -->|No| FALLBACK["Rule-Based Engine"]
    MODEL_1 -->|Rate Limited| MODEL_2["Mistral Small 3.1"]
    MODEL_2 -->|Rate Limited| MODEL_3["Gemma 3 27B"]
    MODEL_3 -->|Rate Limited| MODEL_4["Qwen 3 4B"]
    MODEL_4 -->|All Failed| FALLBACK

    MODEL_1 --> PARSE["Parse JSON Response"]
    MODEL_2 --> PARSE
    MODEL_3 --> PARSE
    MODEL_4 --> PARSE
    PARSE --> SAVE["Save Findings to DB"]
    FALLBACK --> SAVE

    style TRIGGER fill:#0f3460,stroke:#e94560,color:#fff
    style SAVE fill:#1a1a2e,stroke:#0f3460,color:#fff
```

**Analysis types detected:**

| Type | Description |
|------|-------------|
| `scope_creep` | Multiple scope changes suggesting uncontrolled expansion |
| `cost_anomaly` | Budget drift patterns exceeding expected thresholds |
| `assumption_drift` | Repeated assumption revisions indicating planning gaps |
| `approval_pattern` | Concentrated approval authority (governance risk) |
| `sensor_contradiction` | IoT data contradicting active project assumptions |
| `risk_assessment` | Schedule and delivery risk patterns |

Each finding includes a severity (`info`, `warning`, `critical`), confidence score (0.0-1.0), affected decision sequence numbers, and a plain-language explanation.

<details>
<summary>Rule-based fallback engine details</summary>

When OpenRouter is unavailable or all 4 models are rate-limited, InfraTrace falls back to a deterministic rule engine that checks:

| Rule | Trigger Condition | Severity |
|------|-------------------|----------|
| Scope creep | 3+ scope_change decisions | `warning` (3) / `critical` (4+) |
| Assumption drift | 2+ assumption_change decisions | `warning` |
| Sensor contradiction | 5+ anomaly-flagged sensor readings | `warning` |
| Approval concentration | All approved decisions by single user (>5 decisions) | `warning` |
| Schedule risk | 3+ schedule_change decisions | `warning` |
| Cost anomaly | Cumulative cost impact exceeds original budget by 20%+ | `warning` |

The rule engine produces findings in the same schema as the AI engine, allowing the frontend to render them identically. The `model_version` field is set to `rule-based-v1.0` to distinguish them from AI-generated findings.

</details>

---

### 4. Multi-Stakeholder Access

Four platform roles with distinct permission levels, plus project-level role assignments.

```mermaid
graph TD
    subgraph Platform Roles
        ADMIN["Admin<br/>Full access + user management"]
        PM["Project Manager<br/>Create/edit projects + decisions"]
        AUDITOR["Auditor<br/>Read all + verify chains"]
        STAKE["Stakeholder<br/>Read assigned projects only"]
    end

    subgraph Project Roles
        PM_PROJ["PM<br/>Project-level write"]
        AUD_PROJ["Auditor<br/>Project-level read + verify"]
        STAKE_PROJ["Stakeholder<br/>Project-level read"]
    end

    ADMIN --> PM_PROJ
    ADMIN --> AUD_PROJ
    PM --> PM_PROJ
    AUDITOR --> AUD_PROJ
    STAKE --> STAKE_PROJ

    subgraph Public
        PUB["Unauthenticated<br/>Public timeline + hash verify"]
    end
```

| Role | Create Projects | Log Decisions | Run AI Analysis | Verify Chain | Export PDF | Manage Users |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Project Manager | Yes | Yes | Yes | No | Yes | No |
| Auditor | No | No | No | Yes | Yes | No |
| Stakeholder | No | No | No | No | Yes | No |
| Public (no auth) | No | No | No | No | No | No |

Public endpoints allow anyone to view a project's decision timeline and verify individual record hashes against the blockchain.

---

### 5. IoT Sensor Monitoring

A built-in IoT simulator generates realistic readings for six sensor types, delivered to the frontend via WebSocket. Readings are persisted and checked against assumption thresholds for anomaly detection.

```mermaid
sequenceDiagram
    participant Browser
    participant WS as WebSocket Server
    participant Sim as IoT Simulator
    participant DB as PostgreSQL
    participant Assumptions as Assumptions Register

    Browser->>WS: Connect /ws/sensors/{project_id}
    WS->>Sim: Start simulator task
    loop Every 5 seconds
        Sim->>Assumptions: Load active thresholds
        Sim->>Sim: Generate readings (6 sensor types)
        Sim->>DB: Persist sensor_readings
        Sim->>WS: Broadcast JSON
        WS->>Browser: Push reading + anomaly flag
    end
    Browser->>WS: Disconnect
    WS->>Sim: Cancel simulator task
```

**Sensor types:**

| Sensor | Base Value | Unit | Range |
|--------|-----------|------|-------|
| `steel_price` | 1,000 | $/tonne | 800 - 1,400 |
| `copper_price` | 9,000 | $/tonne | 7,500 - 11,000 |
| `labour_rate` | 82 | $/hour | 70 - 100 |
| `rainfall` | 10 | mm/day | 0 - 50 |
| `temperature` | 28 | C | 15 - 42 |
| `delivery_status` | 3 | days delayed | 0 - 21 |

Readings include sinusoidal drift and Gaussian noise for realistic time-series behavior. When a reading exceeds the threshold defined in the project's assumptions register, an anomaly flag is set and deviation percentage is calculated.

---

### 6. Blockchain Verification

Decision hashes are anchored on the Polygon Amoy testnet via a Solidity smart contract. Anyone can verify that a hash stored in InfraTrace matches the on-chain record.

```mermaid
sequenceDiagram
    participant PM as Project Manager
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant SC as Smart Contract<br/>(Polygon Amoy)

    PM->>API: POST /projects/{id}/decisions
    API->>DB: Compute hash, insert record
    API->>SC: anchorDecision(projectId, seq, hash)
    SC->>SC: Store Anchor{hash, timestamp, submitter}
    SC-->>API: tx_hash + block_number
    API->>DB: Update decision with tx_hash

    Note over PM,SC: Verification (any user, including public)

    PM->>API: POST /projects/{id}/verify/blockchain
    API->>SC: verifyDecision(projectId, seq, expectedHash)
    SC-->>API: true / false
    API-->>PM: Verification result
```

<details>
<summary>Smart contract interface (Solidity ^0.8.20)</summary>

The `InfraTraceAnchor` contract enforces:

- **Sequential anchoring**: Each project's sequence must increment by exactly 1. The contract rejects out-of-order submissions.
- **Owner-only writes**: Only the deployer (backend relayer) can submit anchors. Verification is public.
- **Immutable storage**: Anchored hashes cannot be modified or deleted.

Key functions:
- `anchorDecision(bytes32 projectId, uint256 sequence, bytes32 decisionHash)` -- store a hash
- `verifyDecision(bytes32 projectId, uint256 sequence, bytes32 expectedHash)` -- returns `bool`
- `getAnchor(bytes32 projectId, uint256 sequence)` -- returns `(hash, timestamp, submitter)`

Events emitted: `DecisionAnchored(projectId, sequence, decisionHash, submittedBy, timestamp)`

Custom errors: `NotOwner()`, `InvalidHash()`, `SequenceMismatch(expected, provided)`, `AnchorNotFound()`

</details>

<details>
<summary>Blockchain anchoring lifecycle</summary>

The anchoring process follows these steps:

1. **Decision created** -- The backend computes the SHA-256 hash and persists the record
2. **Anchor initiated** -- If `POLYGON_PRIVATE_KEY` and `CONTRACT_ADDRESS` are configured, the backend calls `anchorDecision()` on the smart contract
3. **Transaction submitted** -- The signed transaction is sent to the Polygon Amoy RPC endpoint
4. **Pending state** -- A `blockchain_anchors` record is created with `status=pending`
5. **Receipt waited** -- The backend polls for the transaction receipt (up to 120 seconds)
6. **Confirmed** -- On receipt, the anchor record is updated with `block_number`, `gas_used`, and `status=confirmed`
7. **Decision updated** -- The `decision_records` row is updated with `tx_hash`, `block_number`, and `chain_verified=true`

If any step fails, the anchor record is saved with `status=failed` and the decision remains valid in the local hash chain (blockchain anchoring is additive, not required for chain integrity).

**Gas costs:** Each anchor transaction uses approximately 200,000 gas. On Polygon Amoy testnet, this is free (test MATIC).

**Verification:** The `verifyDecision()` function is a `view` call (no gas cost) that compares the stored hash against an expected hash. Anyone can call it.

</details>

### 7. Multi-Tenant Organizations & Onboarding

InfraTrace supports multiple organizations on a single deployment. Each organization has its own users, projects, and data isolation.

```mermaid
flowchart LR
    subgraph Bootstrap["First-Time Setup"]
        B1[Deploy Platform] --> B2[POST /setup/bootstrap]
        B2 --> B3[Organization + Admin Created]
    end

    subgraph Invite["User Onboarding"]
        I1[Admin creates invitation] --> I2[Token generated]
        I2 --> I3[User clicks /invite/token]
        I3 --> I4[Sets password + joins org]
    end

    subgraph Self["Self-Registration"]
        S1[User visits /register] --> S2[Creates account]
        S2 --> S3[Awaits org assignment]
    end

    B3 --> I1
    B3 --> S1
```

**Bootstrap**: `POST /setup/bootstrap` creates the first organization and admin user. Only works when zero organizations exist — prevents accidental re-initialization.

**Invitation flow**: Admins invite users by email. Each invitation generates a secure token with 7-day expiry. The invited user clicks the link, sets their password, and is immediately logged in with the correct role and organization.

**Self-registration**: Users can create accounts at `/register`. They start as stakeholders and can be promoted by an admin.

**Password recovery**: Full forgot-password → reset-password flow with time-limited JWT tokens.

### 8. Configurable Per-Project Sensors

Sensors are not hardcoded. Each project defines its own set of sensors with custom names, units, thresholds, and data sources.

```mermaid
flowchart TD
    PM[Project Manager] -->|configures| SC[Project Sensor Config]
    SC -->|data_source=api| API[Real API Feed]
    SC -->|data_source=simulator| SIM[Simulator Fallback]
    SC -->|data_source=manual| MAN[Manual Entry]

    API --> OWM[OpenWeatherMap]
    API --> MET[MetalpriceAPI]
    API --> EXR[ExchangeRate API]

    OWM --> WS[WebSocket Broadcast]
    MET --> WS
    SIM --> WS
    WS --> DB[(sensor_readings)]
    WS --> FE[Frontend Dashboard]
```

**Built-in providers**: OpenWeatherMap (temperature, rainfall, humidity, wind), MetalpriceAPI (steel, copper, aluminium, zinc), ExchangeRate API (currency conversion).

**Automatic fallback**: If a real API is unavailable or unconfigured, the system falls back to a realistic simulator.

**Per-project configuration**: A construction project monitors concrete prices and equipment rates. A mining project monitors ore prices and water levels. Each project defines exactly what it needs.

### 9. Document Management

Decisions reference supporting documents — contracts, engineering reports, tender evaluations. InfraTrace stores them with SHA-256 checksums for integrity verification.

- **Upload**: `POST /projects/{id}/documents` (multipart, any file type)
- **List**: `GET /projects/{id}/documents`
- **Download**: `GET /projects/{id}/documents/{doc_id}/download`
- **Integrity**: SHA-256 checksum computed on upload, stored alongside the file

### 10. Full-Text Search

PostgreSQL-native full-text search across all decision records (title, description, justification).

```
GET /search?q=steel+contractor&project_id=...
```

No external search engine required. Uses `to_tsvector` / `plainto_tsquery` for efficient indexed search.

### 11. Project Setup Wizard

New projects are guided through a 4-step setup wizard:

1. **Select sensors** — Choose from 8 sensor templates or add custom
2. **Add team members** — Invite by email with role assignment
3. **Define assumptions** — Key project assumptions linked to sensors
4. **Review & launch** — Summary of configuration before going live

---

## System Architecture

### Full Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        BROWSER["Browser<br/>React 19 + TypeScript"]
        PUBLIC["Public Verifier<br/>No auth required"]
    end

    subgraph CDN["CDN / Static"]
        VERCEL["Vercel<br/>Frontend hosting"]
    end

    subgraph API_LAYER["API Layer (Railway)"]
        FASTAPI["FastAPI 2.0.0<br/>uvicorn + ASGI"]
        subgraph Routers
            R_AUTH["auth"]
            R_PROJ["projects"]
            R_DEC["decisions"]
            R_ASSUM["assumptions"]
            R_SENS["sensors"]
            R_ANAL["analysis"]
            R_VERIF["verification"]
            R_REPORT["reports"]
            R_ADMIN["admin"]
            R_PUB["public"]
        end
        subgraph Services
            S_HASH["Hash Chain Service"]
            S_BC["Blockchain Service"]
            S_AI["AI Analyser"]
            S_IOT["IoT Simulator"]
            S_AUDIT["Audit Service"]
            S_PDF["PDF Generator<br/>(WeasyPrint)"]
            S_MONITOR["Sensor Monitor"]
        end
        WS_FEED["WebSocket Feed<br/>/ws/sensors/{project_id}"]
    end

    subgraph Data["Data Layer"]
        NEON["Neon PostgreSQL<br/>9 tables"]
        POLYGON["Polygon Amoy<br/>Chain ID 80002"]
        OPENROUTER["OpenRouter API<br/>4 model rotation"]
    end

    BROWSER --> VERCEL
    VERCEL --> FASTAPI
    PUBLIC --> FASTAPI
    BROWSER <-->|WSS| WS_FEED

    FASTAPI --> Routers
    Routers --> Services

    S_HASH --> NEON
    S_BC --> POLYGON
    S_AI --> OPENROUTER
    S_IOT --> WS_FEED
    S_IOT --> NEON
    S_AUDIT --> NEON
    S_PDF --> NEON
    R_AUTH --> NEON
```

### Data Flow

```mermaid
flowchart LR
    subgraph Input
        USER["User Action"]
        SENSOR["IoT Sensor"]
    end

    subgraph Processing
        VALIDATE["Validate + Authorize"]
        HASH_COMP["Compute SHA-256"]
        CHAIN_LINK["Link to Previous Hash"]
        PERSIST["Persist to PostgreSQL"]
        ANCHOR["Anchor on Polygon"]
        ANALYSE["AI Analysis"]
    end

    subgraph Output
        RESPONSE["API Response"]
        WS_MSG["WebSocket Broadcast"]
        PDF_OUT["PDF Report"]
        BC_PROOF["Blockchain Proof"]
    end

    USER --> VALIDATE --> HASH_COMP --> CHAIN_LINK --> PERSIST
    PERSIST --> ANCHOR --> BC_PROOF
    PERSIST --> ANALYSE
    SENSOR --> PERSIST --> WS_MSG
    PERSIST --> PDF_OUT
    PERSIST --> RESPONSE
```

### Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        enum role "admin|project_manager|auditor|stakeholder"
        string organisation
        boolean is_active
        timestamp created_at
        timestamp last_login
    }

    projects {
        uuid id PK
        string name
        string description
        decimal original_budget
        decimal current_budget
        enum status "planning|active|on_hold|completed"
        date start_date
        date expected_end
        string contract_address
        uuid created_by FK
        timestamp created_at
    }

    project_members {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        enum project_role "pm|auditor|stakeholder"
        timestamp added_at
    }

    decision_records {
        uuid id PK
        uuid project_id FK
        int sequence_number
        enum decision_type
        string title
        string description
        string justification
        jsonb assumptions
        decimal cost_impact
        int schedule_impact_days
        enum risk_level "low|medium|high|critical"
        uuid approved_by FK
        uuid created_by FK
        jsonb supporting_docs
        string previous_hash
        string record_hash UK
        string tx_hash
        bigint block_number
        boolean chain_verified
        uuid triggered_by_sensor FK
        timestamp created_at
    }

    assumptions_register {
        uuid id PK
        uuid project_id FK
        string assumption_text
        string category
        enum status "active|invalidated|superseded|validated"
        decimal threshold_value
        string threshold_unit
        string sensor_type
        uuid original_decision_id FK
        uuid invalidated_by_id FK
        timestamp created_at
    }

    sensor_readings {
        uuid id PK
        uuid project_id FK
        string sensor_type
        decimal value
        string unit
        string source
        boolean anomaly_flag
        uuid related_assumption_id FK
        timestamp created_at
    }

    ai_analysis_results {
        uuid id PK
        uuid project_id FK
        enum analysis_type
        enum severity "info|warning|critical"
        string finding
        jsonb related_decisions
        jsonb related_sensors
        decimal confidence_score
        string model_version
        timestamp created_at
    }

    blockchain_anchors {
        uuid id PK
        uuid decision_id FK
        string record_hash
        string tx_hash
        bigint block_number
        string network
        enum status "pending|confirmed|failed"
        bigint gas_used
        timestamp anchored_at
        timestamp confirmed_at
    }

    audit_log {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb metadata
        inet ip_address
        timestamp created_at
    }

    users ||--o{ projects : creates
    users ||--o{ project_members : "belongs to"
    projects ||--o{ project_members : has
    projects ||--o{ decision_records : contains
    projects ||--o{ assumptions_register : tracks
    projects ||--o{ sensor_readings : monitors
    projects ||--o{ ai_analysis_results : analyzes
    decision_records ||--o| blockchain_anchors : anchored_by
    decision_records ||--o{ assumptions_register : triggers
    sensor_readings ||--o{ decision_records : triggers
    assumptions_register ||--o{ sensor_readings : monitored_by
    users ||--o{ audit_log : generates

    organizations {
        uuid id PK
        string name
        string slug UK
        string country
        string industry
        boolean is_active
        timestamp created_at
    }

    project_sensors {
        uuid id PK
        uuid project_id FK
        string name
        string label
        string unit
        string category
        string data_source
        jsonb source_config
        numeric threshold_max
        numeric base_value
        boolean is_active
        timestamp created_at
    }

    documents {
        uuid id PK
        uuid project_id FK
        uuid decision_id FK
        string filename
        string content_type
        bigint size_bytes
        string checksum_sha256
        uuid uploaded_by FK
        timestamp created_at
    }

    user_invitations {
        uuid id PK
        string email
        uuid organisation_id FK
        string role
        string token UK
        timestamp expires_at
        timestamp accepted_at
    }

    project_settings {
        uuid id PK
        uuid project_id FK
        string setting_key
        jsonb setting_value
    }

    organizations ||--o{ users : employs
    organizations ||--o{ user_invitations : sends
    projects ||--o{ project_sensors : configures
    projects ||--o{ documents : stores
    projects ||--o{ project_settings : customizes
    project_sensors ||--o{ sensor_readings : feeds
```

---

## API Reference

InfraTrace exposes 55+ REST endpoints organized into 15 router groups, plus one WebSocket endpoint.

### Endpoint Groups

| Group | Prefix | Auth | Endpoints |
|-------|--------|------|-----------|
| Auth | `/api/v1/auth` | Mixed | `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`, `POST /forgot-password`, `POST /reset-password` |
| Onboarding | `/api/v1` | Mixed | `POST /setup/bootstrap`, `POST /auth/register`, `POST /invitations`, `POST /invitations/accept/{token}`, `GET /organizations`, `GET /organizations/{id}` |
| Projects | `/api/v1/projects` | JWT | `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `GET /{id}/members`, `POST /{id}/members`, `DELETE /{id}/members/{user_id}` |
| Decisions | `/api/v1/projects/{id}/decisions` | JWT | `POST /`, `GET /`, `GET /timeline`, `GET /{decision_id}` |
| Assumptions | `/api/v1/projects/{id}/assumptions` | JWT | `GET /`, `POST /`, `PUT /{assumption_id}`, `DELETE /{assumption_id}` |
| Sensors | `/api/v1/projects/{id}/sensors` | JWT | `GET /`, `GET /latest`, `GET /anomalies` |
| Sensor Config | `/api/v1/projects/{id}/sensors/config` | JWT | `GET /`, `POST /`, `PUT /{sensor_id}`, `DELETE /{sensor_id}` |
| Settings | `/api/v1/projects/{id}/settings` | JWT | `GET /{key}`, `PUT /{key}` (decision_types, risk_levels) |
| Documents | `/api/v1/projects/{id}/documents` | JWT | `POST /`, `GET /`, `GET /{doc_id}/download`, `DELETE /{doc_id}` |
| Analysis | `/api/v1/projects/{id}/analysis` | JWT | `POST /`, `GET /`, `GET /{analysis_id}` |
| Verification | `/api/v1/projects/{id}/verify` | JWT (admin/auditor) | `POST /chain`, `POST /blockchain` |
| Reports | `/api/v1/projects/{id}/reports` | JWT | `POST /export` |
| Search | `/api/v1/search` | JWT | `GET /?q=...&project_id=...` |
| Admin | `/api/v1/admin` | JWT (admin) | `GET /users`, `POST /users`, `PUT /users/{id}`, `GET /audit-log` |
| Public | `/api/v1/public` | None | `GET /projects/{id}/timeline`, `POST /projects/{id}/verify/chain`, `GET /verify/{record_hash}` |
| WebSocket | `/ws/sensors/{project_id}` | None | Real-time sensor feed |
| Health | `/api/v1/health` | None | `GET /` |

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Python | 3.11+ | Backend language |
| Framework | FastAPI | 0.115+ | Async REST API framework |
| ASGI Server | uvicorn | 0.30+ | Production ASGI server |
| ORM | SQLAlchemy | 2.0+ | Async ORM with mapped columns |
| Migrations | Alembic | 1.13+ | Database schema versioning |
| Database Driver | asyncpg | 0.30+ | Async PostgreSQL driver |
| Auth (JWT) | python-jose | 3.3+ | JWT creation and verification |
| Auth (Password) | passlib + bcrypt | 1.7+ / 4.1+ | Password hashing |
| Blockchain | web3.py | 6.20+ | Polygon interaction |
| HTTP Client | httpx | 0.27+ | Async HTTP for OpenRouter |
| PDF | WeasyPrint | 62.3+ | HTML-to-PDF rendering |
| Validation | Pydantic | 2.9+ | Request/response schemas |
| Frontend | React | 19.2+ | UI framework |
| Build | Vite | 8.0+ | Frontend build tool |
| CSS | Tailwind CSS | 4.2+ | Utility-first CSS |
| State | Zustand | 5.0+ | Client state management |
| Charts | Recharts | 3.8+ | Data visualization |
| Forms | react-hook-form + Zod | 7.71+ / 4.3+ | Form validation |
| Routing | react-router-dom | 6.30+ | Client-side routing |
| Icons | lucide-react | 0.577+ | Icon library |
| Smart Contract | Solidity | 0.8.20 | Blockchain anchoring logic |

### Example: Create a Decision Record

```http
POST /api/v1/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/decisions
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "decision_type": "cost_revision",
  "title": "Steel procurement cost increase due to supply chain disruption",
  "description": "Global steel prices increased 15% following trade restrictions. Revised procurement budget to reflect current market rates.",
  "justification": "Market analysis from three independent suppliers confirms price floor at $1,150/tonne. Delaying procurement risks further increases.",
  "cost_impact": 2500000.00,
  "schedule_impact_days": 14,
  "risk_level": "high",
  "assumptions": {
    "steel_price_ceiling": "$1,200/tonne",
    "supplier_lead_time": "6 weeks"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "f7e8d9c0-b1a2-3456-7890-abcdef123456",
  "project_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sequence_number": 7,
  "decision_type": "cost_revision",
  "title": "Steel procurement cost increase due to supply chain disruption",
  "description": "Global steel prices increased 15% following trade restrictions...",
  "justification": "Market analysis from three independent suppliers...",
  "cost_impact": 2500000.00,
  "schedule_impact_days": 14,
  "risk_level": "high",
  "previous_hash": "a3f2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
  "record_hash": "e4f5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4",
  "tx_hash": null,
  "block_number": null,
  "chain_verified": false,
  "created_by": "12345678-abcd-ef01-2345-6789abcdef01",
  "created_at": "2026-03-16T10:30:00.123456+00:00"
}
```

### Example: Verify Hash Chain Integrity

```http
POST /api/v1/projects/a1b2c3d4-e5f6-7890-abcd-ef1234567890/verify/chain
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "valid": true,
  "total_records": 12,
  "message": "Chain intact \u2014 12 records verified"
}
```

**Response when tampering detected:**

```json
{
  "valid": false,
  "total_records": 12,
  "broken_at": 5,
  "message": "Hash mismatch at record #5: stored a3f2b1c0d9e8f7a6... vs computed e4f5d6c7b8a9f0e1..."
}
```

### Example: Public Hash Verification

```http
GET /api/v1/public/verify/a3f2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3
```

**Response (200 OK):**

```json
{
  "record_hash": "a3f2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
  "project_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sequence_number": 3,
  "title": "Contractor substitution for foundation work",
  "decision_type": "contractor_change",
  "created_at": "2026-02-15T08:45:12.654321+00:00",
  "previous_hash": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "tx_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "block_number": 58293741,
  "chain_verified": true,
  "blockchain_verification": {
    "verified": true,
    "contract": "0x1234567890AbCdEf1234567890aBcDeF12345678"
  }
}
```

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 20+ | Frontend build |
| PostgreSQL | 15+ (or Neon) | Database |
| Git | 2.x | Version control |

Optional:
- Docker (for containerized deployment)
- Polygon Amoy wallet with test MATIC (for blockchain anchoring)
- OpenRouter API key (for AI analysis; rule-based fallback works without it)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/infratrace.git
cd infratrace
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `backend/.env`:

```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/infratrace
JWT_SECRET=your-secure-random-string-minimum-32-characters

# Optional - Blockchain anchoring
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_PRIVATE_KEY=your-polygon-wallet-private-key
CONTRACT_ADDRESS=your-deployed-contract-address
POLYGON_CHAIN_ID=80002

# Optional - AI analysis (omit for rule-based fallback)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# App settings
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development

# Seed data passwords
SEED_ADMIN_PASSWORD=admin123
SEED_DEMO_PASSWORD=demo123
```

<details>
<summary>Environment variables reference</summary>

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DATABASE_URL` | Yes | -- | PostgreSQL async connection string (asyncpg) |
| `DATABASE_URL_SYNC` | No | `""` | Sync connection string for Alembic migrations |
| `JWT_SECRET` | Yes | -- | HMAC signing key for JWT tokens |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token TTL |
| `POLYGON_RPC_URL` | No | `https://rpc-amoy.polygon.technology` | Polygon Amoy RPC endpoint |
| `POLYGON_PRIVATE_KEY` | No | `""` | Wallet private key for anchoring |
| `CONTRACT_ADDRESS` | No | `""` | Deployed InfraTraceAnchor address |
| `POLYGON_CHAIN_ID` | No | `80002` | Polygon Amoy chain ID |
| `OPENROUTER_API_KEY` | No | `""` | OpenRouter API key for AI analysis |
| `OPENWEATHERMAP_API_KEY` | No | `""` | OpenWeatherMap API key for weather sensors |
| `METALPRICEAPI_KEY` | No | `""` | MetalpriceAPI key for commodity price sensors |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `ENVIRONMENT` | No | `development` | `development` or `production` |
| `SEED_ADMIN_PASSWORD` | No | `admin123` | Password for seeded admin user |
| `SEED_DEMO_PASSWORD` | No | `demo123` | Password for seeded demo users |

</details>

### 4. Run Database Migrations

```bash
alembic upgrade head
```

This runs all 6 migrations: initial schema → project_sensors → documents → enriched projects → project_settings → organizations.

### 5. Start the Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Bootstrap Your Organization (First Time)

For a fresh deployment with no data, use the bootstrap endpoint to create your first organization and admin account:

```bash
curl -X POST http://localhost:8000/api/v1/setup/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Department of Infrastructure",
    "org_slug": "doi",
    "org_country": "Australia",
    "admin_email": "admin@example.com",
    "admin_password": "securepassword123",
    "admin_full_name": "System Administrator"
  }'
```

This returns an access token — you're immediately logged in.

**Alternatively**, to load demo data with pre-built decision chains, sensor history, and AI analysis findings:

```bash
curl -X POST "http://localhost:8000/api/v1/seed?secret=your-jwt-secret-here"
```

This creates 4 demo users, 3 projects, 15 decisions with real SHA-256 hash chains, 30 days of sensor history, and 4 AI analysis findings.

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Frontend Pages

The frontend consists of 12 pages with dark/light mode glass morphism UI:

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password authentication |
| Dashboard | `/dashboard` | Project overview, metrics, activity feed, cost charts, sensor grid |
| Log Decision | `/projects/{id}/decisions/new` | Append-only decision form with type, cost, risk, justification |
| Timeline | `/projects/{id}/timeline` | Chronological decision chain with cost trajectory chart |
| Decision Detail | `/projects/{id}/decisions/{id}` | Full decision record with hash chain position |
| Verify Chain | `/projects/{id}/verify` | Hash chain and blockchain verification interface |
| AI Analysis | `/projects/{id}/analysis` | AI findings with severity, confidence, affected decisions |
| Sensor Dashboard | `/projects/{id}/sensors` | Real-time WebSocket sensor grid with anomaly indicators |
| Assumptions | `/projects/{id}/assumptions` | Assumptions register with sensor thresholds |
| Reports | `/projects/{id}/reports` | PDF report generation and export |
| Audit Log | `/admin/audit-log` | Platform-wide action log (admin/auditor) |
| User Management | `/admin/users` | Create, edit, deactivate users (admin only) |

### 7. Default Credentials (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| `admin@infratrace.io` | Value of `SEED_ADMIN_PASSWORD` | Admin |
| `pm@infratrace.io` | Value of `SEED_DEMO_PASSWORD` | Project Manager |
| `auditor@infratrace.io` | Value of `SEED_DEMO_PASSWORD` | Auditor |
| `stakeholder@infratrace.io` | Value of `SEED_DEMO_PASSWORD` | Stakeholder |

---

## Deployment

### Deployment Architecture

```mermaid
graph LR
    subgraph Internet
        USER["Users / Auditors / Public"]
    end

    subgraph Vercel
        FE["Frontend<br/>React 19 + Vite 8<br/>Static SPA"]
    end

    subgraph Railway
        BE["Backend<br/>FastAPI + uvicorn<br/>Docker container"]
    end

    subgraph Neon
        DB["PostgreSQL 15<br/>Serverless"]
    end

    subgraph Polygon
        CHAIN["Amoy Testnet<br/>Smart Contract"]
    end

    subgraph OpenRouter
        AI["LLM API<br/>4 model rotation"]
    end

    USER --> FE
    FE -->|HTTPS| BE
    USER -->|WSS| BE
    BE --> DB
    BE --> CHAIN
    BE --> AI
```

### Railway (Backend)

1. Connect your GitHub repository to Railway
2. Set the root directory to `backend/`
3. Railway will detect the Dockerfile automatically
4. Add all environment variables from the table above
5. The Dockerfile runs `alembic upgrade head` before starting uvicorn

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b \
    libfontconfig1 libgdk-pixbuf-2.0-0 libcairo2 \
    libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-railway-backend.up.railway.app`

### Neon (PostgreSQL)

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set `DATABASE_URL` in Railway with the `asyncpg` driver prefix:
   ```
   postgresql+asyncpg://user:password@ep-xyz.us-east-2.aws.neon.tech/infratrace?sslmode=require
   ```

### Docker (Local)

```bash
# Build the backend image
cd backend
docker build -t infratrace-backend .

# Run with environment variables
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+asyncpg://..." \
  -e JWT_SECRET="your-secret" \
  -e ENVIRONMENT="production" \
  infratrace-backend
```

---

## Security

### Authentication

- **JWT Access Tokens**: 15-minute expiry, HS256-signed, issued on login
- **Refresh Tokens**: 7-day expiry, stored in `httponly`, `secure`, `samesite=none` cookies
- **Token Refresh**: Automatic rotation -- each refresh issues a new refresh token
- **Password Hashing**: bcrypt via passlib with automatic salt generation

### Authorization

- **Platform RBAC**: Four roles (`admin`, `project_manager`, `auditor`, `stakeholder`) enforced at the route level via FastAPI dependencies
- **Project-level RBAC**: Separate project membership roles (`pm`, `auditor`, `stakeholder`) checked per-request
- **Endpoint protection**: Every non-public endpoint requires a valid JWT; role requirements are declared per-route

### Data Integrity

- **SHA-256 Hash Chain**: Each decision record's hash incorporates the previous record's hash, creating an append-only chain. Any modification to a historical record breaks all subsequent hashes.
- **PostgreSQL Advisory Locks**: `pg_advisory_xact_lock` prevents race conditions during concurrent decision creation for the same project.
- **Blockchain Anchoring**: Decision hashes optionally anchored on Polygon Amoy via a smart contract that enforces sequential writes and immutable storage.

### API Security

- **CORS**: Origin restricted to the configured `FRONTEND_URL` in production
- **Input Validation**: Pydantic v2 schemas validate all request bodies and query parameters
- **SQL Injection Prevention**: SQLAlchemy parameterized queries throughout
- **Audit Logging**: Every authenticated action is logged with user ID, action type, resource, metadata, and IP address
- **Docs Disabled in Production**: Swagger UI and ReDoc are only available when `ENVIRONMENT=development`

### Threat Model

<details>
<summary>Addressed threats and mitigations</summary>

| Threat | Mitigation |
|--------|-----------|
| Decision record tampering | SHA-256 hash chain + blockchain anchoring; any modification breaks chain |
| Unauthorized access | JWT auth with 15min expiry + per-endpoint role guards |
| Brute-force login | bcrypt (slow hash) + audit logging of failed attempts with IP |
| Token theft | Short-lived access tokens; refresh tokens in httponly cookies |
| SQL injection | SQLAlchemy parameterized queries; Pydantic input validation |
| Race condition (duplicate decisions) | PostgreSQL advisory locks per project |
| Replay attacks | Unique record hashes; sequence numbers enforced at DB and contract level |
| Admin impersonation | Role embedded in JWT claims; verified per-request against DB |
| Data exfiltration | CORS restricted to configured frontend URL; no wildcard origins in production |
| Audit log tampering | Audit log is append-only in practice; only the system writes to it |

</details>

---

## Roadmap

```mermaid
gantt
    title InfraTrace Development Roadmap
    dateFormat YYYY-MM
    axisFormat %Y-%m

    section Phase 1 - MVP
    Hash chain engine           :done, p1a, 2025-09, 2025-10
    4-role RBAC + JWT auth      :done, p1b, 2025-10, 2025-11
    Decision CRUD + timeline    :done, p1c, 2025-10, 2025-11
    Polygon Amoy anchoring      :done, p1d, 2025-11, 2025-12
    IoT simulator + WebSocket   :done, p1e, 2025-12, 2026-01
    AI analysis (OpenRouter)    :done, p1f, 2026-01, 2026-02
    PDF report export           :done, p1g, 2026-02, 2026-02
    Frontend (12 pages)         :done, p1h, 2025-11, 2026-03
    Railway + Vercel deploy     :done, p1i, 2026-02, 2026-03

    section Phase 2 - Public Portal
    Public verification portal  :p2a, 2026-04, 2026-05
    Compliance report templates :p2b, 2026-05, 2026-06
    Email notifications         :p2c, 2026-05, 2026-06
    Batch blockchain anchoring  :p2d, 2026-06, 2026-07
    Audit trail export (CSV)    :p2e, 2026-06, 2026-07

    section Phase 3 - Mobile & i18n
    Progressive Web App         :p3a, 2026-07, 2026-09
    Multi-language support      :p3b, 2026-08, 2026-10
    Offline-first decisions     :p3c, 2026-09, 2026-11
    Push notifications          :p3d, 2026-09, 2026-10

    section Phase 4 - Marketplace
    Template marketplace        :p4a, 2026-11, 2027-01
    Third-party IoT connectors  :p4b, 2026-11, 2027-02
    Multi-chain support         :p4c, 2027-01, 2027-03
    Enterprise SSO (SAML/OIDC)  :p4d, 2027-01, 2027-03
```

### Phase 1 -- MVP (Complete)

All core features are built and deployed:
- SHA-256 hash chain with append-only decision logging
- Polygon Amoy blockchain anchoring with smart contract verification
- 4-role RBAC with JWT authentication (15min access + 7day refresh)
- OpenRouter AI analysis with 4-model rotation and rule-based fallback
- Real-time IoT sensor dashboard with WebSocket feed and anomaly detection
- PDF audit report export with blockchain proofs
- 12-page React frontend with dark/light glass morphism UI
- 41+ REST API endpoints across 10 router groups

### Phase 2 -- Public Portal & Compliance

Standalone public verification portal, compliance report templates for government procurement standards, batch anchoring to reduce per-decision gas costs, and email notification system for decision events.

### Phase 3 -- Mobile & Internationalization

Progressive Web App with offline-first decision drafting, multi-language support for international deployment, and push notifications for anomaly alerts.

### Phase 4 -- Marketplace

Template marketplace for decision workflows, third-party IoT sensor connectors (real hardware), multi-chain support beyond Polygon, and enterprise SSO integration.

---

## Use Cases

### 1. Government Infrastructure Procurement

Government agencies managing road, bridge, or rail projects where every budget revision and scope change must be traceable and auditable by oversight bodies.

```mermaid
sequenceDiagram
    participant GOV as Government Agency
    participant PM as Project Manager
    participant IT as InfraTrace
    participant BC as Blockchain
    participant AUD as External Auditor

    GOV->>PM: Authorize highway project ($50M)
    PM->>IT: Create project + log initial decisions
    IT->>IT: Hash chain: Genesis -> Decision #1

    loop Project Lifecycle
        PM->>IT: Log scope/cost/schedule changes
        IT->>IT: Compute hash, link to chain
        IT->>BC: Anchor hash on Polygon
    end

    AUD->>IT: GET /public/projects/{id}/timeline
    IT-->>AUD: Full decision history + hashes
    AUD->>IT: POST /public/projects/{id}/verify/chain
    IT-->>AUD: Chain integrity result
    AUD->>BC: Verify hashes on-chain
    BC-->>AUD: Confirmed matches
```

A highway project receives a $50M allocation. Over 18 months, the project manager logs 30+ decisions including contractor changes, material cost revisions, and schedule adjustments. Each decision is hash-chained. An external auditor verifies the entire chain without needing platform credentials, using the public API. The blockchain anchoring provides an independent proof layer that the agency's database has not been altered.

### 2. Development Finance Institution (DFI) Monitoring

International development banks funding water treatment, power grid, or healthcare facility projects in developing economies, where accountability to donors and beneficiaries is critical.

```mermaid
sequenceDiagram
    participant DFI as Development Bank
    participant LOCAL as Local Partner
    participant IT as InfraTrace
    participant AI as AI Engine
    participant IOT as IoT Sensors

    DFI->>IT: Create project, assign roles
    LOCAL->>IT: Log decisions as project manager
    IOT->>IT: Stream sensor data (material prices, weather)

    IT->>AI: Trigger analysis
    AI->>IT: "Scope creep detected: 4 scope changes in 60 days"
    AI->>IT: "Sensor contradiction: steel price exceeds assumption by 22%"

    DFI->>IT: Review AI findings as auditor
    DFI->>IT: Export PDF report with blockchain proofs
    IT-->>DFI: Audit report PDF
```

A DFI funds a water treatment plant in a partner country. The local implementing partner logs decisions. IoT sensors track material prices and environmental conditions. The AI engine detects that steel prices have exceeded the project's budgeting assumption by 22%, and that four scope changes in two months indicate potential scope creep. The DFI's monitoring team reviews findings and exports a PDF report with blockchain proofs to present to the board.

### 3. Anti-Corruption Compliance

Organizations implementing transparency requirements under frameworks such as the Construction Sector Transparency Initiative (CoST) or the Open Contracting Data Standard (OCDS).

```mermaid
sequenceDiagram
    participant ORG as Organization
    participant IT as InfraTrace
    participant PUB as Public Portal
    participant CIVIL as Civil Society

    ORG->>IT: Log all project decisions
    IT->>IT: Hash chain every record
    ORG->>IT: Share public project ID

    CIVIL->>PUB: Access /public/projects/{id}/timeline
    PUB-->>CIVIL: Full decision timeline (no auth)
    CIVIL->>PUB: GET /public/verify/{hash}
    PUB-->>CIVIL: Hash + blockchain proof

    Note over CIVIL: Independent verification<br/>No trust in the organization required
```

An organization publishes its project ID. Any civil society watchdog, journalist, or citizen can view the full decision timeline through the public API, verify that the hash chain is intact, and check individual decision hashes against the Polygon blockchain. Trust is cryptographic, not institutional.

### 4. Multi-Stakeholder Public Accountability

Large infrastructure programs with multiple stakeholders (contractors, regulators, community representatives) who need varying levels of access to project decisions.

```mermaid
sequenceDiagram
    participant REG as Regulator (Auditor)
    participant PM as Project Manager
    participant CON as Contractor (Stakeholder)
    participant COM as Community (Public)
    participant IT as InfraTrace

    PM->>IT: Log decisions, manage assumptions
    PM->>IT: Add regulator as auditor
    PM->>IT: Add contractor as stakeholder

    REG->>IT: Verify chain integrity
    REG->>IT: Review AI analysis findings
    REG->>IT: Export audit PDF

    CON->>IT: View assigned project timeline
    CON->>IT: Export project report

    COM->>IT: Public timeline + hash verification
```

A transit authority building a rail extension assigns the regulator as an auditor (can verify chains and view AI analysis), the general contractor as a stakeholder (read-only access to their project), and publishes the project ID for community oversight. Each role sees exactly what they are authorized to see, while the public API ensures baseline transparency.

### 5. Regulatory and Compliance Reporting

Organizations that must produce auditable records for regulatory filings, grant reporting, or compliance with construction transparency standards.

```mermaid
sequenceDiagram
    participant PM as Project Manager
    participant IT as InfraTrace
    participant AI as AI Engine
    participant PDF as PDF Generator
    participant REG as Regulatory Body

    PM->>IT: Complete project lifecycle decisions
    PM->>IT: Trigger AI analysis
    AI-->>IT: Risk patterns identified
    PM->>IT: POST /projects/{id}/reports/export
    IT->>PDF: Generate report
    PDF->>PDF: Include decisions, hashes, blockchain proofs, AI findings, sensor data
    PDF-->>IT: PDF bytes
    IT-->>PM: Download audit report PDF
    PM->>REG: Submit report with blockchain proofs
    REG->>IT: Independently verify via public API
```

The PDF report generator compiles the full decision chain, hash verification results, blockchain proof references, AI analysis findings, and sensor data into a structured document. Options allow including or excluding AI findings, sensor data, and blockchain proofs depending on the recipient's requirements.

---

## Comparison Matrix

| Capability | InfraTrace | Procore | OpenGov | CoST | Generic Blockchain Audit |
|---|:-:|:-:|:-:|:-:|:-:|
| Decision hash chain | Yes | No | No | No | Partial |
| Blockchain anchoring | Polygon Amoy | No | No | No | Yes |
| AI risk analysis | OpenRouter (4 models) | No | Limited | No | No |
| IoT sensor integration | Real-time WebSocket | No | No | No | No |
| Multi-role RBAC | 4 platform + 3 project | Yes | Yes | Limited | No |
| Public verification API | Yes (no auth) | No | Partial | Yes | Varies |
| PDF audit reports | Yes (with blockchain proofs) | Yes | Yes | Manual | No |
| Append-only decision log | Enforced | No | No | No | Yes |
| Assumption tracking | With sensor thresholds | No | No | No | No |
| Anomaly detection | Threshold + AI | No | No | No | No |
| Open source | MIT | No | No | Yes | Varies |
| Cost | Free | $$$$ | $$$$ | Free | Varies |
| Self-hostable | Yes | No | No | N/A | Varies |

---

## Project Structure

```
infratrace/
├── backend/
│   ├── app/
│   │   ├── api/                    # Route handlers (15 modules)
│   │   │   ├── auth.py             # Login, refresh, logout, me, forgot/reset password
│   │   │   ├── onboarding.py       # Bootstrap, register, invitations, organizations
│   │   │   ├── projects.py         # Project CRUD + member management
│   │   │   ├── decisions.py        # Decision creation, listing, timeline
│   │   │   ├── assumptions.py      # Assumptions register CRUD
│   │   │   ├── sensors.py          # Sensor data queries + anomalies
│   │   │   ├── project_sensors.py  # Per-project sensor configuration CRUD
│   │   │   ├── project_settings.py # Configurable decision types, risk levels
│   │   │   ├── documents.py        # Document upload, download, delete
│   │   │   ├── search.py           # Full-text search across decisions
│   │   │   ├── analysis.py         # AI analysis trigger + results
│   │   │   ├── verification.py     # Chain + blockchain verification
│   │   │   ├── reports.py          # PDF export
│   │   │   ├── admin.py            # User management + audit log
│   │   │   └── public.py           # Unauthenticated transparency endpoints
│   │   ├── core/
│   │   │   ├── security.py         # JWT, password hashing
│   │   │   ├── dependencies.py     # FastAPI dependency injection
│   │   │   ├── permissions.py      # Project-level access control
│   │   │   └── rate_limit.py       # In-memory rate limiting middleware
│   │   ├── models/                 # SQLAlchemy 2.0 mapped models (12 modules)
│   │   │   ├── user.py             # User model (org FK, email_verified, must_change_password)
│   │   │   ├── organization.py     # Organization model (multi-tenant)
│   │   │   ├── invitation.py       # UserInvitation model
│   │   │   ├── project.py          # Project + ProjectMember (GIS, currency, category)
│   │   │   ├── project_sensor.py   # Per-project sensor configuration
│   │   │   ├── project_setting.py  # Configurable project settings (JSONB)
│   │   │   ├── decision.py         # DecisionRecord model
│   │   │   ├── assumption.py       # Assumption model (sensor_config FK)
│   │   │   ├── sensor.py           # SensorReading model (sensor_config FK)
│   │   │   ├── document.py         # Document model (SHA-256 checksum)
│   │   │   ├── analysis.py         # AIAnalysisResult model
│   │   │   ├── blockchain.py       # BlockchainAnchor model
│   │   │   └── audit.py            # AuditLog model
│   │   ├── schemas/                # Pydantic v2 request/response schemas
│   │   ├── services/               # Business logic
│   │   │   ├── hash_chain.py       # SHA-256 computation + chain verification
│   │   │   ├── blockchain.py       # Polygon Amoy anchoring + verification
│   │   │   ├── ai_analyser.py      # OpenRouter + rule-based fallback
│   │   │   ├── data_feeds.py       # Real API feeds (OpenWeatherMap, MetalpriceAPI, ExchangeRate)
│   │   │   ├── iot_simulator.py    # Simulator fallback for sensor data
│   │   │   ├── audit_service.py    # Audit log writer
│   │   │   └── report_generator.py # WeasyPrint PDF generation
│   │   ├── websocket/
│   │   │   └── sensor_feed.py      # WebSocket server + data feed orchestration
│   │   ├── seed/
│   │   │   └── demo_data.py        # Demo data seeder (with sensor configs)
│   │   ├── config.py               # Pydantic settings (env vars)
│   │   ├── database.py             # Async engine + session factory
│   │   └── main.py                 # FastAPI app + 15 router registrations
│   ├── contracts/
│   │   └── InfraTraceAnchor.sol    # Solidity smart contract (Polygon Amoy)
│   ├── alembic/
│   │   └── versions/               # 6 migration scripts (001-006)
│   ├── Dockerfile                  # Production container (auto-runs migrations)
│   ├── requirements.txt            # Python dependencies
│   └── railway.toml                # Railway deployment config
├── frontend/
│   ├── src/
│   │   ├── pages/                  # 19 page components
│   │   │   ├── LoginPage.tsx       # Auth with forgot/register links
│   │   │   ├── RegisterPage.tsx    # Self-service registration
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── AcceptInvitePage.tsx # Invitation acceptance
│   │   │   ├── DashboardPage.tsx   # Main dashboard with WelcomeBanner
│   │   │   ├── TimelinePage.tsx    # Decision timeline
│   │   │   ├── DecisionDetailPage.tsx
│   │   │   ├── LogDecisionPage.tsx
│   │   │   ├── SensorDashboardPage.tsx  # Live sensor feed
│   │   │   ├── SensorConfigPage.tsx     # Sensor CRUD + API provider config
│   │   │   ├── ProjectSetupPage.tsx     # 4-step setup wizard
│   │   │   ├── AIAnalysisPage.tsx
│   │   │   ├── VerifyChainPage.tsx
│   │   │   ├── AssumptionsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── AdminUsersPage.tsx
│   │   │   ├── AuditLogPage.tsx
│   │   │   └── PublicTimelinePage.tsx   # Unauthenticated transparency view
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI primitives (12 components)
│   │   │   ├── dashboard/          # WelcomeBanner, MetricsRow, CostTrajectory, etc.
│   │   │   └── layout/             # AppLayout, Sidebar (project switcher), TopBar
│   │   ├── api/                    # API client modules (11 modules)
│   │   ├── store/                  # Zustand state stores (5 stores)
│   │   ├── hooks/                  # Custom hooks (useTheme, useSensorSocket, useIsMobile)
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── utils/                  # Format, risk, constants
│   │   ├── config/                 # Theme + environment config
│   │   ├── App.tsx                 # Router (19 routes, code-split)
│   │   └── main.tsx                # Entry point
│   ├── Dockerfile                  # Multi-stage build (node + nginx)
│   ├── nginx.conf                  # SPA routing + gzip + caching
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Contributing

1. **Fork** the repository
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following existing code patterns:
   - Backend: Python type hints, async/await, Pydantic schemas, SQLAlchemy 2.0 mapped columns
   - Frontend: TypeScript strict mode, Zustand stores, Tailwind CSS utility classes
4. **Run linting**:
   ```bash
   # Backend
   cd backend && pip install ruff && ruff check .

   # Frontend
   cd frontend && npm run lint
   ```
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add new analysis type for environmental compliance"
   ```
6. **Push** and open a **Pull Request** against `main`
7. Describe what your PR does, why, and how to test it

### Commit Message Convention

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that neither fixes a bug nor adds a feature
- `docs:` documentation only
- `test:` adding or updating tests
- `chore:` build process, dependencies, CI

---

## Testing

### Backend

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_hash_chain.py
```

### Frontend

```bash
cd frontend

# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Build (catches compilation errors)
npm run build
```

### Manual Verification

After seeding demo data, you can verify the system end-to-end:

1. **Login** as `pm@infratrace.io` and create a decision
2. **Verify** the hash chain via the Verify Chain page (or `POST /api/v1/projects/{id}/verify/chain`)
3. **Check** that the new decision's `previous_hash` matches the prior decision's `record_hash`
4. **Trigger** AI analysis and review findings
5. **Open** the Sensor Dashboard to confirm WebSocket data flow
6. **Export** a PDF report
7. **Verify** a hash publicly via `GET /api/v1/public/verify/{record_hash}`

---

## License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025-2026 InfraTrace Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Team & Contact

Built for the Harvard Extension School course on Innovation in Blockchain, AI and IoT Technology.

- GitHub: [github.com/your-org/infratrace](https://github.com/your-org/infratrace)

---

<p align="center">
  <sub>InfraTrace v2.0.0 &middot; Infrastructure decisions deserve cryptographic accountability.</sub>
</p>
