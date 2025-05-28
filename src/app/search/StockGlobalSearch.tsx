// src/app/search/StockGlobalSearch.tsx
'use client';

import { useState, useEffect } from 'react';

const API_KEY = 'd0o13n9r01qn5ghmirr0d0o13n9r01qn5ghmirrg'; // 핀허브 API 키

type GlobalStock = {
  symbol: string;
  description: string;
  type: string;
};

export default function StockGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalStock[]>([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Calculate total pages
  const totalPages = Math.ceil(results.length / itemsPerPage);

  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // 초기 관심종목 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('globalWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // 관심종목 저장
  useEffect(() => {
    localStorage.setItem('globalWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${API_KEY}`
      );
      const data = await res.json();
      setResults(data.result || []);
      setCurrentPage(1); // Reset to first page on new search
    } catch (err) {
      console.error('❌ 해외주식 검색 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatch = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="해외 종목명 또는 티커 입력 (예: AAPL)"
        className="w-full border px-3 py-2 rounded mb-2 text-sm"
      />
      <button
        onClick={handleSearch}
        className="w-full bg-blue-500 text-white py-2 rounded text-sm"
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
              const isSaved = watchlist.includes(item.symbol);
              return (
                <li
                  key={idx}
                  className="w-full bg-white p-3 rounded shadow text-sm flex justify-between items-center"
                >
                  <div className="w-0 flex-1 min-w-0">
                    <p className="font-semibold w-full truncate overflow-hidden whitespace-nowrap text-sm">{item.description}</p>
                    <p className="text-xs text-gray-500 truncate">{item.symbol} / {item.type}</p>
                  </div>
                  <button
                    onClick={() => toggleWatch(item.symbol)}
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
        {/* Pagination controls */}
        {results.length > itemsPerPage && (
          <div className="flex justify-center mt-4 space-x-1 text-sm">
            <button
              className={`px-2 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {/* Page number buttons */}
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
                    className={`px-2 py-1 rounded ${currentPage === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                    onClick={() => setCurrentPage(i)}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}
            <button
              className={`px-2 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
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