// src/utils/kisTokenCache.ts

import fs from 'fs';
import path from 'path';

const tokenFile = path.join(process.cwd(), 'kis-token.json');

export function loadToken(): { token: string; expiresAt: number } | null {
  if (!fs.existsSync(tokenFile)) return null;
  try {
    const raw = fs.readFileSync(tokenFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveToken(token: string, expiresIn: number): void {
  const expiresAt = Date.now() + (expiresIn - 60) * 1000; // 1분 여유
  const data = { token, expiresAt };
  fs.writeFileSync(tokenFile, JSON.stringify(data));
}