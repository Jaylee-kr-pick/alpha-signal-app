'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/firebase';
import Image from 'next/image';

const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "user", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email || '',
            displayName: user.displayName || '',
            createdAt: serverTimestamp(),
            plan: 'free', // default 요금제
          });
          console.log('✅ Firestore user 문서 생성 완료');
        }

        router.push('/'); // 로그인되면 홈화면으로 이동
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('구글 로그인 에러:', error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">로그인</h1>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full py-3 px-6 border rounded shadow hover:bg-gray-100 transition text-gray-700"
        >
          <Image
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
            width={24}
            height={24}
            className="w-6 h-6 mr-4"
          />
          <span>구글로 로그인</span>
        </button>
        {loading && <p className="mt-4 text-gray-500 text-sm">로그인 중...</p>}
      </div>
    </div>
  );
}