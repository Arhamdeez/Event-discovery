import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('#login-email').value.trim();
    if (email) {
      login(email);
      navigate('/dashboard', { replace: true });
    }
  };

  if (isLoggedIn) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>
      <Navbar />
      <main className="auth-main">
        <GlassSurface
          className="auth-card"
          borderRadius={32}
          width="100%"
          backgroundOpacity={0.08}
          saturation={1.5}
          displace={0.5}
          style={{ maxWidth: 420, height: 'auto' }}
        >
          <div className="auth-card-inner">
            <h1>Welcome back</h1>
            <p className="auth-subtitle">Sign in to manage your events and RSVPs.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-wrap">
                <label htmlFor="login-email">Email</label>
                <input id="login-email" type="email" className="input" placeholder="you@example.com" required />
              </div>
              <div className="input-wrap">
                <label htmlFor="login-password">Password</label>
                <input id="login-password" type="password" className="input" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Sign in
              </button>
            </form>
            <p className="auth-footer">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </GlassSurface>
      </main>
      <Footer />
    </div>
  );
}
