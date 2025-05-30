'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '@/firebase'; // Firebase 초기화한 파일

type StockItem = {
  name: string;
  code: string;
};

const auth = getAuth(app);
const db = getFirestore(app);

export default function StockKoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadWatchlist(user.uid);
      } else {
        setUserId(null);
        setWatchlist([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadWatchlist = async (uid: string) => {
    const docRef = doc(db, 'user', uid, 'watchlist_ko_stocks', 'ko_stocks');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setWatchlist(docSnap.data().items || []);
    } else {
      setWatchlist([]);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kr-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '검색 실패');
      setResults(data.output || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ 검색 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatch = async (stock: StockItem) => {
    if (!userId) {
      alert('로그인 후 사용 가능합니다.');
      return;
    }

    const watchlistCollectionRef = collection(db, 'user', userId, 'watchlist_ko_stocks');
    const docRef = doc(watchlistCollectionRef, stock.code);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 삭제
        await deleteDoc(docRef);
        setWatchlist((prev) => prev.filter((c) => c !== stock.code));
      } else {
        // 추가
        await setDoc(docRef, {
          symbol: stock.code,
          name: stock.name,
          type: 'ko',
          alert: true,
          createdAt: serverTimestamp()
        });
        setWatchlist((prev) => [...prev, stock.code]);
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
        onChange={(e) => setQuery(e.target.value)}
        placeholder="국내 종목명 입력 (예: 삼성전자)"
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

      <div className="mt-4">
        <ul className="space-y-2">
          {results
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((item, idx) => {
              const isSaved = watchlist.includes(item.code);
              return (
                <li
                  key={idx}
                  className="w-full bg-white p-3 rounded shadow text-sm flex justify-between items-center"
                >
                  <div className="w-0 flex-1 min-w-0">
                    <p className="font-semibold w-full truncate overflow-hidden whitespace-nowrap text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.code}</p>
                  </div>
                  <button
                    onClick={() => toggleWatch(item)}
                    className={`text-xs px-3 py-1 rounded ${
                      isSaved ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {isSaved ? '삭제' : '추가'}
                  </button>
                </li>
              );
            })}
        </ul>

        {results.length > itemsPerPage && (
          <div className="flex justify-center mt-4 space-x-1 text-sm">
            <button
              className={`px-2 py-1 rounded ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {(() => {
              const maxPageButtons = 4;
              let start = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
              let end = start + maxPageButtons - 1;
              if (end > totalPages) {
                end = totalPages;
                start = Math.max(1, end - maxPageButtons + 1);
              }
              const pages = [];
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    className={`px-2 py-1 rounded ${
                      currentPage === i
                        ? 'bg-orange-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}
            <button
              className={`px-2 py-1 rounded ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}