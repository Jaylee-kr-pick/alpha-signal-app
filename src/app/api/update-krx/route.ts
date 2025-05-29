

import { NextResponse } from 'next/server';
import axios from 'axios';
import csv from 'csvtojson';
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import iconv from 'iconv-lite';

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function GET(req: Request): Promise<Response> {
  try {
    const url = 'https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13';
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const decoded = iconv.decode(response.data, 'euc-kr');
    const json = await csv().fromString(decoded);

    const batch = db.batch();
    json.forEach((item: any) => {
      const code = item['종목코드']?.trim();
      const name = item['회사명']?.trim();
      if (code && name) {
        const ref = db.collection('kr_stocks').doc(code);
        batch.set(ref, { name, code });
      }
    });

    await batch.commit();
    return NextResponse.json({ message: 'KRX 업데이트 완료', count: json.length });
  } catch (error) {
    console.error('🔥 KRX 업데이트 실패:', error);
    return NextResponse.json({ error: '업데이트 실패', details: error }, { status: 500 });
  }
}