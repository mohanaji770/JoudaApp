-- Add tags to products for UI badges (discount, best_seller, gift)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create package_items table to link a package product (category='بكج') to base products
CREATE TABLE IF NOT EXISTS public.package_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_barcode TEXT NOT NULL REFERENCES public.products(barcode) ON DELETE CASCADE,
    product_barcode TEXT NOT NULL REFERENCES public.products(barcode) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(package_barcode, product_barcode)
);

-- RLS for package_items
ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users on package_items" ON public.package_items;
CREATE POLICY "Enable read access for all users on package_items" 
ON public.package_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for service_role on package_items" ON public.package_items;
CREATE POLICY "Enable write access for service_role on package_items" 
ON public.package_items FOR ALL USING (
  current_user = 'service_role' OR 
  (auth.jwt() ->> 'role') = 'service_role'
);
