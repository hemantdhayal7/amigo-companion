import { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useSyncData(user, key, fallback) {
  const [data, setData] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'userData', user.uid, 'data', key), (snap) => {
      if (snap.exists()) {
        setData(snap.data().value);
      }
      setLoaded(true);
    });

    return unsub;
  }, [user?.uid, key]);

  const saveData = useCallback(async (value) => {
    if (!user?.uid) return;
    setData(value);
    await setDoc(doc(db, 'userData', user.uid, 'data', key), { value, updatedAt: new Date().toISOString() });
  }, [user?.uid, key]);

  return [data, saveData, loaded];
}

export function usePartnerData(partnerId, key, fallback) {
  const [data, setData] = useState(fallback);

  useEffect(() => {
    if (!partnerId) return;

    const unsub = onSnapshot(doc(db, 'userData', partnerId, 'data', key), (snap) => {
      if (snap.exists()) {
        setData(snap.data().value);
      }
    });

    return unsub;
  }, [partnerId, key]);

  return data;
}
