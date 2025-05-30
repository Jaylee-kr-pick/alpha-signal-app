'use client';

import { auth, db } from '@/firebase'; // ✅ Firebase import 경로 수정
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // 사용자 정보 Firestore에 저장
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }, { merge: true }); // 기존 데이터 덮어쓰지 않고 병합

        alert('로그인 성공! 메인 페이지로 이동합니다.');
        window.location.href = '/'; // 메인 페이지 이동
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Alpha Signal 로그인</h1>
      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 border border-gray-300 rounded-md px-6 py-3 shadow-md hover:shadow-lg bg-white text-gray-700 text-lg font-medium hover:bg-gray-100 transition duration-200"
      >
        <Image
          src="/google-logo.svg" // ✅ public 폴더에 google-logo.svg 필요
          alt="Google Logo"
          width={24}
          height={24}
        />
        구글 계정으로 로그인
      </button>
    </div>
  );
}