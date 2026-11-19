import {NextResponse} from "next/server"; import {generateBatch} from "@/lib/engine";
export async function GET(){ return NextResponse.json({data:generateBatch(30),generatedAt:new Date().toISOString(),pipeline:"Kafka → Flink → MinIO/S3 → DuckDB/Snowflake → dbt"}); }
