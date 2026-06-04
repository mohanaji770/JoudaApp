-- Migration: 005_admin_rpc_functions.sql
-- Description: SECURITY DEFINER database functions to allow admin writes (bypassing RLS) after PIN verification

-- ============================================
-- 1. Product Tags / Badges
-- ============================================
CREATE OR REPLACE FUNCTION admin_update_product_tags(
  p_pin TEXT,
  p_barcode TEXT,
  p_tags TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  UPDATE public.products
  SET tags = p_tags
  WHERE barcode = p_barcode;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_product_tags(TEXT, TEXT, TEXT[]) TO anon, authenticated;


-- ============================================
-- 2. Create/Update Packages
-- ============================================
CREATE OR REPLACE FUNCTION admin_create_package(
  p_pin TEXT,
  p_package_barcode TEXT,
  p_name TEXT,
  p_price NUMERIC,
  p_category TEXT,
  p_description TEXT,
  p_image_url TEXT,
  p_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  -- 1. Insert/Update package product
  INSERT INTO public.products (barcode, name, price, category, image_url, description, is_active, stock_status, tags)
  VALUES (p_package_barcode, p_name, p_price, p_category, p_image_url, p_description, true, 'available', '{}')
  ON CONFLICT (barcode) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;

  -- 2. Clear old mappings
  DELETE FROM public.package_items WHERE package_barcode = p_package_barcode;

  -- 3. Insert new mappings from JSONB array: [{"barcode": "...", "quantity": 1}]
  INSERT INTO public.package_items (package_barcode, product_barcode, quantity)
  SELECT p_package_barcode, (item->>'barcode')::TEXT, (item->>'quantity')::INTEGER
  FROM jsonb_array_elements(p_items) AS item;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_create_package(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;


-- ============================================
-- 3. Banners (Upsert & Delete)
-- ============================================
CREATE OR REPLACE FUNCTION admin_upsert_banner(
  p_pin TEXT,
  p_id UUID,
  p_title TEXT,
  p_image_url TEXT,
  p_link_url TEXT,
  p_is_active BOOLEAN,
  p_sort_order INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.banners (title, image_url, link_url, is_active, sort_order)
    VALUES (p_title, p_image_url, p_link_url, p_is_active, p_sort_order)
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.banners (id, title, image_url, link_url, is_active, sort_order)
    VALUES (p_id, p_title, p_image_url, p_link_url, p_is_active, p_sort_order)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      image_url = EXCLUDED.image_url,
      link_url = EXCLUDED.link_url,
      is_active = EXCLUDED.is_active,
      sort_order = EXCLUDED.sort_order
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_upsert_banner(TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION admin_delete_banner(
  p_pin TEXT,
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  DELETE FROM public.banners WHERE id = p_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_banner(TEXT, UUID) TO anon, authenticated;


-- ============================================
-- 4. Recipes (Upsert & Delete)
-- ============================================
CREATE OR REPLACE FUNCTION admin_upsert_recipe(
  p_pin TEXT,
  p_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_time TEXT,
  p_difficulty TEXT,
  p_calories TEXT,
  p_main_product TEXT,
  p_ingredients TEXT[],
  p_steps TEXT[],
  p_image_url TEXT,
  p_video_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.recipes (title, description, time, difficulty, calories, main_product, ingredients, steps, image_url, video_url)
    VALUES (p_title, p_description, p_time, p_difficulty, p_calories, p_main_product, p_ingredients, p_steps, p_image_url, p_video_url)
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.recipes (id, title, description, time, difficulty, calories, main_product, ingredients, steps, image_url, video_url)
    VALUES (p_id, p_title, p_description, p_time, p_difficulty, p_calories, p_main_product, p_ingredients, p_steps, p_image_url, p_video_url)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      time = EXCLUDED.time,
      difficulty = EXCLUDED.difficulty,
      calories = EXCLUDED.calories,
      main_product = EXCLUDED.main_product,
      ingredients = EXCLUDED.ingredients,
      steps = EXCLUDED.steps,
      image_url = EXCLUDED.image_url,
      video_url = EXCLUDED.video_url;
    v_id := p_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_upsert_recipe(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION admin_delete_recipe(
  p_pin TEXT,
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  DELETE FROM public.recipes WHERE id = p_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_recipe(TEXT, UUID) TO anon, authenticated;


-- ============================================
-- 5. Articles (Upsert & Delete)
-- ============================================
CREATE OR REPLACE FUNCTION admin_upsert_article(
  p_pin TEXT,
  p_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_image_url TEXT,
  p_author TEXT,
  p_published_date TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.articles (title, content, image_url, author, published_date)
    VALUES (p_title, p_content, p_image_url, p_author, p_published_date)
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.articles (id, title, content, image_url, author, published_date)
    VALUES (p_id, p_title, p_content, p_image_url, p_author, p_published_date)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      image_url = EXCLUDED.image_url,
      author = EXCLUDED.author,
      published_date = EXCLUDED.published_date;
    v_id := p_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_upsert_article(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION admin_delete_article(
  p_pin TEXT,
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid admin PIN';
  END IF;

  DELETE FROM public.articles WHERE id = p_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_article(TEXT, UUID) TO anon, authenticated;
