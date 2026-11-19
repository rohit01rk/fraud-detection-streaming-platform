# Viva Notes
- Why streaming not batch? Fraud must be stopped before settlement; batch is hours late (Proposal §1).
- Exactly-once: Flink checkpointing + transactional Kafka sink, idempotent keys on transaction_id.
- Late data: watermarks (event_time-30s) + allowed lateness 2 min; side output for later arrivals.
- Scaling: Kafka partitions by user_id preserve ordering per user for velocity windows.
