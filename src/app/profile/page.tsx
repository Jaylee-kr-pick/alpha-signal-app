'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, updateProfile, deleteUser, User } from 'firebase/auth';
import { app } from '@/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
      } else {
        setUser(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      const db = getFirestore(app);
      const userDocRef = doc(db, 'user', user.uid);
      await deleteDoc(userDocRef);
      console.log('✅ Firestore user 문서 삭제 완료');

      await deleteUser(user);
      alert('회원 탈퇴가 완료되었습니다.');
      router.push('/login');
    } catch (error: unknown) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      alert('필명이 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('필명 업데이트 오류:', error);
      alert('필명 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>로그인 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-grow max-w-md w-full mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">👤 내 프로필</h2>
        <div className="text-center mb-6">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt="프로필 사진"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
          )}
          <p className="text-lg font-semibold">{user.displayName || '필명 없음'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              필명
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="새 필명 입력"
              className="border px-4 py-2 rounded w-full text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition"
            disabled={saving}
          >
            {saving ? '저장 중...' : '필명 저장'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition"
          >
            로그아웃
          </button>
        </div>
      </div>
      <div className="mt-auto w-full max-w-md mx-auto p-4">
        <button
          onClick={handleDeleteAccount}
          className="w-full py-2 px-4 text-red-500 text-xs underline"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
