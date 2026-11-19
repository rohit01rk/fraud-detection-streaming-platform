# Flink Job (design)
Keyed by user_id. Tumbling 10-min windows for spend velocity, sliding 1-hr for geo-velocity.
Watermark: event_time - 30s, allowed lateness 2 min. State: ValueState<Long> spend10m, ListState<Txn> recent.
Sinks: Redis (alerts, risk >=45), MinIO/S3 Parquet (all, partitioned date/region), Kafka transactions.flagged.
Exactly-once: checkpointing 10s + transactional Kafka sink.
