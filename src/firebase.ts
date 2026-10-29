import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBRDABrxL-GFm0zwAhDurKDuzt5yI0UOg4',
  authDomain: 'caseassist-3625a.firebaseapp.com',
  projectId: 'caseassist-3625a',
  storageBucket: 'caseassist-3625a.firebasestorage.app',
  messagingSenderId: '548021621291',
  appId: '1:548021621291:web:ddb65d12992854c950106e',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);