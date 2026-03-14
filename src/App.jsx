import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import EventsList from './pages/EventsList';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
