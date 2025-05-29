'use client';

import { useState } from 'react';

type StockItem = {
  name: string;
  standardCode: string;
};

export default function StockKoSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kr-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '검색 실패');
      setResults(data.output || []);
    } catch (error) {
      console.error('❌ 검색 오류:', error);
    } finally {
      setLoading(false);
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
        {results.map((item, idx) => (
          <li key={idx} className="border rounded px-4 py-2">
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-500">{item.standardCode}</div>
          </li>
        ))}
      </ul>
      <pre className="text-xs text-gray-400 mt-4">{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}