import React from 'react';
import { WifiOff, CloudOff, Cloud, RefreshCw } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { useOnlineStatus } from '../hooks';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, lastSyncTime } = useSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      {!isOnline && (
        <div className="bg-orange-500 text-white text-center text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>أنت offline — البيانات محفوظة محلياً وسيتم المزامنة عند العودة للإنترنت</span>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className={`text-white text-center text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 ${isSyncing ? 'bg-blue-500' : 'bg-amber-500'}`}>
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري مزامنة {pendingCount} طلب...</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5" />
              <span>{pendingCount} طلب في الانتظار — سيتم الإرسال تلقائياً</span>
            </>
          )}
        </div>
      )}

      {isOnline && pendingCount === 0 && lastSyncTime && (
        <div className="bg-green-500 text-white text-center text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity">
          <Cloud className="w-3 h-3" />
          <span>آخر مزامنة: {lastSyncTime.toLocaleTimeString('ar-SA')}</span>
        </div>
      )}
    </div>
  );
};
