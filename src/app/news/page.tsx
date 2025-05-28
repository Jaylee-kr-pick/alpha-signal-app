'use client';

import NewsAll from './NewsAll';
import { useState } from 'react';
import NewsAiTab from './NewsAiTab';
import NewsWatchlist from './NewsWatchlist';

export default function NewsPage() {
  const [tab, setTab] = useState<'ai' | 'all' | 'watchlist'>('ai');

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">📢 뉴스</h1>
        <div className="flex space-x-4 mt-2 text-sm">
          <button onClick={() => setTab('ai')} className={tab === 'ai' ? 'font-bold' : ''}>AI 뉴스 속보</button>
          <button onClick={() => setTab('all')} className={tab === 'all' ? 'font-bold' : ''}>전체 뉴스</button>
          <button onClick={() => setTab('watchlist')} className={tab === 'watchlist' ? 'font-bold' : ''}>관심종목 뉴스</button>
        </div>
      </div>

      <div className="p-4">
        {tab === 'ai' && <NewsAiTab />}
        {tab === 'all' && <NewsAll />}
        {tab === 'watchlist' && <NewsWatchlist />}
      </div>
    </div>
  );
}