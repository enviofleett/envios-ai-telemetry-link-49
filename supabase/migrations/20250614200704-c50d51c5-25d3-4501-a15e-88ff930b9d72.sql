
-- This script will create some sample orders to populate the analytics dashboard.
DO $$
DECLARE
    -- User and product variables
    test_user_id UUID;
    product1_id UUID;
    product1_merchant_id UUID;
    product2_id UUID;
    product2_merchant_id UUID;
    product3_id UUID;
    product3_merchant_id UUID;
    product4_id UUID;
    product4_merchant_id UUID;
    
    -- Order variables
    order1_id UUID;
    order2_id UUID;
    order3_id UUID;
    order1_total numeric;
    order2_total numeric;
    order3_total numeric;
BEGIN
    -- Get a user to associate orders with from the authentication table.
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users, skipping order creation.';
        RETURN;
    END IF;

    -- Get products and their merchants
    SELECT id, merchant_id INTO product1_id, product1_merchant_id FROM public.marketplace_products WHERE name = 'Laptop Pro' LIMIT 1;
    SELECT id, merchant_id INTO product2_id, product2_merchant_id FROM public.marketplace_products WHERE name = 'The Art of Programming' LIMIT 1;
    SELECT id, merchant_id INTO product3_id, product3_merchant_id FROM public.marketplace_products WHERE name = 'Summer T-Shirt' LIMIT 1;
    SELECT id, merchant_id INTO product4_id, product4_merchant_id FROM public.marketplace_products WHERE name = 'Wireless Mouse' LIMIT 1;

    IF product1_id IS NULL OR product2_id IS NULL OR product3_id IS NULL OR product4_id IS NULL THEN
        RAISE NOTICE 'Demo products not found, skipping order creation.';
        RETURN;
    END IF;

    -- === Order 1: A user buys a Laptop Pro and a Wireless Mouse ===
    order1_total := 1299.99 + 49.99;
    INSERT INTO public.orders (user_id, total_amount, status)
    VALUES (test_user_id, order1_total, 'completed') RETURNING id INTO order1_id;

    INSERT INTO public.order_items (order_id, product_id, merchant_id, quantity, price) VALUES
    (order1_id, product1_id, product1_merchant_id, 1, 1299.99),
    (order1_id, product4_id, product4_merchant_id, 1, 49.99);

    -- === Order 2: A user buys two books ===
    order2_total := (29.99 * 2) + 25.00;
    INSERT INTO public.orders (user_id, total_amount, status)
    VALUES (test_user_id, order2_total, 'completed') RETURNING id INTO order2_id;

    INSERT INTO public.order_items (order_id, product_id, merchant_id, quantity, price)
    VALUES (order2_id, product2_id, product2_merchant_id, 2, 29.99);
    
    INSERT INTO public.order_items (order_id, product_id, merchant_id, quantity, price)
    SELECT order2_id, p.id, p.merchant_id, 1, 25.00
    FROM public.marketplace_products p WHERE p.name = 'History of the World';

    -- === Order 3: A user buys some fashion items ===
    order3_total := 19.99 + 35.50;
    INSERT INTO public.orders (user_id, total_amount, status)
    VALUES (test_user_id, order3_total, 'completed') RETURNING id INTO order3_id;

    INSERT INTO public.order_items (order_id, product_id, merchant_id, quantity, price)
    VALUES(order3_id, product3_id, product3_merchant_id, 1, 19.99);
    
    INSERT INTO public.order_items (order_id, product_id, merchant_id, quantity, price)
    SELECT order3_id, p.id, p.merchant_id, 1, 35.50
    FROM public.marketplace_products p WHERE p.name = 'Leather Wallet';

    -- === A cancelled order that should not show up in analytics ===
    INSERT INTO public.orders (user_id, total_amount, status)
    VALUES (test_user_id, 100.00, 'cancelled');

END $$;
