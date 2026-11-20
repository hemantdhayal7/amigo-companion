import { useEffect, useState } from 'react';
import { rtdb, db } from '../firebase';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

export function usePresence(user, partner) {
  const [partnerPresence, setPartnerPresence] = useState({ online: false, status: 'offline', activity: '', lastSeen: null });

  useEffect(() => {
    if (!user) return;

    const userStatusRef = ref(rtdb, `presence/${user.uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (!snap.val()) return;

      onDisconnect(userStatusRef).set({
        online: false,
        lastSeen: serverTimestamp(),
      });

      set(userStatusRef, {
        online: true,
        lastSeen: serverTimestamp(),
      });
    });

    return () => {
      unsub();
      set(userStatusRef, { online: false, lastSeen: serverTimestamp() });
    };
  }, [user]);

  useEffect(() => {
    if (!partner?.uid) return;

    const presenceRef = ref(rtdb, `presence/${partner.uid}`);
    const unsub = onValue(presenceRef, (snap) => {
      const data = snap.val();
      if (data) {
        setPartnerPresence(prev => ({ ...prev, online: data.online, lastSeen: data.lastSeen }));
      }
    });

    const unsubFirestore = onSnapshot(doc(db, 'users', partner.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPartnerPresence(prev => ({ ...prev, status: d.status || 'offline', activity: d.activity || '' }));
      }
    });

    return () => { unsub(); unsubFirestore(); };
  }, [partner?.uid]);

  const setMyStatus = async (status, activity = '') => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { status, activity });
  };

  return { partnerPresence, setMyStatus };
}
