import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC1vFyOzfJzR6kxJF90rjCDhJ37BC95q6A",
  authDomain: "amigoamigo-9e773.firebaseapp.com",
  projectId: "amigoamigo-9e773",
  storageBucket: "amigoamigo-9e773.firebasestorage.app",
  messagingSenderId: "303346540773",
  appId: "1:303346540773:web:f3462d2b614e9d5e70740c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export default app;
