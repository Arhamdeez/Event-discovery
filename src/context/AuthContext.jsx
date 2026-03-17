import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEYS = {
  user: 'raunaq_user',
  createdEvents: 'raunaq_created_events',
  attendedIds: 'raunaq_attended_ids',
};

const AdminEmail = 'admin@raunaq.com';

const AuthContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => readStorage(STORAGE_KEYS.user, null));
  const [createdEvents, setCreatedEvents] = useState(() => readStorage(STORAGE_KEYS.createdEvents, []));
  const [attendedEventIds, setAttendedEventIds] = useState(() => readStorage(STORAGE_KEYS.attendedIds, []));

  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  const login = useCallback((email) => {
    setUser({
      email,
      isAdmin: email.toLowerCase() === AdminEmail,
    });
  }, [setUser]);

  const signup = useCallback((email) => {
    setUser({
      email,
      isAdmin: email.toLowerCase() === AdminEmail,
    });
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const addCreatedEvent = useCallback((event) => {
    setCreatedEvents((prev) => {
      const next = [...prev, event];
      localStorage.setItem(STORAGE_KEYS.createdEvents, JSON.stringify(next));
      return next;
    });
  }, []);

  const attendEvent = useCallback((eventId) => {
    setAttendedEventIds((prev) => {
      if (prev.includes(eventId)) return prev;
      const next = [...prev, eventId];
      localStorage.setItem(STORAGE_KEYS.attendedIds, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    isLoggedIn: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    signup,
    logout,
    createdEvents,
    addCreatedEvent,
    attendedEventIds,
    attendEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
