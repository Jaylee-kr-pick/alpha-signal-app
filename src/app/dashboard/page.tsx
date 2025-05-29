// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DashboardPage() {
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  type SignalItem = {
    timestamp?: { toDate: () => Date };
    asset: string;
    signal: string;
  };

  const [signals, setSignals] = useState<SignalItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSignals = async () => {
      const snapshot = await getDocs(collection(db, 'signals'));
      const data = snapshot.docs.map(doc => doc.data()).sort(
        (a, b) => b.timestamp?.seconds - a.timestamp?.seconds
      );

      setSignals(
        data.map((doc: Record<string, unknown>) => ({
          asset: doc.asset as string,
          signal: doc.signal as string,
          timestamp: doc.timestamp as { toDate: () => Date },
        }))
      );
      setTotal(data.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const countToday = data.filter(signal =>
        signal.timestamp?.toDate().getTime() >= today.getTime()
      ).length;
      setTodayCount(countToday);
    };

    fetchSignals();
  }, []);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">총 시그널</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">오늘의 시그널</p>
          <p className="text-2xl font-bold">{todayCount}</p>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold">이정어리다님의 알파 시그널</h2>
          <button
            onClick={() => router.push('/watchlist')}
            className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full"
          >
            + Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-t border-gray-200">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2">시간</th>
                <th>종목</th>
                <th>신호</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700">
                    {s.timestamp?.toDate().toLocaleString()}
                  </td>
                  <td>{s.asset}</td>
                  <td className={
                    s.signal === '매수'
                      ? 'text-blue-600 font-medium'
                      : 'text-red-500 font-medium'
                  }>
                    {s.signal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
