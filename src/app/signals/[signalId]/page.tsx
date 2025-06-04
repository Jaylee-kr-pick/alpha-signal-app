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
        const data = docSnap.data() as SignalDetail;
        const cleanedAnalysis = data.analysis.replace(/\*/g, '');
        setSignal({ ...data, analysis: cleanedAnalysis });
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">{signal.name}</h1>
            <p className="text-gray-500 text-sm">{signal.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{formattedDate}</p>
            <p className="text-lg font-semibold mt-1">시그널 점수: <span className="text-blue-600">{signal.score}점</span></p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">📊 상세 분석 내용</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{signal.analysis}</p>
        </div>
      </div>
    </div>
  );
}