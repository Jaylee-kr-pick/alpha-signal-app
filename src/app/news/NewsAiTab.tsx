'use client';

import { useEffect, useState } from 'react';

type Article = {
  summary: string;
  timestamp: { seconds: number };
};

export default function NewsAiTab() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/news/ai-news');
      const data = await res.json();
      setArticles(data.articles);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {articles.length === 0 ? (
        <p className="text-gray-400 text-sm">아직 도착한 뉴스가 없어요.</p>
      ) : (
        articles.map((item, idx) => (
          <div key={idx} className="relative pl-6 border-l border-gray-300">
            <div className="absolute -left-1.5 top-0 mt-1.5 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="text-xs text-gray-400">
              {new Date(item.timestamp?.seconds * 1000).toLocaleString()}
            </div>
            <div className="text-sm text-gray-700">{item.summary.replace(/^내용:\s*/, '')}</div>
          </div>
        ))
      )}
    </div>
  );
}