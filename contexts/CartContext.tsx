
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORE_CONFIG } from '../constants';
import { submitOrderToSupabase } from '../services/supabaseService';

export interface CartItem {
  id: string;
  barcode?: string;
  name: string;
  quantity: number;
  price?: string; 
  source: 'store' | 'bakery';
}

interface CartContextType {
  items: CartItem[];
  addToCart: (name: string, source?: 'store' | 'bakery', barcode?: string, price?: string) => void;
  addToCartWithBarcode: (item: { name: string; barcode: string; price?: string; source?: 'store' | 'bakery' }) => void;
  addMultipleToCart: (names: string[], source?: 'store' | 'bakery') => void;
  decreaseQuantity: (id: string) => void;
  decreaseQuantityByName: (name: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  sendOrderToWhatsApp: (name?: string, address?: string, notes?: string) => void;
  submitOrderToSystem: (payload: {
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    order_type: 'delivery' | 'pickup';
    branch_id?: string;
    payment_method: string;
    notes?: string;
    subtotal: number;
    delivery_fee: number;
  }) => Promise<{ success: boolean; quotation_id?: string; message: string }>;
  totalItems: number;
  getItemQuantity: (name: string) => number;
  lastAddedItem: string | null; // For triggering notifications
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('jouda_cart_v2');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jouda_cart_v2', JSON.stringify(items));
  }, [items]);

  // Helper to trigger notification
  const triggerNotification = (name: string) => {
    setLastAddedItem(name);
    // Reset after a short delay so the same item can trigger it again later if needed
    setTimeout(() => setLastAddedItem(null), 2000);
  };

  const addToCart = (name: string, source: 'store' | 'bakery' = 'store', barcode?: string, price?: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.name === name);
      if (existing) {
        return prev.map((item) =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: Date.now().toString() + Math.random(), name, barcode, price, quantity: 1, source }];
    });
    triggerNotification(name);
  };

  const addToCartWithBarcode = (item: { name: string; barcode: string; price?: string; source?: 'store' | 'bakery' }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        id: Date.now().toString() + Math.random(),
        name: item.name,
        barcode: item.barcode,
        price: item.price,
        quantity: 1,
        source: item.source || 'store'
      }];
    });
    triggerNotification(item.name);
  };

  const addMultipleToCart = (names: string[], source: 'store' | 'bakery' = 'store') => {
    setItems((prev) => {
      let newItems = [...prev];
      names.forEach(name => {
        if (!name) return;
        const existingIndex = newItems.findIndex(item => item.name === name);
        if (existingIndex > -1) {
          newItems[existingIndex] = { 
            ...newItems[existingIndex], 
            quantity: newItems[existingIndex].quantity + 1 
          };
        } else {
          newItems.push({ 
            id: Date.now().toString() + Math.random(), 
            name: name, 
            quantity: 1,
            source
          });
        }
      });
      return newItems;
    });
    // Trigger notification for the first item or a generic message
    if (names.length > 0) triggerNotification("مجموعة منتجات");
  };

  const decreaseQuantity = (id: string) => {
    setItems((prev) => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const decreaseQuantityByName = (name: string) => {
    setItems((prev) => {
      return prev.map(item => {
        if (item.name === name) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getItemQuantity = (name: string) => {
    const item = items.find(i => i.name === name);
    return item ? item.quantity : 0;
  };

  const sendOrderToWhatsApp = (name?: string, address?: string, notes?: string) => {
    if (items.length === 0) return;

    const storeItems = items.filter(i => i.source === 'store' || !i.source);
    const bakeryItems = items.filter(i => i.source === 'bakery');

    let message = `*طلب جديد من تطبيق جودة* 🛍️\n\n`;
    
    if (name) message += `👤 *الاسم الكريم:* ${name}\n`;
    if (address) message += `📍 *العنوان / الاستلام:* ${address}\n`;
    
    message += `\n------------------\n`;
    
    if (storeItems.length > 0) {
      message += `*🛒 طلبات المتجر:*\n`;
      storeItems.forEach((item) => {
        message += `- ${item.name} *(العدد: ${item.quantity})*\n`;
      });
      message += `\n`;
    }

    if (bakeryItems.length > 0) {
      message += `*🧁 طلبات المخبز:*\n`;
      bakeryItems.forEach((item) => {
        message += `- ${item.name} *(العدد: ${item.quantity})*\n`;
      });
      message += `\n`;
    }

    if (notes && notes.trim()) {
      message += `------------------\n`;
      message += `📝 *ملاحظات:* ${notes}\n`;
    }
    
    message += `------------------\n`;
    message += `يرجى تأكيد الطلب. شكراً!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  const submitOrderToSystem = async (payload: {
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    order_type: 'delivery' | 'pickup';
    branch_id?: string;
    payment_method: string;
    notes?: string;
    subtotal: number;
    delivery_fee: number;
  }) => {
    if (items.length === 0) {
      return { success: false, message: 'السلة فارغة' };
    }

    // Filter out items without barcode (fallback items)
    const validItems = items
      .filter((item) => item.barcode)
      .map((item) => ({
        product_barcode: item.barcode!,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: parseFloat(item.price || '0') || 0,
      }));

    if (validItems.length === 0) {
      return { success: false, message: 'لا يمكن إرسال الطلب: المنتجات لا تحتوي على باركود' };
    }

    const result = await submitOrderToSupabase({
      ...payload,
      items: validItems,
    });

    if (result.success) {
      clearCart();
    }

    return result;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addToCartWithBarcode,
        addMultipleToCart,
        decreaseQuantity,
        decreaseQuantityByName,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        sendOrderToWhatsApp,
        submitOrderToSystem,
        totalItems,
        getItemQuantity,
        lastAddedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
