import { supabase } from '../supabaseClient';

export interface AppSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  ai_api_key: string | null;
}

export const AdminSettingsService = {
  /**
   * Fetches the single row from app_settings
   */
  async getSettings(): Promise<AppSettings | null> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }
    return data;
  },

  /**
   * Updates the settings. Assuming ID 1 is the universal settings row.
   */
  async updateSettings(payload: Partial<AppSettings>): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: 1, ...payload })
      .select();

    if (error) {
      throw error;
    }
  }
};
