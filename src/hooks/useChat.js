import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';

function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export function useChat(user, partner) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user?.uid || !partner?.uid) return;

    const cid = chatId(user.uid, partner.uid);
    const q = query(
      collection(db, 'chats', cid, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [user?.uid, partner?.uid]);

  const sendMessage = async (text) => {
    if (!text?.trim() || !user?.uid || !partner?.uid) return;
    const cid = chatId(user.uid, partner.uid);
    await addDoc(collection(db, 'chats', cid, 'messages'), {
      text: text.trim(),
      from: user.uid,
      fromName: user.displayName || 'You',
      createdAt: serverTimestamp(),
    });
  };

  return { messages, sendMessage };
}
