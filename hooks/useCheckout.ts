import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { calculateDistance, calculateDeliveryFee } from '../utils/distanceUtils';

export const useCheckout = (
  items: any[], 
  cachedProducts: any[],
  sendOrderToWhatsApp: (name: string, address: string, notes: string) => void,
  submitOrderToSystem: (data: any) => Promise<any>
) => {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('jouda_customer_name') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('jouda_customer_address') || '');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState(() => localStorage.getItem('jouda_customer_phone') || '');
  
  // Map settings and location state
  const [storeLat, setStoreLat] = useState<number>(15.3980555);
  const [storeLng, setStoreLng] = useState<number>(44.2094444);
  const [pricePerKm, setPricePerKm] = useState<number>(150);
  
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNumber: string;
    quotationId: string;
    orderId?: string;
    total: number;
  } | null>(null);

  // Fetch store coordinates and delivery price per km on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings_public').select('store_latitude, store_longitude, delivery_price_per_km').eq('id', 1).single();
        if (data && !error) {
          setStoreLat(data.store_latitude ?? 15.3980555);
          setStoreLng(data.store_longitude ?? 44.2094444);
          setPricePerKm(data.delivery_price_per_km ?? 150);
        }
      } catch (e) {
        console.warn('Failed to fetch map settings', e);
      }
    };
    fetchSettings();
  }, []);

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

  const { currentFee, isFreeDelivery, distanceKm } = useMemo(() => {
    if (customerLat && customerLng) {
      const dist = calculateDistance(storeLat, storeLng, customerLat, customerLng);
      const isFar = dist > 20;
      const fee = isFar ? 0 : calculateDeliveryFee(dist, pricePerKm);
      return {
        currentFee: fee,
        isFreeDelivery: fee === 0,
        distanceKm: dist
      };
    }
    return {
      currentFee: 0,
      isFreeDelivery: true,
      distanceKm: 0
    };
  }, [customerLat, customerLng, storeLat, storeLng, pricePerKm]);

  const grandTotal = currentSubtotal + currentFee;
  const isFormValid = customerName.trim() !== '' && phone.trim() !== '' && address.trim() !== '' && customerLat !== null && customerLng !== null;

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
      alert('يرجى تعبئة الاسم الكريم، رقم الهاتف، عنوان التوصيل، وتحديد موقعك على الخريطة');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const isFar = distanceKm > 20;
      
      const result = await submitOrderToSystem({
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        customer_address: address,
        order_type: isFar ? 'shipping' : 'delivery',
        payment_method: 'CASH',
        notes: notes || undefined,
        subtotal: currentSubtotal,
        delivery_fee: isFar ? 0 : currentFee,
        latitude: customerLat,
        longitude: customerLng
      });

      if (result.success) {
        // Save form fields for auto-fill next time
        localStorage.setItem('jouda_customer_phone', phone.trim());
        localStorage.setItem('jouda_customer_name', customerName.trim());
        localStorage.setItem('jouda_customer_address', address.trim());

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
    setCustomerLat(null);
    setCustomerLng(null);
  };

  return {
    customerName, setCustomerName,
    address, setAddress,
    notes, setNotes,
    phone, setPhone,
    customerLat, setCustomerLat,
    customerLng, setCustomerLng,
    storeLat, storeLng, pricePerKm,
    submitting,
    submitResult,
    showSuccessModal, setShowSuccessModal,
    lastOrderDetails,
    currentSubtotal,
    totalSavings,
    currentFee,
    isFreeDelivery,
    distanceKm,
    grandTotal,
    isFormValid,
    isSaved,
    handleSendOrder,
    handleSubmitOrder,
    resetForm
  };
};

