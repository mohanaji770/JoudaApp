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
    const { data, error } = await supabase.rpc('admin_get_app_settings');

    if (error) {
      throw error;
    }
    return data as AppSettings;
  },

  /**
   * Updates the settings. Assuming ID 1 is the universal settings row.
   */
  async updateSettings(payload: Partial<AppSettings>): Promise<void> {
    const { error } = await supabase.rpc('admin_update_app_settings', {
      p_maintenance_mode: payload.maintenance_mode,
      p_maintenance_message: payload.maintenance_message || null,
      p_ai_api_key: payload.ai_api_key || null
    });

    if (error) {
      throw error;
    }
  }
};
