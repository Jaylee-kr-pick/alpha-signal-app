// src/app/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';

type Signal = {
  timestamp: import("firebase/firestore").Timestamp;
  asset: string;
  signal: '매수' | '매도';
};

export default function Home() {
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [username, setUsername] = useState('Guest');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      const snapshot = await getDocs(collection(db, "signals"));
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          timestamp: data.timestamp,
          asset: data.asset,
          signal: data.signal,
        } as Signal;
      }).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

      setSignals(docs);
      setTotal(docs.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const countToday = docs.filter(d => d.timestamp?.toDate().getTime() >= today.getTime()).length;
      setTodayCount(countToday)
    }
    fetchDashboard();

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUsername(user.displayName || user.email || '사용자');
      } else {
        setUsername('Guest');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <h1 className="text-lg font-bold mb-0">{username}님의 알파 시그널</h1>
      {username === 'Guest' && (
        <p className="text-sm text-gray-400 mt-0.5 mb-4">
          로그인하고 나만의 알파시그널을 확인하세요.
        </p>
      )}

      <section className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">총 시그널</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">오늘의 시그널</p>
          <p className="text-2xl font-bold">{todayCount}</p>
        </div>
      </section>

      <section className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-semibold">최근 시그널 목록</h2>
          <button
            className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
            onClick={() => router.push("/watchlist")}
          >
            + Add
          </button>
        </div>

        <table className="w-full text-sm border-t">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">시간</th>
              <th>종목</th>
              <th>신호</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-sm text-gray-400 py-4">
                  아직 도착한 시그널이 없어요.
                </td>
              </tr>
            ) : (
              signals.slice(0, 5).map((s, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-2">{s.timestamp?.toDate().toLocaleString()}</td>
                  <td>{s.asset}</td>
                  <td className={
                    s.signal === '매수' ? 'text-blue-600 font-medium' : 'text-red-500 font-medium'
                  }>{s.signal}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-6">
          <h2 className="text-base font-semibold mb-2">관심종목 뉴스</h2>
          {true ? ( // Replace this condition with actual check if preview news exists later
            <div
              className="bg-gray-100 p-4 rounded-xl text-sm text-gray-600 cursor-pointer hover:bg-gray-200 transition"
              onClick={() => router.push("/news/watchlist")}
            >
              관심종목 관련 뉴스를 확인하려면 클릭하세요 →
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-xl text-sm text-gray-400 text-center">
              관심종목을 등록하고 뉴스를 빠르게 받아보세요.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
