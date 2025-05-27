'use client';

import { useEffect, useState } from 'react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  time: string;
};

export default function NewsAI() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/news-ai');
        const data = await res.json();
        setNews(data.items || []);
      } catch (err) {
        console.error('❌ AI 뉴스 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">🧠 AI 뉴스 요약</h2>
      {loading && <p className="text-sm text-gray-400">불러오는 중...</p>}
      {!loading && news.length === 0 && <p className="text-sm text-gray-400">데이터가 없습니다.</p>}

      <ul className="space-y-4">
        {news.map((item) => (
          <li key={item.id} className="bg-white p-4 rounded shadow text-sm">
            <p className="text-xs text-gray-400">{item.time} · {item.source}</p>
            <p className="font-bold mt-1">{item.title}</p>
            <p className="text-gray-600 mt-1">{item.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}