
import React, { useRef, useState } from 'react';
import { Camera, Upload, ScanSearch, Search, Type, Info, ImagePlus } from 'lucide-react';

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

  // Helper to compress image
  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Limit width to 1024px
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processFile = async (file: File) => {
      try {
        const base64Data = await compressImage(file);
        onImageSelected(base64Data);
      } catch (error) {
        console.error("Image processing failed", error);
        // Fallback to raw if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
           const res = reader.result as string;
           onImageSelected(res.split(',')[1]);
        };
        reader.readAsDataURL(file);
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
    if (searchText.trim()) {
      onTextSearch(searchText);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full bg-warm-white dark:bg-gray-800 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-700 my-4 relative overflow-hidden transition-all duration-300">
      
      {/* Tabs */}
      {!isAnalyzing && (
        <div className="flex border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
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
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
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

      <div className="p-6 md:p-10 min-h-[35vh] flex flex-col items-center justify-center">
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
            className={`flex flex-col items-center justify-center text-center w-full animate-fade-in border-2 border-dashed rounded-3xl p-8 transition-colors ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-gray-600'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Desktop Icon: Image Plus / Upload */}
            <div 
              onClick={triggerFileInput}
              className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-none mb-6 cursor-pointer active:scale-95 transition-transform hover:scale-105"
            >
              <ImagePlus className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">صوّر مكونات المنتج</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm px-4 leading-relaxed max-w-sm">
              اسحب الصورة هنا أو اخترها من جهازك. النص الواضح = نتيجة أدق.
            </p>

            <button 
              onClick={triggerFileInput}
              className="flex items-center gap-2 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white dark:text-gray-200 px-8 py-3 rounded-xl font-bold transition-colors shadow-lg"
            >
              <Upload className="w-5 h-5" />
              <span>اختيار من الجهاز</span>
            </button>
          </div>
        ) : (
          <div className="w-full animate-fade-in flex flex-col items-center max-w-md">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-4">
               <Search className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">البحث بالاسم</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm px-4 text-center">
              اكتب اسم المنتج وسنحلله فوراً
            </p>

            <form onSubmit={handleTextSubmit} className="w-full">
              <div className="relative mb-3">
                <label htmlFor="scanner-search" className="sr-only">أدخل اسم المنتج التجاري</label>
                <input
                  id="scanner-search"
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="أدخل اسم المنتج التجاري..."
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-center font-medium pl-12 text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowSearchHint(!showSearchHint)}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 p-2 transition-colors rounded-full ${showSearchHint ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
                  title="نصائح للبحث"
                >
                  <Info className="w-5 h-5" />
                </button>
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
                disabled={!searchText.trim()}
                className="w-full bg-gray-900 dark:bg-brand-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200 dark:shadow-none text-lg"
              >
                <Search className="w-5 h-5" />
                <span>بدء الفحص</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
