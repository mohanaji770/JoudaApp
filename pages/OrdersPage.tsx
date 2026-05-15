import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Heart,
  ShoppingCart,
  Calendar,
  Repeat,
  ChevronLeft,
  Trash2,
  Clock,
  MapPin,
  Phone,
  Truck,
  Store,
  AlertCircle,
  X,
} from 'lucide-react';
import { getCompletedOrders, deleteCompletedOrder, CompletedOrder } from '../services/db';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getCachedProducts, getCachedProductByBarcode } from '../services/db';
import { Product } from '../services/supabaseService';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCartWithBarcode, addToCart } = useCart();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'favorites'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [repeatingOrder, setRepeatingOrder] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedOrders, allProducts] = await Promise.all([
          getCompletedOrders(),
          getCachedProducts(),
        ]);
        setOrders(savedOrders);

        // Load favorite products
        if (favorites.length > 0) {
          const favProducts = allProducts.filter((p) => favorites.includes(p.id));
          setFavoriteProducts(favProducts);
        }
      } catch (e) {
        console.error('Failed to load orders', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [favorites]);

  const handleRepeatOrder = async (order: CompletedOrder) => {
    setRepeatingOrder(order.id);

    try {
      const allProducts = await getCachedProducts();
      let addedCount = 0;

      for (const item of order.items) {
        // Try to find product by barcode first
        let product = allProducts.find((p) => p.barcode === item.product_barcode);

        if (product) {
          addToCartWithBarcode({
            name: product.name,
            barcode: product.barcode,
            price: product.price.toString(),
            source: 'store',
          });
        } else {
          // Fallback: add by name only
          addToCart(item.product_name, 'store');
        }
        addedCount++;
      }

      // Navigate to cart after a short delay
      setTimeout(() => {
        setRepeatingOrder(null);
        navigate('/products', { state: { openCart: true } });
      }, 800);
    } catch (e) {
      setRepeatingOrder(null);
      console.error('Failed to repeat order', e);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteCompletedOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      console.error('Failed to delete order', e);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-12 animate-fade-in px-4 w-full max-w-3xl mx-auto">
      {/* Header — generous breathing room */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">طلباتي</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {orders.length} طلب مكتمل
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-10 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          الطلبات ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'favorites'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Heart className="w-4 h-4" />
          المفضلة ({favorites.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد طلبات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                اطلب الآن وستظهر طلباتك هنا
              </p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                {/* Order Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg font-black text-brand-600">
                          {order.orderNumber || `#${order.id.slice(-4)}`}
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                          مكتمل
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {order.items.length} منتج
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="حذف الطلب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                      {order.orderType === 'delivery' ? (
                        <Truck className="w-3 h-3" />
                      ) : (
                        <Store className="w-3 h-3" />
                      )}
                      {order.orderType === 'delivery' ? 'توصيل' : 'استلام'}
                    </span>
                    {order.customerAddress && (
                      <span className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-gray-600 dark:text-gray-300">
                        <MapPin className="w-3 h-3" />
                        {order.customerAddress}
                      </span>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      المجموع: {formatPrice(order.total)} ر.س
                    </span>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      {expandedOrder === order.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-700/30">
                    <div className="space-y-2 mb-5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-xs font-bold flex items-center justify-center">
                              {item.quantity}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white font-medium">
                              {item.product_name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.unit_price * item.quantity)} ر.س
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-xl mb-5">
                        <span className="font-bold">ملاحظات:</span> {order.notes}
                      </p>
                    )}

                    <button
                      onClick={() => handleRepeatOrder(order)}
                      disabled={repeatingOrder === order.id}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 text-white rounded-2xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
                    >
                      {repeatingOrder === order.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <Repeat className="w-4 h-4" />
                          تكرار الطلب
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد مفضلات</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                اضغط على القلب بجانب أي منتج لإضافته للمفضلة
              </p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favoriteProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm group"
                >
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-500 hover:scale-110 transition-transform shadow-sm"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-brand-600">
                        {product.price} ر.س
                      </span>
                      <button
                        onClick={() =>
                          addToCartWithBarcode({
                            name: product.name,
                            barcode: product.barcode,
                            price: product.price.toString(),
                            source: 'store',
                          })
                        }
                        className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition-colors"
                      >
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
