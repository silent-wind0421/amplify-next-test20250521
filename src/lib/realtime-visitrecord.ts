// src/lib/realtime-visitrecord.ts

import { client } from '@/lib/client';
import { differenceInMinutes, parse } from 'date-fns';

/**
 * VisitRecord モデルに対するリアルタイム監視を開始します。
 *
 * observeQuery() により、VisitRecord の変更を購読し、実来所・退所時刻の変化に応じて
 * actualDuration（実利用時間）を自動計算・保存します。
 */
export function startVisitRecordRealtimeWatcher() {
  const sub = client.models.VisitRecord.observeQuery().subscribe({
    next: async ({ items }) => {
      for (const record of items) {
        const { id, actualArrivalTime, actualLeaveTime, actualDuration } = record;
        if (!actualArrivalTime || !actualLeaveTime) continue;

        const arrival = parse(actualArrivalTime, 'HH:mm:ss', new Date());
        const leave = parse(actualLeaveTime, 'HH:mm:ss', new Date());
        const minutes = differenceInMinutes(leave, arrival);

        if (minutes === actualDuration) continue;

        try {
          await client.models.VisitRecord.update({ id, actualDuration: minutes });
          console.log(`[AutoUpdate] ${id}: ${minutes}分に更新`);
        } catch (err) {
          console.error(`[AutoUpdate] エラー:`, err);
        }
      }
    },
    error: (err) => {
      console.error('[observeQuery エラー]', err);
    },
  });

  return sub;
}
