import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Auth.css';

export default function SignUp() {
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>
      <Navbar />
      <main className="auth-main">
        <div className="auth-card glass-strong">
          <h1>Create account</h1>
          <p className="auth-subtitle">Join to discover and host local events.</p>
          <form className="auth-form">
            <div className="input-wrap">
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div className="input-wrap">
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" className="input" placeholder="••••••••" required />
            </div>
            <div className="input-wrap">
              <label htmlFor="signup-confirm">Confirm password</label>
              <input id="signup-confirm" type="password" className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Sign up
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
