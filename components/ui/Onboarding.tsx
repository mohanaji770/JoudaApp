
import React, { useState } from 'react';
import { ScanBarcode, Store, HeartHandshake, ArrowLeft, Check, X, ChefHat, Sparkles } from 'lucide-react';
import { useScrollLock } from '../../hooks/index';

interface OnboardingProps {
  onClose: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  // Lock body scroll when onboarding is open
  useScrollLock(true);

  const steps = [
    {
      title: "لست وحدك في رحلة السيلياك 🤍",
      desc: "قد تكون البداية صعبة: هل هذا المنتج آمن؟ ماذا أطبخ اليوم؟ لهذا صممنا تطبيق جودة ليكون رفيقك الدائم.",
      icon: <HeartHandshake className="w-20 h-20 text-brand-600" />
    },
    {
      title: "نتيجة فورية وواضحة 🔍",
      desc: "وجّه كاميرا هاتفك إلى أي منتج، ويخبرك جودة فوراً: آمن أو يحتوي على جلوتين. قرارك أصبح أسهل من أي وقت مضى.",
      icon: <ScanBarcode className="w-20 h-20 text-brand-600" />
    },
    {
      title: "اطبخ أشهى الوصفات 👨‍🍳",
      desc: "وصفات مجرّبة تناسب كل الأذواق، من العصيد إلى الكيك.. استمتع بأكلك بدون حرمان.",
      icon: <ChefHat className="w-20 h-20 text-brand-600" />
    },
    {
      title: "تسوق بضمان 100% 🛒",
      desc: "كل المنتجات في متجرنا مضمونة وخالية من الجلوتين. ابدأ حياتك بلا قلق لأنك تستحق السعادة.",
      icon: <Store className="w-20 h-20 text-brand-600" />
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-warm-white dark:bg-gray-900 flex flex-col animate-fade-in">
      
      {/* Top Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Skip Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 left-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-4 py-2 text-sm font-bold bg-white/60 dark:bg-gray-800/60 rounded-full backdrop-blur-md shadow-sm transition-all"
        >
          تخطي
        </button>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-md">
          <div className="w-44 h-44 bg-brand-50 dark:bg-brand-900/10 rounded-full flex items-center justify-center mb-10 animate-bounce-in shadow-inner border-[10px] border-white dark:border-gray-800 transition-all duration-300">
            {steps[step].icon}
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-5 leading-tight tracking-tight">
            {steps[step].title}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[16px] font-bold px-4">
            {steps[step].desc}
          </p>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-8 pb-12 bg-white dark:bg-gray-900 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-none border-t border-gray-100 dark:border-gray-800 rounded-t-[2.5rem]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Indicators */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-brand-600 shadow-sm shadow-brand-200' : 'w-2.5 bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNext}
            className="bg-brand-600 hover:bg-brand-700 text-white px-8 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-none transition-transform active:scale-95 gap-3 font-bold text-lg"
          >
            <span>{step === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}</span>
            {step === steps.length - 1 ? <Check className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

    </div>
  );
};
