import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Silk from './components/Silk';
import './App.css';
import { firebaseInitError } from './lib/firebase';

const Landing = lazy(() => import('./pages/Landing'));
const EventsList = lazy(() => import('./pages/EventsList'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const AIChatWidget = lazy(() => import('./components/AIChatWidget'));

function RouteFallback() {
  return <div className="route-suspense-fallback" aria-hidden />;
}

/** Loads chat after first paint / idle so it does not compete with the initial route chunk. */
function DeferredAIChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) setReady(true);
    };
    if (typeof window === 'undefined') {
      run();
      return undefined;
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(run, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <AIChatWidget />
    </Suspense>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <div className="silk-background">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="app-content">
        {firebaseInitError ? (
          <div className="firebase-config-banner" role="status">
            Firebase is not configured: {firebaseInitError.message}
          </div>
        ) : null}
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/events" element={<EventsList />} />
              <Route path="/events/new" element={<CreateEvent />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <DeferredAIChat />
      </div>
    </div>
  );
}
