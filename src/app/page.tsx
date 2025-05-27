// src/app/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

type Signal = {
  timestamp: import("firebase/firestore").Timestamp;
  asset: string;
  signal: '매수' | '매도';
};

export default function DashboardPage() {
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [signals, setSignals] = useState<Signal[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      const snapshot = await getDocs(collection(db, "signals"));
      const docs = snapshot.docs.map(doc => doc.data()).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

      setSignals(docs);
      setTotal(docs.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const countToday = docs.filter(d => d.timestamp?.toDate().getTime() >= today.getTime()).length;
      setTodayCount(countToday);
    };
    fetchDashboard();
  }, []);

  return (
    <>
      <h1 className="text-lg font-bold mb-4">이정어리다님의 알파 시그널</h1>

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
          <h2 className="text-base font-semibold">시그널 목록</h2>
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
            {signals.map((s, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-2">{s.timestamp?.toDate().toLocaleString()}</td>
                <td>{s.asset}</td>
                <td className={
                  s.signal === '매수' ? 'text-blue-600 font-medium' : 'text-red-500 font-medium'
                }>{s.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
