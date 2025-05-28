// src/app/watchlist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
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
      try {
        const auth = getAuth();
        const uid = auth.currentUser?.uid || 'kKffbyTAhOXdyKNNThJv'; // fallback for example data

        const snapshot = await getDocs(collection(db, 'user', uid, 'watchlist'));
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '이름없음',
            symbol: data.symbol || '기호없음',
            type: data.type || '미지정',
            alert: data.alert ?? false,
          };
        });
        setWatchlist(items);
      } catch (error) {
        console.error('🔥 관심종목 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  const toggleAlert = async (item: DocumentData) => {
    try {
      const auth = getAuth();
      // Use fallback UID if auth.currentUser is not available
      const uid = auth.currentUser?.uid || 'kKffbyTAhOXdyKNNThJv';
      if (!uid) return;

      await updateDoc(doc(db, 'user', uid, 'watchlist', item.id), {
        alert: !item.alert,
      });
      setWatchlist(prev =>
        prev.map(w => (w.id === item.id ? { ...w, alert: !w.alert } : w))
      );
    } catch (error) {
      console.error('⚠️ 알림 토글 실패:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await deleteDoc(doc(db, 'user', uid, 'watchlist', id));
      setWatchlist(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('🗑️ 삭제 실패:', error);
    }
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
                  <p className="text-xs text-gray-400">
                    타입:{' '}
                    {item.type === 'kr'
                      ? '국내주식'
                      : item.type === 'global'
                      ? '해외주식'
                      : item.type === 'coin'
                      ? '암호화폐'
                      : item.type}
                  </p>
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
