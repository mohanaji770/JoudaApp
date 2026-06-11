import React, { useRef, useState } from 'react';
import { Camera, Upload, ScanSearch, Search, Type, Info, ImagePlus, X } from 'lucide-react';
import { compressImage, fileToBase64 } from '../../utils/imageCompression';

interface ScannerProps {
  onImageSelected: (base64: string) => void;
  onTextSearch: (text: string) => void;
  isAnalyzing: boolean;
}

type Mode = 'camera' | 'text';

export const Scanner: React.FC<ScannerProps> = ({ onImageSelected, onTextSearch, isAnalyzing }) => {
  const [mode, setMode] = useState<Mode>('camera');
  const [searchText, setSearchText] = useState('');
  const [showSearchHint, setShowSearchHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  // Helper to compress image
  // compressImage is now imported from utils/imageCompression

  const processFile = async (file: File) => {
      if (isProcessingImage || isAnalyzing) return;
      setIsProcessingImage(true);
      try {
        const compressedFile = await compressImage(file);
        const base64Data = await fileToBase64(compressedFile);
        onImageSelected(base64Data.split(',')[1]);
      } catch (error) {
        console.error("Image processing failed", error);
        // Fallback to raw if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
           const res = reader.result as string;
           onImageSelected(res.split(',')[1]);
        };
        reader.readAsDataURL(file);
      } finally {
        setTimeout(() => setIsProcessingImage(false), 1000);
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim() && !isSubmittingText && !isAnalyzing) {
      setIsSubmittingText(true);
      onTextSearch(searchText);
      setTimeout(() => setIsSubmittingText(false), 1000);
    }
  };

  const triggerFileInput = () => {
    if (isProcessingImage || isAnalyzing) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full bg-warm-white dark:bg-gray-800 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700 my-4 relative overflow-hidden transition-all duration-300">
      
      {/* Tabs */}
      {!isAnalyzing && (
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              mode === 'camera' 
                ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-900/20 border-b-2 border-brand-600' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>فحص صورة</span>
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              mode === 'text' 
                ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-900/20 border-b-2 border-brand-600' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>البحث الكتابي</span>
          </button>
        </div>
      )}

      <div className="p-4 md:p-6 flex flex-col items-center justify-center">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center text-center animate-pulse py-8">
            <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-4 relative">
               <ScanSearch className="w-12 h-12 text-brand-600 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">ندقق المكونات بدقة لأجلك...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">لحظات وسنخبرك بالنتيجة</p>
          </div>
        ) : mode === 'camera' ? (
          <div 
            className={`flex flex-col items-center justify-center text-center w-full animate-fade-in border-2 border-dashed rounded-3xl p-5 md:p-6 transition-colors ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-gray-600'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Desktop Icon: Image Plus / Upload */}
            <div 
              onClick={triggerFileInput}
              className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-md shadow-red-200 dark:shadow-none mb-3 cursor-pointer active:scale-95 transition-transform hover:scale-105"
            >
              <ImagePlus className="w-6 h-6 text-white" />
            </div>
            
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">صوّر مكونات المنتج</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-xs px-2 leading-relaxed max-w-sm">
              اسحب الصورة هنا أو اخترها من جهازك.
            </p>

            <button 
              onClick={triggerFileInput}
              disabled={isProcessingImage || isAnalyzing}
              className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white dark:text-gray-200 px-6 py-2.5 text-sm rounded-xl font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار من الجهاز</span>
            </button>
          </div>
        ) : (
          <div className="w-full animate-fade-in flex flex-col items-center max-w-md py-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">البحث بالاسم</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-xs px-4 text-center">
              اكتب اسم المنتج أو الماركة للتحليل
            </p>

            <form onSubmit={handleTextSubmit} className="w-full">
              <div className="relative mb-3">
                <label htmlFor="scanner-search" className="sr-only">أدخل اسم المنتج التجاري</label>
                <input
                  id="scanner-search"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="اسم المنتج..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-center font-medium pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSearchHint(!showSearchHint)}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 transition-colors rounded-full ${showSearchHint ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
                  title="نصائح للبحث"
                >
                  <Info className="w-4 h-4" />
                </button>
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full"
                    title="مسح النص"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSearchHint && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-4 text-xs text-blue-800 dark:text-blue-200 animate-fade-in text-right leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    للحصول على أدق نتيجة:
                  </p>
                  <p>اكتب الاسم + الماركة (مثال: "دقيق شار خالي من الجلوتين").</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!searchText.trim() || isSubmittingText || isAnalyzing}
                className="w-full bg-gray-900 dark:bg-brand-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-gray-200 dark:shadow-none"
              >
                <Search className="w-4 h-4" />
                <span>بدء الفحص</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
