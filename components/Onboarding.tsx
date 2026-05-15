
import React, { useState } from 'react';
import { ScanBarcode, Store, HeartHandshake, ArrowLeft, Check, X } from 'lucide-react';
import { useScrollLock } from '../hooks';

interface OnboardingProps {
  onClose: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  // Lock body scroll when onboarding is open
  useScrollLock(true);

  const steps = [
    {
      title: "حياة صحية، بدون حرمان",
      desc: "رفيقك الذكي لاختيار طعامك الخالي من الجلوتين بأمان، ثقة، وسهولة تامة.",
      icon: <HeartHandshake className="w-16 h-16 text-brand-600" />
    },
    {
      title: "افحص. تأكد. استمتع",
      desc: "صور المكونات أو اكتب اسم المنتج. ذكاء 'جودة' سيخبرك فوراً: هل هو آمن أم لا؟",
      icon: <ScanBarcode className="w-16 h-16 text-brand-600" />
    },
    {
      title: "البديل الألذ بانتظارك",
      desc: "وجدته غير آمن؟ لا تقلق! نوفر لك البديل الصحي والمخبوزات الطازجة بضغطة زر.",
      icon: <Store className="w-16 h-16 text-brand-600" />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-warm-white dark:bg-gray-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] min-h-0 animate-scale-in border border-white/20">
        
        {/* Skip Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
          <div className="w-32 h-32 bg-brand-50 dark:bg-brand-900/10 rounded-full flex items-center justify-center mb-8 animate-bounce-in ring-8 ring-brand-50/50 dark:ring-brand-900/20">
            {steps[step].icon}
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
            {steps[step].title}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm font-medium px-2">
            {steps[step].desc}
          </p>
        </div>

        {/* Footer Controls */}
        <div className="mt-10 flex items-center justify-between">
          {/* Indicators */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-brand-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button 
            onClick={handleNext}
            className="bg-gray-900 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            {step === steps.length - 1 ? <Check className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
        </div>

      </div>
    </div>
  );
};
