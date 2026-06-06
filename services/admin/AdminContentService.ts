import { supabase } from '../supabaseClient';

export const AdminContentService = {
  // ==========================
  // RECIPES
  // ==========================
  async upsertRecipe(payload: any): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .upsert(payload)
      .select();
    if (error) throw error;
  },

  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
  },

  // ==========================
  // ARTICLES
  // ==========================
  async upsertArticle(payload: any): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .upsert(payload)
      .select();
    if (error) throw error;
  },

  async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
  },

  // ==========================
  // BANNERS
  // ==========================
  async upsertBanner(payload: any): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .upsert(payload)
      .select();
    if (error) throw error;
  },

  async deleteBanner(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
  }
};
