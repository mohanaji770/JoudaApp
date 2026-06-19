import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Heart, ShoppingCart, Calendar, Repeat, Trash2, Settings, User as UserIcon, LogOut,
  Clock, MapPin, Phone, Truck, Store, AlertCircle, X, RefreshCw,
  Check, MessageCircle, Send, CheckCircle2, Building, AlertTriangle, ShieldCheck,
  Info, ChevronLeft
} from 'lucide-react';
import { getCompletedOrders, deleteCompletedOrder, CompletedOrder } from '../services/db';
import { fetchLiveOrders, fetchLiveOrderItems, type LiveOrder, type LiveOrderItem } from '../services/liveOrderService';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getCachedProducts } from '../services/db';
import { Product } from '../services/supabaseService';
import { STORE_CONFIG } from '../constants';

interface DisplayOrder extends LiveOrder {
  isLocal?: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  submitted: { label: 'تم الإرسال', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', icon: <Send className="w-3.5 h-3.5" /> },
  confirmed: { label: 'مؤكد', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  reserved: { label: 'محجوز', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', icon: <Package className="w-3.5 h-3.5" /> },
  preparing: { label: 'قيد التحضير', color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: <Clock className="w-3.5 h-3.5" /> },
  delivered: { label: 'تم التسليم', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: <Truck className="w-3.5 h-3.5" /> },
  paid: { label: 'تم الدفع', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', icon: <Check className="w-3.5 h-3.5" /> },
  deposited: { label: 'تم الايداع', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', icon: <Building className="w-3.5 h-3.5" /> },
  cancelled: { label: 'ملغي', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: <X className="w-3.5 h-3.5" /> },
  failed: { label: 'فشل', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCartWithBarcode, addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [localOrders, setLocalOrders] = useState<CompletedOrder[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'settings'>('orders');
  const storedName = localStorage.getItem('jouda_customer_name') || 'صديق جودة';
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, LiveOrderItem[]>>({});
  const [repeatingOrder, setRepeatingOrder] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState<string>('');
  const [addingFavoriteId, setAddingFavoriteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [saved, allProducts] = await Promise.all([
        getCompletedOrders(),
        getCachedProducts(),
      ]);
      setLocalOrders(saved);

      const localItemsMap: Record<string, LiveOrderItem[]> = {};
      saved.forEach(o => {
        localItemsMap[o.id] = o.items.map((item, index) => ({
          id: `${o.id}_${index}`,
          order_id: o.id,
          product_barcode: item.product_barcode,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        }));
      });
      setOrderItems(prev => ({ ...prev, ...localItemsMap }));

      if (favorites.length > 0) {
        setFavoriteProducts(allProducts.filter(p => favorites.includes(p.id)));
      }

      const phone = localStorage.getItem('jouda_customer_phone') || '';
      setSavedPhone(phone);

      if (phone) {
        const live = await fetchLiveOrders(phone);
        setLiveOrders(live);
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!savedPhone) return;
    const interval = setInterval(async () => {
      try {
        const live = await fetchLiveOrders(savedPhone);
        setLiveOrders(live);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [savedPhone]);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      try {
        const items = await fetchLiveOrderItems(orderId, savedPhone);
        setOrderItems(prev => ({ ...prev, [orderId]: items }));
      } catch { /* silent */ }
    }
  };

  const handleRepeatOrder = async (order: DisplayOrder) => {
    setRepeatingOrder(order.id);
    try {
      const items = orderItems[order.id] || await fetchLiveOrderItems(order.id, savedPhone);
      const cachedProducts = await getCachedProducts();

      for (const item of items) {
        const product = cachedProducts.find(p => p.barcode === item.product_barcode);
        if (product) {
          addToCartWithBarcode({ name: product.name, barcode: product.barcode, price: product.price.toString(), source: 'store' });
        } else {
          addToCart(item.product_name, 'store');
        }
      }
      setTimeout(() => { setRepeatingOrder(null); navigate('/products', { state: { openCart: true } }); }, 800);
    } catch { setRepeatingOrder(null); }
  };

  const handleDeleteLocal = async (id: string) => {
    try { 
      await deleteCompletedOrder(id); 
      setLocalOrders(prev => prev.filter(o => o.id !== id)); 
    } catch { /* silent */ }
  };

  const handleClearAllLocal = async () => {
    if (window.confirm('هل أنت متأكد من مسح سجل الطلبات المحلية بالكامل؟')) {
      for (const o of localOrders) {
        await deleteCompletedOrder(o.id);
      }
      setLocalOrders([]);
    }
  };

  const handleAddFavoriteToCart = (product: Product) => {
    if (addingFavoriteId === product.id) return;
    setAddingFavoriteId(product.id);
    addToCartWithBarcode({ name: product.name, barcode: product.barcode, price: product.price.toString(), source: 'store' });
    setTimeout(() => setAddingFavoriteId(null), 1500);
  };

  const formatDate = (iso: string) => {
    try { 
      return new Date(iso).toLocaleDateString('ar-EG', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit',
        calendar: 'gregory'
      }); 
    }
    catch { return iso; }
  };

  const formatPrice = (n: number) => n?.toLocaleString('ar-SA') || '0';

  const mappedLocalOrders: DisplayOrder[] = localOrders.map(o => ({
    id: o.id,
    order_number: o.orderNumber,
    quotation_id: o.quotationId || null,
    customer_name: o.customerName,
    customer_phone: o.customerPhone,
    customer_address: o.customerAddress || null,
    order_type: o.orderType,
    subtotal: o.subtotal,
    delivery_fee: o.deliveryFee,
    total: o.total,
    payment_method: o.paymentMethod,
    notes: o.notes || null,
    status: 'submitted',
    created_at: new Date(o.createdAt).toISOString(),
    isLocal: true,
  }));

  const liveOrderNumbers = new Set(liveOrders.map(o => o.order_number));
  const uniqueLocalOrders = mappedLocalOrders.filter(o => !liveOrderNumbers.has(o.order_number));

  const displayOrders: DisplayOrder[] = [...liveOrders, ...uniqueLocalOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 animate-fade-in">
      {/* Profile Header */}
      <div className="pt-6 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border-2 border-white dark:border-gray-800 shadow-sm">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-1">
              أهلاً، {storedName} 👋
            </h2>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">
              {savedPhone ? `رقم الجوال: ${savedPhone}` : 'سجل الطلبات والمفضلة'}
            </p>
          </div>
        </div>
      </div>

      {/* Pill Tab Switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-full">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
            activeTab === 'orders' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          طلباتي
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
            activeTab === 'favorites' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Heart className="w-4 h-4 mb-0.5" />
          المفضلة
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${
            activeTab === 'settings' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          الإعدادات
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">سجل الطلبات</h3>
            <div className="flex items-center gap-2">
              {localOrders.length > 0 && (
                <button 
                  onClick={handleClearAllLocal} 
                  title="مسح السجل المحلي" 
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {savedPhone && (
                <button 
                  onClick={loadData} 
                  title="تحديث الطلبات" 
                  className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {displayOrders.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border-0 p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)]">
              <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات مسجلة</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">قم بإتمام أول طلب لتتبعه هنا تلقائياً في هذه الصفحة</p>
              <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                تصفح المنتجات
              </button>
            </div>
          )}

          {displayOrders.map(order => {
            const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: '#666', bg: '#f5f5f5', icon: '📦' };
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];
            const isActiveOrder = ['submitted', 'confirmed', 'preparing'].includes(order.status);

            // Dynamic ambient light blur glow color based on status
            const getGlowColor = (status: string) => {
              if (['submitted'].includes(status)) return 'bg-blue-500/10';
              if (['confirmed', 'reserved'].includes(status)) return 'bg-purple-500/10';
              if (['preparing'].includes(status)) return 'bg-amber-500/10';
              if (['delivered', 'paid', 'deposited'].includes(status)) return 'bg-emerald-500/10';
              return 'bg-red-500/10';
            };

            return (
              <div 
                key={order.id} 
                className={`bg-white dark:bg-gray-800 rounded-3xl border-0 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.015)] transition-all duration-300 relative group/card ${
                  isActiveOrder ? 'shadow-md shadow-brand-500/5 ring-1 ring-brand-500/10' : ''
                }`}
              >
                {/* Dynamic Ambient Light Blur Glow Circle inside card */}
                <div className={`absolute -top-16 -left-16 w-36 h-36 rounded-full blur-2xl transition-transform duration-500 group-hover/card:scale-110 ${getGlowColor(order.status)}`} />

                <div className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      {/* Category-like label */}
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                        {order.order_type === 'delivery' ? 'توصيل للمنزل' : 'استلام من الفرع'}
                        {order.isLocal && ' • طلب محلي'}
                      </span>
                      
                      {/* Order Title (App Store game style) */}
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                        {order.order_number || '—'}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" />{formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    {/* App Store Style GET button for status */}
                    <div className="flex flex-col items-end gap-2">
                      <span 
                        style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                        className="px-4 py-1.5 rounded-full font-black text-xs inline-flex items-center justify-center tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.01)] shrink-0 min-w-[85px] text-center"
                      >
                        {statusInfo.label}
                      </span>
                      
                      {/* Pulsing indicator for active orders */}
                      {isActiveOrder && (
                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 animate-pulse bg-brand-50/50 dark:bg-brand-950/20 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400 block"></span>
                          مباشر
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order metadata tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {order.customer_address && (
                      <span className="flex items-center gap-1 text-[11px] bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-xl text-gray-500 dark:text-gray-400 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {order.customer_address}
                      </span>
                    )}
                    {order.isLocal && (
                      <span className="flex items-center gap-1 text-[11px] bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-xl text-gray-500 dark:text-gray-400 font-bold">
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteLocal(order.id); }} />
                        مسح محلي
                      </span>
                    )}
                  </div>

                  {/* iOS Style Minimal Progress Line */}
                  {order.status !== 'cancelled' && order.status !== 'failed' && (() => {
                    const mapStatusToStep = (status: string): string => {
                      if (['submitted', 'deposited'].includes(status)) return 'submitted';
                      if (['confirmed', 'reserved'].includes(status)) return 'confirmed';
                      if (['preparing'].includes(status)) return 'preparing';
                      if (['delivered', 'paid'].includes(status)) return 'delivered';
                      return status;
                    };
                    const mappedStatus = mapStatusToStep(order.status);
                    return (
                      <div className="relative mb-6 pt-2 px-1">
                        {/* Background track */}
                        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 dark:bg-gray-700/60 z-0 rounded-full" />
                        
                        {/* Active progress */}
                        <div 
                          className="absolute top-4 right-4 h-1 bg-emerald-500 dark:bg-emerald-400 z-0 transition-all duration-500 rounded-full"
                          style={{
                            width: mappedStatus === 'delivered' ? 'calc(100% - 2rem)' :
                                   mappedStatus === 'preparing' ? 'calc(66% - 1.3rem)' :
                                   mappedStatus === 'confirmed' ? 'calc(33% - 0.6rem)' : '0%'
                          }}
                        />

                        {/* Interactive Steps */}
                        <div className="flex items-center justify-between relative z-10">
                          {['submitted', 'confirmed', 'preparing', 'delivered'].map((step) => {
                            const stepOrder = ['submitted', 'confirmed', 'preparing', 'delivered'];
                            const currentIdx = stepOrder.indexOf(mappedStatus);
                            const stepIdx = stepOrder.indexOf(step);
                            const isCompleted = stepIdx <= currentIdx;
                            const isCurrent = stepIdx === currentIdx;
                            const stepLabels: Record<string, string> = {
                              submitted: 'الإرسال',
                              confirmed: 'تأكيد',
                              preparing: 'التحضير',
                              delivered: 'التسليم',
                            };
                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ring-4 ring-white dark:ring-gray-800 ${
                                  isCurrent ? 'bg-brand-600 text-white scale-110 shadow-md shadow-brand-500/20' :
                                  isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-transparent'
                                }`}>
                                  {isCompleted && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold mt-1.5 text-center ${
                                  isCurrent ? 'text-brand-600 dark:text-brand-400 font-black' :
                                  isCompleted ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                  {stepLabels[step]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-750">
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      المجموع: {formatPrice(order.total)} ر.ي
                    </span>
                    <button 
                      onClick={() => toggleExpand(order.id)} 
                      className="text-xs font-black text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-700/30 space-y-4 relative z-10">
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-xs font-bold flex items-center justify-center">{item.quantity}</span>
                              <span className="text-sm text-gray-900 dark:text-white font-medium">{item.product_name}</span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">جاري تحميل التفاصيل...</p>
                    )}

                    {order.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.005)]">
                        <span className="font-bold">ملاحظات:</span> {order.notes}
                      </p>
                    )}

                    <div className="pt-2 space-y-2">
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleRepeatOrder(order)}
                          disabled={repeatingOrder === order.id}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70 shadow-sm active:scale-[0.98]"
                        >
                          {repeatingOrder === order.id ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الإضافة...</>
                          ) : (
                            <><Repeat className="w-4 h-4" />تكرار الطلب</>
                          )}
                        </button>
                      )}

                      {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'failed' && (
                        <button
                          onClick={() => {
                            const statusLabel = STATUS_MAP[order.status]?.label || order.status;
                            const message = `مرحباً متجر جودة، أود الاستفسار عن طلبي رقم: *${order.order_number}* 📦\nالحالة الحالية: ${statusLabel}`;
                            const encoded = encodeURIComponent(message);
                            const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-whatsapp hover:bg-whatsapp-hover text-white rounded-2xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                          <MessageCircle className="w-5 h-5" />
                          تواصل بخصوص الطلب عبر واتساب
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8">
              <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد مفضلات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">اضغط على القلب بجانب أي منتج لإضافته للمفضلة</p>
              <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favoriteProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm group">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-8 h-8" /></div>
                    )}
                    <button onClick={() => toggleFavorite(product.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-500 hover:scale-110 transition-transform shadow-sm">
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-brand-600">{product.price}</span>
                      <button
                        onClick={() => handleAddFavoriteToCart(product)}
                        disabled={addingFavoriteId === product.id}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          addingFavoriteId === product.id
                            ? 'bg-emerald-600 text-white scale-110 animate-bounce'
                            : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 hover:bg-brand-100'
                        }`}
                      >
                        {addingFavoriteId === product.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">معلومات الحساب</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">الاسم</label>
                <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {storedName}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">رقم الجوال المربوط بالطلبات</label>
                <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {savedPhone || 'لم يتم التسجيل بعد'}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">يتم ربط رقم الجوال تلقائياً عند إتمام أول طلب.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">دليل ومساعدة</h3>
            
            <button
              onClick={() => navigate('/about')}
              className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-50 dark:bg-brand-900/20 p-2 rounded-xl text-brand-600 dark:text-brand-400">
                  <Info className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-gray-900 dark:text-white">عن جودة (من نحن)</span>
                  <span className="text-[10px] text-gray-500 block">تعرف على قصتنا، موقعنا، والأسئلة الشائعة</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:-translate-x-0.5 transition-all" />
            </button>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-5 border border-red-100 dark:border-red-900/20">
             <button 
               onClick={() => {
                 if(window.confirm('هل أنت متأكد من تسجيل الخروج؟ سيتم مسح بياناتك واسمك من التطبيق.')) {
                   localStorage.removeItem('jouda_customer_name');
                   localStorage.removeItem('jouda_customer_phone');
                   window.location.reload();
                 }
               }}
               className="w-full flex items-center justify-between text-red-600 dark:text-red-400 font-bold text-sm"
             >
               <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> تسجيل الخروج ومسح البيانات</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
