'use client';

import { useEffect } from 'react';
import { startVisitRecordRealtimeWatcher } from '@/lib/realtime-visitrecord';

/**
 * アプリ起動時に VisitRecord のリアルタイム監視を開始するコンポーネント
 */
export function AppRoot() {
  useEffect(() => {
    const sub = startVisitRecordRealtimeWatcher();
    return () => sub.unsubscribe();
  }, []);

  return null;
}
