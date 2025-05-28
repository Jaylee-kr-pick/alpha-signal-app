'use client';

import { useState, useEffect, ChangeEvent, MouseEvent } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface CoinResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
}

interface WatchItem {
  id: string;
  symbol: string;
  name: string;
  alert: boolean;
}

export default function CryptoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinResult[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWatchlist = async () => {
      const snapshot = await getDocs(collection(db, 'watchlist'));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WatchItem[];
      setWatchlist(items);
    };
    fetchWatchlist();
  }, []);

  const isInWatchlist = (symbol: string) => {
    return watchlist.find((w) => w.symbol === symbol);
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

  const handleToggle = async (coin: CoinResult) => {
    const exists = isInWatchlist(coin.id);
    if (exists) {
      await deleteDoc(doc(db, 'watchlist', exists.id));
      setWatchlist(prev => prev.filter(w => w.id !== exists.id));
    } else {
      const docRef = await addDoc(collection(db, 'watchlist'), {
        symbol: coin.id,
        name: coin.name,
        image: coin.large,
        alert: true,
        timestamp: new Date(),
      });
      setWatchlist(prev => [...prev, { id: docRef.id, symbol: coin.id, name: coin.name, alert: true }]);
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
          const exists = isInWatchlist(coin.id);
          return (
            <li key={idx} className="bg-white p-3 rounded shadow flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.thumb} alt={coin.name} className="w-6 h-6" />
                <div>
                  <p className="font-semibold max-w-[150px] truncate">{coin.name}</p>
                  <p className="text-xs text-gray-500">{coin.symbol}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(coin)}
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