# FraudStream — Real-Time Fraud Detection & Financial Anomaly Streaming Platform

**CSE499 Capstone · B.Tech 4th Year** — Production-grade distributed data engineering platform from the approved proposal.

Live demo runs on Vercel (producer + Flink-style windowed rule engine simulated in `lib/engine.ts` + `/api/transactions`). Full production stack runs locally via Docker.

## Architecture
Python Producer → Apache Kafka → Apache Flink (windowed aggregations, watermarks, keyed state) → MinIO/S3 Lake (Parquet, date+region partitions) → DuckDB/Snowflake Warehouse → dbt Star Schema → FastAPI / Redis Alerts → This Dashboard

## Fraud Rules
R1 High-Value >₹50k · R2 Velocity burst (10-min window) · R3 Geo-Velocity · R4 Micro-Probing · R5 Amount Anomaly >3× avg · R6 Odd-Hour High Value

## Run Locally
```bash
npm install && npm run dev   # dashboard at http://localhost:3000
docker compose up -d         # Kafka, Schema Registry, MinIO, Redis
```

## Repo Structure
- `app/` Next.js dashboard (Live, Alerts, Analytics, Data Quality, Architecture)
- `lib/engine.ts` Transaction generator + rule engine (mirrors Flink logic)
- `producer/` Python Kafka producer
- `flink/` Flink job design & windowing notes
- `dbt/` Staging + star-schema marts (fact_transactions, dim_user, dim_merchant)
- `infra/` Terraform (S3 lake)
- `docs/` Viva / defense notes

## Data Quality & Governance
Schema Registry (Avro/JSON evolution), Great Expectations/Soda checks, exactly-once Kafka sinks, watermarking + 2-min allowed lateness, GitHub Actions dbt lint/test in CI (`.github/workflows/ci.yml`).
