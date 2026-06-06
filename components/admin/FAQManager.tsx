import React, { useState, useEffect } from 'react';
import { HelpCircle, Save, Edit, Trash2 } from 'lucide-react';
import { AdminContentService } from '../../services/admin/AdminContentService';
import { supabase } from '../../services/supabaseClient'; // For initial fetch only

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface FAQManagerProps {
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const FAQManager: React.FC<FAQManagerProps> = ({
  showSuccess,
  showError,
  loading,
  setLoading
}) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqId, setFaqId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setFaqs(data || []);
    } catch (err: any) {
      showError('فشل تحميل الأسئلة الشائعة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      showError('السؤال والجواب مطلوبان');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        question: question.trim(),
        answer: answer.trim(),
        sort_order: sortOrder
      };
      
      if (faqId) {
        payload.id = faqId;
      }

      await AdminContentService.upsertFAQ(payload);
      showSuccess('تم حفظ السؤال بنجاح');
      
      // Reset form
      setFaqId(null);
      setQuestion('');
      setAnswer('');
      setSortOrder(0);
      
      loadFaqs();
    } catch (err: any) {
      showError(err.message || 'فشل حفظ السؤال');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      setLoading(true);
      await AdminContentService.deleteFAQ(id);
      showSuccess('تم حذف السؤال');
      loadFaqs();
    } catch (err: any) {
      showError(err.message || 'فشل حذف السؤال');
      setLoading(false);
    }
  };

  const handleEditFAQClick = (f: FAQ) => {
    setFaqId(f.id);
    setQuestion(f.question);
    setAnswer(f.answer);
    setSortOrder(f.sort_order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* FAQ Form */}
      <form onSubmit={handleSaveFAQ} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-50 dark:border-gray-800 pb-3">
          <HelpCircle className="w-5 h-5 text-brand-600" />
          {faqId ? 'تعديل السؤال' : 'إضافة سؤال شائع جديد'}
        </h2>

        <div>
          <label className="block text-[10px] text-gray-400 font-bold mb-1.5">السؤال *</label>
          <input
            type="text"
            placeholder="مثال: هل منتجاتكم خالية من الغلوتين؟"
            required
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 font-bold mb-1.5">الجواب *</label>
          <textarea
            rows={4}
            placeholder="نعم، جميع منتجاتنا معتمدة..."
            required
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] text-gray-400 font-bold mb-1.5">الترتيب</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
            className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white font-mono"
          />
        </div>

        <div className="flex gap-2 border-t border-gray-50 dark:border-gray-800 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>حفظ السؤال</span>
          </button>
          {faqId && (
            <button
              type="button"
              onClick={() => {
                setFaqId(null);
                setQuestion('');
                setAnswer('');
                setSortOrder(0);
              }}
              className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* FAQ List */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-3xl space-y-4">
        <h2 className="text-sm font-black text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-800 pb-3">الأسئلة الشائعة الحالية ({faqs.length})</h2>
        
        <div className="space-y-3">
          {faqs.map(f => (
            <div key={f.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold text-sm text-brand-600 dark:text-brand-400">{f.question}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEditFAQClick(f)}
                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-brand-50 text-gray-500 hover:text-brand-600 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(f.id)}
                    className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {f.answer}
              </p>
              <div className="text-[10px] text-gray-400 font-mono mt-1">الترتيب: {f.sort_order}</div>
            </div>
          ))}
          {faqs.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-12">لا توجد أسئلة شائعة مضافة حالياً</p>
          )}
        </div>
      </div>
    </div>
  );
};
