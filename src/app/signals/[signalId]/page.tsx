

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/firebase'; // Firebase 초기화 파일
import { format } from 'date-fns';

const db = getFirestore(app);
const auth = getAuth(app);
const user = auth.currentUser;
const userId = user?.uid;

type SignalDetail = {
  name: string;
  symbol: string;
  type: string;
  alert: boolean;
  createdAt: { seconds: number; nanoseconds: number };
  score: number;
  analysis: string;
};

export default function SignalDetailPage() {
  const { signalId } = useParams();
  const [signal, setSignal] = useState<SignalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignal = async () => {
      if (!signalId || !userId) return;
      const docRef = doc(db, 'user', userId!, 'signals', signalId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSignal(docSnap.data() as SignalDetail);
      }
      setLoading(false);
    };
    fetchSignal();
  }, [signalId]);

  if (loading) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  if (!signal) {
    return <div className="p-4 text-center">시그널 정보를 찾을 수 없습니다.</div>;
  }

  const formattedDate = format(new Date(signal.createdAt.seconds * 1000), 'yyyy년 MM월 dd일 HH:mm');

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{signal.name} 시그널 상세</h1>
      <div className="bg-white shadow p-6 rounded space-y-4">
        <div className="text-lg">
          <strong>종목명:</strong> {signal.name}
        </div>
        <div className="text-lg">
          <strong>종목 코드:</strong> {signal.symbol}
        </div>
        <div className="text-lg">
          <strong>시그널 시간:</strong> {formattedDate}
        </div>
        <div className="text-lg">
          <strong>시그널 점수:</strong> {signal.score}점
        </div>
        <div className="text-lg">
          <strong>분석 내용:</strong>
          <p className="mt-2 whitespace-pre-line">{signal.analysis}</p>
        </div>
      </div>
    </div>
  );
}