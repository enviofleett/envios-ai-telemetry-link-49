
-- This migration updates existing demo products with richer data
-- to match the new columns in the marketplace_products table, and adds reviews.

DO $$
DECLARE
    electronics_merchant_id UUID;
    books_merchant_id UUID;
    apparel_merchant_id UUID;
BEGIN
    -- Get merchant IDs
    SELECT id INTO electronics_merchant_id FROM public.marketplace_merchants WHERE name = 'Super Electronics';
    SELECT id INTO books_merchant_id FROM public.marketplace_merchants WHERE name = 'Global Books';
    SELECT id INTO apparel_merchant_id FROM public.marketplace_merchants WHERE name = 'Fashion Forward';

    -- Update 'Laptop Pro'
    UPDATE public.marketplace_products
    SET
        short_description = 'A powerful laptop for professionals.',
        price = 1299.99,
        price_unit = 'per unit',
        popular = true,
        icon = 'activity',
        features = ARRAY['16-inch Retina Display', 'M3 Pro Chip', '512GB SSD', '18-hour battery life'],
        screenshots = ARRAY['/placeholder.svg?text=Laptop+View+1', '/placeholder.svg?text=Laptop+View+2'],
        compatibility = ARRAY['macOS'],
        "size" = '1.61 kg',
        "version" = '2024 Model',
        developer = 'Super Electronics'
    WHERE name = 'Laptop Pro' AND merchant_id = electronics_merchant_id;

    -- Update 'Wireless Mouse'
    UPDATE public.marketplace_products
    SET
        short_description = 'Ergonomic wireless mouse.',
        price = 49.99,
        price_unit = 'per unit',
        popular = true,
        icon = 'gauge',
        features = ARRAY['Silent Click', 'Ergonomic Design', '12-month battery life'],
        "size" = '110g',
        "version" = 'v2.1',
        developer = 'Super Electronics'
    WHERE name = 'Wireless Mouse' AND merchant_id = electronics_merchant_id;
    
    -- Update 'The Art of Programming'
    UPDATE public.marketplace_products
    SET
        short_description = 'A classic book on software development.',
        price = 39.99,
        price_unit = 'per book',
        popular = true,
        icon = 'shield',
        features = ARRAY['Hardcover', '1168 pages', '4th Edition'],
        compatibility = ARRAY['Human readable'],
        "size" = '2.1 kg',
        "version" = '4th Ed.',
        developer = 'Global Books Publishing'
    WHERE name = 'The Art of Programming' AND merchant_id = books_merchant_id;

    -- Update 'Summer T-Shirt'
    UPDATE public.marketplace_products
    SET
        short_description = 'A light and comfortable t-shirt for summer.',
        price = 25.00,
        price_unit = 'per shirt',
        popular = false,
        icon = 'wrench',
        features = ARRAY['100% Cotton', 'Available in all sizes', 'Machine Washable'],
        compatibility = ARRAY['S, M, L, XL, XXL'],
        "size" = '200g',
        "version" = 'Summer ''24',
        developer = 'Fashion Forward Apparel'
    WHERE name = 'Summer T-Shirt' AND merchant_id = apparel_merchant_id;

END $$;

-- Let's add a few reviews for demonstration purposes
DO $$
DECLARE
    laptop_pro_id UUID;
    art_of_prog_id UUID;
    test_user_id UUID;
BEGIN
    SELECT id INTO laptop_pro_id FROM public.marketplace_products WHERE name = 'Laptop Pro';
    SELECT id INTO art_of_prog_id FROM public.marketplace_products WHERE name = 'The Art of Programming';
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF laptop_pro_id IS NOT NULL THEN
        INSERT INTO public.marketplace_product_reviews (product_id, user_id, author_name, rating, comment) VALUES
        (laptop_pro_id, test_user_id, 'Alice', 5, 'Absolutely fantastic machine. Worth every penny!'),
        (laptop_pro_id, null, 'Bob', 4, 'Great performance, but the battery could be better.');
    END IF;

    IF art_of_prog_id IS NOT NULL THEN
        INSERT INTO public.marketplace_product_reviews (product_id, user_id, author_name, rating, comment) VALUES
        (art_of_prog_id, test_user_id, 'Charlie', 5, 'A must-read for any serious programmer. The foundational text.'),
        (art_of_prog_id, null, 'David', 5, 'Changed my perspective on coding. It is dense but rewarding.');
    END IF;
END $$;

-- This function will update product ratings when reviews change.
CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.marketplace_products p
    SET
        rating = (
            SELECT AVG(r.rating)
            FROM public.marketplace_product_reviews r
            WHERE r.product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        review_count = (
            SELECT COUNT(r.id)
            FROM public.marketplace_product_reviews r
            WHERE r.product_id = COALESCE(NEW.product_id, OLD.product_id)
        )
    WHERE p.id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger will execute the function upon any changes to reviews.
DROP TRIGGER IF EXISTS on_review_change_update_product_rating ON public.marketplace_product_reviews;
CREATE TRIGGER on_review_change_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON public.marketplace_product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_ratings();

-- Recalculate ratings for all products to ensure data consistency.
DO $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN SELECT id FROM public.marketplace_products LOOP
    UPDATE public.marketplace_products
    SET
      rating = COALESCE((
        SELECT AVG(r.rating)
        FROM public.marketplace_product_reviews r
        WHERE r.product_id = product_record.id
      ), 0),
      review_count = (
        SELECT COUNT(r.id)
        FROM public.marketplace_product_reviews r
        WHERE r.product_id = product_record.id
      )
    WHERE id = product_record.id;
  END LOOP;
END $$;
