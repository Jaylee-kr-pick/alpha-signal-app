'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, updateProfile, deleteUser, User } from 'firebase/auth';
import { app } from '@/firebase'; // 기존 경로 반영
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
        router.push('/login'); // 로그인 안 되어 있으면 로그인 페이지로 리다이렉트
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
      await deleteDoc(userDocRef); // Firestore 문서 삭제
      console.log('✅ Firestore user 문서 삭제 완료');

      await deleteUser(user); // Firebase Auth 계정 삭제
      alert('회원 탈퇴가 완료되었습니다.');
      router.push('/login');
    } catch (error: unknown) {
      console.error('회원 탈퇴 실패:', error);
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/requires-recent-login') {
          alert('오래된 로그인입니다. 다시 로그인 후 다시 시도해주세요.');
        } else {
          alert('회원 탈퇴에 실패했습니다.');
        }
      } else {
        alert('회원 탈퇴에 실패했습니다.');
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      alert('이름이 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('이름 업데이트 오류:', error);
      alert('이름 변경에 실패했습니다.');
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">👤 프로필</h2>
      <div className="text-center">
        {user.photoURL && (
          <Image
            src={user.photoURL}
            alt="프로필 사진"
            width={96}
            height={96}
            className="w-24 h-24 rounded-full mx-auto mb-4"
          />
        )}
        <p className="text-lg font-semibold">{user.displayName || '이름 없음'}</p>
        <p className="text-sm text-gray-600 mb-6">{user.email}</p>
        <div className="mt-6">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="새 이름 입력"
            className="border px-3 py-2 rounded w-full mb-2 text-sm"
          />
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm w-full"
            disabled={saving}
          >
            {saving ? '저장 중...' : '이름 저장'}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm mt-4"
        >
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          className="text-red-400 text-xs mt-2 underline"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
