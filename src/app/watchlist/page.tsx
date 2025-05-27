// src/app/watchlist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase';
import type { DocumentData } from 'firebase/firestore';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWatchlist = async () => {
      const snapshot = await getDocs(collection(db, 'watchlist'));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWatchlist(items);
      setLoading(false);
    };

    fetchWatchlist();
  }, []);

  const toggleAlert = async (item: DocumentData) => {
    await updateDoc(doc(db, 'watchlist', item.id), {
      alert: !item.alert,
    });
    setWatchlist(prev =>
      prev.map(w => (w.id === item.id ? { ...w, alert: !w.alert } : w))
    );
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'watchlist', id));
    setWatchlist(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-white">
        <h1 className="text-lg font-bold">관심종목</h1>
        <button
          onClick={() => router.push('/search')}
          className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
        >
          + 추가
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : watchlist.length === 0 ? (
          <p className="text-sm text-gray-400">관심종목이 없습니다. + 추가 버튼을 눌러 등록하세요.</p>
        ) : (
          <ul className="space-y-2">
            {watchlist.map((item: DocumentData, idx: number) => (
              <li
                key={idx}
                className="bg-white p-3 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.symbol}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAlert(item)}
                    className={`px-2 py-1 text-xs rounded border ${
                      item.alert ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    알림 {item.alert ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 text-sm"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
