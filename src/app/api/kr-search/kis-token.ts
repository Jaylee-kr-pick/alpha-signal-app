// src/app/api/kr-search/kis-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/lib/firebaseConfig';

let cachedToken: string | null = null;
let cachedTime: number | null = null;

// Initialize Firebase only once
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const docRef = doc(db, 'kis-token', 'current');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const { access_token, timestamp } = snapshot.data();
    if (now - timestamp < TWENTY_FOUR_HOURS) {
      return res.status(200).json({ access_token });
    }
  }

  const response = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      appkey: process.env.KIS_APPKEY!,
      appsecret: process.env.KIS_APPSECRET!,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json({ error: 'Failed to obtain token', details: data });
  }

  await setDoc(docRef, {
    access_token: data.access_token,
    timestamp: now,
  });

  res.status(200).json({ access_token: data.access_token });
}