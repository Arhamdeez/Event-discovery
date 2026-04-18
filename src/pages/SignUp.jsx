import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './Auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  const { signup, isLoggedIn, authLoading } = useAuth();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = e.target;
    const email = form.querySelector('#signup-email').value.trim();
    const password = form.querySelector('#signup-password').value;
    const confirm = form.querySelector('#signup-confirm').value;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!email) return;
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-page">
        <Navbar />
        <main className="auth-main">
          <p className="auth-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

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
            <h1>Create account</h1>
            <p className="auth-subtitle">Join to discover and host local events.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              <div className="input-wrap">
                <label htmlFor="signup-email">Email</label>
                <input id="signup-email" type="email" className="input" placeholder="you@example.com" required />
              </div>
              <div className="input-wrap">
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" type="password" className="input" placeholder="••••••••" minLength={6} required />
              </div>
              <div className="input-wrap">
                <label htmlFor="signup-confirm">Confirm password</label>
                <input id="signup-confirm" type="password" className="input" placeholder="••••••••" minLength={6} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Creating account…' : 'Sign up'}
              </button>
            </form>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </GlassSurface>
      </main>
      <Footer />
    </div>
  );
}
