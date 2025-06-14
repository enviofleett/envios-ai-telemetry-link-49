
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

  -- Aggregate sales by product category.
  -- This joins order items with products to get category information.
  SELECT jsonb_agg(cats)
  INTO sales_by_category
  FROM (
    SELECT
      p.category,
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.marketplace_products p ON oi.product_id::uuid = p.id
    WHERE o.status <> 'cancelled' AND p.category IS NOT NULL
    GROUP BY p.category
    ORDER BY total_value DESC
  ) AS cats;

  -- Aggregate sales by merchant name.
  -- This joins through order items to find the merchant for each sale.
  SELECT jsonb_agg(merchs)
  INTO sales_by_merchant
  FROM (
    SELECT
      m.name AS merchant_name,
      SUM(oi.price * oi.quantity) AS total_value
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.marketplace_merchants m ON oi.merchant_id::uuid = m.id
    WHERE o.status <> 'cancelled' AND m.name IS NOT NULL
    GROUP BY m.name
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
