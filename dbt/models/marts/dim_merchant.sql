SELECT ROW_NUMBER() OVER (ORDER BY merchant_name) AS merchant_key, merchant_name, category FROM (SELECT DISTINCT merchant AS merchant_name, category FROM {{ ref('stg_transactions') }})
