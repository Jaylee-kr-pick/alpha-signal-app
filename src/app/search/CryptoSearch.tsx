'use client';

import { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/firebase'; // Firebase 초기화한 파일

interface CoinResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  type: string;
  alert: boolean;
}

const auth = getAuth(app);
const db = getFirestore(app);

export default function CryptoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinResult[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        loadWatchlist(user.uid);
        // 플랜 정보 가져오기
        const userDocRef = doc(db, 'user', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setPlan(userData.plan || 'free');
        }
      } else {
        setUserId(null);
        setWatchlist([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadWatchlist = async (uid: string) => {
    const collectionRef = collection(db, 'user', uid, 'watchlist_crypto_stocks');
    const querySnapshot = await getDocs(collectionRef);
    const items: WatchlistItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as WatchlistItem);
    });
    setWatchlist(items);
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((item) => item.symbol === symbol);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
      );
      const data: { coins: CoinResult[] } = await res.json();
      setResults(data.coins || []);
    } catch (err) {
      console.error('❌ 코인 검색 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatch = async (coin: CoinResult) => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }

    // Firestore 저장 경로: /user/{uid}/watchlist_crypto_stocks/{코인심볼}
    const docRef = doc(db, 'user', userId, 'watchlist_crypto_stocks', coin.symbol.toUpperCase());

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 삭제
        await deleteDoc(docRef);
        setWatchlist((prev) => prev.filter((item) => item.symbol !== coin.symbol.toUpperCase()));
      } else {
        // 추가
        // 무료 플랜은 alert true가 1개만 가능하도록 제한
        let shouldAlert = true;
        if (plan === 'free') {
          // 현재 alert가 true인 관심종목 개수 확인
          const watchlistRef = collection(db, 'user', userId, 'watchlist_crypto_stocks');
          const currentSnapshot = await getDocs(watchlistRef);
          const currentOnCount = currentSnapshot.docs.filter(doc => doc.data().alert === true).length;
          shouldAlert = currentOnCount >= 1 ? false : true;
        }
        await setDoc(docRef, {
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
          alert: shouldAlert,
          createdAt: serverTimestamp(),
        });
        setWatchlist((prev) => [
          ...prev,
          {
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            type: 'crypto',
            alert: shouldAlert,
          },
        ]);
      }
    } catch (error) {
      console.error('❌ Firestore 저장 오류:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        placeholder="코인명을 입력하세요 (예: bitcoin)"
        className="w-full border px-3 py-2 rounded mb-2 text-sm"
      />
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          handleSearch();
        }}
        className="w-full bg-purple-500 text-white py-2 rounded text-sm"
      >
        🔍 검색
      </button>

      {loading && <p className="text-sm text-gray-400 mt-2">검색 중...</p>}
      {!loading && results.length === 0 && query && (
        <p className="text-sm text-gray-400 mt-4">검색 결과가 없습니다.</p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((coin, idx) => {
          const exists = isInWatchlist(coin.symbol.toUpperCase());
          return (
            <li key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.thumb} alt={coin.name} className="w-6 h-6" />
                <div>
                  <p className="font-semibold max-w-[150px] truncate">{coin.name}</p>
                  <p className="text-xs text-gray-500">{coin.symbol.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => toggleWatch(coin)}
                className={`text-xs px-3 py-1 rounded min-w-[60px] text-center ${
                  exists
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                }`}
              >
                {exists ? '삭제' : '추가'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}