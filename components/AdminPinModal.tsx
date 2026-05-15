import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      setShowPin(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 4) {
      setError('الرجاء إدخال الرمز المكون من 4 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('app_settings')
        .select('admin_pin')
        .eq('id', 1)
        .single();

      if (dbError) throw dbError;

      if (data?.admin_pin === pinString) {
        localStorage.setItem('admin_session', 'true');
        onSuccess();
      } else {
        setError('الرمز غير صحيح');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gray-900 dark:bg-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            <span className="text-white font-bold text-sm">دخول المشرف</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
            أدخل الرمز السري للوصول كمشرف
          </p>

          {/* PIN Inputs */}
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, index) => (
              <div key={index} className="relative">
                <input
                  ref={el => inputRefs.current[index] = el}
                  type={showPin ? 'text' : 'password'}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  className="w-14 h-14 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          {/* Show/Hide Toggle */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-2 mx-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}</span>
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-brand-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحقق...
              </span>
            ) : (
              'تأكيد'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
