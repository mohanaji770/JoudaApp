import { supabase } from '../supabaseClient';
import { Product } from '../supabaseService';

/**
 * Service handling database operations for the Admin interface
 * Focuses on writes/updates that require admin privileges.
 */
export const AdminProductService = {
  /**
   * Updates the visual tags and description of a product
   * @param barcode The unique barcode of the product
   * @param tags Array of tag IDs (e.g., 'discount', 'best_seller')
   * @param description Custom description of the product
   */
  async updateProductDetails(barcode: string, tags: string[], description: string | null): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ tags, description })
      .eq('barcode', barcode)
      .select();

    if (error) {
      throw error;
    }
  },

  /**
   * Updates multiple properties of a product from the unified manager
   */
  async updateProductProperties(
    barcode: string,
    updates: {
      tags?: string[];
      description?: string | null;
      app_category?: string | null;
      category?: string;
      is_hidden_in_app?: boolean;
      force_out_of_stock?: boolean;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('barcode', barcode);

    if (error) {
      throw error;
    }
  },

  /**
   * Updates the cashier category directly in the Inventory project via Edge Function
   */
  async updateCashierCategory(barcode: string, category: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('update-inventory', {
      body: { barcode, category }
    });
    
    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to update inventory category');
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
    pkgItems: { barcode: string; quantity: number }[],
    validUntil?: string | null,
    isActive: boolean = true
  ): Promise<void> {
    const { error: prodError } = await supabase.from('products').upsert({
      barcode: pkgBarcodeClean,
      name: pkgName,
      price: pkgPrice,
      category: 'عروض وبكجات',
      description: pkgDesc,
      image_url: pkgImage,
      is_active: isActive,
      valid_until: validUntil || null
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
  },

  /**
   * Fetches the components of a specific package
   */
  async getPackageItems(packageBarcode: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('package_items')
      .select('*')
      .eq('package_barcode', packageBarcode);
      
    if (error) throw error;
    
    return data || [];
  },

  /**
   * Toggles the active status of a package
   */
  async togglePackageStatus(barcode: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('barcode', barcode);
      
    if (error) throw error;
  },

  /**
   * Deletes a package completely (Cascade will handle package_items if DB is configured properly, otherwise we delete them manually here)
   */
  async deletePackage(barcode: string): Promise<void> {
    // Delete items first to avoid foreign key issues just in case cascade is not on
    await supabase.from('package_items').delete().eq('package_barcode', barcode);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('barcode', barcode);
      
    if (error) throw error;
  },

  /**
   * Adds a new app category
   */
  async addAppCategory(name: string, sort_order: number): Promise<void> {
    const { error } = await supabase
      .from('app_categories')
      .insert({ name, sort_order });
    if (error) throw error;
  },

  /**
   * Deletes an app category
   */
  async deleteAppCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('app_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
