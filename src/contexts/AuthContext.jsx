import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileDoc = await getDoc(doc(db, 'users', u.uid));
        if (profileDoc.exists()) {
          const p = profileDoc.data();
          setProfile(p);
          if (p.partnerId) {
            const partnerDoc = await getDoc(doc(db, 'users', p.partnerId));
            if (partnerDoc.exists()) setPartner({ uid: p.partnerId, ...partnerDoc.data() });
          }
        }
      } else {
        setProfile(null);
        setPartner(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName,
      email,
      initial: displayName.charAt(0).toUpperCase(),
      color: 'var(--g)',
      createdAt: new Date().toISOString(),
      partnerId: null,
      status: 'offline',
      activity: '',
    });
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setPartner(null);
  };

  const linkPartner = async (partnerEmail) => {
    if (!user) return;
    const { getDocs, query, collection, where } = await import('firebase/firestore');
    const q = query(collection(db, 'users'), where('email', '==', partnerEmail));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('No user found with that email');
    const partnerDoc = snap.docs[0];
    const partnerId = partnerDoc.id;
    if (partnerId === user.uid) throw new Error('Cannot link to yourself');

    await setDoc(doc(db, 'users', user.uid), { partnerId }, { merge: true });
    await setDoc(doc(db, 'users', partnerId), { partnerId: user.uid }, { merge: true });

    setPartner({ uid: partnerId, ...partnerDoc.data() });
    setProfile(prev => ({ ...prev, partnerId }));
  };

  const value = { user, profile, partner, loading, signup, login, logout, linkPartner };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
