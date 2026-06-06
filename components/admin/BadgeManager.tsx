import React, { useState, useMemo } from 'react';
import { Search, Edit, X, Save, Tag, Star, Gift, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { Product } from '../../services/supabaseService';

interface BadgeManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
}

export const BadgeManager: React.FC<BadgeManagerProps> = ({
  products,
  setProducts,
  showSuccess,
  showError,
}) => {
  const [badgeSearch, setBadgeSearch] = useState('');
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const filteredBadgeProducts = useMemo(() => {
    return products.filter(
      p =>
        p.name.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        p.barcode.includes(badgeSearch)
    );
  }, [products, badgeSearch]);

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setDraftTags(product.tags || []);
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setSelectedProduct(null);
    setDraftTags([]);
  };

  const handleToggleDraftTag = (tag: string) => {
    setDraftTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveTags = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const { data, error: rpcError } = await supabase
        .from('products')
        .update({ tags: draftTags })
        .eq('barcode', selectedProduct.barcode)
        .select();

      if (rpcError) throw rpcError;
      if (data) {
        setProducts(prev =>
          prev.map(p => (p.barcode === selectedProduct.barcode ? { ...p, tags: draftTags } : p))
        );
        showSuccess('تم حفظ الشارات بنجاح');
        closeEditModal();
      }
    } catch (err: any) {
      showError(err.message || 'فشل حفظ الشارات');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render mini icons for active badges
  const renderMiniBadges = (tags: string[] = []) => {
    if (tags.length === 0) return <span className="text-[10px] text-gray-400">لا توجد شارات</span>;
    return (
      <div className="flex gap-1.5">
        {tags.includes('discount') && <span className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-1 rounded-md" title="خصم"><Tag className="w-3.5 h-3.5" /></span>}
        {tags.includes('best_seller') && <span className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 p-1 rounded-md" title="الأكثر مبيعاً"><Star className="w-3.5 h-3.5" /></span>}
        {tags.includes('gift') && <span className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 p-1 rounded-md" title="هدية"><Gift className="w-3.5 h-3.5" /></span>}
      </div>
    );
  };

  const BADGE_OPTIONS = [
    { id: 'discount', label: 'شارة عرض / خصم', desc: 'يظهر شريط أحمر على المنتج في التطبيق', icon: <Tag className="w-5 h-5 text-red-500" /> },
    { id: 'best_seller', label: 'الأكثر مبيعاً', desc: 'يميز المنتج كأحد أعلى المبيعات', icon: <Star className="w-5 h-5 text-amber-500" /> },
    { id: 'gift', label: 'هدية مجانية', desc: 'يظهر للعميل كمنتج مجاني ضمن باكج أو عرض', icon: <Gift className="w-5 h-5 text-green-500" /> },
  ];

  return (
    <div className="space-y-4 relative">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl sticky top-4 z-10 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن منتج (الاسم أو الباركود)..."
            value={badgeSearch}
            onChange={e => setBadgeSearch(e.target.value)}
            className="w-full h-12 pr-11 pl-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 transition-all"
          />
          <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Clean Mobile-first List */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {filteredBadgeProducts.slice(0, 50).map(p => (
          <div 
            key={p.barcode} 
            onClick={() => openEditModal(p)}
            className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Tag className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-1.5 rounded">{p.barcode}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0 pl-1">
              {renderMiniBadges(p.tags)}
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                تعديل
              </span>
            </div>
          </div>
        ))}

        {filteredBadgeProducts.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Search className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold text-sm">لا توجد منتجات مطابقة للبحث</p>
          </div>
        )}
      </div>

      {/* Edit Modal (Bottom Sheet on Mobile, Centered Modal on Desktop) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] translate-y-0 animate-slide-up md:animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-black text-gray-900 dark:text-white text-lg">تعديل الشارات</h2>
                <p className="text-xs text-brand-600 font-bold mt-0.5 truncate max-w-[250px]">{selectedProduct.name}</p>
              </div>
              <button 
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body (Toggles) */}
            <div className="p-5 overflow-y-auto space-y-3">
              {BADGE_OPTIONS.map(badge => {
                const isActive = draftTags.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => handleToggleDraftTag(badge.id)}
                    className={`w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      isActive 
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className={`font-black text-sm ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>
                          {badge.label}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1 font-bold">{badge.desc}</p>
                      </div>
                    </div>
                    
                    {/* Visual Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-brand-500 border-brand-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600 text-transparent'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 rounded-b-3xl">
              <button
                onClick={handleSaveTags}
                disabled={isSaving}
                className="w-full h-12 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition-all active:scale-[0.98]"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
