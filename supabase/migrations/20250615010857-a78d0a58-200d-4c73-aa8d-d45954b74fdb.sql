
CREATE OR REPLACE FUNCTION public.get_customer_analytics(p_limit integer DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_data jsonb;
BEGIN
  -- This function assumes that the 'public.orders' table has a 'user_id' column
  -- referencing 'public.envio_users(id)' and a 'total_amount' column.
  -- It also assumes a 'status' column to filter for completed orders.
  
  -- If these assumptions are incorrect, this function will need to be adjusted.

  WITH customer_stats AS (
    SELECT
      o.user_id,
      COALESCE(SUM(o.total_amount), 0) AS total_spent,
      COUNT(o.id) AS order_count
    FROM public.orders o
    WHERE o.status = 'completed' AND o.user_id IS NOT NULL
    GROUP BY o.user_id
  )
  SELECT jsonb_build_object(
    'top_spenders', (
      SELECT jsonb_agg(ts)
      FROM (
        SELECT
          eu.id,
          eu.name,
          eu.email,
          cs.total_spent
        FROM customer_stats cs
        JOIN public.envio_users eu ON cs.user_id = eu.id
        ORDER BY cs.total_spent DESC
        LIMIT p_limit
      ) AS ts
    ),
    'most_orders', (
      SELECT jsonb_agg(mo)
      FROM (
        SELECT
          eu.id,
          eu.name,
          eu.email,
          cs.order_count
        FROM customer_stats cs
        JOIN public.envio_users eu ON cs.user_id = eu.id
        ORDER BY cs.order_count DESC
        LIMIT p_limit
      ) AS mo
    ),
    'repeat_customers', (
      SELECT jsonb_agg(rc)
      FROM (
        SELECT
          eu.id,
          eu.name,
          eu.email,
          cs.order_count
        FROM customer_stats cs
        JOIN public.envio_users eu ON cs.user_id = eu.id
        WHERE cs.order_count > 1
        ORDER BY cs.order_count DESC
        LIMIT p_limit
      ) AS rc
    ),
    'highest_single_orders', (
      SELECT jsonb_agg(hso)
      FROM (
        SELECT
          eu.id,
          eu.name,
          eu.email,
          o.id as order_id,
          o.total_amount
        FROM public.orders o
        JOIN public.envio_users eu ON o.user_id = eu.id
        WHERE o.status = 'completed' AND o.user_id IS NOT NULL
        ORDER BY o.total_amount DESC
        LIMIT p_limit
      ) as hso
    )
  )
  INTO analytics_data;
  
  RETURN analytics_data;
END;
$$;
