
import React, { useState } from 'react';
import { X, ChefHat, Clock, Flame, ChevronDown, ChevronUp, ShoppingBag, Plus } from 'lucide-react';
import { STORE_CONFIG } from '../../constants';
import { useCart } from '../../contexts/CartContext';

interface Recipe {
  id: string;
  title: string;
  description: string;
  time: string;
  difficulty: string;
  calories: string;
  mainProduct: string;
  ingredients: string[];
  steps: string[];
}

const RECIPES: Recipe[] = [
  {
    id: 'pizza',
    title: 'بيتزا المارجريتا الإيطالية',
    description: 'بيتزا خالية من الجلوتين بقوام مقرمش ومذاق أصلي باستخدام دقيق شار.',
    time: '30 دقيقة',
    difficulty: 'سهل',
    calories: '250 سعرة',
    mainProduct: 'دقيق شار (Mix B)',
    ingredients: [
      '2 كوب دقيق شار (Mix B)',
      '1 كوب ماء دافئ',
      '2 ملعقة زيت زيتون',
      '1 ملعقة خميرة فورية',
      'صلصة طماطم وجبنة موزاريلا'
    ],
    steps: [
      'اخلط الدقيق مع الخميرة والماء والزيت واعجن جيداً لمدة 5 دقائق.',
      'اترك العجينة تتخمر لمدة 20 دقيقة في مكان دافئ.',
      'افرد العجينة في صينية مدهونة بالزيت.',
      'أضف الصلصة والجبنة، واخبزها في فرن ساخن (220 درجة) لمدة 12 دقيقة.'
    ]
  },
  {
    id: 'arabic-bread',
    title: 'الخبز العربي المنفوخ',
    description: 'خبز الصاج الطري والمنفوخ المناسب للسندويشات باستخدام دقيق كريستال.',
    time: '45 دقيقة',
    difficulty: 'متوسط',
    calories: '180 سعرة',
    mainProduct: 'دقيق كريستال للخبز العربي',
    ingredients: [
      '3 أكواب دقيق كريستال',
      '1.5 كوب ماء دافئ',
      '1 ملعقة سكر',
      'رشة ملح',
      '1 ملعقة خميرة'
    ],
    steps: [
      'نشط الخميرة مع الماء والسكر لمدة 10 دقائق.',
      'أضف الدقيق والملح واعجن حتى تتماسك العجينة.',
      'قطع العجينة لكرات صغيرة واتركها ترتاح 15 دقيقة.',
      'افرد الكرات لدوائر رقيقة واخبزها على صاج ساخن جداً حتى تنتفخ.'
    ]
  },
  {
    id: 'sambousak',
    title: 'سبرينج رول (سمبوسة) مقرمشة',
    description: 'حشوة خضار أو لحم لذيذة ملفوفة بورق الأرز الفيتنامي.',
    time: '20 دقيقة',
    difficulty: 'سهل جداً',
    calories: '120 سعرة',
    mainProduct: 'ورق الأرز (Rice Paper)',
    ingredients: [
      '10 قطع ورق الأرز',
      'حشوة حسب الرغبة (لحم مفروم/خضار)',
      'ماء دافئ لترطيب الورق',
      'زيت للقلي'
    ],
    steps: [
      'غطس ورقة الأرز في الماء الدافئ لمدة 5 ثوانٍ فقط.',
      'ضع الحشوة في الطرف ولف الورقة بإحكام.',
      'يمكنك قليها في زيت غزير أو دهنها بالزيت وشويها في الفرن للقرمشة.'
    ]
  }
];

interface RecipesModalProps {
  onClose: () => void;
}

export const RecipesModal: React.FC<RecipesModalProps> = ({ onClose }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToCart } = useCart();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg h-[90vh] sm:h-[85vh] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col animate-slide-up-mobile sm:animate-scale-in border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="bg-brand-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">وصفات جوده</h2>
              <p className="text-brand-100 text-xs">أطباق شهية بمنتجاتنا الآمنة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {RECIPES.map((recipe) => (
            <div 
              key={recipe.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all"
            >
              {/* Card Header */}
              <button 
                onClick={() => toggleExpand(recipe.id)}
                className="w-full p-4 text-right flex items-start gap-4"
              >
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${expandedId === recipe.id ? 'bg-brand-600 text-white' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'} transition-colors`}>
                  <ChefHat className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">{recipe.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{recipe.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.calories}</span>
                  </div>
                </div>
                <div className="mt-2 text-gray-400">
                  {expandedId === recipe.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === recipe.id && (
                <div className="px-4 pb-5 pt-0 animate-fade-in">
                  <div className="h-px w-full bg-gray-100 dark:bg-gray-700 mb-4"></div>
                  
                  {/* Main Product Badge */}
                  <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold block mb-0.5">المنتج المستخدم</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{recipe.mainProduct}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(recipe.mainProduct, 'store')}
                      className="bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 p-2 rounded-lg shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-xs font-bold border border-brand-200 dark:border-brand-900"
                    >
                      <Plus className="w-3 h-3" />
                      <span>أضف</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">المكونات:</h4>
                      <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1 marker:text-brand-400">
                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">طريقة التحضير:</h4>
                      <ol className="list-decimal list-inside text-xs text-gray-600 dark:text-gray-300 space-y-2 marker:text-gray-400 marker:font-bold">
                        {recipe.steps.map((step, i) => <li key={i} className="leading-relaxed">{step}</li>)}
                      </ol>
                    </div>
                  </div>
                  
                  <div className="mt-5 text-center">
                    <button 
                      onClick={() => addToCart(recipe.mainProduct, 'store')} 
                      className="inline-flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      <span>أضف المكونات للسلة</span>
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
