import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Star, PackageSearch, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { Product, AppCategory } from '../../../services/supabaseService';
import { BADGE_OPTIONS } from './constants';

export interface EditProductModalProps {
  product: Product;
  categories: AppCategory[];
  cashierCategories: string[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (product: Product, updates: any) => Promise<void>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, categories, cashierCategories, isSaving, onClose, onSave }) => {
  const [draftTags, setDraftTags] = useState<string[]>(product.tags || []);
  const [draftDescription, setDraftDescription] = useState<string>(product.description || '');
  const [draftCategory, setDraftCategory] = useState<string>(product.app_category || '');
  const [draftCashierCategory, setDraftCashierCategory] = useState<string>(product.category || '');
  const [isHidden, setIsHidden] = useState<boolean>(product.is_hidden_in_app || false);
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(product.force_out_of_stock || false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const toggleTag = (tagId: string) => {
    setDraftTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    onSave(product, {
      tags: draftTags,
      description: draftDescription.trim() || null,
      app_category: draftCategory || null,
      category: draftCashierCategory.trim() || 'عام',
      is_hidden_in_app: isHidden,
      force_out_of_stock: isOutOfStock
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full md:max-w-xl bg-gray-50 dark:bg-gray-950 rounded-t-[32px] md:rounded-3xl shadow-2xl flex flex-col h-[85vh] md:h-auto md:max-h-[85vh] translate-y-0 animate-slide-up md:animate-scale-in overflow-hidden">
        
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-white dark:bg-gray-900 shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-4 md:p-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="font-black text-gray-900 dark:text-white text-base md:text-lg">تعديل المنتج</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-600 font-bold truncate max-w-[200px]">{product.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full active:bg-gray-200 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-5 overflow-y-auto flex-1 space-y-6">
          
          {/* معلومات النظام */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center gap-4 md:justify-between">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1">السعر الأساسي</p>
              <p className="text-sm font-black text-brand-600 dark:text-brand-400">{product.price} ريال</p>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1">تصنيف الكاشير</p>
              <select
                value={draftCashierCategory}
                onChange={(e) => setDraftCashierCategory(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1.5 py-1 text-xs font-bold focus:ring-1 focus:ring-brand-500 focus:outline-none dark:text-white appearance-none"
              >
                <option value="">بدون تصنيف</option>
                {!cashierCategories.includes(draftCashierCategory) && draftCashierCategory && (
                  <option value={draftCashierCategory}>{draftCashierCategory}</option>
                )}
                {cashierCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1">الباركود بالنظام</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{product.barcode}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" /> حالة المتجر
              </h3>
            </div>
            <div className="p-2 space-y-2">
              <button
                onClick={() => setIsHidden(!isHidden)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  isHidden ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50' : 'bg-white border-transparent hover:border-gray-100 dark:bg-gray-900 dark:border-transparent'
                }`}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={`font-bold text-sm ${isHidden ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>إخفاء المنتج</span>
                  <span className="text-[10px] text-gray-500">لا يظهر للعملاء بتاتاً.</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-1 transition-colors flex shrink-0 ${isHidden ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isHidden ? '-translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>

              <div className="h-px w-full bg-gray-100 dark:bg-gray-800/50" />

              <button
                onClick={() => setIsOutOfStock(!isOutOfStock)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                  isOutOfStock ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50' : 'bg-white border-transparent hover:border-gray-100 dark:bg-gray-900 dark:border-transparent'
                }`}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className={`font-bold text-sm ${isOutOfStock ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>نفاذ الكمية (يدوياً)</span>
                  <span className="text-[10px] text-gray-500">سيظهر للعملاء كمنتج منتهي.</span>
                </div>
                <div className={`w-11 h-6 rounded-full p-1 transition-colors flex shrink-0 ${isOutOfStock ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOutOfStock ? '-translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <PackageSearch className="w-4 h-4 text-brand-500" /> تصنيف العرض
            </h3>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all appearance-none"
            >
              <option value="">-- كاشير: ({product.category}) --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-2 font-bold">لا توجد تصنيفات مضافة في النظام حالياً.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-brand-500" /> الوصف الترويجي
            </h3>
            <textarea 
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="اكتب وصفاً مميزاً للمنتج..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[90px] resize-none text-gray-900 dark:text-white transition-all"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-brand-500" /> الشارات والعلامات
            </h3>
            <div className="flex flex-col gap-2">
              {BADGE_OPTIONS.map(badge => {
                const isActive = draftTags.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => toggleTag(badge.id)}
                    className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between active:scale-[0.98] ${
                      isActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-white dark:bg-gray-800 shadow-sm' : 'bg-transparent'}`}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className={`font-black text-xs ${isActive ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>{badge.label}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{badge.desc}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'}`}>
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 pb-safe">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition-all active:scale-[0.98]"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ التعديلات الشاملة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
