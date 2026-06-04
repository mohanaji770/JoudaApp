import React, { useState, useMemo } from 'react';
import { Gift, Search, Save, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Product } from '../../services/supabaseService';

interface PackageManagerProps {
  products: Product[];
  pin: string;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  loadData: () => Promise<void>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PackageManager: React.FC<PackageManagerProps> = ({
  products,
  pin,
  showSuccess,
  showError,
  loadData,
  loading,
  setLoading
}) => {
  const [pkgBarcode, setPkgBarcode] = useState('');
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgImage, setPkgImage] = useState('');
  const [pkgItems, setPkgItems] = useState<{ barcode: string; product_name: string; quantity: number; price?: number }[]>([]);
  
  // Selected component search
  const [compSearch, setCompSearch] = useState('');
  const [compQuantity, setCompQuantity] = useState(1);

  const matchedComponents = useMemo(() => {
    if (!compSearch.trim()) return [];
    return products.filter(p => 
      !p.barcode.startsWith('PKG-') && 
      p.category !== 'عروض وبكجات' &&
      (p.name.toLowerCase().includes(compSearch.toLowerCase()) || p.barcode.includes(compSearch))
    ).slice(0, 5);
  }, [products, compSearch]);

  const addComponentToPackage = (prod: Product) => {
    if (pkgItems.some(i => i.barcode === prod.barcode)) {
      showError('المنتج مضاف بالفعل للبكج');
      return;
    }
    setPkgItems(prev => [...prev, {
      barcode: prod.barcode,
      product_name: prod.name,
      quantity: compQuantity,
      price: prod.price
    }]);
    setCompSearch('');
    setCompQuantity(1);
  };

  const removeComponentFromPackage = (barcode: string) => {
    setPkgItems(prev => prev.filter(i => i.barcode !== barcode));
  };

  // Calculate regular total and savings
  const packageCalculation = useMemo(() => {
    const regularTotal = pkgItems.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const salePrice = parseFloat(pkgPrice) || 0;
    const savings = regularTotal > salePrice ? regularTotal - salePrice : 0;
    const savingsPercentage = regularTotal > 0 ? Math.round((savings / regularTotal) * 100) : 0;
    return { regularTotal, savings, savingsPercentage };
  }, [pkgItems, pkgPrice]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    if (!pkgBarcode.trim() || !pkgName.trim() || !pkgPrice.trim()) {
      showError('يرجى تعبئة الحقول الأساسية للبكج');
      return;
    }
    if (pkgItems.length === 0) {
      showError('يجب إضافة منتج واحد على الأقل داخل البكج');
      return;
    }

    try {
      setLoading(true);
      const jsonItems = pkgItems.map(i => ({ barcode: i.barcode, quantity: i.quantity }));
      const { data, error: rpcError } = await supabase.rpc('admin_create_package', {
        p_pin: pin,
        p_package_barcode: pkgBarcode.startsWith('PKG-') ? pkgBarcode.trim() : `PKG-${pkgBarcode.trim()}`,
        p_name: pkgName.trim(),
        p_price: parseFloat(pkgPrice),
        p_category: 'عروض وبكجات',
        p_description: pkgDesc.trim(),
        p_image_url: pkgImage.trim(),
        p_items: jsonItems
      });

      if (rpcError) throw rpcError;
      if (data) {
        showSuccess('تم إنشاء/تحديث البكج التوفيري بنجاح');
        setPkgBarcode('');
        setPkgName('');
        setPkgPrice('');
        setPkgDesc('');
        setPkgImage('');
        setPkgItems([]);
        loadData();
      }
    } catch (err: any) {
      showError(err.message || 'فشل حفظ البكج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Creator Form */}
      <form onSubmit={handleCreatePackage} className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-gray-800 pb-3">
          <Gift className="w-5 h-5 text-amber-500" />
          إنشاء بكج توفيري جديد
        </h2>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] text-gray-400 font-bold mb-1.5">باركود البكج * (بدون PKG-)</label>
            <input
              type="text"
              placeholder="مثال: SLIM-BOX"
              required
              value={pkgBarcode}
              onChange={e => setPkgBarcode(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 font-bold mb-1.5">اسم البكج *</label>
            <input
              type="text"
              placeholder="بكج الرشاقة الخالي من الغلوتين"
              required
              value={pkgName}
              onChange={e => setPkgName(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 font-bold mb-1.5">سعر العرض للبكج (ريال) *</label>
            <input
              type="number"
              placeholder="4500"
              required
              value={pkgPrice}
              onChange={e => setPkgPrice(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 font-bold mb-1.5">رابط الصورة (اختياري)</label>
            <input
              type="text"
              placeholder="https://..."
              value={pkgImage}
              onChange={e => setPkgImage(e.target.value)}
              className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 font-bold mb-1.5">وصف البكج</label>
          <textarea
            rows={2}
            placeholder="تفاصيل العرض والمميزات..."
            value={pkgDesc}
            onChange={e => setPkgDesc(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none dark:text-white"
          />
        </div>

        {/* Components Selector */}
        <div className="border-t border-gray-50 dark:border-gray-800 pt-4">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">أضف منتجات داخل البكج</label>
          
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث عن منتج فرعي لإضافته..."
                value={compSearch}
                onChange={e => setCompSearch(e.target.value)}
                className="w-full h-10 pr-9 pl-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none dark:text-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              
              {/* Results list */}
              {matchedComponents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
                  {matchedComponents.map(p => (
                    <button
                      key={p.barcode}
                      type="button"
                      onClick={() => addComponentToPackage(p)}
                      className="w-full px-3 py-2.5 text-right text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span className="font-bold dark:text-white">{p.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({p.price} ر.ي)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-20 shrink-0">
              <input
                type="number"
                min={1}
                value={compQuantity}
                onChange={e => setCompQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-10 px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-center focus:outline-none dark:text-white font-mono"
                title="الكمية المطلوبة"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98]"
        >
          <Save className="w-4.5 h-4.5" />
          <span>حفظ البكج التوفيري</span>
        </button>
      </form>

      {/* Calculator & Selected Items */}
      <div className="space-y-4">
        {/* Savings Box */}
        <div className="bg-gradient-to-br from-amber-500/5 to-brand-500/5 border border-amber-100 dark:border-brand-900/30 p-4 rounded-3xl">
          <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1">
            <span>توفير البكج التقديري</span>
            <span>⚡</span>
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>سعر المكونات فرادى:</span>
              <span className="font-bold font-mono">{packageCalculation.regularTotal} ر.ي</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>سعر البكج المحدد:</span>
              <span className="font-bold font-mono text-brand-600">{pkgPrice || 0} ر.ي</span>
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
            <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
              <span>المبلغ الموفر:</span>
              <span className="font-black font-mono">-{packageCalculation.savings} ر.ي ({packageCalculation.savingsPercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Selected Items List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl space-y-3">
          <h3 className="text-xs font-black text-gray-800 dark:text-gray-200">المنتجات المختارة ({pkgItems.length})</h3>
          
          <div className="space-y-2 divide-y divide-gray-50 dark:divide-gray-800 max-h-[250px] overflow-y-auto">
            {pkgItems.map(item => (
              <div key={item.barcode} className="flex items-center justify-between pt-2.5 first:pt-0">
                <div className="min-w-0 flex-1 pl-2">
                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate">{item.product_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">
                    {item.quantity} عدد × {item.price || 0} ر.ي
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeComponentFromPackage(item.barcode)}
                  className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {pkgItems.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center py-6">الرجاء إضافة منتجات لتظهر هنا</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
