import React from 'react';
import { Tag, Star, Gift } from 'lucide-react';

export const BADGE_OPTIONS = [
  { id: 'discount', label: 'شارة خصم', desc: 'شريط أحمر جذاب', icon: <Tag className="w-4 h-4 text-red-500" /> },
  { id: 'best_seller', label: 'الأكثر مبيعاً', desc: 'لتمييز مبيعاتك', icon: <Star className="w-4 h-4 text-amber-500" /> },
  { id: 'gift', label: 'هدية مجانية', desc: 'للعروض والباكجات', icon: <Gift className="w-4 h-4 text-green-500" /> },
];
