// src/app/search/page.tsx
'use client';

import { useState } from 'react';
import StockKoSearch from './StockKoSearch';
import StockGlobalSearch from './StockGlobalSearch';
import CryptoSearch from './CryptoSearch';

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<'ko' | 'global' | 'crypto'>('ko');

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h1 className="text-lg font-bold">관심종목 검색</h1>
      </div>

      <div className="flex justify-around py-2 border-b bg-white text-sm">
        <button
          onClick={() => setActiveTab('ko')}
          className={activeTab === 'ko' ? 'font-bold text-black' : 'text-gray-400'}
        >
          국내주식
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={activeTab === 'global' ? 'font-bold text-black' : 'text-gray-400'}
        >
          해외주식
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className={activeTab === 'crypto' ? 'font-bold text-black' : 'text-gray-400'}
        >
          코인
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'ko' && <StockKoSearch />}
        {activeTab === 'global' && <StockGlobalSearch />}
        {activeTab === 'crypto' && <CryptoSearch />}
      </div>
    </div>
  );
}
