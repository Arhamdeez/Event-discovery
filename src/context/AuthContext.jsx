import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, firebaseInitError } from '../lib/firebase';
import { detectAndCacheAutoCity } from '../lib/autoCity';
import { resolveEventOrganizer } from '../lib/organizers';
import { buildTicketTiers } from '../lib/tickets';
import { AuthContext } from './authContext';

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
    return 'Firestore blocked this save. Publish Firestore Rules that allow signed-in users to RSVP (increment attendeeCount) and write their own attended list, then try again.'
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
    if (!uid) return;
    detectAndCacheAutoCity({ preferCache: false }).catch(() => {
      // Ignore location failures here; screens can still request location later.
    });
  }, [uid]);

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

  const updateCreatedEvent = useCallback(async (event) => {
    if (!db) {
      throw new Error(
        firebaseInitError?.message ||
          'Firestore is not available. Check your Firebase config in .env and restart the dev server.',
      );
    }
    if (!auth?.currentUser) {
      throw new Error('You must be signed in to edit an event.');
    }
    if (!event?.id) {
      throw new Error('Invalid event.');
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
      updatedAt: serverTimestamp(),
    });

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', u.uid, 'createdEvents', event.id);
    const publicRef = doc(db, 'events', event.id);
    batch.set(userRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    batch.set(publicRef, publicPayload, { merge: true });

    try {
      await batch.commit();
    } catch (e) {
      throw new Error(firestoreErrorMessage(e.code, e.message));
    }
  }, []);

  const attendEvent = useCallback(async (eventInput) => {
    if (!db || !auth?.currentUser) {
      throw new Error(!auth?.currentUser ? 'You must be signed in.' : 'Firestore is not available.');
    }
    const u = auth.currentUser;
    const eventId = typeof eventInput === 'string' ? eventInput : eventInput?.id;
    if (!eventId) {
      throw new Error('Invalid event ID.');
    }
    const eventSeed = typeof eventInput === 'object' && eventInput ? eventInput : null;
    try {
      await runTransaction(db, async (tx) => {
        const attendedRef = doc(db, 'users', u.uid, 'attended', eventId);
        const eventRef = doc(db, 'events', eventId);

        const attendedSnap = await tx.get(attendedRef);
        if (attendedSnap.exists()) return;

        const eventSnap = await tx.get(eventRef);
        if (!eventSnap.exists()) {
          const organizer = resolveEventOrganizer({ ...eventSeed, id: eventId });
          const seedCount = Number(eventSeed?.attendeeCount ?? 0);
          const nextCount = (Number.isFinite(seedCount) && seedCount >= 0 ? seedCount : 0) + 1;
          tx.set(
            eventRef,
            stripUndefined({
              id: eventId,
              title: eventSeed?.title || 'Community Event',
              description: eventSeed?.description || '',
              date: eventSeed?.date || '',
              time: eventSeed?.time || '',
              location: eventSeed?.location || '',
              category: eventSeed?.category || 'General',
              image: eventSeed?.image,
              ticketName: eventSeed?.ticketName,
              ticketPrice: eventSeed?.ticketPrice,
              ticketUrl: eventSeed?.ticketUrl,
              ticketTiers: eventSeed?.ticketTiers || buildTicketTiers({ ...eventSeed, id: eventId }),
              organizerId: u.uid,
              organizerEmail: organizer.organizerEmail,
              organizerName: organizer.organizerName,
              organizerInitial: organizer.organizerInitial,
              attendeeCount: nextCount,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
          );
        } else {
          const current = Number(eventSnap.data()?.attendeeCount ?? 0);
          const nextCount = Number.isFinite(current) ? current + 1 : 1;

          tx.update(eventRef, {
            attendeeCount: nextCount,
            updatedAt: serverTimestamp(),
          });
        }

        tx.set(attendedRef, {
          eventId,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      throw new Error(firestoreErrorMessage(e.code, e.message));
    }
  }, []);

  const leaveEvent = useCallback(async (eventId) => {
    if (!db || !auth?.currentUser) {
      throw new Error(!auth?.currentUser ? 'You must be signed in.' : 'Firestore is not available.');
    }
    if (!eventId) {
      throw new Error('Invalid event ID.');
    }
    const u = auth.currentUser;

    try {
      await runTransaction(db, async (tx) => {
        const attendedRef = doc(db, 'users', u.uid, 'attended', eventId);
        const eventRef = doc(db, 'events', eventId);

        const attendedSnap = await tx.get(attendedRef);
        if (!attendedSnap.exists()) return;

        const eventSnap = await tx.get(eventRef);
        if (eventSnap.exists()) {
          const current = Number(eventSnap.data()?.attendeeCount ?? 0);
          const nextCount = Math.max(0, Number.isFinite(current) ? current - 1 : 0);
          tx.update(eventRef, {
            attendeeCount: nextCount,
            updatedAt: serverTimestamp(),
          });
        }

        tx.delete(attendedRef);
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
      updateCreatedEvent,
      attendedEventIds,
      attendEvent,
      leaveEvent,
    }),
    [user, authLoading, login, signup, logout, createdEvents, addCreatedEvent, updateCreatedEvent, attendedEventIds, attendEvent, leaveEvent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

