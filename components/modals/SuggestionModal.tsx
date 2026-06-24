import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Lightbulb, FileText, Star } from 'lucide-react';
import { STORE_CONFIG } from '../../constants';
import { useBackButton } from '../../hooks';

interface SuggestionModalProps {
  onClose: () => void;
}

type MessageType = 'اقتراح' | 'ملاحظة' | 'مشكلة تقنية' | 'استفسار';

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ onClose }) => {
  useBackButton(true, onClose);

  const [messageType, setMessageType] = useState<MessageType>('اقتراح');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = () => {
    if ((!message.trim() && rating === 0) || isSending) return;
    setIsSending(true);

    let text = `*💡 ${messageType} جديد من متجر جوده*\n\n`;
    
    if (rating > 0) {
      text += `⭐ التقييم: ${rating}/5\n\n`;
    }
    
    text += `📝 الرسالة:\n${message.trim() || 'لم يكتب رسالة'}`;

    // Add device info
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    text += `\n\n---\n📱 الجهاز: ${isMobile ? 'Mobile' : 'Desktop'}`;

    const encodedMessage = encodeURIComponent(text);
    const phone = STORE_CONFIG.PHONE.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    setTimeout(() => {
      window.open(url, '_blank');
      onClose();
    }, 600);
  };

  const types: MessageType[] = ['اقتراح', 'ملاحظة', 'مشكلة تقنية', 'استفسار'];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scale-in border border-gray-200 dark:border-gray-800">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100 dark:border-blue-900/30">
            <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">نحب نسمع رأيك 💙</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            عندك فكرة، اقتراح، أو شيء تتمنى تحسينه؟ شاركنا.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 mr-1">نوع الرسالة:</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors ${
                    messageType === type 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 mr-1">تقييمك للمتجر (اختياري):</label>
            <div className="flex items-center gap-2 justify-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 transition-transform hover:scale-110 active:scale-95 ${
                    rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  <Star className="w-8 h-8" fill={rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white resize-none placeholder-gray-400"
                placeholder="اكتب رسالتك هنا..."
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={(!message.trim() && rating === 0) || isSending}
            className="w-full bg-whatsapp hover:bg-whatsapp-hover disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none transition-all active:scale-[0.98] mt-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{isSending ? 'لحظات...' : 'إرسال عبر واتساب'}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
