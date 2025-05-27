'use client';

import { useEffect, useState } from 'react';

type Article = {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
};

export default function NewsAll() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/all');
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (e) {
        console.error('❌ 뉴스 불러오기 오류:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div>
      {loading && <p className="text-sm text-gray-400">뉴스를 불러오는 중...</p>}
      {!loading && articles.length === 0 && (
        <p className="text-sm text-gray-400">뉴스가 없습니다.</p>
      )}

      <ul className="mt-4 space-y-4">
        {articles.map((item, idx) => (
          <li key={idx} className="bg-white p-4 rounded shadow text-sm">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
              {item.title}
            </a>
            <p className="text-xs text-gray-400 mt-1">{item.pubDate}</p>
            <p className="text-sm text-gray-600 mt-2">{item.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}