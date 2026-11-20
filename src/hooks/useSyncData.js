import { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useSyncData(user, key, fallback) {
  const [data, setData] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'userData', user.uid, 'data', key), (snap) => {
      if (snap.exists()) {
        const val = snap.data().value;
        setData(val);
        dataRef.current = val;
      }
      setLoaded(true);
    });

    return unsub;
  }, [user?.uid, key]);

  const saveData = useCallback(async (valueOrFn) => {
    if (!user?.uid) return;
    const newValue = typeof valueOrFn === 'function' ? valueOrFn(dataRef.current) : valueOrFn;
    setData(newValue);
    dataRef.current = newValue;
    await setDoc(doc(db, 'userData', user.uid, 'data', key), { value: newValue, updatedAt: new Date().toISOString() });
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
