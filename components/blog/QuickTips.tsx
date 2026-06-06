import React from 'react';
import { ShieldAlert, ChefHat, ScanLine, UtensilsCrossed } from 'lucide-react';

export const QuickTips: React.FC = () => {
  const tips = [
    {
      id: 1,
      title: "المصادر الخفية",
      content: "انتبه من مكعبات المرق، الصويا صوس، واللحوم المصنعة مثل المرتديلا، فهي غالباً تحتوي على القمح كمكثف.",
      icon: <ScanLine className="w-6 h-6 text-purple-500" />,
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-100 dark:border-purple-900/30"
    },
    {
      id: 2,
      title: "خطر التلوث",
      content: "في المطاعم، اسأل دائماً عن زيت القلي. البطاطس المقلية في نفس زيت البروستد أو المعجنات غير آمنة.",
      icon: <UtensilsCrossed className="w-6 h-6 text-orange-500" />,
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-100 dark:border-orange-900/30"
    },
    {
      id: 3,
      title: "مصطلحات غامضة",
      content: "احذر من \"نشاء معدل\" أو \"نكهات طبيعية\" إذا لم يذكر المصدر بوضوح، فقد تكون مشتقة من القمح.",
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-900/30"
    },
    {
      id: 4,
      title: "أدوات المطبخ",
      content: "الجلوتين يلتصق! خصص محمصة خبز ومصفاة ولوح تقطيع خاص بك، فهذه الأدوات يصعب تنظيفها تماماً.",
      icon: <ChefHat className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-900/30"
    }
  ];

  return (
    <div className="w-full mt-8 animate-fade-in overflow-hidden">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-lg">
           <ShieldAlert className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">نصائح هامة لسلامتك</h3>
      </div>
      
      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-3 snap-x snap-mandatory hide-scrollbar">
        {tips.map((item) => (
          <div 
            key={item.id} 
            className={`min-w-[240px] w-[240px] snap-center bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border ${item.border} flex flex-col transition-all active:scale-[0.98] duration-300`}
          >
             {/* Icon Top */}
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4 shrink-0`}>
                {item.icon}
            </div>

            {/* Content Bottom */}
            <div className="flex-1 flex flex-col">
                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {item.content}
                </p>
            </div>
          </div>
        ))}
        
        {/* Spacer at the end */}
        <div className="w-2 shrink-0"></div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};