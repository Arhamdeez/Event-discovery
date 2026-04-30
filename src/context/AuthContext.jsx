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
import { getEventImageByCategory } from '../constants/images';
import { AuthContext } from './authContext';

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@raunaq.com').toLowerCase().trim();
const fixedAdminEmails = ['l226619@lhr.nu.edu.pk', 'l226994@lhr.nu.edu.pk'];
const adminEmails = [...new Set([adminEmail, ...fixedAdminEmails].map((email) => String(email || '').toLowerCase().trim()).filter(Boolean))];

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
    return 'Firestore blocked this save. Publish the latest Firestore Rules for this feature, then try again.'
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
  const [followersCount, setFollowersCount] = useState(0);
  const [followingIds, setFollowingIds] = useState([]);
  const [followableOrganizers, setFollowableOrganizers] = useState([]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setCreatedEvents([]);
        setAttendedEventIds([]);
        setFollowersCount(0);
        setFollowingIds([]);
        setFollowableOrganizers([]);
      } else {
        const email = (fbUser.email || '').toLowerCase().trim();
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          isAdmin: adminEmails.includes(email),
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

  useEffect(() => {
    if (!db || !uid) {
      return undefined;
    }

    const unsubFollowers = onSnapshot(collection(db, 'users', uid, 'followers'), (snap) => {
      setFollowersCount(snap.size);
    });

    const unsubFollowing = onSnapshot(collection(db, 'users', uid, 'following'), (snap) => {
      setFollowingIds(snap.docs.map((d) => d.id));
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [uid]);

  useEffect(() => {
    if (!db || !uid) {
      return undefined;
    }

    const unsubOrganizers = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const uniqueOrganizers = new Map();
        snap.docs.forEach((eventDoc) => {
          const data = eventDoc.data() || {};
          const organizerId = String(data.organizerId || '').trim();
          if (!organizerId || organizerId === uid) {
            return;
          }
          if (uniqueOrganizers.has(organizerId)) {
            return;
          }
          uniqueOrganizers.set(organizerId, {
            id: organizerId,
            organizerName: data.organizerName || data.organizerEmail?.split?.('@')?.[0] || 'Organizer',
            organizerEmail: data.organizerEmail || '',
          });
        });

        setFollowableOrganizers(
          Array.from(uniqueOrganizers.values()).sort((a, b) =>
            String(a.organizerName).localeCompare(String(b.organizerName)),
          ),
        );
      },
      () => {
        setFollowableOrganizers([]);
      },
    );

    return () => unsubOrganizers();
  }, [uid, followingIds]);

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
    const reviewStatus = 'pending';
    const eventPayload = stripUndefined({
      ...payload,
      reviewStatus,
    });
    const publicPayload = stripUndefined({
      ...eventPayload,
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
    batch.set(userRef, { ...eventPayload, updatedAt: serverTimestamp() });
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
    const reviewStatus = 'pending';
    const eventPayload = stripUndefined({
      ...payload,
      reviewStatus,
    });

    const publicPayload = stripUndefined({
      ...eventPayload,
      organizerId: u.uid,
      organizerEmail: email,
      organizerName,
      organizerInitial: organizerName.charAt(0).toUpperCase(),
      updatedAt: serverTimestamp(),
    });

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', u.uid, 'createdEvents', event.id);
    const publicRef = doc(db, 'events', event.id);
    batch.set(userRef, { ...eventPayload, updatedAt: serverTimestamp() }, { merge: true });
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
              image: getEventImageByCategory(eventSeed?.category || 'General'),
              reviewStatus: 'approved',
              ticketTiers: buildTicketTiers(),
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

  const followOrganizer = useCallback(async (organizerInput) => {
    if (!db || !auth?.currentUser) {
      throw new Error(!auth?.currentUser ? 'You must be signed in.' : 'Firestore is not available.');
    }
    const organizerId =
      typeof organizerInput === 'string'
        ? organizerInput
        : organizerInput?.id || organizerInput?.organizerId || '';
    if (!organizerId) {
      throw new Error('Invalid organizer.');
    }
    const u = auth.currentUser;
    if (organizerId === u.uid) {
      throw new Error('You cannot follow yourself.');
    }

    const followerRef = doc(db, 'users', organizerId, 'followers', u.uid);
    const followingRef = doc(db, 'users', u.uid, 'following', organizerId);
    const organizerEmail =
      typeof organizerInput === 'object' && organizerInput
        ? organizerInput.organizerEmail || ''
        : '';
    const organizerName =
      typeof organizerInput === 'object' && organizerInput
        ? organizerInput.organizerName || ''
        : '';
    const followerPayload = {
      uid: u.uid,
      organizerId,
      followerEmail: u.email || '',
      followedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const followingPayload = {
      uid: u.uid,
      organizerId,
      organizerEmail,
      organizerName,
      followedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(followerRef, followerPayload);
      batch.set(followingRef, followingPayload);
      await batch.commit();
    } catch (e) {
      throw new Error(firestoreErrorMessage(e.code, e.message));
    }
  }, []);

  const unfollowOrganizer = useCallback(async (organizerId) => {
    if (!db || !auth?.currentUser) {
      throw new Error(!auth?.currentUser ? 'You must be signed in.' : 'Firestore is not available.');
    }
    if (!organizerId) {
      throw new Error('Invalid organizer.');
    }
    const u = auth.currentUser;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', organizerId, 'followers', u.uid));
      batch.delete(doc(db, 'users', u.uid, 'following', organizerId));
      await batch.commit();
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
      adminEmails,
      login,
      signup,
      logout,
      createdEvents,
      addCreatedEvent,
      updateCreatedEvent,
      attendedEventIds,
      attendEvent,
      leaveEvent,
      followersCount,
      followingIds,
      followableOrganizers,
      followOrganizer,
      unfollowOrganizer,
    }),
    [
      user,
      authLoading,
      login,
      signup,
      logout,
      createdEvents,
      addCreatedEvent,
      updateCreatedEvent,
      attendedEventIds,
      attendEvent,
      leaveEvent,
      followersCount,
      followingIds,
      followableOrganizers,
      followOrganizer,
      unfollowOrganizer,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

