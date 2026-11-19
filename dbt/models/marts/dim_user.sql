SELECT ROW_NUMBER() OVER (ORDER BY user_id) AS user_key, user_id, user_name, home_region FROM (SELECT DISTINCT user_id, user_name, region AS home_region FROM {{ ref('stg_transactions') }})
