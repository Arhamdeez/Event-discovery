import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import EventsList from './pages/EventsList';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Silk from './components/Silk';
import './App.css';
import AIChatWidget from './components/AIChatWidget';

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
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/events" element={<EventsList />} />
            <Route path="/events/new" element={<CreateEvent />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
        <AIChatWidget />
      </div>
    </div>
  );
}
