'use client';

import { useEffect, useState } from 'react';

type Article = {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
};

export default function AiNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/ai-news');
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error('❌ 뉴스 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">🧠 AI 뉴스 속보</h2>

      {loading && <p className="text-sm text-gray-500">뉴스 불러오는 중...</p>}

      <ul className="space-y-5">
        {articles.map((article, idx) => (
          <li key={idx} className="border-l-4 border-blue-500 pl-3 relative">
            <div className="absolute -left-[11px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              <p className="font-medium text-sm text-blue-900 hover:underline">{article.title}</p>
            </a>
            <p className="text-xs text-gray-500">{article.pubDate}</p>
            <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}