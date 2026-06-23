import React, { useState } from 'react';
import { ScanBarcode, Store, HeartHandshake, ArrowLeft, Check, ChefHat } from 'lucide-react';
import { useScrollLock, useBackButton } from '../../hooks/index';

interface OnboardingProps {
  onClose: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  // Handle android back button
  useBackButton(true, onClose);

  // Lock body scroll when onboarding is open
  useScrollLock(true);

  const steps = [
    {
      title: "احنا معاك خطوة بخطوة",
      desc: "نعرف إن البداية صعبة والأسئلة كثيرة: هل هذا الأكل آمن؟ وإيش أطبخ اليوم؟ لهذا صممنا \"جوده\" ليكون رفيقك اليومي ويساعدك.",
      icon: <HeartHandshake className="w-16 h-16 text-brand-600 dark:text-brand-400" />
    },
    {
      title: "افحص أي منتج بثواني",
      desc: "صوّر مكونات أي منتج بكاميرا جوالك، وبسرعة بنقول لك إذا كان آمن وخالي من الجلوتين. قرارك صار أسهل بضغطة زر.",
      icon: <ScanBarcode className="w-16 h-16 text-brand-600 dark:text-brand-400" />
    },
    {
      title: "وصفات لذيذة وبلا حرمان",
      desc: "تصفح مئات الوصفات المضمونة والمجربة الخالية من الجلوتين، من الأكلات الشعبية للحلويات والكيك. عيش حياتك واستمتع بأكلك المفضل.",
      icon: <ChefHat className="w-16 h-16 text-brand-600 dark:text-brand-400" />
    },
    {
      title: "كل مقاضيك مضمونة وآمنة",
      desc: "وفرنا لك متجر متكامل فيه كل المنتجات والمقاضي الخالية من الجلوتين بضمان وفحص دقيق. تسوق وأنت مرتاح البال وبلا أي قلق.",
      icon: <Store className="w-16 h-16 text-brand-600 dark:text-brand-400" />
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
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col animate-fade-in">
      
      {/* Top Header */}
      <div className="flex justify-between items-center p-6 w-full max-w-md mx-auto">
        <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
           <span className="text-brand-600 font-black text-xs">جوده</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-bold transition-colors"
        >
          تخطي
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-8 w-full max-w-md mx-auto relative">
        <div className="absolute top-1/4 right-8 w-32 h-32 bg-brand-200/30 dark:bg-brand-900/10 rounded-full blur-3xl -z-10" />
        
        {/* Animated Icon Container */}
        <div 
          key={`icon-${step}`}
          className="w-28 h-28 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-up"
        >
          {steps[step].icon}
        </div>
        
        {/* Texts */}
        <div key={`text-${step}`} className="animate-slide-up text-right">
          <h2 className="text-[28px] font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
            {steps[step].title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-[1.8] text-[15px] font-bold">
            {steps[step].desc}
          </p>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-6 pb-10 w-full max-w-md mx-auto flex flex-col gap-8 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950">
        
        {/* Progress Dots */}
        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-brand-600' : 'w-2 bg-gray-200 dark:bg-gray-800'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className="w-full bg-gray-900 dark:bg-brand-600 text-white h-14 rounded-2xl flex items-center justify-center transition-transform active:scale-[0.98] gap-3 font-bold text-[16px] shadow-lg shadow-gray-200 dark:shadow-none"
        >
          <span>{step === steps.length - 1 ? 'ابدأ الآن' : 'التالي'}</span>
          {step === steps.length - 1 ? <Check className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
      </div>

    </div>
  );
};
