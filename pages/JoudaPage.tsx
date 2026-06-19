import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Quote, Star, ArrowUpRight, Instagram, Facebook, Globe, ShoppingBag, MessageCircle } from 'lucide-react';
import { STORE_CONFIG, APP_LOGO } from '../constants';
import { fetchFAQFromSupabase, FAQItem } from '../services/supabaseService';

export const JoudaPage: React.FC = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const whatsappLink = `https://api.whatsapp.com/send?phone=${STORE_CONFIG.PHONE.replace(/\D/g, '')}`;

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const data = await fetchFAQFromSupabase();
        setFaqs(data);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setIsLoadingFaqs(false);
      }
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
           نخبز بحب، عشان نرجع لك متعة الأكل اللذيذ والآمن الخالي تماماً من الجلوتين.
         </p>
      </div>

      <div className="space-y-8 md:space-y-10">
        
        {/* 2. Story */}
        <div className="bg-brand-50/40 dark:bg-brand-950/20 rounded-3xl p-8 md:p-10 border border-brand-100/20 dark:border-brand-900/10 shadow-sm">
           <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-full shrink-0 shadow-sm border border-brand-100/10">
                 <Quote className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">
                   "عشنا نفس التجربة.. <span className="text-brand-600">وعشان كذا صنعنا الحل"</span>
                 </h2>
                 <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-loose font-medium">
                   لما تشخّص أحد من عيلتنا بالسيلياك، عرفنا قد إيش صعب تلاقي أكل آمن ولذيذ بنفس الوقت. عشان كذا أسسنا «جودة».. لتكون مصدر ثقتك الأول للغذاء الآمن 100%. ما نبيعك مجرد منتجات، بنقدم لك نفس الأكل اللي نثق نأكله لأولادنا في بيوتنا.
                 </p>
              </div>
           </div>
        </div>

        {/* 3. Testimonials (Social Proof) */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl">ناس حبّتنا وجربتنا</h3>
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

        {/* 4. Primary CTA (Call to Action) - Swapped Above FAQ for Higher Conversion */}
        <div className="pt-2">
           <button
              onClick={() => navigate('/products')}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-brand-200 dark:shadow-none transition-all active:scale-[0.98] text-base"
           >
              <ShoppingBag className="w-5 h-5" />
              <span>تصفح المتجر وابدأ تسوقك الآن 🛒</span>
           </button>
        </div>

        {/* 5. FAQ */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">أسئلة شائعة وإجابات تهمّك</h3>
           <div className="max-w-2xl mx-auto space-y-2">
              {isLoadingFaqs ? (
                 [1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border border-gray-100 dark:border-gray-700 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                       <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                       <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
                    </div>
                 ))
              ) : faqs.length > 0 ? (
                 faqs.map((faq) => (
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
                 ))
              ) : (
                 <p className="text-center text-sm text-gray-400 py-4">ما في أسئلة شائعة حالياً، بس تقدر تسألنا مباشرة على الواتساب! 💬</p>
              )}
           </div>
        </div>

        {/* 6. Contact Channels (Secondary Exit Actions) */}
        <div className="space-y-3 pt-2">
           <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                 <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                 <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-700">تواصل معنا واتساب</span>
                 <span className="text-xs text-gray-500 truncate block">لأي استفسار أو طلب خاص بخاطرك</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-green-500" />
           </a>

           <a href={STORE_CONFIG.MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                 <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                 <span className="block text-sm font-bold text-gray-900 dark:text-white">شرفنا في مقرنا</span>
                 <span className="text-xs text-gray-500 truncate block">{STORE_CONFIG.ADDRESS} (نسعد بلقائك!)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
           </a>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center pb-4">
           <div className="flex items-center justify-center gap-3 mb-4">
              <a href="https://www.facebook.com/joudafood" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://www.instagram.com/joudafood/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-center transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href={STORE_CONFIG.URL} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"><Globe className="w-5 h-5" /></a>
           </div>
           <p className="text-xs font-bold text-gray-400 dark:text-gray-500">© 2024 عالم جودة. صُنع بكل حب لتسهيل حياتك الخالية من الجلوتين.</p>
        </div>

      </div>
    </div>
  );
};
