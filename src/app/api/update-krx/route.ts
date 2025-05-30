interface ZipEntry {
  entryName: string;
  getData: () => Buffer;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const apiKey = process.env.DART_API_KEY;
if (!apiKey) {
  throw new Error('DART API 키가 없습니다. .env.local 파일을 확인하세요.');
}

async function fetchAndUploadKRX() {
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`파일 다운로드 실패: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries() as ZipEntry[];
  const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.xml'));

  if (!xmlEntry) {
    throw new Error('XML 파일을 찾을 수 없습니다.');
  }

  const content = xmlEntry.getData().toString('utf-8');
  const parsedXml = await parseStringPromise(content);
  const corpList = parsedXml.result.list;

  if (!corpList) {
    throw new Error('기업 리스트를 파싱할 수 없습니다.');
  }

  interface ParsedCorpRecord {
    code: string;
    name: string;
    stock_code: string;
    modify_date: string;
  }

  interface CorpRecord {
    corp_code: string;
    corp_name: string;
    stock_code: string;
    modify_date: string;
  }

  const records: ParsedCorpRecord[] = corpList.map((corp: unknown) => {
    const c = corp as CorpRecord;
    return {
      code: c.corp_code,
      name: c.corp_name,
      stock_code: c.stock_code,
      modify_date: c.modify_date,
    };
  }).filter((record: ParsedCorpRecord) => record.code && record.name && record.stock_code);

  const chunkSize = 1000;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { error } = await supabase.from('kr_stocks').upsert(chunk, {
      onConflict: ['code'], // code 기준으로 중복 방지
    });
    if (error) {
      throw new Error(`Supabase 저장 실패: ${error.message}`);
    }
  }

  return records.length;
}

export async function GET() {
  try {
    const count = await fetchAndUploadKRX();
    return NextResponse.json({
      message: 'KRX 종목 업데이트 완료',
      total: count,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('🔥 KRX 업데이트 실패:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('🔥 KRX 업데이트 실패: 알 수 없는 에러', error);
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}