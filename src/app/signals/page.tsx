'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

type Signal = {
  id: string;
  symbol: string;
  name: string;
  analysis: string;
  createdAt: { seconds: number };
  score: number;
};

export default function SignalPage() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'user', user.uid, 'signals'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedSignals = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Signal[];

        setSignals(fetchedSignals);
      } catch (error) {
        console.error('❌ 시그널 fetch 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [user]);

  const formatDate = (seconds: number) => {
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score <= 30) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">📶 AI 시그널 알림</h2>

      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}

      {!loading && signals.length === 0 && (
        <p className="text-sm text-gray-500">표시할 시그널이 없습니다.</p>
      )}

      <ul className="space-y-3">
        {signals.map((signal) => (
          <li
            key={signal.id}
            className="bg-white p-4 rounded shadow text-sm flex justify-between items-center"
          >
            <Link href={`/signals/${signal.id}`}>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{signal.name} ({signal.symbol})</span>
                  <span className="text-xs text-gray-400">
                    {formatDate(signal.createdAt.seconds)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{signal.analysis.slice(0, 100)}...</p>
              </div>
            </Link>
            <div className="flex flex-col items-center ml-4">
              <div className={`w-4 h-4 rounded-full ${getScoreColor(signal.score)}`}></div>
              <span className="text-xs mt-1">{signal.score}점</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}