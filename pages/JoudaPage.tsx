
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, ChevronDown, Quote, Star, ArrowUpRight, Instagram, Facebook, Globe } from 'lucide-react';
import { STORE_CONFIG, APP_LOGO } from '../constants';
import { fetchFAQFromSupabase, FAQItem } from '../services/supabaseService';

export const JoudaPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${STORE_CONFIG.PHONE.replace(/\D/g, '')}`;

  useEffect(() => {
    const loadFaqs = async () => {
      const data = await fetchFAQFromSupabase();
      setFaqs(data);
    };
    loadFaqs();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const TESTIMONIALS = [
    {
      id: 1,
      name: "Ashley Muharram",
      image: "https://lh3.googleusercontent.com/a/ACg8ocJM-X5iJ1aNKpsmDDWvB1qKf9mc7dPXlS6ebeI3oLVzVTJtwQ=s120-c-rp-mo-br100",
      time: "قبل 4 أشهر",
      text: "متجر جودة من أوائل المتاجر التي ساعدتنا كسيلياكيين، وفروا لنا أشياء كنا فعلاً نحتاجها ومابخلو علينا بأي معلومة."
    },
    {
      id: 2,
      name: "Really Ali Abdo",
      image: "https://lh3.googleusercontent.com/a/ACg8ocKX90ddwtzLPDL4dKLXgOAESZWXZlKgUPdvTG_x8t-VYixxeA=s120-c-rp-mo-br100",
      time: "قبل 3 أشهر",
      text: "متجر جودة شكراً كثير لكم. وفرتم لنا الراحة والأمان في خياراتنا الغذائية."
    },
    {
      id: 3,
      name: "قصي الماوري",
      image: "https://lh3.googleusercontent.com/a/ACg8ocI5fpjHxdtVpYOnMylOVNKfFzAnLgqxFitqYYZpRHsscdNfHQ=s120-c-rp-mo-br100",
      time: "قبل 4 أشهر",
      text: "كل شي كنت محروم منه حصلته عندهم، دقيق ومخبوزات. تعامل راقي وأخلاق عالية."
    }
  ];

  return (
    <div className="pb-32 md:pb-12 animate-fade-in px-4 w-full max-w-3xl mx-auto">
      
      {/* 1. Header */}
      <div className="text-center py-8 md:py-12">
         <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-6">
             <div className="absolute inset-0 bg-brand-400 dark:bg-brand-500 blur-2xl opacity-20 dark:opacity-30 rounded-full"></div>
             <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl ring-4 ring-white dark:ring-gray-800">
                <img src={APP_LOGO} alt="Jouda" className="w-full h-full object-cover" />
             </div>
         </div>
         <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{STORE_CONFIG.NAME}</h1>
         <p className="text-base text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
           نخبز ونصنع بحب، لنعيد لك متعة الأكل الآمن والخالي تماماً من الجلوتين.
         </p>
      </div>

      <div className="space-y-8 md:space-y-10">
        
        {/* 2. Story */}
        <div className="bg-orange-50/80 dark:bg-orange-900/10 rounded-[2rem] p-8 md:p-10 border-none shadow-inner">
           <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shrink-0 shadow-sm">
                 <Quote className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">
                   "لأننا عشنا التجربة.. <span className="text-brand-600">صنعنا الحل"</span>
                 </h2>
                 <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-loose font-medium">
                   حين تم تشخيص أحد أفراد عائلتنا بالسيلياك، أدركنا ندرة الخيارات الآمنة واللذيذة معاً. لذلك أسسنا "جودة".. لتكون مصدر ثقتك الأول للغذاء الآمن 100%. نحن لا نبيع منتجات تجارية، بل نقدم لك ما نثق بإطعامه لأبنائنا في بيوتنا.
                 </p>
              </div>
           </div>
        </div>

        {/* 3. Contact */}
        <div className="space-y-3">
           <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                 <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                 <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-700">واتساب</span>
                 <span className="text-xs text-gray-500 truncate block">محادثة فورية</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
           </a>

           <a href={STORE_CONFIG.MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                 <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                 <span className="block text-sm font-bold text-gray-900 dark:text-white">موقع المتجر</span>
                 <span className="text-xs text-gray-500 truncate block">{STORE_CONFIG.ADDRESS}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
           </a>
        </div>

        {/* 4. Testimonials */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl">آراء العملاء</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800">
                 <Star className="w-3.5 h-3.5 fill-current" />
                 <span className="text-xs font-bold">5.0</span>
              </div>
           </div>
           <div className="space-y-4">
              {TESTIMONIALS.map((review) => (
                 <div key={review.id} className="relative overflow-hidden bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <Quote className="absolute top-2 left-2 w-16 h-16 text-gray-100 dark:text-gray-700 opacity-50 z-0 rotate-180" />
                    <img src={review.image} alt={review.name} className="w-12 h-12 rounded-full shrink-0 relative z-10 border-2 border-white dark:border-gray-700 shadow-sm" />
                    <div className="flex-1 min-w-0 relative z-10">
                       <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">{review.name}</h4>
                          <span className="text-xs text-gray-400">{review.time}</span>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">"{review.text}"</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* 5. FAQ */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">الأسئلة الشائعة</h3>
           <div className="max-w-2xl mx-auto space-y-2">
              {faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden bg-warm-50 dark:bg-gray-700/30">
                     <button 
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={openFaqId === faq.id}
                        className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                     >
                       <span className={`font-bold text-sm ${openFaqId === faq.id ? 'text-brand-600' : 'text-gray-700 dark:text-gray-200'}`}>
                          {faq.question}
                       </span>
                       <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openFaqId === faq.id ? 'rotate-180 text-brand-600' : ''}`} />
                     </button>
                     <div className={`grid transition-all duration-300 ease-in-out ${openFaqId === faq.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                           <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed px-4 pb-4 pt-0">
                              {faq.answer}
                           </p>
                        </div>
                     </div>
                 </div>
              ))}
           </div>
        </div>

         {/* Footer */}
         <div className="pt-6 text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
               <a href="https://www.facebook.com/joudafood" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-colors"><Facebook className="w-5 h-5" /></a>
               <a href="https://www.instagram.com/joudafood/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-center transition-colors"><Instagram className="w-5 h-5" /></a>
               <a href={STORE_CONFIG.URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"><Globe className="w-5 h-5" /></a>
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500">© 2024 عالم جودة. صُنع بحرص وحب لكل من يبحث عن حياة خالية من الجلوتين.</p>
        </div>

      </div>
    </div>
  );
};
