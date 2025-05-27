'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

type Signal = {
  id: string;
  symbol: string;
  name: string;
  message: string;
  timestamp: { seconds: number };
};

export default function SignalPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      const q = query(
        collection(db, 'signals'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Signal[];
      setSignals(docs);
      setLoading(false);
    };

    fetchSignals();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">📶 AI 시그널 알림</h2>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}

      {!loading && signals.length === 0 && (
        <p className="text-sm text-gray-500">표시할 시그널이 없습니다.</p>
      )}

      <ul className="space-y-3">
        {signals.map((signal) => (
          <li key={signal.id} className="bg-white p-4 rounded shadow text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">{signal.name} ({signal.symbol})</span>
              <span className="text-xs text-gray-400">
                {new Date(signal.timestamp.seconds * 1000).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{signal.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}