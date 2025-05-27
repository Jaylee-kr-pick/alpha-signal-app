'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

type StockItem = {
  code: string;
  name: string;
  standardCode: string;
};

type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  standardCode: string;
  alert: boolean;
};

export default function StockKoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWatchlist = async () => {
      const snapshot = await getDocs(collection(db, 'watchlist'));
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWatchlist(items);
    };
    fetchWatchlist();
  }, []);

  const isInWatchlist = (symbol: string) => {
    return watchlist.find(w => w.symbol === symbol);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kr-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('❌ 검색 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: StockItem) => {
    const exists = isInWatchlist(item.code);
    if (exists) {
      await deleteDoc(doc(db, 'watchlist', exists.id));
      setWatchlist(prev => prev.filter(w => w.id !== exists.id));
    } else {
      const docRef = await addDoc(collection(db, 'watchlist'), {
        symbol: item.code,
        name: item.name,
        standardCode: item.standardCode,
        alert: true,
        timestamp: new Date(),
      });
      setWatchlist(prev => [...prev, { id: docRef.id, ...item, alert: true }]);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="종목명을 입력하세요 (예: 삼성전자)"
        className="w-full border px-3 py-2 rounded mb-2 text-sm"
      />
      <button
        onClick={handleSearch}
        className="w-full bg-orange-500 text-white py-2 rounded text-sm"
      >
        🔍 검색
      </button>

      {loading && <p className="text-sm text-gray-400 mt-2">검색 중...</p>}
      {!loading && results.length === 0 && query && (
        <p className="text-sm text-gray-400 mt-4">검색 결과가 없습니다.</p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((item, idx) => {
          const exists = isInWatchlist(item.code);
          return (
            <li
              key={idx}
              className="bg-white p-3 rounded shadow flex justify-between items-center text-sm"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.code} / 표준코드: {item.standardCode}
                </p>
              </div>
              <button
                onClick={() => handleToggle(item)}
                className={`text-xs px-3 py-1 rounded ${
                  exists ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
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