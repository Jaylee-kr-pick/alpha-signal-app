// src/firebase-admin.js

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// settings() 호출은 초기화 후 최초 한 번만 실행
if (!admin.firestore()._settingsFrozen) {
  db.settings({
    ignoreUndefinedProperties: true,
  });
}

const FieldValue = admin.firestore.FieldValue;

export { db, FieldValue };