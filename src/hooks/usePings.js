import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export function usePings(user) {
  const [incomingPing, setIncomingPing] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'pings'),
      where('to', '==', user.uid),
      where('read', '==', false)
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const ping = { id: change.doc.id, ...change.doc.data() };
          setIncomingPing(ping);
          setTimeout(() => setIncomingPing(null), 5000);
        }
      });
    });

    return unsub;
  }, [user?.uid]);

  const dismissPing = async (pingId) => {
    if (!pingId) return;
    try {
      await updateDoc(doc(db, 'pings', pingId), { read: true });
    } catch (err) {
      console.error('Failed to dismiss ping:', err);
    }
    setIncomingPing(null);
  };

  return { incomingPing, dismissPing };
}
