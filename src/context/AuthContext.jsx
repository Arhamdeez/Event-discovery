import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiRequest } from '../lib/api';
import {
  clearAuthState,
  fetchSessionUser,
  loginUser,
  signupUser,
} from '../store/authSlice';
import { detectAndCacheAutoCity } from '../lib/autoCity';
import { AuthContext } from './authContext';

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@raunaq.com').toLowerCase().trim();
const fixedAdminEmails = ['l226619@lhr.nu.edu.pk', 'l226994@lhr.nu.edu.pk'];
const adminEmails = [...new Set([adminEmail, ...fixedAdminEmails].map((email) => String(email || '').toLowerCase().trim()).filter(Boolean))];

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [attendedEventIds, setAttendedEventIds] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingIds, setFollowingIds] = useState([]);
  const [followableOrganizers, setFollowableOrganizers] = useState([]);
  const [apiInitError, setApiInitError] = useState(null);

  useEffect(() => {
    dispatch(fetchSessionUser());
  }, [dispatch]);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    detectAndCacheAutoCity({ preferCache: false }).catch(() => {
      // Location failures should not block authenticated flows.
    });
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    let cancelled = false;
    const loadAll = async () => {
      try {
        const [createdData, attendedData, followsData] = await Promise.all([
          apiRequest('/api/users/me/created-events'),
          apiRequest('/api/users/me/attended'),
          apiRequest('/api/users/me/follows'),
        ]);
        if (cancelled) return;
        setCreatedEvents(createdData?.events || []);
        setAttendedEventIds(attendedData?.attendedEventIds || []);
        setFollowersCount(Number(followsData?.followersCount || 0));
        setFollowingIds(followsData?.followingIds || []);
        setFollowableOrganizers(followsData?.followableOrganizers || []);
        setApiInitError(null);
      } catch (err) {
        if (!cancelled) setApiInitError(err);
      }
    };

    loadAll();
    const interval = window.setInterval(loadAll, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [uid]);

  const refreshFollows = useCallback(async () => {
    if (!uid) return;
    const followsData = await apiRequest('/api/users/me/follows');
    setFollowersCount(Number(followsData?.followersCount || 0));
    setFollowingIds(followsData?.followingIds || []);
    setFollowableOrganizers(followsData?.followableOrganizers || []);
  }, [uid]);

  const refreshCreatedAndAttended = useCallback(async () => {
    if (!uid) return;
    const [createdData, attendedData] = await Promise.all([
      apiRequest('/api/users/me/created-events'),
      apiRequest('/api/users/me/attended'),
    ]);
    setCreatedEvents(createdData?.events || []);
    setAttendedEventIds(attendedData?.attendedEventIds || []);
  }, [uid]);

  const login = useCallback(async (email, password) => {
    const action = await dispatch(loginUser({ email: email.trim(), password }));
    if (action.type.endsWith('/rejected')) {
      throw new Error(action.payload || 'Sign in failed.');
    }
  }, [dispatch]);

  const signup = useCallback(async (email, password) => {
    const action = await dispatch(signupUser({ email: email.trim(), password }));
    if (action.type.endsWith('/rejected')) {
      throw new Error(action.payload || 'Could not create account.');
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    dispatch(clearAuthState());
    setCreatedEvents([]);
    setAttendedEventIds([]);
    setFollowersCount(0);
    setFollowingIds([]);
    setFollowableOrganizers([]);
  }, [dispatch]);

  const addCreatedEvent = useCallback(async (event) => {
    if (!uid) throw new Error('You must be signed in to create an event.');
    const data = await apiRequest('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    await refreshCreatedAndAttended();
    return data?.event || null;
  }, [uid, refreshCreatedAndAttended]);

  const updateCreatedEvent = useCallback(async (event) => {
    if (!uid) throw new Error('You must be signed in to edit an event.');
    if (!event?.id) throw new Error('Invalid event.');
    const data = await apiRequest(`/api/events/${event.id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    await refreshCreatedAndAttended();
    return data?.event || null;
  }, [uid, refreshCreatedAndAttended]);

  const attendEvent = useCallback(async (eventInput) => {
    if (!uid) throw new Error('You must be signed in.');
    const eventId = typeof eventInput === 'string' ? eventInput : eventInput?.id;
    if (!eventId) throw new Error('Invalid event ID.');
    await apiRequest(`/api/events/${eventId}/attend`, { method: 'POST' });
    await refreshCreatedAndAttended();
  }, [uid, refreshCreatedAndAttended]);

  const leaveEvent = useCallback(async (eventId) => {
    if (!uid) throw new Error('You must be signed in.');
    if (!eventId) throw new Error('Invalid event ID.');
    await apiRequest(`/api/events/${eventId}/attend`, { method: 'DELETE' });
    await refreshCreatedAndAttended();
  }, [uid, refreshCreatedAndAttended]);

  const followOrganizer = useCallback(async (organizerInput) => {
    if (!uid) throw new Error('You must be signed in.');
    const organizerId =
      typeof organizerInput === 'string'
        ? organizerInput
        : organizerInput?.id || organizerInput?.organizerId || '';
    if (!organizerId) throw new Error('Invalid organizer.');
    await apiRequest(`/api/users/me/following/${organizerId}`, { method: 'POST' });
    await refreshFollows();
  }, [uid, refreshFollows]);

  const unfollowOrganizer = useCallback(async (organizerId) => {
    if (!uid) throw new Error('You must be signed in.');
    if (!organizerId) throw new Error('Invalid organizer.');
    await apiRequest(`/api/users/me/following/${organizerId}`, { method: 'DELETE' });
    await refreshFollows();
  }, [uid, refreshFollows]);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      apiInitError,
      isLoggedIn: !!user,
      isAdmin: !!user?.isAdmin || adminEmails.includes(String(user?.email || '').toLowerCase()),
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
      apiInitError,
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
