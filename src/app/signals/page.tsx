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

const getSignalEmoji = (score: number) => {
  if (score <= 20) return '🔴'; // 매우 부정
  if (score <= 40) return '🟠'; // 부정
  if (score <= 60) return '🟡'; // 중립
  if (score <= 80) return '🔵'; // 긍정
  return '🟢'; // 매우 긍정
};

const getSignalLabel = (score: number) => {
  if (score <= 20) return '매우 부정';
  if (score <= 40) return '부정';
  if (score <= 60) return '중립';
  if (score <= 80) return '긍정';
  return '매우 긍정';
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
            className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1 text-sm flex flex-col space-y-3"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-800 text-base">{signal.name} ({signal.symbol})</span>
                <div className="text-xs text-gray-500">{formatDate(signal.createdAt.seconds)}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl">{getSignalEmoji(signal.score)}</div>
                <span className="text-xs mt-1">{getSignalLabel(signal.score)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold">시그널 점수 - {signal.score}점</div>
              <Link href={`/signals/${signal.id}`}>
                <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded">
                  상세 분석 내용 보기
                </button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}