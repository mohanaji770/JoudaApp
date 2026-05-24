import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Heart, ShoppingCart, Calendar, Repeat, Trash2,
  Clock, MapPin, Phone, Truck, Store, AlertCircle, X, RefreshCw,
  Check, MessageCircle,
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

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  submitted: { label: 'تم الإرسال', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', icon: '📨' },
  confirmed: { label: 'مؤكد', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: '✅' },
  reserved: { label: 'محجوز', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', icon: '📦' },
  preparing: { label: 'قيد التحضير', color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: '👨‍🍳' },
  delivered: { label: 'تم التسليم', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: '🚚' },
  paid: { label: 'تم الدفع', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', icon: '💰' },
  deposited: { label: 'تم الايداع', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', icon: '🏦' },
  cancelled: { label: 'ملغي', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: '❌' },
  failed: { label: 'فشل', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: '⚠️' },
};

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCartWithBarcode, addToCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [localOrders, setLocalOrders] = useState<CompletedOrder[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, LiveOrderItem[]>>({});
  const [repeatingOrder, setRepeatingOrder] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState<string>('');

  const [inputPhone, setInputPhone] = useState<string>('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState<boolean>(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
      setInputPhone(phone);

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

  const handleUpdatePhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPhone.trim()) return;
    setIsUpdatingPhone(true);
    setPhoneMessage(null);
    try {
      const clean = inputPhone.replace(/[\s\-]/g, '');
      localStorage.setItem('jouda_customer_phone', clean);
      setSavedPhone(clean);
      const live = await fetchLiveOrders(clean);
      setLiveOrders(live);
      setPhoneMessage({ type: 'success', text: 'تم تحديث رقم الجوال ومزامنة الطلبات بنجاح ✅' });
      setTimeout(() => setPhoneMessage(null), 4000);
    } catch (err) {
      setPhoneMessage({ type: 'error', text: 'حدث خطأ أثناء جلب الطلبات. يرجى المحاولة لاحقاً.' });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

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
      <div className="bg-gradient-to-br from-brand-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 rounded-3xl mb-6 border border-brand-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">طلباتي</h2>
          <div className="flex items-center gap-2">
            {localOrders.length > 0 && (
              <button onClick={handleClearAllLocal} title="مسح السجل المحلي" className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 text-xs font-bold">
                <Trash2 className="w-4 h-4" />
                مسح السجل
              </button>
            )}
            {savedPhone && (
              <button onClick={loadData} title="تحديث الطلبات" className="p-2 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {displayOrders.length} طلب {liveOrders.length > 0 && '• تحديث تلقائي'}
        </p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'orders' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Package className="w-4 h-4" />
          الطلبات ({displayOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'favorites' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Heart className="w-4 h-4" />
          المفضلة ({favorites.length})
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600" />
              رقم الجوال لتتبع ومزامنة الطلبات
            </h3>
            <form onSubmit={handleUpdatePhone} className="flex gap-2">
              <input
                type="tel"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="أدخل رقم جوالك (مثال: 781117671)..."
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={isUpdatingPhone || !inputPhone.trim()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-[0.98]"
              >
                {isUpdatingPhone ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>تحديث</span>
                )}
              </button>
            </form>
            {phoneMessage && (
              <p className={`text-xs font-bold mt-2.5 p-2.5 rounded-xl ${
                phoneMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {phoneMessage.text}
              </p>
            )}
          </div>

          {displayOrders.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8">
              <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات مسجلة</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">اطلب الآن أو تأكد من إدخال رقم جوالك الصحيح أعلاه لتتبع طلباتك</p>
              <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                تصفح المنتجات
              </button>
            </div>
          )}

          {displayOrders.map(order => {
            const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: '#666', bg: '#f5f5f5', icon: '📦' };
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];

            return (
              <div key={order.id} className={`bg-white dark:bg-gray-800 rounded-3xl border overflow-hidden shadow-sm ${
                ['submitted', 'confirmed', 'preparing'].includes(order.status)
                  ? 'border-brand-300 dark:border-brand-700 shadow-brand-500/5 animate-pulse'
                  : 'border-gray-100 dark:border-gray-700'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-black text-brand-600">{order.order_number || '—'}</span>
                        <span style={{ background: statusInfo.bg, color: statusInfo.color }}
                          className="text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                          <span>{statusInfo.icon}</span> {statusInfo.label}
                        </span>
                        {order.isLocal && (
                          <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md font-bold">
                            محلي
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.created_at)}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.total?.toLocaleString()} ر.ي</span>
                      </div>
                    </div>
                    {order.isLocal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLocal(order.id); }}
                        title="حذف الطلب المحلي"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                      {order.order_type === 'delivery' ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                      {order.order_type === 'delivery' ? 'توصيل' : 'استلام'}
                    </span>
                    {order.customer_address && (
                      <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                        <MapPin className="w-3 h-3" />{order.customer_address}
                      </span>
                    )}
                  </div>

                  {order.status !== 'cancelled' && order.status !== 'failed' && (() => {
                    // Map all workflow statuses to one of the 4 visual progress steps
                    const mapStatusToStep = (status: string): string => {
                      if (['submitted'].includes(status)) return 'submitted';
                      if (['confirmed', 'reserved'].includes(status)) return 'confirmed';
                      if (['preparing'].includes(status)) return 'preparing';
                      if (['delivered', 'paid', 'deposited'].includes(status)) return 'delivered';
                      return status;
                    };
                    const mappedStatus = mapStatusToStep(order.status);
                    return (
                    <div className="relative mb-8 pt-2 px-4">
                      <div className="absolute top-6 left-8 right-8 h-1 bg-gray-100 dark:bg-gray-700 z-0 rounded-full" />
                      <div className="absolute top-6 right-8 h-1 bg-emerald-500 z-0 transition-all duration-500 rounded-full"
                        style={{
                          width: mappedStatus === 'delivered' ? 'calc(100% - 4rem)' :
                                 mappedStatus === 'preparing' ? 'calc(66% - 2.6rem)' :
                                 mappedStatus === 'confirmed' ? 'calc(33% - 1.3rem)' : '0%'
                        }}
                      />
                      <div className="flex items-center justify-between relative z-10">
                        {['submitted', 'confirmed', 'preparing', 'delivered'].map((step) => {
                          const stepOrder = ['submitted', 'confirmed', 'preparing', 'delivered'];
                          const currentIdx = stepOrder.indexOf(mappedStatus);
                          const stepIdx = stepOrder.indexOf(step);
                          const isCompleted = stepIdx <= currentIdx;
                          const isCurrent = stepIdx === currentIdx;
                          const stepLabels: Record<string, string> = {
                            submitted: 'تم الإرسال',
                            confirmed: 'مؤكد',
                            preparing: 'التحضير',
                            delivered: 'تم التسليم',
                          };
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                isCurrent ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110 animate-pulse' :
                                isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                              }`}>
                                {isCompleted && !isCurrent ? '✓' : STATUS_MAP[step]?.icon || '•'}
                              </div>
                              <span className={`text-[10px] font-bold mt-2 text-center ${
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

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      المجموع: {formatPrice(order.total)}
                    </span>
                    <button onClick={() => toggleExpand(order.id)} className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                      {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-700/30 space-y-4">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-xl">
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
                            const message = `مرحباً متجر جودة، أود الاستفسار عن طلبي رقم: *${order.order_number}* 📦\nالحالة الحالية: ${STATUS_MAP[order.status]?.label || order.status}`;
                            const encoded = encodeURIComponent(message);
                            const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
                            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md active:scale-[0.98]"
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
    </div>
  );
};
