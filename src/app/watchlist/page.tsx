'use client';

import { useEffect, useState, MouseEvent } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '@/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface WatchlistItem {
  id: string;
  name: string;
  symbol?: string;
  code?: string;
  type: 'kr' | 'global' | 'coin';
  alert: boolean;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const userDocRef = doc(db, 'user', uid);
    getDoc(userDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setPlan((userData.plan as 'free' | 'pro') || 'free');
      }
    });
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribes: (() => void)[] = [];

    const listenToSubCollection = (subCollection: string, type: WatchlistItem['type']) => {
      const colRef = collection(db, 'user', uid, `watchlist_${subCollection}`);
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWatchlist((prevWatchlist) => {
          const filtered = prevWatchlist.filter((item) => item.type !== type);
          const newItems = snapshot.docs.map((doc) => {
            const data = doc.data() as Omit<WatchlistItem, 'id' | 'type'>;
            return {
              id: doc.id,
              ...data,
              type,
            };
          });
          return [...filtered, ...newItems];
        });
      });
      unsubscribes.push(unsubscribe);
    };

    listenToSubCollection('ko_stocks', 'kr');
    listenToSubCollection('global_stocks', 'global');
    listenToSubCollection('crypto_stocks', 'coin');

    setLoading(false);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const toggleAlert = async (item: WatchlistItem) => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      if (!item.alert && plan === 'free') {
        const currentOnCount = watchlist.filter((w) => w.alert).length;
        if (currentOnCount >= 1) {
          toast.error('무료 플랜은 하나의 관심종목에만 알림을 설정할 수 있습니다.');
          return;
        }
      }

      await updateDoc(
        doc(db, 'user', uid, `watchlist_${getSubCollection(item.type)}`, item.id),
        {
          alert: !item.alert,
        }
      );
    } catch (error) {
      console.error('⚠️ 알림 토글 실패:', error);
    }
  };

  const deleteItem = async (item: WatchlistItem) => {
    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await deleteDoc(
        doc(db, 'user', uid, `watchlist_${getSubCollection(item.type)}`, item.id)
      );
    } catch (error) {
      console.error('🗑️ 삭제 실패:', error);
    }
  };

  const getSubCollection = (type: WatchlistItem['type']) => {
    switch (type) {
      case 'kr':
        return 'ko_stocks';
      case 'global':
        return 'global_stocks';
      case 'coin':
        return 'crypto_stocks';
    }
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="p-4 flex justify-between items-center border-b border-gray-200 bg-white">
          <h1 className="text-lg font-bold">관심종목</h1>
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              router.push('/search');
            }}
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
              {watchlist.map((item) => (
                <li
                  key={item.id}
                  className="bg-white p-3 rounded shadow flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.symbol || item.code}</p>
                    <p className="text-xs text-gray-400">
                      타입: {item.type === 'kr' ? '국내주식' : item.type === 'global' ? '해외주식' : '암호화폐'}
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
                      onClick={() => deleteItem(item)}
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
      <ToastContainer />
    </>
  );
}
