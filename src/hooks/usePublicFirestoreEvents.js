import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

function createdAtMillis(ev) {
  const v = ev.createdAt;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  return 0;
}

export function usePublicFirestoreEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!db) return undefined;

    const unsub = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((ev) => {
            const status = String(ev.reviewStatus || '').toLowerCase();
            return !status || status === 'approved';
          });
        list.sort((a, b) => createdAtMillis(b) - createdAtMillis(a));
        setEvents(list);
      },
      () => {
        /* keep last snapshot on transient errors */
      },
    );

    return () => unsub();
  }, []);

  return events;
}
