import { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════
   Delivery Constants & Configurations
   ═══════════════════════════════════════════════ */
export interface DeliveryZoneConfig {
  freeTarget: number;
  fee: number;
}

export const DELIVERY_CONFIG: Record<string, DeliveryZoneConfig> = {
  sanaa_near: { freeTarget: 20000, fee: 500 },
  sanaa_far: { freeTarget: 20000, fee: 1000 },
  provinces: { freeTarget: 40000, fee: 2000 },
};

/* ═══════════════════════════════════════════════
   useCheckout Hook
   ═══════════════════════════════════════════════ */
export const useCheckout = (
  items: any[], 
  cachedProducts: any[],
  sendOrderToWhatsApp: (name: string, address: string, notes: string) => void,
  submitOrderToSystem: (data: any) => Promise<any>
) => {
  const [deliveryZone, setDeliveryZone] = useState(() => localStorage.getItem('jouda_delivery_zone') || 'sanaa_near');
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('jouda_customer_name') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('jouda_customer_address') || '');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(() => localStorage.getItem('jouda_customer_phone') || '');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNumber: string;
    quotationId: string;
    orderId?: string;
    total: number;
  } | null>(null);

  // ── Computed Values ──
  const currentSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price || '0') || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [items]);

  const totalSavings = useMemo(() => {
    return items.reduce((sum, item) => {
      const matchedProduct = cachedProducts.find(p => p.barcode === item.barcode || p.name === item.name);
      const isPackage = item.barcode?.startsWith('PKG-') || matchedProduct?.category === 'عروض وبكجات';
      const bundleItems = matchedProduct?.bundle_items || [];
      
      if (isPackage && bundleItems.length > 0) {
        const regularTotal = bundleItems.reduce((bSum: number, bItem: any) => {
          const compProd = cachedProducts.find(p => p.barcode === bItem.barcode);
          const compPrice = compProd ? compProd.price : 0;
          return bSum + (compPrice * bItem.quantity);
        }, 0);
        const pkgPrice = parseFloat(item.price || '0') || 0;
        if (regularTotal > pkgPrice) {
          return sum + ((regularTotal - pkgPrice) * item.quantity);
        }
      }
      return sum;
    }, 0);
  }, [items, cachedProducts]);

  const { currentFee, isFreeDelivery } = useMemo(() => {
    return {
      currentFee: 0,
      isFreeDelivery: true
    };
  }, []);

  const grandTotal = currentSubtotal + currentFee;
  const isFormValid = customerName.trim() !== '' && phone.trim() !== '' && address.trim() !== '';

  const config = DELIVERY_CONFIG[deliveryZone] || DELIVERY_CONFIG.sanaa_near;
  const deliveryProgress = 100;
  const deliveryRemaining = 0;

  const isSaved = (key: string, val: string) => !!val && localStorage.getItem(key) === val;

  // ── Handlers ──
  const handleSendOrder = () => {
    if (!customerName.trim() || !address.trim()) {
      alert('يرجى تعبئة الاسم الكريم وعنوان التوصيل');
      return;
    }
    sendOrderToWhatsApp(customerName, address, notes);
  };

  const handleSubmitOrder = async (onSuccess: () => void) => {
    if (!isFormValid) {
      alert('يرجى تعبئة الاسم الكريم، رقم الهاتف، وعنوان التوصيل');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await submitOrderToSystem({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_address: address,
        order_type: 'delivery',
        payment_method: 'CASH',
        notes: notes || undefined,
        subtotal: currentSubtotal,
        delivery_fee: currentFee,
      });

      if (result.success) {
        // Save form fields for auto-fill next time
        localStorage.setItem('jouda_customer_phone', phone.trim());
        localStorage.setItem('jouda_customer_name', customerName.trim());
        localStorage.setItem('jouda_customer_address', address.trim());
        localStorage.setItem('jouda_delivery_zone', deliveryZone);

        setLastOrderDetails({
          orderNumber: result.order_number || result.quotation_id || '',
          quotationId: result.quotation_id || '',
          orderId: result.order_id,
          total: currentSubtotal + currentFee,
        });
        
        onSuccess();
        setTimeout(() => setShowSuccessModal(true), 300);
      } else {
        setSubmitResult({ success: false, message: result.message });
      }
    } catch (e: any) {
      setSubmitResult({ success: false, message: e.message || 'فشل إرسال الطلب' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setAddress('');
    setNotes('');
  };

  return {
    deliveryZone, setDeliveryZone,
    customerName, setCustomerName,
    address, setAddress,
    notes, setNotes,
    phone, setPhone,
    submitting,
    submitResult,
    showSuccessModal, setShowSuccessModal,
    lastOrderDetails,
    currentSubtotal,
    totalSavings,
    currentFee,
    isFreeDelivery,
    grandTotal,
    isFormValid,
    deliveryProgress,
    deliveryRemaining,
    isSaved,
    handleSendOrder,
    handleSubmitOrder,
    resetForm
  };
};
