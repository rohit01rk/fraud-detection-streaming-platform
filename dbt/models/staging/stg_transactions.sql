SELECT transaction_id, user_id, merchant_id, CAST(amount AS DECIMAL(12,2)) AS amount, risk_score, status, event_time FROM {{ source('raw','transactions') }} WHERE transaction_id IS NOT NULL
