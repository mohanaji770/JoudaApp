import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, Key, AlertTriangle } from 'lucide-react';
import { AdminSettingsService, AppSettings } from '../../services/admin/AdminSettingsService';

interface SettingsManagerProps {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  showSuccess,
  showError,
  loading,
  setLoading
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Local state for the form
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  
  // Map settings
  const [deliveryPricePerKm, setDeliveryPricePerKm] = useState<number>(150);
  const [storeLatitude, setStoreLatitude] = useState<number>(15.3980555);
  const [storeLongitude, setStoreLongitude] = useState<number>(44.2094444);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await AdminSettingsService.getSettings();
      if (data) {
        setSettings(data);
        setMaintenanceMode(data.maintenance_mode);
        setMaintenanceMessage(data.maintenance_message || '');
        setAiApiKey(data.ai_api_key || '');
        setDeliveryPricePerKm(data.delivery_price_per_km ?? 150);
        setStoreLatitude(data.store_latitude ?? 15.3980555);
        setStoreLongitude(data.store_longitude ?? 44.2094444);
      }
    } catch (err: any) {
      showError('فشل تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await AdminSettingsService.updateSettings({
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage.trim() || null,
        ai_api_key: aiApiKey.trim() || null,
        delivery_price_per_km: deliveryPricePerKm,
        store_latitude: storeLatitude,
        store_longitude: storeLongitude
      });
      showSuccess('تم حفظ الإعدادات بنجاح');
      loadSettings();
    } catch (err: any) {
      showError(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* API Settings Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">إعدادات الذكاء الاصطناعي (AI)</h2>
              <p className="text-[10px] text-gray-500 mt-1">مفاتيح الربط مع خدمات الذكاء الاصطناعي (مثل OpenAI أو Gemini)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-700 dark:text-gray-300 font-bold mb-2">مفتاح API للذكاء الاصطناعي (AI API Key)</label>
            <input
              type="password"
              placeholder="sk-..."
              value={aiApiKey}
              onChange={e => setAiApiKey(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none dark:text-white font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              هذا المفتاح سري جداً، يتم تخزينه بأمان ويستخدم في الخوادم فقط (Edge Functions).
            </p>
          </div>
        </div>

        {/* Map Settings Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xl">📍</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">إعدادات الخرائط والتوصيل</h2>
              <p className="text-[10px] text-gray-500 mt-1">تحديد سعر الكيلومتر لتسعيرة التوصيل وإحداثيات المتجر (المستودع)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 font-bold mb-2">سعر التوصيل للكيلومتر (ريال)</label>
              <input
                type="number"
                min="0"
                value={deliveryPricePerKm}
                onChange={e => setDeliveryPricePerKm(Number(e.target.value))}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 font-bold mb-2">خط العرض للمتجر (Latitude)</label>
              <input
                type="number"
                step="any"
                value={storeLatitude}
                onChange={e => setStoreLatitude(Number(e.target.value))}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 font-bold mb-2">خط الطول للمتجر (Longitude)</label>
              <input
                type="number"
                step="any"
                value={storeLongitude}
                onChange={e => setStoreLongitude(Number(e.target.value))}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">وضع الصيانة والتوقف</h2>
              <p className="text-[10px] text-gray-500 mt-1">إيقاف التطبيق مؤقتاً للعملاء وعرض رسالة صيانة</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">تفعيل وضع الصيانة</p>
              <p className="text-[10px] text-gray-500 mt-1">لن يتمكن أي عميل من الدخول للتطبيق أو الطلب</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={maintenanceMode}
                onChange={e => setMaintenanceMode(e.target.checked)}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:-translate-x-1 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
            </label>
          </div>

          {maintenanceMode && (
            <div className="animate-fade-in">
              <label className="block text-xs text-gray-700 dark:text-gray-300 font-bold mb-2">رسالة الصيانة التي ستظهر للعملاء</label>
              <textarea
                rows={3}
                placeholder="التطبيق تحت الصيانة حالياً. سنعود للعمل قريباً..."
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                className="w-full p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-white resize-none"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>حفظ جميع الإعدادات</span>
          </button>
        </div>

      </form>
    </div>
  );
};
