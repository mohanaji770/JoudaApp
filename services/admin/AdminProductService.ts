import { supabase } from '../supabaseClient';
import { Product } from '../supabaseService';

/**
 * Service handling database operations for the Admin interface
 * Focuses on writes/updates that require admin privileges.
 */
export const AdminProductService = {
  /**
   * Updates the visual tags/badges of a product
   * @param barcode The unique barcode of the product
   * @param tags Array of tag IDs (e.g., 'discount', 'best_seller')
   */
  async updateTags(barcode: string, tags: string[]): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ tags })
      .eq('barcode', barcode)
      .select();

    if (error) {
      throw error;
    }
  },

  /**
   * Creates or updates a Package product and its internal items
   */
  async upsertPackage(
    pkgBarcodeClean: string,
    pkgName: string,
    pkgPrice: number,
    pkgDesc: string,
    pkgImage: string,
    pkgItems: { barcode: string; quantity: number }[]
  ): Promise<void> {
    const { error: prodError } = await supabase.from('products').upsert({
      barcode: pkgBarcodeClean,
      name: pkgName,
      price: pkgPrice,
      category: 'عروض وبكجات',
      description: pkgDesc,
      image_url: pkgImage,
      is_active: true
    });

    if (prodError) throw prodError;

    // Delete old items if updating
    await supabase.from('package_items').delete().eq('package_barcode', pkgBarcodeClean);
    
    // Insert new items
    const jsonItems = pkgItems.map(i => ({ 
      package_barcode: pkgBarcodeClean,
      product_barcode: i.barcode, 
      quantity: i.quantity 
    }));
    
    const { error: itemsError } = await supabase.from('package_items').insert(jsonItems);
    if (itemsError) throw itemsError;
  }
};
