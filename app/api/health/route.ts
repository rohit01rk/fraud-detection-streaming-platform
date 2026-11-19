import {NextResponse} from "next/server";
export async function GET(){ return NextResponse.json({status:"ok",service:"FraudStream",version:"1.0.0",layers:{ingestion:"Kafka (simulated producer)",processing:"Flink-style windowed rules",lake:"MinIO / S3 Parquet",warehouse:"DuckDB / Snowflake",transform:"dbt star schema",serving:"FastAPI + Next.js dashboard"},time:new Date().toISOString()}); }
