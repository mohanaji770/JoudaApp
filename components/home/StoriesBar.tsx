
import React from 'react';
import { Sparkles, Cake, ShoppingBag, Info, Zap } from 'lucide-react';

interface StoriesBarProps {
  onSelect: (category: string) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ onSelect }) => {
  const stories = [
    { id: 'offers', label: 'عروض', icon: <Zap className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-700' },
    { id: 'bakery', label: 'المخبز', icon: <Cake className="w-5 h-5 text-pink-600" />, bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-200 dark:border-pink-700' },
    { id: 'store', label: 'المتجر', icon: <ShoppingBag className="w-5 h-5 text-brand-600" />, bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-700' },
    { id: 'new', label: 'جديدنا', icon: <Sparkles className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-700' },
    { id: 'tips', label: 'نصائح', icon: <Info className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto px-1 py-2 hide-scrollbar snap-x">
      {stories.map((story) => (
        <button
          key={story.id}
          onClick={() => onSelect(story.id)}
          className="flex flex-col items-center gap-2 snap-start group"
        >
          <div className={`w-16 h-16 rounded-full ${story.bg} border-2 ${story.border} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300 relative overflow-hidden`}>
             {/* Glossy effect */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/40 rounded-full"></div>
             {story.icon}
          </div>
          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{story.label}</span>
        </button>
      ))}
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
