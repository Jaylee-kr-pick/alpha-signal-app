'use client';

import { useEffect, useState } from 'react';

type Article = {
  title: string;
  link: string;
  pubDate: string;
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/ai-news');
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('❌ 뉴스 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">🧠 AI 뉴스 속보</h1>
      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : articles.length === 0 ? (
        <p className="text-gray-400 text-sm">뉴스가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((item, idx) => (
            <li key={idx} className="border p-3 rounded bg-white shadow-sm">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold">
                {item.title}
              </a>
              <p className="text-xs text-gray-500">{new Date(item.pubDate).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}