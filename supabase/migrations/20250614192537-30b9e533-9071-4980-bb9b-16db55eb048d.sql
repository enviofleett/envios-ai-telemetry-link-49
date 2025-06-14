
CREATE OR REPLACE FUNCTION public.get_market_analytics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_data jsonb;
  total_sales numeric;
  total_orders bigint;
  avg_order_value numeric;
  sales_by_category jsonb;
  sales_by_merchant jsonb;
BEGIN
  -- Aggregate basic stats from the orders table.
  -- For now, we consider all non-cancelled orders as successful sales.
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(COUNT(id), 0),
    COALESCE(AVG(total_amount), 0)
  INTO
    total_sales,
    total_orders,
    avg_order_value
  FROM public.orders
  WHERE status <> 'cancelled';

  -- Aggregate sales by product_id, aliased as 'category' to fit the frontend type.
  -- This avoids joining with the non-existent marketplace_products table.
  SELECT jsonb_agg(cats)
  INTO sales_by_category
  FROM (
    SELECT
      oi.product_id AS category, -- Using product_id as category
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.status <> 'cancelled' AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
    ORDER BY total_value DESC
  ) AS cats;

  -- Aggregate sales by merchant_id, aliased as 'merchant_name' to fit the frontend type.
  -- This avoids joining with the non-existent marketplace_merchants table.
  SELECT jsonb_agg(merchs)
  INTO sales_by_merchant
  FROM (
    SELECT
      oi.merchant_id AS merchant_name, -- Using merchant_id as merchant_name
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE o.status <> 'cancelled' AND oi.merchant_id IS NOT NULL
    GROUP BY oi.merchant_id
    ORDER BY total_value DESC
  ) AS merchs;

  -- Combine all data into a single JSONB object to be returned.
  analytics_data := jsonb_build_object(
    'total_sales', total_sales,
    'total_orders', total_orders,
    'average_order_value', avg_order_value,
    'sales_by_category', COALESCE(sales_by_category, '[]'::jsonb),
    'sales_by_merchant', COALESCE(sales_by_merchant, '[]'::jsonb)
  );

  RETURN analytics_data;
END;
$$;
