import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Lightbulb, FileText, Star, Send, CheckCircle2 } from 'lucide-react';
import { STORE_CONFIG } from '../../constants';
import { useBackButton } from '../../hooks';

interface SuggestionModalProps {
  onClose: () => void;
}

type Step = 'INPUT' | 'PREVIEW' | 'MAPS_OPENED';

const NEGATIVE_REASONS = ['الشحن بطيء 🚚', 'الأسعار مرتفعة 💰', 'المنتج مختلف 📦', 'مشكلة بالموقع 💻', 'خدمة العملاء 🎧', 'أخرى ❓'];
const POSITIVE_REASONS = ['جودة المنتجات ✨', 'سرعة التوصيل 🚀', 'الأسعار المعقولة 💸', 'سهولة الطلب 📱', 'خدمة العملاء 🤝'];
const STORAGE_KEY = 'jouda_feedback_draft';

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ onClose }) => {
  useBackButton(true, onClose);

  const [step, setStep] = useState<Step>('INPUT');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Analytics helper
  const trackEvent = (eventName: string, data?: any) => {
    console.log(`[Analytics Event]: ${eventName}`, data);
  };

  useEffect(() => {
    trackEvent('modal_opened');
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rating || parsed.message || parsed.selectedReasons?.length) {
          setRating(parsed.rating || 0);
          setMessage(parsed.message || '');
          setSelectedReasons(parsed.selectedReasons || []);
          setHasDraft(true);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (rating > 0 || message || selectedReasons.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rating, message, selectedReasons }));
    }
  }, [rating, message, selectedReasons]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
  };

  const handleClose = () => {
    trackEvent('modal_closed', { step, rating });
    onClose();
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleRatingChange = (newRating: number) => {
    if (rating !== newRating) {
      setRating(newRating);
      setSelectedReasons([]); // reset reasons on rating change
      trackEvent('rating_selected', { rating: newRating });
    }
  };

  const isInputValid = () => {
    const len = message.trim().length;
    if (rating > 0 && rating <= 3) return selectedReasons.length > 0 || len >= 5;
    if (rating >= 4) return selectedReasons.length > 0 || len > 0;
    return len > 0; // rating 0
  };

  const buildMessageText = () => {
    let text = `💡 ملاحظة جديدة من العميل\n\n`;
    if (rating > 0) text += `⭐ التقييم: ${rating}/5\n\n`;
    
    if (selectedReasons.length > 0) {
      text += `📌 ${rating >= 4 ? 'أعجبه:' : 'المشكلة:'}\n`;
      text += selectedReasons.map(r => `- ${r}`).join('\n') + '\n\n';
    }

    if (message.trim()) {
      text += `📝 تفاصيل إضافية:\n${message.trim()}\n\n`;
    }
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    text += `📱 الجهاز: ${isMobile ? 'Mobile' : 'Desktop'}`;
    return text;
  };

  const openWhatsApp = () => {
    setIsSending(true);
    trackEvent('whatsapp_clicked', { rating, reasons: selectedReasons });
    
    const text = buildMessageText();
    const encodedMessage = encodeURIComponent(text);
    const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    setTimeout(() => {
      window.open(url, '_blank');
      clearDraft();
      onClose();
    }, 600);
  };

  const openGoogleMaps = () => {
    trackEvent('google_clicked', { rating });
    window.open(STORE_CONFIG.MAP_URL, '_blank');
    setStep('MAPS_OPENED');
  };

  const handleGooglePostAction = (wroteReview: boolean) => {
    trackEvent('google_review_completed', { wroteReview });
    clearDraft();
    onClose();
  };

  const getDynamicTitle = () => {
    switch (rating) {
      case 1: return "واضح إن تجربتك كانت سيئة، إيش أكثر شي أزعجك؟";
      case 2: return "نعتذر عن هالتجربة، ساعدنا نفهم المشكلة.";
      case 3: return "شكراً لك، إيش اللي يمنعنا من 5 نجوم؟";
      case 4: return "يسعدنا رضاك! إيش أكثر شي عجبك، وهل فيه شي نطوره؟";
      case 5: return "شكراً لك 💙 تقييمك يساعدنا نكبر. تحب تشارك تجربتك مع الباقين؟";
      default: return "كيف كانت تجربتك معنا؟ (اختياري)";
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto pr-1 -mr-1 no-scrollbar flex-1">
          {step === 'INPUT' && (
            <>
              {hasDraft && rating === 0 && message === '' && selectedReasons.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-xs rounded-xl border border-yellow-200 dark:border-yellow-800/50 flex justify-between items-center">
                  <span>عندك رسالة غير مكتملة، تحب تكملها؟</span>
                  <button onClick={clearDraft} className="underline font-bold">لا، احذفها</button>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/30">
                  <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">نحب نسمع رأيك 💙</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-center text-gray-700 dark:text-gray-300 mb-3">
                    {getDynamicTitle()}
                  </label>
                  <div className="flex items-center gap-2 justify-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className={`p-1 transition-transform hover:scale-110 active:scale-95 ${
                          rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        <Star className="w-8 h-8" fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                {rating === 5 && (
                  <div className="animate-fade-in text-center">
                    <button
                      onClick={openGoogleMaps}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-[0.98] mb-4"
                    >
                      <Star className="w-5 h-5 fill-current" />
                      <span>قيّمنا على جوجل ماب 🌟</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                      <p className="text-xs text-gray-500 mb-2 font-bold">حاب تضيف رسالة خاصة أو اقتراح؟</p>
                    </div>
                  </div>
                )}

                {(rating > 0 && rating < 5) && (
                  <div className="animate-fade-in">
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {(rating <= 3 ? NEGATIVE_REASONS : POSITIVE_REASONS).map((reason) => (
                        <button
                          key={reason}
                          onClick={() => toggleReason(reason)}
                          className={`py-1.5 px-3 text-xs font-bold rounded-full border transition-colors ${
                            selectedReasons.includes(reason)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {rating !== 5 && rating > 0 && rating === 4 && (
                   <button
                     onClick={openGoogleMaps}
                     className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-4"
                   >
                     <span>قيّمنا على جوجل ماب 🌟</span>
                   </button>
                )}

                <div className="relative animate-fade-in">
                  <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={rating >= 4 ? 3 : 4}
                    className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white resize-none placeholder-gray-400"
                    placeholder={
                      rating === 0 ? "اكتب رسالتك أو اقتراحك هنا..." : 
                      rating < 4 ? "اكتب تفاصيل المشكلة (اختياري إذا اخترت من الأسباب فوق)" : 
                      "اكتب أي ملاحظة إضافية (اختياري)"
                    }
                  />
                </div>

                {isInputValid() && (
                  <button
                    onClick={() => setStep('PREVIEW')}
                    className="w-full bg-whatsapp hover:bg-whatsapp-hover text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none transition-all active:scale-[0.98] animate-scale-in"
                  >
                    <span>متابعة للواتساب</span>
                    <Send className="w-4 h-4 mr-1" />
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'PREVIEW' && (
            <div className="animate-fade-in flex flex-col h-full">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">شكل الرسالة قبل الإرسال 👀</h3>
              
              <div className="bg-[#E1F3FB] dark:bg-[#1A3636] p-4 rounded-xl mb-6 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap border border-blue-100 dark:border-gray-700 shadow-inner overflow-y-auto max-h-[40vh]">
                {buildMessageText()}
              </div>

              <div className="mt-auto space-y-3">
                <button
                  onClick={openWhatsApp}
                  disabled={isSending}
                  className="w-full bg-whatsapp hover:bg-whatsapp-hover disabled:bg-gray-400 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{isSending ? 'لحظات...' : 'تأكيد وإرسال'}</span>
                </button>
                <button
                  onClick={() => setStep('INPUT')}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  رجوع للتعديل
                </button>
              </div>
            </div>
          )}

          {step === 'MAPS_OPENED' && (
            <div className="animate-fade-in text-center py-6">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">تم فتح جوجل ✔</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">هل كتبت تقييماً بالفعل ورجعت للتطبيق؟</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGooglePostAction(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  نعم، قيّمتكم 💙
                </button>
                <button
                  onClick={() => handleGooglePostAction(false)}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  بقيّمكم لاحقاً
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
