import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Heart, ShoppingCart, Calendar, Repeat, Trash2,
  Clock, MapPin, Phone, Truck, Store, AlertCircle, X, RefreshCw,
} from 'lucide-react';
import { getCompletedOrders, deleteCompletedOrder, CompletedOrder } from '../services/db';
import { fetchLiveOrders, fetchLiveOrderItems, type LiveOrder, type LiveOrderItem } from '../services/liveOrderService';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getCachedProducts } from '../services/db';
import { Product } from '../services/supabaseService';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  submitted: { label: 'تم الإرسال', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', icon: '📨' },
  confirmed: { label: 'مؤكد', color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: '✅' },
  preparing: { label: 'قيد التحضير', color: '#d97706', bg: 'rgba(217,119,6,0.08)', icon: '👨‍🍳' },
  delivered: { label: 'تم التسليم', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: '🎉' },
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load local orders + favorites
      const [saved, allProducts] = await Promise.all([
        getCompletedOrders(),
        getCachedProducts(),
      ]);
      setLocalOrders(saved);

      if (favorites.length > 0) {
        setFavoriteProducts(allProducts.filter(p => favorites.includes(p.id)));
      }

      // Try to load live orders from Supabase using stored phone
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

  // Auto-refresh live orders every 30s
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
        const items = await fetchLiveOrderItems(orderId);
        setOrderItems(prev => ({ ...prev, [orderId]: items }));
      } catch { /* silent */ }
    }
  };

  const handleRepeatOrder = async (order: LiveOrder) => {
    setRepeatingOrder(order.id);
    try {
      const items = orderItems[order.id] || await fetchLiveOrderItems(order.id);
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
    try { await deleteCompletedOrder(id); setLocalOrders(prev => prev.filter(o => o.id !== id)); } catch { /* silent */ }
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  const formatPrice = (n: number) => n?.toLocaleString('ar-SA') || '0';

  // Merge: live orders take priority, local orders as fallback
  const hasLiveOrders = liveOrders.length > 0;
  const displayOrders = hasLiveOrders ? liveOrders : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 rounded-3xl mb-6 border border-brand-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">طلباتي</h2>
          {savedPhone && (
            <button onClick={loadData} className="p-2 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {displayOrders.length} طلب {hasLiveOrders && '• تحديث تلقائي'}
        </p>
      </div>

      {/* Tabs */}
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

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* No phone saved prompt */}
          {!savedPhone && localOrders.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">اطلب الآن وستظهر طلباتك هنا</p>
              <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                تصفح المنتجات
              </button>
            </div>
          )}

          {/* Live Orders */}
          {displayOrders.map(order => {
            const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: '#666', bg: '#f5f5f5', icon: '📦' };
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];

            return (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-black text-brand-600">{order.order_number || '—'}</span>
                        <span style={{ background: statusInfo.bg, color: statusInfo.color }}
                          className="text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                          <span>{statusInfo.icon}</span> {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.created_at)}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.total?.toLocaleString()} ر.ي</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
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

                  {/* Status Progress */}
                  {order.status !== 'cancelled' && order.status !== 'failed' && (
                    <div className="flex items-center gap-1 mb-3">
                      {['submitted', 'confirmed', 'preparing', 'delivered'].map((step, i) => {
                        const stepOrder = ['submitted', 'confirmed', 'preparing', 'delivered'];
                        const currentIdx = stepOrder.indexOf(order.status);
                        const stepIdx = i;
                        const isCompleted = stepIdx <= currentIdx;
                        const isCurrent = stepIdx === currentIdx;
                        return (
                          <React.Fragment key={step}>
                            <div style={{
                              width: isCurrent ? 10 : 8, height: isCurrent ? 10 : 8,
                              borderRadius: '50%', flexShrink: 0,
                              background: isCompleted ? STATUS_MAP[step]?.color || '#16a34a' : '#e5e7eb',
                              border: isCurrent ? `2px solid ${STATUS_MAP[step]?.color}` : 'none',
                              boxShadow: isCurrent ? `0 0 0 3px ${STATUS_MAP[step]?.bg}` : 'none',
                              transition: 'all 0.3s',
                            }} />
                            {i < 3 && (
                              <div style={{
                                flex: 1, height: 2,
                                background: stepIdx < currentIdx ? '#16a34a' : '#e5e7eb',
                                transition: 'background 0.3s',
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      المجموع: {formatPrice(order.total)}
                    </span>
                    <button onClick={() => toggleExpand(order.id)} className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
                      {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-700/30">
                    {items.length > 0 ? (
                      <div className="space-y-2 mb-5">
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-xl mb-5">
                        <span className="font-bold">ملاحظات:</span> {order.notes}
                      </p>
                    )}

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleRepeatOrder(order)}
                        disabled={repeatingOrder === order.id}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
                      >
                        {repeatingOrder === order.id ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الإضافة...</>
                        ) : (
                          <><Repeat className="w-4 h-4" />تكرار الطلب</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-16">
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
                      <button onClick={() => addToCartWithBarcode({ name: product.name, barcode: product.barcode, price: product.price.toString(), source: 'store' })} className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition-colors">
                        <ShoppingCart className="w-4 h-4" />
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
