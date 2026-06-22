import React from 'react';
import { WifiOff, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { useSync } from '../../contexts/SyncContext';
import { useOnlineStatus } from '../../hooks/index';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, lastSyncTime } = useSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm px-1.5 pointer-events-none animate-slide-down">
      <div className="pointer-events-auto">
        {!isOnline && (
          <div className="bg-amber-600/95 dark:bg-amber-700/95 text-white backdrop-blur-md p-3.5 rounded-2xl shadow-[0_8px_32px_rgba(217,119,6,0.15)] border border-amber-500/20 flex items-center gap-3.5">
            <div className="w-9 h-9 bg-white/10 dark:bg-black/10 rounded-xl flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5 text-amber-100 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h4 className="font-black text-xs">الإنترنت مقطوع 🔌</h4>
              <p className="text-[10px] text-amber-100 font-bold mt-0.5">طلباتك محفوظة في أمان، وبنرفعها أول ما ترجع الشبكة</p>
            </div>
          </div>
        )}

        {isOnline && pendingCount > 0 && (
          <div className={`text-white backdrop-blur-md p-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg transition-all ${
            isSyncing 
              ? 'bg-emerald-600/95 dark:bg-emerald-700/95 shadow-[0_8px_32px_rgba(16,185,129,0.15)] border border-emerald-500/20' 
              : 'bg-blue-600/95 dark:bg-blue-700/95 shadow-[0_8px_32px_rgba(37,99,235,0.15)] border border-blue-500/20'
          }`}>
            <div className="w-9 h-9 bg-white/10 dark:bg-black/10 rounded-xl flex items-center justify-center shrink-0">
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 text-emerald-100 animate-spin" />
              ) : (
                <CloudOff className="w-5 h-5 text-blue-100" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              {isSyncing ? (
                <>
                  <h4 className="font-black text-xs">جاري المزامنة... ⏳</h4>
                  <p className="text-[10px] text-emerald-100 font-bold mt-0.5">بنرسل طلباتك المعلقة للمتجر حالياً</p>
                </>
              ) : (
                <>
                  <h4 className="font-black text-xs">طلبك في الانتظار 📥</h4>
                  <p className="text-[10px] text-blue-100 font-bold mt-0.5">عندك طلب معلق، بنرسله تلقائياً أول ما تتصل</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
