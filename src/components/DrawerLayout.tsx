'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/firebase';

export default function DrawerLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="w-[390px] min-h-screen relative bg-white shadow-md pb-24">
      {/* 헤더 */}
      <header className="p-4 border-b border-gray-200 text-center font-bold text-lg flex justify-between items-center bg-white">
        <button onClick={() => setDrawerOpen(true)} className="text-2xl text-gray-700">☰</button>
        <span>Alpha Signal</span>
        <div className="w-6" />
      </header>

      {/* 본문 */}
      <main className="p-4 pb-24">
        {children}
      </main>

      {/* 퀵바 */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-200 flex justify-around py-2 text-xs z-30">
        <Link href="/" className="text-gray-500 text-center">
          <div className="text-lg">⏱</div>
          <div>Dashboard</div>
        </Link>
        <Link href="/news" className="text-gray-500 text-center">
          <div className="text-lg">🗞</div>
          <div>News</div>
        </Link>
        <Link href="/signals" className="text-gray-500 text-center">
          <div className="text-lg">💹</div>
          <div>Signals</div>
        </Link>
        <Link href="/watchlist" className="text-gray-500 text-center">
          <div className="text-lg">📌</div>
          <div>관심종목</div>
        </Link>
        <Link href="/profile" className="text-gray-500 text-center">
          <div className="text-lg">👤</div>
          <div>프로필</div>
        </Link>
      </footer>

      {/* 드로어 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex transition-all duration-300">
          <div className="w-2/3 bg-white p-4 shadow-lg flex flex-col gap-4 text-sm animate-slide-in">
            <h2 className="font-bold text-lg mb-2">📋 전체 메뉴</h2>
            <p className="text-xs text-gray-500 mb-4">Alpha Signal은 주식 및 코인 시장의 AI 기반 분석 시그널을 제공합니다.</p>
            <Link href="/" onClick={() => setDrawerOpen(false)}>⏱ Dashboard</Link>
            <Link href="/news" onClick={() => setDrawerOpen(false)}>🗞 News</Link>
            <Link href="/signals" onClick={() => setDrawerOpen(false)}>💹 Signals</Link>
            <Link href="/watchlist" onClick={() => setDrawerOpen(false)}>📌 관심종목</Link>
            <Link href="/profile" onClick={() => setDrawerOpen(false)}>👤 프로필</Link>

            <div className="mt-auto pt-6 border-t text-xs text-gray-500 space-y-2">
              {auth.currentUser ? (
                <>
                  <p>👤 로그인됨</p>
                  <p>{auth.currentUser.email}</p>
                  <p>🪙 구독 상태: 기본</p>
                  <button
                    onClick={() => auth.signOut()}
                    className="text-red-500 text-xs underline mt-2"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <p>로그인되지 않음</p>
              )}
              <Link
                href="https://www.youtube.com/@%ED%94%BD%EC%98%AC%EB%8D%A4%ED%94%84"
                target="_blank"
                className="block text-blue-500 text-xs underline mt-4"
              >
                🎥 유튜브 바로 가기
              </Link>
            </div>
          </div>

          {/* 배경 눌러서 닫기 */}
          <div
            className="flex-1 bg-black/30"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}