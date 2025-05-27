'use client';

import { useEffect, useState } from 'react';

type Article = {
  title: string;
  link: string;
  published: string;
};

export default function NewsAiTab() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/ai-news');
      const data = await res.json();
      setArticles(data.articles);
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {articles.map((item, idx) => (
        <div key={idx} className="border-b pb-3">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold">
            {item.title}
          </a>
          <div className="text-xs text-gray-400">{item.published}</div>
        </div>
      ))}
    </div>
  );
}