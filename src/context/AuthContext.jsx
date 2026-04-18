import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, firebaseInitError } from '../lib/firebase';

const AuthContext = createContext(null);

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@raunaq.com').toLowerCase().trim();

function authErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function firestoreErrorMessage(code, message) {
  if (code === 'permission-denied') {
    return 'Firestore blocked this save. In Firebase Console → Firestore → Rules, publish rules that allow signed-in users to write their own data, or run: firebase deploy --only firestore:rules from the Event-discovery folder.'
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Could not reach Firestore. Check your network and try again.'
  }
  if (code === 'failed-precondition') {
    return 'Firestore may not be enabled for this project. Open Firebase Console → Firestore Database and create the database.'
  }
  return message || 'Could not save to the database.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(auth));
  const [createdEvents, setCreatedEvents] = useState([]);
  const [attendedEventIds, setAttendedEventIds] = useState([]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setCreatedEvents([]);
        setAttendedEventIds([]);
      } else {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          isAdmin: (fbUser.email || '').toLowerCase() === adminEmail,
        });
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const uid = user?.uid;

  useEffect(() => {
    if (!db || !uid) {
      return undefined;
    }

    const unsubCreated = onSnapshot(collection(db, 'users', uid, 'createdEvents'), (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, id: data.id || d.id };
      });
      list.sort((a, b) => String(b.id).localeCompare(String(a.id)));
      setCreatedEvents(list);
    });

    const unsubAttended = onSnapshot(collection(db, 'users', uid, 'attended'), (snap) => {
      setAttendedEventIds(snap.docs.map((d) => d.id));
    });

    return () => {
      unsubCreated();
      unsubAttended();
    };
  }, [uid]);

  const login = useCallback(async (email, password) => {
    if (!auth) {
      throw new Error(
        firebaseInitError?.message ||
          'Firebase Auth is not configured. Add VITE_FIREBASE_* keys to .env and restart the dev server.',
      );
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      throw new Error(authErrorMessage(e.code));
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    if (!auth || !db) {
      throw new Error(
        firebaseInitError?.message ||
          'Firebase is not configured. Add VITE_FIREBASE_* keys to .env and restart the dev server.',
      );
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          email: cred.user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (e) {
      throw new Error(authErrorMessage(e.code));
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const addCreatedEvent = useCallback(async (event) => {
    if (!db) {
      throw new Error(
        firebaseInitError?.message ||
          'Firestore is not available. Check your Firebase config in .env and restart the dev server.',
      );
    }
    if (!auth?.currentUser) {
      throw new Error('You must be signed in to create an event.');
    }
    const u = auth.currentUser;
    const payload = stripUndefined({ ...event });
    const email = u.email || 'host@events.app';
    const namePart = email.split('@')[0] || 'host';
    const organizerName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const publicPayload = stripUndefined({
      ...payload,
      organizerId: u.uid,
      organizerEmail: email,
      organizerName,
      organizerInitial: organizerName.charAt(0).toUpperCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', u.uid, 'createdEvents', event.id);
    const publicRef = doc(db, 'events', event.id);
    batch.set(userRef, { ...payload, updatedAt: serverTimestamp() });
    batch.set(publicRef, publicPayload);

    try {
      await batch.commit();
    } catch (e) {
      throw new Error(firestoreErrorMessage(e.code, e.message));
    }
  }, []);

  const attendEvent = useCallback(async (eventId) => {
    if (!db || !auth?.currentUser) {
      throw new Error(!auth?.currentUser ? 'You must be signed in.' : 'Firestore is not available.');
    }
    const u = auth.currentUser;
    try {
      await setDoc(doc(db, 'users', u.uid, 'attended', eventId), {
        eventId,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      throw new Error(firestoreErrorMessage(e.code, e.message));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      firebaseInitError,
      isLoggedIn: !!user,
      isAdmin: !!user?.isAdmin,
      login,
      signup,
      logout,
      createdEvents,
      addCreatedEvent,
      attendedEventIds,
      attendEvent,
    }),
    [user, authLoading, login, signup, logout, createdEvents, addCreatedEvent, attendedEventIds, attendEvent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook pattern
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
