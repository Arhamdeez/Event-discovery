import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlassSurface from '../components/GlassSurface';
import './Auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  const { signup, isLoggedIn } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = e.target.querySelector('#signup-email').value.trim();
    const password = e.target.querySelector('#signup-password').value;
    const confirm = e.target.querySelector('#signup-confirm').value;
    if (email && password && password === confirm) {
      signup(email);
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
            <h1>Create account</h1>
            <p className="auth-subtitle">Join to discover and host local events.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
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
        </GlassSurface>
      </main>
      <Footer />
    </div>
  );
}
