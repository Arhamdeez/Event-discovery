import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Auth.css';

export default function Login() {
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>
      <Navbar />
      <main className="auth-main">
        <div className="auth-card glass-strong">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your events and RSVPs.</p>
          <form className="auth-form">
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
      </main>
      <Footer />
    </div>
  );
}
