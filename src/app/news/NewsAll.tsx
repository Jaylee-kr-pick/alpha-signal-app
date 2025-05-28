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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedArticles = articles.slice(startIdx, endIdx);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news/all', { cache: 'no-store' });
        if (!res.ok) throw new Error('서버 응답 실패');
        console.log('📥 전체 뉴스 fetch 성공:', res.ok);
        const json = await res.json();
        console.log('📥 전체 뉴스 응답:', json);
        if (Array.isArray(json.articles)) {
          setArticles(json.articles);
        } else {
          setArticles([]);
        }
      } catch (e) {
        console.error('❌ 뉴스 불러오기 오류:', e);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4">
      {loading && <p className="text-sm text-gray-400">뉴스를 불러오는 중...</p>}
      {!loading && articles.length === 0 && (
        <p className="text-sm text-gray-400">아직 도착한 뉴스가 없습니다.</p>
      )}

      {!loading && articles.length > 0 && (
        <>
          <ul className="mt-4 space-y-4">
            {paginatedArticles.map((item, idx) => (
              <li key={idx} className="bg-white p-4 rounded shadow text-sm">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {item.title}
                </a>
                <p className="text-xs text-gray-400 mt-1">{item.pubDate}</p>
                <p className="text-xs text-gray-600 mt-2">{item.summary}</p>
              </li>
            ))}
          </ul>
          <div className="overflow-x-auto mt-4 pb-4">
            <div className="flex justify-center items-center space-x-2 text-sm">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                처음
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ◀
              </button>
              {Array.from({ length: 5 }, (_, i) => {
                const offset = Math.max(0, Math.min(currentPage - 3, totalPages - 5));
                const pageNum = offset + i + 1;
                return pageNum <= totalPages ? (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded ${
                      currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ) : null;
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ▶
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}